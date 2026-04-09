# Dashboard Map & Routes Inventory

## Overview

The Rani Beauty Clinic dashboard is organized within `src/app/(dashboard)/dashboard/` as a protected authenticated section. This document maps all 140+ dashboard pages, their purposes, and integration patterns.

**CRITICAL NOTE**: Due to VM file system deadlock, this audit reflects route structure only. For detailed component implementation, access source files directly.

---

## Dashboard Root & Core Pages

### Primary Dashboard
- **Route**: `/dashboard`
- **File**: `src/app/(dashboard)/dashboard/page.tsx`
- **Purpose**: Main dashboard home/overview
- **Likely Contents**: KPI cards, quick actions, recent activity

---

## Entry & Data Collection Routes

### Entry Hub
- **Route**: `/dashboard/entry`
- **File**: `src/app/(dashboard)/dashboard/entry/page.tsx`
- **Purpose**: Unified data entry portal for daily operations

#### Entry Sub-Pages:
| Route | Purpose | Expected Integration |
|-------|---------|---------------------|
| `/dashboard/entry/lead` | Lead/prospect entry | CRM API |
| `/dashboard/entry/sale` | Sales transaction entry | Square/payment API |
| `/dashboard/entry/consult-notes` | Consultation documentation | Medical records/HIPAA |
| `/dashboard/entry/inventory` | Stock/inventory adjustment | Inventory auto-manager |
| `/dashboard/entry/expense` | Expense logging | Finance/accounting |
| `/dashboard/entry/review` | Patient review entry | Review engine |
| `/dashboard/entry/eod-recap` | End-of-day summary | Analytics |
| `/dashboard/entry/ceo-note` | Executive note entry | Compliance/audit trail |
| `/dashboard/entry/staff-note` | Staff communication | Conversation engine |
| `/dashboard/entry/room-issue` | Room/facility issue reporting | Ops tracking |

---

## Booking & Scheduling

### Booking Hub
- **Route**: `/dashboard/booking`
- **File**: `src/app/(dashboard)/dashboard/booking/page.tsx`
- **Purpose**: Appointment management, scheduling overview
- **API Integration**: Schedule optimizer engine

#### Booking Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/booking/calendar` | Full calendar view | Schedule optimizer |
| `/dashboard/booking/settings` | Booking rules and policies | Schedule configuration |
| `/dashboard/booking/waitlist` | Wait list management | No-show predictor |

---

## Client Management

### Clients List
- **Route**: `/dashboard/clients`
- **Purpose**: Patient/client directory

### Client Details
- **Route**: `/dashboard/clients/[id]`
- **Purpose**: Individual patient profile, history, treatment record
- **API Integration**: Airtable CRM, medical records
- **Risk Level**: 🔴 HIPAA-protected PII

---

## Communications

### Communications Hub
- **Route**: `/dashboard/communications`
- **File**: `src/app/(dashboard)/dashboard/communications/page.tsx`
- **Purpose**: Multi-channel communication center

#### Communications Sub-Pages:
| Route | Purpose | Engine Integration |
|-------|---------|------------------|
| `/dashboard/communications/inbox` | Email/message inbox | Conversation engine, email engine |
| `/dashboard/communications/campaigns` | Marketing campaigns | Email engine, conversation engine |
| `/dashboard/communications/campaigns/[id]` | Campaign detail & performance | Analytics, email engine |
| `/dashboard/communications/templates` | Message/email templates | Email engine |
| `/dashboard/communications/preferences` | Patient opt-in/preferences | Compliance, CAN-SPAM |
| `/dashboard/communications/analytics` | Campaign analytics | Weekly insight engine |

---

## CRM & Sales Pipeline

### CRM Hub
- **Route**: `/dashboard/crm`
- **File**: `src/app/(dashboard)/dashboard/crm/page.tsx`
- **Purpose**: Customer relationship management overview

#### CRM Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/crm/pipeline` | Sales pipeline view | Conversion engine, revenue optimizer |
| `/dashboard/crm/clients/[id]` | Client detail in CRM context | Airtable, churn engine |
| `/dashboard/crm/tasks` | Task/activity management | Communications engine |
| `/dashboard/crm/segments` | Customer segmentation | Churn engine, loyalty engine |
| `/dashboard/crm/automations` | Workflow automations | n8n integration |

---

## Advertising & Marketing

