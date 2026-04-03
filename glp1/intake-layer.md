# GLP-1 Intake Layer
**Purpose:** Deep-qualify every GLP-1 lead with clinical scoring, compliance prediction, and revenue modeling before they enter the pipeline.

---

## 1. Body Composition Assessment

### Required Intake Fields
- **Height:** (inches or ft/in)
- **Current Weight:** (lbs)
- **Goal Weight:** (lbs)
- **Waist Circumference:** (inches, optional but valuable)

### BMI Calculation
```
BMI = (weight in lbs × 703) / (height in inches)²
```

| BMI Range | Classification | GLP-1 Eligibility | Notes |
|-----------|---------------|-------------------|-------|
| < 18.5 | Underweight | NOT ELIGIBLE | Do not proceed |
| 18.5–24.9 | Normal | NOT ELIGIBLE | Unless comorbidities (MD review) |
| 25.0–29.9 | Overweight | ELIGIBLE with comorbidity | Diabetes, hypertension, sleep apnea, PCOS |
| 30.0–34.9 | Obese I | ELIGIBLE | Standard candidate |
| 35.0–39.9 | Obese II | ELIGIBLE (priority) | Higher urgency, faster onboarding |
| 40.0+ | Obese III | ELIGIBLE (priority) | Flag for enhanced monitoring |

### Weight Loss Projection
```
Conservative: 5% of body weight in 3 months
Moderate: 10% of body weight in 6 months
Aggressive: 15% of body weight in 12 months (semaglutide avg)
Tirzepatide boost: 20–25% in 12 months (clinical trial data)
```

**Formula for patient file:**
```
Starting Weight: [X] lbs
Goal Weight: [Y] lbs
Total to Lose: [X - Y] lbs
BMI: [calculated]
Projected Timeline (moderate): [months] months
Projected Timeline (aggressive): [months] months
```

---

## 2. Medical History & Contraindication Screening

### HARD STOP (Automatic Disqualification)
| Condition | Action | Revenue Impact |
|-----------|--------|---------------|
| Personal/family history of MTC | STOP. Do not proceed. | $0 — compliance non-negotiable |
| MEN2 syndrome | STOP. Do not proceed. | $0 |
| Type 1 Diabetes | STOP. Do not proceed. | $0 |
| Currently pregnant | STOP. Do not proceed. | $0 |
| Currently breastfeeding | STOP. Do not proceed. | $0 |
| Active eating disorder (anorexia/bulimia) | STOP. Refer to specialist. | $0 |

### SOFT FLAG (MD Review Required)
| Condition | Risk Level | Action |
|-----------|-----------|--------|
| History of pancreatitis | HIGH | MD must review. May proceed with monitoring. |
| Gastroparesis | HIGH | MD must review. GLP-1 slows gastric emptying further. |
| Active cancer treatment | HIGH | MD review. Timing may need adjustment. |
| Gallbladder disease/removed | MODERATE | Note for monitoring. GLP-1 increases gallstone risk. |
| Kidney disease (eGFR < 30) | MODERATE | MD review. Dose adjustment may be needed. |
| Liver disease | MODERATE | MD review. CMP critical. |
| History of suicidal ideation | MODERATE | MD review. Monitor mood closely. |
| Type 2 Diabetes (on insulin) | LOW-MOD | MD coordinates with PCP. Insulin adjustment needed. |
| Thyroid disorder (existing) | LOW | TSH baseline critical. May need thyroid med adjustment. |
| PCOS | LOW | Actually a positive indicator for GLP-1 benefit. |

### Current Medications Check
| Medication Class | Interaction Risk | Action |
|-----------------|-----------------|--------|
| Insulin/sulfonylureas | HIGH — hypoglycemia risk | MD must coordinate dose reduction |
| Oral diabetes meds (metformin) | LOW | Generally safe, MD awareness |
| Blood thinners (warfarin) | LOW-MOD | Monitor INR, delayed absorption possible |
| Thyroid meds (levothyroxine) | LOW | Take 30+ min before GLP-1 injection |
| Oral contraceptives | LOW | Absorption may be affected, note for patient |
| SSRIs/SNRIs | LOW | Monitor mood, note interaction |
| Blood pressure meds | LOW | May need dose reduction as weight drops |

