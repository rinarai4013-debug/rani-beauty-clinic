# HOTJAR CRO SYSTEM — Rani Beauty Clinic
## Precision Experimentation & Revenue Optimization Engine

**System Role Clarity:**
- **Microsoft Clarity** = Volume behavioral observation (all sessions, raw patterns, rage clicks)
- **Hotjar** = Structured CRO experimentation layer (WHY users behave, WHAT to change, HOW to test)

**Do NOT duplicate Clarity's session replay volume. Hotjar recordings are surgical, filtered, hypothesis-driven.**

---

## 1. HEATMAP STRATEGY

### Priority Pages (Configure Immediately)

| # | Page | URL Pattern | Why |
|---|------|-------------|-----|
| 1 | **Homepage** | `/` | 20 sections — need to know where attention dies |
| 2 | **Get Started** | `/get-started` | Primary conversion funnel — Typeform embed is the money page |
| 3 | **Botox & Dysport** | `/services/botox-dysport` | Highest-demand injectable service |
| 4 | **HydraFacial** | `/services/hydrafacial` | Entry-level treatment, gateway to upsell |
| 5 | **Dermal Fillers** | `/services/dermal-fillers` | High AOV service |
| 6 | **Pricing** | `/pricing` | Price sensitivity checkpoint — where sticker shock kills conversions |
| 7 | **Membership** | `/membership` | LTV multiplier — The Glow program adoption |
| 8 | **Quiz** | `/quiz` | Lead qualification funnel |

### Heatmap Types Per Page

| Page | Click Map | Scroll Map | Move Map | Priority |
|------|-----------|------------|----------|----------|
| Homepage | ✅ | ✅ | ❌ | Scroll depth is critical — 20 sections |
| Get Started | ✅ | ✅ | ✅ | Move map reveals hesitation around Typeform |
| Service Pages | ✅ | ✅ | ❌ | Click distribution on CTAs vs content |
| Pricing | ✅ | ✅ | ✅ | Move map shows price comparison behavior |
| Membership | ✅ | ✅ | ❌ | Tier selection patterns |
| Quiz | ✅ | ✅ | ❌ | Drop-off points in quiz flow |

### Attention Zone Definitions

**High Attention Zone:**
- Scroll depth: ≥70% of visitors reach this section
- Click density: ≥5% of total page clicks concentrated here
- Dwell indicator: Move map shows sustained hover (>3 seconds in area)

**Dead Zone (Ignored Content):**
- Scroll depth: <30% of visitors reach this section
- Click density: <0.5% of total clicks
- No meaningful move map activity

### Homepage Section Audit Framework

Map scroll depth against the 20 homepage sections:

```
Section                    | Expected Reach | Action if Below
---------------------------|----------------|------------------
Hero                       | 100%           | N/A
Trust Logos Bar             | 95%+           | Reduce hero height
Trust Bar                  | 90%+           | Move above fold
Service Category Panels    | 85%+           | Critical — gateway
HomeServicesOverview        | 75%+           | Simplify if low
MeetTheTeam                | 60%+           | Consider repositioning
ProcessSteps               | 55%+           | Validate necessity
DoctorIntro                | 50%+           | Move up if low reach
WhyRaniCards               | 45%+           | Test moving above team
BeforeAfterSlider          | 40%+           | High-value — move up if low
ReviewCarousel             | 35%+           | Social proof placement test
WhyRaniComparison          | 30%+           | Competitive diff — test position
BeforeAfterGallery         | 25%+           | Consider above reviews
PopularPackages            | 20%+           | Revenue section — test higher
TreatmentQuiz              | 15%+           | Quiz adoption signal
BlogTeaser                 | 12%+           | Low priority
ConsultationEmbed          | 10%+           | Typeform visibility problem if low
FAQ                        | 8%+            | Expected low
CTABanner                  | 6%+            | Terminal CTA
MapSection                 | 5%+            | Footer utility
```

**Critical Signal:** If PopularPackages (<20% reach) or ConsultationEmbed (<10% reach) are below thresholds, the page is too long and revenue-generating sections are buried.

---

## 2. SESSION RECORDING FILTER SYSTEM

### Segment Definitions

**Do NOT record all sessions. Hotjar recordings are for insight extraction, not volume.**

