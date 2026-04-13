# Wave 10 — Communications Preferences Formula Hardening

## Why this matters
`GET /api/dashboard/communications/preferences` accepted `?clientId=` and interpolated it directly into Airtable `filterByFormula` using single-quoted string literals.

That pattern is the same risk class as the earlier formula-injection P0.

## Changes made

### 1) Route hardening
File: `src/app/api/dashboard/communications/preferences/route.ts`

- Added import of `sanitizeFormulaValue` from `@/lib/airtable/sanitize`.
- Replaced direct interpolation with sanitized, double-quoted formula literal:

```ts
const filter = clientId
  ? `RECORD_ID() = "${sanitizeFormulaValue(clientId)}"`
  : '';
```

This closes the quote-breaking injection vector for `clientId` payloads containing `'`.

### 2) Regression test
File: `src/app/api/__tests__/dashboard-communications-planbuilder.test.ts`

- Added test:
  - `GET /api/dashboard/communications/preferences sanitizes clientId before Airtable filter construction`
- Sends malicious query payload:
  - `clientId=rec_client_1' OR TRUE() OR '`
- Asserts the route still returns `200` and that `fetchAll` receives a sanitized formula string.

## Validation

```bash
npx vitest run src/app/api/__tests__/dashboard-communications-planbuilder.test.ts
```

Result: **23 passed, 0 failed**