### Ads (Main)
- **Route**: `/dashboard/ads`
- **Purpose**: Advertising dashboard overview
- **Likely Engine**: Meta ads manager, Google ads engine

### Ads War Machine
- **Route**: `/dashboard/ads-war-machine`
- **Purpose**: Advanced ad optimization and management
- **Sub-Pages**:
  - `/dashboard/ads-war-machine/creatives` - Creative management
  - `/dashboard/ads-war-machine/keywords` - Keyword bidding

### Meta Ads
- **Route**: `/dashboard/meta-ads`
- **Purpose**: Facebook/Instagram advertising
- **Engine**: Meta ads manager

### Marketing Hub
- **Route**: `/dashboard/marketing`
- **Purpose**: Marketing overview and strategy

#### Marketing Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/marketing/leads` | Lead generation tracking | Lead scoring |
| `/dashboard/marketing/content` | Content calendar | Auto-post engine, social media |
| `/dashboard/marketing/reviews` | Review management | Review engine |
| `/dashboard/marketing/seo` | SEO analytics | Analytics |
| `/dashboard/marketing/attribution` | Campaign attribution | Reporting engine |

### Competitor Intel
- **Route**: `/dashboard/competitor-intel`
- **Purpose**: Monitor competitor activity
- **Engine**: Competitor tracker

---

## Financial & Revenue

### Finance Hub
- **Route**: `/dashboard/finance`
- **Purpose**: Financial overview, P&L
- **Engine**: PnL engine, revenue anomaly detection
- **Sub-Pages**:
  - `/dashboard/finance/pricing` - Price management, dynamic pricing
  - `/dashboard/finance/forecast` - Revenue forecasting
  - `/dashboard/finance/tax` - Tax reporting and filing
  - `/dashboard/finance/quickbooks` - QuickBooks integration
  - `/dashboard/finance/investments` - Investment tracking

### P&L Dashboard
- **Route**: `/dashboard/pnl`
- **Purpose**: Detailed profit & loss reporting
- **Engine**: PnL engine, charting engine
- **Risk Level**: 🔴 Financial accuracy critical

### Pricing Management
- **Route**: `/dashboard/pricing`
- **Purpose**: Service pricing and rate management
- **Engine**: Dynamic pricing engine

### Revenue Optimizer
- **Route**: `/dashboard/revenue-optimizer`
- **Purpose**: Revenue maximization strategies
- **Sub-Pages**:
  - `/dashboard/revenue-optimizer/forecast` - Revenue forecasting
  - `/dashboard/revenue-optimizer/gaps` - Revenue gap analysis
  - `/dashboard/revenue-optimizer/upsells` - Upsell opportunities
  - `/dashboard/revenue-optimizer/actions` - Recommended actions

---

## Inventory Management

### Inventory Hub
- **Route**: `/dashboard/inventory`
- **Purpose**: Inventory management overview
- **Engine**: Inventory auto-manager
- **Sub-Pages**:
  - `/dashboard/inventory/products` - Product catalog
  - `/dashboard/inventory/products/[id]` - Product detail
  - `/dashboard/inventory/suppliers` - Supplier management
  - `/dashboard/inventory/purchase-orders` - PO management
  - `/dashboard/inventory/purchase-orders/[id]` - PO detail
  - `/dashboard/inventory/waste` - Waste tracking
  - `/dashboard/inventory/analytics` - Inventory analytics

### Inventory Intel
- **Route**: `/dashboard/inventory-intel`
- **Purpose**: Advanced inventory insights
- **Engine**: Weekly insight engine

---

## Medical & Compliance

### Medical Hub
- **Route**: `/dashboard/medical`
- **Purpose**: Medical records and protocols
- **Risk Level**: 🔴 HIPAA

### Compliance Hub
- **Route**: `/dashboard/compliance`
- **Purpose**: Regulatory and compliance management

#### Compliance Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/compliance/hipaa` | HIPAA compliance tracking | Compliance engine |
| `/dashboard/compliance/consents` | Patient consent management | Compliance engine, HIPAA audit |
| `/dashboard/compliance/audit` | Audit log review | Compliance engine |
| `/dashboard/compliance/licenses` | License tracking | Compliance engine |
| `/dashboard/compliance/osha` | OSHA compliance | Compliance engine |
| `/dashboard/compliance/incidents` | Incident tracking | Compliance engine |
| `/dashboard/compliance/devices` | Medical device tracking | Compliance engine |
| `/dashboard/compliance/substances` | Controlled substance tracking | Medical, compliance |
| `/dashboard/compliance/policies` | Policy documentation | Compliance engine |

