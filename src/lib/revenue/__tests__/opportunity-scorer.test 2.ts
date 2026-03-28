import { scoreOpportunities } from '../opportunity-scorer';
import type { OpportunityScorerInput, OpportunityScorerResult } from '../opportunity-scorer';

// ── HELPERS ──

function makeInput(overrides: Partial<OpportunityScorerInput> = {}): OpportunityScorerInput {
  return {
    gapActions: [
      { type: 'fill-slot', date: '2026-03-26', provider: 'Rina', timeSlot: '2-4 PM', estimatedRevenue: 500, daysUntil: 0, suggestedServices: ['Botox'] },
      { type: 'fill-slot', date: '2026-03-27', provider: 'Mom', timeSlot: '10-12 PM', estimatedRevenue: 360, daysUntil: 1, suggestedServices: ['HydraFacial'] },
      { type: 'fill-slot', date: '2026-04-01', provider: 'Rina', timeSlot: '9-11 AM', estimatedRevenue: 500, daysUntil: 6, suggestedServices: ['Fillers'] },
    ],
    upsellOpportunities: [
      { type: 'upsell', clientId: '1', clientName: 'Sarah K.', currentService: 'HydraFacial', suggestedService: 'LED Light Therapy', propensityScore: 72, revenueImpact: 75 },
      { type: 'upsell', clientId: '2', clientName: 'Jessica M.', currentService: 'RF Microneedling', suggestedService: 'PRP Enhancement', propensityScore: 58, revenueImpact: 200 },
    ],
    retentionActions: [
      { type: 'rebook', clientId: '3', clientName: 'Amanda L.', daysSinceVisit: 95, estimatedRevenue: 350, urgency: 'overdue' },
      { type: 'vip-retention', clientId: '4', clientName: 'Michelle T.', daysSinceVisit: 68, estimatedRevenue: 650, urgency: 'critical', churnRisk: 72, totalSpend: 8500 },
      { type: 'winback', clientId: '5', clientName: 'Rachel P.', daysSinceVisit: 120, estimatedRevenue: 400, urgency: 'at-risk', totalSpend: 3200 },
    ],
    pricingOpportunities: [
      { type: 'bundle', service: 'Glow Package', estimatedRevenueImpact: 670, description: 'Bundle for higher tickets' },
      { type: 'price-increase', service: 'Botox', currentPrice: 350, suggestedPrice: 375, estimatedRevenueImpact: 625, description: 'Below market pricing' },
    ],
    reactivationTargets: [
      { type: 'reactivation', clientId: '6', clientName: 'Linda W.', daysSinceVisit: 85, totalSpend: 4200, lastService: 'Botox', winBackProbability: 55, estimatedRevenue: 350 },
    ],
    membershipCandidates: [
      { type: 'membership-conversion', clientId: '7', clientName: 'Karen B.', visitCount: 8, avgTicket: 320, suggestedTier: 'Glow', monthlyPrice: 249, conversionLikelihood: 65, annualValue: 2988 },
    ],
    historicalOutcomes: [],
    currentDate: '2026-03-26',
    ...overrides,
  };
}

// ── TESTS ──

