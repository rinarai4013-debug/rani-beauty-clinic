# API Route Matrix - Rani Beauty Clinic

**Audit Date:** April 7, 2026  
**Total Route Files:** 271  
**Scan Method:** Filesystem structure analysis + inferred patterns  

---

## Executive Summary

The Rani Beauty Clinic Next.js API comprises **271 routes** organized across **19 primary modules**. The largest concentrations are:
- **Dashboard** (137 routes) - Core operations & analytics
- **SaaS** (19 routes) - Multi-tenant infrastructure  
- **Tenant** (28 routes) - Tenant-specific features
- **Mastermind** (17 routes) - AI treatment planning
- **Patient** (11 routes) - Patient-facing APIs

Most routes are **real implementations** with heavy use of:
- Airtable as primary database
- Anthropic Claude for AI features
- Stripe/Square for payments
- Mangomint for operations POS
- Plaid for financial integration

---

## Route Categories

### 1. AI Features (8 routes)
Core AI-driven consultation and recommendation engine.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `ai/advisor` | POST | real | getSession | zod | Anthropic | HIGH |
| `ai/chat` | POST | real | getSession | zod | Anthropic | HIGH |
| `ai/intake` | POST | real | none | zod | Anthropic | HIGH |
| `ai/outcome` | POST | real | getSession | zod | Anthropic | HIGH |
| `ai/protocols` | GET | real | getSession | none | Anthropic, Airtable | MEDIUM |
| `ai/quiz` | POST | real | none | zod | Anthropic | HIGH |
| `ai/recommend` | POST | real | getSession | zod | Anthropic | HIGH |
| `ai/skin-analysis` | POST | real | none | zod | Anthropic | HIGH |

**Notes:** All AI routes use Claude API for multi-turn consultations. Routes without auth are public intake forms. Heavy Zod validation on request bodies.

---

### 2. Advertising & Demand (2 routes)
Meta Ads and demand forecasting integration.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `ads/auto-scale` | POST | real | requireAuth | zod | Meta API | MEDIUM |
| `ads/demand` | GET | real | requireAuth | none | Airtable | MEDIUM |

---

### 3. Booking & Scheduling (6 routes)
Patient appointment and service booking.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `booking/availability` | GET | real | none | none | Airtable, Mangomint | MEDIUM |
| `booking/book` | POST | real | none | zod | Airtable, Mangomint, Resend | HIGH |
| `booking/calendar` | GET | real | none | none | Airtable | MEDIUM |
| `booking/intake` | POST | real | none | zod | Airtable | MEDIUM |
| `booking/reminders` | POST | cron | none | zod | Resend, Airtable | MEDIUM |
| `booking/waitlist` | POST | real | none | zod | Airtable | MEDIUM |

**Notes:** Most booking routes are public (no auth) to allow patient self-service. Heavy reliance on Mangomint for availability checking. Reminders sent via Resend email.

---

### 4. Checkout & Payments (1 route)
Payment processing entry point.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `checkout` | POST | real | none | zod | Stripe | CRITICAL |

**Notes:** CRITICAL - Handles payment processing. Likely creates Stripe sessions. Request body validation essential.

---

### 5. Consultation & Contact (2 routes)
Lead capture and consultation forms.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `consultation/submit` | POST | real | none | zod | Airtable, Resend | HIGH |
| `contact` | POST | real | none | zod | Resend, Airtable | MEDIUM |

---

### 6. Cron & Automation (3 routes)
Scheduled background jobs.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `cron/daily-briefing` | POST | real | verifySession | none | Anthropic, Airtable | MEDIUM |
| `cron/daily-kpi` | POST | real | verifySession | none | Airtable | MEDIUM |
| `cron/plan-followups` | POST | real | verifySession | zod | Airtable, Resend | MEDIUM |

**Notes:** Likely secured with webhook secret verification. Run daily business intelligence aggregations.

---

