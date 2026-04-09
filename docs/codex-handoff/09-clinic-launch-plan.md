# Rani Beauty Clinic: Phased Stabilization & Launch Plan

## Executive Summary

The Rani Beauty Clinic platform is a sophisticated Next.js 14 medical aesthetics dashboard with 271+ API routes, 43+ AI intelligence engines, Airtable database, and integrations across Stripe, Mangomint, Plaid, Pinecone, Meta Ads, and Anthropic Claude. The system is **code-complete but infrastructure-unstable**: TypeScript checking is disabled, middleware conflicts exist, package integrity is broken, many routes lack auth enforcement, and AI engines operate without proper medical disclaimers.

**Timeline**: 3-4 weeks to production stability (Phase 0-2)

**Success Metric**: Sustainable operations at >99% uptime with zero unplanned downtime, all auth enforced, all AI outputs compliant, no silent data failures.

---

## Phase 0: Quarantine & Scaffold Cleanup (1-2 days)

**Goal**: Isolate known stability issues, remove dead code, lock down the build.

### Required Fixes

#### 0.1 Identify Real vs. Stub Routes
- **Task**: Audit `/src/app/api/` to identify routes that are production-ready vs. placeholders
- **Scope**: All 271 routes, categorized by:
  - Production routes (tied to business logic, tested, used in UI)
  - Stub routes (placeholder handlers, unused, TODOs in code)
  - Partial routes (partially implemented, edge cases missing)
- **Owner**: Codex (inspection) + Claude Code (classification script)
- **Effort**: 6-8 hours
- **Output**: `ROUTE_STATUS.json` (matrix: route name → status + risk level)

#### 0.2 Remove or Gate Stub Routes
- **Task**: Either delete dead code or wrap in feature flags
- **Rule**: No route should return `{ error: "not implemented" }` in production
- **Gate Pattern**: 
  ```typescript
  if (!process.env.FEATURE_BETA_ROUTE_NAME) {
    return new Response('Not available', { status: 404 });
  }
  ```
- **Owner**: Claude Code
- **Effort**: 4-6 hours
- **Risk**: LOW (feature flags are safe; deletion requires Codex approval per route)
- **Acceptance**: `ROUTE_STATUS.json` shows 0 stubs exposed, all gated

#### 0.3 Consolidate Middleware Files
- **Task**: Identify the two conflicting middleware files and merge into one
- **Likely Files**: 
  - `src/middleware.ts` (auth wrapper, RBAC)
  - `src/app/middleware.ts` (possibly duplicate)
- **Merge Strategy**: 
  1. Preserve auth enforcement (JWT, session validation)
  2. Preserve RBAC (5 roles: ceo, frontdesk, provider, marketing, operations)
  3. Combine route protection rules
  4. Test: verify all dashboard routes require auth after merge
- **Owner**: Claude Code
- **Effort**: 2-3 hours
- **Risk**: MEDIUM (breaking change if logic conflicts; test thoroughly)
- **Acceptance**: One `src/middleware.ts`, all auth routes pass `next-auth` checks, no 401/403 loops

#### 0.4 Generate package-lock.json
- **Task**: Run `npm ci` to regenerate lock file
- **Current State**: No lock file, causing inconsistent installs
- **Process**:
  1. Delete any cached node_modules
  2. Run `npm ci --legacy-peer-deps` (if needed)
  3. Commit lock file to git
  4. Verify: `npm audit` passes (acceptable: only allow medium-severity peer deps)
- **Owner**: Claude Code
- **Effort**: 1-2 hours
- **Risk**: LOW (lock files are idempotent; worst case: revert and retry)
- **Acceptance**: `package-lock.json` is in repo, `npm ci` is deterministic, no audit blockers

#### 0.5 Re-enable TypeScript Checking
- **Task**: Remove TypeScript disable flags from `next.config.js`, fix critical errors
- **Current State**: `typescript.tscErrorIgnore = ['ignoreAll']` (suppressing all type errors)
- **Strategy**: Re-enable but tolerate low-severity errors; fix only:
  - Any type that breaks at runtime
  - Auth-related type mismatches
  - API response schema mismatches
- **Implementation**:
  ```javascript
  typescript: {
    ignoreBuildErrors: false, // re-enable
    tscErrorIgnore: ['TS2305', 'TS2688'] // only ignore import/module errors
  }
  ```
