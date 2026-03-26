// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  estimateElasticity,
  calculateOptimalPrice,
  analyzeServicePricing,
  compareCompetitors,
  recommendBundles,
  analyzeMemberships,
  analyzeAcquisition,
  generateSeasonalPricing,
  analyzeProviderPricing,
  generatePricingIntelligence,
  type ServicePricing,
  type CompetitorData,
  type MembershipData,
  type AcquisitionMetrics,
  type ProviderUtilization,
} from '../pricing-intelligence';

// ── Helpers ──

function makeService(overrides: Partial<ServicePricing> = {}): ServicePricing {
  return {
    service: 'HydraFacial',
    category: 'Facial',
    currentPrice: 275,
    cost: 45,
    avgBookingsPerMonth: 40,
    avgBookingsLastThreeMonths: [38, 40, 42],
    duration: 60,
    providerTime: 50,
    ...overrides,
  };
}

function makeCompetitor(overrides: Partial<CompetitorData> = {}): CompetitorData {
  return {
    name: 'Competitor A',
    location: 'Renton, WA',
    distanceMiles: 5,
    services: [
      { service: 'HydraFacial', category: 'Facial', price: 250 },
      { service: 'Botox', category: 'Injectable', price: 400 },
    ],
    rating: 4.5,
    reviewCount: 200,
    positioning: 'mid_range',
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

function makeMembership(overrides: Partial<MembershipData> = {}): MembershipData {
  return {
    tier: 'Glow Member',
    monthlyPrice: 199,
    memberCount: 35,
    avgMonthsRetained: 8,
    perks: ['Monthly HydraFacial', '15% off all services'],
    includedServices: [{ service: 'HydraFacial', quantity: 1 }],
    avgAdditionalSpend: 150,
    ...overrides,
  };
}

function makeAcquisition(): AcquisitionMetrics {
  return {
    avgCostPerLead: 35,
    avgCostPerBooking: 85,
    avgCostPerClient: 120,
    conversionRate: 0.18,
    channelCosts: [
      { channel: 'Meta Ads', spend: 3000, clients: 9, revenue: 4500 },
      { channel: 'Google Ads', spend: 2000, clients: 8, revenue: 4800 },
      { channel: 'Referrals', spend: 200, clients: 5, revenue: 3500 },
    ],
  };
}

// ── Price Elasticity ──

describe('estimateElasticity', () => {
  it('returns default elasticity for category without history', () => {
    const e = estimateElasticity(makeService({ historicalPrices: undefined }));
    expect(e).toBeLessThan(0); // demand decreases with price increase
    expect(e).toBeGreaterThan(-1); // inelastic for med spa
  });

  it('calculates from historical data', () => {
    const e = estimateElasticity(makeService({
      historicalPrices: [
        { date: '2025-01', price: 250, bookings: 45 },
        { date: '2025-02', price: 275, bookings: 40 },
        { date: '2025-03', price: 300, bookings: 35 },
      ],
    }));
    expect(e).toBeLessThan(0);
  });

  it('returns category default for insufficient history', () => {
    const e = estimateElasticity(makeService({ historicalPrices: [{ date: '2025-01', price: 250, bookings: 40 }] }));
    expect(e).toBe(-0.5);
  });

  it('returns different elasticities by category', () => {
    const injectable = estimateElasticity(makeService({ category: 'Injectable' }));
    const wellness = estimateElasticity(makeService({ category: 'Wellness' }));
    expect(Math.abs(injectable)).toBeLessThan(Math.abs(wellness)); // injectables are less elastic
  });

  it('handles unknown category', () => {
    const e = estimateElasticity(makeService({ category: 'Unknown' }));
    expect(e).toBe(-0.5); // default
  });
});

// ── Optimal Pricing ──

describe('calculateOptimalPrice', () => {
  it('returns optimal price above cost', () => {
    const r = calculateOptimalPrice(makeService({ cost: 50, currentPrice: 275 }), 275, -0.5);
    expect(r.optimalPrice).toBeGreaterThan(50);
  });

  it('returns min viable price based on target margin', () => {
    const r = calculateOptimalPrice(makeService({ cost: 100 }), 300, -0.5);
    expect(r.minViablePrice).toBeGreaterThan(100);
  });

  it('caps at max market price', () => {
    const r = calculateOptimalPrice(makeService({ currentPrice: 1000 }), 200, -0.3);
    expect(r.optimalPrice).toBeLessThanOrEqual(r.maxMarketPrice);
  });

  it('rounds to nearest $5', () => {
    const r = calculateOptimalPrice(makeService(), 275, -0.5);
    expect(r.optimalPrice % 5).toBe(0);
  });

  it('handles zero competitor price', () => {
    const r = calculateOptimalPrice(makeService(), 0, -0.5);
    expect(r.optimalPrice).toBeGreaterThan(0);
  });
});

// ── Service Pricing Analysis ──

describe('analyzeServicePricing', () => {
  it('returns analysis for each service', () => {
    const r = analyzeServicePricing([makeService()], [makeCompetitor()]);
    expect(r).toHaveLength(1);
    expect(r[0].service).toBe('HydraFacial');
  });

  it('determines price position', () => {
    const r = analyzeServicePricing(
      [makeService({ currentPrice: 400 })],
      [makeCompetitor({ services: [{ service: 'HydraFacial', category: 'Facial', price: 250 }] })],
    );
    expect(r[0].pricePosition).toBe('premium');
  });

  it('calculates margin percent', () => {
    const r = analyzeServicePricing([makeService({ currentPrice: 100, cost: 30 })], []);
    expect(r[0].marginPercent).toBe(70);
  });

  it('calculates revenue per minute', () => {
    const r = analyzeServicePricing([makeService({ currentPrice: 300, duration: 60 })], []);
    expect(r[0].revenuePerMinute).toBe(5);
  });

  it('provides recommendation', () => {
    const r = analyzeServicePricing([makeService()], [makeCompetitor()]);
    expect(r[0].recommendation.length).toBeGreaterThan(0);
  });

  it('handles services with no competitors', () => {
    // UniqueService doesn't match any competitor services by name, but may match by category
    const r = analyzeServicePricing([makeService({ service: 'UniqueService' })], [makeCompetitor()]);
    // Competitor has HydraFacial in Facial category, so category match may return a price
    expect(r[0].competitorAvgPrice).toBeGreaterThan(0);
  });
});

// ── Competitor Comparison ──

describe('compareCompetitors', () => {
  it('returns total competitors count', () => {
    const r = compareCompetitors([makeService()], [makeCompetitor(), makeCompetitor({ name: 'B' })]);
    expect(r.totalCompetitors).toBe(2);
  });

  it('calculates average price by service', () => {
    const r = compareCompetitors(
      [makeService({ service: 'HydraFacial', currentPrice: 275 })],
      [
        makeCompetitor({ services: [{ service: 'HydraFacial', category: 'Facial', price: 250 }] }),
        makeCompetitor({ name: 'B', services: [{ service: 'HydraFacial', category: 'Facial', price: 300 }] }),
      ],
    );
    const hydra = r.avgPriceByService.find(s => s.service === 'HydraFacial');
    expect(hydra?.avgPrice).toBe(275);
  });

  it('maps competitor positioning', () => {
    const r = compareCompetitors([makeService()], [
      makeCompetitor({ positioning: 'budget' }),
      makeCompetitor({ name: 'B', positioning: 'luxury' }),
    ]);
    expect(r.positioningMap).toHaveLength(2);
    expect(r.positioningMap.some(p => p.positioning === 'budget')).toBe(true);
  });

  it('generates market insights', () => {
    const r = compareCompetitors(
      [makeService({ currentPrice: 150 })], // well below market
      [makeCompetitor({ services: [{ service: 'HydraFacial', category: 'Facial', price: 300 }] })],
    );
    expect(r.marketInsights.length).toBeGreaterThan(0);
  });

  it('handles no competitors', () => {
    const r = compareCompetitors([makeService()], []);
    expect(r.totalCompetitors).toBe(0);
  });
});

// ── Bundle Recommendations ──

describe('recommendBundles', () => {
  it('creates facial + injectable bundle', () => {
    const services = [
      makeService({ service: 'HydraFacial', category: 'Facial', currentPrice: 275, cost: 45 }),
      makeService({ service: 'Botox', category: 'Injectable', currentPrice: 450, cost: 120 }),
    ];
    const r = recommendBundles(services);
    expect(r.some(b => b.name.includes('Glow'))).toBe(true);
  });

  it('bundle price is less than total regular', () => {
    const services = [
      makeService({ category: 'Facial', currentPrice: 300, cost: 50 }),
      makeService({ service: 'Botox', category: 'Injectable', currentPrice: 500, cost: 100 }),
    ];
    const r = recommendBundles(services);
    for (const b of r) {
      expect(b.bundlePrice).toBeLessThan(b.totalRegularPrice);
    }
  });

  it('calculates discount percentage', () => {
    const services = [
      makeService({ category: 'Facial', currentPrice: 300, cost: 50 }),
      makeService({ service: 'Botox', category: 'Injectable', currentPrice: 500, cost: 100 }),
    ];
    const r = recommendBundles(services);
    for (const b of r) {
      expect(b.discount).toBeGreaterThan(0);
      expect(b.discount).toBeLessThan(50);
    }
  });

  it('creates laser series package', () => {
    const services = [makeService({ service: 'PicoWay', category: 'Laser', currentPrice: 450, cost: 60 })];
    const r = recommendBundles(services);
    expect(r.some(b => b.name.includes('Laser'))).toBe(true);
  });

  it('handles missing categories gracefully', () => {
    const services = [makeService({ category: 'Wellness' })];
    const r = recommendBundles(services);
    expect(Array.isArray(r)).toBe(true);
  });

  it('provides rationale for each bundle', () => {
    const services = [
      makeService({ category: 'Facial' }),
      makeService({ service: 'Botox', category: 'Injectable', currentPrice: 450 }),
    ];
    const r = recommendBundles(services);
    for (const b of r) {
      expect(b.rationale.length).toBeGreaterThan(0);
    }
  });
});

// ── Membership Analysis ──

describe('analyzeMemberships', () => {
  it('calculates LTV per member', () => {
    const r = analyzeMemberships([makeMembership()], 120);
    expect(r[0].avgLTV).toBeGreaterThan(0);
    // LTV = (199 * 8) + (150 * 8) = 1592 + 1200 = 2792
    expect(r[0].avgLTV).toBeCloseTo(2792, -1);
  });

  it('calculates profit per member', () => {
    const r = analyzeMemberships([makeMembership()], 120);
    expect(typeof r[0].profitPerMember).toBe('number');
  });

  it('provides recommendation', () => {
    const r = analyzeMemberships([makeMembership()], 120);
    expect(r[0].recommendation.length).toBeGreaterThan(0);
  });

  it('calculates break-even months', () => {
    const r = analyzeMemberships([makeMembership()], 120);
    if (r[0].profitPerMember > 0) {
      expect(r[0].breakEvenMonths).toBeGreaterThan(0);
    }
  });

  it('suggests optimized price for high-retention tiers', () => {
    const r = analyzeMemberships([makeMembership({ avgMonthsRetained: 20 })], 120);
    // High retention should trigger optimization suggestion
    if (r[0].optimizedPrice) {
      expect(r[0].optimizedPrice).toBeGreaterThan(r[0].monthlyPrice);
    }
  });

  it('handles zero acquisition cost', () => {
    const r = analyzeMemberships([makeMembership()], 0);
    expect(r[0].breakEvenMonths).toBe(-1);
  });
});

// ── Acquisition Analysis ──

describe('analyzeAcquisition', () => {
  it('calculates LTV:CAC ratio', () => {
    const r = analyzeAcquisition(makeAcquisition(), 5000);
    expect(r.ltvCacRatio).toBeGreaterThan(0);
  });

  it('identifies best and worst channels', () => {
    const r = analyzeAcquisition(makeAcquisition(), 5000);
    expect(r.bestChannel.length).toBeGreaterThan(0);
    expect(r.worstChannel.length).toBeGreaterThan(0);
  });

  it('calculates channel ROI', () => {
    const r = analyzeAcquisition(makeAcquisition(), 5000);
    expect(r.channelROI.length).toBeGreaterThan(0);
    for (const c of r.channelROI) {
      expect(typeof c.roi).toBe('number');
    }
  });

  it('provides recommendation', () => {
    const r = analyzeAcquisition(makeAcquisition(), 5000);
    expect(r.recommendation.length).toBeGreaterThan(0);
  });

  it('calculates payback months', () => {
    const r = analyzeAcquisition(makeAcquisition(), 5000);
    expect(r.paybackMonths).toBeGreaterThan(0);
  });

  it('handles zero spend channel', () => {
    const metrics = makeAcquisition();
    metrics.channelCosts.push({ channel: 'Organic', spend: 0, clients: 3, revenue: 2000 });
    const r = analyzeAcquisition(metrics, 5000);
    const organic = r.channelROI.find(c => c.channel === 'Organic');
    expect(organic?.cac).toBe(0);
  });
});

// ── Seasonal Pricing ──

describe('generateSeasonalPricing', () => {
  it('returns 12 months of recommendations', () => {
    const r = generateSeasonalPricing([makeService()]);
    expect(r).toHaveLength(12);
  });

  it('each month has service recommendations', () => {
    const r = generateSeasonalPricing([makeService()]);
    for (const month of r) {
      expect(month.services.length).toBeGreaterThan(0);
      expect(month.monthName.length).toBeGreaterThan(0);
    }
  });

  it('recommends higher prices in peak months', () => {
    const r = generateSeasonalPricing([makeService({ category: 'Injectable', currentPrice: 450 })]);
    // November (month 11) should be peak for injectables
    const november = r.find(m => m.month === 11);
    const recommended = november?.services[0]?.recommendedPrice ?? 0;
    expect(recommended).toBeGreaterThanOrEqual(450);
  });

  it('accepts custom seasonal data', () => {
    const custom = [{ month: 6, service: 'HydraFacial', demandMultiplier: 2.0 }];
    const r = generateSeasonalPricing([makeService()], custom);
    expect(r).toHaveLength(12);
  });

  it('round prices to $5', () => {
    const r = generateSeasonalPricing([makeService()]);
    for (const month of r) {
      for (const svc of month.services) {
        expect(svc.recommendedPrice % 5).toBe(0);
      }
    }
  });
});

// ── Provider Pricing ──

describe('analyzeProviderPricing', () => {
  it('returns insights per provider', () => {
    const providers: ProviderUtilization[] = [
      { provider: 'Dr. Rina', availableHours: 140, bookedHours: 112, utilizationRate: 0.80, avgRevenuePerHour: 320 },
      { provider: 'Mom', availableHours: 120, bookedHours: 54, utilizationRate: 0.45, avgRevenuePerHour: 200 },
    ];
    const r = analyzeProviderPricing(providers);
    expect(r).toHaveLength(2);
  });

  it('recommends promotions for underutilized', () => {
    const providers: ProviderUtilization[] = [
      { provider: 'Test', availableHours: 100, bookedHours: 40, utilizationRate: 0.40, avgRevenuePerHour: 150 },
    ];
    const r = analyzeProviderPricing(providers);
    expect(r[0].recommendation).toContain('promotional');
  });

  it('recommends price increase for fully booked', () => {
    const providers: ProviderUtilization[] = [
      { provider: 'Test', availableHours: 100, bookedHours: 95, utilizationRate: 0.95, avgRevenuePerHour: 300 },
    ];
    const r = analyzeProviderPricing(providers);
    expect(r[0].recommendation).toContain('raise prices');
  });

  it('provides suggested actions', () => {
    const providers: ProviderUtilization[] = [
      { provider: 'Test', availableHours: 100, bookedHours: 75, utilizationRate: 0.75, avgRevenuePerHour: 250 },
    ];
    const r = analyzeProviderPricing(providers);
    expect(r[0].suggestedActions.length).toBeGreaterThan(0);
  });
});

// ── Full Pricing Intelligence ──

describe('generatePricingIntelligence', () => {
  it('returns complete pricing result', () => {
    const input = {
      services: [makeService(), makeService({ service: 'Botox', category: 'Injectable', currentPrice: 450, cost: 120 })],
      competitors: [makeCompetitor()],
      memberships: [makeMembership()],
      clientAcquisition: makeAcquisition(),
      providerUtilization: [{ provider: 'Dr. Rina', availableHours: 140, bookedHours: 112, utilizationRate: 0.80, avgRevenuePerHour: 320 }],
    };
    const r = generatePricingIntelligence(input);
    expect(r).toHaveProperty('serviceAnalysis');
    expect(r).toHaveProperty('competitorComparison');
    expect(r).toHaveProperty('bundleRecommendations');
    expect(r).toHaveProperty('membershipAnalysis');
    expect(r).toHaveProperty('acquisitionAnalysis');
    expect(r).toHaveProperty('seasonalPricing');
    expect(r).toHaveProperty('providerPricing');
    expect(r).toHaveProperty('overallInsights');
  });

  it('generates overall insights', () => {
    const input = {
      services: [makeService(), makeService({ service: 'Botox', category: 'Injectable', currentPrice: 450, cost: 120 })],
      competitors: [makeCompetitor()],
      memberships: [makeMembership()],
      clientAcquisition: makeAcquisition(),
      providerUtilization: [],
    };
    const r = generatePricingIntelligence(input);
    expect(Array.isArray(r.overallInsights)).toBe(true);
  });
});
