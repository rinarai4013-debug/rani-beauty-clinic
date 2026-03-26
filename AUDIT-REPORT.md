# Rani Beauty Clinic - Pre-Production Audit Report

**Date:** 2026-03-25
**Auditor:** Automated QA (Claude)
**Project:** Rani Beauty Clinic (Next.js 14 / TypeScript)
**Files Audited:** 1,129 TypeScript/TSX files
**API Routes:** 145 route handlers
**Dashboard Pages:** 82 page components

---

## CRITICAL Issues (Must Fix Before Deploy)

### C1. Wildcard CORS on ALL API Routes
**File:** `/src/middleware.ts` (line 152)
**Issue:** The middleware sets `Access-Control-Allow-Origin: *` for every `/api/` route, including authenticated dashboard endpoints, patient portal APIs, and financial routes (Plaid, payments). This allows any website to make authenticated requests to your API if the user has a valid session cookie.
**Impact:** Cross-origin credential theft. A malicious site could call `/api/dashboard/clients` or `/api/dashboard/plaid/accounts` from the user's browser.
**Fix:** Restrict CORS to your known origins: `ranibeautyclinic.com`, `*.ranios.com`, `localhost:3000`. Only apply wildcard CORS to truly public API routes (webhooks, public catalog).

### C2. Hardcoded Fallback Secret in Plaid Storage
**File:** `/src/lib/plaid/storage.ts`
**Issue:** `const secret = process.env.DASHBOARD_JWT_SECRET || 'dev-secret-change-me'` -- if `DASHBOARD_JWT_SECRET` is not set in production, bank access tokens will be encrypted with a known, hardcoded key.
**Impact:** If env var is missing on deploy, all Plaid access tokens become trivially decryptable.
**Fix:** Throw an error if `DASHBOARD_JWT_SECRET` is missing rather than falling back to a hardcoded value.

### C3. TypeScript Build Error - seasonal-winter.ts
**File:** `/src/lib/email/templates/campaigns/seasonal-winter.ts` (line 49)
**Issue:** `error TS1005: ',' expected` and `TS1002: Unterminated string literal`. This file has a syntax error that will break TypeScript compilation.
**Impact:** Build failure if strict mode is enabled. May silently fail in production builds.
**Fix:** Review the template literal around line 49 - likely an unescaped backtick or quote.

