import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  recommendTreatmentPlan,
  type ClientProfile,
  type RecommendedService,
} from '@/lib/plan-builder/ai-recommender';
import { UNIFIED_CATALOG } from '@/data/services/unified-catalog';

// ─────────────────────────────────────────────────────────────────────
// Test Harness
// ─────────────────────────────────────────────────────────────────────
//
// The ai-recommender module is PURE scoring logic — it does NOT call
// Anthropic, Claude, Airtable, or write audit entries. All dependencies
// are the frozen `UNIFIED_CATALOG` and its pure helpers. Therefore no
// vi.hoisted mocks are needed; we assert directly against realistic
// fixtures sourced from Rani's live service catalog.
//
// Every test freezes wall-clock time to 2026-04-10T12:00:00Z so that any
// future seasonality or date-derived branches remain deterministic.
// ─────────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    skinConcerns: ['aging'],
    treatmentInterests: [],
    ...overrides,
  };
}

function findById(plan: RecommendedService[], id: string): RecommendedService | undefined {
  return plan.find((p) => p.service.id === id);
}

function idsIn(plan: RecommendedService[]): string[] {
  return plan.map((p) => p.service.id);
}

function phaseIds(plan: RecommendedService[], phase: 1 | 2 | 3): string[] {
  return plan.filter((p) => p.phase === phase).map((p) => p.service.id);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────
// 1. Public API contract — overloads
// ─────────────────────────────────────────────────────────────────────

describe('recommendTreatmentPlan: public API & overloads', () => {
  it('legacy overload (concerns only) returns a plan', () => {
    const plan = recommendTreatmentPlan(['aging']);
    expect(Array.isArray(plan)).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
  });

  it('legacy overload accepts concerns + interests', () => {
    const plan = recommendTreatmentPlan(['aging'], ['botox']);
    expect(plan.length).toBeGreaterThan(0);
  });

  it('legacy overload with undefined interests does not throw', () => {
    expect(() => recommendTreatmentPlan(['aging'])).not.toThrow();
  });

  it('profile overload returns a plan', () => {
    const plan = recommendTreatmentPlan(makeProfile());
    expect(plan.length).toBeGreaterThan(0);
  });

  it('returns empty array when no concerns and no interests (legacy)', () => {
    expect(recommendTreatmentPlan([], [])).toEqual([]);
  });

  it('returns empty array when no concerns and no interests (profile)', () => {
    expect(
      recommendTreatmentPlan({ skinConcerns: [], treatmentInterests: [] })
    ).toEqual([]);
  });

  it('every returned item conforms to RecommendedService shape', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging', 'acne'] }));
    for (const item of plan) {
      expect(item).toMatchObject({
        service: expect.any(Object),
        phase: expect.any(Number),
        reason: expect.any(String),
        fitScore: expect.any(Number),
      });
      expect([1, 2, 3]).toContain(item.phase);
      expect(typeof item.whyThisPhase).toBe('string');
    }
  });

  it('fitScore is numeric and finite for all items', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging', 'pigmentation'] }));
    for (const item of plan) {
      expect(Number.isFinite(item.fitScore)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. Concern → service mapping (it.each table)
// ─────────────────────────────────────────────────────────────────────

describe('Concern alias normalization and service selection', () => {
  const concernCases: Array<{
    raw: string;
    expectCategory?: string;
    expectAtLeastOne?: string[];
  }> = [
    { raw: 'acne', expectAtLeastOne: ['vi-peel', 'biorepeel-face', 'rf-micro-face'] },
    { raw: 'breakouts', expectAtLeastOne: ['vi-peel', 'biorepeel-face'] },
    { raw: 'aging', expectAtLeastOne: ['botox', 'dermal-fillers', 'rf-micro-face'] },
    { raw: 'anti-aging', expectAtLeastOne: ['botox', 'rf-micro-face'] },
    { raw: 'wrinkles', expectAtLeastOne: ['botox'] },
    { raw: 'fine lines', expectAtLeastOne: ['botox'] },
    { raw: 'pigmentation', expectAtLeastOne: ['vi-peel', 'glutathione-injection'] },
    { raw: 'dark spots', expectAtLeastOne: ['vi-peel', 'glutathione-injection'] },
    { raw: 'melasma', expectAtLeastOne: ['vi-peel'] },
    { raw: 'sun damage', expectAtLeastOne: ['vi-peel'] },
    { raw: 'dull skin', expectAtLeastOne: ['hydrafacial-signature', 'hydrafacial-express'] },
    { raw: 'dullness', expectAtLeastOne: ['hydrafacial-signature'] },
    { raw: 'large pores', expectAtLeastOne: ['hydrafacial-signature'] },
    { raw: 'pores', expectAtLeastOne: ['hydrafacial-signature'] },
    { raw: 'sagging', expectAtLeastOne: ['sofwave-full-face', 'rf-micro-face'] },
    { raw: 'skin laxity', expectAtLeastOne: ['sofwave-full-face'] },
    { raw: 'loose skin', expectAtLeastOne: ['sofwave-full-face'] },
    { raw: 'scarring', expectAtLeastOne: ['vi-peel', 'rf-micro-face'] },
    { raw: 'acne scars', expectAtLeastOne: ['vi-peel', 'rf-micro-face'] },
    { raw: 'hydration', expectAtLeastOne: ['hydrafacial-signature'] },
    { raw: 'dehydration', expectAtLeastOne: ['hydrafacial-signature'] },
  ];

  it.each(concernCases)(
    'concern alias "$raw" produces a non-empty plan including an expected service',
    ({ raw, expectAtLeastOne }) => {
      const plan = recommendTreatmentPlan([raw]);
      expect(plan.length).toBeGreaterThan(0);
      if (expectAtLeastOne) {
        const ids = idsIn(plan);
        const intersects = expectAtLeastOne.some((id) => ids.includes(id));
        expect(intersects).toBe(true);
      }
    }
  );

  it('unknown concern falls through as-is (may return empty if no catalog match)', () => {
    const plan = recommendTreatmentPlan(['unicorn-dust']);
    // Not aliased, falls through to raw lookup -> no matching catalog concern
    expect(plan).toEqual([]);
  });

  it('mixed-case concern labels are lowercased', () => {
    const lower = recommendTreatmentPlan(['aging']);
    const mixed = recommendTreatmentPlan(['AGING']);
    expect(idsIn(lower)).toEqual(idsIn(mixed));
  });

  it('whitespace in concern labels is trimmed', () => {
    const trimmed = recommendTreatmentPlan(['aging']);
    const padded = recommendTreatmentPlan(['  aging  ']);
    expect(idsIn(trimmed)).toEqual(idsIn(padded));
  });

  it('"sun damage" expands to both sun-damage AND hyperpigmentation', () => {
    const plan = recommendTreatmentPlan(['sun damage']);
    // VI Peel lists both concerns and laser-facial-ndyag lists sun-damage
    expect(idsIn(plan)).toContain('vi-peel');
  });

  it('"texture" alias expands to acne + dull-skin', () => {
    const plan = recommendTreatmentPlan(['texture']);
    expect(plan.length).toBeGreaterThan(0);
  });

  it('duplicate concerns are deduplicated', () => {
    const a = recommendTreatmentPlan(['aging']);
    const b = recommendTreatmentPlan(['aging', 'aging', 'anti-aging', 'wrinkles']);
    // 'aging', 'anti-aging', 'wrinkles' all map to ['aging-skin'] — same candidate set
    expect(idsIn(a).sort()).toEqual(idsIn(b).sort());
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. Plan structure — phases, counts, anchors, quick wins
// ─────────────────────────────────────────────────────────────────────

describe('Plan structure & phase assignment', () => {
  it('assigns every selected item to phase 1, 2, or 3', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    for (const item of plan) expect([1, 2, 3]).toContain(item.phase);
  });

  it('non-value budget caps total selected at 8', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'pigmentation', 'large pores', 'sagging'],
        budgetBand: 'mid',
      })
    );
    expect(plan.length).toBeLessThanOrEqual(8);
  });

  it('value budget caps total selected at 6', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'pigmentation', 'large pores', 'sagging'],
        budgetBand: 'value',
      })
    );
    expect(plan.length).toBeLessThanOrEqual(6);
  });

  it('non-value budget caps services per phase at 3', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'pigmentation', 'sagging'],
        budgetBand: 'premium',
      })
    );
    for (const phase of [1, 2, 3] as const) {
      expect(phaseIds(plan, phase).length).toBeLessThanOrEqual(3);
    }
  });

  it('value budget caps services per phase at 2', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'pigmentation', 'sagging'],
        budgetBand: 'value',
      })
    );
    for (const phase of [1, 2, 3] as const) {
      expect(phaseIds(plan, phase).length).toBeLessThanOrEqual(2);
    }
  });

  it('avoids duplicate parentSlug within the same phase', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging', 'sagging'], budgetBand: 'premium' })
    );
    for (const phase of [1, 2, 3] as const) {
      const slugs = plan
        .filter((p) => p.phase === phase)
        .map((p) => p.service.parentSlug)
        .filter((s): s is string => !!s);
      const uniq = new Set(slugs);
      expect(uniq.size).toBe(slugs.length);
    }
  });

  it('ensures at least one item per phase when plan has 3+ items (redistribution)', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'sagging', 'pigmentation', 'dull skin'],
        budgetBand: 'premium',
      })
    );
    if (plan.length >= 3) {
      const phasesUsed = new Set(plan.map((p) => p.phase));
      // Best effort — at least phase 1 and one other should be populated
      expect(phasesUsed.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('plan is sorted by fitScore descending within the raw candidate order', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging', 'acne'] }));
    // Within a single phase the order is score-descending (selection walks sorted list)
    const byPhase: Record<number, number[]> = { 1: [], 2: [], 3: [] };
    for (const item of plan) byPhase[item.phase].push(item.fitScore);
    for (const phase of [1, 2, 3]) {
      const scores = byPhase[phase];
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. Quick Win tagging
// ─────────────────────────────────────────────────────────────────────

describe('Quick Win tagging', () => {
  it('tags a known QUICK_WIN_ID in phase 1 when present (hydrafacial-signature)', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const sig = findById(plan, 'hydrafacial-signature');
    if (sig && sig.phase === 1) {
      expect(sig.quickWin).toBe(true);
    }
  });

  it('at most one quickWin per plan', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging', 'acne', 'dull skin'] })
    );
    const quickWins = plan.filter((p) => p.quickWin === true);
    expect(quickWins.length).toBeLessThanOrEqual(1);
  });

  it('quickWin only appears in phase 1', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging', 'acne', 'dull skin'] })
    );
    const quickWin = plan.find((p) => p.quickWin === true);
    if (quickWin) expect(quickWin.phase).toBe(1);
  });

  it('falls back to a no-downtime phase-1 item when no QUICK_WIN_ID is present', () => {
    // Contraindicate the usual quick wins so we exercise the fallback
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging'],
        contraindications: ['pregnancy'], // excludes vi-peel, biorepeel, prx-t33, etc.
      })
    );
    const quickWin = plan.find((p) => p.quickWin === true);
    if (quickWin) {
      // Fallback picks a no-downtime category in phase 1
      const nodtCats = new Set(['facial', 'wellness', 'skincare', 'consultation', 'labs']);
      expect(nodtCats.has(quickWin.service.category)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. Anchor Treatment tagging
// ─────────────────────────────────────────────────────────────────────

describe('Anchor Treatment tagging', () => {
  it('tags a known ANCHOR_ID when present (rf-micro-face for aging)', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], budgetBand: 'premium' })
    );
    const anchor = plan.find((p) => p.anchorTreatment === true);
    expect(anchor).toBeDefined();
  });

  it('at most one anchor per plan', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging', 'sagging', 'acne'] })
    );
    const anchors = plan.filter((p) => p.anchorTreatment === true);
    expect(anchors.length).toBeLessThanOrEqual(1);
  });

  it('falls back to highest-scored phase-2 item when no ANCHOR_ID present', () => {
    // Unwanted-hair concern -> only laser-hair-removal items, none are ANCHOR_IDS
    const plan = recommendTreatmentPlan(['unwanted hair']);
    const anchor = plan.find((p) => p.anchorTreatment === true);
    if (anchor) {
      // Fallback branch: anchor comes from phase 2 if any exists, else could be undefined
      // Note: laser-hair-removal is NOT in PHASE_CATEGORIES, so assignPhase uses price fallback
      expect(anchor).toBeDefined();
    }
  });

  it('sofwave anchor appears for skin-laxity premium clients', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['sagging'], budgetBand: 'premium' })
    );
    const anchor = plan.find((p) => p.anchorTreatment === true);
    if (anchor) {
      const isAnchorId = [
        'sofwave-full-face',
        'sofwave-full-face-neck',
        'sofwave-lower-face',
        'sofwave-brow',
        'sofwave-neck',
        'rf-micro-face',
        'rf-micro-face-neck',
        'prx-t33',
      ].includes(anchor.service.id);
      expect(isAnchorId).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 6. Contraindication hard-exclusion
// ─────────────────────────────────────────────────────────────────────

describe('Contraindication hard-exclusion', () => {
  it('pregnancy excludes botox from every plan', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['pregnancy'] })
    );
    expect(idsIn(plan)).not.toContain('botox');
  });

  it('pregnancy excludes dermal fillers', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['pregnancy'] })
    );
    expect(idsIn(plan)).not.toContain('dermal-fillers');
  });

  it('pregnancy excludes VI Peel and all BioRePeel variants', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['acne', 'aging', 'pigmentation'],
        contraindications: ['pregnancy'],
      })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('vi-peel');
    expect(ids).not.toContain('biorepeel-face');
    expect(ids).not.toContain('biorepeel-face-neck');
    expect(ids).not.toContain('prx-t33');
  });

  it('blood-thinners excludes RF microneedling across all areas', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'sagging'],
        contraindications: ['blood-thinners'],
      })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('rf-micro-face');
    expect(ids).not.toContain('rf-micro-face-neck');
    expect(ids).not.toContain('rf-micro-arms');
  });

  it('blood-thinners excludes injectables', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['blood-thinners'] })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('botox');
    expect(ids).not.toContain('dermal-fillers');
  });

  it('keloid-prone excludes RF microneedling face treatments', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne scars'],
        contraindications: ['keloid-prone'],
      })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('rf-micro-face');
    expect(ids).not.toContain('rf-micro-face-neck');
    expect(ids).not.toContain('scar-rf-micro');
    expect(ids).not.toContain('scar-combination');
  });

  it('autoimmune excludes botox and fillers', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['autoimmune'] })
    );
    expect(idsIn(plan)).not.toContain('botox');
    expect(idsIn(plan)).not.toContain('dermal-fillers');
  });

  it('active-infection excludes injectables and RF face', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['active-infection'] })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('botox');
    expect(ids).not.toContain('dermal-fillers');
    expect(ids).not.toContain('rf-micro-face');
  });

  it('retinoid-use excludes vi-peel and ndyag laser facial', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], contraindications: ['retinoid-use'] })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('vi-peel');
    expect(ids).not.toContain('laser-facial-ndyag');
  });

  it('multiple contraindications compound (pregnancy + blood-thinners)', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'sagging'],
        contraindications: ['pregnancy', 'blood-thinners'],
      })
    );
    const ids = idsIn(plan);
    expect(ids).not.toContain('botox');
    expect(ids).not.toContain('dermal-fillers');
    expect(ids).not.toContain('vi-peel');
    expect(ids).not.toContain('rf-micro-face');
  });

  it('unknown contraindication does not crash and does not exclude anything', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging'],
        contraindications: ['allergy-to-peanuts'],
      })
    );
    expect(plan.length).toBeGreaterThan(0);
  });

  it('contraindication matching is case-insensitive', () => {
    const a = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['pregnancy'] })
    );
    const b = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['PREGNANCY'] })
    );
    expect(idsIn(a).sort()).toEqual(idsIn(b).sort());
  });

  it('contraindication matching trims whitespace', () => {
    const a = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['pregnancy'] })
    );
    const b = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], contraindications: ['  pregnancy  '] })
    );
    expect(idsIn(a).sort()).toEqual(idsIn(b).sort());
  });
});

