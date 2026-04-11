# Compliance Audit Runbook — Rani Beauty Clinic

**Location:** 401 Olympia Ave NE, Suite 101, Renton, WA 98056
**Business type:** Physician-supervised medical aesthetics clinic (medspa)
**Last updated:** 2026-04-10
**Owner:** Sukhi / Rina (founder-operators)
**Audience:** Sukhi, Rina, outside counsel, any inspector who walks in the door

> **⚠️ This runbook is not legal advice.** It is an operational checklist maintained by the engineering team. Regulatory requirements change. Before any audit or inspection, confirm current rules with: WA DOH medical aesthetics guidance, HHS OCR HIPAA guidance, FDA device compliance rules, DEA diversion control, and OSHA bloodborne pathogen standards. Retain a healthcare attorney licensed in WA state for formal compliance reviews.

---

## Table of contents

1. [The 9am-inspector checklist](#the-9am-inspector-checklist)
2. [Regulatory scope — what applies to Rani](#regulatory-scope)
3. [WA State — Department of Health](#wa-state--department-of-health)
4. [HIPAA (federal)](#hipaa-federal)
5. [FDA device + injectable sourcing](#fda-device--injectable-sourcing)
6. [DEA — controlled substances](#dea--controlled-substances)
7. [OSHA — bloodborne pathogens + workplace safety](#osha--bloodborne-pathogens--workplace-safety)
8. [Chart and consent retention](#chart-and-consent-retention)
9. [Business Associate Agreements (BAAs)](#business-associate-agreements-baas)
10. [The in-code compliance engine](#the-in-code-compliance-engine)
11. [Known gaps and open risks](#known-gaps-and-open-risks)
12. [Quarterly self-audit schedule](#quarterly-self-audit-schedule)
13. [Incident response](#incident-response)

---

## The 9am-inspector checklist

If someone walks in the door **right now** claiming to be from WA DOH, HHS OCR, FDA, DEA, or OSHA, this is what you pull up. All of it should be retrievable within 5 minutes from the dashboard's Compliance page (`/dashboard/compliance`) plus a couple of filing cabinets.

**Before you show them anything:**

1. **Politely ask for credentials.** Legitimate inspectors will show a badge and written notice. Unannounced inspections happen, but legitimate ones state which agency and which statutory authority they're invoking.
2. **Take their name, agency, badge number, phone number, and scope of inspection.** Write it down. This goes in `AUDIT-LOG.md` below.
3. **Call Sukhi or Rina immediately.** If neither is on-site, the inspector waits until they arrive. Do not give a tour, open files, or discuss specific patients with an inspector who has not been formally cleared by a principal.
4. **Do not answer questions you're not sure of.** "I need to check with my medical director" is a complete sentence. "I don't know" is better than a wrong answer that becomes a citation.

**What you show them (pick whichever subset their scope requires):**

| Inspector | First thing to pull up | Secondary | Where it lives |
|---|---|---|---|
| **WA DOH** (Department of Health) | Provider licenses with expiry dates | Delegation agreements (MD ↔ RN, ARNP credentials) | Dashboard `/compliance` → State Regulations tab + provider file binder |
| **HHS OCR** (HIPAA) | PHI access log last 30 days, breach log, BAAs | Privacy Notice of Practices, staff training records | Dashboard `/compliance` → HIPAA tab + provider file binder |
| **FDA** (injectables, devices) | Injectable source pharmacy invoices + batch/lot numbers | Device logs (Sofwave, laser, RF Microneedling), 510(k) paperwork, adverse event log | Dashboard `/compliance` → Devices tab + pharmacy invoice binder |
| **DEA** (controlled substances) | Current Schedule III-V inventory, reconciliation logs, destruction logs | DEA registration certificate | Dashboard `/compliance` → Controlled Substances tab + physical safe log book |
| **OSHA** | Bloodborne pathogen training records, sharps disposal logs, SDS binder, exposure incident reports | PPE inventory, waste manifest from medical waste hauler | Dashboard `/compliance` → OSHA tab + wall binder near hand-washing station |

**What you do NOT show them:**

- Any patient's chart unless they ask for a specific named patient AND you've called counsel
- Financial records (Square statements, P&L, revenue) unless the warrant/subpoena specifies financial
- Staff payroll or personnel files unless the warrant/subpoena specifies
- Internal business strategy documents, Slack, email, etc.

**When they leave:**

1. Save a copy of whatever written notice they left.
2. Photograph any citations they issued (front and back).
3. Call the healthcare attorney same-day.
4. Update `docs/compliance/AUDIT-LOG.md` with: date, inspector, scope, duration, findings, next steps.

---

## Regulatory scope

Rani operates at the intersection of five regulatory regimes. Each has independent triggers, penalties, and documentation requirements.

### 1. **Washington State Department of Health (DOH)**
- Governs scope of practice for licensed providers (MD, ARNP, PA, RN, LPN, MA)
- Governs delegation agreements between physicians and non-physician providers
- Licenses the facility as a medical practice
- Regulates "aesthetic medicine" as a subset of medical practice — injectables and lasers are delegated medical acts
- Enforcement via **Health Systems Quality Assurance (HSQA)** — complaint-driven, unannounced inspections possible
- **Rani's posture:** Rina (owner/operator) needs a licensed medical director physically or operationally supervising all injectable and laser work. "Mom" (the other provider on the website) must have her scope of practice documented with a delegation agreement from the supervising physician.

### 2. **Federal HIPAA / HITECH**
- Governs handling of Protected Health Information (PHI)
- Enforcement via **HHS Office for Civil Rights (OCR)** — complaint-driven primarily, random audits rare but increasing
- **Covered Entity status:** Rani is a covered entity under HIPAA because it's a healthcare provider that transmits health information electronically (e.g., Mangomint, Airtable, Resend, Twilio all process PHI). This is non-negotiable once you're doing medical aesthetics digitally.
- **Rani's posture:** not yet in full HIPAA compliance. See "Known gaps" section below.

### 3. **FDA** (Food and Drug Administration)
- Governs device approval (510(k) for Sofwave, PicoWay, laser hair removal, RF Microneedling)
- Governs injectable drug approval and labeling (Botox, Dysport, dermal fillers, GLP-1 drugs)
- Regulates compounding pharmacies (503A vs 503B) — which affects where Rani can legally source weight-loss peptides and custom injectables
- Enforcement via **FDA Office of Criminal Investigations (OCI)** for gross violations, **warning letters** for lesser ones
- **Rani's posture:** legitimate sources (QualiphyRx, Olympia Pharmacy, Hallandale Pharmacy), but chain of custody documentation is thin. All devices should be 510(k)-cleared — verify serial numbers and cert paperwork.

### 4. **DEA** (Drug Enforcement Administration)
- Governs scheduled drugs (Schedule II–V) — semaglutide/tirzepatide are NOT scheduled but testosterone IS (Schedule III), and if Rani ever prescribes any Schedule II controlled substance, that triggers DEA registration
- Governs chain of custody, storage (locked safe, access log), waste, destruction
- Enforcement via **DEA Diversion Control Division** — scheduled inspections + complaint-driven
- **Rani's posture:** **confirm with medical director** whether any currently-sourced products fall under DEA scheduling. If testosterone for TRT is dispensed on-site (not just prescribed for patient pickup at Olympia Pharmacy), DEA registration is required.

### 5. **OSHA** (Occupational Safety and Health Administration)
- Governs bloodborne pathogen exposure (Standard 29 CFR 1910.1030) — applies because staff handle needles
- Governs sharps disposal (FDA-cleared sharps containers, regulated medical waste hauler contract)
- Governs hazard communication (SDS sheets for all chemicals used on-site)
- Governs PPE availability (gloves, masks, eye protection)
- Requires annual bloodborne pathogen training for all staff with potential exposure
- Enforcement via **OSHA inspection** (complaint or random) — fines per violation can stack
- **Rani's posture:** basic SDS binder and sharps containers present. Training records need to be formalized. Medical waste hauler contract status unknown — verify.

---

## WA State — Department of Health

### What the inspector will ask for

1. **Facility license** — verify it's current, on the wall in the reception area, and matches the address on the lease.
2. **Medical director identity and credentials** — who signs for all injectables? What's their MD license number? Is it current? Does their DOH record show any actions/restrictions?
3. **Provider credentials for every person performing a procedure** — Rina's license, Mom's license, any RN or MA credentials. **Expiry dates.**
4. **Delegation agreements** — for every procedure a non-physician performs, there must be a written delegation from the medical director that specifies: the procedure, the level of supervision (general/indirect/direct), the training requirement, and the date. This is the single most audited item for medspas. If Rina is an RN injecting Botox, there MUST be a delegation agreement from the supervising physician that names Botox as a delegated task and documents Rina's training.
5. **Adverse event log** — any patient reaction, adverse outcome, complaint, or incident in the last 2 years. Must be maintained chronologically.
6. **Complaint log** — any formal patient complaint, how it was handled, how it was resolved.

### What Rani has right now

**In the code (good):**
- `src/lib/compliance/state-regulations.ts` defines `WA_SCOPE_OF_PRACTICE` — a complete 6-role scope table (physician, ARNP, PA, RN, LPN, MA) with allowed procedures, restricted procedures, supervision level, and prescriptive authority per role. This matches current WA state rules as of late 2025 — confirm with counsel before each major DOH action.
- `DelegationAgreement` and `ProviderLicense` types defined in `@/types/compliance`
- Functions to add, update, query licenses with expiry alerts

**In the dashboard (good):**
- `/dashboard/compliance` page with a State Regulations tab
- `/api/dashboard/compliance` endpoint that returns compliance scores across all modules

**Not yet done (risk):**
1. **The actual license records are not persisted.** `src/lib/compliance/state-regulations.ts` uses in-memory stores (`let providerLicenses: ProviderLicense[] = []`). On every server restart, the data is lost. **Before any state action, move this to Airtable** — create a "Compliance" base or add a "Licenses" and "DelegationAgreements" table to the main base.
2. **Actual provider license numbers, issue dates, and expiry dates need to be entered.** Rina, Mom, and any other provider. This is a 10-minute data entry task once the persistence is fixed.
3. **Delegation agreements need to be drafted and signed on paper.** The code can track the metadata, but the underlying legal document needs to be drafted by counsel and signed. Template should include: supervising physician name/MD#, delegated provider name/credentials, specific procedures delegated, training documentation, supervision type, effective date, review/renewal date, and signatures.

### Pre-audit checklist

- [ ] Provider licenses entered in Compliance system (Rina, Mom, any RN)
- [ ] License expiry alerts configured (90-day + 30-day warnings)
- [ ] Delegation agreement for every delegated procedure, signed and on file
- [ ] Medical director identified and credentials verified
- [ ] Facility license current and on display
- [ ] Adverse event log for past 24 months (digital + paper binder)
- [ ] Complaint log for past 24 months (digital + paper binder)
- [ ] Scope of practice reference table posted in back office

### Common citations (what to avoid)

- **"Practicing outside scope"** — an RN performing a procedure not covered by their delegation agreement. Fix: ensure the delegation agreement is broad enough to cover every procedure the RN actually does, AND that training records back it up.
- **"Inadequate supervision"** — the medical director is named but not actually present or reachable when procedures happen. Fix: document the supervision structure explicitly (on-site days, phone availability, emergency contact), and prove it with scheduling records.
- **"Unlicensed practice"** — someone whose license has lapsed continues to practice. Fix: the 90-day expiry alert in the Compliance engine is specifically for this.
- **"Missing delegation"** — no written agreement for a delegated procedure. Fix: counsel-drafted templates, signed on Day 1 of every new provider's tenure.

---

## HIPAA (federal)

HIPAA has three components: **Privacy Rule, Security Rule, Breach Notification Rule**. All three apply to Rani.

### Privacy Rule — what it covers

- How PHI can be used and disclosed
- Patient rights (access, amendment, accounting of disclosures)
- Notice of Privacy Practices (must be posted and given to every patient)

### Security Rule — what it covers

- Administrative, physical, and technical safeguards for electronic PHI (ePHI)
- Access controls (who sees what, audit logs)
- Encryption of ePHI at rest and in transit
- Workstation security, mobile device policy, password policy

### Breach Notification Rule — what it covers

- A "breach" is any unauthorized acquisition, access, use, or disclosure of PHI that compromises security or privacy
- Thresholds:
  - **< 500 individuals affected**: notify each individual within 60 days of discovery; log for annual HHS report
  - **≥ 500 individuals in a single state**: notify individuals + HHS + prominent media outlet within 60 days
- "Reasonable delay" for law enforcement is allowed, in writing
- Annual breach log must be submitted to HHS OCR if any breaches occurred, even small ones

### What the inspector will ask for

1. **Notice of Privacy Practices** — posted in reception + given to every new patient + on the website
2. **PHI access log** — who accessed which patient's record, when, and why. Must be chronological, tamper-evident, retained 6 years
3. **Business Associate Agreements (BAAs)** — signed contracts with every vendor that touches PHI (see BAA section below)
4. **Staff HIPAA training records** — every workforce member must receive HIPAA training at hire and annually
5. **Security policies** — written policies covering access controls, password requirements, device security, incident response
6. **Breach log** — any incidents and how they were handled
7. **Risk assessment** — a documented analysis of where PHI flows, what could go wrong, what mitigations exist

### What Rani has right now

**In the code (good):**
- `src/lib/compliance/hipaa-audit.ts` implements:
  - `logPHIAccess()` — append-only access log with user, patient, action, timestamp, IP
  - `getAccessLogs()` — filterable query
  - `PHIAccessLog`, `BreachNotification`, `BusinessAssociateAgreement`, `TrainingRecord` types
  - `calculateHIPAAScore()` — composite 0-100 compliance score
- Comprehensive test suite at `src/lib/compliance/__tests__/hipaa-audit.test.ts` (not fully verified for pass rate — check before audit)

**In the dashboard (partial):**
- `/dashboard/compliance` includes a HIPAA tab showing recent access logs and score

**Not yet done (critical gaps):**
1. **No actual PHI access logging is happening in production.** The `logPHIAccess()` function exists but **no routes call it**. Every time a staff member opens a client profile in the dashboard, that's a PHI access event that must be logged. This is the single biggest HIPAA gap in the codebase right now.
2. **No BAAs are signed with the current vendor list.** Airtable, Resend, Twilio, Mangomint, Anthropic (Claude API), SendGrid, Pinecone — all of these potentially touch PHI and none of them have BAAs on file. See BAA section below for what each vendor's BAA terms look like.
3. **No Notice of Privacy Practices exists.** Needs to be drafted from the HHS template and posted on the website + printed for front desk.
4. **No HIPAA training has been documented.** Staff need to complete a HIPAA training course (free ones exist from HHS, paid ones from HIPAAtrek, HealthStream, etc.) and the completion must be recorded.
5. **No risk assessment has been done.** This is a formal exercise documenting where PHI flows through the clinic: intake form → Airtable → Resend email → n8n webhook → dashboard → Square payments. Every hop is a potential exposure. Counsel should facilitate.
6. **No security policies document.** Password policy, device policy, access termination policy — all need to be written and signed by every workforce member.

### Pre-audit checklist

- [ ] Notice of Privacy Practices drafted, signed by counsel, posted on reception wall + website
- [ ] BAAs executed with all vendors touching PHI (see list below)
- [ ] Staff HIPAA training completed, certificates on file
- [ ] PHI access logging wired into every dashboard route that reads client data
- [ ] Security policy document signed by all workforce members
- [ ] Risk assessment conducted and documented
- [ ] Breach response procedure documented (see Incident Response section below)
- [ ] Annual HIPAA Security Rule assessment on file

### HIPAA technical safeguards — code checklist

These are the Security Rule technical safeguards, mapped to the codebase:

| Safeguard | Implementation | Status |
|---|---|---|
| **Access control (unique user ID)** | JWT session with username per staff user | ✅ |
| **Audit controls** | `logPHIAccess()` exists but not called from routes | ⚠️ Built, not wired |
| **Integrity controls** | Airtable record history, JWT signed | ✅ |
| **Transmission security** | HTTPS via Vercel, JWT in httpOnly cookie | ✅ |
| **Encryption at rest** | Airtable encrypts at rest; local caches do not | ⚠️ Cache layer needs review |
| **Automatic logoff** | JWT expires after 24h | ✅ (24h, conservative vs. 15min ideal) |
| **Password policy** | `src/lib/auth/password.ts` uses PBKDF2, ≥32-char hashes | ✅ |
| **Failed login lockout** | `/api/dashboard/auth/login` locks after 5 failed attempts / 15 min | ✅ |

### The "wire PHI logging into routes" sprint

This is a deferred Horizon 1 item. The structure of the change:

1. Every `/api/dashboard/clients/*`, `/api/dashboard/schedule`, `/api/dashboard/consultations`, and any route that reads identifiable patient data must call `logPHIAccess()` before returning data.
2. The log entry should include: accessing user (from session), patient ID touched, action (`view`/`export`/`modify`), timestamp (auto), IP (from request headers), and a brief reason ("schedule review", "consult prep", "billing inquiry").
3. The log entries must persist — move from the in-memory store in `hipaa-audit.ts` to a dedicated "PHI Access Log" Airtable table.
4. Retention: 6 years minimum per HIPAA §164.530(j).

Estimated effort: 4–8 hours for the implementation + 2 hours to backfill retention config. **Not done in this sprint.** File as follow-up: `docs/codex-handoff/PHI-ACCESS-LOGGING-SPRINT.md`.

---

## FDA device + injectable sourcing

### Devices

Rani uses these medical devices (per `CLAUDE.md`):

| Device | Manufacturer | FDA pathway | Serial # tracked? |
|---|---|---|---|
| Sofwave (HIFU) | Sofwave Medical | 510(k) cleared | ⚠️ Need to verify |
| PicoWay laser | Candela/Syneron | 510(k) cleared | ⚠️ Need to verify |
| RF Microneedling (Cutera Secret RF) | Cutera | 510(k) cleared | ⚠️ Need to verify |
| Laser hair removal | Unknown model | 510(k) cleared | ⚠️ Need to verify |
| HydraFacial MD | HydraFacial LLC | 510(k) cleared | ⚠️ Need to verify |

**What the inspector will ask for:**
1. Serial number, purchase invoice, and 510(k) clearance letter for each device
2. Maintenance log (when was it last serviced? by whom?)
3. Calibration records (for lasers: last calibration, next scheduled)
4. Training records for every operator of the device
5. Adverse event reports (MDR — Medical Device Reports) for any device-related incident

**What Rani has right now:**
- `src/lib/compliance/device-compliance.ts` implements:
  - `MedicalDevice` type with serial #, FDA clearance #, maintenance schedule, calibration schedule
  - `addDevice()`, `getDeviceAlerts()`, MDR reporting scaffolding
- In-memory stores (same persistence gap as state regulations)

**Pre-audit checklist:**
- [ ] Every device entered in the Compliance system with serial # and FDA 510(k) #
- [ ] Purchase invoices collected in a physical binder
- [ ] 510(k) clearance letters downloaded from the FDA website (search by K number) and saved to `docs/compliance/device-510k/`
- [ ] Maintenance schedule per manufacturer recommendation, alerts configured
- [ ] Operator training log per device
- [ ] Adverse event log (none ≠ empty; "no events in period X" is the required entry)

### Injectables — chain of custody

This is the one FDA regulators care about most for medspas. Where did your Botox come from? Where did your GLP-1 drugs come from?

**Legitimate sources (Rani uses all three):**

1. **QualiphyRx** (app.qualiphy.me) — for GLP-1 drugs (tirzepatide, semaglutide), peptides (CJC/Ipamorelin). Sourced via **Greenwich Pharmacy**, a 503B outsourcing facility. Save every invoice — 503B facilities have stricter FDA oversight and their invoices are the best provenance record you can get.
2. **Olympia Pharmacy** — for TRT (testosterone cypionate), estradiol, progesterone, GHK-Cu skincare, sexual health meds, NAD+, Sermorelin. **Confirm whether Olympia is 503A (compounding pharmacy, patient-specific prescriptions) or 503B (outsourcing facility, bulk sales).** This matters legally. 503A compounding requires a patient-specific prescription for each dose; 503B allows bulk stocking.
3. **Hallandale Pharmacy** — for Sermorelin/NAD+ troches, Bella #1 SR. Same question about 503A vs 503B status.

**For Botox, Dysport, Juvederm, Restylane:** confirm Rani is buying directly from Allergan, Galderma, Revance, etc., through authorized distributors. **Grey-market Botox** (unauthorized importation, "cheaper Botox from Canada") is an FDA felony. This is the #1 injectable compliance trap for medspas.

**What the inspector will ask for:**
1. Invoices for the last 12 months from every pharmacy and manufacturer
2. Batch/lot numbers for every vial used
3. Matching of batch/lot to patient (chain of custody — which patient received which vial on which date)
4. Disposal record for any vials that expired or were destroyed
5. Temperature log if anything requires refrigeration (Botox, some GLP-1 drugs, testosterone)

**What Rani has right now:**
- No automated invoice archive. Counsel should require this on Day 1.
- No batch/lot tracking system. This is a **gap**. Add a field to the Airtable Transactions table or create a new "Vials" table that tracks: date received, vendor, batch/lot, expiry, used-on-patient IDs.
- No temperature log system.

**Pre-audit checklist:**
- [ ] Invoice binder with last 24 months of pharmacy invoices
- [ ] Batch/lot tracking for every dose administered (even a paper log is acceptable)
- [ ] Temperature log for refrigerated inventory (daily min/max)
- [ ] Written source attestation: "Rani only sources from [list]; grey-market products are prohibited"
- [ ] Disposal/destruction log for expired or damaged inventory

---

## DEA — controlled substances

DEA only applies if Rani dispenses or administers Schedule II–V drugs on-site. Most GLP-1 drugs and cosmetic injectables are NOT scheduled. But:

- **Testosterone (TRT)** — Schedule III controlled substance
- **Anabolic steroids** — Schedule III
- **Ketamine** — Schedule III (not Rani-relevant today but if you ever add ketamine therapy, DEA registration required)

### Is Rani actually dispensing any controlled substances?

**Need to confirm with medical director.** If TRT is prescribed and picked up at Olympia Pharmacy (patient-specific dispensing happens at Olympia), Rani may not need DEA registration. If Rani administers TRT injections on-site from a vial stocked in the office, that's different — DEA registration required.

**If DEA applies:**

1. DEA Form 224 registration (every 3 years, per location)
2. Separate locked safe for controlled substances
3. Biennial inventory (every 2 years, formal count)
4. Ongoing perpetual inventory log (every acquisition, every administration, every destruction)
5. DEA Form 41 for destruction of damaged or expired product
6. Theft/loss reporting (DEA Form 106) within 24 hours of discovery

### What the code supports

`src/lib/compliance/controlled-substances.ts` implements:
- `ControlledSubstance` type with Schedule classification, current quantity, lot #, expiry
- Status derivation: `in_stock` / `low` / `depleted` / `expired` / `recalled` / `destroyed`
- Reconciliation logging
- Waste witnessing (requires 2-witness documentation)
- Chain of custody tracking

**Same persistence gap as the other modules** — in-memory stores. Need to move to Airtable if DEA applies.

### Pre-audit checklist (ONLY if DEA registration is required)

- [ ] DEA Form 224 current and displayed
- [ ] Separate locked safe in the building, only licensed providers have keys
- [ ] Biennial inventory complete, next scheduled
- [ ] Perpetual inventory matches physical count within tolerance
- [ ] Waste log with 2-witness signatures per entry
- [ ] Theft/loss procedure documented
- [ ] Provider DEA numbers on file

**Action item:** before next compliance review, **confirm with medical director in writing whether DEA registration is required for Rani's current product mix.** If yes, full DEA compliance setup is a ~20-hour sprint. If no, document the determination in writing so you can show an inspector why DEA doesn't apply.

---

## OSHA — bloodborne pathogens + workplace safety

OSHA's **Bloodborne Pathogen Standard (29 CFR 1910.1030)** applies to Rani because staff handle needles and can be exposed to blood.

### What the inspector will ask for

1. **Exposure Control Plan** — a written document describing how Rani protects staff from bloodborne pathogen exposure. Must include: exposure determination (which staff roles), methods of compliance, hepatitis B vaccine offer, post-exposure evaluation, communication of hazards, recordkeeping. Must be reviewed annually.
2. **Training records** — every staff member with potential exposure must receive training at hire and annually. Document: employee name, date, trainer, topics covered, sign-off.
3. **Hepatitis B vaccine records** — must be OFFERED (free of charge) to every employee with occupational exposure. Employee can decline, but the decline must be on a specific OSHA form and retained.
4. **Sharps disposal** — FDA-cleared sharps containers, rigid, puncture-resistant, leakproof, color-coded, labeled. Replaced when 3/4 full. Final disposal via licensed medical waste hauler with manifest.
5. **SDS binder** (Safety Data Sheets) — for every chemical used on-site: disinfectants, numbing creams, solvents, cleaning products. Available to every staff member in a known location.
6. **PPE** — gloves, eye protection, masks available in every treatment room. Proper use documented in training.
7. **Exposure incident log** — any needle stick, splash, blood exposure. Even if no transmission occurred. OSHA form 300 / 301.
8. **Post-exposure evaluation protocol** — written procedure for what happens if a needle stick occurs: immediate wash, source patient consent for testing, baseline testing of exposed employee, follow-up.

### What Rani has right now

**In the code:**
- `src/lib/compliance/osha-tracker.ts` implements:
  - `SharpsDisposalLog` with pickup dates, hauler info, weight/volume
  - `SDSSheet` with chemical name, manufacturer, expiry
  - `TrainingRecord` with employee, date, topic, trainer
  - `IncidentReport` with exposure type, response, follow-up
  - `PPEInventory` tracking
  - Alert logic for: overdue training, near-expiry SDS, sharps pickup overdue, low PPE stock

**In the dashboard:**
- `/dashboard/compliance` has an OSHA tab

**Physical artifacts needed:**
- Exposure Control Plan (written document, signed by Rina)
- Sharps containers in every treatment room
- SDS binder in a known wall location
- PPE in every treatment room
- Eyewash station (if any chemicals could splash — verify with counsel)

### Pre-audit checklist

- [ ] Written Exposure Control Plan on file and reviewed annually
- [ ] All staff BBP training current (documented in Compliance system)
- [ ] Hepatitis B vaccine offered to every employee, declines on file
- [ ] Sharps containers in every treatment room, not > 3/4 full
- [ ] Medical waste hauler contract current, pickup manifests retained
- [ ] SDS binder contains sheets for every chemical used
- [ ] PPE stocked in every treatment room
- [ ] Exposure incident log (including "no incidents this period" entries)
- [ ] Post-exposure evaluation protocol posted near sharps containers

### Common citations

- **"No written exposure control plan"** — most common. Free template from OSHA website, ~2 hours to customize.
- **"Training not documented"** — staff say they got trained, but no signed records. Fix: annual training day with sign-in sheet.
- **"Improper sharps disposal"** — overfilled containers, non-compliant containers, no hauler contract.
- **"Missing SDS"** — chemicals used but no SDS on file. Fix: audit every bottle and cream used, pull SDS from manufacturer websites.
- **"Hepatitis B vaccine not offered"** — specific to employees with occupational exposure. Fix: offer letter template, signed acceptance or declination.

---

## Chart and consent retention

### Retention periods

| Record type | Retention (WA state) | Retention (HIPAA) | Use the longer |
|---|---|---|---|
| Adult patient medical records | 10 years from last date of service | 6 years from creation or last effective date | **10 years** |
| Minor patient medical records | Until age 21 OR 10 years, whichever is longer | 6 years | **Until age 21 or 10 years** |
| Consent forms | Same as chart | Same as chart | **10 years** |
| Billing records | 7 years (IRS) | 6 years (HIPAA) | **7 years** |
| Employment / HR records | 7 years | N/A | **7 years** |
| OSHA training records | 3 years | N/A | **3 years** |
| OSHA exposure records | 30 years after termination of employment | N/A | **30 years** (yes, thirty) |
| Controlled substance records | 2 years from creation (DEA) | N/A | **2 years** |
| PHI access audit logs | N/A | 6 years | **6 years** |

### Where Rani stores charts today

1. **Mangomint** — primary EHR / booking / patient notes. Retention determined by Mangomint's terms + any BAA.
2. **Airtable** — CRM, intake forms, consult notes, AI-generated treatment plans. Stored indefinitely unless manually deleted.
3. **Softr client portal** — patient-facing view of treatment plan (sourced from Airtable).
4. **Resend** — transactional emails sent to patients, archived per Resend's retention.
5. **n8n logs** — workflow execution logs, which may contain PHI snippets.

### Consent forms

Currently collected via:
- Mangomint intake forms (if configured)
- Website contact form (`/api/contact`)
- In-office on paper (for clinical consent)

`src/lib/compliance/consent-manager.ts` implements templated consent management with:
- Treatment-specific templates (Botox, dermal filler, laser, etc.)
- Version tracking
- Signature capture
- Expiry rules (typical: 1 year for re-consent)
- Consent status derivation

**Not yet wired into the intake flow.** Patients sign paper consents today; the digital system is built but not used.

### Pre-audit checklist

- [ ] Written retention policy document (with the table above)
- [ ] Retention policy signed by Rina and counsel
- [ ] Chart destruction log (if any charts have been destroyed — HIPAA requires destruction to be documented)
- [ ] Consent form templates versioned and on file for every treatment category
- [ ] Patient-specific signed consents retrievable within 5 minutes for any past 10 years' patient

---

## Business Associate Agreements (BAAs)

A **Business Associate** is any vendor that creates, receives, maintains, or transmits PHI on behalf of a Covered Entity. HIPAA **requires** a written BAA with each one before PHI is shared.

### Current vendor inventory (from `CLAUDE.md`)

| Vendor | What Rani uses it for | Touches PHI? | BAA status |
|---|---|---|---|
| **Vercel** | Hosting | Yes (request/response bodies) | ⚠️ Vercel offers BAA on Enterprise plan only; **verify current plan** |
| **Airtable** | Primary database | Yes (all client records) | ⚠️ Airtable offers HIPAA compliance on Enterprise plan with a BAA; **confirm tier + BAA on file** |
| **Mangomint** | EHR / booking | Yes | ⚠️ Mangomint's standard terms may include BAA; **verify** |
| **Square** | Payments | No (Square handles payment card data under PCI, not PHI per se) | Not required |
| **Resend** | Transactional email | Yes (may include PHI in message bodies) | ⚠️ Resend offers HIPAA compliance on Pro plan; **confirm + BAA** |
| **Twilio** | SMS (via n8n) | Yes (SMS body may include PHI) | ⚠️ Twilio offers HIPAA-eligible accounts; **confirm + BAA** |
| **SendGrid** | Marketing email (via n8n) | Possibly (if any marketing email mentions patient-specific info) | ⚠️ SendGrid offers HIPAA on Pro Plus; **confirm + BAA or sanitize campaigns** |
| **Anthropic (Claude API)** | AI chat, intake analysis, plan builder | **Yes (critical)** — patient intake data is sent to Claude for analysis | ⚠️ Anthropic offers HIPAA via Enterprise / specific contract; **confirm + BAA** |
| **Pinecone** | RAG vector DB | Depends — if knowledge base content is non-patient documents only, no; if any patient-specific content is indexed, yes | ⚠️ **Audit the vector store contents** |
| **Plaid** | Bank connection | No (financial, not medical) | Not required for HIPAA; PCI/Gramm-Leach-Bliley applies separately |
| **n8n Cloud** | Workflow automation | Yes (workflows process PHI) | ⚠️ **Check n8n Cloud's BAA terms or self-host** |
| **Vapi.ai** | AI phone agent | Yes (conversations contain PHI) | ⚠️ Vapi's BAA status needs confirmation |
| **QualiphyRx** | Pharmacy | Yes (prescriptions are PHI) | ⚠️ Should have BAA as a covered entity or business associate |
| **Olympia Pharmacy** | Pharmacy | Yes | ⚠️ Same as above |
| **Hallandale Pharmacy** | Pharmacy | Yes | ⚠️ Same as above |

### The BAA sprint (Horizon 1 blocker for HIPAA compliance)

1. **Inventory which vendors currently receive PHI.** Review every integration point. Example: the AI intake flow sends patient form data to `/api/ai/intake` which calls Anthropic. That's PHI to Claude.
2. **For each vendor, check their HIPAA status:**
   - Do they offer a BAA?
   - Under what tier/plan?
   - Is Rani currently on a BAA-eligible plan?
3. **For vendors that DO offer a BAA:** request and execute it. Most have a self-service BAA request form. Some require a written request to compliance@vendor.com.
4. **For vendors that DO NOT offer a BAA:** either (a) stop sending PHI to them, (b) switch to a HIPAA-eligible alternative, or (c) obtain legal sign-off on the specific use case (rare).
5. **For Anthropic specifically:** the API terms include data handling commitments but a formal BAA requires a specific contract. **Contact Anthropic sales for enterprise HIPAA coverage.**
6. **Document BAA status in the Compliance engine:** `src/lib/compliance/hipaa-audit.ts` has a `BusinessAssociateAgreement` type. Populate it for every vendor.

**Estimated effort:** 8–16 hours across a week (most of the time is waiting for vendor response).

### What the inspector will ask for

1. List of every vendor that receives PHI
2. BAA for each vendor (signed by both parties)
3. Date of BAA, renewal status, any exceptions

---

## The in-code compliance engine

Directory: `src/lib/compliance/`

| File | What it does | Persistence | Dashboard |
|---|---|---|---|
| `index.ts` | Central hub, composite score calculation | N/A | `/dashboard/compliance` main card |
| `state-regulations.ts` | WA scope of practice, licenses, delegation agreements | In-memory ⚠️ | State tab |
| `hipaa-audit.ts` | PHI access logs, breach notifications, BAAs, training | In-memory ⚠️ | HIPAA tab |
| `controlled-substances.ts` | DEA Schedule tracking, reconciliation, waste | In-memory ⚠️ | Controlled Substances tab |
| `device-compliance.ts` | FDA 510(k) devices, maintenance, MDR | In-memory ⚠️ | Devices tab |
| `osha-tracker.ts` | Sharps, SDS, training, incidents, PPE | In-memory ⚠️ | OSHA tab |
| `consent-manager.ts` | Consent templates, signatures, expiry | In-memory ⚠️ | Consent tab (pending) |
| `audit-trail.ts` | Immutable audit log for all compliance events | In-memory ⚠️ | Audit Log tab |

**Structural observation:** every module has its data model and business logic right, but persists to in-memory stores. This is a **blocker for any real audit** — the moment the Vercel dyno cycles, you lose every record.

### The persistence sprint

**Proposal:** add a `Compliance` Airtable base or extend the existing base with these tables:

1. **Providers** — license #, issue date, expiry date, provider type, supervising MD
2. **Delegations** — delegating MD, delegated provider, procedures, supervision type, effective date, renewal date
3. **PHI Access Log** — user, patient ID, action, timestamp, IP, reason (6-year retention)
4. **BAAs** — vendor, effective date, renewal date, PHI categories covered, signed PDF link
5. **HIPAA Training** — employee, training date, topic, certification link
6. **Breach Log** — date discovered, affected count, PHI type, notification dates, resolution
7. **Devices** — serial #, FDA 510(k) #, purchase date, last maintenance, next calibration
8. **Controlled Substances Inventory** — only if DEA applies (see DEA section)
9. **Sharps Disposal** — container pickup dates, hauler, manifest link
10. **SDS Sheets** — chemical name, manufacturer, SDS PDF link, expiry
11. **OSHA Training** — employee, topic, date, trainer
12. **Incidents** — any exposure event, evaluation, follow-up
13. **Consents** — patient, treatment category, version signed, date, expiry

Then replace the in-memory stores in each compliance module with Airtable reads/writes via the existing rate-limited client.

**Estimated effort:** 16–30 hours. Significant enough to warrant its own sprint. **Not done in this runbook sprint.** File as `docs/codex-handoff/COMPLIANCE-PERSISTENCE-SPRINT.md`.

### Compliance dashboard routes

| Route | Purpose |
|---|---|
| `GET /api/dashboard/compliance` | Overall score + per-module summaries |
| `/dashboard/compliance` (page) | Multi-tab UI with all module data |

**Audit considerations:** the compliance dashboard route is properly auth-gated (staff session required, confirmed in Route Auth Audit). It's the single most important route in the entire application for an inspector visit, so verify it loads, verify every tab renders, verify data persists across server restarts **before** you ever need it under pressure.

---

## Known gaps and open risks

These are the gaps an inspector would find today. They're documented here so Sukhi and Rina have a clear list of what to tackle and in what order.

### Critical (fix in the next 30 days)

1. **Persistence gap in all compliance modules** — everything is in-memory. The moment you need it for an audit, it's empty. **Fix: port to Airtable. Effort: 16–30h.**
2. **No BAAs with vendors touching PHI** — Anthropic, Airtable, Mangomint, Resend, Twilio, possibly others. **Fix: audit + request BAAs. Effort: 8–16h + vendor response time.**
3. **PHI access not being logged in production** — the code exists but no routes call it. **Fix: wire `logPHIAccess()` into every dashboard client-data route. Effort: 4–8h.**
4. **No Notice of Privacy Practices** — required to be posted on website + given to every patient. **Fix: use HHS template, adapt with counsel. Effort: 2–4h + review.**
5. **No staff HIPAA training documented** — all staff need annual HIPAA training on file. **Fix: complete training course + document. Effort: 2h per person one-time.**
6. **Grey-market Botox risk is zero today but needs a written sourcing policy** — counsel-drafted "authorized distributors only" statement, signed by Rina. Prevents any future supplier from slipping past. **Effort: 1h + counsel.**
7. **Delegation agreements may not exist on paper** — Rina and Mom both perform procedures. What's the delegation? Who's the medical director? **Fix: draft with counsel, sign, file. Effort: 2–4h + counsel.**
8. **DEA applicability not determined** — if any Schedule III drug is dispensed on-site, DEA registration is required. **Fix: determine in writing with medical director. Effort: 1h + medical director sign-off.**

### High (fix in the next 90 days)

9. **No formal risk assessment** — HIPAA Security Rule requires periodic risk analysis. Counsel-facilitated exercise. **Effort: 4h + counsel.**
10. **No incident response plan** — what happens if there's a data breach, a needle stick, an adverse event? Written procedure needed. **Fix: this document + specific playbooks. Effort: 4h.**
11. **Batch/lot tracking for injectables** — which patient got which vial on which date. Paper log acceptable for now; digital later. **Effort: 2h paper setup, 8h digital.**
12. **Consent flow is paper-only** — the digital consent system (`consent-manager.ts`) is built but not wired to the intake flow. **Effort: 8h to wire.**
13. **Compliance score on dashboard is vanity number** — currently computed but not acted on. **Fix: alerting thresholds + weekly review.**

### Medium (fix in the next 6 months)

14. **Automated backup of Airtable** — if Airtable loses data, Rani loses everything. **This is a Horizon 1 item separate from compliance, but affects audit retention.**
15. **Encryption of local caches** — `src/lib/cache/` may hold PHI in memory. Verify cache isolation, TTL, and eviction.
16. **Audit trail immutability** — `audit-trail.ts` is a good start but isn't cryptographically immutable. Consider append-only log with hash chaining for high-stakes audits.

### Low (nice to have)

17. **Formal penetration test** — hire an outside security firm once a year. $5-15K typical.
18. **SOC 2 Type II** — expensive and aspirational, but makes selling RaniOS as SaaS much easier.

---

## Quarterly self-audit schedule

**Rina and Sukhi commit to running this every 90 days.** Put it on the calendar now.

### Q1 (January)
- [ ] Review all provider licenses — any expiring in next 120 days?
- [ ] Confirm all delegation agreements current
- [ ] BAAs reviewed — any vendor changes since last review?
- [ ] HIPAA training refresh for all staff
- [ ] OSHA BBP training refresh for all staff

### Q2 (April)
- [ ] Sharps disposal hauler contract review
- [ ] SDS binder audit (any new chemicals added?)
- [ ] Device maintenance logs reviewed
- [ ] PHI access log review — any unusual patterns?
- [ ] Adverse event log review

### Q3 (July)
- [ ] Full compliance score review from `/dashboard/compliance`
- [ ] Mock audit walk-through (pretend inspector is coming in 5 minutes)
- [ ] Update runbook if any processes changed
- [ ] Vendor BAA renewal check

### Q4 (October)
- [ ] Annual exposure control plan review
- [ ] Annual HIPAA risk assessment
- [ ] Year-end chart destruction (any records past retention?)
- [ ] Budget review for compliance tooling

---

## Incident response

When things go wrong — a data breach, a needle stick, an adverse patient event, a regulatory inquiry — the first 60 minutes determine whether this becomes a citation or a footnote.

### Data breach response (HIPAA)

**Discovery → 60 minutes:**
1. Stop the exposure. Revoke credentials, take affected service offline, whatever stops ongoing access.
2. Identify scope: how many patients, what PHI, what duration.
3. Notify Rina and Sukhi (or CEO whoever is on-call).
4. Begin the incident log — open `docs/compliance/INCIDENT-LOG.md` and log: discovery time, discovery method, apparent scope, immediate actions taken.

**60 minutes → 24 hours:**
5. Call healthcare attorney. Do not notify patients or HHS without legal sign-off first.
6. Preserve evidence — logs, screenshots, Vercel access logs, Airtable audit trails.
7. Determine affected individual list with addresses.

**24 hours → 60 days:**
8. Draft notifications (if breach confirmed by counsel).
9. Notify affected individuals by first-class mail (no email — HIPAA requires written notice).
10. If ≥ 500 individuals: notify HHS OCR + prominent media outlet.
11. If < 500 individuals: notify individually; log for annual HHS summary.
12. Post-mortem + control improvements.

### Needle stick / blood exposure (OSHA)

**Immediate:**
1. Wash the wound with soap and water. Do not squeeze or manipulate.
2. Report to supervisor immediately.
3. Document: employee name, date, time, circumstances, source patient (if identifiable).

**Same day:**
4. Offer employee immediate medical evaluation at the designated provider (identify this provider in advance — typically a local urgent care or occupational health clinic).
5. With source patient's consent, test source patient for HIV/HBV/HCV.
6. Baseline test the exposed employee for HIV/HBV/HCV.
7. Begin post-exposure prophylaxis if indicated (time-sensitive for HIV — within hours).

**Follow-up:**
8. 6-week, 12-week, 6-month follow-up testing.
9. File OSHA Form 301 Injury and Illness Incident Report within 7 days.
10. Add to the OSHA 300 log.

**Documentation:**
- All of the above in `src/lib/compliance/osha-tracker.ts` via `IncidentReport`.
- Physical copy in the staff incident binder.

### Adverse patient event (medical)

**Immediate:**
1. Attend to patient. Emergency services if needed.
2. Document objective findings, time, vitals, interventions.
3. Notify supervising physician / medical director.

**Same day:**
4. File adverse event in the clinic's adverse event log.
5. If device-related, prepare an MDR (Medical Device Report) for FDA — required within 10 working days for deaths and serious injuries.
6. If drug-related, document lot number and notify the sourcing pharmacy.

**Follow-up:**
7. Root cause analysis documented.
8. Policy changes documented.
9. Patient follow-up documented.

### Regulatory inquiry (letter, phone call, email)

**Do NOT respond on the spot, even if they demand an answer.**

1. Write down: name, agency, contact info, what they're asking, deadline.
2. Call healthcare attorney the same day. No exceptions.
3. Attorney drafts or reviews any written response.
4. Log in `docs/compliance/REGULATORY-INQUIRY-LOG.md`.

### Regulatory inspection (in-person visit)

See [The 9am-inspector checklist](#the-9am-inspector-checklist) at the top of this document.

---

## Audit log

Keep this updated with every interaction with an inspector, regulator, or attorney on compliance matters.

| Date | Agency | Inspector | Scope | Outcome | Follow-up |
|---|---|---|---|---|---|
| *none yet* | | | | | |

---

## References

- **WA State Department of Health**: https://doh.wa.gov/licenses-permits-and-certificates
- **HHS OCR HIPAA**: https://www.hhs.gov/hipaa/index.html
- **HIPAA Breach Reporting**: https://www.hhs.gov/hipaa/for-professionals/breach-notification/
- **FDA 510(k) Device Search**: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm
- **FDA Compounding Pharmacy Rules (503A vs 503B)**: https://www.fda.gov/drugs/human-drug-compounding/compounding-and-fda-questions-and-answers
- **DEA Diversion Control**: https://www.deadiversion.usdoj.gov/
- **OSHA Bloodborne Pathogen Standard**: https://www.osha.gov/bloodborne-pathogens
- **OSHA Form 300/301**: https://www.osha.gov/recordkeeping/forms
- **Internal compliance engine**: `src/lib/compliance/`
- **Route auth audit**: `docs/codex-handoff/ROUTE-AUTH-AUDIT.md`

---

**Next review due:** 2026-07-10 (quarterly)
**Questions?** Sukhi / Rina / healthcare attorney
**Maintained by:** engineering team, updated as compliance engine + business practices evolve