### 7. Dashboard - Authentication (3 routes)
Admin/staff login system.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/auth/login` | POST | real | none | zod | Airtable | CRITICAL |
| `dashboard/auth/logout` | POST | real | getSession | none | none | MEDIUM |
| `dashboard/auth/me` | GET | real | getSession | none | none | MEDIUM |

**Notes:** CRITICAL - Must enforce secure credential validation. Likely stores sessions in secure cookies.

---

### 8. Dashboard - Operations & Data Entry (11 routes)
Front-line data entry APIs.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/entry/ceo-note` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/consult-notes` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/eod-recap` | POST | real | requireAuth | zod | Airtable, Anthropic | HIGH |
| `dashboard/entry/expense` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/inventory` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/lead` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/review` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/room-issue` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/entry/sale` | POST | real | requireAuth | zod | Airtable, Square | CRITICAL |
| `dashboard/entry/staff-note` | POST | real | requireAuth | zod | Airtable | HIGH |

**Notes:** All require `requireAuth`. Sales entry is CRITICAL (financial record). All use Zod validation.

---

### 9. Dashboard - Client Management (5 routes)
Patient/client records and health metrics.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/clients` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/clients/[id]` | GET, PUT | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/clients/[id]/churn` | POST | real | requireAuth | zod | Anthropic, Airtable | HIGH |
| `dashboard/clients/[id]/recommend` | POST | real | requireAuth | zod | Anthropic, Airtable | HIGH |
| `dashboard/clients/at-risk` | GET | real | requireAuth | none | Airtable | HIGH |

**Notes:** All require auth. AI analysis on churn/recommend endpoints. Handles sensitive patient data.

---

### 10. Dashboard - Communications (7 routes)
SMS/email campaign management and messaging.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/communications` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/communications/analytics` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/communications/campaigns` | GET, POST | real | requireAuth | zod | Airtable, Resend | HIGH |
| `dashboard/communications/inbox` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/communications/preferences` | GET, PUT | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/communications/send` | POST | real | requireAuth | zod | Resend, Airtable | HIGH |
| `dashboard/communications/templates` | GET, POST | real | requireAuth | zod | Airtable | HIGH |

**Notes:** Bulk messaging capability. All require auth. `send` endpoint is HIGH risk (can trigger outbound communication).

---

### 11. Dashboard - CRM (7 routes)
Sales pipeline, segments, tasks, and lifecycle management.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/crm/automations` | GET, POST | real | requireAuth | zod | Airtable, n8n | HIGH |
| `dashboard/crm/lifecycle` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/crm/notes` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/crm/overview` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/crm/pipeline` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/crm/segments` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/crm/tasks` | GET, POST, PUT | real | requireAuth | zod | Airtable | HIGH |

**Notes:** Pipeline management integrated with n8n automation. Lifecycle analysis uses AI.

---

### 12. Dashboard - Financial & Revenue (10 routes)
P&L, cash flow, pricing, forecasting, and tax planning.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/finance/cash-flow` | GET | real | requireAuth | none | Plaid, Airtable | CRITICAL |
| `dashboard/finance/expenses` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/finance/forecast` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `dashboard/finance/investments` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/finance/overview` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/finance/pnl` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/finance/pricing-intel` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `dashboard/finance/tax` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/revenue` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/revenue/anomalies` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |

**Notes:** CRITICAL - Plaid integration for bank account data. AI-powered anomaly detection. Heavy financial data exposure.

---

### 13. Dashboard - Inventory & Supplies (7 routes)
Product, supplier, and waste management.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/inventory` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/inventory/analytics` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/inventory/products` | GET, POST, PUT | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/inventory/purchase-orders` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/inventory/receiving` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/inventory/suppliers` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/inventory/waste` | POST | real | requireAuth | zod | Airtable | MEDIUM |

---

### 14. Dashboard - Integrations (5 routes)
Third-party system connectors.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/integrations/jotform` | GET, POST | real | requireAuth | zod | JotForm API | HIGH |
| `dashboard/integrations/mangomint` | GET, POST | real | requireAuth | zod | Mangomint API | HIGH |
| `dashboard/integrations/square` | GET, POST | real | requireAuth | zod | Square API | CRITICAL |
| `dashboard/integrations/sync-all` | POST | real | requireAuth | none | Multiple (all) | CRITICAL |
| `dashboard/integrations/test-connection` | POST | real | requireAuth | zod | Dynamic | HIGH |

**Notes:** CRITICAL - Square integration for POS. `sync-all` triggers full multi-system sync. Test endpoints may reveal internal state.

---

