# GLP-1 Reactivation + Optimization Engine
**Purpose:** Detect plateaus and dropouts early, trigger upsell opportunities at the right moment, and manage maintenance transitions to maximize LTV.

---

## 1. Plateau Detection

### Definition
A plateau occurs when a patient loses < 1 lb per month for 2+ consecutive months while actively taking medication.

### Plateau Detection Algorithm
```
IF patient.phase == "ACTIVE-LOSS"
  AND patient.monthlyWeightLoss < 1.0 for 2 consecutive months
  AND patient.adherenceScore >= 70 (they ARE taking the medication)
  → TRIGGER: Plateau Protocol
```

### Plateau Protocol (5-Step)

**Step 1: Validate (Day 0)**
- Confirm weight data is accurate (same scale, same time of day)
- Check adherence score (if < 70, adherence is the issue, not plateau)
- Review symptom log for changes
- Calculate body composition changes (measurements, not just weight)

**Step 2: Assess (Day 1)**
- Current dose: Is there room to titrate up?
- Diet changes: Has patient reverted to old habits?
- Activity level: Has exercise decreased?
- Sleep: Any changes in sleep quality?
- Stress: Major life changes?
- Medications: Any new meds that affect weight?

**Step 3: Intervene (Day 2–7)**
| Intervention | When to Use | Revenue Impact |
|-------------|------------|---------------|
| Titrate up | Not at max dose, tolerating well | +$50-100/mo (higher dose = higher price) |
| Switch Sema → Tirz | On sema, plateaued at D3+ | +$100-150/mo |
| Add Lipo-Mino | Not currently receiving | +$100/mo |
| Add Sermorelin | Interested in enhanced results | +$349/mo |
| Nutritional reset | Diet quality declined | $0 (retention value) |
| Activity increase | Sedentary or decreased activity | $0 (retention value) |
| MD consultation | Complex case or medical factors | Included in service |

**Step 4: Monitor (Week 2–4 post-intervention)**
- Weekly check-ins (regardless of tier)
- Track weight response to intervention
- Adjust if no response in 2 weeks

**Step 5: Resolve or Escalate (Month 2)**
- If plateau broken: Return to standard cadence, celebrate
- If plateau persists: Second intervention (stack approaches)
- If patient frustrated: Churn save protocol + MD consultation

### Plateau Text (SMS)
```
[FIRST_NAME], I noticed the scale has been stubborn lately. That's actually really common and happens to almost everyone. Your body is adjusting to the weight it's already lost. I have some ideas that could help get things moving again. Can we chat this week? I think a small adjustment could make a big difference! (425) 539-4440
```

---

## 2. Dropout Detection

### Dropout Risk Scoring
| Signal | Points | Detection Method |
|--------|--------|-----------------|
| Missed 1 check-in | +10 | No response to weekly check-in |
| Missed 2 consecutive check-ins | +25 | Pattern detection |
| Missed refill payment | +30 | Billing system |
| Declined refill ("skip this month") | +20 | Patient request |
| Requested pause | +15 | Subscription system |
| Expressed price concern | +20 | Message keyword detection |
| Expressed frustration with results | +25 | Message keyword detection |
| Side effect complaints increasing | +15 | Symptom trend analysis |
| No weight loss in 4+ weeks | +10 | Weight trend stall |
| Cancelled appointment | +10 | Mangomint |
| Adherence score < 50 | +20 | Adherence system |

### Dropout Risk Levels
| Total Points | Risk Level | Time to Act | Action |
|-------------|-----------|-------------|--------|
| 0–15 | LOW | Standard cadence | Monitor |
| 16–35 | MODERATE | This week | Extra check-in, identify concern |
| 36–55 | HIGH | Today | Rina calls personally |
| 56+ | CRITICAL | Now | Full churn save protocol + MD if needed |

### Dropout Intervention Sequence

**MODERATE Risk (16–35 points):**
```
Day 0: Soft check-in text
Day 3: If no response, personalized "thinking of you" text
Day 5: Phone call attempt
```

**HIGH Risk (36–55 points):**
```
Day 0: Rina calls personally
Day 1: Follow-up text with specific offer (dose adjust, tier change, add-on)
Day 3: Email with success stories + "we miss you"
Day 5: Final text with pause option (better than cancel)
```

**CRITICAL Risk (56+ points):**
```
Day 0: Rina calls immediately
Day 0: Text with clear "I want to help" message
Day 1: Email with options (pause, downgrade, adjust)
Day 3: If no response, win-back sequence triggered
```

### Dropout Prevention Text (Moderate)
```
Hey [FIRST_NAME]! I just wanted to check in personally. I noticed it's been a little while since we connected. How are things going with your [MEDICATION]? I'm always here if you have questions or if anything needs adjusting. You matter to me! (425) 539-4440
```

---

## 3. Upsell Triggers

