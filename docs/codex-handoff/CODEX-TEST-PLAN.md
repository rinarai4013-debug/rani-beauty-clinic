# Codex Test Plan — Remaining Library Modules

**Owner:** Codex
**Status:** Active
**Authored:** 2026-04-10
**Reference suites (Claude, done):** 18 modules, ~1,880 tests, 42 source bugs surfaced + fixed

## 1. Context

Claude owns the "critical-tier" suites — anything that touches regulatory compliance,
money, client health, or prediction quality. Those are finished:

| Tier | Module | Test file |
|---|---|---|
| 1 | HIPAA audit | `src/lib/compliance/__tests__/hipaa-audit.test.ts` |
| 1 | Consent manager | `src/lib/compliance/__tests__/consent-manager.test.ts` |
| 1 | Churn engine | `src/lib/churn/__tests__/engine.test.ts` |
| 1 | No-show prediction | `src/lib/predictions/__tests__/no-show.test.ts` |
| 1 | Attribution upsert | `src/lib/attribution/__tests__/upsert-client-attribution.test.ts` |
| 2 | Audit trail | `src/lib/compliance/__tests__/audit-trail.test.ts` |
| 2 | OSHA tracker | `src/lib/compliance/__tests__/osha-tracker.test.ts` |
| 2 | Controlled substances | `src/lib/compliance/__tests__/controlled-substances.test.ts` |
| 2 | Ads compliance checker | `src/lib/ads/__tests__/compliance-checker.test.ts` |
| 3 | Skin analysis | `src/lib/ai/__tests__/skin-analysis.test.ts` |
| 3 | Revenue anomaly | `src/lib/predictions/__tests__/revenue-anomaly.test.ts` |
| 3 | State regulations | `src/lib/compliance/__tests__/state-regulations.test.ts` |
| 3 | Device compliance | `src/lib/compliance/__tests__/device-compliance.test.ts` |
| 4 | Recommendations engine | `src/lib/recommendations/__tests__/engine.test.ts` |
| 4 | AI plan recommender | `src/lib/plan-builder/__tests__/ai-recommender.test.ts` |
| 4 | Schedule optimizer | `src/lib/schedule/__tests__/optimizer.test.ts` |
| 4 | Pricing dynamic engine | `src/lib/pricing/__tests__/dynamic-engine.test.ts` |
| 4 | P&L engine | `src/lib/finance/__tests__/pnl-engine.test.ts` |

**Use these as reference patterns.** Every Codex-owned suite should match the style,
discipline, and depth of the tier-3 / tier-4 files (start with `audit-trail.test.ts`
and `revenue-anomaly.test.ts` — they are the cleanest templates).

## 2. Hard rules (read before writing a single test)

1. **Stack:** Vitest 3.2.4, `jsdom` environment, alias `@` → `./src`. `vitest.config.ts`
   is already configured — do not modify it.
2. **Determinism or nothing.** Every suite that touches time must call:
   ```ts
   vi.useFakeTimers();
   vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
   ```
   in `beforeEach`, and `vi.useRealTimers()` in `afterEach`.
3. **Pin the timezone.** Any module that parses `YYYY-MM-DD` strings needs
   `process.env.TZ = 'UTC'` set before the SUT is imported. See
   `revenue-anomaly.test.ts` for the pattern.
4. **Never mock the module under test.** Mock external dependencies only:
   - `@/lib/compliance/audit-trail` (when `createAuditEntry` is called)
   - `@/lib/airtable/client` (for anything that writes to Airtable)
   - `@/lib/ai/client` (for anything that calls Claude)
   - `@/lib/square/client`, `@/lib/integrations/stripe`, etc.
5. **Reset in-memory state in `beforeEach`.** Modules that use module-level arrays
   (`let devices = []`) must expose a `clearXData()` helper. If they don't, add one.
   See `osha-tracker.test.ts` for the pattern.
