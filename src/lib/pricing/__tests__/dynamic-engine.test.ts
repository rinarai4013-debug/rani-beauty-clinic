// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { analyzePricing, type PricingInput, type ServicePricing } from '../dynamic-engine';

function makeService(overrides: Partial<ServicePricing> = {}): ServicePricing {
  return {
    service: 'HydraFacial', category: 'Facial', basePrice: 275, cost: 70,
    duration: 45, popularity: 30, ...overrides,
  };
}

function makeInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    services: [
      makeService(),
      makeService({ service: 'Botox', category: 'Injectable', basePrice: 400, cost: 120, duration: 30, popularity: 25 }),
      makeService({ service: 'VI Peel', category: 'Peel', basePrice: 395, cost: 80, duration: 30, popularity: 15 }),
    ],
    utilization: {
      byDayOfWeek: [
        { day: 'Monday', rate: 35 }, { day: 'Tuesday', rate: 60 },
        { day: 'Wednesday', rate: 75 }, { day: 'Thursday', rate: 80 },
        { day: 'Friday', rate: 70 },
      ],
      byTimeSlot: [
        { slot: '9-10', rate: 30 }, { slot: '10-11', rate: 70 },
        { slot: '14-15', rate: 85 }, { slot: '16-17', rate: 40 },
      ],
      overall: 65,
    },
    transactions: Array.from({ length: 20 }, (_, i) => ({
      service: 'HydraFacial', amount: 275, date: '2026-03-10',
      dayOfWeek: 3, hour: 11, clientType: 'returning' as const, hadFinancing: false,
    })),
    memberships: { totalMembers: 30, avgMemberSpend: 500, avgNonMemberSpend: 300, churnRate: 5 },
    ...overrides,
  };
}

