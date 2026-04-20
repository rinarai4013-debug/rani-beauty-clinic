# Rani Beauty Clinic — Project Context

## Business
- **Name:** Rani Beauty Clinic
- **Type:** Luxury medical aesthetics clinic (physician-supervised medspa)
- **Location:** 401 Olympia Ave NE, Suite 101, Renton, WA 98056
- **Owner:** Rina (CEO) + Mom (Provider)
- **Brand Voice:** Luxury, confident, clinically-assured. Educational + aspirational (never discount-first). "Transformation journey" not "treatment list."
- **CRITICAL:** Rani does IM INJECTIONS only. NEVER use the word "infusion." Always say "injection."

## Tech Stack
- **Framework:** Next.js 14.2 (App Router, TypeScript)
- **Hosting:** Vercel (ranibeautyclinic.com — LIVE)
- **Database:** Airtable (Base ID: `app1SwhSfwe8GKUg4`)
- **Automation:** n8n (ranibeautyclinic.app.n8n.cloud — 19 workflows)
- **Email:** Resend (transactional), SendGrid (marketing via n8n)
- **SMS:** Twilio (via n8n)
- **Payments:** Square (POS — all transactions), Stripe (not yet connected)
- **Pharmacy — GLP-1/Peptides:** QualiphyRx (app.qualiphy.me — tirzepatide, semaglutide, exclusive peptides via Greenwich)
- **Pharmacy — HRT/Skincare/ED:** Olympia Pharmacy (testosterone, estradiol, progesterone, GHK-Cu skincare, sexual health, supplies)
- **Pharmacy — Troches/Bella:** Hallandale Pharmacy (Sermorelin/NAD+ troches, Bella #1 SR)
- **Booking:** Mangomint (app.mangomint.com/876418, CompanyID: 876418, 2,181 clients, booking widget in layout.tsx)
- **Intake Forms:** Website contact form (/contact → /api/contact → Airtable + Resend + n8n)
- **Client Portal:** Softr (treatment plan viewer)
- **AI:** Anthropic Claude API
- **Voice AI:** Vapi.ai (AI phone receptionist)
- **Vector DB:** Pinecone (RAG knowledge base, text-embedding-3-small 1536d)
- **Styling:** Tailwind CSS, Framer Motion, Recharts
- **Auth:** JWT via jose (HS256), cookie-based sessions

## Airtable Tables (13)
| Table | Accessor | Key Use |
|-------|----------|---------|
| Clients | `Tables.clients()` | CRM — lead status, LTV, segments |
| Client Intakes | `Tables.intakes()` | Contact form submissions + AI analysis |
| Intake Intelligence | `Tables.intakeIntelligence()` | AI-processed intake data |
| Appointments | `Tables.appointments()` | Schedule, utilization, consults |
| Packages | `Tables.packages()` | Treatment packages sold |
| Memberships | `Tables.memberships()` | Monthly membership tracking |
| Transactions | `Tables.transactions()` | Revenue, payments, financing |
| Messages Log | `Tables.messagesLog()` | SMS/email audit trail |
| Reviews | `Tables.reviews()` | Google review tracking + AI responses |
| KPI Snapshots | `Tables.kpis()` | Daily/weekly metric snapshots |
| Alerts | `Tables.alerts()` | System alerts + thresholds |
| Incidents | `Tables.incidents()` | Internal adverse event + protocol incident reporting |
| Competitor Intelligence | `Tables.competitorIntel()` | Competitor monitoring |

### Client Intakes — Real Field Names (verified from live Airtable 2026-03-28)
These are the ACTUAL field names in the Client Intakes table. Code and n8n workflows MUST use these exact names:
- `Full Name` (NOT "First Name"/"Last Name" — single field), `Email`, `Phone Number` (NOT "Phone")
- `Intake Summary (AI)` — NOT "AI Summary"
- `Program Plan (AI)`, `Cost Breakdown (AI)`, `Timeline (AI)`
- `Suggested Next Step (AI)`, `Treatment Value (AI)`
- `Processing Status` — Single select: New, Processed, Responded (MUST be added if missing)

## Services & Pricing
- Sofwave: $2,750–$4,500 (non-invasive skin tightening)
- HydraFacial: $275 (signature facial)
- PRX-T33: $495 (biorevitalization)
- VI Peel: $395 (chemical peel)
- PicoWay: $350–$600 (laser pigment removal)
- RF Microneedling: $495–$850 (skin renewal)
- Laser Hair Removal: packages from $800
- Botox/Fillers: injectable specialist
- Wellness Injections: Vitamin D3 $50, Tri-Immune $75, Glutathione $100, B12 $35, NAD+ $150–500
- GLP-1 Weight Loss: $399–599/mo (QualiphyRx Greenwich)
- HRT — Men's TRT: $349/mo (Olympia)
- HRT — Women's (Estradiol/Progesterone): $199–349/mo (Olympia)
- Rx Skincare: GHK-Cu Tighten $149–199, NADvantage $149, Retinoids $99–149 (Olympia)
- Sexual Health: Men's ED $149–599/mo, Women's Wellness $129–149 (Olympia)
- Peptides: NAD+ $299, Sermorelin $299 (Olympia), CJC/Ipamorelin $349 (QualiphyRx)
- Troches: Sermorelin $199, NAD+ $149 (Hallandale)
- Bella #1 SR: $199/mo (Hallandale)
- Folix Hair Restoration
- See: SOURCING-STRATEGY.md, OLYMPIA-CATALOG.md, MANGOMINT-NEW-SERVICES.md, SEXUAL-HEALTH-VERTICAL.md

### Incidents Table — Field Schema (added 2026-04-19)
Internal staff-only medical/compliance reporting. Route: `/dashboard/incidents`

- `Client Name` (single line text; supports autocomplete from Clients table)
- `Services Involved` (long text or multiple select; comma-separated accepted by API)
- `Incident Date/Time` (date-time)
- `Provider on Duty` (single select/text)
- `Incident Type` (single select): `side effect`, `allergic reaction`, `equipment malfunction`, `protocol deviation`, `other`
- `Severity` (single select): `mild`, `moderate`, `severe`, `hospitalization`
- `Narrative Description` (long text)
- `Immediate Action Taken` (long text)
- `Follow-Up Required` (checkbox/boolean)
- `Follow-Up Notes` (long text)
- `Photo Attachments` (attachments field, optional)
- `Reported By` (single line text; auto-populated from logged-in staff)
- `Medical Director Review Status` (single select): `pending`, `reviewed`, `resolved`
- `Medical Director Notes` (long text; editable by MD roles only)

## Dashboard Architecture
- **Auth:** JWT sessions, 5 roles (ceo, frontdesk, provider, marketing, operations), 49 permissions
- **Data:** SWR hooks → `/api/dashboard/*` → Airtable via rate-limited client (4.7 req/sec)
- **Cache:** In-memory TTL (30s–10min presets)
- **Gamification:** Clinic score 0–100, boss levels (Bronze $30K → Diamond $150K+), XP/leveling
- **Design:** Navy (#0F1D2C), Gold (#C9A96E), Cream (#F8F6F1), Playfair Display + Montserrat

## Key Files
- `/src/lib/airtable/client.ts` — Rate-limited Airtable client
- `/src/lib/airtable/tables.ts` — Table accessors + field constants
- `/src/lib/auth/session.ts` — JWT session management
- `/src/lib/auth/roles.ts` — RBAC permissions
- `/src/lib/cache/index.ts` — TTL cache
- `/src/lib/gamification/engine.ts` — Score calculator + boss levels
- `/src/hooks/useDashboardData.ts` — SWR hooks for dashboard (25 hooks)
- `/src/types/dashboard.ts` — Dashboard TypeScript interfaces
- `/src/types/gamification.ts` — Gamification types
- `/src/types/auth.ts` — Auth types
- `/src/data/dashboard/score-weights.ts` — Score weights + targets

### Prediction & Intelligence Engines
- `/src/lib/churn/engine.ts` — Churn prediction (5 factors: recency 40%, frequency 20%, monetary 15%, membership 15%, engagement 10%)
- `/src/lib/predictions/no-show.ts` — No-show prediction (6 factors: history 35%, deposit 20%, lead time 15%, membership 10%, timing 10%, source 10%)
- `/src/lib/predictions/revenue-anomaly.ts` — Revenue anomaly detection (5 methods: target deviation, rolling avg, DOW pattern, provider imbalance, financing spike)
- `/src/lib/recommendations/engine.ts` — Next-best-treatment recommendations (5 strategies: pathway, category gaps, goal-based, timing/overdue, membership upsell)
- `/src/lib/pricing/dynamic-engine.ts` — Dynamic pricing (6 strategies: demand, temporal, competitor, cost-plus, penetration, bundle)
- `/src/lib/finance/pnl-engine.ts` — P&L intelligence (service cost ratios, margin analysis, cash flow projection, auto expense categorization)
- `/src/lib/schedule/optimizer.ts` — Schedule optimizer (gap detection, conflict resolution, provider balance, revenue opportunities)
- `/src/lib/inventory/auto-manager.ts` — Inventory auto-manager (reorder points, waste analysis, par levels, supplier management)
- `/src/lib/social/auto-post-engine.ts` — Social media auto-post (weekly calendar, monthly themes, hashtag strategy, posting times, content scoring)
- `/src/lib/ads/meta-ads-manager.ts` — Meta Ads AI manager (campaign analysis, ad copy generation, budget optimization, creative fatigue, funnel analysis)
- `/src/lib/consult/copilot-engine.ts` — AI consult co-pilot (client briefing, treatment plans, objection handlers, cross-sell, closing strategies)
- `/src/lib/rag/knowledge-base.ts` — RAG knowledge base (12 Rani documents, semantic search, Pinecone vector integration, knowledge gap detection)
- `/src/lib/phone/vapi-agent.ts` — Vapi AI phone agent (assistant config, call flows, analytics, escalation rules, brand voice system prompt)

### Communication Templates (n8n-callable)
- `/src/lib/templates/post-treatment.ts` — 5-step follow-up sequence (immediate, 24h, 72h, 7-day, 30-day) with branded HTML emails
- `/src/lib/templates/reactivation.ts` — 3-tier reactivation templates (lapsed-30, lapsed-60, lapsed-90) with auto-tier detection
- `/src/lib/templates/pre-consult.ts` — 3-step pre-consult sequence (booking confirmation, 24h reminder, 2h reminder) with service-specific prep instructions

### Dashboard Pages
- `/src/app/(dashboard)/dashboard/clients/[id]/page.tsx` — 360° client profile (LTV, visits, churn risk, appointments, transactions, memberships, messages, reviews)
- `/src/app/(dashboard)/dashboard/pricing/page.tsx` — Pricing Intelligence (price recommendations, smart packages, promotional strategies)
- `/src/app/(dashboard)/dashboard/pnl/page.tsx` — P&L Intelligence (financial health scoring, revenue/expense breakdown, service profitability, cash flow chart)
- `/src/app/(dashboard)/dashboard/schedule-optimizer/page.tsx` — Schedule Optimizer (gaps, conflicts, provider balance, revenue opportunities, daily summary)
- `/src/app/(dashboard)/dashboard/inventory-intel/page.tsx` — Inventory Intelligence (alerts, reorder recommendations, waste analysis, usage table)
- `/src/app/(dashboard)/dashboard/social/page.tsx` — Social Media AI (weekly calendar, monthly themes, hashtag strategy, posting times)
- `/src/app/(dashboard)/dashboard/meta-ads/page.tsx` — Meta Ads AI Manager (campaigns, optimizations, ad copy variants, budget recs, funnel analysis)
- `/src/app/(dashboard)/dashboard/consult/page.tsx` — AI Consult Co-pilot (client briefing, treatment plan, talking points, objection handlers, closing strategy)
- `/src/app/(dashboard)/dashboard/knowledge-base/page.tsx` — RAG Knowledge Base (coverage score, documents by category/service, knowledge gaps, Pinecone status)
- `/src/app/(dashboard)/dashboard/phone-agent/page.tsx` — AI Phone Agent (call analytics, intents, peak times, call flows, performance metrics, Vapi config)

## Environment Variables Required
```
AIRTABLE_PAT=
AIRTABLE_BASE_ID=app1SwhSfwe8GKUg4
DASHBOARD_JWT_SECRET=
ANTHROPIC_API_KEY=
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
RESEND_API_KEY=
CONTACT_EMAIL=info@ranibeautyclinic.com
FROM_EMAIL=Rani Beauty Clinic <noreply@ranibeautyclinic.com>
N8N_WEBHOOK_URL=
PINECONE_API_KEY=
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
```

## n8n Workflow Field Name Mapping
When editing n8n workflows, use these EXACT Airtable field names:
- AI Summary field → `Intake Summary (AI)` (NOT `AI Summary`)
- AI Plan field → `Program Plan (AI)`
- AI Cost field → `Cost Breakdown (AI)`
- AI Timeline field → `Timeline (AI)`
- AI Next Step field → `Suggested Next Step (AI)`
- AI Value field → `Treatment Value (AI)`
- Processing status → `Processing Status` (single select: New/Processed/Responded)

## API Routes (67 total)

### Dashboard Routes (58)
- `POST /api/dashboard/auth/login` — JWT login
- `GET /api/dashboard/auth/me` — Current session
- `GET /api/dashboard/kpis` — KPI cards (revenue, bookings, consults, leads)
- `GET /api/dashboard/revenue` — Revenue breakdown by provider/service/category
- `GET /api/dashboard/revenue/trends` — 30-day revenue trend
- `GET /api/dashboard/revenue/anomalies` — Revenue anomaly detection (5 methods + health score + month-end projection)
- `GET /api/dashboard/leads` — Lead funnel stages
- `GET /api/dashboard/leads/stats` — Lead conversion stats
- `GET /api/dashboard/schedule` — Today's appointments
- `GET /api/dashboard/schedule/upcoming` — Next 7 days
- `GET /api/dashboard/schedule/no-show-risk` — No-show risk scoring for all upcoming appointments
- `GET /api/dashboard/alerts` — Active alerts
- `PATCH /api/dashboard/alerts/[id]` — Dismiss/acknowledge alert
- `GET /api/dashboard/gamification/score` — Clinic score from real metrics
- `GET /api/dashboard/gamification/achievements` — Achievement list
- `GET /api/dashboard/gamification/leaderboard` — Provider rankings
- `GET /api/dashboard/clients` — Client list with filters
- `GET /api/dashboard/clients/[id]` — Single client detail (supports `?full=true` for 360° view with linked records)
- `GET /api/dashboard/clients/[id]/churn` — Per-client churn prediction score
- `GET /api/dashboard/clients/[id]/recommend` — AI next-best-treatment recommendations
- `GET /api/dashboard/clients/at-risk` — All at-risk clients ranked by urgency
- `GET /api/dashboard/providers` — Provider performance
- `GET /api/dashboard/providers/[name]` — Single provider stats
- `GET /api/dashboard/finance/expenses` — Expense tracking
- `GET /api/dashboard/meta-ads` — Meta Ads performance (30-day)
- `GET /api/dashboard/integrations/mangomint` — Mangomint sync status
- `GET /api/dashboard/integrations/square` — Square sync status
- `GET /api/dashboard/integrations/jotform` — Jotform sync status
- `GET /api/dashboard/integrations/sync-all` — All integration statuses
- `GET /api/dashboard/plaid/link-token` — Plaid Link initialization
- `POST /api/dashboard/plaid/exchange-token` — Plaid token exchange
- `GET /api/dashboard/plaid/accounts` — Connected bank accounts
- `POST /api/dashboard/plaid/sandbox-connect` — Sandbox connection
- `POST /api/dashboard/plaid/disconnect` — Disconnect bank
- `GET /api/dashboard/plaid/transactions` — Bank transactions
- `POST /api/dashboard/plaid/transactions/sync` — Sync transactions
- `GET /api/dashboard/plaid/transactions/matches` — Auto-match transactions to Airtable
- `POST /api/dashboard/plaid/transactions/[id]/reconcile` — Reconcile a transaction
- `GET /api/dashboard/plaid/summary` — Bank account summary
- 10x `POST /api/dashboard/entry/*` — Data entry forms (lead, sale, expense, ceo-note, eod-recap, room-issue, review, inventory, staff-note, consult-notes)
- `GET /api/dashboard/pricing` — Dynamic pricing analysis + recommendations
- `GET /api/dashboard/finance/pnl` — P&L intelligence + financial health scoring
- `GET /api/dashboard/schedule/optimize` — Schedule optimization (gaps, conflicts, balance)
- `GET /api/dashboard/inventory` — Inventory intelligence (reorder, waste, par levels)
- `GET /api/dashboard/social` — Social media content plan generation
- `GET /api/dashboard/meta-ads/optimize` — Meta Ads AI optimization + ad copy variants
- `GET|POST /api/dashboard/consult` — AI consult co-pilot (GET: sample, POST: custom client)
- `GET /api/dashboard/knowledge-base` — RAG knowledge base stats + search (?q=query)
- `GET /api/dashboard/phone-agent` — AI phone agent configuration + analytics

### AI Routes (3)
- `POST /api/ai/recommend` — AI treatment recommender (3-tier Good/Better/Best plans)
- `POST /api/ai/chat` — AI concierge chatbot (Claude Haiku, lead capture, SMS opt-in)
- `POST /api/ai/intake` — AI intake intelligence (risk flags, consult scripts)

### Template Routes (3) — Called by n8n workflows
- `POST /api/templates/post-treatment` — Rendered post-treatment follow-up templates (5-step sequence)
- `POST /api/templates/reactivation` — Rendered reactivation campaign templates (3 tiers, auto-detects from daysSinceLastVisit)
- `POST /api/templates/pre-consult` — Rendered pre-consult communication templates (3-step + service-specific prep)

### Webhook & Utility Routes (3)
- `POST /api/contact` — Contact form → Resend email + n8n webhook (includes SMS consent)
- `POST /api/webhooks/mangomint` — Mangomint webhook receiver
- `POST /api/indexnow` — IndexNow SEO submission

## SWR Hooks (25 in useDashboardData.ts)
- `useDashboardData<T>(endpoint, config)` — Base hook
- `useKPIs(range)` — KPI cards (30s refresh)
- `useRevenueData(range)` — Revenue breakdown (60s)
- `useLeadData()` — Lead funnel (60s)
- `useScheduleData()` — Today's schedule (30s)
- `useAlerts()` — Active alerts (30s)
- `useClinicScore()` — Gamification score (30s)
- `useGamification()` — Achievements (60s)
- `useLeaderboard()` — Provider rankings (120s)
- `useIntegrationStatus()` — Integration sync (5min)
- `useClientProfile(id)` — 360° client view (60s)
- `useClientChurn(id)` — Client churn score (5min)
- `useAtRiskClients()` — At-risk client list (2min)
- `useClientRecommendations(id)` — Next-best-treatment recs (5min)
- `useNoShowRisk(date?)` — Appointment no-show scores (60s)
- `useRevenueAnomalies()` — Revenue anomaly detection (2min)
- `usePricingAnalysis()` — Dynamic pricing intelligence (5min)
- `usePnL()` — P&L financial intelligence (5min)
- `useScheduleOptimization()` — Schedule optimization (2min)
- `useInventoryIntelligence()` — Inventory auto-management (5min)
- `useSocialPlan()` — Social media content plan (5min)
- `useMetaAdsOptimizer()` — Meta Ads AI optimization (5min)
- `useConsultCopilot()` — AI consult co-pilot (5min)
- `useKnowledgeBase()` — RAG knowledge base stats (5min)
- `usePhoneAgent()` — AI phone agent config + analytics (5min)

## n8n Workflows (19 total — all active at ranibeautyclinic.app.n8n.cloud)
See `N8N-WORKFLOW-STATUS.md` for complete details, webhook URLs, and fix history.

### Hourly Pollers (5) — All succeeding
- `zbJcTZ3Ime9BSop8` WF1 — Intake Intelligence Engine v2 (Every 1 Min)
- `9JGWwlYfUdVEkA7u` WF1b — Aura Scan Processor (Every 5 Min)
- `60VjUazBbCSCYSnM` WF2 — Immediate Lead Response (Every 1 Min)
- `UyEbQab5gHP1atlH` WF2b — No-Booking Follow-Up Ladder (Hourly)
- `dqCueQXTDkXQjRe0` WF5 — Consult Outcome Tracking (Every 5 Min)

### Daily (6) — Fixed Mar 15, 2026
- `wOGRg2Q5BJ95puOc` W12 — Alert Engine (Daily 11PM)
- `ajTQE3LwVvbPO0yV` WF4 — Pre-Consult Preparation (Daily 6AM)
- `oReCnfFeNxe9lSgY` WF9 — KPI Aggregation (Daily 6AM)
- `Qz5VLDUu7o9Yc5ge` WF7 — Membership Engine (Daily 9AM)
- `FIL65iOmyd4CfHNG` W13 — Review Commander (Daily 9AM)
- `mTAoqtrz7XGMsMds` W14 — Client Status Keeper (Daily Midnight)

### Weekly (2)
- `rtbIAVroFSGCQ7sK` WF8 — Reactivation Campaigns (Mon 10AM)
- `5aNNtyyCLYTDr5n3` WF10 — Provider Performance (Mon 7AM)

### Webhook-Triggered (5) — Mangomint URLs registered Mar 17
- `TpiezScNbp6BeGcv` WF3 — Booking Sync (`/webhook/booking-sync` — Mangomint appointment.created)
- `XgkCfHilKUeyF0dv` WF6 — Financing (`/webhook/financing-trigger` — Cherry/Stripe)
- `Tis5GeSHkVsk7bys` W16 — Post-Consult Close (`/webhook/postconsult-close-trigger`)
- `mo5nubnsK16sfDgG` W17 — Post-Treatment (`/webhook/post-treatment-trigger` — Mangomint appointment.completed)
- `zHJCkAf0ehhTzOfY` W2 — Document Architect (`/webhook/pdf-generator-trigger`)

### Legacy (Can Disable)
- `yxKBbrqJHd2jtwnr` Intake to CRM (was Typeform-triggered — replaced by /api/contact route)

## Scheduled Tasks (7 for Rani)
- `weekly-content-batch` — Sunday 6 AM: Full week's content (IG, Reels, Stories, GBP)
- `weekly-competitor-intel` — Monday 6 AM: 11-competitor scan + trend analysis
- `biweekly-ad-copy-refresh` — 1st & 15th at 7 AM: Meta ad copy variants
- `monthly-reactivation-campaign` — 1st at 7 AM: Lapsed client reactivation
- `daily-review-monitor` — Daily 8 AM: Google review monitoring + draft responses
- `weekly-revenue-report` — Friday 5 PM: Revenue executive summary
- `daily-meta-ads-check` — Daily 9 AM: Ad performance framework + benchmarks

## Intelligence Engine Reference

### Churn Prediction (`/src/lib/churn/engine.ts`)
- 5 weighted factors: recency (40%), frequency (20%), monetary (15%), membership (15%), engagement (10%)
- Scores 0–100, classified as low/medium/high/critical
- API: `GET /api/dashboard/clients/[id]/churn`
- Bulk: `GET /api/dashboard/clients/at-risk` (all lapsed/churned clients ranked by urgency)

### No-Show Prediction (`/src/lib/predictions/no-show.ts`)
- 6 weighted factors: history (35%), deposit (20%), lead time (15%), membership (10%), timing (10%), source (10%)
- Scores 0–100, classified as low/moderate/high
- `quickNoShowScore()` for batch processing (schedule view)
- API: `GET /api/dashboard/schedule/no-show-risk?date=YYYY-MM-DD`

### Revenue Anomaly Detection (`/src/lib/predictions/revenue-anomaly.ts`)
- 5 detection methods: target deviation, rolling average, DOW pattern, provider imbalance, financing spike
- Returns: anomalies array, healthScore (0–100), summary, projectedMonthEnd
- Thresholds: warning at -15% target, critical at -30%, spike at +50%
- API: `GET /api/dashboard/revenue/anomalies`

### Treatment Recommendations (`/src/lib/recommendations/engine.ts`)
- 5 strategies: pathway continuation, category gap filling, goal-based, timing/overdue, membership upsell
- Treatment pathway map (what follows each service)
- Cross-sell category map, maintenance timing, price estimates
- API: `GET /api/dashboard/clients/[id]/recommend`

### Communication Templates (n8n-callable APIs)
- **Post-Treatment:** 5-step sequence with branded HTML emails, service-specific aftercare links
- **Reactivation:** 3-tier auto-detection (30/60/90 days lapsed), urgency-appropriate messaging
- **Pre-Consult:** 3-step with service-specific prep instructions (laser, injectable, facial, wellness, body, consult categories), new client addons
- All templates support variable substitution: `{{clientName}}`, `{{serviceName}}`, `{{providerName}}`, etc.

### Dynamic Pricing Engine (`/src/lib/pricing/dynamic-engine.ts`)
- 6 pricing strategies: demand-based, temporal, competitor-reactive, cost-plus, penetration, bundle
- Seasonal multipliers, margin targets, service-specific pricing intelligence
- API: `GET /api/dashboard/pricing`

### P&L Intelligence (`/src/lib/finance/pnl-engine.ts`)
- Auto expense categorization across 8 categories (product costs, labor, rent, marketing, equipment, insurance, supplies, admin)
- Service cost ratio analysis (product cost %, labor %, overhead, profit margin)
- 6-month cash flow projection with historical trending
- Financial health scoring (0-100) across 5 components (revenue, margin, costs, cash flow, service mix)
- API: `GET /api/dashboard/finance/pnl`

### Schedule Optimizer (`/src/lib/schedule/optimizer.ts`)
- Gap detection with revenue potential scoring and suggested services
- Conflict detection (double booking, room conflict, equipment conflict, insufficient buffer, overtime)
- Provider workload balancing (underloaded/balanced/overloaded)
- Revenue opportunities (upgrade, addon, reschedule, fill_gap, waitlist)
- Schedule efficiency score (0-100)
- API: `GET /api/dashboard/schedule/optimize`

### Inventory Auto-Manager (`/src/lib/inventory/auto-manager.ts`)
- Reorder point calculation with lead time + safety stock
- Waste analysis with expiration tracking and cost impact
- Par level optimization based on usage patterns
- Supplier performance comparison (price, reliability, lead time)
- API: `GET /api/dashboard/inventory`

### Social Media Auto-Post Engine (`/src/lib/social/auto-post-engine.ts`)
- Weekly content calendar with day-specific themes (Motivation Monday, Transformation Tuesday, etc.)
- Monthly themes with 4-week content rotation
- Content scoring (0-100) based on engagement potential
- Hashtag strategy: branded, location, industry, service-specific sets
- Optimal posting times per platform (Instagram, GBP)
- Categories: educational, before_after, promotional, behind_the_scenes, testimonial, seasonal, team_spotlight, service_highlight, wellness_tip, community
- API: `GET /api/dashboard/social`

### Meta Ads AI Manager (`/src/lib/ads/meta-ads-manager.ts`)
- Campaign performance grading (excellent/good/average/poor/critical)
- Ad copy variant generation with service-specific angles
- Budget allocation optimization (scale/maintain/cut/pause)
- Creative fatigue detection (frequency > 4.0, CTR decline)
- Full funnel analysis: Impressions → Clicks → Leads → Bookings
- Audience targeting insights with CPA comparison
- Ad score (0-100) and projected ROAS
- API: `GET /api/dashboard/meta-ads/optimize`

### AI Consult Co-pilot (`/src/lib/consult/copilot-engine.ts`)
- Pre-consult client intelligence briefing with segment classification (vip/regular/new/at_risk)
- Treatment plan building with concern-to-service matching (8 services in DB)
- Talking points organized by timing (opening/during/closing) and priority (must_say/should_say/nice_to_say)
- 6 objection handlers with techniques (feel-felt-found, reframe, social proof, isolate, normalize, enable)
- Cross-sell opportunity identification with conversion likelihood scoring
- 5 closing strategies (assumptive, choice, urgency, value, trial) with financing and membership pitches
- Follow-up plan (same day, next day, one week, if no book)
- API: `GET|POST /api/dashboard/consult`

### RAG Knowledge Base (`/src/lib/rag/knowledge-base.ts`)
- 12 built-in Rani knowledge documents (treatment protocols, aftercare guides, FAQs, policies, product info)
- Semantic search with keyword scoring and category filtering
- RAG context builder for AI chat, consult co-pilot, and phone agent responses
- Pinecone vector database integration (serverless, text-embedding-3-small 1536d)
- Knowledge gap detection across 11 services × required coverage categories
- Coverage score calculation (0-100)
- Document chunking with overlap for embedding quality
- API: `GET /api/dashboard/knowledge-base` (stats) or `?q=query` (semantic search)

### Vapi AI Phone Agent (`/src/lib/phone/vapi-agent.ts`)
- Custom Vapi assistant configuration with Rani brand voice and compliance
- System prompt with full service catalog, pricing, hours, and call handling rules
- 6 call flows: New Booking, Service Inquiry, Existing Appointment, General FAQ, After-Hours, Escalation
- 8 escalation rules (medical emergency, adverse reaction, billing, complaint, etc.)
- Voice: Deepgram aura-luna-en, Model: gpt-4o-mini, Transcriber: nova-2
- Call analytics: volume, intents, peak times, booking conversion, satisfaction
- Performance metrics: first response time, resolution rate, cost per call, sentiment
- AI recommendations engine based on analytics patterns
- Vapi API functions: syncAssistantToVapi(), getVapiCallLogs()
- API: `GET /api/dashboard/phone-agent`

## Productization Notes (RaniOS → SaaS)

### What's Rani-specific vs Generic Med Spa
| Layer | Rani-Specific | Generic (Reusable) |
|-------|--------------|-------------------|
| Airtable schema | Base ID, field names | 12-table structure, field patterns |
| Dashboard | Rina/Mom providers, Renton location | RBAC, gamification engine, all UI |
| AI prompts | Service list, pricing, brand voice | Prompt structure, 3-tier recs, intake analysis |
| n8n workflows | Credentials, webhook URLs | All 19 workflow templates |
| Scheduled tasks | Competitor list, location | Content engine, intel briefing, review monitor |
| Chat widget | Clinic FAQs, phone number | Widget component, lead capture, chat API |
| Prediction engines | Thresholds, targets | Churn, no-show, revenue anomaly, recommendations |
| Communication templates | Brand voice, aftercare URLs | Template structure, sequence logic, variable system |

### Multi-Tenant Architecture Path
1. Replace hardcoded Airtable base ID with per-tenant config
2. Move service/pricing data from code to Airtable "Clinic Config" table
3. Add tenant ID to JWT session payload
4. Parameterize n8n workflows (base URL, credentials per tenant)
5. White-label: Replace Rani branding with tenant config (colors, logo, name)

### Sellable Components
- **AI Prompt Library** — 18 Claude prompts for med spa operations (intake analysis, treatment recs, consult scripts, reactivation messaging, review responses)
- **Dashboard Template** — Gamified operations dashboard with RBAC, KPIs, real-time schedule, lead funnel, 360° client profiles + 7 intelligence pages
- **Automation Suite** — 19 n8n workflow templates (intake→CRM, lead response, follow-up ladders, review requests)
- **Content Engine** — Automated weekly content batch generation (IG, Reels, Stories, GBP posts) + Social AI dashboard
- **Competitor Intelligence** — Automated weekly competitive scanning + briefing
- **Prediction Suite** — Churn, no-show, revenue anomaly, treatment recommendations, dynamic pricing, P&L intelligence
- **Communication Templates** — Pre-consult, post-treatment, and reactivation sequences with branded HTML emails
- **Operations Intelligence** — Schedule optimizer, inventory auto-manager, meta ads AI manager, consult co-pilot
- **RAG Knowledge Base** — Pinecone-powered semantic search, 12 treatment documents, knowledge gap detection, coverage scoring
- **AI Phone Receptionist** — Vapi-powered voice AI agent, 6 call flows, booking conversion tracking, after-hours handling
- **Intelligence Dashboard Pages** — 9 full dashboard pages: Pricing AI, P&L, Schedule Optimizer, Inventory, Social AI, Meta Ads AI, Consult Co-pilot, Knowledge Base, Phone Agent
