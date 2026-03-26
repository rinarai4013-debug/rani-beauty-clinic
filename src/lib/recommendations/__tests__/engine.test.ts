// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { recommendNextTreatment, type RecommendationInput, type TreatmentRecord } from '../engine';

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    treatmentHistory: [],
    avgSpend: 200,
    daysSinceLastVisit: 30,
    ...overrides,
  };
}

function makeHistory(service: string, daysAgo: number, category = 'Facial'): TreatmentRecord {
  return {
    service,
    category,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    amountPaid: 300,
  };
}

describe('Recommendation Engine', () => {
  // ── Structure ──
  it('returns primary, alternatives, and insights', () => {
    const r = recommendNextTreatment(makeInput());
    expect(r).toHaveProperty('primary');
    expect(r).toHaveProperty('alternatives');
    expect(r).toHaveProperty('insights');
    expect(r.primary).toHaveProperty('service');
    expect(r.primary).toHaveProperty('confidence');
  });

  it('confidence scores are 0-100', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Botox', 10, 'Injectable')],
    }));
    const all = [r.primary, ...r.alternatives];
    all.forEach(rec => {
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    });
  });

  it('returns max 3 alternatives', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 5)],
    }));
    expect(r.alternatives.length).toBeLessThanOrEqual(3);
  });

  // ── Pathway-Based ──
  it('suggests pathway treatments after HydraFacial', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 14)],
    }));
    const all = [r.primary, ...r.alternatives].map(x => x.service);
    const expected = ['VI Peel', 'RF Microneedling', 'HydraFacial Booster'];
    expect(all.some(s => expected.includes(s))).toBe(true);
  });

  it('suggests repeat Botox when overdue', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Botox', 120, 'Injectable')],
      daysSinceLastVisit: 120,
    }));
    const all = [r.primary, ...r.alternatives].map(x => x.service);
    expect(all).toContain('Botox');
  });

  it('suggests Laser Hair Removal repeat in series', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Laser Hair Removal', 50, 'Laser')],
      daysSinceLastVisit: 50,
    }));
    const all = [r.primary, ...r.alternatives].map(x => x.service);
    expect(all).toContain('Laser Hair Removal');
  });

  // ── Overdue Maintenance ──
  it('flags overdue HydraFacial (>30 days)', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 45)],
      daysSinceLastVisit: 45,
    }));
    expect(r.insights.some(i => i.includes('Overdue'))).toBe(true);
  });

  it('flags urgency=now when very overdue (>1.5x maintenance)', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Botox', 200, 'Injectable')],
      daysSinceLastVisit: 200,
    }));
    const botoxRec = [r.primary, ...r.alternatives].find(x => x.service === 'Botox');
    expect(botoxRec).toBeDefined();
    expect(botoxRec!.urgency).toBe('now');
  });

  // ── Empty History Fallback ──
  it('defaults to HydraFacial with empty history and no goal', () => {
    const r = recommendNextTreatment(makeInput({ treatmentHistory: [] }));
    expect(r.primary.service).toBe('HydraFacial');
  });

  // ── Goal-Based (new clients) ──
  it('recommends Botox for anti-aging goal', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [],
      primaryGoal: 'anti-aging',
    }));
    expect(r.primary.service).toBe('Botox');
    expect(r.primary.confidence).toBe(90);
  });

  it('recommends HydraFacial for glowing-skin goal', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [],
      primaryGoal: 'glowing-skin',
    }));
    expect(r.primary.service).toBe('HydraFacial');
  });

  it('recommends GLP-1 for health-wellness goal', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [],
      primaryGoal: 'health-wellness',
    }));
    expect(r.primary.service).toBe('GLP-1');
  });

  it('goal-based recs only for new clients (empty history)', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 10)],
      primaryGoal: 'anti-aging',
    }));
    // With history, pathway takes precedence
    expect(r.insights.every(i => !i.includes('stated goal'))).toBe(true);
  });

  // ── Category Gaps / Cross-Sell ──
  it('identifies unexplored categories', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [
        makeHistory('HydraFacial', 10, 'Facial'),
        makeHistory('HydraFacial', 40, 'Facial'),
        makeHistory('HydraFacial', 70, 'Facial'),
      ],
    }));
    expect(r.insights.some(i => i.includes("Haven't explored"))).toBe(true);
  });

  // ── Membership Upsell ──
  it('suggests membership for high-spend non-member', () => {
    const history = Array.from({ length: 4 }, (_, i) =>
      makeHistory('HydraFacial', i * 30)
    );
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: history,
      avgSpend: 400,
      daysSinceLastVisit: 10,
    }));
    expect(r.insights.some(i => i.toLowerCase().includes('membership'))).toBe(true);
  });

  it('does NOT suggest membership for existing members', () => {
    const history = Array.from({ length: 4 }, (_, i) =>
      makeHistory('HydraFacial', i * 30)
    );
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: history,
      avgSpend: 400,
      membershipTier: 'Gold',
    }));
    expect(r.insights.every(i => !i.toLowerCase().includes('membership pitch'))).toBe(true);
  });

  // ── Deduplication ──
  it('does not suggest same service twice', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 10)],
    }));
    const all = [r.primary, ...r.alternatives].map(x => x.service);
    expect(new Set(all).size).toBe(all.length);
  });

  // ── Medical Appropriateness ──
  it('Sofwave suggests annual maintenance, not monthly', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Sofwave', 200, 'Laser')],
      daysSinceLastVisit: 200,
    }));
    const sofwave = [r.primary, ...r.alternatives].find(x => x.service === 'Sofwave');
    // Sofwave maintenance is 365 days -- should not flag urgency=now at 200 days
    if (sofwave) {
      expect(sofwave.urgency).not.toBe('now');
    }
  });

  it('GLP-1 pathway suggests Labs as follow-up', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('GLP-1', 35, 'Wellness')],
      daysSinceLastVisit: 35,
    }));
    const all = [r.primary, ...r.alternatives].map(x => x.service);
    expect(all).toContain('Labs');
  });

  // ── Price Estimates ──
  it('includes estimated prices', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('HydraFacial', 10)],
    }));
    expect(r.primary.estimatedPrice).toBeDefined();
    expect(r.primary.estimatedPrice.length).toBeGreaterThan(0);
  });

  // ── Edge Cases ──
  it('handles unrecognized service name gracefully', () => {
    const r = recommendNextTreatment(makeInput({
      treatmentHistory: [makeHistory('Custom Treatment XYZ', 10, 'Other')],
    }));
    expect(r.primary).toBeDefined();
    expect(r.primary.service).toBeDefined();
  });

  it('handles very large treatment history', () => {
    const history = Array.from({ length: 100 }, (_, i) =>
      makeHistory('HydraFacial', i * 7)
    );
    const r = recommendNextTreatment(makeInput({ treatmentHistory: history }));
    expect(r.primary).toBeDefined();
  });
});