- **Owner**: Claude Code
- **Effort**: 4-6 hours (expect 100-200 type errors initially)
- **Risk**: MEDIUM (fixes may introduce behavior changes; regression test after)
- **Acceptance**: `npm run type-check` exits 0, no TS errors on critical paths (auth, API, AI)

### Acceptance Criteria (Phase 0)

- [ ] `ROUTE_STATUS.json` exists with all 271 routes categorized
- [ ] 0 stub routes exposed in production (all gated or deleted)
- [ ] Single `src/middleware.ts` file; no duplicate/conflicting middleware
- [ ] `package-lock.json` is in repo; `npm ci` produces clean install
- [ ] TypeScript re-enabled; critical paths type-safe (auth, API, AI routes)
- [ ] No breaking changes to UI; dashboard still loads
- [ ] Estimated effort per route: <10 seconds (script-driven)

### Risk Summary

| Fix | Risk | Mitigation |
|-----|------|-----------|
| Route stubbing | MEDIUM | Feature flags; no deletes without sign-off |
| Middleware merge | MEDIUM | Test both auth paths (token + session) |
| package-lock.json | LOW | Rollback is one command |
| TypeScript re-enable | MEDIUM | Type fixes reviewed per file; staged commit |

---

## Phase 1: Internal Dashboard Stable (1 week)

**Goal**: Dashboard auth works, core business operations are reliable, Airtable reads are cached and error-resilient.

### Required Fixes

#### 1.1 Auth Hardened on All Dashboard Routes
- **Task**: Wrap all dashboard API routes (`/api/dashboard/*`) with auth middleware
- **Current State**: Some routes may lack auth checks; gaps identified in 03-auth-security-map.md
- **Implementation**:
  - Verify JWT/session on every request
  - Return 401 if token invalid/expired
  - Enforce RBAC: check user role against route requirements
  - Log auth failures for monitoring
- **Routes Affected**: ~88 dashboard API routes
- **Owner**: Claude Code
- **Effort**: 8-10 hours
- **Risk**: MEDIUM (auth failures will lock out users; test with all 5 roles)
- **Acceptance**: 
  - [ ] 88 dashboard routes require valid JWT/session
  - [ ] Unauthenticated requests return 401
  - [ ] Role-based 403 returned when user lacks permission
  - [ ] All roles tested: ceo, frontdesk, provider, marketing, operations

#### 1.2 Core Dashboard Pages Functional
- **Task**: Verify key pages load without errors: Clients, Schedule, Revenue/KPIs, Appointments
- **Current State**: Pages may have broken API integrations, missing error handling
- **Implementation**:
  - Identify top 10 dashboard pages (Codex inspection)
  - Test each with realistic data load
  - Add error boundaries to prevent full-page crashes
  - Implement fallback UI (skeleton screens, retry buttons)
- **Pages to Prioritize**:
  1. Client Management (patient list, demographics)
  2. Appointment Schedule (calendar, slots)
  3. Revenue Dashboard (PnL, KPIs, charts)
  4. Treatment Plans (creation, assignment)
  5. Staff Management (provider profiles, availability)
- **Owner**: Claude Code (integration) + Codex (UI testing)
- **Effort**: 12-15 hours
- **Risk**: MEDIUM (data schema mismatches with Airtable possible)
- **Acceptance**:
  - [ ] Each page loads in <2 seconds on production data
  - [ ] No 500 errors on initial load
  - [ ] All API calls show correct data (not stale/corrupted)
  - [ ] Error boundaries catch failures; users see retry option

#### 1.3 Airtable Reads: Caching & Error Handling
- **Task**: Implement read-through cache, handle rate limits, validate schemas
- **Current State**: Direct Airtable API calls, 4.7 req/sec rate limit, no cache layer
- **Implementation**:
  - Add Redis cache (TTL: 5 min for frequently-read tables)
  - Implement exponential backoff for 429 rate-limit errors
  - Add request deduplication (if same query issued 2x in 100ms, return from cache)
  - Schema validation on all responses
  - Log cache hits/misses for monitoring
