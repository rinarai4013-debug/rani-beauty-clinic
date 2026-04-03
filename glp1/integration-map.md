# GLP-1 System Integration Map
**Purpose:** Single reference for how all 6 GLP-1 systems connect to existing Rani infrastructure.

---

## 1. Airtable Schema Extensions

### Existing Table: `Clients` — New Fields
| Field Name | Type | Source System | Purpose |
|-----------|------|---------------|---------|
| BMI (Calculated) | Number | Intake Layer | Eligibility + progress tracking |
| Lifestyle Score | Number (0-10) | Intake Layer | Compliance prediction |
| Emotional Eating Score | Single select | Intake Layer | Risk assessment |
| Motivation Score | Number (5-15) | Intake Layer | Conversion likelihood |
| Compliance Likelihood Score | Number (0-100) | Intake Layer | Master patient scoring |
| CLS Tier | Single select | Intake Layer | PLATINUM/GOLD/SILVER/BRONZE |
| GLP1 Risk Flags | Long text | Intake Layer | Safety flags |
| Recommended Medication | Single select | Intake Layer | Semaglutide/Tirzepatide |
| Recommended Tier | Single select | Intake Layer | Essential/Premium/VIP Transform |
| GLP1 Phase | Single select | Treatment Engine | INITIATION/ACTIVE-LOSS/MAINTENANCE |
| Current Dose | Single select | Treatment Engine | SEMA-D1 to D4, TIRZ-D1 to D4 |
| Total Weight Lost | Number | Weekly Check-In | Cumulative lbs lost |
| Monthly Avg Loss | Number | Weekly Check-In | Avg lbs/mo |
| On Track Status | Single select | Treatment Engine | YES/BEHIND/AHEAD |
| Active Risk Flags | Long text | Treatment Engine | Current flags |
| Phase Start Date | Date | Treatment Engine | When current phase began |
| Projected Goal Date | Date | Treatment Engine | Estimated goal date |
| GLP1 Tier | Single select | Subscriptions | ESSENTIAL/PREMIUM/VIP-TRANSFORM |
| Subscription Start Date | Date | Subscriptions | When subscription began |
| Billing Cycle Date | Number | Subscriptions | Day of month for billing |
| Subscription Status | Single select | Subscriptions | ACTIVE/PAUSED/CANCELLED/PAYMENT-HOLD |
| Churn Risk Score | Number (0-100) | Subscriptions | Churn prediction |
| Months Subscribed | Number | Subscriptions | Tenure tracking |
| Lifetime Revenue | Currency | Subscriptions | Total revenue from patient |
| Last Check-In Date | Date | Weekly Check-In | Most recent check-in |
| Last Weight | Number | Weekly Check-In | Most recent weight |
| Weekly Adherence Score | Number (0-100) | Weekly Check-In | Current week score |
| Rolling Adherence (4wk) | Number (0-100) | Weekly Check-In | 4-week average |
| Adherence Classification | Single select | Weekly Check-In | EXCELLENT/GOOD/NEEDS-IMPROVEMENT/AT-RISK |
| Alert Level | Single select | Weekly Check-In | NONE/INFORMATION/ATTENTION/ACTION/URGENT |
| Plateau Status | Single select | Reactivation | NONE/DETECTED/INTERVENING/RESOLVED |
| Dropout Risk Score | Number (0-100) | Reactivation | Dropout prediction |
| Maintenance Ready | Checkbox | Reactivation | Meets transition criteria |
| Win-Back Stage | Single select | Reactivation | NONE/WARM/COOLING/COLD/ICE/RECOVERED |
| Contraindication Screen | Single select | Compliance | CLEARED/HARD-STOP/SOFT-FLAG/MD-REVIEW-PENDING |
| GFE Status | Single select | Compliance | CURRENT/EXPIRED/PENDING |
| GFE Expiry Date | Date | Compliance | GFE + 12 months |
| Next Lab Due | Date | Compliance | Last lab + 90 days |
| Quarterly Labs Status | Single select | Compliance | CURRENT/DUE/OVERDUE |
| Compliance Hold | Checkbox | Compliance | If true, no medication ships |

### New Table: `GLP1 Check-Ins`
| Field | Type | Purpose |
|-------|------|---------|
| Client (linked) | Link to Clients | Patient reference |
| Check-In Date | Date | When submitted |
| Weight | Number | Reported weight |
| Feeling Score | Number (1-10) | Self-reported wellbeing |
| Side Effects | Multi-select | Reported symptoms |
| Injection Taken | Checkbox | Compliance |
| Notes | Long text | Free-text |
| Adherence Score | Number (0-100) | Calculated |
| Weight Change | Number | Weekly delta |
| Alert Level | Single select | Calculated alert |

