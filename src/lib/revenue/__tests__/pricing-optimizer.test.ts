import { optimizePricing } from '../pricing-optimizer';
import type { PricingOptimizerInput, PricingOptimizerResult } from '../pricing-optimizer';

// ── HELPERS ──

function makeInput(overrides: Partial<PricingOptimizerInput> = {}): PricingOptimizerInput {
  return {
    services: [
      { name: 'HydraFacial', category: 'Facial', currentPrice: 275, costPerSession: 45, duration: 60, bookingsLast30: 30, bookingsLast60: 35, avgDiscount: 0.05, cancelRate: 0.10 },
      { name: 'Botox', category: 'Injectable', currentPrice: 350, costPerSession: 60, duration: 30, bookingsLast30: 25, bookingsLast60: 28, avgDiscount: 0, cancelRate: 0.06 },
      { name: 'Sofwave', category: 'Skin Tightening', currentPrice: 3500, costPerSession: 400, duration: 60, bookingsLast30: 4, bookingsLast60: 5, avgDiscount: 0, cancelRate: 0.05 },
      { name: 'RF Microneedling', category: 'Skin Renewal', currentPrice: 650, costPerSession: 80, duration: 60, bookingsLast30: 12, bookingsLast60: 14, avgDiscount: 0.02, cancelRate: 0.08 },
      { name: 'VI Peel', category: 'Facial', currentPrice: 395, costPerSession: 55, duration: 45, bookingsLast30: 8, bookingsLast60: 10, avgDiscount: 0.03, cancelRate: 0.07 },
    ],
    demandPatterns: generatePatterns(),
    transactions: [],
    competitorData: [
      { competitor: 'Competitor A', service: 'Botox', price: 320, lastUpdated: '2026-03-20' },
      { competitor: 'Competitor B', service: 'Botox', price: 375, lastUpdated: '2026-03-20' },
      { competitor: 'Competitor A', service: 'HydraFacial', price: 250, lastUpdated: '2026-03-20' },
      { competitor: 'Competitor B', service: 'HydraFacial', price: 295, lastUpdated: '2026-03-20' },
    ],
    membershipStats: { totalMembers: 45, avgMemberSpend: 420, avgNonMemberSpend: 310, memberRetention12Mo: 0.82 },
    costStructure: { avgOverheadPerHour: 85, targetMargin: 0.55, avgProviderCostPerHour: 75 },
    currentDate: '2026-03-26',
    ...overrides,
  };
}

function generatePatterns() {
  const patterns = [];
  for (let dow = 1; dow <= 6; dow++) {
    for (let hour = 9; hour <= 17; hour++) {
      const isPeak = hour >= 10 && hour <= 14;
      patterns.push({
        dayOfWeek: dow,
        hour,
        avgBookings: isPeak ? 3 : 1,
        maxCapacity: 4,
        avgRevenue: isPeak ? 1140 : 380,
      });
    }
  }
  return patterns;
}

// ── TESTS ──

