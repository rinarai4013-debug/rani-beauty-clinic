import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Keyword } from '@/data/ads/keyword-library';
import {
  buildGoogleAdsBlueprint,
  calculateKeywordBudgetAllocation,
  getKeywordOpportunityScore,
  suggestNewKeywords,
} from '@/lib/ads/google-ads-engine';

describe('google-ads-engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buildGoogleAdsBlueprint returns four search campaigns with deterministic start dates', () => {
    const blueprint = buildGoogleAdsBlueprint({
      monthlyBudget: 6000,
      targetCPA: 85,
      targetROAS: 3.2,
    });

    expect(blueprint.campaigns).toHaveLength(4);
    expect(blueprint.campaigns.map(campaign => campaign.name)).toEqual([
      'Rani - Search - GLP-1 Weight Loss',
      'Rani - Search - Aesthetic Services',
      'Rani - Search - Wellness & Peptides',
      'Rani - Search - Brand & Local',
    ]);
    expect(blueprint.campaigns.every(campaign => campaign.startDate === '2026-04-10')).toBe(true);
    expect(blueprint.accountExtensions.locationExtension.city).toBe('Renton');
    expect(blueprint.accountExtensions.callExtension.phone).toBe('(425) 555-7264');
  });

  it('keyword research output surfaces opportunity pools and estimated demand', () => {
    const blueprint = buildGoogleAdsBlueprint({
      monthlyBudget: 5000,
      targetCPA: 80,
      targetROAS: 3,
    });

    expect(blueprint.keywordResearch.totalKeywords).toBeGreaterThan(0);
    expect(blueprint.keywordResearch.topOpportunities.length).toBeGreaterThan(0);
    expect(blueprint.keywordResearch.topOpportunities.every(keyword => keyword.competition !== 'high')).toBe(true);
    expect(blueprint.keywordResearch.competitiveGaps.every(keyword => keyword.competition === 'low')).toBe(true);
    expect(blueprint.keywordResearch.estimatedMonthlyBudget).toBeGreaterThan(0);
    expect(blueprint.keywordResearch.estimatedMonthlyClicks).toBeGreaterThan(0);
  });

  it('bid strategy recommendation switches at the documented budget threshold', () => {
    const smallBudget = buildGoogleAdsBlueprint({
      monthlyBudget: 2999,
      targetCPA: 70,
      targetROAS: 2.8,
    });
    const largerBudget = buildGoogleAdsBlueprint({
      monthlyBudget: 3000,
      targetCPA: 70,
      targetROAS: 2.8,
    });

    expect(smallBudget.bidStrategyRecommendation.recommended).toBe('maximize_conversions');
    expect(largerBudget.bidStrategyRecommendation.recommended).toBe('target_cpa');
    expect(largerBudget.bidStrategyRecommendation.targetCPA).toBe(70);
  });

  it('quality score tips cover expected CTR, ad relevance, and landing page experience', () => {
    const blueprint = buildGoogleAdsBlueprint({
      monthlyBudget: 4500,
      targetCPA: 75,
      targetROAS: 3.5,
    });

    expect(new Set(blueprint.qualityScoreTips.map(tip => tip.component))).toEqual(
      new Set(['expected_ctr', 'ad_relevance', 'landing_page']),
    );
  });

  it('landing page map includes service-specific clusters and conversion goals', () => {
    const blueprint = buildGoogleAdsBlueprint({
      monthlyBudget: 4500,
      targetCPA: 75,
      targetROAS: 3.5,
    });
    const glp1Mapping = blueprint.landingPageMap.find(mapping => mapping.keywordCluster === 'GLP-1 / Weight Loss');

    expect(glp1Mapping).toBeDefined();
    expect(glp1Mapping?.landingPage).toBe('/services/glp-1-weight-loss');
    expect(glp1Mapping?.requiredElements.some(item => item.includes('$399/mo'))).toBe(true);
    expect(glp1Mapping?.conversionGoal).toBe('Consultation booking');
  });

  it('estimated performance reflects the supplied budget and produces non-zero lead math', () => {
    const blueprint = buildGoogleAdsBlueprint({
      monthlyBudget: 6000,
      targetCPA: 85,
      targetROAS: 3.2,
    });

    expect(blueprint.estimatedPerformance.estimatedMonthlyCost).toBe(6000);
    expect(blueprint.estimatedPerformance.estimatedMonthlyClicks).toBeGreaterThan(0);
    expect(blueprint.estimatedPerformance.estimatedLeads).toBeGreaterThan(0);
    expect(blueprint.estimatedPerformance.estimatedCPA).toBeGreaterThan(0);
    expect(blueprint.estimatedPerformance.estimatedROAS).toBeGreaterThan(0);
  });

  it('getKeywordOpportunityScore rewards high intent, low competition, and lower CPC', () => {
    const keyword: Keyword = {
      term: 'semaglutide renton wa',
      matchType: 'exact',
      estimatedCPC: 8,
      competition: 'low',
      intentScore: 10,
      intentType: 'transactional',
      monthlyVolume: 5000,
      category: 'glp1_weight_loss',
      serviceId: 'glp1',
      landingPage: '/services/glp-1-weight-loss',
    };

    expect(getKeywordOpportunityScore(keyword)).toBe(100);
  });

  it('suggestNewKeywords omits existing terms and caps output at 50 suggestions', () => {
    const suggestions = suggestNewKeywords(['botox renton', 'best botox near me']);

    expect(suggestions).toHaveLength(50);
    expect(suggestions).not.toContain('botox renton');
    expect(suggestions.some(term => term.includes('hydrafacial'))).toBe(true);
  });

  it('calculateKeywordBudgetAllocation allocates proportionally across clusters', () => {
    const keywords: Keyword[] = [
      {
        term: 'botox renton',
        matchType: 'exact',
        estimatedCPC: 10,
        competition: 'medium',
        intentScore: 10,
        intentType: 'transactional',
        monthlyVolume: 10000,
        category: 'aesthetic_injectable',
        serviceId: 'botox',
        landingPage: '/services/botox',
      },
      {
        term: 'hydrafacial renton',
        matchType: 'exact',
        estimatedCPC: 8,
        competition: 'medium',
        intentScore: 5,
        intentType: 'commercial',
        monthlyVolume: 1000,
        category: 'aesthetic_facial',
        serviceId: 'hydrafacial',
        landingPage: '/services/hydrafacial',
      },
    ];

    const allocation = calculateKeywordBudgetAllocation(keywords, 1000);

    expect(allocation.botox).toBeGreaterThan(allocation.hydrafacial);
    expect(allocation.botox + allocation.hydrafacial).toBe(1000);
  });
});