### Automated Upsell Detection Rules
```
RULE: lipo_mino_upsell
  IF patient.month >= 2
  AND patient.totalWeightLost >= 8
  AND patient.tier != "VIP"
  AND NOT patient.hasAddon("lipo-mino")
  → GENERATE: Lipo-Mino upsell text
  → REVENUE: +$100/mo

RULE: sermorelin_upsell
  IF patient.month >= 3
  AND (patient.sleepScore <= 6 OR patient.energyComplaints >= 2)
  AND NOT patient.hasAddon("sermorelin")
  → GENERATE: Sermorelin upsell text
  → REVENUE: +$349/mo

RULE: nad_upsell
  IF patient.month >= 4
  AND patient.adherenceScore >= 70
  AND patient.age >= 35
  AND NOT patient.hasAddon("nad")
  → GENERATE: NAD+ upsell text
  → REVENUE: +$399/mo

RULE: sofwave_upsell
  IF patient.totalWeightLost >= 30
  AND patient.age >= 35
  → GENERATE: Sofwave consultation offer
  → REVENUE: +$2,750-4,500 one-time

RULE: b12_vitamin_d_upsell
  IF patient.symptom.includes("fatigue") for 2+ weeks
  AND NOT patient.hasAddon("b12")
  → GENERATE: B12 + Vitamin D combo text
  → REVENUE: +$85/visit

RULE: tier_upgrade
  IF patient.tier == "ESSENTIAL"
  AND patient.month >= 2
  AND patient.adherenceScore >= 80
  AND patient.motivation == "HIGH"
  → GENERATE: Premium tier upgrade offer
  → REVENUE: +$100-150/mo

RULE: vip_upgrade
  IF patient.tier == "PREMIUM"
  AND patient.month >= 3
  AND patient.totalWeightLost >= 15
  → GENERATE: VIP Transform upgrade offer
  → REVENUE: +$200-400/mo effective

RULE: tirz_switch
  IF patient.medication == "semaglutide"
  AND patient.plateau == true
  AND patient.dose >= "D3"
  → GENERATE: Tirzepatide switch discussion
  → REVENUE: +$100-150/mo
```

### Upsell Priority Ranking
```
Priority = (revenue_impact × conversion_likelihood × timing_score) / effort

High Priority (action this week):
  - Tier upgrades for high-adherence patients
  - Tirz switch for plateaued sema patients
  - Lipo-Mino for Month 2+ patients losing well

Medium Priority (this month):
  - Sermorelin for patients with sleep/energy complaints
  - Sofwave consultations for 30+ lb losers
  - B12/VitD for fatigue reports

Low Priority (opportunistic):
  - NAD+ for engaged patients 4+ months in
  - VIP upgrade for premium patients thriving
```

---

## 4. Maintenance Transition Flow

### Transition Criteria (ALL must be met)
- Within 10% of goal weight for 8+ consecutive weeks
- Stable dose for 3+ months (no titration needed)
- Adherence score consistently 75+
- No active risk flags
- Patient expresses satisfaction with current weight
- Lifestyle Score 7+ (sustainable habits built)

### Transition Process

**Step 1: Identify Candidates (automated)**
```
Weekly scan: Flag all patients meeting transition criteria
Generate: Maintenance Transition Report
```

**Step 2: Discuss with Patient**
```
[FIRST_NAME], I am SO proud of you! You've lost [X] lbs and you've been holding steady for [X] weeks. That is incredible.

I want to talk about the next chapter. You've done the hard work. Now we shift to maintenance mode, which means keeping your results long-term.

Here's what that looks like:
- Lower medication dose (which also means lower cost)
- Monthly check-ins instead of weekly
- Focus on lifestyle habits that keep the weight off
- Optional wellness add-ons to keep you feeling amazing

Can we chat about this at your next check-in? I'm so excited for this milestone! (425) 539-4440
```

**Step 3: Adjust Plan**
| Current | Maintenance | Price Change |
|---------|-------------|-------------|
| Sema D3 ($399) | Sema D1-D2 ($299-349) | -$50 to -$100/mo |
| Tirz D3 ($499) | Tirz D1-D2 ($399-449) | -$50 to -$100/mo |
| VIP Transform ($400/mo) | Premium maintenance ($399/mo) | Similar |

**Step 4: Transition Upsells (replace lost revenue)**
| Upsell | Revenue | Pitch |
|--------|---------|-------|
| Wellness injection membership | +$150-300/mo | "Now that you're maintaining, let's optimize how you feel" |
| Sermorelin peptide | +$349/mo | "The perfect next step: better sleep, anti-aging, lean muscle" |
| Sofwave skin tightening | +$2,750-4,500 | "Your body is transformed, now let's tighten everything up" |
| NAD+ therapy | +$399/mo | "Peak performance mode: energy, cognition, anti-aging" |
| Referral program | $50 credit/referral | "You're our best success story. Know anyone who'd benefit?" |

**Step 5: Maintenance Monitoring**
- Monthly weight check-in (vs. weekly)
- Quarterly labs continue
- Refill cadence continues (lower dose)
- Watch for regain > 5 lbs (trigger re-engagement)
- Annual program review with Rina

