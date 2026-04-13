# A-Grade Burndown Snapshot — 2026-04-13

## What was completed in this Codex pass

1. Added integration coverage for the last uncovered API route imports:
   - `/api/ai/advisor`
   - `/api/ai/outcome`
   - `/api/ai/protocols`
   - `/api/ai/quiz`
   - `/api/ai/skin-analysis`
2. New test file:
   - `src/app/api/__tests__/ai-stub-routes.test.ts`
3. Route-map diff now reports:
   - `total_routes=119`
   - `tested_route_imports=119`
   - `uncovered=0`

## Objective metric snapshot

- API route files: **119**
- API test files: **38**
- OpenAPI documented route paths: **23**
- Sentry wrapped route coverage: **119/119** (from prior merged wave)
- CI branch protection checks required: **Typecheck, Test, dependency-review, Vercel (2x)**; add `OpenAPI` after branch-protection update

## Updated gradecard (strict academic scale)

| Domain | Grade | % | Why |
|---|---:|---:|---|
| Security | **B** | **85%** | Formula injection hardening waves landed, public intent guard and webhook hardening in place, dependency review gate active. |
| Architecture | **B** | **85%** | Tenant env refactor and route hardening are strong; remaining orphan modules and Airtable coupling still cap upside. |
| HIPAA / Compliance | **B-** | **82%** | PHI logging + persistence adapter implemented; still blocked on ops table provisioning + env flip. |
| Test Coverage | **B-** | **82%** | Route import coverage is now 100% (119/119), but behavior-depth is still uneven across lower-risk endpoints. |
| Observability | **B** | **86%** | 119/119 Sentry wraps and structured redaction; alerting/SLO automation still needed for A-range. |
| Dependencies | **B** | **84%** | Patch CVE wave is done; remaining stripe/zod major migrations are planned but not completed. |
| DevOps / Process | **B** | **85%** | Hard CI gate + branch protection + dependency review in place; CODEOWNERS/reviewer redundancy and staging maturity still pending. |
| Documentation | **B+** | **89%** | Deep audit/runbook/migration docs are strong; OpenAPI breadth and contributor docs still not complete enough for A. |
| Product Reliability | **B** | **84%** | Core medspa critical flows now covered and hardened; remaining depth and ops automation are main gap. |

**Composite:** **84.7% (B)**

## Time-to-grade estimate from this state

- **A- (90-92%)**: ~**18-28 hours**
- **A (93-100%)**: ~**40-60 hours**

These ranges assume parallel execution (Codex + Claude) and no major migration regressions.

## Highest-leverage next tasks for Claude (ordered)

1. **Merge this Codex test wave and run full CI**
   - Validate `src/app/api/__tests__/ai-stub-routes.test.ts`
   - Confirm no regressions in `Typecheck`, `Test`, and both Vercel checks.

2. **Compliance activation (largest A-grade unlock outside test depth)**
   - Provision Airtable tables:
     - `PHI Access Log`
     - `HIPAA Breaches`
     - `BAAs`
     - `HIPAA Training`
   - Set production env:
     - `COMPLIANCE_PERSISTENCE_ENABLED=1`
   - Run:
     - `node scripts/compliance/check-persistence-ready.mjs`
   - Capture evidence in a PR note/screenshot for audit traceability.

3. **OpenAPI gate completion**
   - Add `OpenAPI` as required branch-protection check once `openapi` job is green.
   - Expand `openapi.yaml` toward >= 50 route paths (currently 23) focusing on high-risk mutation and webhook surfaces first.

4. **Major dependency migrations (A-grade prerequisites)**
   - Stripe `v20 -> v22` migration PR (isolated + exhaustive tests).
   - Zod `v3 -> v4` migration PR (isolated + route validation regression sweep).

5. **Behavior-depth test wave continuation**
   - Prioritize remaining weak-depth routes after route-import closure:
     - dashboard analytics/reporting branches
     - secondary patient/member flows
     - fallback/error-path assertions for low-volume routes
   - Goal: convert shallow "route touched" tests into assertion-rich behavior tests.

## Copy-paste brief for Claude

```text
Codex pass complete in main-tracked repo.

New file:
- src/app/api/__tests__/ai-stub-routes.test.ts

What it does:
- Adds coverage for the last 5 uncovered AI stub routes:
  /api/ai/advisor, /api/ai/outcome, /api/ai/protocols, /api/ai/quiz, /api/ai/skin-analysis
- For each route: GET 501, POST 501, and 429 rate-limit path

Coverage snapshot from route-map diff:
- total_routes=119
- tested_route_imports=119
- uncovered=0

Please pick up from here:
1) validate and merge this wave,
2) run compliance table provisioning + COMPLIANCE_PERSISTENCE_ENABLED=1,
3) add OpenAPI as required branch-protection check,
4) continue Stripe v22 then Zod v4 migrations as isolated PRs.
```

