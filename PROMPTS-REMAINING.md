# RaniOS — Remaining Implementation Prompts
# Copy each prompt into a new Claude Code session to execute
# Estimated total: 3-4 hours to reach 97/100

---

## PROMPT 1: Global Error Boundaries (15 min)
## Priority: HIGH — Production safety net

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Add production-grade error boundaries at every level of the app.

CONTEXT:
- The project already has 2 dashboard-specific ErrorBoundary components at:
  - src/components/dashboard/shared/DashboardErrorBoundary.tsx (class-based, branded UI)
  - src/components/dashboard/ErrorBoundary.tsx (minimal fallback)
- There are NO app-level error files (no error.tsx, no global-error.tsx, no not-found.tsx at root)
- Root layout is at src/app/layout.tsx (112 lines, has Analytics, Navbar, Footer, ConditionalPublicLayout)
- Brand colors: Navy #0F1D2C, Gold #C9A96E, Cream #F8F6F1
- Fonts: Playfair Display (headings) + Montserrat (body) — loaded via src/lib/fonts.ts

CREATE THESE FILES:

1. src/app/global-error.tsx
   - This catches errors in the ROOT layout itself
   - Must include its own <html> and <body> tags (Next.js requirement)
   - Show a beautiful branded error page with:
     - Rani Beauty Clinic logo (public/logo/rani-logo.png)
     - "Something unexpected happened" message
     - "Refresh Page" button that calls reset()
     - "Return Home" link to /
     - Phone number: (425) 905-2410 for urgent help
   - Log error to console in dev, suppress details in prod
   - Use inline styles only (global CSS won't load here)

2. src/app/error.tsx
   - Catches errors in page components (below root layout)
   - 'use client' directive required
   - Luxury branded design matching the site aesthetic
   - Show a softer "We hit a snag" message
   - "Try Again" button (calls reset())
   - "Go Home" button (router.push('/'))
   - Animate in with a subtle fade (use CSS keyframes, not Framer Motion)
   - Display error.message in dev mode only (process.env.NODE_ENV === 'development')

3. src/app/not-found.tsx
   - Custom 404 page
   - Luxury branded: "This page doesn't exist — but your transformation journey does"
   - Quick links: Services, About, Contact, Book Consultation (Mangomint: https://booking.mangomint.com/876418)
   - Include a search-like section with popular services
   - Server component (no 'use client')

4. src/app/plan/[id]/error.tsx
   - Treatment plan specific error boundary
   - Message: "We couldn't load your treatment plan"
   - "Try Again" + "Contact Us" CTAs
   - Include phone: (425) 905-2410

5. src/app/(dashboard)/error.tsx
   - Dashboard-specific error page
   - "Dashboard Error" heading
   - "Return to Dashboard" button → /dashboard
   - "Login Again" button → /dashboard/login
   - Show error details always (internal tool)

REQUIREMENTS:
- All error pages must be responsive (mobile-first)
- All must include proper <title> via metadata or head tags
- Run `npx next build 2>&1 | tail -30` after to verify zero build errors
- Run `npx vitest run` to ensure all 66 tests still pass
- Commit with message: "Add global error boundaries + custom 404 page"
- Push to origin main (if push fails due to remote ahead, use the fresh clone approach: create patch → clone to /tmp → apply → push → copy .git back)
```

---

## PROMPT 2: Stripe Webhook Handler (45 min)
## Priority: HIGH — Revenue tracking

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a production-grade Stripe webhook handler that processes payment events and syncs to Airtable.

CONTEXT:
- Stripe checkout already exists at src/app/api/checkout/route.ts
  - Creates $250 deposit sessions with metadata: { planId, tier, clientName, source: 'treatment_plan_page' }
  - Success URL: /thank-you?plan={planId}&tier={tier}
  - Cancel URL: /plan/{planId}
- Stripe package: stripe ^20.4.1 (already installed)
- DO NOT pass an explicit apiVersion to `new Stripe(key)` — let it use the SDK default to avoid version mismatch errors
- Mangomint webhook handler at src/app/api/webhooks/mangomint/route.ts is the gold standard pattern — follow its structure for consistency:
  - Signature verification
  - Event routing with switch/case
  - Airtable record creation
  - Cache invalidation
  - Structured logging
  - n8n webhook forwarding
- Rate limiter: import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
- Logger: import { logEvent } from '@/lib/logging/structured-logger'
- Airtable Tables: import Tables from '@/lib/airtable/tables' — use Tables.transactions() for payment records
- Cache: import { cache } from '@/lib/cache' — invalidate 'revenue' and 'kpi' keys
- Env validation: import { env, hasFeature } from '@/lib/env'

CREATE:

1. src/app/api/webhooks/stripe/route.ts
   Handle these Stripe events:

   a) checkout.session.completed
      - Extract metadata (planId, tier, clientName)
      - Create Airtable transaction record in Transactions table:
        - Client Name: from metadata or customer_details.name
        - Amount: session.amount_total / 100
        - Payment Method: 'Stripe'
        - Type: 'Deposit'
        - Date: new Date().toISOString()
        - Notes: `Treatment plan deposit — ${tier} tier`
        - Status: 'Completed'
        - Stripe Session ID: session.id
      - Update treatment plan status in Client Intakes (if planId exists):
        - Processing Status → 'Responded'
      - Forward to n8n: POST to env.N8N_WEBHOOK_URL + '/webhook/stripe-payment' (fire and forget)
      - Invalidate caches: 'revenue', 'kpi', 'transactions'
      - Log: logEvent('stripe.checkout.completed', { planId, tier, amount })

   b) checkout.session.expired
      - Log the expiration
      - Create alert in Alerts table: "Abandoned checkout — {clientName} ({tier} tier, Plan: {planId})"
      - Forward to n8n for abandoned cart recovery

   c) payment_intent.payment_failed
      - Log the failure with error details
      - Create alert: severity 'warning'

   d) charge.refunded
      - Update the original transaction record status to 'Refunded'
      - Invalidate revenue caches
      - Create alert: severity 'info'

   WEBHOOK SIGNATURE VERIFICATION (CRITICAL):
   ```typescript
   import Stripe from 'stripe';

   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

   export async function POST(request: Request) {
     const body = await request.text();
     const signature = request.headers.get('stripe-signature');

     if (!signature || !endpointSecret) {
       return new Response('Webhook secret not configured', { status: 400 });
     }

     let event: Stripe.Event;
     try {
       const stripe = new Stripe(env.STRIPE_SECRET_KEY);
       event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
     } catch (err) {
       logEvent('stripe.webhook.verification_failed', { error: String(err) });
       return new Response('Invalid signature', { status: 401 });
     }
     // ... handle event
   }
   ```

   Also add a GET handler for health checks (same pattern as Mangomint):
   ```typescript
   export async function GET() {
     return Response.json({
       status: 'ok',
       configured: Boolean(env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
       events: ['checkout.session.completed', 'checkout.session.expired', 'payment_intent.payment_failed', 'charge.refunded'],
     });
   }
   ```

2. Add STRIPE_WEBHOOK_SECRET to:
   - src/lib/env.ts (add to the Zod schema as optional string, default '')
   - .env.example (add under the Stripe section with comment)

3. src/app/api/webhooks/stripe/route.test.ts
   - Test signature verification rejects bad signatures
   - Test checkout.session.completed creates transaction
   - Test unknown event types return 200 (acknowledge but ignore)
   - Mock Stripe, Airtable, and cache

REQUIREMENTS:
- Follow the EXACT same code patterns as the Mangomint webhook handler
- Every Airtable write must be try/caught with error logging
- n8n forwarding must be fire-and-forget (don't await, don't fail if n8n is down)
- Response must ALWAYS be 200 for valid signatures (Stripe retries on non-2xx)
- Run build + tests after, commit: "Add Stripe webhook handler with signature verification"
- Push to origin main
```

---

## PROMPT 3: E2E Smoke Tests with Playwright (30 min)
## Priority: MEDIUM — Confidence for deploys

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Set up Playwright for E2E smoke tests covering the critical user journeys.

CONTEXT:
- Currently using Vitest for unit tests (12 files, 66 tests)
- Package.json scripts: "test": "vitest run", "test:watch": "vitest"
- No Playwright installed yet
- The app runs on port 3000 (dev server config in .claude/launch.json)
- Key public pages:
  - / (homepage with Hero, services, testimonials)
  - /services (service listing)
  - /about (about page)
  - /contact (contact form with name, email, phone, message, SMS consent)
  - /plan/[id] (treatment plan — dynamic, needs real Airtable ID)
  - /cost/[slug] (cost pages)
  - /quiz (skin quiz)
- Dashboard at /dashboard/login (JWT auth)
- All pages use brand fonts: Playfair Display + Montserrat
- Mangomint booking widget loaded globally
- The site is LIVE at https://ranibeautyclinic.com

IMPLEMENTATION:

1. Install Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium
   ```

2. Create playwright.config.ts at project root:
   ```typescript
   import { defineConfig } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120_000,
     },
   });
   ```

3. Add to package.json scripts:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```

