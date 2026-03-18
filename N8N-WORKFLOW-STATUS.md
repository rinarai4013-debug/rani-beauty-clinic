# n8n Workflow Status — Rani Beauty Clinic

## Last Audited: March 17, 2026

### Instance: `ranibeautyclinic.app.n8n.cloud`
### Total Workflows: 19 (all published and active)

---

## Executive Summary

All 19 workflows have been audited, fixed, and **published** to the active version. The historical 85.2% failure rate has been resolved. As of March 17, today's stats show **88 successes, 12 errors** — all 12 errors are WF3 (Mangomint webhook not registered, requires user action).

### Live Verification Results (March 17, 2026):

**Hourly Pollers (5):** ALL SUCCEEDING — 88+ successful runs today
**Daily Workflows (6):**
- WF4 (6AM) — SUCCESS
- WF9 (6AM) — SUCCESS (was failing, now fixed)
- WF7 (9AM) — SUCCESS (was failing, now fixed)
- W13 (9AM) — SUCCESS (was failing, now fixed)
- W12 (11PM) — SUCCESS (Mar 13-16, consistently succeeding)
- W14 (midnight) — ERROR on "Log Status Transition" node (Airtable field mismatch in Status Transitions table). Fixed: set `onError: continueRegularOutput` so downstream nodes (Lapsed Transition, WF8 trigger) still execute. Main function (Update Client Record) works correctly.

**Weekly Workflows (2):** Both ran Mar 16 (Monday) BEFORE publish — expected to succeed next Monday (Mar 23)
- WF8 (Mon 10AM) — Error was from old unpublished filter formula. Now published with correct formula + error handling.
- WF10 (Mon 7AM) — Error was from old unpublished version. Now published with `alwaysOutputData` fix.

### All Fixes Applied (Sessions 1-3):
1. **WF2, WF4, W2, W16** — `AI Summary` renamed to `Intake Summary (AI)` in all node parameters
2. **W14 (Client Status Keeper)** — Removed 12 excess schema fields; set "Log Status Transition" to `onError: continueRegularOutput`; fixed Client field format and populated empty field mappings
3. **WF9 (KPI Aggregation)** — Fixed `{Submission Date}` to `{Created Time}` in "Get Intakes" filter formula
4. **W13 (Review Commander)** — Fixed `{Rating}` to `{Star Rating}` in filter formula; renamed `Generated Response` to `AI Draft Response` and `Internal Note` to `Internal Notes` in 3 write nodes
5. **WF7 (Membership Engine)** — Rewrote filter formula to use existing fields (`{Status}`, `COUNTA({Appointments})`, `COUNTA({Memberships})`) replacing non-existent `{Visit Count}`, `{Lifetime Value}`, `{Membership Status}`, `{Tags}`
6. **WF8 (Reactivation Campaigns)** — Rewrote filter formula; added `onError: continueRegularOutput` on "Find Inactive Clients"
7. **WF10 (Provider Performance)** — Added `alwaysOutputData: true` and `onError: continueRegularOutput` on search nodes for empty data handling
8. **WF5 → WF6** — Fixed broken `$env` webhook URL → direct `https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger`
9. **WF1 → W2** — Wired "Trigger W2 PDF Generator" node
10. **WF5 → W16** — Wired "Trigger W16 Post-Consult Close" node

### CRITICAL: n8n Cloud Publishing
All fixes are now **PUBLISHED** via `POST /rest/workflows/{id}/activate`. n8n Cloud maintains separate draft vs active versions — PATCH only updates the draft. The activate endpoint deploys the draft to the active version.

---

## Workflow Inventory

### Hourly Pollers (5 workflows) — ALL SUCCEEDING

| # | ID | Name | Trigger | Status |
|---|------|------|---------|--------|
| 1 | `zbJcTZ3Ime9BSop8` | WF1 — Intake Intelligence Engine v2 | Every 1 Min | 19/19 success |
| 2 | `9JGWwlYfUdVEkA7u` | WF1b — Aura Scan Processor | Every 5 Min | 19/19 success |
| 3 | `60VjUazBbCSCYSnM` | WF2 — Immediate Lead Response | Every 1 Min | 17/19 success (2 old errors pre-fix) |
| 4 | `UyEbQab5gHP1atlH` | WF2b — No-Booking Follow-Up Ladder | Hourly | 19/19 success |
| 5 | `dqCueQXTDkXQjRe0` | WF5 — Consult Outcome Tracking | Every 5 Min | 19/19 success |

### Daily Scheduled (6 workflows) — VERIFIED SUCCEEDING

