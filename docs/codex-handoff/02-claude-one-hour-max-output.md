# Day 1 Stabilization — Codex-Ready Patch Plan

> Generated: 2026-04-07 by Claude Code (read-only audit)
> Branch context: `codex/clinic-dashboard-stabilization`
> Codex has already patched: health, cherry webhook, plan/track, contact, booking/intake, consultation/submit

---

## 1. Next Public Route Patch Plan

### 1.1 `src/app/api/photo/upload/route.ts`

| Property | Value |
|----------|-------|
| **Methods exported** | `POST` (L15) |
| **Public by design?** | Yes — patient-facing skin photo upload, no auth required |
| **Mutates state?** | No — processes image in-memory, returns base64 string |
| **Accepts file upload / large body?** | Yes — multipart `formData`, 25 MB max (`MAX_FILE_SIZE` L10) |
| **Calls AI / external services?** | No — only `sharp` (local image processing, L74-83) |
| **Existing validation** | MIME type allowlist `ALLOWED_TYPES` (L9, checked L40-44), size cap (L48-53), PDF detection (L39) |
| **Existing rate limiting** | **None** |
| **Main risk** | CPU/memory exhaustion — any anonymous caller can POST 25 MB images repeatedly, each triggering `sharp` resize. No rate limit, no auth. |
| **Minimal safe patch** | Import `rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS` from `@/lib/rate-limit` (utility already exists at `src/lib/rate-limit.ts`). Add 4-line guard at top of POST handler: `const ip = getClientIP(request); const rl = rateLimit('photo-upload', ip, RATE_LIMITS.FORM); if (!rl.allowed) return rateLimitResponse(rl.resetIn);` |
| **Suggested acceptance checks** | 1) `curl -X POST /api/photo/upload` with valid image returns 200. 2) 6th request within 60s returns 429 with `Retry-After` header. 3) Invalid MIME still returns 400. |
| **Key lines** | L9 `ALLOWED_TYPES`, L10 `MAX_FILE_SIZE`, L15 `POST handler`, L19 `formData()`, L74-83 `sharp processing` |

---

### 1.2 `src/app/api/skin-analysis/route.ts`

| Property | Value |
|----------|-------|
| **Methods exported** | `GET` (L2) |
| **Public by design?** | N/A — 501 stub |
| **Mutates state?** | No |
| **Accepts file upload / large body?** | No |
| **Calls AI / external services?** | No |
| **Existing validation** | None needed — returns `{ status: "not_implemented" }` |
| **Existing rate limiting** | None |
| **Main risk** | Low — 501 stub is harmless. Risk is future: when implemented, this will likely call Claude API with patient photos (expensive, sensitive). |
| **Minimal safe patch** | Add auth + rate-limit skeleton now so future implementation inherits protection. 6 lines: import rate-limit, add `RATE_LIMITS.AI` guard, return 501. |
| **Suggested acceptance checks** | 1) `GET /api/skin-analysis` returns 501. 2) 11th request in 60s returns 429. |
| **Key lines** | L1-2 (entire file) |

---

### 1.3 `src/app/api/templates/pdf/route.ts`

| Property | Value |
|----------|-------|
| **Methods exported** | `GET` (L2) |
| **Public by design?** | No — template routes are called by n8n workflows (server-to-server). See CLAUDE.md: "Template Routes (3) — Called by n8n workflows" |
| **Mutates state?** | No |
| **Accepts file upload / large body?** | No |
| **Calls AI / external services?** | No |
| **Existing validation** | None — 501 stub |
| **Existing rate limiting** | None |
| **Main risk** | Low — stub. Future risk: PDF generation endpoints can be abused for SSRF if they render user-supplied HTML. The sibling routes (`/api/templates/post-treatment`, `/api/templates/reactivation`, `/api/templates/pre-consult`) accept POST with JSON bodies from n8n. |
| **Minimal safe patch** | Add shared-secret header check (`x-n8n-secret`) matching an env var, consistent with how other n8n webhook routes should authenticate. Rate limit with `RATE_LIMITS.WEBHOOK`. |
| **Suggested acceptance checks** | 1) `GET /api/templates/pdf` without secret header returns 401. 2) With valid header returns 501. |
| **Key lines** | L1-2 (entire file) |