- **Tables Affected**: 12 core tables (Clients, Appointments, Treatments, Financials, etc.)
- **Owner**: Claude Code
- **Effort**: 10-12 hours
- **Risk**: LOW (cache is read-only; worst case: cold start on Vercel)
- **Acceptance**:
  - [ ] Cache hit rate >80% on dashboard loads
  - [ ] Zero 429 rate-limit errors during peak hours
  - [ ] Failed Airtable calls return cached data (not error)
  - [ ] Cache invalidation on mutations (POST/PUT/DELETE)
  - [ ] Monitoring shows cache metrics (hit rate, freshness)

#### 1.4 No Silent Failures
- **Task**: Make all errors visible; implement structured logging and error alerts
- **Current State**: Many API routes may fail silently (log but no user feedback)
- **Implementation**:
  - Add `try/catch` to all async operations
  - Return structured error responses: `{ error: string, code: string, retry: bool }`
  - Log to external service (Sentry, LogTail, or Vercel logs)
  - Alert on critical errors: DB down, payment failures, auth failures
  - Dashboard error toast on recoverable failures
- **Owner**: Claude Code
- **Effort**: 6-8 hours
- **Risk**: LOW (logging is non-blocking)
- **Acceptance**:
  - [ ] All API errors logged with request context
  - [ ] Users see error messages on failures
  - [ ] No errors logged to console without also being sent to monitoring
  - [ ] Critical errors trigger alerts within 2 minutes

### Acceptance Criteria (Phase 1)

- [ ] All 88 dashboard routes enforce auth (401 on missing/invalid token)
- [ ] Top 5 dashboard pages load in <2 sec; no unhandled errors
- [ ] Airtable cache active; 0 rate-limit 429 errors over 1 week
- [ ] All errors visible to users (toast/modal, not silent)
- [ ] Monitoring dashboard shows <0.1% error rate
- [ ] User testing: frontdesk staff can complete a full booking flow

### Risk Summary

| Fix | Risk | Mitigation |
|-----|------|-----------|
| Auth enforcement | MEDIUM | Test with all roles; gradual rollout |
| Page functionality | MEDIUM | Error boundaries prevent cascading failures |
| Airtable caching | LOW | Cache is read-only; fallback to direct API |
| Error handling | LOW | Logging is non-blocking; no perf impact |

---

## Phase 2: Patient Plan Flow Stable (1 week)

**Goal**: Patients can authenticate, view treatment plans, book appointments, and contact clinic via intake forms.

### Required Fixes

#### 2.1 Patient Auth (Magic Link) Working
- **Task**: Implement/verify passwordless login for patients
- **Current State**: Likely uses Resend (email service) for magic links
- **Implementation**:
  - Generate short-lived tokens (15 min TTL) signed with JWT secret
  - Send via Resend email
  - Verify token on click; issue session cookie
  - Test: email delivery, link expiry, session persistence
- **Owner**: Claude Code
- **Effort**: 4-6 hours
- **Risk**: MEDIUM (email delivery can be unreliable; add retry logic)
- **Acceptance**:
  - [ ] Magic link sent within 5 sec of signup
  - [ ] Link works for 15 minutes
  - [ ] Clicking link creates session; patient logged in
  - [ ] Session persists across page reloads
  - [ ] Expired links show clear error message

#### 2.2 Treatment Plan View & Share
- **Task**: Patient can view assigned plans, share with other providers
- **Current State**: Unknown; likely incomplete
- **Implementation**:
  - Fetch patient's assigned plans from Airtable
  - Render plan details: procedures, pricing, timeline
  - Share button: generate shareable link with read-only token
  - Shared links: auto-expire after 30 days or on status change
- **Owner**: Claude Code
- **Effort**: 6-8 hours
- **Risk**: MEDIUM (token lifecycle management complex)
- **Acceptance**:
  - [ ] Patient sees their plans after login
  - [ ] Share link works; non-authenticated users can view (read-only)
  - [ ] Shared links expire after 30 days
  - [ ] Plan changes update in real-time for all viewers

#### 2.3 Booking Flow Functional
- **Task**: Patient can book appointments from patient portal
- **Current State**: Unknown; may route to Mangomint or custom form
- **Implementation**:
  - List available appointment slots (real-time from Mangomint)
  - Patient selects service, time, notes
  - Confirm and create appointment in Airtable + Mangomint
  - Send confirmation email via Resend
  - Add to patient's calendar (iCal attachment)
