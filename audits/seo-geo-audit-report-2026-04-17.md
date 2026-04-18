# Forensic GEO/AEO + Technical SEO Audit Report

**Client:** Rani Beauty Clinic  
**Audit Window:** April 17–18, 2026 (America/Los_Angeles)  
**Scope Baseline:** `main` at `c271c57` + live production fetches captured in `audits/evidence/live/`

## 4.1 Executive Summary (<=250 words)
Rani has a strong architectural foundation (SSR JSON-LD, deep location footprint, clear medical-director entity graph), but production currently has multiple high-impact integrity failures that suppress both search and AI-answer performance. The top risk is **production drift**: live `robots.txt` does not match repo policy, omits 9 intended AI crawlers, and points to `/sitemap.xml` that returns **404**. This creates immediate crawl/discovery loss for both search engines and answer engines. A second critical risk is **indexability hygiene**: `/services/nonexistent` returns **200** and emits mixed robot/canonical signals instead of a hard 404. Third, `llms.txt` contains pricing and offer claims that do not match source-of-truth pricing/catalog/booking data, which is a trust-breaker for citation-verifying LLMs.

Structured data quality is above category average but still degraded by implementation gaps: `SearchAction` points to a non-existent `/search` endpoint, `Offer` is missing on several core service/wellness pages due slug mismatch logic, and blog `speakable` selectors reference classes that are not present in DOM.

Overall score: **64/100** (good base, materially incomplete execution). This is recoverable quickly: most impact is in **4–6 targeted fixes** that can be completed in the next 30 days without a full rebuild.

## 4.2 Scorecard

Scoring method: equal weighting across 12 dimensions (8.33% each) because the brief did not provide custom weights.

| Dimension | Score (0–100) | Status | Top Finding |
|---|---:|---|---|
| 2.1 robots.txt | 45 | ❌ Fail | Live robots drift: 9 intended AI UAs missing; live robots points to 404 sitemap index |
| 2.2 sitemap | 44 | ❌ Fail | `/sitemap.xml` returns 404 while referenced in robots |
| 2.3 structured data | 67 | ⚠️ Issues | `SearchAction` points to non-existent `/search`; Offer missing on key pages |
| 2.4 llms.txt | 52 | ❌ Fail | `llms.txt` price facts conflict with pricing/catalog/booking sources |
| 2.5 meta tags | 70 | ⚠️ Issues | 7 sampled pages exceed title/description targets; 11 pages have generic twitter titles |
| 2.6 E-E-A-T / YMYL | 74 | ⚠️ Issues | Strong reviewer schema; sampled blog page lacks explicit medical-advice disclaimer language |
| 2.7 local SEO / NAP | 81 | ✅ Pass | NAP/hours mostly consistent; minor schema normalization gaps (phone format/static review count) |
| 2.8 performance | 84 | ✅ Pass | JSON-LD is SSR-only (no runtime JS cost), but markup payload should be monitored |
| 2.9 accessibility | 73 | ⚠️ Issues | Brand gold on white is 2.24:1 (fails AA for normal text) |
| 2.10 indexability | 42 | ❌ Fail | Soft-404: `/services/nonexistent` returns 200 with conflicting robots/canonical signals |
| 2.11 internal linking | 61 | ⚠️ Issues | New service pages linked from `/services` but absent from sampled `/pricing`, blog, sibling-service surfaces |
| 2.12 competitive positioning | 76 | ⚠️ Issues | Stack potential is superior; production reliability issues blunt advantage |
| **Overall (weighted avg)** | **64** | ⚠️ Issues | Strong architecture, but multiple P0/P1 production integrity failures |

## 4.3 Top 10 Priority Findings
Ranked by `(business_impact x probability) / effort_to_fix`.

1. **P0 — Production robots policy drift + missing AI crawler coverage**
- Evidence: `public/robots.txt:30-36,45-57,91-139,186-192` vs live `audits/evidence/live/www.ranibeautyclinic.com_robots.txt.body.txt:1-105`; diff at `audits/evidence/diffs/robots-source-vs-live.diff`
- Impact: Reduces AI crawler discovery/eligibility and creates inconsistent crawl policy signals.
- Remediation: Redeploy current `public/robots.txt` to production; add CI check that compares deployed `/robots.txt` to repository hash post-deploy.

