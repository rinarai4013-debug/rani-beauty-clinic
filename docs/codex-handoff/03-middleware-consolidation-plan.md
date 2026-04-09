# Middleware Consolidation Plan

> Generated: 2026-04-07 | Read-only audit | Do NOT edit middleware yet

---

## 1. Which Middleware Does Next.js Use?

**Root `middleware.ts` is the only active middleware.**

Next.js 14.2 resolves middleware from the project root (same level as `package.json`). When a file exists at both `middleware.ts` and `src/middleware.ts`, the root file wins. The `src/middleware.ts` file is **never executed** in production or development.

Verified via Next.js 14.2 docs and the actual runtime behavior: only the root middleware's CORS headers and redirects appear in response headers.

---

## 2. Root `middleware.ts` — Active (113 lines)

### Behaviors

| # | Behavior | Lines | Detail |
|---|----------|-------|--------|
| 1 | Domain canonicalization | L14-23 | `ranibeautyclinic.com` → `www.ranibeautyclinic.com` (301). Also catches `http://ranibeautyclinic.com` hostname. |
| 2 | Subdomain redirect | L25-37 | `offers.ranibeautyclinic.com` → `www.ranibeautyclinic.com/` (301). Legacy WordPress subdomain kill. |
| 3 | Static file bypass | L39-42 | Skips `/_next` and any path containing `.` (font files, images, etc.) |
| 4 | WordPress param stripping | L44-54 | Strips 11 legacy WP query params (`replytocom`, `s`, `_wpnonce`, `add-to-cart`, `page_id`, `format`, `templately_library`, `post_type`, `p`, `wc-ajax`, `ver`) via 301. Prevents GSC duplicate-content issues. |
| 5 | Webhook CORS | L60-69 | `/api/webhooks/*`: sets `Allow-Methods: POST, OPTIONS` and webhook-specific `Allow-Headers` (stripe-signature, x-mangomint-signature, x-cherry-signature). Intentionally **no** `Access-Control-Allow-Origin`. |
| 6 | API CORS | L71-84 | All other `/api/*`: sets single-origin CORS via `process.env.NEXT_PUBLIC_SITE_URL` (fallback `https://ranibeautyclinic.com`). Includes `Allow-Credentials: true`. |
| 7 | X-Robots-Tag | L89-96 | Adds `noindex, nofollow` for protected paths: `/dashboard`, `/portal`, `/admin`, `/provider`, `/m/`, `/tv`, `/offline`, `/plan/`, `/lp/`, and `/thank-you`. |
| 8 | Trailing slash removal | L98-103 | Redirects `/foo/` → `/foo` via 301 (SEO canonical). |

### Matcher (L108-112)

```
"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|eot)).*)"
```

Excludes: static assets, image optimization, favicon, and files with common static extensions.

### Known Weakness

- **Single-origin CORS** (L73): Uses one env var. If `NEXT_PUBLIC_SITE_URL` is `https://ranibeautyclinic.com`, requests from `https://www.ranibeautyclinic.com` get the wrong `Access-Control-Allow-Origin`. Works today because the Vercel deployment normalizes to `www`, but fragile.

---

## 3. `src/middleware.ts` — Dead Code (187 lines)

### Behaviors (none execute in production)

| # | Behavior | Lines | Detail |
|---|----------|-------|--------|
| 1 | Public path skip | L23-31 | Skips `/api/tenant/onboarding`, `/api/webhooks/`, `/onboarding`, `/_next/`, `favicon.ico`, `robots.txt`, `sitemap.xml`. |
| 2 | `x-tenant-id` header check | L94-99 | Trusts arbitrary `x-tenant-id` request header as tenant identity. **Security concern:** any caller can spoof tenant. |
| 3 | JWT tenant extraction | L60-77, L102-110 | Reads `rani-session` cookie → `jwtVerify` → extracts `tenantId` claim. Uses `DASHBOARD_JWT_SECRET`. |
| 4 | Subdomain tenant resolution | L35-48, L114-121 | Extracts subdomain from platform domains (`ranios.com`, `ranios.dev`, `localhost`). |
| 5 | Custom domain detection | L50-56, L124-130 | Detects non-platform hostnames as custom tenant domains. |
| 6 | Default tenant fallback | L132-136 | Falls back to `rani-beauty-clinic` tenant ID. |
| 7 | Response header injection | L139-149 | Sets `x-tenant-id`, `x-tenant-slug`, `x-tenant-source`, `x-tenant-host` on every response. |
| 8 | API CORS allowlist | L151-168 | Explicit origin allowlist: `ranibeautyclinic.com`, `www.ranibeautyclinic.com`, `ranios.com`, `ranios.dev`, plus `localhost:3000/3001` in dev. Reflects actual `origin` header when matched (correct behavior). |

