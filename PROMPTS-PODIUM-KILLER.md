# RaniOS — Podium Killer Prompts
# Save $19,200/year ($1,600/mo × 12) while building something 10x better
# These prompts turn RaniOS into a seven-figure revenue engine

---

## THE STRATEGY

Podium charges $1,600/mo for: reviews, messaging, text-to-pay, webchat, and AI.
You already have 60% of this built. These prompts fill the gaps AND add features
Podium doesn't offer (AI consult copilot, churn prediction, revenue intelligence).

**What you're building:**
1. Unified Command Center (messaging inbox + review hub)
2. Text-to-Pay & SMS Payment Links
3. AI Review Engine (request + respond automatically)
4. Inbound SMS + Conversation Threading
5. Smart Rebooking Engine (the money maker)
6. Client Lifecycle Revenue Optimizer

**Revenue impact at ONE location:**
- 15% more rebookings from smart follow-ups = +$180K/year
- 40% more reviews = +$60K from new client acquisition
- 20% reduction in no-shows = +$45K recovered revenue
- Text-to-pay faster collections = +$30K cash flow improvement
- AI upsell recommendations = +$90K from higher AOV
- **Total: ~$400K+ additional revenue per year**

---

## PROMPT 1: Unified Command Center — Messages Dashboard (45 min)
## THE INBOX PODIUM CHARGES $500/MO FOR

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a unified messaging command center that replaces Podium's inbox — but better, because it has AI built into every message.

CONTEXT:
- Twilio is configured: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in env.ts
- Resend is configured for email: RESEND_API_KEY
- Airtable Messages Log table exists: Tables.messagesLog()
- Current messages are outbound-only (no inbound SMS handling)
- SMS send capability exists in src/app/api/notify/treatment-plan/route.ts
- Dashboard auth: import { requireSession } from '@/lib/auth/session'
- Dashboard permissions: 'send_messages' permission exists in roles.ts
- Rate limiter, logger, cache imports are standard
- All dashboard pages follow the pattern in src/app/(dashboard)/dashboard/

CREATE:

