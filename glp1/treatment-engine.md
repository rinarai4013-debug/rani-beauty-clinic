# GLP-1 Treatment Engine
**Purpose:** Phased weight loss protocol with progress modeling, internal risk flags, and upsell pathways for every active GLP-1 patient.

---

## 1. Three-Phase Treatment Model

### Phase 1: INITIATION (Weeks 1–4)
**Goal:** Tolerance building, side effect management, habit formation

| Week | Focus | Dose (Sema) | Dose (Tirz) | Key Actions |
|------|-------|-------------|-------------|-------------|
| 1 | First injection + monitoring | 0.25mg | 2.5mg | First dose instructions, Day 2 check-in |
| 2 | Side effect assessment | 0.25mg | 2.5mg | Week 1 check-in, symptom tracking |
| 3 | Habit building | 0.25mg | 2.5mg | Diet/hydration coaching, progress check |
| 4 | Readiness for titration | 0.25mg | 2.5mg | Month 1 review, prep for dose increase |

**Expected Results:**
- Weight loss: 2–5 lbs (mostly water + appetite reduction)
- Common side effects: Nausea (40%), constipation (20%), fatigue (15%)
- Appetite suppression begins: typically Day 3–7

**Provider Triggers:**
- Severe nausea lasting > 5 days → MD review
- No appetite change by Week 3 → Flag, may need faster titration
- Weight GAIN → Investigate compliance, diet, medications

**Patient Messaging Theme:** "Your body is adjusting. This is normal. We're monitoring everything."

---

### Phase 2: ACTIVE LOSS (Months 2–6)
**Goal:** Maximum safe weight loss through dose optimization

| Month | Dose Escalation | Expected Loss | Key Actions |
|-------|----------------|---------------|-------------|
| 2 | D2 (Sema 0.5mg / Tirz 5mg) | 4–8 lbs/mo | Titration, Lipo-Mino upsell |
| 3 | D2 or D3 | 4–8 lbs/mo | Quarterly labs, Sermorelin upsell |
| 4 | D3 (Sema 1.0mg / Tirz 7.5mg) | 3–6 lbs/mo | Progress celebration, referral ask |
| 5 | D3 | 3–6 lbs/mo | Body composition check, Sofwave upsell |
| 6 | D3 or D4 | 2–5 lbs/mo | Halfway milestone, reassess goals |

**Expected Results:**
- Semaglutide: 10–15% body weight loss by Month 6
- Tirzepatide: 15–20% body weight loss by Month 6
- Side effects typically decrease by Month 2–3
- Energy and confidence increase

**Provider Triggers:**
- < 2 lbs/mo loss for 2 consecutive months → Plateau protocol
- Significant hair loss → Recommend biotin + nutritional support
- New onset depression/anxiety → MD review immediately
- Labs out of range → MD adjusts protocol

**Patient Messaging Theme:** "Look at your progress! Your body is transforming."

---

### Phase 3: MAINTENANCE (Month 7+)
**Goal:** Sustain weight loss, prevent regain, transition to long-term wellness

| Month | Strategy | Dose | Key Actions |
|-------|---------|------|-------------|
| 7–9 | Stabilization | D3 or D4 | Hold current dose, monitor stability |
| 10–12 | Dose taper evaluation | D3 → D2 if stable | MD evaluates taper candidacy |
| 12+ | Maintenance plan | D1 or D2 (low dose) | Transition to wellness membership |

**Maintenance Transition Criteria:**
- Within 10% of goal weight for 8+ weeks
- Stable eating habits (Lifestyle Score 7+)
- No dose increase needed in past 3 months
- Patient wants to transition (never force)

**Provider Triggers:**
- 5+ lb regain in any month → Alert, consider dose increase
- Requesting to stop medication → Churn save protocol
- Insurance/cost concerns at maintenance → Offer lower-dose tier

**Patient Messaging Theme:** "You've done the hard work. Now we maintain your results."

---

## 2. Progress Timeline Model

### Weight Loss Trajectory Calculator
```
Month 1: 2–5 lbs (initiation phase, conservative)
Month 2: 4–8 lbs (dose increase, appetite suppression peaks)
Month 3: 4–8 lbs (peak loss rate)
Month 4: 3–6 lbs (continued loss, slightly slower)
Month 5: 3–6 lbs
Month 6: 2–5 lbs (approaching plateau zone)
Month 7–9: 1–3 lbs/mo (tapering)
Month 10–12: 0–2 lbs/mo (stabilization)

Total 12-month projection:
Semaglutide: 25–55 lbs (10–15% body weight)
Tirzepatide: 35–75 lbs (15–22% body weight)
```

### Personalized Projection (for patient file)
```
Starting Weight: [X] lbs | Goal: [Y] lbs | To Lose: [Z] lbs
Medication: [Semaglutide/Tirzepatide]

Month 1:  [X - 3] lbs (est.)     ← Initiation
Month 3:  [X - 15] lbs (est.)    ← Active Loss
Month 6:  [X - 30] lbs (est.)    ← Mid-Program
Month 9:  [X - 40] lbs (est.)    ← Approaching Goal
Month 12: [X - 45] lbs (est.)    ← Maintenance Ready

Projected Goal Date: [Month/Year]
Confidence: [HIGH/MODERATE/LOW based on CLS]
```

---

## 3. Internal Risk Flags

