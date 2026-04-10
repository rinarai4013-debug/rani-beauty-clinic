# Codex TODO — Remaining Work to 100%

Generated: 2026-04-09
Baseline: commit 6322f57 (codex/pristine-round3) + Claude cleanup session

## Current Grades

| Category | Grade | Notes |
|----------|-------|-------|
| Type Safety | A+ | 0 `any` occurrences |
| Console Discipline | A | All debug logs normalized to console.error |
| Env Hardening | A | All module-level env access uses lazy getters |
| Zod Validation | B- | 34/59 POST/PATCH routes validated (58%) |
| Accessibility | D | 141/556 components missing ARIA attrs |
| Test Coverage | C- | 102/230 lib modules tested (44%) |
| Dead Code | A+ | 52,607 lines purged, 0 stub routes remain |

---

## 1. Zod Validation — 25 Routes Need Schemas (Priority: HIGH)

Add Zod input validation to these POST/PATCH route handlers:

### AI Routes (5)
- `src/app/api/ai/advisor/route.ts`
- `src/app/api/ai/outcome/route.ts`
- `src/app/api/ai/protocols/route.ts`
- `src/app/api/ai/quiz/route.ts`
- `src/app/api/ai/skin-analysis/route.ts`

### Dashboard Entry Routes (7)
- `src/app/api/dashboard/entry/ceo-note/route.ts`
- `src/app/api/dashboard/entry/consult-notes/route.ts`
- `src/app/api/dashboard/entry/eod-recap/route.ts`
- `src/app/api/dashboard/entry/inventory/route.ts`
- `src/app/api/dashboard/entry/review/route.ts`
- `src/app/api/dashboard/entry/room-issue/route.ts`
- `src/app/api/dashboard/entry/staff-note/route.ts`

### Mastermind Routes (8)
- `src/app/api/mastermind/aura-import/route.ts`
- `src/app/api/mastermind/consent/route.ts`
- `src/app/api/mastermind/copilot/route.ts`
- `src/app/api/mastermind/plan/route.ts`
- `src/app/api/mastermind/scan/route.ts`
- `src/app/api/mastermind/sessions/[id]/route.ts`
- `src/app/api/mastermind/sessions/[id]/validate/route.ts`
- `src/app/api/mastermind/sessions/route.ts`

### Other (5)
- `src/app/api/booking/book/route.ts`
- `src/app/api/dashboard/auth/logout/route.ts`
- `src/app/api/photo/upload/route.ts`
- `src/app/api/webhooks/mangomint/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

**Pattern to follow:** See `src/app/api/contact/route.ts` or `src/app/api/consultation/submit/route.ts` for the validated pattern (parse body with `.safeParse()`, return 422 on failure).

---

## 2. Accessibility — 141 Components Need ARIA (Priority: MEDIUM)

### Critical (patient-facing forms):
- `src/components/quiz/TreatmentQuiz.tsx` — 6 buttons, 4 inputs, 0 aria
- `src/components/quiz/SkinQuiz.tsx` — 8 buttons, 3 inputs, 0 aria
- `src/components/intake/IntakeFormRenderer.tsx` — 6 buttons, 6 inputs, 0 aria
- `src/components/consultation/ConsultationWizard.tsx` — 6 buttons, 4 inputs
- `src/components/quiz/QuizSection.tsx` — 7 buttons, 0 aria
- `src/components/forms/WaitlistForm.tsx`

### What to add:
- `aria-label` on icon-only buttons
- `aria-label` or `aria-labelledby` on form inputs without visible `<label>`
- `role="button"` on clickable `<div>` elements
- `aria-expanded` on disclosure/accordion triggers
- `aria-live="polite"` on status messages and loading indicators

---

## 3. Test Coverage — Priority Modules (Priority: MEDIUM)

### Compliance-critical (must test):
- `src/lib/compliance/compliance-checker.ts`
- `src/lib/audit/audit-trail.ts`
- `src/lib/compliance/hipaa-audit.ts`
- `src/lib/compliance/osha-tracker.ts`
- `src/lib/consent/consent-manager.ts`

### AI/Intelligence (should test):
- `src/lib/ai/ai-plan-generator.ts`
- `src/lib/ai/ai-recommender.ts`
- `src/lib/ai/ai-simulation.ts`
- `src/lib/predictions/` (churn, no-show, revenue-anomaly)
- `src/lib/recommendations/engine.ts`

### Attribution (should test):
- `src/lib/attribution/upsert-client-attribution.ts`

128 total untested modules. Full list available in the audit.

---

## 4. Operational Setup (NOT code — requires manual action)

### Mangomint Webhook Registration
The webhook handler at `/api/webhooks/mangomint` is built (684 lines, HMAC-SHA256 verification). But:
1. Contact Mangomint support to register webhook URL: `https://ranibeautyclinic.com/api/webhooks/mangomint`
2. Set `MANGOMINT_WEBHOOK_SECRET` in Vercel environment variables
3. Request events: `appointment.created`, `appointment.completed`, `appointment.cancelled`

### Airtable Attribution Fields
The Clients table needs these fields (if not already created):
- Lead Source, Lead Medium, Lead Campaign, Lead Ad Set, Lead Ad
- Lead Offer, Lead Landing Page, Lead Keyword, Lead Referrer
- Attribution ID, Attribution Model, First Touch At, Last Touch At
- UTM Source, UTM Medium, UTM Campaign, UTM Content, UTM Term

### Ad Launch
- Meta Ads: Use UTM format `?utm_source=facebook&utm_medium=paid_social&utm_campaign=CAMPAIGN_NAME`
- Google Ads: Use `?utm_source=google&utm_medium=cpc&utm_campaign=CAMPAIGN_NAME&utm_term=KEYWORD`
- The attribution hook will auto-capture and persist these through to Airtable

---

## Already Done (no action needed)

- [x] Console.log normalization (all debug → console.error)
- [x] Env lazy initialization (stripe, square, meta-capi, plan-followups, mastermind/complete)
- [x] Dead code purge (52,607 lines, 150+ stub routes, 80+ dead lib modules)
- [x] Type safety (0 `any` remaining)
- [x] Attribution pipeline (useAttribution → contact form → upsertClientAttribution → Airtable)
- [x] Mangomint booking SDK (loaded, CTAs wired, webhook handler built)
- [x] Loading states (clients, consultations, settings)
- [x] Alt text accessibility fix (PhotoSimulation.tsx)
