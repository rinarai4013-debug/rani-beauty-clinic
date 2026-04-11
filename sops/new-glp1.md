# SOP: New GLP-1 Patient (Intake to First Dose)
**Target Timeline:** 10-14 days | **Revenue:** $299-599/mo

---

## Step 1: Receive Intake (Day 0)
- Parse intake form data
- Check for HARD STOP disqualifiers (MTC, MEN2, Type 1 Diabetes, pregnancy, breastfeeding)
- Check for SOFT FLAGS (pancreatitis, gastroparesis, active cancer) requiring MD review
- Create patient file: `patients/YYYY-MM-DD_firstname_lastname.md`
- Add to pipeline: PIPELINE-NEW

## Step 2: Send Welcome (Day 0)
- Send welcome text (use `templates/welcome-text.md`)
- Send welcome email (use `templates/welcome-email.md`)
- Apply Mangomint tags: GLP1-PATIENT, appropriate dose tag, FOLLOW-UP-DUE
- Log in patient timeline

## Step 3: Order Labs (Day 0-1)
- Required panels: CMP, Lipid Panel, HbA1c, TSH + Free T4
- Send lab order to patient (Quest/Labcorp)
- Move pipeline stage: LABS-NEEDED
- Set Day 1/3/5 lab reminder cadence

## Step 4: Lab Follow-Up (Day 1-5)
- Day 1: Friendly lab reminder (use `templates/lab-reminder.md`)
- Day 3: Nudge if no response
- Day 5: Escalation text. If no response, flag AT-RISK
- Once labs received: review for red flags, move to next step

## Step 5: Qualiphy GFE (Day 3-7)
- Send Qualiphy evaluation link to patient
- Move pipeline stage: GFE-PENDING
- Prepare Qualiphy Quick-Entry block for patient file
- Day 2 nudge, Day 4 escalation if not completed

## Step 6: MD Review (Day 5-9)
- Medical Director reviews labs + GFE via Qualiphy
- If approved: move to RX-APPROVED
- If denied: notify patient, discuss alternatives
- If needs more info: follow up with patient/MD

## Step 7: Prescription & Shipping (Day 7-12)
- Process Rx through pharmacy
- Ship medication to patient address
- Move pipeline stage: MED-SHIPPED
- Send shipping confirmation with tracking
- Send first dose instructions (use `templates/first-dose-instructions.md`)

## Step 8: First Dose (Day 10-14)
- Confirm delivery
- Send injection instructions if not already sent
- Move pipeline stage: ACTIVE-PATIENT
- Schedule Day 2 post-dose check-in

## Step 9: Ongoing Care
- Week 1: Side effects check-in
- Week 2-3: Progress check
- Week 4: Monthly review + refill processing
- Month 2+: Cross-sell Lipo-Mino
- Month 3: Quarterly labs
- Month 3+: Consider Sermorelin add-on
- Every month: Refill processing, check-in, cross-sell scan

---
**Compliance Reminders:**
- No Rx without completed Qualiphy GFE
- No GFE without required labs
- Quarterly labs required for ongoing patients
- "Compounded medication" not "generic Ozempic"
- Rina does NOT diagnose or prescribe