#### Segment A: High-Intent Non-Converters (PRIORITY 1)
```
Filters:
- Pages visited: ≥3
- Session duration: >90 seconds
- Visited: /get-started OR /services/* OR /pricing OR /membership
- Did NOT trigger: cta_click event (Typeform/Mangomint destination)
- Device: Any
```
**Why:** These users wanted to book but something stopped them. This is where money is left on the table.

#### Segment B: Booking Page Drop-offs (PRIORITY 1)
```
Filters:
- Visited: /get-started
- Session duration: >30 seconds on /get-started
- Did NOT complete Typeform submission
- Device: Any
```
**Why:** They reached the money page and bounced. Friction is either in the page layout, Typeform load time, or messaging.

#### Segment C: Mobile Funnel Friction (PRIORITY 2)
```
Filters:
- Device: Mobile only
- Pages visited: ≥2
- Session duration: >60 seconds
- Visited any service page
```
**Why:** Mobile is likely 60-70% of traffic. Mobile UX friction = direct revenue loss.

#### Segment D: Returning Visitors Who Don't Book (PRIORITY 2)
```
Filters:
- Returning visitor: Yes
- Pages visited: ≥2
- Did NOT trigger: cta_click or phone_click or booking_widget_opened
```
**Why:** They came back but still didn't convert. Trust or pricing barrier.

#### Segment E: Pricing Page Behavior (PRIORITY 3)
```
Filters:
- Visited: /pricing
- Session duration: >45 seconds on /pricing
- Next action: left site OR navigated away from pricing
```
**Why:** Price page exits signal sticker shock or insufficient value framing.

#### Segment F: Quiz Abandoners (PRIORITY 3)
```
Filters:
- Visited: /quiz OR interacted with TreatmentQuiz section on homepage
- Did NOT complete quiz
- Session duration: >30 seconds
```
**Why:** Quiz is a lead qualification tool. Abandonment = lost lead capture opportunity.

### Weekly Recording Review Protocol

| Week | Recordings to Review | Segments | Analyst Action |
|------|---------------------|----------|----------------|
| Week 1 | 20–25 | A + B | Extract friction patterns from high-intent drop-offs |
| Week 2 | 15–20 | C + D | Mobile UX issues + returning visitor barriers |
| Week 3 | 15–20 | A + E | Booking drop-offs + pricing page behavior |
| Week 4 | 15–20 | B + F | Get-started friction + quiz abandonment |
| Ongoing | 15–20/week | Rotate | Focus on active hypothesis segments |

### Pattern Extraction Template

For each recording session reviewed, log:

```
Session ID: ___
Segment: ___
Device: ___
Pages Visited: ___
Session Duration: ___
Observed Friction:
  - [ ] CTA not visible / not clicked
  - [ ] Scroll stopped before key section
  - [ ] Hesitation on form / Typeform
  - [ ] Price page exit
  - [ ] Rage click / dead click
  - [ ] Confusing navigation
  - [ ] Mobile layout issue
  - [ ] Slow page load
  - [ ] Other: ___
Hypothesis Generated: ___
Estimated Impact: Low / Medium / High
```

---

## 3. ON-SITE FEEDBACK ENGINE

### Survey 1: Exit Intent — Booking Friction Capture
**Trigger:** Exit intent detected (mouse leaves viewport on desktop / back button on mobile)
**Conditions:**
- User has been on site >30 seconds
- User visited at least 1 service page OR /get-started OR /pricing
- User has NOT completed a Typeform submission or clicked Mangomint booking
- Show once per user per 7 days (cookie-controlled)

**Question:**
> "Was there anything stopping you from booking today?"

**Response Type:** Multiple choice + optional open text

**Options:**
1. I'm still researching / not ready yet
2. I couldn't find pricing information
3. I wasn't sure which treatment is right for me
4. I'd prefer to talk to someone first
5. The booking process was confusing
6. Something else (please share)

**Response Mapping:**

| Response | Friction Category | Action |
|----------|------------------|--------|
| Still researching | Desire — not compelling enough | Test stronger social proof, urgency |
| Couldn't find pricing | Clarity — information gap | Test pricing visibility, add to service pages |
| Unsure which treatment | Clarity — decision paralysis | Test quiz prominence, comparison tools |
| Prefer to talk first | Trust — need human validation | Test phone CTA prominence, live chat |
| Booking confusing | Friction — process barrier | Audit Typeform UX, test simplified flow |
| Something else | Capture verbatim | Qualitative analysis weekly |

