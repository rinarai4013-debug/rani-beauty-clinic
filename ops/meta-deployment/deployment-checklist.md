# Deployment Checklist — Meta Commander OS v8.0 Rollout

Source: `rani-beauty-clinic/docs/META-COMMANDER-OS-v8.md`

---

## Phase 1 — Canon Lock

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 1.1 | Lock canonical doc | Confirm META-COMMANDER-OS-v8.md is final and owner-approved | Owner | CRITICAL | COMPLETE | None | Yes | Owner sign-off | 100 | 🛡️ Canon locked |
| 1.2 | Distribute to team | Share canonical doc with all operators and stakeholders | Owner | HIGH | NOT_STARTED | None | No | Distribution log | 80 | — |
| 1.3 | Confirm version control | Ensure doc is under change-control protection | Ops | HIGH | NOT_STARTED | None | No | Change-control file active | 90 | — |

---

## Phase 2 — Gate 1: Tracking Verification

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 2.1 | Verify Meta Pixel installed | Confirm Pixel ID 769852657929598 fires on ranibeautyclinic.com | Ops | CRITICAL | ✅ DONE | — | No | Code: `Analytics.tsx` loads `fbevents.js`, inits pixel, fires `PageView`. Live site confirms script present. | 100 | — |
| 2.2 | Verify conversion event configured | Confirm primary conversion event in Events Manager | Ops | CRITICAL | PARTIAL | VERIFY — Events Manager access needed | No | Code: 13 events mapped in `events.ts` (Lead, Schedule, Purchase, etc.). Platform receipt VERIFY. | 100 | — |
| 2.3 | Test conversion event fire | Submit real test form and confirm event fires | Ops | CRITICAL | VERIFY | Needs live test | No | Test submission + event log | 100 | — |
| 2.4 | Verify phone/booking events | Confirm click-to-call and booking-click events if used | Ops | HIGH | ✅ DONE | — | No | Code: `trackPhoneClick()` → Contact, `trackBookingOpen()` → Schedule in `events.ts` | 80 | — |
| 2.5 | Check duplicate counting | Confirm no duplicate conversion counting | Ops | HIGH | ✅ DONE (page load) | — | No | Live site audit: 1× init, 1× PageView, 1× fbevents.js. No GTM Meta tags firing. Conversion-level dedup confirmed via live test. | 80 | — |
| 2.6 | Document attribution window | Record attribution window setting | Ops | MEDIUM | VERIFY | Needs Events Manager access | No | Settings screenshot | 60 | — |
| 2.7 | Confirm Events Manager active | Verify Events Manager shows active status | Ops | HIGH | VERIFY | Needs Meta Business Manager login | No | Status screenshot + 14-day active history | 80 | — |
| 2.8 | Gate 1 sign-off | All tracking items verified and documented | Owner | CRITICAL | NOT_STARTED | 2.2, 2.3, 2.5, 2.6, 2.7 | Yes | Completed verification log | 100 | 📡 Gate 1 complete |

---

## Phase 3 — Gate 2: Compliance Review

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 3.1 | Verify ad account standing | Confirm Meta Ad Account 953844565746356 is in good standing | Ops | CRITICAL | NOT_STARTED | VERIFY | No | Account status screenshot | 100 | — |
| 3.2 | Verify FB page quality | Check Facebook page quality/recommendation status | Ops | CRITICAL | NOT_STARTED | VERIFY | No | Page quality screenshot | 100 | — |
| 3.3 | Review Special Ad Category | Determine if health/wellness category applies | Ops | HIGH | NOT_STARTED | None | No | Policy review notes | 90 | — |
| 3.4 | Audit ad copy compliance | Run all ad copy through Copy Risk Filter (7 questions) | Ops | CRITICAL | NOT_STARTED | None | No | Copy Risk Filter results | 100 | — |
| 3.5 | Verify no brand-name misuse | Confirm no prohibited brand-name medication references | Ops | HIGH | NOT_STARTED | None | No | Copy audit log | 90 | — |
| 3.6 | Verify no unavailable services | Confirm no ads for services that haven't passed Gate 3 | Ops | CRITICAL | NOT_STARTED | Phase 4 | No | Service matrix cross-check | 100 | — |
| 3.7 | Identity compliance check | Confirm no public-facing Rina references in ads | Ops | HIGH | NOT_STARTED | None | No | Copy audit log | 90 | — |
| 3.8 | Gate 2 sign-off | All compliance items verified | Owner | CRITICAL | NOT_STARTED | 3.1-3.7 | Yes | Completed compliance log | 100 | ⚖️ Gate 2 complete |

