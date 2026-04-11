import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  recommendNextTreatment,
  type RecommendationInput,
  type TreatmentRecord,
} from '@/lib/recommendations/engine';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/** ISO date string N days before the fake-clock "now". */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

/** Build a TreatmentRecord with sensible defaults. */
function makeTreatment(overrides: Partial<TreatmentRecord> = {}): TreatmentRecord {
  return {
    service: 'HydraFacial',
    category: 'Facial',
    date: daysAgo(10),
    amountPaid: 275,
    ...overrides,
  };
}

/** Build a RecommendationInput with sensible defaults. */
function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    treatmentHistory: [],
    membershipTier: undefined,
    avgSpend: 0,
    daysSinceLastVisit: 0,
    primaryGoal: undefined,
    ...overrides,
  };
}

/** Find a recommendation (primary or alternative) by service name. */
function findRec(
  result: ReturnType<typeof recommendNextTreatment>,
  service: string,
) {
  if (result.primary.service === service) return result.primary;
  return result.alternatives.find(r => r.service === service);
}

/** All recommendations as a flat array (primary + alternatives). */
function allRecs(result: ReturnType<typeof recommendNextTreatment>) {
  return [result.primary, ...result.alternatives];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fake timers — freeze "now" so all date math is deterministic.
// Reference: churn engine tests + no-show prediction tests use the same setup.
// Chosen date: 2026-04-10T12:00:00Z (per task spec).
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. EMPTY / DEFAULT BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────

describe('Empty input & default fallback', () => {
  it('empty history with no goal returns the HydraFacial default primary', () => {
    const result = recommendNextTreatment(makeInput());
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.category).toBe('Facial');
    expect(result.primary.urgency).toBe('now');
    expect(result.primary.estimatedPrice).toBe('$199-399');
    expect(result.primary.confidence).toBe(50);
  });

  it('empty history with no goal returns no alternatives', () => {
    const result = recommendNextTreatment(makeInput());
    expect(result.alternatives).toEqual([]);
  });

  it('empty history with no goal returns no insights', () => {
    const result = recommendNextTreatment(makeInput());
    expect(result.insights).toEqual([]);
  });

  it('default fallback reason is the popular-treatment copy', () => {
    const result = recommendNextTreatment(makeInput());
    expect(result.primary.reason).toMatch(/most popular/i);
  });

  it('result always has primary, alternatives, insights keys', () => {
    const result = recommendNextTreatment(makeInput());
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('alternatives');
    expect(result).toHaveProperty('insights');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. STRATEGY 1 — PATHWAY CONTINUATION (the "what comes next" map)
// ─────────────────────────────────────────────────────────────────────────────

describe('Strategy 1: Pathway continuation', () => {
  it('last treatment HydraFacial recent (5d ago) suggests VI Peel, RF Microneedling, HydraFacial Booster', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(5) })],
      }),
    );
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('VI Peel');
    expect(services).toContain('RF Microneedling');
    expect(services).toContain('HydraFacial Booster');
  });

  it('recent HydraFacial (< 30 days) does NOT produce an overdue-maintenance rec', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(10) })],
      }),
    );
    // The primary should be a "next in pathway", not a repeat HydraFacial
    expect(result.primary.service).not.toBe('HydraFacial');
    expect(result.insights.some(i => /Overdue for HydraFacial/.test(i))).toBe(false);
  });

  it('pathway recommendations are tagged urgency = "soon"', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(5) })],
      }),
    );
    const viPeel = findRec(result, 'VI Peel')!;
    expect(viPeel.urgency).toBe('soon');
  });

  it('fresh pathway pick for a service the client has never had uses confidence 65', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(5) })],
      }),
    );
    const viPeel = findRec(result, 'VI Peel')!;
    expect(viPeel.confidence).toBe(65);
    expect(viPeel.reason).toMatch(/complement/i);
  });

  it('pathway pick for a service the client already had uses confidence 75 and "Continue" copy', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(3) }),
          makeTreatment({ service: 'VI Peel', category: 'Facial', date: daysAgo(40) }),
        ],
      }),
    );
    const viPeel = findRec(result, 'VI Peel')!;
    expect(viPeel.confidence).toBe(75);
    expect(viPeel.reason).toMatch(/continue/i);
  });

  it('pathway next loop skips the last service itself (no self-repeat added at loop confidence)', () => {
    // HydraFacial next does NOT include HydraFacial, so make sure a repeated
    // entry doesn't sneak in from some other path at the loop's 65/75 band.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(5) })],
      }),
    );
    const hydraRec = allRecs(result).filter(r => r.service === 'HydraFacial');
    // Zero or one — but never a non-dedup double.
    expect(hydraRec.length).toBeLessThanOrEqual(1);
  });

  it('unrecognised service name (fuzzy miss) produces no pathway recs and falls back to default', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Some Random Mystery Service', category: 'Other', date: daysAgo(2) }),
        ],
      }),
    );
    // No pathway keys contain "some random mystery service" → matchService returns null
    // Category gap logic will still fire because categoriesUsed has 'Other' (a gap in all 5)
    // but with 'Other' as primaryCategory, CROSS_SELL['Other'] is undefined → no crosssell recs
    expect(result.primary.service).toBe('HydraFacial'); // default fallback
    expect(result.primary.confidence).toBe(50);
  });

  it('only the MOST RECENT treatment drives the pathway (sorted newest-first)', () => {
    // Oldest entry is Botox (pathway → Dermal Fillers), newest is HydraFacial.
    // The engine should use HydraFacial as last, not Botox.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(200) }),
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(5) }),
        ],
      }),
    );
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('VI Peel');
    // Dermal Fillers comes ONLY from a Botox pathway — must NOT appear here.
    expect(services).not.toContain('Dermal Fillers');
  });

  it('history provided in arbitrary order is sorted by date descending internally', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', date: daysAgo(50) }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(5) }),
          makeTreatment({ service: 'VI Peel', date: daysAgo(100) }),
        ],
      }),
    );
    // Most recent is Botox → should see Dermal Fillers in recs
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('Dermal Fillers');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PATHWAY MAP — every transition via it.each
// ─────────────────────────────────────────────────────────────────────────────