6. **Boundaries, not vibes.** Every numeric threshold in the source must be tested
   on BOTH sides. Use `it.each` for boundary tables — it is the default idiom in the
   reference suites. Example: if source says `if (days > 30)`, test at 30 AND 31.
7. **Do not fix source bugs you find.** Mark them with `// SOURCE BUG: <one-line
   description>` and lock the buggy behavior in place with an assertion so the test
   fails the moment someone fixes the bug. Then report the bug to Sukhi for triage.
   Do NOT attempt to fix anything in the source file — that's a separate review
   step.
8. **Trace, do not run.** The machine this repo lives on has disk I/O saturation
   issues; vitest will hang. Verify correctness by tracing the math against the
   source by hand. Claude's reference suites were all written this way and caught
   42 bugs — it works.
9. **Realistic fixtures.** Use Rani's actual service catalog, pricing, and provider
   names from `CLAUDE.md`:
   - Providers: Rina, Mom
   - Services: Botox, Sofwave ($2,750–$4,500), HydraFacial ($275), PRX-T33 ($495),
     VI Peel ($395), GLP-1 ($399–599/mo), RF Microneedling, Laser Hair Removal
   - Location: Renton, WA
   - Brand rules: IM **injections** only (NEVER "infusion")
10. **One clear assertion focus per test.** If a test has three unrelated expects,
    split it.

## 3. Untested modules (137 total)

Split into 6 waves by priority. Burn them down in order — each wave should be
one PR so reviewers can keep up.

### Wave 1 — Revenue & operations engines (14 modules, HIGH PRIORITY)

These drive live dashboards and dollar-impacting decisions. Ship first.

| # | Module | Why it matters | Estimated tests |
|---|---|---|---|
| 1 | `ads/campaign-builder.ts` | Generates ad campaign structure | 60–90 |
| 2 | `ads/creative-engine.ts` | Ad copy variant generation | 50–80 |
| 3 | `ads/google-ads-engine.ts` | Google Ads analytics/management | 60–90 |
| 4 | `ads/landing-page-generator.ts` | Per-campaign LP assembly | 40–70 |
| 5 | `ads/meta-creative-factory.ts` | Meta-specific creative generation | 50–80 |
| 6 | `marketing/attribution.ts` | Marketing-side attribution math | 50–80 |
| 7 | `marketing/lead-scoring.ts` | Lead scoring engine | 60–90 |
| 8 | `marketing/content-calendar.ts` | Content calendar generation | 40–60 |
| 9 | `marketing/review-engine.ts` | Review response engine | 40–70 |
| 10 | `marketing/seo-monitor.ts` | SEO monitoring thresholds | 40–60 |
| 11 | `mastermind/ai-plan-generator.ts` | AI treatment plan builder | 70–100 |
| 12 | `mastermind/simulation-engine.ts` | Photo simulation orchestration | 50–80 |
| 13 | `plan-builder/conversion-engine.ts` | Consult-to-booking conversion | 50–80 |
| 14 | `rag/knowledge-base.ts` | RAG knowledge retrieval | 60–90 |

**Focus:** boundary conditions in scoring, every branch in routing/selection,
realistic integration scenarios.

### Wave 2 — Booking & scheduling (7 modules)

| # | Module | Notes |
|---|---|---|
| 15 | `booking/availability.ts` | Slot calculation — test TZ handling, buffer logic |
| 16 | `booking/calendar.ts` | Calendar operations — mock Airtable |
| 17 | `booking/intake.ts` | Intake form processing |
| 18 | `booking/reminders.ts` | Reminder timing — lots of date math |
| 19 | `booking/scheduler.ts` | Appointment scheduling logic |
| 20 | `booking/services.ts` | Service catalog queries |
| 21 | `booking/waitlist.ts` | Waitlist ordering/promotion |

### Wave 3 — Auth & security (3 modules, CRITICAL)

