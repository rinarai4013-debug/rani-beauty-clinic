# OpenAPI Wave 8 Handoff (2026-04-13)

## What shipped in this wave

Wave 8 adds 10 more missing API paths to `openapi.yaml` across auth, contact/public mutation, compliance, plan tracking, Meta CAPI webhook, and client detail.

## Paths added

1. `POST /api/contact`
2. `POST + GET /api/dashboard/auth/login`
3. `POST + GET /api/dashboard/auth/logout`
4. `GET /api/dashboard/auth/me`
5. `GET /api/dashboard/alerts`
6. `GET /api/dashboard/compliance`
7. `GET /api/dashboard/clients/{id}`
8. `GET /api/plan/{id}`
9. `POST /api/plan/{id}/track`
10. `POST /api/webhooks/meta-capi`

## Notes

- Method signatures were taken from live handlers (`export async function ...`) before adding specs.
- Added path-parameter variants using OpenAPI templating (`{id}`) for dynamic routes.
- Kept response modeling conservative and gate-focused for safe incremental coverage.

## Suggested next wave (Wave 9)

Close remaining high-value gaps next:

1. dashboard entry mutation routes (`/dashboard/entry/*`)
2. mastermind core routes not yet modeled (`/mastermind/*`)
3. patient non-auth surface (`/patient/*`) and dashboard clients subroutes (`/clients/{id}/churn`, `/clients/{id}/recommend`, `/clients/at-risk`)

## Paste-ready update for Claude

```text
Wave 8 OpenAPI is done.

Added 10 paths in openapi.yaml:
- POST /api/contact
- POST+GET /api/dashboard/auth/login
- POST+GET /api/dashboard/auth/logout
- GET /api/dashboard/auth/me
- GET /api/dashboard/alerts
- GET /api/dashboard/compliance
- GET /api/dashboard/clients/{id}
- GET /api/plan/{id}
- POST /api/plan/{id}/track
- POST /api/webhooks/meta-capi

Handoff doc: docs/codex-handoff/OPENAPI-WAVE-8-HANDOFF-2026-04-13.md

OpenAPI-only scope; no app logic changes in this wave.
```