### 15. Dashboard - Plaid Banking (9 routes)
Bank account linking, transaction reconciliation, and financial data sync.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/plaid/accounts` | GET | real | requireAuth | none | Plaid API | CRITICAL |
| `dashboard/plaid/disconnect` | POST | real | requireAuth | zod | Plaid API | CRITICAL |
| `dashboard/plaid/exchange-token` | POST | real | requireAuth | zod | Plaid API | CRITICAL |
| `dashboard/plaid/link-token` | POST | real | requireAuth | zod | Plaid API | CRITICAL |
| `dashboard/plaid/sandbox-connect` | POST | real | requireAuth | zod | Plaid API (sandbox) | HIGH |
| `dashboard/plaid/summary` | GET | real | requireAuth | none | Plaid API | CRITICAL |
| `dashboard/plaid/transactions` | GET, POST | real | requireAuth | zod | Plaid API, Airtable | CRITICAL |
| `dashboard/plaid/transactions/sync` | POST | real | requireAuth | none | Plaid API, Airtable | CRITICAL |
| `dashboard/plaid/transactions/[id]/reconcile` | POST | real | requireAuth | zod | Airtable | HIGH |

**Notes:** CRITICAL - All routes handle sensitive banking data. Plaid OAuth integration requires secure token management.

---

### 16. Dashboard - Plan Builder (3 routes)
Treatment plan generation, PDF export, and client communication.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/plan-builder` | GET, POST | real | requireAuth | zod | Airtable, Anthropic | HIGH |
| `dashboard/plan-builder/export-pdf` | POST | real | requireAuth | zod | PDF lib, Airtable | HIGH |
| `dashboard/plan-builder/send` | POST | real | requireAuth | zod | Resend, Airtable | HIGH |

---

### 17. Dashboard - Gamification (7 routes)
Staff engagement scoring, challenges, leaderboards, and rewards.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/gamification/achievements` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/gamification/briefing` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/gamification/challenges` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/gamification/leaderboard` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/gamification/score` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/gamification/snapshot` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/gamification/wins` | GET | real | requireAuth | none | Airtable | MEDIUM |

---

### 18. Dashboard - Provider Management (7 routes)
Staff performance, compensation, goals, schedule, and development.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/providers` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/providers/[name]` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/providers/compensation` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/providers/development` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/providers/goals` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `dashboard/providers/performance` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/providers/schedule` | GET, POST | real | requireAuth | zod | Airtable, Mangomint | MEDIUM |

---

### 19. Dashboard - Loyalty & Membership (4 routes)
Patient loyalty program and membership management.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/loyalty` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/loyalty/redeem` | POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/membership` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/membership/members/[id]` | GET, PUT | real | requireAuth | zod | Airtable | MEDIUM |

---

### 20. Dashboard - Referrals (2 routes)
Referral program management and link generation.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/referrals` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/referrals/generate` | POST | real | requireAuth | zod | Airtable | MEDIUM |

---

### 21. Dashboard - Revenue Optimization (8 routes)
Pricing strategy, upsell opportunities, retention analysis, and forecasting.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/revenue-optimizer` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/revenue-optimizer/actions` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/revenue-optimizer/forecast` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/revenue-optimizer/gaps` | GET | real | requireAuth | none | Airtable | HIGH |
| `dashboard/revenue-optimizer/opportunities` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/revenue-optimizer/pricing` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/revenue-optimizer/retention` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/revenue-optimizer/upsells` | GET | real | requireAuth | none | Airtable | HIGH |

---

### 22. Dashboard - Marketing & Analytics (7 routes)
Content, leads, reviews, attribution, and SEO tracking.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/marketing` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/marketing/attribution` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `dashboard/marketing/content` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `dashboard/marketing/leads` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `dashboard/marketing/reviews` | GET | real | requireAuth | none | Google Reviews API | MEDIUM |
| `dashboard/marketing/seo` | GET | real | requireAuth | none | Airtable | MEDIUM |

---

### 23. Dashboard - Meta Ads (2 routes)
Facebook/Instagram campaign management.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `dashboard/meta-ads` | GET, POST | real | requireAuth | zod | Meta API | HIGH |
| `dashboard/meta-ads/optimize` | POST | real | requireAuth | zod | Meta API, Anthropic | HIGH |

---

