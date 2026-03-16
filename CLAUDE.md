# Rani Beauty Clinic — Project Context

## Business
- **Name:** Rani Beauty Clinic
- **Type:** Luxury medical aesthetics clinic (physician-supervised medspa)
- **Location:** 401 Olympia Ave NE #101, Renton, WA 98056
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
- **Booking:** Mangomint (app.mangomint.com/876418, CompanyID: 876418, 2,181 clients, booking widget in layout.tsx)
- **Intake Forms:** Typeform (form ID: Ecgz85JA)
- **Client Portal:** Softr (treatment plan viewer)
- **AI:** Anthropic Claude API
- **Styling:** Tailwind CSS, Framer Motion, Recharts
- **Auth:** JWT via jose (HS256), cookie-based sessions

## Airtable Tables (12)
| Table | Accessor | Key Use |
|-------|----------|---------|
| Clients | `Tables.clients()` | CRM — lead status, LTV, segments |
| Client Intakes | `Tables.intakes()` | Typeform submissions + AI analysis |
| Intake Intelligence | `Tables.intakeIntelligence()` | AI-processed intake data |
| Appointments | `Tables.appointments()` | Schedule, utilization, consults |
| Packages | `Tables.packages()` | Treatment packages sold |
| Memberships | `Tables.memberships()` | Monthly membership tracking |
| Transactions | `Tables.transactions()` | Revenue, payments, financing |
| Messages Log | `Tables.messagesLog()` | SMS/email audit trail |
| Reviews | `Tables.reviews()` | Google review tracking + AI responses |
| KPI Snapshots | `Tables.kpis()` | Daily/weekly metric snapshots |
| Alerts | `Tables.alerts()` | System alerts + thresholds |
| Competitor Intelligence | `Tables.competitorIntel()` | Competitor monitoring |

### Client Intakes — Real Field Names (from live Airtable)
These are the ACTUAL field names in the Client Intakes table. n8n workflows MUST use these exact names:
- `First Name`, `Last Name`, `Email`, `Phone`
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
- GLP-1 Weight Loss: $399–599/mo
- Rx Skincare: Tretinoin $99/mo
- Folix Hair Restoration

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
- `/src/hooks/useDashboardData.ts` — SWR hooks for dashboard
- `/src/types/dashboard.ts` — Dashboard TypeScript interfaces
- `/src/types/gamification.ts` — Gamification types
- `/src/types/auth.ts` — Auth types
- `/src/data/dashboard/score-weights.ts` — Score weights + targets

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

## API Routes (39 total)
### Dashboard Routes (30)
- `POST /api/dashboard/auth/login` — JWT login
- `GET /api/dashboard/auth/me` — Current session
- `GET /api/dashboard/kpis` — KPI cards (revenue, bookings, consults, leads)
- `GET /api/dashboard/revenue` — Revenue breakdown by provider/service/category
- `GET /api/dashboard/revenue/trends` — 30-day revenue trend
- `GET /api/dashboard/leads` — Lead funnel stages
- `GET /api/dashboard/leads/stats` — Lead conversion stats
- `GET /api/dashboard/schedule` — Today's appointments
- `GET /api/dashboard/schedule/upcoming` — Next 7 days
- `GET /api/dashboard/alerts` — Active alerts
- `PATCH /api/dashboard/alerts/[id]` — Dismiss/acknowledge alert
- `GET /api/dashboard/gamification/score` — Clinic score from real metrics
- `GET /api/dashboard/gamification/achievements` — Achievement list
- `GET /api/dashboard/gamification/leaderboard` — Provider rankings
- `GET /api/dashboard/clients` — Client list with filters
- `GET /api/dashboard/clients/[id]` — Single client detail
- `GET /api/dashboard/providers` — Provider performance
- `GET /api/dashboard/providers/[name]` — Single provider stats
- `GET /api/dashboard/finance/expenses` — Expense tracking
- `GET /api/dashboard/meta-ads` — Meta Ads performance (30-day)
- 10x `POST /api/dashboard/entry/*` — Data entry forms (lead, sale, expense, etc.)

### AI Routes (3)
- `POST /api/ai/recommend` — AI treatment recommender (3-tier Good/Better/Best plans)
- `POST /api/ai/chat` — AI concierge chatbot (Claude Haiku, lead capture)
- `POST /api/ai/intake` — AI intake intelligence (risk flags, consult scripts)

### Existing (1)
- `POST /api/contact` — Contact form → Resend email + n8n webhook

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

### Webhook-Triggered (5) — Awaiting external registration
- `TpiezScNbp6BeGcv` WF3 — Booking Sync (`/webhook/booking-sync` — Mangomint)
- `XgkCfHilKUeyF0dv` WF6 — Financing (`/webhook/financing-trigger` — Cherry/Stripe)
- `Tis5GeSHkVsk7bys` W16 — Post-Consult Close (`/webhook/postconsult-close-trigger`)
- `mo5nubnsK16sfDgG` W17 — Post-Treatment (`/webhook/post-treatment-trigger` — Mangomint)
- `zHJCkAf0ehhTzOfY` W2 — Document Architect (`/webhook/pdf-generator-trigger`)

### Typeform-Triggered (1)
- `yxKBbrqJHd2jtwnr` Intake to CRM (Typeform submission)

## Scheduled Tasks (7 for Rani)
- `weekly-content-batch` — Sunday 6 AM: Full week's content (IG, Reels, Stories, GBP)
- `weekly-competitor-intel` — Monday 6 AM: 11-competitor scan + trend analysis
- `biweekly-ad-copy-refresh` — 1st & 15th at 7 AM: Meta ad copy variants
- `monthly-reactivation-campaign` — 1st at 7 AM: Lapsed client reactivation
- `daily-review-monitor` — Daily 8 AM: Google review monitoring + draft responses
- `weekly-revenue-report` — Friday 5 PM: Revenue executive summary
- `daily-meta-ads-check` — Daily 9 AM: Ad performance framework + benchmarks

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

### Multi-Tenant Architecture Path
1. Replace hardcoded Airtable base ID with per-tenant config
2. Move service/pricing data from code to Airtable "Clinic Config" table
3. Add tenant ID to JWT session payload
4. Parameterize n8n workflows (base URL, credentials per tenant)
5. White-label: Replace Rani branding with tenant config (colors, logo, name)

### Sellable Components
- **AI Prompt Library** — 18 Claude prompts for med spa operations (intake analysis, treatment recs, consult scripts, reactivation messaging, review responses)
- **Dashboard Template** — Gamified operations dashboard with RBAC, KPIs, real-time schedule, lead funnel
- **Automation Suite** — 19 n8n workflow templates (intake→CRM, lead response, follow-up ladders, review requests)
- **Content Engine** — Automated weekly content batch generation (IG, Reels, Stories, GBP posts)
- **Competitor Intelligence** — Automated weekly competitive scanning + briefing
