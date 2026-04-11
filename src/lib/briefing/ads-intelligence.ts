/**
 * Rani Beauty Clinic - Advertising Performance Intelligence
 *
 * Unified Meta Ads + Google Ads performance monitoring with cross-channel
 * comparison, budget pacing, competitor ad library monitoring, and
 * efficiency analysis for the CEO morning briefing.
 */

import { env } from '@/lib/env';

// ── Meta Ads Performance ──────────────────────────────────────

export interface MetaAdsCampaignMetrics {
  campaignId: string;
  campaignName: string;
  objective: string;
  status: 'active' | 'paused' | 'completed';
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  costPerConversion: number;
  revenue: number;
  roas: number;
  frequency: number;
}

export interface MetaAdsAdSetBreakdown {
  adSetId: string;
  adSetName: string;
  campaignId: string;
  audience: string;
  placement: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
}

export interface MetaAdsCreativePerformance {
  adId: string;
  adName: string;
  adSetId: string;
  type: 'image' | 'video' | 'carousel';
  thumbnailUrl: string;
  headline: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roas: number;
  frequency: number;
  performanceRating: 'top' | 'good' | 'average' | 'poor';
}

export interface MetaAdsFatigueAlert {
  adId: string;
  adName: string;
  frequency: number;
  ctrTrend: number[]; // last 7 days CTR
  ctrDeclinePercent: number;
  daysRunning: number;
  recommendation: string;
  urgency: 'immediate' | 'this_week' | 'monitor';
}

export interface MetaAdsAudienceOverlap {
  adSet1: string;
  adSet2: string;
  overlapPercent: number;
  recommendation: string;
}

export interface MetaAdsTrend {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
}

export interface MetaAdsBudgetPacing {
  monthlyBudget: number;
  spentToDate: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyBudgetTarget: number;
  actualDailyAvg: number;
  projectedMonthSpend: number;
  pacingStatus: 'on_track' | 'underspending' | 'overspending';
  pacingPercent: number; // actual / expected * 100
  recommendation: string;
}

export interface MetaCompetitorAd {
  pageName: string;
  pageId: string;
  adCount: number;
  activeAds: number;
  platforms: string[];
  topCreativeTypes: string[];
  estimatedSpend: string; // range like "$1,000-$5,000"
  themes: string[];
  callToActions: string[];
  lastSeen: string;
}

export interface MetaAdsPerformance {
  summary: MetaAdsSummary;
  campaigns: MetaAdsCampaignMetrics[];
  adSetBreakdown: MetaAdsAdSetBreakdown[];
  creativePerformance: MetaAdsCreativePerformance[];
  fatigueAlerts: MetaAdsFatigueAlert[];
  audienceOverlaps: MetaAdsAudienceOverlap[];
  dayOverDayTrend: MetaAdsTrend[];
  weekOverWeekTrend: MetaAdsTrend[];
  budgetPacing: MetaAdsBudgetPacing;
  competitorAds: MetaCompetitorAd[];
}

export interface MetaAdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  totalConversions: number;
  avgCPA: number;
  totalRevenue: number;
  overallROAS: number;
  topCampaign: string;
  topCampaignROAS: number;
  worstCampaign: string;
  worstCampaignROAS: number;
}

// ── Google Ads Performance ────────────────────────────────────

export interface GoogleAdsCampaignMetrics {
  campaignId: string;
  campaignName: string;
  campaignType: 'search' | 'display' | 'performance_max' | 'shopping' | 'video';
  status: 'active' | 'paused' | 'completed';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
  conversionRate: number;
  impressionShare: number;
  lostISBudget: number; // impression share lost to budget
  lostISRank: number; // impression share lost to rank
}

export interface GoogleAdsKeywordPerformance {
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
  qualityScore: number;
  status: 'top_performer' | 'profitable' | 'break_even' | 'wasted_spend' | 'new_opportunity';
  spend: number;
  revenue: number;
}

export interface GoogleAdsQualityScore {
  keyword: string;
  qualityScore: number;
  expectedCTR: 'above_average' | 'average' | 'below_average';
  adRelevance: 'above_average' | 'average' | 'below_average';
  landingPageExp: 'above_average' | 'average' | 'below_average';
  improvementActions: string[];
}

export interface GoogleAdsAuctionInsight {
  competitor: string;
  impressionShare: number;
  overlapRate: number;
  positionAboveRate: number;
  topOfPageRate: number;
  outRankingShare: number;
}

export interface GoogleAdsGeoPerformance {
  location: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  spend: number;
  performanceRating: 'top' | 'good' | 'average' | 'poor';
}

