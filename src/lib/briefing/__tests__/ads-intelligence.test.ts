// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateMetaSummary,
  calculateGoogleSummary,
  calculateBudgetPacing,
  detectMetaFatigue,
  compareChannels,
  generateAdsAlerts,
  generateAdsActionItems,
  parseMetaAdsResponse,
  parseGoogleAdsResponse,
  type MetaAdsCampaignMetrics,
  type GoogleAdsCampaignMetrics,
  type MetaAdsPerformance,
  type GoogleAdsPerformance,
  type AdsIntelligenceConfig,
} from '../ads-intelligence';

// ── Fixtures ──────────────────────────────────────────────────

function makeMetaCampaign(overrides: Partial<MetaAdsCampaignMetrics> = {}): MetaAdsCampaignMetrics {
  return {
    campaignId: 'mc1',
    campaignName: 'HydraFacial Awareness',
    objective: 'conversions',
    status: 'active',
    spend: 1500,
    impressions: 50000,
    reach: 35000,
    clicks: 1000,
    ctr: 2.0,
    cpc: 1.5,
    cpm: 30,
    conversions: 15,
    costPerConversion: 100,
    revenue: 4500,
    roas: 3.0,
    frequency: 1.8,
    ...overrides,
  };
}

function makeGoogleCampaign(overrides: Partial<GoogleAdsCampaignMetrics> = {}): GoogleAdsCampaignMetrics {
  return {
    campaignId: 'gc1',
    campaignName: 'Botox Search',
    campaignType: 'search',
    status: 'active',
    spend: 1200,
    impressions: 30000,
    clicks: 600,
    ctr: 2.0,
    cpc: 2.0,
    conversions: 12,
    costPerConversion: 100,
    conversionRate: 2.0,
    impressionShare: 45,
    lostISBudget: 20,
    lostISRank: 15,
    ...overrides,
  };
}

const defaultConfig: AdsIntelligenceConfig = {
  monthlyBudget: { meta: 3000, google: 2000, total: 5000 },
  targets: { roas: 3.0, cpa: 100, mer: 3.0 },
};

// ── Tests ─────────────────────────────────────────────────────

