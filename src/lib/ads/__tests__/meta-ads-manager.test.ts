// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { analyzeMetaAds, type MetaAdsInput, type Ad, type Campaign, type AdSet } from '../meta-ads-manager';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1', name: 'HydraFacial Campaign', status: 'active',
    objective: 'conversions', budget: 2000, spent: 1500,
    startDate: '2026-02-01', ...overrides,
  };
}

function makeAdSet(overrides: Partial<AdSet> = {}): AdSet {
  return {
    id: 'as1', campaignId: 'c1', name: 'Women 25-45 Renton', budget: 1000, spent: 800, status: 'active',
    targeting: { ageMin: 25, ageMax: 45, genders: ['female'], locations: ['Renton, WA'], interests: ['skincare'], radius: 15 },
    ...overrides,
  };
}

function makeAd(overrides: Partial<Ad> = {}): Ad {
  return {
    id: 'ad1', adSetId: 'as1', name: 'HydraFacial Glow', type: 'image',
    headline: 'Get Your Glow On', body: 'Book now', callToAction: 'Book Now',
    createdDate: '2026-02-15', status: 'active',
    metrics: {
      impressions: 10000, reach: 8000, clicks: 200, ctr: 2.0,
      cpc: 4.0, leads: 20, cpl: 40, conversions: 10, cpa: 80,
      spent: 800, revenue: 2750, roas: 3.44, frequency: 1.5,
    },
    ...overrides,
  };
}

function makeInput(overrides: Partial<MetaAdsInput> = {}): MetaAdsInput {
  return {
    campaigns: [makeCampaign()],
    adSets: [makeAdSet()],
    ads: [makeAd()],
    monthlyBudget: 3000,
    targetCPA: 100,
    targetROAS: 3.0,
    services: [
      { service: 'HydraFacial', avgBookingValue: 275, ltv: 2000, targetAudience: 'Women 25-45', bestPerformingAngle: 'Instant glow' },
    ],
    ...overrides,
  };
}

