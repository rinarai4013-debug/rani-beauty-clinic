# Middleware Consolidation Plan

Date: 2026-04-07
Branch: `codex/clinic-dashboard-stabilization`

## Executive Summary

The active middleware for this Next.js app is the root `middleware.ts`. The `src/middleware.ts` file is multi-tenant SaaS scaffolding and should be treated as dead code for the clinic stabilization path unless the project is intentionally moved into a `src/`-only Next layout.

Recommendation for Day 1: do not merge or delete middleware yet. Keep the active root middleware, document the inactive SaaS middleware, and only make a narrow CORS improvement after tests are added.

## Active Root Middleware

File: `middleware.ts`

- Lines 10-12: exports `middleware(request)` and reads `pathname`, `searchParams`, and `host`.
- Lines 14-23: redirects `ranibeautyclinic.com` to `www.ranibeautyclinic.com`.
- Lines 25-37: redirects `offers.*` legacy traffic to the main site root.
- Lines 39-42: skips `_next` internals and any pathname containing a dot.
- Lines 44-54: strips legacy WordPress query parameters.
- Lines 56-87: applies API CORS behavior.
- Lines 60-70: treats webhooks as server-to-server and does not set `Access-Control-Allow-Origin`.
- Lines 72-83: sets single-origin CORS for other API routes using `NEXT_PUBLIC_SITE_URL` or `https://ranibeautyclinic.com`.
- Lines 89-94: redirects trailing-slash URLs to canonical non-trailing-slash paths.
- Lines 99-104: matcher excludes static/image/font assets.

Strengths:

- SEO/domain behavior is clinic-specific and likely production-relevant.
- Webhook routes avoid browser CORS origins, which is good for server-to-server endpoints.
- Static asset matcher is more restrictive than the inactive SaaS middleware.

Weaknesses:

- CORS origin is a single configured origin; it may not cover both `https://ranibeautyclinic.com` and `https://www.ranibeautyclinic.com`.
- It sets CORS headers but does not explicitly short-circuit `OPTIONS` preflight requests.
- It has no tenant handling, which is acceptable for the current single-clinic launch target.

## Inactive Src Middleware

File: `src/middleware.ts`

- Lines 1-10: declares itself as RaniOS multi-tenant middleware.
- Lines 18-20: defines platform domains and default tenant.
- Lines 23-31: defines public paths.
- Lines 35-48: extracts tenant subdomains.
- Lines 50-56: detects custom domains.
- Lines 60-77: extracts `tenantId` from the dashboard JWT.
- Lines 81-160: resolves tenant source and injects tenant headers.
- Lines 94-99: trusts client-supplied `x-tenant-id`, which is not safe for public traffic without a signed/internal-call boundary.
- Lines 149-158: sets permissive `Access-Control-Allow-Origin: *` and allows `X-Tenant-ID`.
- Lines 165-176: defines a broad matcher.

Why it should not be merged now:

- It is SaaS/multi-tenant scaffolding, not needed for the internal clinic dashboard.
- It would weaken CORS if copied directly because it uses `Access-Control-Allow-Origin: *`.
- It trusts `x-tenant-id` from request headers.
- It does not contain the current root middleware's clinic SEO redirects or WordPress query cleanup.

## Next Config Headers

File: `next.config.mjs`

- Lines 2-7: build-time ESLint and TypeScript checks are disabled.
- Lines 12-26: global security headers are configured through `headers()`.
- These headers are independent of either middleware file. Deleting or changing `src/middleware.ts` would not remove these headers.

## Consolidation Plan

Phase 0, now:

- Keep root `middleware.ts` active.
- Do not import tenant logic from `src/middleware.ts`.
- Do not delete `src/middleware.ts` in the same patch as security hardening; treat removal as a cleanup PR after route stabilization.

Phase 1, narrow active middleware improvement:

- Add an explicit CORS allowlist helper to root `middleware.ts`.
- Allow only known clinic origins, for example `https://ranibeautyclinic.com`, `https://www.ranibeautyclinic.com`, and optionally `http://localhost:3000` in development.
- Return `204` for API `OPTIONS` requests with the same CORS headers.
- Keep webhook routes without `Access-Control-Allow-Origin`.

Status: completed in root `middleware.ts` during the Codex stabilization pass.

Phase 2, cleanup:

- Rename `src/middleware.ts` to a non-runtime reference file, for example `src/lib/tenant/middleware-reference.ts`, only if still useful.
- Otherwise delete it in a dedicated cleanup PR after confirming no imports rely on it.

Phase 3, future SaaS:

- Rebuild tenant resolution as explicit app/server logic, not edge middleware that trusts request headers.
- Tenant context should come from signed session/API key/domain lookup, not arbitrary `x-tenant-id`.

## Acceptance Tests

- `https://ranibeautyclinic.com/services` redirects to `https://www.ranibeautyclinic.com/services`.
- `https://offers.ranibeautyclinic.com/anything` redirects to `https://www.ranibeautyclinic.com/`.
- A URL with `replytocom` strips that query parameter.
- A public page with a trailing slash redirects to the non-trailing-slash version.
- Static files and `_next` paths are not redirected.
- `/api/contact` from an allowed clinic origin receives CORS headers.
- `/api/contact` from an unknown origin does not receive a permissive wildcard CORS origin.
- `/api/contact` `OPTIONS` returns a no-content preflight response after Phase 1.
- `/api/webhooks/stripe` does not expose browser CORS origin headers.
- `src/middleware.ts` is not assumed to be executing in production.
- Security headers remain sourced from `next.config.mjs`.

## Decision

Do not do a blind merge. The safe Day 1 posture is: root middleware remains active, `src/middleware.ts` remains quarantined as SaaS scaffolding, and the CORS enhancement is applied only to the root middleware.
