# Mangomint Configuration Guide — Rani Beauty Clinic

## Account Details
- **Platform:** Mangomint (app.mangomint.com)
- **Company ID:** 876418
- **Account URL:** https://app.mangomint.com/876418
- **Booking Link:** https://booking.mangomint.com/876418
- **Shareable URL:** https://booking.mangomint.com/ranibeautyclinic1
- **Logged in as:** Rina Rai (Owner)

---

## Current Status (Audited March 14, 2026)

### Client Database
- **Total Clients:** 2,181
- **Data Fields:** Name, Email, Phone
- **Data Quality:** Some clients missing email or phone

### Appointments (YTD — Jan 1 to Mar 14, 2026)
- **Total Completed:** 9 (from BI report — see note below)
- **Total Booked Hours:** 9.83
- **Available Hours:** 108
- **Utilization Rate:** 9.10%
- **Laser Room:** 8 appointments (9.50 hours) — primary active room
- **Sukhraj Rai:** 1 appointment (0.33 hours)
- **Rina Rai:** 0 completed appointments

> **IMPORTANT NOTE:** The BI report only counts COMPLETED/CHECKED-OUT appointments.
> The Calendar shows 15+ booked appointments this week alone (Mar 14-19).
> This means appointments are NOT being checked out after they occur.
> **Action Required:** After every appointment, staff MUST check out the client to record the visit properly.

### Active Services (from Calendar)
- LHR Full Brazilian
- LHR Full Body
- LHR Underarms
- LHR Full Face
- BIOREPEEL — FACE
- SIGNATURE (likely HydraFacial Signature)
- Various other booked services

### Membership Plans (3 tiers)
1. **Angel Glow Up — HALO**
2. **Angel Glow Up — GLOW**
3. **Angel Glow Up — ELITE AURA**
- Commission: Based on regular price
- No active memberships currently sold

### Sales/Payments
- **$0 processed through Mangomint YTD**
- **Square handles all payment processing** — Mangomint is booking-only
- This is normal for clinics using Square POS

---

## What Was Completed

### 1. Booking Widget Integration (DONE)
**File Modified:** `/src/app/layout.tsx`

Added the Mangomint booking overlay widget to the website. This intercepts all "Book Now" links that point to `https://booking.mangomint.com/876418` and opens an in-page overlay instead of redirecting away from the website.

```tsx
<head>
  <Analytics />
  {/* Mangomint Online Booking Widget */}
  <Script id="mangomint-config" strategy="afterInteractive">
    {`window.Mangomint = window.Mangomint || {}; window.Mangomint.CompanyId = 876418;`}
  </Script>
  <Script
    src="https://booking.mangomint.com/app.js"
    strategy="afterInteractive"
  />
</head>
```

**Impact:** All 8+ "Book Now" CTAs across the website now open an overlay booking form instead of redirecting to booking.mangomint.com. This keeps clients on ranibeautyclinic.com during the booking process, reducing drop-off.

**Affected Components (all already using `clinicInfo.booking.url`):**
- `Navbar.tsx` — Desktop + mobile "Book Now" buttons
- `MobileCTA.tsx` — Sticky bottom CTA
- `ServicePageTemplate.tsx` — "Book This Treatment", "Get a Quote"
- `CTABanner.tsx` — "Book Your Consultation"
- `MeetTheTeam.tsx` — Team member booking links
- `cost/[slug]/page.tsx` — Cost page CTAs
- `thank-you/page.tsx` — Post-form CTA
- `compare/[slug]/page.tsx` — Comparison page CTAs

### 2. Webhook Integration (DONE — Code Ready)
**Files:**
- `/src/lib/mangomint/client.ts` — API client + webhook verification
- `/src/app/api/dashboard/integrations/mangomint/route.ts` — Sync endpoints
- `/src/app/api/dashboard/integrations/sync-all/route.ts` — Multi-platform sync

**Webhook Events Supported:**
- `appointment.created` / `appointment.updated` / `appointment.cancelled` / `appointment.completed`
- `client.created` / `client.updated`
- `sale.completed`

