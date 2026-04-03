# GLP-1 Weekly Check-In Automation
**Purpose:** Structured weekly data collection, adherence scoring, and automated provider alerts for every active GLP-1 patient.

---

## 1. Check-In Data Collection

### Weekly Check-In Questions (sent via SMS)
```
Hi [FIRST_NAME]! Time for your weekly check-in. Can you reply with:

1. Current weight: ___
2. How are you feeling this week? (1-10, 10 = amazing)
3. Any side effects? (nausea, constipation, fatigue, headache, none)
4. Did you take all your injections this week? (yes/no)
5. Anything you want me to know?

(425) 539-4440
```

### Data Points Tracked Weekly
| Data Point | Type | Source | Purpose |
|-----------|------|--------|---------|
| Weight | Number (lbs) | Patient report | Progress tracking |
| Feeling score | Number (1-10) | Patient report | Wellbeing trend |
| Side effects | Multi-select | Patient report | Safety monitoring |
| Injection adherence | Yes/No | Patient report | Compliance tracking |
| Free-text notes | Text | Patient report | Qualitative insights |
| Weight change (weekly) | Calculated | Current - last week | Progress rate |
| Weight change (total) | Calculated | Current - starting | Total progress |
| % body weight lost | Calculated | Total lost / starting × 100 | Clinical benchmark |

---

## 2. Weight Tracking System

### Weight Log Format (Patient File)
```markdown
## Weight Log
| Date | Weight | Change (wk) | Change (total) | % Lost | BMI | Notes |
|------|--------|-------------|----------------|--------|-----|-------|
| [DATE] | [X] lbs | -- | -- | 0% | [X] | Starting weight |
| [DATE] | [X] lbs | -[X] | -[X] | [X]% | [X] | Week 1 |
| [DATE] | [X] lbs | -[X] | -[X] | [X]% | [X] | Week 2 |
```

### Weight Trend Alerts
| Pattern | Alert Level | Action |
|---------|------------|--------|
| 2+ lbs lost this week | GREEN | Celebrate in next message |
| 0.5–2 lbs lost | GREEN | On track, encourage |
| 0 to +0.5 lbs (stall) | YELLOW | Normal fluctuation, reassure |
| +0.5 to +2 lbs gain | ORANGE | Investigate: water retention, diet, meds, cycle |
| > +2 lbs gain | RED | Provider alert, MD review |
| 5+ lbs in one week loss | ORANGE | Investigate: too rapid, dehydration risk |
| No check-in received | YELLOW→RED | Escalate per no-response protocol |

### Milestone Celebrations
| Milestone | Message Trigger | Template |
|-----------|----------------|----------|
| First 5 lbs lost | Auto | "You've lost your first 5 lbs! That's incredible!" |
| 10 lbs lost | Auto | "Double digits! 10 lbs gone forever!" |
| 10% body weight | Auto | "This is a MAJOR clinical milestone, [FIRST_NAME]!" |
| 25 lbs lost | Auto | "Twenty-five pounds! I am SO proud of you!" |
| 50 lbs lost | Auto + Rina call | Personal congratulations + referral ask |
| Goal weight reached | Auto + Rina call | Celebration + maintenance transition |
| BMI drops a category | Auto | "Your BMI just moved from [old] to [new]!" |

---

## 3. Symptom Tracking

### Common Side Effects Matrix
| Side Effect | Frequency | Severity Scale | When to Alert |
|-------------|-----------|---------------|---------------|
| Nausea | Very common (40%) | Mild/Moderate/Severe | Severe OR lasting > 5 days |
| Constipation | Common (20%) | Mild/Moderate/Severe | Severe OR no BM for 5+ days |
| Diarrhea | Common (15%) | Mild/Moderate/Severe | Severe OR with dehydration signs |
| Fatigue | Common (15%) | Mild/Moderate/Severe | Severe OR worsening over time |
| Headache | Occasional (10%) | Mild/Moderate/Severe | Severe OR persistent |
| Injection site reaction | Occasional (5%) | Mild/Moderate/Severe | Any redness/swelling spreading |
| Dizziness | Uncommon (5%) | Mild/Moderate/Severe | Any episode |
| Hair loss | Uncommon (3%) | Mild/Moderate | Noticeable thinning → biotin upsell |
| Mood changes | Rare (2%) | Mild/Moderate/Severe | ANY mood change → MD review |
| Abdominal pain | Rare (< 1%) | Mild/Moderate/Severe | ANY severe pain → Emergency SOP |

