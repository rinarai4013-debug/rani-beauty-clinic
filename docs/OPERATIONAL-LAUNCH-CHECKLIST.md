# Operational Launch Checklist — Attribution + Webhooks

## 1) Configure environment

- Set `CHERRY_WEBHOOK_SECRET` in Vercel.
- Set `MANGOMINT_WEBHOOK_SECRET` in Vercel.
- Set `META_CAPI_WEBHOOK_SECRET` in Vercel.
- Ensure `N8N_WEBHOOK_URL` is set.
- Ensure optional `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are set if using Meta Ads dashboards.

## 2) Register providers/webhooks

### Mangomint
- Register `appointment.created` → your n8n booking sync URL.
- Register `appointment.completed` → your n8n post-treatment URL.
- Register `client.created` and `membership.*` if you use those event paths.

### Cherry
- Register webhook URL in Cherry:
  `https://www.ranibeautyclinic.com/api/webhooks/cherry`
- Add the exact `CHERRY_WEBHOOK_SECRET` to both Cherry and Vercel.

### Meta CAPI
- Register your endpoint:
  `https://www.ranibeautyclinic.com/api/webhooks/meta-capi`
- Add the shared signing secret as `META_CAPI_WEBHOOK_SECRET` in Meta and Vercel.

## 3) Complete Airtable fields

- Create all 21 attribution fields in `docs/AIRTABLE-SETUP.md` exactly as written.
- Add these fields with exact names and option values (single-select lists are strict).
- Keep field names capitalized exactly as listed.

## 4) Verify end-to-end

1. Submit a test lead on a landing page with:
   - `utm_source=google`
   - `utm_medium=cpc`
   - `utm_campaign=smoke`
2. Confirm the lead record includes populated attribution fields in Airtable `Clients`.
3. Confirm the contact form submit returns success (200) and is visible in intake records.
4. Trigger a signed Cherry webhook test and confirm HTTP 200 with expected treatment plan update.
5. Trigger a signed Meta CAPI test payload and confirm `received: true`.
6. Trigger a Mangomint event (or replay) and confirm the workflow still writes to Airtable.

## 5) Ongoing guardrails

- Keep this file open until webhook registrations are re-verified after each Vercel redeploy.
- Rotate webhook secrets whenever a provider support ticket indicates potential leak/recreation.
- Compare attribution dashboards weekly for abrupt source drop-offs (`Direct` and `Other` spikes are warning signs).
