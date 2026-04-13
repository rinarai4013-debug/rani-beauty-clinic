/**
 * Google Ads Engine — Wave 1 test coverage
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllKeywords,
  getAllKeywords as getAllKeywordData,
  getHighIntentKeywords,
  getKeywordsByService,
  NEGATIVE_KEYWORDS,
  type Keyword,
} from '@/data/ads/keyword-library';
import {
  buildGoogleAdsBlueprint,
  getKeywordOpportunityScore,
  suggestNewKeywords,
  calculateKeywordBudgetAllocation,
} from '@/lib/ads/google-ads-engine';

const NOW = new Date('2026-04-10T12:00:00.000Z');

describe('google-ads-engine blueprint builder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds four search campaigns with expected budget split', () => {
    const result = buildGoogleAdsBlueprint({
      monthlyBudget: 3040,
      targetCPA: 180,
      targetROAS: 4,
      priorityServices: ['botox', 'sofwave'],
    });

    expect(result.campaigns).toHaveLength(4);
    expect(result.campaigns.map(c => c.type)).toEqual(['search', 'search', 'search', 'search']);
    expect(result.campaigns[0].dailyBudget).toBe(35);
    expect(result.campaigns[1].dailyBudget).toBe(35);
    expect(result.campaigns[2].dailyBudget).toBe(15);
    expect(result.campaigns[3].dailyBudget).toBe(15);
  });

  it('sets enabled campaign status and target_cpa bidding', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 4200, targetCPA: 160, targetROAS: 5 });

    for (const campaign of result.campaigns) {
      expect(campaign.status).toBe('enabled');
      expect(campaign.bidStrategy).toBe('target_cpa');
      expect(campaign.targetCPA).toBe(160);
      expect(campaign.adGroups.length).toBeGreaterThan(0);
    }
  });

  it('uses a normalized start date based on system time', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1000, targetCPA: 150, targetROAS: 3 });
    expect(result.campaigns[0].startDate).toBe('2026-04-10');
  });

  it('keeps a 7-day ad schedule with expected hours and modifiers', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1200, targetCPA: 110, targetROAS: 2 });
    const sched = result.campaigns[0].adSchedule;

    expect(sched).toHaveLength(7);
    expect(sched[0]).toEqual({ day: 'monday', startHour: 7, endHour: 21, bidModifier: 1.0 });
    expect(sched[4]).toEqual({ day: 'friday', startHour: 7, endHour: 21, bidModifier: 1.1 });
    expect(sched[6]).toEqual({ day: 'sunday', startHour: 8, endHour: 20, bidModifier: 1.2 });
  });

  it('builds default location targeting around Renton with 25 mile radius', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1200, targetCPA: 110, targetROAS: 2 });
    const target = result.campaigns[0].locationTargeting;

    expect(target.centerCity).toBe('Renton, WA');
    expect(target.radiusMiles).toBe(25);
    expect(target.excludeLocations).toEqual([]);
    expect(target.targetLocations).toContain('Renton');
  });

  it('builds ad groups for services with per-match-type segmentation', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 150, targetROAS: 4 });
    const glpCampaign = result.campaigns.find((c) => c.name.includes('GLP-1'));
    expect(glpCampaign).toBeTruthy();

    const glpAdGroups = glpCampaign!.adGroups;
    expect(glpAdGroups.length).toBeGreaterThanOrEqual(1);

    for (const group of glpAdGroups) {
      expect(group.status).toBe('enabled');
      expect(group.negativeKeywords).toHaveLength(NEGATIVE_KEYWORDS.length);
      expect(group.keywords.length).toBeGreaterThan(0);
      expect(group.ads).toHaveLength(1);
      expect(group.ads[0].finalUrl).toMatch(/^https:\/\/www\.ranibeautyclinic\.com/);
    }
  });

  it('builds landing pages from service lookup where available', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 150, targetROAS: 4 });
    const sofwaveCampaign = result.campaigns.find((c) => c.name.includes('Aesthetic Services'));
    expect(sofwaveCampaign).toBeTruthy();

    const hasSofwave = sofwaveCampaign!.adGroups.some(
      (g) => g.name.includes('Sofwave') && g.landingPage.includes('/services/sofwave')
    );
    expect(hasSofwave).toBe(true);
  });

  it('adds exactly one RSA per ad group and keeps paths consistent with domain', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 150, targetROAS: 4 });
    const allGroups = result.campaigns.flatMap((c) => c.adGroups);

    for (const group of allGroups) {
      expect(group.ads).toHaveLength(1);
      expect(group.ads[0].displayUrl).toBe('ranibeautyclinic.com');
      expect(group.ads[0].status).toBe('enabled');
      expect(group.ads[0].path1).toBeTruthy();
      expect(group.ads[0].path2).toBeTruthy();
    }
  });

  it('builds responsive headlines under 30 chars with pinned Rani headline', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 150, targetROAS: 4 });
    const firstAd = result.campaigns[0].adGroups[0].ads[0];

    expect(firstAd.headlines.length).toBeGreaterThan(0);
    expect(firstAd.headlines.length).toBeLessThanOrEqual(15);
    expect(firstAd.headlines[0].characterCount).toBeLessThanOrEqual(30);
    expect(firstAd.headlines.every((h) => h.characterCount <= 30)).toBe(true);
    expect(firstAd.headlines.some((h) => h.pinPosition === 1)).toBe(true);
    expect(firstAd.headlines.some((h) => h.text.includes('Rani'))).toBe(true);
  });

  it('builds responsive descriptions under 90 chars', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 150, targetROAS: 4 });
    const firstAd = result.campaigns[1].adGroups[0].ads[0];

    expect(firstAd.descriptions.length).toBeGreaterThan(0);
    expect(firstAd.descriptions.length).toBeLessThanOrEqual(4);
    expect(firstAd.descriptions.every((d) => d.characterCount <= 90)).toBe(true);
  });

  it('emits keyword research totals and category counts', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1000, targetCPA: 150, targetROAS: 3 });
    const keywords = getAllKeywordData();
    const categories = new Set(keywords.map((k) => k.category));

    expect(result.keywordResearch.totalKeywords).toBe(keywords.length);
    expect(Object.keys(result.keywordResearch.byCategory).sort()).toContain('glp1_weight_loss');
    expect(Object.keys(result.keywordResearch.byCategory).every((category) => categories.has(category as never))).toBe(true);
    expect(result.keywordResearch.topOpportunities.length).toBeLessThanOrEqual(20);
    expect(result.keywordResearch.topOpportunities.every((k) => k.competition !== 'high')).toBe(true);
    expect(result.keywordResearch.competitiveGaps.length).toBeLessThanOrEqual(15);
  });

  it('filters top opportunities by at least high intent before slicing', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1000, targetCPA: 150, targetROAS: 3 });
    const highIntent = getHighIntentKeywords().filter((k) => k.competition !== 'high');

    expect(result.keywordResearch.topOpportunities.every((kw) => kw.intentScore >= 8)).toBe(true);
    expect(result.keywordResearch.topOpportunities.length).toBeLessThanOrEqual(highIntent.length);
  });

  it('emits bid strategy recommendation by budget threshold', () => {
    const newAccount = buildGoogleAdsBlueprint({ monthlyBudget: 2999, targetCPA: 150, targetROAS: 3 });
    const scaled = buildGoogleAdsBlueprint({ monthlyBudget: 3000, targetCPA: 150, targetROAS: 3 });

    expect(newAccount.bidStrategyRecommendation.recommended).toBe('maximize_conversions');
    expect(newAccount.bidStrategyRecommendation.alternativeStrategies.some((s) => s.strategy === 'manual_cpc')).toBe(true);
    expect(scaled.bidStrategyRecommendation.recommended).toBe('target_cpa');
    expect(scaled.bidStrategyRecommendation.targetCPA).toBe(150);
    expect(scaled.bidStrategyRecommendation.alternativeStrategies.some((s) => s.strategy === 'target_roas')).toBe(true);
  });

  it('returns quality score tips across all components', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1200, targetCPA: 150, targetROAS: 3 });
    const components = result.qualityScoreTips.map((tip) => tip.component);

    expect(components).toContain('expected_ctr');
    expect(components).toContain('ad_relevance');
    expect(components).toContain('landing_page');
    expect(result.qualityScoreTips.every((tip) => ['high', 'medium', 'low'].includes(tip.priority))).toBe(true);
  });

  it('contains landing page mapping for core services', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1200, targetCPA: 150, targetROAS: 3 });

    const clusters = result.landingPageMap.map((entry) => entry.keywordCluster);
    expect(clusters).toContain('GLP-1 / Weight Loss');
    expect(clusters).toContain('Botox');
    expect(clusters).toContain('Sofwave');
    expect(result.landingPageMap.every((entry) => entry.requiredElements.length > 0)).toBe(true);
  });

  it('estimates performance from budget and keyword research', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 2000, targetCPA: 160, targetROAS: 4 });
    const keywords = getAllKeywords();
    const avgCPC = keywords.reduce((sum, k) => sum + k.estimatedCPC, 0) / keywords.length;
    const expectedClicks = Math.round(2000 / avgCPC);
    const expectedLeads = Math.round(expectedClicks * 0.065);
    const expectedCPA = expectedLeads > 0 ? Math.round(2000 / (expectedLeads * 0.45)) : 0;
    const expectedROAS = Math.round((expectedLeads * 0.45 * 450 / 2000) * 100) / 100;

    expect(result.estimatedPerformance.estimatedMonthlyCost).toBe(2000);
    expect(result.estimatedPerformance.estimatedMonthlyClicks).toBe(expectedClicks);
    expect(result.estimatedPerformance.estimatedLeads).toBe(expectedLeads);
    expect(result.estimatedPerformance.estimatedCPA).toBe(expectedCPA);
    expect(result.estimatedPerformance.estimatedROAS).toBe(expectedROAS);
  });

  it('reuses account extensions for each campaign and landing map', () => {
    const result = buildGoogleAdsBlueprint({ monthlyBudget: 1500, targetCPA: 140, targetROAS: 2 });

    expect(result.accountExtensions.sitelinks).toHaveLength(8);
    expect(result.accountExtensions.callouts).toHaveLength(10);
    expect(result.accountExtensions.structuredSnippets).toHaveLength(4);
    expect(result.accountExtensions.priceExtensions).toHaveLength(1);
    expect(result.accountExtensions.priceExtensions[0].items.length).toBeGreaterThan(0);

    for (const campaign of result.campaigns) {
      expect(campaign.extensions).toEqual(result.accountExtensions);
    }
  });
});

describe('google keyword score utils', () => {
  it.each([
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 9.99, monthlyVolume: 1201 }, 100],
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 10.0, monthlyVolume: 1201 }, 93],
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 15.0, monthlyVolume: 1201 }, 85],
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 15.0, monthlyVolume: 1000 }, 80],
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 15.0, monthlyVolume: 200 }, 75],
    [{ intentScore: 10, competition: 'low' as const, estimatedCPC: 15.0, monthlyVolume: 201 }, 80],
  ])('score boundary for %o', (kw, expected) => {
    const keyword: Keyword = {
      term: 'test term',
      matchType: 'exact',
      competition: kw.competition,
      estimatedCPC: kw.estimatedCPC,
      intentType: 'commercial',
      category: 'brand',
      intentScore: kw.intentScore,
      monthlyVolume: kw.monthlyVolume,
    };

    expect(getKeywordOpportunityScore(keyword)).toBe(expected);
  });

  it('clamps score to max 100 for extremely strong keywords', () => {
    const keyword: Keyword = {
      term: 'test',
      matchType: 'exact',
      competition: 'low',
      estimatedCPC: 1,
      intentType: 'transactional',
      category: 'brand',
      intentScore: 10,
      monthlyVolume: 10000,
    };

    expect(getKeywordOpportunityScore(keyword)).toBeLessThanOrEqual(100);
    expect(getKeywordOpportunityScore(keyword)).toBe(100);
  });
});

describe('google ads helpers', () => {
  it('suggests up to 50 unseen keywords and deduplicates existing terms', () => {
    const existing = [
      'botox renton',
      'best botox near me',
      'affordable botox near me',
      'experienced botox near me',
    ];
    const suggestions = suggestNewKeywords(existing);

    expect(suggestions).toHaveLength(50);
    expect(suggestions).not.toContain('botox renton');
    expect(suggestions).not.toContain('best botox near me');
    expect(suggestions.every((term) => !existing.includes(term))).toBe(true);
    expect(suggestions[0]).toBeTruthy();
    expect(suggestions).toContain('GLP-1 renton');
  });

  it('calculates keyword budget allocation proportionally by cluster', () => {
    const keywords: Keyword[] = [
      ...getKeywordsByService('glp1').slice(0, 1).map((k) => ({ ...k, monthlyVolume: 6000 })),
      ...getKeywordsByService('botox').slice(0, 1).map((k) => ({ ...k, monthlyVolume: 1000 })),
    ];

    const allocation = calculateKeywordBudgetAllocation(keywords, 100);
    const totalAllocated = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    expect(allocation).toHaveProperty('glp1');
    expect(allocation).toHaveProperty('botox');
    expect(totalAllocated).toBe(100);
    expect(allocation.glp1 + allocation.botox).toBe(100);
    expect(allocation.glp1).toBeGreaterThan(allocation.botox);
  });

  it('returns empty allocation for empty keyword list', () => {
    expect(calculateKeywordBudgetAllocation([], 100)).toEqual({});
  });

  it('handles one-off cluster keys and full budget allocation', () => {
    const allocation = calculateKeywordBudgetAllocation([
      {
        term: 'test',
        matchType: 'exact',
        estimatedCPC: 10,
        competition: 'low',
        intentType: 'informational',
        category: 'brand',
        intentScore: 1,
        monthlyVolume: 0,
        serviceId: 'mystery-service',
      },
    ], 100);

    const total = Object.values(allocation).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(100);
    expect(allocation['mystery-service']).toBe(100);
  });
});