1. src/app/api/webhooks/twilio/route.ts — Inbound SMS Webhook
   - POST handler for Twilio incoming SMS webhooks
   - Extract: From (phone), Body (message text), MessageSid
   - Match phone number to existing client in Clients table (search by Phone field)
   - Create Messages Log record:
     - Type: 'Inbound'
     - Channel: 'SMS'
     - Recipient: client name (or phone if no match)
     - Client: linked record ID (if matched)
     - Content: message body
     - Phone: sender phone
     - Status: 'Received'
     - Created Date: now
   - If client NOT found, create a new lead:
     - Create Clients record with Phone, Lead Status: 'New', Source: 'Inbound SMS'
     - Create Alert: "New lead from inbound SMS: {phone}"
   - Auto-detect intent from message:
     - Contains "book/appointment/schedule" → intent: 'booking'
     - Contains "cancel" → intent: 'cancellation'
     - Contains "price/cost/how much" → intent: 'pricing'
     - Contains "reschedule/change" → intent: 'reschedule'
     - Default → intent: 'general'
   - Store intent in Messages Log Notes field
   - Return TwiML response (empty — don't auto-reply, let AI handle it)
   - Forward to n8n: POST to env.N8N_WEBHOOK_URL + '/webhook/inbound-sms'
   - Invalidate 'messages' and 'clients' cache
   - GET handler for health check

2. src/app/api/dashboard/messages/route.ts — Messages API
   GET handler:
   - Requires dashboard auth with 'view_messages' permission
   - Query params: ?client={clientId}&channel=sms|email|all&status=all|unread&limit=50&offset=0
   - Fetch from Messages Log table, sort by Created Date DESC
   - Group messages by client (conversation threading):
     ```
     {
       conversations: [{
         clientId: string,
         clientName: string,
         clientPhone: string,
         lastMessage: string,
         lastMessageTime: string,
         unreadCount: number,
         messages: [{ id, type, channel, content, status, createdAt }]
       }],
       totalConversations: number,
       totalUnread: number
     }
     ```
   - Cache for 15 seconds

3. src/app/api/dashboard/messages/send/route.ts — Send Message API
   POST handler:
   - Requires 'send_messages' permission
   - Body: { clientId, channel: 'sms' | 'email', message, subject? }
   - For SMS:
     - Look up client phone from Clients table
     - Send via Twilio: POST to Twilio Messages API
     - Create Messages Log record (Type: 'Outbound', Channel: 'SMS')
   - For Email:
     - Look up client email from Clients table
     - Send via Resend
     - Create Messages Log record (Type: 'Outbound', Channel: 'Email')
   - Return { success: true, messageId }

4. src/app/api/dashboard/messages/ai-draft/route.ts — AI Message Drafting
   POST handler:
   - Requires 'send_messages' permission
   - Body: { clientId, context: 'reply' | 'follow-up' | 'review-request' | 'payment-request', inboundMessage? }
   - Fetch client profile from Clients table (name, last visit, services, LTV)
   - Fetch last 5 messages for this client from Messages Log
   - Call Claude API (Haiku) with:
     - System prompt: "You are a luxury medspa messaging assistant for Rani Beauty Clinic. Draft a professional, warm SMS response. Keep under 160 characters. Never use the word 'infusion' — always say 'injection'. Brand voice: luxury, confident, clinically-assured."
     - User prompt: client context + conversation history + requested action
   - Return { draft: string, tone: string, suggestedAction: 'send' | 'review' }

5. src/app/api/dashboard/messages/[id]/read/route.ts — Mark as Read
   PATCH handler:
   - Update Messages Log record Status from 'Received' to 'Read'
   - Invalidate 'messages' cache

6. Add 'view_messages' and 'send_messages' permissions to roles.ts:
   - ceo: both
   - frontdesk: both
   - provider: view_messages only
   - marketing: view_messages only
   - operations: both

7. Add Messages Log field constants to src/lib/airtable/tables.ts if not already defined

REQUIREMENTS:
- Twilio webhook must verify request authenticity (check X-Twilio-Signature header)
- All SMS sends must respect TCPA compliance (only text clients who opted in)
- AI drafts are SUGGESTIONS only — staff must approve before sending
- Rate limit: RATE_LIMITS.FORM for sends, RATE_LIMITS.VIEW for reads
- Run build + tests, commit: "Add unified messaging command center with inbound SMS + AI drafts"
- Push to origin main
```

---

## PROMPT 2: AI Review Engine — Automated Request + Response (30 min)
## THE FEATURE THAT PRINTS MONEY

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build an automated review request system that texts clients after treatment AND drafts AI responses to incoming reviews. This alone replaces $400/mo of Podium's value.

CONTEXT:
- Google review sync exists: src/app/api/integrations/google-reviews/sync/route.ts
- Manual review entry exists: src/app/api/dashboard/entry/review/route.ts
- Post-treatment template (src/lib/templates/post-treatment.ts) has a 72h step but it only emails, doesn't SMS a direct Google review link
- n8n workflow W13 (Review Commander) runs daily at 9AM
- Airtable Reviews table: Platform, Star Rating, Review Text, Reviewer Name, Sentiment, Response Status
- The clinic's Google Business Profile review URL: https://g.page/r/CfYz2GMvYCJnEAE/review
- Twilio SMS is configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)
- Claude API is configured (ANTHROPIC_API_KEY)

CREATE:

1. src/lib/reviews/engine.ts — Review Intelligence Engine
   ```typescript
   interface ReviewRequest {
     clientId: string;
     clientName: string;
     clientPhone: string;
     serviceName: string;
     providerName: string;
     appointmentDate: string;
   }

   interface ReviewResponse {
     reviewId: string;
     reviewerName: string;
     rating: number;
     reviewText: string;
     platform: string;
   }
   ```

   Functions:

   a) generateReviewRequestSMS(request: ReviewRequest): string
      - Personalized SMS with Google review link
      - Template: "Hi {firstName}! We loved seeing you for your {service} with {provider}. If you had a great experience, we'd be so grateful for a quick Google review — it means the world to our small team! {googleReviewUrl} 💛 — Rani Beauty Clinic"
      - Keep under 300 characters
      - A/B test variants (track which gets more clicks):
        Variant A: Emotional appeal ("means the world")
        Variant B: Social proof ("Join 200+ happy clients")
        Variant C: Direct ask ("Would you leave us a quick review?")

   b) shouldRequestReview(clientId: string, appointmentDate: string): Promise<boolean>
      - Don't request if client left a review in last 90 days
      - Don't request if client has complained recently (check Alerts table)
      - Don't request if appointment was cancelled
      - Don't request more than once per client per 30 days
      - Check client's SMS consent (opt-in required)
      - Return true only if all checks pass

   c) async generateReviewResponse(review: ReviewResponse): Promise<string>
      - Call Claude Haiku with the review
      - System prompt: "You are responding to a Google review for Rani Beauty Clinic, a luxury medical aesthetics clinic in Renton, WA. Write a warm, professional response. For 5-star reviews: thank them specifically for what they mentioned, invite them back. For 4-star: thank them, acknowledge any specific feedback, mention you're always improving. For 3 or below: express genuine concern, invite them to contact you directly at (425) 905-2410. NEVER be defensive. Always sign off as 'The Rani Beauty Clinic Team'. Keep under 200 words."
      - Return the draft response

   d) getReviewMetrics(): Promise<ReviewMetrics>
      - Total reviews by platform
      - Average rating (overall, last 30 days, last 90 days)
      - Review velocity (reviews per week)
      - Response rate (% of reviews with responses)
      - Sentiment distribution
      - NPS estimate from ratings

2. src/app/api/dashboard/reviews/route.ts — Review Dashboard API
   GET handler:
   - Fetch all reviews from Airtable Reviews table
   - Include metrics from getReviewMetrics()
   - Filter: ?platform=google|yelp|all&status=pending|responded|all&rating=1-5
   - Sort by date DESC
   - Cache 60 seconds

3. src/app/api/dashboard/reviews/request/route.ts — Send Review Request
   POST handler:
   - Body: { clientId } or { clientIds: string[] } (batch)
   - For each client:
     - Run shouldRequestReview() checks
     - If passes, send SMS via Twilio with personalized review link
     - Log in Messages Log (Type: 'Outbound', Channel: 'SMS', Notes: 'Review Request')
     - Track in Reviews table: create record with Status 'Requested', Platform 'Google'
   - Return { sent: number, skipped: number, reasons: string[] }

4. src/app/api/dashboard/reviews/respond/route.ts — AI Review Response
   POST handler:
   - Body: { reviewId, action: 'draft' | 'approve' | 'edit', editedResponse?: string }
   - 'draft': Generate AI response via generateReviewResponse(), save as draft
   - 'approve': Mark response as approved, update review record Status → 'Responded'
   - 'edit': Save edited response, mark as approved
   - NOTE: Actual posting to Google requires Google Business Profile API
     (for now, copy response to clipboard / display for manual posting)

5. src/app/api/dashboard/reviews/auto-request/route.ts — Batch Auto-Request
   POST handler (called by n8n daily):
   - Find all appointments completed in last 48-72 hours
   - For each, run shouldRequestReview()
   - Send review request SMS to eligible clients
   - Return summary: { total, eligible, sent, skipped }
   - This replaces manual review asking!

6. Update post-treatment template (src/lib/templates/post-treatment.ts):
   - Add review request to the 72h step (step 3)
   - SMS variant: Include Google review link
   - Email variant: Include "Rate Your Experience" button

REQUIREMENTS:
- TCPA compliance: Only SMS clients who opted in
- Never request reviews from clients who had bad experiences (check alerts/complaints)
- AI responses are drafts — must be human-approved before posting
- A/B test tracking: Store variant in Messages Log Notes field
- Run build + tests, commit: "Add AI review engine with auto-request and smart response drafting"
- Push to origin main
```

---

## PROMPT 3: Text-to-Pay — SMS Payment Links (30 min)
## COLLECT MONEY FASTER THAN PODIUM

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a text-to-pay system that lets staff send payment links via SMS. Clients tap, pay, done. No app download, no login required.

CONTEXT:
- Stripe checkout exists: src/app/api/checkout/route.ts (creates $250 deposit sessions)
- Twilio SMS configured
- Square is used for in-clinic POS but not for remote payments
- Current checkout creates sessions with metadata: planId, tier, clientName
- Stripe package: stripe ^20.4.1
- DO NOT pass an explicit apiVersion to `new Stripe(key)`

CREATE:

1. src/app/api/payments/create-link/route.ts — Create Payment Link
   POST handler:
   - Requires dashboard auth with 'manage_payments' permission
   - Body: {
       clientId: string,
       amount: number (in dollars),
       description: string,
       type: 'deposit' | 'balance' | 'package' | 'membership' | 'custom',
       sendSms: boolean,
       sendEmail: boolean
     }
   - Create Stripe Payment Link:
     ```typescript
     const stripe = new Stripe(env.STRIPE_SECRET_KEY);
     const paymentLink = await stripe.paymentLinks.create({
       line_items: [{
         price_data: {
           currency: 'usd',
           product_data: {
             name: description,
             description: `Rani Beauty Clinic — ${type}`,
           },
           unit_amount: Math.round(amount * 100),
         },
         quantity: 1,
       }],
       metadata: {
         clientId,
         type,
         source: 'text_to_pay',
         createdBy: session.user.name,
       },
       after_completion: {
         type: 'redirect',
         redirect: { url: 'https://www.ranibeautyclinic.com/thank-you?payment=success' },
       },
     });
     ```
   - If sendSms: Send SMS via Twilio:
     "Hi {clientName}! Here's your payment link for {description} (${amount}): {paymentLink.url} — Rani Beauty Clinic"
   - If sendEmail: Send via Resend with branded template
   - Log in Messages Log + Transactions table (Status: 'Pending')
   - Return { paymentLinkUrl, paymentLinkId, smsSent, emailSent }

2. src/app/api/payments/status/route.ts — Check Payment Status
   GET handler:
   - Query: ?linkId={paymentLinkId}
   - Check Stripe for payment link status
   - Return current status + amount collected

3. src/app/api/payments/outstanding/route.ts — Outstanding Balances
   GET handler:
   - Requires 'view_revenue' permission
   - Query Transactions table for Status: 'Pending' payments
   - Group by client
   - Return: { clients: [{ name, phone, outstanding, links: [...] }], totalOutstanding }

4. Update the Stripe webhook handler (src/app/api/webhooks/stripe/route.ts):
   - Add handling for 'checkout.session.completed' events from payment links
   - Check metadata.source === 'text_to_pay'
   - Update Transaction record Status → 'Completed'
   - Send confirmation SMS: "Payment received! Thank you, {clientName}. — Rani Beauty Clinic 💛"
   - Create Alert: type 'success', "Payment collected: ${amount} from {clientName}"

5. src/lib/payments/text-to-pay.ts — Payment Link Utilities
   ```typescript
   // Quick-send functions for common payment types
   export async function sendDepositRequest(clientId: string): Promise<PaymentResult>
   export async function sendBalanceRequest(clientId: string, amount: number): Promise<PaymentResult>
   export async function sendPackagePayment(clientId: string, packageName: string, amount: number): Promise<PaymentResult>

   // Batch operations
   export async function sendOutstandingReminders(): Promise<BatchResult>
   // Finds all clients with pending payments > 7 days old
   // Sends gentle reminder SMS: "Friendly reminder — you have an outstanding balance of ${amount}..."
   ```

6. Add 'manage_payments' permission to roles.ts:
   - ceo: yes
   - frontdesk: yes
   - provider: no
   - marketing: no
   - operations: yes

REQUIREMENTS:
- Payment links must be one-time use (prevent double charging)
- All payment amounts must be validated (min $1, max $25,000)
- SMS payment messages must include clinic name for trust
- Confirmation SMS sent on successful payment (via webhook)
- Outstanding balance reminders are opt-in only (check SMS consent)
- Run build + tests, commit: "Add text-to-pay with SMS payment links and auto-confirmation"
- Push to origin main
```

---

## PROMPT 4: Smart Rebooking Engine — The Revenue Multiplier (45 min)
## THIS IS WHAT MAKES YOU SEVEN FIGURES

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a smart rebooking engine that automatically identifies clients who should rebook, calculates the optimal next service, and sends personalized rebooking campaigns. This is the #1 revenue driver — a med spa's LTV is determined by rebooking rate.

CONTEXT:
- Treatment recommendations engine exists: src/lib/recommendations/engine.ts
  - 5 strategies: pathway, category gap, goal-based, timing/overdue, membership upsell
  - Treatment pathway map (what follows each service)
- Churn prediction exists: src/lib/churn/engine.ts (5 factors, scores 0-100)
- Reactivation templates exist: src/lib/templates/reactivation.ts (30/60/90 day tiers)
- No-show prediction exists: src/lib/predictions/no-show.ts
- Airtable Clients table has: Last Visit, Visit Count, LTV, Lead Status, Services
- Airtable Appointments table has: Date, Service, Provider, Status
- Twilio + Resend configured for SMS/email
- Claude API configured
- Services with recommended rebooking intervals:
  - HydraFacial: every 4 weeks
  - Botox: every 12 weeks
  - Fillers: every 26-52 weeks (varies)
  - RF Microneedling: every 4-6 weeks (series of 3-4)
  - VI Peel: every 4-6 weeks (series of 3)
  - Laser Hair Removal: every 6 weeks (series of 6-8)
  - PicoWay: every 6-8 weeks (series of 3-6)
  - Sofwave: every 12 months
  - GLP-1: monthly subscription
  - Wellness Injections: weekly/biweekly

CREATE:

1. src/lib/rebooking/engine.ts — Smart Rebooking Engine
   ```typescript
   interface RebookingOpportunity {
     clientId: string;
     clientName: string;
     clientPhone: string;
     clientEmail: string;
     lastService: string;
     lastVisitDate: string;
     daysSinceVisit: number;
     recommendedService: string;
     recommendedInterval: number; // days
     daysOverdue: number; // negative = not yet due
     urgency: 'upcoming' | 'due' | 'overdue' | 'at-risk' | 'lapsed';
     estimatedRevenue: number;
     churnRisk: number; // 0-100
     personalizedMessage: string;
     channel: 'sms' | 'email' | 'both';
   }
   ```

   SERVICE_INTERVALS constant:
   ```typescript
   const SERVICE_INTERVALS: Record<string, { days: number; seriesTotal?: number; price: number }> = {
     'HydraFacial': { days: 28, price: 275 },
     'Botox': { days: 84, price: 450 },
     'Fillers': { days: 180, price: 650 },
     'RF Microneedling': { days: 35, seriesTotal: 4, price: 495 },
     'VI Peel': { days: 35, seriesTotal: 3, price: 395 },
     'Laser Hair Removal': { days: 42, seriesTotal: 7, price: 200 },
     'PicoWay': { days: 49, seriesTotal: 4, price: 475 },
     'Sofwave': { days: 365, price: 3500 },
     'GLP-1': { days: 30, price: 499 },
     'Wellness Injection': { days: 14, price: 75 },
   };
   ```

   Functions:

   a) async findRebookingOpportunities(): Promise<RebookingOpportunity[]>
      - Fetch all active clients with completed appointments
      - For each client, calculate days since last visit per service type
      - Compare against SERVICE_INTERVALS
      - Classify urgency:
        - upcoming: 7 days before due date
        - due: 0-3 days past due
        - overdue: 4-14 days past due
        - at-risk: 15-30 days past due
        - lapsed: 30+ days past due
      - Calculate churn risk using existing churn engine
      - Generate personalized message using Claude Haiku:
        System: "Generate a warm, luxury SMS rebooking reminder for Rani Beauty Clinic. Mention the specific service they're due for. Include a booking link. Under 280 characters. Brand voice: luxury, never pushy, transformation-focused."
      - Sort by revenue potential × urgency

   b) async generateDailyRebookingCampaign(): Promise<CampaignResult>
      - Find all 'due' and 'overdue' opportunities
      - Filter: only clients with SMS consent
      - Filter: don't message if already contacted in last 7 days
      - Return prioritized list for sending
      - Estimated daily revenue recovery: sum of estimatedRevenue for overdue clients

   c) async sendRebookingReminder(opportunity: RebookingOpportunity): Promise<SendResult>
      - Send personalized SMS via Twilio
      - Include Mangomint booking link: https://booking.mangomint.com/876418
      - Log in Messages Log (Notes: 'Rebooking Reminder')
      - Track in Clients table: update 'Last Contacted' field

   d) getRebookingMetrics(): { opportunities, totalPotentialRevenue, byUrgency, byService }

2. src/app/api/dashboard/rebooking/route.ts — Rebooking Dashboard API
   GET handler:
   - Returns all rebooking opportunities
   - Query params: ?urgency=due|overdue|at-risk|all&service=HydraFacial|all&limit=50
   - Includes metrics summary
   - Cache for 5 minutes

3. src/app/api/dashboard/rebooking/send/route.ts — Send Rebooking Reminders
   POST handler:
   - Body: { clientIds: string[] } or { urgency: 'due' | 'overdue', autoSend: true }
   - For batch: send to all matching clients
   - For individual: send to specific clients
   - Return { sent, skipped, estimatedRevenue }

4. src/app/api/dashboard/rebooking/auto/route.ts — Daily Auto-Rebooking
   POST handler (called by n8n daily at 10AM):
   - Run generateDailyRebookingCampaign()
   - Auto-send to 'due' clients only (not overdue — those need human review)
   - Log results
   - Forward summary to n8n for CEO daily digest

5. Update SWR hooks (src/hooks/useDashboardData.ts):
   - Add useRebookingOpportunities() hook (2min refresh)
   - Add useRebookingMetrics() hook (5min refresh)

REQUIREMENTS:
- TCPA: Only text clients who opted in
- Frequency cap: Max 1 rebooking SMS per client per 7 days
- No messaging on Sundays
- Personalized messages (not generic blasts)
- Every SMS includes booking link + opt-out text
- Track click-through to booking (via UTM params in booking URL)
- Run build + tests, commit: "Add smart rebooking engine with AI-personalized campaigns"
- Push to origin main
```

---

## PROMPT 5: Client Lifecycle Revenue Dashboard (30 min)
## SEE THE MONEY IN REAL TIME

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a revenue intelligence dashboard page that shows exactly where money is coming from, going, and how to make more. This is the CEO's daily command center.

CONTEXT:
- Existing dashboard pages follow pattern in src/app/(dashboard)/dashboard/
- useDashboardData SWR hooks in src/hooks/useDashboardData.ts
- Revenue API exists: GET /api/dashboard/revenue (breakdown by provider/service)
- Revenue trends: GET /api/dashboard/revenue/trends
- Revenue anomalies: GET /api/dashboard/revenue/anomalies
- P&L: GET /api/dashboard/finance/pnl
- Churn: GET /api/dashboard/clients/at-risk
- Gamification: score, achievements, leaderboard
- Brand: Navy #0F1D2C, Gold #C9A96E, Cream #F8F6F1
- Charts: Recharts (already installed)
- Animations: Framer Motion (already installed)

CREATE:

1. src/app/(dashboard)/dashboard/revenue-command/page.tsx — Revenue Command Center
   A single-page dashboard with these sections:

   SECTION 1: Revenue Pulse (top row, 4 cards)
   - Today's Revenue: real-time from transactions
   - This Week vs Last Week: % change with arrow
   - Monthly Projection: based on current run rate
   - Revenue Per Hour: today's revenue ÷ hours open

   SECTION 2: Money Pipeline (visual funnel)
   - Leads → Consults → Booked → Treated → Reboked → Referral
   - Show conversion rates between each stage
   - Show dollar value at each stage
   - Animate the funnel with Framer Motion

   SECTION 3: Rebooking Revenue (from rebooking engine)
   - Clients due for rebooking: count + total $ potential
   - Clients overdue: count + $ at risk
   - Clients at risk of churning: count + LTV at risk
   - "Send Reminders" action button

   SECTION 4: Payment Collection
   - Outstanding balances: total $ pending
   - Text-to-pay sent this week: count + $ collected
   - Average days to collect payment
   - "Send Payment Reminders" action button

   SECTION 5: Review Impact
   - Google rating: current + trend
   - Reviews this month vs last month
   - Estimated new client value from reviews ($300 avg first visit)
   - "Request Reviews" action button

   SECTION 6: Revenue by Category (Recharts donut)
   - Injectables, Facials, Laser, Body, Wellness, Memberships
   - Show $ and % for each

   SECTION 7: Provider Productivity
   - Revenue per provider per hour
   - Utilization rate (booked hours ÷ available hours)
   - Average ticket size per provider

   SECTION 8: AI Revenue Insights (Claude-generated)
   - Daily summary: "Revenue is up 12% vs last week. HydraFacial bookings are driving growth. 15 clients are overdue for Botox — $6,750 potential. Consider sending rebooking reminders."
   - Actionable recommendations with one-click execution

2. src/app/api/dashboard/revenue-command/route.ts — Unified Revenue API
   GET handler:
   - Aggregates data from multiple existing APIs into one response
   - Combines: revenue, trends, rebooking, payments, reviews, provider stats
   - Adds AI insights via Claude Haiku (summarize key metrics into actionable text)
   - Cache for 60 seconds
   - Response shape matches all 8 dashboard sections

3. Add SWR hook: useRevenueCommand() in useDashboardData.ts

DESIGN REQUIREMENTS:
- Dark mode dashboard aesthetic (Navy background #0F1D2C)
- Gold accent on important numbers (#C9A96E)
- Cards with subtle glass-morphism effect
- Numbers animate counting up on load (Framer Motion)
- Action buttons are Gold with Navy text
- Responsive: 4 columns on desktop, 2 on tablet, 1 on mobile
- Each section has a subtle hover glow effect
- Revenue numbers in large Playfair Display font

REQUIREMENTS:
- This page is the FIRST thing the CEO sees every morning
- Every number should have context (vs last period, trend direction)
- Action buttons should trigger real API calls (rebooking, payment reminders, review requests)
- Run build + tests, commit: "Add revenue command center dashboard"
- Push to origin main
```

---

## PROMPT 6: Automated Client Lifecycle Campaigns (30 min)
## THE 24/7 REVENUE ENGINE

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a client lifecycle automation engine that runs 24/7, sending the right message at the right time to maximize lifetime value. This is the backbone of a seven-figure single-location med spa.

CONTEXT:
- Post-treatment templates: src/lib/templates/post-treatment.ts (5 steps)
- Reactivation templates: src/lib/templates/reactivation.ts (3 tiers)
- Pre-consult templates: src/lib/templates/pre-consult.ts (3 steps)
- Rebooking engine: (built in Prompt 4)
- Review engine: (built in Prompt 2)
- Text-to-pay: (built in Prompt 3)
- Twilio + Resend configured
- n8n at ranibeautyclinic.app.n8n.cloud
- Claude API for personalization

CREATE:

1. src/lib/lifecycle/engine.ts — Client Lifecycle Engine

   Define the FULL client lifecycle with triggers:

   ```typescript
   const LIFECYCLE_STAGES = {
     // ACQUISITION
     'new_lead': {
       trigger: 'Client created with Lead Status = New',
       actions: [
         { delay: 0, channel: 'sms', template: 'welcome_sms' },
         { delay: '1h', channel: 'email', template: 'welcome_email' },
         { delay: '24h', channel: 'sms', template: 'booking_nudge' },
         { delay: '72h', channel: 'email', template: 'value_proposition' },
         { delay: '7d', channel: 'sms', template: 'last_chance_book' },
       ]
     },

     // PRE-APPOINTMENT
     'appointment_booked': {
       trigger: 'Appointment created',
       actions: [
         { delay: 0, channel: 'sms', template: 'booking_confirmation' },
         { delay: '-24h', channel: 'sms', template: 'appointment_reminder' },
         { delay: '-2h', channel: 'sms', template: 'on_your_way' },
       ]
     },

     // POST-TREATMENT
     'treatment_completed': {
       trigger: 'Appointment status = Completed',
       actions: [
         { delay: 0, channel: 'email', template: 'aftercare_instructions' },
         { delay: '24h', channel: 'sms', template: 'check_in' },
         { delay: '72h', channel: 'sms+email', template: 'review_request' },
         { delay: '7d', channel: 'email', template: 'results_check' },
         { delay: '21d', channel: 'sms', template: 'rebooking_soft' },
       ]
     },

     // REBOOKING
     'rebooking_due': {
       trigger: 'Days since last visit >= service interval',
       actions: [
         { delay: '-7d', channel: 'sms', template: 'rebooking_upcoming' },
         { delay: 0, channel: 'sms', template: 'rebooking_due' },
         { delay: '7d', channel: 'email', template: 'rebooking_overdue' },
         { delay: '14d', channel: 'sms', template: 'rebooking_incentive' },
       ]
     },

     // RETENTION
     'churn_risk_high': {
       trigger: 'Churn score > 70',
       actions: [
         { delay: 0, channel: 'sms', template: 'we_miss_you' },
         { delay: '3d', channel: 'email', template: 'special_offer' },
         { delay: '7d', channel: 'sms', template: 'personal_outreach' },
       ]
     },

     // MEMBERSHIP
     'membership_anniversary': {
       trigger: '12 months since membership start',
       actions: [
         { delay: 0, channel: 'email', template: 'anniversary_celebration' },
         { delay: 0, channel: 'sms', template: 'anniversary_bonus' },
       ]
     },

     // BIRTHDAY
     'birthday': {
       trigger: 'Client birthday (if DOB in profile)',
       actions: [
         { delay: 0, channel: 'sms', template: 'birthday_wish' },
         { delay: 0, channel: 'email', template: 'birthday_offer' },
       ]
     },

     // REFERRAL
     'high_ltv_milestone': {
       trigger: 'Client LTV exceeds $2,000',
       actions: [
         { delay: 0, channel: 'email', template: 'vip_welcome' },
         { delay: '1d', channel: 'sms', template: 'referral_ask' },
       ]
     },
   };
   ```

   Functions:

   a) getClientLifecycleStage(clientId: string): Promise<LifecycleStage>
      - Determine where client is in lifecycle
      - Return current stage + pending actions

   b) getNextAction(clientId: string): Promise<LifecycleAction | null>
      - What's the next message this client should receive?
      - Check frequency caps (no more than 3 messages per week)
      - Check opt-in status

   c) async executeLifecycleBatch(): Promise<BatchResult>
      - Called by n8n every hour
      - Find all clients with pending lifecycle actions
      - Execute actions (SMS/email)
      - Log everything to Messages Log
      - Return { processed, sent, skipped, errors }

2. src/lib/lifecycle/templates.ts — All SMS/Email Templates
   Create templates for EVERY lifecycle stage above:
   - SMS templates: under 280 chars, personalized with {{clientName}}, {{serviceName}}
   - Every SMS includes booking link + clinic name
   - Birthday template includes a special offer
   - VIP template acknowledges their loyalty
   - Brand voice: luxury, warm, never desperate

3. src/app/api/dashboard/lifecycle/route.ts — Lifecycle Dashboard API
   GET handler:
   - Show all clients and their current lifecycle stage
   - Pending actions count per stage
   - Conversion rates between stages
   - Revenue attributed to lifecycle campaigns
   - Cache for 5 minutes

4. src/app/api/dashboard/lifecycle/execute/route.ts — Manual Trigger
   POST handler:
   - Manually trigger lifecycle actions for a client or batch
   - Body: { clientId } or { stage: 'rebooking_due', action: 'execute_all' }
   - Requires 'send_messages' permission

REQUIREMENTS:
- TCPA: All SMS requires prior opt-in consent
- Frequency cap: Max 3 messages per client per week (across ALL campaigns)
- Quiet hours: No SMS between 9PM and 9AM local time
- Deduplication: Don't send same template to same client within 30 days
- Every template personalized with client name + specific service
- All messages logged to Messages Log for audit trail
- Run build + tests, commit: "Add client lifecycle automation engine with 8-stage campaigns"
- Push to origin main
```

---

## EXECUTION ORDER

| # | Prompt | Time | Revenue Impact |
|---|--------|------|----------------|
| **1** | Unified Messaging (Inbox) | 45 min | Foundation — enables all messaging features |
| **2** | AI Review Engine | 30 min | +$60K/year from more reviews → more new clients |
| **3** | Text-to-Pay | 30 min | +$30K/year faster collections + less AR aging |
| **4** | Smart Rebooking | 45 min | +$180K/year — THE big one (higher rebooking rate) |
| **5** | Revenue Command Center | 30 min | Visibility — see where money is & where it's leaking |
| **6** | Client Lifecycle Engine | 30 min | +$130K/year — automated LTV maximization |

**Total build time: ~3.5 hours**
**Total revenue impact: ~$400K+ per year at ONE location**
**Podium savings: $19,200/year ($1,600 × 12)**

---

## WHAT THIS GIVES YOU THAT PODIUM DOESN'T

| Feature | Podium | RaniOS |
|---------|--------|--------|
| **AI Review Responses** | Generic templates | Claude AI with brand voice |
| **Smart Rebooking** | Basic reminders | AI-personalized, service-specific, churn-aware |
| **Revenue Intelligence** | Basic reports | Real-time command center with AI insights |
| **Client Lifecycle** | Drip campaigns | 8-stage intelligent lifecycle engine |
| **Consult Copilot** | Nothing | AI-powered consult prep + objection handling |
| **Churn Prediction** | Nothing | 5-factor churn scoring per client |
| **No-Show Prevention** | Nothing | 6-factor risk scoring with deposit enforcement |
| **Dynamic Pricing** | Nothing | 6-strategy AI pricing engine |
| **Phone AI** | Nothing | Vapi AI receptionist with booking conversion |
| **Schedule Optimization** | Nothing | Gap detection, conflict resolution, revenue opportunities |

**Podium is a messaging tool. RaniOS is a revenue operating system.**

---

## GIT PUSH TROUBLESHOOTING

If git push fails (known large image SIGBUS issue):

```bash
git format-patch -1 HEAD -o /tmp/rani-patches/
cd /tmp && rm -rf rani-push
git clone --depth=1 https://github.com/rinarai4013-debug/rani-beauty-clinic.git rani-push
cd /tmp/rani-push
git am /tmp/rani-patches/*.patch
git push origin main
cd /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic
rm -rf .git
cp -r /tmp/rani-push/.git .
rm -rf /tmp/rani-push /tmp/rani-patches
git log --oneline -3
```