### Matcher (L175-185)

```
'/((?!_next/static|_next/image|images|favicon.ico).*)'
```

Differs from root: also excludes `images/` directory. Does **not** exclude static file extensions.

### What Would Be Lost If Deleted

**Nothing in production.** The file never executes. However:
- The multi-tenant resolver logic (L35-77, L81-137) is the only implementation of subdomain/custom-domain tenant resolution. If SaaS mode is needed later, this code must be preserved somewhere.
- The CORS allowlist pattern (L153-158) is better than the root middleware's single-origin approach.

---

## 4. `next.config.mjs` — Overlapping Concerns (138 lines)

| Concern | Lines | Overlap with middleware? |
|---------|-------|------------------------|
| Security headers (CSP, HSTS, X-Frame-Options, nosniff, XSS, Referrer-Policy, Permissions-Policy) | L100-135 | **No overlap** — middleware doesn't set these. `next.config` headers are additive. |
| `trailingSlash: false` | L21 | **Agrees** with middleware L98-103 trailing-slash redirect. Belt+suspenders. |
| 75 legacy URL redirects | L22-98 | **No overlap** — these are `next.config` redirects, not middleware. They run _before_ middleware. |
| `ignoreBuildErrors: true` | L13-14 | Not middleware-related, but masks TS errors (related to Section 5). |
| `bodySizeLimit: '25mb'` | L4-6 | Not middleware-related, matches photo upload MAX_FILE_SIZE. |

**Key insight:** Security headers are in `next.config.mjs`, NOT in middleware. Deleting either middleware file has **zero effect** on CSP, HSTS, X-Frame-Options, etc.

---

## 5. Conflict Analysis

### If both middlewares somehow ran (they can't, but for clarity):

| Area | Root middleware | src/middleware.ts | Conflict |
|------|---------------|-------------------|----------|
| CORS origin strategy | Single env var (L73) | Explicit 4-origin allowlist (L153-158) | **Yes** — different values set on same header |
| CORS for webhooks | No `Allow-Origin` (L61-69) | Sets `Allow-Origin` for all `/api/` (L151) | **Yes** — src would leak CORS on webhooks |
| Domain redirect | `ranibeautyclinic.com` → `www` (L14-23) | Not present | Lost if root deleted |
| `offers.*` redirect | Present (L25-37) | Not present | Lost if root deleted |
| WP param stripping | Present (L44-54) | Not present | Lost if root deleted |
| X-Robots-Tag | Present (L89-96) | Not present | Lost if root deleted |
| Trailing slash | Present (L98-103) | Not present | Lost if root deleted |
| Tenant resolution | Not present | Present (L81-137) | Not needed in single-tenant |
| Tenant header injection | Not present | Present (L139-149) | Not needed in single-tenant |
| Static file handling | Extension check `.` (L40) | `PUBLIC_PATHS` array (L23-31) | Different approach |

### If root middleware were deleted:

**Catastrophic for SEO and operations:**
1. No `www` redirect → duplicate content in Google index
2. No `offers.*` redirect → 404s for legacy subdomain traffic
3. No WP param stripping → GSC duplicate URLs resurface
4. No X-Robots-Tag → `/dashboard`, `/portal`, `/plan/` indexed by search engines
5. No trailing slash → duplicate URLs
6. No CORS on API routes → cross-origin requests fail

### If `src/middleware.ts` were deleted:

**Zero production impact.** The file is dead code. The only loss is the reference implementation of tenant resolution for future SaaS mode.

---

## 6. Recommended Consolidation Plan

### Phase 0: Immediate (this stabilization PR)

**Do nothing to either middleware file.** The current setup is correct for single-tenant production. `src/middleware.ts` is inert.

### Phase 1: CORS Upgrade (post-stabilization, low risk)