- **Owner**: Claude Code
- **Effort**: 8-10 hours
- **Risk**: MEDIUM (Mangomint API sync required)
- **Acceptance**:
  - [ ] Patient sees available slots within 5 sec
  - [ ] Slot selection is real-time (no double-booking)
  - [ ] Appointment created in Airtable and Mangomint
  - [ ] Confirmation email sent within 2 sec
  - [ ] Patient can reschedule/cancel from portal

#### 2.4 Contact & Intake Forms Working
- **Task**: New patients can submit contact/intake forms; staff can view submissions
- **Current State**: Forms may exist but lack submission handling
- **Implementation**:
  - Form validation (required fields, email format, phone format)
  - On submit: create Contact record in Airtable
  - Send auto-reply to patient via Resend
  - Notify staff (Slack webhook or dashboard alert)
  - Track form submissions in dashboard
- **Owner**: Claude Code
- **Effort**: 4-6 hours
- **Risk**: LOW (forms are stateless; failures non-critical)
- **Acceptance**:
  - [ ] Form submits without errors
  - [ ] Contact created in Airtable
  - [ ] Patient receives auto-reply email
  - [ ] Staff notified (Slack or dashboard)
  - [ ] All submissions visible in staff dashboard

### Acceptance Criteria (Phase 2)

- [ ] Patient magic-link auth works; session persists
- [ ] Patient views plans within <1 sec; can share read-only links
- [ ] Booking flow reserves slot; prevents double-booking
- [ ] Intake forms capture data; staff notified
- [ ] User testing: new patient can sign up, view a plan, and book appointment

### Risk Summary

| Fix | Risk | Mitigation |
|-----|------|-----------|
| Magic-link auth | MEDIUM | Resend retry logic; add backup SMS fallback |
| Plan sharing | MEDIUM | Token lifecycle review; audit for leaks |
| Booking flow | MEDIUM | Real-time slot sync with Mangomint |
| Intake forms | LOW | Validation on client + server |

---

## Phase 3: AI & Automation Safe (2 weeks)

**Goal**: AI engines are validated for medical accuracy, compliance, and safety. All outputs have disclaimers. Webhooks are verified.

### Required Fixes

#### 3.1 AI Engines Validated
- **Task**: Audit 43+ AI intelligence engines (see 06-ai-engines-map.md)
- **Critical Engines** (🔴 HIGH/CRITICAL risk):
  1. **Consultation Copilot** - Medical advice assistant
  2. **Copilot** - Patient-facing AI
  3. **VAPI Phone Agent** - AI phone answering
  4. **PnL Engine** - Financial calculations
  5. **Dynamic Pricing Engine** - Price recommendations
- **Implementation**:
  - Verify math logic (PnL, pricing: no division by zero, decimal precision)
  - Verify medical disclaimers on all AI outputs
  - Check Claude API prompt injection risks (filterByFormula, user inputs)
  - Verify compliance with medical regulations (no diagnosis, no Rx recommendations without provider)
  - Test edge cases: NaN, Infinity, empty datasets
- **Owner**: Claude Code (logic review) + Codex (compliance review) + Medical/Legal (disclaimers)
- **Effort**: 20-24 hours
- **Risk**: HIGH (medical content is legally sensitive)
- **Acceptance**:
  - [ ] PnL calculations verified: ±0.01 accuracy on test dataset
  - [ ] Pricing engine has min/max guardrails; no negative prices
  - [ ] Copilot outputs include "This is not medical advice" disclaimer
  - [ ] No diagnosis, Rx, or treatment recommendations without provider review
  - [ ] Phone agent has consent prompt; records calls compliant with WA law
  - [ ] All Claude API calls log input/output for audit trail

#### 3.2 Consult Copilot Medical Disclaimer
- **Task**: Add medical disclaimer to copilot responses; enforce provider review workflow
- **Current State**: Unknown; may lack disclaimers
- **Implementation**:
  - Prepend disclaimer to all copilot responses:
    ```
    "⚠️ This is AI-generated information, not medical advice. 
    Please consult a licensed provider for diagnosis or treatment."
    ```
  - If copilot detects medical question: flag for provider review before sending to patient
  - Log all copilot queries + responses for compliance audit
  - Add opt-in consent: "I understand this is not medical advice" checkbox
