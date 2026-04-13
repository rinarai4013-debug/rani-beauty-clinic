# OpenAPI Wave 4 Handoff — 2026-04-13

## Codex changes

Expanded `openapi.yaml` for the remaining high-value dashboard surfaces in this wave.

## New route paths documented

- `/api/dashboard/providers` (GET)
- `/api/dashboard/providers/{name}` (GET)
- `/api/dashboard/revenue` (GET)
- `/api/dashboard/revenue/anomalies` (GET)
- `/api/dashboard/revenue/trends` (GET)
- `/api/dashboard/revenue-optimizer` (GET)
- `/api/dashboard/meta-ads` (GET)
- `/api/dashboard/meta-ads/optimize` (GET)

## New schemas added

- `ProvidersSummaryResponse`
- `ProviderDetailResponse`
- `RevenueResponse`
- `RevenueAnomaliesResponse`
- `RevenueTrendsResponse`
- `RevenueOptimizerResponse`
- `MetaAdsResponse`
- `MetaAdsOptimizeResponse`

## Coverage snapshot

- `openapi.yaml` path count is now **39** (`/api/*` paths).

## Next actions for Claude

1. Open PR with this wave (`openapi.yaml` only).
2. Let CI run `OpenAPI` gate.
3. If clean, continue Wave 5 on remaining low/medium-risk dashboard routes (inventory, social, pricing, kpis, marketing, backlinks, alerts, phone-agent).

## Copy-paste brief

```text
Codex shipped OpenAPI wave 4.

Changed:
- openapi.yaml

Added route contracts:
- /api/dashboard/providers (GET)
- /api/dashboard/providers/{name} (GET)
- /api/dashboard/revenue (GET)
- /api/dashboard/revenue/anomalies (GET)
- /api/dashboard/revenue/trends (GET)
- /api/dashboard/revenue-optimizer (GET)
- /api/dashboard/meta-ads (GET)
- /api/dashboard/meta-ads/optimize (GET)

Added schemas:
- ProvidersSummaryResponse
- ProviderDetailResponse
- RevenueResponse
- RevenueAnomaliesResponse
- RevenueTrendsResponse
- RevenueOptimizerResponse
- MetaAdsResponse
- MetaAdsOptimizeResponse

OpenAPI coverage:
- 39 documented /api paths.

Please open PR and run CI.
```
