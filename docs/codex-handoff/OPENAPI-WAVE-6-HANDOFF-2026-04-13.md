# OpenAPI Wave 6 Handoff (2026-04-13)

## What shipped in this wave

Wave 6 extends `openapi.yaml` with 10 previously undocumented routes, focused on public intake/template flows, patient profile, cron endpoints, and communications dashboard.

## Paths added

1. `POST /api/photo/upload`
2. `POST /api/simulation/generate`
3. `POST /api/templates/post-treatment`
4. `POST /api/templates/pre-consult`
5. `POST /api/templates/reactivation`
6. `GET /api/patient/profile`
7. `GET /api/cron/daily-briefing`
8. `GET /api/cron/daily-kpi`
9. `GET /api/cron/plan-followups`
10. `GET /api/dashboard/communications`

## Notes

- Inserted directly before `components:` in `openapi.yaml` to avoid merge-context drift.
- Kept schema level intentionally conservative for this wave (operationIds, tags, core responses) to avoid endpoint contract drift.
- No business logic files were changed.

## Suggested next wave (Wave 7)

Target remaining high-value undocumented families in this order:

1. `ai/*` real handlers (`/ai/chat`, `/ai/intake`, `/ai/recommend`)
2. dashboard growth ops remaining gaps (`/dashboard/briefing`, `/dashboard/marketing`, `/dashboard/reactivation` if absent)
3. compliance endpoints and any route still missing from spec-vs-route map

## Paste-ready update for Claude

```text
Wave 6 OpenAPI is done on my side.

Added 10 paths in openapi.yaml:
- POST /api/photo/upload
- POST /api/simulation/generate
- POST /api/templates/post-treatment
- POST /api/templates/pre-consult
- POST /api/templates/reactivation
- GET /api/patient/profile
- GET /api/cron/daily-briefing
- GET /api/cron/daily-kpi
- GET /api/cron/plan-followups
- GET /api/dashboard/communications

Handoff doc: docs/codex-handoff/OPENAPI-WAVE-6-HANDOFF-2026-04-13.md

No app logic changed in this wave; OpenAPI-only scope.
```