**To activate:** Contact Mangomint support to register webhook URL:
`https://ranibeautyclinic.com/api/webhooks/mangomint`

### 3. API Client (DONE — Awaiting API Key)
The Mangomint API client is fully built with:
- Rate-limited requests
- Appointment fetching with date filters
- Client search and pagination
- Service catalog access
- HMAC-SHA256 webhook signature verification

**To activate:** Add `MANGOMINT_API_KEY` to `.env.local`
Get the key from: Mangomint Settings → Developer → API Keys

---

## Settings to Optimize (Manual Steps)

### Priority 1: Fix Website URL
**Location:** Settings → Business Details
- **Current:** `http://www.ranibeautyclinic.com` (HTTP, not HTTPS)
- **Change to:** `https://ranibeautyclinic.com`
- This affects how the clinic appears in booking confirmations and automated messages

### Priority 2: Extend Advance Booking Window
**Location:** Settings → Online Booking → Preferences
- **Current:** 60 days maximum advance booking
- **Change to:** 120 days (4 months)
- **Why:** Seven-figure medspas allow longer advance booking to capture seasonal packages (summer body prep, holiday party season, wedding prep). 60 days is too restrictive for treatment packages that span months.

### Priority 3: Enable "Avoid Gaps"
**Location:** Settings → Online Booking → Preferences
- **Current:** Disabled
- **Change to:** Enabled
- **Why:** This setting optimizes the schedule by suggesting appointment times that minimize gaps between bookings. Reduces dead time and maximizes provider utilization. Critical for going from 9.10% utilization to the 65-80% target of a seven-figure clinic.

### Priority 4: Allow Booking Same Service Multiple Times
**Location:** Settings → Online Booking → Preferences
- **Current:** Disabled
- **Change to:** Enabled
- **Why:** Clients often want to book multiple LHR areas (Brazilian + Underarms + Full Face) in one session. Disabling this forces them to make separate bookings or call the clinic.

### Priority 5: Enable Photo Collection During Booking
**Location:** Settings → Online Booking → Preferences
- **Current:** Disabled
- **Change to:** Enabled
- **Why:** Before-photos during booking give providers pre-consultation context. Especially valuable for skin concerns, pigmentation issues, and treatment planning. Shows professionalism and clinical rigor.

### Priority 6: Automated Message Optimization
**Location:** Settings → Automated Messages
- **Currently Active:**
  - Appointment Booked — Email + Text to client
  - Appointment Canceled — notifications
  - Appointment Rescheduled — notifications
  - Form Submitted — notifications

- **Recommended Additions:**
  - **24-hour reminder** (text) — reduces no-shows by 30-40%
  - **2-hour reminder** (text) — "See you soon!" with parking/arrival instructions
  - **Post-appointment follow-up** (email, 24hr after) — care instructions + rebooking CTA
  - **Review request** (text, 48hr after) — "How was your visit? Leave a Google review"
  - **Rebooking reminder** (email, 3-4 weeks after) — for recurring services like HydraFacial/LHR

### Priority 7: Check Out Appointments Properly
**This is the #1 operational fix needed.**
- The BI reports show only 9 completed appointments YTD, but the calendar shows 15+ booked THIS WEEK
- Staff must check out every client after their appointment
- This affects: revenue tracking, utilization metrics, client visit history, rebooking reminders

---

## Client Export Instructions

### How to Download All 2,181 Client Records:
1. Go to **Clients** tab in Mangomint
2. Click **OPTIONS** (top-right)
3. Scroll to bottom of the panel
4. Click **DOWNLOAD** under "Export"
5. CSV file downloads with Name, Email, Phone columns
6. Import to Airtable Clients table for CRM/dashboard sync

### Segmented Exports (using filters in OPTIONS panel):
- **Active clients:** Filter "Had appointment" → Last 90 days
- **Lapsed clients:** Filter "Last appointment" → More than 180 days ago
- **LHR clients:** Filter "Had service" → select LHR services
- **New clients:** Filter "Client profile created" → Last 30 days

---

## Integration Architecture