export interface GoogleAdsDevicePerformance {
  device: 'mobile' | 'desktop' | 'tablet';
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  spend: number;
  conversionRate: number;
}

export interface GoogleAdsAdCopyTest {
  headline1: string;
  headline2: string;
  description: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  status: 'winner' | 'loser' | 'testing' | 'inconclusive';
  confidence: number; // statistical confidence 0-100
}

export interface GoogleAdsLandingPagePerformance {
  url: string;
  pageTitle: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  mobileSpeed: number; // seconds
  desktopSpeed: number;
  status: 'top' | 'good' | 'needs_improvement' | 'poor';
}

export interface GoogleAdsPerformance {
  summary: GoogleAdsSummary;
  campaigns: GoogleAdsCampaignMetrics[];
  keywordPerformance: GoogleAdsKeywordPerformance[];
  qualityScores: GoogleAdsQualityScore[];
  auctionInsights: GoogleAdsAuctionInsight[];
  geoPerformance: GoogleAdsGeoPerformance[];
  devicePerformance: GoogleAdsDevicePerformance[];
  adCopyTests: GoogleAdsAdCopyTest[];
  landingPages: GoogleAdsLandingPagePerformance[];
}

export interface GoogleAdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  avgCPC: number;
  totalConversions: number;
  avgCPA: number;
  avgConversionRate: number;
  avgImpressionShare: number;
  totalRevenue: number;
  overallROAS: number;
  topKeyword: string;
  topKeywordConversions: number;
  wastedSpend: number; // spend on non-converting keywords
  newOpportunities: number; // count of keyword opportunities
}

// ── Cross-Channel Comparison ──────────────────────────────────

export interface CrossChannelComparison {
  meta: ChannelEfficiency;
  google: ChannelEfficiency;
  winner: 'meta' | 'google' | 'tie';
  winnerReason: string;
  recommendations: CrossChannelRecommendation[];
  overallEfficiency: MarketingEfficiencyRatio;
}

export interface ChannelEfficiency {
  channel: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  revenueShare: number; // percentage of total revenue
  spendShare: number; // percentage of total spend
}

export interface CrossChannelRecommendation {
  type: 'budget_shift' | 'creative_sync' | 'audience_expansion' | 'keyword_to_interest' | 'landing_page';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImpact: string;
  fromChannel: 'meta' | 'google';
  toChannel: 'meta' | 'google';
}

export interface MarketingEfficiencyRatio {
  totalAdSpend: number;
  totalRevenue: number;
  totalConversions: number;
  blendedROAS: number;
  blendedCPA: number;
  mer: number; // marketing efficiency ratio = revenue / ad spend
  targetMER: number;
  vsTarget: number; // percentage difference
  status: 'exceeding' | 'on_target' | 'below_target' | 'critical';
}

// ── Combined Ads Intelligence ─────────────────────────────────

export interface AdsIntelligence {
  generatedAt: string;
  meta: MetaAdsPerformance | null;
  google: GoogleAdsPerformance | null;
  crossChannel: CrossChannelComparison | null;
  alerts: AdsAlert[];
  topActionItems: AdsActionItem[];
}

export interface AdsAlert {
  channel: 'meta' | 'google' | 'cross_channel';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
}

export interface AdsActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  channel: 'meta' | 'google' | 'both';
  action: string;
  reason: string;
  estimatedImpact: string;
  timeframe: 'immediate' | 'today' | 'this_week';
}

// ── Configuration ─────────────────────────────────────────────

export interface AdsIntelligenceConfig {
  metaAccessToken?: string;
  metaAdAccountId?: string;
  googleCustomerId?: string;
  googleDeveloperToken?: string;
  googleRefreshToken?: string;
  monthlyBudget: {
    meta: number;
    google: number;
    total: number;
  };
  targets: {
    roas: number;
    cpa: number;
    mer: number;
  };
}

// ── Constants ─────────────────────────────────────────────────

const ALERT_THRESHOLDS = {
  roas: { critical: 1.0, warning: 2.0 },
  cpa: { critical: 250, warning: 150 },
  ctr: { critical: 0.5, warning: 1.0 },
  frequency: { critical: 6.0, warning: 4.0 },
  budgetPacing: { underspend: 80, overspend: 110 },
  impressionShare: { low: 30, medium: 50 },
  qualityScore: { poor: 4, average: 6 },
};

// ── Core Functions ────────────────────────────────────────────

/**
 * Fetch Meta Ads performance data via Marketing API
 */