4. Create e2e/ directory with these test files:

   a) e2e/homepage.spec.ts — Homepage smoke test
      - Page loads with status 200
      - Title contains "Rani Beauty Clinic"
      - Hero section is visible with CTA button
      - Navigation links exist (Services, About, Contact)
      - Footer is visible with clinic address
      - Mangomint booking widget script is loaded
      - No console errors on page load

   b) e2e/navigation.spec.ts — Site navigation
      - Click "Services" nav link → /services loads
      - Click "About" nav link → /about loads
      - Click "Contact" nav link → /contact loads
      - Mobile menu opens and closes (viewport 375px)
      - Logo click returns to homepage

   c) e2e/contact-form.spec.ts — Contact form
      - Form fields are visible (name, email, phone, message)
      - Submit with empty fields shows validation errors
      - Fill in valid data, check form accepts input
      - SMS consent checkbox exists and is toggleable
      - DO NOT actually submit the form (would send real emails)

   d) e2e/seo.spec.ts — SEO essentials
      - Meta description exists and is not empty
      - Open Graph tags present (og:title, og:description, og:image)
      - Canonical URL is set
      - JSON-LD structured data script exists
      - H1 tag exists on homepage
      - No broken images (check all img elements have valid src)

   e) e2e/performance.spec.ts — Performance checks
      - Homepage loads in under 5 seconds
      - No layout shift greater than 0.25 CLS
      - All critical resources load (fonts, CSS, JS)

