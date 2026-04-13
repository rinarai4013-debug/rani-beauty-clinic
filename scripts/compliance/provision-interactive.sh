#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${AIRTABLE_BASE_ID:-}" ]]; then
  export AIRTABLE_BASE_ID="app1SwhSfwe8GKUg4"
fi

if [[ -z "${AIRTABLE_PAT:-}" ]]; then
  echo -n "Paste Airtable PAT, then press Enter: "
  IFS= read -r -s AIRTABLE_PAT
  echo
  export AIRTABLE_PAT
fi

if [[ -z "${AIRTABLE_PAT:-}" ]]; then
  echo "❌ AIRTABLE_PAT is empty. Aborting."
  exit 1
fi

echo "PAT length: ${#AIRTABLE_PAT}"
echo "Base: $AIRTABLE_BASE_ID"

echo
echo "1) Checking current table state..."
node scripts/compliance/provision-tables.mjs --check || true

echo
echo "2) Applying missing tables..."
node scripts/compliance/provision-tables.mjs --apply

echo
echo "3) Verifying persistence readiness..."
node scripts/compliance/check-persistence-ready.mjs

echo
echo "✅ Compliance provisioning flow complete."
echo "Next: set COMPLIANCE_PERSISTENCE_ENABLED=1 in Vercel production, then redeploy."