- **Owner**: Claude Code
- **Effort**: 2-4 hours
- **Risk**: LOW (disclaimer is non-functional)
- **Acceptance**:
  - [ ] All copilot responses include disclaimer
  - [ ] Copilot queries logged in Airtable
  - [ ] Patient sees opt-in consent before use
  - [ ] Medical questions flagged for provider review

#### 3.3 n8n Webhooks Verified & Signed
- **Task**: Verify all incoming webhooks from n8n have valid signatures
- **Current State**: Unknown; may lack signature verification
- **Implementation**:
  - n8n sends HMAC-SHA256 signature in header
  - Verify signature on every webhook call
  - Reject unsigned requests (return 401)
  - Log webhook events in Airtable
  - Test: trigger n8n workflow, verify callback success
- **Owner**: Claude Code
- **Effort**: 2-3 hours
- **Risk**: LOW (signature verification is standard)
- **Acceptance**:
  - [ ] All n8n webhooks checked for valid signature
  - [ ] Invalid signatures rejected (401)
  - [ ] Webhook events logged with timestamp + status
  - [ ] No webhook data loss on verification failure

#### 3.4 Rate Limiting on AI Routes
- **Task**: Prevent abuse of AI endpoints; implement per-user/per-IP rate limits
- **Current State**: No rate limiting; API vulnerable to abuse
- **Implementation**:
  - AI routes: `/api/ai/*`
  - Limit: 10 req/min per user, 100 req/min per IP
  - Use Redis for distributed rate limiting (Vercel KV compatible)
  - Return 429 Too Many Requests when exceeded
  - Whitelist high-volume uses (scheduled jobs, internal tools)
  - Monitor for abuse; alert if user hits limit >5x in 1 hour
- **Owner**: Claude Code
- **Effort**: 3-4 hours
- **Risk**: LOW (rate limiting is standard)
- **Acceptance**:
  - [ ] AI routes enforce per-user limits (10 req/min)
  - [ ] IP limits (100 req/min) prevent bot abuse
  - [ ] Rate limit headers returned: `X-RateLimit-Remaining`
  - [ ] Abuse alerts working; no false positives

### Acceptance Criteria (Phase 3)

- [ ] All 43 AI engines have math/logic validated
- [ ] Copilot has medical disclaimer; queries logged
- [ ] n8n webhooks verified; invalid requests rejected
- [ ] Rate limiting on `/api/ai/*` prevents abuse
- [ ] Zero compliance violations on legal review
- [ ] Monitoring shows <0.5% AI error rate

### Risk Summary

| Fix | Risk | Mitigation |
|-----|------|-----------|
| AI validation | HIGH | Involve legal/medical team early |
| Disclaimers | MEDIUM | Legal review required |
| Webhook verification | LOW | HMAC is standard; well-tested |
| Rate limiting | LOW | Redis is reliable; fallback to in-memory |

---

## Phase 4: SaaS / Multi-tenant (Future)

**Status**: DEFER until Phase 1-3 are complete. Single-clinic stability must come first.

### Strategic Notes

- The system has multi-tenant scaffolding (17 tenant API routes) but is currently single-clinic
- Multi-tenancy adds complexity: data isolation, billing per clinic, feature flags per tenant, white-label branding
- **Recommendation**: Run single-clinic in production for 3+ months before attempting multi-tenant
- Document required changes in `MULTI_TENANT_ROADMAP.md` (future)

---

## Resource Allocation

### Suggested Team Structure

| Phase | Owner(s) | Estimated Hours | Ideal Start |
|-------|----------|-----------------|------------|
| **Phase 0** | Codex (4h) + Claude Code (12h) | 16 | Week 1 Mon |
| **Phase 1** | Claude Code (28h) + Codex (8h) | 36 | Week 1 Wed |
| **Phase 2** | Claude Code (22h) + Codex (4h) | 26 | Week 2 Mon |
| **Phase 3** | Claude Code (25h) + Codex (10h) + Legal (8h) | 43 | Week 3 Mon |
| **Contingency** | All (10%) | ~12 | Throughout |
| **TOTAL** | — | ~133 | — |

