# THE RANI SYSTEM
### Your Clinic's AI Operating System — The Full Integration Playbook

---

> *"You built a medspa. We built the brain behind it."*
> — ranibeautyclinic.com

---

## WHAT THIS IS

Rani isn't just a website. It's a full-stack AI operating system that runs your entire clinic — from the moment someone finds you on Instagram to 90 days after their last appointment. Every lead, every consultation, every follow-up, every review response — automated, intelligent, branded.

This guide walks you through **every touchpoint** where the system activates, **who does what**, and **how to turn it on**.

---

## THE SYSTEM AT A GLANCE

```
DISCOVER → BOOK → INTAKE → CONSULT → TREAT → FOLLOW-UP → RETAIN → REACTIVATE
   |          |       |        |         |         |           |          |
 Website    Mango-  Typeform  AI Co-   Provider  5-Step     Member-   90-Day
 + Meta     mint    → n8n     Pilot    Notes     Sequence   ships     Campaigns
 + Vapi     Widget  → AI      Dash     → AI      → n8n      → n8n     → n8n
```

**12 AI Engines. 19 Automations. 239 API Routes. 1 Dashboard.**

---

## PHASE 1: DISCOVERY & FIRST TOUCH

### How People Find You

| Channel | System Component | What Happens |
|---------|-----------------|--------------|
| Google Search | SEO + 85 legacy redirects | Website ranks, pages optimized, schema markup live |
| Instagram/TikTok | Social AI Engine | Auto-generates weekly content calendar with themes |
| Meta Ads | Meta Ads AI Manager | Auto-optimizes budgets, generates ad copy variants, detects creative fatigue |
| Google Business | Review Commander (WF13) | AI drafts responses to every review within 24 hours |
| Phone Call | Vapi AI Receptionist | AI answers, books appointments, handles FAQs, escalates when needed |
| Website Chat | AI Concierge (`/api/ai/chat`) | Claude-powered chatbot captures leads + books consults |

### What to Do

- **Instagram**: Open Dashboard → Social AI page → copy this week's content calendar → post it (or schedule via Later/Planoly)
- **Meta Ads**: Dashboard → Meta Ads AI → review optimization recommendations → apply budget changes in Ads Manager
- **Google Reviews**: Dashboard → Reviews → review AI draft responses → approve/edit → post on Google
- **Phone**: Vapi handles calls automatically. Check Dashboard → Phone Agent for call analytics + missed escalations

### Your Move
> Set up Meta Ads Manager access, connect Vapi phone number, claim Google Business Profile if not done. The system handles the rest.

---

## PHASE 2: BOOKING

### The Flow

```
Client clicks "Book Now" → Mangomint widget opens → selects service + time → confirms
                                    ↓
                        Mangomint fires webhook → WF3 (Booking Sync)
                                    ↓
                        Airtable: Appointment created
                        n8n: Pre-consult sequence starts (WF4)
                        Dashboard: Shows on today's schedule
```

### Where Booking Lives

