# Claude Code Fix Prompts: Surgical Fixes in Priority Order

## Overview

This document contains 12 copy-paste-ready prompts for Claude Code to fix critical stability and security issues in the Rani Beauty Clinic codebase. Each prompt is self-contained and can be executed independently or in sequence. Prompts are ordered by priority and risk profile.

**How to Use**: Copy a prompt entirely (including the goal, files, acceptance tests, etc.) and paste it into a Claude Code session. Update file paths as needed. Do NOT modify the acceptance tests without consulting the team.

---

## Prompt 1: Generate package-lock.json & Verify Clean Install

**Priority**: 1 (CRITICAL)  
**Risk Rating**: LOW  
**Estimated Effort**: 1-2 hours  
**Owner**: Claude Code

### Goal
Generate a deterministic `package-lock.json` from the current `package.json`, commit it, and verify that a clean install produces an identical node_modules tree.

### Files to Inspect
- `/package.json` — current dependencies
- `/package-lock.json` — (does not exist yet)
- `/node_modules/` — current install (to compare before/after)

### Files Allowed to Edit
- `/package-lock.json` — create new file
- `/src/lib/` — (if dependency upgrades required)
- Any config files needed for install (tsconfig.json, babel config, etc.)

### Files NOT Allowed to Edit
- **DO NOT modify** `.gitignore`, `.env`, or any secrets
- **DO NOT modify** `next.config.js` or core middleware files yet (Phase 0.5)
- **DO NOT remove** any dependencies without explicit approval

### Implementation Steps

1. **Clean install**:
   ```bash
   rm -rf node_modules
   npm ci --legacy-peer-deps 2>&1
   ```
   (Use `--legacy-peer-deps` only if npm 7+ enforces strict peer dep checking)

2. **Generate lock file**:
   ```bash
   npm install --package-lock-only
   ```

3. **Verify audit**:
   ```bash
   npm audit --audit-level=moderate
   ```
   Accept only CRITICAL/HIGH severity issues that block the build. Document low/moderate in AUDIT_LOG.md.

4. **Test determinism**:
   ```bash
   rm -rf node_modules
   npm ci
   # Compare checksums
   find node_modules -type f | sort | xargs md5sum > /tmp/before.txt
   rm -rf node_modules
   npm ci
   find node_modules -type f | sort | xargs md5sum > /tmp/after.txt
   diff /tmp/before.txt /tmp/after.txt
   ```
   (Expect: no diff, indicating deterministic install)

5. **Commit**:
   ```bash
   git add package-lock.json
   git commit -m "build: add package-lock.json for deterministic installs"
   ```

### Acceptance Tests

- [ ] `package-lock.json` exists in repo root
- [ ] `npm audit` passes (no CRITICAL/HIGH blockers)
- [ ] `npm ci` completes without warnings or errors
- [ ] Second `npm ci` produces identical node_modules (verified by checksum diff)
- [ ] `npm run build` succeeds (compiles without errors)
- [ ] No new console warnings during build

### Rollback Notes

If install fails with peer dependency conflicts:
```bash
git revert HEAD
npm install --legacy-peer-deps
```

If build breaks after lock file commit:
1. Identify the breaking package with `npm list <package-name>`
2. Downgrade in package.json: `npm install --save <package-name>@<older-version>`
3. Re-run lock file generation

### Success Metrics

- Lock file committed, deterministic installs working
- Zero unplanned peer dependency breakages
- Build time unchanged (no performance regression)

---

## Prompt 2: Consolidate Middleware Files into One

**Priority**: 2 (CRITICAL)  
**Risk Rating**: MEDIUM  
**Estimated Effort**: 2-3 hours  
**Owner**: Claude Code

### Goal
Identify and consolidate two conflicting middleware files into a single `src/middleware.ts`, preserving all auth logic, RBAC enforcement, and route protection.

### Files to Inspect
- `/src/middleware.ts` — primary middleware (inspect for auth logic, RBAC)
- `/src/app/middleware.ts` — secondary/duplicate middleware (if exists)
- `/src/app/api/` — sample routes to understand middleware expectations
- `/next.config.js` — middleware configuration

### Files Allowed to Edit
- `/src/middleware.ts` — consolidate logic here
- `/src/app/middleware.ts` — delete after consolidation (if duplicate)
- `/next.config.js` — update middleware path if needed