2. **P0 — Referenced sitemap index is broken (`/sitemap.xml` = 404)**
- Evidence: `audits/evidence/live/fetch-status.tsv` (`404 https://www.ranibeautyclinic.com/sitemap.xml`), live headers `audits/evidence/live/www.ranibeautyclinic.com_sitemap.xml.headers.txt`
- Impact: Search engines and AI crawlers lose primary sitemap discovery path.
- Remediation: Ensure Next sitemap index route is enabled in production and returns 200 XML; keep robots `Sitemap:` pointer only to live 200 endpoint.

3. **P0 — Soft 404 on invalid service slug**
- Evidence: `audits/evidence/live/www.ranibeautyclinic.com_services_nonexistent.headers.txt` shows HTTP 200; parsed body metadata: title `Service Not Found`, robots `index, follow` + `noindex`, canonical `/services`.
- Impact: Index bloat/canonical confusion; weakens site quality signals.
- Remediation: Force hard 404 status for invalid slugs and remove contradictory metadata; verify with automated monitor for representative invalid URLs.

4. **P0 — `llms.txt` factual drift against source-of-truth pricing**
- Evidence: `public/llms.txt:22,24-25,36-39` vs `src/data/pricing.ts:29,42,66-70,81-93,110-123` and `src/data/services/unified-catalog.ts:68-69,79,87,101-105,127-133` and `src/lib/booking/services.ts:172,234,418,438,483,523,543`
- Impact: LLM trust degradation when claims fail cross-verification; citation drop risk.
- Remediation: Generate llms pricing sections directly from canonical data modules (single-source render script) to remove manual drift.

5. **P1 — Broken `WebSite.SearchAction` endpoint**
- Evidence: `src/app/layout.tsx:305-311` (`/search?q={search_term_string}`), live fetch `audits/evidence/live/www.ranibeautyclinic.com_search_q_botox.headers.txt` = 404
- Impact: Invalid structured action signal; avoidable schema quality warnings.
- Remediation: Either implement `/search` route or remove `SearchAction` until endpoint exists (per Google structured data guidance).

6. **P1 — Missing `Service + Offer` schema on key pages due slug join logic**
- Evidence: `src/components/services/ServicePageTemplate.tsx:113-115,201-231`; live summary shows no Offer on `/services/botox-dysport`, `/services/chemical-peels`, `/wellness/glp1-weight-management`, `/wellness/hormone-therapy`.
- Impact: Lost pricing rich-context for commercial-intent queries.
- Remediation: Replace exact `id/parentSlug === service.slug` matching with explicit page-to-catalog mapping (support hyphen variants and multi-offer pages).

7. **P1 — `speakable` selectors reference classes missing from DOM**
- Evidence: `src/app/blog/[slug]/page.tsx:128-131` uses `.article-summary`, `.faq-answer`; `src/app/blog/[slug]/FAQSection.tsx:42` has no `.faq-answer` class; live blog parse `hasArticleSummaryClass=false`, `hasFaqAnswerClass=false`.
- Impact: Voice extraction reliability drops; false-positive schema quality.
- Remediation: Add real DOM classes matching selectors or change selectors to existing stable elements.

8. **P1 — Homepage entity graph duplicates via slash/non-slash `@id` variants**
- Evidence: `src/app/layout.tsx` emits `https://www.ranibeautyclinic.com#organization`; `src/components/seo/EnhancedSchemas.tsx:64,146,209,262` emits `https://www.ranibeautyclinic.com/#organization` style IDs; live homepage schema IDs include both variants.
- Impact: Graph reconciliation ambiguity across search/AI parsers.
- Remediation: Normalize all `@id` generation to one canonical base URL format (no mixed slash-fragment forms).

