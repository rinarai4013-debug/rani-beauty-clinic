# Day 1 Stabilization Patch Plan

> Generated 2026-04-07 — read-only audit of 5 API routes + 2 middleware files.
> Codex should apply these fixes in a single PR.

---

## 1. Route-by-Route Security & Hardening Audit

### 1.1 `/api/photo/upload` — `src/app/api/photo/upload/route.ts`

| Question | Answer |
|----------|--------|
| Public by design? | **Yes** — used by patient-facing skin-analysis flow (no auth check) |
| Mutates state? | **No** — processes image in-memory, returns base64; nothing persisted |
| File upload / large body? | **Yes** — multipart `formData`, up to 25 MB (`MAX_FILE_SIZE` L10) |
| Calls AI / external APIs? | **No** — only `sharp` (local image processing) |
| Rate limiting? | **None** |
| Validates request body? | **Partial** — checks MIME type (L40-44) and size (L48-53), but no auth token or origin check |

**Minimal fix needed:**
1. **Add rate limiting** — 10 req/min per IP. This is a public endpoint accepting large file uploads; without rate limiting it's a trivial abuse vector (disk/CPU exhaustion via sharp).
2. **Cap `maxDuration`** — already set to 30s (L5), acceptable.
3. No auth needed (patient upload flow is intentionally anonymous).

```
Fix: Import shared rate limiter, add IP-based guard at top of POST handler.
Estimated: +8 lines.
```

---

### 1.2 `/api/skin-analysis` — `src/app/api/skin-analysis/route.ts`

| Question | Answer |
|----------|--------|
| Public by design? | N/A — **stubbed out** (returns 501) |
| Mutates state? | No |
| File upload / large body? | No |
| Calls AI / external APIs? | No |
| Rate limiting? | No |
| Validates request body? | No (only has GET) |

**Minimal fix needed:**
- **None** — it's a 2-line 501 stub (L1-2). Safe as-is. Could add a `POST` stub to match expected usage pattern, but not required for Day 1.

---

### 1.3 `/api/templates/pdf` — `src/app/api/templates/pdf/route.ts`

| Question | Answer |
|----------|--------|
| Public by design? | N/A — **stubbed out** (returns 501) |
| Mutates state? | No |
| File upload / large body? | No |
| Calls AI / external APIs? | No |
| Rate limiting? | No |
| Validates request body? | No |

**Minimal fix needed:**
- **None** — identical 501 stub. Safe as-is.

---

### 1.4 `/api/patient/auth/magic-link` — `src/app/api/patient/auth/magic-link/route.ts`

| Question | Answer |
|----------|--------|
| Public by design? | **Yes** — patient-facing login initiation (no prior auth required) |
| Mutates state? | **Yes** — creates a magic-link token (L36), sends email via Resend (L40-115) |
| File upload / large body? | No — JSON body, single `email` field |
| Calls AI / external APIs? | **Yes** — Resend email API (L40), Airtable lookup (L29-33) |
| Rate limiting? | **None** |
| Validates request body? | **Yes** — Zod schema validates email format (L10-11, L17-24) |

**Minimal fix needed:**
1. **Add rate limiting** — **Critical priority**. This is a public endpoint that triggers email sends and Airtable reads. Without rate limiting, an attacker can:
   - Spam arbitrary email addresses (email bombing via Resend)
   - Enumerate whether emails exist in the DB (timing side-channel — mitigated by the constant-time success response on L119, but Resend API latency still leaks)
   - Burn through Resend quota
   - Recommended: 3 req/min per IP, 5 req/hour per email address.
2. Airtable query uses `sanitizeFormulaValue` (L33) — good, prevents formula injection.
3. Constant-success response pattern (L119) — good, prevents email enumeration via response body.

```
Fix: Import shared rate limiter, add dual-key guard (IP + email).
Estimated: +12 lines.
```

---

### 1.5 `/api/patient/auth/verify` — `src/app/api/patient/auth/verify/route.ts`

| Question | Answer |
|----------|--------|
| Public by design? | **Yes** — patient-facing token verification (clicked from email) |
| Mutates state? | **Yes** — creates patient session, sets session cookie (L66-86) |
| File upload / large body? | No — JSON body, single `token` field |
| Calls AI / external APIs? | **Yes** — Airtable lookup (L46-51) |
| Rate limiting? | **None** |
| Validates request body? | **Yes** — Zod validates token presence (L12-13, L24-30) |

**Minimal fix needed:**
1. **Add rate limiting** — Important. This endpoint verifies magic-link tokens and issues session cookies. Without rate limiting, brute-force token guessing is possible (though token entropy should make this impractical, defense-in-depth requires it). Recommended: 5 req/min per IP.
2. Token verification already rejects invalid/expired tokens (L38-43) — good.
3. Uses `sanitizeFormulaValue` for Airtable query (L49) — good.

```
Fix: Import shared rate limiter, add IP-based guard.
Estimated: +8 lines.
```

---

