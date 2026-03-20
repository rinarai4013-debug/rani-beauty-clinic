# Rani Beauty Clinic — Analytics Architecture & GTM Setup Guide

> Full event-driven tracking system for conversion optimization, revenue attribution, and AI-ready data infrastructure.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Event Schema](#2-event-schema)
3. [GTM Container Setup](#3-gtm-container-setup)
4. [GA4 Configuration](#4-ga4-configuration)
5. [Code Implementation Summary](#5-code-implementation-summary)
6. [Validation & Debugging](#6-validation--debugging)
7. [Dashboard & Reporting](#7-dashboard--reporting)
8. [Future-Proofing](#8-future-proofing)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VISITOR BROWSER                          │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ BehavioralTracker│  │ AnalyticsTracker              │    │
│  │ (behavioral-     │  │ (hooks.ts)                    │    │
│  │  tracking.ts)    │  │                               │    │
│  │                  │  │ • Time on page (30/60/120/300)│    │
│  │ • Scroll depth   │  │ • Phone link clicks           │    │
│  │ • CTA clicks     │  └──────────┬───────────────────┘    │
│  │ • Rage clicks    │             │                         │
│  │ • Hesitation     │  ┌──────────▼───────────────────┐    │
│  │ • Section attn   │  │ Component-Level Events        │    │
│  │ • Intent scoring │  │ • quiz_started/completed      │    │
│  │ • Booking detect │  │ • lead_submitted              │    │
│  │ • Visitor tagging│  │ • chat_opened                 │    │
│  └────────┬─────────┘  │ • plan_viewed/tier_selected   │    │
│           │            └──────────┬───────────────────┘    │
│           │                       │                         │
│           ▼                       ▼                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │        trackAnalyticsEvent() — Unified Dispatcher   │    │
│  │        src/lib/analytics/events.ts                  │    │
│  │                                                     │    │
│  │  Auto-enriches with:                                │    │
│  │  • page_path, page_title, page_type                 │    │
│  │  • device_type (mobile/tablet/desktop)              │    │
│  │  • UTM params (persisted to sessionStorage)         │    │
│  └──────────┬──────────┬──────────┬───────────────────┘    │
│             │          │          │                         │
│             ▼          ▼          ▼                         │
│         ┌──────┐  ┌────────┐  ┌──────────┐                │
│         │ GA4  │  │  GTM   │  │ Meta     │                │
│         │gtag()│  │dataLayer│  │Pixel fbq │                │
│         └──────┘  └────────┘  └──────────┘                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Microsoft Clarity (via BehavioralTracker tags)        │  │
│  │ • Custom tags: device_type, visitor_type, utm_*       │  │
│  │ • Custom events: rage_click, hesitation, confusion    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  DOWNSTREAM SYSTEMS                         │
│                                                             │
│  GA4 Property (G-4YXJ90MXGG)                              │
│  ├── Custom Events (see Section 4)                         │
│  ├── Custom Dimensions (service_type, lead_source, etc.)   │
│  ├── Conversion Events (lead_submitted, booking_completed) │
│  └── Funnel Explorations                                   │
│                                                             │
│  GTM Container (GTM-MPS3MPNG)                              │
│  ├── Tags → GA4 events, Meta Pixel, Custom HTML            │
│  ├── Triggers → dataLayer custom events                    │
│  └── Variables → dataLayer vars, URL params                │
│                                                             │
│  Airtable (via n8n webhooks)                               │
│  ├── Mangomint webhooks → booking_completed                │
│  └── Contact form → lead_submitted                         │
│                                                             │
│  Future: AI Optimization Layer                              │
│  └── Reads GA4 data via API for conversion optimization    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Visitor → Revenue

```
Anonymous Visit    →  page_view, scroll_depth, time_on_page
    ↓
Intent Signals     →  service_page_view, pricing_interaction, cta_click
    ↓
Engagement         →  phone_click, chat_opened, quiz_started, booking_widget_opened
    ↓
Lead Capture       →  lead_submitted (contact form, quiz, Typeform)
    ↓
Booking            →  booking_started → booking_completed (Mangomint webhook)
    ↓
Revenue            →  plan_viewed → plan_tier_selected → plan_checkout_completed
    ↓
Retention          →  membership_signup (Mangomint webhook)
```

---

## 2. Event Schema

### Naming Convention

```
{object}_{action}
```

- All lowercase, underscore-separated
- Object = what is being tracked (page, scroll, cta, lead, booking, plan)
- Action = what happened (view, click, submitted, completed, opened)

### Complete Event Table

| # | Event Name | Funnel Stage | Source | GA4 Conversion | Meta Pixel Map |
|---|-----------|-------------|--------|---------------|----------------|
| 1 | `page_view` | Awareness | GA4 auto | No | PageView (auto) |
| 2 | `scroll_depth` | Engagement | BehavioralTracker | No | — |
| 3 | `time_on_page` | Engagement | AnalyticsTracker | No | — |
| 4 | `rage_click` | UX Signal | BehavioralTracker | No | — |
| 5 | `hesitation_detected` | UX Signal | BehavioralTracker | No | — |
| 6 | `behavioral_confusion_signal` | UX Signal | BehavioralTracker | No | — |
| 7 | `session_start_enriched` | Awareness | BehavioralTracker | No | — |
| 8 | `page_abandonment` | UX Signal | BehavioralTracker | No | — |
| 9 | `outbound_click` | Engagement | BehavioralTracker | No | — |
| 10 | `service_page_view` | Intent | Component | No | ViewContent |
| 11 | `pricing_interaction` | Intent | GTM (element visibility) | No | — |
| 12 | `cta_click` | Intent | BehavioralTracker | No | — |
| 13 | `phone_click` | Intent | AnalyticsTracker | No | Contact |
| 14 | `chat_opened` | Intent | MobileCTA component | No | — |
| 15 | `quiz_started` | Intent | SkinQuiz component | No | — |
| 16 | `quiz_step_completed` | Intent | SkinQuiz component | No | — |
| 17 | `quiz_completed` | Intent | SkinQuiz component | No | CompleteRegistration |
| 18 | `booking_widget_opened` | Conversion | BehavioralTracker | No | Schedule |
| 19 | `consultation_form_opened` | Conversion | BehavioralTracker | No | — |
| 20 | `lead_submitted` | Conversion | Contact form, Quiz | **YES** | Lead |
| 21 | `contact_form_submitted` | Conversion | Contact form | No | Lead |
| 22 | `consultation_booked` | Conversion | Typeform (future) | **YES** | Schedule |
| 23 | `booking_completed` | Revenue | Mangomint webhook | **YES** | Schedule |
| 24 | `plan_viewed` | Revenue | TreatmentPlan page | No | ViewContent |
| 25 | `plan_tier_selected` | Revenue | TreatmentPlan page | No | AddToCart |
| 26 | `plan_checkout_started` | Revenue | TreatmentPlan page | No | InitiateCheckout |
| 27 | `plan_checkout_completed` | Revenue | TreatmentPlan page | **YES** | Purchase |
| 28 | `plan_financing_clicked` | Revenue | TreatmentPlan page | No | Lead |
| 29 | `membership_signup` | Retention | Mangomint webhook | **YES** | Subscribe |

### Event Parameters Reference

Every event automatically includes (via `trackAnalyticsEvent`):
- `page_path` — current URL path
- `page_title` — document title
- `page_type` — derived category (homepage, service_page, blog_post, etc.)
- `device_type` — mobile, tablet, or desktop
- UTM params (if present in session)

---

## 3. GTM Container Setup

### Container: GTM-MPS3MPNG

> GTM acts as the orchestration layer. Most events originate in code (via `dataLayer.push`), and GTM forwards them to GA4 with proper formatting.

### 3.1 Naming Convention

```
Tag:     [Platform] - [Category] - [Event]
Trigger: Trigger - [Type] - [Description]
Variable: Var - [Type] - [Name]
```

### 3.2 Variables to Create

#### Built-in Variables (Enable these)
- [x] Click Text
- [x] Click URL
- [x] Click Classes
- [x] Click ID
- [x] Click Element
- [x] Page Path
- [x] Page URL
- [x] Page Hostname
- [x] Scroll Depth Threshold

#### Data Layer Variables

| Variable Name | Data Layer Key | Purpose |
|--------------|---------------|---------|
| `Var - DL - event` | `event` | Event name from dataLayer |
| `Var - DL - page_type` | `page_type` | Auto-derived page category |
| `Var - DL - device_type` | `device_type` | mobile/tablet/desktop |
| `Var - DL - service_name` | `service_name` | Service being viewed/selected |
| `Var - DL - form_type` | `form_type` | contact_form, skin_quiz, etc. |
| `Var - DL - lead_source` | `lead_source` | Where the lead came from |
| `Var - DL - cta_label` | `cta_label` | CTA button text |
| `Var - DL - cta_type` | `cta_type` | booking, phone_call, consultation |
| `Var - DL - intent_score` | `intent_score` | 0-100 behavioral intent score |
| `Var - DL - intent_segment` | `intent_segment` | high/medium/low_intent/bounce |
| `Var - DL - depth_percent` | `depth_percent` | Scroll depth percentage |
| `Var - DL - value` | `value` | Revenue value |
| `Var - DL - tier` | `tier` | good/better/best plan tier |
| `Var - DL - phone_number` | `phone_number` | Phone number clicked |
| `Var - DL - click_location` | `click_location` | Where the click happened |
| `Var - DL - trigger_location` | `trigger_location` | What triggered the action |
| `Var - DL - step_number` | `step_number` | Quiz step number |
| `Var - DL - step_name` | `step_name` | Quiz step name |
| `Var - DL - seconds` | `seconds` | Time on page seconds |

#### URL Variables

| Variable Name | URL Component | Query Key |
|--------------|--------------|-----------|
| `Var - URL - utm_source` | Query | `utm_source` |
| `Var - URL - utm_medium` | Query | `utm_medium` |
| `Var - URL - utm_campaign` | Query | `utm_campaign` |
| `Var - URL - utm_content` | Query | `utm_content` |
| `Var - URL - utm_term` | Query | `utm_term` |

### 3.3 Triggers to Create

| Trigger Name | Type | Condition |
|-------------|------|-----------|
| `Trigger - CE - lead_submitted` | Custom Event | Event name equals `lead_submitted` |
| `Trigger - CE - contact_form_submitted` | Custom Event | Event name equals `contact_form_submitted` |
| `Trigger - CE - booking_widget_opened` | Custom Event | Event name equals `booking_widget_opened` |
| `Trigger - CE - booking_completed` | Custom Event | Event name equals `booking_completed` |
| `Trigger - CE - consultation_booked` | Custom Event | Event name equals `consultation_booked` |
| `Trigger - CE - quiz_started` | Custom Event | Event name equals `quiz_started` |
| `Trigger - CE - quiz_completed` | Custom Event | Event name equals `quiz_completed` |
| `Trigger - CE - quiz_step_completed` | Custom Event | Event name equals `quiz_step_completed` |
| `Trigger - CE - chat_opened` | Custom Event | Event name equals `chat_opened` |
| `Trigger - CE - phone_click` | Custom Event | Event name equals `phone_click` |
| `Trigger - CE - plan_viewed` | Custom Event | Event name equals `plan_viewed` |
| `Trigger - CE - plan_tier_selected` | Custom Event | Event name equals `plan_tier_selected` |
| `Trigger - CE - plan_checkout_started` | Custom Event | Event name equals `plan_checkout_started` |
| `Trigger - CE - plan_checkout_completed` | Custom Event | Event name equals `plan_checkout_completed` |
| `Trigger - CE - plan_financing_clicked` | Custom Event | Event name equals `plan_financing_clicked` |
| `Trigger - CE - membership_signup` | Custom Event | Event name equals `membership_signup` |
| `Trigger - CE - scroll_depth` | Custom Event | Event name equals `scroll_depth` |
| `Trigger - CE - time_on_page` | Custom Event | Event name equals `time_on_page` |
| `Trigger - CE - service_page_view` | Custom Event | Event name equals `service_page_view` |
| `Trigger - CE - rage_click` | Custom Event | Event name equals `rage_click` |
| `Trigger - CE - hesitation_detected` | Custom Event | Event name equals `hesitation_detected` |
| `Trigger - CE - page_abandonment` | Custom Event | Event name equals `page_abandonment` |

### 3.4 Tags to Create

#### Config Tag

| Tag Name | Type | Trigger | Settings |
|----------|------|---------|----------|
| `GA4 - Config - Main` | GA4 Configuration | All Pages | Measurement ID: `G-4YXJ90MXGG` |

> **Important:** Since GA4 is loaded in Next.js via the Analytics component, this config tag serves as the GTM-side registration. If you see duplicate page_views, set "Send a page view event" to OFF in this tag.

#### Conversion Tags

| Tag Name | Type | Trigger | Event Params |
|----------|------|---------|-------------|
| `GA4 - Conv - Lead Submitted` | GA4 Event | `Trigger - CE - lead_submitted` | form_type, service_interest, lead_source, page_path |
| `GA4 - Conv - Booking Completed` | GA4 Event | `Trigger - CE - booking_completed` | service_name, booking_value, provider |
| `GA4 - Conv - Consultation Booked` | GA4 Event | `Trigger - CE - consultation_booked` | consultation_type, deposit_amount |
| `GA4 - Conv - Plan Checkout Completed` | GA4 Event | `Trigger - CE - plan_checkout_completed` | plan_id, tier, value, payment_method |
| `GA4 - Conv - Membership Signup` | GA4 Event | `Trigger - CE - membership_signup` | membership_tier, monthly_value |

#### Intent Tags

| Tag Name | Type | Trigger | Event Params |
|----------|------|---------|-------------|
| `GA4 - Intent - Phone Click` | GA4 Event | `Trigger - CE - phone_click` | phone_number, click_location, page_path |
| `GA4 - Intent - Chat Opened` | GA4 Event | `Trigger - CE - chat_opened` | trigger_location, page_path |
| `GA4 - Intent - Quiz Started` | GA4 Event | `Trigger - CE - quiz_started` | page_path |
| `GA4 - Intent - Quiz Completed` | GA4 Event | `Trigger - CE - quiz_completed` | result_type, recommended_services |
| `GA4 - Intent - Quiz Step` | GA4 Event | `Trigger - CE - quiz_step_completed` | step_number, step_name, answer |
| `GA4 - Intent - Service Page View` | GA4 Event | `Trigger - CE - service_page_view` | service_name, service_category |
| `GA4 - Intent - Booking Widget` | GA4 Event | `Trigger - CE - booking_widget_opened` | trigger_location, page_path |

#### Behavioral Tags

| Tag Name | Type | Trigger | Event Params |
|----------|------|---------|-------------|
| `GA4 - Behavior - Scroll Depth` | GA4 Event | `Trigger - CE - scroll_depth` | depth_percent, time_on_page_ms |
| `GA4 - Behavior - Time on Page` | GA4 Event | `Trigger - CE - time_on_page` | seconds, page_path |
| `GA4 - Behavior - Rage Click` | GA4 Event | `Trigger - CE - rage_click` | element, selector, click_count |
| `GA4 - Behavior - Hesitation` | GA4 Event | `Trigger - CE - hesitation_detected` | element, hover_duration_ms |
| `GA4 - Behavior - Abandonment` | GA4 Event | `Trigger - CE - page_abandonment` | intent_score, intent_segment, max_scroll_depth |

#### Revenue Tags

| Tag Name | Type | Trigger | Event Params |
|----------|------|---------|-------------|
| `GA4 - Revenue - Plan Viewed` | GA4 Event | `Trigger - CE - plan_viewed` | plan_id, value |
| `GA4 - Revenue - Tier Selected` | GA4 Event | `Trigger - CE - plan_tier_selected` | plan_id, tier, value |
| `GA4 - Revenue - Checkout Started` | GA4 Event | `Trigger - CE - plan_checkout_started` | plan_id, tier, value |
| `GA4 - Revenue - Financing Clicked` | GA4 Event | `Trigger - CE - plan_financing_clicked` | plan_id, value |

#### Meta Pixel Tags (once Pixel ID is set)

| Tag Name | Type | Trigger | fbq Event |
|----------|------|---------|-----------|
| `Meta - Conv - Lead` | Custom HTML | `Trigger - CE - lead_submitted` | `fbq('track', 'Lead', {...})` |
| `Meta - Conv - Schedule` | Custom HTML | `Trigger - CE - booking_completed` | `fbq('track', 'Schedule', {...})` |
| `Meta - Conv - Purchase` | Custom HTML | `Trigger - CE - plan_checkout_completed` | `fbq('track', 'Purchase', {...})` |

> **Note:** Meta Pixel events are also dispatched directly from `trackAnalyticsEvent()` in code. GTM tags serve as a backup/override layer. Use one approach — recommend keeping the code-based approach and skipping GTM Meta tags to avoid double-firing.

### 3.5 Tag Sequencing & Duplicate Prevention

1. **GA4 Config fires first:** Set tag sequencing on all GA4 event tags → "Fire GA4 Config tag before this tag"
2. **dataLayer events are code-driven:** All events originate from `trackAnalyticsEvent()` or `BehavioralTracker`, which push to `dataLayer` exactly once
3. **No GTM-based click triggers needed:** All click tracking is handled in code. GTM only listens for Custom Events from the dataLayer
4. **One-per-page:** Scroll depth milestones, time milestones, and quiz_started all use `Set` or `useRef` guards to prevent re-firing

---

## 4. GA4 Configuration

### 4.1 Property Setup

- **Property:** G-4YXJ90MXGG
- **Data Stream:** Web (ranibeautyclinic.com)
- **Enhanced Measurement:** ON (provides automatic page_view, outbound_click, site_search)

### 4.2 Custom Events to Register

Go to **GA4 Admin → Events → Create Event**:

No creation needed — events auto-register when they first fire. But mark these as conversions:

### 4.3 Conversion Events

Go to **GA4 Admin → Events → Mark as conversion**:

| Event | Mark as Conversion |
|-------|-------------------|
| `lead_submitted` | YES |
| `booking_completed` | YES |
| `consultation_booked` | YES |
| `plan_checkout_completed` | YES |
| `membership_signup` | YES |

### 4.4 Custom Dimensions

Go to **GA4 Admin → Custom Definitions → Create custom dimension**:

| Dimension Name | Scope | Event Parameter | Description |
|----------------|-------|-----------------|-------------|
| Service Type | Event | `service_name` | Which service was viewed/selected |
| Lead Source | Event | `lead_source` | Where the lead originated |
| Page Type | Event | `page_type` | Category of page (service, blog, etc.) |
| CTA Type | Event | `cta_type` | Type of CTA clicked |
| CTA Label | Event | `cta_label` | Text of CTA clicked |
| Form Type | Event | `form_type` | Contact form, quiz, etc. |
| Intent Segment | Event | `intent_segment` | high/medium/low_intent/bounce |
| Quiz Result | Event | `result_type` | Quiz concern type selected |
| Click Location | Event | `click_location` | Where on page the click occurred |
| Device Category | Event | `device_type` | mobile/tablet/desktop |
| Plan Tier | Event | `tier` | good/better/best |
| Traffic Campaign | Session | `utm_campaign` | Campaign name from UTM |

### 4.5 Custom Metrics

| Metric Name | Scope | Event Parameter | Unit |
|-------------|-------|-----------------|------|
| Booking Value | Event | `booking_value` | Currency (USD) |
| Plan Value | Event | `value` | Currency (USD) |
| Intent Score | Event | `intent_score` | Standard |
| Scroll Depth | Event | `depth_percent` | Standard |

### 4.6 Funnel Explorations

Create these in **GA4 → Explore → Funnel Exploration**:

#### Funnel 1: Visitor → Lead
```
Step 1: page_view (first_visit = true)
Step 2: service_page_view OR scroll_depth (depth_percent >= 50)
Step 3: cta_click (cta_type = booking OR consultation OR phone_call)
Step 4: lead_submitted
```

#### Funnel 2: Lead → Booking
```
Step 1: lead_submitted
Step 2: booking_widget_opened
Step 3: booking_completed
```

#### Funnel 3: Quiz → Conversion
```
Step 1: quiz_started
Step 2: quiz_step_completed (step = 3+)
Step 3: quiz_completed
Step 4: lead_submitted (form_type = skin_quiz)
```

#### Funnel 4: Treatment Plan → Revenue
```
Step 1: plan_viewed
Step 2: plan_tier_selected
Step 3: plan_checkout_started
Step 4: plan_checkout_completed
```

---

## 5. Code Implementation Summary

### Files Modified

| File | Changes |
|------|---------|
| `src/types/analytics.d.ts` | Full event type system (BehavioralEvent, IntentEvent, ConversionEvent, RevenueEvent) + AnalyticsEventParams |
| `src/lib/analytics/events.ts` | Expanded unified dispatcher with auto-enrichment (page_type, device_type, UTM persistence), Meta Pixel mapping, convenience helpers |
| `src/lib/analytics/hooks.ts` | Time on page tracking, phone link tracking, service page view hook |
| `src/components/analytics/AnalyticsTracker.tsx` | New global component: time_on_page + phone_click passive tracking |
| `src/app/layout.tsx` | Added AnalyticsTracker alongside BehavioralTracker |
| `src/components/layout/MobileCTA.tsx` | Added chat_opened event on chat button |
| `src/components/sections/CTABanner.tsx` | Added CTA click + phone click tracking |
| `src/components/sections/SkinQuiz.tsx` | Added quiz_started, quiz_step_completed, quiz_completed, lead_submitted |
| `src/app/contact/ContactPageClient.tsx` | Added lead_submitted alongside existing contact_form_submitted |

### Files Already Working (No Changes Needed)

| File | Events |
|------|--------|
| `src/lib/analytics/behavioral-tracking.ts` | scroll_depth, cta_click, rage_click, hesitation_detected, booking_widget_opened, consultation_form_opened, page_abandonment, session_start_enriched |
| `src/components/analytics/BehavioralTracker.tsx` | Initializes behavioral-tracking.ts on every page |
| `src/app/plan/[id]/TreatmentPlanClient.tsx` | plan_viewed, plan_tier_selected, plan_checkout_started, plan_financing_clicked |

---

## 6. Validation & Debugging

### 6.1 Pre-Launch Checklist

#### GTM Preview Mode
1. Open GTM → Preview → Connect to `ranibeautyclinic.com`
2. For each event below, verify it appears in Tag Assistant:

| Test Action | Expected Event(s) | Check |
|------------|-------------------|-------|
| Load homepage | `session_start_enriched`, `page_view` | [ ] |
| Scroll to 50% | `scroll_depth` (depth_percent=50) | [ ] |
| Wait 30 seconds | `time_on_page` (seconds=30) | [ ] |
| Click "Book Your Consultation" in CTA banner | `cta_click` (cta_type=consultation) | [ ] |
| Click phone number link | `phone_click` (phone_number=+14255394440) | [ ] |
| Click Chat button (mobile) | `chat_opened` (trigger_location=mobile_cta_bar) | [ ] |
| Navigate to `/services/botox` | `service_page_view` (service_name populated) | [ ] |
| Start the quiz at `/quiz` | `quiz_started` | [ ] |
| Complete quiz step 1 | `quiz_step_completed` (step_number=1, step_name=concern) | [ ] |
| Submit quiz with email | `quiz_completed`, `lead_submitted` (form_type=skin_quiz) | [ ] |
| Submit contact form | `contact_form_submitted`, `lead_submitted` (form_type=contact_form) | [ ] |
| Open Mangomint booking link | `booking_widget_opened` | [ ] |
| View treatment plan page | `plan_viewed` | [ ] |
| Select a plan tier | `plan_tier_selected` (tier=good/better/best) | [ ] |
| Close tab / switch away | `page_abandonment` (intent_score, intent_segment) | [ ] |
| Rapid-click same spot 3x | `rage_click` | [ ] |
| Hover CTA for 2+ seconds | `hesitation_detected` | [ ] |

#### GA4 DebugView
1. GA4 → Admin → DebugView
2. Open site in Chrome with GA4 Debug extension enabled
3. Verify each event appears with correct parameters
4. Check for duplicate events (same event firing twice at same timestamp)

#### UTM Parameter Test
1. Visit `ranibeautyclinic.com/?utm_source=test&utm_medium=cpc&utm_campaign=debug`
2. Navigate to another page
3. Verify UTM params persist in sessionStorage (`rani_utm` key)
4. Verify events include utm_source, utm_medium, utm_campaign

### 6.2 Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Duplicate page_views | Two page_view events per navigation | Turn off "Send page view" in GTM GA4 Config tag (Next.js handles it) |
| Missing Meta Pixel events | No fbq calls in console | Add Meta Pixel ID to `src/data/clinic-info.ts` line 63 |
| scroll_depth fires late | Only 25% threshold fires | Check if page has sufficient content height |
| time_on_page doesn't fire | No event after 30s | Check tab visibility — timer pauses on hidden tabs |
| quiz events missing | quiz_started not in GA4 | Verify SkinQuiz component imported trackAnalyticsEvent |
| Booking widget detection fails | booking_widget_opened not firing | Mangomint iframe may load differently; check MutationObserver in behavioral-tracking.ts |
| UTM params lost on navigation | utm_source missing after 2nd page | Check sessionStorage for `rani_utm` key |
| Intent score always low | All visitors scored < 30 | Normal for short sessions; high_intent requires CTA clicks + deep scroll + time |

### 6.3 Real-Time Verification (GA4)

1. GA4 → Reports → Realtime
2. Open site in another tab
3. Perform test actions
4. Events should appear within 5-10 seconds
5. Check "Event count by Event name" card for your events

### 6.4 Console Debugging

In development mode (`NODE_ENV=development`), all events log to console:
```
[Analytics] quiz_started {page_path: "/quiz", page_type: "quiz_page", device_type: "desktop"}
```

For production debugging, paste in browser console:
```javascript
// Monitor all dataLayer pushes
window.dataLayer = window.dataLayer || [];
const originalPush = Array.prototype.push;
window.dataLayer.push = function() {
  console.log('[dataLayer]', arguments[0]);
  return originalPush.apply(this, arguments);
};
```

### 6.5 Monthly Audit Checklist

| Check | How | Expected |
|-------|-----|----------|
| Conversion events firing | GA4 → Events → filter by conversion | lead_submitted, booking_completed present with > 0 count |
| No duplicate events | GA4 → Explore → compare event counts to actual actions | Counts should roughly match |
| UTM attribution working | GA4 → Acquisition → User acquisition | Traffic sources correctly attributed |
| Phone clicks counted | GA4 → Events → phone_click | Count > 0, click_location varies |
| Quiz completion rate | GA4 → Explore → quiz funnel | started > step > completed with reasonable drop-off |
| Meta Pixel healthy | Meta Events Manager → Test Events | Events match GA4 counts |
| Clarity sessions | Clarity Dashboard → Sessions | Session count > 0, custom tags populated |

---

## 7. Dashboard & Reporting

### Key Reports to Build (GA4 → Explore)

#### Report 1: Conversion Rate by Source
- Dimensions: Session source/medium
- Metrics: Sessions, lead_submitted (count), Conversion rate
- Visualization: Table, sorted by conversion rate

#### Report 2: Revenue per Visitor
- Dimensions: Landing page
- Metrics: Sessions, plan_checkout_completed (count), value (sum)
- Calculated: Revenue per visitor = sum(value) / Sessions

#### Report 3: Top Converting Pages
- Dimensions: Page path
- Metrics: Page views, lead_submitted (count), booking_widget_opened (count)
- Filter: Exclude /dashboard/* pages

#### Report 4: Funnel Drop-Off Analysis
- Use Funnel Exploration (see Section 4.6)
- Segment by device_type and traffic_source
- Identify where mobile vs desktop users drop off

#### Report 5: Service Demand Intelligence
- Dimensions: service_name (custom dimension)
- Metrics: service_page_view (count), cta_click (count), lead_submitted (count)
- Reveals: Which services drive the most leads

#### Report 6: Intent-Based Segmentation
- Dimensions: intent_segment
- Metrics: Sessions, lead_submitted rate, booking_completed rate
- Reveals: What % of high-intent visitors convert

---

## 8. Future-Proofing

### 8.1 Airtable Integration Path

Events can flow to Airtable via two paths:

**Path A: n8n Webhook (Real-time)**
- Create n8n workflow triggered by Mangomint booking webhook
- Map `booking_completed` event data to Airtable `Appointments` table
- Already partially in place (WF3 Booking Sync)

**Path B: GA4 → BigQuery → Airtable (Batch)**
- Enable GA4 BigQuery export (free tier)
- Create scheduled n8n workflow to query BigQuery
- Push aggregated metrics to Airtable `KPI Snapshots` table

### 8.2 AI Optimization Integration

The event schema is designed for machine learning:

```
Features (per visitor session):
- device_type
- traffic_source
- utm_campaign
- landing_page
- scroll_depth_max
- time_on_page_max
- cta_interactions_count
- intent_score
- pages_viewed_count
- services_viewed (list)

Labels:
- converted (lead_submitted = true)
- booked (booking_completed = true)
- revenue (plan value)
```

This enables:
1. **Conversion prediction** — Score visitors by likelihood to convert
2. **Content optimization** — A/B test by page engagement metrics
3. **Ad targeting** — Export high-intent audiences to Meta
4. **Dynamic CTA** — Show different CTAs based on intent_segment

### 8.3 Multi-Location Scaling

When Rani expands to multiple locations:

1. Add `location_id` parameter to all events via `trackAnalyticsEvent`
2. Create GA4 custom dimension for `location_id`
3. Filter all reports by location
4. Keep single GTM container — use lookup table variable for location-specific settings

### 8.4 Meta Pixel Activation

When ready to activate Meta Pixel:

1. Get Pixel ID from Meta Business Manager
2. Update `src/data/clinic-info.ts` line 63:
   ```typescript
   metaPixel: "YOUR_PIXEL_ID_HERE",
   ```
3. Deploy — all Meta events are already mapped and will auto-fire
4. Verify in Meta Events Manager → Test Events

---

## Appendix: File Reference

| File | Purpose |
|------|---------|
| `src/types/analytics.d.ts` | Event type definitions |
| `src/lib/analytics/events.ts` | Unified event dispatcher |
| `src/lib/analytics/hooks.ts` | React tracking hooks |
| `src/lib/analytics/behavioral-tracking.ts` | Behavioral intelligence engine |
| `src/components/analytics/Analytics.tsx` | GA4/GTM/Meta/Clarity script loader |
| `src/components/analytics/AnalyticsTracker.tsx` | Passive tracking (time, phone clicks) |
| `src/components/analytics/BehavioralTracker.tsx` | Behavioral tracking init per page |
| `src/data/clinic-info.ts` | Analytics IDs (GA4, GTM, Meta Pixel, Clarity) |
