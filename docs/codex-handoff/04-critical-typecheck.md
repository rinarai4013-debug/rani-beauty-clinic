# Critical TypeScript Gate

Generated: 2026-04-07

## Status

`npm run typecheck:critical` now completes successfully.

This is a scoped TypeScript gate for the clinic-critical surface only. It does not replace the full repo typecheck, which still needs a separate cleanup pass before build gates can be fully re-enabled.

## What It Checks

The gate is defined in `tsconfig.critical.json` and includes:

- active root `middleware.ts`
- `/api/health`
- public lead and upload routes
- patient auth/profile/plan routes
- public treatment plan view/tracking routes
- Cherry, Mangomint, and Stripe webhook routes
- booking and intake routes
- dashboard auth routes
- dashboard revenue optimizer route
- public treatment plan client

## Why It Exists

The full `tsc --noEmit` path was timing out. The investigation found two separate issues:

- TypeScript was auto-loading broad ambient `@types/*` packages until `types: ["node"]` was set.
- Several non-route helper/package type graphs were too heavy for a fast Day 1 gate, especially Sentry, Stripe, date-fns, and booking engine internals.

## Intentional Stubs

The critical gate uses `paths` overrides for the following type-only stubs under `types/critical-stubs/`:

- `@/lib/sentry-utils`
- `@sentry/nextjs`
- `@/lib/booking/availability`
- `@/lib/booking/data`
- `@/lib/booking/calendar`
- `@/lib/booking/intake`
- `@/lib/booking/reminders`
- `date-fns`
- `stripe`

These stubs are compile-time only and do not affect runtime or the normal Next.js build. They intentionally keep the gate focused on route handler request/response/security code instead of validating large third-party and booking-engine type graphs.

## Verification

Passed:

```bash
npm run typecheck:critical
node scripts/route-readiness.mjs
node --check scripts/route-readiness.mjs
git diff --check -- package.json tsconfig.critical.json types/critical-stubs src/types/auth.ts src/lib/airtable/tables.ts src/lib/treatment-plan/parser.ts src/app/api/webhooks/mangomint/route.ts docs/codex-handoff/01-route-readiness-generated.md
```

Still unresolved:

- Targeted ESLint on touched files timed out after 60 seconds with no output.
- Full repo `tsc --noEmit` remains out of scope for Day 1 stabilization.
- The critical stubs should be removed only after the full repo type graph is cleaned up.
