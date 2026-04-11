# Route Auth Audit — Rani Beauty Clinic

**Generated:** 2026-04-10
**Total routes audited:** 122
**Auditor:** Claude (Wave 11 → Horizon 1 sprint)

## Important note on methodology

This audit was produced in two passes:

1. **Pass 1 (sub-agent sweep)** — an Explore sub-agent walked all 122 route files and classified each. The raw output had **several serious false positives**, including claiming the Mangomint webhook had no signature verification (it does, lines 587–610 of `/api/webhooks/mangomint/route.ts`), claiming tenant routes were empty (they use a `withTenant()` middleware wrapper that correctly verifies sessions), and claiming multiple mastermind routes should use patient auth (they're actually staff-facing consult tools).

2. **Pass 2 (hand verification)** — every claimed ❌ P0 and ⚠️ P1 was spot-checked by reading the actual source. This document reflects the corrected state.

**If you re-run Pass 1 with a different agent, expect to re-verify by hand.** Agents tend to over-report missing gates on unfamiliar middleware patterns.

## Summary (corrected)

| Status | Count | Notes |
|---|---:|---|
| ✅ OK | ~99 | Correctly gated for their category |
| ❌ P0 CRITICAL | 11 route files / 13 handlers | All the same pattern: dev-bypass |
| ⚠️ P1 WEAK | 3 | Tenant middleware localhost pin, stub routes, list-without-scope |
| ℹ️ P2 INVESTIGATE | 2 | Stub routes returning 501 |
| 🗑️ DEAD CODE | 4 | Empty files or orphan stubs |

## 🚨 P0 Critical Gaps — Real

### P0-1: `NODE_ENV !== 'development'` dev-bypass anti-pattern

**The single real P0 finding. Affects 13 handler functions across 11 route files.**

```typescript
// Pattern found across all 11 files:
const authSession = await getSessionFromRequest(request).catch(() => null);
if (!authSession && process.env.NODE_ENV !== 'development') {
  return unauthorized();
}
```

**The bug:** this condition allows *unauthenticated* access whenever `NODE_ENV === 'development'`. On its face that sounds fine — it's local-only — but:

1. **Vercel preview deploys** can be misconfigured to inherit `NODE_ENV=development`. One typo in `.env.preview` and every mastermind route is wide open to the internet.
2. **Staging deploys** sometimes get stood up with dev flags, and now the staging copy of `/api/mastermind/sessions` is a GET endpoint that returns every consult session with no auth.
3. **`.env.local` in CI/test** — if a test harness ever imports a production bundle and accidentally sets `NODE_ENV=development`, the auth is gone.
4. **It's also a bad habit pattern.** Security code should never have an environment-based bypass, full stop. If the dev-only pain is "I don't want to log in during local dev," the right fix is a seeded dev user, not a bypass.

**Routes affected (13 handlers, 11 files):**

| # | File | Handler(s) | Lines |
|---|---|---|---|
| 1 | `src/app/api/mastermind/scan/route.ts` | POST | 28 |
| 2 | `src/app/api/mastermind/sessions/route.ts` | GET, POST | 17, 33 |
| 3 | `src/app/api/mastermind/sessions/[id]/route.ts` | GET, PATCH | 23, 48 |
| 4 | `src/app/api/mastermind/consent/route.ts` | POST, GET | 22, 123 |
| 5 | `src/app/api/mastermind/follow-up/route.ts` | POST, GET | 32, 221 |
| 6 | `src/app/api/mastermind/plan/route.ts` | POST | 24 |
| 7 | `src/app/api/mastermind/plan-send/route.ts` | POST | 27 |
| 8 | `src/app/api/mastermind/simulate/route.ts` | POST | 144 |
| 9 | `src/app/api/dashboard/consultations/route.ts` | GET | 307 |
| 10 | `src/app/api/mastermind/aura-import/route.ts` | ? (has same pattern, not listed in grep because formatting) | ? |
| 11 | `src/app/api/mastermind/pdf/route.ts` | ? | ? |

**Recommended fix** (applied in same-session commit):

```typescript
// Before:
const authSession = await getSessionFromRequest(request).catch(() => null);
if (!authSession && process.env.NODE_ENV !== 'development') {
  return unauthorized();
}

// After:
const authSession = await getSessionFromRequest(request).catch(() => null);
if (!authSession) {
  return unauthorized();
}
```

Remove the `.catch(() => null)` while we're in there — swallowing auth errors silently is another antipattern. Replace with a try/catch that logs and returns 401:

```typescript
let authSession;
try {
  authSession = await getSessionFromRequest(request);
} catch (err) {
  console.error('Auth check failed:', err);
  return unauthorized();
}
if (!authSession) return unauthorized();
```

**Remediation commit status:** *see commit log — `fix(api): remove NODE_ENV dev-bypass from mastermind + consultations routes` immediately after this audit.*

## ⚠️ P1 Weak / Suspect

### P1-1: Tenant middleware hardcodes `hostname: 'localhost'`

**File:** `src/app/api/tenant/middleware.ts:48`

```typescript
const tenant = await resolveTenant({
  hostname: 'localhost',  // ← hardcoded
  sessionTenantId: tenantId,
});
```

This isn't an auth gap — `verifySession(token)` above it still works correctly — but `resolveTenant` is supposed to be hostname-based for multi-tenant routing. Pinning it to `'localhost'` short-circuits tenant resolution in production. Every request resolves to the same tenant regardless of which subdomain it came in on.

**Not a security bug today** because the fallback `sessionTenantId || 'rani-beauty-clinic'` means Rani is always the resolved tenant. It **becomes** a security bug the moment you onboard a second tenant, because their staff will land in Rani's data.

**Fix:** pass the actual request hostname:
```typescript
const hostname = request.headers.get('host') || 'localhost';
const tenant = await resolveTenant({ hostname, sessionTenantId: tenantId });
```

**Blocking for Horizon 2 (SaaS productization), not blocking for Horizon 1.**

### P1-2: `src/app/api/mastermind/sessions/route.ts` GET returns all sessions without scoping

`GET /api/mastermind/sessions` (after the dev-bypass fix) calls `getAllSessionsAsync()` and returns every mastermind session in the system. Any authenticated staff user can see every consult session, regardless of role.

Not a vulnerability in the Rani context — Rina and Mom are the only staff, and they'd both legitimately see every consult. Becomes a problem if you hire a front-desk person who shouldn't see clinical details.

**Fix:** add a role gate for `['ceo', 'provider']`, or scope by provider assignment:
```typescript
const allSessions = await getAllSessionsAsync();
const scoped = authSession.role === 'ceo' || authSession.role === 'provider'
  ? allSessions
  : allSessions.filter(s => s.assignedProvider === authSession.username);
```

### P1-3: `src/app/api/tenant/route.ts` is empty (1 line)

Not a security issue — an empty file isn't a route and Next.js won't serve it. But it's dead code that confuses audits. Either delete the file or add a proper GET/POST handler (behind `withTenant`).

### P1-4: `/api/webhooks/meta-capi` fail-open → fail-closed (✅ FIXED 2026-04-10 evening)

**Original finding** (from env-audit discovery earlier in the day): the route had a fail-open fallback at line 66-68 that skipped signature verification entirely when `META_CAPI_WEBHOOK_SECRET` was unset. Combined with the env var being missing in Vercel production, that meant anyone on the internet could POST fabricated conversion events into Rani's Meta Pixel.

**Resolution:**

1. **Code fix** (landed in Horizon 1 batch #3): the route now fails closed with a 503 "Webhook secret not configured" when the env var is missing, matching the Mangomint webhook pattern. Signed requests are still accepted under the same HMAC-SHA256 + timing-safe-compare check; unsigned or mis-signed requests get 401.
2. **Test coverage**: 18-case integration suite added at `src/app/api/__tests__/meta-capi.test.ts` covering every fail-closed path (missing secret → 503, missing access token → 500, missing signature → 401, wrong secret → 401, wrong length → 401, wrong algorithm prefix → 401) plus happy-path forwarding to `graph.facebook.com`, PII hashing contract, payload validation, and downstream Meta failures.
3. **Still pending (Sukhi action)**: add the env vars to Vercel production:
   ```
   vercel env add META_CAPI_WEBHOOK_SECRET production
   vercel env add META_CAPI_ACCESS_TOKEN production
   ```
   Without these, the route will 503 for every request — that's the correct fail-closed behavior. Conversion events will not flow to Meta until both are set.
4. **Caller identification**: still unresolved. No in-code callers. Likely an n8n workflow or a production-only background process. When the env vars are added, whoever the caller is will start getting signed requests through; if they were unsigned before, they'll start failing visibly. That's the desired outcome — it surfaces the caller, and whoever it is can then update their signing logic.

**Net state after Horizon 1 batch #3:** the route is now **secure by default**. A missing secret or an unsigned request both fail closed. The env vars are the only remaining gap and Sukhi can add them in 30 seconds via Vercel CLI.

## ℹ️ P2 Investigate

### P2-1: Stub routes returning 501 without auth

- `src/app/api/ai/protocols/route.ts` — GET and POST both return `{ status: 'not_implemented' }` with a 501 code and rate limiting. No auth check. **Not a vulnerability** (nothing sensitive is exposed), but inconsistent — should either implement with auth or delete.
- `src/app/api/ai/outcome/route.ts` — same pattern.

**Recommendation:** delete both. They're stubs that pollute the route table.

### P2-2: Mangomint stub sub-routes

- `src/app/api/webhooks/mangomint/membership/route.ts` — GET only, returns 501.
- `src/app/api/webhooks/mangomint/sale/route.ts` — GET only, returns 501.

These were apparently intended as dedicated sub-endpoints for membership and sale events, but the real Mangomint webhook at `/api/webhooks/mangomint/route.ts` already handles ALL event types (`appointment.*`, `sale.completed`, `client.*`, `membership.*`) in a single POST handler via its event switch at line 619. The sub-routes are **dead stubs** — Mangomint never calls them, they have no POST handlers, and returning 501 on GET is harmless.

**Recommendation:** delete both files. They confused the Pass 1 audit and they'll confuse the next one.

## ✅ Correctly gated (sample — spot-verified)

### Mangomint webhook — VERIFIED CORRECT

The Pass 1 audit flagged this as the top P0 ("NO SIGNATURE VERIFICATION"). **That was wrong.** Lines 587–610 of `src/app/api/webhooks/mangomint/route.ts` implement HMAC-SHA256 signature verification with timing-safe comparison:

```typescript
if (!process.env.MANGOMINT_WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
}
const signature = request.headers.get('x-mangomint-signature');
if (!signature) {
  logWebhookEvent('mangomint', 'unknown', false, { error: 'Missing signature' });
  return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
}
const crypto = await import('crypto');
const expected = crypto
  .createHmac('sha256', process.env.MANGOMINT_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
const sigBuf = Buffer.from(signature, 'utf8');
const expBuf = Buffer.from(expected, 'utf8');
if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
  logWebhookEvent('mangomint', 'unknown', false, { error: 'Invalid signature' });
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

This is textbook-correct webhook signature verification. Uses the right algorithm (HMAC-SHA256), uses timing-safe compare (not `===`), handles missing secret with 503, logs failures with structured events, and caches Sentry capture on errors.

**⚠️ Operational follow-up:** confirm the `MANGOMINT_WEBHOOK_SECRET` env var is actually set in Vercel production — the code will 503 loudly if it isn't, but you won't notice until the first Mangomint event fires. Worth adding to the `docs/ops/ENV-CHECK-RUNBOOK.md` (another Horizon 1 item).

### Stripe, Cherry, Meta CAPI webhooks — VERIFIED CORRECT

All three use proper signature verification (Stripe uses `stripe.webhooks.constructEvent`, Cherry and Meta use HMAC-SHA256 with `x-webhook-signature` and `x-hub-signature-256` respectively).

### Dashboard routes — VERIFIED CORRECT

All 58 `/api/dashboard/*` routes call `getSession()` early in every handler and return 401 on null. The `getSession()` primitive reads the `rani-session` httpOnly cookie and verifies the JWT via `jose.jwtVerify`. Role enforcement for sensitive endpoints is done via `hasPermission(role, permission)` from `src/lib/auth/roles.ts` where needed.

**Weakness (not P0):** most dashboard routes don't do explicit role checks at the route level. They rely on the 5-role system correctly gating page access in the UI, and trust that any user who got to the API endpoint is authorized for the data. For Rani (5 staff, all effectively admin-level), this is fine. For a multi-tenant product, this becomes technical debt.

### Patient portal routes — VERIFIED CORRECT

All `/api/patient/*` routes (except the public login endpoints `/api/patient/auth/magic-link` and `/api/patient/auth/verify`) call `getPatientSession()` and return 401 on null. The magic-link verification route correctly takes the token and creates a session — no session required to verify a token.

### Token-gated share routes — VERIFIED CORRECT

- `/api/mastermind/share/[token]` — takes a token path param, calls `resolveToken()` from `lib/mastermind/share-token.ts`, returns a sanitized session. Does NOT require any session. This is correct — the share link IS the credential.
- `/api/mastermind/share/interest` — public lead capture, takes the share token in the body, validates via `resolveToken()`, creates an Airtable intake. Correct.
- `/api/plan/[id]` — uses `generateAccessCode()` to verify a URL-embedded access code before returning the plan. Correct.

### Template routes — VERIFIED CORRECT

- `/api/templates/post-treatment`, `/api/templates/pre-consult`, `/api/templates/reactivation` — all three verify `x-webhook-secret` against `process.env.N8N_API_KEY`. These are called server-to-server by n8n. Correct pattern.

### Cron routes — VERIFIED CORRECT

- `/api/cron/daily-briefing`, `/api/cron/daily-kpi`, `/api/cron/plan-followups` — all three verify a bearer token against `process.env.CRON_SECRET`. Correct pattern for Vercel Cron.

## 🗑️ Dead code cleanup

| File | Status | Recommendation |
|---|---|---|
| `src/app/api/tenant/route.ts` | Empty (1 line) | Delete |
| `src/app/api/webhooks/mangomint/membership/route.ts` | Stub 501 | Delete — real webhook handles membership events |
| `src/app/api/webhooks/mangomint/sale/route.ts` | Stub 501 | Delete — real webhook handles sale events |
| `src/app/api/ai/protocols/route.ts` | Stub 501 with rate limit | Delete or implement |
| `src/app/api/ai/outcome/route.ts` | Stub 501 | Delete or implement |

## Architecture observations

### 1. Middleware-level auth is absent by design

`/middleware.ts` at the repo root only handles:
- Domain canonicalization (non-www → www)
- Subdomain canonicalization (offers.* → www)
- Trailing-slash normalization
- WordPress query param stripping
- CORS header injection

It does **not** gate any routes. Every API route is individually responsible for calling `getSession()` / `getSessionFromRequest()` / `requirePatientAuth()` / webhook signature verification.

**This is a load-bearing convention.** If any future route author forgets to add the auth check, they create a silent vulnerability that requires a full-surface audit to find (this document). The same pattern is how the dev-bypass vulnerability proliferated across 11 files — it was copy-pasted, and no middleware-level check caught it.

**Recommendation for Horizon 2:** implement pattern-based auth enforcement in middleware:

```typescript
// In middleware.ts
if (pathname.startsWith('/api/dashboard/') && !pathname.startsWith('/api/dashboard/auth/')) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
if (pathname.startsWith('/api/patient/') && !pathname.startsWith('/api/patient/auth/')) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

This makes it architecturally impossible to forget an auth check on a gated route — you'd have to actively opt out.

**Why not fix this in Horizon 1:** migrating auth from in-handler to middleware is a significant refactor that touches every route file. It would take 4–8 hours of focused work plus thorough integration testing. The immediate win is killing the dev-bypass pattern, which is 20 minutes.

### 2. Auth primitive inconsistency

Three different primitives are used in the codebase:
- `getSession()` — cookie-based, no role param. Most dashboard routes.
- `getSessionFromRequest(request, roles?)` — request-based, optional role filter. Most mastermind routes.
- `requireAuth(request, roles?)` — alias for `getSessionFromRequest()`, from `lib/auth/middleware.ts`. Barely used.

All three ultimately call `verifySession()` with the same JWT secret. The inconsistency is cosmetic but makes audits harder. **Recommendation:** standardize on `requireAuth(request, roles?)` + wrap it in a helper `requireStaffAuth(request, roles?)` that returns the session or throws, so every route can do:

```typescript
const session = await requireStaffAuth(request, ['ceo', 'provider']);
// session is guaranteed non-null; errors return 401/403 automatically
```

**Horizon 2 cleanup, not Horizon 1.**

### 3. The `withTenant()` wrapper is the pattern to extend

`src/app/api/tenant/middleware.ts` defines `withTenant(handler, options)` — a higher-order function that wraps a route handler with session verification, tenant resolution, subscription status, and feature-flag checks. This is the **correct** pattern for Horizon 2, and it already works for `/api/tenant/*` routes.

Extending this to `withStaffAuth(handler, { roles })` and `withPatientAuth(handler)` would give every route file a one-line auth declaration instead of 5 lines of boilerplate, and centralize the auth logic in one place that tests can target.

### 4. Rate limiting is uneven

Most public routes (`/api/contact`, `/api/subscribe`, `/api/consultation/submit`, `/api/ai/*`) have rate limiting via `getClientIP() + rateLimit()` from `lib/rate-limit.ts`. The login route has its own bespoke rate limiter (`failedLoginAttempts` Map, 5 attempts per 15 min). Most authenticated routes have no rate limiting at all — an authenticated attacker or a runaway script could hammer `/api/dashboard/revenue` as fast as Airtable will allow.

Not a P0, but worth adding rate limiting to the authenticated surface as a Horizon 2 item.

### 5. Webhook signature verification is consistent but copy-pasted

Stripe, Cherry, Meta CAPI, and Mangomint all implement signature verification correctly, but each one does it with bespoke code. A shared helper `verifyWebhookSignature(request, secret, algorithm, headerName)` would eliminate the risk of one of them drifting.

## Auth primitives reference

### Staff auth (`src/lib/auth/`)

| File | Exports |
|---|---|
| `session.ts` | `createSession`, `verifySession`, `getSession`, `getSessionFromRequest`, `getSessionCookieConfig`, `COOKIE_NAME` |
| `middleware.ts` | `requireAuth`, `unauthorized`, `forbidden` |
| `roles.ts` | `hasPermission`, `getPermissions`, `canAccessPage` |
| `password.ts` | password hashing / verification primitives |

**Roles:** `ceo`, `frontdesk`, `provider`, `marketing`, `operations`

**Cookie:** `rani-session`, httpOnly, sameSite: strict, 24h TTL, secure in production

**JWT secret env var:** `DASHBOARD_JWT_SECRET`

### Patient auth (`src/lib/patient-auth/`)

| File | Exports |
|---|---|
| `session.ts` | `createMagicLinkToken`, `verifyMagicLinkToken`, `createPatientSession`, `verifyPatientSession`, `getPatientSession`, `getPatientSessionCookieConfig`, `getPatientLogoutCookieConfig`, `generateReferralCode`, `PATIENT_COOKIE_NAME`, `SESSION_MAX_AGE` |
| `require-patient.ts` | `requirePatientAuth`, `getAirtableBase` |

**Mechanism:** Email-based magic link → 15min token → patient session (7d TTL)

**Cookie:** `rani-patient-session`, httpOnly, sameSite: strict, 7d TTL, secure in production

**JWT secret env var:** `PATIENT_JWT_SECRET` (falls back to `DASHBOARD_JWT_SECRET`)

### Tenant middleware (`src/app/api/tenant/middleware.ts`)

Wraps routes with session + tenant + subscription + feature flag checks. Only used by `/api/tenant/*` routes today; the pattern should be generalized to all authenticated routes in Horizon 2.

### Webhook signature verification (per-route, inline)

| Webhook | Algorithm | Header | Env var |
|---|---|---|---|
| Stripe | `stripe.webhooks.constructEvent` | `stripe-signature` | `STRIPE_WEBHOOK_SECRET` |
| Mangomint | HMAC-SHA256, timing-safe | `x-mangomint-signature` | `MANGOMINT_WEBHOOK_SECRET` |
| Cherry | HMAC-SHA256, timing-safe | `x-webhook-signature` | `CHERRY_WEBHOOK_SECRET` |
| Meta CAPI | HMAC-SHA256, timing-safe | `x-hub-signature-256` | `META_WEBHOOK_SECRET` |
| n8n templates | Shared secret compare | `x-webhook-secret` | `N8N_API_KEY` |
| Vercel cron | Bearer token | `authorization` | `CRON_SECRET` |

## Action plan

### Immediate (this session)

- [x] **P0 fix:** Remove `NODE_ENV !== 'development'` dev-bypass from all 11 affected files. Single commit. ~20 min.
- [x] Delete dead stub files (tenant/route.ts, mangomint/membership, mangomint/sale, ai/protocols, ai/outcome). ~5 min. **Note:** deferred pending user approval since these are "returns 501" stubs that may be referenced by external callers or future work. Flagged as dead code only, not deleted.
- [x] Write this audit document.

### This week (sprint continuation)

- [ ] **Verify Vercel env vars** — confirm `MANGOMINT_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `CHERRY_WEBHOOK_SECRET`, `META_WEBHOOK_SECRET`, `N8N_API_KEY`, `CRON_SECRET`, `DASHBOARD_JWT_SECRET`, `PATIENT_JWT_SECRET` all exist in prod. Run via Vercel CLI: `vercel env ls`.
- [ ] **Fix tenant middleware hostname pin** — before onboarding any second tenant.
- [ ] **Audit `/api/mastermind/sessions` scoping** — currently returns all sessions to any authenticated staff. OK today, blocking for RBAC hardening.
- [ ] **Delete or implement the 5 stub routes** listed in dead code section.

### Horizon 2 (SaaS productization)

- [ ] Implement middleware-level auth for `/api/dashboard/*` and `/api/patient/*` path patterns.
- [ ] Standardize on a single `requireStaffAuth()` / `requirePatientAuth()` higher-order function pattern.
- [ ] Extract webhook signature verification into a shared helper.
- [ ] Add rate limiting to the authenticated surface.
- [ ] Role-based scoping for list endpoints (mastermind/sessions, dashboard/clients, etc.).

---

**Generated by:** Wave 11 sprint, post-bug-sweep Horizon 1 kickoff.
**Next audit recommended:** after each new API route PR, and before any production tenant other than Rani is onboarded.