### Symptom Trend Tracking (Patient File)
```markdown
## Symptom Log
| Date | Symptoms | Severity | Duration | Action Taken |
|------|----------|----------|----------|-------------|
| [DATE] | Nausea | Mild | 2 days | Advised small meals, hydration |
| [DATE] | None | -- | -- | Stable |
```

### Automated Provider Alerts
```
IF symptom == "abdominal pain" AND severity == "severe"
  → IMMEDIATE: Emergency SOP triggered

IF symptom == "mood changes" OR report contains "depressed" OR "anxious" OR "suicidal"
  → IMMEDIATE: MD review + Rina notification

IF symptom.severity == "severe" AND symptom.duration > 5 days
  → URGENT: MD review within 24 hours

IF symptom.count >= 3 different symptoms in one week
  → FLAG: Multi-symptom alert, consider dose reduction

IF symptom == "hair loss"
  → UPSELL: Biotin injection ($45/visit)
  → EDUCATE: Temporary, related to caloric deficit, not medication
```

---

## 4. Adherence Scoring

### Weekly Adherence Score (0–100)
| Component | Weight | Scoring |
|-----------|--------|---------|
| Injection taken on schedule | 40% | Yes = 40, No = 0 |
| Check-in submitted on time | 25% | Same day = 25, 1 day late = 15, 2+ days = 5, No response = 0 |
| Weight reported | 15% | Yes = 15, No = 0 |
| Follow dietary guidance | 10% | Self-reported feeling 7+ = 10, 4-6 = 5, 1-3 = 0 |
| No concerning side effects | 10% | None/mild = 10, Moderate = 5, Severe = 0 |

### Adherence Classification
| Score | Classification | Action |
|-------|---------------|--------|
| 85–100 | EXCELLENT | Standard cadence, celebrate |
| 70–84 | GOOD | Encourage, minor coaching |
| 50–69 | NEEDS IMPROVEMENT | Extra check-in, identify barriers |
| < 50 | AT RISK | Provider intervention, Rina calls |

### Rolling Adherence (4-Week Average)
```
Rolling Adherence = avg(last 4 weekly scores)
```
| Rolling Score | Trend | Action |
|--------------|-------|--------|
| 85+ steady | Thriving | Cross-sell opportunities, referral ask |
| 70–84 steady | Stable | Continue current approach |
| 50–69 or declining | Concerning | Enhanced touchpoints, identify root cause |
| < 50 or sharp decline | Critical | Churn save protocol, consider pause |

---

## 5. Automated Alert System

### Alert Hierarchy
```
LEVEL 1 — INFORMATION (logged, no action)
  → Weight within normal fluctuation
  → Mild side effects resolving
  → Check-in 1 day late

LEVEL 2 — ATTENTION (flagged for next review)
  → Weight stall 2+ weeks
  → Adherence score dropped 15+ points
  → Check-in 3+ days late
  → Moderate side effects

LEVEL 3 — ACTION REQUIRED (Rina notified within 24 hours)
  → No check-in for 7+ days
  → Weight gain > 2 lbs
  → Adherence score < 50
  → Multiple moderate side effects
  → Patient expresses frustration or doubt

LEVEL 4 — URGENT (Rina notified immediately)
  → Severe side effects reported
  → Mood changes / mental health concerns
  → Severe abdominal pain
  → Allergic reaction symptoms
  → Patient mentions wanting to quit
```

### Alert Format (for Rina)
```
🚨 ALERT: [LEVEL] — [PATIENT NAME]
Issue: [description]
Revenue at risk: $[MRR × 12]/year
Current dose: [medication] [dose]
Months on program: [X]
Adherence (4-wk avg): [X]%
Action needed: [specific recommendation]
```

