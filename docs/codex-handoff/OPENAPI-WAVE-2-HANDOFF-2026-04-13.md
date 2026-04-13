# OpenAPI Wave 2 Handoff — 2026-04-13

## Codex changes

1. Added new API contract baseline:
   - `openapi.yaml`
2. Added OpenAPI lint script:
   - `package.json` → `openapi:lint`
3. Added CI job:
   - `.github/workflows/ci.yml` → `OpenAPI` job (`npm run openapi:lint`)

## Route paths documented in this wave

- `/api/contact` (POST)
- `/api/subscribe` (POST)
- `/api/consultation/submit` (POST)
- `/api/booking/book` (GET, POST)
- `/api/dashboard/auth/login` (POST, GET method probe)
- `/api/dashboard/auth/logout` (POST, GET method probe)
- `/api/dashboard/auth/me` (GET)
- `/api/patient/auth/magic-link` (POST)
- `/api/patient/auth/verify` (POST)
- `/api/patient/auth/me` (GET)
- `/api/dashboard/communications/campaigns` (GET, POST)
- `/api/plan/{id}/track` (POST)
- `/api/webhooks/cherry` (POST)
- `/api/webhooks/mangomint` (POST)
- `/api/webhooks/stripe` (POST)
- `/api/webhooks/meta-capi` (POST)

## Next actions for Claude

1. Open PR with these files.
2. After CI turns green, add required branch-protection check:
   - `OpenAPI`
3. Continue Wave 3 by adding remaining high-value dashboard routes:
   - `/api/dashboard/clients`
   - `/api/dashboard/consult`
   - `/api/dashboard/consultations`
   - `/api/dashboard/plan-builder/*`
   - `/api/dashboard/communications/preferences`
   - `/api/dashboard/leads` and `/api/dashboard/leads/stats`

## Copy-paste brief

```text
Codex shipped OpenAPI wave 2.

Changed files:
- openapi.yaml (new)
- package.json (openapi:lint script)
- .github/workflows/ci.yml (new OpenAPI CI job)

Documented route paths (16):
contact, subscribe, consultation submit, booking, dashboard auth (login/logout/me),
patient auth (magic-link/verify/me), communications campaigns, plan track,
and 4 webhook ingresses (cherry/mangomint/stripe/meta-capi).

Please PR this wave, let CI run, then add `OpenAPI` as required check in branch protection.
Next wave target: clients + consult + consultations + plan-builder + leads surfaces.
```