5. Add to .gitignore:
   ```
   /test-results/
   /playwright-report/
   /blob-report/
   /playwright/.cache/
   ```

REQUIREMENTS:
- Tests must work against the live dev server (localhost:3000)
- Tests must NOT make real API calls (no form submissions, no Stripe, no Airtable)
- Tests must be fast (< 30 seconds total)
- Each test file should be independent (no shared state)
- Run `npx playwright test` to verify all pass
- Run `npx vitest run` to make sure existing unit tests still pass
- Commit: "Add Playwright E2E smoke tests for critical user journeys"
- Push to origin main
```

---

## PROMPT 4: Stripe + Cherry Payment Event Tracking (30 min)
## Priority: MEDIUM — Complete the payment funnel

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Build a Cherry financing webhook handler and a unified payment events dashboard API.

CONTEXT:
- Cherry financing is currently UI-only: referral link to https://patient.withcherry.com/apply/rani-beauty-clinic
- Cherry tracks events: application_submitted, application_approved, application_declined, transaction_completed
- Cherry API docs: webhooks send POST with JSON body + signature header
- The env var CHERRY_API_KEY exists in .env.example but is empty
- Mangomint webhook pattern (src/app/api/webhooks/mangomint/route.ts) is the gold standard — follow it
- Airtable Transactions table is used for all payment records
- n8n webhook base: env.N8N_WEBHOOK_URL (from src/lib/env.ts)
- Rate limiter, logger, cache, env imports are all standard (see other webhook handlers)

CREATE:

1. src/app/api/webhooks/cherry/route.ts
   Handle Cherry financing events:

   a) application_submitted
      - Log event with client info
      - Create Alert: "Financing application submitted — {clientName}"
      - Forward to n8n: /webhook/financing-trigger

   b) application_approved
      - Log with approved amount
      - Update client record if found (by email): add tag "Cherry Approved"
      - Create Alert: type 'success', "Financing approved — {clientName} for ${amount}"
      - Forward to n8n

   c) application_declined
      - Log event
      - Create Alert: severity 'info'
      - Forward to n8n for follow-up (offer alternative payment plans)

   d) transaction_completed
      - Create Airtable Transaction record:
        - Payment Method: 'Cherry Financing'
        - Type: 'Treatment Payment'
        - Status: 'Completed'
        - Amount, Client Name, Date
        - Notes: "Cherry financing — {plan details}"
      - Invalidate 'revenue', 'kpi' caches
      - Forward to n8n

   SIGNATURE VERIFICATION:
   - Cherry uses HMAC-SHA256 with the API key
   - Header: x-cherry-signature
   - Verify: crypto.createHmac('sha256', env.CHERRY_API_KEY).update(body).digest('hex')
   - Return 401 if invalid

   GET handler for health check (same pattern as Mangomint/Stripe)

2. Add CHERRY_WEBHOOK_SECRET to env.ts schema and .env.example
   (Keep CHERRY_API_KEY for API calls, add CHERRY_WEBHOOK_SECRET for signature verification)

3. src/app/api/dashboard/payments/route.ts — Unified payment events API
   - GET endpoint that aggregates recent payment events from Airtable Transactions
   - Filter by payment method: ?method=stripe|cherry|square|all
   - Filter by date range: ?from=2026-01-01&to=2026-03-19
   - Return: { transactions: [...], summary: { total, byMethod, byStatus } }
   - Rate limited with RATE_LIMITS.VIEW
   - Requires dashboard auth (import { requireSession } from '@/lib/auth/session')
   - Cache for 60 seconds

REQUIREMENTS:
- Follow the EXACT Mangomint webhook code patterns for consistency
- All Airtable operations try/caught
- n8n forwarding is fire-and-forget
- Run build + tests, commit: "Add Cherry webhook handler + unified payment events API"
- Push to origin main
```