9. **P1 — Social metadata inconsistency (Twitter inherits generic titles on deep pages)**
- Evidence: `src/app/layout.tsx:79-85` global twitter defaults; service/blog/wellness metadata functions omit `twitter` blocks (`src/app/services/[slug]/page.tsx`, `src/app/wellness/[slug]/page.tsx`, `src/app/blog/[slug]/page.tsx`); 11 sampled URLs show Twitter/OG title mismatch.
- Impact: Lower CTR/share quality in social/messenger surfaces.
- Remediation: Add per-page `twitter` metadata mirroring page-specific OG fields.

10. **P1 — New service page link propagation incomplete beyond `/services`**
- Evidence: `/services` includes both new slugs (repo `src/app/services/page.tsx:41-51`; live counts present), but sampled `/pricing`, `/blog`, `/services/rf-microneedling`, `/services/chemical-peels` had zero direct occurrences in captured HTML.
- Impact: Slower authority flow and weaker crawl prioritization for new revenue pages.
- Remediation: Add contextual internal links from pricing rows, relevant blog posts, and sibling service pages with descriptive anchors.

## 4.4 Detailed Findings By Dimension

### 2.1 robots.txt compliance & completeness
**Status:** ❌ Fail  
**Score:** 45

**Evidence**
- Source robots: `public/robots.txt:8-145,186-192`
- Live robots: `audits/evidence/live/www.ranibeautyclinic.com_robots.txt.body.txt:1-105`
- Source-vs-live diff: `audits/evidence/diffs/robots-source-vs-live.diff`
- Missing live UAs from intended list: `OAI-SearchBot`, `Claude-Web`, `Perplexity-User`, `FacebookBot`, `Meta-ExternalAgent`, `Amazonbot`, `YouBot`, `Diffbot`, `MistralAI-User`
- Sitemap pointer in live robots points to 404 index.

**Findings**
1. **P0** Live robots policy does not match intended repo policy and omits 9 intended AI crawler declarations.
2. **P0** Live `Sitemap:` target is unresolved (404).
3. **P2** `llms.txt` explanatory pointer comments are absent from live robots (non-blocking but discoverability context loss).

**Remediation**
- Deploy current `public/robots.txt` verbatim.
- Add post-deploy assertion job:
  - fetch `/robots.txt`
  - diff against repo artifact
  - fail deploy on mismatch.
- Keep syntax aligned with [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html).

### 2.2 Sitemap index + sub-sitemaps
**Status:** ❌ Fail  
**Score:** 44

**Evidence**
- Statuses: `audits/evidence/live/fetch-status.tsv` (`/sitemap.xml` 404, `/sitemap/0..5.xml` 200)
- Strategy comments: `src/app/sitemap.ts:47-57`
- Live counts observed: `0=166`, `1=970`, `2=127`, `3=197`, `4=990`, `5=1260`
- Slugs present in 0.xml: `/services/cosmelan-peel`, `/services/microneedling-arrissence-undereye`

**Findings**
1. **P0** Primary sitemap index endpoint is broken while being publicly referenced.
2. **P1** Strategy comments in source materially diverge from live URL distribution (documentation/intent drift).
3. **P2** Lastmod values are static buckets (`2026-04-05` / `2026-03-15`) across many URLs; acceptable if intentional, but can reduce freshness granularity.

**Remediation**
- Restore `/sitemap.xml` index endpoint in prod.
- Either update strategy comments to actual ranges or rebalance generation to match intended partitioning.
- Keep `priority`/`changefreq` conventions aligned with query intent and real update cadence.

### 2.3 Structured data (JSON-LD)
**Status:** ⚠️ Issues  
**Score:** 67

**Evidence**
- Global graph: `src/app/layout.tsx:138-313`
- Service schemas: `src/components/services/ServicePageTemplate.tsx:117-231`
- Blog schema: `src/app/blog/[slug]/page.tsx:77-139`
- Homepage additional schemas: `src/components/seo/EnhancedSchemas.tsx:60-233`
- Live schema dumps: `audits/evidence/schema-dumps/*.json`

