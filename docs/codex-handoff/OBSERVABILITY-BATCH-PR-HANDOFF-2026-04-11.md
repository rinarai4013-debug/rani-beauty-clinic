# Observability Batch PR Handoff (April 11, 2026)

## Scope shipped in this batch

### 1) `withSentry` route wrapping (no business-logic refactor)

- `src/app/api/cron/daily-briefing/route.ts`
- `src/app/api/cron/daily-kpi/route.ts`
- `src/app/api/cron/plan-followups/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/consultation/submit/route.ts`
- `src/app/api/webhooks/mangomint/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/tenant/revenue/route.ts`
- `src/app/api/tenant/schedule/route.ts`
- `src/app/api/dashboard/clients/route.ts`
- `src/app/api/dashboard/consult/route.ts`
- `src/app/api/dashboard/revenue/route.ts`
- `src/app/api/dashboard/communications/route.ts`
- `src/app/api/dashboard/communications/preferences/route.ts`
- `src/app/api/dashboard/communications/campaigns/route.ts`
- `src/app/api/dashboard/alerts/route.ts`
- `src/app/api/dashboard/auth/login/route.ts`
- `src/app/api/dashboard/auth/logout/route.ts`
- `src/app/api/dashboard/auth/me/route.ts`

### 2) Dependency governance

- Added `.github/dependabot.yml` with:
  - weekly npm updates
  - weekly GitHub Actions updates
  - grouped patch/minor updates
  - major-version ignore rules for `stripe`, `zod`, `plaid`

### 3) Test compatibility updates for new Sentry imports

- `src/app/api/__tests__/auth.test.ts`
- `src/app/api/__tests__/clients.test.ts`
- `src/app/api/__tests__/contact.test.ts`
- `src/app/api/__tests__/consultation-submit-route.test.ts`
- `src/app/api/__tests__/cron-routes.test.ts`
- `src/app/api/__tests__/dashboard-critical-auth.test.ts`
- `src/app/api/__tests__/intelligence.test.ts`
- `src/app/api/__tests__/kpis.test.ts`
- `src/app/api/__tests__/tenant-revenue-schedule-routes.test.ts`
- `src/app/api/__tests__/helpers.ts` (shared `mockCommonDeps` now exports `withSentry`)

### 4) Plan-builder integration depth expansion

- Extended `src/app/api/__tests__/dashboard-plan-builder-route.test.ts` with stronger
  side-effect assertions:
  - cache-hit path for single-plan lookup
  - list query contract (`Archived` filter + descending created-date sort)
  - cache set key/value checks for list and single-plan fetches
  - optional field mapping (`client`, `intakeRecordId`) on create
  - cache invalidation checks on create/update/archive
  - invalid PATCH payload rejection when `id` is missing

### 5) Additional high-risk auth/share route depth (new in this continuation)

- Extended `src/app/api/__tests__/patient-public-critical-routes.test.ts`:
  - malformed JSON body -> `400` on `POST /api/patient/auth/verify`
  - missing token payload -> `400`
  - client lookup miss -> `401`
  - downstream Airtable failure -> `500`

- Extended `src/app/api/__tests__/mastermind-sharing-routes.test.ts`:
  - invalid payload -> `400` on `POST /api/mastermind/plan-send`
  - missing session -> `404`
  - non-shareable phase without token -> `422`
  - expired share token rotates and persists new token
  - email delivery failure -> `502`

### 6) Additional completion + patient auth depth (latest wave)

- Extended `src/app/api/__tests__/mastermind-simulate-complete-copilot.test.ts`:
  - completion success path with `webhookStatus: skipped` when `N8N_WEBHOOK_URL` is missing
  - completion build failure (`buildCompletionResult` throws) -> `500` with surfaced error
  - completion outer catch path when session lookup throws -> `500`

- Extended `src/app/api/__tests__/patient-auth-magic-link-route.test.ts`:
  - normalized email is used for token generation and outbound delivery
  - default base URL fallback (`https://ranibeautyclinic.com`) is used when env base URL is unset

### 7) High-leverage test wave: scan/plan + consultations

- Extended `src/app/api/__tests__/mastermind-scan-plan-consent-followup.test.ts`:
  - `scan`: explicit AI mode path when `ANTHROPIC_API_KEY` is present (`source: ai`)
  - `scan`: AI error -> engine fallback (`source: engine-fallback`)
  - `scan`: Aura device path (`useAuraDevice=true`) with successful device import (`source: aura-device-ai`)
  - `scan`: outer crash fallback returns mock payload (`source: fallback`, `fallback: true`)
  - `plan`: explicit AI mode path when `ANTHROPIC_API_KEY` is present (`source: ai`)
  - `plan`: AI error -> engine fallback (`source: engine-fallback`)
  - `plan`: outer crash fallback returns mock payload (`source: fallback`, `fallback: true`)