| # | Module | Notes |
|---|---|---|
| 22 | `auth/middleware.ts` | Route protection — test every protected path |
| 23 | `auth/password.ts` | Bcrypt hashing, timing-safe compare |
| 24 | `patient-auth/require-patient.ts` | Patient portal auth gate |
| 25 | `patient-auth/session.ts` | Patient session management |

**Extra rules for this wave:**
- Test rate-limit integration (mock `@/lib/rate-limit`)
- Test JWT verification on bad signatures, expired tokens, malformed payloads
- Test timing-safe comparisons actually use `crypto.timingSafeEqual`

### Wave 4 — Intelligence & briefing (10 modules)

| # | Module | Notes |
|---|---|---|
| 26 | `agents/registry.ts` | Agent registration/lookup |
| 27 | `agents/report-builder.ts` | Multi-agent report synthesis |
| 28 | `analytics/behavioral-tracking.ts` | Client behavior tracking |
| 29 | `analytics/events.ts` | Event schema + emission |
| 30 | `analytics/hooks.ts` | Analytics hooks |
| 31 | `analytics/weekly-insight-engine.ts` | Weekly insight generation |
| 32 | `backlinks/engine.ts` | Backlink analysis |
| 33 | `brand/voice-linter.ts` | Brand voice linting (enforces "injection" not "infusion") |
| 34 | `briefing/consult-intelligence.ts` | Consult briefing generator |
| 35 | `briefing/data-fetchers.ts` | Airtable data fetchers for briefing |
| 36 | `briefing/provider-intelligence.ts` | Provider briefing generator |
| 37 | `briefing/reactivation-intelligence.ts` | Reactivation briefing |

### Wave 5 — Mastermind + plan-builder (11 modules)

| # | Module | Notes |
|---|---|---|
| 38 | `mastermind/aftercare-map.ts` | Service → aftercare lookup |
| 39 | `mastermind/ai-aura-scan.ts` + `-with-device.ts` | Aura scan logic (2 files) |
| 40 | `mastermind/api-helpers.ts` | Shared helpers |
| 41 | `mastermind/aura-device-integration.ts` | Device integration glue |
| 42 | `mastermind/aura-scan.ts` | Aura scan core |
| 43 | `mastermind/consent-templates.ts` | Consent template catalog |
| 44 | `mastermind/plan-generator.ts` | Plan generation orchestration |
| 45 | `mastermind/product-catalog.ts` | Product catalog queries |
| 46 | `mastermind/product-engine.ts` | Product recommendation engine |
| 47 | `mastermind/session-store.ts` | Session state management |
| 48 | `mastermind/share-token.ts` | Share token generation/validation |
| 49 | `plan-builder/aftercare-map.ts` | Plan aftercare mapping |
| 50 | `plan-builder/follow-up-templates.ts` | Plan follow-up templates |
| 51 | `plan-builder/plan-serializer.ts` | Plan serialization |
| 52 | `plan-builder/plan-status.ts` | Plan status transitions |
| 53 | `plan-builder/plan-templates.ts` | Template catalog |
| 54 | `plan-builder/provider-notes.ts` | Provider note management |

### Wave 6 — Infrastructure & adapters (8 modules)

| # | Module | Notes |
|---|---|---|
| 55 | `ai/client.ts` | Anthropic client wrapper — mock fetch |
| 56 | `airtable/tables.ts` | Table accessors — may be thin, small suite |
| 57 | `phone/vapi-agent.ts` | Vapi config + analytics |
| 58 | `plaid/categories.ts` | Plaid category mapping |
| 59 | `plaid/storage.ts` | Plaid data storage |
| 60 | `square/client.ts` | Square POS client — mock fetch |
| 61 | `tenant/config.ts` | Tenant config lookup |
| 62 | `tenant/onboarding.ts` | Tenant onboarding flow |
| 63 | `saas/analytics/platform-metrics.ts` | Platform-wide metrics |
| 64 | `saas/analytics/tenant-metrics.ts` | Per-tenant metrics |
| 65 | `saas/onboarding/wizard-engine.ts` | Onboarding wizard logic |

