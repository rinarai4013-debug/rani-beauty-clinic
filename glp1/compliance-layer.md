# GLP-1 Compliance Layer
**Purpose:** Enforce medical safety, document every decision, trigger provider reviews at the right moments, and maintain audit-ready records for every GLP-1 patient.

---

## 1. Contraindication Checks

### Pre-Enrollment Screen (Run at /intake)
Every GLP-1 intake MUST pass through this checklist before entering the pipeline.

#### HARD STOP — Automatic Disqualification
| # | Condition | Check Method | If Present |
|---|-----------|-------------|------------|
| 1 | Personal history of medullary thyroid carcinoma (MTC) | Intake form: "thyroid cancer" or "MTC" | STOP. Document reason. Do not proceed. |
| 2 | Family history of MTC | Intake form: family history section | STOP. Document reason. Do not proceed. |
| 3 | MEN2 syndrome (Multiple Endocrine Neoplasia type 2) | Intake form | STOP. Document reason. Do not proceed. |
| 4 | Type 1 Diabetes | Intake form: diabetes type | STOP. Document reason. Offer peptide alternatives. |
| 5 | Currently pregnant | Intake form: pregnancy status | STOP. Must wait until not pregnant + not breastfeeding. |
| 6 | Currently breastfeeding | Intake form | STOP. Must wait until done breastfeeding. |
| 7 | Active eating disorder (anorexia, bulimia) | Intake form + screening questions | STOP. Refer to specialist. GLP-1 not appropriate. |
| 8 | BMI < 25 (no comorbidities) | BMI calculation | STOP. Does not meet prescribing criteria. |

**If ANY hard stop is triggered:**
1. Do NOT create patient file in active pipeline
2. Log in `compliance-log.md` with date, patient initials, and reason
3. Send compassionate decline message
4. Offer alternative services if appropriate

#### SOFT FLAG — MD Review Required Before Proceeding
| # | Condition | Risk Level | Required Action |
|---|-----------|-----------|----------------|
| 1 | History of pancreatitis | HIGH | MD reviews before Rx. If approved, quarterly monitoring. |
| 2 | Gastroparesis | HIGH | MD reviews. GLP-1 further slows gastric emptying. |
| 3 | Active cancer treatment | HIGH | MD reviews timing. May need to wait. |
| 4 | Gallbladder disease or removed | MODERATE | MD aware. Increased gallstone risk on GLP-1. |
| 5 | Kidney disease (eGFR < 30) | MODERATE | MD reviews. Dose adjustment likely. Labs critical. |
| 6 | Liver disease | MODERATE | MD reviews. CMP monitoring essential. |
| 7 | History of suicidal ideation | MODERATE | MD reviews. Enhanced mood monitoring required. |
| 8 | Type 2 Diabetes on insulin | LOW-MOD | MD coordinates insulin dose reduction. Hypo risk. |
| 9 | Taking blood thinners | LOW-MOD | MD aware. Monitor INR if on warfarin. |
| 10 | BMI 25–29.9 (overweight, no comorbidity) | LOW | MD must confirm qualifying comorbidity exists. |

**If ANY soft flag is triggered:**
1. Create patient file with flag noted prominently
2. Add tag: `MD-REVIEW-REQUIRED`
3. Do NOT proceed past LABS-NEEDED until MD clears
4. Log in `compliance-log.md`
5. Notify Rina: "This patient needs MD review before we can proceed"

---

## 2. Safety Flags (Ongoing Monitoring)

### Active Treatment Safety Checks
| Check | Frequency | Trigger | Action |
|-------|-----------|---------|--------|
| Side effect severity | Every check-in | Severe symptoms reported | Emergency SOP if critical, MD review if moderate+ |
| Weight loss rate | Weekly | > 5 lbs/week sustained | Flag: Too rapid. Dehydration/muscle loss risk. MD review. |
| Mood/mental health | Every check-in | Any mood change reported | MD review within 24 hours |
| Lab values | Quarterly | Out of range results | MD adjusts protocol |
| Injection compliance | Weekly | Missed injections | Assess why, re-educate, flag if pattern |
| Medication interactions | At intake + any med change | New medication started | MD reviews for interactions |
| Pregnancy | Every check-in (women of childbearing age) | Pregnancy reported or suspected | IMMEDIATE STOP. Discontinue GLP-1. MD notified. |