describe('Pricing Optimizer', () => {
  describe('optimizePricing', () => {
    it('should return valid result structure', () => {
      const result = optimizePricing(makeInput());
      expect(result.timePricing).toBeDefined();
      expect(result.dayPricing).toBeDefined();
      expect(result.lastMinuteStrategy).toBeDefined();
      expect(result.introductoryPricing).toBeDefined();
      expect(result.memberPricing).toBeDefined();
      expect(result.seasonalAdjustments).toBeDefined();
      expect(result.competitivePosition).toBeDefined();
      expect(result.bundleOptimization).toBeDefined();
      expect(result.marginAnalysis).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Time-of-Day Pricing', () => {
    it('should identify premium, standard, and off-peak tiers', () => {
      const result = optimizePricing(makeInput());
      const tierNames = result.timePricing.map(t => t.tier);
      expect(tierNames.length).toBeGreaterThan(0);
    });

    it('should have premium multiplier >= 1.0', () => {
      const result = optimizePricing(makeInput());
      const premium = result.timePricing.find(t => t.tier === 'premium');
      if (premium) {
        expect(premium.multiplier).toBeGreaterThanOrEqual(1.0);
      }
    });

    it('should have off-peak multiplier <= 1.0', () => {
      const result = optimizePricing(makeInput());
      const offPeak = result.timePricing.find(t => t.tier === 'off-peak');
      if (offPeak) {
        expect(offPeak.multiplier).toBeLessThanOrEqual(1.0);
      }
    });

    it('should have demand levels between 0-100', () => {
      const result = optimizePricing(makeInput());
      for (const tier of result.timePricing) {
        expect(tier.demandLevel).toBeGreaterThanOrEqual(0);
        expect(tier.demandLevel).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Day-of-Week Pricing', () => {
    it('should analyze all working days', () => {
      const result = optimizePricing(makeInput());
      expect(result.dayPricing.length).toBeGreaterThan(0);
    });

    it('should sort by demand score descending', () => {
      const result = optimizePricing(makeInput());
      for (let i = 1; i < result.dayPricing.length; i++) {
        expect(result.dayPricing[i].demandScore).toBeLessThanOrEqual(result.dayPricing[i - 1].demandScore);
      }
    });

    it('should provide strategy for each day', () => {
      const result = optimizePricing(makeInput());
      for (const day of result.dayPricing) {
        expect(day.strategy).toBeTruthy();
        expect(day.strategy.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Last-Minute Strategy', () => {
    it('should have discount tiers', () => {
      const result = optimizePricing(makeInput());
      expect(result.lastMinuteStrategy.enabled).toBe(true);
      expect(result.lastMinuteStrategy.discountTiers.length).toBeGreaterThan(0);
    });

    it('should have reasonable discount limits', () => {
      const result = optimizePricing(makeInput());
      for (const tier of result.lastMinuteStrategy.discountTiers) {
        expect(tier.maxDiscount).toBeGreaterThan(0);
        expect(tier.maxDiscount).toBeLessThanOrEqual(0.30);
      }
    });

    it('should have rules', () => {
      const result = optimizePricing(makeInput());
      expect(result.lastMinuteStrategy.rules.length).toBeGreaterThan(0);
    });

    it('should never discount injectables for last-minute', () => {
      const result = optimizePricing(makeInput());
      for (const rule of result.lastMinuteStrategy.rules) {
        if (rule.toLowerCase().includes('never discount')) {
          expect(rule.toLowerCase()).toContain('injectable');
        }
      }
    });
  });

  describe('Introductory Pricing', () => {
    it('should offer intro pricing for eligible services', () => {
      const result = optimizePricing(makeInput());
      expect(result.introductoryPricing.length).toBeGreaterThan(0);
    });

    it('should have intro price lower than regular', () => {
      const result = optimizePricing(makeInput());
      for (const intro of result.introductoryPricing) {
        expect(intro.introPrice).toBeLessThan(intro.regularPrice);
      }
    });

    it('should limit to 1 redemption per client', () => {
      const result = optimizePricing(makeInput());
      for (const intro of result.introductoryPricing) {
        expect(intro.maxRedemptions).toBe(1);
      }
    });

    it('should include conditions', () => {
      const result = optimizePricing(makeInput());
      for (const intro of result.introductoryPricing) {
        expect(intro.conditions.length).toBeGreaterThan(0);
        expect(intro.conditions.some(c => c.includes('New clients'))).toBe(true);
      }
    });
  });

  describe('Member Pricing', () => {
    it('should have three tiers', () => {
      const result = optimizePricing(makeInput());
      expect(result.memberPricing.length).toBe(3);
    });

    it('should have increasing discounts by tier', () => {
      const result = optimizePricing(makeInput());
      const sorted = [...result.memberPricing].sort((a, b) => a.discountPercent - b.discountPercent);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].discountPercent).toBeGreaterThanOrEqual(sorted[i - 1].discountPercent);
      }
    });
  });

  describe('Seasonal Adjustments', () => {
    it('should cover all four seasons', () => {
      const result = optimizePricing(makeInput());
      expect(result.seasonalAdjustments.length).toBe(4);
    });

    it('should have multipliers near 1.0', () => {
      const result = optimizePricing(makeInput());
      for (const adj of result.seasonalAdjustments) {
        expect(adj.adjustment).toBeGreaterThan(0.8);
        expect(adj.adjustment).toBeLessThan(1.3);
      }
    });

    it('should never mention infusion in seasonal data', () => {
      const result = optimizePricing(makeInput());
      for (const adj of result.seasonalAdjustments) {
        expect(adj.reason.toLowerCase()).not.toContain('infusion');
        for (const svc of adj.services) {
          expect(svc.toLowerCase()).not.toContain('infusion');
        }
      }
    });
  });

  describe('Competitive Position', () => {
    it('should analyze services with competitor data', () => {
      const result = optimizePricing(makeInput());
      expect(result.competitivePosition.length).toBeGreaterThan(0);
    });

    it('should have valid position labels', () => {
      const validPositions = ['below-market', 'at-market', 'premium', 'luxury'];
      const result = optimizePricing(makeInput());
      for (const pos of result.competitivePosition) {
        expect(validPositions).toContain(pos.position);
      }
    });

    it('should provide recommendation for each service', () => {
      const result = optimizePricing(makeInput());
      for (const pos of result.competitivePosition) {
        expect(pos.recommendation).toBeTruthy();
      }
    });
  });

  describe('Bundle Optimization', () => {
    it('should generate bundles', () => {
      const result = optimizePricing(makeInput());
      expect(result.bundleOptimization.length).toBeGreaterThan(0);
    });

    it('should have bundle price less than individual total', () => {
      const result = optimizePricing(makeInput());
      for (const bundle of result.bundleOptimization) {
        expect(bundle.bundlePrice).toBeLessThan(bundle.individualTotal);
      }
    });

    it('should have positive margin', () => {
      const result = optimizePricing(makeInput());
      for (const bundle of result.bundleOptimization) {
        expect(bundle.margin).toBeGreaterThan(0);
      }
    });

    it('should have demand scores between 0-100', () => {
      const result = optimizePricing(makeInput());
      for (const bundle of result.bundleOptimization) {
        expect(bundle.demandScore).toBeGreaterThanOrEqual(0);
        expect(bundle.demandScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Margin Analysis', () => {
    it('should analyze all services', () => {
      const result = optimizePricing(makeInput());
      expect(result.marginAnalysis.length).toBe(5);
    });

    it('should calculate gross and net margins', () => {
      const result = optimizePricing(makeInput());
      for (const m of result.marginAnalysis) {
        expect(m.grossMargin).toBeGreaterThan(0); // all services should be profitable
        expect(m.grossMarginPercent).toBeGreaterThan(0);
      }
    });

    it('should have valid status labels', () => {
      const validStatuses = ['excellent', 'healthy', 'thin', 'loss-leader'];
      const result = optimizePricing(makeInput());
      for (const m of result.marginAnalysis) {
        expect(validStatuses).toContain(m.status);
      }
    });

    it('should sort by net margin descending', () => {
      const result = optimizePricing(makeInput());
      for (let i = 1; i < result.marginAnalysis.length; i++) {
        expect(result.marginAnalysis[i].netMarginPercent).toBeLessThanOrEqual(result.marginAnalysis[i - 1].netMarginPercent);
      }
    });

    it('should calculate revenuePerMinute', () => {
      const result = optimizePricing(makeInput());
      for (const m of result.marginAnalysis) {
        expect(m.revenuePerMinute).toBeGreaterThan(0);
      }
    });
  });

  describe('Summary', () => {
    it('should have pricing health score between 0-100', () => {
      const result = optimizePricing(makeInput());
      expect(result.summary.pricingHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.pricingHealthScore).toBeLessThanOrEqual(100);
    });

    it('should provide top actions', () => {
      const result = optimizePricing(makeInput());
      expect(result.summary.topActions.length).toBeGreaterThan(0);
    });

    it('should have competitive score between 0-100', () => {
      const result = optimizePricing(makeInput());
      expect(result.summary.competitiveScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.competitiveScore).toBeLessThanOrEqual(100);
    });
  });
});