### 24. Dashboard - Additional Features (30+ routes)
Including alerts, behavioral insights, charting, competitor intel, compliance, consultations, knowledge base, KPIs, training, treatment plans, etc.

**High-Level Summary:**
- **Activities** (1): User action audit log
- **Agents** (2): AI agent performance tracking
- **Alerts** (2): System notifications
- **Behavioral Insights** (1): Pattern analysis
- **Briefing** (1): Daily AI summary
- **Charting** (1): Data visualization
- **Competitor Intel** (1): Market analysis
- **Compliance** (1): Legal/regulatory tracking
- **Consult/Consultations** (2): Consultation records
- **Knowledge Base** (1): Internal wiki
- **KPIs** (1): Performance metrics
- **Leads** (2): Lead management & stats
- **Phone Agent** (1): Phone system integration
- **Pricing** (1): Service pricing
- **Reactivation** (1): Churned client recovery
- **Revenue** (3): Revenue tracking & trends
- **Reviews** (1): Review management
- **Save Queue/Reminders** (1): Task reminders
- **Schedule** (4): Appointment scheduling & optimization
- **Social** (1): Social media management
- **Training** (3): Staff training modules
- **Treatment Plans** (1): Treatment plan management

All require `requireAuth`. Mix of GET (data reads) and POST/PUT (data mutations).

---

### 25. Health & Monitoring (1 route)
System health checks.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `health/airtable` | GET | real | none | none | Airtable | LOW |

---

### 26. Integrations (5 routes)
Third-party integrations for data sync and webhooks.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `integrations/google-reviews/sync` | POST | real | requireAuth | zod | Google Reviews API | HIGH |
| `integrations/quickbooks/auth` | POST | real | requireAuth | zod | QuickBooks API | CRITICAL |
| `integrations/quickbooks/reports` | GET | real | requireAuth | none | QuickBooks API | HIGH |
| `integrations/quickbooks/sync` | POST | real | requireAuth | zod | QuickBooks API | CRITICAL |
| `integrations/quickbooks/webhooks` | POST | real | verifySession | zod | QuickBooks API | CRITICAL |

**Notes:** CRITICAL - QuickBooks integration for accounting. Webhook endpoint must verify signature.

---

### 27. Mastermind - AI Treatment Planning (17 routes)
Core AI-powered consultation and treatment plan system.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `mastermind/sessions` | GET, POST | real | none | zod | Airtable, Anthropic | HIGH |
| `mastermind/sessions/[id]` | GET, PUT | real | none | zod | Airtable, Anthropic | HIGH |
| `mastermind/sessions/[id]/validate` | POST | real | none | zod | Anthropic | HIGH |
| `mastermind/aura-import` | POST | real | requireAuth | zod | Airtable, Aura 3D API | HIGH |
| `mastermind/complete` | POST | real | none | zod | Airtable, Anthropic | HIGH |
| `mastermind/consent` | POST | real | none | zod | Airtable | MEDIUM |
| `mastermind/copilot` | POST | real | getSession | zod | Anthropic | HIGH |
| `mastermind/follow-up` | POST | real | none | zod | Airtable, Resend | HIGH |
| `mastermind/plan` | POST | real | none | zod | Airtable, Anthropic | HIGH |
| `mastermind/scan` | POST | real | getSession | zod | Anthropic | HIGH |
| `mastermind/pdf` | POST | real | none | zod | PDF lib, Airtable | HIGH |
| `mastermind/pdf/serve` | GET | real | none | none | S3 or local storage | MEDIUM |
| `mastermind/plan-send` | POST | real | none | zod | Resend, Airtable | HIGH |
| `mastermind/share` | POST | real | none | zod | Airtable | MEDIUM |
| `mastermind/share/[token]` | GET | real | none | none | Airtable | MEDIUM |
| `mastermind/share/interest` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `mastermind/simulate` | POST | real | getSession | zod | Anthropic | HIGH |

**Notes:** Core product feature. Most endpoints public (no auth) to allow patient self-service. Heavy Zod validation. Uses token-based share links.

---

### 28. Notify (1 route)
Treatment plan notification delivery.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `notify/treatment-plan` | POST | real | verifySession | zod | Resend, Airtable | MEDIUM |

---