```
┌─────────────────────┐
│  ranibeautyclinic.com│
│  (Next.js on Vercel) │
├─────────────────────┤
│  Booking Widget     │──→ booking.mangomint.com/876418 (overlay)
│  (layout.tsx)       │
├─────────────────────┤
│  API Routes         │
│  /api/dashboard/    │
│  integrations/      │
│  mangomint/         │──→ Mangomint API (when API key added)
│                     │
│  /api/webhooks/     │
│  mangomint          │←── Mangomint Webhooks (when registered)
├─────────────────────┤
│  Airtable CRM      │──→ Client sync (API or CSV import)
│  Clients table      │
└─────────────────────┘
```

### Data Flow:
1. **Client books online** → Mangomint booking widget → appointment created
2. **Webhook fires** → `/api/webhooks/mangomint` → Airtable record created/updated
3. **Manual sync** → Dashboard → Integrations → Sync All → pulls Mangomint clients to Airtable
4. **CSV export** → Clients → Options → Download → import to Airtable

---

## Seven-Figure Medspa Benchmarks

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Utilization Rate | 9.10% | 65-80% | Massive — need marketing + rebooking |
| Avg Appointments/Day | ~0.1 | 8-15 | Need online booking promotion |
| Online Booking Rate | 0% | 40-60% | Widget now installed, need CTAs |
| No-Show Rate | Unknown | <5% | Add automated reminders |
| Rebooking Rate | Unknown | 60-70% | Add post-visit follow-up sequence |
| Active Memberships | 0 | 50-100 | Promote Angel Glow Up tiers |
| Google Reviews | Tracking via Airtable | 100+ with 4.8+ avg | Add review request automation |

### Revenue Targets by Tier:
- **$500K/year:** 8 appointments/day, $150 avg ticket, 5 days/week
- **$1M/year:** 12 appointments/day, $200 avg ticket, 5.5 days/week
- **$2M/year:** 20 appointments/day, $250 avg ticket, 6 days/week

### Key Growth Levers:
1. **Increase advance booking** (60 → 120 days) — captures seasonal clients
2. **Enable "Avoid Gaps"** — maximizes daily capacity
3. **Add automated reminders** — reduces no-shows from industry avg 15-20% to <5%
4. **Promote memberships** — recurring revenue stabilizes cash flow
5. **Post-visit rebooking** — turns one-time clients into regulars
6. **Review requests** — social proof drives new bookings
7. **Package upselling** — LHR packages, HydraFacial series, wellness bundles

---

## Environment Variables Needed

```bash
# Mangomint API (for dashboard sync)
MANGOMINT_API_KEY=           # Get from Mangomint Settings → Developer → API Keys

# Mangomint Webhooks (for real-time updates)
MANGOMINT_WEBHOOK_SECRET=    # Set when registering webhook with Mangomint support
```

## Next Steps (Action Items)

### Immediate (Today):
- [ ] Fix website URL in Business Details (HTTP → HTTPS)
- [ ] Change advance booking from 60 → 120 days
- [ ] Enable "Avoid Gaps" in Online Booking preferences
- [ ] Enable "Allow booking same service multiple times"
- [ ] Train staff on checking out appointments properly
- [ ] Export client CSV from Clients → Options → Download

### This Week:
- [ ] Set up 24-hour appointment reminder (text message)
- [ ] Set up 2-hour appointment reminder (text message)
- [ ] Set up post-visit follow-up email (24hrs after)
- [ ] Set up review request text (48hrs after)
- [ ] Contact Mangomint support to register webhook URL
- [ ] Request API key from Mangomint Settings → Developer

### This Month:
- [ ] Import client CSV to Airtable Clients table
- [ ] Add MANGOMINT_API_KEY to Vercel env vars
- [ ] Test webhook integration with test appointment
- [ ] Promote Angel Glow Up memberships to top 100 clients
- [ ] Set up rebooking reminder automation (3-4 weeks post-visit)

### Quarterly:
- [ ] Review utilization rate progress (target: 40% by Q2, 65% by Q4)
- [ ] Review online booking adoption rate
- [ ] Review membership enrollment numbers
- [ ] Review no-show rate improvement
- [ ] Audit automated message open/click rates
