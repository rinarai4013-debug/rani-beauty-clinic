# OpenAPI Wave 3 Handoff — 2026-04-13

## Codex changes

1. Expanded `openapi.yaml` with the next dashboard-critical route contracts.
2. Added new request/response schemas for consult, leads, clients, communications preferences, and plan-builder operations.

## New route paths documented in this wave

- `/api/dashboard/communications/preferences` (GET)
- `/api/dashboard/clients` (GET)
- `/api/dashboard/consult` (GET, POST)
- `/api/dashboard/consultations` (GET)
- `/api/dashboard/leads` (GET)
- `/api/dashboard/leads/stats` (GET)
- `/api/dashboard/plan-builder` (GET, POST, PATCH, DELETE)
- `/api/dashboard/plan-builder/send` (POST)
- `/api/dashboard/plan-builder/export-pdf` (POST)

## OpenAPI coverage snapshot

- Total documented API paths in `openapi.yaml`: **25**
- Prior wave: **16**
- Net gain this wave: **+9 paths**

## Important implementation notes

- Contracts are mapped from current live handlers.
- `plan-builder` GET supports both list and single-record response shapes (`PlanBuilderGetResponse` is `oneOf`).
- `communications/preferences` supports both single-client and list modes in one schema (`CommunicationsPreferencesResponse`).
- `consultations` uses the `apiSuccess` envelope (`success + data`).

## Next actions for Claude

1. Open PR for this wave (single-file change: `openapi.yaml`).
2. Let CI run `OpenAPI` job.
3. After merge, keep Wave 4 focused on remaining high-value surfaces:
   - `/api/dashboard/providers`
   - `/api/dashboard/providers/[name]`
   - `/api/dashboard/revenue*`
   - `/api/dashboard/schedule*`
   - `/api/dashboard/meta-ads*`

## Copy-paste brief

```text
Codex shipped OpenAPI wave 3.

Changed file:
- openapi.yaml

Added route contracts:
- /api/dashboard/communications/preferences (GET)
- /api/dashboard/clients (GET)
- /api/dashboard/consult (GET, POST)
- /api/dashboard/consultations (GET)
- /api/dashboard/leads (GET)
- /api/dashboard/leads/stats (GET)
- /api/dashboard/plan-builder (GET, POST, PATCH, DELETE)
- /api/dashboard/plan-builder/send (POST)
- /api/dashboard/plan-builder/export-pdf (POST)

Coverage:
- openapi.yaml now documents 25 API paths (up from 16).

Please open PR for this wave and run CI. Next target is OpenAPI wave 4 on providers/revenue/schedule/meta-ads surfaces.
```
