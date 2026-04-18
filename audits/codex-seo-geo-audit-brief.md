# Forensic GEO/AEO + Technical SEO Audit — Engagement Brief

**Client:** Rani Beauty Clinic (medspa, Renton WA) — physician-supervised luxury aesthetics
**Engagement Type:** Post-implementation forensic audit + remediation roadmap
**Audit Date:** 2026-04-17
**Auditor:** Codex (OpenAI) acting as Principal SEO Engineer + Generative Engine Optimization (GEO) specialist
**Business Stakes:** Medspa in a YMYL (Your Money or Your Life) vertical competing against national chains (SkinSpirit, Ideal Image) and Seattle-area specialists. Search and AI-answer visibility is the primary revenue driver after word-of-mouth. Every schema error is a lost citation. Every crawl budget waste is a lost lead. **Treat this like a $50M enterprise engagement.**

---

## 0. How to use this brief

You are not here to praise what was shipped. You are here to **find what's broken, what's missing, what's brittle, and what's competitively inferior.** The engineering team just shipped 6 PRs (numbers #77 → #82) in 24 hours. That velocity creates surface area for mistakes. Your job: find them, score them, and hand back a ruthless remediation roadmap.

**Mental model:** If a Fortune 50 healthcare brand hired McKinsey Digital, Ogilvy Health, and iCrossing together, what audit would show up at the C-suite readout? That's the bar. Evidence-based, no hand-waving, no filler, every finding tied to a specific file/line/URL with a specific remediation.

**Your deliverable determines whether we ship PR #83 with confidence or roll back.**

---

## 1. Engagement Scope

### 1.1 Assets under audit

| Asset | Location | Role |
|-------|----------|------|
| Production site | `https://www.ranibeautyclinic.com` | Primary indexable surface |
| Repo | `rinarai4013-debug/rani-beauty-clinic` | Source of truth for all changes |
| Stack | Next.js 14.2 App Router, TypeScript, Vercel | SSR schemas, no CSR hydration gaps expected |
| Sitemap index | `/sitemap.xml` → `/sitemap/0.xml` through `/sitemap/5.xml` (~3,100 URLs) | Indexability map |
| AI discovery | `/llms.txt` + `/llms-full.txt` + `/robots.txt` | LLM citation surface |
| Local SEO | Mangomint booking (`booking.mangomint.com/ranibeautyclinic1`) + Google Business Profile | Off-site NAP data |

### 1.2 Recently shipped work (past 24 hours, in order)

You must audit the **merged state on main** against each of these PRs' stated intent. If any claim in the PR body doesn't match reality on production, flag it as a P0 finding.

| PR | Title | Intent |
|----|-------|--------|
| #77 | `fix(mastermind): fix photo upload zones` | Internal dashboard only — excluded from this audit |
| #78 | `feat(mastermind): auto-save drafts + clinical observations` | Internal dashboard only — excluded |
| #79 | `feat(catalog): add Cosmelan Peel $1,399 + Microneedling w/ Arrissence $695, update PRX-T33 to $495` | New services added to unified catalog, pricing, booking services, AI aftercare, consultation picker, aftercare-map |
| #80 | `feat(services): public pages for Cosmelan Peel + Microneedling w/ Arrissence` | New `/services/cosmelan-peel` + `/services/microneedling-arrissence-undereye` full SEO pages |
| #81 | `feat(seo): 100X GEO/AEO — AI crawlers + JSON-LD + Offer schema` | `robots.txt` 17 AI UAs, sitemap slugs, `llms.txt` new entries, `MedicalProcedure` indication/bodyLocation/preparation/followup, new `Service + Offer` schema |
| #82 | `feat(seo): site-wide GEO/AEO — global @graph, blog trust schema, llms.txt clinical depth` | `layout.tsx` 3-node `@graph` (Organization+MedicalBusiness+MedicalClinic+LocalBusiness, Person for Dr. Landfield, WebSite+SearchAction), `blog/[slug]` `BlogPosting+MedicalWebPage` with reviewedBy/speakable/medicalAudience, every service bullet in llms.txt rewritten to clinical depth, llms-full.txt extended |

### 1.3 Explicit out-of-scope

- Dashboard / `/dashboard/*` routes (correctly `Disallow`'d)
- `/api/*` routes (correctly `Disallow`'d)
- Mangomint-hosted booking pages (third party)
- Paid advertising landing pages under `/lp/*`
- Performance budgets below the Core Web Vitals thresholds (unless regression from PR #82)

---

## 2. Audit Dimensions — 12 Mandatory Assessments

For each dimension, produce:
1. **Status:** ✅ Pass · ⚠️ Issues · ❌ Fail
2. **Score:** 0–100
3. **Evidence:** File paths + line numbers + schema snippets + live URL excerpts
4. **Findings:** Numbered list, each with a severity (P0 = broken in production, P1 = meaningful gap, P2 = polish)
5. **Remediation:** Exact code change or config step, ready to implement

### 2.1 `robots.txt` compliance & completeness
- Parse the live `/robots.txt` against RFC 9309 syntax
- Verify all 17 AI user-agent blocks are formatted correctly (no stray whitespace, correct `Allow`/`Disallow` pairing, no wildcard ambiguity)
- Cross-check against the current published UA strings for: **GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, CCBot, Applebot-Extended, FacebookBot, Meta-ExternalAgent, Bytespider, Amazonbot, YouBot, Diffbot, MistralAI-User, cohere-ai**. Flag any missing (e.g., `Perplexity-User` is distinct from `PerplexityBot`).
- Check for **contradictions** between wildcard `User-agent: *` block and specific AI bot blocks — any AI bot that would be more restricted by the wildcard than by its own block?
- Verify `Sitemap:` directive present and resolvable (HTTP 200)
- Verify `llms.txt` discovery pointer comment

### 2.2 Sitemap index + sub-sitemaps
- Fetch `/sitemap.xml` and each of the 6 sub-sitemaps
- Count URLs per sub-sitemap; confirm matches the stated strategy in `src/app/sitemap.ts` comment (Core ~250, Blog ~192, SEO ~307, Geo ~175, Near A-K ~850, Near L-Z ~1,400)
- Confirm new service slugs (`cosmelan-peel`, `microneedling-arrissence-undereye`) appear in sub-sitemap 0
- Audit `lastModified` timestamps — any in the future? Any stuck on build time (not intentional content-update time)?
- Audit `priority` values — is the homepage 1.0, services 0.9, blog 0.8, SEO long-tail 0.5–0.6? Any misranked?
- Audit `changeFrequency` — any set to `always` or `hourly` that aren't actually updated that frequently?
- Compare repo's known crawlable pages (`find src/app -name "page.tsx"`) against sitemap entries — any indexable pages missing from the sitemap?

### 2.3 Structured data (JSON-LD) — the critical dimension
This is where the engagement is won or lost. Validate every schema emitted against the Schema.org spec + Google's required/recommended property lists for Rich Results.

Fetch these live URLs, extract JSON-LD from each, and validate:
- `https://www.ranibeautyclinic.com/` (expect `@graph` with Organization + Person + WebSite)
- `https://www.ranibeautyclinic.com/services/cosmelan-peel` (expect MedicalProcedure + Service + Offer + FAQPage + HowTo + BreadcrumbList)
- `https://www.ranibeautyclinic.com/services/microneedling-arrissence-undereye` (same)
- `https://www.ranibeautyclinic.com/services/hydrafacial` (template regression check)
- `https://www.ranibeautyclinic.com/services/botox-dysport` (template regression check — ensure Person schema for Dr. Landfield doesn't conflict between layout @graph and any service-level reference)
- `https://www.ranibeautyclinic.com/wellness/glp1-weight-management` (ensure wellness pages inherited the Offer schema from ServicePageTemplate.tsx)
- `https://www.ranibeautyclinic.com/blog/[any-post-slug]` (pick one — expect BlogPosting+MedicalWebPage with reviewedBy)

For each page, check:
- **`@id` consistency** — every node with an `@id` must resolve to a canonical URL + fragment. Cross-page `@id` references (e.g., `#organization`, `#medical-director`) must point to the node defined in `layout.tsx`'s `@graph`. Any orphan `@id` references?
- **`MedicalProcedure` required/recommended properties** — per Google: `name`, `description`, `procedureType`. Per Schema.org recommended: `bodyLocation`, `preparation`, `followup`, `howPerformed`, `indication`, `medicalSpecialty`. Verify each present on service pages that have the data, omitted cleanly when data missing.
- **`Offer` schema correctness** — `price` must be numeric (not string), `priceCurrency` ISO 4217 code, `availability` one of Schema.org's enum, `priceValidUntil` ISO 8601 date in the future, `url` must be a valid booking URL. Cross-check that the price emitted in the Offer matches the price in the unified catalog (`src/data/services/unified-catalog.ts`) and in `src/data/pricing.ts` and in `src/lib/booking/services.ts` — **three-way consistency or it's a P0.**
- **`LocalBusiness` / `MedicalBusiness` dual-typing** — valid array type per Schema.org, no Google warning on the compound type
- **`Person` (Dr. Landfield) `hasCredential`** — `EducationalOccupationalCredential` properly structured
- **`WebSite` `SearchAction`** — `urlTemplate` must resolve to an actual site search endpoint. **Currently points to `/search?q={search_term_string}`. Does that endpoint exist?** If not, P1 — either remove SearchAction or implement the search page.
- **`FAQPage`** — every `Question` has `acceptedAnswer`; no duplicated question text; not a copy-paste of competitor FAQ
- **`HowTo`** — `step` count matches `howItWorks` array; each step has `text`; `totalTime` present?
- **`BreadcrumbList`** — `position` starts at 1 and is consecutive; names match actual visible breadcrumbs
- **`speakable`** (blog posts) — the CSS selectors listed (`h1`, `h2`, `.article-summary`, `.faq-answer`) must actually exist in the rendered DOM. Open DevTools on a blog post and confirm. **If `.article-summary` is not a real class, it's a P1 — voice assistants will fail to extract.**
- **`reviewedBy`** — the Person schema references `#medical-director` `@id`. Cross-page `@id` resolution works? (Google does accept cross-document `@id` references via `isPartOf` → `WebSite` linkage, but verify.)
- **Duplicate schemas** — if `layout.tsx` emits `Organization` and a service page also emits a `provider.@type: MedicalBusiness` with the same content, use `@id` to deduplicate or flag as P1
- **Circular `@id` references** — any node pointing back at a parent that points back at it?
- **Price drift across schemas** — the Cosmelan page should emit `1399` in the Offer `price` field. Verify also that the catalog, pricing page, and booking services all show 1399 (not 1399.00 in one and 1399 in another — Schema.org expects numeric). Same for PRX-T33 ($495) and Microneedling w/ Arrissence ($695).

**Validation method:** Use the Schema.org vocabulary doc + Google's [Rich Results Test documentation](https://developers.google.com/search/docs/appearance/structured-data) criteria. You do not need to run the actual Rich Results Test tool — apply the rules manually.

### 2.4 `llms.txt` / `llms-full.txt` compliance
- Verify [llmstxt.org](https://llmstxt.org) spec compliance: H1 title, blockquote summary, H2 sections, `- [name](url): description` bullet format
- Every bullet has consistent clinical depth (concerns + mechanism + pricing + session/duration + safety + device entity)
- **Fact-check against the repo:** every price, duration, and device name mentioned in llms.txt must appear in the source of truth (`src/data/services/unified-catalog.ts`, `src/data/pricing.ts`, `src/data/clinic-info.ts`). **Any llms.txt claim not backed by site-facing content is a P0** — LLMs that verify the citation will drop trust.
- **"Infusion" word ban:** Search both llms.txt files for any positive use of "infusion." The brand rule is IM injections only. The negation statements ("never an infusion") are allowed and beneficial. Flag any positive usage.
- Discoverability: verify `<link rel="alternate" type="text/plain" href="/llms.txt">` is emitted in `layout.tsx` → confirm present in live `<head>`
- Verify `robots.txt` comment pointing to llms.txt is present

### 2.5 Meta tags (title, description, OG, Twitter, canonical)
For each of the service/wellness/blog/home pages listed in §2.3, verify:
- `<title>` unique, ≤60 chars, includes primary keyword, not duplicated across the site
- `<meta name="description">` unique, ≤160 chars (target 140–155), compelling CTR copy
- `<link rel="canonical">` self-referential, absolute URL, consistent trailing-slash convention
- `og:title`, `og:description`, `og:url`, `og:image`, `og:type` all present
- `twitter:card` set to `summary_large_image`; title/description/image present
- `geo.region`, `geo.placename`, `geo.position`, `ICBM` on relevant pages
- No duplicate meta description across service pages (each should be service-specific)

### 2.6 Content quality for YMYL / E-E-A-T
Because this is a medical vertical (YMYL), Google's Search Quality Rater Guidelines apply the highest scrutiny. Verify:
- **Expertise:** Author/reviewer bylines on every medical content page — is Dr. Landfield visibly named on each service page (not just in schema)?
- **Experience:** First-hand language, specific device names, session counts, clinical experience references
- **Authoritativeness:** Credential disclosure (Board-Certified Neurologist) visible in the page chrome
- **Trust:** Medical disclaimer ("not medical advice, consult a provider") — present on service/blog pages?
- **Freshness:** "Last reviewed on [date]" visible on page (not just in `lastReviewed` schema)
- **Citation discipline:** Specific clinical claims (e.g., "90% pigment reduction in 12 weeks" for Cosmelan) backed by a reference or phrased as "Institute BCN reports" / "clinical data suggests"
- **Before/after photos:** compliance with Washington State medical advertising laws (no misleading claims, consent disclosure)

### 2.7 Local SEO + NAP consistency
- Cross-check NAP (Name / Address / Phone) across: `src/data/clinic-info.ts`, layout `@graph` schema, every `ServicePageTemplate` JSON-LD, `llms.txt` Contact section, Mangomint booking page, Google Business Profile (if inspectable via public search). **Any inconsistency is a P0 for local pack ranking.**
- Verify hours in `openingHoursSpecification` match website display copy and GBP
- Review count + rating in `aggregateRating` should match current GBP count (if 127 was the figure at time of PR and it's now 130+, P2)
- `areaServed` list in layout `@graph` — is it consistent with the `/locations/*` sub-sitemap? Any served cities missing from schema?
- Google Maps embed present on contact page?

### 2.8 Performance / Core Web Vitals regression check
- PR #82 added ~7KB of inline JSON-LD to every page's `<head>`. Quantify:
  - Bytes added per page (measure the live `<head>`)
  - Impact on LCP, TTFB (should be negligible since it's SSR'd inline text)
  - Impact on total HTML size (Next.js serves it inline — check gzip'd delta)
- Verify no JS bundle regression — the schema should be pure SSR-emitted text, no runtime JS cost
- Image optimization: service hero images using `next/image`? `priority` on LCP image only?

### 2.9 Accessibility (affects SEO rankings)
- Alt text on every image in service pages
- Heading hierarchy: one `h1` per page, no skipped levels
- Color contrast: gold-on-white text (`#C9A96E` brand color) meets WCAG 2.1 AA 4.5:1 ratio?
- Keyboard-nav operability: all interactive elements reachable without mouse?
- ARIA landmarks: `main`, `nav`, `footer` properly labeled?
- **The `speakable` CSS selectors in blog schema depend on ARIA/semantic structure — if those classes don't exist, speakable is a false signal.**

### 2.10 Indexability hygiene
- Fetch `/robots.txt` → confirm no accidental `Disallow` of indexable paths
- Fetch 10 representative pages → check for `<meta name="robots" content="noindex">` in any HTML that shouldn't have it
- Redirect chain audit: `http://` → `https://` → canonical `www.`? Single hop, no chains?
- 404 check: fetch `/services/nonexistent` → returns 404 (not soft 200)
- Canonicalization: does `https://ranibeautyclinic.com/services/cosmelan-peel` (no www) properly 301-redirect to `https://www.ranibeautyclinic.com/services/cosmelan-peel`?

### 2.11 Internal linking
- New Cosmelan + Arrissence service pages linked from: `/services` landing page ✓ (confirmed in #80), `/pricing` page, related blog posts, sibling service pages (rf-microneedling should cross-link to arrissence, chemical-peels should cross-link to cosmelan)
- Orphan detection: any page in the sitemap with zero inbound internal links?
- Anchor text diversity: not 100% exact-match brand/keyword
- Depth from homepage: no important page more than 3 clicks deep?

### 2.12 Competitive GEO positioning
Without running tools, evaluate qualitatively against these Seattle-area medspa competitors:
- **SkinSpirit** (skinspirit.com) — national chain, aggressive SEO
- **Ideal Image** (idealimage.com) — national chain, laser hair focus
- **Anushka Medspa** (anushkaspa.com) — regional
- **Seattle Plastic Surgery Center** — physician-led
- **Kusumoto Aesthetic** — regional

For each competitor, qualitatively assess (from general knowledge + visible URL patterns):
- Do they have an `llms.txt`? (Most don't — Rani's advantage)
- Do they have `MedicalProcedure` + `Offer` schema? (Most have Service schema only, no Offer)
- Do they disclose a specific Medical Director with credentials? (Dr. Landfield's neurologist credential is a rare differentiator)
- How deep is their programmatic SEO (location × service matrix)? Rani has ~3,100 URLs — compare.

**Identify 3–5 ways Rani's current SEO stack is competitively superior, and 3–5 gaps where competitors may be ahead.**

---

## 3. Specific Files & URLs to Examine

### 3.1 Repo files (with line numbers where relevant)
```
src/app/layout.tsx                                   # Global @graph schema (lines 119–300 approx)
src/app/page.tsx                                      # Homepage — any additional schema?
src/app/sitemap.ts                                    # Sitemap index + sub-sitemap builders
src/app/robots.ts                                     # Next.js robots config (if present)
src/app/blog/[slug]/page.tsx                          # BlogPosting + MedicalWebPage schema (lines 64–130 approx)
src/app/services/[slug]/page.tsx                      # Service detail routing
src/app/wellness/[slug]/page.tsx                      # Wellness detail routing
src/app/services/page.tsx                             # Services landing — schema here?
src/components/services/ServicePageTemplate.tsx       # MedicalProcedure + Service + Offer + FAQ + HowTo + Breadcrumb (lines 90–230 approx)
src/components/seo/StructuredData.tsx                 # Schema emitter component — how does it render?
src/data/clinic-info.ts                               # Source of truth for NAP, hours, geo
src/data/services/unified-catalog.ts                  # Source of truth for prices, durations, concerns
src/data/services/aesthetic-services.ts               # Service page content
src/data/services/wellness-services.ts                # Wellness page content
src/data/pricing.ts                                   # Pricing page data
src/lib/booking/services.ts                           # Booking engine services
public/robots.txt                                     # Live robots.txt
public/llms.txt                                       # LLM discovery file
public/llms-full.txt                                  # Extended LLM knowledge base
public/fef37905157843c4ae05afb82e58b988.txt           # IndexNow key file
public/sitemap.xml                                    # (generated) — don't edit; verify output
```

### 3.2 Live URLs to fetch and inspect
```
https://www.ranibeautyclinic.com/
https://www.ranibeautyclinic.com/services
https://www.ranibeautyclinic.com/services/cosmelan-peel
https://www.ranibeautyclinic.com/services/microneedling-arrissence-undereye
https://www.ranibeautyclinic.com/services/hydrafacial
https://www.ranibeautyclinic.com/services/botox-dysport
https://www.ranibeautyclinic.com/services/chemical-peels
https://www.ranibeautyclinic.com/services/rf-microneedling
https://www.ranibeautyclinic.com/services/sofwave
https://www.ranibeautyclinic.com/wellness
https://www.ranibeautyclinic.com/wellness/glp1-weight-management
https://www.ranibeautyclinic.com/wellness/hormone-therapy
https://www.ranibeautyclinic.com/pricing
https://www.ranibeautyclinic.com/about
https://www.ranibeautyclinic.com/contact
https://www.ranibeautyclinic.com/blog
https://www.ranibeautyclinic.com/blog/[pick any slug from /blog]
https://www.ranibeautyclinic.com/locations/renton  (if exists)
https://www.ranibeautyclinic.com/robots.txt
https://www.ranibeautyclinic.com/llms.txt
https://www.ranibeautyclinic.com/llms-full.txt
https://www.ranibeautyclinic.com/sitemap.xml
https://www.ranibeautyclinic.com/sitemap/0.xml
https://www.ranibeautyclinic.com/sitemap/1.xml
https://www.ranibeautyclinic.com/sitemap/2.xml
```

For each live URL, extract the `<head>` and JSON-LD `<script>` blocks. Compare against the repo source. Flag any drift.

---

## 4. Deliverable Format

Produce a single Markdown file at:
```
/Users/sukhithebanker/Desktop/Claude/rani-beauty-clinic/audits/seo-geo-audit-report-2026-04-17.md
```

**Structure:**

### 4.1 Executive Summary (max 250 words)
The headline finding. If a C-suite exec reads only this paragraph, they know the state of the site, the top risk, and the top opportunity.

### 4.2 Scorecard
| Dimension | Score (0–100) | Status | Top Finding |
|-----------|---------------|--------|-------------|
| 2.1 robots.txt | | | |
| 2.2 sitemap | | | |
| 2.3 structured data | | | |
| 2.4 llms.txt | | | |
| 2.5 meta tags | | | |
| 2.6 E-E-A-T / YMYL | | | |
| 2.7 local SEO / NAP | | | |
| 2.8 performance | | | |
| 2.9 accessibility | | | |
| 2.10 indexability | | | |
| 2.11 internal linking | | | |
| 2.12 competitive positioning | | | |
| **Overall (weighted avg)** | | | |

### 4.3 Top 10 Priority Findings
Ranked by `(business_impact × probability) / effort_to_fix`. Each finding includes:
- **P-level:** P0 / P1 / P2
- **Title:** Short descriptive
- **Evidence:** File:line, URL, schema snippet, quoted source
- **Impact:** 1 sentence on what this costs in citations / rankings / leads
- **Remediation:** Exact code change or config step, copy-pasteable

### 4.4 Detailed findings by dimension
For each of §2.1–§2.12, produce the full write-up (status, score, evidence, findings, remediation).

### 4.5 Competitive gap analysis
3–5 competitive advantages + 3–5 gaps, each with a brief tactical response.

### 4.6 30/60/90-day remediation roadmap
**Day 0–30:** All P0s + quick-win P1s (estimate: 1–2 engineering days)
**Day 31–60:** Remaining P1s + structural improvements (estimate: 3–5 engineering days)
**Day 61–90:** P2 polish + competitive moves (estimate: 3–5 engineering days + content ops)

### 4.7 Appendix
- Full schema dumps from each audited live URL
- Diff between repo source and production HTML (if any drift found)
- Competitor schema samples for reference

---

## 5. Grading Rubric (what the overall score means)

| Score | Interpretation |
|-------|----------------|
| 95–100 | Industry-leading. Top 1% of medspa websites nationally. Nothing urgent to change. |
| 85–94 | Strong. Minor polish needed. Competitive in top 5% of category. |
| 70–84 | Good foundation. Real refinement needed in 2–4 dimensions. |
| 50–69 | Incomplete. Major gaps in schema, trust signals, or indexability. |
| <50 | Significant rework required before further investment. |

**Honest scoring is mandatory.** Do not inflate. A 95 is rare and must be defended. If you cannot give 95 evidence, give 87.

---

## 6. Red Team Checklist (actively look for these)

These are the failure modes that slip past non-expert auditors. Hunt for each explicitly:

1. **Schema that passes syntax validators but doesn't actually match page content.** E.g., `FAQPage` listing a question that isn't rendered as visible text on the page. Google will de-rank this hard. LLMs will cite it once, then drop trust.
2. **Price drift across multiple schemas on the same page.** Cosmelan's `Offer.price` says 1399 but a separate `Service` schema elsewhere says 1400. Breaks both.
3. **llms.txt facts not verifiable from crawlable HTML.** If llms.txt says "the clinic has been operating since 2022" and no page on the site says so, LLMs that fact-check the citation will lose trust.
4. **Stale `dateModified`.** If `dateModified` is set to the publication date instead of the last edit date, you lose freshness signal.
5. **@id collisions.** Two nodes with the same `@id` across layout `@graph` and a page-level schema. Results in undefined behavior in schema graph reconciliation.
6. **Multiple H1s per page.** Next.js components sometimes stack `<h1>` tags without intent.
7. **Canonical loops or contradictions.** Page X `rel=canonical` → Page Y; Page Y `rel=canonical` → Page X.
8. **`speakable` selectors that don't match DOM classes.** Voice AI fails silently.
9. **`SearchAction` pointing at a non-existent endpoint.** Currently `/search?q={term}`. Verify the route exists.
10. **`priceValidUntil` in the past.** Expires the Offer and Google drops the rich result.
11. **Service Offer availability marked `InStock` for services requiring consultation** — services can't really be "in stock." Confirm Schema.org accepts this convention or flag as improper semantics.
12. **Missing `disambiguatingDescription` on dual-typed schemas** (e.g., MedicalBusiness + LocalBusiness) — some validators warn.
13. **`knowsAbout` catalog over-claims expertise** — don't list treatments Rani doesn't actually offer. Double-check the 26-item list in `layout.tsx` against the service catalog.
14. **AI bot UA string typos.** The difference between `Perplexity-User` and `PerplexityBot` matters — they're different crawlers. Verify exact casing.
15. **NAP "phone" format inconsistency.** Schema wants E.164 format (+14255394440); display copy uses (425) 539-4440. Verify both formats present and not in conflict within the same schema.
16. **llms-full.txt "last modified" not updated** — the file shows `Mar 27` in the filesystem timestamp; is the content-reflected revision date updated to April?
17. **`sameAs` URLs that 404.** Social media links in Organization schema — verify each resolves.
18. **Medical disclaimer missing.** YMYL content without a disclaimer fails quality rater review.
19. **Before/after photo compliance.** Washington State requires specific disclosures on cosmetic medical marketing photos.
20. **Blog `reviewedBy` referencing `@id` that only exists in layout** — verify this cross-document reference resolves correctly per Google's structured data guidelines.

---

## 7. Reference Authorities (cite these in findings)

When making a call, cite the source. Don't just say "best practice" — say **which** best practice.

- **Schema.org vocabulary:** https://schema.org/
  - `MedicalProcedure`: https://schema.org/MedicalProcedure
  - `Offer`: https://schema.org/Offer
  - `MedicalBusiness`: https://schema.org/MedicalBusiness
  - `MedicalWebPage`: https://schema.org/MedicalWebPage
  - `SpeakableSpecification`: https://schema.org/SpeakableSpecification
- **Google Search Central — structured data:** https://developers.google.com/search/docs/appearance/structured-data
  - Rich Results eligibility: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
  - LocalBusiness guidelines: https://developers.google.com/search/docs/appearance/structured-data/local-business
- **Google Search Quality Rater Guidelines (YMYL / E-E-A-T):** https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
- **Anthropic crawler documentation:** https://support.anthropic.com/en/articles/8896518
- **OpenAI crawler documentation:** https://platform.openai.com/docs/bots
- **Perplexity crawler documentation:** https://docs.perplexity.ai/guides/bots
- **Google-Extended:** https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers#google-extended
- **llmstxt.org specification:** https://llmstxt.org
- **IndexNow specification:** https://www.indexnow.org/documentation
- **RFC 9309 (robots.txt):** https://www.rfc-editor.org/rfc/rfc9309.html
- **Washington State medical advertising laws (RCW 18.122, WAC 246-918):** https://app.leg.wa.gov/RCW/default.aspx?cite=18.122

---

## 8. Tone & Reporting Standards

- **Evidence-based, not opinion-based.** Every finding cites a file/line or live URL excerpt. "This is bad" is not acceptable; "Line 147 of `ServicePageTemplate.tsx` emits `priceCurrency: 'USD'` but the Offer's parent Service schema omits `currenciesAccepted`, which Google's LocalBusiness guideline recommends" is acceptable.
- **Quantify everywhere.** Instead of "this could be better," say "this costs ~X% of AI-answer citations in the Renton+Bellevue+Seattle triangle based on the absence of Y signal."
- **No filler, no praise, no hedging.** Don't write "overall this is a great implementation but..." — just state findings. Praise is implicit in high scores.
- **Ruthless prioritization.** The Top 10 Findings section should surface the 10 things that move the needle most. If there are only 3 things that matter, list 3. Do not pad.
- **Actionable remediation.** Every finding ends with a code snippet or exact config step the engineering team can copy-paste. "Add `dateModified` to blog schema" is weak; "In `src/app/blog/[slug]/page.tsx:100`, add `dateModified: post.updatedAt || post.date,`" is correct.
- **Cite the spec for every "should" claim.** Don't say "should have X." Say "Per [Google structured data LocalBusiness guideline §3.4](link), every LocalBusiness should have X."

---

## 9. Self-verification checklist before submitting the report

Before you hand off the audit, confirm:
- [ ] Every live URL in §3.2 was actually fetched and its `<head>` parsed
- [ ] JSON-LD was validated for syntax (valid JSON), not just presence
- [ ] Every schema property cited was cross-referenced to the Schema.org spec
- [ ] Every Top 10 Finding has a specific file:line or URL citation
- [ ] The score for each dimension was defended with at least 2 pieces of evidence
- [ ] The report contains zero unsourced claims
- [ ] The 30/60/90 roadmap has effort estimates in engineer-days
- [ ] You ran §6 Red Team Checklist explicitly and reported each item's status (even if "no issue found")
- [ ] You identified at least 1 issue the engineering team didn't catch (if everything's perfect, say so, but make sure you looked hard enough to be certain)

---

## 10. Constraints

- **Do not write any code fixes.** This is an audit, not an implementation engagement. Remediation steps are specifications for the engineering team to execute, not PRs for you to open.
- **Do not invoke IndexNow or any external API.** Reporting only.
- **Do not modify `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, or any schema-emitting file.** Read-only audit.
- **Save your report only to the path in §4.** Do not commit or push.

---

## Final note

The engineering team moved fast. Your job is to determine whether they moved fast in the right direction. If you find P0 issues, name them. If you find that the work is genuinely world-class, defend that assessment with the evidence that makes it unarguable. Either outcome is fine — a genuine one.

**Begin when ready. Target turnaround: one session.**