### Emergency Escalation Matrix
| Symptom | Severity | Immediate Action | Follow-Up |
|---------|----------|-----------------|-----------|
| Severe abdominal pain | CRITICAL | Instruct ER/911 immediately | MD review, hold medication |
| Allergic reaction (swelling, breathing difficulty) | CRITICAL | Instruct ER/911 immediately | MD review, likely discontinue |
| Suicidal ideation | CRITICAL | Instruct ER/988 Lifeline | MD review, likely discontinue |
| Thyroid lump/swelling | URGENT | Schedule MD evaluation ASAP | Thyroid ultrasound, hold medication |
| Persistent vomiting (24+ hours) | URGENT | Assess hydration, may need ER | MD review, dose reduction likely |
| Signs of pancreatitis | CRITICAL | Instruct ER immediately | Discontinue GLP-1, MD review |
| Severe hypoglycemia (diabetic patients) | CRITICAL | Instruct: eat glucose, ER if unresolved | MD adjusts diabetes meds |
| Severe constipation (7+ days no BM) | URGENT | MD review, OTC recommendations | Dose adjustment consideration |

### Safety Flag Documentation
Every safety event gets logged:
```markdown
## Safety Flag: [DATE]
- **Patient:** [initials or ID]
- **Flag Type:** [HARD STOP / SOFT FLAG / EMERGENCY / SIDE EFFECT / LAB ALERT]
- **Description:** [what happened]
- **Severity:** [CRITICAL / URGENT / MODERATE / LOW]
- **Action Taken:** [what was done]
- **MD Notified:** [YES/NO + date/time]
- **Rina Notified:** [YES/NO + date/time]
- **Resolution:** [outcome]
- **Follow-Up:** [next steps + date]
```

---

## 3. Provider Review Triggers

### Automatic MD Review Required
| Trigger | Timeline | Documentation |
|---------|----------|--------------|
| New patient intake (GFE) | Before any Rx | Qualiphy GFE record |
| Lab results received | Within 48 hours of receipt | Lab review note in patient file |
| Titration request | Before dose change shipped | Qualiphy approval record |
| Quarterly labs | Within 48 hours of receipt | Lab review + continued Rx approval |
| Side effect escalation (moderate+) | Within 24 hours | MD note in patient file |
| Plateau intervention (med change) | Before any medication change | Qualiphy consultation |
| Patient reports new medication | Within 48 hours | Drug interaction review |
| Patient reports pregnancy | Immediately | Discontinuation order |
| Abnormal vital signs/symptoms | Within 24 hours | Clinical assessment |
| Patient at max dose with no response | Within 1 week | Consider alternative Tx |

### MD Review Tracking
```markdown
## MD Review Log
| Date | Patient | Trigger | Reviewed By | Decision | Notes |
|------|---------|---------|-------------|----------|-------|
| [DATE] | [initials] | [trigger] | Medical Director | [approved/denied/modified] | [notes] |
```

### What Rina Can and Cannot Do
| RINA CAN | RINA CANNOT |
|----------|-------------|
| Send check-in messages | Diagnose any condition |
| Collect patient data (weight, symptoms) | Prescribe or adjust medication |
| Educate on injection technique | Make medical recommendations |
| Schedule appointments | Interpret lab results clinically |
| Process payments and shipping | Override MD decisions |
| Flag concerns for MD review | Advise on emergency treatment |
| Provide emotional support | Clear patients for new medications |
| Recommend wellness services (non-Rx) | Determine GLP-1 eligibility alone |

---

## 4. Documentation & Audit Trail

### Required Documentation Per Patient
| Document | Created When | Updated When | Retention |
|---------|-------------|-------------|-----------|
| Patient intake file | At intake | Every interaction | Permanent |
| Contraindication screen | At intake | If new conditions reported | Permanent |
| Lab results record | Each lab | N/A | Permanent |
| Qualiphy GFE record | Each GFE | N/A | Permanent (Qualiphy stores) |
| Medication history | At Rx approval | Each refill/titration | Permanent |
| Check-in log | First check-in | Weekly | Permanent |
| Side effect log | First side effect | Each report | Permanent |
| Safety flag log | Each flag | At resolution | Permanent |
| MD review log | Each review | N/A | Permanent |
| Communication log | First message | Every message | 7 years minimum |

### Compliance Log File (`compliance-log.md`)
Master audit trail for all compliance events across all patients.

```markdown
# GLP-1 Compliance Log

## Format
| Date | Time | Patient | Event Type | Details | Action | By |
|------|------|---------|-----------|---------|--------|-----|

## Event Types
- HARD-STOP: Patient disqualified
- SOFT-FLAG: MD review required
- SAFETY-ALERT: Active treatment safety concern
- EMERGENCY: Critical safety event
- MD-REVIEW: Provider review completed
- LAB-ALERT: Lab results concern
- DOSE-CHANGE: Titration or medication change
- PREGNANCY: Pregnancy reported (auto-stop)
- COMPLIANCE-HOLD: Treatment held for compliance reason
```