| Surface | URL/Location | CTA |
|---------|-------------|-----|
| Homepage Hero | ranibeautyclinic.com | "Schedule a Consultation" |
| Navbar (desktop + mobile) | Every page | "Book Now" button |
| Pricing Page | /pricing | Each service card + membership tiers |
| Contact Page | /contact | "Book Instantly Online" card above form |
| Results Page | /results | Mid-page + bottom CTA |
| Service Pages | /services/* | Inline BookingCTA component |

**All CTAs fire analytics**: GA4 event + Meta Pixel Lead event + tracking for attribution.

### What to Do

- **Morning**: Open Dashboard → Schedule tab. See today's appointments, no-show risk scores, and gap opportunities
- **Gaps?**: Dashboard → Schedule Optimizer shows revenue potential of each gap + suggests services to fill it
- **Double-bookings?**: Optimizer auto-detects conflicts and suggests resolutions

### Your Move
> Mangomint webhook is configured. Make sure `MANGOMINT_WEBHOOK_SECRET` is set in Vercel env vars to enable signature verification.

---

## PHASE 3: INTAKE & LEAD CAPTURE

### Three Entry Points

| Entry | What Triggers | Where It Goes |
|-------|--------------|---------------|
| Contact Form | Client fills out /contact form | → `/api/contact` → Airtable Client Intakes + Resend email to you + n8n WF2 |
| Typeform Intake | Deep intake questionnaire | → n8n "Intake to CRM" workflow → Airtable Client Intakes |
| Phone Call | Vapi captures lead info | → n8n WF2 (Immediate Lead Response) |

### The AI Intake Pipeline

```
New intake lands in Airtable (Processing Status: "New")
        ↓
WF1 polls every 60 seconds → finds new intakes
        ↓
Claude AI analyzes: risk flags, treatment recommendations, estimated value
        ↓
Writes back to Airtable:
  - Intake Summary (AI)
  - Program Plan (AI)
  - Cost Breakdown (AI)
  - Timeline (AI)
  - Suggested Next Step (AI)
  - Treatment Value (AI)
        ↓
Processing Status → "Processed"
        ↓
WF2 sends immediate personalized response (email/SMS)
```

### What to Do

- **Check leads**: Dashboard → Leads tab shows funnel stages (New → Contacted → Consult Booked → Converted)
- **Lead quality**: Each lead has AI-generated intake intelligence — risk flags, estimated value, recommended approach
- **Response time matters**: WF2 auto-responds within 60 seconds. But personal follow-up within 24 hours converts at 3x the rate

### Your Move
> Typeform intake (Ecgz85JA) should be linked in booking confirmation emails. Contact form is live at /contact. Both feed the same AI pipeline.

---

## PHASE 4: PRE-CONSULT PREPARATION

### What the System Does Automatically

```
Consult booked → WF4 fires at 6 AM daily
        ↓
Sends 3-message sequence:
  1. Booking confirmation (immediate)
  2. 24-hour reminder + what to expect
  3. 2-hour reminder + directions + parking
        ↓
Service-specific prep instructions:
  - Laser: "Avoid sun 2 weeks prior, shave area"
  - Injectable: "No blood thinners 72 hours"
  - Facial: "Arrive with clean skin"
```

### AI Consult Co-Pilot (Dashboard)

Before each consult, the provider opens Dashboard → Consult Co-Pilot:

| Section | What You See |
|---------|-------------|
| Client Briefing | Name, visit history, segment (VIP/new/at-risk), spending pattern |
| Treatment Plan | AI-recommended treatments based on their intake + concerns |
| Talking Points | Organized by timing: opening → during → closing |
| Objection Handlers | 6 pre-built scripts (price, fear, timing, competition, skepticism, "need to think") |
| Cross-Sell | Related services with conversion likelihood scores |
| Closing Strategy | 5 approaches + financing pitch + membership pitch |

### What to Do

- **Before each consult**: Pull up the co-pilot page. 2-minute read that turns a $500 consult into a $2,000 treatment plan
- **During consult**: Use the talking points and objection handlers as your cheat sheet
- **After consult**: Log outcome in Dashboard → Data Entry → Consult Notes

### Your Move
> The co-pilot is most powerful when Airtable has visit history. The more data in the system, the smarter the recommendations.

---

## PHASE 5: TREATMENT DAY

### Provider Workflow

| Moment | System Action | Staff Action |
|--------|--------------|-------------|
| Client arrives | Dashboard shows today's schedule | Check them in on Mangomint |
| Pre-treatment | AI briefing available in Consult Co-Pilot | Review notes + plan |
| During treatment | — | Deliver the service |
| Post-treatment | WF17 triggers (post-treatment webhook) | Log notes in Dashboard |
| Checkout | Square POS processes payment | Ring them up |
| Post-checkout | Transaction syncs to Airtable | — |

### After the Appointment

```
Mangomint appointment.completed → webhook fires
        ↓
WF17 (Post-Treatment) activates
        ↓
5-Step Follow-Up Sequence:
  Step 1: Immediate thank you + aftercare (0 min)
  Step 2: Check-in (24 hours)
  Step 3: Recovery check (72 hours)
  Step 4: Results + rebook nudge (7 days)
  Step 5: Before/after photo request + review ask (30 days)
```

### What to Do

- **End of day**: Dashboard → Data Entry → EOD Recap (revenue, notable moments, issues)
- **Room issues?**: Dashboard → Data Entry → Room Issue (auto-creates an alert)
- **Inventory low?**: Dashboard → Inventory Intelligence shows reorder alerts + par levels

### Your Move
> Log consult outcomes. The system uses this data to improve AI recommendations and measure close rates.

---

## PHASE 6: REVIEWS & REPUTATION

### The Review Machine

```
30 days post-treatment → WF13 (Review Commander) fires
        ↓
Sends review request email/SMS with direct Google link
        ↓
New Google review detected → AI drafts response
        ↓
Dashboard → Reviews: review + approve + post
```

### Review Analytics

| Metric | Current | Target |
|--------|---------|--------|
| Average Rating | 4.9 | 4.8+ |
| Review Count | 127 | 1/day |
| Response Rate | AI-drafted | 100% within 24h |

### Your Move
> Review WF13 responses daily. Most are ready to post as-is. Edit tone if needed — the AI matches your brand voice but you know your clients best.

---

## PHASE 7: RETENTION & MEMBERSHIP

### Membership Tiers

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| HALO | $199/mo | Express Facial + Small LHR area + 10% off | New clients |
| GLOW | $349/mo | Signature Hydrafacial + Body LHR + 15% off | Regulars |
| ELITE AURA | $549/mo | Everything + 2 LHR areas + Quarterly Advanced + 20% off | High-spenders |

### Rani Rewards Loyalty

| Level | Requirement | Reward |
|-------|-------------|--------|
| Birthday | Annual | 500 pts (free Express Hydrafacial) |
| Silver | 1,000 pts ($1K) | $50 credit |
| Gold | 2,500 pts ($2.5K) | $150 credit |
| Platinum | 5,000 pts ($5K) | $400 credit + free treatment |
| Referral | Each referral | $50 credit both parties |

### Churn Prevention

```
Dashboard → Clients → At-Risk tab
        ↓
AI scores every client 0-100 on churn risk
  Factors: recency (40%), frequency (20%), monetary (15%), membership (15%), engagement (10%)
        ↓
High-risk clients flagged → personal outreach recommended
        ↓
WF7 (Membership Engine) tracks membership health daily
```

### Your Move
> Check the At-Risk clients list weekly. A 5-minute call to a lapsing $5K client is worth more than a full day of Instagram posts.

---

## PHASE 8: REACTIVATION

### When They Ghost

```
Client hasn't visited in 30+ days
        ↓
WF14 (Client Status Keeper) updates status nightly:
  30 days → Lapsed 30
  60 days → Lapsed 60
  90 days → Lapsed 90
        ↓
WF8 (Reactivation Campaigns) fires every Monday:
  Lapsed 30: Gentle nudge — "We miss you" + what's new
  Lapsed 60: Urgency — seasonal treatment + limited offer
  Lapsed 90: Last resort — "Your results may fade" + strong CTA
```

### Financing Integration

For high-value reactivation (RF Micro, Sofwave, GLP-1):

| Provider | Apply URL | Use Case |
|----------|----------|----------|
| PatientFi | app.patientfi.com/v2/rani-beauty-clinic/apply | Treatments $500+ |
| Cherry | patient.withcherry.com/apply/rani-beauty-clinic | Treatments $500+ |

Financing callouts on pricing page: RF Micro from ~$167/mo, Sofwave from ~$230/mo.

### Your Move
> Reactivation is automated. Your job: when someone responds, be ready to book them same-week. Speed wins.

---

## THE DASHBOARD — YOUR COMMAND CENTER

### Access: `ranibeautyclinic.com/dashboard`

| Role | Sees | Access Level |
|------|------|-------------|
| CEO (Rina) | Everything — revenue, P&L, strategy, all data | Full admin |
| Provider (Mom) | Schedule, client profiles, consult co-pilot, inventory | Treatment-focused |
| Front Desk | Schedule, check-in, lead entry, phone agent stats | Client-facing ops |
| Marketing | Social AI, Meta Ads, content calendar, reviews | Growth |
| Operations | Inventory, P&L, schedule optimizer, alerts | Back-office |

### Gamification Score (0-100)

The dashboard calculates a daily clinic score based on:

| Factor | Weight | Target |
|--------|--------|--------|
| Revenue | 30% | $4,000/day |
| Utilization | 15% | 80% booked |
| Consult Conversion | 15% | 60% close rate |
| Rebooks | 10% | 70% rebook rate |
| Reviews | 10% | 1 per day |
| Follow-Ups | 10% | All sent on time |
| Operations | 10% | No unresolved alerts |

**Boss Levels**: Bronze ($30K/mo) → Silver ($50K) → Gold ($75K) → Platinum ($100K) → Diamond ($150K+)

---

## INTELLIGENCE PAGES

| Page | What It Does | When to Use |
|------|-------------|-------------|
| **KPI Dashboard** | Revenue, bookings, leads, show rate, avg ticket with YoY comparison | Every morning |
| **Revenue Trends** | 30-day chart + anomaly detection (5 methods) | Weekly review |
| **P&L Intelligence** | Service profitability, expense breakdown, cash flow projection | Monthly planning |
| **Schedule Optimizer** | Gaps, conflicts, provider balance, revenue opportunities | Daily scheduling |
| **Pricing AI** | Dynamic pricing recommendations, demand analysis, competitor reactions | Quarterly strategy |
| **Inventory Intel** | Reorder alerts, waste analysis, par levels, supplier comparison | As-needed |
| **Social AI** | Weekly content calendar, hashtag strategy, posting times | Weekly content prep |
| **Meta Ads AI** | Campaign grading, budget optimization, ad copy variants, creative fatigue | Campaign review |
| **Consult Co-Pilot** | Client briefing, treatment plan, objection handlers, closing strategy | Before every consult |
| **Knowledge Base** | 12 treatment docs, semantic search, knowledge gap detection | Training + AI context |
| **Phone Agent** | Call analytics, intents, peak times, booking conversion | Weekly ops review |
| **Client 360** | Full client history, LTV, churn risk, treatment recs | Before appointments |

---

## THE n8n AUTOMATION MAP

### Always Running (Every 1-5 Min)
| # | Workflow | What It Does |
|---|---------|--------------|
| WF1 | Intake Intelligence Engine | AI processes every new intake within 60 seconds |
| WF1b | Aura Scan Processor | Processes skin scan submissions |
| WF2 | Immediate Lead Response | Auto-responds to new leads (email + SMS) |
| WF5 | Consult Outcome Tracking | Tracks if consultations convert to bookings |

### Daily Automations
| # | Workflow | When | What It Does |
|---|---------|------|--------------|
| WF4 | Pre-Consult Prep | 6 AM | Sends prep sequences for today's consults |
| WF7 | Membership Engine | 9 AM | Tracks membership health, flags churn risk |
| WF9 | KPI Aggregation | 6 AM | Snapshots daily metrics to Airtable |
| W12 | Alert Engine | 11 PM | Checks all thresholds, creates alerts |
| W13 | Review Commander | 9 AM | Monitors Google reviews, drafts AI responses |
| W14 | Client Status Keeper | Midnight | Updates lapsed/churned statuses |

### Weekly
| # | Workflow | When | What It Does |
|---|---------|------|--------------|
| WF8 | Reactivation Campaigns | Mon 10 AM | Sends tier-appropriate win-back messages |
| WF10 | Provider Performance | Mon 7 AM | Revenue + efficiency reports per provider |

### Webhook-Triggered
| # | Workflow | Trigger | What It Does |
|---|---------|---------|--------------|
| WF3 | Booking Sync | Mangomint appointment.created | Syncs booking to Airtable |
| WF6 | Financing | Cherry/Stripe event | Tracks financing applications |
| W16 | Post-Consult Close | Consult outcome logged | Follows up if client didn't book |
| W17 | Post-Treatment | Mangomint appointment.completed | Starts 5-step follow-up sequence |

---

## GO-LIVE CHECKLIST

### Critical (Must-Do Before Launch)

- [ ] **Set `MANGOMINT_WEBHOOK_SECRET`** in Vercel → Settings → Environment Variables. Get from Mangomint dashboard → Webhooks
- [ ] **Set `PATIENT_JWT_SECRET`** — run `openssl rand -hex 32` and add to Vercel env
- [ ] **Set `NEXT_PUBLIC_BASE_URL`** to `https://www.ranibeautyclinic.com`
- [ ] **Set `CHERRY_WEBHOOK_SECRET`** from Cherry dashboard
- [ ] **Test contact form** — submit a test at /contact, confirm email arrives + Airtable row created
- [ ] **Test Mangomint webhook** — book a test appointment, confirm it appears in Dashboard schedule
- [ ] **Login to Dashboard** — verify all KPI cards load at /dashboard

### High Priority (First Week)

- [ ] Connect Plaid to production bank account (currently sandbox)
- [ ] Upload before/after photos to /results page
- [ ] Review all 19 n8n workflows — confirm webhook URLs match production
- [ ] Set up Sentry error tracking (optional but recommended)
- [ ] Train front desk on Dashboard data entry forms

### Ongoing

- [ ] Daily: Check Dashboard score, review AI-drafted review responses
- [ ] Weekly: Check At-Risk clients, review Meta Ads AI recommendations, prep social content
- [ ] Monthly: Review P&L Intelligence, adjust pricing strategy, audit reactivation performance
- [ ] Quarterly: Review churn trends, membership tier performance, competitor intelligence

---

## THE NUMBERS

| Metric | What the System Targets |
|--------|------------------------|
| Daily Revenue | $4,000 |
| Monthly Revenue | $100,000+ |
| Consult Close Rate | 60% |
| Show Rate | 85% |
| Rebook Rate | 70% |
| Utilization | 80% |
| Reviews/Day | 1 |
| Lead Response Time | <60 seconds (automated) |
| Reactivation Reach | Every lapsed client at 30/60/90 days |

---

## QUICK REFERENCE

| Need To... | Go To... |
|------------|----------|
| See today's revenue | Dashboard → KPIs |
| Check tomorrow's schedule | Dashboard → Schedule → Upcoming |
| Prep for a consult | Dashboard → Consult Co-Pilot |
| Find a lapsing client | Dashboard → Clients → At-Risk |
| Draft social content | Dashboard → Social AI |
| Check ad performance | Dashboard → Meta Ads AI |
| Order more product | Dashboard → Inventory Intel |
| Log a sale | Dashboard → Data Entry → Sale |
| See the P&L | Dashboard → Finance → P&L |
| Check Mangomint sync | Dashboard → Integrations |

---

## ENV VARS — FULL REFERENCE

| Variable | Status | Purpose |
|----------|--------|---------|
| `AIRTABLE_PAT` | Set | Database access |
| `AIRTABLE_BASE_ID` | Set | Database ID |
| `DASHBOARD_JWT_SECRET` | Set | Dashboard auth |
| `ANTHROPIC_API_KEY` | Set | AI (Claude) |
| `RESEND_API_KEY` | Set | Transactional email |
| `N8N_WEBHOOK_URL` | Set | Automation webhooks |
| `N8N_API_KEY` | Set | n8n API access |
| `STRIPE_SECRET_KEY` | Set | Payments |
| `STRIPE_WEBHOOK_SECRET` | Set | Payment webhooks |
| `META_ACCESS_TOKEN` | Set | Meta Ads API |
| `META_AD_ACCOUNT_ID` | Set | Meta Ads |
| `VAPI_API_KEY` | Set | AI phone agent |
| `VAPI_ASSISTANT_ID` | Set | AI phone agent |
| `PINECONE_API_KEY` | Set | Knowledge base |
| `TWILIO_*` (4 vars) | Set | SMS |
| `SQUARE_ACCESS_TOKEN` | Set | POS |
| `JOTFORM_API_KEY` | Set | Intake forms |
| `CRON_SECRET` | Set | Scheduled tasks |
| `MANGOMINT_WEBHOOK_SECRET` | **MISSING** | Booking webhooks |
| `PATIENT_JWT_SECRET` | **MISSING** | Patient portal auth |
| `CHERRY_WEBHOOK_SECRET` | **MISSING** | Financing webhooks |
| `NEXT_PUBLIC_BASE_URL` | **MISSING** | URL redirects |

---

*Built by Sukhi. Powered by Claude. Designed for Rani.*

*System Version: March 2026 — 12 AI Engines, 19 Automations, 239 API Routes*