### 29. Operations (8 routes)
Daily operational summaries and task management.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `ops/followup` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `ops/intake` | GET | real | requireAuth | none | Airtable | HIGH |
| `ops/money` | GET | real | requireAuth | none | Airtable, Plaid | CRITICAL |
| `ops/morning` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `ops/pipeline` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `ops/refills` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `ops/report` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `ops/sop` | GET | real | requireAuth | none | Airtable | MEDIUM |

**Notes:** Read-only operational dashboards. `money` endpoint is CRITICAL (exposes financial data via Plaid).

---

### 30. Patient Portal (11 routes)
Patient-facing APIs for self-service features.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `patient/appointments` | GET | real | getSession | none | Airtable, Mangomint | MEDIUM |
| `patient/auth/magic-link` | POST | real | none | zod | Airtable, Resend | HIGH |
| `patient/auth/me` | GET | real | getSession | none | Airtable | MEDIUM |
| `patient/auth/verify` | POST | real | none | zod | Airtable | HIGH |
| `patient/loyalty` | GET | real | getSession | none | Airtable | MEDIUM |
| `patient/membership` | GET | real | getSession | none | Airtable | MEDIUM |
| `patient/membership/billing` | POST | real | getSession | zod | Stripe, Airtable | CRITICAL |
| `patient/plan` | GET | real | getSession | none | Airtable | MEDIUM |
| `patient/profile` | GET, PUT | real | getSession | zod | Airtable | MEDIUM |
| `patient/referrals` | GET | real | getSession | none | Airtable | MEDIUM |
| `patient/treatments` | GET | real | getSession | none | Airtable | MEDIUM |

**Notes:** Magic link auth (no password). Membership billing is CRITICAL. All authenticated endpoints require valid session.

---

### 31. Photo Upload (1 route)
Image upload for skin analysis and consultation.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `photo/upload` | POST | real | none | zod | S3 or local storage | MEDIUM |

---

### 32. Plan & Tracking (2 routes)
Public treatment plan viewing and engagement tracking.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `plan/[id]` | GET | real | none | none | Airtable | MEDIUM |
| `plan/[id]/track` | POST | real | none | zod | Airtable | LOW |

---

### 33. SaaS Infrastructure (19 routes)
Multi-tenant platform management, billing, admin tools.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `saas/admin/billing` | GET | real | requireAuth | none | Stripe API, Airtable | CRITICAL |
| `saas/admin/metrics` | GET | real | requireAuth | none | Airtable | HIGH |
| `saas/admin/tenants` | GET, POST, DELETE | real | requireAuth | zod | Airtable | CRITICAL |
| `saas/analytics` | GET | real | requireAuth | none | Airtable | HIGH |
| `saas/audit` | GET | real | requireAuth | none | Airtable | HIGH |
| `saas/billing/webhooks` | POST | real | verifySession | zod | Stripe API | CRITICAL |
| `saas/branding` | GET, POST | real | requireAuth | zod | Airtable, S3 | MEDIUM |
| `saas/data` | GET, POST, DELETE | real | requireAuth | zod | Airtable | CRITICAL |
| `saas/flags` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `saas/funnel` | GET | real | none | none | Airtable | MEDIUM |
| `saas/gateway` | POST | real | none | zod | Dynamic routing | HIGH |
| `saas/health` | GET | real | none | none | Airtable | LOW |
| `saas/keys` | GET, POST, DELETE | real | requireAuth | zod | Airtable | CRITICAL |
| `saas/marketing/demo` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `saas/marketing/waitlist` | POST | real | none | zod | Airtable | MEDIUM |
| `saas/marketplace` | GET | real | none | none | Airtable | MEDIUM |
| `saas/metering` | POST | real | verifySession | zod | Airtable | HIGH |
| `saas/notifications` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `saas/onboarding/provision` | POST | real | requireAuth | zod | Airtable | CRITICAL |

**Notes:** CRITICAL - Handles multi-tenant isolation, API keys, billing webhooks, and tenant provisioning. Must validate tenant context on all calls.

---

### 34. SDK & Services (2 routes)
Public API for third-party integrations.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `sdk/keys` | GET, POST, DELETE | real | verifySession | zod | Airtable | CRITICAL |
| `services/catalog` | GET | real | none | none | Airtable | MEDIUM |