export async function fetchMetaAdsPerformance(config: AdsIntelligenceConfig): Promise<MetaAdsPerformance | null> {
  if (!config.metaAccessToken || !config.metaAdAccountId) {
    return null;
  }

  try {
    const baseUrl = `https://graph.facebook.com/v19.0/act_${config.metaAdAccountId}`;
    const params = new URLSearchParams({
      access_token: config.metaAccessToken,
      date_preset: 'last_30d',
      fields: 'campaign_name,campaign_id,objective,status,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values,frequency',
      level: 'campaign',
    });

    const response = await fetch(`${baseUrl}/insights?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('Meta Ads API error:', response.status);
      return null;
    }

    const data = await response.json();
    return parseMetaAdsResponse(data, config);
  } catch (error) {
    console.error('Failed to fetch Meta Ads data:', error);
    return null;
  }
}

/**
 * Parse Meta Ads API response into our performance structure
 */
export function parseMetaAdsResponse(
  apiData: MetaAdsAPIResponse,
  config: AdsIntelligenceConfig
): MetaAdsPerformance {
  const campaigns: MetaAdsCampaignMetrics[] = (apiData.data || []).map(row => {
    const conversions = extractMetaConversions(row.actions);
    const revenue = extractMetaRevenue(row.action_values);

    return {
      campaignId: row.campaign_id || '',
      campaignName: row.campaign_name || '',
      objective: row.objective || '',
      status: (row.status || 'active') as 'active' | 'paused' | 'completed',
      spend: parseFloat(row.spend || '0'),
      impressions: parseInt(row.impressions || '0'),
      reach: parseInt(row.reach || '0'),
      clicks: parseInt(row.clicks || '0'),
      ctr: parseFloat(row.ctr || '0'),
      cpc: parseFloat(row.cpc || '0'),
      cpm: parseFloat(row.cpm || '0'),
      conversions,
      costPerConversion: conversions > 0 ? parseFloat(row.spend || '0') / conversions : 0,
      revenue,
      roas: parseFloat(row.spend || '0') > 0 ? revenue / parseFloat(row.spend || '0') : 0,
      frequency: parseFloat(row.frequency || '0'),
    };
  });

  const summary = calculateMetaSummary(campaigns);
  const budgetPacing = calculateBudgetPacing(summary.totalSpend, config.monthlyBudget.meta);
  const fatigueAlerts = detectMetaFatigue(campaigns);

  return {
    summary,
    campaigns,
    adSetBreakdown: [], // populated by additional API calls
    creativePerformance: [], // populated by additional API calls
    fatigueAlerts,
    audienceOverlaps: [],
    dayOverDayTrend: [],
    weekOverWeekTrend: [],
    budgetPacing,
    competitorAds: [],
  };
}

interface MetaAdsAPIResponse {
  data?: MetaAdsAPIRow[];
}

interface MetaAdsAPIRow {
  campaign_id?: string;
  campaign_name?: string;
  objective?: string;
  status?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: MetaAdsAction[];
  action_values?: MetaAdsAction[];
}

interface MetaAdsAction {
  action_type: string;
  value: string;
}

function extractMetaConversions(actions?: MetaAdsAction[]): number {
  if (!actions) return 0;
  const conversionTypes = ['offsite_conversion.fb_pixel_lead', 'offsite_conversion.fb_pixel_purchase', 'lead', 'complete_registration'];
  let total = 0;
  for (const action of actions) {
    if (conversionTypes.includes(action.action_type)) {
      total += parseInt(action.value || '0');
    }
  }
  return total;
}

function extractMetaRevenue(actionValues?: MetaAdsAction[]): number {
  if (!actionValues) return 0;
  const revenueTypes = ['offsite_conversion.fb_pixel_purchase'];
  let total = 0;
  for (const action of actionValues) {
    if (revenueTypes.includes(action.action_type)) {
      total += parseFloat(action.value || '0');
    }
  }
  return total;
}

/**
 * Calculate Meta Ads summary from campaign-level data
 */
export function calculateMetaSummary(campaigns: MetaAdsCampaignMetrics[]): MetaAdsSummary {
  if (campaigns.length === 0) {
    return {
      totalSpend: 0, totalImpressions: 0, totalReach: 0, totalClicks: 0,
      avgCTR: 0, avgCPC: 0, avgCPM: 0, totalConversions: 0, avgCPA: 0,
      totalRevenue: 0, overallROAS: 0,
      topCampaign: 'N/A', topCampaignROAS: 0,
      worstCampaign: 'N/A', worstCampaignROAS: 0,
    };
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

  const sorted = [...campaigns].sort((a, b) => b.roas - a.roas);
  const top = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    totalSpend: round(totalSpend),
    totalImpressions,
    totalReach,
    totalClicks,
    avgCTR: totalImpressions > 0 ? round((totalClicks / totalImpressions) * 100) : 0,
    avgCPC: totalClicks > 0 ? round(totalSpend / totalClicks) : 0,
    avgCPM: totalImpressions > 0 ? round((totalSpend / totalImpressions) * 1000) : 0,
    totalConversions,
    avgCPA: totalConversions > 0 ? round(totalSpend / totalConversions) : 0,
    totalRevenue: round(totalRevenue),
    overallROAS: totalSpend > 0 ? round(totalRevenue / totalSpend) : 0,
    topCampaign: top.campaignName,
    topCampaignROAS: round(top.roas),
    worstCampaign: worst.campaignName,
    worstCampaignROAS: round(worst.roas),
  };
}

/**
 * Fetch Google Ads performance data
 */
export async function fetchGoogleAdsPerformance(config: AdsIntelligenceConfig): Promise<GoogleAdsPerformance | null> {
  if (!config.googleCustomerId || !config.googleDeveloperToken || !config.googleRefreshToken) {
    return null;
  }

  try {
    // Google Ads API v16 endpoint
    const baseUrl = `https://googleads.googleapis.com/v16/customers/${config.googleCustomerId}/googleAds:searchStream`;

    const accessToken = await refreshGoogleAccessToken(config.googleRefreshToken);
    if (!accessToken) return null;

    const query = `
      SELECT
        campaign.id, campaign.name, campaign.advertising_channel_type, campaign.status,
        metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
        metrics.average_cpc, metrics.conversions, metrics.cost_per_conversion,
        metrics.conversions_from_interactions_rate,
        metrics.search_impression_share, metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
    `;

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': config.googleDeveloperToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('Google Ads API error:', response.status);
      return null;
    }

    const data = await response.json();
    return parseGoogleAdsResponse(data);
  } catch (error) {
    console.error('Failed to fetch Google Ads data:', error);
    return null;
  }
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.GOOGLE_ADS_CLIENT_ID || '',
        client_secret: env.GOOGLE_ADS_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Parse Google Ads API response
 */
export function parseGoogleAdsResponse(apiData: GoogleAdsAPIResponse): GoogleAdsPerformance {
  const campaigns: GoogleAdsCampaignMetrics[] = [];

  for (const result of apiData.results || apiData[0]?.results || []) {
    const campaign = result.campaign || {};
    const metrics = result.metrics || {};

    const spend = (parseInt(metrics.costMicros || '0') / 1_000_000);
    const conversions = parseFloat(metrics.conversions || '0');

    campaigns.push({
      campaignId: campaign.id || '',
      campaignName: campaign.name || '',
      campaignType: mapGoogleCampaignType(campaign.advertisingChannelType),
      status: mapGoogleStatus(campaign.status),
      spend: round(spend),
      impressions: parseInt(metrics.impressions || '0'),
      clicks: parseInt(metrics.clicks || '0'),
      ctr: parseFloat(metrics.ctr || '0') * 100,
      cpc: parseInt(metrics.averageCpc || '0') / 1_000_000,
      conversions: Math.round(conversions),
      costPerConversion: conversions > 0 ? round(spend / conversions) : 0,
      conversionRate: parseFloat(metrics.conversionsFromInteractionsRate || '0') * 100,
      impressionShare: parseFloat(metrics.searchImpressionShare || '0') * 100,
      lostISBudget: parseFloat(metrics.searchBudgetLostImpressionShare || '0') * 100,
      lostISRank: parseFloat(metrics.searchRankLostImpressionShare || '0') * 100,
    });
  }

  const summary = calculateGoogleSummary(campaigns);

  return {
    summary,
    campaigns,
    keywordPerformance: [],
    qualityScores: [],
    auctionInsights: [],
    geoPerformance: [],
    devicePerformance: [],
    adCopyTests: [],
    landingPages: [],
  };
}

interface GoogleAdsAPIResponse {
  results?: GoogleAdsAPIRow[];
  [index: number]: { results?: GoogleAdsAPIRow[] };
}

interface GoogleAdsAPIRow {
  campaign?: {
    id?: string;
    name?: string;
    advertisingChannelType?: string;
    status?: string;
  };
  metrics?: {
    costMicros?: string;
    impressions?: string;
    clicks?: string;
    ctr?: string;
    averageCpc?: string;
    conversions?: string;
    costPerConversion?: string;
    conversionsFromInteractionsRate?: string;
    searchImpressionShare?: string;
    searchBudgetLostImpressionShare?: string;
    searchRankLostImpressionShare?: string;
  };
}

function mapGoogleCampaignType(type?: string): GoogleAdsCampaignMetrics['campaignType'] {
  const map: Record<string, GoogleAdsCampaignMetrics['campaignType']> = {
    'SEARCH': 'search',
    'DISPLAY': 'display',
    'PERFORMANCE_MAX': 'performance_max',
    'SHOPPING': 'shopping',
    'VIDEO': 'video',
  };
  return map[type || ''] || 'search';
}

function mapGoogleStatus(status?: string): 'active' | 'paused' | 'completed' {
  if (status === 'ENABLED') return 'active';
  if (status === 'PAUSED') return 'paused';
  return 'completed';
}

/**
 * Calculate Google Ads summary
 */
export function calculateGoogleSummary(campaigns: GoogleAdsCampaignMetrics[]): GoogleAdsSummary {
  if (campaigns.length === 0) {
    return {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0, avgCTR: 0, avgCPC: 0,
      totalConversions: 0, avgCPA: 0, avgConversionRate: 0, avgImpressionShare: 0,
      totalRevenue: 0, overallROAS: 0,
      topKeyword: 'N/A', topKeywordConversions: 0, wastedSpend: 0, newOpportunities: 0,
    };
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const avgImpressionShare = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + c.impressionShare, 0) / activeCampaigns.length
    : 0;

  // Estimate revenue as conversions * average booking value ($350)
  const estimatedRevenue = totalConversions * 350;

  return {
    totalSpend: round(totalSpend),
    totalImpressions,
    totalClicks,
    avgCTR: totalImpressions > 0 ? round((totalClicks / totalImpressions) * 100) : 0,
    avgCPC: totalClicks > 0 ? round(totalSpend / totalClicks) : 0,
    totalConversions,
    avgCPA: totalConversions > 0 ? round(totalSpend / totalConversions) : 0,
    avgConversionRate: totalClicks > 0 ? round((totalConversions / totalClicks) * 100) : 0,
    avgImpressionShare: round(avgImpressionShare),
    totalRevenue: round(estimatedRevenue),
    overallROAS: totalSpend > 0 ? round(estimatedRevenue / totalSpend) : 0,
    topKeyword: 'N/A',
    topKeywordConversions: 0,
    wastedSpend: 0,
    newOpportunities: 0,
  };
}

/**
 * Calculate budget pacing for a channel
 */
export function calculateBudgetPacing(spentToDate: number, monthlyBudget: number): MetaAdsBudgetPacing {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const dailyBudgetTarget = monthlyBudget / daysInMonth;
  const expectedSpend = dailyBudgetTarget * daysElapsed;
  const actualDailyAvg = daysElapsed > 0 ? spentToDate / daysElapsed : 0;
  const projectedMonthSpend = actualDailyAvg * daysInMonth;
  const pacingPercent = expectedSpend > 0 ? round((spentToDate / expectedSpend) * 100) : 0;

  let pacingStatus: MetaAdsBudgetPacing['pacingStatus'] = 'on_track';
  let recommendation = 'Budget pacing is on track.';

  if (pacingPercent < ALERT_THRESHOLDS.budgetPacing.underspend) {
    pacingStatus = 'underspending';
    recommendation = `Underspending by ${100 - pacingPercent}%. Consider increasing daily budgets or launching new campaigns to capture demand.`;
  } else if (pacingPercent > ALERT_THRESHOLDS.budgetPacing.overspend) {
    pacingStatus = 'overspending';
    recommendation = `Overspending by ${pacingPercent - 100}%. Review campaign budgets and pause low-ROAS campaigns to stay within budget.`;
  }

  return {
    monthlyBudget,
    spentToDate: round(spentToDate),
    daysElapsed,
    daysRemaining,
    dailyBudgetTarget: round(dailyBudgetTarget),
    actualDailyAvg: round(actualDailyAvg),
    projectedMonthSpend: round(projectedMonthSpend),
    pacingStatus,
    pacingPercent,
    recommendation,
  };
}

/**
 * Detect creative fatigue from campaign-level frequency data
 */
export function detectMetaFatigue(campaigns: MetaAdsCampaignMetrics[]): MetaAdsFatigueAlert[] {
  const alerts: MetaAdsFatigueAlert[] = [];

  for (const campaign of campaigns) {
    if (campaign.status !== 'active') continue;

    if (campaign.frequency >= ALERT_THRESHOLDS.frequency.warning) {
      const urgency: MetaAdsFatigueAlert['urgency'] =
        campaign.frequency >= ALERT_THRESHOLDS.frequency.critical ? 'immediate' : 'this_week';

      const ctrDeclinePercent = Math.round((campaign.frequency - 2) * 8);

      alerts.push({
        adId: campaign.campaignId,
        adName: campaign.campaignName,
        frequency: campaign.frequency,
        ctrTrend: [], // populated by time-series API call
        ctrDeclinePercent,
        daysRunning: 0,
        recommendation: urgency === 'immediate'
          ? `Frequency at ${campaign.frequency}x - replace creative immediately to prevent wasted spend`
          : `Frequency at ${campaign.frequency}x - refresh creative this week to maintain CTR`,
        urgency,
      });
    }
  }

  return alerts.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Compare Meta vs Google performance
 */
export function compareChannels(
  meta: MetaAdsSummary | null,
  google: GoogleAdsSummary | null,
  config: AdsIntelligenceConfig
): CrossChannelComparison | null {
  if (!meta && !google) return null;

  const metaChannel: ChannelEfficiency = meta ? {
    channel: 'Meta (Facebook/Instagram)',
    spend: meta.totalSpend,
    revenue: meta.totalRevenue,
    conversions: meta.totalConversions,
    roas: meta.overallROAS,
    cpa: meta.avgCPA,
    ctr: meta.avgCTR,
    conversionRate: meta.totalClicks > 0 ? (meta.totalConversions / meta.totalClicks) * 100 : 0,
    revenueShare: 0,
    spendShare: 0,
  } : emptyChannel('Meta (Facebook/Instagram)');

  const googleChannel: ChannelEfficiency = google ? {
    channel: 'Google Ads',
    spend: google.totalSpend,
    revenue: google.totalRevenue,
    conversions: google.totalConversions,
    roas: google.overallROAS,
    cpa: google.avgCPA,
    ctr: google.avgCTR,
    conversionRate: google.avgConversionRate,
    revenueShare: 0,
    spendShare: 0,
  } : emptyChannel('Google Ads');

  const totalSpend = metaChannel.spend + googleChannel.spend;
  const totalRevenue = metaChannel.revenue + googleChannel.revenue;

  metaChannel.spendShare = totalSpend > 0 ? round((metaChannel.spend / totalSpend) * 100) : 0;
  metaChannel.revenueShare = totalRevenue > 0 ? round((metaChannel.revenue / totalRevenue) * 100) : 0;
  googleChannel.spendShare = totalSpend > 0 ? round((googleChannel.spend / totalSpend) * 100) : 0;
  googleChannel.revenueShare = totalRevenue > 0 ? round((googleChannel.revenue / totalRevenue) * 100) : 0;

  let winner: 'meta' | 'google' | 'tie' = 'tie';
  let winnerReason = 'Both channels performing similarly';

  if (metaChannel.roas > googleChannel.roas * 1.2) {
    winner = 'meta';
    winnerReason = `Meta ROAS (${metaChannel.roas}x) outperforms Google (${googleChannel.roas}x) by ${round(((metaChannel.roas - googleChannel.roas) / googleChannel.roas) * 100)}%`;
  } else if (googleChannel.roas > metaChannel.roas * 1.2) {
    winner = 'google';
    winnerReason = `Google ROAS (${googleChannel.roas}x) outperforms Meta (${metaChannel.roas}x) by ${round(((googleChannel.roas - metaChannel.roas) / metaChannel.roas) * 100)}%`;
  }

  const recommendations = generateCrossChannelRecommendations(metaChannel, googleChannel);

  const totalConversions = metaChannel.conversions + googleChannel.conversions;
  const blendedROAS = totalSpend > 0 ? round(totalRevenue / totalSpend) : 0;
  const blendedCPA = totalConversions > 0 ? round(totalSpend / totalConversions) : 0;
  const mer = totalSpend > 0 ? round(totalRevenue / totalSpend) : 0;

  let merStatus: MarketingEfficiencyRatio['status'] = 'on_target';
  if (mer >= config.targets.mer * 1.2) merStatus = 'exceeding';
  else if (mer < config.targets.mer * 0.7) merStatus = 'critical';
  else if (mer < config.targets.mer) merStatus = 'below_target';

  return {
    meta: metaChannel,
    google: googleChannel,
    winner,
    winnerReason,
    recommendations,
    overallEfficiency: {
      totalAdSpend: round(totalSpend),
      totalRevenue: round(totalRevenue),
      totalConversions,
      blendedROAS,
      blendedCPA,
      mer,
      targetMER: config.targets.mer,
      vsTarget: config.targets.mer > 0 ? round(((mer - config.targets.mer) / config.targets.mer) * 100) : 0,
      status: merStatus,
    },
  };
}

function emptyChannel(name: string): ChannelEfficiency {
  return {
    channel: name, spend: 0, revenue: 0, conversions: 0, roas: 0,
    cpa: 0, ctr: 0, conversionRate: 0, revenueShare: 0, spendShare: 0,
  };
}

function generateCrossChannelRecommendations(
  meta: ChannelEfficiency,
  google: ChannelEfficiency
): CrossChannelRecommendation[] {
  const recs: CrossChannelRecommendation[] = [];

  // Budget shift recommendation
  if (meta.roas > google.roas * 1.5 && google.spend > 0) {
    recs.push({
      type: 'budget_shift',
      priority: 'high',
      title: 'Shift budget from Google to Meta',
      description: `Meta ROAS (${meta.roas}x) significantly outperforms Google (${google.roas}x). Consider shifting 20% of Google budget to Meta.`,
      estimatedImpact: `+$${round(google.spend * 0.2 * (meta.roas - google.roas))} additional revenue`,
      fromChannel: 'google',
      toChannel: 'meta',
    });
  } else if (google.roas > meta.roas * 1.5 && meta.spend > 0) {
    recs.push({
      type: 'budget_shift',
      priority: 'high',
      title: 'Shift budget from Meta to Google',
      description: `Google ROAS (${google.roas}x) significantly outperforms Meta (${meta.roas}x). Consider shifting 20% of Meta budget to Google.`,
      estimatedImpact: `+$${round(meta.spend * 0.2 * (google.roas - meta.roas))} additional revenue`,
      fromChannel: 'meta',
      toChannel: 'google',
    });
  }

  // CTR sync recommendation
  if (meta.ctr > 3 && google.ctr < 2) {
    recs.push({
      type: 'creative_sync',
      priority: 'medium',
      title: 'Apply Meta creative insights to Google ads',
      description: `Meta CTR (${meta.ctr}%) is strong while Google CTR (${google.ctr}%) lags. Test Meta\'s top-performing headlines and angles in Google ad copy.`,
      estimatedImpact: 'Potential 30-50% CTR improvement on Google',
      fromChannel: 'meta',
      toChannel: 'google',
    });
  }

  return recs;
}

/**
 * Generate ads alerts based on performance thresholds
 */
export function generateAdsAlerts(
  meta: MetaAdsPerformance | null,
  google: GoogleAdsPerformance | null
): AdsAlert[] {
  const alerts: AdsAlert[] = [];

  if (meta) {
    if (meta.summary.overallROAS < ALERT_THRESHOLDS.roas.critical) {
      alerts.push({
        channel: 'meta',
        severity: 'critical',
        title: 'Meta ROAS below breakeven',
        message: `Overall Meta ROAS at ${meta.summary.overallROAS}x (below ${ALERT_THRESHOLDS.roas.critical}x breakeven)`,
        metric: 'roas',
        currentValue: meta.summary.overallROAS,
        threshold: ALERT_THRESHOLDS.roas.critical,
      });
    } else if (meta.summary.overallROAS < ALERT_THRESHOLDS.roas.warning) {
      alerts.push({
        channel: 'meta',
        severity: 'warning',
        title: 'Meta ROAS below target',
        message: `Overall Meta ROAS at ${meta.summary.overallROAS}x (target: ${ALERT_THRESHOLDS.roas.warning}x)`,
        metric: 'roas',
        currentValue: meta.summary.overallROAS,
        threshold: ALERT_THRESHOLDS.roas.warning,
      });
    }

    if (meta.budgetPacing.pacingStatus !== 'on_track') {
      alerts.push({
        channel: 'meta',
        severity: 'warning',
        title: `Meta budget ${meta.budgetPacing.pacingStatus}`,
        message: meta.budgetPacing.recommendation,
        metric: 'budget_pacing',
        currentValue: meta.budgetPacing.pacingPercent,
        threshold: 100,
      });
    }

    for (const fatigue of meta.fatigueAlerts) {
      alerts.push({
        channel: 'meta',
        severity: fatigue.urgency === 'immediate' ? 'critical' : 'warning',
        title: `Creative fatigue: ${fatigue.adName}`,
        message: fatigue.recommendation,
        metric: 'frequency',
        currentValue: fatigue.frequency,
        threshold: ALERT_THRESHOLDS.frequency.warning,
      });
    }
  }

  if (google) {
    if (google.summary.avgImpressionShare < ALERT_THRESHOLDS.impressionShare.low) {
      alerts.push({
        channel: 'google',
        severity: 'warning',
        title: 'Low search impression share',
        message: `Average impression share at ${google.summary.avgImpressionShare}% - you\'re missing ${100 - google.summary.avgImpressionShare}% of potential searches`,
        metric: 'impression_share',
        currentValue: google.summary.avgImpressionShare,
        threshold: ALERT_THRESHOLDS.impressionShare.medium,
      });
    }

    if (google.summary.wastedSpend > google.summary.totalSpend * 0.15) {
      alerts.push({
        channel: 'google',
        severity: 'warning',
        title: 'High wasted spend on Google',
        message: `$${google.summary.wastedSpend} spent on non-converting keywords (${round((google.summary.wastedSpend / google.summary.totalSpend) * 100)}% of total)`,
        metric: 'wasted_spend',
        currentValue: google.summary.wastedSpend,
        threshold: google.summary.totalSpend * 0.15,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sOrder = { critical: 0, warning: 1, info: 2 };
    return sOrder[a.severity] - sOrder[b.severity];
  });
}

/**
 * Generate top action items from ads data
 */
export function generateAdsActionItems(
  meta: MetaAdsPerformance | null,
  google: GoogleAdsPerformance | null,
  crossChannel: CrossChannelComparison | null
): AdsActionItem[] {
  const items: AdsActionItem[] = [];

  // Meta action items
  if (meta) {
    for (const fatigue of meta.fatigueAlerts.slice(0, 2)) {
      items.push({
        priority: fatigue.urgency === 'immediate' ? 'critical' : 'high',
        channel: 'meta',
        action: `Refresh creative for "${fatigue.adName}"`,
        reason: `Frequency at ${fatigue.frequency}x with estimated ${fatigue.ctrDeclinePercent}% CTR decline`,
        estimatedImpact: '20-40% CTR recovery',
        timeframe: fatigue.urgency === 'immediate' ? 'immediate' : 'this_week',
      });
    }

    if (meta.budgetPacing.pacingStatus === 'underspending') {
      items.push({
        priority: 'medium',
        channel: 'meta',
        action: 'Increase Meta daily budgets',
        reason: `Underspending by ${100 - meta.budgetPacing.pacingPercent}% - missing potential conversions`,
        estimatedImpact: `Capture ${round((1 - meta.budgetPacing.pacingPercent / 100) * meta.summary.totalConversions)} additional conversions`,
        timeframe: 'today',
      });
    }
  }

  // Google action items
  if (google) {
    if (google.summary.wastedSpend > 0) {
      items.push({
        priority: 'high',
        channel: 'google',
        action: 'Pause non-converting Google keywords',
        reason: `$${google.summary.wastedSpend} wasted on non-converting keywords`,
        estimatedImpact: `Save $${google.summary.wastedSpend} and reallocate to performers`,
        timeframe: 'today',
      });
    }

    if (google.summary.newOpportunities > 0) {
      items.push({
        priority: 'medium',
        channel: 'google',
        action: `Add ${google.summary.newOpportunities} new keyword opportunities`,
        reason: 'New high-intent keywords identified from search term reports',
        estimatedImpact: 'Expand reach to untapped search demand',
        timeframe: 'this_week',
      });
    }
  }

  // Cross-channel action items
  if (crossChannel) {
    for (const rec of crossChannel.recommendations.slice(0, 2)) {
      items.push({
        priority: rec.priority as AdsActionItem['priority'],
        channel: 'both',
        action: rec.title,
        reason: rec.description,
        estimatedImpact: rec.estimatedImpact,
        timeframe: rec.priority === 'high' ? 'today' : 'this_week',
      });
    }
  }

  return items.sort((a, b) => {
    const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

/**
 * Generate complete advertising intelligence report
 */
export async function generateAdsIntelligence(config: AdsIntelligenceConfig): Promise<AdsIntelligence> {
  const [meta, google] = await Promise.all([
    fetchMetaAdsPerformance(config),
    fetchGoogleAdsPerformance(config),
  ]);

  const crossChannel = compareChannels(
    meta?.summary || null,
    google?.summary || null,
    config
  );

  const alerts = generateAdsAlerts(meta, google);
  const topActionItems = generateAdsActionItems(meta, google, crossChannel);

  return {
    generatedAt: new Date().toISOString(),
    meta,
    google,
    crossChannel,
    alerts,
    topActionItems,
  };
}

// ── Utility ───────────────────────────────────────────────────

function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