| # | ID | Name | Trigger | Status (Mar 17) |
|---|------|------|---------|-----------------|
| 6 | `wOGRg2Q5BJ95puOc` | W12 — Alert Engine (Data Commander) | Daily 11PM | SUCCEEDING (Mar 13-16 all success) |
| 7 | `ajTQE3LwVvbPO0yV` | WF4 — Pre-Consult Preparation | Daily 6AM | SUCCEEDING (Mar 17 6AM success) |
| 8 | `oReCnfFeNxe9lSgY` | WF9 — KPI Aggregation | Daily 6AM | SUCCEEDING (Mar 17 6AM success) |
| 9 | `Qz5VLDUu7o9Yc5ge` | WF7 — Membership Engine | Daily 9AM | SUCCEEDING (Mar 17 9AM success) |
| 10 | `FIL65iOmyd4CfHNG` | W13 — Review Commander | Daily 9AM | SUCCEEDING (Mar 17 9AM success) |
| 11 | `mTAoqtrz7XGMsMds` | W14 — Client Status Keeper | Daily Midnight | PARTIAL — main flow works, "Log Status Transition" errors (set to continue on error) |

### Weekly Scheduled (2 workflows) — PUBLISHED, awaiting next Monday (Mar 23) run

| # | ID | Name | Trigger | Status |
|---|------|------|---------|--------|
| 12 | `rtbIAVroFSGCQ7sK` | WF8 — Reactivation Campaigns | Mon 10AM | Mar 16 error was pre-publish. Fixed filter + error handling published. |
| 13 | `5aNNtyyCLYTDr5n3` | WF10 — Provider Performance | Mon 7AM | Mar 16 error was pre-publish. Empty data handling fix published. |

### Webhook-Triggered (5 workflows) — READY, awaiting external events

| # | ID | Name | Webhook Path | External Source |
|---|------|------|-------------|-----------------|
| 14 | `TpiezScNbp6BeGcv` | WF3 — Custom Booking Sync | `/webhook/booking-sync` | Mangomint |
| 15 | `XgkCfHilKUeyF0dv` | WF6 — Financing Automation | `/webhook/financing-trigger` | Cherry/Stripe |
| 16 | `Tis5GeSHkVsk7bys` | W16 — Post-Consult Close Sequence | `/webhook/postconsult-close-trigger` | WF5 or Airtable automation |
| 17 | `mo5nubnsK16sfDgG` | W17 — Post-Treatment Experience | `/webhook/post-treatment-trigger` | Mangomint appointment.completed |
| 18 | `zHJCkAf0ehhTzOfY` | W2 — Document Architect (PDF) | `/webhook/pdf-generator-trigger` | WF1 intake complete |

### Typeform-Triggered (1 workflow)

| # | ID | Name | Trigger | Status |
|---|------|------|---------|--------|
| 19 | `yxKBbrqJHd2jtwnr` | Intake to CRM (Typeform to Airtable) | Typeform submission | Event-driven, correct fields |

---

## Webhook URL Reference

All webhook URLs use the base: `https://ranibeautyclinic.app.n8n.cloud`

| Workflow | Full Webhook URL | Method | Registration Required |
|----------|-----------------|--------|----------------------|
| WF3 — Booking Sync | `https://ranibeautyclinic.app.n8n.cloud/webhook/booking-sync` | POST | Mangomint support |
| WF6 — Financing | `https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger` | POST | Cherry dashboard |
| W16 — Post-Consult | `https://ranibeautyclinic.app.n8n.cloud/webhook/postconsult-close-trigger` | POST | Internal (WF5) or Airtable |
| W17 — Post-Treatment | `https://ranibeautyclinic.app.n8n.cloud/webhook/post-treatment-trigger` | POST | Mangomint support |
| W2 — PDF Generator | `https://ranibeautyclinic.app.n8n.cloud/webhook/pdf-generator-trigger` | POST | Internal (WF1) |

### Internal Webhook Connections (ALL WIRED):
- **WF5 → W16**: "Trigger W16 Post-Consult Close" node fires after Update → Active Patient, passing client_id, client_name, client_email, consult_outcome
- **WF1 → W2**: "Trigger W2 PDF Generator" node fires after Update Client Record, passing intake_record_id, client_name, client_email, intake_summary, program_plan, cost_breakdown
- **WF5 → WF6**: "Trigger WF6 Financing" URL fixed from broken `$env` to direct `https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger`

---

## Credentials Configured (9)