### Staffing Recommendations

- **Claude Code**: Full-time on Phases 0-3 (lead engineer)
- **Codex**: Part-time review + testing (code reviewer, QA)
- **Medical/Legal**: Phase 3 only (2-3 days) for disclaimer review + compliance sign-off
- **Sukhi (CEO)**: Weekly checkpoint reviews; Phase 3 sign-off on medical content

---

## Rollout Strategy

### Option A: Waterfall (Safer)
1. Complete Phase 0 entirely
2. Deploy Phase 0 to production
3. Monitor 1 week for stability
4. Begin Phase 1 (while Phase 0 soaks in production)
5. Repeat for Phases 1-2

**Timeline**: 3-4 weeks total. **Advantage**: Low risk of cascade failures. **Disadvantage**: Slower.

### Option B: Parallel (Faster)
1. Complete Phase 0
2. Phases 1 & 2 run in parallel (separate feature branches)
3. Both merge to main on day 7
4. Merge Phase 3 on day 14

**Timeline**: 2-3 weeks total. **Advantage**: Faster. **Disadvantage**: Merge conflicts, higher risk.

**Recommendation**: Option A (Waterfall). Medical data is sensitive; slow and stable is better than fast and broken.

---

## Monitoring & Success Metrics

### Phase 0 Success
- [ ] Build passes TypeScript check
- [ ] Zero auth-related 401/403 loops on dashboard
- [ ] No console warnings about middleware conflicts

### Phase 1 Success
- [ ] Dashboard uptime >99%
- [ ] P95 dashboard page load <2 sec
- [ ] Zero Airtable 429 rate-limit errors
- [ ] <0.1% API error rate

### Phase 2 Success
- [ ] Patient signup flow completion rate >90%
- [ ] Booking success rate >95%
- [ ] <1% patient-reported broken flows

### Phase 3 Success
- [ ] Medical compliance audit passes
- [ ] Legal review on disclaimers complete
- [ ] Zero AI-related patient complaints
- [ ] Rate-limit abuse <5 incidents/week

---

## Rollback & Contingency

### If Phase Fails

| Phase | Rollback Plan |
|-------|--------------|
| 0 | Revert git commits; redeploy previous version |
| 1 | Roll back auth changes; restore direct Airtable queries |
| 2 | Disable patient portal; keep staff dashboard active |
| 3 | Remove rate limits; disable new AI features |

### Critical Contacts

- **Sukhi (CEO)**: Final sign-off on all phases
- **On-call Engineer**: Rotation for 24/7 monitoring during rollouts
- **n8n Support**: For webhook debugging (if issues arise)
- **Vercel Support**: For deployment/scaling issues

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Apr 7, 2026 | Claude Code | Initial plan |

**Next Review**: After Phase 0 completion

---

## Appendix: Phase Checklist

### Phase 0: Quarantine & Cleanup
```
- [ ] Route audit complete (ROUTE_STATUS.json exists)
- [ ] Stub routes gated or deleted (0 exposed in build)
- [ ] Middleware consolidated (1 file, no conflicts)
- [ ] package-lock.json committed
- [ ] TypeScript re-enabled; critical errors fixed
- [ ] CI passes
```

### Phase 1: Dashboard Stable
```
- [ ] Auth enforced on all 88 dashboard routes
- [ ] Top 5 pages load <2 sec
- [ ] Error boundaries on all pages
- [ ] Airtable caching live (Redis)
- [ ] Rate limiting prevents 429 errors
- [ ] Monitoring alerts configured
- [ ] Frontdesk staff tested and signed off
```

### Phase 2: Patient Portal Stable
```
- [ ] Magic-link auth works
- [ ] Patients view plans
- [ ] Booking flow functional
- [ ] Intake forms capture data
- [ ] Patient onboarding tested end-to-end
```

### Phase 3: AI & Compliance Safe
```
- [ ] Math engines validated (PnL, pricing)
- [ ] Medical engines have disclaimers
- [ ] Copilot queries logged
- [ ] n8n webhooks verified
- [ ] Rate limiting on AI routes
- [ ] Legal/medical compliance review passed
- [ ] Monitoring for AI errors active
```

---

**This plan is a living document. Update as phases complete and new risks emerge.**