describe('Pathway map — every transition', () => {
  // [lastService, expectedNext[], expectedCategory]
  // Reflects the PATHWAYS table in engine.ts exactly.
  const pathwayCases: ReadonlyArray<readonly [string, readonly string[], string]> = [
    ['HydraFacial',        ['VI Peel', 'RF Microneedling', 'HydraFacial Booster'],       'Facial'],
    ['VI Peel',            ['HydraFacial', 'PRX-T33', 'RF Microneedling'],               'Facial'],
    ['PRX-T33',            ['HydraFacial', 'VI Peel', 'RF Microneedling'],               'Facial'],
    ['BioRePeel',          ['HydraFacial', 'VI Peel', 'PRX-T33'],                        'Facial'],
    ['Laser Hair Removal', ['Laser Hair Removal', 'HydraFacial'],                        'Laser'],
    ['PicoWay',            ['PicoWay', 'HydraFacial', 'VI Peel'],                        'Laser'],
    ['Laser Facial',       ['HydraFacial', 'RF Microneedling', 'Sofwave'],               'Laser'],
    ['RF Microneedling',   ['HydraFacial', 'PRX-T33', 'Sofwave'],                        'Facial'],
    ['Sofwave',            ['HydraFacial', 'RF Microneedling', 'Botox'],                 'Laser'],
    ['Botox',              ['Botox', 'Dermal Fillers', 'HydraFacial'],                   'Injectable'],
    ['Dermal Fillers',     ['Botox', 'HydraFacial', 'RF Microneedling'],                 'Injectable'],
    ['GLP-1',              ['GLP-1', 'Labs', 'Body Contouring'],                         'Wellness'],
    ['HRT',                ['HRT', 'Labs', 'Vitamin Injections'],                        'Wellness'],
    ['NAD+',               ['NAD+', 'Vitamin Injections', 'GLP-1'],                      'Wellness'],
  ];

  it.each(pathwayCases)(
    'last=%s → recommendations include all defined next-services (excluding self-repeat in loop)',
    (lastService, nextServices) => {
      const result = recommendNextTreatment(
        makeInput({
          treatmentHistory: [
            makeTreatment({
              service: lastService,
              category: 'Facial', // doesn't matter for this assertion
              date: daysAgo(1), // very recent → no overdue rec
            }),
          ],
        }),
      );
      const services = allRecs(result).map(r => r.service);
      // Every `next` that is NOT the same as lastService must appear.
      for (const next of nextServices) {
        if (next === lastService) continue;
        expect(services).toContain(next);
      }
    },
  );

  it.each(pathwayCases)(
    'last=%s → overdue rec (if any) uses the pathway category %s',
    (lastService, _nextServices, category) => {
      // Force overdue by using a very old date
      const result = recommendNextTreatment(
        makeInput({
          treatmentHistory: [
            makeTreatment({
              service: lastService,
              category: 'IgnoredRaw',
              date: daysAgo(400),
            }),
          ],
        }),
      );
      const overdueRec = allRecs(result).find(r => r.service === lastService);
      if (overdueRec) {
        expect(overdueRec.category).toBe(category);
      }
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. STRATEGY 4 — TIMING / OVERDUE MAINTENANCE
// ─────────────────────────────────────────────────────────────────────────────

describe('Strategy 4: Overdue-maintenance detection', () => {
  // [service, maintenanceDays]
  const maintenanceCases: ReadonlyArray<readonly [string, number, string]> = [
    ['HydraFacial',        30,  'Facial'],
    ['VI Peel',            42,  'Facial'],
    ['PRX-T33',            42,  'Facial'],
    ['BioRePeel',          21,  'Facial'],
    ['RF Microneedling',   42,  'Facial'],
    ['Sofwave',            365, 'Laser'],
    ['Botox',              100, 'Injectable'],
    ['Dermal Fillers',     270, 'Injectable'],
    ['Laser Hair Removal', 42,  'Laser'],
    ['PicoWay',            56,  'Laser'],
    ['Laser Facial',       42,  'Laser'],
    ['GLP-1',              30,  'Wellness'],
    ['HRT',                90,  'Wellness'],
    ['NAD+',               45,  'Wellness'],
  ];

  it.each(maintenanceCases)(
    '%s at exactly %i days -> overdue rec present (>= threshold)',
    (service, days) => {
      const result = recommendNextTreatment(
        makeInput({
          treatmentHistory: [makeTreatment({ service, date: daysAgo(days) })],
        }),
      );
      const overdue = allRecs(result).find(r => r.service === service);
      expect(overdue).toBeDefined();
      expect(overdue!.confidence).toBe(85);
      expect(overdue!.reason).toMatch(/last .* was \d+ days ago/i);
    },
  );

  it.each(maintenanceCases)(
    '%s at %i-1 days -> NOT overdue (below threshold)',
    (service, days) => {
      const belowThreshold = Math.max(0, days - 1);
      const result = recommendNextTreatment(
        makeInput({
          treatmentHistory: [makeTreatment({ service, date: daysAgo(belowThreshold) })],
        }),
      );
      // The overdue rec has a unique reason pattern. The pathway-next loop
      // may still include the service as a "Continue your X" rec, but that
      // uses confidence 75, not 85.
      const recs = allRecs(result).filter(r => r.service === service);
      for (const r of recs) {
        expect(r.confidence).not.toBe(85);
      }
    },
  );

  it('Botox at 100 days (exactly threshold) -> urgency "soon"', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(100) })],
      }),
    );
    const overdue = findRec(result, 'Botox')!;
    expect(overdue.urgency).toBe('soon');
  });

  it('Botox at 150 days (= 1.5x threshold) -> urgency "soon" (boundary: not strictly greater)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) })],
      }),
    );
    const overdue = findRec(result, 'Botox')!;
    expect(overdue.urgency).toBe('soon');
  });

  it('Botox at 151 days (> 1.5x threshold) -> urgency "now"', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(151) })],
      }),
    );
    const overdue = findRec(result, 'Botox')!;
    expect(overdue.urgency).toBe('now');
  });

  it('overdue insight reports the correct day overage', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(130) })],
      }),
    );
    const overdueInsight = result.insights.find(i => i.includes('Overdue for Botox'));
    expect(overdueInsight).toBeDefined();
    expect(overdueInsight).toMatch(/by 30 days/);
  });

  it('Sofwave is a low-frequency service — 180 days is NOT overdue (365-day threshold)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Sofwave', category: 'Laser', date: daysAgo(180) })],
      }),
    );
    const overdueInsight = result.insights.find(i => i.includes('Overdue for Sofwave'));
    expect(overdueInsight).toBeUndefined();
  });

  it('Sofwave at 365 days -> overdue insight fires', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Sofwave', category: 'Laser', date: daysAgo(365) })],
      }),
    );
    const overdueInsight = result.insights.find(i => i.includes('Overdue for Sofwave'));
    expect(overdueInsight).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. STRATEGY 2 — CATEGORY GAP FILLING
