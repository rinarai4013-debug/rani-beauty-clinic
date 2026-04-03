# GLP-1 Subscription System
**Purpose:** Structured membership tiers, automated billing, refill cadence, and churn prevention for predictable recurring revenue.

---

## 1. Membership Tiers

### Tier 1: ESSENTIAL
**Price:** $299–499/mo (dose-dependent)
**Target:** Budget-conscious patients, BMI 25–32, straightforward cases

| Included | Details |
|----------|---------|
| GLP-1 medication | Semaglutide (compounded), shipped monthly |
| Telehealth GFE | Initial + quarterly via Qualiphy |
| Required labs | Initial + quarterly panels |
| Monthly check-in | Text-based check-in with Rina |
| Dose management | Titration per protocol |
| Injection supplies | Syringes, alcohol pads included |

**Pricing by Dose (Semaglutide):**
| Dose | Monthly | Margin |
|------|---------|--------|
| D1 (0.25mg) | $299 | ~75% |
| D2 (0.5mg) | $349 | ~73% |
| D3 (1.0mg) | $399 | ~70% |
| D4 (1.7–2.4mg) | $449–499 | ~68% |

---

### Tier 2: PREMIUM
**Price:** $399–599/mo (dose-dependent)
**Target:** Patients wanting faster results, BMI 30+, willing to invest

| Included | Details |
|----------|---------|
| Everything in Essential | + |
| Tirzepatide option | Patient can choose Tirz over Sema |
| Bi-weekly Lipo-Mino | 2 injections/mo included (normally $100) |
| Priority messaging | Same-day response guarantee |
| Nutritional guidance | Basic meal planning tips in check-ins |
| Progress tracking | Detailed monthly progress report |

**Pricing by Dose (Tirzepatide):**
| Dose | Monthly | Margin |
|------|---------|--------|
| D1 (2.5mg) | $399 | ~70% |
| D2 (5.0mg) | $449 | ~68% |
| D3 (7.5mg) | $499 | ~65% |
| D4 (10–15mg) | $549–599 | ~62% |

---

### Tier 3: VIP TRANSFORM
**Price:** $1,199/3 months ($399.67/mo effective)
**Target:** High-value patients, BMI 35+, want concierge experience

| Included | Details |
|----------|---------|
| Everything in Premium | + |
| Semaglutide + Lipo-Mino + B12 | Full injection stack |
| All labs included | Initial + quarterly, no extra cost |
| Dedicated Qualiphy GFE | Priority MD review |
| Weekly check-ins | Phone or text, patient's choice |
| Consultation calls | Monthly 15-min call with Rina |
| Referral bonus | $100 credit per referral (vs. $50 standard) |
| Skin tightening discount | 15% off Sofwave when eligible |

---

### Tier Comparison Matrix

| Feature | Essential | Premium | VIP Transform |
|---------|-----------|---------|---------------|
| Monthly price range | $299–499 | $399–599 | $399.67/mo (paid quarterly) |
| Medication | Semaglutide | Sema or Tirz | Semaglutide |
| Lipo-Mino | Add-on ($50/ea) | 2/mo included | 2/mo included |
| B12 injections | Add-on ($35/ea) | Add-on ($35/ea) | Included |
| Labs | Patient pays | Patient pays | Included |
| Check-in frequency | Monthly | Bi-weekly | Weekly |
| Response time | 24 hours | Same day | Priority (< 4 hours) |
| Referral credit | $50 | $50 | $100 |
| Sofwave discount | None | 10% | 15% |
| Mangomint tags | GLP1-ESSENTIAL | GLP1-PREMIUM | GLP1-VIP |

---

## 2. Auto-Billing Logic

### Billing Cycle
```
Day 0:  Subscription starts (first payment processed)
Day 25: Pre-billing notification sent (5 days before renewal)
Day 30: Auto-charge on file (Square recurring)
Day 31: If declined → Payment Failed SOP triggered
Day 33: Retry #1
Day 36: Retry #2 + nudge text
Day 40: Card not updated → HOLD medication, AT-RISK flag
Day 45: No resolution → Pause subscription, win-back sequence
```

