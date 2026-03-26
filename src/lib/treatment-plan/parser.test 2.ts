// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  SERVICE_CATALOG,
  matchService,
  parseCostBreakdown,
  parseProgramPlan,
  parseTimeline,
  extractTotalValue,
  buildPackagesFromAI,
  buildFallbackPackages,
} from './parser';
import type { PlanData } from './parser';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function makePlan(overrides: Partial<PlanData> = {}): PlanData {
  return {
    id: 'rec123',
    clientName: 'Jane Doe',
    firstName: 'Jane',
    email: 'jane@example.com',
    phone: '555-0100',
    skinConcerns: [],
    targetAreas: [],
    treatmentInterests: [],
    skinType: 'Normal',
    treatmentHistory: '',
    processingStatus: 'Processed',
    intakeSummary: null,
    programPlan: null,
    costBreakdown: null,
    timeline: null,
    suggestedNextStep: null,
    treatmentValue: null,
    skinHealthScore: null,
    projectedScore: null,
    intelligenceReady: true,
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════
   parseCostBreakdown
   ═══════════════════════════════════════════════════════════════ */

describe('parseCostBreakdown', () => {
  it('parses a simple "Service - $XXX" line', () => {
    const result = parseCostBreakdown('HydraFacial Signature - $275');
    expect(result.length).toBeGreaterThanOrEqual(1);
    const item = result[0];
    expect(item.name).toMatch(/hydrafacial/i);
    // Catalog price ($225) takes precedence over text price when matched
    expect(item.pricePerSession).toBe(225);
  });

  it('parses "Service (x3) - $1,485" with quantity', () => {
    const result = parseCostBreakdown('RF Microneedling x3 sessions - $1,485');
    expect(result.length).toBe(1);
    expect(result[0].sessions).toBe(3);
    expect(result[0].total).toBe(1485);
  });

  it('filters out subtotal/summary lines', () => {
    const text = [
      'HydraFacial Signature - $275',
      'Core Program Investment - $5,250',
      'Estimated Total with 6-Month Maintenance - $8,900',
    ].join('\n');
    const result = parseCostBreakdown(text);
    // Should only include HydraFacial, not the summary lines
    expect(result.length).toBe(1);
    expect(result[0].name).toMatch(/hydrafacial/i);
  });

  it('returns empty array for null input', () => {
    expect(parseCostBreakdown(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseCostBreakdown('')).toEqual([]);
  });

  it('handles malformed lines gracefully without throwing', () => {
    const malformed = [
      'Some random text without pricing',
      '$$$ invalid pricing $$$',
      '--- $abc ---',
      '',
      'Botox: $350',
    ].join('\n');
    expect(() => parseCostBreakdown(malformed)).not.toThrow();
    const result = parseCostBreakdown(malformed);
    // Should at least find Botox
    expect(result.some(t => t.name.toLowerCase().includes('botox'))).toBe(true);
  });

  it('parses multiple treatments from multi-line input', () => {
    const text = [
      '- HydraFacial Signature: $275',
      '- VI Peel Purify x2: $790',
      '- RF Microneedling x3: $1,485',
    ].join('\n');
    const result = parseCostBreakdown(text);
    expect(result.length).toBe(3);
  });
});

/* ═══════════════════════════════════════════════════════════════
   matchService
   ═══════════════════════════════════════════════════════════════ */

describe('matchService', () => {
  it('matches exact catalog key', () => {
    const result = matchService('hydrafacial');
    expect(result).not.toBeNull();
    expect(result!.catalog.price).toBe(225);
  });

  it('fuzzy matches "RF Micro-needling" to "rf microneedling"', () => {
    const result = matchService('RF Microneedling treatment for face');
    expect(result).not.toBeNull();
    expect(result!.catalog.category).toBe('RF Microneedling');
  });

  it('fuzzy matches "Botox Injections" to "botox"', () => {
    const result = matchService('Botox Injections');
    expect(result).not.toBeNull();
    expect(result!.key).toBe('botox');
    expect(result!.catalog.price).toBe(350);
  });

  it('returns null for unknown service', () => {
    const result = matchService('Quantum Healing');
    expect(result).toBeNull();
  });

  it('is case-insensitive', () => {
    const result = matchService('HYDRAFACIAL');
    expect(result).not.toBeNull();
    expect(result!.catalog.price).toBe(225);
  });

  it('prefers longer catalog key matches', () => {
    // "hydrafacial signature" (longer) should match over "hydrafacial"
    const result = matchService('hydrafacial signature facial');
    expect(result).not.toBeNull();
    expect(result!.key).toBe('hydrafacial signature');
  });
});

/* ═══════════════════════════════════════════════════════════════
   buildPackagesFromAI
   ═══════════════════════════════════════════════════════════════ */

describe('buildPackagesFromAI', () => {
  const planWithCosts = makePlan({
    costBreakdown: [
      '- HydraFacial Signature x3: $825',
      '- RF Microneedling x3: $1,485',
      '- VI Peel Purify x2: $790',
    ].join('\n'),
    treatmentValue: '$3,100',
  });

  it('produces 3 tiers: Essential, Recommended, Platinum', () => {
    const packages = buildPackagesFromAI(planWithCosts);
    expect(packages).toHaveLength(3);
    expect(packages[0].tier).toBe('Essential');
    expect(packages[1].tier).toBe('Recommended');
    expect(packages[2].tier).toBe('Platinum');
  });

  it('Essential is cheapest, Platinum is most expensive', () => {
    const packages = buildPackagesFromAI(planWithCosts);
    expect(packages[0].price).toBeLessThan(packages[1].price);
    expect(packages[2].price).toBeGreaterThan(packages[1].price);
  });

  it('Platinum price is always >= 1.25x Recommended price', () => {
    const packages = buildPackagesFromAI(planWithCosts);
    expect(packages[2].price).toBeGreaterThanOrEqual(Math.round(packages[1].price * 1.25));
  });

  it('each package has required fields', () => {
    const packages = buildPackagesFromAI(planWithCosts);
    for (const pkg of packages) {
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('price');
      expect(pkg).toHaveProperty('lineItems');
      expect(pkg).toHaveProperty('extras');
      expect(pkg).toHaveProperty('monthlyPayment');
      expect(Array.isArray(pkg.lineItems)).toBe(true);
      expect(Array.isArray(pkg.extras)).toBe(true);
    }
  });

  it('returns fallback packages when cost breakdown is empty', () => {
    const emptyPlan = makePlan({
      costBreakdown: null,
      skinConcerns: ['dry skin'],
      targetAreas: ['face'],
      treatmentInterests: ['hydration'],
    });
    const packages = buildPackagesFromAI(emptyPlan);
    expect(packages).toHaveLength(3);
    // Fallback should still produce valid packages
    expect(packages[0].price).toBeGreaterThan(0);
  });

  it('Recommended tier is marked as highlight', () => {
    const packages = buildPackagesFromAI(planWithCosts);
    expect(packages[1].highlight).toBe(true);
    expect(packages[0].highlight).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   parseProgramPlan
   ═══════════════════════════════════════════════════════════════ */

describe('parseProgramPlan', () => {
  it('parses "Phase 1: Foundation" into structured phase', () => {
    const text = 'Phase 1: Foundation\n- HydraFacial\n- Skin assessment';
    const { phases } = parseProgramPlan(text);
    expect(phases.length).toBeGreaterThanOrEqual(1);
    expect(phases[0].title).toMatch(/foundation/i);
  });

  it('strips narrative verbs from titles', () => {
    const text = 'Phase 1: Introduces Deep Cleansing Protocol\n- Treatment A\n\nPhase 2: Deploys Advanced Renewal\n- Treatment B';
    const { phases } = parseProgramPlan(text);
    expect(phases[0].title).not.toMatch(/^introduces/i);
    expect(phases[0].title).toMatch(/deep cleansing/i);
  });

  it('handles multiple phases', () => {
    const text = [
      'Phase 1: Foundation',
      '- HydraFacial Signature',
      '- Skin analysis',
      '',
      'Phase 2: Active Treatment',
      '- RF Microneedling',
      '- VI Peel',
      '',
      'Phase 3: Maintenance',
      '- Monthly HydraFacial',
    ].join('\n');
    const { phases } = parseProgramPlan(text);
    expect(phases.length).toBe(3);
  });

  it('extracts treatments listed under each phase', () => {
    const text = 'Phase 1: Skin Reset\n- HydraFacial Signature\n- VI Peel Purify';
    const { phases } = parseProgramPlan(text);
    expect(phases[0].treatments.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty phases for null input', () => {
    const { phases, highlights } = parseProgramPlan(null);
    expect(phases).toEqual([]);
    expect(highlights).toEqual([]);
  });

  it('extracts highlights from text before first phase', () => {
    const text = [
      'Your personalized skin transformation plan targets hydration and texture improvement.',
      '',
      'Phase 1: Foundation',
      '- HydraFacial',
    ].join('\n');
    const { highlights } = parseProgramPlan(text);
    expect(highlights.length).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   parseTimeline
   ═══════════════════════════════════════════════════════════════ */

describe('parseTimeline', () => {
  it('parses "Week 1-4: Foundation phase" entries', () => {
    const text = 'Week 1-4: Foundation phase with initial treatments\nWeek 5-8: Active treatment phase';
    const entries = parseTimeline(text);
    expect(entries).toHaveLength(2);
    expect(entries[0].week).toMatch(/Week 1/i);
    expect(entries[0].description).toMatch(/foundation/i);
  });

  it('returns empty array for null input', () => {
    expect(parseTimeline(null)).toEqual([]);
  });

  it('handles Month patterns', () => {
    const text = 'Month 1: Initial consultation\nMonth 2: Follow-up treatments';
    const entries = parseTimeline(text);
    expect(entries).toHaveLength(2);
    expect(entries[0].week).toMatch(/Month 1/i);
  });
});

/* ═══════════════════════════════════════════════════════════════
   extractTotalValue
   ═══════════════════════════════════════════════════════════════ */

describe('extractTotalValue', () => {
  it('extracts from treatmentValue field', () => {
    const plan = makePlan({ treatmentValue: '$5,250' });
    expect(extractTotalValue(plan)).toBe(5250);
  });

  it('falls back to costBreakdown total line', () => {
    const plan = makePlan({
      costBreakdown: 'HydraFacial: $275\nRF Microneedling: $495\nTotal Investment: $770',
    });
    expect(extractTotalValue(plan)).toBe(770);
  });

  it('returns 0 when no pricing data', () => {
    const plan = makePlan({});
    expect(extractTotalValue(plan)).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   buildFallbackPackages
   ═══════════════════════════════════════════════════════════════ */

describe('buildFallbackPackages', () => {
  it('maps dry skin concern to HydraFacial', () => {
    const plan = makePlan({
      skinConcerns: ['dry skin', 'dehydration'],
      targetAreas: ['face'],
      treatmentInterests: ['hydration'],
    });
    const packages = buildFallbackPackages(plan);
    expect(packages).toHaveLength(3);
    const allServices = packages.flatMap(p => p.lineItems.map(i => i.service.toLowerCase()));
    expect(allServices.some(s => s.includes('hydrafacial'))).toBe(true);
  });

  it('produces default fallback when no concerns match', () => {
    const plan = makePlan({
      skinConcerns: [],
      targetAreas: [],
      treatmentInterests: [],
    });
    const packages = buildFallbackPackages(plan);
    expect(packages).toHaveLength(3);
    expect(packages[0].price).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   SERVICE_CATALOG
   ═══════════════════════════════════════════════════════════════ */

describe('SERVICE_CATALOG', () => {
  it('contains hydrafacial at $225', () => {
    expect(SERVICE_CATALOG['hydrafacial'].price).toBe(225);
  });

  it('contains sofwave at $2250', () => {
    expect(SERVICE_CATALOG['sofwave'].price).toBe(2250);
  });

  it('has more than 30 service entries', () => {
    expect(Object.keys(SERVICE_CATALOG).length).toBeGreaterThan(30);
  });
});