### Files NOT Allowed to Edit
- **DO NOT modify** auth provider configs (NextAuth, JWT secret, etc.)
- **DO NOT modify** role definitions or permission matrices
- **DO NOT modify** API route signatures yet (that's Phase 1)

### Implementation Steps

1. **Identify both middleware files**:
   - List all `middleware.ts` files in the project
   - Compare their logic; note any conflicts or redundancy

2. **Extract auth logic**:
   From both files, identify:
   - JWT validation logic
   - Session verification
   - RBAC enforcement (5 roles: ceo, frontdesk, provider, marketing, operations)
   - Route protection patterns

3. **Consolidate into single middleware**:
   ```typescript
   // src/middleware.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { jwtVerify } from 'jose';
   
   const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
   
   const ROLE_ROUTES = {
     ceo: ['/api/dashboard/financial', '/api/dashboard/settings'],
     frontdesk: ['/api/dashboard/appointments', '/api/dashboard/clients'],
     provider: ['/api/dashboard/treatments', '/api/dashboard/schedule'],
     marketing: ['/api/dashboard/campaigns', '/api/dashboard/analytics'],
     operations: ['/api/dashboard/inventory', '/api/dashboard/reporting'],
   };
   
   export async function middleware(request: NextRequest) {
     const pathname = request.nextUrl.pathname;
   
     // Skip middleware for public routes
     if (pathname.startsWith('/_next') || pathname.startsWith('/api/public')) {
       return NextResponse.next();
     }
   
     // Dashboard routes require auth
     if (pathname.startsWith('/api/dashboard')) {
       const token = request.headers.get('authorization')?.replace('Bearer ', '');
       if (!token) return new NextResponse('Unauthorized', { status: 401 });
   
       try {
         const verified = await jwtVerify(token, secret);
         const role = verified.payload.role;
   
         // Check role-based access
         const allowed = ROLE_ROUTES[role] || [];
         if (!allowed.some(route => pathname.startsWith(route))) {
           return new NextResponse('Forbidden', { status: 403 });
         }
       } catch (err) {
         return new NextResponse('Invalid token', { status: 401 });
       }
     }
   
     return NextResponse.next();
   }
   
   export const config = {
     matcher: ['/api/dashboard/:path*', '/api/patient/:path*'],
   };
   ```

4. **Delete duplicate middleware** (if exists):
   ```bash
   rm /src/app/middleware.ts
   ```

5. **Test middleware**:
   - Start dev server: `npm run dev`
   - Call `/api/dashboard/*` without auth header → expect 401
   - Call with invalid token → expect 401
   - Call with valid token + correct role → expect request to proceed
   - Call with valid token + wrong role → expect 403

6. **Verify no more conflicts**:
   ```bash
   find . -name "middleware.ts" -o -name "middleware.js" | grep -v node_modules
   # Expect: only src/middleware.ts listed
   ```

### Acceptance Tests

- [ ] Only one `src/middleware.ts` exists (no duplicate in `src/app/`)
- [ ] Unauthenticated dashboard requests return 401
- [ ] Invalid JWT tokens return 401
- [ ] Valid tokens with correct role proceed (200)
- [ ] Valid tokens with wrong role return 403
- [ ] Public routes (public API, health check) skip middleware
- [ ] All 5 roles tested; no auth loops or hangs
- [ ] Dev server starts without middleware warnings

### Rollback Notes

```bash
# If consolidated middleware breaks a role:
git show HEAD:src/middleware.ts > /tmp/backup.ts
git log --oneline | head -5  # find commit before consolidation
git checkout <commit-before-change> -- src/middleware.ts
npm run dev  # verify old behavior
# Then merge carefully; may need role-specific exceptions
```

### Success Metrics

- Single middleware file in use
- All auth flows functional
- Zero "middleware conflict" errors in logs
- RBAC consistently enforced across all routes

---

## Prompt 3: Re-enable TypeScript Checking & Fix Critical Errors

**Priority**: 3 (CRITICAL)  
**Risk Rating**: MEDIUM  
**Estimated Effort**: 4-6 hours  
**Owner**: Claude Code

### Goal
Re-enable TypeScript type checking in the build pipeline (currently disabled with `typescript.tscErrorIgnore`), identify all type errors, and fix only those that break at runtime or affect critical paths (auth, API, AI).

### Files to Inspect
- `/next.config.js` — search for `typescript: { ignoreBuildErrors: true }`
- `/tsconfig.json` — check strict mode settings
- `/src/` — all TypeScript files (will be type-checked)
- `/src/middleware.ts`, `/src/app/api/` — critical paths

### Files Allowed to Edit
- `/next.config.js` — change `ignoreBuildErrors: false`
- Any `.ts/.tsx` files in `/src/` (to fix type errors)
- `tsconfig.json` — adjust strict mode if necessary (e.g., allow `any` for legacy code)

### Files NOT Allowed to Edit
- `/node_modules/` — do not modify dependencies
- `package.json` — do not add new dependencies without approval

### Implementation Steps

1. **Enable TypeScript in next.config.js**:
   ```javascript
   // next.config.js
   const nextConfig = {
     typescript: {
       ignoreBuildErrors: false, // CHANGED from true
       tscErrorIgnore: [], // remove any suppressed error codes
     },
     // ... rest of config
   };
   ```

2. **Run type check**:
   ```bash
   npm run type-check 2>&1 | tee /tmp/type-errors.txt
   # Count errors
   grep "error TS" /tmp/type-errors.txt | wc -l
   ```

3. **Triage errors**:
   Categorize by severity:
   - **CRITICAL** (fix immediately): Auth types, API response schemas, AI engine inputs
   - **HIGH** (fix before deploy): Component prop types, Airtable schema mismatches
   - **MEDIUM** (can defer): Utility function types, internal helper returns
   - **LOW** (suppress if necessary): Legacy any casts, third-party typing issues

   **Rule of Thumb**: Fix any error that could cause runtime failure (missing null checks, wrong API call signatures, incorrect role checks).

4. **Fix critical errors**:
   For each critical type error:
   - Identify the line number
   - Understand the type mismatch
   - Apply fix:
     ```typescript
     // Example: missing null check
     // BEFORE (type error):
     const role = user.role.toLowerCase(); // error: Object is possibly 'null'
     
     // AFTER (fixed):
     const role = user?.role?.toLowerCase() || 'guest';
     ```

5. **Allow LOW-severity suppression**:
   For errors that don't affect runtime, suppress locally:
   ```typescript
   // @ts-expect-error: Legacy API response shape
   const result = apiCall() as LegacyType;
   ```

6. **Run type check again**:
   ```bash
   npm run type-check
   # Should show: "✓ 0 errors" or only LOW-severity suppressions
   ```

7. **Verify build**:
   ```bash
   npm run build
   # Expect: no TS errors, only warnings (if any)
   ```

### Acceptance Tests

- [ ] `npm run type-check` exits 0 (no critical errors)
- [ ] `/src/middleware.ts` is fully typed (no `any` in auth logic)
- [ ] `/src/app/api/` routes have typed request/response
- [ ] All Airtable schema types match actual field names
- [ ] All Claude API calls have typed inputs/outputs
- [ ] `npm run build` succeeds; no TypeScript warnings in stdout
- [ ] No `@ts-expect-error` suppression in auth or financial routes
- [ ] Existing tests still pass (if test runner exists)

### Rollback Notes

If too many type errors make progress difficult:
```bash
# Revert to lenient mode temporarily:
git checkout HEAD -- next.config.js
npm run build  # verify old behavior works
# Then incrementally fix errors one file at a time
```

If a type fix breaks runtime behavior:
```bash
git diff <file>  # see what changed
npm run dev  # test locally
# Revert if needed: git checkout -- <file>
```

### Success Metrics

- `npm run type-check` returns 0 errors
- Build time unchanged or improved
- Zero new runtime errors after type fixes
- All auth flows still functional

---

## Prompt 4: Add Auth Wrapper to All Unprotected Dashboard API Routes

**Priority**: 4 (CRITICAL)  
**Risk Rating**: MEDIUM  
**Estimated Effort**: 8-10 hours  
**Owner**: Claude Code

### Goal
Audit all 88 dashboard API routes (`/api/dashboard/*`), identify those lacking auth protection, and wrap them with a reusable auth middleware that enforces valid JWT token + role-based access control.

### Files to Inspect
- `/src/app/api/dashboard/` — all dashboard routes (88 total)
- `/src/middleware.ts` — existing auth logic (from Prompt 2)
- `/src/lib/auth/` — auth helper functions
- `/docs/codex-handoff/03-auth-security-map.md` — current auth coverage

### Files Allowed to Edit
- Any file in `/src/app/api/dashboard/`
- `/src/lib/auth/` — create/update helpers as needed
- Create `/src/lib/auth/withAuth.ts` — reusable wrapper

### Files NOT Allowed to Edit
- `/src/middleware.ts` — already consolidated in Prompt 2
- JWT secret or role definitions
- Any routes outside `/api/dashboard/`

### Implementation Steps

1. **Create auth wrapper**:
   ```typescript
   // src/lib/auth/withAuth.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { jwtVerify } from 'jose';
   
   const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
   
   export interface AuthContext {
     userId: string;
     role: 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';
     clinicId: string;
   }
   
   export async function withAuth(
     req: NextRequest,
     allowedRoles?: string[],
   ): Promise<{ auth: AuthContext } | NextResponse> {
     try {
       const authHeader = req.headers.get('authorization');
       if (!authHeader?.startsWith('Bearer ')) {
         return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
       }
   
       const token = authHeader.slice(7);
       const verified = await jwtVerify(token, secret);
       const auth = verified.payload as unknown as AuthContext;
   
       if (allowedRoles && !allowedRoles.includes(auth.role)) {
         return NextResponse.json(
           { error: `This action requires one of roles: ${allowedRoles.join(', ')}` },
           { status: 403 },
         );
       }
   
       return { auth };
     } catch (err) {
       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
     }
   }
   ```

2. **Audit all dashboard routes**:
   ```bash
   find /src/app/api/dashboard -name "route.ts" -o -name "route.js" | wc -l
   # Expect: ~88 routes
   # For each route, check: does it call withAuth()?
   ```

3. **Update routes to use wrapper**:
   ```typescript
   // src/app/api/dashboard/clients/route.ts (BEFORE: no auth)
   export async function GET(req: NextRequest) {
     const clients = await getClientsFromAirtable();
     return Response.json(clients);
   }
   
   // AFTER: with auth wrapper
   export async function GET(req: NextRequest) {
     const authResult = await withAuth(req, ['ceo', 'frontdesk']);
     if (authResult instanceof NextResponse) return authResult; // auth failed
     const { auth } = authResult;
   
     const clients = await getClientsFromAirtable(auth.clinicId);
     return Response.json(clients);
   }
   ```

4. **Verify all routes protected**:
   ```bash
   grep -r "export async function" /src/app/api/dashboard \
     | grep -v "withAuth" \
     | wc -l
   # Expect: 0 (all routes use withAuth)
   ```

5. **Test auth enforcement**:
   ```bash
   # Test 1: No auth header
   curl -X GET http://localhost:3000/api/dashboard/clients
   # Expect: 401 Unauthorized
   
   # Test 2: Invalid token
   curl -X GET \
     -H "Authorization: Bearer invalid" \
     http://localhost:3000/api/dashboard/clients
   # Expect: 401 Invalid token
   
   # Test 3: Valid token, wrong role (provider instead of ceo)
   curl -X GET \
     -H "Authorization: Bearer <provider-token>" \
     http://localhost:3000/api/dashboard/financial-report
   # Expect: 403 Forbidden
   
   # Test 4: Valid token, correct role
   curl -X GET \
     -H "Authorization: Bearer <ceo-token>" \
     http://localhost:3000/api/dashboard/clients
   # Expect: 200 with client data
   ```

6. **Add logging**:
   For each protected route, log auth events:
   ```typescript
   console.log(`[AUTH] ${auth.role} accessed ${req.nextUrl.pathname}`);
   ```
   (Useful for compliance audits)

### Acceptance Tests

- [ ] All 88 dashboard routes checked; 0 found without withAuth
- [ ] Unauthenticated requests return 401
- [ ] Invalid tokens return 401
- [ ] Valid tokens with correct role return 200
- [ ] Valid tokens with wrong role return 403
- [ ] All 5 roles tested; no false positives
- [ ] Auth failures logged with timestamp + user info
- [ ] Dev server starts without auth-related warnings
- [ ] No performance regression (auth adds <10ms per request)

### Rollback Notes

If auth wrapper causes widespread failures:
```bash
git revert HEAD  # undo all changes
npm run dev
# Then apply wrapper one route at a time; merge gradually
```

If specific route needs exception (e.g., health check):
```typescript
// Allow unauthenticated health check
export async function GET(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/dashboard/health') {
    return Response.json({ status: 'ok' });
  }
  // ... require auth for all other routes
}
```

### Success Metrics

- All 88 dashboard routes enforce auth
- Zero unintended 401 errors on authenticated requests
- Zero auth bypass vulnerabilities
- Logging shows 100% of auth events captured

---

## Prompt 5: Add Rate Limiting to AI Routes (/api/ai/*)

**Priority**: 5 (HIGH)  
**Risk Rating**: LOW  
**Estimated Effort**: 3-4 hours  
**Owner**: Claude Code

### Goal
Implement per-user and per-IP rate limiting on all AI endpoints to prevent abuse and manage costs from Claude API calls.

### Files to Inspect
- `/src/app/api/ai/` — all AI routes (chatbot, copilot, generators, etc.)
- `/src/lib/ai/` — AI engine implementations
- `/src/lib/cache/` — existing caching layer (if present)
- Environment variables: `REDIS_URL` or similar (for distributed rate limiting)

### Files Allowed to Edit
- Any file in `/src/app/api/ai/`
- Create `/src/lib/ai/rateLimiter.ts` — rate limiting helper
- Update environment variable docs

### Files NOT Allowed to Edit
- `/src/lib/ai/` — core AI engines (no logic changes)
- Payment/billing logic
- Airtable schema

### Implementation Steps

1. **Create rate limiter**:
   ```typescript
   // src/lib/ai/rateLimiter.ts
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';
   
   const redis = new Redis({
     url: process.env.REDIS_URL,
     token: process.env.REDIS_TOKEN,
   });
   
   // Per-user rate limiter: 10 requests per minute
   const userLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(10, '1 m'),
     analytics: true,
   });
   
   // Per-IP rate limiter: 100 requests per minute
   const ipLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(100, '1 m'),
     analytics: true,
   });
   
   export async function checkRateLimit(userId: string, clientIp: string) {
     const userKey = `ai:user:${userId}`;
     const ipKey = `ai:ip:${clientIp}`;
   
     const [userResult, ipResult] = await Promise.all([
       userLimiter.limit(userKey),
       ipLimiter.limit(ipKey),
     ]);
   
     if (!userResult.success) {
       return {
         allowed: false,
         reason: 'user_limit_exceeded',
         retryAfter: Math.ceil(userResult.resetAfter / 1000),
       };
     }
   
     if (!ipResult.success) {
       return {
         allowed: false,
         reason: 'ip_limit_exceeded',
         retryAfter: Math.ceil(ipResult.resetAfter / 1000),
       };
     }
   
     return {
       allowed: true,
       userRemaining: userResult.remaining,
       ipRemaining: ipResult.remaining,
     };
   }
   ```

2. **Apply to all AI routes**:
   ```typescript
   // src/app/api/ai/copilot/route.ts (BEFORE: no rate limiting)
   export async function POST(req: NextRequest) {
     const { message } = await req.json();
     const response = await copilot.chat(message);
     return Response.json(response);
   }
   
   // AFTER: with rate limiting
   export async function POST(req: NextRequest) {
     const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
     const auth = await withAuth(req);
     if (auth instanceof NextResponse) return auth;
   
     const limitCheck = await checkRateLimit(auth.auth.userId, clientIp);
     if (!limitCheck.allowed) {
       return Response.json(
         { error: limitCheck.reason, retryAfter: limitCheck.retryAfter },
         { status: 429, headers: { 'Retry-After': String(limitCheck.retryAfter) } },
       );
     }
   
     const { message } = await req.json();
     const response = await copilot.chat(message);
     return Response.json(
       response,
       {
         headers: {
           'X-RateLimit-Remaining': String(limitCheck.userRemaining),
           'X-RateLimit-Reset': String(Date.now() + limitCheck.retryAfter * 1000),
         },
       },
     );
   }
   ```

3. **Whitelist high-volume uses** (if needed):
   ```typescript
   // For scheduled jobs or internal tools that need higher limits
   const WHITELIST_IPS = [process.env.INTERNAL_IP];
   
   if (!WHITELIST_IPS.includes(clientIp)) {
     // Apply rate limit to external users only
     const limitCheck = await checkRateLimit(...);
   }
   ```

4. **Monitor rate limit hits**:
   Log whenever a user hits the limit:
   ```typescript
   if (!limitCheck.allowed) {
     console.warn(`[RATE_LIMIT] ${limitCheck.reason}: user=${auth.auth.userId}, ip=${clientIp}`);
     // Optionally alert if same user hits limit >5x in 1 hour
   }
   ```

5. **Test rate limiting**:
   ```bash
   # Test: User hits 10-request limit
   for i in {1..15}; do
     curl -X POST \
       -H "Authorization: Bearer <token>" \
       -H "Content-Type: application/json" \
       -d '{"message": "hello"}' \
       http://localhost:3000/api/ai/copilot
   done
   
   # Expect: first 10 requests return 200, requests 11-15 return 429
   # Check 'Retry-After' header
   ```

### Acceptance Tests

- [ ] All `/api/ai/*` routes enforce rate limiting
- [ ] Users hitting 10 req/min limit receive 429 response
- [ ] IPs hitting 100 req/min limit receive 429 response
- [ ] `Retry-After` header present on 429 responses
- [ ] `X-RateLimit-Remaining` header present on 200 responses
- [ ] Whitelist bypasses limits for internal IPs (if configured)
- [ ] Rate limit state persists across server restarts (Redis)
- [ ] Abuse alerts generated for >5 limit violations per user/hour
- [ ] No false positives for normal usage patterns

### Rollback Notes

If rate limiting breaks legitimate workflows:
```bash
git revert HEAD  # disable rate limiting
# Increase limits and try again:
# userLimiter: 10 → 20 requests per minute
# ipLimiter: 100 → 200 requests per minute
```

If Redis unavailable (Vercel KV down):
```typescript
// Fallback to in-memory rate limiting
const inMemoryLimiter = new Map();

export async function checkRateLimit(userId: string, clientIp: string) {
  const key = `${userId}:${clientIp}`;
  const count = (inMemoryLimiter.get(key) || 0) + 1;
  inMemoryLimiter.set(key, count);
  
  // Reset every minute
  setTimeout(() => inMemoryLimiter.delete(key), 60000);
  
  return count <= 10 ? { allowed: true } : { allowed: false };
}
```

### Success Metrics

- Zero abuse (>5 limit violations per user/day drops to <1)
- Claude API spend stable/predictable
- No false positives on legitimate user requests
- Rate limit headers standard + documented

---

## Prompt 6: Secure Webhook Routes (Add Signature Verification)

**Priority**: 6 (HIGH)  
**Risk Rating**: LOW  
**Estimated Effort**: 2-3 hours  
**Owner**: Claude Code

### Goal
Verify HMAC-SHA256 signatures on all incoming webhooks (n8n, Stripe, Mangomint, etc.) to ensure requests originate from trusted sources and have not been tampered with.

### Files to Inspect
- `/src/app/api/webhooks/` — all webhook routes
- `/src/lib/webhooks/` — webhook processing logic
- Environment variables: `N8N_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, etc.

### Files Allowed to Edit
- Any file in `/src/app/api/webhooks/`
- Create `/src/lib/webhooks/verifySignature.ts` — signature verification helper

### Files NOT Allowed to Edit
- Webhook secret management (don't expose secrets in logs)
- External service documentation/contracts

### Implementation Steps

1. **Create signature verifier**:
   ```typescript
   // src/lib/webhooks/verifySignature.ts
   import crypto from 'crypto';
   import { NextRequest } from 'next/server';
   
   export interface WebhookServiceConfig {
     name: string;
     secret: string;
     headerName: string; // 'x-n8n-signature', 'x-stripe-signature', etc.
     algorithm: 'sha256' | 'sha512'; // hash algorithm
   }
   
   export async function verifySignature(
     req: NextRequest,
     config: WebhookServiceConfig,
   ): Promise<{ valid: boolean; error?: string }> {
     const signature = req.headers.get(config.headerName);
     if (!signature) {
       return { valid: false, error: 'Missing signature header' };
     }
   
     const body = await req.text();
     const hmac = crypto.createHmac(config.algorithm, config.secret);
     hmac.update(body);
     const expectedSignature = hmac.digest('hex');
   
     // Constant-time comparison to prevent timing attacks
     const match = crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expectedSignature),
     );
   
     if (!match) {
       return { valid: false, error: 'Invalid signature' };
     }
   
     return { valid: true };
   }
   ```

2. **Update webhook routes to verify signatures**:
   ```typescript
   // src/app/api/webhooks/n8n/route.ts (BEFORE: no signature check)
   export async function POST(req: NextRequest) {
     const data = await req.json();
     await processN8nEvent(data);
     return Response.json({ success: true });
   }
   
   // AFTER: with signature verification
   import { verifySignature } from '@/lib/webhooks/verifySignature';
   
   export async function POST(req: NextRequest) {
     const verified = await verifySignature(req, {
       name: 'n8n',
       secret: process.env.N8N_WEBHOOK_SECRET || '',
       headerName: 'x-n8n-signature',
       algorithm: 'sha256',
     });
   
     if (!verified.valid) {
       console.warn(`[WEBHOOK] Invalid n8n signature: ${verified.error}`);
       return Response.json(
         { error: 'Unauthorized' },
         { status: 401 },
       );
     }
   
     const data = await req.json();
     await processN8nEvent(data);
     return Response.json({ success: true });
   }
   ```

3. **Apply to all webhook services**:
   - n8n webhooks: header `x-n8n-signature`
   - Stripe webhooks: header `stripe-signature` (special format)
   - Mangomint webhooks: check service docs for signature header
   - Others: identify service + header name

4. **Add webhook logging**:
   Log all webhook events (signed or unsigned) for audit trail:
   ```typescript
   console.log(`[WEBHOOK] ${config.name}: signature=${verified.valid}, timestamp=${Date.now()}`);
   ```

5. **Test signature verification**:
   ```bash
   # Test 1: Valid signature
   PAYLOAD='{"event": "test"}'
   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$N8N_WEBHOOK_SECRET" | cut -d' ' -f2)
   curl -X POST \
     -H "x-n8n-signature: $SIGNATURE" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD" \
     http://localhost:3000/api/webhooks/n8n
   # Expect: 200 success
   
   # Test 2: Invalid signature
   curl -X POST \
     -H "x-n8n-signature: invalid-signature" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD" \
     http://localhost:3000/api/webhooks/n8n
   # Expect: 401 Unauthorized
   ```

### Acceptance Tests

- [ ] All webhook routes verify incoming signatures
- [ ] Valid signatures accepted (200)
- [ ] Invalid/missing signatures rejected (401)
- [ ] Timing-safe comparison prevents timing attacks
- [ ] All webhook events logged for audit trail
- [ ] Secrets not logged or exposed in error messages
- [ ] No performance regression (<5ms overhead per webhook)

### Rollback Notes

If signature verification fails for a service:
```bash
# Check signature header name in service docs
# Update verifySignature call to match service spec
# Test with a sample webhook from the service

