/**
 * Campaign Builder Engine — Wave 1 test coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RANI_SERVICES } from '@/lib/ads/creative-engine';
import {
  FUNNEL_BUDGET_SPLIT,
  buildMetaCampaign,
  buildFullMetaFunnel,
  buildGoogleSearchCampaign,
  buildGooglePMaxCampaign,
  getAllAudiences,
  getKeywordsForService,
  recommendBidStrategy,
} from '@/lib/ads/campaign-builder';

const NOW = new Date('2026-04-10T12:00:00.000Z');

const testServices = [
  RANI_SERVICES.find((s) => s.id === 'botox'),
  RANI_SERVICES.find((s) => s.id === 'hydrafacial'),
  RANI_SERVICES.find((s) => s.id === 'sofwave'),
].filter((svc): svc is typeof RANI_SERVICES[number] => Boolean(svc));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FUNNEL_BUDGET_SPLIT', () => {
  it('sums exactly to 1', () => {
    expect(Object.values(FUNNEL_BUDGET_SPLIT).reduce((acc, v) => acc + v, 0)).toBe(1);
  });

  it('keeps TOFU above MOFU and BOFU', () => {
    expect(FUNNEL_BUDGET_SPLIT.tofu).toBeGreaterThan(FUNNEL_BUDGET_SPLIT.mofu);
    expect(FUNNEL_BUDGET_SPLIT.mofu).toBeGreaterThan(FUNNEL_BUDGET_SPLIT.bofu);
  });
});

describe('buildMetaCampaign', () => {
  it('derives TOFU defaults', () => {
    const result = buildMetaCampaign({
      funnelStage: 'tofu',
      services: testServices,
      dailyBudget: 300,
    });

    expect(result.campaign.objective).toBe('awareness');
    expect(result.campaign.funnelStage).toBe('tofu');
    expect(result.campaign.status).toBe('draft');
    expect(result.campaign.startDate).toBe('2026-04-10');
    expect(result.campaign.specialAdCategories).toEqual([]);
  });

  it('derives MOFU defaults', () => {
    const result = buildMetaCampaign({
      funnelStage: 'mofu',
      services: testServices,
      dailyBudget: 300,
    });

    expect(result.campaign.objective).toBe('leads');
    expect(result.campaign.name).toContain('MOFU');
  });

  it('derives BOFU defaults', () => {
    const result = buildMetaCampaign({
      funnelStage: 'bofu',
      services: testServices,
      dailyBudget: 300,
    });

    expect(result.campaign.objective).toBe('conversions');
    expect(result.adSets.every((a) => a.bidStrategy === 'cost_cap')).toBe(true);
    expect(result.adSets.every((a) => a.optimizationGoal === 'leads')).toBe(true);
  });

  it('uses explicit objective and frameworks when provided', () => {
    const result = buildMetaCampaign({
      funnelStage: 'bofu',
      services: testServices,
      dailyBudget: 150,
      objective: 'engagement',
      frameworks: ['urgency', 'authority', 'seasonal', 'social_proof'],
    });

    expect(result.campaign.objective).toBe('engagement');
    expect(result.adSets).toHaveLength(4);
    expect(result.ads).toHaveLength(result.adSets.length * 3);
    expect(result.ads[0].creative.framework).toBe('urgency');
    expect(result.ads[1].creative.framework).toBe('authority');
    expect(result.ads[2].creative.framework).toBe('seasonal');
  });

  it('always truncates frameworks to three ads per ad set', () => {
    const result = buildMetaCampaign({
      funnelStage: 'bofu',
      services: testServices,
      dailyBudget: 120,
      frameworks: ['urgency', 'authority', 'seasonal', 'social_proof', 'testimonial'],
    });

    expect(result.ads).toHaveLength(result.adSets.length * 3);
  });

  it('builds ad sets based on stage audiences', () => {
    const tofu = buildMetaCampaign({ funnelStage: 'tofu', services: testServices, dailyBudget: 100 });
    const mofu = buildMetaCampaign({ funnelStage: 'mofu', services: testServices, dailyBudget: 100 });
    const bofu = buildMetaCampaign({ funnelStage: 'bofu', services: testServices, dailyBudget: 100 });

    expect(tofu.adSets.length).toBe(5);
    expect(mofu.adSets.length).toBe(3);
    expect(bofu.adSets.length).toBe(4);
  });

  it('assigns placements by stage', () => {
    expect(buildMetaCampaign({ funnelStage: 'tofu', services: testServices, dailyBudget: 99 }).adSets[0].placements,
    ).toEqual(['feed', 'stories', 'reels', 'explore']);

    expect(buildMetaCampaign({ funnelStage: 'mofu', services: testServices, dailyBudget: 99 }).adSets[0].placements,
    ).toEqual(['feed', 'stories', 'reels', 'search']);

    expect(buildMetaCampaign({ funnelStage: 'bofu', services: testServices, dailyBudget: 99 }).adSets[0].placements,
    ).toEqual(['feed', 'stories', 'messenger']);
  });

  it('derives optimization goals by stage', () => {
    const tofu = buildMetaCampaign({ funnelStage: 'tofu', services: testServices, dailyBudget: 50 });
    const mofu = buildMetaCampaign({ funnelStage: 'mofu', services: testServices, dailyBudget: 50 });

    expect(tofu.adSets.every((a) => a.optimizationGoal === 'reach')).toBe(true);
    expect(mofu.adSets.every((a) => a.optimizationGoal === 'landing_page_views')).toBe(true);
  });

  it('builds budget-aware ad sets with rounded two decimal precision', () => {
    const result = buildMetaCampaign({
      funnelStage: 'tofu',
      services: testServices,
      dailyBudget: 101,
    });
    expect(result.adSets[0].dailyBudget).toBe(20.2);
    expect(result.adSets.every((a) => Number.isFinite(a.dailyBudget))).toBe(true);
  });

  it('assigns campaign name from service roster and objective', () => {
    const result = buildMetaCampaign({
      funnelStage: 'mofu',
      services: testServices,
      dailyBudget: 100,
    });

    expect(result.campaign.name).toContain('Botox');
    expect(result.campaign.name).toContain('HydraFacial');
    expect(result.campaign.name).toContain('Sofwave');
    expect(result.campaign.name).toContain('MOFU');
    expect(result.campaign.name).toContain('leads');
  });

  it('builds an ad for each audience and each selected framework', () => {
    const result = buildMetaCampaign({
      funnelStage: 'tofu',
      services: testServices,
      dailyBudget: 200,
      frameworks: ['pas', 'aida', 'question'],
    });

    expect(result.adSets.length).toBe(5);
    expect(result.ads).toHaveLength(15);
    expect(result.ads.every((a) => a.trackingUrl.includes('utm_source=meta'))).toBe(true);
    expect(result.ads.every((a) => a.trackingUrl.includes('utm_medium=paid'))).toBe(true);
    expect(result.ads.every((a) => a.status === "draft")).toBe(true);
  });

  it('uses service-specific creative copy fields', () => {
    const result = buildMetaCampaign({
      funnelStage: 'tofu',
      services: [RANI_SERVICES[0], RANI_SERVICES[1]],
      dailyBudget: 100,
      frameworks: ['pas'],
    });

    const ad = result.ads[0];
    expect(ad.creative.headline).toContain('Tired of Forehead');
    expect(ad.creative.primaryText).toContain('Zero downtime');
    expect(ad.creative.callToAction).toBe('Learn More');
    expect(ad.creative.framework).toBe('pas');
    expect(ad.creative.visualTemplate).toBeUndefined();
  });

  it('builds UTM URLs with stage/framework query params', () => {
    const result = buildMetaCampaign({
      funnelStage: 'bofu',
      services: [RANI_SERVICES[0]],
      dailyBudget: 50,
      frameworks: ['urgency'],
    });

    expect(result.ads[0].trackingUrl).toBe(
      'https://www.ranibeautyclinic.com/botox?utm_source=meta&utm_medium=paid&utm_campaign=bofu&utm_content=urgency',
    );
  });
});

describe('buildFullMetaFunnel', () => {
  it('builds TOFU, MOFU, BOFU in order', () => {
    const campaigns = buildFullMetaFunnel(testServices, 300);

    expect(campaigns).toHaveLength(3);
    expect(campaigns[0].campaign.funnelStage).toBe('tofu');
    expect(campaigns[1].campaign.funnelStage).toBe('mofu');
    expect(campaigns[2].campaign.funnelStage).toBe('bofu');
  });

  it('applies split percentages to budgets', () => {
    const [tofu, mofu, bofu] = buildFullMetaFunnel(testServices, 100);

    expect(tofu.campaign.dailyBudget).toBe(40);
    expect(mofu.campaign.dailyBudget).toBe(35);
    expect(bofu.campaign.dailyBudget).toBe(25);
    expect(tofu.campaign.dailyBudget + mofu.campaign.dailyBudget + bofu.campaign.dailyBudget).toBe(100);
  });

  it('keeps each stage draft until explicitly published', () => {
    const campaigns = buildFullMetaFunnel(testServices, 100);

    expect(campaigns.every((entry) => entry.campaign.status === 'draft')).toBe(true);
  });

  it('keeps budget precision to cents', () => {
    const [tofu] = buildFullMetaFunnel(testServices, 101);
    expect(Number.isInteger(Math.round(tofu.campaign.dailyBudget * 100))).toBe(true);
  });

  it('uses requested total budget as sum of funnel pieces', () => {
    const campaigns = buildFullMetaFunnel(testServices, 137);
    const total = campaigns.reduce((sum, item) => sum + item.campaign.dailyBudget, 0);

    expect(total).toBe(137);
  });
});

describe('buildGoogleSearchCampaign', () => {
  it('builds a search campaign with matching metadata', () => {
    const result = buildGoogleSearchCampaign({
      services: [RANI_SERVICES[0]],
      dailyBudget: 75,
    });

    expect(result.campaign.type).toBe('search');
    expect(result.campaign.dailyBudget).toBe(75);
    expect(result.campaign.bidStrategy).toBe('maximize_conversions');
    expect(result.campaign.networkSettings).toEqual({
      searchNetwork: true,
      displayNetwork: false,
      searchPartners: true,
    });
    expect(result.campaign.locationTargeting.center).toBe('Renton, WA');
    expect(result.campaign.status).toBe('draft');
  });

  it('builds one ad group per service and one RSA per ad group', () => {
    const result = buildGoogleSearchCampaign({
      services: [RANI_SERVICES[0], RANI_SERVICES[2]],
      dailyBudget: 120,
    });

    expect(result.adGroups).toHaveLength(2);
    expect(result.adGroups[0].ads).toHaveLength(1);
    expect(result.adGroups[1].ads).toHaveLength(1);
    expect(result.adGroups.every((group) => group.negativeKeywords.includes('botox groupon'))).toBe(true);
    expect(result.adGroups.every((group) => group.keywords.length > 0)).toBe(true);
  });

  it('fills ad group fields from service data', () => {
    const service = RANI_SERVICES[0];
    const result = buildGoogleSearchCampaign({
      services: [service],
      dailyBudget: 60,
    });

    const group = result.adGroups[0];
    expect(group.service).toBe(service.id);
    expect(group.name).toContain(service.name);
    expect(group.keywords[0].text).toBe(`${service.name.toLowerCase()} renton`);
    expect(group.keywords[0].matchType).toBe('exact');
    expect(group.keywords[0].estimatedVolume).toBeGreaterThan(0);
  });

  it('builds google ad headlines and descriptions with service content', () => {
    const service = RANI_SERVICES[0];
    const result = buildGoogleSearchCampaign({
      services: [service],
      dailyBudget: 60,
    });
    const ad = result.adGroups[0].ads[0];

    expect(ad.type).toBe('responsive_search');
    expect(ad.headlines.length).toBe(15);
    expect(ad.descriptions.length).toBe(4);
    expect(ad.pinnedHeadlines).toEqual({ 1: 0 });
    expect(ad.finalUrl).toBe(`https://www.ranibeautyclinic.com/${service.id}`);
    expect(ad.displayUrl).toBe(`ranibeautyclinic.com/${service.id}`);
    expect(ad.path1).toBe(service.name.toLowerCase().replace(/\s+/g, '-').slice(0, 15));
    expect(ad.path2).toBe('book');
  });

  it('adds top pricing extensions for up to five services', () => {
    const services = testServices;
    const result = buildGoogleSearchCampaign({
      services,
      dailyBudget: 250,
    });

    expect(result.extensions.priceExtensions).toHaveLength(5);
    expect(result.extensions.priceExtensions[0].price).toBe(services[0].priceRange);
    expect(result.extensions.priceExtensions[0].finalUrl).toContain(services[0].id);
  });

  it('adds core callout and sitelink extension payloads', () => {
    const result = buildGoogleSearchCampaign({
      services: [RANI_SERVICES[0]],
      dailyBudget: 50,
    });

    expect(result.extensions.sitelinks.length).toBeGreaterThan(0);
    expect(result.extensions.callouts).toContain('Financing Available');
    expect(result.extensions.callExtension).toEqual({
      phoneNumber: '+14255557264',
      countryCode: 'US',
    });
    expect(result.extensions.locationExtension).toEqual({
      address: '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
    });
  });

  it('supports custom bid strategy override', () => {
    const result = buildGoogleSearchCampaign({
      services: [RANI_SERVICES[0]],
      dailyBudget: 90,
      bidStrategy: 'target_roas',
      targetCPA: 120,
    });

    expect(result.campaign.bidStrategy).toBe('target_roas');
    expect(result.campaign.targetCPA).toBe(120);
  });
});

describe('buildGooglePMaxCampaign', () => {
  it('builds a single PMax campaign scaffold', () => {
    const result = buildGooglePMaxCampaign(testServices, 120);

    expect(result.campaign.type).toBe('performance_max');
    expect(result.campaign.bidStrategy).toBe('maximize_conversions');
    expect(result.adGroups).toHaveLength(1);
    expect(result.adGroups[0].service).toBe('all');
    expect(result.adGroups[0].keywords).toEqual([]);
    expect(result.adGroups[0].ads).toHaveLength(1);
    expect(result.extensions.sitelinks).toHaveLength(6);
    expect(result.extensions.structuredSnippets).toHaveLength(3);
  });

  it('uses non-empty headlines and descriptions in PMax ad', () => {
    const result = buildGooglePMaxCampaign(testServices, 120);
    const ad = result.adGroups[0].ads[0];

    expect(ad.headlines.every((h) => h.length > 0)).toBe(true);
    expect(ad.descriptions.every((d) => d.length > 0)).toBe(true);
  });
});

describe('getAllAudiences', () => {
  it('returns interest, retargeting, and lookalike buckets', () => {
    const audiences = getAllAudiences();

    expect(audiences.interest.length).toBe(6);
    expect(audiences.retargeting.length).toBe(6);
    expect(audiences.lookalike.length).toBe(4);
  });

  it('uses Renton location targeting for returned interests', () => {
    const audiences = getAllAudiences();
    const locations = audiences.interest.map((a) => a.locations.center);

    expect(locations.every((value) => value === 'Renton, WA')).toBe(true);
  });

  it('keeps audience id names stable', () => {
    const audiences = getAllAudiences();

    expect(audiences.interest.map((a) => a.id)).toContain('aud-laser');
    expect(audiences.retargeting.map((a) => a.id)).toContain('retarget-booking-abandon');
    expect(audiences.lookalike.map((a) => a.id)).toContain('lal-converters-1pct');
  });
});

describe('getKeywordsForService', () => {
  it('returns generated keyword lists from service profiles', () => {
    const keywords = getKeywordsForService('botox');

    expect(keywords.length).toBeGreaterThan(10);
    expect(keywords.some((k) => k.text.includes('botox renton'))).toBe(true);
    expect(keywords.some((k) => k.matchType === 'phrase')).toBe(true);
    expect(keywords.some((k) => k.matchType === 'broad')).toBe(true);
  });

  it('returns empty list for unknown service IDs', () => {
    expect(getKeywordsForService('does-not-exist')).toEqual([]);
  });
});

describe('recommendBidStrategy', () => {
  it.each([
    ['search', 20, false, undefined, 'manual_cpc'],
    ['search', 29.99, false, undefined, 'manual_cpc'],
    ['search', 30, false, undefined, 'maximize_clicks'],
    ['search', 30.01, false, undefined, 'maximize_clicks'],
    ['awareness', 55, true, undefined, 'maximize_conversions'],
    ['search', 75, true, 85, 'target_cpa'],
    ['search', 75, false, 85, 'maximize_clicks'],
  ] as const)(
    'objective=%s budget=%p hasConversionData=%p targetCPA=%p => %s',
    (objective, dailyBudget, hasConversionData, targetCPA, expected) => {
      const result = recommendBidStrategy({
        objective,
        dailyBudget,
        hasConversionData,
        ...(targetCPA === undefined ? {} : { targetCPA }),
      });
      expect(result.strategy).toBe(expected);
      expect(result.reason.length).toBeGreaterThan(0);
    },
  );

  it('uses target CPA only when conversion history exists', () => {
    const noHistory = recommendBidStrategy({
      objective: 'search',
      dailyBudget: 200,
      hasConversionData: false,
      targetCPA: 50,
    });
    const withHistory = recommendBidStrategy({
      objective: 'search',
      dailyBudget: 200,
      hasConversionData: true,
      targetCPA: 50,
    });

    expect(noHistory.strategy).toBe('maximize_clicks');
    expect(withHistory.strategy).toBe('target_cpa');
  });

  it('returns maximize_clicks for no conversion history above budget floor', () => {
    const result = recommendBidStrategy({
      objective: 'search',
      dailyBudget: 300,
      hasConversionData: false,
    });

    expect(result.strategy).toBe('maximize_clicks');
    expect(result.reason).toContain('traffic');
  });
});