---

## PROMPT 5: Test Coverage Expansion (30 min)
## Priority: MEDIUM — Engineering confidence

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Expand test coverage to cover the most critical untested code paths.

CONTEXT:
- Testing framework: Vitest ^4.1.0 with jsdom ^29.0.0
- Current: 12 test files, 66 tests, all passing
- Existing tests cover: auth (roles, session), churn engine, no-show prediction, revenue anomaly, PnL engine, recommendations, schedule optimizer, rate limiter, sanitizer, structured logger, env validation
- UNTESTED critical code:
  1. AI parsing engine in TreatmentPlanClient.tsx (parseCostBreakdown, matchService, buildPackagesFromAI)
  2. Airtable client rate limiter (src/lib/airtable/client.ts)
  3. Cache layer (src/lib/cache/index.ts)
  4. Stripe checkout route logic
  5. Contact form API route

IMPORTANT: The AI parsing functions are inside TreatmentPlanClient.tsx (a massive client component). To test them, you need to EXTRACT them into a separate utility file first.

IMPLEMENTATION:

1. Extract AI parsing utilities:
   - Create src/lib/treatment-plan/parser.ts
   - Move these functions OUT of TreatmentPlanClient.tsx into the new file:
     - parseCostBreakdown(text: string)
     - matchService(rawName: string)
     - parseProgramPlan(text: string)
     - parseTimeline(text: string)
     - buildPackagesFromAI(costItems, roadmapPhases, timelineMonths)
     - buildFallbackPackages(concerns)
     - Also move SERVICE_CATALOG constant
   - Update TreatmentPlanClient.tsx to import from the new file
   - This is a REFACTOR ONLY — zero behavior change

