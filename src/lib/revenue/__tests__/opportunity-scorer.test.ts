import { describe, it, expect } from 'vitest';
import { scoreOpportunities, type OpportunityScorerInput } from '../opportunity-scorer';

function emptyInput(overrides: Partial<OpportunityScorerInput> = {}): OpportunityScorerInput {
  return {
    gapActions: [],
    upsellOpportunities: [],
    retentionActions: [],
    pricingOpportunities: [],
    reactivationTargets: [],
    membershipCandidates: [],
    historicalOutcomes: [],
    currentDate: '2026-04-12',
    ...overrides,
  };
}

describe('scoreOpportunities', () => {
  it('returns all expected result keys', () => {
    const result = scoreOpportunities(emptyInput());
    expect(result).toHaveProperty('scoredOpportunities');
    expect(result).toHaveProperty('dailyTopTen');
    expect(result).toHaveProperty('weeklyReport');
    expect(result).toHaveProperty('categoryBreakdown');
    expect(result).toHaveProperty('roiTracking');
    expect(result).toHaveProperty('learnings');
  });

  it('handles empty input gracefully', () => {
    const result = scoreOpportunities(emptyInput());
    expect(result.scoredOpportunities).toHaveLength(0);
    expect(result.dailyTopTen).toHaveLength(0);
    expect(result.roiTracking.totalActionsTracked).toBe(0);
  });

  it('scores gap actions as fill-empty-slot category', () => {
    const result = scoreOpportunities(emptyInput({
      gapActions: [{
        type: 'fill-slot',
        date: '2026-04-13',
        provider: 'Rina',
        timeSlot: '10:00 AM',
        estimatedRevenue: 500,
        daysUntil: 1,
        suggestedServices: ['HydraFacial', 'Botox'],
      }],
    }));

    expect(result.scoredOpportunities).toHaveLength(1);
    expect(result.scoredOpportunities[0].category).toBe('fill-empty-slot');
    expect(result.scoredOpportunities[0].score).toBeGreaterThan(0);
    expect(result.scoredOpportunities[0].score).toBeLessThanOrEqual(100);
  });

  it('scores upsell opportunities', () => {
    const result = scoreOpportunities(emptyInput({
      upsellOpportunities: [{
        type: 'upsell',
        clientId: 'rec1',
        clientName: 'Jane Doe',
        currentService: 'HydraFacial',
        suggestedService: 'LED Add-On',
        propensityScore: 70,
        revenueImpact: 150,
      }],
    }));

    expect(result.scoredOpportunities[0].category).toBe('upsell-existing');
    expect(result.scoredOpportunities[0].targetClient).toBe('Jane Doe');
  });

  it('scores retention actions by type', () => {
    const result = scoreOpportunities(emptyInput({
      retentionActions: [
        {
          type: 'rebook',
          clientId: 'rec1',
          clientName: 'Jane Doe',
          daysSinceVisit: 45,
          estimatedRevenue: 400,
          urgency: 'overdue',
        },
        {
          type: 'winback',
          clientId: 'rec2',
          clientName: 'Lost Client',
          daysSinceVisit: 120,
          estimatedRevenue: 300,
          urgency: 'critical',
        },
      ],
    }));

    expect(result.scoredOpportunities).toHaveLength(2);
    const categories = result.scoredOpportunities.map(o => o.category);
    expect(categories).toContain('rebook-overdue');
    expect(categories).toContain('win-back-lapsed');
  });

  it('scores reactivation targets', () => {
    const result = scoreOpportunities(emptyInput({
      reactivationTargets: [{
        type: 'reactivation',
        clientId: 'rec3',
        clientName: 'Dormant User',
        daysSinceVisit: 180,
        totalSpend: 3000,
        lastService: 'Botox',
        winBackProbability: 40,
        estimatedRevenue: 500,
      }],
    }));

    expect(result.scoredOpportunities[0].category).toBe('reactivate-dormant');
    expect(result.scoredOpportunities[0].tags).toContain('long-dormant');
  });

  it('scores membership candidates', () => {
    const result = scoreOpportunities(emptyInput({
      membershipCandidates: [{
        type: 'membership-conversion',
        clientId: 'rec4',
        clientName: 'Frequent Visitor',
        visitCount: 8,
        avgTicket: 350,
        suggestedTier: 'Gold',
        monthlyPrice: 199,
        conversionLikelihood: 75,
        annualValue: 2388,
      }],
    }));

    expect(result.scoredOpportunities[0].category).toBe('membership-conversion');
    expect(result.scoredOpportunities[0].suggestedScript).toContain('Gold');
  });

  it('sorts opportunities by score descending', () => {
    const result = scoreOpportunities(emptyInput({
      gapActions: [
        { type: 'fill-slot', date: '2026-04-13', provider: 'Rina', timeSlot: '10:00', estimatedRevenue: 2000, daysUntil: 0, suggestedServices: ['Botox'] },
      ],
      upsellOpportunities: [
        { type: 'upsell', clientId: 'r1', clientName: 'A', currentService: 'Facial', suggestedService: 'Peel', propensityScore: 30, revenueImpact: 50 },
      ],
    }));

    for (let i = 1; i < result.scoredOpportunities.length; i++) {
      expect(result.scoredOpportunities[i - 1].score)
        .toBeGreaterThanOrEqual(result.scoredOpportunities[i].score);
    }
  });

  it('limits dailyTopTen to 10 items', () => {
    const manyGaps = Array.from({ length: 15 }, (_, i) => ({
      type: 'fill-slot' as const,
      date: '2026-04-13',
      provider: 'Rina',
      timeSlot: `${8 + i}:00`,
      estimatedRevenue: 300 + i * 50,
      daysUntil: i,
      suggestedServices: ['HydraFacial'],
    }));

    const result = scoreOpportunities(emptyInput({ gapActions: manyGaps }));
    expect(result.dailyTopTen).toHaveLength(10);
  });

  it('builds category breakdown', () => {
    const result = scoreOpportunities(emptyInput({
      gapActions: [{ type: 'fill-slot', date: '2026-04-13', provider: 'Rina', timeSlot: '10:00', estimatedRevenue: 500, daysUntil: 1, suggestedServices: ['Botox'] }],
      upsellOpportunities: [{ type: 'upsell', clientId: 'r1', clientName: 'A', currentService: 'X', suggestedService: 'Y', propensityScore: 50, revenueImpact: 200 }],
    }));

    expect(result.categoryBreakdown.length).toBe(2);
    for (const cat of result.categoryBreakdown) {
      expect(cat.count).toBeGreaterThan(0);
      expect(cat.avgScore).toBeGreaterThan(0);
    }
  });

  it('builds ROI tracking from historical outcomes', () => {
    const result = scoreOpportunities(emptyInput({
      historicalOutcomes: [
        { actionId: 'a1', category: 'upsell', result: 'success', revenueGenerated: 500, date: '2026-04-10' },
        { actionId: 'a2', category: 'upsell', result: 'failed', revenueGenerated: 0, date: '2026-04-09' },
        { actionId: 'a3', category: 'rebook', result: 'success', revenueGenerated: 400, date: '2026-04-08' },
      ],
    }));

    expect(result.roiTracking.totalActionsTracked).toBe(3);
    expect(result.roiTracking.successRate).toBe(67); // 2/3
    expect(result.roiTracking.totalRevenueGenerated).toBe(900);
  });

  it('extracts learnings from sufficient historical data', () => {
    const outcomes = Array.from({ length: 5 }, (_, i) => ({
      actionId: `a${i}`,
      category: 'upsell',
      result: 'success' as const,
      revenueGenerated: 300 + i * 50,
      date: '2026-04-10',
    }));

    const result = scoreOpportunities(emptyInput({ historicalOutcomes: outcomes }));
    expect(result.learnings.length).toBeGreaterThan(0);
    expect(result.learnings[0].confidence).toBeGreaterThan(0);
  });

  it('applies learning adjustments when enough historical data exists', () => {
    const outcomes = Array.from({ length: 6 }, (_, i) => ({
      actionId: `a${i}`,
      category: 'fill-empty-slot',
      result: (i < 5 ? 'success' : 'failed') as 'success' | 'failed',
      revenueGenerated: 400,
      date: '2026-04-10',
    }));

    const withHistory = scoreOpportunities(emptyInput({
      gapActions: [{ type: 'fill-slot', date: '2026-04-13', provider: 'Rina', timeSlot: '10:00', estimatedRevenue: 500, daysUntil: 1, suggestedServices: ['Botox'] }],
      historicalOutcomes: outcomes,
    }));

    const withoutHistory = scoreOpportunities(emptyInput({
      gapActions: [{ type: 'fill-slot', date: '2026-04-13', provider: 'Rina', timeSlot: '10:00', estimatedRevenue: 500, daysUntil: 1, suggestedServices: ['Botox'] }],
    }));

    // High success rate should boost the score
    expect(withHistory.scoredOpportunities[0].score)
      .toBeGreaterThanOrEqual(withoutHistory.scoredOpportunities[0].score);
  });
});
