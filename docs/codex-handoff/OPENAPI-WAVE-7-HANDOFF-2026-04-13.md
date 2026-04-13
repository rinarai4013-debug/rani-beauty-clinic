# OpenAPI Wave 7 Handoff (2026-04-13)

## What shipped in this wave

Wave 7 extends `openapi.yaml` with 6 additional high-priority routes focused on AI and dashboard growth ops surfaces.

## Paths added

1. `POST /api/ai/chat`
2. `POST /api/ai/intake`
3. `POST /api/ai/recommend`
4. `GET /api/dashboard/briefing`
5. `GET /api/dashboard/marketing`
6. `GET /api/dashboard/reactivation`

## Notes

- Kept this wave OpenAPI-only (no app logic edits).
- Used route method signatures from live handlers (`POST` for AI routes, `GET` for dashboard growth ops).
- Added conservative response sets for gate-level behavior (`400/401/403/429/500` where relevant).

## Suggested next wave (Wave 8)

Focus remaining spec-vs-route gaps in this order:

1. compliance endpoints not yet represented
2. dashboard agents/communications subroutes not yet represented
3. remaining patient/public utility endpoints to close toward 100% route documentation coverage

## Paste-ready update for Claude

```text
Wave 7 OpenAPI is done.

Added 6 paths in openapi.yaml:
- POST /api/ai/chat
- POST /api/ai/intake
- POST /api/ai/recommend
- GET /api/dashboard/briefing
- GET /api/dashboard/marketing
- GET /api/dashboard/reactivation

Handoff doc: docs/codex-handoff/OPENAPI-WAVE-7-HANDOFF-2026-04-13.md

OpenAPI-only scope; no app logic changes in this wave.
```