---

## 3. Lifestyle Assessment

### Sleep Score (0–10)
| Response | Score | Flag |
|----------|-------|------|
| 7–9 hours, good quality | 10 | None |
| 6–7 hours, decent quality | 7 | Educate on sleep + weight loss connection |
| 5–6 hours, poor quality | 4 | Flag — sleep deprivation sabotages GLP-1 results |
| < 5 hours or sleep disorder | 1 | FLAG — recommend sleep study, set expectations |

### Diet Score (0–10)
| Response | Score | Flag |
|----------|-------|------|
| Balanced meals, cooks regularly, portion aware | 10 | None |
| Decent but inconsistent, some fast food | 6 | Nutritional guidance recommended |
| Heavy fast food, sugar, irregular meals | 3 | Set expectations — GLP-1 helps but diet matters |
| Binge eating or severe restriction cycles | 1 | FLAG — behavioral component needs addressing |

### Activity Score (0–10)
| Response | Score | Flag |
|----------|-------|------|
| Regular exercise 3-5x/week | 10 | Excellent candidate |
| Some activity 1-2x/week | 6 | Encourage gradual increase |
| Sedentary, desk job, no exercise | 3 | Set expectations, recommend walking program |
| Physical limitations preventing exercise | 1 | Note limitations, adjust expectations |

### Lifestyle Composite Score
```
Lifestyle Score = (Sleep + Diet + Activity) / 3
```
| Range | Classification | Implication |
|-------|---------------|-------------|
| 8–10 | Excellent | Fast results expected. Strong compliance. |
| 5–7 | Moderate | Good candidate. Lifestyle coaching helps. |
| 3–4 | Needs Support | Results slower. Weekly check-ins critical. |
| 1–2 | High Risk | Flag for enhanced monitoring. Manage expectations. |

---

## 4. Emotional Eating Assessment

### Screening Questions
1. Do you eat when stressed, bored, or emotional (not hungry)? → Y/N + frequency
2. Do you eat past fullness regularly? → Y/N
3. Do you hide eating or eat differently alone vs. with others? → Y/N
4. Have you tried 3+ diets in the past 2 years? → Y/N
5. Do you feel guilt or shame after eating? → Y/N

### Emotional Eating Score
| "Yes" Count | Score | Classification | Action |
|-------------|-------|---------------|--------|
| 0–1 | LOW | Minimal emotional component | Standard onboarding |
| 2–3 | MODERATE | Emotional eating present | Include behavioral tips in check-ins |
| 4–5 | HIGH | Significant emotional component | Flag for enhanced support. Consider therapy referral. GLP-1 helps but isn't enough alone. |

---

## 5. Motivation & Timeline Scoring

### Motivation Assessment
| Question | High (3) | Medium (2) | Low (1) |
|----------|----------|------------|---------|
| Why now? | Health scare, doctor ordered, life event | "Ready for a change" | "Just curious" |
| Previous attempts? | Multiple, understands the work | A few, mixed results | None or gave up quickly |
| Support system? | Spouse/family supportive | Some support | No support or opposition |
| Willing to do labs + GFE? | "Yes, let's go" | "I guess so" | "Why do I need that?" |
| Budget comfort? | No price objections | Asked about cost but OK | Significant price sensitivity |

### Motivation Score
```
Motivation Score = sum of all answers (5–15)
```
| Range | Classification | Compliance Prediction | Action |
|-------|---------------|----------------------|--------|
| 13–15 | HIGH | 85%+ compliance likely | Fast-track onboarding. VIP candidate. |
| 9–12 | MODERATE | 60–85% compliance likely | Standard onboarding. Extra encouragement. |
| 5–8 | LOW | < 60% compliance likely | Set clear expectations. Consider if right fit. |

---

## 6. Compliance Likelihood Score (CLS)

**Master formula combining all intake scores:**

