# Billion-Dollar Agency Prompt: Rani Beauty Clinic

You are the lead architect at a $1B+ digital agency hired to transform ranibeautyclinic.com into the most advanced, highest-converting, SEO-dominant medical spa website ever built. Your team has built digital experiences for Four Seasons, Mayo Clinic, Hims/Hers, and Glossier. You combine clinical authority with luxury hospitality UX.

## The Client

Rani Beauty Clinic is a physician-supervised medspa in Renton, WA. The site already runs Next.js 14 on Vercel with a sophisticated AI-powered backend (Airtable CRM, 19 n8n workflows, Claude AI intake analysis, Vapi phone agent, Pinecone RAG, gamified dashboard with 67 API routes). The tech foundation is elite. Now we need the front-end experience, SEO architecture, and conversion engine to match.

## Your Mission

Take the existing Next.js codebase at github.com/rinarai4013-debug/rani-beauty-clinic and implement every optimization below. Every change must be production-ready, deployable to Vercel, and SEO-validated.

---

## PHASE 1: CONVERSION ARCHITECTURE (Week 1)

### 1.1 — Hero Section Rebuild
- Replace static hero with a **dynamic, personalized hero** that detects:
  - Time of day ("Good morning" vs "Good evening" + different imagery)
  - Returning visitors (cookie-based): show "Welcome back" + their last browsed service
  - UTM source: if from Google Ads, show the ad's promise above the fold
- Add a **micro-interaction booking widget** directly in the hero — not just a CTA button, but an inline "What are you looking for?" selector with 4 visual tiles (Face, Body, Skin, Wellness) that expands into a smart booking flow
- Implement a **social proof ticker** — real-time: "Sarah from Bellevue booked a HydraFacial 12 minutes ago" (pull from Airtable Appointments via API, anonymized)
- Add **trust badges row**: "Physician Supervised • 2,181+ Clients • 4.9★ Google Rating • Open 7 Days"

### 1.2 — Smart Booking Funnel
- Build a **3-step inline booking wizard** (not a redirect to Mangomint):
  - Step 1: Service category tiles with before/after thumbnail
  - Step 2: Specific service selection with pricing, duration, and "Most Popular" badges
  - Step 3: Calendar integration (Mangomint widget embed) with "Next available: Tomorrow at 2pm" urgency
- Add **financing callout** at the price step: "As low as $47/mo with Cherry financing"
- Include **exit-intent popup** with a different offer for each page context (service page = free consult, blog = lead magnet, pricing = financing CTA)

### 1.3 — Trust & Authority Layer
- Add a **"Why Rani"** comparison strip on every service page:
  - Column 1: "Typical Spa" (esthetician, no oversight, cookie-cutter)
  - Column 2: "Rani Beauty Clinic" (physician-supervised, custom protocols, board-certified neurologist)
- Build a **credentials sidebar** that appears on service pages: Dr. Landfield's credentials, years of experience, number of procedures performed
- Implement **review schema + Google review carousel** pulling from Airtable Reviews table (already exists)

---

## PHASE 2: SEO DOMINATION (Week 2)

### 2.1 — Content Hub Architecture
- Transform `/blog` into a **topical authority hub**:
  - Create 6 **pillar pages** (2,500+ words each): Laser Hair Removal Ultimate Guide, Injectable Guide (Botox + Fillers), Facial Rejuvenation Guide, Weight Loss Guide, Skin Concerns Encyclopedia, Wellness Treatments Guide
  - Each pillar links to 10-15 **cluster posts** (the existing blog posts)
  - Add **"Related Treatments"** and **"Related Articles"** cross-links to every blog post and service page
  - Implement **breadcrumb navigation** with BreadcrumbList schema on every page
- Add **table of contents** component to all blog posts and pillar pages (auto-generated from headings, sticky on scroll)

### 2.2 — Local SEO Fortress
- For each of the 48 geo-location pages (`/locations/[city]-wa`):
  - Add **unique testimonials** from clients in that city (or nearest city)
  - Add **driving directions** from that city to the clinic with Google Maps embed
  - Add **"People also search for"** section with city-specific long-tail keywords
  - Implement **LocalBusiness schema** with `areaServed` specific to each city
  - Add **city-specific FAQs** (e.g., "Is there parking near Rani Beauty Clinic for Bellevue residents?")
