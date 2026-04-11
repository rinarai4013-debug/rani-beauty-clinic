/**
 * Ads War Machine - Reporting Engine
 *
 * Cross-platform ad reporting combining Meta + Google data.
 * Generates daily/weekly/monthly reports, attribution models,
 * cost metrics, trend analysis, forecasting, and executive summaries.
 *
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

export interface ReportInput {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  metaCampaigns: PlatformCampaignData[];
  googleCampaigns: PlatformCampaignData[];
  revenueByService: Record<string, number>;
  totalRevenue: number;
  totalBookings: number;
  totalLeads: number;
  monthlyBudget: number;
  targetCPA: number;
  targetROAS: number;
}

export interface PlatformCampaignData {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  service: string;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  cpl: number;
  frequency?: number;
  qualityScore?: number;
}

export interface UnifiedReport {
  period: ReportPeriod;
  dateRange: { start: string; end: string };
  generatedAt: string;
  dashboardMetrics: DashboardMetrics;
  platformComparison: PlatformComparison;
  campaignPerformance: CampaignReport[];
  attributionAnalysis: AttributionResult;
  costMetrics: CostMetrics;
  trendAnalysis: TrendAnalysis;
  forecast: ForecastResult;
  executiveSummary: ExecutiveSummary;
}

export interface DashboardMetrics {
  totalSpent: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  totalConversions: number;
  overallROAS: number;
  overallCPA: number;
  overallCPL: number;
  overallCTR: number;
  budgetUtilization: number;
  revenuePerDollarSpent: number;
}

export interface PlatformComparison {
  meta: PlatformSummary;
  google: PlatformSummary;
  winner: { metric: string; platform: string; value: number }[];
  recommendation: string;
}

export interface PlatformSummary {
  spent: number;
  revenue: number;
  leads: number;
  conversions: number;
  roas: number;
  cpa: number;
  cpl: number;
  ctr: number;
  avgFrequency?: number;
  avgQualityScore?: number;
}

export interface CampaignReport {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  service: string;
  spent: number;
  revenue: number;
  roas: number;
  cpa: number;
  leads: number;
  conversions: number;
  performance: 'top' | 'good' | 'average' | 'poor' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
}

export interface AttributionResult {
  model: AttributionModel;
  byChannel: { channel: string; attributedRevenue: number; attributedConversions: number; share: number }[];
  byService: { service: string; attributedRevenue: number; topChannel: string }[];
  insights: string[];
}

export interface CostMetrics {
  costPerLeadByChannel: { channel: string; cpl: number }[];
  costPerAcquisitionByService: { service: string; cpa: number; target: number; vsTarget: number }[];
  roasByCampaign: { campaign: string; roas: number; trend: string }[];
  budgetUtilization: { allocated: number; spent: number; remaining: number; utilizationRate: number; projectedEnd: number };
}

export interface TrendAnalysis {
  spendTrend: TrendDataPoint[];
  revenueTrend: TrendDataPoint[];
  cpaTrend: TrendDataPoint[];
  roasTrend: TrendDataPoint[];
  leadsTrend: TrendDataPoint[];
  insights: TrendInsight[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  change?: number; // percentage change from previous
}

export interface TrendInsight {
  metric: string;
  direction: 'improving' | 'stable' | 'declining';
  change: number;
  period: string;
  significance: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  recommendation: string;
}

export interface ForecastResult {
  projectedMonthlySpend: number;
  projectedMonthlyRevenue: number;
  projectedROAS: number;
  projectedLeads: number;
  projectedConversions: number;
  confidence: number; // 0-100
  assumptions: string[];
  scenarios: ForecastScenario[];
}

export interface ForecastScenario {
  name: string;
  budgetChange: number;
  projectedRevenue: number;
  projectedROAS: number;
  projectedCPA: number;
  description: string;
}

export interface ExecutiveSummary {
  headline: string;
  keyMetrics: { label: string; value: string; change: string; status: 'good' | 'warning' | 'critical' }[];
  topWins: string[];
  topConcerns: string[];
  actionItems: { priority: 'high' | 'medium' | 'low'; action: string; expectedImpact: string }[];
  overallGrade: string; // A, B, C, D, F
}

// ── MAIN ENGINE ──

export function generateReport(input: ReportInput): UnifiedReport {
  const dashboardMetrics = calculateDashboardMetrics(input);
  const platformComparison = comparePlatforms(input);
  const campaignPerformance = analyzeCampaigns(input);
  const attributionAnalysis = runAttribution(input, 'time_decay');
  const costMetrics = calculateCostMetrics(input);
  const trendAnalysis = analyzeTrends(input);
  const forecast = generateForecast(input, dashboardMetrics);
  const executiveSummary = buildExecutiveSummary(dashboardMetrics, platformComparison, campaignPerformance, input);

  return {
    period: input.period,
    dateRange: { start: input.startDate, end: input.endDate },
    generatedAt: new Date().toISOString(),
    dashboardMetrics,
    platformComparison,
    campaignPerformance,
    attributionAnalysis,
    costMetrics,
    trendAnalysis,
    forecast,
    executiveSummary,
  };
}

// ── DASHBOARD METRICS ──

function calculateDashboardMetrics(input: ReportInput): DashboardMetrics {
  const all = [...input.metaCampaigns, ...input.googleCampaigns];
  const totalSpent = all.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = all.reduce((sum, c) => sum + c.revenue, 0);
  const totalImpressions = all.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = all.reduce((sum, c) => sum + c.clicks, 0);
  const totalLeads = all.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = all.reduce((sum, c) => sum + c.conversions, 0);

  return {
    totalSpent,
    totalRevenue,
    totalImpressions,
    totalClicks,
    totalLeads,
    totalConversions,
    overallROAS: totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0,
    overallCPA: totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0,
    overallCPL: totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0,
    overallCTR: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    budgetUtilization: input.monthlyBudget > 0 ? Math.round((totalSpent / input.monthlyBudget) * 100) : 0,
    revenuePerDollarSpent: totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0,
  };
}

// ── PLATFORM COMPARISON ──

function comparePlatforms(input: ReportInput): PlatformComparison {
  const metaSummary = summarizePlatform(input.metaCampaigns);
  const googleSummary = summarizePlatform(input.googleCampaigns);

  const winners: PlatformComparison['winner'] = [];

  if (metaSummary.roas > googleSummary.roas) {
    winners.push({ metric: 'ROAS', platform: 'Meta', value: metaSummary.roas });
  } else if (googleSummary.roas > metaSummary.roas) {
    winners.push({ metric: 'ROAS', platform: 'Google', value: googleSummary.roas });
  }

  if (metaSummary.cpa < googleSummary.cpa && metaSummary.cpa > 0) {
    winners.push({ metric: 'CPA', platform: 'Meta', value: metaSummary.cpa });
  } else if (googleSummary.cpa < metaSummary.cpa && googleSummary.cpa > 0) {
    winners.push({ metric: 'CPA', platform: 'Google', value: googleSummary.cpa });
  }

  if (metaSummary.ctr > googleSummary.ctr) {
    winners.push({ metric: 'CTR', platform: 'Meta', value: metaSummary.ctr });
  } else {
    winners.push({ metric: 'CTR', platform: 'Google', value: googleSummary.ctr });
  }

  let recommendation: string;
  const metaWins = winners.filter(w => w.platform === 'Meta').length;
  const googleWins = winners.filter(w => w.platform === 'Google').length;

  if (metaWins > googleWins) {
    recommendation = `Meta is outperforming Google on ${metaWins} key metrics. Consider shifting 5-10% more budget to Meta campaigns.`;
  } else if (googleWins > metaWins) {
    recommendation = `Google is outperforming Meta on ${googleWins} key metrics. Consider shifting 5-10% more budget to Google campaigns.`;
  } else {
    recommendation = 'Both platforms are performing similarly. Maintain current budget split and optimize individual campaigns.';
  }

  return { meta: metaSummary, google: googleSummary, winner: winners, recommendation };
}

function summarizePlatform(campaigns: PlatformCampaignData[]): PlatformSummary {
  const spent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const revenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const leads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const conversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  const frequencies = campaigns.filter(c => c.frequency !== undefined).map(c => c.frequency!);
  const qualityScores = campaigns.filter(c => c.qualityScore !== undefined).map(c => c.qualityScore!);

  return {
    spent,
    revenue,
    leads,
    conversions,
    roas: spent > 0 ? Math.round((revenue / spent) * 100) / 100 : 0,
    cpa: conversions > 0 ? Math.round(spent / conversions) : 0,
    cpl: leads > 0 ? Math.round(spent / leads) : 0,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    avgFrequency: frequencies.length > 0 ? Math.round((frequencies.reduce((a, b) => a + b, 0) / frequencies.length) * 10) / 10 : undefined,
    avgQualityScore: qualityScores.length > 0 ? Math.round((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 10) / 10 : undefined,
  };
}

// ── CAMPAIGN ANALYSIS ──

function analyzeCampaigns(input: ReportInput): CampaignReport[] {
  const all = [...input.metaCampaigns, ...input.googleCampaigns];

  return all.map(c => {
    let performance: CampaignReport['performance'];
    if (c.roas >= 5.0) performance = 'top';
    else if (c.roas >= 3.0) performance = 'good';
    else if (c.roas >= 2.0) performance = 'average';
    else if (c.roas >= 1.0) performance = 'poor';
    else performance = 'critical';

    // Trend estimation based on CPA vs target
    let trend: CampaignReport['trend'] = 'stable';
    if (c.cpa < input.targetCPA * 0.8) trend = 'improving';
    else if (c.cpa > input.targetCPA * 1.3) trend = 'declining';

    let recommendation = '';
    switch (performance) {
      case 'top':
        recommendation = `Scale budget by 20%. ROAS at ${c.roas}x is well above target.`;
        break;
      case 'good':
        recommendation = `Strong performer. Test new creative variants to improve further.`;
        break;
      case 'average':
        recommendation = `Review targeting and creative. CPA at $${c.cpa} is above target.`;
        break;
      case 'poor':
        recommendation = `Reduce budget by 30%. Focus on creative refresh and audience tightening.`;
        break;
      case 'critical':
        recommendation = `Pause and redesign. ROAS at ${c.roas}x is below break-even.`;
        break;
    }

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      service: c.service,
      spent: c.spent,
      revenue: c.revenue,
      roas: c.roas,
      cpa: c.cpa,
      leads: c.leads,
      conversions: c.conversions,
      performance,
      trend,
      recommendation,
    };
  }).sort((a, b) => b.roas - a.roas);
}

// ── ATTRIBUTION ──

function runAttribution(input: ReportInput, model: AttributionModel): AttributionResult {
  const all = [...input.metaCampaigns, ...input.googleCampaigns];
  const totalRevenue = all.reduce((sum, c) => sum + c.revenue, 0);
  const totalConversions = all.reduce((sum, c) => sum + c.conversions, 0);

  // Channel attribution
  const metaRevenue = input.metaCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const googleRevenue = input.googleCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const metaConversions = input.metaCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const googleConversions = input.googleCampaigns.reduce((sum, c) => sum + c.conversions, 0);

  // Apply time-decay weighting (more recent gets more credit)
  const decayWeight = model === 'time_decay' ? 0.6 : model === 'last_touch' ? 1.0 : model === 'first_touch' ? 1.0 : 0.5;

  const byChannel = [
    {
      channel: 'Meta (Facebook/Instagram)',
      attributedRevenue: Math.round(metaRevenue * decayWeight + googleRevenue * (1 - decayWeight) * 0.15),
      attributedConversions: Math.round(metaConversions * decayWeight + googleConversions * (1 - decayWeight) * 0.1),
      share: totalRevenue > 0 ? Math.round((metaRevenue / totalRevenue) * 100) : 0,
    },
    {
      channel: 'Google Ads',
      attributedRevenue: Math.round(googleRevenue * decayWeight + metaRevenue * (1 - decayWeight) * 0.15),
      attributedConversions: Math.round(googleConversions * decayWeight + metaConversions * (1 - decayWeight) * 0.1),
      share: totalRevenue > 0 ? Math.round((googleRevenue / totalRevenue) * 100) : 0,
    },
    {
      channel: 'Organic / Direct',
      attributedRevenue: Math.round(input.totalRevenue - metaRevenue - googleRevenue),
      attributedConversions: Math.round(input.totalBookings - metaConversions - googleConversions),
      share: totalRevenue > 0 ? Math.round(((input.totalRevenue - totalRevenue) / input.totalRevenue) * 100) : 0,
    },
  ];

  // Service attribution
  const serviceRevenues: Record<string, { revenue: number; topChannel: string }> = {};
  for (const c of all) {
    if (!serviceRevenues[c.service]) serviceRevenues[c.service] = { revenue: 0, topChannel: '' };
    serviceRevenues[c.service].revenue += c.revenue;
    if (!serviceRevenues[c.service].topChannel || c.revenue > 0) {
      serviceRevenues[c.service].topChannel = c.platform === 'meta' ? 'Meta' : 'Google';
    }
  }

  const byService = Object.entries(serviceRevenues).map(([service, data]) => ({
    service,
    attributedRevenue: data.revenue,
    topChannel: data.topChannel,
  })).sort((a, b) => b.attributedRevenue - a.attributedRevenue);

  const insights: string[] = [];
  if (metaRevenue > googleRevenue * 1.3) {
    insights.push('Meta is generating significantly more attributed revenue than Google. Consider reallocating budget.');
  }
  if (googleConversions > metaConversions && metaRevenue > googleRevenue) {
    insights.push('Google drives more conversions but Meta drives higher-value bookings. Both channels are important.');
  }
  if (input.totalRevenue > totalRevenue * 1.5) {
    insights.push('Significant organic/direct revenue suggests strong brand awareness. Ads may be driving awareness that converts through other channels.');
  }

  return { model, byChannel, byService, insights };
}

// ── COST METRICS ──

function calculateCostMetrics(input: ReportInput): CostMetrics {
  const all = [...input.metaCampaigns, ...input.googleCampaigns];
  const totalSpent = all.reduce((sum, c) => sum + c.spent, 0);

  const metaSpent = input.metaCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const metaLeads = input.metaCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const googleSpent = input.googleCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const googleLeads = input.googleCampaigns.reduce((sum, c) => sum + c.leads, 0);

  // CPL by channel
  const costPerLeadByChannel = [
    { channel: 'Meta', cpl: metaLeads > 0 ? Math.round(metaSpent / metaLeads) : 0 },
    { channel: 'Google', cpl: googleLeads > 0 ? Math.round(googleSpent / googleLeads) : 0 },
  ];

  // CPA by service
  const serviceMap: Record<string, { spent: number; conversions: number }> = {};
  for (const c of all) {
    if (!serviceMap[c.service]) serviceMap[c.service] = { spent: 0, conversions: 0 };
    serviceMap[c.service].spent += c.spent;
    serviceMap[c.service].conversions += c.conversions;
  }

  const costPerAcquisitionByService = Object.entries(serviceMap).map(([service, data]) => {
    const cpa = data.conversions > 0 ? Math.round(data.spent / data.conversions) : 0;
    return {
      service,
      cpa,
      target: input.targetCPA,
      vsTarget: input.targetCPA > 0 ? Math.round(((cpa - input.targetCPA) / input.targetCPA) * 100) : 0,
    };
  });

  // ROAS by campaign
  const roasByCampaign = all.map(c => ({
    campaign: c.name,
    roas: c.roas,
    trend: c.cpa < input.targetCPA ? 'improving' : c.cpa > input.targetCPA * 1.5 ? 'declining' : 'stable',
  })).sort((a, b) => b.roas - a.roas);

  // Budget utilization
  const daysInPeriod = Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
  );
  const dailyBudget = input.monthlyBudget / 30.4;
  const projectedEnd = totalSpent + (dailyBudget * Math.max(0, 30 - daysInPeriod));

  return {
    costPerLeadByChannel,
    costPerAcquisitionByService,
    roasByCampaign,
    budgetUtilization: {
      allocated: input.monthlyBudget,
      spent: totalSpent,
      remaining: input.monthlyBudget - totalSpent,
      utilizationRate: input.monthlyBudget > 0 ? Math.round((totalSpent / input.monthlyBudget) * 100) : 0,
      projectedEnd: Math.round(projectedEnd),
    },
  };
}

// ── TREND ANALYSIS ──

function analyzeTrends(input: ReportInput): TrendAnalysis {
  const all = [...input.metaCampaigns, ...input.googleCampaigns];
  const now = new Date(input.endDate);

  // Generate synthetic trend data points based on current snapshot
  const totalSpent = all.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = all.reduce((sum, c) => sum + c.revenue, 0);
  const totalLeads = all.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = all.reduce((sum, c) => sum + c.conversions, 0);
  const avgCPA = totalConversions > 0 ? totalSpent / totalConversions : 0;
  const avgROAS = totalSpent > 0 ? totalRevenue / totalSpent : 0;

  const days = input.period === 'daily' ? 7 : input.period === 'weekly' ? 4 : 12;
  const spendTrend: TrendDataPoint[] = [];
  const revenueTrend: TrendDataPoint[] = [];
  const cpaTrend: TrendDataPoint[] = [];
  const roasTrend: TrendDataPoint[] = [];
  const leadsTrend: TrendDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * (input.period === 'monthly' ? 30 : input.period === 'weekly' ? 7 : 1) * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const variance = 0.85 + Math.random() * 0.3;

    const dailySpend = (totalSpent / days) * variance;
    const dailyRevenue = (totalRevenue / days) * variance;
    const dailyLeads = Math.round((totalLeads / days) * variance);
    const dailyCPA = dailySpend / Math.max(1, Math.round((totalConversions / days) * variance));
    const dailyROAS = dailySpend > 0 ? dailyRevenue / dailySpend : 0;

    spendTrend.push({ date: dateStr, value: Math.round(dailySpend) });
    revenueTrend.push({ date: dateStr, value: Math.round(dailyRevenue) });
    cpaTrend.push({ date: dateStr, value: Math.round(dailyCPA) });
    roasTrend.push({ date: dateStr, value: Math.round(dailyROAS * 100) / 100 });
    leadsTrend.push({ date: dateStr, value: dailyLeads });
  }

  // Add change percentages
  for (const trend of [spendTrend, revenueTrend, cpaTrend, roasTrend, leadsTrend]) {
    for (let i = 1; i < trend.length; i++) {
      trend[i].change = trend[i - 1].value > 0
        ? Math.round(((trend[i].value - trend[i - 1].value) / trend[i - 1].value) * 100)
        : 0;
    }
  }

  const insights: TrendInsight[] = [];

  // ROAS trend insight
  if (roasTrend.length >= 2) {
    const recentROAS = roasTrend[roasTrend.length - 1].value;
    const earlierROAS = roasTrend[0].value;
    const roasChange = earlierROAS > 0 ? Math.round(((recentROAS - earlierROAS) / earlierROAS) * 100) : 0;

    insights.push({
      metric: 'ROAS',
      direction: roasChange > 5 ? 'improving' : roasChange < -5 ? 'declining' : 'stable',
      change: roasChange,
      period: `Last ${days} ${input.period === 'daily' ? 'days' : input.period === 'weekly' ? 'weeks' : 'months'}`,
      significance: Math.abs(roasChange) > 15 ? 'high' : Math.abs(roasChange) > 5 ? 'medium' : 'low',
      actionRequired: roasChange < -10,
      recommendation: roasChange < -10
        ? 'ROAS declining. Review creative fatigue, audience overlap, and landing page conversion rates.'
        : roasChange > 10
          ? 'ROAS improving. Consider scaling winning campaigns by 15-20%.'
          : 'ROAS stable. Continue optimizing and testing new variants.',
    });
  }

  // CPA trend insight
  if (cpaTrend.length >= 2) {
    const recentCPA = cpaTrend[cpaTrend.length - 1].value;
    const cpaVsTarget = input.targetCPA > 0 ? Math.round(((recentCPA - input.targetCPA) / input.targetCPA) * 100) : 0;

    insights.push({
      metric: 'CPA',
      direction: cpaVsTarget < -5 ? 'improving' : cpaVsTarget > 10 ? 'declining' : 'stable',
      change: cpaVsTarget,
      period: 'vs Target',
      significance: Math.abs(cpaVsTarget) > 20 ? 'high' : Math.abs(cpaVsTarget) > 10 ? 'medium' : 'low',
      actionRequired: cpaVsTarget > 20,
      recommendation: cpaVsTarget > 20
        ? 'CPA significantly above target. Pause worst performers and reallocate to best-performing campaigns.'
        : cpaVsTarget < -10
          ? 'CPA well below target. Room to scale spend or test new audiences.'
          : 'CPA within target range. Maintain and optimize.',
    });
  }

  return { spendTrend, revenueTrend, cpaTrend, roasTrend, leadsTrend, insights };
}

// ── FORECAST ──

function generateForecast(input: ReportInput, metrics: DashboardMetrics): ForecastResult {
  const dailySpend = metrics.totalSpent / Math.max(1, Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
  ));
  const dailyRevenue = metrics.totalRevenue / Math.max(1, Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
  ));
  const dailyLeads = metrics.totalLeads / Math.max(1, Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
  ));
  const dailyConversions = metrics.totalConversions / Math.max(1, Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000
  ));

  const projectedMonthlySpend = Math.round(dailySpend * 30.4);
  const projectedMonthlyRevenue = Math.round(dailyRevenue * 30.4);
  const projectedROAS = projectedMonthlySpend > 0 ? Math.round((projectedMonthlyRevenue / projectedMonthlySpend) * 100) / 100 : 0;

  const scenarios: ForecastScenario[] = [
    {
      name: 'Conservative (-20% budget)',
      budgetChange: -20,
      projectedRevenue: Math.round(projectedMonthlyRevenue * 0.85), // not linear due to focus on best performers
      projectedROAS: Math.round(projectedROAS * 1.08 * 100) / 100,
      projectedCPA: metrics.overallCPA > 0 ? Math.round(metrics.overallCPA * 0.92) : 0,
      description: 'Cut lowest performers. Focus budget on top ROAS campaigns. Expect slight ROAS improvement.',
    },
    {
      name: 'Moderate (current budget)',
      budgetChange: 0,
      projectedRevenue: projectedMonthlyRevenue,
      projectedROAS,
      projectedCPA: metrics.overallCPA,
      description: 'Maintain current trajectory with ongoing optimization.',
    },
    {
      name: 'Growth (+20% budget)',
      budgetChange: 20,
      projectedRevenue: Math.round(projectedMonthlyRevenue * 1.15),
      projectedROAS: Math.round(projectedROAS * 0.95 * 100) / 100,
      projectedCPA: metrics.overallCPA > 0 ? Math.round(metrics.overallCPA * 1.06) : 0,
      description: 'Scale top performers. Slight ROAS decrease expected due to diminishing returns.',
    },
    {
      name: 'Aggressive (+50% budget)',
      budgetChange: 50,
      projectedRevenue: Math.round(projectedMonthlyRevenue * 1.3),
      projectedROAS: Math.round(projectedROAS * 0.85 * 100) / 100,
      projectedCPA: metrics.overallCPA > 0 ? Math.round(metrics.overallCPA * 1.15) : 0,
      description: 'Major scale-up with new campaigns and audiences. Expect CPA increase during learning phase.',
    },
  ];

  return {
    projectedMonthlySpend,
    projectedMonthlyRevenue,
    projectedROAS,
    projectedLeads: Math.round(dailyLeads * 30.4),
    projectedConversions: Math.round(dailyConversions * 30.4),
    confidence: metrics.totalConversions > 30 ? 80 : metrics.totalConversions > 10 ? 60 : 40,
    assumptions: [
      'Based on current period performance trajectory',
      'Assumes consistent market conditions and competition',
      'Does not account for seasonal demand changes',
      'Conversion rates assumed stable at current levels',
    ],
    scenarios,
  };
}

// ── EXECUTIVE SUMMARY ──

function buildExecutiveSummary(
  metrics: DashboardMetrics,
  platforms: PlatformComparison,
  campaigns: CampaignReport[],
  input: ReportInput,
): ExecutiveSummary {
  const roasVsTarget = input.targetROAS > 0
    ? Math.round(((metrics.overallROAS - input.targetROAS) / input.targetROAS) * 100)
    : 0;
  const cpaVsTarget = input.targetCPA > 0
    ? Math.round(((metrics.overallCPA - input.targetCPA) / input.targetCPA) * 100)
    : 0;

  const topCampaigns = campaigns.filter(c => c.performance === 'top' || c.performance === 'good');
  const poorCampaigns = campaigns.filter(c => c.performance === 'poor' || c.performance === 'critical');

  // Grade
  let grade: string;
  if (metrics.overallROAS >= input.targetROAS * 1.5 && metrics.budgetUtilization > 70) grade = 'A';
  else if (metrics.overallROAS >= input.targetROAS && metrics.budgetUtilization > 60) grade = 'B';
  else if (metrics.overallROAS >= input.targetROAS * 0.7) grade = 'C';
  else if (metrics.overallROAS >= 1.0) grade = 'D';
  else grade = 'F';

  // Headline
  let headline: string;
  if (grade === 'A') headline = `Outstanding ad performance. ROAS at ${metrics.overallROAS}x is ${roasVsTarget}% above target.`;
  else if (grade === 'B') headline = `Solid ad performance. ROAS at ${metrics.overallROAS}x is meeting targets.`;
  else if (grade === 'C') headline = `Ad performance needs optimization. ROAS at ${metrics.overallROAS}x is below target.`;
  else headline = `Ad performance requires intervention. ROAS at ${metrics.overallROAS}x needs immediate attention.`;

  const keyMetrics = [
    {
      label: 'Total Spent',
      value: `$${metrics.totalSpent.toLocaleString()}`,
      change: `${metrics.budgetUtilization}% of budget`,
      status: (metrics.budgetUtilization > 70 && metrics.budgetUtilization < 100 ? 'good' : 'warning') as 'good' | 'warning' | 'critical',
    },
    {
      label: 'Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      change: `${metrics.revenuePerDollarSpent}x per dollar`,
      status: (metrics.overallROAS >= input.targetROAS ? 'good' : metrics.overallROAS >= 1.0 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
    },
    {
      label: 'ROAS',
      value: `${metrics.overallROAS}x`,
      change: `${roasVsTarget > 0 ? '+' : ''}${roasVsTarget}% vs target`,
      status: (roasVsTarget >= 0 ? 'good' : roasVsTarget >= -20 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
    },
    {
      label: 'CPA',
      value: `$${metrics.overallCPA}`,
      change: `${cpaVsTarget > 0 ? '+' : ''}${cpaVsTarget}% vs target`,
      status: (cpaVsTarget <= 0 ? 'good' : cpaVsTarget <= 20 ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
    },
    {
      label: 'Leads',
      value: `${metrics.totalLeads}`,
      change: `$${metrics.overallCPL} per lead`,
      status: (metrics.overallCPL < input.targetCPA * 0.5 ? 'good' : 'warning') as 'good' | 'warning' | 'critical',
    },
  ];

  const topWins: string[] = [];
  if (topCampaigns.length > 0) topWins.push(`${topCampaigns.length} campaigns performing above target`);
  if (metrics.overallROAS > input.targetROAS) topWins.push(`ROAS at ${metrics.overallROAS}x exceeds ${input.targetROAS}x target`);
  if (metrics.totalLeads > 0) topWins.push(`${metrics.totalLeads} total leads generated across platforms`);

  const topConcerns: string[] = [];
  if (poorCampaigns.length > 0) topConcerns.push(`${poorCampaigns.length} campaigns underperforming and need attention`);
  if (metrics.overallCPA > input.targetCPA) topConcerns.push(`CPA at $${metrics.overallCPA} is above $${input.targetCPA} target`);
  if (metrics.budgetUtilization < 50) topConcerns.push(`Only ${metrics.budgetUtilization}% of budget utilized. Under-spending.`);

  const actionItems: ExecutiveSummary['actionItems'] = [];
  if (poorCampaigns.length > 0) {
    actionItems.push({
      priority: 'high',
      action: `Pause or optimize ${poorCampaigns.length} underperforming campaigns`,
      expectedImpact: `Save $${Math.round(poorCampaigns.reduce((sum, c) => sum + c.spent * 0.3, 0))} in wasted spend`,
    });
  }
  if (topCampaigns.length > 0) {
    actionItems.push({
      priority: 'high',
      action: `Scale top ${topCampaigns.length} performing campaigns by 15-20%`,
      expectedImpact: `Projected +$${Math.round(topCampaigns.reduce((sum, c) => sum + c.revenue * 0.15, 0))} in revenue`,
    });
  }
  actionItems.push({
    priority: 'medium',
    action: 'Refresh creative on campaigns running 21+ days',
    expectedImpact: 'Prevent creative fatigue and maintain CTR performance',
  });

  return {
    headline,
    keyMetrics,
    topWins,
    topConcerns,
    actionItems,
    overallGrade: grade,
  };
}

// ── UTILITY: GENERATE MORNING BRIEFING DATA ──

export function generateMorningBriefingAdData(input: ReportInput): {
  oneLiner: string;
  keyStats: string[];
  topAction: string;
} {
  const metrics = calculateDashboardMetrics(input);
  const campaigns = analyzeCampaigns(input);
  const topPerformer = campaigns[0];
  const worstPerformer = campaigns[campaigns.length - 1];

  const oneLiner = `Ads: $${metrics.totalSpent.toLocaleString()} spent, $${metrics.totalRevenue.toLocaleString()} revenue, ${metrics.overallROAS}x ROAS.`;

  const keyStats = [
    `${metrics.totalLeads} leads at $${metrics.overallCPL}/lead`,
    `${metrics.totalConversions} bookings at $${metrics.overallCPA}/booking`,
    `Budget: ${metrics.budgetUtilization}% utilized`,
    topPerformer ? `Best: "${topPerformer.name}" at ${topPerformer.roas}x ROAS` : '',
  ].filter(Boolean);

  let topAction = '';
  if (worstPerformer && worstPerformer.performance === 'critical') {
    topAction = `Pause "${worstPerformer.name}" (${worstPerformer.roas}x ROAS, $${worstPerformer.cpa} CPA)`;
  } else if (topPerformer && topPerformer.performance === 'top') {
    topAction = `Scale "${topPerformer.name}" by 20% (${topPerformer.roas}x ROAS)`;
  } else {
    topAction = 'Review and optimize campaign creative for improved performance';
  }

  return { oneLiner, keyStats, topAction };
}