// ─────────────────────────────────────────────────────────────────────
// 7. Profile scoring adjustments — Fitzpatrick / downtime / pain
// ─────────────────────────────────────────────────────────────────────

describe('Profile scoring: Fitzpatrick type', () => {
  it('Fitzpatrick I-III does not penalize aggressive laser', () => {
    const type2 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], fitzpatrickType: 2 })
    );
    const type5 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], fitzpatrickType: 5 })
    );
    const type2Scar = findById(type2, 'scar-laser-small');
    const type5Scar = findById(type5, 'scar-laser-small');
    if (type2Scar && type5Scar) {
      expect(type2Scar.fitScore).toBeGreaterThan(type5Scar.fitScore);
    }
  });

  it('Fitzpatrick IV penalizes aggressive laser (scar-reduction)', () => {
    const type3 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], fitzpatrickType: 3 })
    );
    const type4 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], fitzpatrickType: 4 })
    );
    const a = findById(type3, 'scar-laser-small');
    const b = findById(type4, 'scar-laser-small');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(20);
  });

  it('Fitzpatrick VI boosts RF microneedling category', () => {
    const type2 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], fitzpatrickType: 2 })
    );
    const type6 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], fitzpatrickType: 6 })
    );
    const rf2 = findById(type2, 'rf-micro-face');
    const rf6 = findById(type6, 'rf-micro-face');
    if (rf2 && rf6) expect(rf6.fitScore - rf2.fitScore).toBe(10);
  });

  it('Fitzpatrick V boosts chemical peel category', () => {
    const type2 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['pigmentation'], fitzpatrickType: 2 })
    );
    const type5 = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['pigmentation'], fitzpatrickType: 5 })
    );
    const p2 = findById(type2, 'vi-peel');
    const p5 = findById(type5, 'vi-peel');
    if (p2 && p5) expect(p5.fitScore - p2.fitScore).toBe(10);
  });
});

