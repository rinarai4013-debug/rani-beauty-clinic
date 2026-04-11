# Untracked Test Files — Inventory & Handoff

**Audited:** 2026-04-10 Horizon 1 sprint
**Auditor:** Claude
**Action required from:** Codex

This inventory covers 12 untracked test files that were sitting in `git status` at the start of Horizon 1. After running each one against the current tree, I grouped them into three buckets: passing (landed in this sprint), broken import paths (structural fix), and assertion failures (Codex's swim lane — tests against a source version that doesn't match current main).

**Nothing in here has been silently fixed or deleted.** The files with assertion failures are in the same state Codex left them. The only things I modified are the two passing files I committed, with no content changes.

---

## ✅ Landed this sprint (2 files, 4 tests passing)

These imported correctly, passed on first run, and are now on main.

| File | Tests | Commit |
|---|---:|---|
| `src/lib/rag/knowledge-base.test.ts` | 1/1 | (in Horizon 1 cleanup commit) |
| `src/lib/mastermind/ai-plan-generator.test.ts` | 3/3 | (same) |

No further action.

---

## ⚠️ Structural: broken relative import paths (3 files, 10 tests blocked)

All three have the same problem: the test file lives at `src/lib/ads/{engine}/__tests__/{engine}.test.ts` but imports from `'../{engine}'` which resolves to the nonexistent `src/lib/ads/{engine}/{engine}.ts`. The actual source is one level up at `src/lib/ads/{engine}.ts`.

Compare to the working convention in `src/lib/ads/campaign-builder/__tests__/campaign-builder.test.ts`, which uses the absolute alias `@/lib/ads/campaign-builder` instead of a relative import.

### Fix (per file): replace the relative imports with the absolute alias

**`src/lib/ads/creative-engine/__tests__/creative-engine.test.ts`**

```diff
- } from '../creative-engine';
+ } from '@/lib/ads/creative-engine';
```

**`src/lib/ads/landing-page-generator/__tests__/landing-page-generator.test.ts`**

```diff
- } from '../landing-page-generator';
- import { RANI_SERVICES } from '../creative-engine';
+ } from '@/lib/ads/landing-page-generator';
+ import { RANI_SERVICES } from '@/lib/ads/creative-engine';
```

**`src/lib/ads/meta-creative-factory/__tests__/meta-creative-factory.test.ts`**

```diff
- } from '../meta-creative-factory';
- import { getServiceById } from '../creative-engine';
- import type { MetaCreative } from '../meta-creative-factory';
+ } from '@/lib/ads/meta-creative-factory';
+ import { getServiceById } from '@/lib/ads/creative-engine';
+ import type { MetaCreative } from '@/lib/ads/meta-creative-factory';
```

### What happens after the import fix

I ran this fix locally and confirmed: the import errors go away and the tests become loadable, but then **7 of 10 assertions fail** in `landing-page-generator` and `meta-creative-factory`. Those assertion failures are Category C — not a simple path fix. Codex needs to look at each one against the current source and decide whether the test is right (source has a bug) or the source is right (test has a stale assertion).

I reverted my import fix after confirming so Codex gets a clean diff.

---

## ❌ Assertion failures — Codex swim lane (7 files, 21 failures)

These tests all import correctly against the current main tree. They fail because the assertions don't match the current source's behavior. Without context on whether the test or the source is the source of truth, I can't blindly fix either side. Codex wrote these tests and should decide per failure: "fix the test" or "fix the source (and document as SOURCE BUG)".

### `src/lib/ads/google-ads-engine/__tests__/google-ads-engine.test.ts` (3 failures)

```
× score boundary for { intentScore:10, competition:'low', estimatedCPC:15, monthlyVolume:1201 }
  Expected: 80, Received: 85
× score boundary for { intentScore:10, competition:'low', estimatedCPC:15, monthlyVolume:1000 }
  Expected: 75, Received: 80
× suggests up to 50 unseen keywords and deduplicates existing terms
  Expected: "GLP-1 renton", Received: "botox bellevue"
```

**Likely cause:** `getKeywordOpportunityScore()` in `src/lib/ads/google-ads-engine.ts` was tuned after these tests were written. The delta is a consistent +5 across two cases, which smells like a weight change. The suggestion ordering test is about deterministic output.

### `src/lib/marketing/attribution/__tests__/attribution.test.ts` (5 failures)

```
× linear model distributes equal fractional credit
  Expected 0.67, Received 0.83 (difference 0.16, tolerance was 0.005)
× applies spend-aware CPA and ROAS at campaign and channel level
  Expected costPerAcquisition 200, Received 400
× compareModels > paidSearch.insight
  Expected to contain 'channel', Received "Mixed role — paid search plays different roles..."
× mapCustomerJourney > daysToConversion
  Expected 12, Received 9
× calculateChannelPerformance > leads count
  Expected leads:2, Received leads:1
```

**Likely cause:** the attribution math in `src/lib/marketing/attribution.ts` was changed. These are substantive algorithm changes (linear model credit distribution, CPA computation, journey day math, lead counting). **Most likely source bugs to document as SOURCE BUG markers and fix in a follow-up Wave, not test fixes.**

### `src/lib/marketing/content-calendar/__tests__/content-calendar.test.ts` (3 failures)

```
× creates a 30-day calendar with expected shape
  Expected startDate "2026-03-01", Received "2026-02-28"
× scoreContentPerformance > rounds to integer output
  Expected 35, Received 26
× analyzeContentGaps > classifies coverage
  Expected gap[0].topic "Sofwave results", Received "Weight loss"
```

