# Rani Beauty Clinic -- Operations Playbook

> Daily, weekly, and monthly operational procedures for maintaining the Rani Beauty Clinic platform, dashboard, and integrations.

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Operations](#weekly-operations)
3. [Monthly Operations](#monthly-operations)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Escalation Matrix](#escalation-matrix)

---

## Daily Operations

### Morning Routine (8:00 AM)

**1. Check Dashboard KPIs**
- Log in at `ranibeautyclinic.com/dashboard`
- Review the four primary KPI cards: Revenue, Bookings, Consults, Leads
- Compare today's numbers against the gamification target (Bronze $30K, Silver $60K, Gold $90K, Platinum $120K, Diamond $150K+)
- Note any KPI card showing a red downward trend

**2. Review Alerts**
- Navigate to Dashboard > Alerts (`/dashboard/alerts`)
- Acknowledge or dismiss each alert
- Alerts are generated nightly at 11 PM by n8n workflow W12 (Alert Engine)
- Priority levels: critical (red), warning (amber), info (blue)
- Critical alerts require same-day action

**3. Verify n8n Workflow Runs**
- Open n8n at `ranibeautyclinic.app.n8n.cloud`
- Check the execution history for the last 24 hours
- Confirm these workflows ran successfully:
  - WF1 Intake Intelligence Engine (every 1 min) -- should show continuous green executions
  - WF2 Immediate Lead Response (every 1 min) -- confirm new leads got immediate responses
  - WF4 Pre-Consult Preparation (6 AM) -- confirm consult prep emails sent
  - WF9 KPI Aggregation (6 AM) -- confirm daily snapshot created
  - WF7 Membership Engine (9 AM) -- confirm membership renewals processed
  - W13 Review Commander (9 AM) -- confirm Google reviews scanned and responses drafted
  - W14 Client Status Keeper (midnight) -- confirm client statuses updated
- Flag any workflow showing a red "Error" status

**4. Check Appointment Schedule**
- Navigate to Dashboard > Schedule (`/dashboard/schedule`)
- Review today's appointments and no-show risk scores
- Appointments with no-show risk > 70% need a confirmation call
- Check for scheduling conflicts (double bookings, insufficient buffer times)
- Navigate to Dashboard > Schedule Optimizer (`/dashboard/schedule-optimizer`) for gap detection

**5. Review Daily Review Monitor**
- The `daily-review-monitor` scheduled task runs at 8 AM
- Check Dashboard > Reviews (`/dashboard/reviews`) for any new Google reviews
- Review and approve/edit AI-drafted responses before posting

### Afternoon Check-In (2:00 PM)

**6. Check Lead Pipeline**
- Navigate to Dashboard > Leads (`/dashboard/leads`)
- Review new leads from the morning
- Ensure WF2 (Immediate Lead Response) sent responses within 2 minutes
- Follow up manually on any leads stuck in "New" status for more than 1 hour
- Check WF2b (No-Booking Follow-Up Ladder) is progressing leads through the funnel

**7. Check Consult Prep for Tomorrow**
- Review tomorrow's consultation appointments
- Use the AI Consult Co-pilot (`/dashboard/consult`) to generate pre-consult briefings
- Ensure WF4 has queued pre-consult emails for tomorrow's consultations

**8. Monitor Meta Ads Performance**
- Check the `daily-meta-ads-check` scheduled task results (runs at 9 AM)
- Navigate to Dashboard > Meta Ads (`/dashboard/meta-ads`) for real-time metrics
- Flag any campaign with CPA > 2x target or ROAS < 1.0

### End of Day (6:00 PM)

**9. Submit EOD Recap**
- Navigate to Dashboard > Entry > EOD Recap (`/dashboard/entry/eod-recap`)
- Record today's highlights, issues, and notes
- This data feeds into gamification scoring and the Morning Briefing

**10. Verify Webhook-Triggered Workflows**
- Confirm WF3 (Booking Sync) processed all Mangomint appointment.created events
- Confirm W17 (Post-Treatment) triggered for all completed appointments
- Check Messages Log in Airtable for sent follow-up communications

---

## Weekly Operations

### Monday

**1. Review Revenue Trends**
- Navigate to Dashboard > Revenue (`/dashboard/revenue`)
- Compare week-over-week revenue by provider, service, and category
- Check Revenue Anomaly Detection (`/dashboard/revenue/anomalies`) for any flags
- Review the `weekly-revenue-report` scheduled task output (runs Friday 5 PM)

**2. Review Content Performance**
- Check `weekly-content-batch` scheduled task output (runs Sunday 6 AM)
- Review generated Instagram posts, Reels scripts, Stories, and GBP posts
- Navigate to Dashboard > Social (`/dashboard/social`) for the weekly content calendar
- Approve, edit, or reject generated content before publishing

**3. Review Ad Metrics**
- Navigate to Dashboard > Meta Ads (`/dashboard/meta-ads`)
- Review the Meta Ads AI Optimizer recommendations
- Check the `biweekly-ad-copy-refresh` task if it is the 1st or 15th
- Review ad creative fatigue (frequency > 4.0 or CTR declining)

**4. Client Churn List**
- Navigate to Dashboard > Reactivation (`/dashboard/reactivation`)
- Review the at-risk client list from `GET /api/dashboard/clients/at-risk`
- Churn scores > 70 = critical, 50-70 = high, 30-50 = medium
- WF8 (Reactivation Campaigns) runs Monday at 10 AM -- verify it executed

**5. Reactivation Candidates**
- Review the three reactivation tiers:
  - Tier 1: Lapsed 30 days (gentle re-engagement)
  - Tier 2: Lapsed 60 days (value-focused outreach)
  - Tier 3: Lapsed 90 days (last-chance winback)
- Verify WF8 sent appropriate emails per tier

**6. Provider Performance**
- Navigate to Dashboard > Leaderboard (`/dashboard/leaderboard`)
- WF10 (Provider Performance) runs Monday at 7 AM
- Review provider rankings, revenue per hour, utilization rates
- Use data for staff scheduling decisions

**7. Competitor Intelligence**
- Check `weekly-competitor-intel` scheduled task output (runs Monday 6 AM)
- Navigate to Dashboard > Competitor Intel (`/dashboard/competitor-intel`)
- Review competitive pricing changes, new service launches, and promotional activity

### Wednesday

**8. Mid-Week Pipeline Review**
- Review lead funnel conversion rates: New > Contacted > Consulted > Booked > Completed
- Check Dashboard > Funnel Health for conversion bottlenecks
- Review upcoming consultations and ensure pre-consult prep is complete

### Friday

**9. Week Recap and Planning**
- Review the `weekly-revenue-report` (runs at 5 PM)
- Update inventory reorder needs based on Dashboard > Inventory Intel (`/dashboard/inventory-intel`)
- Plan next week's consultation slots and provider schedules

---

## Monthly Operations

### 1st of the Month

**1. P&L Review**
- Navigate to Dashboard > P&L (`/dashboard/pnl`)
- Review financial health score (0-100) across 5 components: revenue growth, margin health, cost control, cash flow, service mix
- Analyze service profitability -- identify services with margins below 40%
- Review auto-categorized expenses across 8 categories: product costs, labor, rent, marketing, equipment, insurance, supplies, admin
- Compare actual vs projected cash flow from the 6-month projection

**2. Pricing Analysis**
- Navigate to Dashboard > Pricing (`/dashboard/pricing`)
- Review dynamic pricing recommendations from the 6-strategy engine:
  - Demand-based pricing adjustments
  - Temporal (seasonal) pricing opportunities
  - Competitor-reactive pricing gaps
  - Cost-plus margin targets
  - Penetration pricing for new services
  - Bundle pricing optimizations
- Update pricing in Mangomint if changes are approved

**3. Inventory Audit**
- Navigate to Dashboard > Inventory Intel (`/dashboard/inventory-intel`)
- Review reorder point alerts and par level recommendations
- Check waste analysis: products approaching expiration
- Compare supplier performance (price, reliability, lead time)
- Submit purchase orders for items below reorder points

**4. Monthly Reactivation Campaign**
- The `monthly-reactivation-campaign` scheduled task runs on the 1st at 7 AM
- Review the generated campaign content before sending
- Verify all three tiers (30/60/90 day lapsed) are properly segmented

**5. Content Calendar Planning**
- Review last month's content performance metrics
- Plan next month's content themes using the Social Media Auto-Post engine
- Update monthly themes in the social content calendar
- Review and approve the auto-generated content for the upcoming month

### Mid-Month (15th)

**6. Membership Growth Review**
- Analyze membership sign-ups vs cancellations
- Review membership tier distribution and revenue
- WF7 (Membership Engine) tracks daily -- review monthly aggregate
- Identify upsell opportunities from membership usage patterns

**7. Ad Copy Refresh**
- The `biweekly-ad-copy-refresh` runs on the 15th at 7 AM
- Review new ad copy variants
- Test new creative combinations in Meta Ads
- Retire underperforming ad sets

### End of Month

**8. Monthly KPI Report**
- Export KPI trends from Dashboard
- Compare against monthly targets:
  - Revenue target by boss level
  - Booking utilization > 75%
  - Lead-to-booking conversion > 15%
  - Client retention > 85%
  - Google review rating > 4.8
- Document wins and areas for improvement

**9. n8n Workflow Health Check**
- Review all 19 n8n workflows for errors over the past month
- Check webhook registration status with Mangomint
- Verify all Airtable field mappings are current (especially after any Airtable schema changes)
- Test each webhook-triggered workflow manually if error rate > 5%

---

## Troubleshooting Guide

### Airtable Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Dashboard shows stale data | Cache not clearing | Wait 30s-5min for TTL expiry, or redeploy on Vercel to clear in-memory cache |
| "Rate limit exceeded" errors in logs | Exceeding 4.7 req/sec rate limit | Check for runaway SWR hooks with too-frequent refresh intervals. The rate-limited client in `/src/lib/airtable/client.ts` should throttle automatically |
| n8n workflow fails with "INVALID_VALUE_FOR_COLUMN" | Field name mismatch | Use exact field names from CLAUDE.md: `Intake Summary (AI)` not `AI Summary`, `Processing Status` not `Status` |
| Missing records after n8n run | Processing Status not set | Ensure the n8n workflow sets `Processing Status` to "Processed" after handling. Check the single-select field has the value added |
| 422 errors on record creation | Required field missing or wrong type | Verify field types in Airtable match what the API sends. Single-select fields must use pre-defined values |

### n8n Workflow Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| WF1 (Intake) not processing new intakes | Polling filter stale | Check WF1 filter: should query `{Processing Status} = "New"`. Verify new intakes have this status |
| WF2 (Lead Response) not sending emails | Resend API key expired or rate limited | Check Resend dashboard for quota. Verify `RESEND_API_KEY` in n8n credentials |
| WF3 (Booking Sync) missing appointments | Mangomint webhook not registered | Re-register webhook at Mangomint for `appointment.created` pointing to `/webhook/booking-sync` |
| WF4 (Pre-Consult) sending wrong prep instructions | Service category mapping outdated | Update the service-to-category mapping. Categories: laser, injectable, facial, wellness, body, consult |
| Webhook workflows not triggering | n8n webhook URLs changed after update | Check current webhook URLs in n8n and update Mangomint webhook registrations. URLs were last registered Mar 17 |
| Daily workflows not running | Schedule timezone mismatch | Verify n8n instance timezone matches Pacific Time. Cron expressions should be in PT |

### Mangomint Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Dashboard shows "Mangomint: disconnected" | API credentials expired or rate limited | Check Mangomint API status at `/api/dashboard/integrations/mangomint`. Re-authenticate if needed |
| New appointments not syncing | Webhook registration lost | Go to Mangomint admin > Webhooks. Verify the `appointment.created` and `appointment.completed` webhooks point to your n8n URLs |
| Client data mismatch | Duplicate records | Mangomint CompanyID is 876418 with 2,181 clients. Cross-reference by email to detect duplicates |

### Stripe/Square Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Checkout not working | Stripe API key expired | Check `STRIPE_SECRET_KEY` in Vercel env vars. Rani currently uses Square POS for all transactions -- Stripe is not yet connected |
| Transaction reconciliation failing | Plaid connection stale | Navigate to Dashboard > Finance. Use "Reconnect Bank" if Plaid shows disconnected. Test with sandbox first |
| Square data not syncing | Square integration disabled | Check `/api/dashboard/integrations/square` for sync status |

### Twilio/Communication Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| SMS not sending | Twilio credentials in n8n expired | Twilio is configured through n8n, not directly. Check n8n Twilio credentials node |
| Emails bouncing | Resend domain not verified | Check Resend dashboard. Verify SPF/DKIM records for ranibeautyclinic.com |
| Post-treatment follow-ups not sending | W17 webhook not triggering | Verify Mangomint `appointment.completed` webhook is registered and pointing to `/webhook/post-treatment-trigger` |

### AI/Claude Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Chat widget returning errors | Claude API key expired or rate limited | Check `ANTHROPIC_API_KEY` in Vercel env vars. Monitor usage at console.anthropic.com |
| AI recommendations empty | No client data in Airtable | Verify the client has transaction history and appointments. New clients get generic recommendations |
| Knowledge base search returning no results | Pinecone index empty or disconnected | Check `PINECONE_API_KEY` and verify the index has embeddings. Run the embedding pipeline if empty |
| Phone agent not responding | Vapi service down or config outdated | Check `VAPI_API_KEY` and `VAPI_ASSISTANT_ID`. Test at Vapi dashboard |

### Vercel/Deployment Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| 500 errors on API routes | Missing env var after deploy | Check Vercel > Project > Settings > Environment Variables. All 13 env vars must be set |
| Build failing | TypeScript errors | Run `npm run typecheck` locally. Fix errors before pushing |
| Slow API responses | Cold starts on serverless functions | This is normal for first requests. Dashboard uses SWR with stale-while-revalidate to mask latency |

---

## Escalation Matrix

| Severity | Response Time | Who Handles | Examples |
|----------|--------------|-------------|----------|
| P0 -- Critical | 15 minutes | CEO + Dev | Payment processing down, data breach, site completely down |
| P1 -- High | 1 hour | CEO | n8n workflows failing, AI services down, booking sync broken |
| P2 -- Medium | 4 hours | Operations | Stale dashboard data, email delivery issues, single page errors |
| P3 -- Low | 24 hours | Operations | Content generation quality issues, minor UI bugs, non-critical alerts |

---

## Key Contacts and Resources

| Resource | URL/Contact |
|----------|-------------|
| Dashboard | ranibeautyclinic.com/dashboard |
| n8n Workflows | ranibeautyclinic.app.n8n.cloud |
| Mangomint Admin | app.mangomint.com/876418 |
| Vercel Dashboard | vercel.com (project: rani-beauty-clinic) |
| Airtable Base | airtable.com (Base ID: app1SwhSfwe8GKUg4) |
| Anthropic Console | console.anthropic.com |
| Resend Dashboard | resend.com/dashboard |
| Pinecone Console | app.pinecone.io |
| Vapi Dashboard | dashboard.vapi.ai |