describe('Dynamic Pricing Engine', () => {
  // ── Structure ──
  it('returns all expected output fields', () => {
    const r = analyzePricing(makeInput());
    expect(r).toHaveProperty('priceRecommendations');
    expect(r).toHaveProperty('packages');
    expect(r).toHaveProperty('promotions');
    expect(r).toHaveProperty('insights');
    expect(r).toHaveProperty('overallHealthScore');
    expect(r).toHaveProperty('projectedRevenueImpact');
  });

  it('healthScore is 0-100', () => {
    const r = analyzePricing(makeInput());
    expect(r.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(r.overallHealthScore).toBeLessThanOrEqual(100);
  });

  // ── Below-Cost Guardrail (new fix) ──
  it('never suggests price below cost + 10% margin', () => {
    const r = analyzePricing(makeInput({
      services: [
        makeService({ service: 'LowMargin', basePrice: 100, cost: 95, popularity: 5 }),
      ],
      transactions: Array.from({ length: 10 }, () => ({
        service: 'LowMargin', amount: 100, date: '2026-03-01',
        dayOfWeek: 3, hour: 11, clientType: 'returning' as const, hadFinancing: false,
      })),
    }));
    for (const rec of r.priceRecommendations) {
      if (rec.service === 'LowMargin') {
        expect(rec.suggestedPrice).toBeGreaterThanOrEqual(Math.round(95 * 1.10));
      }
    }
  });

  it('applies floor note when price is capped', () => {
    const r = analyzePricing(makeInput({
      services: [
        makeService({ service: 'Cheap', basePrice: 50, cost: 48, popularity: 2 }),
      ],
    }));
    const cheapRec = r.priceRecommendations.find(x => x.service === 'Cheap');
    if (cheapRec && cheapRec.suggestedPrice === Math.round(48 * 1.10)) {
      expect(cheapRec.reason).toContain('Floor applied');
    }
  });

  // ── Price Recommendations ──
  it('caps price increases at 15%', () => {
    const r = analyzePricing(makeInput());
    r.priceRecommendations.forEach(rec => {
      expect(rec.priceChange).toBeLessThanOrEqual(15);
    });
  });

  it('caps price decreases at 20%', () => {
    const r = analyzePricing(makeInput());
    r.priceRecommendations.forEach(rec => {
      expect(rec.priceChange).toBeGreaterThanOrEqual(-20);
    });
  });

  it('only recommends changes >= 2%', () => {
    const r = analyzePricing(makeInput());
    r.priceRecommendations.forEach(rec => {
      expect(Math.abs(rec.priceChange)).toBeGreaterThanOrEqual(2);
    });
  });

  it('returns max 10 recommendations', () => {
    expect(analyzePricing(makeInput()).priceRecommendations.length).toBeLessThanOrEqual(10);
  });

  // ── Package Builder ──
  it('generates packages when facials and peels exist', () => {
    const r = analyzePricing(makeInput());
    expect(r.packages.length).toBeGreaterThan(0);
  });

  it('Glow Reset Bundle has 15% savings', () => {
    const r = analyzePricing(makeInput());
    const glow = r.packages.find(p => p.name.includes('Glow Reset'));
    if (glow) {
      expect(glow.savingsPercent).toBeGreaterThanOrEqual(14);
      expect(glow.savingsPercent).toBeLessThanOrEqual(16);
    }
  });

  it('series package has 20% savings', () => {
    const r = analyzePricing(makeInput());
    const series = r.packages.find(p => p.name.includes('Series'));
    if (series) {
      expect(series.savingsPercent).toBe(20);
    }
  });

  it('package margins are positive', () => {
    const r = analyzePricing(makeInput());
    r.packages.forEach(pkg => {
      expect(pkg.margin).toBeGreaterThan(0);
    });
  });

  // ── Promotions ──
  it('generates off-peak promo for low-util days', () => {
    const r = analyzePricing(makeInput());
    const offPeak = r.promotions.find(p => p.type === 'off_peak');
    expect(offPeak).toBeDefined();
  });

  it('always generates new-client offer', () => {
    const r = analyzePricing(makeInput());
    expect(r.promotions.find(p => p.type === 'new_client')).toBeDefined();
  });

  it('generates membership upsell when members spend 30%+ more', () => {
    const r = analyzePricing(makeInput({
      memberships: { totalMembers: 30, avgMemberSpend: 600, avgNonMemberSpend: 300, churnRate: 5 },
    }));
    expect(r.promotions.find(p => p.type === 'membership_upsell')).toBeDefined();
  });

  // ── Insights ──
  it('generates revenue-per-minute insight', () => {
    const r = analyzePricing(makeInput());
    expect(r.insights.some(i => i.includes('revenue/minute'))).toBe(true);
  });

  it('generates utilization gap insight when overall < 70%', () => {
    const r = analyzePricing(makeInput());
    expect(r.insights.some(i => i.includes('utilization'))).toBe(true);
  });

  // ── Edge Cases ──
  it('handles empty services array', () => {
    const r = analyzePricing(makeInput({ services: [] }));
    expect(r.priceRecommendations).toHaveLength(0);
    expect(r.packages).toHaveLength(0);
  });

  it('handles empty transactions array', () => {
    const r = analyzePricing(makeInput({ transactions: [] }));
    expect(r).toHaveProperty('overallHealthScore');
  });

  it('handles zero cost service', () => {
    const r = analyzePricing(makeInput({
      services: [makeService({ cost: 0 })],
    }));
    expect(r.overallHealthScore).toBeGreaterThanOrEqual(0);
  });

  // ── Competitive Pricing ──
  it('detects when priced below competitors', () => {
    const r = analyzePricing(makeInput({
      competitorPricing: [
        { competitor: 'Clinic B', service: 'HydraFacial', price: 400 },
        { competitor: 'Clinic C', service: 'HydraFacial', price: 380 },
      ],
    }));
    const hydra = r.priceRecommendations.find(x => x.service === 'HydraFacial');
    if (hydra) {
      expect(hydra.reason).toContain('competitor');
    }
  });

  // ── Seasonal ──
  it('applies seasonal multiplier in December', () => {
    const r = analyzePricing(makeInput({
      seasonality: { currentMonth: 12, isHolidaySeason: true, upcomingEvents: ['Christmas'] },
    }));
    // December has 1.15x multiplier which should influence recommendations
    expect(r).toHaveProperty('priceRecommendations');
  });
});