---

## Phase 4 — Gate 3: Service Readiness

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 4.1 | GLP-1 readiness | Verify GLP-1 is live, fulfillable, priced, staffed, with follow-up pipeline | Owner | CRITICAL | NOT_STARTED | VERIFY | Yes | Service matrix row | 100 | — |
| 4.2 | Sofwave readiness | Verify Sofwave is live, fulfillable, priced, staffed | Owner | HIGH | NOT_STARTED | VERIFY | Yes | Service matrix row | 80 | — |
| 4.3 | Peptide readiness | Verify peptide compliance path and fulfillment | Owner | MEDIUM | NOT_STARTED | VERIFY | Yes | Service matrix row | 60 | — |
| 4.4 | Women's HRT readiness | Verify women's hormone therapy workflow and availability | Owner | MEDIUM | NOT_STARTED | VERIFY | Yes | Service matrix row | 60 | — |
| 4.5 | Men's TRT status | Confirm waitlist-only status (NP not available until after May 2026) | Owner | LOW | NOT_STARTED | NP availability | No | Confirmation | 40 | — |
| 4.6 | Wellness injections readiness | Verify wellness injection availability and pricing | Owner | LOW | NOT_STARTED | VERIFY | Yes | Service matrix row | 40 | — |
| 4.7 | Verify pricing current | Confirm all advertised prices are CLASS 1 verified | Owner | CRITICAL | NOT_STARTED | VERIFY | Yes | Price verification log | 100 | — |
| 4.8 | Gate 3 sign-off | All service readiness items verified per matrix | Owner | CRITICAL | NOT_STARTED | 4.1-4.7 | Yes | Completed service matrix | 100 | 🧪 Gate 3 complete |

---

## Phase 5 — Gate 4: Funnel / Landing Page Readiness

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 5.1 | Mobile speed test | Confirm landing page mobile load time is acceptable | Ops | HIGH | NOT_STARTED | VERIFY | No | PageSpeed screenshot | 80 | — |
| 5.2 | CTA verification | Confirm single, clear CTA on landing page | Ops | HIGH | NOT_STARTED | None | No | Page screenshot | 80 | — |
| 5.3 | Message match audit | Confirm landing page message matches ad creative intent | Ops | HIGH | NOT_STARTED | Phase 7 | No | Comparison notes | 80 | — |
| 5.4 | Trust signals check | Verify trust signals visible (location, reviews, credentials) | Ops | MEDIUM | NOT_STARTED | None | No | Page screenshot | 60 | — |
| 5.5 | Form end-to-end test | Submit test form and confirm full flow works (Airtable row + Resend email + n8n webhook + Meta Lead event) | Ops | CRITICAL | PARTIAL | Code ✅, env vars ✅, route deployed ✅ — live form submission test remains. Use live-test-checklist.md Test 2. | No | Test submission log | 100 | — |
| 5.6 | Confirmation path test | Verify confirmation page/email after form submit | Ops | HIGH | NOT_STARTED | 5.5 | No | Confirmation screenshot | 80 | — |
| 5.7 | Phone link test | Verify click-to-call link works on mobile | Ops | MEDIUM | NOT_STARTED | None | No | Test call log | 60 | — |
| 5.8 | Lead form privacy policy | Confirm lead form has appropriate fields and privacy policy | Ops | HIGH | NOT_STARTED | None | No | Form review notes | 80 | — |
| 5.9 | Gate 4 sign-off | All funnel/landing page items verified | Owner | CRITICAL | NOT_STARTED | 5.1-5.8 | Yes | Completed funnel audit | 100 | 🚪 Gate 4 complete |

---

