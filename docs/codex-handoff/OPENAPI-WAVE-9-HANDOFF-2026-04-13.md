# OpenAPI Wave 9 Handoff (2026-04-13)

## What shipped in this wave

Wave 9 adds 13 high-value paths to `openapi.yaml`, covering all `dashboard/entry/*` mutation routes plus the remaining client intelligence subroutes.

## Paths added

1. `POST /api/dashboard/entry/ceo-note`
2. `POST /api/dashboard/entry/consult-notes`
3. `POST /api/dashboard/entry/eod-recap`
4. `POST /api/dashboard/entry/expense`
5. `POST /api/dashboard/entry/inventory`
6. `POST /api/dashboard/entry/lead`
7. `POST /api/dashboard/entry/review`
8. `POST /api/dashboard/entry/room-issue`
9. `POST /api/dashboard/entry/sale`
10. `POST /api/dashboard/entry/staff-note`
11. `GET /api/dashboard/clients/{id}/churn`
12. `GET /api/dashboard/clients/{id}/recommend`
13. `GET /api/dashboard/clients/at-risk`

## Notes

- Method signatures were taken directly from live handlers before writing spec entries.
- Added path-parameter forms for dynamic client routes (`{id}`).
- All routes are documented with session auth expectations and conservative gate-level responses.

## Suggested next wave (Wave 10)

Prioritize remaining large families:

1. `mastermind/*` core routes (`scan`, `plan`, `simulate`, `sessions`, `share`, `consent`, `follow-up`, etc.)
2. `patient/*` non-auth routes (`appointments`, `plan`, `membership`, `treatments`, `loyalty`, `referrals`)
3. remaining dashboard gaps (`pricing`, `phone-agent`, `inventory`, `social`, `kpis`, `finance/pnl`, agents routes)

## Paste-ready update for Claude

```text
Wave 9 OpenAPI is done.

Added 13 paths in openapi.yaml:
- POST /api/dashboard/entry/ceo-note
- POST /api/dashboard/entry/consult-notes
- POST /api/dashboard/entry/eod-recap
- POST /api/dashboard/entry/expense
- POST /api/dashboard/entry/inventory
- POST /api/dashboard/entry/lead
- POST /api/dashboard/entry/review
- POST /api/dashboard/entry/room-issue
- POST /api/dashboard/entry/sale
- POST /api/dashboard/entry/staff-note
- GET /api/dashboard/clients/{id}/churn
- GET /api/dashboard/clients/{id}/recommend
- GET /api/dashboard/clients/at-risk

Handoff doc: docs/codex-handoff/OPENAPI-WAVE-9-HANDOFF-2026-04-13.md

OpenAPI-only scope; no app logic changes in this wave.
```