# Temporarily disable verification (for debugging only):
if (!verified.valid && process.env.DEBUG_WEBHOOKS === 'true') {
  console.warn('[DEBUG] Allowing unsigned webhook');
  // Continue processing
}
```

### Success Metrics

- Zero unauthorized webhook processing
- All webhook events logged and traceable
- No false rejections of legitimate webhooks
- External services (n8n, Stripe) confirm receipt success

---

## Prompt 7: Fix Airtable filterByFormula Injection Risks

**Priority**: 7 (HIGH)  
**Risk Rating**: MEDIUM  
**Estimated Effort**: 4-6 hours  
**Owner**: Claude Code

### Goal
Audit all Airtable queries for SQL-injection-like vulnerabilities in `filterByFormula` parameters, where user input is directly concatenated into formulas. Implement input sanitization and parameterized queries.

### Files to Inspect
- `/src/lib/airtable/` — Airtable client code
- `/src/lib/` — all files containing `filterByFormula`
- `/src/app/api/` — routes that accept user input and query Airtable
- `/docs/codex-handoff/04-airtable-map.md` — table schema

### Files Allowed to Edit
- Any file in `/src/lib/airtable/`
- Any file in `/src/app/api/` that constructs Airtable queries
- Create `/src/lib/airtable/sanitize.ts` — input sanitization helper

### Files NOT Allowed to Edit
- Airtable API client library (if external)
- Table schema definitions

### Implementation Steps

1. **Identify injection risks**:
   ```bash
   grep -r "filterByFormula" /src --include="*.ts" --include="*.tsx" | \
     grep -v "sanitize\|escapeFormula" | \
     head -20
   # Review each match for user input
   ```

2. **Create sanitization helper**:
   ```typescript
   // src/lib/airtable/sanitize.ts
   export function escapeFormulaString(str: string): string {
     // Airtable formulas use "" for escaping quotes
     return `"${str.replace(/"/g, '""')}"`;
   }
   
   export function sanitizeFilterInput(input: unknown): string {
     if (typeof input === 'string') {
       return escapeFormulaString(input);
     }
     if (typeof input === 'number') {
       return String(input);
     }
     if (typeof input === 'boolean') {
       return input ? 'TRUE()' : 'FALSE()';
     }
     throw new Error(`Cannot sanitize type: ${typeof input}`);
   }
   
   export function buildSafeFormula(
     field: string,
     operator: 'eq' | 'contains' | 'gt' | 'lt',
     value: unknown,
   ): string {
     const safeValue = sanitizeFilterInput(value);
     
     switch (operator) {
       case 'eq':
         return `{${field}} = ${safeValue}`;
       case 'contains':
         return `FIND(${safeValue}, {${field}}) > 0`;
       case 'gt':
         return `{${field}} > ${safeValue}`;
       case 'lt':
         return `{${field}} < ${safeValue}`;
       default:
         throw new Error(`Unknown operator: ${operator}`);
     }
   }
   ```

3. **Update all Airtable queries**:
   ```typescript
   // BEFORE: vulnerable to injection
   const name = req.query.name as string;
   const formula = `{Name} = "${name}"`; // DANGEROUS!
   const records = await airtable.list({ filterByFormula: formula });
   
   // AFTER: sanitized
   import { buildSafeFormula } from '@/lib/airtable/sanitize';
   
   const name = req.query.name as string;
   const formula = buildSafeFormula('Name', 'eq', name);
   const records = await airtable.list({ filterByFormula: formula });
   ```

4. **Test injection scenarios**:
   ```bash
   # Test 1: Normal name
   curl "http://localhost:3000/api/clients?name=Alice"
   # Expect: client "Alice" returned
   
   # Test 2: Name with quotes (injection attempt)
   curl "http://localhost:3000/api/clients?name=Alice%22%20OR%20%7BName%7D%20%3D%20%22"
   # Sanitization should escape quotes; expect: no injection, 0 results for malicious query
   
   # Test 3: Name with formula characters
   curl "http://localhost:3000/api/clients?name=}%20AND%20%7B"
   # Expect: literal search for "}  AND {"; no formula injection
   ```

5. **Audit complex queries**:
   For multi-field filters, use `buildSafeFormula` with `AND`/`OR`:
   ```typescript
   const formulas = [
     buildSafeFormula('Status', 'eq', 'Active'),
     buildSafeFormula('Name', 'contains', searchTerm),
   ];
   const combinedFormula = `AND(${formulas.join(', ')})`;
   ```

6. **Document safe patterns**:
   Create a guide in `/src/lib/airtable/README.md`:
   ```markdown
   # Safe Airtable Querying
   
   ## DO
   - Use `buildSafeFormula()` for all user-provided input
   - Use parameterized queries where possible
   - Validate input types before querying
   
   ## DON'T
   - Concatenate user input directly into formulas
   - Use template literals with variables in formulas
   - Trust `req.query` or `req.body` without sanitization
   ```

### Acceptance Tests

- [ ] All `filterByFormula` queries use `buildSafeFormula` or equivalent
- [ ] Normal queries work (no false positives)
- [ ] Injection attempts are sanitized (quotes escaped, special chars handled)
- [ ] No Airtable formula errors in logs
- [ ] Query performance unchanged (sanitization adds <1ms)
- [ ] Automated tests cover: normal strings, quoted strings, boolean, numbers

### Rollback Notes

If sanitization breaks legitimate queries:
```bash
# Review the buildSafeFormula implementation
# May need to adjust escaping rules per Airtable's formula syntax
# Test with Airtable docs: https://support.airtable.com/hc/en-us/articles/203255215-Formula-Field-Reference
```

### Success Metrics

- Zero injection vulnerabilities detected
- All Airtable queries logged with sanitized parameters
- Security audit passes for input validation
- No regressions in query accuracy/performance

---

## Prompt 8: Add Medical Disclaimer to Consult Copilot Responses

**Priority**: 8 (CRITICAL)  
**Risk Rating**: MEDIUM  
**Estimated Effort**: 2-4 hours  
**Owner**: Claude Code

### Goal
Add non-negotiable medical disclaimers to all AI-generated medical content, enforce provider review for certain queries, and log all interactions for compliance.

### Files to Inspect
- `/src/lib/ai/copilot.ts` or similar — consult copilot implementation
- `/src/app/api/ai/copilot/` — copilot API routes
- `/src/lib/ai/` — AI engine that detects medical questions

### Files Allowed to Edit
- `/src/lib/ai/copilot.ts` — add disclaimer logic
- `/src/app/api/ai/copilot/route.ts` — add logging
- Create `/src/lib/ai/disclaimers.ts` — disclaimer templates

### Files NOT Allowed to Edit
- Claude API prompts (until legal review)
- Medical content generators (modify only to add disclaimers)

### Implementation Steps

1. **Create disclaimer templates**:
   ```typescript
   // src/lib/ai/disclaimers.ts
   export const MEDICAL_DISCLAIMER = `
   ⚠️ **Medical Disclaimer**
   
   This information is AI-generated and is NOT a substitute for professional medical advice, diagnosis, or treatment. 
   Always consult a licensed healthcare provider before making any decisions about your health or treatment.
   
   For emergencies, please contact emergency services or visit the nearest emergency room.
   `;
   
   export const AI_CONTENT_WARNING = `
   This response was generated by an AI system. While we strive for accuracy, AI-generated content may contain errors.
   `;
   
   export function wrapWithDisclaimer(content: string, type: 'medical' | 'general'): string {
     const disclaimer = type === 'medical' ? MEDICAL_DISCLAIMER : AI_CONTENT_WARNING;
     return `${content}\n\n${disclaimer}`;
   }
   ```

2. **Add medical question detector**:
   ```typescript
   // src/lib/ai/detectMedicalQuestion.ts
   const MEDICAL_KEYWORDS = [
     'diagnosis', 'treatment', 'symptom', 'disease', 'medication',
     'allergy', 'injection', 'infusion', 'procedure', 'surgery',
     'pain', 'fever', 'bleeding', 'wound', 'infection',
   ];
   
   export function isMedicalQuestion(query: string): boolean {
     const lowerQuery = query.toLowerCase();
     return MEDICAL_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
   }
   ```

3. **Update copilot response handler**:
   ```typescript
   // src/lib/ai/copilot.ts (or similar)
   import { wrapWithDisclaimer, isMedicalQuestion } from '@/lib/ai/disclaimers';
   
   export async function generateCopilotResponse(
     userMessage: string,
     userId: string,
   ) {
     // Generate response from Claude API
     const response = await anthropic.messages.create({
       model: 'claude-opus-4',
       messages: [{ role: 'user', content: userMessage }],
     });
   
     const content = response.content[0].type === 'text' ? response.content[0].text : '';
   
     // Wrap with medical disclaimer if applicable
     const isMedical = isMedicalQuestion(userMessage);
     const finalContent = isMedical 
       ? wrapWithDisclaimer(content, 'medical')
       : wrapWithDisclaimer(content, 'general');
   
     // Log for compliance audit
     await logCopilotInteraction({
       userId,
       question: userMessage,
       response: finalContent,
       isMedicalContent: isMedical,
       timestamp: new Date(),
     });
   
     return finalContent;
   }
   ```

4. **Add logging to Airtable**:
   ```typescript
   // Log copilot queries for compliance
   async function logCopilotInteraction(data: {
     userId: string;
     question: string;
     response: string;
     isMedicalContent: boolean;
     timestamp: Date;
   }) {
     await airtable('CopilotLogs').create({
       fields: {
         'User ID': data.userId,
         'Question': data.question,
         'Response': data.response,
         'Medical Content': data.isMedicalContent,
         'Timestamp': data.timestamp.toISOString(),
       },
     });
   }
   ```

5. **Add opt-in consent (frontend)**:
   Patient must acknowledge disclaimer before using copilot:
   ```typescript
   export function CopilotConsentModal() {
     const [acknowledged, setAcknowledged] = useState(false);
   
     return (
       <div className="modal">
         <h2>Copilot Disclaimer</h2>
         <p>{MEDICAL_DISCLAIMER}</p>
         <label>
           <input
             type="checkbox"
             checked={acknowledged}
             onChange={e => setAcknowledged(e.target.checked)}
           />
           I understand this is not medical advice and will consult a licensed provider
         </label>
         <button disabled={!acknowledged}>Start Copilot</button>
       </div>
     );
   }
   ```

6. **Test disclaimer presence**:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"message": "What does a skin rash mean?"}' \
     http://localhost:3000/api/ai/copilot
   
   # Response should include medical disclaimer
   ```

