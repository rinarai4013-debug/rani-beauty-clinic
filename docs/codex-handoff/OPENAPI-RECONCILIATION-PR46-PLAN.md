# OpenAPI Reconciliation Plan (PR #46)

## Objective

Keep PR flow clean while preserving richer OpenAPI schema fidelity from Codex waves.

## Canonical order

1. Merge `PR #46` (Wave 4 canonical baseline).
2. Open `PR #46.1` (schema enrichment only).
3. Rebase/open Wave 5 from updated `main`.

## PR #46.1 scope (strict)

Port only:

- Named schema components:
  - `ProvidersSummaryResponse`
  - `ProviderDetailResponse`
  - `RevenueResponse`
  - `RevenueAnomaliesResponse`
  - `RevenueTrendsResponse`
  - `RevenueOptimizerResponse`
  - `MetaAdsResponse`
  - `MetaAdsOptimizeResponse`
- Any missing path deltas not already in PR #46.

Do not include unrelated refactors.

## Validation checklist

- `OpenAPI` CI check green.
- Existing required checks remain green.
- No runtime code changes; OpenAPI-only diff.

## Wave 5 after rebase

Apply these dashboard paths after PR #46 (and optional #46.1) lands:

- `/api/dashboard/kpis`
- `/api/dashboard/inventory`
- `/api/dashboard/social`
- `/api/dashboard/pricing`
- `/api/dashboard/marketing`
- `/api/dashboard/backlinks`
- `/api/dashboard/alerts`
- `/api/dashboard/phone-agent`

## Copy-paste brief

```text
Execute this sequence:

1) Merge PR #46 as canonical Wave 4.
2) Open a follow-up PR (#46.1) with schema enrichments only:
   ProvidersSummaryResponse, ProviderDetailResponse, RevenueResponse,
   RevenueAnomaliesResponse, RevenueTrendsResponse, RevenueOptimizerResponse,
   MetaAdsResponse, MetaAdsOptimizeResponse, plus any missing path deltas.
3) Rebase/open Wave 5 from updated main (kpis, inventory, social, pricing, marketing, backlinks, alerts, phone-agent).

Goal: avoid parallel OpenAPI branch conflicts while preserving richer schema contracts.
```