2. Create src/lib/treatment-plan/parser.test.ts (15+ tests):

   Test parseCostBreakdown:
   - Parses "HydraFacial Signature — $275" → { name: 'HydraFacial Signature', price: 275 }
   - Parses "RF Microneedling (x3) — $1,485" → { name: 'RF Microneedling', price: 1485, quantity: 3 }
   - Filters out subtotal lines: "Core Program Investment — $5,250" → excluded
   - Filters out summary lines: "Estimated Total with 6-Month Maintenance — $8,900" → excluded
   - Handles empty input → []
   - Handles malformed lines gracefully (no throw)

   Test matchService:
   - Exact match: "HydraFacial" → SERVICE_CATALOG entry with price 275
   - Fuzzy match: "RF Micro-needling" → matches "RF Microneedling"
   - Fuzzy match: "Botox Injections" → matches "Botox"
   - Unknown service: "Quantum Healing" → null
   - Case insensitive: "hydrafacial" → matches

   Test buildPackagesFromAI:
   - Given valid cost items, produces 3 tiers (Essential, Recommended, Platinum)
   - Essential is cheapest, Platinum is most expensive
   - Platinum price is always >= 1.25x Recommended price
   - Each package has name, price, treatments array, extras
   - Empty input → returns fallback packages

   Test parseProgramPlan:
   - Parses "Phase 1: Foundation" → { phase: 1, title: 'Foundation' }
   - Strips narrative verbs: "Phase 1: Introduces Deep Cleansing" → title becomes "Deep Cleansing"
   - Handles multiple phases
   - Extracts treatments listed under each phase

3. Create src/lib/airtable/client.test.ts (5+ tests):
   - Rate limiter respects 4.7 req/sec limit
   - Queue processes requests in order
   - Handles Airtable errors gracefully
   - Mock the actual Airtable SDK

4. Create src/lib/cache/cache.test.ts (5+ tests):
   - Set and get returns correct value
   - TTL expiration works
   - Invalidation removes entry
   - Different keys are independent
   - Returns undefined for missing keys