### Acceptance Tests

- [ ] All copilot responses include disclaimer
- [ ] Medical questions detected and flagged
- [ ] All copilot interactions logged in Airtable
- [ ] Patient sees and acknowledges disclaimer before use
- [ ] Disclaimer is clear and non-skippable
- [ ] Response format compliant with HIPAA (no PII in logs)
- [ ] Opt-in consent stored with timestamp

### Rollback Notes

If disclaimer is too restrictive:
```bash
# Adjust disclaimer text (ensure legal review still)
# Test: user feedback on usability
# May need to move disclaimer to modal only (not inline with every response)
```

### Success Metrics

- Zero copilot queries without disclaimer
- Legal/medical team approves disclaimer text
- Patient compliance with opt-in >90%
- All queries logged and traceable for audit

---

## Prompt 9: Mark/Hide Stubbed Routes and Dashboard Pages

**Priority**: 9 (MEDIUM)  
**Risk Rating**: LOW  
**Estimated Effort**: 4-6 hours  
**Owner**: Claude Code

### Goal
Identify all stubbed/incomplete routes and dashboard pages, hide them from users with feature flags, and document what's needed to complete them.

### Files to Inspect
- `/src/app/api/` — check for `{ error: 'not implemented' }` responses
- `/src/app/(dashboard)/` — check for placeholder pages or broken links
- `/ROUTE_STATUS.json` — from Prompt 1 (route classifications)