---

### Survey 2: Mid-Session Intent — Service Page Engagement
**Trigger:** User has scrolled >50% of any service page (`/services/*` or `/wellness/*`)
**Conditions:**
- Session duration on page >45 seconds
- First visit to this specific service page
- Show once per user per 14 days

**Question:**
> "What are you most hoping to improve?"

**Response Type:** Multiple choice (single select)

**Options:**
1. Fine lines & wrinkles
2. Skin texture & tone
3. Acne or scarring
4. Volume loss or facial contouring
5. Hair removal
6. Weight management
7. Overall wellness & energy
8. Just exploring options

**Response Mapping:**

| Response | Insight Type | Action |
|----------|-------------|--------|
| Lines/wrinkles | Demand signal → Botox/Fillers | Feature in hero, test service ordering |
| Texture/tone | Demand signal → HydraFacial/Peels | Cross-link treatments |
| Acne/scarring | Demand signal → Laser/RF Micro | Test concern-based navigation |
| Volume loss | Demand signal → Fillers | Test before/after prominence |
| Hair removal | Demand signal → Laser | Validate package pricing |
| Weight mgmt | Demand signal → GLP-1 | Test wellness section visibility |
| Wellness | Demand signal → NAD+/Vitamins | Test wellness positioning |
| Just exploring | Early funnel | Test quiz trigger for explorers |

**Revenue Use:** Aggregate monthly to identify demand gaps between what users want and what content/CTAs prioritize.

---

### Survey 3: Post-Scroll Content Gap — Homepage
**Trigger:** User has scrolled >60% of homepage
**Conditions:**
- Session duration >90 seconds
- Has not interacted with any CTA yet
- Show once per user per 30 days

**Question:**
> "Is there anything you wish this page showed you?"

**Response Type:** Open text (1 field, 200 char max)

**Purpose:** Captures messaging gaps, missing trust signals, content that users expect but don't find.

**Analysis:** Weekly verbatim review → tag into categories:
- Missing pricing → test price anchors on homepage
- Missing reviews/results → test before/after gallery position
- Missing provider info → test doctor credibility section
- Missing process info → test "what to expect" section
- Missing comparison → test competitive differentiation

---

### Survey 4: Post-Booking Satisfaction (Thank You Page)
**Trigger:** User lands on `/thank-you`
**Conditions:** Always show (these are converted users)

**Question:**
> "How easy was it to book with us? (1–5)"
> Follow-up if ≤3: "What would have made it easier?"

**Purpose:** Measures booking flow friction from converted users (survivorship insight).

---

### Survey 5: Pricing Page Reaction
**Trigger:** User has been on `/pricing` for >30 seconds
**Conditions:**
- Show once per user per 14 days
- Only if user has NOT yet clicked any CTA on pricing page

**Question:**
> "How do our prices compare to what you expected?"

**Response Type:** Single select

**Options:**
1. Lower than expected
2. About what I expected
3. Higher than expected
4. I need more context to evaluate

**Response Mapping:**

| Response | Insight | Action |
|----------|---------|--------|
| Lower than expected | Value perception strong | Can test premium positioning |
| About expected | Neutral — not a barrier | Focus on other friction points |
| Higher than expected | Sticker shock risk | Test value framing, financing, membership anchor |
| Need more context | Clarity gap | Test adding "what's included" or comparison |

---

## 4. CRO EXPERIMENTATION SYSTEM

### Hypothesis Framework (ICE Scoring)

Every hypothesis gets scored before testing:

| Factor | Score | Definition |
|--------|-------|------------|
| **I**mpact | 1–10 | Estimated conversion lift if hypothesis is correct |
| **C**onfidence | 1–10 | How sure are we this is actually the problem? (data-backed = 8+) |
| **E**ase | 1–10 | How easy is it to implement and test? |

**ICE Score = (I × C × E) / 10**

Priority: Test highest ICE score first.

### Experimentation Queue (Starter Hypotheses)

These are pre-loaded based on site architecture analysis. Validate/invalidate with Hotjar data.