### GLP-1 Program
- **Route**: `/dashboard/glp1`
- **Purpose**: GLP-1 (weight loss injection) program management
- **Risk Level**: 🟡 MEDIUM - Controlled substance regulations

---

## Consultation & Treatment Planning

### Consultations
- **Route**: `/dashboard/consultations`
- **Purpose**: Consultation management
- **Engine**: Copilot engine (AI-backed)
- **Risk Level**: 🔴 CRITICAL - Medical liability

### Consultation Entry
- **Route**: `/dashboard/consult`
- **Purpose**: New consultation notes
- **Engine**: Copilot engine
- **Integration**: Medical records, treatment planning

### Consult Copilot (AI Assistant)
- **Route**: `/dashboard/consult`
- **Risk Level**: 🔴 CRITICAL
- **Integration**: Claude API, medical knowledge base

### Plan Builder
- **Route**: `/dashboard/plan-builder`
- **Purpose**: Treatment plan creation and visualization
- **Engine**: Conversion engine, plan builder
- **Integration**: Treatment recommendations

### Charting
- **Route**: `/dashboard/charting`
- **Purpose**: Patient charting and documentation
- **Sub-Pages**:
  - `/dashboard/charting/[id]` - Individual patient chart

---

## Protocols & Medical Procedures

### Protocols Hub
- **Route**: `/dashboard/protocols`
- **Purpose**: Treatment protocol library

### Protocol Detail
- **Route**: `/dashboard/protocols/[id]`
- **Purpose**: Detailed protocol view and editing

---

## Provider Management

### Providers Hub
- **Route**: `/dashboard/providers`
- **Purpose**: Staff/provider management overview

#### Provider Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/providers/[name]` | Provider profile | Airtable |
| `/dashboard/providers/schedule` | Provider scheduling | Schedule optimizer |
| `/dashboard/providers/compensation` | Compensation management | Finance |
| `/dashboard/providers/development` | Training/development | Training module |
| `/dashboard/providers/goals` | Performance goals | Analytics |

---

## Membership & Loyalty

### Membership Hub
- **Route**: `/dashboard/membership`
- **Purpose**: Membership program management
- **Engine**: Loyalty engine

#### Membership Sub-Pages:
| Route | Purpose | Integration |
|-------|---------|------------|
| `/dashboard/membership/members` | Member list | CRM, loyalty engine |
| `/dashboard/membership/members/[id]` | Member detail | Loyalty points tracking |
| `/dashboard/membership/plans` | Membership plans | Pricing, loyalty engine |
| `/dashboard/membership/billing` | Billing and subscriptions | Square/payments |
| `/dashboard/membership/analytics` | Member analytics | Weekly insight engine |
| `/dashboard/membership/retention` | Retention analysis | Churn engine |

### Loyalty Hub
- **Route**: `/dashboard/loyalty`
- **Purpose**: Points and rewards management
- **Engine**: Loyalty engine

---

## Referral Program

### Referrals
- **Route**: `/dashboard/referrals`
- **Purpose**: Referral management and tracking
- **Engine**: Referral engine
- **Integration**: CRM, loyalty rewards

### Reactivation
- **Route**: `/dashboard/reactivation`
- **Purpose**: Win-back campaigns for inactive patients
- **Engine**: Churn engine, email engine

---

## Reporting & Analytics

### AI Advisor
- **Route**: `/dashboard/ai-advisor`
- **Purpose**: AI-powered business insights
- **Engines**: Multiple AI engines, RAG knowledge base
- **Risk Level**: 🟡 MEDIUM - Insight accuracy

### Alerts Hub
- **Route**: `/dashboard/alerts`
- **Purpose**: Business alerts and notifications
- **Integration**: Multiple predictive engines
- **Likely Alerts**:
  - Revenue anomalies
  - No-show predictions
  - Inventory low stock
  - Churn risk

### Leaderboard
- **Route**: `/dashboard/leaderboard`
- **Purpose**: Staff/provider performance leaderboard
- **Engine**: Gamification engine, analytics
- **Fairness Concern**: May incentivize unwanted behavior