- For geo-service pages (`/locations/[city]/[service]`):
  - Add **unique intro paragraph** for each city+service combo (not just swapping city name)
  - Add a **"Before & After from [City] Clients"** gallery section
  - Include **pricing specific to that service** with a CTA

### 2.3 — Technical SEO Hardening
- Implement **IndexNow** on every page change (route already exists at `/api/indexnow`)
- Add **hreflang** tags (even for English-only, specify `en-US`)
- Implement **JSON-LD** for every page type:
  - Homepage: Organization + LocalBusiness + WebSite (with SearchAction)
  - Service pages: Service + MedicalProcedure + AggregateRating
  - Blog posts: BlogPosting + FAQPage + HowTo (where applicable)
  - Location pages: LocalBusiness + MedicalBusiness + GeoCoordinates
  - Team pages: Physician + MedicalOrganization
  - Pricing page: Product + Offer
- Add **internal link scoring** — every page should have 5-10 contextual internal links minimum
- Implement **dynamic XML sitemap** with `lastmod` dates that actually update on content changes
- Add `<link rel="preconnect">` for all third-party origins (Mangomint, Typeform, Google Fonts, analytics)

---

## PHASE 3: PERFORMANCE & UX EXCELLENCE (Week 3)

### 3.1 — Core Web Vitals Perfection
- Target: **LCP < 1.5s, FID < 50ms, CLS < 0.05** on both mobile and desktop
- Implement **image optimization pipeline**:
  - All hero/above-fold images: WebP/AVIF with `priority` flag
  - All below-fold images: lazy loaded with blur placeholder (use Next.js `placeholder="blur"`)
  - Generate **responsive srcsets** at 640, 750, 1080, 1920 widths
- Implement **font optimization**:
  - Self-host Playfair Display and Montserrat (remove Google Fonts external call)
  - Use `font-display: swap` with proper fallback stack
  - Subset fonts to Latin characters only
- Add **route prefetching** for likely next pages (e.g., service page → booking, blog → related post)
- Implement **Partial Prerendering (PPR)** for pages with dynamic + static content (Next.js 14 experimental)
- Move all **client-side analytics** to `afterInteractive` strategy

### 3.2 — Mobile-First Luxury Experience
- Redesign mobile navigation as a **bottom sheet** with thumb-friendly service categories
- Implement **swipeable before/after galleries** with pinch-to-zoom
- Add **sticky mobile CTA bar** at bottom: "Book Now" + phone icon + chat icon
- Build a **mobile-optimized pricing page** with expandable accordion sections and "Add to plan" functionality
- Ensure all touch targets are **minimum 48x48px** with 8px spacing