### Pre-Billing Text (Day 25)
```
Hi [FIRST_NAME]! Quick heads up, your [MEDICATION] subscription renews in 5 days ($[AMOUNT]). Everything look good with your card on file? If you need to update anything, just reply or call me at (425) 539-4440
```

### Successful Renewal Text
```
[FIRST_NAME], your [MEDICATION] refill has been processed and will ship today! You should receive it within 3-5 business days. Keep up the amazing work! (425) 539-4440
```

---

## 3. Refill Tracking

### Monthly Refill Calendar
```
For each active GLP-1 patient, track:
- Last refill date
- Next refill date (last + 30 days)
- Days until refill
- Payment status (paid/pending/failed)
- Shipping status (not started/processing/shipped/delivered)
- Dose (current dose level)
```

### Refill Processing Checklist
1. Verify payment processed
2. Verify quarterly labs current (if due)
3. Verify no open risk flags requiring MD review
4. Confirm current dose (check for titration orders)
5. Submit refill to pharmacy
6. Generate shipping confirmation
7. Update patient file + refill-schedule.md
8. Schedule next refill date

### Refill Status Tags (Mangomint)
- `REFILL-PROCESSED` — Payment + pharmacy confirmed
- `REFILL-SHIPPED` — Medication in transit
- `REFILL-DELIVERED` — Confirmed delivery
- `REFILL-DUE` — Within 7 days of refill date
- `REFILL-OVERDUE` — Past refill date, not processed
- `REFILL-HOLD` — Held for labs, payment, or MD review

---

## 4. Appointment Cadence

### By Tier
| Tier | Check-In Type | Frequency | Channel |
|------|--------------|-----------|---------|
| Essential | Text check-in | Monthly | SMS |
| Essential | Quarterly labs | Every 90 days | In-person or Quest/Labcorp |
| Premium | Text check-in | Bi-weekly | SMS |
| Premium | Quarterly labs | Every 90 days | In-person or Quest/Labcorp |
| Premium | Lipo-Mino injection | Bi-weekly | In-clinic |
| VIP Transform | Text/phone check-in | Weekly | SMS or phone |
| VIP Transform | Consultation call | Monthly | Phone |
| VIP Transform | Quarterly labs | Every 90 days | In-person |
| VIP Transform | Lipo-Mino + B12 | Bi-weekly | In-clinic |

### Appointment Auto-Scheduling Rules
```
ON subscription.start:
  → Schedule first dose follow-up (Day 2)
  → Schedule Week 1 check-in
  → Schedule Month 1 review
  → Schedule quarterly labs (Day 90)

ON refill.processed:
  → Schedule next check-in based on tier
  → If Premium/VIP: schedule next Lipo-Mino

ON titration.approved:
  → Schedule post-titration check-in (Day 3 after new dose)

ON quarterly.labs.received:
  → Schedule MD review
  → Schedule next quarterly labs (+90 days)
```

---

## 5. Pause/Resume System

### Pause Rules
| Reason | Max Pause | Action |
|--------|----------|--------|
| Travel/vacation | 30 days | Hold billing + shipments, resume auto |
| Medical (surgery, illness) | 60 days | MD review before resume, hold billing |
| Financial hardship | 30 days | Offer Essential tier downgrade first |
| Personal request | 30 days | Churn save attempt first |

### Pause Process
1. Patient requests pause (text, call, or email)
2. Attempt churn save (per SOP)
3. If pause confirmed:
   - Stop auto-billing on next cycle
   - Hold medication shipment
   - Apply Mangomint tag: `GLP1-PAUSED`
   - Set resume date
   - Schedule resume reminder (3 days before)
4. Send pause confirmation text

### Pause Confirmation Text
```
Hi [FIRST_NAME], I've paused your [MEDICATION] subscription. Your next billing date will be [RESUME_DATE]. I'll check in with you a few days before to make sure you're ready to restart. Your progress is safe and we'll pick right up where you left off! (425) 539-4440
```

