# A-Grade Next Tasks (2026-04-13)

## Current state (after OpenAPI waves 6–12)

- OpenAPI path parity with implemented routes: **100%** (normalized dynamic segments)
- Duplicate OpenAPI path keys: **removed**
- New AI stub integration test wave added:
  - `src/app/api/__tests__/ai-stub-routes.test.ts`

## Claude task queue (high leverage first)

1. **Schema depth pass for top business paths**
   - enrich request/response schemas (not just status envelopes) for:
   - `/api/booking/book`
   - `/api/consultation/submit`
   - `/api/subscribe`
   - `/api/plan/{id}/track`
   - `/api/webhooks/{stripe,cherry,meta-capi,mangomint}`
   - target: OpenAPI quality gate from "path parity" to "contract depth"

2. **Integration test depth on unimplemented/stub-but-public surfaces**
   - keep mutation and auth edge behavior hard-tested
   - prioritize:
   - `/api/contact`
   - `/api/photo/upload`
   - `/api/simulation/generate`
   - `/api/templates/{post-treatment,pre-consult,reactivation}`

3. **Compliance activation lane**
   - provision persistence tables
   - wire enablement flip via env in production
   - add one smoke integration test proving persistence writes when enabled

4. **Dependency major migration plan execution**
   - Stripe v20 → v22
   - Zod v3 → v4
   - one package per branch/PR with focused migration notes and rollback path

5. **Reviewer/process hardening**
   - confirm CODEOWNERS enforcement behavior in branch protection setup
   - keep `dependency-review`, `Typecheck`, `Test`, and both Vercel checks required

## Paste-ready update for Claude

```text
OpenAPI parity work is complete on my side:
- Path parity now 100% (normalized dynamic segments)
- Duplicate path keys cleaned
- Added docs/codex-handoff/OPENAPI-WAVE-12-RECONCILIATION-2026-04-13.md

Also added new test wave:
- src/app/api/__tests__/ai-stub-routes.test.ts
- docs/codex-handoff/TEST-WAVE-AI-STUB-ROUTES-2026-04-13.md

Recommended next Claude lane (in order):
1) OpenAPI schema depth on booking/consultation/subscribe/plan-track/webhooks
2) Integration depth on contact/photo/simulation/templates
3) Compliance persistence activation + smoke test
4) Stripe v22 migration then Zod v4 migration
5) Review-gate hardening confirmation
```
