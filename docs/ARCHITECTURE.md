# Rani Beauty Clinic -- System Architecture

> Complete technical reference for the Rani Beauty Clinic platform: data flows, integrations, API routes, AI engines, and component structure.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Integration Map](#integration-map)
4. [Tech Stack Summary](#tech-stack-summary)
5. [Airtable Schema](#airtable-schema)
6. [API Route Reference](#api-route-reference)
7. [AI Engine Reference](#ai-engine-reference)
8. [Component Tree Overview](#component-tree-overview)
9. [Authentication and Authorization](#authentication-and-authorization)
10. [Caching Strategy](#caching-strategy)
11. [Gamification System](#gamification-system)

---

## System Overview

Rani Beauty Clinic is a Next.js 14 application serving two audiences:

1. **Public website** (`ranibeautyclinic.com`) -- patient-facing marketing pages, consultation booking, AI chat widget, skin quiz, and photo simulation tools.
2. **Operations dashboard** (`ranibeautyclinic.com/dashboard`) -- internal staff dashboard with RBAC, gamification, 13 intelligence engines, and 25+ real-time data hooks.

The system integrates with 8 external services, runs 19 automated n8n workflows, and uses 13 AI-powered intelligence engines for predictions, recommendations, and content generation.

---

## Data Flow Diagram

```
+-------------------+     +------------------+     +-------------------+
|                   |     |                  |     |                   |
|   PUBLIC WEBSITE  |     |    DASHBOARD     |     |   n8n WORKFLOWS   |
|   (Next.js SSR)   |     |   (React SPA)    |     |   (19 workflows)  |
|                   |     |                  |     |                   |
+--------+----------+     +--------+---------+     +--------+----------+
         |                         |                         |
         |  POST /api/contact      |  GET /api/dashboard/*   |  HTTP webhooks
         |  POST /api/ai/chat      |  POST /api/dashboard/*  |  Airtable API
         |  POST /api/consultation  |                         |  Resend API
         |  POST /api/checkout     |                         |  Twilio API
         |                         |                         |
         v                         v                         v
+--------+-------------------------+-------------------------+----------+
|                                                                       |
|                        NEXT.JS API LAYER                              |
|                     (67+ API route handlers)                          |
|                                                                       |
|   +------------------+  +------------------+  +--------------------+  |
|   | Auth Middleware   |  | Rate Limiter     |  | Cache Layer        |  |
|   | (JWT / jose)     |  | (4.7 req/sec)    |  | (TTL 30s-10min)    |  |
|   +------------------+  +------------------+  +--------------------+  |
|                                                                       |
+---+-----------+-----------+-----------+-----------+-----------+-------+
    |           |           |           |           |           |
    v           v           v           v           v           v
+-------+  +--------+  +--------+  +--------+  +-------+  +--------+
|       |  |        |  |        |  |        |  |       |  |        |
|Airtable| |Anthropic| |Mangomint| | Square | |Pinecone| | Resend |
|  (DB)  | | Claude  | |(Booking)| | (POS)  | |(Vector)| |(Email) |
|12 tables| | (AI)   | | 2181   | |        | | RAG DB | |        |
|       |  |        |  |clients |  |        |  |       |  |        |
+-------+  +--------+  +--------+  +--------+  +-------+  +--------+
                                        |
                                   +--------+
                                   |        |
                                   | Plaid  |
                                   | (Bank) |
                                   +--------+

    +-------+    +--------+    +--------+
    |       |    |        |    |        |
    | Vapi  |    | Twilio |    |  Meta  |
    |(Phone)|    | (SMS)  |    | (Ads)  |
    |       |    | via n8n|    |        |
    +-------+    +--------+    +--------+
```

### Request Flow

```
Browser --> Vercel Edge --> Next.js Route Handler
                              |
                              +--> JWT Auth Check (dashboard routes)
                              |
                              +--> Rate Limiter (Airtable: 4.7 req/sec)
                              |
                              +--> Cache Check (TTL-based in-memory)
                              |
                              +--> Airtable API / AI Engine / External Service
                              |
                              +--> Response (JSON) --> SWR Client Cache
```

---

## Integration Map

```
                    +---------------------------+
                    |      NEXT.JS 14 APP       |
                    |   (Vercel, App Router)     |
                    +---------------------------+
                     /    |    |    |    |    \
                    /     |    |    |    |     \
                   v      v    v    v    v      v
              Airtable  n8n  Mango- Square Stripe  Claude
              (12 tbl)  (19   mint  (POS)  (not    (AI)
                        wf)  (book)        live)
                         |      |
                    +----+----+ |
                    |         | |
                   Resend  Twilio
                  (email)  (SMS)
                    |
                  SendGrid
                 (marketing
                  via n8n)

External Triggers:
  Mangomint  --webhook-->  n8n WF3  (appointment.created)
  Mangomint  --webhook-->  n8n W17  (appointment.completed)
  Typeform   --webhook-->  n8n Intake to CRM
  Cherry/Stripe --webhook--> n8n WF6 (financing)
```

### Integration Details

| Integration | Protocol | Auth | Rate Limit | Purpose |
|-------------|----------|------|-----------|---------|
| Airtable | REST API | PAT (Bearer token) | 5 req/sec (throttled to 4.7) | Primary database -- 12 tables |
| Anthropic Claude | REST API | API Key | Per-account limits | AI chat, recommendations, intake analysis, consult copilot |
| Mangomint | Webhooks + REST | Company ID + API Key | Standard | Appointment booking, client sync, service catalog |
| Square | REST API | OAuth | Standard | POS transactions, payment data |
| Stripe | REST API | Secret Key | Standard | Payment processing (not yet connected) |
| Plaid | REST API | Client ID + Secret | Standard | Bank account connection, transaction reconciliation |
| Resend | REST API | API Key | 100/day free tier | Transactional emails (contact form, notifications) |
| Twilio | REST API (via n8n) | Account SID + Auth Token | Standard | SMS communications |
| Pinecone | REST API | API Key | Standard | Vector database for RAG knowledge base |
| Vapi | REST API | API Key | Standard | AI phone receptionist |
| Meta Ads | REST API | Access Token | Standard | Ad campaign management, performance data |
| n8n | HTTP webhooks | Webhook URLs | Self-hosted limits | 19 automation workflows |

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2 |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 18+ |
| UI Library | React | 18.3 |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 12.35 |
| Charts | Recharts | 3.8 |
| State/Fetch | SWR | 2.4 |
| Auth | jose (JWT) | 6.2 |
| Validation | Zod | 4.3 |
| Email | Resend | 6.9 |
| Payments | Stripe SDK | 20.4 |
| Banking | Plaid SDK | 41.4 |
| AI | Anthropic SDK | 0.78 |
| Vector DB | Pinecone SDK | 7.1 |
| Hosting | Vercel | -- |
| Database | Airtable | REST API |
| Testing | Vitest + Playwright | 4.1 / 1.58 |

---

## Airtable Schema

Base ID: `app1SwhSfwe8GKUg4` -- 12 tables accessed through `/src/lib/airtable/tables.ts`.

| Table | Accessor | Records | Key Fields | Purpose |
|-------|----------|---------|------------|---------|
| Clients | `Tables.clients()` | 2181+ | Name, Email, Phone, Lead Status, LTV, Segment, Last Visit | CRM -- lead management, client profiles, segmentation |
| Client Intakes | `Tables.intakes()` | -- | First Name, Last Name, Email, Phone, Intake Summary (AI), Program Plan (AI), Cost Breakdown (AI), Timeline (AI), Processing Status | Typeform submissions + AI analysis pipeline |
| Intake Intelligence | `Tables.intakeIntelligence()` | -- | AI-processed fields | Enriched intake data from AI processing |
| Appointments | `Tables.appointments()` | -- | Client, Service, Provider, Date, Status, Duration | Scheduling, utilization tracking, consult management |
| Packages | `Tables.packages()` | -- | Client, Services, Price, Status | Treatment packages sold |
| Memberships | `Tables.memberships()` | -- | Client, Tier, Start Date, Status, Monthly Amount | Monthly membership tracking and renewal |
| Transactions | `Tables.transactions()` | -- | Client, Amount, Service, Provider, Date, Payment Method | Revenue tracking, payment reconciliation |
| Messages Log | `Tables.messagesLog()` | -- | Client, Channel, Content, Sent At, Status | SMS/email audit trail |
| Reviews | `Tables.reviews()` | -- | Client, Rating, Text, Source, Date, AI Response | Google review tracking + AI response drafts |
| KPI Snapshots | `Tables.kpis()` | -- | Date, Revenue, Bookings, Consults, Leads, Score | Daily/weekly metric snapshots |
| Alerts | `Tables.alerts()` | -- | Type, Severity, Message, Status, Created At | System alerts with thresholds |
| Competitor Intelligence | `Tables.competitorIntel()` | -- | Competitor, Category, Intel, Date | Competitor monitoring data |

### Critical Field Name Mapping (for n8n Workflows)

These are the exact field names in Airtable. Using incorrect names causes silent failures:

| What | Correct Field Name | Common Mistake |
|------|--------------------|----------------|
| AI Summary | `Intake Summary (AI)` | "AI Summary" |
| AI Plan | `Program Plan (AI)` | "AI Plan" |
| AI Cost | `Cost Breakdown (AI)` | "Cost Breakdown" |
| AI Timeline | `Timeline (AI)` | "Timeline" |
| AI Next Step | `Suggested Next Step (AI)` | "Next Step" |
| AI Value | `Treatment Value (AI)` | "Treatment Value" |
| Status | `Processing Status` | "Status" |

---

## API Route Reference

### Authentication Routes (3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/dashboard/auth/login` | None | JWT login with username/password |
| GET | `/api/dashboard/auth/me` | JWT | Get current session user/role |
| POST | `/api/dashboard/auth/logout` | JWT | Clear session cookie |

### KPI and Revenue Routes (5)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/kpis` | JWT | KPI cards (revenue, bookings, consults, leads) |
| GET | `/api/dashboard/revenue` | JWT | Revenue breakdown by provider/service/category |
| GET | `/api/dashboard/revenue/trends` | JWT | 30-day revenue trend data |
| GET | `/api/dashboard/revenue/anomalies` | JWT | Revenue anomaly detection (5 methods + health score + projection) |
| GET | `/api/cron/daily-kpi` | Cron secret | Daily KPI snapshot aggregation |

### Lead and Client Routes (8)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/leads` | JWT | Lead funnel stages |
| GET | `/api/dashboard/leads/stats` | JWT | Lead conversion statistics |
| GET | `/api/dashboard/clients` | JWT | Client list with search/filter |
| GET | `/api/dashboard/clients/[id]` | JWT | Single client detail (`?full=true` for 360-degree view) |
| GET | `/api/dashboard/clients/[id]/churn` | JWT | Per-client churn prediction score |
| GET | `/api/dashboard/clients/[id]/recommend` | JWT | AI next-best-treatment recommendations |
| GET | `/api/dashboard/clients/at-risk` | JWT | All at-risk clients ranked by urgency |
| GET | `/api/dashboard/behavioral-insights` | JWT | Behavioral analytics insights |

### Schedule Routes (4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/schedule` | JWT | Today's appointments |
| GET | `/api/dashboard/schedule/upcoming` | JWT | Next 7 days of appointments |
| GET | `/api/dashboard/schedule/no-show-risk` | JWT | No-show risk scoring (`?date=YYYY-MM-DD`) |
| GET | `/api/dashboard/schedule/optimize` | JWT | Schedule optimization (gaps, conflicts, balance) |

### Alert Routes (2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/alerts` | JWT | Active alerts list |
| PATCH | `/api/dashboard/alerts/[id]` | JWT | Dismiss or acknowledge an alert |

### Gamification Routes (7)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/gamification/score` | JWT | Clinic score calculated from real metrics |
| GET | `/api/dashboard/gamification/achievements` | JWT | Achievement list and progress |
| GET | `/api/dashboard/gamification/leaderboard` | JWT | Provider rankings |
| GET | `/api/dashboard/gamification/briefing` | JWT | Morning briefing data |
| GET | `/api/dashboard/gamification/challenges` | JWT | Daily challenges |
| GET | `/api/dashboard/gamification/wins` | JWT | Daily wins |
| POST | `/api/dashboard/gamification/snapshot` | JWT | Save gamification snapshot |

### Provider Routes (2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/providers` | JWT | Provider performance summary |
| GET | `/api/dashboard/providers/[name]` | JWT | Single provider detailed stats |

### Finance Routes (3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/finance/expenses` | JWT | Expense tracking and categorization |
| GET | `/api/dashboard/finance/pnl` | JWT | P&L intelligence + financial health scoring |
| GET | `/api/dashboard/meta-ads` | JWT | Meta Ads performance (30-day) |

### Plaid/Banking Routes (9)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/plaid/link-token` | JWT | Plaid Link initialization token |
| POST | `/api/dashboard/plaid/exchange-token` | JWT | Exchange Plaid public token for access token |
| GET | `/api/dashboard/plaid/accounts` | JWT | Connected bank accounts list |
| POST | `/api/dashboard/plaid/sandbox-connect` | JWT | Sandbox connection for testing |
| POST | `/api/dashboard/plaid/disconnect` | JWT | Disconnect bank account |
| GET | `/api/dashboard/plaid/transactions` | JWT | Bank transaction list |
| POST | `/api/dashboard/plaid/transactions/sync` | JWT | Sync new transactions from bank |
| GET | `/api/dashboard/plaid/transactions/matches` | JWT | Auto-match bank transactions to Airtable records |
| POST | `/api/dashboard/plaid/transactions/[id]/reconcile` | JWT | Reconcile a specific transaction |
| GET | `/api/dashboard/plaid/summary` | JWT | Bank account summary |

### Data Entry Routes (10)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/dashboard/entry/lead` | JWT | Log new lead |
| POST | `/api/dashboard/entry/sale` | JWT | Log sale |
| POST | `/api/dashboard/entry/expense` | JWT | Log expense |
| POST | `/api/dashboard/entry/ceo-note` | JWT | CEO daily note |
| POST | `/api/dashboard/entry/eod-recap` | JWT | End-of-day recap |
| POST | `/api/dashboard/entry/room-issue` | JWT | Room issue report |
| POST | `/api/dashboard/entry/review` | JWT | Log review |
| POST | `/api/dashboard/entry/inventory` | JWT | Inventory update |
| POST | `/api/dashboard/entry/staff-note` | JWT | Staff note |
| POST | `/api/dashboard/entry/consult-notes` | JWT | Consultation notes |

### Intelligence Routes (8)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/pricing` | JWT | Dynamic pricing analysis + recommendations |
| GET | `/api/dashboard/inventory` | JWT | Inventory intelligence (reorder, waste, par levels) |
| GET | `/api/dashboard/social` | JWT | Social media content plan generation |
| GET | `/api/dashboard/meta-ads/optimize` | JWT | Meta Ads AI optimization + ad copy variants |
| GET/POST | `/api/dashboard/consult` | JWT | AI consult co-pilot (GET: sample, POST: custom client) |
| GET | `/api/dashboard/knowledge-base` | JWT | RAG knowledge base stats + search (`?q=query`) |
| GET | `/api/dashboard/phone-agent` | JWT | AI phone agent config + analytics |
| GET | `/api/dashboard/competitor-intel` | JWT | Competitor intelligence data |

### Integration Status Routes (4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/integrations/mangomint` | JWT | Mangomint sync status |
| GET | `/api/dashboard/integrations/square` | JWT | Square sync status |
| GET | `/api/dashboard/integrations/jotform` | JWT | Jotform sync status |
| GET | `/api/dashboard/integrations/sync-all` | JWT | All integration statuses |

### Additional Dashboard Routes (6)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dashboard/activity` | JWT | Recent activity feed |
| GET | `/api/dashboard/funnel-health` | JWT | Lead funnel health metrics |
| GET | `/api/dashboard/glp1` | JWT | GLP-1 weight loss program data |
| GET | `/api/dashboard/payments` | JWT | Payment data |
| GET | `/api/dashboard/reactivation` | JWT | Reactivation campaign data |
| GET | `/api/dashboard/save-queue` | JWT | Save queue panel data |
| GET | `/api/dashboard/reviews` | JWT | Review management |
| GET | `/api/dashboard/treatment-plans` | JWT | Treatment plan data |
| GET | `/api/dashboard/plan-builder` | JWT | Plan builder data |

### AI Routes (3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/ai/recommend` | None (rate limited) | AI treatment recommender (3-tier Good/Better/Best plans) |
| POST | `/api/ai/chat` | None (rate limited) | AI concierge chatbot (Claude Haiku, lead capture, SMS opt-in) |
| POST | `/api/ai/intake` | None (rate limited) | AI intake intelligence (risk flags, consult scripts) |

### Template Routes (3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/templates/post-treatment` | Bearer token | Rendered post-treatment follow-up templates (5-step sequence) |
| POST | `/api/templates/reactivation` | Bearer token | Rendered reactivation campaign templates (3 tiers) |
| POST | `/api/templates/pre-consult` | Bearer token | Rendered pre-consult communication templates (3-step) |

### Webhook and Utility Routes (7)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/contact` | None (rate limited) | Contact form submission to Resend + n8n |
| POST | `/api/webhooks/mangomint` | Webhook secret | Mangomint webhook receiver |
| POST | `/api/indexnow` | None | IndexNow SEO submission |
| POST | `/api/checkout` | None | Square/Stripe checkout initiation |
| POST | `/api/consultation/submit` | None (rate limited) | Consultation form submission |
| POST | `/api/notify` | Internal | Internal notification dispatch |
| POST | `/api/photo/simulation` | None | Photo simulation upload |
| POST | `/api/skin-analysis` | None | AI skin analysis |
| GET | `/api/services` | None | Public service catalog |
| GET | `/api/plan` | None | Treatment plan viewer |

---

## AI Engine Reference

### 1. Churn Prediction Engine

- **File:** `/src/lib/churn/engine.ts`
- **API:** `GET /api/dashboard/clients/[id]/churn` (single) | `GET /api/dashboard/clients/at-risk` (bulk)
- **Input:** Client record with transaction history, appointments, membership status, engagement data
- **Output:** Score 0-100, classification (low/medium/high/critical), factor breakdown
- **Algorithm:** 5 weighted factors -- recency (40%), frequency (20%), monetary (15%), membership (15%), engagement (10%)

### 2. No-Show Prediction Engine

- **File:** `/src/lib/predictions/no-show.ts`
- **API:** `GET /api/dashboard/schedule/no-show-risk?date=YYYY-MM-DD`
- **Input:** Appointment record with client history, deposit status, booking details
- **Output:** Score 0-100, classification (low/moderate/high), factor breakdown
- **Algorithm:** 6 weighted factors -- history (35%), deposit (20%), lead time (15%), membership (10%), timing (10%), source (10%)
- **Batch mode:** `quickNoShowScore()` for schedule view optimization

### 3. Revenue Anomaly Detection

- **File:** `/src/lib/predictions/revenue-anomaly.ts`
- **API:** `GET /api/dashboard/revenue/anomalies`
- **Input:** Revenue data (daily, by provider, by service)
- **Output:** Anomalies array, healthScore (0-100), summary text, projectedMonthEnd
- **Algorithm:** 5 detection methods -- target deviation, rolling average comparison, day-of-week pattern, provider imbalance, financing spike
- **Thresholds:** Warning at -15% target, critical at -30%, spike at +50%

### 4. Treatment Recommendation Engine

- **File:** `/src/lib/recommendations/engine.ts`
- **API:** `GET /api/dashboard/clients/[id]/recommend`
- **Input:** Client profile with treatment history, goals, preferences
- **Output:** Ranked recommendation list with reasoning, estimated revenue
- **Algorithm:** 5 strategies -- pathway continuation, category gap filling, goal-based matching, timing/overdue detection, membership upsell

### 5. Dynamic Pricing Engine

- **File:** `/src/lib/pricing/dynamic-engine.ts`
- **API:** `GET /api/dashboard/pricing`
- **Input:** Service catalog, demand data, competitor pricing, cost data
- **Output:** Price recommendations per service with strategy rationale
- **Algorithm:** 6 strategies -- demand-based, temporal/seasonal, competitor-reactive, cost-plus, penetration, bundle pricing

### 6. P&L Intelligence Engine

- **File:** `/src/lib/finance/pnl-engine.ts`
- **API:** `GET /api/dashboard/finance/pnl`
- **Input:** Transaction data, expense records, service catalog
- **Output:** Financial health score (0-100), P&L breakdown, service profitability, cash flow projection
- **Components:** Auto expense categorization (8 categories), service cost ratios, 6-month cash flow projection, health scoring across 5 dimensions

### 7. Schedule Optimizer

- **File:** `/src/lib/schedule/optimizer.ts`
- **API:** `GET /api/dashboard/schedule/optimize`
- **Input:** Appointment schedule, provider availability, service durations
- **Output:** Efficiency score (0-100), gaps with revenue potential, conflicts, provider balance, revenue opportunities
- **Detection types:** Gap detection, double booking, room conflict, equipment conflict, insufficient buffer, overtime, underloaded/overloaded providers

### 8. Inventory Auto-Manager

- **File:** `/src/lib/inventory/auto-manager.ts`
- **API:** `GET /api/dashboard/inventory`
- **Input:** Inventory records, usage patterns, supplier data
- **Output:** Reorder alerts, waste analysis, par level recommendations, supplier comparisons

### 9. Social Media Auto-Post Engine

- **File:** `/src/lib/social/auto-post-engine.ts`
- **API:** `GET /api/dashboard/social`
- **Input:** Content themes, posting schedule, engagement data
- **Output:** Weekly content calendar, content scoring (0-100), hashtag strategy, optimal posting times
- **Themes:** Motivation Monday, Transformation Tuesday, etc. (day-specific)
- **Categories:** educational, before_after, promotional, behind_the_scenes, testimonial, seasonal, team_spotlight, service_highlight, wellness_tip, community

### 10. Meta Ads AI Manager

- **File:** `/src/lib/ads/meta-ads-manager.ts`
- **API:** `GET /api/dashboard/meta-ads/optimize`
- **Input:** Campaign performance data, creative inventory, budget data
- **Output:** Campaign grades, ad copy variants, budget allocation, creative fatigue alerts, funnel analysis, ad score (0-100), projected ROAS

### 11. AI Consult Co-Pilot

- **File:** `/src/lib/consult/copilot-engine.ts`
- **API:** `GET|POST /api/dashboard/consult`
- **Input:** Client profile, appointment details, treatment history
- **Output:** Pre-consult briefing, treatment plan, talking points (must_say/should_say/nice_to_say), objection handlers, cross-sell opportunities, closing strategies, follow-up plan
- **Objection techniques:** feel-felt-found, reframe, social proof, isolate, normalize, enable
- **Closing strategies:** assumptive, choice, urgency, value, trial

### 12. RAG Knowledge Base

- **File:** `/src/lib/rag/knowledge-base.ts`
- **API:** `GET /api/dashboard/knowledge-base` (stats) | `GET /api/dashboard/knowledge-base?q=query` (search)
- **Input:** Search query or stats request
- **Output:** Coverage score (0-100), document inventory, semantic search results, knowledge gaps
- **Vector DB:** Pinecone (serverless, text-embedding-3-small 1536d)
- **Documents:** 12 built-in Rani knowledge docs (treatment protocols, aftercare, FAQs, policies, products)
- **Coverage:** Tracked across 11 services x required categories

### 13. Vapi AI Phone Agent

- **File:** `/src/lib/phone/vapi-agent.ts`
- **API:** `GET /api/dashboard/phone-agent`
- **Input:** Call analytics request or config sync
- **Output:** Call volume, intent breakdown, peak times, booking conversion, satisfaction scores, performance metrics
- **Call flows:** New Booking, Service Inquiry, Existing Appointment, General FAQ, After-Hours, Escalation
- **Escalation rules:** 8 triggers including medical emergency, adverse reaction, billing dispute, complaint
- **Voice config:** Deepgram aura-luna-en, Model: gpt-4o-mini, Transcriber: nova-2

---

## Component Tree Overview

### Public Site Components

```
src/components/
  layout/
    Navbar.tsx                    # Site navigation with Mangomint booking widget
    Footer.tsx                    # Site footer
    ConditionalPublicLayout.tsx   # Wraps public pages (excludes dashboard)
    MobileCTA.tsx                 # Sticky mobile call-to-action
    ScrollProgress.tsx            # Page scroll progress indicator
    ScrollToTop.tsx               # Scroll-to-top button
    SocialProofToast.tsx          # Social proof notification toasts

  sections/
    Hero.tsx                      # Home page hero section
    HomeServicesOverview.tsx      # Service category panels
    BeforeAfterGallery.tsx        # Results gallery
    BeforeAfterSlider.tsx         # Interactive before/after slider
    ReviewCarousel.tsx            # Google review carousel
    ConsultationCTA.tsx           # Consultation booking CTA
    TrustBar.tsx / TrustStrip.tsx # Trust indicators
    FAQ.tsx                       # FAQ accordion
    MapSection.tsx                # Location map
    DoctorIntro.tsx               # Provider introduction
    MeetTheTeam.tsx               # Team profiles
    PopularPackages.tsx           # Package showcase
    PricingPsychology.tsx         # Pricing display
    ProcessSteps.tsx              # Treatment process steps
    SkinQuiz.tsx / TreatmentQuiz.tsx  # Interactive quizzes
    ExitIntentPopup.tsx           # Exit intent lead capture

  consultation/
    ConsultationWizard.tsx        # 8-step consultation wizard
    steps/Step1-8*.tsx            # Individual wizard steps
    BodyMapPicker.tsx             # Interactive body area selector
    FaceMapPicker.tsx             # Interactive face area selector

  photo-simulation/
    PhotoSimulation.tsx           # AI photo simulation tool
    PhotoUploadZone.tsx           # Upload interface
    SimulationCanvas.tsx          # Result display
    TreatmentEffectSelector.tsx   # Effect selection UI

  seo/
    StructuredData.tsx            # JSON-LD structured data
    BreadcrumbSchema.tsx          # Breadcrumb markup
    EnhancedSchemas.tsx           # Rich schema markup

  AIChatWidget.tsx                # Floating AI chat widget
```

### Dashboard Components

```
src/components/dashboard/
  layout/
    DashboardShell.tsx            # Main dashboard layout wrapper
    Sidebar.tsx                   # Navigation sidebar
    Topbar.tsx                    # Top bar with user info
    MobileNav.tsx                 # Mobile navigation

  cards/
    KPICard.tsx                   # KPI display card

  charts/
    SparklineChart.tsx            # Inline sparkline charts
    ProgressBar.tsx               # Progress indicators
    ProgressRing.tsx              # Circular progress

  panels/
    AttentionPanel.tsx            # Items needing attention
    AtRiskClientsPanel.tsx        # At-risk client list
    FunnelHealthPanel.tsx         # Lead funnel health
    NoShowRiskPanel.tsx           # No-show risk alerts
    RevenueHealthPanel.tsx        # Revenue health summary
    RecommendationsPanel.tsx      # AI recommendations
    SaveQueuePanel.tsx            # Client save queue
    QuickActions.tsx              # Quick action buttons
    RecentActivity.tsx            # Activity feed
    ConsultPrepSlideOver.tsx      # Consult prep slide-over

  forms/
    FormShell.tsx                 # Form wrapper
    FormInput.tsx                 # Text input
    FormSelect.tsx                # Select dropdown
    FormTextarea.tsx              # Textarea
    FormRadioGroup.tsx            # Radio group
    FormToggle.tsx                # Toggle switch
    FormField.tsx                 # Field wrapper

  gamification/
    ClinicScoreMeter.tsx          # Clinic score display
    BossLevelMilestone.tsx        # Boss level progress
    DailyChallenges.tsx           # Daily challenge cards
    DailyWinsBanner.tsx           # Daily wins display
    AchievementToast.tsx          # Achievement notifications
    LevelUpModal.tsx              # Level up celebration
    MorningBriefing.tsx           # Morning briefing panel
    ConfettiCelebration.tsx       # Confetti animation

  plaid/
    PlaidLinkButton.tsx           # Plaid Link integration
    AccountsStrip.tsx             # Bank accounts display
    TransactionFeed.tsx           # Transaction list
    ReconciliationPanel.tsx       # Reconciliation interface
    BankMatchSuggestion.tsx       # Auto-match suggestions
    SyncStatusBadge.tsx           # Sync status indicator

  plan-builder/
    ClientSelector.tsx            # Client selection
    CatalogSearch.tsx             # Service catalog search
    ServiceCatalogCard.tsx        # Service card
    DraggableServiceItem.tsx      # Drag-and-drop service
    PhaseDropZone.tsx             # Phase drop zone
    PackageCalculator.tsx         # Package pricing calculator
    PlanPreviewModal.tsx          # Plan preview
    PlanTotals.tsx                # Plan totals display
```

---

## Authentication and Authorization

### JWT Session Management

- **Library:** jose (HS256)
- **Session file:** `/src/lib/auth/session.ts`
- **Cookie:** `dash_session` (HTTP-only, secure, SameSite=Lax)
- **Expiry:** Configurable, stored in JWT payload

### Role-Based Access Control

- **Roles file:** `/src/lib/auth/roles.ts`
- **5 roles:** ceo, frontdesk, provider, marketing, operations
- **49 permissions** mapped across roles
- Each API route checks the session JWT and verifies the user's role has the required permission

### Auth Flow

```
POST /api/dashboard/auth/login
  --> Validate credentials
  --> Create JWT with { userId, role, permissions }
  --> Set dash_session cookie
  --> Return user profile

GET /api/dashboard/auth/me
  --> Read dash_session cookie
  --> Verify JWT signature (HS256)
  --> Return user profile + role

All /api/dashboard/* routes:
  --> Extract JWT from cookie
  --> Verify signature + expiry
  --> Check role has required permission
  --> Process request or return 401/403
```

---

## Caching Strategy

- **Implementation:** In-memory TTL cache at `/src/lib/cache/index.ts`
- **Presets:** 30 seconds, 60 seconds, 2 minutes, 5 minutes, 10 minutes
- **Client-side:** SWR with stale-while-revalidate pattern

| Data Type | Server Cache TTL | SWR Refresh Interval |
|-----------|-----------------|---------------------|
| KPIs | 30s | 30s |
| Revenue | 60s | 60s |
| Leads | 60s | 60s |
| Schedule | 30s | 30s |
| Alerts | 30s | 30s |
| Gamification | 30s-60s | 30s-60s |
| Client profiles | 60s | 60s |
| Integrations | 5min | 5min |
| Intelligence engines | 5min | 5min |
| Leaderboard | 2min | 2min |

---

## Gamification System

- **Engine:** `/src/lib/gamification/engine.ts`
- **Score weights:** `/src/data/dashboard/score-weights.ts`
- **Types:** `/src/types/gamification.ts`

### Clinic Score (0-100)

Calculated from weighted real operational metrics including revenue, bookings, utilization, reviews, and response times.

### Boss Levels

| Level | Name | Monthly Revenue Threshold |
|-------|------|--------------------------|
| 1 | Bronze | $30,000 |
| 2 | Silver | $60,000 |
| 3 | Gold | $90,000 |
| 4 | Platinum | $120,000 |
| 5 | Diamond | $150,000+ |

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Navy | #0F1D2C | Primary backgrounds |
| Gold | #C9A96E | Accents, highlights |
| Cream | #F8F6F1 | Light backgrounds |
| Heading Font | Playfair Display | Dashboard headings |
| Body Font | Montserrat | Body text, labels |