**Likely cause:** the `startDate 2026-02-28` vs `2026-03-01` bug is the **same TZ-parsing class** I fixed in `schedule/optimizer.ts` during Wave 11 Bug 4 — `new Date('2026-03-01').getDay()` returns the local day, which rolls to Feb 28 in Pacific. Codex should port my `utcDayOfWeek()` helper from `src/lib/schedule/optimizer.ts` and use it in content-calendar date math. The scoring and gap ordering failures are separate bugs.

### `src/lib/marketing/lead-scoring/__tests__/lead-scoring.test.ts` (3 failures)

```
× returns immutable grade definition objects
  Expected 'Corrupt' not to be 'Corrupt' (i.e., mutation leaked through)
× returns zero score when decay reaches cap and base score is low
  Expected decayApplied 60, Received 28
× sorts leads descending by totalScore
  Expected grade 'D', Received 'C'
```

**Likely causes:**
1. The immutability test is a real source bug: `getGradeDefinitions()` returns a shared mutable reference instead of a deep copy. Fix: return `structuredClone(definitions)` or `Object.freeze()` the array. **SOURCE BUG.**
2. The decay cap test expects 60 but gets 28 — the cap logic caps too early. Check `src/lib/marketing/lead-scoring.ts` decay function.
3. The grade threshold for 'C' vs 'D' is off by one band.

### `src/lib/marketing/__tests__/seo-monitor.test.ts` (5 failures)

```
× runTechnicalSEOChecks assigns full score
  Expected 100, Received 94
× calculateLocalSEOScore combines GMB, citation, and local ranking signals
  Expected citations.listed 2, Received undefined
× analyzeKeywordRankings computes trend and recommendations
  Expected recommendations.length 1, Received 3
× identifyContentGaps prioritizes high-value easy-win topics
  Expected gaps[1].priority 'low', Received 'medium'
× analyzeCompetitorOverlap reports only meaningful competitor gaps
  Expected theirOnlyKeywords 1, Received undefined
```

**Likely cause:** `src/lib/marketing/seo-monitor.ts` has field-name drift (citations.listed is undefined, theirOnlyKeywords is undefined) AND behavioral drift (score 94 vs 100, 3 recommendations vs 1, priority 'medium' vs 'low'). This reads like the source was refactored after the tests were written — possibly renamed fields and adjusted thresholds. **Codex needs to diff source vs test to decide which is canonical.**

### `src/lib/mastermind/simulation-engine.test.ts` (1 failure)

```
× builds a with/without comparison and cost-of-delay context
  Expected keyDifferentiators[2] to contain '4200'
  Received: "Treatment now: $4,200 vs $6,300+ if delayed 3 years"
```

**Likely cause:** the test uses `.toContain('4200')` but the source formats the number as `'$4,200'` with a thousands separator. Either change the test to `.toContain('4,200')` or change the source to use the unformatted number in the string. Minor fix.

### `src/lib/plan-builder/conversion-engine.test.ts` (1 failure)

```
× surfaces validation warnings as pass-through
  Expected planStrength.label 'strong', Received 'exceptional'
```

**Likely cause:** the plan-strength scoring thresholds in `src/lib/plan-builder/conversion-engine.ts` were adjusted, pushing the test's input past the 'strong' band into 'exceptional'. Either update the test input (harder plan) or update the expected label ('exceptional'). Minor fix.

---

## Action plan for Codex

**Priority 1 (30 minutes):** Apply the 3 import-path fixes to the `ads/` tests (diffs above). Run `npx vitest run src/lib/ads/creative-engine src/lib/ads/landing-page-generator src/lib/ads/meta-creative-factory`. Some tests will still fail on assertions — that's expected; commit the import fixes anyway under `fix(test): correct relative imports in ads engine test suites` and address the assertion failures separately.

**Priority 2 (1-2 hours):** Port the `utcDayOfWeek()` helper from `src/lib/schedule/optimizer.ts` (Wave 11 Bug 4 work) into `src/lib/marketing/content-calendar.ts`. The startDate `2026-02-28` vs `2026-03-01` failure is the same TZ-parsing bug class.

**Priority 3 (~3-4 hours):** Walk each remaining assertion failure one at a time. For each:
1. Read the test expectation
2. Read the corresponding source
3. Decide: test wrong (fix test) or source wrong (document as SOURCE BUG, fix in a dedicated commit like `fix(lib): marketing/attribution — Wave 12 bug sweep`)
4. Don't silently change both sides at once

**Priority 4:** When done, run the full vitest suite from the project root and confirm no net regressions. Commit the whole batch.

## What I did NOT do

- I did **not** commit any of the 10 failing files.
- I did **not** modify assertions in any of the failing files.
- I did **not** modify source files to make failing tests pass.
- I **did** temporarily test the 3 import-path fixes locally to verify the fix works, then reverted them so Codex gets a clean diff.
- I **did** commit the 2 passing files (`rag/knowledge-base.test.ts` and `mastermind/ai-plan-generator.test.ts`) because they were zero-risk landings that clean up `git status`.

## Why I'm not doing the rest

The 10 failing files touch code that Codex is actively writing (marketing attribution, SEO monitoring, content calendar, ads engines, lead scoring). Silently fixing these would collide with Codex's in-flight work and potentially overwrite changes. The audit trail is: Claude did the structural audit, Codex does the source-truth decisions.

## Cross-references

- Route auth audit: `docs/codex-handoff/ROUTE-AUTH-AUDIT.md`
- Compliance runbook: `docs/compliance/AUDIT-RUNBOOK.md`
- Wave 11 Bug 4 (where the TZ fix pattern lives): commit `0154888`, file `src/lib/schedule/optimizer.ts`