| # | Hypothesis | ICE | Data Source | Test |
|---|-----------|-----|-------------|------|
| 1 | **Homepage is too long** — revenue sections (packages, consultation embed) are buried below 15+ sections | I:9 C:7 E:6 = 37.8 | Scroll heatmap | Move PopularPackages and ConsultationEmbed above ProcessSteps |
| 2 | **"Book a Consultation" is vague** — users don't know if it's paid, free, or what happens next | I:8 C:6 E:9 = 43.2 | Exit survey + click map | Test "Get Your Free Treatment Plan" vs current CTA |
| 3 | **Pricing page lacks value anchoring** — prices shown without context create sticker shock | I:8 C:6 E:7 = 33.6 | Pricing survey + exit rate | Test "Starting from $X/month" with Cherry financing on pricing page |
| 4 | **Mobile CTA bar competes with content** — 3 buttons may cause decision paralysis | I:7 C:5 E:8 = 28.0 | Mobile recordings + click map | Test single "Book Now" button vs 3-button bar |
| 5 | **Service pages lack social proof at point of decision** — before/after and reviews are on homepage, not service pages | I:8 C:7 E:6 = 33.6 | Service page scroll map + recordings | Add 2-3 before/after images + 1 review to each service page above CTA |
| 6 | **Get Started page Typeform embed loads slowly** — users see blank space and bounce | I:9 C:5 E:4 = 18.0 | Recording segment B | Test native form vs Typeform embed, measure completion rate |
| 7 | **Quiz is buried on homepage (section 15 of 20)** — most users never see it | I:7 C:8 E:8 = 44.8 | Homepage scroll heatmap | Test quiz as section 5 (after services overview) |
| 8 | **No pricing on service pages** — users must navigate to /pricing, creating drop-off | I:8 C:6 E:7 = 33.6 | Service page recordings + exit survey | Test "Starting from $X" pricing on each service page |
| 9 | **Exit intent popup offers quiz, but user may already know what they want** — wrong offer for high-intent visitors | I:6 C:5 E:8 = 24.0 | Exit survey responses | Test "Book a free phone consult now" for users who visited service pages |
| 10 | **Membership page doesn't show ROI** — $149/mo without "you save $X/year" framing | I:7 C:5 E:9 = 31.5 | Membership scroll map + pricing survey | Add savings calculator / "members save $X per year" section |

### Weekly Experimentation Loop

```
MONDAY — INSIGHT DAY
├── Review 15-20 session recordings (from priority segments)
├── Review heatmap changes from previous week
├── Collect survey responses (aggregate + verbatim review)
├── Identify top 3 patterns
└── Output: 3-5 new hypotheses added to backlog

TUESDAY — PRIORITIZATION
├── Score new hypotheses (ICE)
├── Update backlog rankings
├── Select 1-2 experiments to launch this week
└── Output: Experiment brief (hypothesis, change, success metric, timeline)

WEDNESDAY–THURSDAY — IMPLEMENTATION
├── Design variant (copy, layout, or component change)
├── Implement change (code or CMS update)
├── QA on mobile + desktop
└── Output: Variant live on staging/production

FRIDAY — MEASUREMENT SETUP
├── Confirm tracking is firing for experiment
├── Set baseline metrics (current conversion rate for that element/page)
├── Define minimum sample size for significance
└── Output: Experiment running, measurement confirmed

FOLLOWING MONDAY — REVIEW
├── Check early data (directional only, don't conclude)
├── Continue recording reviews for experiment segment
└── Output: Early signal assessment

AFTER 2-4 WEEKS — CONCLUSION
├── Statistical significance check (95% confidence minimum)
├── Winner/loser declaration
├── If winner: ship permanently
├── If loser: document learning, generate next hypothesis
└── Output: Experiment report + next action
```

### A/B Testing Without Hotjar's A/B Tool

Since Hotjar doesn't have native A/B testing, use this manual framework:

**Method 1: Time-Split Testing**
- Week 1-2: Control (current version) — measure baseline
- Week 3-4: Variant (new version) — measure change
- Compare: Same traffic conditions, same days of week
- Control for: seasonality, ad spend changes, external factors

**Method 2: URL-Split Testing**
- Create variant page at `/get-started-v2` or use query param `?variant=b`
- Split traffic via GTM or Next.js middleware
- Track conversions per variant in GA4
- Use Hotjar heatmaps on BOTH versions simultaneously

**Method 3: Component-Level Testing**
- Use Next.js feature flags or cookie-based rendering
- Show variant A to 50% of users, variant B to 50%
- Fire GA4 custom event with variant identifier
- Hotjar surveys on variant pages capture qualitative signal

---