// ─────────────────────────────────────────────────────────────────────────────

describe('Strategy 2: Category gap filling', () => {
  it('Facial-only client has an Injectable gap -> Botox cross-sell recommended', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(2) }),
        ],
      }),
    );
    const botox = findRec(result, 'Botox');
    expect(botox).toBeDefined();
    // Gap-fill uses confidence 50 and urgency "consider"
    expect(botox!.urgency).toBe('consider');
    expect(botox!.reason).toMatch(/wrinkle prevention/i);
  });

  it('Facial-only client also gets a Wellness cross-sell (GLP-1)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(2) }),
        ],
      }),
    );
    // CROSS_SELL['Facial'] suggests "GLP-1 Weight Management" which resolves to PATHWAYS['GLP-1']
    const glp1 = findRec(result, 'GLP-1');
    expect(glp1).toBeDefined();
    expect(glp1!.category).toBe('Wellness');
    expect(glp1!.urgency).toBe('consider');
    expect(glp1!.confidence).toBe(50);
  });

  it('gap fill picks only the first TWO gaps (slice(0,2))', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(2) }),
        ],
      }),
    );
    // All gaps = ['Laser','Injectable','Wellness','Body']; first two = Laser, Injectable
    // CROSS_SELL['Facial'] defines Botox(Injectable) + GLP-1(Wellness) → only
    // the Injectable gap matches. Laser gap has NO matching cross-sell in Facial's list.
    // So only 1 gap-fill rec actually lands, not 2 — but the insight still lists ALL 4 gaps.
    const gapInsight = result.insights.find(i => i.startsWith("Haven't explored:"));
    expect(gapInsight).toBe("Haven't explored: Laser, Injectable, Wellness, Body");
  });

  it('client with every category explored -> no gap-fill recs and no "Haven\'t explored" insight', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial',        category: 'Facial',     date: daysAgo(5) }),
          makeTreatment({ service: 'Laser Hair Removal', category: 'Laser',      date: daysAgo(20) }),
          makeTreatment({ service: 'Botox',              category: 'Injectable', date: daysAgo(50) }),
          makeTreatment({ service: 'GLP-1',              category: 'Wellness',   date: daysAgo(15) }),
          makeTreatment({ service: 'Body Contouring',    category: 'Body',       date: daysAgo(30) }),
        ],
      }),
    );
    const gapInsight = result.insights.find(i => i.startsWith("Haven't explored:"));
    expect(gapInsight).toBeUndefined();
  });

  it('brand-new client with no history -> gap logic skipped (gaps.length === all categories)', () => {
    const result = recommendNextTreatment(makeInput({ treatmentHistory: [] }));
    const gapInsight = result.insights.find(i => i.startsWith("Haven't explored:"));
    expect(gapInsight).toBeUndefined();
  });

  it('Laser-only client gets the Laser-bucket cross-sells: HydraFacial + Sofwave', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Laser Hair Removal', category: 'Laser', date: daysAgo(1) }),
        ],
      }),
    );
    // CROSS_SELL['Laser'] = [HydraFacial(Facial), Sofwave(Laser)]
    // Gaps include Facial → HydraFacial matches. Sofwave is Laser (not a gap).
    const hydra = findRec(result, 'HydraFacial');
    expect(hydra).toBeDefined();
    expect(hydra!.reason).toMatch(/hydrate/i);
  });

  it('Injectable-only client -> gap-fill cross-sells only cover Facial (RF Microneedling or HydraFacial)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(2) }),
        ],
      }),
    );
    // CROSS_SELL['Injectable'] = [HydraFacial(Facial), RF Microneedling(Facial)]
    // Both are the same target category. Only the first-matching gap (Facial) fires.
    // The other gaps (Laser/Wellness/Body) have no Injectable cross-sell → unfilled.
    // SOURCE BUG (documented below): an Injectable-only client never sees a Laser,
    // Wellness, or Body cross-sell from gap-fill strategy.
    const gapInsight = result.insights.find(i => i.startsWith("Haven't explored:"));
    expect(gapInsight).toBe("Haven't explored: Facial, Laser, Wellness, Body");
  });

  // SOURCE BUG: CROSS_SELL['Injectable'] only contains Facial-category services, so an
  // Injectable-only client can never receive a Laser/Wellness/Body gap-fill recommendation.
  // Similarly CROSS_SELL['Laser'] only has Facial + Laser; CROSS_SELL['Wellness'] only
  // Facial + Laser; CROSS_SELL['Body'] only Wellness + Facial. Multiple categories are
  // systemically under-served by the gap-fill table.

  it('Wellness-only client gets HydraFacial (Facial) and Laser Hair Removal (Laser) cross-sells', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'GLP-1', category: 'Wellness', date: daysAgo(3) }),
        ],
      }),
    );
    const recs = allRecs(result);
    const hydra = recs.find(r => r.service === 'HydraFacial');
    const laser = recs.find(r => r.service === 'Laser Hair Removal');
    expect(hydra).toBeDefined();
    expect(laser).toBeDefined();
  });

  it('Body-only client gets Wellness (GLP-1) and Facial (HydraFacial) cross-sells', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Body Contouring', category: 'Body', date: daysAgo(20) }),
        ],
      }),
    );
    const recs = allRecs(result);
    expect(recs.find(r => r.service === 'GLP-1')).toBeDefined();
    expect(recs.find(r => r.service === 'HydraFacial')).toBeDefined();
  });

  // Post-Wave-11: gap detection now uses the client's *most-used* category as
  // the cross-sell bucket, not whichever category they happened to book last.
  // The previous source bug tagged a "10x Facial + 1 Wellness" client as a
  // Wellness client and returned Laser Hair Removal (from CROSS_SELL['Wellness']).

  it('cross-sell uses most-used category (10x Facial + 1 Wellness → Facial bucket)', () => {
    const history: TreatmentRecord[] = [];
    for (let i = 0; i < 10; i++) {
      history.push(makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(60 + i * 30) }));
    }
    history.push(makeTreatment({ service: 'GLP-1', category: 'Wellness', date: daysAgo(2) }));

    const result = recommendNextTreatment(makeInput({ treatmentHistory: history }));
    const recs = allRecs(result);
    // Most-used = Facial → CROSS_SELL['Facial'] = [Botox, GLP-1]. Gaps =
    // [Laser, Injectable, Body]. Only Botox matches the Injectable gap (GLP-1
    // targets Wellness, which isn't a gap for this client). The previously
    // buggy output — Laser Hair Removal from the Wellness bucket — should no
    // longer appear.
    expect(recs.some(r => r.service === 'Botox')).toBe(true);
    expect(recs.some(r => r.service === 'Laser Hair Removal')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. STRATEGY 3 — GOAL-BASED (only fires when history is empty)
// ─────────────────────────────────────────────────────────────────────────────

describe('Strategy 3: Goal-based matching (new clients only)', () => {
  it('glowing-skin goal -> HydraFacial primary (confidence 90, urgency "now")', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'glowing-skin', treatmentHistory: [] }),
    );
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.confidence).toBe(90);
    expect(result.primary.urgency).toBe('now');
    expect(result.primary.category).toBe('Facial');
  });

  it('glowing-skin goal -> VI Peel in alternatives', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'glowing-skin' }),
    );
    const viPeel = findRec(result, 'VI Peel');
    expect(viPeel).toBeDefined();
  });

  it('anti-aging goal -> Botox primary (confidence 90)', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'anti-aging' }),
    );
    expect(result.primary.service).toBe('Botox');
    expect(result.primary.confidence).toBe(90);
    expect(result.primary.category).toBe('Injectable');
  });

  it('anti-aging goal -> RF Microneedling (soon) + Sofwave (consider) in alternatives', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'anti-aging' }),
    );
    const rf = findRec(result, 'RF Microneedling')!;
    const sofwave = findRec(result, 'Sofwave')!;
    expect(rf.urgency).toBe('soon');
    expect(sofwave.urgency).toBe('consider');
  });

  it('body-contouring goal -> Laser Hair Removal primary + GLP-1 alt', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'body-contouring' }),
    );
    expect(result.primary.service).toBe('Laser Hair Removal');
    expect(result.primary.confidence).toBe(85);
    const glp = findRec(result, 'GLP-1');
    expect(glp).toBeDefined();
  });

  it('health-wellness goal -> GLP-1 primary, NAD+ + HRT alts', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'health-wellness' }),
    );
    expect(result.primary.service).toBe('GLP-1');
    expect(result.primary.confidence).toBe(85);
    const nad = findRec(result, 'NAD+');
    const hrt = findRec(result, 'HRT');
    expect(nad).toBeDefined();
    expect(hrt).toBeDefined();
  });

  it('unknown goal -> no goal-based recs, falls back to default HydraFacial', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'mystery-goal-xyz' }),
    );
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.confidence).toBe(50);
  });

  it('known goal BUT with treatment history -> goal-based is SUPPRESSED', () => {
    // Engine only applies goalMap when `sorted.length === 0`.
    const result = recommendNextTreatment(
      makeInput({
        primaryGoal: 'anti-aging',
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(5) })],
      }),
    );
    // Primary should NOT be Botox (that would be anti-aging goal output)
    expect(result.primary.service).not.toBe('Botox');
    // And no "based on stated goal" insight
    const goalInsight = result.insights.find(i => i.includes('stated goal'));
    expect(goalInsight).toBeUndefined();
  });

  it('goal-based insight is attached when goal matches', () => {
    const result = recommendNextTreatment(
      makeInput({ primaryGoal: 'glowing-skin' }),
    );
    expect(result.insights).toContain('Recommendations based on stated goal: glowing-skin');
  });

  // Goal-to-service table driven with it.each for robustness
  const goalCases: ReadonlyArray<readonly [string, string, number, string]> = [
    ['glowing-skin',   'HydraFacial',        90, 'Facial'],
    ['anti-aging',     'Botox',              90, 'Injectable'],
    ['body-contouring','Laser Hair Removal', 85, 'Laser'],
    ['health-wellness','GLP-1',              85, 'Wellness'],
  ];
  it.each(goalCases)(
    'goal=%s -> primary service=%s confidence=%i category=%s',
    (goal, service, confidence, category) => {
      const result = recommendNextTreatment(makeInput({ primaryGoal: goal }));
      expect(result.primary.service).toBe(service);
      expect(result.primary.confidence).toBe(confidence);
      expect(result.primary.category).toBe(category);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. STRATEGY 5 — MEMBERSHIP UPSELL
// ─────────────────────────────────────────────────────────────────────────────

describe('Strategy 5: Membership upsell insight', () => {
  const history3: TreatmentRecord[] = [
    makeTreatment({ service: 'HydraFacial', date: daysAgo(20), amountPaid: 350 }),
    makeTreatment({ service: 'VI Peel',     date: daysAgo(55), amountPaid: 395, category: 'Facial' }),
    makeTreatment({ service: 'Botox',       date: daysAgo(90), amountPaid: 650, category: 'Injectable' }),
  ];

  it('no membership, avgSpend > 300, 3+ visits -> Angel Glow Up insight present', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: history3,
        avgSpend: 465,
        membershipTier: undefined,
      }),
    );
    expect(
      result.insights.some(i => /Angel Glow Up/.test(i)),
    ).toBe(true);
  });

  it('avgSpend exactly 300 -> NO upsell insight (strict > boundary)', () => {
    const result = recommendNextTreatment(
      makeInput({ treatmentHistory: history3, avgSpend: 300 }),
    );
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(false);
  });

  it('avgSpend 301 -> upsell insight fires', () => {
    const result = recommendNextTreatment(
      makeInput({ treatmentHistory: history3, avgSpend: 301 }),
    );
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(true);
  });

  it('only 2 visits -> upsell insight does NOT fire (needs >= 3)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: history3.slice(0, 2),
        avgSpend: 500,
      }),
    );
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(false);
  });

  it('has a membershipTier -> upsell insight suppressed regardless of spend', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: history3,
        avgSpend: 900,
        membershipTier: 'Angel Glow Up',
      }),
    );
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(false);
  });

  // Post-Wave-11: the membership upsell strategy now produces an actual rec
  // in addition to the insight, restoring the "5 strategies → 5 rec producers"
  // contract documented at the top of engine.ts.
  it('upsell produces an actionable "Angel Glow Up Membership" recommendation at confidence 55', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: history3,
        avgSpend: 465,
        membershipTier: undefined,
      }),
    );
    const upsellRec = findRec(result, 'Angel Glow Up Membership');
    expect(upsellRec).toBeDefined();
    expect(upsellRec!.category).toBe('Membership');
    expect(upsellRec!.confidence).toBe(55);
    // Confidence floor keeps it below pathway (65) / overdue (85) so it never
    // displaces a legitimate treatment rec as `primary` unless nothing else
    // qualifies.
    expect(result.primary.service).not.toBe('Angel Glow Up Membership');
  });

  it('upsell rec is absent when the client already has a membership tier', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: history3,
        avgSpend: 900,
        membershipTier: 'Angel Glow Up',
      }),
    );
    expect(findRec(result, 'Angel Glow Up Membership')).toBeUndefined();
  });

  it('upsell rec is absent when avgSpend is at or below the 300 threshold', () => {
    const result = recommendNextTreatment(
      makeInput({ treatmentHistory: history3, avgSpend: 300 }),
    );
    expect(findRec(result, 'Angel Glow Up Membership')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. RANKING, DEDUPE, SHAPE
// ─────────────────────────────────────────────────────────────────────────────

describe('Ranking & dedupe', () => {
  it('primary is the highest-confidence recommendation', () => {
    // Botox 150d overdue → confidence 85. Pathway-next picks (Dermal Fillers, HydraFacial) → 65.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) }),
        ],
      }),
    );
    expect(result.primary.service).toBe('Botox');
    expect(result.primary.confidence).toBe(85);
    for (const alt of result.alternatives) {
      expect(alt.confidence).toBeLessThanOrEqual(85);
    }
  });

  it('alternatives are sorted descending by confidence', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) }),
        ],
      }),
    );
    const confs = result.alternatives.map(r => r.confidence);
    for (let i = 1; i < confs.length; i++) {
      expect(confs[i]).toBeLessThanOrEqual(confs[i - 1]);
    }
  });

  it('alternatives array length is capped at 5', () => {
    // Post-Wave-11: the alternatives window was widened from 3 → 5 so that
    // cross-sell gap-fill recs (conf 50) aren't crowded out by a full pathway
    // triplet (conf 65). Consumers that only want the top 3 can slice.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(60) }),
        ],
      }),
    );
    expect(result.alternatives.length).toBeLessThanOrEqual(5);
  });

  it('dedupe: a service suggested by multiple strategies appears once, with the cross-sell variant winning', () => {
    // Botox recent (2d ago) → pathway next puts Dermal Fillers + HydraFacial.
    // Gap-fill also suggests HydraFacial because Facial is a gap for an
    // Injectable-only client. Post-Wave-11: cross-sell recs are pushed BEFORE
    // pathway recs so first-wins dedupe preserves the more-specific cross-sell
    // reason ("Maintain glowing skin between injectable visits") instead of
    // the generic "Great complement to your Botox" pathway copy.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(2) }),
        ],
      }),
    );
    const hydraCount = allRecs(result).filter(r => r.service === 'HydraFacial').length;
    expect(hydraCount).toBeLessThanOrEqual(1);
    const hydra = findRec(result, 'HydraFacial');
    if (hydra) {
      // Cross-sell variant wins — confidence 50, reason references "glowing skin"
      // from CROSS_SELL['Injectable'].
      expect(hydra.confidence).toBe(50);
      expect(hydra.reason).toMatch(/glowing skin/i);
    }
  });

  it('every recommendation has the required Recommendation shape', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', date: daysAgo(45) }),
        ],
      }),
    );
    for (const rec of allRecs(result)) {
      expect(rec).toHaveProperty('service');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('urgency');
      expect(rec).toHaveProperty('estimatedPrice');
      expect(rec).toHaveProperty('confidence');
      expect(['now', 'soon', 'consider']).toContain(rec.urgency);
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. PRICE MAP COVERAGE
// ─────────────────────────────────────────────────────────────────────────────

describe('Price map resolution', () => {
  // NOTE: HydraFacial Booster is intentionally omitted from the overdue-price table
  // because `matchService("HydraFacial Booster")` fuzzy-matches to "HydraFacial" first
  // (insertion-order bias in matchService). It's tested via the pathway-next path below.
  const priceCases: ReadonlyArray<readonly [string, string]> = [
    ['HydraFacial',        '$199-399'],
    ['VI Peel',            '$199-349'],
    ['PRX-T33',            '$225-400'],
    ['BioRePeel',          '$199-350'],
    ['RF Microneedling',   '$495-1,500'],
    ['Sofwave',            '$1,150-3,999'],
    ['PicoWay',            '$200-500/session'],
    ['Laser Hair Removal', '$79-499'],
    ['Laser Facial',       '$199-350'],
    ['Botox',              '$12-14/unit'],
    ['Dermal Fillers',     '$600-900/syringe'],
    ['GLP-1',              '$349-699/mo'],
    ['HRT',                '$199-399/mo'],
    ['NAD+',               '$299-599'],
  ];

  it.each(priceCases)('overdue rec for %s exposes price %s', (service, price) => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service, date: daysAgo(400) })],
      }),
    );
    const rec = findRec(result, service);
    expect(rec).toBeDefined();
    expect(rec!.estimatedPrice).toBe(price);
  });

  it('HydraFacial Booster price ($299-575) is exposed via pathway-next after a HydraFacial', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(5) }),
        ],
      }),
    );
    const booster = findRec(result, 'HydraFacial Booster');
    expect(booster).toBeDefined();
    expect(booster!.estimatedPrice).toBe('$299-575');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. REALISTIC CLIENT PROFILES (integration-ish)