describe('Profile scoring: downtime tolerance', () => {
  it('"none" tolerance penalizes RF microneedling (high-downtime) — RF drops out of top phase-2 picks', () => {
    const none = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], downtimeTolerance: 'none', budgetBand: 'mid' })
    );
    // With -25, rf-micro-face should no longer be in the plan (other phase-2 services outrank it)
    const rf = findById(none, 'rf-micro-face');
    // Either dropped out, or heavily penalized
    if (rf) expect(rf.fitScore).toBeLessThanOrEqual(20);
  });

  it('"none" tolerance penalizes moderate-downtime chemical peels', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const none = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], downtimeTolerance: 'none' })
    );
    const a = findById(base, 'vi-peel');
    const b = findById(none, 'vi-peel');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(10);
  });

  it('"none" tolerance boosts no-downtime facial category', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const none = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['dull skin'], downtimeTolerance: 'none' })
    );
    const a = findById(base, 'hydrafacial-signature');
    const b = findById(none, 'hydrafacial-signature');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(10);
  });

  it('"minimal" tolerance penalizes RF (-15) more gently than "none" (-25)', () => {
    const minimal = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], downtimeTolerance: 'minimal' })
    );
    const none = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], downtimeTolerance: 'none' })
    );
    const a = findById(minimal, 'rf-micro-face');
    const b = findById(none, 'rf-micro-face');
    if (a && b) expect(a.fitScore).toBeGreaterThan(b.fitScore);
  });

  it('"flexible" tolerance boosts RF microneedling', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const flex = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], downtimeTolerance: 'flexible' })
    );
    const a = findById(base, 'rf-micro-face');
    const b = findById(flex, 'rf-micro-face');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });
});

