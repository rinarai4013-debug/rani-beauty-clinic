#!/usr/bin/env bash
#
# tools/env-audit.sh
#
# Verifies that every env var required for production is actually set
# in Vercel's production environment. Reads a canonical list of required
# vars from this file and cross-checks against `vercel env ls`.
#
# Why: the route auth audit identified that webhook routes will silently
# 503 if their signing secrets are missing, and several PHI-touching
# routes will fail closed if their JWT secrets rotate out. This script
# makes those gaps visible BEFORE a customer hits the endpoint.
#
# USAGE
#
#     # From the rani-beauty-clinic project root:
#     ./tools/env-audit.sh
#
#     # Audit a specific Vercel environment:
#     ./tools/env-audit.sh preview
#     ./tools/env-audit.sh development
#     ./tools/env-audit.sh production   # default
#
# REQUIREMENTS
#   - Vercel CLI installed: https://vercel.com/docs/cli
#   - Logged in: vercel login
#   - Project linked: vercel link (must be run from this directory)
#
# EXIT CODES
#   0  all required vars are set
#   1  one or more required vars are missing (CI-friendly)
#   2  vercel CLI not installed or not logged in
#   3  project not linked (run `vercel link`)

set -euo pipefail

VERCEL_ENV="${1:-production}"

# ─── Required vars ──────────────────────────────────────────────────
#
# Categorized by severity. Missing CRITICAL vars cause customer-facing
# failures. Missing HIGH vars cause silent skip of side effects
# (analytics, email notifications) but not failures. Missing MEDIUM
# vars disable specific features but don't crash the app.
#
# Keep this list in sync with:
#   - docs/codex-handoff/ROUTE-AUTH-AUDIT.md (auth primitives reference)
#   - docs/compliance/AUDIT-RUNBOOK.md (BAA inventory)
#   - CLAUDE.md (environment variables section)

CRITICAL_VARS=(
  # Auth — every dashboard + patient portal route depends on these
  "DASHBOARD_JWT_SECRET"
  "PATIENT_JWT_SECRET"
  "DASHBOARD_USERS"

  # Airtable — the database. No Airtable = no app.
  "AIRTABLE_PAT"
  "AIRTABLE_BASE_ID"

  # Webhook signing secrets — routes hard-503 if missing (except
  # META_CAPI which currently fails OPEN — see Route Auth Audit P1)
  "MANGOMINT_WEBHOOK_SECRET"
  "STRIPE_WEBHOOK_SECRET"
  "CHERRY_WEBHOOK_SECRET"
  "META_CAPI_WEBHOOK_SECRET"
  "META_CAPI_ACCESS_TOKEN"

  # Service-to-service secrets
  "N8N_API_KEY"
  "CRON_SECRET"
)

HIGH_VARS=(
  # AI — every AI-powered feature degrades without these
  "ANTHROPIC_API_KEY"

  # Email — contact form + template routes
  "RESEND_API_KEY"
  "CONTACT_EMAIL"
  "FROM_EMAIL"

  # n8n automation
  "N8N_WEBHOOK_URL"

  # Meta ads
  "META_ACCESS_TOKEN"
  "META_AD_ACCOUNT_ID"

  # RAG / knowledge base
  "PINECONE_API_KEY"

  # Vapi phone agent
  "VAPI_API_KEY"
  "VAPI_ASSISTANT_ID"
)

MEDIUM_VARS=(
  # Observability — nice to have, not critical
  "SENTRY_DSN"
  "NEXT_PUBLIC_SENTRY_DSN"

  # Analytics
  "NEXT_PUBLIC_SITE_URL"
)

# ─── Prerequisite checks ────────────────────────────────────────────

if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not installed."
  echo ""
  echo "Install with:"
  echo "  brew install vercel"
  echo "  # or"
  echo "  npm install -g vercel"
  echo ""
  echo "Then run: vercel login"
  exit 2
fi

if [[ ! -f ".vercel/project.json" ]]; then
  echo "❌ Project not linked to Vercel."
  echo ""
  echo "Run:"
  echo "  cd $(pwd)"
  echo "  vercel link"
  echo ""
  exit 3
fi

# ─── Fetch the current env ──────────────────────────────────────────

echo "── Fetching env vars for Vercel environment: ${VERCEL_ENV} ──"

# `vercel env ls` outputs lines like:
#   <var-name>                      Encrypted           <env-list>          <timestamp>
# We parse the first column to get the set of defined var names.
#
# The `2>/dev/null` suppresses the header banner; we filter empty lines
# and comments with awk.

set +e
VERCEL_ENV_OUTPUT=$(vercel env ls "${VERCEL_ENV}" 2>&1)
VERCEL_EXIT=$?
set -e

if [[ $VERCEL_EXIT -ne 0 ]]; then
  echo "❌ vercel env ls failed:"
  echo "$VERCEL_ENV_OUTPUT"
  echo ""
  echo "If you see 'not logged in', run: vercel login"
  echo "If you see 'project not found', run: vercel link"
  exit 2
fi