### Resume Process
1. Send resume reminder (3 days before resume date)
2. Confirm patient ready to restart
3. Process payment
4. Ship medication
5. Remove PAUSED tag, restore ACTIVE tags
6. Schedule check-in for 3 days post-resume
7. If no response to resume reminder → extend pause 7 days, then win-back sequence

### Resume Reminder Text
```
Hi [FIRST_NAME]! Your [MEDICATION] subscription is set to restart on [RESUME_DATE]. Are you ready to get back on track? Reply YES and I'll get your refill shipped right away! If you need more time, just let me know. (425) 539-4440
```

---

## 6. Churn Tracking

### Churn Risk Indicators
| Indicator | Weight | Data Source |
|-----------|--------|-------------|
| Missed refill (no payment) | 30% | Billing system |
| No response to check-in (7+ days) | 25% | Message log |
| Weight plateau (< 1 lb/mo for 2 months) | 15% | Check-in data |
| Side effect complaints increasing | 15% | Check-in data |
| Price sensitivity expressed | 10% | Message history |
| Paused subscription | 5% | Subscription status |

### Churn Risk Score (0–100)
```
Churn Risk = Σ (indicator present × weight × severity multiplier)
```

| Score | Risk Level | Action |
|-------|-----------|--------|
| 0–25 | LOW | Standard check-in cadence |
| 26–50 | MODERATE | Extra check-in this week |
| 51–75 | HIGH | Rina calls patient personally |
| 76–100 | CRITICAL | Churn save protocol + escalation |

### Churn Dashboard Metrics
- **Monthly Churn Rate:** Target < 10%
- **Voluntary Churn:** Patient-initiated cancellation
- **Involuntary Churn:** Payment failure, non-response
- **Revenue Churn:** MRR lost from cancellations
- **Net Revenue Retention:** (MRR + expansion - churn) / starting MRR
- **Average Subscription Length:** Target 6+ months
- **Churn by Tier:** Track which tier churns most (optimize accordingly)

### Monthly Churn Report Format
```markdown
## GLP-1 Churn Report - [MONTH]

### Summary
- Active subscribers: [X]
- New subscribers: [X]
- Churned: [X] (voluntary: [X], involuntary: [X])
- Paused: [X]
- Churn rate: [X]%
- MRR lost: $[X]
- MRR gained (new + expansions): $[X]
- Net MRR change: +/- $[X]

### Churn Reasons
| Reason | Count | MRR Lost | Saveable? |
|--------|-------|----------|-----------|
| Price | [X] | $[X] | Offer tier downgrade |
| Side effects | [X] | $[X] | MD review, dose adjust |
| Not working | [X] | $[X] | Titration, Tirz switch |
| Goal reached | [X] | $[X] | Transition to maintenance |
| Payment failed | [X] | $[X] | Card update outreach |
| No response | [X] | $[X] | Win-back sequence |

### At-Risk Patients (next 30 days)
[list with churn risk scores and recommended actions]
```

---

## Integration Points

### Airtable Fields (add to Clients table)
- `GLP1 Tier` — Single select: ESSENTIAL/PREMIUM/VIP-TRANSFORM
- `Subscription Start Date` — Date
- `Billing Cycle Date` — Number (day of month)
- `Subscription Status` — Single select: ACTIVE/PAUSED/CANCELLED/PAYMENT-HOLD
- `Pause Start Date` — Date
- `Pause Resume Date` — Date
- `Churn Risk Score` — Number (0-100)
- `Months Subscribed` — Number
- `Lifetime Revenue` — Currency

### Dashboard Integration
- New "Subscriptions" widget on CEO dashboard: Active count, MRR, churn rate, tier distribution
- `/src/lib/churn/engine.ts` — Feed subscription data into churn prediction
- Revenue anomaly detection: Alert if GLP-1 MRR drops > 10% month-over-month

### n8n Integration
- New workflow: Auto-billing notification (Day 25)
- New workflow: Payment retry sequence (Day 31, 33, 36)
- New workflow: Pause/resume automation
- Existing WF7 Membership Engine: Extend to handle GLP-1 tiers