### New Table: `GLP1 Compliance Log`
| Field | Type | Purpose |
|-------|------|---------|
| Date | Date | Event date |
| Patient (linked) | Link to Clients | Patient reference |
| Event Type | Single select | HARD-STOP/SOFT-FLAG/SAFETY-ALERT/EMERGENCY/MD-REVIEW/LAB-ALERT/DOSE-CHANGE |
| Details | Long text | Description |
| Action Taken | Long text | What was done |
| Resolved | Checkbox | Resolution status |
| Resolution Date | Date | When resolved |
| Reviewed By | Single select | Rina/MD/System |

---

## 2. Dashboard Extensions

### New Widgets (CEO Dashboard)
| Widget | Data Source | Refresh |
|--------|-----------|---------|
| GLP-1 Program Overview | Clients table (GLP1 filters) | 60s |
| Subscription MRR | Clients.GLP1_Tier + Clients.Subscription_Status | 60s |
| Check-In Compliance | GLP1 Check-Ins table | 30s |
| Adherence Heatmap | Clients.Rolling_Adherence | 120s |
| Plateau/Dropout Alerts | Clients.Plateau_Status + Dropout_Risk | 60s |
| Upsell Pipeline | Reactivation engine output | 300s |
| Compliance Dashboard | GLP1 Compliance Log | 120s |

### Client 360° Profile Extensions
- GLP-1 Assessment section (BMI, scores, tier)
- Weight trend chart (line graph from check-in data)
- Treatment phase indicator (Phase 1/2/3 with progress bar)
- Adherence score (gauge chart)
- Active risk flags (color-coded badges)
- Compliance status (GFE, labs, safety flags)
- Upsell opportunities (next recommended add-on)

### New Dashboard Pages
| Page | URL | Purpose |
|------|-----|---------|
| GLP-1 Command Center | `/dashboard/glp1` | All-in-one GLP-1 program management |
| GLP-1 Check-Ins | `/dashboard/glp1/checkins` | Weekly check-in processing queue |
| GLP-1 Compliance | `/dashboard/glp1/compliance` | Audit trail + compliance status |

---

## 3. New API Routes

| Route | Method | Purpose | Source System |
|-------|--------|---------|---------------|
| `/api/dashboard/glp1/overview` | GET | Program stats (active, MRR, churn, phases) | All GLP-1 systems |
| `/api/dashboard/glp1/checkins` | GET | This week's check-ins (received + pending) | Weekly Check-In |
| `/api/dashboard/glp1/checkins/[id]` | POST | Process a check-in response | Weekly Check-In |
| `/api/dashboard/glp1/scoring/[id]` | GET | Full intake scoring for a patient | Intake Layer |
| `/api/dashboard/glp1/treatment/[id]` | GET | Treatment plan + progress for a patient | Treatment Engine |
| `/api/dashboard/glp1/subscription/[id]` | GET/PATCH | Subscription management (view, pause, resume, change tier) | Subscriptions |
| `/api/dashboard/glp1/optimization` | GET | Weekly optimization report (plateaus, dropouts, upsells) | Reactivation |
| `/api/dashboard/glp1/compliance` | GET | Compliance dashboard (audit status, flags, overdue items) | Compliance |
| `/api/dashboard/glp1/compliance/audit` | POST | Run monthly compliance audit | Compliance |

---

## 4. New n8n Workflows

| ID | Name | Schedule | Purpose | Source System |
|----|------|----------|---------|---------------|
| NEW | WF-GLP1-CHECKIN-SEND | Tuesday 9 AM | Send weekly check-in questions | Weekly Check-In |
| NEW | WF-GLP1-CHECKIN-PROCESS | Every 5 min | Parse check-in responses, calculate scores | Weekly Check-In |
| NEW | WF-GLP1-CHECKIN-REMIND | Daily 10 AM | Day 3 + Day 7 reminders for non-responders | Weekly Check-In |
| NEW | WF-GLP1-MILESTONE | Daily 6 AM | Detect + celebrate weight milestones | Weekly Check-In |
| NEW | WF-GLP1-BILLING-NOTIFY | Daily 9 AM | Day 25 pre-billing notifications | Subscriptions |
| NEW | WF-GLP1-PAYMENT-RETRY | Daily 10 AM | Payment retry sequence (D31, D33, D36) | Subscriptions |
| NEW | WF-GLP1-PAUSE-RESUME | Daily 9 AM | Auto-resume paused subscriptions | Subscriptions |
| NEW | WF-GLP1-PLATEAU | Monday 8 AM | Scan for plateau patients, trigger protocol | Reactivation |
| NEW | WF-GLP1-DROPOUT | Daily 8 AM | Scan for dropout risk, trigger interventions | Reactivation |
| NEW | WF-GLP1-UPSELL | Monday 9 AM | Scan for upsell opportunities, generate texts | Reactivation |
| NEW | WF-GLP1-MAINTENANCE | Monday 10 AM | Scan for maintenance transition candidates | Reactivation |
| NEW | WF-GLP1-WINBACK | Daily 9 AM | Process win-back sequences for inactive patients | Reactivation |
| NEW | WF-GLP1-OPT-REPORT | Monday 7 AM | Auto-generate optimization report | Reactivation |
| NEW | WF-GLP1-COMPLIANCE-SCAN | Daily 7 AM | Scan for expired GFEs, overdue labs, flags | Compliance |
| NEW | WF-GLP1-LAB-REMINDER | Daily 8 AM | Auto-send lab reminders (quarterly approach) | Compliance |
| NEW | WF-GLP1-GFE-RENEWAL | Daily 8 AM | Alert when GFE approaching expiry | Compliance |
| NEW | WF-GLP1-COMPLIANCE-RPT | 1st of month 7 AM | Monthly compliance audit auto-generation | Compliance |

