# Codex Reconciliation - Rani Beauty Clinic

Date: 2026-04-07
Branch: `codex/clinic-dashboard-stabilization`

## Purpose

This document reconciles the pasted Claude handoff summary with Codex's local read-only audit. The Claude summary is useful, but it explicitly says it was limited by an EDEADLK filesystem issue. Several of its claims conflict with local evidence, so do not treat it as the source of truth until the full handoff files exist and are rechecked.

## Confirmed By Codex

- Build gates are disabled in `next.config.mjs`.
  - `eslint.ignoreDuringBuilds: true`
  - `typescript.ignoreBuildErrors: true`
- There are two middleware files: root `middleware.ts` and `src/middleware.ts`.
- The application has a broad API surface, dashboard, public site, Airtable integration, AI features, webhooks, and SaaS scaffolding.
- SaaS/multi-tenant code should be treated as later-stage scaffolding until the single-clinic internal dashboard is stable.
- Airtable-backed read/write patterns need careful review because Airtable has no transactions.
- Financial engines use normal JavaScript numbers and should not be trusted for clinic finance decisions without tests and integer-cent accounting.
- Compliance/audit modules include in-memory stores and should not be treated as durable HIPAA audit infrastructure.
- The internal clinic dashboard should be the first product target; patient plan flow comes next; SaaS comes later.

## Contradicted Or Needs Correction

- Claude says `package-lock.json` was unreadable and `npm audit` failed. Codex was able to run `npm audit --json` after network approval.
  - Result: 12 vulnerabilities total, including 1 critical and 11 high.
- Claude says total API routes: 271. Codex initially counted 250 `route.ts` files under `src/app/api`; after adding `/api/health`, the generated route-readiness report counts 251.
- Claude says login needs rate limiting. Codex found existing login rate limiting in `src/app/api/dashboard/auth/login/route.ts`.
- Claude says broadly "no webhook signature verification." Codex found Stripe and Mangomint signature verification, while Cherry appeared unverified.
- Claude recommends deleting root `middleware.ts` and keeping `src/middleware.ts`. Codex does not accept that as safe yet. In a Next.js app, root `middleware.ts` is normally the active middleware. This requires a deliberate consolidation plan, not a blind delete.
- Claude's counts for route auth, zod validation, AI engines, and test files need verification against actual files.

## Local Counts From Codex Pass

- `src/app/api` route files found: 251 after adding `/api/health`
- Dashboard API route files found: 134
- API route files containing `not_implemented`: 199
- API route files not containing `not_implemented`: 52
- Dashboard routes with obvious auth/session markers in a quick scan: 17
- API routes with obvious body/form parsing: 19
- API routes with obvious validation/sanitization markers: 22
- Non-webhook public mutation candidates: 3
- Non-webhook public mutation candidates with rate limits: 3
- Non-test `@ts-ignore`: 0
- Non-test `@ts-expect-error`: 0
- Non-test `as any`: 24
- Non-test `as unknown`: 27

These are heuristic counts, not final compliance evidence. They are strong enough to drive the next stabilization pass.

## Highest-Confidence Critical Issues

1. Build and lint errors are hidden during deployment because Next build gates are disabled.
2. The live API surface is overstated because most route files are stubs.
3. Middleware is duplicated and must be consolidated carefully.
4. Cherry webhook processing accepted unsigned payloads before this stabilization pass; it now requires `CHERRY_WEBHOOK_SECRET` and an `x-cherry-signature` HMAC check.
5. Public plan tracking could mutate plan state without proving access to the plan before this stabilization pass; it now requires the same plan access code used by the public plan viewer.
6. The remaining non-webhook public mutation candidates are public lead/intake endpoints, not dashboard or patient-session leaks; they are now rate-limited but still need abuse monitoring and business-rule review.
7. Patient/revenue cache keys are global and not tenant/session scoped in some routes.
8. Compliance/audit logs are in-memory and not durable.
9. PnL and pricing engines need tests before operational use.
10. AI/photo analysis endpoint needs stronger cost controls, upload limits, and rate limiting.
11. SaaS/multi-tenant layer should be quarantined from the clinic launch path.

## First Stabilization Order

1. Add a health endpoint that reports service readiness without exposing secrets. Completed in `src/app/api/health/route.ts`.
2. Add a route readiness inventory script/check so stubs cannot be mistaken for production routes. Completed in `scripts/route-readiness.mjs` and `docs/codex-handoff/01-route-readiness-generated.md`.
3. Secure Cherry webhook signature handling or explicitly disable it until configured. Initial HMAC gate completed in `src/app/api/webhooks/cherry/route.ts`; schema validation/idempotency remain follow-ups.
4. Require plan access proof before public plan tracking mutates status. Completed in `src/app/api/plan/[id]/track/route.ts` and `src/app/plan/[id]/TreatmentPlanClient.tsx`.
5. Add a dashboard permission helper and migrate real dashboard routes gradually.
6. Scope cache keys by tenant/session for routes returning patient/revenue data.
7. Consolidate middleware after comparing root and `src` behavior.
8. Re-enable TypeScript and ESLint gates only after the first error burn-down.

## Do Not Do Yet

- Do not delete either middleware file without a diff-backed migration.
- Do not run destructive Airtable cleanup.
- Do not flip build gates and deploy before triaging errors.
- Do not touch SaaS/multi-tenant code as part of clinic launch unless it blocks runtime.
- Do not rely on Claude's EDEADLK-limited counts without local verification.

## Next Codex Patch Target

Review the remaining high-risk public upload/AI/PDF endpoints in `docs/codex-handoff/01-route-readiness-generated.md`, then consolidate middleware after comparing root `middleware.ts` and `src/middleware.ts`.