**Findings**
1. **P1** `SearchAction` endpoint is invalid (`/search` returns 404).
2. **P1** Offer missing on key pages due strict slug match logic (`botox-dysport`, `chemical-peels`, `glp1-weight-management`, `hormone-therapy`).
3. **P1** `speakable` selectors on blog pages reference non-existent classes.
4. **P1** Homepage graph duplicates entity IDs using slash/non-slash variants (e.g., `#organization` vs `/#organization`).
5. **P2** Offer `availability=InStock` may be semantically weak for consultation-gated services (see Schema.org `Offer` semantics).

**Pass checks**
- JSON validity: no invalid JSON-LD in sampled pages.
- `reviewedBy` cross-document ID resolves to defined `#medical-director` in layout graph.
- Offer `priceValidUntil` is future-dated (`2027-12-31`).

**Remediation**
- Remove or implement `/search` before declaring `SearchAction` ([Google structured data docs](https://developers.google.com/search/docs/appearance/structured-data)).
- Replace slug matching with explicit mapping table in `ServicePageTemplate` for Offer sources.
- Normalize all schema `@id` construction to one canonical URL shape.
- Align `speakable.cssSelector` to actual rendered DOM selectors.

### 2.4 llms.txt / llms-full.txt compliance
**Status:** ❌ Fail  
**Score:** 52

**Evidence**
- Format/file presence: `public/llms.txt`, `public/llms-full.txt`, live 200 for both.
- Alternate links: `src/app/layout.tsx:109-111`
- Price drifts: `public/llms.txt:22,24-25,36-39` vs canonical pricing files listed in Top Finding #4.
- Infusion ban check: only negative uses (`never an infusion`) in `public/llms.txt:37-38`.

**Findings**
1. **P0** Multiple llms claims are not consistent with authoritative pricing/catalog/booking values.
2. **P1** Operational risk: llms content is hand-maintained and not generated from canonical data modules.
3. **P2** Structural format is strong and spec-aligned; this should be preserved.

**Remediation**
- Build llms content from structured data sources (`pricing.ts`, `unified-catalog.ts`, `clinic-info.ts`) via generation script.
- Add content QA gate: fail build if llms numeric values differ from source modules.
- Keep syntax aligned with [llmstxt.org](https://llmstxt.org).

### 2.5 Meta tags (title/description/OG/Twitter/canonical)
**Status:** ⚠️ Issues  
**Score:** 70

**Evidence**
- Meta extraction matrix: `audits/evidence/live-summary.json`
- Title length >60 on 7 sampled URLs; description >160 on 7 sampled URLs.
- Twitter mismatch on 11 sampled URLs due global fallback.

**Findings**
1. **P1** Service/wellness/blog pages often inherit generic twitter title/description instead of page-specific metadata.
2. **P2** Title/description lengths exceed CTR targets on several important pages.
3. **P2** Canonicals are mostly correct and absolute for sampled URLs.

**Remediation**
- Add per-route `twitter` fields in service/wellness/blog metadata functions.
- Trim titles to <=60 and descriptions to ~140-155 while preserving clinical intent.
- Maintain canonical self-reference conventions.

### 2.6 Content quality for YMYL / E-E-A-T
**Status:** ⚠️ Issues  
**Score:** 74

**Evidence**
- Reviewer schema: `src/app/blog/[slug]/page.tsx:94-104`
- Medical director entity: `src/app/layout.tsx:276-295`
- Service content includes clinical detail and consultation framing in `src/data/services/aesthetic-services.ts` / `wellness-services.ts`.

**Findings**
1. **P1** Expertise signal is strong in schema and brand chrome, but explicit on-page medical-advice disclaimer language is not consistently visible in sampled blog pages.
2. **P2** `lastReviewed` is set in schema (`post.date`) but visible "last reviewed" UX labeling is limited/inconsistent.
3. **P2** Washington advertising compliance items (before/after disclosure language) were not fully verifiable from fetched samples; legal review remains required.

**Remediation**
- Add explicit medical disclaimer component to blog/service templates.
- Introduce visible reviewed/updated labels sourced from content metadata.
- Run legal compliance review against RCW 18.122 / WAC 246-918 before campaign pushes.

### 2.7 Local SEO + NAP consistency
**Status:** ✅ Pass  
**Score:** 81

**Evidence**
- NAP source: `src/data/clinic-info.ts:2-19,41-49`
- Layout graph local entities: `src/app/layout.tsx:167-227`
- Contact map token presence in live contact HTML.
- Social `sameAs` checks: Instagram 200, Facebook 200, Google profile 200, TikTok 403 (crawler access-limited, not 404).

**Findings**
1. **P2** Schema telephone uses display format; consider E.164 normalization in schema output.
2. **P2** `aggregateRating.reviewCount=127` is static and can stale if GBP count changes.
3. **P2** Area served coverage is broad and aligned with geo strategy, but should be periodically reconciled with location inventory.

**Remediation**
- Emit `telephone` in E.164 format for schema while retaining readable UI phone format.
- Sync review count via periodic content ops update workflow.

### 2.8 Performance / CWV regression check
**Status:** ✅ Pass  
**Score:** 84

**Evidence**
- JSON-LD render path: `src/components/seo/StructuredData.tsx:5-10` (SSR script output, no client hook/runtime)
- Sampled pages: avg ~3.94 JSON-LD scripts/page; approx average JSON-LD payload ~12.5 KB/page, homepage ~25.6 KB.

**Findings**
1. **P2** Markup payload is non-trivial and should be monitored, but implementation does not add client JS execution cost.
2. **P2** No direct evidence of CWV regression in this audit run (lab metrics not executed in this engagement).

**Remediation**
- Keep heavy graph nodes deduplicated (remove slash/non-slash duplicates) to reduce markup weight.
- Add scheduled Lighthouse/CrUX monitoring for LCP/TTFB deltas after schema changes.

### 2.9 Accessibility (SEO-adjacent)
**Status:** ⚠️ Issues  
**Score:** 73

**Evidence**
- Sampled image alt checks on key pages: no missing `alt` attributes in sampled files.
- Heading checks from live summary: one `h1` on sampled pages.
- Color contrast calculation: `#C9A96E` on white = `2.24:1` (fails WCAG 2.1 AA for normal text); token defined at `tailwind.config.ts:14`.

**Findings**
1. **P1** Brand gold text on white does not meet AA for normal-size body copy.
2. **P1** `speakable` schema references absent classes, reducing practical accessibility/voice extractability.

**Remediation**
- Reserve `rani-gold` for large text/decorative use or dark backgrounds; introduce accessible text token variant for white backgrounds.
- Align `speakable` selectors with semantic, present DOM nodes.

### 2.10 Indexability hygiene
**Status:** ❌ Fail  
**Score:** 42

**Evidence**
- Soft-404 case: `audits/evidence/live/www.ranibeautyclinic.com_services_nonexistent.headers.txt` (200) and body parse (title `Service Not Found`, canonical `/services`, mixed robots).
- Redirect test: `http://ranibeautyclinic.com/services/cosmelan-peel` -> 308 -> 308 -> 200.
- Non-www canonicalization: `https://ranibeautyclinic.com/services/cosmelan-peel` -> 308 -> www 200.

**Findings**
1. **P0** Invalid service routes return 200 instead of hard 404.
2. **P1** Conflicting robots/canonical metadata appears on not-found state content.
3. **P2** HTTP to canonical requires two redirects; can be tightened to one hop.

**Remediation**
- Enforce 404 status and consistent noindex metadata for invalid service/wellness slugs.
- Normalize edge redirects to single-hop canonical target where feasible.

### 2.11 Internal linking
**Status:** ⚠️ Issues  
**Score:** 61

**Evidence**
- New slugs linked on services hub: `src/app/services/page.tsx:41-51` (and live HTML occurrences).
- Sampled link coverage counts show zero direct references from captured `/pricing`, `/blog`, and sampled sibling service pages.

**Findings**
1. **P1** New high-value services are under-linked outside the services hub.
2. **P2** Sibling-service contextual cross-linking is weaker than expected for crawl reinforcement.

**Remediation**
- Add direct links in pricing rows and relevant blog bodies.
- Add "related treatment" editorial links inside chemical peel / RF microneedling content blocks.

### 2.12 Competitive GEO positioning
**Status:** ⚠️ Issues  
**Score:** 76

**Evidence**
- Competitor summary: `audits/evidence/competitors/summary.json`
- Fetch statuses: `audits/evidence/competitors/fetch-status.tsv`

**Advantages (Rani)**
1. Live `llms.txt` + `llms-full.txt` deployed (most competitors sampled lacked `llms.txt`).
2. Richer medical entity modeling (`MedicalProcedure`, reviewer, medical director credentialing).
3. Strong local service-area footprint and large long-tail URL surface.
4. Physician identity and credential are explicit and machine-readable.

**Gaps (Rani)**
1. Production reliability drift (robots/sitemap/indexability) undermines the advanced stack.
2. Trust-signal inconsistency in llms pricing claims.
3. Broken `SearchAction` and selector quality issues reduce schema credibility.
4. Internal-link propagation for new revenue pages is incomplete.

**Tactical response**
- Fix integrity blockers first (P0/P1), then capitalize with consistent llms/data generation and link graph reinforcement.

## 4.5 Competitive Gap Analysis

### Competitive advantages (3-5)
1. **AI discovery assets deployed** (`/llms.txt`, `/llms-full.txt`) while most sampled competitors returned 404 for llms endpoints.
2. **Medical trust graph depth** (medical director credentialing + reviewedBy pattern) exceeds typical local medspa implementations.
3. **Programmatic local footprint** remains materially larger than most regional competitors.
4. **Service-level structured data breadth** (FAQ/HowTo/Breadcrumb + medical typing) is above category median.

### Competitive gaps (3-5)
1. **Execution integrity gap:** production drift negates strategy advantage.
2. **Fact-consistency gap:** llms price mismatches invite trust suppression in answer engines.
3. **Commerce schema coverage gap:** missing Offer on several core pages.
4. **Metadata consistency gap:** generic social metadata on deep pages weakens share CTR.
5. **Indexability hygiene gap:** soft-404 behavior is below enterprise standard.

## 4.6 30/60/90-Day Remediation Roadmap

### Day 0-30 (P0 + quick-win P1) — **~2.0 engineer-days**
1. Reconcile and redeploy live `robots.txt` to repo policy; verify AI UA coverage.
2. Restore `/sitemap.xml` to 200 and verify robots `Sitemap:` target.
3. Fix soft-404 behavior on invalid service/wellness slugs to hard 404.
4. Remove or implement `/search` endpoint before keeping `SearchAction`.
5. Patch llms price drifts for known mismatches.

### Day 31-60 (remaining P1 structural) — **~4.0 engineer-days + 0.5 content ops day**
1. Refactor Offer lookup mapping in `ServicePageTemplate` to eliminate slug mismatch misses.
2. Normalize schema `@id` generation across layout/homepage schema emitters.
3. Fix blog/home `speakable` selectors to match real DOM.
4. Add per-page twitter metadata in services/wellness/blog metadata generation.
5. Add contextual links for Cosmelan + Arrissence on pricing/blog/sibling pages.

### Day 61-90 (P2 polish + competitive compounding) — **~4.0 engineer-days + 2.0 content/legal ops days**
1. Generate llms files directly from canonical data modules (remove manual drift permanently).
2. Add schema QA CI (ID normalization, SearchAction endpoint existence, selector existence checks).
3. Accessibility polish: enforce AA-compliant gold-on-light token usage.
4. Content/legal pass for YMYL disclaimers + Washington cosmetic-ad compliance copy.
5. Add ongoing benchmark monitor against top 5 competitors (llms/schema/indexability deltas).

## 4.7 Appendix

### A. Full schema dumps from each audited live URL
Verbatim JSON-LD dumps are stored under:
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_cosmelan-peel.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_microneedling-arrissence-undereye.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_hydrafacial.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_botox-dysport.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_chemical-peels.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_rf-microneedling.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_services_sofwave.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_wellness.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_wellness_glp1-weight-management.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_wellness_hormone-therapy.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_pricing.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_about.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_contact.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_blog.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_blog_best-medspa-renton-wa.json`
- `audits/evidence/schema-dumps/www.ranibeautyclinic.com_locations_renton.json`

### B. Repo vs production drift artifacts
- Robots diff: `audits/evidence/diffs/robots-source-vs-live.diff`
- Live status matrix: `audits/evidence/live/fetch-status.tsv`

### C. Competitor schema samples
- `audits/evidence/competitors/schema-samples/anushkaspa.com_.schema.json`
- `audits/evidence/competitors/schema-samples/seattleplasticsurgery.com_.schema.json`
- `audits/evidence/competitors/schema-samples/skinspirit.com_.schema.json`
- `audits/evidence/competitors/schema-samples/idealimage.com_.schema.json`

### D. Red Team Checklist Status (all 20)
| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Schema matches visible content | ⚠️ Issue | `speakable` selector mismatch found; FAQ visibility largely aligned on sampled pages |
| 2 | Price drift across schemas same page | ⚠️ Issue | Offer coverage inconsistent; llms/source drift present |
| 3 | llms facts verifiable from site content | ❌ Issue | Multiple pricing discrepancies in `llms.txt` |
| 4 | `dateModified` freshness quality | ⚠️ Issue | Blog `dateModified` mirrors publish date (`src/app/blog/[slug]/page.tsx:116-117`) |
| 5 | `@id` collisions | ⚠️ Issue | Slash/non-slash `@id` variants on homepage graph |
| 6 | Multiple H1s per page | ✅ Pass | Sampled pages show one H1 each |
| 7 | Canonical loops/contradictions | ⚠️ Issue | Invalid service slug emits mixed canonical/robots signals while 200 |
| 8 | `speakable` selectors match DOM | ❌ Issue | `.article-summary` / `.faq-answer` missing on sampled blog page |
| 9 | `SearchAction` endpoint exists | ❌ Issue | `/search?q=botox` returns 404 |
| 10 | `priceValidUntil` future-dated | ✅ Pass | `2027-12-31` in Offer schema |
| 11 | `InStock` semantics valid for consult services | ⚠️ Issue | Consultation-required services still emit `InStock` |
| 12 | Dual-type disambiguation fields | ⚠️ Issue | No explicit `disambiguatingDescription` found |
| 13 | `knowsAbout` over-claims | ✅ Pass | Sampled terms largely map to offered services |
| 14 | AI UA exactness/casing | ❌ Issue | Live robots missing required distinct UAs (e.g., `Perplexity-User`) |
| 15 | NAP phone format consistency | ⚠️ Issue | Human-readable phone used in schema; E.164 normalization recommended |
| 16 | llms-full recency stamp | ✅ Pass | Live headers show recent `last-modified` |
| 17 | `sameAs` URL health | ⚠️ Issue | No 404s; TikTok returns 403 to crawler requests |
| 18 | Medical disclaimer presence | ⚠️ Issue | Inconsistent explicit disclaimer language on sampled blog content |
| 19 | Before/after ad compliance disclosures | ⚠️ Unknown | Not fully verifiable in this crawl-only pass; legal review required |
| 20 | `reviewedBy` cross-doc `@id` resolution | ✅ Pass | Blog `reviewedBy` points to layout-defined `#medical-director` |

## Sources / Authorities Cited
- Schema.org: [MedicalProcedure](https://schema.org/MedicalProcedure), [Offer](https://schema.org/Offer), [MedicalBusiness](https://schema.org/MedicalBusiness), [MedicalWebPage](https://schema.org/MedicalWebPage), [SpeakableSpecification](https://schema.org/SpeakableSpecification)
- Google Search Central structured data docs: [Overview](https://developers.google.com/search/docs/appearance/structured-data), [Search Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery), [Local Business](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- RFC 9309 robots standard: [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html)
- llms.txt spec: [llmstxt.org](https://llmstxt.org)
- Washington statute index for medical advertising context: [RCW 18.122](https://app.leg.wa.gov/RCW/default.aspx?cite=18.122)
