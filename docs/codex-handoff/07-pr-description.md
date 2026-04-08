# PR: Stabilize Clinic Critical API Surface

## Summary

Stabilizes the clinic-critical API surface for Rani Beauty Clinic by hardening exposed public routes, patching active middleware CORS/preflight behavior, securing key webhook/plan tracking flows, and adding a repeatable scoped TypeScript gate.

## Changes

- Added `/api/health` readiness endpoint that reports safe env presence only.
- Added route readiness scanner and generated route matrix.
- Added preview smoke-test script for Vercel deployments.
- Secured Cherry webhook with HMAC verification via `CHERRY_WEBHOOK_SECRET`.
- Secured public treatment plan tracking with access-code validation.
- Added rate limiting and input/upload caps to public contact, booking intake, consultation submit, photo upload, patient magic link, skin analysis, and PDF template routes.
- Added dashboard session/permission protection to revenue optimizer.
- Improved logout audit logging by reading the current dashboard session.
- Patched active root middleware with explicit CORS allowlist and `OPTIONS` preflight handling.
- Added `npm run typecheck:critical` with scoped critical route TypeScript config.
- Documented runtime startup blocker caused by polluted local `node_modules` Finder-copy duplicate package directories.

## Verification

Passed:

```bash
git diff --cached --check
npm run typecheck:critical
node --check scripts/route-readiness.mjs
node scripts/route-readiness.mjs
node --check scripts/smoke-preview.mjs
```

Blocked locally:

- `next dev` does not bind to port 3000 in the current local workspace.
- Root cause appears operational/dependency-tree related: local `node_modules` contains hundreds of Finder-copy duplicate directories such as `@next 2`, `@types 2`, and `typescript 2`.
- Vercel preview should use a clean dependency install from the lockfile and is not blocked by local `node_modules`.

## Preview Smoke Test

After Vercel creates a preview URL:

```bash
BASE_URL=https://your-preview.vercel.app node scripts/smoke-preview.mjs
```

Expected notes:

- `/api/health` may return `503` if preview env vars are missing.
- unsigned Cherry webhook requests should return `401` if `CHERRY_WEBHOOK_SECRET` is configured, or `503` if missing.
- invalid public-form payloads may return `429` if rate limits were already hit during repeated testing.

## Required Vercel Env Check

Before relying on this in production, confirm:

- `CHERRY_WEBHOOK_SECRET`
- `DASHBOARD_JWT_SECRET`
- Airtable env vars
- Resend env vars
- any Stripe/Mangomint webhook secrets used by deployed routes