# Extract the set var names. Vercel CLI 50.x renders each var on a
# line that starts with ONE LEADING SPACE followed by the var name.
# We match lines that look like " VAR_NAME Encrypted ..." and print
# the first non-whitespace token.
DEFINED_VARS=$(echo "$VERCEL_ENV_OUTPUT" | awk '
  # Skip empty / header / banner lines
  /^[[:space:]]*$/ { next }
  /^>/ { next }
  /^Vercel CLI/ { next }
  /^Retrieving/ { next }
  /^No Environment Variables found/ { next }
  # Skip column header line: " name ... value ... environments ..."
  /^[[:space:]]+name[[:space:]]+value/ { next }
  # Match " VARNAME Encrypted <env-list> <timestamp>" format
  /^[[:space:]]+[A-Z][A-Z0-9_]*[[:space:]]+(Encrypted|Decrypted)/ { print $1 }
  # Fallback: match lines where the first token is an all-caps var name
  # (handles future Vercel CLI output format drift)
  /^[[:space:]]+[A-Z][A-Z0-9_]+[[:space:]]/ {
    if ($1 ~ /^[A-Z][A-Z0-9_]+$/) print $1
  }
' | sort -u)

if [[ -z "$DEFINED_VARS" ]]; then
  echo "⚠ No env vars were found. Either the environment is empty or the"
  echo "   output format of vercel env ls has changed. Raw output:"
  echo "─────────────────────────────────────────────"
  echo "$VERCEL_ENV_OUTPUT"
  echo "─────────────────────────────────────────────"
  echo ""
  echo "If the output above clearly shows vars, the awk parser needs an"
  echo "update. Open a PR with the new format."
  exit 1
fi

# ─── Check each required var ────────────────────────────────────────

check_category() {
  local category="$1"
  shift
  local -a vars=("$@")
  local missing=0
  local found=0

  echo ""
  echo "── ${category} vars ──"
  for var in "${vars[@]}"; do
    if echo "$DEFINED_VARS" | grep -qx "$var"; then
      echo "  ✅ $var"
      found=$((found + 1))
    else
      echo "  ❌ $var  MISSING"
      missing=$((missing + 1))
    fi
  done
  echo "   → $found/$((found + missing)) set"
  return $missing
}

TOTAL_MISSING=0

check_category "CRITICAL" "${CRITICAL_VARS[@]}" || TOTAL_MISSING=$((TOTAL_MISSING + $?))
CRITICAL_MISSING=$TOTAL_MISSING

check_category "HIGH" "${HIGH_VARS[@]}" || TOTAL_MISSING=$((TOTAL_MISSING + $?))
HIGH_MISSING=$((TOTAL_MISSING - CRITICAL_MISSING))

check_category "MEDIUM" "${MEDIUM_VARS[@]}" || TOTAL_MISSING=$((TOTAL_MISSING + $?))
MEDIUM_MISSING=$((TOTAL_MISSING - CRITICAL_MISSING - HIGH_MISSING))

# ─── Detect undocumented vars (informational) ───────────────────────

echo ""
echo "── Documented vs. defined ──"
ALL_DOCUMENTED=$(printf '%s\n' "${CRITICAL_VARS[@]}" "${HIGH_VARS[@]}" "${MEDIUM_VARS[@]}" | sort -u)
UNDOCUMENTED=$(comm -23 <(echo "$DEFINED_VARS") <(echo "$ALL_DOCUMENTED") || true)
if [[ -n "$UNDOCUMENTED" ]]; then
  UNDOC_COUNT=$(echo "$UNDOCUMENTED" | wc -l | tr -d ' ')
  echo "  ℹ $UNDOC_COUNT vars defined but not documented in this script:"
  echo "$UNDOCUMENTED" | sed 's/^/    - /'
  echo ""
  echo "   These are not required per this audit, but consider adding them"
  echo "   to the CRITICAL / HIGH / MEDIUM arrays if they should be tracked."
else
  echo "  ✓ Every defined var is documented"
fi

# ─── Summary ────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Summary — ${VERCEL_ENV}"
echo "═══════════════════════════════════════════════════════════════"
echo "  CRITICAL missing: $CRITICAL_MISSING"
echo "  HIGH missing:     $HIGH_MISSING"
echo "  MEDIUM missing:   $MEDIUM_MISSING"
echo "  Total missing:    $TOTAL_MISSING"
echo ""

if [[ $CRITICAL_MISSING -gt 0 ]]; then
  echo "❌ FAIL — CRITICAL vars are missing. The app will not function correctly."
  echo "   Fix with: vercel env add <VAR_NAME> ${VERCEL_ENV}"
  exit 1
fi

if [[ $HIGH_MISSING -gt 0 ]]; then
  echo "⚠ WARN — HIGH vars missing. Some features will silently skip or degrade."
  echo "   Review the list above and add missing vars via: vercel env add"
  exit 1
fi

if [[ $MEDIUM_MISSING -gt 0 ]]; then
  echo "ℹ OK — all CRITICAL + HIGH vars set. $MEDIUM_MISSING MEDIUM vars missing (nice-to-have)."
  exit 0
fi

echo "✅ PASS — every documented var is set."
exit 0