### Wave 7 — Photo simulation (6 modules)

| # | Module | Notes |
|---|---|---|
| 66 | `photo-simulation/ai-simulation.ts` | AI-based photo simulation |
| 67 | `photo-simulation/degradation-filters.ts` | Degradation filter math |
| 68 | `photo-simulation/degradation-presets.ts` | Preset catalog |
| 69 | `photo-simulation/filter-presets.ts` | Filter preset catalog |
| 70 | `photo-simulation/filters.ts` | Filter implementations |
| 71 | `photo-simulation/skin-analysis.ts` | Different from `ai/skin-analysis.ts` — verify |

### Wave 8 — Consultation & utils (10 modules)

| # | Module | Notes |
|---|---|---|
| 72 | `consultation/conditional-logic.ts` + `-v2.ts` | Form conditional logic (2 files) |
| 73 | `consultation/medical-schema.ts` | Medical intake schema |
| 74 | `consultation/schema.ts` | General intake schema |
| 75 | `charting/templates.ts` | Chart templates |
| 76 | `gamification/levels.ts` | Level definitions |
| 77 | `utils/date-ranges.ts` | Date range utilities — test TZ edge cases |
| 78 | `utils/formatters.ts` | Number/date formatters — test locale edges |
| 79 | `fonts.ts` | Font registration — probably trivial |
| 80 | `sentry-utils.ts` | Sentry wrapper — probably thin |

### Wave 9 — Email templates (57 modules, LOW PRIORITY)

All `email/templates/**/*.ts` files. These are mostly static HTML/text with a few
variable substitutions. **Batch them into one PR per category** — e.g., one PR for
all services templates, one for lifecycle, one for membership, etc.

**Per template, only test:**
1. Every `{{variable}}` gets substituted.
2. Unknown variables don't crash (default to empty string or the literal).
3. Service-specific prep instructions match the service (when applicable).
4. Brand voice: no "infusion" language (use `brand/voice-linter.ts` if exposed).

Aim for ~5–10 tests per template, ~30–60 tests per PR.

### Wave 10 — Non-`email/templates` templates (9 modules)

| # | Module | Notes |
|---|---|---|
| 81 | `templates/glp1-announcement.ts` | |
| 82 | `templates/glp1-sequences.ts` | |
| 83 | `templates/intake-followup.ts` | |
| 84 | `templates/loyalty-notification.ts` | |
| 85 | `templates/membership-pitch.ts` | |
| 86 | `templates/pdf-templates.ts` | |
| 87 | `templates/post-consult-nobook.ts` | |
| 88 | `templates/referral-notification.ts` | |
| 89 | `templates/treatment-plan-ready.ts` | |

Same rules as Wave 9.

## 4. Pattern recipes

### Recipe A — Engine module with in-memory state

Reference: `src/lib/compliance/__tests__/osha-tracker.test.ts`

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: vi.fn(),
}));

import { addFoo, getFooAlerts, clearFooData } from '@/lib/foo/engine';

describe('foo engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    clearFooData();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addFoo', () => { /* ... */ });
  describe('getFooAlerts — boundary table', () => {
    it.each([
      [29, false],
      [30, true],
      [31, true],
    ])('days=%i → alert=%s', (days, expected) => {
      addFoo({ nextDueDays: days });
      expect(getFooAlerts().length > 0).toBe(expected);
    });
  });
});
```

### Recipe B — Module that calls Airtable

Reference: `src/lib/attribution/__tests__/upsert-client-attribution.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/airtable/client', () => ({
  fetchFirst: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
}));

import { fetchFirst, createRecord, updateRecord } from '@/lib/airtable/client';
import { doThing } from '@/lib/foo/bar';
// Use REAL field constants — never mock FIELDS
import { FIELDS } from '@/lib/airtable/tables';