**Total new workflows: 17**
**Updated existing total: 19 + 17 = 36 workflows**

---

## 5. Existing System Updates

### Churn Engine (`/src/lib/churn/engine.ts`)
Add new factors:
- `complianceLikelihoodScore` (from intake, weight 10%)
- `adherenceScore` (from weekly check-in, weight 15%)
- `plateauStatus` (from reactivation, weight 10%)
- `subscriptionTenure` (from subscriptions, weight 5%)

### Recommendation Engine (`/src/lib/recommendations/engine.ts`)
Add GLP-1 specific recommendations:
- Phase-aware upsell timing (don't upsell during Phase 1)
- Plateau-triggered interventions
- Maintenance transition services
- Tier upgrade suggestions

### Revenue Anomaly Detection (`/src/lib/predictions/revenue-anomaly.ts`)
Add GLP-1 cohort monitoring:
- Alert if GLP-1 MRR drops > 10% month-over-month
- Track GLP-1 as separate revenue stream
- Flag unusual churn spikes in GLP-1 patients

### Social Media Engine (`/src/lib/social/auto-post-engine.ts`)
Add GLP-1 content categories:
- Weight loss education (compliance-safe)
- Patient success stories (with consent + disclaimers)
- GLP-1 FAQ content
- "Medically supervised" messaging

### Consult Co-Pilot (`/src/lib/consult/copilot-engine.ts`)
Add GLP-1 consultation scripts:
- New GLP-1 patient consultation flow
- Tier recommendation based on intake scores
- Objection handling for GLP-1 pricing
- Semaglutide vs. tirzepatide talking points

---

## 6. File Structure (Complete)

```
/glp1/
  intake-layer.md               - Intake scoring system (BMI, lifestyle, motivation, CLS)
  treatment-engine.md           - 3-phase treatment model + progress modeling
  subscriptions.md              - Membership tiers, billing, pause/resume, churn
  weekly-checkin.md             - Check-in automation, adherence scoring, alerts
  reactivation-engine.md        - Plateau/dropout detection, upsells, maintenance
  compliance-layer.md           - Safety checks, MD triggers, documentation
  compliance-log.md             - Master audit trail
  integration-map.md            - This file
  monthly-audit/
    YYYY-MM_audit.md            - Monthly compliance audit reports

/templates/
  glp1-checkin-weekly.md        - Weekly check-in + milestone templates
  glp1-membership-tiers.md      - Tier presentation + billing templates
  glp1-plateau-protocol.md      - Plateau, dropout, maintenance templates
  (existing templates unchanged)
```

---

## 7. New Operations Commands

| Command | Purpose | Systems Used |
|---------|---------|-------------|
| `/glp1-intake [data]` | Enhanced GLP-1 intake with full scoring | Intake Layer + Compliance |
| `/glp1-plan [name]` | View/update treatment plan for a patient | Treatment Engine |
| `/glp1-checkin [name]` | Process a weekly check-in response | Weekly Check-In |
| `/glp1-optimize` | Weekly optimization report | Reactivation Engine |
| `/glp1-compliance` | Monthly compliance audit | Compliance Layer |
| `/glp1-subscriptions` | Subscription dashboard (tiers, billing, churn) | Subscriptions |
| `/glp1-upsell [name]` | Check upsell opportunities for a patient | Reactivation Engine |
| `/glp1-plateau [name]` | Run plateau protocol for a patient | Reactivation Engine |
| `/glp1-dashboard` | Full GLP-1 program overview | All systems |
