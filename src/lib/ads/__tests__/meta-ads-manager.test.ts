import { describe, it, expect } from 'vitest';
import { analyzeMetaAds, type MetaAdsInput } from '../meta-ads-manager';

function buildInput(overrides: Partial<MetaAdsInput> = {}): MetaAdsInput {
  return {
    campaigns: [
      {
        id: 'camp1',
        name: 'Spring Botox',
        status: 'active',
        objective: 'conversions',
        budget: 1500,
        spent: 500,
        startDate: '2026-03-01',
      },
    ],
    adSets: [
      {
        id: 'adset1',
        campaignId: 'camp1',
        name: 'Women 25-44',
        status: 'active',
        budget: 1500,
        spent: 500,
        targeting: {
          ageMin: 25,
          ageMax: 44,
          genders: ['female'],
          interests: ['skincare'],
          locations: ['Renton, WA'],
          radius: 15,
        },
      },
    ],
    ads: [
      {
        id: 'ad1',
        adSetId: 'adset1',
        name: 'Botox Spring Ad',
        type: 'image',
        status: 'active',
        headline: 'Spring Refresh',
        body: 'Book your Botox appointment',
        callToAction: 'Book Now',
        createdDate: '2026-03-01',
        metrics: {
          impressions: 10000,
          reach: 8000,
          clicks: 300,
          ctr: 3.0,
          cpc: 1.67,
          spent: 500,
          leads: 15,
          cpl: 33,
          conversions: 5,
          cpa: 100,
          revenue: 2500,
          roas: 5.0,
          frequency: 2.5,
        },
      },
    ],
    services: [
      {
        service: 'Botox',
        avgBookingValue: 500,
        ltv: 3000,
        targetAudience: 'Women 25-55',
        bestPerformingAngle: 'anti-aging',
      },
    ],
    historicalMetrics: [],
    monthlyBudget: 2000,
    targetROAS: 4.0,
    targetCPA: 120,
    ...overrides,
  };
}

describe('analyzeMetaAds', () => {
  it('returns all expected result keys', () => {
    const result = analyzeMetaAds(buildInput());
    expect(result).toHaveProperty('performanceSummary');
    expect(result).toHaveProperty('campaignAnalysis');
    expect(result).toHaveProperty('optimizations');
    expect(result).toHaveProperty('adCopyVariants');
    expect(result).toHaveProperty('budgetRecommendations');
    expect(result).toHaveProperty('audienceInsights');
    expect(result).toHaveProperty('creativeFatigue');
    expect(result).toHaveProperty('funnelAnalysis');
    expect(result).toHaveProperty('adScore');
    expect(result).toHaveProperty('projectedROAS');
  });

  it('computes correct performance summary metrics', () => {
    const { performanceSummary } = analyzeMetaAds(buildInput());
    expect(performanceSummary.totalSpent).toBe(500);
    expect(performanceSummary.totalRevenue).toBe(2500);
    expect(performanceSummary.totalLeads).toBe(15);
    expect(performanceSummary.totalConversions).toBe(5);
    expect(performanceSummary.overallROAS).toBe(5.0);
    expect(performanceSummary.overallCPA).toBe(100);
    expect(performanceSummary.budgetUtilization).toBe(25);
  });

  it('computes ROAS vs target comparison', () => {
    const { performanceSummary } = analyzeMetaAds(buildInput());
    expect(performanceSummary.vsTarget.roasVsTarget).toBe(25);
  });

  it('handles empty ads array gracefully', () => {
    const { performanceSummary, adScore } = analyzeMetaAds(buildInput({ ads: [] }));
    expect(performanceSummary.totalSpent).toBe(0);
    expect(performanceSummary.overallROAS).toBe(0);
    expect(adScore).toBeGreaterThanOrEqual(0);
  });

  it('generates ad copy variants with required fields', () => {
    const { adCopyVariants } = analyzeMetaAds(buildInput());
    expect(adCopyVariants.length).toBeGreaterThan(0);
    for (const v of adCopyVariants) {
      expect(v.headline).toBeTruthy();
      expect(v.primaryText).toBeTruthy();
      expect(v.forService).toBeTruthy();
    }
  });

  it('produces adScore between 0 and 100', () => {
    const { adScore } = analyzeMetaAds(buildInput());
    expect(adScore).toBeGreaterThanOrEqual(0);
    expect(adScore).toBeLessThanOrEqual(100);
  });

  it('produces budget recommendations with expected fields', () => {
    const { budgetRecommendations } = analyzeMetaAds(buildInput());
    expect(budgetRecommendations.length).toBeGreaterThan(0);
    for (const rec of budgetRecommendations) {
      expect(rec.campaignName).toBeTruthy();
      expect(rec.reason).toBeTruthy();
      expect(typeof rec.change).toBe('number');
      expect(typeof rec.expectedROAS).toBe('number');
    }
  });

  it('detects creative fatigue for high-frequency ads', () => {
    const { creativeFatigue } = analyzeMetaAds(buildInput({
      ads: [{
        id: 'ad-tired',
        adSetId: 'adset1',
        name: 'Tired Ad',
        type: 'image',
        status: 'active',
        headline: 'Old',
        body: 'Old body',
        callToAction: 'Book Now',
        createdDate: '2026-01-01',
        metrics: {
          impressions: 50000,
          reach: 8000,
          clicks: 500,
          ctr: 1.0,
          cpc: 2,
          spent: 1000,
          leads: 5,
          cpl: 200,
          conversions: 2,
          cpa: 500,
          revenue: 1000,
          roas: 1.0,
          frequency: 6.0,
        },
      }],
    }));
    expect(creativeFatigue.length).toBeGreaterThan(0);
  });
});