## Phase 6 — Asset Bank Extraction

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 6.1 | Extract ad copy | Move all approved ad copy to ad-copy-bank.md | Ops | HIGH | NOT_STARTED | None | No | File created | 80 | — |
| 6.2 | Extract Reels scripts | Move all Reel scripts to reels-scripts.md | Ops | MEDIUM | NOT_STARTED | None | No | File created | 60 | — |
| 6.3 | Extract Story scripts | Move all Story frames to story-scripts.md | Ops | MEDIUM | NOT_STARTED | None | No | File created | 60 | — |
| 6.4 | Extract DM scripts | Move all DM templates to dm-scripts.md | Ops | HIGH | NOT_STARTED | None | No | File created | 80 | — |
| 6.5 | Extract comment templates | Move all comment templates to comment-templates.md | Ops | HIGH | NOT_STARTED | None | No | File created | 80 | — |
| 6.6 | Extract review templates | Move all review templates to review-response-templates.md | Ops | MEDIUM | NOT_STARTED | None | No | File created | 60 | — |
| 6.7 | Owner approval of assets | Owner reviews and approves all extracted assets | Owner | CRITICAL | NOT_STARTED | 6.1-6.6 | Yes | Owner sign-off | 100 | 🗂️ Asset bank built |

---

## Phase 7 — Campaign Draft Build

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 7.1 | Draft Campaign 1 (GLP-1) | Build GLP-1 conversion campaign with 3-5 ad variations | Ops | CRITICAL | NOT_STARTED | Gates 1-4 | Yes | Campaign draft | 100 | — |
| 7.2 | Draft Campaign 2 (Sofwave) | Build Sofwave rescue campaign | Ops | HIGH | NOT_STARTED | Gates 1, 4 | Yes | Campaign draft | 80 | — |
| 7.3 | Draft Campaign 3 (Brand) | Build brand awareness / content campaign | Ops | MEDIUM | NOT_STARTED | Gate 2 | Yes | Campaign draft | 60 | — |
| 7.4 | Draft Campaign 4 (Men's Waitlist) | Build men's health waitlist campaign | Ops | LOW | NOT_STARTED | Gate 2 | Yes | Campaign draft | 40 | — |
| 7.5 | Campaign 5 status check | Confirm peptide campaign remains on HOLD per Gate 2 | Ops | LOW | NOT_STARTED | Gate 2 | No | Status note | 30 | — |
| 7.6 | Owner approval of drafts | Owner reviews all campaign drafts before build | Owner | CRITICAL | NOT_STARTED | 7.1-7.5 | Yes | Owner sign-off | 100 | 🎯 Campaign drafts built |

---

## Phase 8 — Lead Response Readiness

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 8.1 | Assign DM responder | Assign team member for DM response duty | Owner | HIGH | NOT_STARTED | None | Yes | Assignment log | 80 | — |
| 8.2 | Assign comment responder | Assign team member for comment response duty | Owner | HIGH | NOT_STARTED | None | Yes | Assignment log | 80 | — |
| 8.3 | Review response assignment | Assign team member for review monitoring | Owner | MEDIUM | NOT_STARTED | None | Yes | Assignment log | 60 | — |
| 8.4 | DM template approval | Confirm DM templates approved for first use | Owner | CRITICAL | NOT_STARTED | 6.4 | Yes | Owner sign-off | 100 | — |
| 8.5 | Comment template approval | Confirm comment templates approved for first use | Owner | CRITICAL | NOT_STARTED | 6.5 | Yes | Owner sign-off | 100 | — |
| 8.6 | Escalation path confirmed | Confirm escalation path for complaints, legal, medical, media | Owner | HIGH | NOT_STARTED | None | Yes | Escalation doc | 80 | — |
| 8.7 | Lead response sign-off | All response systems ready and assigned | Owner | CRITICAL | NOT_STARTED | 8.1-8.6 | Yes | Readiness confirmation | 100 | 💬 Lead response ready |

---

## Phase 9 — Controlled Launch

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 9.1 | Launch Campaign 3 (Brand) | Activate brand awareness at minimum budget | Ops | HIGH | NOT_STARTED | 7.3 | Yes | Campaign live screenshot | 80 | — |
| 9.2 | Launch Campaign 1 (GLP-1) | Activate GLP-1 conversions at test budget | Ops | CRITICAL | NOT_STARTED | 7.1 | Yes | Campaign live screenshot | 100 | — |
| 9.3 | Launch Campaign 2 (Sofwave) | Activate Sofwave if Gate 4 passed | Ops | HIGH | NOT_STARTED | 7.2 | Yes | Campaign live screenshot | 80 | — |
| 9.4 | Set up daily monitoring | Configure daily delivery check routine | Ops | HIGH | NOT_STARTED | None | No | Monitoring schedule | 80 | — |
| 9.5 | Begin community response cadence | Start daily DM/comment/review check cycle | Team | HIGH | NOT_STARTED | 8.7 | No | First day log | 80 | — |
| 9.6 | Launch confirmation | All initial campaigns live and monitored | Owner | CRITICAL | NOT_STARTED | 9.1-9.5 | Yes | Launch confirmation | 100 | 🚀 Controlled launch live |

---

## Phase 10 — 72-Hour Review

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 10.1 | Review delivery status | Confirm all campaigns are delivering | Ops | HIGH | NOT_STARTED | 9.6 | No | Delivery report | 80 | — |
| 10.2 | Check pixel fire status | Verify conversion events still firing | Ops | CRITICAL | NOT_STARTED | 9.6 | No | Events Manager check | 100 | — |
| 10.3 | Review initial metrics | Document initial CTR, CPC, impressions (label as PROVISIONAL) | Ops | HIGH | NOT_STARTED | 10.1 | No | Metrics snapshot | 80 | — |
| 10.4 | Community response check | Verify DMs/comments being answered within SLA | Ops | HIGH | NOT_STARTED | 9.5 | No | Response time log | 80 | — |
| 10.5 | Identify obvious failures | Flag any ad with zero delivery or technical issues | Ops | HIGH | NOT_STARTED | 10.1 | No | Issue list | 80 | — |
| 10.6 | 72-hour sign-off | Initial signal review complete, no critical issues | Owner | HIGH | NOT_STARTED | 10.1-10.5 | Yes | Review summary | 90 | 👀 72-hour check done |

---

## Phase 11 — Weekly Optimization

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 11.1 | Weekly performance review | Review campaign performance per optimization cadence | Ops | HIGH | NOT_STARTED | 10.6 | No | Weekly report | 80 | — |
| 11.2 | Pause underperformers | Pause ads with $50+ spend and zero conversions | Ops | HIGH | NOT_STARTED | 11.1 | No | Pause log | 80 | — |
| 11.3 | Community management report | Report DM/comment/review response times and backlog | Ops | HIGH | NOT_STARTED | None | No | Community report | 80 | — |
| 11.4 | Budget review | Review spend vs. budget, flag waste | Ops | HIGH | NOT_STARTED | 11.1 | No | Budget report | 80 | — |
| 11.5 | Owner weekly report | Deliver weekly report with confidence labels | Ops | CRITICAL | NOT_STARTED | 11.1-11.4 | No | Report delivered | 100 | 📈 Weekly optimization complete |

---

## Phase 12 — Change Control Enforcement

| ID | Task | Description | Owner | Priority | Status | Blocker | Approval Required | Evidence | Health Impact | Notification |
|----|------|-------------|-------|----------|--------|---------|-------------------|----------|---------------|--------------|
| 12.1 | Change log active | Confirm change-control.md is being used for all changes | Ops | HIGH | NOT_STARTED | None | No | Active log | 80 | — |
| 12.2 | Compliance check on changes | Every change passes compliance and identity check | Ops | CRITICAL | NOT_STARTED | None | No | Check log | 100 | — |
| 12.3 | Owner approval enforcement | Changes requiring approval are not applied without it | Ops | CRITICAL | NOT_STARTED | None | Yes | Approval records | 100 | — |
| 12.4 | Canon protection confirmed | No unauthorized modifications to v8.0 doc | Ops | CRITICAL | NOT_STARTED | None | No | Diff check | 100 | 🔒 Change control applied |