**File:** `middleware.ts` (root)
**Change:** Replace single-origin CORS (L73) with explicit allowlist pattern from `src/middleware.ts` L153-163.

```typescript
// BEFORE (L71-74):
const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://ranibeautyclinic.com";
response.headers.set("Access-Control-Allow-Origin", allowedOrigin);

// AFTER:
const origin = request.headers.get('origin') || '';
const allowedOrigins = [
  'https://ranibeautyclinic.com',
  'https://www.ranibeautyclinic.com',
];
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}
const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
response.headers.set("Access-Control-Allow-Origin", corsOrigin);
```

**Why:** Reflects the actual requesting origin when it matches the allowlist. Prevents CORS failures when `www` vs non-`www` differ. The `src/middleware.ts` version is better.

**Test:** `curl -H "Origin: https://www.ranibeautyclinic.com" https://www.ranibeautyclinic.com/api/health` should return `Access-Control-Allow-Origin: https://www.ranibeautyclinic.com`.

### Phase 2: Extract Tenant Resolver (post-stabilization, safe)

**From:** `src/middleware.ts` L35-77 (`extractSubdomain`, `isCustomDomain`, `extractTenantFromJWT`)
**To:** New file `src/lib/tenant/resolver.ts`

This preserves the multi-tenant logic in a testable library without it being dead middleware code. Already partially exists — `src/lib/tenant/` has 9 files, but the middleware-specific functions (`extractSubdomain`, `isCustomDomain`) are only in the dead middleware.

### Phase 3: Delete `src/middleware.ts`

**Prerequisites:**
1. Phase 2 complete (tenant resolver extracted)
2. Confirm no imports reference `src/middleware.ts` directly

**Verification:**
```bash
grep -r "src/middleware" --include="*.ts" --include="*.tsx" src/
```

If zero matches, safe to delete.

### Phase 4: Gate Multi-Tenant (future, when SaaS launches)

Add to root `middleware.ts`:
```typescript
if (process.env.ENABLE_MULTI_TENANT === 'true') {
  const { resolveTenant } = await import('@/lib/tenant/resolver');
  // ... tenant resolution logic
}
```

---

## 7. Post-Consolidation Test Cases

| # | Test | Expected | Verifies |
|---|------|----------|----------|
| 1 | `curl -I http://ranibeautyclinic.com/services` | 301 → `https://www.ranibeautyclinic.com/services` | Domain canonicalization |
| 2 | `curl -I https://offers.ranibeautyclinic.com/anything` | 301 → `https://www.ranibeautyclinic.com/` | Subdomain redirect |
| 3 | `curl -I "https://www.ranibeautyclinic.com/?replytocom=1&s=test"` | 301 → `https://www.ranibeautyclinic.com/` | WP param stripping |
| 4 | `curl -I https://www.ranibeautyclinic.com/dashboard` | `X-Robots-Tag: noindex, nofollow` | Protected route noindex |
| 5 | `curl -I https://www.ranibeautyclinic.com/portal` | `X-Robots-Tag: noindex, nofollow` | Portal noindex |
| 6 | `curl -I https://www.ranibeautyclinic.com/services/` | 301 → `/services` | Trailing slash removal |
| 7 | `curl -H "Origin: https://www.ranibeautyclinic.com" https://www.ranibeautyclinic.com/api/health` | `Access-Control-Allow-Origin` present | API CORS |
| 8 | `curl -H "Origin: https://evil.com" https://www.ranibeautyclinic.com/api/health` | `Access-Control-Allow-Origin` is NOT `https://evil.com` | CORS rejects unknown origin |
| 9 | `curl -I https://www.ranibeautyclinic.com/api/webhooks/stripe` | No `Access-Control-Allow-Origin` header | Webhook CORS isolation |
| 10 | `curl -I https://www.ranibeautyclinic.com/` | `Content-Security-Policy` header present | Security headers (next.config.mjs, not middleware) |
| 11 | `curl -I https://www.ranibeautyclinic.com/` | `Strict-Transport-Security` header present | HSTS (next.config.mjs) |

---

## Appendix: File Locations

| File | Lines | Status |
|------|-------|--------|
| `middleware.ts` | 113 | **Active** — all production behaviors |
| `src/middleware.ts` | 187 | **Dead code** — multi-tenant SaaS scaffold |
| `next.config.mjs` | 138 | **Active** — security headers, redirects, CSP |
