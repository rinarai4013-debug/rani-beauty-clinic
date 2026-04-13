# Wave 11 — Tenant Resolver + Patient Plan Formula Hardening

## Scope
Second security hardening pass focused on user-controlled formula inputs in tenant and patient lookup paths.

## Changes

### 1) Tenant resolver Airtable formula sanitization
File: `src/lib/tenant/resolver.ts`

Updated `AirtableTenantStore` lookups to sanitize formula inputs:
- `getById(id)` -> sanitizes `id`
- `getBySlug(slug)` -> sanitizes `slug`
- `getByCustomDomain(domain)` -> sanitizes `domain`
- `update(id, ...)` lookup -> sanitizes `id`
- `delete(id)` lookup -> sanitizes `id`

All formulas now use sanitized values before interpolation.

### 2) Patient plan lookup formula hardening
File: `src/app/api/patient/plan/route.ts`

The active-plan lookup formula now uses a sanitized, double-quoted client name comparison:

```ts
AND({Client Name} = "${safeName}", {Status} != 'Archived')
```

This removes quote-breaking risk for patient names containing apostrophes/special chars.

## New tests

### Tenant Airtable store sanitization tests
File: `src/lib/tenant/__tests__/airtable-tenant-store-sanitize.test.ts`
- verifies sanitized filter formula for:
  - `getById`
  - `getBySlug`
  - `getByCustomDomain`

### Patient plan sanitization regression test
File: `src/app/api/__tests__/patient-portal-critical-routes.test.ts`
- added:
  - `GET /api/patient/plan sanitizes patient name before Airtable filter formula`

## Validation run

```bash
npx vitest run \
  src/app/api/__tests__/patient-portal-critical-routes.test.ts \
  src/lib/tenant/__tests__/airtable-tenant-store-sanitize.test.ts \
  src/app/api/__tests__/dashboard-communications-planbuilder.test.ts
```

Result: **33 passed, 0 failed**

