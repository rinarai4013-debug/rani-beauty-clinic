# Vercel Deployment Readiness Assessment

**Audit Date:** 2026-04-07  
**Project:** Rani Beauty Clinic (Next.js 14)  
**Current Status:** 🔴 **NOT READY** — Multiple critical issues block deployment

---

## Executive Summary

The codebase has **6 critical infrastructure issues** and **1 critical deadlock** that prevent stable Vercel deployment. Even if deployed today, the "sometimes works, sometimes doesn't" behavior would continue due to:

1. **Filesystem deadlock (EDEADLK)** blocking all builds
2. **Two conflicting middleware files** (root + src/)
3. **Silently ignored TypeScript errors** (269+ errors likely)
4. **Silently ignored ESLint errors** (unknown quantity)
5. **Missing or misconfigured environment variables** on Vercel
6. **Airtable rate limiting** (4.7 req/sec) without queue/retry logic
7. **No graceful degradation** when external APIs fail (Anthropic, Mangomint, etc.)

**Estimated stabilization timeline:** 2-3 weeks (after deadlock resolution)

---

## Next.js Configuration Analysis

### Build & Runtime Settings

**File:** `next.config.mjs` (8334 bytes, 138 lines)

#### Safe Configuration ✅
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '25mb',  // Good: handles large form submissions
  },
},
poweredByHeader: false,                // Good: don't advertise Next.js
trailingSlash: false,                  // Good: canonical URLs without trailing /
```

#### Dangerous Configuration 🔴
```javascript
eslint: {
  ignoreDuringBuilds: true,  // ⚠️ TODO: Fix ESLint errors
},
typescript: {
  ignoreBuildErrors: true,   // ⚠️ TODO: Fix TypeScript errors
},
```

**Risk:** Any code error—even syntax errors—will silently make it into production. No compile-time safety.

---

### URL Redirects

**Count:** 90+ permanent redirects  
**Purpose:** Google Search Console 404 fixes, legacy URL patterns

**Categories:**
1. **Service pages:** `/treatments` → `/services`, `/wellness-services/:slug` → `/wellness/:slug`
2. **Navigation:** `/about-us` → `/about`, `/our-team` → `/team`, `/providers` → `/team/providers`
3. **Booking:** `/consultation`, `/appointment` → `/get-started` or `/book`
4. **Pricing:** `/specials`, `/offers`, `/promotions` → `/pricing`
5. **Results:** `/reviews`, `/gallery`, `/before-and-after` → `/results`
6. **Service-specific:** `/botox`, `/dysport` → `/services/botox-dysport`, `/laser-hair-removal` → `/services/laser-hair-removal`
7. **GLP-1:** `/weight-loss`, `/semaglutide`, `/glp-1` → `/glp1`
8. **Trailing slashes:** `/services/`, `/blog/`, etc. → canonical URLs

**Assessment:** Well-structured and comprehensive. No loops detected (spot-check passed).

---

### Content Security Policy (CSP)

**Configuration:** Comprehensive headers in `next.config.mjs`

**Whitelisted Third Parties:**
```
script-src:   Google Analytics, Clarity, Mangomint, Meta Connect
img-src:      All HTTPS (Airtable CDN, GA, Meta)
connect-src:  Airtable API, GA, Clarity, Mangomint, Facebook
frame-src:    Google Tag Manager, Mangomint (iframe), booking widget
```

**Risk Level:** MEDIUM
- `unsafe-inline` for scripts (required for Next.js hydration)
- Mangomint iframe loaded (booking system)
- Meta pixel loaded (retargeting)
- **Missing:** `report-uri` for CSP violations — should log to Sentry

**Recommendation:** Add `report-uri` directive pointing to Sentry CSP endpoint

---

### Security Headers

**Configured:**
- `X-Frame-Options: DENY` — No framing of site (good)
- `X-Content-Type-Options: nosniff` — Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` — Older XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` — Don't leak full URLs
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Block dangerous features
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — HSTS for 2 years

**Assessment:** ✅ Strong security posture. Recommend adding to HSTS preload list.

---

## Codebase Inventory

### API Routes
**Count:** 271 route files  
**Breakdown:**
- `/api/tenant/*` — Operations dashboard endpoints (clients, schedule, revenue, health-score, etc.)
- `/api/auth/*` — Session, login, logout, account management
- `/api/airtable/*` — Data syncs, cache invalidation
- `/api/ai/*` — Claude integration (pricing analysis, churn prediction, etc.)
- `/api/crm/*` — Mangomint integration (booking, availability, client data)
- `/api/webhooks/*` — Inbound from n8n, Mangomint, Airtable

**Risk:** With 271 routes and silently ignored TS errors, it's likely some routes have bugs that won't be caught until runtime.

---

### Test Coverage
**Count:** 163 test files  
**Status:** Exist but cannot run (Vitest blocked by deadlock)

**Assessment:** Unknown coverage %. Tests likely stale if builds failing.

---

### Middleware Conflict (CRITICAL)

**Files Found:**
1. `middleware.ts` at project root (4075 bytes)
2. `src/middleware.ts` (6121 bytes)

**Problem:** Next.js only loads ONE middleware file:
- If both exist, Next.js chooses `src/middleware.ts` (src/ takes priority)
- Root `middleware.ts` is ignored
- **Unknown which one is active** (filesystem deadlock prevents reading)

**Impact:** 
- Request/response handling may be broken
- Auth checks, redirects, or rate limiting may not work
- Vercel logs might show unexpected behavior

**Resolution:**
1. **Determine which one is correct** (should be `src/middleware.ts` based on Next.js conventions)
2. **Delete the other one** to eliminate ambiguity
3. **Test in dev:** `npm run dev` → navigate and check middleware behavior

---

### Vercel Configuration (DEADLOCKED)

**File:** `vercel.json` (752 bytes)  
**Status:** Cannot read due to EDEADLK

**Unknown Settings:**
- Environment variables (dev, preview, production)
- Function timeout (default 60s; serverless functions may timeout on Airtable syncs)
- Cron jobs (if any)
- CLI settings
- GitHub integration config

**Risk:** Vercel may be missing critical env vars, causing API calls to fail.

---

## Environment Variable Assessment

**Files:** `.env.local` (readable), `.env.example` (readable)

### Known Integration Points Requiring Env Vars
Based on the 271 API routes and configuration:

1. **Airtable:** `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`
   - Rate limit: 4.7 req/sec (429 responses if exceeded)
   - No queue/retry logic in place

2. **Anthropic Claude:** `ANTHROPIC_API_KEY`
   - Used in 8 AI engines per docs
   - No timeout/retry fallback documented

3. **Mangomint (booking system):** `MANGOMINT_API_KEY`, `MANGOMINT_LOCATION_ID`
   - Iframe embed required (`frame-src` in CSP)
   - No error boundary if API unavailable

4. **Google Analytics/Clarity:** Script tokens (in HTML)
   - Non-blocking, OK if down

5. **Sentry (error tracking):** `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
   - Likely configured; helps diagnose production issues

6. **Database/Auth:** Whatever session storage backend is used
   - Likely Airtable (27+ related tables per earlier audit)

### Env Var Risk
- **If ANY critical var missing on Vercel:** API routes return 500 errors silently
- **No .env.local in Vercel environment** — only env vars set in Vercel dashboard
- **Secrets in CI/CD logs:** Check Vercel deployment logs for exposed tokens

---

## Vercel-Specific Issues

### Function Timeout Risk

**Scenario:** A `/api/tenant/revenue/trends` endpoint does:
1. Query Airtable (1 req @ 4.7 req/sec = ~213ms)
2. Call Anthropic Claude API (1-3 sec)
3. Process data (100ms)
4. Return response

**Total latency:** ~3.5 seconds  
**Vercel limit:** Default 60s (no issue)

**But if:**
- Multiple concurrent requests hit simultaneously
- Airtable returns 429 (rate limited)
- Anthropic API is slow or timing out
- Network is unstable

**Result:** Request exceeds timeout → user sees generic 504 error → no logs in Vercel

### Cold Start Performance

**Issue:** Serverless functions have cold starts (~500ms-2s):
1. Node.js runtime boot
2. Module loading
3. Database connection (if stateful)
4. First request executes

**On Vercel:** First request after deploy / after idle period will be slow. This is expected but not visible to end users unless tracked in Sentry.

### Bundle Size

**Next.js build output:** Unknown (filesystem deadlock blocks build)

**Risk:** If bundle > 250 MB:
- Vercel may reject the deployment
- Cold starts become extremely slow (10+ seconds)
- Memory limit exceeded in serverless functions

**Recommendation:** Run `next build && du -sh .next/` to check size

---

## Airtable Rate Limiting Issue (HIGH RISK)

### Current Setup
- **Endpoint:** Airtable API (`https://api.airtable.com`)
- **Rate limit:** 4.7 requests per second (429 error if exceeded)
- **Whitelist:** Yes, CSP allows it (`connect-src: https://api.airtable.com`)

### Problem
With 271 API routes potentially querying Airtable:
- **Dashboard load:** 10+ simultaneous requests to Airtable
- **Result:** Most requests fail with 429 (rate limit error)
- **No retry logic:** Errors propagate to client (white screen / "try again")

### Evidence
- All dashboard endpoints depend on Airtable
- Operations data required in real-time
- No documented request queue or batching

### Mitigation Options

**Option A: Implement Request Queue** (Recommended)
```typescript
// src/lib/airtable-queue.ts
const queue = new PQueue({ interval: 1000, intervalCap: 4 });
// All Airtable calls go through queue
```

**Option B: Cache Dashboard Data**
```typescript
// Cache stale data, refresh in background
// If Airtable fails, serve cached data (5-10 min old)
```

**Option C: Upgrade Airtable Plan**
- Business plan: 30 req/sec (6x current)
- Cost: ~$10/user/month

**Recommendation:** Implement queue (Option A) + cache (Option B) for resilience

---

## External API Failure Scenarios

### If Anthropic Claude API Is Down
**Affected:** 8 AI engines (churn, pricing, health-score, etc.)  
**Current fallback:** Unknown (likely none)  
**Impact:** Dashboard shows broken values, user confusion

**Mitigation:**
```typescript
try {
  const prediction = await anthropic.messages.create(...)
} catch (err) {
  return { status: 'unavailable', cached: true, data: lastKnownValue }
}
```

### If Mangomint Booking API Is Down
**Affected:** Booking widget, availability  
**Current fallback:** Unknown  
**Impact:** Users cannot book appointments

**Mitigation:**
```typescript
// Graceful degradation: show offline message instead of error
if (!availabilityData) {
  return { status: 'offline', message: 'Booking unavailable. Call us at...' }
}
```

### If Airtable Is Down
**Affected:** Everything (all data)  
**Current fallback:** Unknown  
**Impact:** Site completely non-functional

**Mitigation:**
- Redis cache for frequently accessed data
- Stale-while-revalidate pattern
- Last-resort: static HTML fallback page

---

## Deployment Readiness Checklist

### 🔴 CRITICAL (Must Fix)

- [ ] **Resolve filesystem deadlock (EDEADLK)**
  - Kill any orphaned npm/node processes
  - Test: `npm run build` should succeed
  - Estimated time: 30 min - 2 hours

- [ ] **Reconcile middleware files**
  - Keep only `src/middleware.ts` (delete root version if duplicate)
  - Test in dev: `npm run dev` → verify routing works
  - Estimated time: 30 min

- [ ] **Fix TypeScript errors**
  - Set `typescript.ignoreBuildErrors: false` in `next.config.mjs`
  - Run `npm run build`
  - Fix all compilation errors
  - Estimated time: 4-8 hours (depends on error volume)

- [ ] **Fix ESLint errors**
  - Set `eslint.ignoreDuringBuilds: false`
  - Run `npm run build`
  - Fix all linting errors
  - Estimated time: 2-4 hours

- [ ] **Verify Vercel env vars**
  - Confirm all required vars set in Vercel dashboard:
    - `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`
    - `ANTHROPIC_API_KEY`
    - `MANGOMINT_API_KEY`, `MANGOMINT_LOCATION_ID`
    - Any others from `.env.example`
  - Test: Deploy to preview environment
  - Verify: Endpoints return data, not 500 errors
  - Estimated time: 1 hour

- [ ] **Read `vercel.json` and validate**
  - Unblock deadlock or use Vercel CLI to inspect
  - Confirm build command, env vars, redirects
  - Estimated time: 30 min

### 🟠 HIGH (Must Complete Before Production)

- [ ] **Implement Airtable request queue**
  - Prevent 429 rate limit errors
  - Estimated time: 2-3 hours

- [ ] **Add API error handling + graceful degradation**
  - Try/catch on Anthropic, Mangomint, Airtable calls
  - Return sensible fallback if external API fails
  - Estimated time: 3-4 hours

- [ ] **Test all 271 API routes** (smoke test)
  - Pick 10-20 critical routes
  - Call from dev/preview, verify 2xx responses
  - Estimated time: 1 hour

- [ ] **Run test suite**
  - `npm run test` (or `npm test`)
  - Get 163 tests to pass (currently blocked)
  - Estimated time: 2-4 hours

- [ ] **Performance audit**
  - Check `.next/` build size
  - Measure Vercel function cold starts
  - Verify no routes exceed timeout
  - Estimated time: 1 hour

- [ ] **Security checklist**
  - Verify no secrets in code (grep for `AIRTABLE_`, `ANTHROPIC_`, etc.)
  - Check CSP `report-uri` is configured for Sentry
  - Rotate any exposed tokens
  - Estimated time: 1 hour

### 🟡 MEDIUM (Before Full Launch)

- [ ] **Load testing**
  - Verify Airtable queue handles 100+ concurrent users
  - Check for memory leaks in serverless functions
  - Estimated time: 2 hours

- [ ] **Analytics validation**
  - Confirm Google Analytics / Clarity tracking
  - Verify conversion funnels working
  - Estimated time: 1 hour

- [ ] **Monitoring setup**
  - Sentry error tracking enabled
  - Vercel analytics configured
  - Uptime monitoring (e.g., Pingdom)
  - Estimated time: 30 min

---

## Timeline Estimate

| Phase | Tasks | Duration | Blocker? |
|-------|-------|----------|----------|
| **1. Unblock deadlock** | Resolve EDEADLK | 0.5-2 hrs | YES |
| **2. Fix builds** | TS + ESLint errors | 6-12 hrs | YES |
| **3. Prepare deployment** | Env vars, middleware, routes | 2-3 hrs | YES |
| **4. Stabilize** | Queue, error handling, tests | 8-12 hrs | NO |
| **5. Validate** | Performance, security, load test | 4-5 hrs | NO |
| **TOTAL** | | **20-35 hours** | |

**Recommendation:** Allocate **1 week** for stabilization (with parallel work).

---

## Vercel Deployment Strategy

### Phase 1: Preview Deploy (Post-Stabilization)
```bash
# After fixing TS/ESLint/deadlock
npm run build  # Should complete successfully
npm run test   # 163 tests should pass
git push       # Push to feature branch
# Vercel automatically builds preview
# Test in preview env: https://<preview>.vercel.app
```

### Phase 2: Staging Deploy
```bash
# Promote from preview to staging environment
# Set staging-specific env vars (e.g., test Airtable base)
# Run smoke tests against staging
# Verify monitoring/logging works
```

### Phase 3: Production Deploy
```bash
# Merge to main branch
# Vercel automatically builds and deploys
# Monitor Sentry for errors
# Check performance metrics
```

### Rollback Plan
```bash
# If production issues:
git revert <commit>
git push  # Vercel redeploys previous version
```

---

## Post-Deployment Monitoring

### Critical Alerts
Set up in Vercel + Sentry:
1. **API errors:** Alert if >10 errors/min
2. **Rate limits:** Alert if Airtable 429 rate limiting occurs
3. **Cold starts:** Alert if function cold start > 5 seconds
4. **Response time:** Alert if p95 latency > 2 seconds

### Daily Checklist
- [ ] No new Sentry errors
- [ ] Airtable rate limiting incidents: 0
- [ ] API response times nominal
- [ ] Booking system: working (test submission)
- [ ] Dashboard: data updating (check timestamps)

---

## Summary

**Current Status:** 🔴 Not Ready  
**Blockers:** 7 (deadlock, TS errors, ESLint errors, middleware, env vars, API resilience, tests)  
**Estimated Stabilization:** 1-2 weeks  
**Risk Level:** MEDIUM → LOW (after stabilization)

**Next Action:** Resolve filesystem deadlock, then follow checklist above.

---

## References

- **Build Results:** See `07-build-test-results.md`
- **Architecture:** See `01-route-matrix.md`, `02-dashboard-map.md`
- **Auth:** See `03-auth-security-map.md`
- **Integrations:** See `05-integrations-map.md`
- **AI Engines:** See `06-ai-engines-map.md`

---

**Prepared:** 2026-04-07 | **Audit ID:** RBC-VERCEL-20260407  
**For Deployment:** Contact DevOps with checklist status
