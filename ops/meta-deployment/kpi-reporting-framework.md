# KPI Reporting Framework

Source: `META-COMMANDER-OS-v8.md` — KPI Targets & Reporting Framework

---

## KPI Hierarchy (Track in This Order)

1. **Lead Reality** — qualified leads, booked consults, show rate, patient starts
2. **Cost Efficiency** — CPL, cost per booked consult, cost per patient start
3. **Revenue Efficiency** — revenue per lead, revenue per booked consult, contribution margin
4. **Creative / Traffic Quality** — CTR, CPC, landing page view rate, hook rate, thumb-stop
5. **Community Responsiveness** — DM response time, comment response time, backlog, stale lead recovery

---

## Primary KPI Targets

| KPI | Target | Trust Level |
|-----|--------|-------------|
| Cost Per Lead (CPL) | < $35 | Trusted only after Gate 1 passes |
| Cost Per Acquisition (CPA) | < $150 | Trusted only after 30+ conversions |
| Lead-to-Consultation Rate | > 40% | CLASS 3 until tracking verified |
| Consultation-to-Patient Rate | > 50% | CLASS 3 until tracking verified |
| Monthly Patient Starts | 15-25 | CLASS 3 until attribution validated |
| ROAS (blended) | > 3:1 | Trusted only after 60+ days clean tracking |
| Monthly Ad Spend | $3,000-4,500 | CLASS 1 when live |

## Secondary KPI Targets

| KPI | Target | Purpose |
|-----|--------|---------|
| CTR (link clicks) | > 1.5% | Creative health |
| CPM | < $25 | Audience efficiency |
| Frequency | < 3.0 / 7 days | Ad fatigue monitor |
| Landing Page Conversion | > 8% | Form/page health |
| DM Response Time | < 4 hours | Lead decay prevention |
| Comment Response Rate | 100% buying intent | Community health |
| Video View Rate (3-sec) | > 25% | Content resonance |
| Video Completion Rate | > 10% | Content quality |

## Provisional Targets [CLASS 2]

- CTR: 1.5%+ cold, 2.5%+ retargeting
- CPC: < $3 local, < $5 statewide
- Landing page conversion: 5%+ warm, 2%+ cold
- Lead form completion: 8%+
- CPL by service: GLP-1 $20-60, Sofwave $40-120, Waitlist $10-35
- Booked consult rate: 25%+
- Show rate: 60%+

---

## Reporting Confidence Labels

Every metric must carry one of:
- **VERIFIED** — meets Trusted Metrics Rule (14+ days, 30+ conversions, no outages, manually verified)
- **PROVISIONAL** — directionally useful but below trust thresholds
- **UNVERIFIED** — do not use for decisions; transparency only
- **ESTIMATED** — based on working assumptions; flag margin of error

**Rule:** Never present PROVISIONAL or UNVERIFIED metrics as evidence for scaling, budget changes, or performance claims.

---

## Trusted Metrics Rule

A metric is trusted only when:
- pixel event active and recording for 14+ days
- 30+ conversions in the measurement window
- no tracking outages during the window
- conversion path manually verified end-to-end at least once

---

## Sample Size Rule

Do not make structural changes based on fewer than:
- 1,000 impressions per ad (creative quality)
- $50 spend per ad set (audience quality)
- 30 conversions per campaign (automated optimization)
- 14 days of data (bid strategy changes)
- 2 full business weeks (trend declaration)

---

## Reporting Cadence

### Daily
- Spend by campaign
- Leads
- Booked consults
- Major DM/comment issues
- Tracking failures
- Creative fatigue signs

### Weekly (Monday)
- Campaign performance summary
- Creative winners/losers
- Audience performance
- Funnel drop-off points
- Community management summary
- Budget reallocation recommendation
- Issues/blockers needing owner decision
- Next-week testing plan
- Confidence labels on every metric

### Monthly (First week)
- Patient acquisition summary
- Revenue contribution by campaign
- Month-over-month trends
- Budget efficiency
- Service tier performance
- Audience and creative insights
- Scale/hold/cut decisions
- Gate status re-verification

---

## What Not to Report as a KPI

- Total reach (unless tied to specific objective)
- Follower count growth (vanity)
- Post likes (unless analyzing content trends)
- Impressions alone (without production context)

---

## Weekly KPI Snapshot Template

```
Week of: [date]
Status: [PROVISIONAL / VERIFIED]

Spend:          $_____ (budget: $_____)
Leads:          _____
Booked Consults: _____
Show Rate:      _____%
Patient Starts: _____
CPL:            $_____
CPA:            $_____ [PROVISIONAL]

Top Creative:   [ad name / hook]
Weak Point:     [funnel stage]
Action:         SCALE / HOLD / FIX / CUT

Note: CPA / ROAS not trusted unless Gate 1 tracking integrity is verified.
```