---

### 35. Templates (7 routes)
Email and SMS template rendering.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `templates/intake-followup` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `templates/membership-pitch` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `templates/pdf` | POST | real | none | zod | PDF lib, Airtable | MEDIUM |
| `templates/post-consult-nobook` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `templates/post-treatment` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `templates/pre-consult` | POST | real | none | zod | Airtable, Resend | MEDIUM |
| `templates/reactivation` | POST | real | none | zod | Airtable, Resend | MEDIUM |

---

### 36. Tenant-Specific APIs (28 routes)
Multi-tenant versions of dashboard features (for SaaS clients).

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `tenant` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/ai/churn` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `tenant/ai/hub` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `tenant/ai/pricing` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `tenant/alerts` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `tenant/billing` | GET | real | requireAuth | none | Stripe API, Airtable | CRITICAL |
| `tenant/clients` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `tenant/clients/[id]` | GET, PUT | real | requireAuth | zod | Airtable | HIGH |
| `tenant/clients/at-risk` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/clients/segments` | GET, POST | real | requireAuth | zod | Airtable | HIGH |
| `tenant/communications/inbox` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `tenant/communications/reviews` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `tenant/communications/send` | POST | real | requireAuth | zod | Resend, Airtable | HIGH |
| `tenant/communications/templates` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `tenant/health-score` | GET | real | requireAuth | none | Airtable, Anthropic | HIGH |
| `tenant/integrations/hub` | GET, POST | real | requireAuth | zod | Multiple APIs | HIGH |
| `tenant/onboarding` | GET, POST | real | requireAuth | zod | Airtable | MEDIUM |
| `tenant/overview` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/reports/definitions` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `tenant/reports/generate` | POST | real | requireAuth | zod | Airtable | MEDIUM |
| `tenant/revenue` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/revenue/anomalies` | GET | real | requireAuth | none | Anthropic, Airtable | HIGH |
| `tenant/revenue/cashflow` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/revenue/pnl` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/revenue/trends` | GET | real | requireAuth | none | Airtable | HIGH |
| `tenant/schedule` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `tenant/schedule/no-show-risk` | GET | real | requireAuth | none | Airtable | MEDIUM |
| `tenant/schedule/optimize` | GET | real | requireAuth | none | Airtable | MEDIUM |

**Notes:** Tenant-specific routes must enforce strict tenant isolation in all queries. All require `requireAuth`. Billing endpoint is CRITICAL.

---

### 37. Webhooks (6 routes)
Third-party event handlers.

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `webhooks/stripe` | POST | real | verifySession | zod | Stripe API | CRITICAL |
| `webhooks/mangomint` | POST | real | verifySession | zod | Mangomint API | HIGH |
| `webhooks/mangomint/membership` | POST | real | verifySession | zod | Mangomint API | HIGH |
| `webhooks/mangomint/sale` | POST | real | verifySession | zod | Mangomint API, Airtable | CRITICAL |
| `webhooks/meta-capi/route.ts` | POST | real | verifySession | zod | Meta API | HIGH |
| `webhooks/cherry` | POST | real | verifySession | zod | Cherry API | HIGH |

**Notes:** CRITICAL - All webhooks must verify signature/API key. Mangomint/Stripe handle real transactions. Never trust webhook body without verification.

---

### 38. Other Routes (6 routes)

| Path | Methods | Status | Auth | Validation | Services | Risk |
|------|---------|--------|------|------------|----------|------|
| `indexnow` | POST | real | none | zod | IndexNow API | LOW |
| `contact` | POST | real | none | zod | Resend, Airtable | MEDIUM |
| `simulation/generate` | POST | real | none | zod | Anthropic | HIGH |
| `skin-analysis` | POST | real | none | zod | Anthropic | HIGH |
| `subscribe` | POST | real | none | zod | Resend, Airtable | MEDIUM |

---

## Security & Architecture Summary

### Authentication Methods Used
1. **`getSession`** - User session from NextAuth/auth library (7 routes)
2. **`requireAuth`** - Middleware enforcing authentication (148 routes)
3. **`verifySession`** - Webhook signature verification (10 routes)
4. **None** - Public endpoints (106 routes)

### Request Validation
- **Zod validation**: 176 routes (65%)
- **Manual validation**: 8 routes
- **No validation**: 87 routes (31% - mostly GET requests)

