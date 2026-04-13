# Claude Next Steps — 2026-04-13

## New Codex deliverables in this pass

1. Added final uncovered AI stub route tests:
   - `src/app/api/__tests__/ai-stub-routes.test.ts`
2. Added compliance provisioning automation:
   - `scripts/compliance/provision-tables.mjs`
   - `docs/compliance/PROVISION-TABLES.md`

## Immediate actions for Claude

1. Merge the AI stub test wave (this closes route-import coverage gap to 119/119).
2. Run compliance provisioning:
   - `node scripts/compliance/provision-tables.mjs --check`
   - `node scripts/compliance/provision-tables.mjs --apply` (if scopes allow)
   - `node scripts/compliance/check-persistence-ready.mjs`
3. If provisioning succeeds, set `COMPLIANCE_PERSISTENCE_ENABLED=1` in production and redeploy.
4. Post evidence in PR/session note:
   - Missing tables before
   - Tables after
   - readiness check output

## Why this matters for A-grade

- Route coverage closure (119/119) strengthens test-coverage ceiling.
- Compliance persistence activation is the biggest remaining HIPAA-grade unlock.
- This removes a major non-code blocker and shortens path to A-/A.

## Copy-paste brief

```text
Codex pass complete.

Delivered:
1) src/app/api/__tests__/ai-stub-routes.test.ts
   - Covers /api/ai/advisor, /api/ai/outcome, /api/ai/protocols, /api/ai/quiz, /api/ai/skin-analysis
   - Asserts GET 501, POST 501, 429 rate-limit path for each

2) scripts/compliance/provision-tables.mjs
3) docs/compliance/PROVISION-TABLES.md

Please run:
- node scripts/compliance/provision-tables.mjs --check
- node scripts/compliance/provision-tables.mjs --apply
- node scripts/compliance/check-persistence-ready.mjs

If apply succeeds, flip COMPLIANCE_PERSISTENCE_ENABLED=1 in production and redeploy.
```
