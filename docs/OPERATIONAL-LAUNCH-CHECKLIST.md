# Operational Launch Checklist -- Rani Beauty Clinic

Step-by-step checklist for launching the full Rani Beauty Clinic system (website, dashboard, automations, ads).

---

## 1. Vercel Environment Variables

Set all variables at **Vercel > Project Settings > Environment Variables** for the `ranibeautyclinic.com` deployment.

### Required (site will not function without these)

| Variable | Value / Notes |
|----------|---------------|
| `AIRTABLE_PAT` | Airtable Personal Access Token with read/write on base `app1SwhSfwe8GKUg4` |
| `AIRTABLE_BASE_ID` | `app1SwhSfwe8GKUg4` |
| `DASHBOARD_JWT_SECRET` | Random 64-char secret for HS256 JWT signing (generate with `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | Anthropic API key -- powers AI intake, recommendations, consult co-pilot, chat |
| `RESEND_API_KEY` | Resend API key -- transactional email (contact form confirmations, notifications) |
| `CONTACT_EMAIL` | `info@ranibeautyclinic.com` |
| `FROM_EMAIL` | `Rani Beauty Clinic <noreply@ranibeautyclinic.com>` |
| `N8N_WEBHOOK_URL` | Base URL for n8n instance: `https://ranibeautyclinic.app.n8n.cloud` |
| `CRON_SECRET` | Random secret for authenticating Vercel cron jobs |

### Webhooks

| Variable | Value / Notes |
|----------|---------------|
| `MANGOMINT_WEBHOOK_SECRET` | Provided by Mangomint support after webhook registration (see Section 3) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe Dashboard after webhook endpoint creation (see Section 5) |
| `CHERRY_WEBHOOK_SECRET` | Secret from Cherry dashboard after webhook registration (see Section 4) |
| `META_CAPI_WEBHOOK_SECRET` | Secret for Meta Conversions API server-side events |

### Ads / Tracking

| Variable | Value / Notes |
|----------|---------------|
| `META_ACCESS_TOKEN` | Meta Marketing API access token (System User token recommended) |
| `META_AD_ACCOUNT_ID` | Meta ad account ID (format: `act_XXXXXXXXXX`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID -- client-side, prefixed with `NEXT_PUBLIC_` so it is available in the browser |

### Optional (features degrade gracefully without these)

| Variable | Value / Notes |
|----------|---------------|
| `PINECONE_API_KEY` | Pinecone vector DB for RAG knowledge base |
| `VAPI_API_KEY` | Vapi.ai AI phone receptionist |
| `VAPI_ASSISTANT_ID` | Vapi assistant ID for the Rani phone agent |

---

## 2. Airtable Setup

- **Base ID:** `app1SwhSfwe8GKUg4` -- should already contain 12 tables (Clients, Client Intakes, Intake Intelligence, Appointments, Packages, Memberships, Transactions, Messages Log, Reviews, KPI Snapshots, Alerts, Competitor Intelligence).
- **Field creation:** See `docs/AIRTABLE-SETUP.md` for the complete field specification per table.
- **Verify critical fields exist:**
  - Client Intakes: `Full Name`, `Email`, `Phone Number`, `Intake Summary (AI)`, `Program Plan (AI)`, `Cost Breakdown (AI)`, `Timeline (AI)`, `Suggested Next Step (AI)`, `Treatment Value (AI)`, `Processing Status` (single select: New / Processed / Responded)
  - Reviews: `Star Rating` (not "Rating"), `AI Draft Response` (not "Generated Response"), `Internal Notes` (plural)
  - Appointments: `Created Date`, `MangoMint Appointment ID`, `Booking Source`

---

## 3. Mangomint Webhook Registration

Mangomint does not have a self-service webhook UI. You must contact Mangomint support.

### Website webhook

| Field | Value |
|-------|-------|
| URL | `https://ranibeautyclinic.com/api/webhooks/mangomint` |
| Events | All appointment events (used for signature validation) |

### n8n webhooks

| Event | URL |
|-------|-----|
| `appointment.created` | `https://ranibeautyclinic.app.n8n.cloud/webhook/booking-sync` |
| `appointment.completed` | `https://ranibeautyclinic.app.n8n.cloud/webhook/post-treatment-trigger` |

### After registration

1. Request the webhook signing secret from Mangomint support.
2. Set `MANGOMINT_WEBHOOK_SECRET` in Vercel environment variables.
3. Redeploy the Vercel project so the new variable takes effect.

---

## 4. Cherry Webhook Registration

Register the webhook in the Cherry provider dashboard.

| Field | Value |
|-------|-------|
| URL | `https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger` |
| Events | Application approved, application completed, payment events |

### After registration

1. Copy the webhook secret from Cherry.
2. Set `CHERRY_WEBHOOK_SECRET` in Vercel environment variables.
3. Redeploy.

---

## 5. Stripe Webhook Registration

Register in **Stripe Dashboard > Developers > Webhooks > Add endpoint**.

| Field | Value |
|-------|-------|
| Endpoint URL | `https://ranibeautyclinic.com/api/webhooks/stripe` |
| Events to listen for | `payment_intent.succeeded`, `checkout.session.completed` |

### After registration

1. Copy the **Signing secret** (starts with `whsec_`).
2. Set `STRIPE_WEBHOOK_SECRET` in Vercel environment variables.
3. Redeploy.

---

## 6. n8n Credential Setup

All credentials are configured at `https://ranibeautyclinic.app.n8n.cloud` under Settings > Credentials.

### Already configured (9)

Airtable PAT, Anthropic (Claude), Twilio, SendGrid, SMTP, Typeform API, Google Docs OAuth2, Google Drive OAuth2, Google Sheets OAuth2.

### Must add

| Credential | Needed by | How to get |
|------------|-----------|------------|
| Mangomint API key | WF3 (Booking Sync), W17 (Post-Treatment) | Mangomint Settings > API |
| Stripe API key | WF6 (Financing Automation) | Stripe Dashboard > Developers > API Keys |
| Cherry API key | WF6 (Financing Automation) | Cherry provider dashboard |

After adding each credential, test the connection in n8n before proceeding.

---

## 7. Ad Launch

### Reference

See `docs/UTM-TEMPLATES.md` for the full UTM parameter specification.

### Meta Ads

1. Create campaigns in Meta Ads Manager.
2. Apply UTM parameters to all ad URLs per the UTM template doc.
3. Confirm the Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`) fires on page load using Meta Pixel Helper browser extension.
4. Confirm server-side Conversions API events are sending (check Events Manager > Test Events).

### Google Ads

1. Create campaigns in Google Ads.
2. Apply UTM parameters to all ad URLs per the UTM template doc.
3. Confirm Google Ads conversion tracking is firing.

### Verify attribution end-to-end

1. Open the site with UTM params in the URL (e.g., `?utm_source=meta&utm_medium=paid&utm_campaign=test`).
2. Submit the contact form.
3. Check Airtable > Client Intakes for the new record.
4. Check Airtable > Clients for attribution fields (`utm_source`, `utm_medium`, `utm_campaign`) populated on the linked client record.

---

## 8. Verification Checklist

Run through every item below before declaring the system live.

### Contact form and intake pipeline

- [ ] Submit a test contact form on ranibeautyclinic.com/contact
- [ ] Confirm a new record appears in Airtable > Client Intakes within 60 seconds
- [ ] Confirm an email notification arrives at `info@ranibeautyclinic.com` via Resend
- [ ] Wait 1-2 minutes for WF1 (Intake Intelligence Engine) to process
- [ ] Confirm `Intake Summary (AI)`, `Program Plan (AI)`, and related AI fields are populated
- [ ] Confirm `Processing Status` transitions from `New` to `Processed`

### UTM attribution

- [ ] Submit a contact form with UTM params appended to the URL
- [ ] Confirm Airtable > Clients record has attribution fields populated

### Mangomint webhooks

- [ ] Trigger a test Mangomint webhook (create a test appointment in Mangomint)
- [ ] Check n8n execution log for WF3 (Booking Sync) -- confirm it ran successfully
- [ ] Complete a test appointment in Mangomint
- [ ] Check n8n execution log for W17 (Post-Treatment) -- confirm it ran successfully

### n8n workflow health

- [ ] Open n8n at `ranibeautyclinic.app.n8n.cloud`
- [ ] Verify all 19 workflows show as Active
- [ ] Check execution log for the last 24 hours -- no unexpected failures
- [ ] Confirm hourly pollers (WF1, WF1b, WF2, WF2b, WF5) have recent successful runs

### Vercel deployment

- [ ] Check Vercel function logs (Vercel Dashboard > Logs) for any 500 errors
- [ ] Confirm all API routes return 200 on basic GET requests (KPIs, schedule, alerts)
- [ ] Confirm the dashboard login works at `/dashboard` with valid credentials

### Email

- [ ] Verify Resend domain verification is complete for `ranibeautyclinic.com`
- [ ] Confirm test email from contact form submission arrived with correct formatting

### Ads (if launched)

- [ ] Confirm Meta Pixel fires on homepage, contact page, and thank-you page
- [ ] Confirm UTM params from ad click persist through to Airtable record
- [ ] Check Meta Events Manager for server-side events arriving

---

## Post-Launch Monitoring

After go-live, monitor these daily for the first week:

1. **n8n execution log** -- check for new failures each morning
2. **Vercel function logs** -- watch for 500 errors or timeouts
3. **Airtable > Client Intakes** -- confirm AI fields are being populated on new submissions
4. **Airtable > Alerts** -- check for system-generated alerts from W12 (Alert Engine)
5. **WF8 and WF10** -- confirm these weekly workflows succeed on their next Monday run