### Monthly Compliance Audit Checklist
Run on the 1st of each month:

- [ ] All active GLP-1 patients have current Qualiphy GFE on file
- [ ] All patients past 90 days have quarterly labs completed or scheduled
- [ ] All safety flags from past month are resolved or have active follow-up
- [ ] All MD reviews were completed within required timelines
- [ ] No patient received medication without proper GFE
- [ ] No patient with hard-stop contraindication is in active pipeline
- [ ] All patient files have complete documentation
- [ ] Communication logs are up to date
- [ ] Compliance log is current with all events

---

## 5. Regulatory Reference

### Prescribing Authority
- All GLP-1 prescriptions: Medical Director via Qualiphy telehealth GFE
- Rina's role: Master Esthetician, practice manager, patient coordinator
- Rina does NOT have prescribing authority for any Rx medication
- MSO structure: Medical Director provides clinical oversight remotely

### Required Language
| Always Say | Never Say |
|-----------|-----------|
| "Compounded medication" | "Generic Ozempic/Wegovy/Mounjaro" |
| "Medically supervised weight loss" | "Weight loss guaranteed" |
| "Our Medical Director will review" | "I'll prescribe this for you" |
| "Results may vary" | "You'll lose X pounds" |
| "Injection" | "Infusion" |
| "Your health comes first" | "Everyone qualifies" |
| "Telehealth evaluation required" | "No doctor visit needed" |

### Advertising Compliance
- No guaranteed weight loss claims
- No before/after photos without proper consent + disclaimers
- Always include "results may vary" and "medically supervised"
- No claims of superiority over brand-name medications
- No pricing that implies insurance coverage
- Include "compounded medication" language
- All ads reviewed for FDA compliance before publishing

---

## 6. Compliance File Structure

```
/glp1/
  compliance-log.md           - Master audit trail
  monthly-audit/
    2026-03_audit.md          - March 2026 compliance audit
    2026-04_audit.md          - April 2026 compliance audit
```

### New Command: /compliance
Run monthly compliance audit:
1. READ all active GLP-1 patient files
2. Check each against compliance requirements
3. Flag any gaps (missing labs, expired GFE, unresolved flags)
4. Generate audit report
5. CREATE `glp1/monthly-audit/YYYY-MM_audit.md`
6. Print summary with action items

---

## Integration Points

### Airtable Fields (add to Clients table)
- `Contraindication Screen` — Single select: CLEARED/HARD-STOP/SOFT-FLAG/MD-REVIEW-PENDING
- `GFE Status` — Single select: CURRENT/EXPIRED/PENDING
- `GFE Expiry Date` — Date (GFE date + 12 months or per state requirement)
- `Last Lab Date` — Date
- `Next Lab Due` — Date
- `Quarterly Labs Status` — Single select: CURRENT/DUE/OVERDUE
- `Active Safety Flags` — Long text
- `Compliance Hold` — Checkbox (if true, no medication ships)

### New Airtable Table: `GLP1 Compliance Log`
| Field | Type | Purpose |
|-------|------|---------|
| Date | Date | Event date |
| Patient (linked) | Link to Clients | Patient reference |
| Event Type | Single select | HARD-STOP/SOFT-FLAG/SAFETY-ALERT/EMERGENCY/MD-REVIEW/LAB-ALERT/DOSE-CHANGE |
| Details | Long text | Event description |
| Action Taken | Long text | What was done |
| Resolved | Checkbox | Is this resolved? |
| Resolution Date | Date | When resolved |
| Reviewed By | Single select | Rina/MD/System |

### Dashboard Integration
- New "Compliance" widget on CEO dashboard: audit status, overdue labs, expired GFEs
- Patient 360° profile: Compliance status prominently displayed
- Alert system: Auto-generate alerts for compliance gaps
- Monthly audit report: Auto-generate and flag to Rina

### n8n Workflows (new)
- **WF-GLP1-COMPLIANCE-SCAN:** Daily scan for expired GFEs, overdue labs, unresolved flags
- **WF-GLP1-LAB-REMINDER:** Auto-send lab reminders when quarterly labs approach due date
- **WF-GLP1-GFE-RENEWAL:** Alert when GFE approaching expiry (30 days before)
- **WF-GLP1-COMPLIANCE-REPORT:** Monthly compliance audit auto-generation (1st of each month)