### Files Allowed to Edit
- Any route or page that is stubbed
- Create `/src/lib/features.ts` — feature flag helper
- Create `STUBBED_FEATURES.md` — roadmap of incomplete features

### Files NOT Allowed to Edit
- Core business logic (don't stub critical routes)
- Database schema

### Implementation Steps

1. **Create feature flag helper**:
   ```typescript
   // src/lib/features.ts
   export interface FeatureFlags {
     ADVANCED_ANALYTICS: boolean;
     MULTI_CLINIC: boolean;
     VAPI_INTEGRATION: boolean;
     PHONE_AGENT: boolean;
     TELEHEALTH: boolean;
   }
   
   export function getFeatureFlags(): FeatureFlags {
     return {
       ADVANCED_ANALYTICS: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
       MULTI_CLINIC: process.env.FEATURE_MULTI_CLINIC === 'true',
       VAPI_INTEGRATION: process.env.FEATURE_VAPI_INTEGRATION === 'true',
       PHONE_AGENT: process.env.FEATURE_PHONE_AGENT === 'true',
       TELEHEALTH: process.env.FEATURE_TELEHEALTH === 'true',
     };
   }
   
   export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
     return getFeatureFlags()[feature];
   }
   ```

2. **Hide stubbed routes**:
   ```typescript
   // src/app/api/stubbed-feature/route.ts (BEFORE: exposed)
   export async function GET() {
     return Response.json({ error: 'not implemented yet' });
   }
   
   // AFTER: hidden by feature flag
   import { isFeatureEnabled } from '@/lib/features';
   
   export async function GET() {
     if (!isFeatureEnabled('ADVANCED_ANALYTICS')) {
       return Response.json({ error: 'Feature not available' }, { status: 404 });
     }
   
     // Implementation here
   }
   ```

3. **Hide stubbed dashboard pages**:
   ```typescript
   // src/app/(dashboard)/advanced-analytics/page.tsx (BEFORE: always shown)
   export default function AdvancedAnalyticsPage() {
     return <div>Analytics Dashboard</div>;
   }
   
   // AFTER: conditionally rendered
   import { isFeatureEnabled } from '@/lib/features';
   import { notFound } from 'next/navigation';
   
   export default function AdvancedAnalyticsPage() {
     if (!isFeatureEnabled('ADVANCED_ANALYTICS')) {
       notFound(); // Shows 404 page
     }
   
     return <div>Analytics Dashboard</div>;
   }
   ```

4. **Create roadmap document**:
   ```markdown
   # Stubbed Features Roadmap
   
   ## Features Hidden Behind Flags
   
   ### ADVANCED_ANALYTICS
   - Status: 70% complete
   - Pages: `/dashboard/advanced-analytics`
   - Routes: `/api/analytics/advanced/*`
   - What's Needed:
     - [ ] Chart rendering library (recharts or d3)
     - [ ] Historical data aggregation
     - [ ] Caching strategy for large datasets
   - Owner: TBD
   - Estimated: 2 weeks
   
   ### MULTI_CLINIC
   - Status: 20% complete
   - Routes: `/api/tenant/*`
   - What's Needed:
     - [ ] Data isolation by clinic_id
     - [ ] Clinic-specific branding
     - [ ] Billing per clinic
     - [ ] Staff role scoping
   - Owner: TBD
   - Estimated: 4 weeks
   
   ### VAPI_INTEGRATION
   - Status: 50% complete
   - Routes: `/api/ai/phone-agent`
   - What's Needed:
     - [ ] Call recording consent (TCPA)
     - [ ] Transcript logging
     - [ ] Callback success rate tracking
   - Owner: TBD
   - Estimated: 2 weeks
   ```

5. **Set environment variables**:
   In `.env.production`:
   ```
   FEATURE_ADVANCED_ANALYTICS=false
   FEATURE_MULTI_CLINIC=false
   FEATURE_VAPI_INTEGRATION=false
   FEATURE_PHONE_AGENT=false
   FEATURE_TELEHEALTH=false
   ```

6. **Update CI to check for stubs**:
   ```bash
   # scripts/check-stubs.sh
   #!/bin/bash
   
   # Fail if any routes return "not implemented"
   grep -r '"error": "not implemented' /src/app/api --include="*.ts" && \
     echo "ERROR: Found unimplemented routes" && exit 1
   
   # Check that all stubbed pages use feature flags
   grep -r "notFound\|FEATURE_" /src/app/dashboard --include="*.tsx" > /dev/null || \
     echo "WARNING: Some dashboard pages may not be feature-gated"
   
   exit 0
   ```

### Acceptance Tests

- [ ] All stubbed routes return 404 when feature flag is false
- [ ] Stubbed dashboard pages show 404 when feature flag is false
- [ ] Feature flags are environment variables (can change per deploy)
- [ ] Roadmap document lists all incomplete features
- [ ] Owner + timeline assigned for each stubbed feature
- [ ] CI check prevents accidental merge of "not implemented" responses

### Rollback Notes

If feature flags cause issues:
```bash
# Enable all features for debugging:
FEATURE_ADVANCED_ANALYTICS=true npm run dev

# Or selectively enable:
FEATURE_MULTI_CLINIC=true npm run dev
```

### Success Metrics

- Zero "not implemented" messages exposed to production users
- All stubbed features documented with roadmap
- New features use feature flags from the start
- Roadmap is updated weekly as work progresses

---

## Prompt 10: Create Health Check Endpoint Testing All External Services

**Priority**: 10 (MEDIUM)  
**Risk Rating**: LOW  
**Estimated Effort**: 3-4 hours  
**Owner**: Claude Code

### Goal
Build a comprehensive health check endpoint that tests all external service integrations (Airtable, Claude API, Stripe, Mangomint, Resend, n8n, Vapi, Pinecone) and returns their status.

### Files to Inspect
- `/src/app/api/health/` — check if health endpoint exists
- `/src/lib/` — service client implementations
- Environment variables: all API keys and service URLs

### Files Allowed to Edit
- Create `/src/app/api/health/route.ts` — health check endpoint
- Create `/src/lib/health/` — health check functions per service

### Files NOT Allowed to Edit
- Service client libraries themselves
- API key management

### Implementation Steps

1. **Create health check helper**:
   ```typescript
   // src/lib/health/checkServices.ts
   import Anthropic from '@anthropic-ai/sdk';
   import Airtable from 'airtable';
   import Stripe from 'stripe';
   
   interface ServiceStatus {
     service: string;
     status: 'ok' | 'degraded' | 'down';
     latency: number; // ms
     error?: string;
   }
   
   export async function checkAllServices(): Promise<ServiceStatus[]> {
     const results: ServiceStatus[] = [];
   
     // Airtable
     results.push(await checkAirtable());
   
     // Claude API
     results.push(await checkClaudeAPI());
   
     // Stripe
     results.push(await checkStripe());
   
     // Mangomint
     results.push(await checkMangomint());
   
     // Resend (email)
     results.push(await checkResend());
   
     // n8n
     results.push(await checkN8n());
   
     // Vapi
     results.push(await checkVapi());
   
     // Pinecone
     results.push(await checkPinecone());
   
     return results;
   }
   
   async function checkAirtable(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
         process.env.AIRTABLE_BASE_ID || '',
       );
       await base('Clients').select({ maxRecords: 1 }).firstPage();
       return {
         service: 'Airtable',
         status: 'ok',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Airtable',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkClaudeAPI(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const client = new Anthropic({
         apiKey: process.env.ANTHROPIC_API_KEY,
       });
       const response = await client.messages.create({
         model: 'claude-opus-4',
         max_tokens: 10,
         messages: [{ role: 'user', content: 'ok' }],
       });
       return {
         service: 'Claude API',
         status: response.stop_reason === 'end_turn' ? 'ok' : 'degraded',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Claude API',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkStripe(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
       await stripe.charges.list({ limit: 1 });
       return {
         service: 'Stripe',
         status: 'ok',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Stripe',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkMangomint(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const response = await fetch(
         `${process.env.MANGOMINT_API_URL}/clinics/${process.env.MANGOMINT_CLINIC_ID}`,
         {
           headers: { Authorization: `Bearer ${process.env.MANGOMINT_API_KEY}` },
         },
       );
       const ok = response.ok || response.status === 401; // 401 means API is up but auth failed
       return {
         service: 'Mangomint',
         status: ok ? 'ok' : 'down',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Mangomint',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkResend(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const response = await fetch('https://api.resend.com/emails', {
         method: 'GET',
         headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
       });
       return {
         service: 'Resend',
         status: response.ok ? 'ok' : 'down',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Resend',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkN8n(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const response = await fetch(
         `${process.env.N8N_BASE_URL}/api/v1/workflows`,
         {
           headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY || '' },
         },
       );
       return {
         service: 'n8n',
         status: response.ok ? 'ok' : 'down',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'n8n',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkVapi(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const response = await fetch('https://api.vapi.ai/call', {
         method: 'GET',
         headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
       });
       return {
         service: 'Vapi',
         status: response.status === 405 ? 'ok' : 'down', // 405 means service is up
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Vapi',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   
   async function checkPinecone(): Promise<ServiceStatus> {
     const start = Date.now();
     try {
       const response = await fetch(
         `https://api.pinecone.io/indexes`,
         {
           headers: { 'Api-Key': process.env.PINECONE_API_KEY || '' },
         },
       );
       return {
         service: 'Pinecone',
         status: response.ok ? 'ok' : 'down',
         latency: Date.now() - start,
       };
     } catch (err) {
       return {
         service: 'Pinecone',
         status: 'down',
         latency: Date.now() - start,
         error: String(err),
       };
     }
   }
   ```

2. **Create health check route**:
   ```typescript
   // src/app/api/health/route.ts
   import { checkAllServices } from '@/lib/health/checkServices';
   
   export async function GET() {
     const services = await Promise.all([checkAllServices()]);
     const allServices = services.flat();
   
     const overallStatus = allServices.every(s => s.status === 'ok') ? 'ok' : 'degraded';
     const hasDownServices = allServices.some(s => s.status === 'down');
   
     return Response.json(
       {
         status: hasDownServices ? 'down' : overallStatus,
         timestamp: new Date().toISOString(),
         services: allServices,
       },
       {
         status: hasDownServices ? 503 : 200,
       },
     );
   }
   ```

3. **Add to monitoring/alerting**:
   ```bash
   # Example: cron job to check health every 5 minutes
   */5 * * * * curl https://ranibeautyclinic.com/api/health >> /var/log/health-check.log 2>&1
   ```

4. **Test health endpoint**:
   ```bash
   curl http://localhost:3000/api/health | jq
   
   # Expected response:
   # {
   #   "status": "ok",
   #   "timestamp": "2026-04-07T12:00:00Z",
   #   "services": [
   #     { "service": "Airtable", "status": "ok", "latency": 150 },
   #     { "service": "Claude API", "status": "ok", "latency": 1200 },
   #     ...
   #   ]
   # }
   ```

### Acceptance Tests

- [ ] Health endpoint exists at `/api/health`
- [ ] Returns 200 if all services OK
- [ ] Returns 503 if any service DOWN
- [ ] Returns 200 with "degraded" status if services slow (>5sec latency)
- [ ] All 8 external services checked
- [ ] Latency measured for each service
- [ ] Endpoint completes in <15 seconds
- [ ] No authentication required (public endpoint for Vercel health checks)

### Rollback Notes

If health checks are too slow:
```bash
# Add timeouts to prevent hangs
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 5000)
);
Promise.race([checkService(), timeout]);
```

### Success Metrics

- Health endpoint integrated with Vercel monitoring
- Alerts triggered if any service down for >5 minutes
- Dashboard shows real-time service status
- <1% of health checks fail due to timeout

---

## Prompt 11: Add Error Boundaries to All Dashboard Pages

**Priority**: 11 (MEDIUM)  
**Risk Rating**: LOW  
**Estimated Effort**: 4-5 hours  
**Owner**: Claude Code

### Goal
Wrap all dashboard pages with React error boundaries to catch unhandled errors, prevent full-page crashes, and show recovery UI (error message + retry button).

### Files to Inspect
- `/src/app/(dashboard)/` — all dashboard pages
- `/src/components/` — check for existing error boundary components
- `/src/lib/errors.ts` — error handling utilities

### Files Allowed to Edit
- Any file in `/src/app/(dashboard)/`
- Create `/src/components/ErrorBoundary.tsx` — reusable error boundary
- Create `/src/components/PageErrorFallback.tsx` — error UI

### Files NOT Allowed to Edit
- Core API routes
- Airtable/third-party integrations

### Implementation Steps

1. **Create error boundary component**:
   ```typescript
   // src/components/ErrorBoundary.tsx
   'use client';
   
   import React, { ReactNode, ReactState, ReactContext } from 'react';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }
   
   interface State {
     hasError: boolean;
     error?: Error;
   }
   
   export class ErrorBoundary extends React.Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error: Error) {
       return { hasError: true, error };
     }
   
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // Send to error tracking service (Sentry, LogTail, etc.)
       // logErrorToService(error, errorInfo);
     }
   
     render() {
       if (this.state.hasError) {
         return (
           this.props.fallback || (
             <div className="p-8 border-l-4 border-red-500 bg-red-50">
               <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
               <p className="text-red-600 mt-2">{this.state.error?.message}</p>
               <button
                 onClick={() => window.location.reload()}
                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
               >
                 Reload Page
               </button>
             </div>
           )
         );
       }
   
       return this.props.children;
     }
   }
   ```

2. **Create error fallback component**:
   ```typescript
   // src/components/PageErrorFallback.tsx
   interface PageErrorFallbackProps {
     error: Error;
     onRetry: () => void;
   }
   
   export function PageErrorFallback({ error, onRetry }: PageErrorFallbackProps) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center max-w-md">
           <div className="text-6xl mb-4">⚠️</div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Error</h1>
           <p className="text-gray-600 mb-4">
             {error.message || 'An unexpected error occurred while loading this page.'}
           </p>
           <div className="flex gap-4 justify-center">
             <button
               onClick={onRetry}
               className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
             >
               Try Again
             </button>
             <button
               onClick={() => window.location.href = '/dashboard'}
               className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
             >
               Go to Dashboard
             </button>
           </div>
         </div>
       </div>
     );
   }
   ```

3. **Apply error boundaries to dashboard pages**:
   ```typescript
   // src/app/(dashboard)/clients/page.tsx (BEFORE: no error handling)
   export default function ClientsPage() {
     return <ClientsTable />;
   }
   
   // AFTER: wrapped with error boundary
   import { ErrorBoundary } from '@/components/ErrorBoundary';
   import { PageErrorFallback } from '@/components/PageErrorFallback';
   
   export default function ClientsPage() {
     return (
       <ErrorBoundary fallback={<PageErrorFallback error={new Error('Failed to load clients')} onRetry={() => window.location.reload()} />}>
         <ClientsTable />
       </ErrorBoundary>
     );
   }
   ```

4. **Alternatively: Create layout wrapper**:
   ```typescript
   // src/app/(dashboard)/layout.tsx (wrap all dashboard pages)
   import { ErrorBoundary } from '@/components/ErrorBoundary';
   
   export default function DashboardLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <ErrorBoundary>
         <div className="dashboard-layout">
           {children}
         </div>
       </ErrorBoundary>
     );
   }
   ```

5. **Test error boundary**:
   Create a test page that intentionally throws:
   ```typescript
   // src/app/(dashboard)/test-error/page.tsx
   export default function TestErrorPage() {
     throw new Error('This is a test error');
   }
   
   // Visit http://localhost:3000/dashboard/test-error
   // Expect: error boundary catches and shows fallback UI
   ```

### Acceptance Tests

- [ ] All dashboard pages wrapped with `<ErrorBoundary>`
- [ ] Intentional error in a page is caught; fallback UI shows
- [ ] Reload button refreshes the page
- [ ] Back button navigates to dashboard
- [ ] No full-page 500 errors; graceful degradation
- [ ] Error messages are user-friendly (no stack traces)
- [ ] Errors logged to monitoring service (if configured)

### Rollback Notes

If error boundary is too aggressive (catching expected errors):
```typescript
// Adjust error boundary to only catch specific errors
if (error instanceof NetworkError) {
  // show retry UI
} else {
  // re-throw
  throw error;
}
```

### Success Metrics

- Zero unhandled error crashes on dashboard
- All unplanned errors show recovery UI
- Users can recover without page reload 80% of the time
- Error log shows patterns for future fixes

---

## Prompt 12: Create Route Readiness CI Check (Validates Auth + Validation)

**Priority**: 12 (MEDIUM)  
**Risk Rating**: LOW  
**Estimated Effort**: 2-3 hours  
**Owner**: Claude Code

### Goal
Build a CI check (GitHub Actions or npm script) that validates every API route has both auth protection and request validation, preventing accidental deployment of unprotected routes.

### Files to Inspect
- `/src/app/api/` — all routes
- `.github/workflows/` — existing CI workflows
- `package.json` — scripts section

### Files Allowed to Edit
- Create `/scripts/validateRoutes.ts` — validation script
- Update `.github/workflows/ci.yml` — add route check step
- Update `package.json` — add `npm run validate:routes` script

### Files NOT Allowed to Edit
- Individual routes (script is read-only)
- CI base configuration (unless necessary)

### Implementation Steps

1. **Create validation script**:
   ```typescript
   // scripts/validateRoutes.ts
   import fs from 'fs';
   import path from 'path';
   
   interface RouteCheck {
     route: string;
     hasAuth: boolean;
     hasValidation: boolean;
     missing: string[];
   }
   
   const API_DIR = path.join(process.cwd(), 'src/app/api');
   const DASHBOARD_DIR = path.join(process.cwd(), 'src/app/(dashboard)/api');
   
   function checkFile(filePath: string): RouteCheck {
     const content = fs.readFileSync(filePath, 'utf-8');
     const routePath = filePath.replace(process.cwd(), '');
   
     const hasAuth = /withAuth|middleware|jwtVerify/.test(content);
     const hasValidation = /zod|joi|yup|validate|schema/.test(content);
   
     const missing: string[] = [];
     if (!hasAuth && routePath.includes('/dashboard/')) missing.push('auth');
     if (!hasValidation) missing.push('validation');
   
     return {
       route: routePath,
       hasAuth,
       hasValidation,
       missing,
     };
   }
   
   function walkDir(dir: string): string[] {
     const files: string[] = [];
     const entries = fs.readdirSync(dir);
   
     for (const entry of entries) {
       const fullPath = path.join(dir, entry);
       const stat = fs.statSync(fullPath);
   
       if (stat.isDirectory()) {
         files.push(...walkDir(fullPath));
       } else if (entry === 'route.ts' || entry === 'route.js') {
         files.push(fullPath);
       }
     }
   
     return files;
   }
   
   const dashboardRoutes = walkDir(DASHBOARD_DIR).map(checkFile);
   
   const failures = dashboardRoutes.filter(r => r.missing.length > 0);
   
   if (failures.length > 0) {
     console.error('❌ Route validation FAILED:');
     failures.forEach(f => {
       console.error(`  ${f.route}: missing [${f.missing.join(', ')}]`);
     });
     process.exit(1);
   }
   
   console.log(`✅ All ${dashboardRoutes.length} dashboard routes validated`);
   process.exit(0);
   ```

2. **Update package.json**:
   ```json
   {
     "scripts": {
       "validate:routes": "ts-node scripts/validateRoutes.ts",
       "ci": "npm run type-check && npm run build && npm run validate:routes"
     }
   }
   ```

3. **Update GitHub Actions workflow**:
   ```yaml
   # .github/workflows/ci.yml
   name: CI
   
   on: [push, pull_request]
   
   jobs:
     validate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run type-check
         - run: npm run build
         - run: npm run validate:routes  # ← NEW STEP
   ```

4. **Test validation script locally**:
   ```bash
   npm run validate:routes
   # Expected: "✅ All 88 dashboard routes validated"
   
   # Or if failures found:
   # ❌ Route validation FAILED:
   #   src/app/(dashboard)/api/clients/route.ts: missing [auth]
   ```

5. **Whitelist exceptions** (if needed):
   ```typescript
   const EXEMPT_ROUTES = [
     '/api/health',
     '/api/public/pricing',
     '/api/webhook/*',
   ];
   
   const isExempt = EXEMPT_ROUTES.some(
     exempt => routePath.includes(exempt) || exempt.replace('*', '').test(routePath)
   );
   
   if (isExempt) {
     // skip validation
     return;
   }
   ```

### Acceptance Tests

- [ ] Script validates all routes (counts correct number)
- [ ] Routes with auth pass validation
- [ ] Routes without auth fail validation
- [ ] Routes with validation pass (zod, joi, etc.)
- [ ] Routes without validation fail
- [ ] CI pipeline fails if validation fails
- [ ] Can whitelist exempt routes (health, webhooks)
- [ ] Script runs in <30 seconds

### Rollback Notes

If validation is too strict:
```bash
# Add exceptions for routes that don't need auth
EXEMPT_ROUTES.push('/api/dashboard/health');