describe('Meta Ads AI Manager', () => {
  // ── Structure ──
  it('returns all expected fields', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r).toHaveProperty('performanceSummary');
    expect(r).toHaveProperty('campaignAnalysis');
    expect(r).toHaveProperty('optimizations');
    expect(r).toHaveProperty('adCopyVariants');
    expect(r).toHaveProperty('budgetRecommendations');
    expect(r).toHaveProperty('audienceInsights');
    expect(r).toHaveProperty('creativeFatigue');
    expect(r).toHaveProperty('funnelAnalysis');
    expect(r).toHaveProperty('adScore');
    expect(r).toHaveProperty('projectedROAS');
  });

  it('adScore is 0-100', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.adScore).toBeGreaterThanOrEqual(0);
    expect(r.adScore).toBeLessThanOrEqual(100);
  });

  // ── Performance Summary ──
  it('calculates total spent and revenue', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.performanceSummary.totalSpent).toBe(800);
    expect(r.performanceSummary.totalRevenue).toBe(2750);
  });

  it('calculates ROAS correctly', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.performanceSummary.overallROAS).toBeCloseTo(3.44, 1);
  });

  it('calculates budget utilization', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.performanceSummary.budgetUtilization).toBeGreaterThan(0);
  });

  it('compares ROAS vs target', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.performanceSummary.vsTarget.roasVsTarget).toBeGreaterThan(0); // Above 3.0 target
  });

  // ── Campaign Analysis ──
  it('grades campaign performance', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.campaignAnalysis).toHaveLength(1);
    expect(['excellent', 'good', 'average', 'poor', 'critical']).toContain(r.campaignAnalysis[0].performance);
  });

  it('marks ROAS >= 5.0 as excellent', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, revenue: 5000, roas: 6.25 } })],
    }));
    expect(r.campaignAnalysis[0].performance).toBe('excellent');
  });

  it('marks ROAS < 1.0 as critical', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, revenue: 500, spent: 800, roas: 0.625 } })],
    }));
    expect(r.campaignAnalysis[0].performance).toBe('critical');
  });

  // ── Optimizations ──
  it('recommends pausing ads with ROAS < 1.0 and spend > $50', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, roas: 0.5, spent: 100 } })],
    }));
    expect(r.optimizations.some(o => o.type === 'pause')).toBe(true);
  });

  it('recommends scaling excellent campaigns', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, revenue: 5000, roas: 6.25 } })],
    }));
    expect(r.optimizations.some(o => o.type === 'scale')).toBe(true);
  });

  it('recommends refresh for high-frequency ads', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, frequency: 5.0 } })],
    }));
    expect(r.optimizations.some(o => o.type === 'refresh_creative')).toBe(true);
  });

  // ── Ad Copy Variants ──
  it('generates ad copy variants', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.adCopyVariants.length).toBeGreaterThan(0);
    expect(r.adCopyVariants[0]).toHaveProperty('headline');
    expect(r.adCopyVariants[0]).toHaveProperty('primaryText');
    expect(r.adCopyVariants[0]).toHaveProperty('callToAction');
  });

  it('ad copy mentions Rani Beauty Clinic', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.adCopyVariants.some(v => v.primaryText.includes('Rani Beauty Clinic'))).toBe(true);
  });

  it('estimates CTR for variants', () => {
    const r = analyzeMetaAds(makeInput());
    r.adCopyVariants.forEach(v => {
      expect(v.estimatedCTR).toBeGreaterThan(0);
    });
  });

  // ── Budget Recommendations ──
  it('recommends budget increase for excellent campaigns', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, revenue: 5000, roas: 6.25 } })],
    }));
    const budgetRec = r.budgetRecommendations.find(b => b.campaignId === 'c1');
    if (budgetRec) {
      expect(budgetRec.recommendedBudget).toBeGreaterThan(budgetRec.currentBudget);
    }
  });

  it('recommends budget cut for poor campaigns', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, revenue: 900, spent: 800, roas: 1.125 } })],
    }));
    const budgetRec = r.budgetRecommendations.find(b => b.campaignId === 'c1');
    if (budgetRec) {
      expect(budgetRec.recommendedBudget).toBeLessThan(budgetRec.currentBudget);
    }
  });

  // ── Creative Fatigue ──
  it('detects creative fatigue (frequency > 4)', () => {
    const r = analyzeMetaAds(makeInput({
      ads: [makeAd({ metrics: { ...makeAd().metrics, frequency: 5.5 } })],
    }));
    expect(r.creativeFatigue.length).toBeGreaterThan(0);
  });

  it('no fatigue with low frequency', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.creativeFatigue).toHaveLength(0);
  });

  // ── Funnel Analysis ──
  it('returns 4 funnel stages', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.funnelAnalysis).toHaveLength(4);
    expect(r.funnelAnalysis.map(f => f.stage)).toEqual(['Impressions', 'Clicks', 'Leads', 'Bookings']);
  });

  it('funnel counts are consistent', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.funnelAnalysis[0].count).toBeGreaterThanOrEqual(r.funnelAnalysis[1].count);
    expect(r.funnelAnalysis[1].count).toBeGreaterThanOrEqual(r.funnelAnalysis[2].count);
  });

  // ── Edge Cases ──
  it('handles empty ads array', () => {
    const r = analyzeMetaAds(makeInput({ ads: [] }));
    expect(r.performanceSummary.totalSpent).toBe(0);
    expect(r.performanceSummary.overallROAS).toBe(0);
  });

  it('handles zero budget', () => {
    const r = analyzeMetaAds(makeInput({ monthlyBudget: 0 }));
    expect(r.performanceSummary.budgetUtilization).toBe(0);
  });

  it('handles paused campaigns', () => {
    const r = analyzeMetaAds(makeInput({
      campaigns: [makeCampaign({ status: 'paused' })],
    }));
    expect(r.campaignAnalysis[0].status).toBe('paused');
  });

  // ── Projected ROAS ──
  it('projects ROAS > 0 when current ROAS > 0', () => {
    const r = analyzeMetaAds(makeInput());
    expect(r.projectedROAS).toBeGreaterThan(0);
  });
});
