# Compliance Airtable Table Provisioning

This guide provisions the 4 required compliance tables used by the persistence adapter.

## Required env

- `AIRTABLE_PAT`
- `COMPLIANCE_BASE_ID` (preferred) or `AIRTABLE_BASE_ID`

## 1) Check current state

```bash
node scripts/compliance/provision-tables.mjs --check
```

## 2) Create missing tables

```bash
node scripts/compliance/provision-tables.mjs --apply
```

If metadata write scope is unavailable, the script will stop and tell you to create tables manually.

## 3) Verify readiness

```bash
node scripts/compliance/check-persistence-ready.mjs
```

## 4) Enable dual-write persistence in production

Set:

- `COMPLIANCE_PERSISTENCE_ENABLED=1`

Then redeploy.

## Required tables

- `PHI Access Log`
- `HIPAA Breaches`
- `BAAs`
- `HIPAA Training`

Field-level schema source of truth:

- `src/lib/compliance/persistence.ts`