- Extended `src/app/api/__tests__/dashboard-critical-auth.test.ts`:
  - consultations merge behavior across both source systems (`mastermind` + `intake_form`)
  - consultations graceful degradation when both source fetches fail (still `200`, empty list)

### 8) High-leverage test wave: plan-builder send/export + communications failures

- Extended `src/app/api/__tests__/dashboard-communications-planbuilder.test.ts`:
  - communications overview `500` path when analytics aggregation throws
  - plan-builder send malformed JSON path (`400`)
  - plan-builder send missing JWT secret path (`500`, no side effects)
  - plan-builder send email dispatch failure path (`500`)
  - plan-builder send Airtable update failure path (`500` after attempted send)
  - export-pdf unauthenticated path (`401`)
  - export-pdf request missing both `planData` and `planId` (`400`)
  - export-pdf `planId` lookup happy path (`200`, HTML returned)
  - export-pdf stored `Services Included` JSON parse failure path (`500`)

### 9) High-leverage test wave: communications preferences + campaigns resilience

- Extended `src/app/api/__tests__/dashboard-communications-planbuilder.test.ts`:
  - communications preferences unauthenticated path (`401`)
  - preferences unknown `clientId` returns `{ preferences: null, total: 0 }`
  - preferences cache-hit path skips Airtable fetch
  - preferences Airtable failure path (`500`)

- Extended `src/app/api/__tests__/dashboard-critical-auth.test.ts`:
  - campaigns GET permission enforcement (`403`)
  - campaigns GET failure path (`500`)
  - campaigns POST invalid body (`400`)
  - campaigns POST internal creation failure (`500`)

### 10) High-leverage test wave: alerts resilience + normalization

- Extended `src/app/api/__tests__/dashboard-leads-alerts-plan.test.ts`:
  - alerts unauthenticated path (`401`)
  - alerts executive-permission path (`403`)
  - alerts cache-hit path (returns cached payload, no Airtable call)
  - alerts severity normalization assertions (`urgent→critical`, `warning→high`, unknown→`low`)
  - alerts Airtable failure path (`500`)

### 11) High-leverage test wave: leads + lead stats resilience

- Extended `src/app/api/__tests__/dashboard-leads-alerts-plan.test.ts`:
  - leads permission enforcement (`403`)
  - leads cache-hit path (returns cached funnel payload, no Airtable calls)
  - leads Airtable failure path (`500`)
  - lead-stats unauthenticated path (`401`)
  - lead-stats cache-hit path (returns cached payload, no Airtable calls)
  - lead-stats downstream failure path (`500`)

### 12) High-leverage test wave: tenant revenue/schedule resilience

- Extended `src/app/api/__tests__/tenant-revenue-schedule-routes.test.ts`:
  - tenant revenue service failure path (`500`, middleware fallback response)
  - tenant schedule invalid-token path (`401`)
  - tenant schedule service failure path (`500`, middleware fallback response)

### 13) High-leverage test wave: webhook validation + resilience paths

- Extended `src/app/api/__tests__/webhooks.test.ts`:
  - Mangomint malformed-JSON path with valid signature (`400`)
  - Mangomint invalid-envelope path after signature verification (`422`)
  - Stripe missing-webhook-secret path (`400`) even when signature header exists
  - Stripe `checkout.session.expired` processing path (`200`, event acknowledged)

### 14) High-leverage test wave: cron resilience

- Extended `src/app/api/__tests__/cron-routes.test.ts`:
  - daily-kpi missing-secret path (`401`)
  - daily-briefing KPI-write failure path (`500`)
  - plan-followups treatment-plan fetch failure path (`500`)

### 15) High-leverage test wave: AI routes resilience

- Extended `src/app/api/__tests__/ai.test.ts`:
  - chat malformed JSON path (`400`)
  - chat direct rate-limit path (`429`)
  - chat Anthropic failure fallback path (`200`, `source: fallback`)
  - recommend malformed JSON path (`400`)
  - recommend direct rate-limit path (`429`)
  - recommend invalid Anthropic payload fallback path (`200`, `source: static`)
  - intake malformed JSON path (`400`)
  - intake direct rate-limit path (`429`)
  - intake Anthropic failure fallback path (`200`, `source: fallback`)

### 16) High-leverage test wave: growth-ops route resilience

- Extended `src/app/api/__tests__/dashboard-growth-ops-routes.test.ts`:
  - meta-ads upstream non-OK path (`502`) with API error propagation
  - meta-ads unexpected fetch throw path (`500`)
  - providers list upstream Airtable failure path (`500`)

## Validation run (completed)

### Targeted integration slice

Command:

```bash
npx vitest run \
  src/app/api/__tests__/auth.test.ts \
  src/app/api/__tests__/dashboard-critical-auth.test.ts \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts \
  src/app/api/__tests__/dashboard-leads-alerts-plan.test.ts \
  src/app/api/__tests__/webhooks.test.ts \
  src/app/api/__tests__/tenant-revenue-schedule-routes.test.ts \
  src/app/api/__tests__/clients.test.ts \
  src/app/api/__tests__/intelligence.test.ts \
  src/app/api/__tests__/kpis.test.ts \
  src/app/api/__tests__/patient-referrals-loyalty-consult.test.ts \
  src/app/api/__tests__/cron-routes.test.ts \
  src/app/api/__tests__/contact.test.ts \
  src/app/api/__tests__/consultation-submit-route.test.ts
```

Result:

- **Test Files:** `13 passed`
- **Tests:** `196 passed`, `0 failed`

### Typecheck

Command:

```bash
npm -s run typecheck
```

Result:

- **Clean (0 errors)**

### Additional depth validation

Command:

```bash
npx vitest run \
  src/app/api/__tests__/dashboard-plan-builder-route.test.ts \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts
```

Result:

- **Test Files:** `2 passed`
- **Tests:** `21 passed`, `0 failed`

## PR body template (copy/paste)

```md
## Summary

Observability hardening batch: wrapped 19 production API handlers with `withSentry` without changing route behavior, added Dependabot automation, and updated test mocks for compatibility.

## Route wrapping included

- cron: daily-briefing, daily-kpi, plan-followups
- public intake: contact, consultation/submit
- webhooks: mangomint, stripe
- tenant: revenue, schedule
- dashboard: clients, consult, revenue, communications, communications/preferences, communications/campaigns, alerts, auth/login, auth/logout, auth/me

## Dependency governance

- Added `.github/dependabot.yml` for weekly npm + GitHub Actions updates
- Grouped patch/minor updates
- Ignored major updates for `stripe`, `zod`, `plaid` (handled in dedicated migration PRs)

## Validation

- `npx vitest run ...` targeted suite → **196/196 passing**
- `npm -s run typecheck` → **clean**

## Notes

- Shared test helper `mockCommonDeps` now exports `withSentry` to prevent mock override failures.
- No route response contract changes intended in this PR.
```

## Suggested next wave (parallel-safe)

1. Integration-depth wave on remaining high-risk mutation paths:
   - `dashboard/communications/*`
   - `dashboard/plan-builder/*`
   - `mastermind/complete`
   - `mastermind/copilot`
   - `patient/auth/magic-link`
2. Compliance automation:
   - add `scripts/compliance/check-persistence-ready.mjs`
   - fail non-zero when required persistence env/table config is incomplete

## Validation note for this continuation

Local validation for the two newly extended test files is currently blocked in this shell due a
runner hang (Vitest process starts and remains idle). The exact command attempted:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/patient-public-critical-routes.test.ts \
  src/app/api/__tests__/mastermind-sharing-routes.test.ts
```

Please run the same command in the stable repo environment before merge to confirm green.

Additional follow-up command for the latest wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/mastermind-simulate-complete-copilot.test.ts \
  src/app/api/__tests__/patient-auth-magic-link-route.test.ts
```

Command for this new wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/mastermind-scan-plan-consent-followup.test.ts \
  src/app/api/__tests__/dashboard-critical-auth.test.ts
```

Command for plan-builder/communications wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts
```

Command for preferences/campaigns resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts \
  src/app/api/__tests__/dashboard-critical-auth.test.ts
```

Command for alerts resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/dashboard-leads-alerts-plan.test.ts
```

Command for leads resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/dashboard-leads-alerts-plan.test.ts
```

Command for tenant resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/tenant-revenue-schedule-routes.test.ts
```

Command for webhook resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/webhooks.test.ts
```

Command for cron resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/cron-routes.test.ts
```

Command for AI resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/ai.test.ts
```

Command for growth-ops resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/dashboard-growth-ops-routes.test.ts
```

Command for public-mutation depth wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/booking-route.test.ts \
  src/app/api/__tests__/subscribe-plan-track.test.ts \
  src/app/api/__tests__/consultation-submit-route.test.ts
```

Command for auth/profile resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/auth.test.ts \
  src/app/api/__tests__/patient-public-critical-routes.test.ts
```

Command for webhook + share-interest resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/webhooks.test.ts \
  src/app/api/__tests__/mastermind-sharing-routes.test.ts
```

Command for share-token patient payload edge wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/mastermind-session-detail-validate-share.test.ts
```

Command for ops/plaid resilience wave:

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/mastermind-pdf-aura-import-and-ops-routes.test.ts
```

Command for webhook security hardening wave (includes Cherry fail-closed):

```bash
CI=1 ./node_modules/.bin/vitest run \
  src/app/api/__tests__/webhooks.test.ts
```