---

## 6. Check-In Response Templates

### Good Progress Response
```
[FIRST_NAME], look at you! Down [X] lbs this week, [X] total! You're doing amazing. Keep doing what you're doing. Your next check-in is [DAY]. I'm so proud of you! (425) 539-4440
```

### Plateau Response
```
[FIRST_NAME], I see the scale didn't move much this week. That's totally normal and it happens to almost everyone. Your body is still changing even when the scale doesn't show it. Stay consistent with your injections and hydration. Sometimes the scale catches up all at once! I'm here if you have questions. (425) 539-4440
```

### Side Effects Response
```
[FIRST_NAME], thanks for letting me know about the [SYMPTOM]. That's common in the first few weeks. Here's what helps: [SPECIFIC ADVICE]. If it gets worse or doesn't improve in a few days, let me know right away and I'll have our Medical Director review. You're doing great! (425) 539-4440
```

### Missed Check-In (Day 3)
```
Hey [FIRST_NAME]! Just checking in. I haven't heard from you this week. Everything OK? A quick update helps me make sure you're on track. Just text me your weight and how you're feeling! (425) 539-4440
```

### Missed Check-In (Day 7)
```
[FIRST_NAME], I'm thinking about you. I haven't heard back in a week. I want to make sure everything is going well with your [MEDICATION]. Can you send me a quick update? Even just "I'm good" works! I'm here for you. (425) 539-4440
```

---

## 7. Check-In Data Output (Patient File Block)

```markdown
## Weekly Check-In Log
| Week | Date | Weight | Change | Feeling | Side Effects | Adherence | Score |
|------|------|--------|--------|---------|-------------|-----------|-------|
| 1 | [DATE] | [X] | -- | [X]/10 | [list] | Yes | [X]/100 |
| 2 | [DATE] | [X] | [+/-X] | [X]/10 | [list] | Yes | [X]/100 |

**4-Week Rolling Adherence:** [X]/100
**Total Weight Lost:** [X] lbs ([X]%)
**Average Weekly Loss:** [X] lbs
**Trend:** [IMPROVING/STABLE/DECLINING]
**Active Alerts:** [list or NONE]
```

---

## Integration Points

### Airtable Fields (add to Clients table)
- `Last Check-In Date` — Date
- `Last Weight` — Number
- `Total Weight Lost` — Number
- `Weekly Adherence Score` — Number (0-100)
- `Rolling Adherence (4wk)` — Number (0-100)
- `Adherence Classification` — Single select: EXCELLENT/GOOD/NEEDS-IMPROVEMENT/AT-RISK
- `Active Alerts` — Long text
- `Alert Level` — Single select: NONE/INFORMATION/ATTENTION/ACTION/URGENT

### New Airtable Table: `GLP1 Check-Ins`
| Field | Type | Purpose |
|-------|------|---------|
| Client (linked) | Link to Clients | Patient reference |
| Check-In Date | Date | When submitted |
| Weight | Number | Reported weight |
| Feeling Score | Number (1-10) | Self-reported wellbeing |
| Side Effects | Multi-select | Reported symptoms |
| Injection Taken | Checkbox | Compliance |
| Notes | Long text | Free-text from patient |
| Adherence Score | Number (0-100) | Calculated |
| Weight Change | Number | Calculated weekly delta |
| Alert Level | Single select | Calculated alert |

### Dashboard Integration
- New "GLP-1 Check-Ins" widget: This week's check-ins received vs. expected
- Weight trend chart on client 360° profile
- Adherence heatmap: Visual grid of all patients' weekly adherence
- Alert queue: Sorted by urgency, one-click to take action

### n8n Workflows (new)
- **WF-GLP1-CHECKIN-SEND:** Weekly auto-send check-in questions (Tuesday AM)
- **WF-GLP1-CHECKIN-PROCESS:** Parse check-in responses, calculate scores, trigger alerts
- **WF-GLP1-CHECKIN-REMIND:** Day 3 + Day 7 reminders for non-responders
- **WF-GLP1-MILESTONE:** Detect milestones (5/10/25/50 lbs, BMI change) and send celebrations
