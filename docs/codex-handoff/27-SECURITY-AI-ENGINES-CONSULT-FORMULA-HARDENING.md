# Wave 13 — AI Engines Consult Briefing Formula Hardening

## Scope
Hardened one additional user-controlled formula path in tenant dashboard AI engine logic.

## Change made

### `src/lib/saas/tenant-dashboard/ai-engines.ts`
- Added import:
  - `sanitizeFormulaValue` from `@/lib/airtable/sanitize`
- In `getConsultBriefing(...)`:
  - sanitize `clientId` before Airtable `RECORD_ID()` lookup
  - updated formula to use sanitized value

From:
```ts
filterByFormula: `RECORD_ID() = '${clientId}'`
```

To:
```ts
const safeClientId = sanitizeFormulaValue(clientId);
filterByFormula: `RECORD_ID() = '${safeClientId}'`
```

## Regression test added

### `src/lib/saas/tenant-dashboard/__tests__/ai-engines.test.ts`
- Added test:
  - `should sanitize clientId before Airtable RECORD_ID formula lookup`
- Uses malicious input:
  - `c1' OR TRUE() OR '`
- Asserts `db.fetchAll('Clients', { filterByFormula: ... })` receives sanitized formula value.

## Validation

```bash
npx vitest run src/lib/saas/tenant-dashboard/__tests__/ai-engines.test.ts
```

Result: **30 passed, 0 failed**