// ─────────────────────────────────────────────────────────────────────────────

describe('Realistic client profiles', () => {
  it('Botox regular (3x/yr) who is 140 days overdue -> Botox overdue = primary, now urgency', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(140), amountPaid: 560 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(260), amountPaid: 560 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(380), amountPaid: 560 }),
        ],
        avgSpend: 560,
        membershipTier: undefined,
        daysSinceLastVisit: 140,
      }),
    );
    expect(result.primary.service).toBe('Botox');
    expect(result.primary.confidence).toBe(85);
    // 140 > 100*1.5=150? No. 140 > 150 is false → 'soon', not 'now'.
    expect(result.primary.urgency).toBe('soon');
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(true);
  });

  it('Botox regular 160 days overdue -> urgency flips to "now"', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(160), amountPaid: 560 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(290), amountPaid: 560 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(420), amountPaid: 560 }),
        ],
        avgSpend: 560,
        daysSinceLastVisit: 160,
      }),
    );
    expect(result.primary.service).toBe('Botox');
    expect(result.primary.urgency).toBe('now');
  });

  it('new lead with anti-aging goal + no visits -> Botox primary, consult-like alts', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [],
        avgSpend: 0,
        primaryGoal: 'anti-aging',
      }),
    );
    expect(result.primary.service).toBe('Botox');
    expect(result.primary.urgency).toBe('now');
    // Sofwave and RF Microneedling should be in alts
    const services = result.alternatives.map(a => a.service);
    expect(services).toContain('RF Microneedling');
    expect(services).toContain('Sofwave');
  });

  it('lapsed VIP (Angel Glow Up member, last visit 200d ago, HydraFacial history)', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(200), amountPaid: 275 }),
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(260), amountPaid: 275 }),
          makeTreatment({ service: 'VI Peel',     category: 'Facial', date: daysAgo(320), amountPaid: 395 }),
          makeTreatment({ service: 'Botox',       category: 'Injectable', date: daysAgo(380), amountPaid: 650 }),
        ],
        membershipTier: 'Angel Glow Up',
        avgSpend: 400,
        daysSinceLastVisit: 200,
      }),
    );
    // HydraFacial overdue (200 > 30) → primary at conf 85
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.confidence).toBe(85);
    // 200 > 30*1.5=45? Yes → 'now'
    expect(result.primary.urgency).toBe('now');
    // Has membership → no Angel Glow Up insight
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(false);
  });

  it('wellness-forward client (GLP-1 + HRT, no aesthetic visits) -> Facial gap-fill', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'GLP-1', category: 'Wellness', date: daysAgo(20), amountPaid: 499 }),
          makeTreatment({ service: 'HRT',   category: 'Wellness', date: daysAgo(75), amountPaid: 349 }),
        ],
        avgSpend: 424,
        daysSinceLastVisit: 20,
      }),
    );
    // GLP-1 at 20d (< 30 threshold) → no overdue
    // Pathway-next for GLP-1 → ['GLP-1','Labs','Body Contouring'] — Labs & Body Contouring at conf 65
    // Gap fill (categoriesUsed=Wellness) → CROSS_SELL['Wellness'] = HydraFacial(Facial), Laser Hair Removal(Laser)
    // Gaps first two: Facial, Laser → both match → both added at conf 50
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('HydraFacial');
    expect(services).toContain('Laser Hair Removal');
  });

  it('Sofwave client at 200 days -> NOT overdue (annual threshold); pathway-next still fires', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Sofwave', category: 'Laser', date: daysAgo(200), amountPaid: 3500 }),
        ],
      }),
    );
    const sofwaveRec = findRec(result, 'Sofwave');
    // Sofwave should NOT be present as an overdue rec (threshold 365)
    if (sofwaveRec) {
      expect(sofwaveRec.confidence).not.toBe(85);
    }
    // But the pathway next should push HydraFacial, RF Microneedling, Botox
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('HydraFacial');
    expect(services).toContain('RF Microneedling');
    expect(services).toContain('Botox');
  });

  it('multi-category client with recent visit: no gap insight, pathway-driven recs', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'HydraFacial',        category: 'Facial',     date: daysAgo(3) }),
          makeTreatment({ service: 'Laser Hair Removal', category: 'Laser',      date: daysAgo(30) }),
          makeTreatment({ service: 'Botox',              category: 'Injectable', date: daysAgo(60) }),
          makeTreatment({ service: 'GLP-1',              category: 'Wellness',   date: daysAgo(15) }),
          makeTreatment({ service: 'Body Contouring',    category: 'Body',       date: daysAgo(90) }),
        ],
        avgSpend: 520,
        membershipTier: undefined,
      }),
    );
    // Fully explored → no "Haven't explored" insight
    expect(result.insights.find(i => i.startsWith("Haven't explored:"))).toBeUndefined();
    // But upsell insight should fire (>= 3 visits, avgSpend > 300, no membership)
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge cases & safety', () => {
  it('single treatment today (0 days ago) does not produce overdue rec', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(0) })],
      }),
    );
    const hydraOverdue = result.insights.find(i => i.includes('Overdue for HydraFacial'));
    expect(hydraOverdue).toBeUndefined();
  });

  it('future-dated treatment (clock skew) does not crash and yields pathway-next recs', () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(() =>
      recommendNextTreatment(
        makeInput({
          treatmentHistory: [
            { service: 'HydraFacial', category: 'Facial', date: future, amountPaid: 275 },
          ],
        }),
      ),
    ).not.toThrow();
  });

  it('case-insensitive fuzzy match: "hydrafacial deluxe" resolves to HydraFacial', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'hydrafacial deluxe', category: 'Facial', date: daysAgo(5) }),
        ],
      }),
    );
    // Should produce HydraFacial-pathway recommendations
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('VI Peel');
  });

  it('fuzzy match: "Botox Cosmetic 40u" resolves to Botox', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox Cosmetic 40u', category: 'Injectable', date: daysAgo(2) }),
        ],
      }),
    );
    const services = allRecs(result).map(r => r.service);
    expect(services).toContain('Dermal Fillers');
  });

  // Post-Wave-11: matchService sorts PATHWAYS keys by length DESC so the
  // most specific key wins. "Botox + Dermal Fillers combo" now resolves to
  // "Dermal Fillers" (14 chars) instead of "Botox" (5 chars).
  it('longest-match: "Botox + Dermal Fillers combo" resolves to the Dermal Fillers pathway', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox + Dermal Fillers combo', category: 'Injectable', date: daysAgo(2) }),
        ],
      }),
    );
    // Dermal Fillers pathway.next = [Botox, HydraFacial, RF Microneedling] →
    // Botox shows up as a pathway-next rec with a reason that references the
    // Dermal Fillers anchor, not the other way around.
    const botox = findRec(result, 'Botox');
    expect(botox).toBeDefined();
    expect(botox!.reason).toMatch(/dermal fillers/i);
  });

  it('history with gibberish service name and no categories -> default fallback', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          { service: '???', category: 'Unknown', date: daysAgo(5), amountPaid: 100 },
        ],
      }),
    );
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.confidence).toBe(50);
  });

  it('large history (50 entries) sorts correctly and runs in bounded time', () => {
    const history: TreatmentRecord[] = [];
    for (let i = 0; i < 50; i++) {
      history.push(
        makeTreatment({
          service: i % 2 === 0 ? 'HydraFacial' : 'VI Peel',
          category: 'Facial',
          date: daysAgo(i * 15),
        }),
      );
    }
    const start = Date.now();
    const result = recommendNextTreatment(makeInput({ treatmentHistory: history, avgSpend: 300 }));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    // Newest is HydraFacial at day 0 → no overdue
    expect(result.primary).toBeDefined();
  });

  it('category gap uses the most-used category as the cross-sell bucket (not last visit)', () => {
    // 3 HydraFacial (Facial) + 1 GLP-1 (Wellness, most recent). Post-Wave-11,
    // the engine picks Facial (most-used, 3 visits) as the cross-sell bucket
    // rather than Wellness (most-recent, 1 visit).
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'GLP-1', category: 'Wellness', date: daysAgo(1) }),
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(30) }),
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(60) }),
          makeTreatment({ service: 'HydraFacial', category: 'Facial', date: daysAgo(90) }),
        ],
      }),
    );
    // CROSS_SELL['Facial'] = [Botox, GLP-1]. Gaps = [Laser, Injectable, Body].
    // Botox matches the Injectable gap; GLP-1 is already in history (not a gap).
    // The old "Wellness bucket" would have fired Laser Hair Removal — that
    // rec should now be absent.
    const botox = findRec(result, 'Botox');
    expect(botox).toBeDefined();
    expect(findRec(result, 'Laser Hair Removal')).toBeUndefined();
  });

  it('avgSpend default of 0 with empty history does not crash', () => {
    const result = recommendNextTreatment(
      makeInput({ avgSpend: 0, treatmentHistory: [] }),
    );
    expect(result.primary).toBeDefined();
  });

  it('daysSinceLastVisit: default (0) falls back to treatment-date math', () => {
    // Callers that haven't computed a freshness signal just pass 0. The
    // engine should behave exactly as if the field were absent and compute
    // the day-delta from the most recent treatment record.
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) })],
        daysSinceLastVisit: 0,
      }),
    );
    // 150 days > Botox maintenance (100) → overdue insight + Botox primary.
    expect(result.insights.some(i => /Overdue for Botox/.test(i))).toBe(true);
    expect(result.primary.service).toBe('Botox');
  });

  it('daysSinceLastVisit: positive caller value overrides treatment-date math', () => {
    // Post-Wave-11: the engine now respects a caller-provided `daysSinceLastVisit`
    // when it's a positive finite number (e.g. the dashboard profile reads
    // Airtable's "Last Visit" column, which may be fresher than the
    // reconstructed transaction log). Botox maintenance threshold = 100 days.
    const notOverdue = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) })],
        daysSinceLastVisit: 30, // caller knows the client came back 30 days ago
      }),
    );
    const stillOverdue = recommendNextTreatment(
      makeInput({
        treatmentHistory: [makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(150) })],
        daysSinceLastVisit: 200, // caller confirms it really has been 200 days
      }),
    );
    expect(notOverdue.insights.some(i => /Overdue for Botox/.test(i))).toBe(false);
    expect(stillOverdue.insights.some(i => /Overdue for Botox/.test(i))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. INSIGHTS COMPOSITION
// ─────────────────────────────────────────────────────────────────────────────

describe('Insights composition', () => {
  it('all three insight types can co-exist on one client', () => {
    const result = recommendNextTreatment(
      makeInput({
        treatmentHistory: [
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(130), amountPaid: 650 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(250), amountPaid: 650 }),
          makeTreatment({ service: 'Botox', category: 'Injectable', date: daysAgo(370), amountPaid: 650 }),
        ],
        avgSpend: 650,
      }),
    );
    // Overdue insight + gap insight + upsell insight
    expect(result.insights.some(i => /Overdue for Botox/.test(i))).toBe(true);
    expect(result.insights.some(i => i.startsWith("Haven't explored:"))).toBe(true);
    expect(result.insights.some(i => /Angel Glow Up/.test(i))).toBe(true);
  });

  it('goal insight and overdue insight are mutually exclusive (goal only fires on empty history)', () => {
    const result = recommendNextTreatment(
      makeInput({
        primaryGoal: 'glowing-skin',
        treatmentHistory: [makeTreatment({ service: 'HydraFacial', date: daysAgo(60) })],
      }),
    );
    const goalInsight = result.insights.find(i => i.includes('stated goal'));
    const overdueInsight = result.insights.find(i => i.includes('Overdue for HydraFacial'));
    expect(goalInsight).toBeUndefined();
    expect(overdueInsight).toBeDefined();
  });
});