### Maintenance Alert: Weight Regain
```
IF patient.phase == "MAINTENANCE"
  AND patient.weightGain >= 5 lbs from maintenance baseline
  → ALERT: Weight regain detected
  → ACTION: Increase dose, return to bi-weekly check-ins
```

### Maintenance Regain Text
```
[FIRST_NAME], I noticed a little bit of bounce-back on the scale. That's completely normal and happens to a lot of people. The good news is we caught it early! I'd like to bump your dose back up slightly and do more frequent check-ins for the next few weeks. No stress at all, this is exactly why we stay on top of things. Can we chat? (425) 539-4440
```

---

## 5. Win-Back System (for dropped patients)

### Win-Back Tiers
| Days Inactive | Classification | Approach | Expected Recovery |
|---------------|---------------|----------|-------------------|
| 14–30 days | WARM | Quick reconnect | 40-50% recovery |
| 31–60 days | COOLING | Value reminder | 20-30% recovery |
| 61–90 days | COLD | Fresh start offer | 10-15% recovery |
| 90+ days | ICE | Annual check-in | 5% recovery |

### Win-Back Sequences

**WARM (14–30 days):**
```
Touch 1 (Day 14): "Miss you" text
Touch 2 (Day 18): Email with progress reminder + what they'll lose
Touch 3 (Day 24): Text with easy restart offer
```

**COOLING (31–60 days):**
```
Touch 1 (Day 31): "Thinking of you" text
Touch 2 (Day 38): Email with success stories from similar patients
Touch 3 (Day 45): Text with special restart incentive (free first month labs)
Touch 4 (Day 55): Final text with pause option
```

**COLD (61–90 days):**
```
Touch 1 (Day 61): Email — "A lot has changed, here's what's new"
Touch 2 (Day 75): Text — "Fresh start" offer
Touch 3 (Day 88): Final outreach — "Door is always open"
```

---

## 6. Optimization Report (Weekly)

### Auto-Generated Every Monday
```markdown
## GLP-1 Optimization Report - Week of [DATE]

### Plateau Patients
| Patient | Months Stalled | Current Dose | Recommended Action | Revenue Impact |
|---------|---------------|-------------|-------------------|---------------|

### Dropout Risk
| Patient | Risk Score | Risk Level | Days Since Contact | MRR at Risk |
|---------|-----------|-----------|-------------------|------------|

### Upsell Opportunities
| Patient | Upsell | Revenue Add | Trigger | Priority |
|---------|--------|------------|---------|----------|

### Maintenance Candidates
| Patient | Months Active | Weight Lost | At Goal? | Transition Ready |
|---------|-------------|------------|---------|-----------------|

### Win-Back Pipeline
| Patient | Days Inactive | Last MRR | Recovery Potential | Sequence Stage |
|---------|-------------|---------|-------------------|---------------|

### Summary
- Plateau interventions needed: [X]
- High-risk dropouts: [X] ($[X]/mo at risk)
- Upsell revenue available: $[X]/mo
- Maintenance transitions: [X] patients
- Win-back potential: $[X]/mo recoverable
- **Total optimization opportunity: $[X]/mo**
```

---

## Integration Points

### Airtable Fields (add to Clients table)
- `Plateau Status` — Single select: NONE/DETECTED/INTERVENING/RESOLVED
- `Plateau Start Date` — Date
- `Dropout Risk Score` — Number (0-100)
- `Dropout Risk Level` — Single select: LOW/MODERATE/HIGH/CRITICAL
- `Last Upsell Offered` — Single select (from upsell list)
- `Last Upsell Date` — Date
- `Upsell Accepted` — Checkbox
- `Maintenance Ready` — Checkbox
- `Maintenance Start Date` — Date
- `Maintenance Baseline Weight` — Number
- `Win-Back Stage` — Single select: NONE/WARM/COOLING/COLD/ICE/RECOVERED

### Dashboard Integration
- New "GLP-1 Optimization" widget: plateau count, dropout risk, upsell pipeline
- `/src/lib/recommendations/engine.ts` — Feed upsell rules into recommendation engine
- `/src/lib/churn/engine.ts` — Dropout risk score feeds into master churn prediction
- Revenue forecasting: Include upsell pipeline in projected revenue

### n8n Workflows (new)
- **WF-GLP1-PLATEAU:** Weekly scan for plateau patients, trigger protocol
- **WF-GLP1-DROPOUT:** Daily scan for dropout risk signals, trigger interventions
- **WF-GLP1-UPSELL:** Weekly scan for upsell opportunities, generate texts
- **WF-GLP1-MAINTENANCE:** Weekly scan for maintenance candidates
- **WF-GLP1-WINBACK:** Daily process win-back sequences for inactive patients
- **WF-GLP1-OPTIMIZATION-REPORT:** Monday AM auto-generate optimization report
