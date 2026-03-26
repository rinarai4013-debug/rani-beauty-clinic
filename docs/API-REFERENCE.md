# Rani Beauty Clinic -- API Reference

> Complete documentation for every API route: method, path, authentication, request body, response format, and usage examples.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard Auth Routes](#dashboard-auth-routes)
3. [KPI and Revenue Routes](#kpi-and-revenue-routes)
4. [Lead and Client Routes](#lead-and-client-routes)
5. [Schedule Routes](#schedule-routes)
6. [Alert Routes](#alert-routes)
7. [Gamification Routes](#gamification-routes)
8. [Provider Routes](#provider-routes)
9. [Finance Routes](#finance-routes)
10. [Plaid/Banking Routes](#plaidbanking-routes)
11. [Data Entry Routes](#data-entry-routes)
12. [Intelligence Routes](#intelligence-routes)
13. [Integration Status Routes](#integration-status-routes)
14. [AI Routes (Public)](#ai-routes-public)
15. [Template Routes (n8n)](#template-routes-n8n)
16. [Webhook and Utility Routes](#webhook-and-utility-routes)

---

## Authentication

### Dashboard Routes

All `/api/dashboard/*` routes require a valid JWT session cookie (`dash_session`).

**How it works:**
1. Client calls `POST /api/dashboard/auth/login` with credentials
2. Server returns a JWT in the `dash_session` HTTP-only cookie
3. Subsequent requests automatically include the cookie
4. Server verifies the JWT signature (HS256) and checks role permissions

**JWT Payload:**
```json
{
  "userId": "string",
  "role": "ceo | frontdesk | provider | marketing | operations",
  "permissions": ["string"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Public Routes

Public routes (`/api/ai/*`, `/api/contact`, `/api/checkout`) use rate limiting instead of authentication.

### Template Routes

Template routes (`/api/templates/*`) use Bearer token authentication for n8n workflow access.

---

## Dashboard Auth Routes

### POST /api/dashboard/auth/login

Authenticate a dashboard user and create a session.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "role": "ceo",
    "permissions": ["dashboard.view", "clients.edit", "..."]
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Side effects:** Sets `dash_session` HTTP-only cookie.

---

### GET /api/dashboard/auth/me

Get the currently authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "role": "ceo",
    "permissions": ["dashboard.view", "..."]
  }
}
```

**Response (401):**
```json
{
  "error": "Not authenticated"
}
```

---

### POST /api/dashboard/auth/logout

End the current session.

**Response (200):**
```json
{
  "success": true
}
```

**Side effects:** Clears `dash_session` cookie.

---

## KPI and Revenue Routes

### GET /api/dashboard/kpis

Primary KPI cards for the dashboard home.

**Query params:**
- `range` (optional): `7d`, `30d`, `90d` (default: `30d`)

**Response (200):**
```json
{
  "revenue": { "value": 45000, "change": 12.5, "trend": "up" },
  "bookings": { "value": 142, "change": -3.2, "trend": "down" },
  "consults": { "value": 28, "change": 8.0, "trend": "up" },
  "leads": { "value": 67, "change": 15.3, "trend": "up" }
}
```

---

### GET /api/dashboard/revenue

Revenue breakdown by provider, service, and category.

**Query params:**
- `range` (optional): `7d`, `30d`, `90d`

**Response (200):**
```json
{
  "total": 45000,
  "byProvider": [
    { "name": "Provider Name", "revenue": 25000, "bookings": 80 }
  ],
  "byService": [
    { "name": "Sofwave", "revenue": 12000, "count": 4 }
  ],
  "byCategory": [
    { "name": "Injectables", "revenue": 18000, "count": 45 }
  ]
}
```

---

### GET /api/dashboard/revenue/trends

30-day daily revenue trend data for charts.

**Response (200):**
```json
{
  "trends": [
    { "date": "2026-03-01", "revenue": 1500, "bookings": 5 }
  ]
}
```

---

### GET /api/dashboard/revenue/anomalies

Revenue anomaly detection using 5 detection methods.

**Response (200):**
```json
{
  "anomalies": [
    {
      "type": "target_deviation",
      "severity": "warning",
      "message": "Revenue 18% below daily target",
      "value": -18.2
    }
  ],
  "healthScore": 72,
  "summary": "Revenue slightly below target with one provider underperforming",
  "projectedMonthEnd": 42000
}
```

---

## Lead and Client Routes

### GET /api/dashboard/leads

Lead funnel with filtering and search.

**Query params:**
- `status` (optional): `new`, `contacted`, `consulted`, `booked`, `completed`
- `search` (optional): search by name or email

**Response (200):**
```json
{
  "leads": [
    {
      "id": "rec...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "206-555-0100",
      "status": "new",
      "source": "website",
      "createdAt": "2026-03-20T10:30:00Z"
    }
  ],
  "stats": {
    "new": 15,
    "contacted": 8,
    "consulted": 5,
    "booked": 3,
    "completed": 2
  }
}
```

---

### GET /api/dashboard/clients

Client list with filters.

**Query params:**
- `search` (optional): name or email
- `segment` (optional): `vip`, `regular`, `new`, `at_risk`
- `limit` (optional): default 50

**Response (200):**
```json
{
  "clients": [
    {
      "id": "rec...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "ltv": 3500,
      "visits": 12,
      "lastVisit": "2026-03-15",
      "segment": "vip",
      "membershipStatus": "active"
    }
  ]
}
```

---

### GET /api/dashboard/clients/[id]

Single client detail. Add `?full=true` for 360-degree view with linked records.

**Response (200) -- full=true:**
```json
{
  "client": {
    "id": "rec...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "206-555-0100",
    "ltv": 3500,
    "visits": 12,
    "segment": "vip",
    "membershipStatus": "active",
    "membershipTier": "Gold"
  },
  "appointments": [
    { "date": "2026-03-15", "service": "HydraFacial", "provider": "Mom", "status": "completed" }
  ],
  "transactions": [
    { "date": "2026-03-15", "amount": 275, "service": "HydraFacial", "paymentMethod": "Square" }
  ],
  "memberships": [
    { "tier": "Gold", "startDate": "2025-01-15", "status": "active", "monthlyAmount": 199 }
  ],
  "messages": [
    { "channel": "sms", "content": "Appointment reminder...", "sentAt": "2026-03-14T10:00:00Z" }
  ],
  "reviews": [
    { "rating": 5, "text": "Amazing experience!", "date": "2026-03-16" }
  ]
}
```

---

### GET /api/dashboard/clients/[id]/churn

Per-client churn prediction score.

**Response (200):**
```json
{
  "score": 45,
  "classification": "medium",
  "factors": {
    "recency": { "score": 60, "weight": 0.40, "detail": "Last visit 25 days ago" },
    "frequency": { "score": 30, "weight": 0.20, "detail": "12 visits in 12 months" },
    "monetary": { "score": 20, "weight": 0.15, "detail": "LTV $3,500" },
    "membership": { "score": 10, "weight": 0.15, "detail": "Active Gold member" },
    "engagement": { "score": 50, "weight": 0.10, "detail": "Moderate engagement" }
  },
  "recommendation": "Schedule a check-in call within the next week"
}
```

---

### GET /api/dashboard/clients/[id]/recommend

AI next-best-treatment recommendations.

**Response (200):**
```json
{
  "recommendations": [
    {
      "service": "RF Microneedling",
      "strategy": "pathway_continuation",
      "reason": "Natural next step after HydraFacial series",
      "estimatedRevenue": 495,
      "confidence": 0.85
    },
    {
      "service": "VI Peel",
      "strategy": "category_gap",
      "reason": "Client has not tried chemical peels yet",
      "estimatedRevenue": 395,
      "confidence": 0.72
    }
  ]
}
```

---

### GET /api/dashboard/clients/at-risk

All at-risk clients ranked by urgency.

**Response (200):**
```json
{
  "clients": [
    {
      "id": "rec...",
      "name": "Jane Doe",
      "churnScore": 78,
      "classification": "high",
      "daysSinceLastVisit": 45,
      "ltv": 2800,
      "membershipStatus": "lapsed"
    }
  ]
}
```

---

## Schedule Routes

### GET /api/dashboard/schedule

Today's appointments.

**Response (200):**
```json
{
  "appointments": [
    {
      "id": "rec...",
      "clientName": "Jane Doe",
      "service": "HydraFacial",
      "provider": "Mom",
      "time": "10:00 AM",
      "duration": 60,
      "status": "confirmed",
      "noShowRisk": 15
    }
  ]
}
```

---

### GET /api/dashboard/schedule/upcoming

Next 7 days of appointments.

**Response (200):**
```json
{
  "days": [
    {
      "date": "2026-03-25",
      "appointments": [
        { "clientName": "Jane Doe", "service": "Botox", "time": "09:00 AM" }
      ],
      "utilization": 0.75
    }
  ]
}
```

---

### GET /api/dashboard/schedule/no-show-risk

No-show risk scoring for upcoming appointments.

**Query params:**
- `date` (optional): `YYYY-MM-DD` (default: today)

**Response (200):**
```json
{
  "appointments": [
    {
      "id": "rec...",
      "clientName": "Jane Doe",
      "service": "Sofwave",
      "time": "2:00 PM",
      "noShowScore": 72,
      "classification": "high",
      "factors": {
        "history": { "score": 80, "detail": "2 previous no-shows" },
        "deposit": { "score": 0, "detail": "No deposit collected" },
        "leadTime": { "score": 60, "detail": "Booked 14 days ago" }
      }
    }
  ]
}
```

---

### GET /api/dashboard/schedule/optimize

Schedule optimization analysis.

**Response (200):**
```json
{
  "efficiencyScore": 78,
  "gaps": [
    {
      "startTime": "11:00 AM",
      "endTime": "1:00 PM",
      "provider": "Mom",
      "revenuePotential": 550,
      "suggestedServices": ["HydraFacial", "VI Peel"]
    }
  ],
  "conflicts": [],
  "providerBalance": [
    { "name": "Mom", "bookings": 6, "status": "balanced" }
  ],
  "revenueOpportunities": [
    { "type": "fill_gap", "description": "2-hour gap could fit HydraFacial + VI Peel", "value": 670 }
  ]
}
```

---

## Alert Routes

### GET /api/dashboard/alerts

Active alerts.

**Response (200):**
```json
{
  "alerts": [
    {
      "id": "rec...",
      "type": "revenue_below_target",
      "severity": "warning",
      "message": "Daily revenue is 20% below target",
      "createdAt": "2026-03-24T23:00:00Z",
      "status": "active"
    }
  ]
}
```

---

### PATCH /api/dashboard/alerts/[id]

Dismiss or acknowledge an alert.

**Request:**
```json
{
  "status": "acknowledged" | "dismissed"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Gamification Routes

### GET /api/dashboard/gamification/score

Clinic score calculated from real operational metrics.

**Response (200):**
```json
{
  "score": 82,
  "level": "Gold",
  "monthlyRevenue": 92000,
  "nextLevel": { "name": "Platinum", "threshold": 120000, "gap": 28000 },
  "breakdown": {
    "revenue": 85,
    "bookings": 78,
    "retention": 90,
    "reviews": 82,
    "responseTime": 75
  }
}
```

---

### GET /api/dashboard/gamification/achievements

Achievement list and progress.

**Response (200):**
```json
{
  "achievements": [
    {
      "id": "first_100_clients",
      "name": "Century Club",
      "description": "Reach 100 active clients",
      "progress": 100,
      "unlocked": true,
      "unlockedAt": "2026-01-15"
    }
  ]
}
```

---

### GET /api/dashboard/gamification/leaderboard

Provider rankings.

**Response (200):**
```json
{
  "providers": [
    {
      "name": "Mom",
      "revenue": 52000,
      "bookings": 85,
      "utilization": 0.82,
      "avgRating": 4.9,
      "rank": 1
    }
  ]
}
```

---

## Provider Routes

### GET /api/dashboard/providers

Provider performance summary.

**Response (200):**
```json
{
  "providers": [
    {
      "name": "Mom",
      "revenue": 52000,
      "bookings": 85,
      "utilization": 0.82,
      "revenuePerHour": 325,
      "topServices": ["Botox", "Sofwave", "HydraFacial"]
    }
  ]
}
```

---

### GET /api/dashboard/providers/[name]

Single provider detailed statistics.

**Response (200):**
```json
{
  "name": "Mom",
  "revenue": 52000,
  "bookings": 85,
  "utilization": 0.82,
  "revenuePerHour": 325,
  "serviceBreakdown": [
    { "service": "Botox", "count": 30, "revenue": 15000 }
  ],
  "dailyTrend": [
    { "date": "2026-03-01", "revenue": 1800, "bookings": 3 }
  ]
}
```

---

## Finance Routes

### GET /api/dashboard/finance/expenses

Expense tracking and categorization.

**Response (200):**
```json
{
  "expenses": [
    {
      "id": "rec...",
      "category": "product_costs",
      "description": "HydraFacial supplies",
      "amount": 450,
      "date": "2026-03-20",
      "vendor": "HydraFacial Corp"
    }
  ],
  "totalByCategory": {
    "product_costs": 2500,
    "labor": 15000,
    "rent": 4500,
    "marketing": 3000,
    "equipment": 500,
    "insurance": 800,
    "supplies": 600,
    "admin": 400
  }
}
```

---

### GET /api/dashboard/finance/pnl

P&L intelligence with financial health scoring.

**Response (200):**
```json
{
  "healthScore": 78,
  "healthBreakdown": {
    "revenueGrowth": 85,
    "marginHealth": 72,
    "costControl": 80,
    "cashFlow": 70,
    "serviceMix": 82
  },
  "revenue": {
    "total": 92000,
    "byService": [
      { "service": "Sofwave", "revenue": 22000, "margin": 0.65 }
    ]
  },
  "expenses": {
    "total": 27300,
    "byCategory": {
      "product_costs": 8000,
      "labor": 15000,
      "marketing": 3000,
      "other": 1300
    }
  },
  "serviceProfitability": [
    {
      "service": "HydraFacial",
      "revenue": 8250,
      "productCost": 0.15,
      "laborCost": 0.25,
      "overhead": 0.10,
      "profitMargin": 0.50
    }
  ],
  "cashFlowProjection": [
    { "month": "2026-04", "projected": 95000, "expenses": 28000, "netCash": 67000 }
  ]
}
```

---

## Plaid/Banking Routes

### GET /api/dashboard/plaid/link-token

Initialize Plaid Link for bank connection.

**Response (200):**
```json
{
  "linkToken": "link-sandbox-..."
}
```

---

### POST /api/dashboard/plaid/exchange-token

Exchange Plaid public token for access token after user completes Plaid Link.

**Request:**
```json
{
  "publicToken": "public-sandbox-...",
  "metadata": { "institution": { "name": "Chase" } }
}
```

**Response (200):**
```json
{
  "success": true,
  "accountId": "..."
}
```

---

### GET /api/dashboard/plaid/transactions/matches

Auto-match bank transactions to Airtable transaction records.

**Response (200):**
```json
{
  "matches": [
    {
      "bankTransaction": {
        "id": "...",
        "amount": 275,
        "date": "2026-03-20",
        "description": "SQUARE *RANI BEAUTY"
      },
      "airtableRecord": {
        "id": "rec...",
        "amount": 275,
        "service": "HydraFacial",
        "client": "Jane Doe"
      },
      "confidence": 0.95
    }
  ]
}
```

---

## Data Entry Routes

All data entry routes follow the same pattern:

**Method:** POST
**Auth:** JWT (dash_session cookie)
**Content-Type:** application/json

### POST /api/dashboard/entry/lead

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "206-555-0100",
  "source": "website",
  "interestedIn": "Sofwave",
  "notes": "Referred by existing client"
}
```

### POST /api/dashboard/entry/sale

```json
{
  "clientId": "rec...",
  "service": "HydraFacial",
  "provider": "Mom",
  "amount": 275,
  "paymentMethod": "square",
  "notes": "Added LED add-on"
}
```

### POST /api/dashboard/entry/expense

```json
{
  "category": "product_costs",
  "description": "HydraFacial tips restock",
  "amount": 450,
  "vendor": "HydraFacial Corp",
  "date": "2026-03-20"
}
```

### POST /api/dashboard/entry/ceo-note

```json
{
  "content": "Great day. Mom handled 8 clients. New lead from Google Ads.",
  "mood": "positive"
}
```

### POST /api/dashboard/entry/eod-recap

```json
{
  "revenue": 3200,
  "bookings": 8,
  "highlights": "Two Sofwave bookings from social media campaign",
  "issues": "Room 2 AC not working",
  "notes": "Need to restock VI Peel kits"
}
```

### POST /api/dashboard/entry/room-issue

```json
{
  "room": "Room 2",
  "issue": "AC not cooling properly",
  "severity": "medium",
  "reportedBy": "Mom"
}
```

### POST /api/dashboard/entry/review

```json
{
  "clientName": "Jane Doe",
  "rating": 5,
  "text": "Amazing experience with the HydraFacial!",
  "source": "google",
  "date": "2026-03-24"
}
```

### POST /api/dashboard/entry/inventory

```json
{
  "item": "HydraFacial Tips",
  "action": "restock",
  "quantity": 50,
  "cost": 450,
  "notes": "Standard reorder from supplier"
}
```

### POST /api/dashboard/entry/staff-note

```json
{
  "staffMember": "Mom",
  "note": "Excellent client feedback today. Consider for team spotlight.",
  "category": "positive"
}
```

### POST /api/dashboard/entry/consult-notes

```json
{
  "clientId": "rec...",
  "provider": "Mom",
  "concerns": ["fine lines", "uneven skin tone"],
  "recommendedServices": ["Sofwave", "VI Peel"],
  "treatmentPlan": "Start with VI Peel series, transition to Sofwave after 3 months",
  "followUp": "Book VI Peel within 2 weeks"
}
```

**All entry routes return:**
```json
{
  "success": true,
  "recordId": "rec..."
}
```

---

## Intelligence Routes

### GET /api/dashboard/pricing

Dynamic pricing analysis with 6 strategies.

**Response (200):**
```json
{
  "recommendations": [
    {
      "service": "HydraFacial",
      "currentPrice": 275,
      "recommendedPrice": 295,
      "strategy": "demand_based",
      "reason": "High demand with consistent 90%+ booking rate",
      "projectedImpact": "+$600/month"
    }
  ]
}
```

---

### GET /api/dashboard/social

Social media content plan.

**Response (200):**
```json
{
  "weeklyCalendar": [
    {
      "day": "Monday",
      "theme": "Motivation Monday",
      "posts": [
        {
          "platform": "instagram",
          "type": "carousel",
          "caption": "...",
          "hashtags": ["#RaniBeautyClinic", "#MedSpa", "#Renton"],
          "score": 82,
          "scheduledTime": "10:00 AM"
        }
      ]
    }
  ],
  "monthlyTheme": "Spring Renewal",
  "hashtagStrategy": {
    "branded": ["#RaniBeautyClinic", "#RaniGlow"],
    "location": ["#RentonWA", "#SeattleMedSpa"],
    "industry": ["#MedSpa", "#Aesthetics"],
    "service": ["#Sofwave", "#HydraFacial"]
  }
}
```

---

### GET|POST /api/dashboard/consult

AI consult co-pilot.

**GET:** Returns a sample consult briefing.
**POST:** Returns a custom briefing for a specific client.

**POST Request:**
```json
{
  "clientId": "rec...",
  "appointmentType": "consultation",
  "concerns": ["fine lines", "volume loss"]
}
```

**Response (200):**
```json
{
  "briefing": {
    "clientSegment": "vip",
    "visitHistory": "12 visits over 14 months",
    "spendToDate": 3500,
    "previousTreatments": ["HydraFacial", "Botox"],
    "concerns": ["fine lines", "volume loss"]
  },
  "treatmentPlan": {
    "primary": "Sofwave",
    "complementary": ["PRX-T33"],
    "timeline": "3 months",
    "estimatedCost": 3245
  },
  "talkingPoints": {
    "opening": ["Acknowledge loyalty...", "Reference last treatment results..."],
    "during": ["Explain Sofwave mechanism..."],
    "closing": ["Present financing options..."]
  },
  "objectionHandlers": [
    {
      "objection": "Too expensive",
      "technique": "reframe",
      "response": "When you consider the per-month cost over the results timeline..."
    }
  ],
  "crossSell": [
    { "service": "Membership", "likelihood": 0.75, "pitch": "Lock in preferred pricing..." }
  ],
  "closingStrategies": ["assumptive", "choice"],
  "followUpPlan": {
    "sameDay": "Thank you text",
    "nextDay": "Email with treatment plan PDF",
    "oneWeek": "Check-in call if no booking"
  }
}
```

---

### GET /api/dashboard/knowledge-base

RAG knowledge base stats or semantic search.

**Query params:**
- `q` (optional): search query for semantic search

**Response (200) -- stats:**
```json
{
  "coverageScore": 85,
  "totalDocuments": 12,
  "documentsByCategory": {
    "treatment_protocols": 4,
    "aftercare_guides": 3,
    "faqs": 2,
    "policies": 2,
    "product_info": 1
  },
  "knowledgeGaps": [
    { "service": "GLP-1", "missingCategories": ["aftercare_guide", "faq"] }
  ],
  "pineconeStatus": "connected"
}
```

**Response (200) -- search:**
```json
{
  "results": [
    {
      "content": "Sofwave treatment protocol...",
      "document": "sofwave-protocol",
      "category": "treatment_protocols",
      "score": 0.92
    }
  ]
}
```

---

## AI Routes (Public)

### POST /api/ai/chat

AI concierge chatbot. Uses Claude Haiku for fast responses.

**Request:**
```json
{
  "message": "What services do you offer for fine lines?",
  "conversationId": "optional-uuid",
  "metadata": {
    "page": "/services/sofwave",
    "smsConsent": false
  }
}
```

**Response (200):**
```json
{
  "reply": "Great question! For fine lines, we offer several effective options...",
  "suggestedServices": ["Sofwave", "RF Microneedling", "PRX-T33"],
  "leadCaptured": false,
  "conversationId": "uuid"
}
```

---

### POST /api/ai/recommend

AI treatment recommender generating 3-tier plans (Good/Better/Best).

**Request:**
```json
{
  "concerns": ["fine lines", "skin laxity", "uneven tone"],
  "budget": "moderate",
  "timeline": "3 months",
  "age": 42,
  "skinType": "combination"
}
```

**Response (200):**
```json
{
  "plans": {
    "good": {
      "name": "Essential Renewal",
      "services": ["HydraFacial x3", "VI Peel x2"],
      "totalCost": 1615,
      "timeline": "3 months",
      "expectedResults": "Improved texture and tone"
    },
    "better": {
      "name": "Advanced Transformation",
      "services": ["Sofwave x1", "HydraFacial x3", "PRX-T33 x2"],
      "totalCost": 4565,
      "timeline": "4 months",
      "expectedResults": "Visible tightening and significant glow"
    },
    "best": {
      "name": "Complete Rejuvenation",
      "services": ["Sofwave x2", "RF Microneedling x3", "HydraFacial x6", "PRX-T33 x3"],
      "totalCost": 9160,
      "timeline": "6 months",
      "expectedResults": "Dramatic transformation with lasting results"
    }
  }
}
```

---

### POST /api/ai/intake

AI intake intelligence -- processes Typeform submission data.

**Request:**
```json
{
  "intakeId": "rec...",
  "rawData": {
    "firstName": "Jane",
    "lastName": "Doe",
    "concerns": ["aging", "pigmentation"],
    "medications": ["none"],
    "allergies": ["none"],
    "previousTreatments": ["facials"]
  }
}
```

**Response (200):**
```json
{
  "summary": "42-year-old female, primary concerns: aging and pigmentation...",
  "riskFlags": [],
  "consultScript": "Focus on Sofwave for anti-aging and PicoWay for pigmentation...",
  "suggestedPlan": "Start with HydraFacial assessment, then Sofwave consultation",
  "estimatedValue": 4500
}
```

---

## Template Routes (n8n)

These routes render branded HTML email templates for n8n workflows.

### POST /api/templates/post-treatment

5-step post-treatment follow-up sequence.

**Request:**
```json
{
  "clientName": "Jane",
  "serviceName": "HydraFacial",
  "providerName": "Mom",
  "step": 1,
  "appointmentDate": "2026-03-24"
}
```

**Response (200):**
```json
{
  "subject": "How are you feeling after your HydraFacial, Jane?",
  "html": "<html>...<branded email>...</html>",
  "sms": "Hi Jane! Hope you're loving your HydraFacial glow..."
}
```

Steps: 1=immediate, 2=24h, 3=72h, 4=7-day, 5=30-day

---

### POST /api/templates/reactivation

3-tier reactivation campaign. Auto-detects tier from `daysSinceLastVisit`.

**Request:**
```json
{
  "clientName": "Jane",
  "daysSinceLastVisit": 45,
  "lastService": "HydraFacial",
  "membershipStatus": "lapsed"
}
```

**Response (200):**
```json
{
  "tier": 2,
  "tierName": "lapsed-60",
  "subject": "We miss you, Jane...",
  "html": "<html>...<branded email>...</html>",
  "sms": "Hi Jane, it's been a while..."
}
```

---

### POST /api/templates/pre-consult

3-step pre-consult communication with service-specific prep instructions.

**Request:**
```json
{
  "clientName": "Jane",
  "serviceName": "Sofwave",
  "providerName": "Mom",
  "appointmentDate": "2026-03-26T14:00:00Z",
  "step": 1,
  "isNewClient": true
}
```

**Response (200):**
```json
{
  "subject": "Your Sofwave consultation with Mom is confirmed!",
  "html": "<html>...<branded email with prep instructions>...</html>",
  "sms": "Hi Jane! Your consultation is confirmed for March 26 at 2PM..."
}
```

Steps: 1=booking confirmation, 2=24h reminder, 3=2h reminder

---

## Webhook and Utility Routes

### POST /api/contact

Contact form submission.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "206-555-0100",
  "message": "I'm interested in Sofwave treatment",
  "smsConsent": true
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Side effects:** Sends confirmation email via Resend, forwards to n8n webhook for lead processing.

---

### POST /api/webhooks/mangomint

Receives Mangomint webhook events.

**Headers:** Webhook signature for verification.

**Body:** Mangomint event payload (appointment.created, appointment.completed, etc.)

**Response (200):**
```json
{
  "received": true
}
```

---

### POST /api/indexnow

Submit URLs to search engines via IndexNow protocol.

**Request:**
```json
{
  "urls": ["https://ranibeautyclinic.com/services/sofwave"]
}
```

**Response (200):**
```json
{
  "submitted": true,
  "count": 1
}
```