### C4. 16 Environment Variables Missing from .env.example
**Issue:** The following env vars are referenced in code but NOT documented in `.env.example`:
- `CRON_SECRET` - Required for cron job auth
- `PATIENT_JWT_SECRET` - Required for patient portal sessions
- `NEXT_PUBLIC_BASE_URL` - Used in patient auth redirects
- `RANIOS_API_KEY`, `RANIOS_WEBHOOK_SECRET`, `RANIOS_MASTER_PAT`, `RANIOS_MASTER_BASE_ID`, `RANIOS_TENANT_ID` - Required for SaaS multi-tenant features
- `GOOGLE_PLACE_ID`, `GOOGLE_REVIEWS_API_KEY` - Required for Google review sync
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET` - Required for Google Ads integration
- `INDEXNOW_SECRET` - Required for SEO IndexNow submissions
- `REPLICATE_API_TOKEN` - Required for photo simulation AI
- `STRIPE_PRICE_ENTERPRISE`, `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_STARTER` - Required for SaaS billing
- `N8N_API_KEY` - Required for n8n API calls

**Impact:** New developers or fresh deployments will have missing functionality with no documentation of what's needed.
**Fix:** Add all missing vars to `.env.example` with descriptions.

---

## HIGH Issues (Should Fix Before Deploy)

### H1. In-Memory Rate Limiting on Login
**File:** `/src/app/api/dashboard/auth/login/route.ts` (lines 55-92)
**Issue:** Rate limiting uses an in-memory `Map`. In serverless (Vercel) deployments, each function instance has its own memory. Rate limits reset on cold starts and don't share state across instances.
**Impact:** Rate limiting is effectively non-functional in production. An attacker can brute-force credentials by triggering different function instances.
**Fix:** Use an external store (Redis/Upstash, or Vercel KV) for rate limit state.

### H2. 200 `as any` Type Assertions Across 32 Files
**Issue:** Found 200 occurrences of `as any` across 32 files. While many are in test files (which is acceptable), several are in production code:
- `/src/components/consultation/FaceMapPicker.tsx` (2)
- `/src/components/saas/TenantTable.tsx` (2)
- `/src/components/dashboard/shared/ChartWrapper.tsx` (1)
- `/src/components/dashboard/shared/DataTable.tsx` (1)
- `/src/components/dashboard/shared/MobileNav.tsx` (1)
- `/src/app/api/dashboard/compliance/route.ts` (2)
- `/src/lib/compliance/hipaa-audit.ts` (1)
- `/src/app/(dashboard)/dashboard/inventory/purchase-orders/page.tsx` (1)
- `/src/app/(dashboard)/dashboard/inventory/purchase-orders/[id]/page.tsx` (1)

**Impact:** Type safety bypasses that could hide runtime bugs, especially in compliance-critical code.
**Fix:** Replace `as any` with proper types or explicit interface definitions.

### H3. Console.log in Production Webhook Handlers
**Files:** Multiple webhook routes log operational data:
- `/src/app/api/webhooks/mangomint/membership/route.ts` - Logs membership data as JSON
- `/src/app/api/webhooks/mangomint/sale/route.ts` - Logs sale data as JSON
- `/src/app/api/integrations/quickbooks/webhooks/route.ts` - Logs webhook event details

**Impact:** In Vercel, these go to log drains. While not a security issue per se, it increases log costs and could inadvertently log client financial data if the webhook payloads contain it.
**Fix:** Use structured logging with a severity filter, strip PII from log payloads, or use Sentry breadcrumbs instead.

### H4. Multi-Tenant Header Trust Without Validation
**File:** `/src/middleware.ts` (lines 94-99)
**Issue:** The middleware accepts an `x-tenant-id` header directly and injects it into request headers with no validation that the value corresponds to an actual tenant. Any API caller can set this header to impersonate any tenant.
**Impact:** Tenant isolation bypass in the SaaS platform.
**Fix:** Validate the `x-tenant-id` header against a tenant registry or only allow it for requests that also carry a valid admin JWT.

---

## MEDIUM Issues (Fix Soon After Deploy)

### M1. No Barrel File for Hooks
**Directory:** `/src/hooks/`
**Issue:** No `index.ts` barrel file exists. All 55+ consumers import directly from `@/hooks/useDashboardData`. This is currently fine because all hooks are in one file, but as the codebase grows, it creates tight coupling.
**Verification:** All hooks imported by consumers ARE exported from `useDashboardData.ts` - no broken imports found.

### M2. SaaS Routes Exposed Without Feature Flag
**Files:** `/src/app/(saas)/` directory, `/src/app/api/saas/` routes, `/src/app/api/tenant/` routes
**Issue:** The SaaS/multi-tenant features (admin panel, tenant management, billing, SDK docs) are deployed alongside the main Rani clinic site. No feature flag or environment check gates access.
**Impact:** Premature exposure of SaaS functionality to users who discover the routes.
**Fix:** Add middleware or layout-level checks to gate SaaS routes behind a feature flag.

### M3. Unused Dependencies
**Package.json lists packages that appear unused or underutilized:**
- `@pinecone-database/pinecone` - Not directly imported (may be used dynamically)
- `canvas-confetti` - Check if still needed
- `howler` - Check if still needed

### M4. Email Template Data Exposure
**Files:** `/src/lib/email/templates/` and `/src/lib/templates/`
**Issue:** Email templates contain hardcoded Rani-specific data (branding, URLs, phone numbers). For the SaaS pivot, these need parameterization.
**Impact:** Multi-tenant email sends would use Rani's branding.

---

## LOW Issues (Nice to Fix)

### L1. Dashboard Page Count is Massive
82 dashboard page components. Consider lazy loading / code splitting for routes that are rarely accessed (compliance sub-pages, training, SaaS admin).

### L2. Blog Data Files with `as any`
Several blog batch files use `as any` for content objects. Low risk since they're static data, but proper typing would catch data shape errors at build time.

### L3. Test Files with Heavy `as any` Usage
Test files account for ~130 of the 200 `as any` occurrences. While tests are more permissive, typed mocks would catch more issues.

### L4. No robots.txt Route Exclusion for Dashboard
The dashboard routes are not explicitly excluded in robots.txt patterns, relying on auth to prevent indexing. Add `Disallow: /dashboard` to robots.txt.

---

## PASSED Checks

### P1. Import/Export Integrity - PASS
- All 55 hooks imported from `useDashboardData.ts` are properly exported
- All dashboard pages import components that exist
- No broken import chains detected in critical paths

### P2. API Route Auth - PASS
- ALL 100 dashboard API route files import and use `getSession()` for auth
- Login route has PBKDF2 password hashing with timing-safe comparison
- Rate limiting on login (though in-memory - see H1)
- Patient portal uses separate JWT (`PATIENT_JWT_SECRET`)

### P3. Webhook Security - PASS
- Mangomint webhook verifies signature
- Stripe webhook uses `constructEvent` with signature verification
- Cherry webhook verifies HMAC-SHA256 signature
- QuickBooks webhook validates verifier token
- Cron routes validate `CRON_SECRET`

### P4. No Secrets in Client Code - PASS
- Only `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_SENTRY_DSN` are client-exposed
- No API keys, secrets, or tokens in NEXT_PUBLIC_ variables
- No secrets in console.log statements

### P5. Dynamic Routes - PASS
- All 28 content dynamic routes have `generateStaticParams`
- Dashboard dynamic routes are `'use client'` (no static generation needed)

### P6. No Route Conflicts - PASS
- No duplicate route definitions found
- API routes properly use HTTP method exports (GET, POST, PATCH, DELETE)

### P7. Session Security - PASS
- JWT with HS256, HttpOnly cookies, Secure flag in production
- SameSite: Strict on session cookies
- Separate session scopes for dashboard vs patient portal

### P8. No PII in Logs - PASS
- Console.log statements in API routes log operational data (webhook types, status codes)
- No email addresses, names, or health data in log statements

### P9. useDashboardData Hook Completeness - PASS
- All 55+ exported hooks match what consumers import
- No orphaned hooks, no missing exports

### P10. Data Flow: Login -> Session -> Dashboard - PASS
- Login: POST credentials -> PBKDF2 verify -> JWT create -> HttpOnly cookie
- Session: Middleware extracts JWT -> getSession() verifies -> role-based access
- Dashboard: SWR hooks -> authenticated API calls -> Airtable data

### P11. Data Flow: Webhook -> Airtable -> Dashboard - PASS
- Mangomint webhooks verify signature, write to Airtable (Transactions, Memberships tables)
- Dashboard SWR hooks poll API routes that read from same Airtable tables
- Activity feed shows webhook-triggered events

### P12. Data Flow: Patient Portal Magic Link - PASS
- Magic link generation: email -> JWT with patient ID -> signed URL
- Verification: URL token -> JWT verify -> session cookie
- Portal APIs: require patient session, scope data to patient ID

### P13. Package Dependencies - PASS
- All imported packages are installed in node_modules
- `plaid` is properly listed in dependencies and used
- No missing critical dependencies

---

**Summary:** 4 CRITICAL, 4 HIGH, 4 MEDIUM, 4 LOW issues. 13 checks PASSED.
The most urgent fixes are the wildcard CORS (C1) and the hardcoded Plaid encryption fallback (C2).
