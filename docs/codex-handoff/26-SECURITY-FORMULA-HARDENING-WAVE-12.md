# Wave 12 — Formula Hardening (Tenant Dashboard Clients + Cherry Webhook)

## Scope
Third security hardening pass focused on Airtable `filterByFormula` inputs sourced from user/session/webhook data.

## Changes shipped

### 1) Tenant dashboard client 360 formula safety
File: `src/lib/saas/tenant-dashboard/clients.ts`

- Added `sanitizeFormulaValue` usage for:
  - `clientId` lookup (`RECORD_ID()` filter)
  - all `{Client Email}` filters used for related table fan-out:
    - Appointments
    - Transactions
    - Messages Log
    - Reviews
    - Memberships

This prevents quote/control character breakouts in formula strings and stabilizes lookups for edge-case identifiers/emails.

### 2) Cherry webhook checkout lookup safety
File: `src/app/api/webhooks/cherry/route.ts`

- Replaced manual quote escaping with shared sanitizer:
  - `safeCustomerId = sanitizeFormulaValue(customerId)`
- Uses sanitized value in treatment-plan lookup formula for `checkout.completed`.

## Regression tests added/updated

### `src/lib/saas/tenant-dashboard/__tests__/clients.test.ts`
- Added test: `should sanitize client id and email in Airtable filter formulas`
- Verifies sanitized formula usage for client ID and all 5 related email queries.

### `src/app/api/__tests__/webhooks.test.ts`
- Added Cherry checkout regression:
  - `should sanitize customerId before treatment plan lookup formula on checkout.completed`
- Introduced `mockFetchFirst` to assert formula argument directly.
- Updated test sanitizer mock to match real sanitizer behavior.

## Validation

```bash
npx vitest run \
  src/app/api/__tests__/webhooks.test.ts \
  src/lib/tenant/__tests__/airtable-tenant-store-sanitize.test.ts \
  src/lib/saas/tenant-dashboard/__tests__/clients.test.ts \
  src/app/api/__tests__/patient-portal-critical-routes.test.ts \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts
```

Result: **87 passed, 0 failed**