### Automated Flag System
| Flag | Trigger | Severity | Action |
|------|---------|----------|--------|
| `NO-RESPONSE-3D` | No reply to any message for 3 days | YELLOW | Nudge text |
| `NO-RESPONSE-7D` | No reply for 7 days | ORANGE | Phone call from Rina |
| `NO-RESPONSE-14D` | No reply for 14 days | RED | AT-RISK tag, churn save protocol |
| `WEIGHT-STALL` | < 1 lb loss in 4 weeks | YELLOW | Plateau protocol |
| `WEIGHT-GAIN` | Any weight gain at check-in | ORANGE | MD review, lifestyle assessment |
| `SIDE-EFFECT-SEVERE` | Reports severe symptoms | RED | Emergency SOP |
| `MISSED-REFILL` | Refill not processed by due date | ORANGE | Refill reminder escalation |
| `MISSED-LABS` | Quarterly labs overdue by 2+ weeks | RED | Hold next refill until labs done |
| `LOW-ADHERENCE` | Adherence score < 50% for 2 weeks | ORANGE | Provider intervention |
| `MOOD-CHANGE` | Reports depression, anxiety, suicidal ideation | RED | MD review immediately |
| `DOSE-MAX` | On D4 with < 2 lbs/mo loss | YELLOW | Consider med switch or adjunct therapy |

### Flag Resolution Tracking
Every flag gets logged in the patient file:
```
## Risk Flag Log
- [DATE] FLAG: [flag name] | Severity: [color] | Action taken: [description] | Resolved: [Y/N]
```

---

## 4. Protocol Suggestions Engine

### Based on Patient Profile
| Scenario | Protocol | Revenue Impact |
|----------|---------|---------------|
| BMI 30+, high motivation, no contraindications | Fast-track: Skip to Tirz D1, aggressive titration | +$100/mo (Tirz vs Sema) |
| BMI 25–30, moderate motivation | Conservative: Sema D1, slow titration, extra coaching | Standard |
| Prior GLP-1 experience (tried elsewhere) | Resume at last effective dose (MD approval), skip D1 | Faster results = better retention |
| Type 2 Diabetes comorbidity | Tirzepatide preferred (dual mechanism), coordinate with PCP | Premium pricing justified |
| PCOS comorbidity | Highlight hormonal benefits of weight loss, consider hormone panel | Cross-sell hormone therapy |
| Post-surgical (bariatric history) | MD review required, may be contraindicated | Case by case |

---

## 5. Upsell Pathways

### Timeline-Based Upsells
| When | Upsell | Revenue Add | Trigger |
|------|--------|------------|---------|
| Month 1 | B12 + Vitamin D injection combo | +$85/visit | Low energy complaints |
| Month 2 | Lipo-Mino injection (bi-weekly) | +$100/mo | Weight loss underway, boost metabolism |
| Month 3 | Sermorelin peptide therapy | +$349/mo | Sleep/recovery complaints, wants more |
| Month 3 | Quarterly labs (required) | $150-250 | Compliance requirement |
| Month 4 | NAD+ injection | +$399/mo | Anti-aging interest, energy complaints |
| Month 5 | Sofwave skin tightening | $2,750-4,500 | Loose skin from weight loss |
| Month 6 | Body sculpting consultation | $500-3,000 | Stubborn areas remaining |
| Month 6+ | VIP Transform upgrade | +$400/3mo | Wants premium experience |
| Maintenance | Wellness injection membership | $150-300/mo | Transition from GLP-1 |

### Upsell Triggers (Automated Detection)
```
IF patient.month >= 2 AND patient.weightLoss >= 10lbs AND NOT patient.hasAddon("lipo-mino")
  → TRIGGER: Lipo-Mino upsell text

IF patient.month >= 3 AND (patient.sleepScore < 6 OR patient.reports("fatigue"))
  → TRIGGER: Sermorelin upsell text

IF patient.month >= 5 AND patient.weightLoss >= 30lbs
  → TRIGGER: Sofwave/body sculpting consultation offer

IF patient.phase == "MAINTENANCE" AND patient.glp1Dose <= D2
  → TRIGGER: Wellness membership transition conversation
```

---

## 6. Treatment Engine Output (Patient File Block)

```markdown
## Treatment Plan
- **Phase:** [1-INITIATION / 2-ACTIVE-LOSS / 3-MAINTENANCE]
- **Current Dose:** [medication] [dose]
- **Titration Schedule:** [next dose increase date or "holding"]
- **Months on Program:** [X]
- **Total Weight Lost:** [X] lbs ([X]% body weight)
- **Monthly Avg Loss:** [X] lbs/mo
- **Projected Goal Date:** [Month/Year]
- **On Track:** [YES / BEHIND / AHEAD]
- **Active Risk Flags:** [list or NONE]
- **Next Upsell Opportunity:** [service] at [trigger point]
- **Quarterly Labs Due:** [date]
- **Phase Transition:** [criteria met Y/N, projected date]
```

---

## Integration Points

### Airtable Fields (add to Clients table)
- `GLP1 Phase` — Single select: INITIATION/ACTIVE-LOSS/MAINTENANCE
- `Current Dose` — Single select: SEMA-D1 through D4, TIRZ-D1 through D4
- `Total Weight Lost` — Number
- `Monthly Avg Loss` — Number
- `On Track Status` — Single select: YES/BEHIND/AHEAD
- `Active Risk Flags` — Long text
- `Next Upsell` — Single select (from upsell pathway list)
- `Phase Start Date` — Date
- `Projected Goal Date` — Date

### Dashboard Integration
- `/src/lib/churn/engine.ts` — Weight stall + missed refills increase churn score
- `/src/lib/recommendations/engine.ts` — Phase-aware upsell recommendations
- Revenue anomaly detection: Flag if GLP-1 cohort revenue drops
- Client 360° profile: Display treatment phase, progress chart, risk flags

### n8n Integration
- WF1 Intake Intelligence: Include treatment plan recommendation in AI analysis
- Weekly automated check-in trigger (new workflow needed)
- Risk flag alerts to Rina's phone (new workflow needed)
