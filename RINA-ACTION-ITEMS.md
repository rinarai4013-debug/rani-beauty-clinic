# Rina's Action Items — RaniOS Launch Checklist

Everything below requires YOUR action (not code). These are the remaining items to get RaniOS to 100%.

---

## PRIORITY 1: Do This Week (Launch Blockers)

### API Keys & Credentials
- [ ] **Twilio SMS** — Paste 3 values into `.env.local`:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - Get from: https://console.twilio.com → Account Info

- [ ] **Stripe Webhook Secret** — Paste into `.env.local`:
  - `STRIPE_WEBHOOK_SECRET`
  - Get from: https://dashboard.stripe.com/webhooks → click your endpoint → Signing secret

- [ ] **Mangomint Webhook Secret** — Paste into `.env.local`:
  - `MANGOMINT_WEBHOOK_SECRET`
  - Get from: Mangomint Settings → Integrations → Webhooks

- [ ] **Meta Ads Token** — Generate a System User token:
  1. Go to https://business.facebook.com/settings/system-users
  2. Create a System User (Admin role)
  3. Generate token with `ads_read`, `ads_management`, `pages_read_engagement` permissions
  4. Paste as `META_ACCESS_TOKEN` in `.env.local`

### Security
- [ ] **Change Dashboard Password** — Current temp passwords are `RaniGlow2026!` and `RaniFront2026!`
  - Update `DASHBOARD_USERS` in `.env.local` with strong passwords
  - Share new frontdesk password securely with team

### Phone Number Verified
- [x] Phone number updated to **(425) 539-4440** across all files

---

## PRIORITY 2: This Month (Compliance)

### HIPAA Compliance
- [ ] **Sign BAA with Airtable** — Email support@airtable.com requesting a Business Associate Agreement
  - Required because Airtable stores client health data (skin concerns, treatment history, photos)

- [ ] **Sign BAA with Resend** — Email support@resend.com
  - Required because emails contain client names + treatment info

- [ ] **Sign BAA with n8n** — Email or check n8n cloud settings
  - Required because n8n processes intake data with health info

- [ ] **Sign BAA with Vercel** — Check if Vercel offers HIPAA-compliant hosting
  - If not available, consider migrating to AWS/Azure with BAA

### Legal Review
- [ ] **Terms of Service** — Have attorney review `/src/app/terms/page.tsx`
  - Currently has TODO placeholder comments for legal review

- [ ] **Privacy Policy** — Have attorney review `/src/app/privacy/page.tsx`
  - Must accurately describe data collection, storage, sharing practices
  - Must mention Airtable, Resend, n8n as data processors
  - Must describe photo storage and retention

- [ ] **HIPAA Notice of Privacy Practices** — Create and post in clinic
  - Required for all healthcare-adjacent businesses handling PHI

### Consent Forms
- [ ] **Update intake consent** — Add language covering:
  - AI-powered treatment plan generation
  - Photo storage for treatment visualization
  - SMS/email communication consent
  - Data retention policy (how long you keep records)

---

## PRIORITY 3: Before Go-Live (Polish)

### Voice Clone (ElevenLabs)
- [ ] **Record the 25-minute voice clone script**
  - Script is at: `VOICE-CLONE-RECORDING-SCRIPT.md`
  - Record in a quiet room with good microphone
  - Upload to ElevenLabs: https://elevenlabs.io
  - Paste Voice ID as `ELEVENLABS_VOICE_ID` in `.env.local`
  - Then swap Vapi phone agent from Deepgram to ElevenLabs voice

### Plaid (Bank Sync)
- [ ] **Complete Plaid production questionnaire**
  - Go to: https://dashboard.plaid.com/overview
  - Submit production access application
  - This enables real bank account syncing for P&L dashboard

### Content Audit
- [ ] **Review all blog posts** — Some may have templated/placeholder content
  - Check `/src/data/blog/` for posts that need real content

- [ ] **Review SEO pages** — Some seasonal/demographic pages may need real copy
  - Spot check a few at ranibeautyclinic.com/[service]-for-[demographic]

### Photo Simulation
- [ ] **Test the photo simulation** — Go to any treatment plan page, upload a selfie, see the filters work
  - The simulation is illustrative, not AI-generated — make sure you're comfortable with the quality
  - Consider adding a real before/after photo gallery from actual clients

---

## PRIORITY 4: Post-Launch (Growth)

### Scheduled Tasks Verification
- [ ] **Verify 7 scheduled tasks are running in Claude Code:**
  - `weekly-content-batch` — Sunday 6 AM
  - `weekly-competitor-intel` — Monday 6 AM
  - `biweekly-ad-copy-refresh` — 1st & 15th at 7 AM
  - `monthly-reactivation-campaign` — 1st at 7 AM
  - `daily-review-monitor` — Daily 8 AM
  - `weekly-revenue-report` — Friday 5 PM
  - `daily-meta-ads-check` — Daily 9 AM

### Client Portal
- [ ] **Set up Softr client portal** (if not already done)
  - Clients view their treatment plans at `/plan/[id]?code=XXXXXX`
  - Access codes are generated automatically and included in plan notification emails

### Membership Checkout
- [ ] **Build self-serve membership signup page** (currently no online signup)
  - Requires Stripe subscription product setup
  - 3 tiers: HALO $199/mo, GLOW $399/mo, ELITE AURA $599/mo

### Analytics
- [ ] **Verify Google Analytics 4 is tracking** — Check GA4 dashboard for events:
  - `plan_viewed`, `plan_tier_selected`, `plan_financing_clicked`
  - `consultation_submitted`

- [ ] **Verify Meta Pixel is firing** — Check Events Manager for conversion events

---

## Quick Reference

| What | Where |
|------|-------|
| Dashboard login | ranibeautyclinic.com/dashboard/login |
| Plan Builder | ranibeautyclinic.com/dashboard/plan-builder |
| n8n Workflows | ranibeautyclinic.app.n8n.cloud |
| Airtable Base | airtable.com/app1SwhSfwe8GKUg4 |
| Mangomint | app.mangomint.com/876418 |
| Vercel Dashboard | vercel.com (check deployments) |
| Clinic Phone | (425) 539-4440 |
| Clinic Email | info@ranibeautyclinic.com |

---

*Generated 2026-03-21 by RaniOS Build System*
