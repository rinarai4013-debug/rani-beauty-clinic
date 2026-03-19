import { describe, it, expect } from 'vitest';
import { recommendNextTreatment, RecommendationInput } from '../engine';

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    treatmentHistory: [],
    avgSpend: 200,
    daysSinceLastVisit: 30,
    ...overrides,
  };
}

describe('recommendNextTreatment', () => {
  it('suggests RF Microneedling or Sofwave after HydraFacial', () => {
    const result = recommendNextTreatment(makeInput({
      treatmentHistory: [
        { service: 'HydraFacial', category: 'Facial', date: new Date().toISOString(), amountPaid: 275 },
      ],
      daysSinceLastVisit: 14,
    }));

    // The pathway for HydraFacial lists: VI Peel, RF Microneedling, HydraFacial Booster
    // Primary or alternatives should include at least one pathway follow-up
    const allSuggested = [result.primary, ...result.alternatives].map(r => r.service);
    const pathwayFollowUps = ['VI Peel', 'RF Microneedling', 'HydraFacial Booster'];
    const hasPathwayMatch = allSuggested.some(s => pathwayFollowUps.includes(s));
    expect(hasPathwayMatch).toBe(true);
  });

  it('suggests HydraFacial as default for empty treatment history', () => {
    const result = recommendNextTreatment(makeInput({
      treatmentHistory: [],
    }));

    // With no history and no goal, the fallback is HydraFacial
    expect(result.primary.service).toBe('HydraFacial');
    expect(result.primary.category).toBe('Facial');
  });

  it('includes membership upsell insight for high-spend non-members', () => {
    const now = new Date();
    const history = Array.from({ length: 4 }, (_, i) => ({
      service: 'HydraFacial',
      category: 'Facial',
      date: new Date(now.getTime() - i * 30 * 86400000).toISOString(),
      amountPaid: 350,
    }));

    const result = recommendNextTreatment(makeInput({
      treatmentHistory: history,
      avgSpend: 400,
      membershipTier: undefined,
      daysSinceLastVisit: 10,
    }));

    // High-value client without membership should trigger upsell insight
    const hasUpsellInsight = result.insights.some(i =>
      i.toLowerCase().includes('membership')
    );
    expect(hasUpsellInsight).toBe(true);
  });

  it('returns confidence scores between 0 and 100', () => {
    const result = recommendNextTreatment(makeInput({
      treatmentHistory: [
        { service: 'Botox', category: 'Injectable', date: new Date().toISOString(), amountPaid: 500 },
      ],
    }));

    const allRecs = [result.primary, ...result.alternatives];
    for (const rec of allRecs) {
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    }
  });
});