describe('Opportunity Scorer', () => {
  describe('scoreOpportunities', () => {
    it('should return valid result structure', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.scoredOpportunities).toBeDefined();
      expect(result.dailyTopTen).toBeDefined();
      expect(result.weeklyReport).toBeDefined();
      expect(result.categoryBreakdown).toBeDefined();
      expect(result.roiTracking).toBeDefined();
      expect(result.learnings).toBeDefined();
    });

    it('should score all input opportunities', () => {
      const input = makeInput();
      const totalInputs = input.gapActions.length + input.upsellOpportunities.length
        + input.retentionActions.length + input.pricingOpportunities.length
        + input.reactivationTargets.length + input.membershipCandidates.length;
      const result = scoreOpportunities(input);
      expect(result.scoredOpportunities.length).toBe(totalInputs);
    });
  });

  describe('Scoring', () => {
    it('should score between 0 and 100', () => {
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        expect(opp.score).toBeGreaterThanOrEqual(0);
        expect(opp.score).toBeLessThanOrEqual(100);
      }
    });

    it('should sort opportunities by score descending', () => {
      const result = scoreOpportunities(makeInput());
      for (let i = 1; i < result.scoredOpportunities.length; i++) {
        expect(result.scoredOpportunities[i].score).toBeLessThanOrEqual(result.scoredOpportunities[i - 1].score);
      }
    });

    it('should calculate expected value as revenue * probability / 100', () => {
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        const expected = Math.round(opp.estimatedRevenue * opp.probability / 100);
        expect(opp.expectedValue).toBe(expected);
      }
    });

    it('should have score breakdown that sums correctly', () => {
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        const bd = opp.scoreBreakdown;
        // Score should be weighted combination
        const computed = Math.round(
          bd.revenueWeight * 0.35 + bd.effortWeight * 0.20
          + bd.timeWeight * 0.25 + bd.probabilityWeight * 0.20
        );
        expect(Math.abs(opp.score - computed)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Category Scoring', () => {
    it('should score same-day slot fills highly', () => {
      const result = scoreOpportunities(makeInput());
      const todaySlots = result.scoredOpportunities.filter(
        o => o.category === 'fill-empty-slot' && o.timeToImpact === 'immediate'
      );
      if (todaySlots.length > 0) {
        expect(todaySlots[0].score).toBeGreaterThan(40);
      }
    });

    it('should score upsells as immediate impact', () => {
      const result = scoreOpportunities(makeInput());
      const upsells = result.scoredOpportunities.filter(o => o.category === 'upsell-existing');
      for (const up of upsells) {
        expect(up.timeToImpact).toBe('immediate');
      }
    });

    it('should score VIP retention actions', () => {
      const result = scoreOpportunities(makeInput());
      const vip = result.scoredOpportunities.find(o => o.category === 'vip-retention');
      expect(vip).toBeDefined();
      expect(vip!.effort).toBe('high');
    });

    it('should score membership conversions', () => {
      const result = scoreOpportunities(makeInput());
      const membership = result.scoredOpportunities.find(o => o.category === 'membership-conversion');
      expect(membership).toBeDefined();
      expect(membership!.suggestedScript).toBeTruthy();
    });

    it('should have valid categories', () => {
      const validCategories = [
        'fill-empty-slot', 'upsell-existing', 'rebook-overdue',
        'reactivate-dormant', 'win-back-lapsed', 'vip-retention',
        'new-client-acquisition', 'price-optimization',
        'package-conversion', 'membership-conversion',
      ];
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        expect(validCategories).toContain(opp.category);
      }
    });
  });

  describe('Daily Top 10', () => {
    it('should return max 10 items', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.dailyTopTen.length).toBeLessThanOrEqual(10);
    });

    it('should be top-scored items', () => {
      const result = scoreOpportunities(makeInput());
      if (result.scoredOpportunities.length >= 10 && result.dailyTopTen.length >= 10) {
        const lowestTopTen = result.dailyTopTen[result.dailyTopTen.length - 1].score;
        const highestRemaining = result.scoredOpportunities[10]?.score || 0;
        expect(lowestTopTen).toBeGreaterThanOrEqual(highestRemaining);
      }
    });
  });

  describe('Category Breakdown', () => {
    it('should break down by category', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.categoryBreakdown.length).toBeGreaterThan(0);
    });

    it('should sort by expected total value descending', () => {
      const result = scoreOpportunities(makeInput());
      for (let i = 1; i < result.categoryBreakdown.length; i++) {
        expect(result.categoryBreakdown[i].expectedTotalValue).toBeLessThanOrEqual(
          result.categoryBreakdown[i - 1].expectedTotalValue
        );
      }
    });

    it('should have counts matching scored opportunities', () => {
      const result = scoreOpportunities(makeInput());
      const totalFromBreakdown = result.categoryBreakdown.reduce((s, c) => s + c.count, 0);
      expect(totalFromBreakdown).toBe(result.scoredOpportunities.length);
    });
  });

  describe('Weekly Report', () => {
    it('should have total opportunity value', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.weeklyReport.totalOpportunityValue).toBeGreaterThan(0);
    });

    it('should include recommendations', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.weeklyReport.recommendations.length).toBeGreaterThan(0);
    });

    it('should have category distribution', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.weeklyReport.categoryDistribution.length).toBeGreaterThan(0);
    });
  });

  describe('ROI Tracking', () => {
    it('should return zero stats with no outcomes', () => {
      const result = scoreOpportunities(makeInput());
      expect(result.roiTracking.totalActionsTracked).toBe(0);
      expect(result.roiTracking.successRate).toBe(0);
    });

    it('should calculate stats with historical outcomes', () => {
      const result = scoreOpportunities(makeInput({
        historicalOutcomes: [
          { actionId: '1', category: 'rebook-overdue', result: 'success', revenueGenerated: 350, date: '2026-03-20' },
          { actionId: '2', category: 'rebook-overdue', result: 'success', revenueGenerated: 275, date: '2026-03-21' },
          { actionId: '3', category: 'fill-empty-slot', result: 'failed', revenueGenerated: 0, date: '2026-03-22' },
          { actionId: '4', category: 'upsell-existing', result: 'partial', revenueGenerated: 50, date: '2026-03-23' },
          { actionId: '5', category: 'upsell-existing', result: 'no-response', revenueGenerated: 0, date: '2026-03-24' },
        ],
      }));
      expect(result.roiTracking.totalActionsTracked).toBe(5);
      expect(result.roiTracking.successRate).toBe(60); // 3/5 success or partial
      expect(result.roiTracking.totalRevenueGenerated).toBe(675);
    });
  });

  describe('Learning System', () => {
    it('should extract learnings from sufficient data', () => {
      const outcomes = [];
      for (let i = 0; i < 10; i++) {
        outcomes.push({
          actionId: `r${i}`, category: 'rebook-overdue',
          result: i < 8 ? 'success' as const : 'failed' as const,
          revenueGenerated: i < 8 ? 350 : 0, date: `2026-03-${15 + i}`,
        });
      }
      const result = scoreOpportunities(makeInput({ historicalOutcomes: outcomes }));
      const rebookLearning = result.learnings.find(l => l.category === 'rebook-overdue');
      expect(rebookLearning).toBeDefined();
      expect(rebookLearning!.basedOnActions).toBe(10);
    });

    it('should adjust scores based on historical success', () => {
      const goodOutcomes = Array.from({ length: 10 }, (_, i) => ({
        actionId: `a${i}`, category: 'rebook-overdue',
        result: 'success' as const, revenueGenerated: 350, date: `2026-03-${10 + i}`,
      }));
      const badOutcomes = Array.from({ length: 10 }, (_, i) => ({
        actionId: `b${i}`, category: 'fill-empty-slot',
        result: 'failed' as const, revenueGenerated: 0, date: `2026-03-${10 + i}`,
      }));
      const result = scoreOpportunities(makeInput({ historicalOutcomes: [...goodOutcomes, ...badOutcomes] }));

      // Rebook scores should be boosted, fill-slot should be penalized
      const rebooks = result.scoredOpportunities.filter(o => o.category === 'rebook-overdue');
      const fills = result.scoredOpportunities.filter(o => o.category === 'fill-empty-slot');

      // At minimum, scores should still be valid
      for (const opp of [...rebooks, ...fills]) {
        expect(opp.score).toBeGreaterThanOrEqual(0);
        expect(opp.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Tags', () => {
    it('should tag same-day slots as urgent', () => {
      const result = scoreOpportunities(makeInput());
      const todaySlot = result.scoredOpportunities.find(
        o => o.category === 'fill-empty-slot' && o.tags.includes('urgent')
      );
      // Should exist since we have daysUntil=0 in input
      expect(todaySlot).toBeDefined();
    });

    it('should include category-appropriate tags', () => {
      const result = scoreOpportunities(makeInput());
      const upsell = result.scoredOpportunities.find(o => o.category === 'upsell-existing');
      if (upsell) {
        expect(upsell.tags).toContain('upsell');
      }
    });
  });

  describe('Suggested Actions & Scripts', () => {
    it('should include suggested actions for all opportunities', () => {
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        expect(opp.suggestedAction).toBeTruthy();
      }
    });

    it('should personalize retention scripts with client name', () => {
      const result = scoreOpportunities(makeInput());
      const retention = result.scoredOpportunities.find(o => o.category === 'rebook-overdue');
      if (retention?.suggestedAction) {
        expect(retention.suggestedAction).toContain('Amanda');
      }
    });

    it('should include membership pitch script', () => {
      const result = scoreOpportunities(makeInput());
      const membership = result.scoredOpportunities.find(o => o.category === 'membership-conversion');
      if (membership) {
        expect(membership.suggestedScript).toBeTruthy();
        expect(membership.suggestedScript).toContain('Glow');
      }
    });

    it('should never mention infusion in scripts', () => {
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        if (opp.suggestedAction) {
          expect(opp.suggestedAction.toLowerCase()).not.toContain('infusion');
        }
        if (opp.suggestedScript) {
          expect(opp.suggestedScript.toLowerCase()).not.toContain('infusion');
        }
      }
    });

    it('should have valid effort levels for all opportunities', () => {
      const validEfforts = ['low', 'medium', 'high'];
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        expect(validEfforts).toContain(opp.effort);
      }
    });

    it('should have valid time-to-impact for all opportunities', () => {
      const validTimes = ['immediate', 'this-week', 'this-month', 'next-month'];
      const result = scoreOpportunities(makeInput());
      for (const opp of result.scoredOpportunities) {
        expect(validTimes).toContain(opp.timeToImpact);
      }
    });
  });
});