### 3.3 — Accessibility & Inclusivity
- WCAG 2.1 AA compliance across entire site
- Add **skip navigation links**, proper heading hierarchy, ARIA labels on all interactive elements
- Ensure **color contrast ratios** meet AA standards (especially gold #C9A96E on white backgrounds — may need darkening)
- Add **reduced motion** support for all Framer Motion animations
- Implement **focus visible** styles for keyboard navigation

---

## PHASE 4: AI-POWERED PERSONALIZATION (Week 4)

### 4.1 — Smart Content Personalization
- Implement **visitor intent detection**:
  - First visit from organic search → show educational content, trust signals, free consult CTA
  - Return visit to service page → show pricing, financing, "limited availability" urgency
  - Visit from Google Ads → mirror ad copy in hero, show the specific offer
  - Visited 3+ service pages → show "Build Your Custom Treatment Plan" CTA
- Build a **"Skin Concern Quiz"** that recommends treatments:
  - 5 questions (skin type, primary concern, budget, timeline, past treatments)
  - Results page with personalized 3-tier treatment plan (Good/Better/Best)
  - Lead capture gate before showing results (feeds into Airtable via existing AI intake API)
  - Shareable results URL for social referral

### 4.2 — AI Chat Widget Enhancement
- Upgrade the existing `/api/ai/chat` to include:
  - **Proactive triggers**: after 30s on pricing page, offer financing info; after reading a blog post, suggest related treatment
  - **Visual responses**: when discussing a treatment, show before/after images inline in chat
  - **Booking handoff**: when user expresses intent to book, seamlessly transition to Mangomint scheduling within the chat
  - **SMS opt-in**: if user provides phone number, trigger the existing n8n follow-up workflow

### 4.3 — Results & Social Proof Engine
- Build a **filterable before/after gallery** at `/results`:
  - Filter by: treatment type, concern addressed, skin type, age range
  - Each result shows: treatment name, number of sessions, timeframe, client testimonial
  - Implement `ImageObject` schema for each result
- Add **video testimonials** section with lazy-loaded YouTube/Vimeo embeds
- Implement **real-time review feed** from Google pulling from Airtable Reviews table

---

## PHASE 5: ADVANCED CONVERSION OPTIMIZATION (Week 5)

### 5.1 — Pricing Psychology
- Implement **anchoring** on pricing pages: show the premium option first, then standard
- Add **"Most Popular"** badge to mid-tier packages (driven by actual Airtable transaction data)
- Show **savings callout** on packages vs individual sessions: "Save $350 vs. individual pricing"
- Implement **urgency signals**: "3 spots remaining this week for new Botox clients" (pull from Mangomint schedule availability)
- Add **price comparison** to competitor pricing (use data from existing Competitor Intelligence table)

### 5.2 — Email/SMS Capture
- Build a **multi-step lead magnet** system:
  - Blog readers: "Download our [Treatment] Guide" (PDF gate)
  - Service page visitors: "Get a Free Virtual Consultation" (Typeform intake)
  - Pricing page visitors: "Unlock VIP Pricing" (email gate → shows 10% off first visit)
- Implement **behavioral email triggers** via n8n:
  - Abandoned booking flow → follow-up email in 1 hour
  - Viewed service page 3x → "Still considering [service]?" email
  - Downloaded guide → drip sequence: Day 1 educational, Day 3 social proof, Day 7 CTA

### 5.3 — Membership & Loyalty
- Build a **membership landing page** at `/membership`:
  - Tier comparison table (Angel Glow, Radiance, etc.)
  - Monthly cost with "break-even after X visits" calculator
  - Member-only perks with visual icons
  - "Join 200+ members" social proof counter (from Airtable Memberships)
- Add **loyalty program teaser** on all service pages: "Earn points toward free treatments"

---

## DESIGN SYSTEM SPECIFICATIONS

### Typography
- **Headlines:** Playfair Display (700), tracking -0.02em, sizes: 72/56/40/32/24px
- **Body:** Montserrat (400/500/600), tracking 0, sizes: 18/16/14px, line-height: 1.7
- **Accent:** Montserrat (300), letter-spacing 0.15em, uppercase for labels/badges

### Color System
- **Primary Navy:** #0F1D2C (backgrounds, text)
- **Gold Accent:** #C9A96E (CTAs, highlights, premium elements)
- **Cream:** #F8F6F1 (background sections, cards)
- **White:** #FFFFFF (clean sections)
- **Success Green:** #2D6A4F
- **Soft Blush:** #F5E6E0 (feminine accent, wellness sections)
- **Gradient:** linear-gradient(135deg, #0F1D2C, #1A3A4F) for premium hero sections

### Spacing Scale (rem)
- 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 16

### Animation Principles
- Entrance: fade-up 400ms ease-out with 50ms stagger between elements
- Hover: scale(1.02) + subtle shadow lift, 200ms ease
- Page transitions: crossfade 300ms
- Loading states: skeleton shimmer (cream → white pulse)
- Scroll-triggered: IntersectionObserver at 0.15 threshold, animate once

### Component Standards
- Cards: 16px radius, 1px border #E5E0D8, hover shadow `0 8px 32px rgba(15,29,44,0.08)`
- Buttons: Primary (gold bg, navy text, 8px radius), Secondary (transparent, gold border), Ghost (text only)
- Inputs: 48px height, 8px radius, 1px border, gold focus ring
- Sections: alternating cream/white backgrounds, 96px vertical padding (64px mobile)

---

## QUALITY GATES

Before any deploy:
- [ ] Lighthouse: Performance > 95, Accessibility > 95, SEO > 95, Best Practices > 95
- [ ] All pages pass Google Rich Results Test
- [ ] All pages have unique title, description, H1, canonical, OG image
- [ ] Zero console errors, zero 404s, zero redirect chains
- [ ] Mobile usability: all CTA buttons visible without scrolling on iPhone SE
- [ ] Page load < 2s on 3G throttled connection
- [ ] All images have alt text, all links have descriptive anchor text
- [ ] Schema validation passes for every structured data type
- [ ] Cross-browser tested: Chrome, Safari, Firefox, Edge (latest 2 versions)
- [ ] All forms submit successfully and feed into Airtable/n8n workflows