beforeEach(() => {
  vi.mocked(fetchFirst).mockReset();
  vi.mocked(createRecord).mockReset();
  vi.mocked(updateRecord).mockReset();
});
```

### Recipe C — Module that calls Claude

```ts
vi.mock('@/lib/ai/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ /* fixture */ }) }],
      }),
    },
  },
}));
```

Then assert on the call args (prompt shape, model, max_tokens) AND on the parsed
response handling.

### Recipe D — Template rendering

```ts
describe('glp1-announcement template', () => {
  it('substitutes all variables', () => {
    const result = render({ clientName: 'Jane', startDate: '2026-05-01' });
    expect(result).toContain('Jane');
    expect(result).toContain('2026-05-01');
    expect(result).not.toContain('{{');  // no unsubstituted vars
  });
  it('handles missing variables gracefully', () => {
    expect(() => render({})).not.toThrow();
  });
  it('never uses "infusion" language', () => {
    const result = render({ clientName: 'Jane' });
    expect(result.toLowerCase()).not.toContain('infusion');
  });
});
```

## 5. PR discipline

- **One wave per PR** (Wave 9 is an exception — batch by template category).
- **Title format:** `test(lib): Wave N — <short description>`
- **Body must include:**
  - Number of modules covered
  - Number of tests added
  - Number of `SOURCE BUG` markers added
  - Link to this doc
- **Do NOT mix test-writing with source fixes in the same PR.** Bugs get triaged
  separately by Sukhi after Codex flags them.
- **Do NOT run vitest in CI until Sukhi confirms the disk I/O issue is resolved.**
  CI may hang on the test run. Ship tests, let them be verified later.

## 6. Source bug reporting

When you find a bug via `// SOURCE BUG:` comment, add an entry to
`docs/codex-handoff/SOURCE-BUGS-FOUND.md` (create the file if missing) with:

```markdown
## <module path>

### Bug N: <short title>
- **Severity:** critical | high | medium | low
- **File:** `src/lib/foo/bar.ts:123`
- **Test lock:** `src/lib/foo/__tests__/bar.test.ts:456`
- **Repro:** <one-sentence trigger>
- **Impact:** <what happens in prod>
- **Suggested fix:** <one-line sketch — don't implement>
```

Severity guide:
- **critical:** regulatory/legal/safety risk (WA license, HIPAA, FDA MDR, DEA)
- **high:** revenue loss, client-facing error
- **medium:** dashboard misreporting, wrong recommendations
- **low:** cosmetic, edge case, performance

## 7. Questions for Sukhi (ask, don't guess)

When you hit any of these, pause and ask:

1. **Schema changes.** If your test needs a new Airtable field, a new type, or a
   new status enum value — pause. Don't guess; this affects production schema.
2. **Algorithm disagreements.** If the source does X but X seems wrong for the
   business (e.g., financing threshold feels too high), mark it as a SOURCE BUG
   and ask — don't rewrite the test around what you think is correct.
3. **API mocking strategy for new endpoints.** If a module calls an external API
   we haven't mocked before, ask about the fixture shape before inventing one.

## 8. Exit criteria

A wave is done when:
- Every module in the wave has a test file with ≥50 tests (excl. Wave 9 templates).
- Every `it.each` table covers both sides of every boundary in the source.
- Every external dependency is mocked.
- All `SOURCE BUG` comments are documented in `SOURCE-BUGS-FOUND.md`.
- The PR passes `tsc --noEmit` (do not run vitest).
- Sukhi has reviewed and merged.

All waves done when `find src/lib -name "*.ts" -not -path "*__tests__*" | xargs -I{} sh -c 'test -f $(dirname {})/__tests__/$(basename {} .ts).test.ts || echo {}'` returns empty.

---

**Current status:** 104 of 241 lib modules have tests (43%). After all waves:
241/241 (100%).