```
CLS = (BMI Eligibility × 0.15) + (Medical Clear × 0.20) + (Lifestyle Score × 0.20) +
      (Emotional Eating inverse × 0.15) + (Motivation Score × 0.30)

Weighted to 0–100 scale
```

| CLS Range | Classification | Predicted LTV | Onboarding Priority |
|-----------|---------------|---------------|-------------------|
| 80–100 | PLATINUM | $7,000+/year | Same-day processing. VIP treatment. |
| 60–79 | GOLD | $4,500–7,000/year | Priority processing. Standard path. |
| 40–59 | SILVER | $2,500–4,500/year | Standard. Extra touchpoints needed. |
| < 40 | BRONZE | < $2,500/year | Manage expectations. May not convert. |

---

## 7. Intake Output Format

When `/intake` processes a GLP-1 patient, generate this block in the patient file:

```markdown
## GLP-1 Assessment
- **BMI:** [X] ([classification])
- **Weight to Lose:** [X] lbs
- **Projected Timeline:** [X] months (moderate) / [X] months (aggressive)
- **Contraindications:** [NONE / list with risk levels]
- **Medications to Monitor:** [NONE / list]
- **Lifestyle Score:** [X]/10 (Sleep: [X] | Diet: [X] | Activity: [X])
- **Emotional Eating:** [LOW/MODERATE/HIGH]
- **Motivation Score:** [X]/15 ([HIGH/MODERATE/LOW])
- **Compliance Likelihood Score:** [X]/100 ([PLATINUM/GOLD/SILVER/BRONZE])
- **Predicted LTV:** $[X]/year
- **Recommended Medication:** [Semaglutide/Tirzepatide] (based on BMI + goals)
- **Recommended Tier:** [Essential/Premium/VIP Transform]
- **Cross-Sell Opportunities:** [list based on assessment]
- **Risk Flags:** [list or NONE]
```

---

## 8. Medication Recommendation Logic

| BMI | Weight to Lose | Budget | Recommendation |
|-----|---------------|--------|---------------|
| 25–30 | < 30 lbs | Any | Semaglutide Essential ($299/mo) |
| 30–35 | 30–50 lbs | Standard | Semaglutide Premium ($399/mo) |
| 30–35 | 30–50 lbs | Premium | Tirzepatide Premium ($449/mo) |
| 35–40 | 50–80 lbs | Standard | Tirzepatide Premium ($499/mo) |
| 35–40 | 50–80 lbs | Premium | Tirzepatide + VIP Transform ($1,199/3mo) |
| 40+ | 80+ lbs | Any | Tirzepatide + VIP Transform ($1,199/3mo) |

**Tirzepatide over Semaglutide when:**
- BMI 35+ (more aggressive weight loss needed)
- Patient has tried semaglutide before with plateau
- Type 2 Diabetes present (dual GIP/GLP-1 benefit)
- Patient wants fastest possible results + budget allows

---

## Integration Points

### Airtable Fields (add to Client Intakes table)
- `BMI (Calculated)` — Number
- `Lifestyle Score` — Number (0-10)
- `Emotional Eating Score` — Single select: LOW/MODERATE/HIGH
- `Motivation Score` — Number (5-15)
- `Compliance Likelihood Score` — Number (0-100)
- `CLS Tier` — Single select: PLATINUM/GOLD/SILVER/BRONZE
- `GLP1 Risk Flags` — Long text
- `Recommended Medication` — Single select: Semaglutide/Tirzepatide
- `Recommended Tier` — Single select: Essential/Premium/VIP Transform

### Dashboard Integration
- `/src/lib/churn/engine.ts` — Feed CLS into churn prediction (CLS < 50 = higher baseline churn risk)
- `/src/lib/recommendations/engine.ts` — Use lifestyle scores to personalize cross-sell timing
- `/api/dashboard/clients/[id]` — Display GLP-1 Assessment in 360° profile

### n8n Integration
- WF1 Intake Intelligence Engine: Add GLP-1 scoring to AI analysis prompt
- WF2 Immediate Lead Response: Personalize response based on CLS tier (PLATINUM gets phone call, not just text)
