# Dependency Major Migration Plan (Tier 1 Follow-On)

Date: 2026-04-11
Scope: `zod` 3 -> 4 and `stripe` 20 -> 22
Status: Planned, not started

## Why this is separate from patch sweeps

- There are no remaining patch-level security bumps for `jose`, `plaid`, or `sharp`.
- Remaining dependency movement is major-version only and carries behavior/regression risk.
- This should be executed as controlled migrations, not bundled into generic dependency churn.

## Current baseline

- `zod`: `^3.23.8`
- `stripe`: `^20.4.1`
- `next`: `^14.2.35` (already patched in Tier 1)
- `@remotion/*`: `^4.0.448` (already patched in Tier 1)

## Migration strategy

Use one branch and one PR per package, with hard validation gates before merge.

1. `zod` migration PR first
2. `stripe` migration PR second
3. Never combine these into one PR

## PR 1: Zod v4 migration

Branch name: `codex/migrate-zod-v4`

### Expected risk areas

- schema parsing behavior differences in API request validation
- error formatting used by response serializers
- helper abstractions in `src/lib/validation/*`

### Work plan

1. Upgrade `zod` in `package.json` and refresh lockfile.
2. Fix compile/runtime incompatibilities in route schemas and shared validators.
3. Update tests that assert exact zod error shape.
4. Run focused API test suites first, then full test run.

### Merge gates

- `npm run typecheck` passes
- `npm run test` passes
- no broadened acceptance in critical auth/payment/webhook schemas
- explicit reviewer sign-off on validation behavior changes

### Time estimate

- Engineering: 4-8 hours
- Review + stabilization: 1-2 hours

## PR 2: Stripe v22 migration

Branch name: `codex/migrate-stripe-v22`

### Expected risk areas

- webhook payload typing and event object access
- checkout/session creation payloads
- idempotency/retry behavior under API errors

### Work plan

1. Upgrade `stripe` in `package.json` and refresh lockfile.
2. Update Stripe client calls and type usage in payment routes and webhook handlers.
3. Re-verify webhook signature validation and fail-closed behavior.
4. Re-run payment/webhook tests and route-level smoke coverage.

### Merge gates

- `npm run typecheck` passes
- `npm run test` passes
- webhook tests pass with signature verification still enforced
- no regression in checkout/subscription flows

### Time estimate

- Engineering: 3-6 hours
- Review + stabilization: 1-2 hours

## Rollback plan

- If either migration regresses behavior, revert that single PR only.
- Keep each PR isolated so rollback does not unwind unrelated hardening.
- Do not continue to the second migration until the first is deployed and stable.

## Success criteria

- both major dependencies upgraded
- all CI checks green on each PR
- no auth/payment/webhook regressions in production monitoring window
- risk register updated to mark dependency migration item closed