describe('Ads Intelligence', () => {
  // ── Meta Summary ──

  describe('calculateMetaSummary', () => {
    it('should calculate totals from campaign list', () => {
      const campaigns = [makeMetaCampaign(), makeMetaCampaign({ campaignId: 'mc2', spend: 800, impressions: 20000, clicks: 400, conversions: 8, revenue: 2400, roas: 3.0 })];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.totalSpend).toBe(2300);
      expect(summary.totalImpressions).toBe(70000);
      expect(summary.totalClicks).toBe(1400);
      expect(summary.totalConversions).toBe(23);
      expect(summary.totalRevenue).toBe(6900);
    });

    it('should calculate ROAS correctly', () => {
      const campaigns = [makeMetaCampaign({ spend: 1000, revenue: 4000 })];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.overallROAS).toBe(4);
    });

    it('should find top and worst campaigns', () => {
      const campaigns = [
        makeMetaCampaign({ campaignName: 'Top', roas: 5.0 }),
        makeMetaCampaign({ campaignId: 'mc2', campaignName: 'Worst', roas: 0.5 }),
      ];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.topCampaign).toBe('Top');
      expect(summary.worstCampaign).toBe('Worst');
    });

    it('should handle empty campaigns', () => {
      const summary = calculateMetaSummary([]);
      expect(summary.totalSpend).toBe(0);
      expect(summary.overallROAS).toBe(0);
      expect(summary.topCampaign).toBe('N/A');
    });

    it('should calculate average CTR', () => {
      const campaigns = [makeMetaCampaign({ impressions: 10000, clicks: 200 })];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.avgCTR).toBe(2);
    });

    it('should calculate average CPC', () => {
      const campaigns = [makeMetaCampaign({ spend: 1000, clicks: 500 })];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.avgCPC).toBe(2);
    });

    it('should calculate average CPA', () => {
      const campaigns = [makeMetaCampaign({ spend: 1000, conversions: 10 })];
      const summary = calculateMetaSummary(campaigns);
      expect(summary.avgCPA).toBe(100);
    });
  });

  // ── Google Summary ──

  describe('calculateGoogleSummary', () => {
    it('should calculate totals from campaign list', () => {
      const campaigns = [makeGoogleCampaign(), makeGoogleCampaign({ campaignId: 'gc2', spend: 600 })];
      const summary = calculateGoogleSummary(campaigns);
      expect(summary.totalSpend).toBe(1800);
    });

    it('should calculate impression share average', () => {
      const campaigns = [
        makeGoogleCampaign({ impressionShare: 40 }),
        makeGoogleCampaign({ campaignId: 'gc2', impressionShare: 60 }),
      ];
      const summary = calculateGoogleSummary(campaigns);
      expect(summary.avgImpressionShare).toBe(50);
    });

    it('should handle empty campaigns', () => {
      const summary = calculateGoogleSummary([]);
      expect(summary.totalSpend).toBe(0);
      expect(summary.topKeyword).toBe('N/A');
    });

    it('should estimate revenue from conversions', () => {
      const campaigns = [makeGoogleCampaign({ conversions: 10 })];
      const summary = calculateGoogleSummary(campaigns);
      expect(summary.totalRevenue).toBe(3500); // 10 * 350
    });

    it('should calculate conversion rate', () => {
      const campaigns = [makeGoogleCampaign({ clicks: 1000, conversions: 20 })];
      const summary = calculateGoogleSummary(campaigns);
      expect(summary.avgConversionRate).toBe(2);
    });
  });

  // ── Budget Pacing ──

  describe('calculateBudgetPacing', () => {
    it('should detect on-track pacing', () => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const expectedSpend = (3000 / daysInMonth) * dayOfMonth;
      const pacing = calculateBudgetPacing(expectedSpend, 3000);
      expect(pacing.pacingStatus).toBe('on_track');
    });

    it('should detect underspending', () => {
      const pacing = calculateBudgetPacing(100, 10000); // spent very little
      expect(pacing.pacingStatus).toBe('underspending');
    });

    it('should detect overspending', () => {
      const pacing = calculateBudgetPacing(9000, 3000); // spent way too much
      expect(pacing.pacingStatus).toBe('overspending');
    });

    it('should calculate projected month spend', () => {
      const pacing = calculateBudgetPacing(1500, 3000);
      expect(pacing.projectedMonthSpend).toBeGreaterThan(0);
    });

    it('should calculate daily budget target', () => {
      const pacing = calculateBudgetPacing(0, 3000);
      expect(pacing.dailyBudgetTarget).toBeGreaterThan(0);
      expect(pacing.dailyBudgetTarget).toBeLessThan(200); // 3000/30 ~ 100
    });

    it('should include recommendation text', () => {
      const pacing = calculateBudgetPacing(100, 10000);
      expect(pacing.recommendation).toBeTruthy();
    });
  });

  // ── Fatigue Detection ──

  describe('detectMetaFatigue', () => {
    it('should detect fatigued campaigns', () => {
      const campaigns = [makeMetaCampaign({ frequency: 5.0 })];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts.length).toBe(1);
      expect(alerts[0].urgency).toBe('this_week');
    });

    it('should flag critical fatigue at high frequency', () => {
      const campaigns = [makeMetaCampaign({ frequency: 7.0 })];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts[0].urgency).toBe('immediate');
    });

    it('should ignore paused campaigns', () => {
      const campaigns = [makeMetaCampaign({ status: 'paused', frequency: 8.0 })];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts.length).toBe(0);
    });

    it('should not alert for low frequency', () => {
      const campaigns = [makeMetaCampaign({ frequency: 2.0 })];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts.length).toBe(0);
    });

    it('should sort by frequency descending', () => {
      const campaigns = [
        makeMetaCampaign({ campaignId: 'mc1', frequency: 5.0 }),
        makeMetaCampaign({ campaignId: 'mc2', frequency: 8.0, campaignName: 'High Freq' }),
      ];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts[0].frequency).toBe(8.0);
    });

    it('should estimate CTR decline percentage', () => {
      const campaigns = [makeMetaCampaign({ frequency: 6.0 })];
      const alerts = detectMetaFatigue(campaigns);
      expect(alerts[0].ctrDeclinePercent).toBeGreaterThan(0);
    });
  });

  // ── Cross-Channel Comparison ──

  describe('compareChannels', () => {
    it('should identify Meta as winner when higher ROAS', () => {
      const meta = { totalSpend: 1500, totalImpressions: 50000, totalReach: 35000, totalClicks: 1000, avgCTR: 2, avgCPC: 1.5, avgCPM: 30, totalConversions: 15, avgCPA: 100, totalRevenue: 6000, overallROAS: 4.0, topCampaign: 'A', topCampaignROAS: 5, worstCampaign: 'B', worstCampaignROAS: 2 };
      const google = { totalSpend: 1200, totalImpressions: 30000, totalClicks: 600, avgCTR: 2, avgCPC: 2, totalConversions: 8, avgCPA: 150, avgConversionRate: 1.3, avgImpressionShare: 45, totalRevenue: 2400, overallROAS: 2.0, topKeyword: 'botox', topKeywordConversions: 5, wastedSpend: 200, newOpportunities: 3 };
      const result = compareChannels(meta, google, defaultConfig);
      expect(result).not.toBeNull();
      expect(result!.winner).toBe('meta');
    });

    it('should calculate overall MER', () => {
      const meta = { totalSpend: 1500, totalImpressions: 0, totalReach: 0, totalClicks: 0, avgCTR: 0, avgCPC: 0, avgCPM: 0, totalConversions: 0, avgCPA: 0, totalRevenue: 4500, overallROAS: 3.0, topCampaign: '', topCampaignROAS: 0, worstCampaign: '', worstCampaignROAS: 0 };
      const google = { totalSpend: 1000, totalImpressions: 0, totalClicks: 0, avgCTR: 0, avgCPC: 0, totalConversions: 0, avgCPA: 0, avgConversionRate: 0, avgImpressionShare: 0, totalRevenue: 3000, overallROAS: 3.0, topKeyword: '', topKeywordConversions: 0, wastedSpend: 0, newOpportunities: 0 };
      const result = compareChannels(meta, google, defaultConfig);
      expect(result!.overallEfficiency.mer).toBe(3); // 7500/2500
    });

    it('should return null when both channels are null', () => {
      const result = compareChannels(null, null, defaultConfig);
      expect(result).toBeNull();
    });

    it('should handle single channel (Meta only)', () => {
      const meta = { totalSpend: 1500, totalImpressions: 50000, totalReach: 35000, totalClicks: 1000, avgCTR: 2, avgCPC: 1.5, avgCPM: 30, totalConversions: 15, avgCPA: 100, totalRevenue: 4500, overallROAS: 3.0, topCampaign: 'A', topCampaignROAS: 3, worstCampaign: 'A', worstCampaignROAS: 3 };
      const result = compareChannels(meta, null, defaultConfig);
      expect(result).not.toBeNull();
      expect(result!.meta.spend).toBe(1500);
      expect(result!.google.spend).toBe(0);
    });

    it('should generate cross-channel recommendations', () => {
      const meta = { totalSpend: 1500, totalImpressions: 50000, totalReach: 35000, totalClicks: 1000, avgCTR: 3.5, avgCPC: 1.5, avgCPM: 30, totalConversions: 15, avgCPA: 100, totalRevenue: 9000, overallROAS: 6.0, topCampaign: 'A', topCampaignROAS: 6, worstCampaign: 'A', worstCampaignROAS: 6 };
      const google = { totalSpend: 1200, totalImpressions: 30000, totalClicks: 600, avgCTR: 1.5, avgCPC: 2, totalConversions: 6, avgCPA: 200, avgConversionRate: 1, avgImpressionShare: 45, totalRevenue: 2400, overallROAS: 2.0, topKeyword: 'botox', topKeywordConversions: 3, wastedSpend: 300, newOpportunities: 2 };
      const result = compareChannels(meta, google, defaultConfig);
      expect(result!.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ── Ads Alerts ──

  describe('generateAdsAlerts', () => {
    it('should generate alert for low Meta ROAS', () => {
      const meta: MetaAdsPerformance = {
        summary: { ...calculateMetaSummary([makeMetaCampaign({ roas: 0.8, spend: 1500, revenue: 1200 })]), overallROAS: 0.8 },
        campaigns: [], adSetBreakdown: [], creativePerformance: [],
        fatigueAlerts: [], audienceOverlaps: [], dayOverDayTrend: [],
        weekOverWeekTrend: [], budgetPacing: calculateBudgetPacing(1500, 3000), competitorAds: [],
      };
      const alerts = generateAdsAlerts(meta, null);
      const roasAlert = alerts.find(a => a.metric === 'roas');
      expect(roasAlert).toBeDefined();
      expect(roasAlert!.severity).toBe('critical');
    });

    it('should generate alert for budget pacing issues', () => {
      const meta: MetaAdsPerformance = {
        summary: calculateMetaSummary([makeMetaCampaign()]),
        campaigns: [], adSetBreakdown: [], creativePerformance: [],
        fatigueAlerts: [], audienceOverlaps: [], dayOverDayTrend: [],
        weekOverWeekTrend: [],
        budgetPacing: { ...calculateBudgetPacing(100, 10000), pacingStatus: 'underspending' },
        competitorAds: [],
      };
      const alerts = generateAdsAlerts(meta, null);
      const pacingAlert = alerts.find(a => a.metric === 'budget_pacing');
      expect(pacingAlert).toBeDefined();
    });

    it('should generate alert for low impression share', () => {
      const google: GoogleAdsPerformance = {
        summary: { ...calculateGoogleSummary([makeGoogleCampaign()]), avgImpressionShare: 20 },
        campaigns: [], keywordPerformance: [], qualityScores: [],
        auctionInsights: [], geoPerformance: [], devicePerformance: [],
        adCopyTests: [], landingPages: [],
      };
      const alerts = generateAdsAlerts(null, google);
      const isAlert = alerts.find(a => a.metric === 'impression_share');
      expect(isAlert).toBeDefined();
    });

    it('should sort alerts by severity', () => {
      const meta: MetaAdsPerformance = {
        summary: { ...calculateMetaSummary([makeMetaCampaign()]), overallROAS: 0.5 },
        campaigns: [], adSetBreakdown: [], creativePerformance: [],
        fatigueAlerts: [{ adId: '1', adName: 'Test', frequency: 5, ctrTrend: [], ctrDeclinePercent: 20, daysRunning: 30, recommendation: 'Refresh', urgency: 'this_week' }],
        audienceOverlaps: [], dayOverDayTrend: [], weekOverWeekTrend: [],
        budgetPacing: calculateBudgetPacing(1500, 3000), competitorAds: [],
      };
      const alerts = generateAdsAlerts(meta, null);
      if (alerts.length >= 2) {
        const sOrder = { critical: 0, warning: 1, info: 2 };
        expect(sOrder[alerts[0].severity]).toBeLessThanOrEqual(sOrder[alerts[1].severity]);
      }
    });

    it('should handle null inputs gracefully', () => {
      const alerts = generateAdsAlerts(null, null);
      expect(alerts.length).toBe(0);
    });
  });

  // ── Action Items ──

  describe('generateAdsActionItems', () => {
    it('should generate fatigue action items', () => {
      const meta: MetaAdsPerformance = {
        summary: calculateMetaSummary([makeMetaCampaign()]),
        campaigns: [], adSetBreakdown: [], creativePerformance: [],
        fatigueAlerts: [{ adId: '1', adName: 'Fatigued Ad', frequency: 6, ctrTrend: [], ctrDeclinePercent: 30, daysRunning: 45, recommendation: 'Replace', urgency: 'immediate' }],
        audienceOverlaps: [], dayOverDayTrend: [], weekOverWeekTrend: [],
        budgetPacing: calculateBudgetPacing(1500, 3000), competitorAds: [],
      };
      const items = generateAdsActionItems(meta, null, null);
      expect(items.some(i => i.action.includes('Fatigued Ad'))).toBe(true);
    });

    it('should sort action items by priority', () => {
      const meta: MetaAdsPerformance = {
        summary: calculateMetaSummary([makeMetaCampaign()]),
        campaigns: [], adSetBreakdown: [], creativePerformance: [],
        fatigueAlerts: [
          { adId: '1', adName: 'Critical', frequency: 8, ctrTrend: [], ctrDeclinePercent: 40, daysRunning: 60, recommendation: 'Replace NOW', urgency: 'immediate' },
          { adId: '2', adName: 'Medium', frequency: 5, ctrTrend: [], ctrDeclinePercent: 15, daysRunning: 30, recommendation: 'Refresh', urgency: 'this_week' },
        ],
        audienceOverlaps: [], dayOverDayTrend: [], weekOverWeekTrend: [],
        budgetPacing: calculateBudgetPacing(1500, 3000), competitorAds: [],
      };
      const items = generateAdsActionItems(meta, null, null);
      if (items.length >= 2) {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(pOrder[items[0].priority]).toBeLessThanOrEqual(pOrder[items[1].priority]);
      }
    });
  });

  // ── API Response Parsing ──

  describe('parseMetaAdsResponse', () => {
    it('should parse API response into campaign metrics', () => {
      const apiData = {
        data: [{
          campaign_id: 'c1', campaign_name: 'Test Campaign', objective: 'CONVERSIONS',
          status: 'ACTIVE', spend: '1500.50', impressions: '50000', reach: '35000',
          clicks: '1000', ctr: '2.0', cpc: '1.50', cpm: '30.01', frequency: '1.8',
          actions: [{ action_type: 'lead', value: '15' }],
          action_values: [{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '4500' }],
        }],
      };
      const result = parseMetaAdsResponse(apiData, defaultConfig);
      expect(result.campaigns.length).toBe(1);
      expect(result.campaigns[0].spend).toBeCloseTo(1500.5);
      expect(result.campaigns[0].conversions).toBe(15);
    });

    it('should handle empty API response', () => {
      const result = parseMetaAdsResponse({ data: [] }, defaultConfig);
      expect(result.campaigns.length).toBe(0);
      expect(result.summary.totalSpend).toBe(0);
    });
  });

  describe('parseGoogleAdsResponse', () => {
    it('should parse API response into campaign metrics', () => {
      const apiData = {
        results: [{
          campaign: { id: 'gc1', name: 'Search Campaign', advertisingChannelType: 'SEARCH', status: 'ENABLED' },
          metrics: { costMicros: '1200000000', impressions: '30000', clicks: '600', ctr: '0.02', averageCpc: '2000000', conversions: '12', conversionsFromInteractionsRate: '0.02', searchImpressionShare: '0.45' },
        }],
      };
      const result = parseGoogleAdsResponse(apiData);
      expect(result.campaigns.length).toBe(1);
      expect(result.campaigns[0].spend).toBe(1200);
      expect(result.campaigns[0].campaignType).toBe('search');
    });

    it('should handle empty API response', () => {
      const result = parseGoogleAdsResponse({ results: [] });
      expect(result.campaigns.length).toBe(0);
    });
  });
});
