import { describe, it, expect } from 'vitest';

import {
  FUNNEL_BUDGET_SPLIT,
  buildFullMetaFunnel,
  buildGooglePMaxCampaign,
  buildGoogleSearchCampaign,
  buildMetaCampaign,
  getAllAudiences,
  getKeywordsForService,
  recommendBidStrategy,
} from '@/lib/ads/campaign-builder';
import { RANI_SERVICES } from '@/lib/ads/creative-engine';

describe('campaign-builder', () => {
  const serviceSet = RANI_SERVICES.filter(s => ['botox', 'hydrafacial', 'sofwave', 'rf_microneedling'].includes(s.id));

  it('buildMetaCampaign maps funnel stage to objective and optimization goal', () => {
    expect(buildMetaCampaign({
      funnelStage: 'tofu',
      services: serviceSet,
      dailyBudget: 600,
    }).campaign.objective).toBe('awareness');

    expect(buildMetaCampaign({
      funnelStage: 'mofu',
      services: serviceSet,
      dailyBudget: 600,
    }).campaign.objective).toBe('leads');

    expect(buildMetaCampaign({
      funnelStage: 'bofu',
      services: serviceSet,
      dailyBudget: 600,
    }).campaign.objective).toBe('conversions');
  });

  it('buildMetaCampaign honors explicit objective override', () => {
    const campaign = buildMetaCampaign({
      funnelStage: 'tofu',
      services: serviceSet,
      dailyBudget: 600,
      objective: 'conversions',
    });

    expect(campaign.campaign.objective).toBe('conversions');
    expect(campaign.campaign.funnelStage).toBe('tofu');
  });

  it('buildMetaCampaign produces ad sets and ads for each selected audience', () => {
    const campaign = buildMetaCampaign({
      funnelStage: 'tofu',
      services: serviceSet,
      dailyBudget: 450,
    });

    expect(campaign.adSets.length).toBeGreaterThan(0);
    expect(campaign.ads.length).toBeGreaterThan(0);
    expect(campaign.adSets.every(a => a.campaignId === campaign.campaign.id)).toBe(true);
    expect(campaign.adSets.every(a => a.budget === undefined || a.bidStrategy === 'lowest_cost')).toBe(false);
    expect(campaign.adSets.every(a => a.bidStrategy === 'lowest_cost')).toBe(true);
    expect(campaign.adSets.every(a => a.optimizationGoal === 'landing_page_views')).toBe(false);
  });

  it('buildMetaCampaign assigns call-to-action by funnel stage', () => {
    const tofu = buildMetaCampaign({
      funnelStage: 'tofu',
      services: serviceSet,
      dailyBudget: 450,
    });

    const mofu = buildMetaCampaign({
      funnelStage: 'mofu',
      services: serviceSet,
      dailyBudget: 450,
    });

    const bofu = buildMetaCampaign({
      funnelStage: 'bofu',
      services: serviceSet,
      dailyBudget: 450,
    });

    const tofuCTAs = new Set(tofu.ads.map(a => a.creative.callToAction));
    const mofuCTAs = new Set(mofu.ads.map(a => a.creative.callToAction));
    const bofuCTAs = new Set(bofu.ads.map(a => a.creative.callToAction));

    expect(tofuCTAs.has('Learn More')).toBe(true);
    expect(mofuCTAs.has('See Results')).toBe(true);
    expect(bofuCTAs.has('Book Now')).toBe(true);
  });

  it('buildMetaCampaign allocates all ad-set budget and keeps IDs scoped to stage', () => {
    const budget = 300;
    const campaign = buildMetaCampaign({
      funnelStage: 'tofu',
      services: serviceSet,
      dailyBudget: budget,
    });

    const adSetBudget = campaign.adSets.reduce((sum, set) => sum + set.dailyBudget, 0);
    expect(Math.round(adSetBudget * 100) / 100).toBeLessThanOrEqual(Math.round(budget * 100) / 100);
    expect(campaign.campaign.id.startsWith('meta-tofu-')).toBe(true);
    expect(campaign.ads.every(a => a.id.includes(campaign.campaign.id) || a.id.includes('meta-tofu'))).toBe(true);
  });

  it('buildFullMetaFunnel builds TOFU, MOFU, BOFU with configured budget split', () => {
    const total = 900;
    const [tofu, mofu, bofu] = buildFullMetaFunnel(serviceSet, total);

    expect(tofu.campaign.funnelStage).toBe('tofu');
    expect(mofu.campaign.funnelStage).toBe('mofu');
    expect(bofu.campaign.funnelStage).toBe('bofu');
    expect(tofu.campaign.dailyBudget).toBeCloseTo(total * FUNNEL_BUDGET_SPLIT.tofu, 2);
    expect(mofu.campaign.dailyBudget).toBeCloseTo(total * FUNNEL_BUDGET_SPLIT.mofu, 2);
    expect(bofu.campaign.dailyBudget).toBeCloseTo(total * FUNNEL_BUDGET_SPLIT.bofu, 2);
    expect(tofu.campaign.dailyBudget + mofu.campaign.dailyBudget + bofu.campaign.dailyBudget)
      .toBeLessThanOrEqual(total);
  });

  it('buildGoogleSearchCampaign maps each service to a search ad group', () => {
    const campaign = buildGoogleSearchCampaign({
      services: serviceSet,
      dailyBudget: 600,
      bidStrategy: 'maximize_conversions',
      targetCPA: 60,
    });

    expect(campaign.campaign.type).toBe('search');
    expect(campaign.campaign.status).toBe('draft');
    expect(campaign.adGroups.length).toBe(serviceSet.length);
    expect(campaign.adGroups.every(g => g.keywords.length > 0)).toBe(true);
    expect(campaign.adGroups.every(g => g.ads.length === 1)).toBe(true);
    expect(campaign.adGroups[0].ads[0].path1).toBeTruthy();
    expect(campaign.adGroups[0].ads[0].pinnedHeadlines).toEqual({ 1: 0 });
    expect(campaign.extensions.sitelinks.length).toBeGreaterThan(0);
    expect(campaign.extensions.callExtension?.phoneNumber).toBe('+14255557264');
    expect(campaign.extensions.priceExtensions?.length).toBeGreaterThan(0);
  });

  it('buildGooglePMaxCampaign creates a single asset group with compliant callouts and sitelinks', () => {
    const campaign = buildGooglePMaxCampaign(serviceSet, 900);

    expect(campaign.campaign.type).toBe('performance_max');
    expect(campaign.adGroups).toHaveLength(1);
    expect(campaign.adGroups[0].service).toBe('all');
    expect(campaign.adGroups[0].ads).toHaveLength(1);
    expect(campaign.adGroups[0].ads[0].headlines.length).toBe(14);
    expect(campaign.adGroups[0].ads[0].descriptions.length).toBe(4);
    expect(campaign.extensions.callouts).toContain('Physician-Supervised');
    expect(campaign.extensions.structuredSnippets).toHaveLength(3);
    expect(campaign.extensions.locationExtension?.address).toContain('Renton');
  });

  it('getKeywordsForService returns mapped keywords and returns [] for unknown', () => {
    expect(getKeywordsForService('hydrafacial').length).toBeGreaterThan(0);
    expect(getKeywordsForService('not-a-service')).toEqual([]);
  });

  it('getAllAudiences exposes all category buckets', () => {
    const audiences = getAllAudiences();

    expect(audiences.interest.length).toBeGreaterThan(0);
    expect(audiences.retargeting.length).toBeGreaterThan(0);
    expect(audiences.lookalike.length).toBeGreaterThan(0);
  });

  it('recommendBidStrategy follows documented boundaries', () => {
    expect(
      recommendBidStrategy({
        objective: 'search',
        dailyBudget: 120,
        hasConversionData: true,
        targetCPA: 65,
      }).strategy,
    ).toBe('target_cpa');

    expect(
      recommendBidStrategy({
        objective: 'awareness',
        dailyBudget: 120,
        hasConversionData: true,
      }).strategy,
    ).toBe('maximize_conversions');

    expect(
      recommendBidStrategy({
        objective: 'awareness',
        dailyBudget: 29.99,
        hasConversionData: false,
      }).strategy,
    ).toBe('manual_cpc');

    expect(
      recommendBidStrategy({
        objective: 'traffic',
        dailyBudget: 35,
        hasConversionData: false,
      }).strategy,
    ).toBe('maximize_clicks');
  });
});