# Or remove validation requirement for specific routes
if (routePath.includes('/api/dashboard/public')) {
  return { route, hasAuth: true, hasValidation: true, missing: [] };
}
```

### Success Metrics

- 100% of dashboard routes require auth + validation
- Zero deployments of unprotected routes
- CI pipeline enforces route standards
- New routes automatically checked on PR

---

## Summary & Execution Order

### Recommended Execution Sequence

1. **Prompt 1** (package-lock.json) → LOW risk, unblocks other work
2. **Prompt 2** (consolidate middleware) → CRITICAL auth foundation
3. **Prompt 3** (enable TypeScript) → Catches bugs early
4. **Prompt 4** (auth wrapper) → Locks down all routes
5. **Prompt 5** (rate limiting) → Protects AI spend
6. **Prompt 6** (webhook signatures) → Security hardening
7. **Prompt 7** (Airtable injection) → SQL-like injection prevention
8. **Prompt 8** (medical disclaimer) → Compliance requirement
9. **Prompt 9** (stubbed routes) → Clean up build artifacts
10. **Prompt 10** (health check) → Monitoring foundation
11. **Prompt 11** (error boundaries) → UX resilience
12. **Prompt 12** (CI validation) → Prevent regressions

### Time Estimates

| Prompt | Hours | Risk | Owner |
|--------|-------|------|-------|
| 1 | 1-2 | LOW | Claude Code |
| 2 | 2-3 | MEDIUM | Claude Code |
| 3 | 4-6 | MEDIUM | Claude Code |
| 4 | 8-10 | MEDIUM | Claude Code |
| 5 | 3-4 | LOW | Claude Code |
| 6 | 2-3 | LOW | Claude Code |
| 7 | 4-6 | MEDIUM | Claude Code |
| 8 | 2-4 | MEDIUM | Claude Code + Legal |
| 9 | 4-6 | LOW | Claude Code |
| 10 | 3-4 | LOW | Claude Code |
| 11 | 4-5 | LOW | Claude Code |
| 12 | 2-3 | LOW | Claude Code |
| **TOTAL** | **41-55** | — | — |

### Success Criteria (All Prompts)

- [ ] All 12 prompts completed in order
- [ ] Each prompt's acceptance tests pass
- [ ] No regressions in existing functionality
- [ ] Build succeeds; no TypeScript errors
- [ ] All auth flows tested with all 5 roles
- [ ] No silent failures (all errors visible to users)
- [ ] Legal + medical compliance review passed (Prompt 8)
- [ ] CI pipeline runs successfully

---

**End of Document**

**Usage**: Copy any prompt entirely and paste into Claude Code. Do not mix prompts; complete one before starting the next.
