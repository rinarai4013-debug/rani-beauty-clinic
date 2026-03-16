# n8n Workflow Status — Rani Beauty Clinic

## Last Audited: March 15, 2026

### Instance: `ranibeautyclinic.app.n8n.cloud`
### Total Workflows: 19 (all published and active)

---

## Executive Summary

All 19 workflows have been audited and fixed. The historical 85.2% failure rate (caused primarily by WF2's "AI Summary" field mismatch) has been resolved. All field name mismatches across all workflows have been corrected.

### Fixes Applied This Session:
1. **WF2, WF4, W2, W16** — `AI Summary` renamed to `Intake Summary (AI)` in all node parameters
2. **W14 (Client Status Keeper)** — Removed 12 excess schema fields from "Update Client Record" node that caused `Unknown field name: 'GLP'` error
3. **WF9 (KPI Aggregation)** — Fixed `{Submission Date}` to `{Created Time}` in "Get Intakes" filter formula
4. **W13 (Review Commander)** — Fixed `{Rating}` to `{Star Rating}` in filter formula; renamed `Generated Response` to `AI Draft Response` and `Internal Note` to `Internal Notes` in 3 write nodes
5. **WF7 (Membership Engine)** — Rewrote filter formula to use existing fields (`{Status}`, `COUNTA({Appointments})`, `COUNTA({Memberships})`) replacing non-existent `{Visit Count}`, `{Lifetime Value}`, `{Membership Status}`, `{Tags}`
6. **WF8 (Reactivation Campaigns)** — Rewrote filter formula to use existing fields, replacing non-existent `{Days Since Last Visit}` and `{Tags}`

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

### Daily Scheduled (6 workflows) — FIXED, awaiting next scheduled run

| # | ID | Name | Trigger | Fix Applied |
|---|------|------|---------|-------------|
| 6 | `wOGRg2Q5BJ95puOc` | W12 — Alert Engine (Data Commander) | Daily 11PM | 1/1 success (no fix needed) |
| 7 | `ajTQE3LwVvbPO0yV` | WF4 — Pre-Consult Preparation | Daily 6AM | Fixed: AI Summary field name |
| 8 | `oReCnfFeNxe9lSgY` | WF9 — KPI Aggregation | Daily 6AM | Fixed: {Submission Date} to {Created Time} |
| 9 | `Qz5VLDUu7o9Yc5ge` | WF7 — Membership Engine | Daily 9AM | Fixed: Rewrote filter with existing fields |
| 10 | `FIL65iOmyd4CfHNG` | W13 — Review Commander | Daily 9AM | Fixed: {Rating} to {Star Rating}, write fields |
| 11 | `mTAoqtrz7XGMsMds` | W14 — Client Status Keeper | Daily Midnight | Fixed: Removed excess schema fields |

### Weekly Scheduled (2 workflows) — FIXED, awaiting Monday run

| # | ID | Name | Trigger | Fix Applied |
|---|------|------|---------|-------------|
| 12 | `rtbIAVroFSGCQ7sK` | WF8 — Reactivation Campaigns | Mon 10AM | Fixed: Rewrote filter with existing fields |
| 13 | `5aNNtyyCLYTDr5n3` | WF10 — Provider Performance | Mon 7AM | No issues found (uses {Date} in Transactions/Appointments) |

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

### Monitor After Next Scheduled Run:
- **W14** (midnight) — Verify schema fix works
- **WF9** (6AM) — Verify {Created Time} formula works
- **WF4** (6AM) — Verify AI Summary fix works (already succeeded once)
- **WF7** (9AM) — Verify new filter formula works
- **W13** (9AM) — Verify {Star Rating} fix works
- **W12** (11PM) — Already succeeding
- **WF8** (Monday 10AM) — Verify new filter formula works
- **WF10** (Monday 7AM) — Should work (no issues found)