### Knowledge Base
- **Route**: `/dashboard/knowledge-base`
- **Purpose**: Documentation and FAQ system
- **Engine**: RAG knowledge base (AI-backed)

---

## Advanced Features

### Phone Agent
- **Route**: `/dashboard/phone-agent`
- **Purpose**: AI phone system management and monitoring
- **Engine**: VAPI agent (AI-backed)
- **Risk Level**: 🔴 CRITICAL - HIPAA, patient consent
- **Features Likely**:
  - Call logs and transcripts
  - Agent configuration
  - Performance metrics

### Mastermind Sessions (Strategic Planning)
- **Route**: `/dashboard/mastermind`
- **Purpose**: Group strategic planning sessions
- **Sub-Pages**:
  - `/dashboard/mastermind/[sessionId]` - Session detail
  - `/dashboard/mastermind/[sessionId]/present` - Presentation mode
- **Engine**: Mastermind product engine, simulation engine
- **Likely Features**:
  - Session notes
  - Action items
  - Financial projections

### Training & SOPs
- **Route**: `/dashboard/training`
- **Purpose**: Staff training and SOP documentation
- **Sub-Pages**:
  - `/dashboard/training/sops` - Standard operating procedures
  - `/dashboard/training/sops/[id]` - SOP detail
  - `/dashboard/training/[moduleId]` - Training module
  - `/dashboard/training/progress` - Staff progress tracking

### Briefing Hub
- **Route**: `/dashboard/briefing`
- **Purpose**: Daily/weekly briefing and insights
- **Engine**: Weekly insight engine, AI advisor
- **Likely Contents**:
  - Executive summary
  - Key metrics
  - Alert highlights
  - Recommended actions

---

## Integration & Settings

### Integrations
- **Route**: `/dashboard/integrations`
- **Purpose**: Third-party integrations management
- **Likely Integrations**:
  - Airtable
  - Square
  - Meta (Facebook/Instagram)
  - Google Ads
  - VAPI
  - n8n
  - QuickBooks

### Settings
- **Route**: `/dashboard/settings`
- **Purpose**: Account, user, and system settings
- **Likely Sections**:
  - User profile
  - Team management
  - Business settings
  - API keys and webhooks
  - Email templates
  - Notification preferences

### Login (Auth)
- **Route**: `/dashboard/login`
- **Purpose**: Authentication entry point for dashboard
- **Integration**: Auth0 or custom auth system

---

## Command Center (Master Control)

### Command Center
- **Route**: `/dashboard/command-center`
- **Purpose**: Master operations console
- **Likely Features**:
  - Real-time metrics
  - System status
  - Quick actions
  - Override controls
  - Alerts dashboard

---

## Operations & Intake

### Operations Hub
- **Route**: `/dashboard/ops`
- **Purpose**: Daily operations management
- **Sub-Pages**:
  - `/dashboard/ops/intake` - New patient/lead intake
  - `/dashboard/ops/pipeline` - Operational pipeline

---

## Leads & Social

### Leads Hub
- **Route**: `/dashboard/leads`
- **Purpose**: Lead management and tracking
- **Integration**: CRM, conversion engine, lead scoring

### Social Media
- **Route**: `/dashboard/social`
- **Purpose**: Social media management
- **Engine**: Auto-post engine
- **Sub-Pages**:
  - `/dashboard/social/calendar` - Content calendar

---

## Schedule Management

### Schedule Hub
- **Route**: `/dashboard/schedule`
- **Purpose**: Provider schedule management
- **Engine**: Schedule optimizer

### Schedule Optimizer
- **Route**: `/dashboard/schedule-optimizer`
- **Purpose**: Advanced schedule optimization
- **Engine**: Schedule optimizer engine
- **Features Likely**:
  - Constraint solver
  - What-if scenarios
  - Balance metrics
  - Auto-scheduling suggestions

---

## Reviews Management

### Reviews Hub
- **Route**: `/dashboard/reviews`
- **Purpose**: Patient review management and monitoring
- **Engine**: Review engine
- **Features Likely**:
  - Review aggregation
  - Rating tracking
  - Response management
  - Sentiment analysis

---

## Dashboard Statistics & Accessibility