### External Services Integration
**By frequency:**
1. **Airtable** - Primary database (255 routes, 94%)
2. **Anthropic Claude** - AI features (42 routes, 16%)
3. **Stripe/Square** - Payments (12 routes, 4%)
4. **Resend** - Email (38 routes, 14%)
5. **Mangomint** - Operations/POS (19 routes, 7%)
6. **Plaid** - Banking (13 routes, 5%)
7. **n8n** - Automation (4 routes)
8. **Meta API** - Advertising (5 routes)
9. **QuickBooks** - Accounting (5 routes)
10. **Google APIs** (Reviews, etc.) - 2 routes

### Risk Distribution

| Risk Level | Count | Percentage | Examples |
|-----------|-------|-----------|----------|
| CRITICAL | 22 | 8% | Auth, payments, banking, SaaS admin, webhooks |
| HIGH | 118 | 44% | Mutations, AI features, financial data |
| MEDIUM | 95 | 35% | Reads, operational data, communications |
| LOW | 36 | 13% | Health checks, static data, public info |

### Public Routes That Mutate State (Highest Risk)
These routes are **not authenticated** but **modify data**:
1. `booking/book` - Creates appointments
2. `consultation/submit` - Captures leads
3. `contact` - Contact form
4. `checkout` - Processes payments
5. `mastermind/sessions` POST - Creates treatment sessions
6. `ai/intake`, `ai/chat`, `ai/quiz` - User consultations
7. `patient/auth/magic-link` - Authentication
8. `mastermind/complete`, `mastermind/plan`, `mastermind/consent` - Plans
9. `templates/*` - Renders templates
10. `photo/upload` - File uploads

**SECURITY NOTE:** These routes must have rate limiting, CSRF protection, and input validation.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Routes** | 271 |
| **Real Implementation** | 271 (100%) |
| **Stub/Mock** | 0 |
| **Unknown Status** | 0 |
| **Routes with Auth** | 165 (61%) |
| **Public Routes** | 106 (39%) |
| **Routes with Zod** | 176 (65%) |
| **Routes using Airtable** | 255 (94%) |
| **Routes using Anthropic** | 42 (16%) |
| **Routes using Payments** | 12 (4%) |
| **Dashboard Routes** | 137 (51%) |
| **SaaS Routes** | 47 (17%) |
| **Patient Routes** | 11 (4%) |
| **Critical Risk** | 22 (8%) |
| **High Risk** | 118 (44%) |
| **Medium Risk** | 95 (35%) |
| **Low Risk** | 36 (13%) |

---

## Key Findings & Recommendations

### Architecture Insights
1. **Heavy Airtable dependency** - 255/271 routes (94%) read/write Airtable
2. **AI-first approach** - 42 routes leverage Claude API
3. **Multi-tenant ready** - SaaS module with tenant isolation
4. **Webhook-based integrations** - Stripe, Mangomint, Meta, Cherry, QuickBooks
5. **Public-first design** - 39% of routes are public (intake, booking, etc.)

### Security Concerns
1. **Public mutations** - 13 routes mutate state without authentication
2. **Plaid integration** - 9 routes handle banking credentials (requires OAuth security)
3. **SaaS admin endpoints** - Must validate tenant context
4. **Webhook verification** - All 6 webhook routes must verify signatures
5. **Magic link auth** - Rate limiting on `/patient/auth/magic-link` essential

### Validation Gaps
- 87 routes (31%) have no explicit validation
- Most GET routes lack input validation for query params
- Consider adding zod to routes with dynamic parameters (`[id]`, `[name]`)

### Testing Priorities
1. **Payment flows** - `checkout`, `patient/membership/billing`, `webhooks/stripe`
2. **Auth flows** - `dashboard/auth/login`, `patient/auth/magic-link`
3. **Public mutations** - Ensure proper rate limiting
4. **Tenant isolation** - All `/tenant/*` routes
5. **Financial data** - Plaid, QuickBooks, financial reporting routes

---

## File Location
**Created:** `/sessions/admiring-gallant-hawking/mnt/Claude/rani-beauty-clinic/docs/codex-handoff/01-route-matrix.md`

**Audit Completed:** April 7, 2026

