# Rani Beauty Clinic -- Cost Guide

> Monthly cost breakdown by service, free tier limits, optimization opportunities, and usage monitoring.

---

## Table of Contents

1. [Monthly Cost Summary](#monthly-cost-summary)
2. [Service-by-Service Breakdown](#service-by-service-breakdown)
3. [Cost Optimization Opportunities](#cost-optimization-opportunities)
4. [Usage Monitoring Checklist](#usage-monitoring-checklist)
5. [Approaching Limits -- What to Watch For](#approaching-limits)

---

## Monthly Cost Summary

| Service | Free Tier | Estimated Monthly Cost | Notes |
|---------|-----------|----------------------|-------|
| Vercel (Hosting) | Hobby: free | $0-$20 | Pro plan ($20/mo) recommended for production |
| Airtable | 1,000 records free | $20-$45 | Team plan needed for 2,000+ client records |
| Anthropic Claude API | None | $30-$150 | Depends on chat volume + AI engine usage |
| n8n Cloud | Free trial, then paid | $20-$50 | Starter or Pro plan based on execution count |
| Resend (Email) | 100 emails/day | $0-$20 | Free tier sufficient for low volume |
| Pinecone (Vector DB) | Free tier: 1 index | $0 | Free tier covers current usage |
| Meta Ads API | Free | $0 | API is free; ad spend is separate |
| Vapi (Phone AI) | Pay-per-minute | $20-$100 | Depends on call volume |
| Plaid | 100 items free | $0 | Development/sandbox free; production requires plan |
| Mangomint | Paid subscription | Billed separately | Clinic POS/booking system |
| Square | Free for POS | $0 + processing fees | 2.6% + $0.10 per transaction |
| Domain + DNS | Annual | ~$2/mo amortized | ranibeautyclinic.com renewal |
| **Total Estimated** | | **$90-$405/mo** | Excluding ad spend and Mangomint |

---

## Service-by-Service Breakdown

### Vercel (Hosting)

| Plan | Price | Limits |
|------|-------|--------|
| Hobby | Free | 100 GB bandwidth, 100 hrs serverless compute |
| Pro | $20/mo | 1 TB bandwidth, 1000 hrs serverless compute, team access |

**Current usage profile:**
- Serverless function invocations: Dashboard API calls (25 SWR hooks x multiple users)
- Bandwidth: Static assets + API responses
- Edge function invocations: Middleware runs on every request

**Recommendation:** Pro plan for production to get team access, better limits, and analytics.

### Airtable (Database)

| Plan | Price | Record Limit | API Calls |
|------|-------|-------------|-----------|
| Free | $0 | 1,000 records/base | 5 requests/second |
| Team | $20/seat/mo | 50,000 records/base | 5 requests/second |
| Business | $45/seat/mo | 125,000 records/base | 5 requests/second |

**Current usage profile:**
- 12 tables with 2,181+ client records (exceeds free tier)
- Rate-limited client throttles to 4.7 req/sec to stay under the 5/sec limit
- n8n workflows add continuous load (polling every 1-5 minutes)

**Recommendation:** Team plan minimum. Monitor record counts -- approaching 50,000 requires Business plan.

### Anthropic Claude API

| Model | Input Cost | Output Cost | Typical Use |
|-------|-----------|------------|-------------|
| Claude Haiku | $0.25/1M tokens | $1.25/1M tokens | Chat widget |
| Claude Sonnet | $3/1M tokens | $15/1M tokens | AI engines, recommendations |

**Current usage profile:**
- Chat widget: ~$0.01-0.05 per conversation (Haiku)
- AI intake analysis: ~$0.03-0.10 per intake (Sonnet)
- Treatment recommendations: ~$0.02-0.05 per request
- Consult co-pilot: ~$0.05-0.15 per consult prep
- Knowledge base RAG: ~$0.02-0.05 per query
- Social content generation: ~$0.10-0.30 per batch
- Ad copy generation: ~$0.10-0.30 per batch
- Competitor intel: ~$0.05-0.15 per analysis

**Estimated monthly:** $30-$150 depending on volume (higher during growth phases).

**Recommendation:** Monitor usage at console.anthropic.com. Set billing alerts at $100 and $200.

### n8n Cloud

| Plan | Price | Executions | Active Workflows |
|------|-------|-----------|-----------------|
| Starter | $20/mo | 2,500 executions | 5 active |
| Pro | $50/mo | 10,000 executions | 15 active |
| Enterprise | Custom | Unlimited | Unlimited |

**Current usage profile:**
- 19 active workflows
- 5 workflows polling every 1-5 minutes = ~8,600-43,200 executions/month
- 6 daily workflows = ~180/month
- 2 weekly workflows = ~8/month
- 5 webhook-triggered = variable (depends on bookings)

**Recommendation:** Pro plan minimum due to 19 active workflows and high polling frequency. Consider Enterprise if execution counts exceed 10,000.

### Resend (Email)

| Plan | Price | Daily Limit | Monthly Limit |
|------|-------|------------|---------------|
| Free | $0 | 100 emails/day | 3,000/month |
| Pro | $20/mo | 50,000 emails/day | Custom |

**Current usage profile:**
- Contact form confirmations: ~5-20/day
- Post-treatment follow-ups: ~5-15/day (5-step sequence per client)
- Pre-consult emails: ~3-10/day (3-step sequence)
- Reactivation campaigns: ~50-200/week
- Review request emails: ~5-10/day

**Recommendation:** Free tier likely sufficient for current volume. Switch to Pro if daily sends regularly exceed 80.

### Pinecone (Vector DB)

| Plan | Price | Pods | Storage |
|------|-------|------|---------|
| Starter | Free | 1 pod, 1 index | 1 GB |
| Standard | $70/mo | Configurable | Configurable |

**Current usage profile:**
- 12 knowledge documents embedded
- text-embedding-3-small (1536 dimensions)
- Low query volume (RAG searches during chat and consult prep)

**Recommendation:** Free tier is sufficient for current 12-document knowledge base. Monitor if document count grows significantly.

### Vapi (AI Phone Agent)

| Component | Cost |
|-----------|------|
| Phone number | $2/mo |
| Inbound calls | $0.05/min |
| Outbound calls | $0.10/min |
| AI processing | Included with call minutes |

**Current usage profile:**
- Depends on call volume to the clinic
- Typical medspa: 20-50 calls/day, average 3 minutes each

**Estimated monthly:** $20-$100 based on 600-1500 minutes.

### Plaid (Banking)

| Plan | Price | Items |
|------|-------|-------|
| Development | Free | 100 items (sandbox) |
| Production | Pay-per-link | Varies by volume |

**Current usage profile:**
- Single bank account connection for transaction reconciliation
- Low API call volume (sync on-demand, not continuous)

**Recommendation:** Development/sandbox mode is free. Production requires Plaid partnership approval and per-item pricing.

---

## Cost Optimization Opportunities

### 1. Reduce n8n Polling Frequency

**Current:** WF1 and WF2 poll every 1 minute. This generates ~86,400 executions/month just from these two workflows.

**Optimization:** If intake volume is low (under 10/day), increase polling to every 5 minutes. Saves ~69,120 executions/month.

**Impact:** Could downgrade from Pro to Starter plan, saving $30/month.

### 2. Use Claude Haiku for Non-Critical AI Tasks

**Current:** Some AI engines may use Claude Sonnet for tasks that Haiku can handle.

**Optimization:** Use Haiku ($0.25/1M input) instead of Sonnet ($3/1M input) for:
- Social media content scoring
- Simple FAQ responses
- Basic intake field extraction

**Impact:** 10-12x cost reduction on those specific tasks.

### 3. Optimize Airtable Queries

**Current:** Some SWR hooks refresh every 30 seconds even when the dashboard tab is in the background.

**Optimization:**
- Use SWR's `revalidateOnFocus` (already likely set) to pause background refreshes
- Increase cache TTL for less-volatile data (integrations, intelligence engines) to 10 minutes
- Batch Airtable reads where possible (fewer API calls)

**Impact:** Reduces Airtable API call volume by 30-50%, improving rate limit headroom.

### 4. Leverage Vercel Caching

**Optimization:** Add Cache-Control headers to API routes that serve relatively static data:
- Service catalog: cache for 1 hour
- Public pages: cache for 5 minutes (ISR)
- Static assets: cache for 1 year

**Impact:** Reduces serverless function invocations, lowering Vercel costs.

### 5. Consolidate Email Sends

**Current:** Each step of a follow-up sequence is a separate email send.

**Optimization:** Use Resend's batch API to send multiple emails in one API call when sequences trigger simultaneously.

**Impact:** Reduces API calls and helps stay within free tier limits.

---

## Usage Monitoring Checklist

Run this check weekly to catch cost issues early:

### Vercel
- [ ] Check Vercel Dashboard > Usage for function invocations and bandwidth
- [ ] Verify no abnormal spikes in serverless function execution time
- [ ] Review error rate -- 500 errors still consume compute

### Airtable
- [ ] Check total record count across all 12 tables (Team plan limit: 50,000)
- [ ] Monitor rate limit errors in Vercel function logs (search for "429")
- [ ] Review automation execution count in n8n

### Anthropic Claude
- [ ] Check console.anthropic.com for daily/monthly token usage
- [ ] Verify no runaway loops (e.g., AI chat widget calling itself)
- [ ] Review cost per conversation/interaction

### n8n
- [ ] Check execution count in n8n Dashboard > Usage
- [ ] Verify all 19 workflows are executing successfully (no error loops consuming executions)
- [ ] Check for stuck workflows that keep retrying

### Resend
- [ ] Check Resend Dashboard > Analytics for daily send volume
- [ ] Monitor bounce rate (high bounces can hurt deliverability)
- [ ] Verify domain authentication is still valid (SPF/DKIM/DMARC)

### Pinecone
- [ ] Check index storage usage at app.pinecone.io
- [ ] Verify query latency is under 100ms

---

## Approaching Limits

Warning signs to watch for and actions to take:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Airtable record count | > 40,000 | Plan upgrade to Business plan. Archive old records |
| Airtable API 429 errors | > 10/day | Increase cache TTLs, reduce SWR refresh rates |
| n8n execution count | > 8,000/month | Reduce polling frequency or upgrade plan |
| Resend daily emails | > 80/day | Evaluate Pro plan or consolidate email sequences |
| Claude API monthly spend | > $100 | Audit which engines use Sonnet vs Haiku. Switch non-critical to Haiku |
| Vercel function timeout | > 10s average | Optimize Airtable queries, add caching |
| Vercel bandwidth | > 800 GB/month | Enable CDN caching, optimize images |
| Pinecone storage | > 800 MB | Archive old embeddings, evaluate Standard plan |
| Vapi minutes | > 1,000/month | Evaluate call flows for efficiency, add self-service options to website |