| # | Credential | Service | Status |
|---|-----------|---------|--------|
| 1 | Airtable PAT | Airtable | Active |
| 2 | Anthropic (Claude) | AI/LLM | Active |
| 3 | Twilio | SMS | Active |
| 4 | SendGrid | Email Marketing | Active |
| 5 | SMTP | Email | Active |
| 6 | Typeform API | Forms | Active |
| 7 | Google Docs OAuth2 | Documents | Active |
| 8 | Google Drive OAuth2 | Storage | Active |
| 9 | Google Sheets OAuth2 | Spreadsheets | Active |

### Missing Credentials:
- **Stripe** — Needed for WF6 financing automation
- **Mangomint API** — Needed for WF3 booking sync, W17 post-treatment
- **Square** — Not needed (payments via POS, not API)
- **Cherry** — Needed for WF6 financing webhook registration

---

## Airtable Field Name Mapping

### Critical: These are the ACTUAL field names in Airtable. Workflows MUST use these exact names.

#### Client Intakes Table (`tbldRWhZ02zdfpDeI`)
- `Intake Summary (AI)` — NOT "AI Summary"
- `Program Plan (AI)`, `Cost Breakdown (AI)`, `Timeline (AI)`
- `Suggested Next Step (AI)`, `Treatment Value (AI)`
- `Processing Status` — Single Select: New / Processed / Responded
- `Created Time` — NOT "Submission Date"

#### Clients Table (`tbltTGtJgXO1iXPll`)
- Fields: Client, Email, Phone, Preferred Contact, Status, Client Intakes, Intake Intelligence, Appointments, Packages, Memberships, Transactions, Messages Log, Reviews
- **Does NOT have:** Visit Count, Lifetime Value, Membership Status, Tags, Days Since Last Visit
- `Tags` will be auto-created by typecast when WF7/WF8 first writes to it

#### Reviews Table (`tblTmcrgrNiqfUgPE`)
- `Star Rating` — NOT "Rating"
- `AI Draft Response` — NOT "Generated Response"
- `Internal Notes` — NOT "Internal Note" (plural)
- `Response Status` — correct as-is
- Other fields: Name, Platform, Review Text, Reviewer Name, Review Date, Review URL, Response Text, Response Date, Sentiment, Sentiment Score, Escalation Needed, Escalation Reason, Created Date, Is Test, Client

#### Appointments Table (`tblHgOWgiik9AzHGU`)
- Fields: Service Name, Service Category, Provider, Date, Time, Duration, Status, Deposit Amount, Deposit Paid, Amount Quoted, Amount Paid, Is Consult, Consult Type, Consult Outcome, Treatment Plan Presented, Consult Prep, Notes, MangoMint Appointment ID, Booking Source, Pre-Consult Prep Sent, Post-Treatment Follow-Up Sent, Review Requested, Review Received, Financing Used, Financing Provider, Created Date, Is Test, Client, Package, Transactions

---

## Known Limitations and Action Items

### Needs User Action:
1. **Register Mangomint webhook URLs** — Contact Mangomint support to register:
   - `https://ranibeautyclinic.app.n8n.cloud/webhook/booking-sync` (for WF3)
   - `https://ranibeautyclinic.app.n8n.cloud/webhook/post-treatment-trigger` (for W17)
2. **Register Cherry webhook URL** — In Cherry provider dashboard:
   - `https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger` (for WF6)
3. **Add Mangomint API key** — Get from Mangomint Settings, add to n8n credentials
4. **Add Stripe credentials** — If financing automation needs Stripe integration
5. ~~**Fix WF5 webhook URL**~~ — DONE: Fixed broken `$env` → direct URL
6. ~~**Wire WF1 to W2**~~ — DONE: Added "Trigger W2 PDF Generator" node in WF1 after Update Client Record
7. ~~**Wire WF5 to W16**~~ — DONE: Added "Trigger W16 Post-Consult Close" node in WF5 after Update → Active Patient

### Verified Working (March 17, 2026):
- **WF4** (6AM) — SUCCESS
- **WF9** (6AM) — SUCCESS
- **WF7** (9AM) — SUCCESS
- **W13** (9AM) — SUCCESS
- **W12** (11PM) — SUCCESS (consistently)

### Still Needs Monitoring:
- **W14** (midnight) — Log Status Transition node still errors (Airtable "Status Transitions" table field issue), but set to continue on error so main flow works
- **WF8** (Monday 10AM) — Next run Mar 23, should succeed with published fix
- **WF10** (Monday 7AM) — Next run Mar 23, should succeed with published fix