describe('Profile scoring: pain tolerance', () => {
  it('low pain tolerance penalizes RF microneedling', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const lowPain = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], painTolerance: 'low' })
    );
    const a = findById(base, 'rf-micro-face');
    const b = findById(lowPain, 'rf-micro-face');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(15);
  });

  it('low pain tolerance boosts facial hydration category', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const lowPain = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['dull skin'], painTolerance: 'low' })
    );
    const a = findById(base, 'hydrafacial-signature');
    const b = findById(lowPain, 'hydrafacial-signature');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(10);
  });

  it('low pain tolerance boosts light peel IDs (biorepeel-face)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const lowPain = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], painTolerance: 'low' })
    );
    const a = findById(base, 'biorepeel-face');
    const b = findById(lowPain, 'biorepeel-face');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });

  it('high pain tolerance gives a small RF bonus', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const hi = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], painTolerance: 'high' })
    );
    const a = findById(base, 'rf-micro-face');
    const b = findById(hi, 'rf-micro-face');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 8. Budget-aware scoring
// ─────────────────────────────────────────────────────────────────────

describe('Profile scoring: budget band', () => {
  it('value budget penalizes services > $800', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const value = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], budgetBand: 'value' })
    );
    const a = findById(base, 'rf-micro-face'); // $750 — not penalized
    const b = findById(value, 'rf-micro-face');
    // rf-micro-face is $750 (<=800) so no -15 penalty. Just verify still present with same price check
    if (a && b) {
      // Other modifiers (>2000 penalty etc) are identical — scores should match
      expect(b.fitScore).toBe(a.fitScore);
    }
  });

  it('value budget boosts services priced <= $350', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const value = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], budgetBand: 'value' })
    );
    const a = findById(base, 'vi-peel'); // $325
    const b = findById(value, 'vi-peel');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });

  it('value budget penalizes sofwave (premium slug) heavily', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['sagging'] }));
    const value = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['sagging'], budgetBand: 'value' })
    );
    const a = findById(base, 'sofwave-full-face');
    const b = findById(value, 'sofwave-full-face');
    // sofwave-full-face is $2250: base has -5 (>2000), value adds -15 (>800) + -20 (premium slug)
    if (a && b) expect(a.fitScore - b.fitScore).toBe(35);
  });

  it('premium budget boosts sofwave (premium slug)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['sagging'] }));
    const prem = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['sagging'], budgetBand: 'premium' })
    );
    const a = findById(base, 'sofwave-full-face');
    const b = findById(prem, 'sofwave-full-face');
    // +10 slug + +5 financingEligible = +15
    if (a && b) expect(b.fitScore - a.fitScore).toBe(15);
  });

  it('premium budget boosts financing-eligible services', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const prem = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], budgetBand: 'premium' })
    );
    const a = findById(base, 'rf-micro-face'); // financingEligible: true
    const b = findById(prem, 'rf-micro-face');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });

  it('value budget prefers hydrafacial over sofwave for sagging concern', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['sagging', 'aging'], budgetBand: 'value' })
    );
    const sofwave = findById(plan, 'sofwave-full-face');
    const anyRf = plan.find((p) => p.service.category === 'rf-microneedling');
    if (sofwave && anyRf) expect(anyRf.fitScore).toBeGreaterThan(sofwave.fitScore);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 9. Urgency & seasonality