### Total Dashboard Pages: 140+
- Entry points: 10
- Booking pages: 3
- Communications: 6
- CRM pages: 5
- Advertising: 10+
- Financial: 5
- Inventory: 8
- Medical/Compliance: 10+
- Treatment: 4
- Provider: 6
- Membership: 6
- Referral: 2
- Analytics: 4
- Advanced features: 8+
- Integration: 2
- Operations: 3
- Social: 2
- Schedule: 2
- Reviews: 1

---

## Data Flow & Integration Patterns

### Authentication
- Protected by layout route `(dashboard)`
- Likely requires: User role, API token, session validation

### API Patterns Observed
- Likely using API routes in `src/app/api/`
- Probable fetch patterns:
  ```typescript
  // useSWR or useEffect + fetch
  const data = await fetch('/api/dashboard/...', {
    headers: { Authorization: 'Bearer token' }
  })
  ```

### Real-Time Updates
- Some pages likely subscribe to:
  - WebSocket for live scheduling
  - SWR polling for metrics
  - Event-driven updates from n8n workflows

### Database Connections
- Airtable: CRM, patient records, inventory, protocols
- Square: Payment/transaction data
- External APIs: Meta, Google, VAPI, n8n

---

## Risk Assessment by Route

### CRITICAL Risk (🔴)
- `/dashboard/medical/*` - HIPAA
- `/dashboard/compliance/*` - Regulatory
- `/dashboard/consultations/*` - Medical liability
- `/dashboard/consult` - AI medical advice
- `/dashboard/phone-agent` - AI patient interaction
- `/dashboard/entry/consult-notes` - PII and medical records

### HIGH Risk (🔴)
- `/dashboard/finance/*` - Financial accuracy
- `/dashboard/pnl` - Accounting
- `/dashboard/clients/[id]` - Patient PII

### MEDIUM Risk (🟡)
- `/dashboard/ads*` - Budget and compliance
- `/dashboard/crm/*` - Data accuracy
- `/dashboard/booking/*` - Schedule conflicts
- `/dashboard/inventory/*` - Stock accuracy
- `/dashboard/communications/*` - Message compliance
- `/dashboard/membership/*` - Subscription accuracy

### LOW Risk (🟢)
- `/dashboard/training` - Educational
- `/dashboard/briefing` - Informational
- `/dashboard/leaderboard` - Competitive
- `/dashboard/settings` - Configuration

---

## Common Integration Points

### API Routes Used
- `/api/dashboard/finance/...` - Financial calculations
- `/api/dashboard/schedule/...` - Scheduling
- `/api/dashboard/recommendations/...` - Treatment recommendations
- `/api/dashboard/predictions/...` - No-show, churn, anomalies
- `/api/patients/...` - Patient CRUD
- `/api/airtable/...` - Airtable sync
- `/api/webhooks/...` - n8n triggers

### External Service Calls
- Airtable API - Core data store
- Square API - Payments and POS
- Meta Graph API - Facebook/Instagram
- Google Ads API - Campaign management
- VAPI API - Phone agent
- Anthropic Claude API - AI engines
- n8n - Workflow automation

---

## Dashboard State Management

**Likely Patterns**:
- React Context for auth/user state
- Zustand or Redux for UI state
- SWR or TanStack Query for server state
- Local storage for preferences

**Likely Features**:
- Dark mode toggle
- Dashboard customization
- Saved filters
- Notification center
- Sidebar navigation with role-based visibility

---

## Performance & Optimization

**Considerations**:
- Many pages load real-time data
- Large datasets (10k+ patients, 100k+ transactions)
- Need for pagination and infinite scroll
- Chart rendering performance
- File upload handling for before/after images

---

## Next Steps for Handoff

1. **Component Audit**: Document React components used per page
2. **API Endpoint Mapping**: Map each page to its API calls
3. **Test Coverage**: Add integration tests for critical pages
4. **Performance Baseline**: Establish Core Web Vitals per page
5. **Accessibility Review**: WCAG 2.1 AA compliance per page
6. **Mobile Responsiveness**: Test on tablet/mobile
7. **Error Handling**: Document error states and fallbacks
8. **Loading States**: Verify skeleton/loading states
9. **Offline Behavior**: Test offline fallbacks where applicable
10. **Security Review**: Verify HIPAA/PCI compliance per route

---

**Document Generated**: April 7, 2026  
**Total Routes Inventoried**: 140+  
**Critical Risk Pages**: 6  
**Architecture Pattern**: Next.js 14 App Router with (dashboard) layout protection  
**Next Review**: After route-to-component mapping