REQUIREMENTS:
- CRITICAL: After extracting parser.ts, run `npx next build 2>&1 | tail -30` to verify the refactor didn't break anything
- Run `npx vitest run` — target: 80+ tests across 16+ files
- All existing 66 tests must still pass
- Commit: "Extract AI parser + expand test coverage to 80+ tests"
- Push to origin main
```

---

## PROMPT 6: Meta Pixel + GA4 Enhanced Ecommerce Events (15 min)
## Priority: LOW — Marketing attribution

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Activate Meta Pixel and add enhanced ecommerce tracking events for the treatment plan funnel.

CONTEXT:
- Analytics component: src/components/analytics/Analytics.tsx (109 lines)
- Meta Pixel ID is currently empty in src/data/clinic-info.ts line 62: metaPixel: ""
- GA4 is active: G-4YXJ90MXGG
- GTM is active: GTM-MPS3MPNG
- Microsoft Clarity: vnjnfo8pn5
- Treatment plan page (src/app/plan/[id]/TreatmentPlanClient.tsx) already has:
  - trackEvent('viewed') on page load
  - trackEvent('selected_tier', tier) on package CTA click
  - trackEvent('financing_click', tier) on Cherry click
  - trackEvent('financing_apply') on financing CTA
  - These currently POST to /api/plan/[id]/track (Airtable status update only)

IMPLEMENTATION:

1. Update src/data/clinic-info.ts:
   - DO NOT hardcode a pixel ID — keep it empty as a config point
   - Add a comment: "// Set your Meta Pixel ID here, e.g., '123456789012345'"

2. Create src/lib/analytics/events.ts — Unified analytics event dispatcher:
   ```typescript
   /**
    * Fire analytics events to GA4 + Meta Pixel + GTM dataLayer
    * Safe to call on server (no-ops) and client (fires events)
    */

   type EventName =
     | 'plan_viewed'
     | 'plan_tier_selected'
     | 'plan_checkout_started'
     | 'plan_financing_clicked'
     | 'contact_form_submitted'
     | 'booking_widget_opened'
     | 'quiz_started'
     | 'quiz_completed';

   interface EventParams {
     planId?: string;
     tier?: string;
     value?: number;
     currency?: string;
     clientName?: string;
     [key: string]: string | number | boolean | undefined;
   }

   export function trackAnalyticsEvent(name: EventName, params: EventParams = {}) {
     if (typeof window === 'undefined') return;

     // GA4 via gtag
     if (window.gtag) {
       window.gtag('event', name, params);
     }

     // GTM dataLayer
     if (window.dataLayer) {
       window.dataLayer.push({ event: name, ...params });
     }

     // Meta Pixel
     if (window.fbq) {
       // Map our events to Meta standard events where applicable
       const metaMap: Record<string, string> = {
         plan_viewed: 'ViewContent',
         plan_tier_selected: 'AddToCart',
         plan_checkout_started: 'InitiateCheckout',
         plan_financing_clicked: 'Lead',
         contact_form_submitted: 'Lead',
         booking_widget_opened: 'Schedule',
         quiz_completed: 'CompleteRegistration',
       };

       const metaEvent = metaMap[name];
       if (metaEvent) {
         window.fbq('track', metaEvent, {
           content_name: params.tier || name,
           content_category: 'treatment_plan',
           value: params.value,
           currency: params.currency || 'USD',
         });
       }
     }
   }
   ```

3. Add TypeScript declarations for window globals:
   Create src/types/analytics.d.ts:
   ```typescript
   interface Window {
     gtag?: (...args: unknown[]) => void;
     dataLayer?: Record<string, unknown>[];
     fbq?: (...args: unknown[]) => void;
   }
   ```

4. Update TreatmentPlanClient.tsx:
   - Import { trackAnalyticsEvent } from '@/lib/analytics/events'
   - In the existing trackEvent function, ADD a call to trackAnalyticsEvent alongside the existing /api/plan/[id]/track POST
   - Map: 'viewed' → trackAnalyticsEvent('plan_viewed', { planId })
   - Map: 'selected_tier' → trackAnalyticsEvent('plan_tier_selected', { planId, tier, value: packagePrice })
   - Map: 'financing_click' → trackAnalyticsEvent('plan_financing_clicked', { planId, tier })

5. Update contact form (src/app/contact/ContactPageClient.tsx):
   - After successful form submission, fire: trackAnalyticsEvent('contact_form_submitted', { source: 'contact_page' })

REQUIREMENTS:
- trackAnalyticsEvent must be safe to call anywhere (no-ops on server, no errors if GA4/Pixel not loaded)
- Never block UI on analytics (fire and forget)
- Run build + tests, commit: "Add unified analytics event dispatcher with GA4 + Meta Pixel support"
- Push to origin main
```

---

## PROMPT 7: Production Hardening — Sentry + Security Headers (20 min)
## Priority: LOW — Professional polish