## 5. INSIGHT CLASSIFICATION FRAMEWORK

Every finding from heatmaps, recordings, or surveys gets tagged:

### The 4-Category System

#### 🔍 CLARITY Issues (User is confused)
**Signals:**
- Rage clicks on non-clickable elements
- Back-and-forth navigation between pages
- Scroll up/down repeatedly on same section
- Survey response: "I wasn't sure which treatment..."
- Heatmap: clicks on decorative elements or images (expecting interaction)

**Examples:**
- "I clicked the before/after image expecting to see more results"
- "I couldn't tell if the consultation was free or paid"
- Service names are clinical — user doesn't know what RF Microneedling is

**Fix Pattern:** Better labels, explanatory copy, visual hierarchy, tooltips

---

#### 🛡️ TRUST Issues (User doesn't believe)
**Signals:**
- Short sessions on about/team pages (didn't find what they needed)
- High exit rate from service pages without clicking CTA
- Survey response: "I'd prefer to talk to someone first"
- Low engagement with social proof sections

**Examples:**
- "I wanted to see real results, not stock photos"
- "I couldn't find the doctor's credentials"
- "No Google reviews visible on the site"

**Fix Pattern:** More before/afters, provider credentials, review integration, trust badges, video testimonials

---

#### 🔥 DESIRE Issues (User isn't compelled enough)
**Signals:**
- High scroll depth but no CTA clicks (saw everything, didn't act)
- Survey response: "Still researching / not ready yet"
- Low time on page despite reaching key sections
- Heatmap: attention dies at value proposition sections

**Examples:**
- "The page didn't make me feel like I need this right now"
- "I didn't see what makes Rani different from other medspas"
- Generic messaging that doesn't create urgency or aspiration

**Fix Pattern:** Stronger headlines, outcome-focused copy, urgency triggers, competitive differentiation, aspirational imagery

---

#### ⚡ FRICTION Issues (User wants to act but can't)
**Signals:**
- Reached /get-started but didn't complete Typeform
- Rage clicks on CTA buttons (slow load)
- Mobile recordings showing scroll/tap difficulties
- Survey response: "Booking process was confusing"
- Multiple attempts to find booking page

**Examples:**
- Typeform takes 3+ seconds to load in embed
- Mobile keyboard covers input fields
- Too many steps to reach booking
- Phone number hard to find

**Fix Pattern:** Faster loads, fewer steps, clearer navigation, prominent contact info, simplified forms

### Classification Dashboard (Weekly Log)

```
Week of: ___________

| Finding | Category | Source | Page | ICE Score | Status |
|---------|----------|--------|------|-----------|--------|
|         |          |        |      |           |        |
|         |          |        |      |           |        |
|         |          |        |      |           |        |

Summary:
- Clarity issues: ___ (__ %)
- Trust issues:   ___ (__ %)
- Desire issues:  ___ (__ %)
- Friction issues: ___ (__ %)

Top category this week: ___
Trend vs last week: ___
```

---

## 6. REVENUE CONNECTION FRAMEWORK

### Revenue Impact Estimation Model

For every insight, estimate impact using this formula:

```
Monthly Revenue Impact =
  Monthly Visitors to Affected Page
  × Current Conversion Rate
  × Estimated Lift %
  × Average Booking Value

Example:
  2,000 visitors/mo to /get-started
  × 8% current conversion
  × 20% estimated lift
  × $450 avg first booking
  = $14,400/mo additional revenue potential
```

### Impact Tiers

| Tier | Monthly Revenue Impact | Priority |
|------|----------------------|----------|
| **Tier 1 — Ship This Week** | >$5,000/mo | Immediate implementation |
| **Tier 2 — Test This Month** | $1,000–$5,000/mo | Add to experiment queue |
| **Tier 3 — Backlog** | <$1,000/mo | Document, revisit quarterly |

### Revenue-Connected Hypothesis Examples

| Hypothesis | Affected Page | Traffic/Mo | Current CVR | Est. Lift | Avg Value | Revenue Impact |
|-----------|---------------|-----------|-------------|-----------|-----------|---------------|
| CTA "Get Your Free Treatment Plan" vs "Book Consultation" | All pages | 5,000 | 3% | +25% | $450 | +$16,875/mo |
| Move quiz to section 5 on homepage | Homepage | 3,000 | 1.5% quiz start | +40% | $450 (downstream) | +$8,100/mo |
| Add "starting from $X" to service pages | Service pages | 2,000 | 5% | +15% | $450 | +$6,750/mo |
| Fix Typeform load on /get-started | /get-started | 1,500 | 8% | +20% | $450 | +$10,800/mo |
| Add financing CTA to pricing page | /pricing | 800 | 4% | +30% | $450 | +$4,320/mo |

*Note: These are estimates. Validate with actual traffic data from GA4. Update monthly.*

### KPI Dashboard Metrics (Track Weekly)

| Metric | Source | Baseline | Target |
|--------|--------|----------|--------|
| Homepage → /get-started click rate | GA4 | Measure W1 | +20% in 90 days |
| /get-started Typeform completion rate | Typeform + GA4 | Measure W1 | +15% in 90 days |
| Service page → CTA click rate | GA4 + Hotjar click map | Measure W1 | +25% in 90 days |
| Pricing page exit rate | GA4 | Measure W1 | -20% in 90 days |
| Mobile conversion rate vs desktop | GA4 | Measure W1 | Close gap by 50% |
| Survey response: "booking confusing" | Hotjar survey | Measure W1 | Reduce to <10% |
| Average scroll depth — homepage | Hotjar heatmap | Measure W1 | +15% in 60 days |

---

## 7. WEEKLY OPERATING SYSTEM

### The CRO Sprint — Weekly Cadence

```
┌─────────────────────────────────────────────────────────────────┐
│ MONDAY — INSIGHT EXTRACTION (60-90 min)                        │
├─────────────────────────────────────────────────────────────────┤
│ □ Review 15-20 session recordings from priority segments       │
│ □ Log friction patterns using extraction template              │
│ □ Review heatmap snapshots for priority pages                  │
│ □ Collect and categorize survey responses                      │
│ □ Tag all findings: Clarity / Trust / Desire / Friction        │
│ □ Generate 3-5 new hypotheses                                  │
│ OUTPUT: Weekly insight log + hypothesis backlog update          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TUESDAY — PRIORITIZATION & PLANNING (30 min)                   │
├─────────────────────────────────────────────────────────────────┤
│ □ ICE score all new hypotheses                                 │
│ □ Rank backlog by ICE score                                    │
│ □ Select 1-2 experiments for this week                         │
│ □ Write experiment brief:                                      │
│   - Hypothesis statement                                       │
│   - Change description                                         │
│   - Success metric + target                                    │
│   - Test duration + sample size                                │
│ □ Check running experiments for early signals                  │
│ OUTPUT: This week's experiment brief                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ WEDNESDAY — IMPLEMENTATION (variable)                           │
├─────────────────────────────────────────────────────────────────┤
│ □ Implement selected experiment (code/copy/design change)      │
│ □ QA on desktop + mobile                                       │
│ □ Verify Hotjar heatmap is capturing new variant               │
│ □ Verify GA4 events are firing correctly                       │
│ □ Set up Hotjar recording filter for experiment page           │
│ OUTPUT: Experiment live                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ THURSDAY — SURVEY OPTIMIZATION (15 min)                        │
├─────────────────────────────────────────────────────────────────┤
│ □ Check survey response rates                                  │
│ □ Adjust triggers if response rate <3%                         │
│ □ Review verbatim responses for unexpected patterns            │
│ □ Update survey questions if current ones aren't actionable    │
│ OUTPUT: Survey health check                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ FRIDAY — MEASUREMENT & REPORTING (30 min)                      │
├─────────────────────────────────────────────────────────────────┤
│ □ Update KPI dashboard with this week's numbers                │
│ □ Check experiment data (directional signal)                   │
│ □ Conclude any experiments that hit significance               │
│ □ Document wins/losses in experiment log                       │
│ □ Calculate revenue impact of shipped changes                  │
│ □ Plan next week's recording review segments                   │
│ OUTPUT: Weekly CRO report (5 min read)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Monthly Review (First Monday of Month)

```
□ Aggregate 4 weeks of insights — what categories dominate?
□ Review all experiment results — what's the cumulative conversion lift?
□ Calculate actual revenue impact of shipped changes
□ Update revenue impact estimates with real traffic data from GA4
□ Identify systemic patterns (e.g., "mobile friction is 60% of all issues")
□ Set next month's CRO focus area based on data
□ Refresh survey questions if response patterns are stale
□ Archive completed experiments
□ Update ICE scores for remaining backlog items
```

### Quarterly Strategic Review

```
□ Total conversion rate change since CRO program started
□ Revenue attributed to CRO changes
□ Top 3 highest-impact experiments shipped
□ Biggest failed hypothesis (and what was learned)
□ Survey trend analysis — are friction categories shifting?
□ Hotjar plan utilization — are we using all features?
□ Competitive benchmark — what are top medspas doing differently?
□ Set next quarter's conversion rate target
```

---

## 8. HOTJAR CONFIGURATION CHECKLIST

### Immediate Setup (Day 1)

- [ ] **Heatmaps:** Create heatmaps for all 8 priority pages listed in Section 1
- [ ] **Recording Filters:** Create all 6 segments (A through F) from Section 2
- [ ] **Survey 1:** Exit intent survey — deploy on all pages except /thank-you
- [ ] **Survey 4:** Post-booking satisfaction — deploy on /thank-you
- [ ] **Survey 5:** Pricing reaction — deploy on /pricing
- [ ] **Recording Cap:** Set daily recording limit to 100/day (preserve quota for filtered segments)

### Week 1 Setup

- [ ] **Survey 2:** Mid-session intent — deploy on all `/services/*` and `/wellness/*` pages
- [ ] **Survey 3:** Post-scroll content gap — deploy on homepage
- [ ] **Baseline Measurement:** Record current metrics for all KPIs in Section 6
- [ ] **First Recording Review:** Watch 20 recordings from Segment A + B
- [ ] **First Heatmap Review:** Screenshot homepage scroll map as baseline

### Week 2 Optimization

- [ ] **Adjust Survey Triggers:** Fine-tune timing based on response rates
- [ ] **Refine Recording Filters:** Tighten or expand based on volume
- [ ] **Launch First Experiment:** Highest ICE-scored hypothesis from Section 4
- [ ] **Create Experiment Tracking Sheet:** Use template from Section 5

### Ongoing

- [ ] **Weekly Sprint:** Follow cadence from Section 7 every week
- [ ] **Monthly Review:** First Monday of each month
- [ ] **Quarterly Strategy:** Update roadmap and targets

---

## 9. ANTI-PATTERNS — DO NOT DO THIS

| Anti-Pattern | Why It Fails | Do This Instead |
|-------------|-------------|-----------------|
| Watch random recordings | No hypothesis = no insight | Always review recordings through a filtered segment |
| Heatmap every page | Noise drowns signal | Focus on 8 priority pages, expand only when warranted |
| Survey on every page | Survey fatigue kills response rates | Max 2 surveys visible per user session |
| Test 5 things at once | Can't attribute what worked | 1-2 experiments per week maximum |
| Conclude experiments in 3 days | Insufficient sample size | Minimum 2 weeks or 200 conversions per variant |
| Copy competitor CTAs | Their context ≠ your context | Generate hypotheses from YOUR data |
| Redesign pages wholesale | Can't measure what improved | Change one variable per experiment |
| Ignore mobile | 60-70% of traffic | Always check mobile heatmaps and recordings |
| Use Hotjar for volume replay | That's Clarity's job | Hotjar recordings are surgical, filtered, 15-20/week |

---

## 10. TOOL INTEGRATION MAP

```
HOTJAR (WHY + WHAT + HOW)          CLARITY (RAW OBSERVATION)
├── Heatmaps (8 priority pages)     ├── All session recordings (volume)
├── Filtered recordings (6 segments)├── Rage click detection
├── 5 micro-surveys                 ├── Dead click patterns
├── Hypothesis generation           ├── Scroll depth (all pages)
├── Experiment measurement          ├── Device/browser breakdown
└── Qualitative insight             └── Quantitative patterns

           ↓ Both feed into ↓

    GA4 (QUANTITATIVE MEASUREMENT)
    ├── Conversion rates per page
    ├── Funnel drop-off rates
    ├── Traffic sources × conversion
    ├── Experiment variant tracking
    └── Revenue attribution

           ↓ Actions flow to ↓

    CODEBASE (IMPLEMENTATION)
    ├── Component changes (CTAs, layout)
    ├── Copy updates
    ├── Feature flags for experiments
    └── New tracking events
```

---

*This system turns behavioral data into revenue. Execute the weekly cadence. Ship one experiment per week. Compound 1-2% conversion lifts into 20-40% annual improvement.*