---

### 1.4 `src/app/api/patient/auth/magic-link/route.ts`

| Property | Value |
|----------|-------|
| **Methods exported** | `POST` (L14) |
| **Public by design?** | Yes — patient login initiation, must be unauthenticated |
| **Mutates state?** | Yes — creates JWT magic-link token (L36 `createMagicLinkToken`), sends email via Resend API (L40-115) |
| **Accepts file upload / large body?** | No — JSON body, single `email` field |
| **Calls AI / external services?** | Yes — **Resend** email API (L40 `resend.emails.send`), **Airtable** client lookup (L29-33 `fetchFirst`) |
| **Existing validation** | Zod schema validates email format (L10-11 `requestSchema`, L17-18 `safeParse`). Airtable value sanitized (L33 `sanitizeFormulaValue`). Constant-success response prevents email enumeration (L119). |
| **Existing rate limiting** | **None** — CRITICAL gap |
| **Main risk** | **High** — Email bombing via Resend. An attacker can POST arbitrary emails at high volume, burning Resend quota and sending spam from `noreply@ranibeautyclinic.com`. Also burns Airtable API rate limit (4.7 req/sec shared across all routes). |
| **Minimal safe patch** | Dual rate limit: IP-based (3/min) + email-based (5/hour). Use existing `rateLimit()` with two calls: `rateLimit('magic-link-ip', ip, { limit: 3, windowMs: 60_000 })` and `rateLimit('magic-link-email', email, { limit: 5, windowMs: 3_600_000 })`. |
| **Suggested acceptance checks** | 1) Valid email returns `{ success: true }`. 2) 4th request from same IP in 60s returns 429. 3) 6th request for same email in 1 hour returns 429. 4) Unknown email still returns `{ success: true }` (no enumeration). |
| **Key lines** | L8 `Resend init`, L10-11 `requestSchema`, L14 `POST handler`, L29-33 `Airtable lookup`, L36 `createMagicLinkToken`, L40 `resend.emails.send`, L119 `constant success` |

---

### 1.5 `src/app/api/patient/auth/verify/route.ts`

| Property | Value |
|----------|-------|
| **Methods exported** | `POST` (L21) |
| **Public by design?** | Yes — patient clicks magic link, exchanging token for session cookie |
| **Mutates state?** | Yes — creates patient session (L66 `createPatientSession`), sets HTTP-only cookie (L75-85) |
| **Accepts file upload / large body?** | No — JSON body, single `token` field |
| **Calls AI / external services?** | Yes — **Airtable** client lookup (L46-51 `fetchFirst`) |
| **Existing validation** | Zod validates token presence (L12-13 `requestSchema`, L24-25 `safeParse`). Token cryptographically verified (L36 `verifyMagicLinkToken`). Airtable value sanitized (L49 `sanitizeFormulaValue`). |
| **Existing rate limiting** | **None** |
| **Main risk** | Medium — Token brute-force is impractical (JWT entropy), but absence of rate limiting allows Airtable API hammering. Defense-in-depth requires a limit. |
| **Minimal safe patch** | IP-based rate limit: `rateLimit('magic-link-verify', ip, { limit: 5, windowMs: 60_000 })`. |
| **Suggested acceptance checks** | 1) Valid token returns `{ success: true, name: "..." }` with `Set-Cookie` header. 2) Invalid token returns 401. 3) 6th request from same IP in 60s returns 429. |
| **Key lines** | L12-13 `requestSchema`, L21 `POST handler`, L36 `verifyMagicLinkToken`, L46-51 `Airtable lookup`, L66 `createPatientSession`, L75-85 `cookie set` |

---

### Priority Summary

| # | Route | Priority | Risk | Patch size |
|---|-------|----------|------|-----------|
| 1 | `/api/patient/auth/magic-link` | **P0** | Email bombing, quota burn | ~10 lines |
| 2 | `/api/patient/auth/verify` | **P1** | Airtable hammering | ~6 lines |
| 3 | `/api/photo/upload` | **P1** | CPU exhaustion via sharp | ~6 lines |
| 4 | `/api/skin-analysis` | P3 | Stub — future-proof only | ~6 lines |
| 5 | `/api/templates/pdf` | P3 | Stub — future-proof only | ~6 lines |