```
You are working on RaniOS, a Next.js 14.2 App Router project at /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic

TASK: Add production-grade security headers and prepare for error monitoring.

CONTEXT:
- Next.js 14.2 App Router
- Deployed on Vercel at ranibeautyclinic.com
- next.config.js exists at project root
- No security headers currently configured
- No error monitoring (Sentry, LogRocket, etc.)

IMPLEMENTATION:

1. Update next.config.js — Add security headers:
   Read the existing next.config.js first, then add a headers() function:

   ```javascript
   async headers() {
     return [
       {
         source: '/(.*)',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
           { key: 'X-XSS-Protection', value: '1; mode=block' },
           { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
           {
             key: 'Strict-Transport-Security',
             value: 'max-age=31536000; includeSubDomains; preload',
           },
           {
             key: 'Content-Security-Policy',
             value: [
               "default-src 'self'",
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://booking.mangomint.com https://www.clarity.ms https://patient.withcherry.com",
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
               "font-src 'self' https://fonts.gstatic.com",
               "img-src 'self' data: https: blob:",
               "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://connect.facebook.net https://api.stripe.com https://booking.mangomint.com https://www.clarity.ms https://patient.withcherry.com",
               "frame-src https://booking.mangomint.com https://js.stripe.com https://patient.withcherry.com",
               "worker-src 'self' blob:",
             ].join('; '),
           },
         ],
       },
     ];
   },
   ```

2. Create src/middleware.ts — Edge middleware for rate limiting headers:
   - Only if it doesn't already exist
   - Add rate limit headers to API responses
   - Add CORS headers for webhook endpoints
   - DO NOT add auth checks here (auth is handled per-route)

   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const response = NextResponse.next();

     // Add timing header for performance monitoring
     response.headers.set('X-Response-Time', Date.now().toString());
     response.headers.set('X-Powered-By', 'RaniOS');

     // CORS for webhook endpoints
     if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
       response.headers.set('Access-Control-Allow-Origin', '*');
       response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
       response.headers.set('Access-Control-Allow-Headers', 'Content-Type, stripe-signature, x-mangomint-signature, x-cherry-signature');
     }

     return response;
   }

   export const config = {
     matcher: ['/api/:path*'],
   };
   ```

3. Add a robots.txt enhancement:
   Check if public/robots.txt exists. If not, create it:
   ```
   User-agent: *
   Allow: /
   Disallow: /api/
   Disallow: /dashboard/
   Disallow: /_next/

   Sitemap: https://ranibeautyclinic.com/sitemap.xml
   ```

REQUIREMENTS:
- CSP must not break GTM, GA4, Clarity, Meta Pixel, Mangomint widget, Stripe.js, or Cherry
- Test in browser after build: no CSP violations in console
- Run build + tests, commit: "Add security headers, CSP, and edge middleware"
- Push to origin main
```

---

## EXECUTION ORDER (Recommended):

| # | Prompt | Time | Impact |
|---|--------|------|--------|
| 1 | Error Boundaries | 15 min | 🔴 HIGH — prevents white screens in prod |
| 2 | Stripe Webhooks | 45 min | 🔴 HIGH — captures revenue events |
| 3 | E2E Tests | 30 min | 🟡 MEDIUM — deploy confidence |
| 4 | Cherry + Payments API | 30 min | 🟡 MEDIUM — complete payment funnel |
| 5 | Test Coverage | 30 min | 🟡 MEDIUM — engineering rigor |
| 6 | Analytics Events | 15 min | 🟢 LOW — marketing attribution |
| 7 | Security Headers | 20 min | 🟢 LOW — professional polish |

**Total: ~3 hours to go from 92% → 97%**

---

## GIT PUSH TROUBLESHOOTING

If git push fails (this repo has a known issue with large images causing SIGBUS):

```bash
# 1. Export your commit as a patch
git format-patch -1 HEAD -o /tmp/rani-patches/

# 2. Fresh shallow clone
cd /tmp && rm -rf rani-push
git clone --depth=1 https://github.com/rinarai4013-debug/rani-beauty-clinic.git rani-push

# 3. Apply patch and push
cd /tmp/rani-push
git am /tmp/rani-patches/*.patch
git push origin main

# 4. Replace local .git
cd /Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic
rm -rf .git
cp -r /tmp/rani-push/.git .
rm -rf /tmp/rani-push /tmp/rani-patches

# 5. Verify
git log --oneline -3
```
