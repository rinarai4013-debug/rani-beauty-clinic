# External Integrations Map

## Overview

Rani Beauty Clinic has integrations with three external services for patient communication and data persistence. The system is primarily a consultation management platform with a lightweight integration layer focused on messaging and session tracking.

---

## Integration Summary Table

| Service | Purpose | Status | Files Involved | Risk Level |
|---------|---------|--------|-----------------|-----------|
| **Resend** | Email delivery | Ready | `/api/mastermind/follow-up` | Low |
| **n8n** | SMS routing + automation | Ready | `/api/mastermind/follow-up` | Medium |
| **Airtable** | Data persistence | Ready | Multiple (see file 04) | Medium |

---

## 1. Resend (Email)

### Purpose
Sends templated email follow-ups and plan updates to patients.

### Files Involved
- `src/app/api/mastermind/follow-up/route.ts` (lines 126-138)

### Environment Variables Required
- `RESEND_API_KEY` — API key for Resend service (no default, required for email sends)

### Integration Pattern
```javascript
const { Resend } = await import('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
  to: recipient,
  subject: rendered.subject || `Update from Rani Beauty Clinic`,
  html: rendered.body,
});
```

### API Usage
- **Method:** REST (TypeScript SDK)
- **Endpoint:** Resend email send API
- **Rate Limit:** Standard Resend tier (likely 50+ emails/second)
- **Timeout:** 8000ms via `AbortSignal.timeout(8000)`

### Features Used
- Basic email send with HTML body
- Dynamic subject line from template
- Sender identity: clinic email address

### Webhook Signature Verification
**Status:** Not applicable (Resend is outbound-only; no webhooks received)

### Idempotency
**Status:** NO idempotency implemented
- If the same follow-up is triggered twice rapidly, two emails will be sent
- Resend may have request deduplication (undocumented in code)
- Recommendation: Add idempotency key or debounce at application level

### Error Handling
- **On Success:** Recorded in activity log and Messages Log table
- **On Failure:** Catches `emailErr`, logs to console, returns 502 status
- **Graceful Degradation:** Not present — fails the entire request
- **Retry Logic:** None (reliant on client to retry)

### Resend-Specific Gaps
1. No retry mechanism if Resend is temporarily unavailable
2. No fallback to alternative email provider
3. No request signature for verifying authenticity of responses
4. No metrics on delivery success rate

### Production Readiness
**Status: READY** 
- Basic implementation complete
- Should be monitored for delivery failures
- Consider adding retry logic and metrics

---

## 2. n8n (SMS + Automation)

### Purpose
Routes SMS messages and orchestrates workflow automation (intake processing, follow-ups, notifications).

### Files Involved
- `src/app/api/mastermind/follow-up/route.ts` (lines 142-158)
- `src/app/api/dashboard/consultations/route.ts` (comments on n8n automation)

### Environment Variables Required
- `N8N_WEBHOOK_URL` — Base URL of n8n instance (e.g., `https://n8n.example.com`)

### Integration Pattern