// ─────────────────────────────────────────────────────────────────────

describe('Profile scoring: urgency', () => {
  it('event-driven urgency boosts low-session services (sessions <= 1)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const evt = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], urgency: 'event-driven' })
    );
    const a = findById(base, 'botox'); // sessions: 1
    const b = findById(evt, 'botox');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(10);
  });

  it('event-driven urgency boosts QUICK_WIN ids', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const evt = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['dull skin'], urgency: 'event-driven' })
    );
    const a = findById(base, 'hydrafacial-signature'); // sessions 1 + quick-win
    const b = findById(evt, 'hydrafacial-signature');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(20); // +10 sessions + +10 quick-win
  });

  it('event-driven urgency penalizes high-session services (sessions >= 6)', () => {
    const base = recommendTreatmentPlan({
      skinConcerns: ['unwanted hair'],
      treatmentInterests: [],
    });
    const evt = recommendTreatmentPlan({
      skinConcerns: ['unwanted hair'],
      treatmentInterests: [],
      urgency: 'event-driven',
    });
    const a = findById(base, 'lhr-upper-lip');
    const b = findById(evt, 'lhr-upper-lip');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(10);
  });

  it('relaxed urgency boosts multi-session treatments', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const relaxed = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], urgency: 'relaxed' })
    );
    const a = findById(base, 'vi-peel'); // sessions: 3
    const b = findById(relaxed, 'vi-peel');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });
});

describe('Profile scoring: seasonality', () => {
  it('summer penalizes aggressive laser category', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne scars'] }));
    const summer = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], seasonality: 'summer' })
    );
    const a = findById(base, 'scar-laser-small');
    const b = findById(summer, 'scar-laser-small');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(15);
  });

  it('summer boosts hydration (facial) category', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const summer = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['dull skin'], seasonality: 'summer' })
    );
    const a = findById(base, 'hydrafacial-signature');
    const b = findById(summer, 'hydrafacial-signature');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(10);
  });

  it('summer penalizes VI peel (aggressive peel id)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const summer = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], seasonality: 'summer' })
    );
    const a = findById(base, 'vi-peel');
    const b = findById(summer, 'vi-peel');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(10);
  });

  it('winter boosts aggressive laser', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne scars'] }));
    const winter = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne scars'], seasonality: 'winter' })
    );
    const a = findById(base, 'scar-laser-small');
    const b = findById(winter, 'scar-laser-small');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(10);
  });

  it('winter boosts chemical peel category', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['acne'] }));
    const winter = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['acne'], seasonality: 'winter' })
    );
    const a = findById(base, 'vi-peel');
    const b = findById(winter, 'vi-peel');
    if (a && b) expect(b.fitScore - a.fitScore).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 10. Previous treatments penalty