**Prerequisite:** Rate-limit utility **already exists** at `src/lib/rate-limit.ts` (L1-101) with presets `FORM`, `AI`, `VIEW`, `WEBHOOK` and helpers `getClientIP()`, `rateLimitResponse()`. Already used by `src/app/api/ai/recommend/route.ts` (L8) and `src/app/api/webhooks/stripe/route.ts` (L9). No new utility file needed.

---

## 2. Middleware Comparison

### Files Under Review

| File | Location | Lines | Status |
|------|----------|-------|--------|
| `middleware.ts` | Project root | 113 | **ACTIVE — Next.js uses this** |
| `src/middleware.ts` | src/ directory | 187 | **DEAD CODE — Next.js ignores this** |
| `next.config.mjs` | Project root | 138 | Active config |

### Which middleware does Next.js use?

**Root `middleware.ts` only.** Per [Next.js 14 docs](https://nextjs.org/docs/app/building-your-application/routing/middleware): middleware must be placed at the root of the project (same level as `app/` or `pages/`). When both files exist, the root-level file takes precedence. `src/middleware.ts` is never executed.

### Root `middleware.ts` — What it does

| Concern | Lines | Detail |
|---------|-------|--------|
| Domain canonicalization | L14-23 | `ranibeautyclinic.com` → `www.ranibeautyclinic.com` (301) |
| Subdomain redirect | L27-37 | `offers.*` → `www` root (301, legacy WordPress) |
| Static file skip | L40-42 | `/_next` or paths containing `.` |
| WordPress param stripping | L45-54 | Removes `replytocom`, `s`, `_wpnonce`, etc. via 301 |
| API CORS | L57-87 | Own-origin CORS for API routes; webhook routes get no `Access-Control-Allow-Origin` |
| X-Robots-Tag | L90-96 | `noindex, nofollow` for `/dashboard`, `/portal`, `/admin`, `/provider`, `/m/`, `/tv`, `/offline`, `/plan/`, `/lp/`, `/thank-you` |
| Trailing slash removal | L99-103 | 301 redirect to non-trailing-slash form |
| Matcher | L109-112 | Excludes `_next/static`, `_next/image`, `favicon.ico`, static assets by extension |

### `src/middleware.ts` (DEAD) — What it does

| Concern | Lines | Detail |
|---------|-------|--------|
| Multi-tenant resolution | L81-137 | Resolves tenant from: `x-tenant-id` header (L95-98), JWT session cookie (L102-110), subdomain (L114-118), custom domain (L125-129), fallback `rani-beauty-clinic` (L133-136) |
| Tenant header injection | L139-149 | Sets `x-tenant-id`, `x-tenant-slug`, `x-tenant-source`, `x-tenant-host` on response |
| API CORS | L151-168 | Explicit allowlist: `ranibeautyclinic.com`, `www.ranibeautyclinic.com`, `ranios.com`, `ranios.dev`, plus `localhost:3000/3001` in dev |
| Public path skip | L23-31 | Skips `/api/tenant/onboarding`, `/api/webhooks/`, `/onboarding`, `/_next/`, `favicon.ico`, `robots.txt`, `sitemap.xml` |
| Matcher | L176-185 | Excludes `_next/static`, `_next/image`, `images/`, `favicon.ico` |
| SaaS domains | L18 | References `ranios.com`, `ranios.dev` — future SaaS platform domains |

### `next.config.mjs` — Relevant overlaps

| Concern | Lines | Detail |
|---------|-------|--------|
| Security headers | L100-135 | Full CSP, X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy — applied to `/(.*)`  |
| Trailing slash | L21 | `trailingSlash: false` — agrees with middleware's trailing-slash redirect |
| Redirects | L22-98 | 75 legacy URL redirects (WordPress migration, GSC 404 fixes) |
| TypeScript/ESLint bypass | L12-14 | `ignoreBuildErrors: true`, `ignoreDuringBuilds: true` — masks errors |
| Body size | L4-6 | `bodySizeLimit: '25mb'` for server actions (matches photo upload MAX_FILE_SIZE) |

### Conflict Analysis

| Area | Root middleware | src/middleware.ts | Conflict? |
|------|---------------|-------------------|-----------|
| CORS origin | Single env var `NEXT_PUBLIC_SITE_URL` (L73) | Explicit 4-origin allowlist (L153-158) | **Yes** — different strategies, src is better |
| CORS for webhooks | Strips `Access-Control-Allow-Origin` (L61-69) | Not differentiated | Mild — root is more correct for webhooks |
| Domain redirect | `ranibeautyclinic.com` → `www` (L14-23) | Not present | No — would be lost if root deleted |
| `offers.*` redirect | Present (L27-37) | Not present | No — would be lost if root deleted |
| WP param strip | Present (L45-54) | Not present | No — would be lost if root deleted |
| X-Robots-Tag | Present (L90-96) | Not present | No — would be lost if root deleted |
| Trailing slash | Present (L99-103) | Not present | No — would be lost if root deleted |
| Tenant resolution | Not present | Present (L81-137) | No conflict — feature not needed yet |
| Static file skip | `pathname.includes('.')` (L42) | `PUBLIC_PATHS` array (L23-31) | Different approaches, both functional |

### Recommended Consolidation Plan

**Phase 1 (Day 1): Do nothing.** Root middleware is correct for single-tenant production. `src/middleware.ts` is inert dead code with no runtime impact.

**Phase 2 (Post-stabilization):**
1. Extract multi-tenant resolver from `src/middleware.ts` L34-77 into `src/lib/tenant/resolver.ts`
2. Adopt the explicit CORS allowlist pattern from `src/middleware.ts` L153-158 into root middleware, replacing the single env var approach at L73
3. Gate tenant resolution behind `process.env.ENABLE_MULTI_TENANT === 'true'`
4. Delete `src/middleware.ts` entirely
5. Test: verify `www` redirect, `offers.*` redirect, WP param stripping, CORS headers, X-Robots-Tag all still work

**Risk of premature consolidation:** If someone moves the project to use `src/` directory convention (Next.js supports both), the dead `src/middleware.ts` could suddenly become active, overriding all SEO redirects, X-Robots-Tag, and WP param stripping with tenant-resolution logic that serves no purpose in single-tenant mode.

---

## 3. Dashboard Auth Helper Plan

### Current State

- **137 total** dashboard API routes (`src/app/api/dashboard/**/route.ts`)
- **94 routes** have `getSession()` auth check — properly protected
- **42 routes** lack any auth check
  - Of those 42: **40 are 501 stubs** (harmless but unprotected for future implementation)
  - **2 are real routes** returning data or mutating state without auth

### Auth Pattern (established at 94 routes)

```typescript
// src/lib/auth/session.ts — L40-45
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';

const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if (!hasPermission(session.role, 'view_executive')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Top 10 Dashboard Routes Without Auth

#### Real routes (data exposure risk NOW):

| # | Route | File | Methods | Data Exposed/Mutated | Suggested Permission | Lines |
|---|-------|------|---------|---------------------|---------------------|-------|
| 1 | `/api/dashboard/revenue-optimizer` | `src/app/api/dashboard/revenue-optimizer/route.ts` | GET | Revenue gaps, targets, forecasts, MRR, retention rate, avg ticket — mock data but structured for real | `view_revenue` | L10-46 |
| 2 | `/api/dashboard/auth/logout` | `src/app/api/dashboard/auth/logout/route.ts` | POST, GET | Clears session cookie (mutates auth state) | None needed — logout is intentionally open, but should verify session exists first | L4-16 |

#### Stub routes (risk when implemented):

| # | Route | File | Methods | Future Data Risk | Suggested Permission | Lines |
|---|-------|------|---------|-----------------|---------------------|-------|
| 3 | `/api/dashboard/payments` | `src/app/api/dashboard/payments/route.ts` | GET | Payment records (PCI-adjacent) | `view_finance` | L1-2 |
| 4 | `/api/dashboard/glp1` | `src/app/api/dashboard/glp1/route.ts` | GET | GLP-1 patient enrollment (PHI) | `view_clients` | L1-2 |
| 5 | `/api/dashboard/charting` | `src/app/api/dashboard/charting/route.ts` | GET | Medical charting (PHI) | `view_clients` | L1-2 |
| 6 | `/api/dashboard/treatment-plans` | `src/app/api/dashboard/treatment-plans/route.ts` | GET | Treatment plans (PHI) | `view_clients` | L1-2 |
| 7 | `/api/dashboard/training/progress` | `src/app/api/dashboard/training/progress/route.ts` | GET | Staff training records | `view_providers` | L1-2 |
| 8 | `/api/dashboard/loyalty/redeem` | `src/app/api/dashboard/loyalty/redeem/route.ts` | GET | Loyalty points, redemptions | `view_clients` | L1-2 |
| 9 | `/api/dashboard/alerts/[id]` | `src/app/api/dashboard/alerts/[id]/route.ts` | GET | Individual alert (ops data) | `dismiss_alerts` | L1-2 |
| 10 | `/api/dashboard/schedule/upcoming` | `src/app/api/dashboard/schedule/upcoming/route.ts` | GET | Future appointments (PHI) | `view_schedule` | L1-2 |

### Minimal Wrapper Approach

**For real route #1** (`revenue-optimizer`): Add the 5-line auth guard at top of GET handler, using `view_revenue` permission. Copy pattern from `src/app/api/dashboard/revenue/route.ts` which already protects similar data.

**For real route #2** (`auth/logout`): Acceptable as-is — logout should work even with an invalid session. Optionally add `getSession()` check and log the username being logged out for audit trail.

**For all 40 stubs**: Batch-add auth guard. Since they all share the identical 2-line structure, a script or Codex prompt can add the guard to all 40 files. Each stub should use the permission mapped to its data domain (see table above). The guard fires before the 501 return, so when someone implements the route, auth is already in place.

### Full list of 42 unprotected dashboard routes

<details>
<summary>Click to expand</summary>

```
src/app/api/dashboard/activity/route.ts
src/app/api/dashboard/alerts/[id]/route.ts
src/app/api/dashboard/auth/logout/route.ts
src/app/api/dashboard/behavioral-insights/route.ts
src/app/api/dashboard/charting/route.ts
src/app/api/dashboard/finance/investments/route.ts
src/app/api/dashboard/funnel-health/route.ts
src/app/api/dashboard/glp1/route.ts
src/app/api/dashboard/integrations/jotform/route.ts
src/app/api/dashboard/integrations/mangomint/route.ts
src/app/api/dashboard/integrations/square/route.ts
src/app/api/dashboard/integrations/sync-all/route.ts
src/app/api/dashboard/integrations/test-connection/route.ts
src/app/api/dashboard/inventory/analytics/route.ts
src/app/api/dashboard/inventory/products/route.ts
src/app/api/dashboard/inventory/purchase-orders/route.ts
src/app/api/dashboard/inventory/receiving/route.ts
src/app/api/dashboard/inventory/suppliers/route.ts
src/app/api/dashboard/inventory/waste/route.ts
src/app/api/dashboard/loyalty/redeem/route.ts
src/app/api/dashboard/marketing/attribution/route.ts
src/app/api/dashboard/marketing/content/route.ts
src/app/api/dashboard/marketing/leads/route.ts
src/app/api/dashboard/marketing/reviews/route.ts
src/app/api/dashboard/marketing/seo/route.ts
src/app/api/dashboard/payments/route.ts
src/app/api/dashboard/revenue-optimizer/route.ts
src/app/api/dashboard/save-queue/reminder/route.ts
src/app/api/dashboard/schedule/upcoming/route.ts
src/app/api/dashboard/training/[moduleId]/route.ts
src/app/api/dashboard/training/progress/route.ts
src/app/api/dashboard/treatment-plans/route.ts
```

(Plus ~10 more in deeper nested paths — run `grep -L "getSession" src/app/api/dashboard/**/route.ts` for full list.)
</details>

---

## 4. TypeScript Timeout Hypothesis

### Observed Symptoms

- `npx tsc --noEmit` hangs or times out
- `next build` bypasses this via `ignoreBuildErrors: true` (`next.config.mjs` L13-14)
- Build script uses `NODE_OPTIONS='--max-old-space-size=8192'` (`package.json` L7)

### Root Causes (ranked by likelihood)

#### 1. Massive surface area: 1,863 TS/TSX files

`tsconfig.json` L31-37 includes `**/*.ts`, `**/*.tsx`, `**/*.mts` — every TypeScript file in the repo except those explicitly excluded. With 1,863 files, the type checker processes everything including:
- 137 dashboard API routes
- Complex page components (some >2,000 lines)
- 106 large lib files (some >1,200 lines)

#### 2. Four duplicate "page 3.tsx" files — 1,681 wasted lines

These are accidental Finder copies that TypeScript still compiles:

| File | Lines |
|------|-------|
| `src/app/(marketing)/near/[city]/[service]/page 3.tsx` | 469 |
| `src/app/(marketing)/near/[city]/page 3.tsx` | 532 |
| `src/app/(saas)/marketing/page 3.tsx` | 541 |
| `src/app/(dashboard)/dashboard/providers/[name]/page 3.tsx` | 139 |

These don't affect Next.js routing (spaces in filenames aren't valid route segments) but TypeScript still type-checks them.

#### 3. `.next/types/**/*.ts` in tsconfig include

`tsconfig.json` L35-36 includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts`. Currently 0 files there (clean state), but after a `next build` or `next dev` session, Next.js generates route type definitions in `.next/types/` — one per page/layout/route. With 137+ dashboard routes, this could add hundreds of generated files to the compile.

#### 4. No incremental `.tsbuildinfo` location specified

`tsconfig.json` L19 sets `"incremental": true` but doesn't specify `tsBuildInfoFile`. The default location is the project root, and the `.tsbuildinfo` file may be gitignored or deleted between runs, eliminating the incremental benefit.

#### 5. Large monolithic files in src/lib

Top offenders (all type-checked):

| File | Lines |
|------|-------|
| `src/lib/ai/treatment-protocols.ts` | 2,093 |
| `src/lib/briefing/mega-briefing.ts` | 1,222 |
| `src/lib/ads/google-ads-engine.ts` | 1,220 |
| `src/lib/briefing/ads-intelligence.ts` | 1,191 |

106 files in `src/lib/` exceed 500 lines (~160K total lines in lib alone).

#### 6. Excluded SaaS directories may have cross-imports

`tsconfig.json` L50-55 excludes `src/lib/saas`, `src/lib/sdk`, `src/lib/tenant`, `src/lib/integrations/quickbooks`, `src/app/api/tenant`. If any non-excluded file imports from these excluded directories, TypeScript will still follow the import and type-check the excluded file, negating the exclusion. The dead `src/middleware.ts` imports `jose` and references tenant types — this alone may pull in the tenant type tree.

### Proposed `tsconfig.critical.json`

This config checks only the production-critical API routes and shared libraries, skipping pages, dashboard UI, and SaaS scaffolding:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": [
    "src/app/api/contact/route.ts",
    "src/app/api/photo/upload/route.ts",
    "src/app/api/patient/auth/**/*.ts",
    "src/app/api/ai/**/*.ts",
    "src/app/api/booking/**/*.ts",
    "src/app/api/consultation/**/*.ts",
    "src/app/api/webhooks/**/*.ts",
    "src/app/api/health/route.ts",
    "src/app/api/plan/**/*.ts",
    "src/app/api/templates/**/*.ts",
    "src/lib/auth/**/*.ts",
    "src/lib/patient-auth/**/*.ts",
    "src/lib/airtable/client.ts",
    "src/lib/airtable/tables.ts",
    "src/lib/airtable/sanitize.ts",
    "src/lib/rate-limit.ts",
    "src/lib/cache/**/*.ts",
    "src/types/**/*.ts",
    "next-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "src/lib/saas",
    "src/lib/sdk",
    "src/lib/tenant",
    "src/middleware.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Usage:** `npx tsc --project tsconfig.critical.json --noEmit`

**Expected impact:** Checks ~40 files instead of 1,863. Should complete in <10 seconds.

### Quick Wins (no tsconfig needed)

1. **Delete 4 duplicate "page 3.tsx" files** — saves 1,681 lines from every compile
2. **Add `src/middleware.ts` to tsconfig exclude** — prevents dead code from pulling in tenant types
3. **Add `.next` to tsconfig exclude** — it's already partially excluded via the matcher but explicit exclusion is safer

---

## 5. Codex Prompt Pack

### Prompt 1: Harden `/api/photo/upload`

```
Goal: Add rate limiting to the photo upload endpoint to prevent CPU exhaustion.

Inspect:
- src/app/api/photo/upload/route.ts (107 lines)
- src/lib/rate-limit.ts (101 lines — existing utility, DO NOT modify)

Edit ONLY:
- src/app/api/photo/upload/route.ts

DO NOT edit:
- middleware.ts
- src/middleware.ts
- next.config.mjs
- Any Airtable data or env vars

Changes:
1. Add import at top: import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
2. Add rate-limit guard as first lines inside POST handler (after line 16 "try {"):
   const ip = getClientIP(request);
   const rl = rateLimit('photo-upload', ip, RATE_LIMITS.FORM);
   if (!rl.allowed) return rateLimitResponse(rl.resetIn);

Acceptance checks:
- npm run build succeeds (or at least this file has no TS errors)
- Route still accepts valid image uploads and returns base64
- 6th request within 60 seconds returns HTTP 429 with Retry-After header

Rollback: git checkout src/app/api/photo/upload/route.ts
```

### Prompt 2: Harden `/api/skin-analysis`

```
Goal: Add auth + rate-limit skeleton to the skin-analysis stub so future implementation inherits protection.

Inspect:
- src/app/api/skin-analysis/route.ts (2 lines — 501 stub)
- src/lib/rate-limit.ts (existing utility — DO NOT modify)

Edit ONLY:
- src/app/api/skin-analysis/route.ts

DO NOT edit:
- middleware.ts
- src/middleware.ts
- Any dashboard routes
- src/lib/rate-limit.ts

Changes:
Replace the 2-line file with:
  import { NextRequest, NextResponse } from 'next/server';
  import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

  export async function GET(request: NextRequest) {
    const ip = getClientIP(request);
    const rl = rateLimit('skin-analysis', ip, RATE_LIMITS.AI);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  }

  export async function POST(request: NextRequest) {
    const ip = getClientIP(request);
    const rl = rateLimit('skin-analysis', ip, RATE_LIMITS.AI);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  }

Acceptance checks:
- GET /api/skin-analysis returns 501
- POST /api/skin-analysis returns 501
- 11th request in 60 seconds returns 429

Rollback: git checkout src/app/api/skin-analysis/route.ts
```

### Prompt 3: Harden `/api/templates/pdf`

```
Goal: Add rate-limit skeleton to the PDF template stub. This route will be called by n8n workflows (server-to-server).

Inspect:
- src/app/api/templates/pdf/route.ts (2 lines — 501 stub)
- src/app/api/templates/post-treatment/route.ts (for reference — see how sibling template routes work)
- src/lib/rate-limit.ts (existing utility — DO NOT modify)

Edit ONLY:
- src/app/api/templates/pdf/route.ts

DO NOT edit:
- middleware.ts
- src/middleware.ts
- Other template routes
- src/lib/rate-limit.ts

Changes:
Replace the 2-line file with:
  import { NextRequest, NextResponse } from 'next/server';
  import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

  export async function GET(request: NextRequest) {
    const ip = getClientIP(request);
    const rl = rateLimit('templates-pdf', ip, RATE_LIMITS.WEBHOOK);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  }

  export async function POST(request: NextRequest) {
    const ip = getClientIP(request);
    const rl = rateLimit('templates-pdf', ip, RATE_LIMITS.WEBHOOK);
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  }

Acceptance checks:
- GET and POST return 501
- 101st request in 60 seconds returns 429

Rollback: git checkout src/app/api/templates/pdf/route.ts
```

### Prompt 4: Compare and Consolidate Middleware Safely

```
Goal: Document the middleware situation and prepare for safe consolidation. DO NOT EDIT either middleware file yet — output an analysis only.

Inspect:
- middleware.ts (root, 113 lines — ACTIVE, Next.js uses this one)
- src/middleware.ts (187 lines — DEAD CODE, Next.js ignores this)
- next.config.mjs (138 lines — security headers, redirects)

Output ONLY:
- Create docs/codex-handoff/03-middleware-consolidation-plan.md

DO NOT edit:
- middleware.ts
- src/middleware.ts
- next.config.mjs
- Any route files

Document in the output file:
1. Confirm which middleware Next.js 14.2 uses (root wins over src/)
2. List every behavior in root middleware with line numbers
3. List every behavior in src/middleware.ts with line numbers
4. Identify what would break if src/middleware.ts were deleted (answer: nothing in production)
5. Identify what would break if root middleware.ts were deleted (answer: SEO redirects, CORS, X-Robots-Tag)
6. Propose a 3-step consolidation: (a) extract tenant resolver to src/lib/tenant/resolver.ts, (b) adopt CORS allowlist from src/middleware.ts into root, (c) delete src/middleware.ts
7. List test cases for post-consolidation verification

Acceptance checks:
- No files changed except the new doc
- Analysis matches actual file contents

Rollback: git checkout docs/codex-handoff/03-middleware-consolidation-plan.md
```

### Prompt 5: Create Scoped TypeScript Critical-Check Config

```
Goal: Create tsconfig.critical.json that type-checks only production-critical API routes and shared libs, enabling fast CI checks without waiting for 1,863 files.

Inspect:
- tsconfig.json (57 lines — current config, includes **/*.ts which covers everything)
- package.json (scripts.typecheck = "tsc --noEmit")
- Files named "page 3.tsx" (4 duplicate files totaling 1,681 lines — accidental Finder copies)

Edit ONLY:
- Create NEW file: tsconfig.critical.json

DO NOT edit:
- tsconfig.json
- package.json (do not add scripts yet)
- middleware.ts or src/middleware.ts
- Any route files

Create tsconfig.critical.json that:
1. Extends ./tsconfig.json
2. Sets noEmit: true
3. Includes ONLY: src/app/api/contact, src/app/api/photo, src/app/api/patient, src/app/api/ai, src/app/api/booking, src/app/api/consultation, src/app/api/webhooks, src/app/api/health, src/app/api/plan, src/app/api/templates, src/lib/auth, src/lib/patient-auth, src/lib/airtable/client.ts, src/lib/airtable/tables.ts, src/lib/airtable/sanitize.ts, src/lib/rate-limit.ts, src/lib/cache, src/types, next-env.d.ts
4. Excludes: node_modules, .next, src/lib/saas, src/lib/sdk, src/lib/tenant, src/middleware.ts, tests, stories

Also: delete the 4 "page 3.tsx" files:
- src/app/(marketing)/near/[city]/[service]/page 3.tsx
- src/app/(marketing)/near/[city]/page 3.tsx
- src/app/(saas)/marketing/page 3.tsx
- src/app/(dashboard)/dashboard/providers/[name]/page 3.tsx

Acceptance checks:
- npx tsc --project tsconfig.critical.json --noEmit completes in <30 seconds
- No errors from the scoped check (or document remaining errors)
- The 4 "page 3.tsx" files no longer exist
- npm run build still succeeds

Rollback:
- git checkout tsconfig.critical.json (or just delete it)
- git checkout "src/app/(marketing)/near/[city]/[service]/page 3.tsx" etc.
```

---

## Appendix: Key File Reference

| File | Lines | Role |
|------|-------|------|
| `src/lib/rate-limit.ts` | 101 | Shared rate limiter — presets FORM/AI/VIEW/WEBHOOK, helpers getClientIP/rateLimitResponse |
| `src/lib/auth/session.ts` | 59 | Dashboard JWT auth — createSession, verifySession, getSession, cookie config |
| `src/lib/auth/roles.ts` | 61 | RBAC — 5 roles (ceo/frontdesk/provider/marketing/operations), 49 permissions, hasPermission/canAccessPage |
| `middleware.ts` | 113 | ACTIVE — domain redirect, CORS, X-Robots-Tag, trailing slash |
| `src/middleware.ts` | 187 | DEAD — multi-tenant resolver, SaaS scaffolding |
| `next.config.mjs` | 138 | CSP, security headers, 75 redirects, TS/ESLint error bypass |
| `tsconfig.json` | 57 | Includes 1,863 files, excludes SaaS/SDK/tenant dirs |