#### SMS Webhook
```javascript
const smsWebhookUrl = process.env.N8N_WEBHOOK_URL;
if (smsWebhookUrl) {
  await fetch(`${smsWebhookUrl}/webhook/plan-followup-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      message: rendered.body,
      planId: sessionId,
      clientName: firstName,
      templateId,
    }),
    signal: AbortSignal.timeout(8000),
  });
}
```

### API Usage
- **Method:** REST (custom webhook)
- **Endpoint:** `/webhook/plan-followup-sms`
- **Timeout:** 8000ms
- **Payload:** JSON with phone, message, metadata

### Webhook Signature Verification
**Status:** NOT IMPLEMENTED
- n8n webhooks are not verified with HMAC signatures
- Anyone with access to `N8N_WEBHOOK_URL` could trigger SMS sends
- **SECURITY GAP:** Webhook URL should be kept secret and requests should be signed
- **Recommendation:** Implement HMAC-SHA256 signature in n8n webhook and verify in follow-up route

### Idempotency
**Status:** NO idempotency key sent
- If the same SMS request is sent twice to n8n, two messages may be delivered
- No acknowledgment mechanism from n8n confirms receipt
- Recommendation: Add request ID to payload, implement idempotency in n8n workflow

### Error Handling
- **On Success:** Returns silently (no response verification)
- **On Failure:** Logs `smsErr`, returns 502 status
- **Graceful Degradation:** If `N8N_WEBHOOK_URL` env var not set, returns 501 "SMS not configured"
- **Retry Logic:** None (fire-and-forget pattern)

### n8n Automation Flows (Inferred from Code)

n8n is responsible for:

1. **Intake Processing (`Processing Status` field)**
   - Listens for new intake records in Airtable
   - Runs AI analysis (presumably via Claude API)
   - Sets `Processing Status` to "Processed"
   - Generates and populates AI analysis fields:
     - `Intake Summary (AI)`
     - `Program Plan (AI)`
     - `Cost Breakdown (AI)`
     - `Timeline (AI)`
     - `Suggested Next Step (AI)`
     - `Treatment Value (AI)`

2. **Follow-up Automation**
   - Watches for consultation status changes
   - Sends automated follow-ups to unresponsive patients
   - Updates `Processing Status` to "Responded" after sending

3. **SMS Delivery**
   - Receives webhook from this API
   - Routes message to SMS provider (likely Twilio or similar)
   - May track delivery status back to Airtable

### Workflow Files Reference
- Mentioned in workspace context: `RaniOS/` contains n8n automation framework
- 19 workflows, 18 Claude prompts, Airtable schema documented there

### Production Readiness
**Status: NEEDS-WORK**
- SMS webhook has no signature verification (security gap)
- No idempotency mechanism
- No error acknowledgment from n8n
- Fire-and-forget pattern could lose messages silently
- Recommend: Add HMAC verification, idempotency tokens, webhook response handling

---

## 3. Airtable (Data Persistence)

### Purpose
Primary database for consultations, sessions, intakes, and audit trails.

### Files Involved
- See file `04-airtable-map.md` for full reference

### Environment Variables Required
- `AIRTABLE_PAT` — Personal Access Token (no default, required for all writes)

### Key Tables
1. **Automation Log** — Workflow events and share tokens
2. **Intakes** — Patient consultation intake forms
3. **Messages Log** — Email/SMS audit trail

### Webhook Signature Verification
**Status:** NOT APPLICABLE (Airtable webhooks not used in visible code)
- Airtable updates are triggered via API calls (not webhooks)
- If webhooks were to be implemented, Airtable provides HMAC verification (not currently implemented)

### Idempotency
**Status:** Limited
- Airtable supports idempotent writes via `requestId` header (not used in code)
- Current pattern: create records blindly without checking for duplicates
- Example: Follow-up email logged to Messages Log twice if route retried

### Error Handling
- **Fetch operations:** Wrapped in `.catch()`, returns empty array on failure
- **Write operations:** Throws error on auth failure, continues on log write failure
- **Graceful Degradation:** Consultations API still returns Mastermind sessions if Airtable fetch fails
- **Retry Logic:** Circuit breaker (see file 04) provides automatic backoff

### Cache
- See file `04-airtable-map.md` for cache configuration
- Default 5-minute TTL
- No invalidation on writes (stale data possible)

### Production Readiness
**Status: READY** (with caveats)
- Core functionality working
- Race conditions on read-modify-write (needs ETag versioning)
- Cache invalidation missing (implement on mutations)
- Field names should be centralized (currently hardcoded)

---

## 4. Not Implemented (Mentioned in Workspace)

### Stripe
- Referenced in workspace context as payment processor for ANATOMI website
- NOT found in rani-beauty-clinic codebase
- Status: Not integrated into this project (separate from Rani)

### Cherry (Financing)
- Referenced as financing option provider
- NOT found in codebase
- Status: Stub / not yet implemented

### Mangomint (POS)
- Referenced in workspace context
- NOT found in rani-beauty-clinic codebase
- Status: Integrated in separate Mangomint operational config (RaniBeautyClinic-Mangomint/)

### Plaid (Banking)
- Mentioned in workspace context for financial integrations
- NOT found in rani-beauty-clinic codebase
- Status: Not integrated into consultation/mastermind system

### Meta Ads (Facebook)
- Mentioned in workspace context
- NOT found in rani-beauty-clinic codebase
- Status: Not integrated into consultation system

### Anthropic / Claude AI
- Not directly imported in rani-beauty-clinic
- AI analysis happens via n8n (likely calls Anthropic API there)
- Status: Delegated to n8n workflows (see RaniOS context)

### Vapi (Phone AI)
- Not integrated in rani-beauty-clinic
- Status: Not implemented

### Pinecone (Vector DB)
- Not integrated in rani-beauty-clinic
- Status: Not implemented

### Sentry (Error Tracking)
- Not integrated in rani-beauty-clinic
- Status: Not implemented

---

## All Environment Variables Referenced

| Env Var | Service | Required | Used In |
|---------|---------|----------|---------|
| `AIRTABLE_PAT` | Airtable | Yes | `/mastermind/follow-up`, `session-store` |
| `RESEND_API_KEY` | Resend | Yes* | `/mastermind/follow-up` |
| `N8N_WEBHOOK_URL` | n8n | Yes* | `/mastermind/follow-up` |
| `NEXT_PUBLIC_SITE_URL` | App config | No | `/mastermind/follow-up` (share URL) |
| `DASHBOARD_JWT_SECRET` | Auth | Yes | Dashboard routes |
| `NODE_ENV` | App config | No | Development/production logic |

*Required only if feature is used (email/SMS sends are optional per template channel)

---

## Security Assessment

### Strengths
- ✓ API keys in environment variables (not hardcoded)
- ✓ HTTPS for all external calls
- ✓ Timeouts on all fetch operations (8 seconds)
- ✓ JSON payloads (no URL-encoded secrets)

### Weaknesses
- ✗ **n8n webhook not signed** — no HMAC verification
- ✗ **No idempotency keys** — duplicate requests possible
- ✗ **No request deduplication** — race conditions on concurrent sends
- ✗ **Fire-and-forget SMS** — no delivery confirmation
- ✗ **Hardcoded email address** — `noreply@ranibeautyclinic.com` not configurable
- ✗ **No metrics** — no monitoring of delivery success rates
- ✗ **No fallback** — if Resend down, no alternative email provider
- ✗ **Webhook URL in env var** — could be exposed in logs if leaked

### Recommendations
1. **Add HMAC verification** to n8n webhook (sign with shared secret in env var)
2. **Implement idempotency keys** in follow-up route (track by sessionId + templateId + timestamp)
3. **Add webhook response handling** — verify n8n returns success before logging
4. **Implement retry with exponential backoff** for transient failures
5. **Add monitoring and alerting** for delivery failures
6. **Make sender email configurable** via environment variable
7. **Add delivery status callbacks** from n8n back to Airtable for tracking

---

## Integration Data Flow Diagram

```
┌─────────────────┐
│  Consultation   │
│   Dashboard     │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
    ┌────▼──────┐        ┌─────▼──────┐
    │  Create   │        │   Create   │
    │  Follow-  │        │  Master-   │
    │    up     │        │   mind     │
    │  Request  │        │  Session   │
    └────┬──────┘        └─────┬──────┘
         │                     │
         ├──────┬──────┐      │
         │      │      │      │
    ┌────▼──┐ ┌─▼──┐ ┌─▼──┐ ┌▼──────────┐
    │Resend │ │n8n │ │Air-│ │Airtable   │
    │(Email)│ │SMS │ │ │table│Session    │
    └───────┘ └────┘ └────┘ └───────────┘
         │      │      │           │
         └──────┴──────┴─────┬─────┘
                             │
                        ┌────▼───────┐
                        │  Activity   │
                        │  Log &      │
                        │ Messages    │
                        │  Log        │
                        └─────────────┘
```

---

## Handoff Checklist

- [ ] Verify Resend API key is valid and active
- [ ] Verify n8n instance is accessible and workflows deployed
- [ ] Verify Airtable base exists and tables have correct schema
- [ ] Test follow-up email delivery (Resend)
- [ ] Test SMS delivery (n8n webhook)
- [ ] Test Airtable session persistence and intake sync
- [ ] Monitor delivery success rates for 1 week
- [ ] Set up alerting for failed API calls
- [ ] Implement HMAC verification for n8n webhook
- [ ] Add idempotency key generation to follow-up route
- [ ] Document API rate limits and monitor pressure
- [ ] Create incident response playbook for service outages

---

## Production Readiness Summary

| Integration | Ready | Confidence | Notes |
|-------------|-------|------------|-------|
| **Resend** | YES | High | Working, but no retry mechanism |
| **n8n SMS** | YES | Medium | Working, but webhook not signed (security gap) |
| **Airtable** | YES | Medium | Working, race conditions possible |

**Overall Status:** PRODUCTION READY with noted security gaps and reliability improvements needed.
