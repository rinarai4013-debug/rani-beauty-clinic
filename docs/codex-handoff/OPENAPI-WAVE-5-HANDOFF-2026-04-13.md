# OpenAPI Wave 5 Handoff — 2026-04-13

## Codex changes

Expanded `openapi.yaml` with medium-priority dashboard surfaces for operations and marketing.

## New route paths documented

- `/api/dashboard/kpis` (GET)
- `/api/dashboard/inventory` (GET)
- `/api/dashboard/social` (GET)
- `/api/dashboard/pricing` (GET)
- `/api/dashboard/marketing` (GET)
- `/api/dashboard/backlinks` (GET)
- `/api/dashboard/alerts` (GET)
- `/api/dashboard/phone-agent` (GET)

## Coverage snapshot

- `openapi.yaml` now documents **40** `/api` paths.

## Notes

- Contracts map current live handlers only (no behavior changes).
- These were modeled as broad payload objects (`additionalProperties: true`) to keep contract drift low while endpoint structures are still evolving rapidly.

## Next actions for Claude

1. Open PR for this wave (`openapi.yaml` only).
2. Let CI run including `OpenAPI`.
3. Continue Wave 6 with remaining low-risk/stub routes to push spec breadth toward full route-map parity.

## Copy-paste brief

```text
Codex shipped OpenAPI wave 5.

Changed:
- openapi.yaml

Added route contracts:
- /api/dashboard/kpis (GET)
- /api/dashboard/inventory (GET)
- /api/dashboard/social (GET)
- /api/dashboard/pricing (GET)
- /api/dashboard/marketing (GET)
- /api/dashboard/backlinks (GET)
- /api/dashboard/alerts (GET)
- /api/dashboard/phone-agent (GET)

OpenAPI coverage:
- 40 documented /api paths.

Please open PR and run CI.
```