## 2. Summary: Fixes Needed

| Route | Priority | Fix | Lines |
|-------|----------|-----|-------|
| `/api/photo/upload` (L15) | Medium | Add IP rate limit (10/min) | ~8 |
| `/api/skin-analysis` | None | 501 stub, safe | 0 |
| `/api/templates/pdf` | None | 501 stub, safe | 0 |
| `/api/patient/auth/magic-link` (L14) | **High** | Add dual rate limit (IP 3/min + email 5/hr) | ~12 |
| `/api/patient/auth/verify` (L21) | Medium | Add IP rate limit (5/min) | ~8 |

**Prerequisite:** Create or verify a shared rate-limiting utility. Check if one exists at `src/lib/rate-limit/` or similar. If not, create a simple in-memory IP-based limiter (Map + sliding window). This is acceptable for Vercel serverless — each cold start resets the map, but it still stops burst abuse within a single instance lifetime.

---

## 3. Middleware Comparison

### Files

| File | Location | Lines |
|------|----------|-------|
| Root middleware | `middleware.ts` (project root) | 113 lines |
| Src middleware | `src/middleware.ts` | 187 lines |

### Which one does Next.js use?

**Next.js uses the root `middleware.ts`** (project root). Per Next.js docs, middleware must be at the project root (same level as `pages/` or `app/`). When both exist, the root-level file takes precedence. The `src/middleware.ts` file is **dead code** — Next.js never executes it.

### What each file does

**Root `middleware.ts` (ACTIVE):**
- Domain canonicalization: `ranibeautyclinic.com` → `www.ranibeautyclinic.com` (L14-23)
- Subdomain redirect: `offers.*` → `www` (L27-37)
- WordPress query param stripping (L45-54)
- API CORS headers: own-origin restriction for standard routes, webhook-specific headers (L57-87)
- X-Robots-Tag noindex for protected routes: `/dashboard`, `/portal`, `/admin`, etc. (L90-96)
- Trailing slash removal (L99-103)

**`src/middleware.ts` (DEAD CODE):**
- Multi-tenant resolution: subdomain, custom domain, JWT session, header-based tenant ID (L81-137)
- Injects `x-tenant-id`, `x-tenant-slug`, `x-tenant-source` headers (L139-149)
- CORS for API routes with explicit allowed origins list (L151-168)
- References `ranios.com` / `ranios.dev` domains (SaaS/multi-tenant future)
- Falls back to `DEFAULT_TENANT_ID = 'rani-beauty-clinic'` (L22)

### Conflict analysis

| Concern | Root middleware | src/middleware.ts |
|---------|---------------|-------------------|
| CORS | Own-origin only via env var | Explicit allowlist with dev localhost |
| Domain handling | www redirect + offers redirect | Multi-tenant subdomain resolution |
| Auth awareness | None | Reads JWT for tenant ID |
| Static file skip | `pathname.includes('.')` (L42) | PUBLIC_PATHS array (L23-31) |
| Matcher | Excludes static assets | Similar but also excludes `images/` |

**Key conflicts if both ran:**
1. **CORS headers would be set twice** with different values
2. **Domain redirect in root would fire before tenant resolution** in src
3. Root middleware strips `offers.*` subdomain; src middleware would try to resolve it as a tenant

### Safest consolidation plan

**Do NOT edit either file in this patch.** The root middleware is correct for the current single-tenant Rani deployment. The src middleware is future SaaS scaffolding.

**Recommended plan (future PR, not Day 1):**

1. **Keep root `middleware.ts` as the single active middleware** — it handles all production concerns correctly.
2. **Move multi-tenant logic from `src/middleware.ts` into a library** — e.g., `src/lib/tenant/resolver.ts` — so it can be imported when SaaS mode is enabled.
3. **Delete `src/middleware.ts`** after extracting reusable parts. Dead code creates confusion.
4. **Gate multi-tenant features behind an env var** (e.g., `ENABLE_MULTI_TENANT=true`) and conditionally call the tenant resolver from the root middleware.
5. **Merge the CORS logic** — the src middleware's explicit allowlist approach is better than the root's single env var. Adopt the allowlist in the root middleware.

**Why not Day 1:** The src middleware is inert. Touching it risks accidentally making Next.js pick it up (e.g., if someone moves the project to use `src/` app directory convention). The root middleware is stable and handles prod correctly.

---

## 4. Implementation Order

```
1. Create src/lib/rate-limit/index.ts  (shared in-memory rate limiter)
2. Patch src/app/api/patient/auth/magic-link/route.ts  (highest priority — email abuse)
3. Patch src/app/api/patient/auth/verify/route.ts  (session issuance)
4. Patch src/app/api/photo/upload/route.ts  (large file upload abuse)
5. Do NOT touch middleware.ts or src/middleware.ts
6. Do NOT touch stub routes (skin-analysis, templates/pdf)
```

**Total estimated diff:** ~40 lines across 4 files (1 new, 3 patched).