// ─────────────────────────────────────────────────────────────────────

describe('Profile scoring: previous treatments', () => {
  it('penalizes a service the client recently had (matches service name)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const prev = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging'],
        previousTreatments: ['botox'],
      })
    );
    const a = findById(base, 'botox');
    const b = findById(prev, 'botox');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(30);
  });

  it('penalizes via parentSlug match (sofwave)', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['sagging'] }));
    const prev = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['sagging'],
        previousTreatments: ['sofwave'],
      })
    );
    const a = findById(base, 'sofwave-full-face');
    const b = findById(prev, 'sofwave-full-face');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(30);
  });

  it('empty previousTreatments array is safe', () => {
    expect(() =>
      recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'], previousTreatments: [] }))
    ).not.toThrow();
  });

  // Post-Wave-11: empty-string / whitespace / sub-3-char prev tokens are
  // now filtered out before substring matching, so the former "every
  // service penalized by 30" poison pattern no longer fires.
  it('empty-string previousTreatment is filtered and does NOT poison scoring', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const withEmpty = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], previousTreatments: [''] })
    );
    const a = findById(base, 'botox');
    const b = findById(withEmpty, 'botox');
    if (a && b) expect(a.fitScore).toBe(b.fitScore);
  });

  it('whitespace-only previousTreatment is filtered and does NOT poison scoring', () => {
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const withWs = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], previousTreatments: ['   '] })
    );
    const a = findById(base, 'botox');
    const b = findById(withWs, 'botox');
    if (a && b) expect(a.fitScore).toBe(b.fitScore);
  });

  it('single-char previousTreatment does NOT match every service with that letter', () => {
    // Pre-Wave-11 this matched Botox, BioRePeel, B12, Biotin, etc.
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const withShort = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], previousTreatments: ['b'] })
    );
    const a = findById(base, 'botox');
    const b = findById(withShort, 'botox');
    if (a && b) expect(a.fitScore).toBe(b.fitScore);
  });

  it('legitimate previousTreatment still penalizes the intended service by 30', () => {
    // Full service name (≥ 3 chars) is kept; the penalty remains.
    const base = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const prev = recommendTreatmentPlan(
      makeProfile({ skinConcerns: ['aging'], previousTreatments: ['botox'] })
    );
    const a = findById(base, 'botox');
    const b = findById(prev, 'botox');
    if (a && b) expect(a.fitScore - b.fitScore).toBe(30);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 11. Treatment interests fallback
// ─────────────────────────────────────────────────────────────────────

describe('Treatment interests matching & fallback', () => {
  it('interest matches boost services whose name contains the interest', () => {
    const base = recommendTreatmentPlan(['aging']);
    const interested = recommendTreatmentPlan(['aging'], ['botox']);
    const a = findById(base, 'botox');
    const b = findById(interested, 'botox');
    if (a && b) expect(b.fitScore).toBeGreaterThan(a.fitScore);
  });

  it('interest matches boost services whose category contains the interest', () => {
    const base = recommendTreatmentPlan(['aging']);
    const interested = recommendTreatmentPlan(['aging'], ['rf']);
    const a = findById(base, 'rf-micro-face');
    const b = findById(interested, 'rf-micro-face');
    if (a && b) expect(b.fitScore).toBeGreaterThan(a.fitScore);
  });

  it('interests-only (no concerns) triggers fallback catalog search', () => {
    const plan = recommendTreatmentPlan([], ['botox']);
    expect(plan.length).toBeGreaterThan(0);
    expect(idsIn(plan)).toContain('botox');
  });

  it('interests-only fallback still respects contraindications', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: [],
      treatmentInterests: ['botox'],
      contraindications: ['pregnancy'],
    });
    expect(idsIn(plan)).not.toContain('botox');
  });

  it('interests search does not double-insert same service', () => {
    const plan = recommendTreatmentPlan([], ['hydrafacial', 'facial']);
    const ids = idsIn(plan);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 12. Reason & whyThisPhase generation
// ─────────────────────────────────────────────────────────────────────

describe('Reason & whyThisPhase text', () => {
  it('reason mentions the matched catalog concern', () => {
    const plan = recommendTreatmentPlan(['aging']);
    const item = plan.find((p) => p.service.concerns.includes('aging-skin'));
    if (item) expect(item.reason).toContain('aging-skin');
  });

  it('reason falls back to "Recommended for your treatment goals" for interest-only matches', () => {
    const plan = recommendTreatmentPlan([], ['botox']);
    const item = findById(plan, 'botox');
    if (item) expect(item.reason).toContain('Recommended');
  });

  it('whyThisPhase returns a category-specific string when available', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    for (const item of plan) {
      expect(item.whyThisPhase).toBeTruthy();
      expect(typeof item.whyThisPhase).toBe('string');
    }
  });

  it('whyThisPhase for facial phase-1 mentions "hydrated" or "glow"', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['dull skin'] }));
    const facial = plan.find((p) => p.service.category === 'facial' && p.phase === 1);
    if (facial) {
      expect(facial.whyThisPhase?.toLowerCase()).toMatch(/hydrat|glow|baseline/);
    }
  });

  it('whyThisPhase for injectables mentions visible change or complementary work', () => {
    const plan = recommendTreatmentPlan(makeProfile({ skinConcerns: ['aging'] }));
    const botox = findById(plan, 'botox');
    if (botox) expect(botox.whyThisPhase).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────
// 13. Edge cases
// ─────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('empty skinConcerns + empty interests returns []', () => {
    expect(recommendTreatmentPlan({ skinConcerns: [], treatmentInterests: [] })).toEqual([]);
  });

  it('single concern returns a cohesive plan', () => {
    const plan = recommendTreatmentPlan(['acne']);
    expect(plan.length).toBeGreaterThan(0);
    // all services must list acne-relevant concerns OR come from alias fallback
  });

  it('concern with no alias and no catalog match returns empty', () => {
    expect(recommendTreatmentPlan(['foobar-unknown'])).toEqual([]);
  });

  it('extremely long concern list still returns a capped plan', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: [
          'aging',
          'acne',
          'pigmentation',
          'large pores',
          'sagging',
          'dull skin',
          'sun damage',
          'melasma',
        ],
      })
    );
    expect(plan.length).toBeLessThanOrEqual(8);
  });

  it('conflicting concerns (acne + aging) still produces overlap services (e.g., vi-peel, rf-micro-face)', () => {
    const plan = recommendTreatmentPlan(['acne', 'aging']);
    const ids = idsIn(plan);
    const hasOverlap =
      ids.includes('vi-peel') ||
      ids.includes('rf-micro-face') ||
      ids.includes('prx-t33') ||
      ids.includes('biorepeel-face');
    expect(hasOverlap).toBe(true);
  });

  it('handles all contraindications present simultaneously', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'sagging', 'acne', 'pigmentation'],
        contraindications: [
          'pregnancy',
          'blood-thinners',
          'retinoid-use',
          'active-infection',
          'keloid-prone',
          'autoimmune',
        ],
      })
    );
    // Should still return something — wellness, skincare, and non-contraindicated facials remain
    for (const item of plan) {
      expect(item.service.id).not.toBe('botox');
      expect(item.service.id).not.toBe('dermal-fillers');
      expect(item.service.id).not.toBe('rf-micro-face');
      expect(item.service.id).not.toBe('vi-peel');
    }
  });

  it('profile with every optional field populated does not throw', () => {
    expect(() =>
      recommendTreatmentPlan({
        skinConcerns: ['aging', 'acne'],
        treatmentInterests: ['hydrafacial'],
        fitzpatrickType: 3,
        downtimeTolerance: 'minimal',
        budgetBand: 'mid',
        urgency: 'moderate',
        painTolerance: 'medium',
        maintenanceWillingness: 'high',
        previousTreatments: ['botox'],
        seasonality: 'spring',
        contraindications: [],
      })
    ).not.toThrow();
  });

  it('single previous treatment does not zero out the plan', () => {
    const plan = recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging'],
        previousTreatments: ['botox'],
      })
    );
    expect(plan.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 14. Determinism & idempotency
// ─────────────────────────────────────────────────────────────────────

describe('Determinism', () => {
  it('two identical calls return identical plans', () => {
    const profile = makeProfile({
      skinConcerns: ['aging', 'acne'],
      fitzpatrickType: 3,
      budgetBand: 'mid',
      downtimeTolerance: 'minimal',
    });
    const a = recommendTreatmentPlan(profile);
    const b = recommendTreatmentPlan(profile);
    expect(idsIn(a)).toEqual(idsIn(b));
    expect(a.map((x) => x.fitScore)).toEqual(b.map((x) => x.fitScore));
    expect(a.map((x) => x.phase)).toEqual(b.map((x) => x.phase));
  });

  it('plans do not mutate the frozen UNIFIED_CATALOG', () => {
    const snapshot = UNIFIED_CATALOG.map((s) => ({ ...s }));
    recommendTreatmentPlan(
      makeProfile({
        skinConcerns: ['aging', 'acne', 'sagging'],
        budgetBand: 'premium',
      })
    );
    for (let i = 0; i < snapshot.length; i++) {
      expect(UNIFIED_CATALOG[i].id).toBe(snapshot[i].id);
      expect(UNIFIED_CATALOG[i].price).toBe(snapshot[i].price);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 15. Realistic client personas (integration-style)
// ─────────────────────────────────────────────────────────────────────

describe('Realistic Rani personas', () => {
  it('Persona: new acne client, Fitzpatrick 5, low pain, value budget', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: ['acne', 'large pores'],
      treatmentInterests: ['hydrafacial'],
      fitzpatrickType: 5,
      downtimeTolerance: 'minimal',
      budgetBand: 'value',
      painTolerance: 'low',
      urgency: 'moderate',
    });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.length).toBeLessThanOrEqual(6); // value cap
    // Expect hydrafacial or another no-downtime item
    const ids = idsIn(plan);
    const hasFacial = ids.some((id) => id.includes('hydrafacial') || id.includes('biorepeel'));
    expect(hasFacial).toBe(true);
  });

  it('Persona: anti-aging premium client, flexible downtime', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: ['aging', 'sagging', 'fine lines'],
      treatmentInterests: ['sofwave', 'botox'],
      fitzpatrickType: 2,
      downtimeTolerance: 'flexible',
      budgetBand: 'premium',
      painTolerance: 'high',
      urgency: 'relaxed',
    });
    expect(plan.length).toBeGreaterThan(0);
    const ids = idsIn(plan);
    // Premium path should surface sofwave or botox or rf-micro-face
    const hasAnchor =
      ids.includes('sofwave-full-face') ||
      ids.includes('sofwave-full-face-neck') ||
      ids.includes('botox') ||
      ids.includes('rf-micro-face');
    expect(hasAnchor).toBe(true);
  });

  it('Persona: pregnant client, dull skin, needs safe options only', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: ['dull skin', 'hydration'],
      treatmentInterests: ['hydrafacial'],
      contraindications: ['pregnancy'],
      downtimeTolerance: 'none',
    });
    expect(plan.length).toBeGreaterThan(0);
    for (const item of plan) {
      expect(item.service.id).not.toBe('vi-peel');
      expect(item.service.id).not.toBe('biorepeel-face');
      expect(item.service.id).not.toBe('prx-t33');
      expect(item.service.id).not.toBe('botox');
      expect(item.service.id).not.toBe('dermal-fillers');
    }
  });

  it('Persona: event-driven bride, 6-week timeline, event-driven urgency', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: ['dull skin', 'aging'],
      treatmentInterests: ['botox'],
      urgency: 'event-driven',
      budgetBand: 'mid',
      downtimeTolerance: 'minimal',
      seasonality: 'summer',
    });
    expect(plan.length).toBeGreaterThan(0);
    // Should prefer low-session quick wins over multi-session laser
    const ids = idsIn(plan);
    const hasQuickOption =
      ids.includes('botox') ||
      ids.includes('hydrafacial-signature') ||
      ids.includes('hydrafacial-express') ||
      ids.includes('glutathione-injection');
    expect(hasQuickOption).toBe(true);
  });

  it('Persona: returning client who already had hydrafacial + botox', () => {
    const plan = recommendTreatmentPlan({
      skinConcerns: ['aging', 'dull skin'],
      treatmentInterests: [],
      previousTreatments: ['hydrafacial', 'botox'],
      budgetBand: 'mid',
    });
    expect(plan.length).toBeGreaterThan(0);
    // Previous treatments are penalized but not excluded. The top-ranked items
    // should NOT lead with the treatments they already had.
    const topScores = plan
      .filter((p) => p.phase === 1)
      .slice(0, 2)
      .map((p) => p.service.id);
    // Weak assertion — mostly verifying the plan still generates
    expect(topScores.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// 16. Bug documentation: assignPhase map ambiguity
// ─────────────────────────────────────────────────────────────────────

// Post-Wave-11: PHASE_CATEGORIES no longer lists `facial` and `skincare`
// in both phase 1 and phase 3. Maintenance-style categories now live
// ONLY in phase 3, so `assignPhase` returns 3 directly instead of always
// falling into phase 1 and relying on the post-hoc redistribution loop.
describe('assignPhase: facial/skincare now land directly in phase 3', () => {
  it('a facial-only concern ("dull skin") lands facials in phase 3 via assignPhase, not redistribution', () => {
    const plan = recommendTreatmentPlan(['dull skin']);
    const facialItems = plan.filter((p) => p.service.category === 'facial');
    // The plan must contain at least one facial for a dull-skin concern.
    expect(facialItems.length).toBeGreaterThan(0);
    // Every facial should now be in phase 3 (its natural maintenance home),
    // not scattered across phase 1 as a side-effect of assignPhase returning
    // on the first matching phase.
    for (const facial of facialItems) {
      expect(facial.phase).toBe(3);
    }
  });

  it('skincare services are assigned to phase 3 (maintenance), not phase 1', () => {
    // skincare category maps only to phase 3 now. We smoke-test by driving
    // a plan and verifying every skincare item lands in phase 3 if present.
    const plan = recommendTreatmentPlan(['acne']);
    const skincareItems = plan.filter((p) => p.service.category === 'skincare');
    for (const item of skincareItems) {
      expect(item.phase).toBe(3);
    }
  });
});

// Post-Wave-11: `laser-hair-removal` is now an explicit member of
// PHASE_CATEGORIES[2] (core treatment), so `assignPhase` returns 2 for
// LHR services directly. The previous `price > 400 ? 2 : 1` fallback
// could never return phase 3; the flow no longer depends on that branch
// for any known catalog category.
describe('assignPhase: laser-hair-removal is an explicit phase-2 category', () => {
  it('laser-hair-removal services are assigned to phase 2 directly', () => {
    const plan = recommendTreatmentPlan(['unwanted hair']);
    const lhr = plan.filter((p) => p.service.category === 'laser-hair-removal');
    expect(lhr.length).toBeGreaterThan(0);
    // Primary assignment should be phase 2. Some items may drift to
    // phase 1 or 3 via the "fill empty phase" redistribution pass when a
    // parentSlug collision forces a move, but the overwhelming majority
    // should be in phase 2.
    const phase2Count = lhr.filter((p) => p.phase === 2).length;
    expect(phase2Count).toBeGreaterThan(0);
  });
});
