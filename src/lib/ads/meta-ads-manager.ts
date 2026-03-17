/**
 * Meta Ads AI Manager Engine
 *
 * Analyzes Meta (Facebook/Instagram) ad performance, generates optimization
 * recommendations, creates new ad copy variants, and manages budget allocation
 * using AI-driven insights.
 *
 * Capabilities:
 * 1. Campaign performance analysis
 * 2. Ad copy generation with A/B variants
 * 3. Budget allocation optimization
 * 4. Audience targeting recommendations
 * 5. Creative fatigue detection
 * 6. ROAS optimization
 * 7. Funnel analysis (impression → click → lead → booking → revenue)
 */

// ── TYPES ──

export interface MetaAdsInput {
  campaigns: Campaign[];
  adSets: AdSet[];
  ads: Ad[];
  monthlyBudget: number;
  targetCPA: number; // cost per acquisition target
  targetROAS: number; // return on ad spend target
  services: ServiceAdData[];
  historicalMetrics?: HistoricalAdMetric[];
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  objective: 'leads' | 'conversions' | 'traffic' | 'awareness' | 'engagement';
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  targeting: AudienceTargeting;
  budget: number;
  spent: number;
  status: 'active' | 'paused';
}

export interface AudienceTargeting {
  ageMin: number;
  ageMax: number;
  genders: ('male' | 'female' | 'all')[];
  locations: string[];
  interests: string[];
  radius: number; // miles
}

export interface Ad {
  id: string;
  adSetId: string;
  name: string;
  type: 'image' | 'video' | 'carousel';
  headline: string;
  body: string;
  callToAction: string;
  metrics: AdMetrics;
  createdDate: string;
  status: 'active' | 'paused';
}

export interface AdMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number; // click-through rate %
  cpc: number; // cost per click
  leads: number;
  cpl: number; // cost per lead
  conversions: number;
  cpa: number; // cost per acquisition
  spent: number;
  revenue: number;
  roas: number;
  frequency: number; // avg times shown per person
}

export interface ServiceAdData {
  service: string;
  avgBookingValue: number;
  ltv: number; // lifetime value of client
  targetAudience: string;
  bestPerformingAngle: string;
}

export interface HistoricalAdMetric {
  date: string;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
}

// ── OUTPUT TYPES ──

export interface MetaAdsIntelligence {
  performanceSummary: PerformanceSummary;
  campaignAnalysis: CampaignAnalysis[];
  optimizations: AdOptimization[];
  adCopyVariants: AdCopyVariant[];
  budgetRecommendations: BudgetRecommendation[];
  audienceInsights: AudienceInsight[];
  creativeFatigue: CreativeFatigueAlert[];
  funnelAnalysis: FunnelStep[];
  adScore: number; // 0-100
  projectedROAS: number;
}

export interface PerformanceSummary {
  totalSpent: number;
  totalRevenue: number;
  totalLeads: number;
  totalConversions: number;
  overallROAS: number;
  overallCPA: number;
  overallCPL: number;
  avgCTR: number;
  budgetUtilization: number; // percentage of monthly budget used
  vsTarget: {
    roasVsTarget: number; // percentage difference
    cpaVsTarget: number;
  };
}

export interface CampaignAnalysis {
  campaignId: string;
  campaignName: string;
  status: string;
  spent: number;
  revenue: number;
  roas: number;
  cpa: number;
  leads: number;
  performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  recommendation: string;
}

export interface AdOptimization {
  type: 'pause' | 'scale' | 'refresh_creative' | 'adjust_targeting' | 'test_variant' | 'increase_budget' | 'decrease_budget';
  priority: 'high' | 'medium' | 'low';
  adId?: string;
  adSetId?: string;
  campaignId?: string;
  description: string;
  expectedImpact: string;
  estimatedSavings?: number;
  estimatedRevenueGain?: number;
}

export interface AdCopyVariant {
  forService: string;
  angle: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  targetAudience: string;
  estimatedCTR: number;
}

export interface BudgetRecommendation {
  campaignId?: string;
  campaignName: string;
  currentBudget: number;
  recommendedBudget: number;
  change: number; // percentage
  reason: string;
  expectedROAS: number;
}

export interface AudienceInsight {
  segment: string;
  size: string;
  performance: number; // 0-100
  cpa: number;
  recommendation: string;
}

export interface CreativeFatigueAlert {
  adId: string;
  adName: string;
  frequency: number;
  ctrDecline: number; // percentage drop
  daysRunning: number;
  action: string;
}

export interface FunnelStep {
  stage: string;
  count: number;
  conversionRate: number; // to next stage
  costPerAction: number;
  dropoffRate: number;
}

// ── CONSTANTS ──

const PERFORMANCE_THRESHOLDS = {
  excellent: { roas: 5.0, cpa: 50, ctr: 3.0 },
  good: { roas: 3.0, cpa: 100, ctr: 2.0 },
  average: { roas: 2.0, cpa: 150, ctr: 1.0 },
  poor: { roas: 1.0, cpa: 250, ctr: 0.5 },
};

const CREATIVE_FATIGUE_FREQUENCY = 4.0; // frequency above this = fatigue

const AD_ANGLES: Record<string, string[]> = {
  'HydraFacial': ['Instant glow', 'Red carpet ready', 'Lunch-break facial', 'Glass skin effect'],
  'Botox': ['Preventative Botox', 'Wrinkle-free confidence', 'Quick 15-min treatment', 'Natural results'],
  'VI Peel': ['Skin reset', 'Peel away damage', 'Clear skin in 7 days', 'Sun damage solution'],
  'RF Microneedling': ['Collagen boost', 'Scar reduction', 'Skin tightening', 'Turn back the clock'],
  'Laser Hair Removal': ['Smooth summer', 'Never shave again', 'Pain-free laser', 'Full body packages'],
  'Sofwave': ['Non-surgical facelift', 'Skin tightening', 'No downtime', 'FDA-cleared results'],
  'GLP-1': ['Weight loss solution', 'Medical weight management', 'Transform your body', 'Doctor-supervised'],
};

// ── ENGINE ──

export function analyzeMetaAds(input: MetaAdsInput): MetaAdsIntelligence {
  const performanceSummary = calculatePerformanceSummary(input);
  const campaignAnalysis = analyzeCampaigns(input);
  const optimizations = generateOptimizations(input, campaignAnalysis);
  const adCopyVariants = generateAdCopyVariants(input);
  const budgetRecommendations = optimizeBudget(input, campaignAnalysis);
  const audienceInsights = analyzeAudiences(input);
  const creativeFatigue = detectCreativeFatigue(input);
  const funnelAnalysis = analyzeFunnel(input);
  const adScore = calculateAdScore(performanceSummary, input);
  const projectedROAS = projectROAS(input, performanceSummary);

  return {
    performanceSummary,
    campaignAnalysis,
    optimizations,
    adCopyVariants,
    budgetRecommendations,
    audienceInsights,
    creativeFatigue,
    funnelAnalysis,
    adScore,
    projectedROAS,
  };
}

// ── PERFORMANCE SUMMARY ──

function calculatePerformanceSummary(input: MetaAdsInput): PerformanceSummary {
  const allAds = input.ads;
  const totalSpent = allAds.reduce((sum, ad) => sum + ad.metrics.spent, 0);
  const totalRevenue = allAds.reduce((sum, ad) => sum + ad.metrics.revenue, 0);
  const totalLeads = allAds.reduce((sum, ad) => sum + ad.metrics.leads, 0);
  const totalConversions = allAds.reduce((sum, ad) => sum + ad.metrics.conversions, 0);
  const totalImpressions = allAds.reduce((sum, ad) => sum + ad.metrics.impressions, 0);
  const totalClicks = allAds.reduce((sum, ad) => sum + ad.metrics.clicks, 0);

  const overallROAS = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) / 100 : 0;
  const overallCPA = totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0;
  const overallCPL = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
  const avgCTR = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
  const budgetUtilization = input.monthlyBudget > 0 ? Math.round((totalSpent / input.monthlyBudget) * 100) : 0;

  return {
    totalSpent,
    totalRevenue,
    totalLeads,
    totalConversions,
    overallROAS,
    overallCPA,
    overallCPL,
    avgCTR,
    budgetUtilization,
    vsTarget: {
      roasVsTarget: input.targetROAS > 0 ? Math.round(((overallROAS - input.targetROAS) / input.targetROAS) * 100) : 0,
      cpaVsTarget: input.targetCPA > 0 ? Math.round(((overallCPA - input.targetCPA) / input.targetCPA) * 100) : 0,
    },
  };
}

// ── CAMPAIGN ANALYSIS ──

function analyzeCampaigns(input: MetaAdsInput): CampaignAnalysis[] {
  return input.campaigns.map(campaign => {
    const campaignAds = input.ads.filter(ad => {
      const adSet = input.adSets.find(as => as.id === ad.adSetId);
      return adSet?.campaignId === campaign.id;
    });

    const spent = campaignAds.reduce((sum, ad) => sum + ad.metrics.spent, 0);
    const revenue = campaignAds.reduce((sum, ad) => sum + ad.metrics.revenue, 0);
    const leads = campaignAds.reduce((sum, ad) => sum + ad.metrics.leads, 0);
    const conversions = campaignAds.reduce((sum, ad) => sum + ad.metrics.conversions, 0);
    const roas = spent > 0 ? Math.round((revenue / spent) * 100) / 100 : 0;
    const cpa = conversions > 0 ? Math.round(spent / conversions) : 0;

    let performance: CampaignAnalysis['performance'];
    if (roas >= PERFORMANCE_THRESHOLDS.excellent.roas) performance = 'excellent';
    else if (roas >= PERFORMANCE_THRESHOLDS.good.roas) performance = 'good';
    else if (roas >= PERFORMANCE_THRESHOLDS.average.roas) performance = 'average';
    else if (roas >= PERFORMANCE_THRESHOLDS.poor.roas) performance = 'poor';
    else performance = 'critical';

    let recommendation = '';
    switch (performance) {
      case 'excellent':
        recommendation = `Top performer — consider scaling budget by 20-30%`;
        break;
      case 'good':
        recommendation = `Performing well. Test new ad variants to improve further`;
        break;
      case 'average':
        recommendation = `Below potential. Review targeting and creative for optimization opportunities`;
        break;
      case 'poor':
        recommendation = `Underperforming — pause lowest-performing ads and reallocate budget`;
        break;
      case 'critical':
        recommendation = `Critical: ROAS below 1.0x. Pause campaign and redesign strategy`;
        break;
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      spent,
      revenue,
      roas,
      cpa,
      leads,
      performance,
      recommendation,
    };
  });
}

// ── OPTIMIZATIONS ──

function generateOptimizations(
  input: MetaAdsInput,
  campaignAnalysis: CampaignAnalysis[]
): AdOptimization[] {
  const optimizations: AdOptimization[] = [];

  // Pause underperforming ads
  for (const ad of input.ads) {
    if (ad.status !== 'active') continue;

    if (ad.metrics.roas < 1.0 && ad.metrics.spent > 50) {
      optimizations.push({
        type: 'pause',
        priority: 'high',
        adId: ad.id,
        description: `Pause "${ad.name}" — ROAS at ${ad.metrics.roas}x (below 1.0x breakeven)`,
        expectedImpact: `Save $${Math.round(ad.metrics.spent * 0.3)}/month in wasted spend`,
        estimatedSavings: Math.round(ad.metrics.spent * 0.3),
      });
    }

    // Creative fatigue
    if (ad.metrics.frequency > CREATIVE_FATIGUE_FREQUENCY) {
      optimizations.push({
        type: 'refresh_creative',
        priority: 'medium',
        adId: ad.id,
        description: `Refresh creative for "${ad.name}" — frequency at ${ad.metrics.frequency}x (fatigue threshold: ${CREATIVE_FATIGUE_FREQUENCY}x)`,
        expectedImpact: 'CTR recovery of 20-40% with fresh creative',
      });
    }
  }

  // Scale top performers
  for (const campaign of campaignAnalysis) {
    if (campaign.performance === 'excellent' && campaign.status === 'active') {
      optimizations.push({
        type: 'scale',
        priority: 'high',
        campaignId: campaign.campaignId,
        description: `Scale "${campaign.campaignName}" — ROAS at ${campaign.roas}x. Increase budget 25%`,
        expectedImpact: `Projected +$${Math.round(campaign.revenue * 0.25)} additional revenue`,
        estimatedRevenueGain: Math.round(campaign.revenue * 0.25),
      });
    }
  }

  // Budget reallocation
  const poorCampaigns = campaignAnalysis.filter(c => c.performance === 'poor' || c.performance === 'critical');
  const goodCampaigns = campaignAnalysis.filter(c => c.performance === 'excellent' || c.performance === 'good');

  if (poorCampaigns.length > 0 && goodCampaigns.length > 0) {
    const wastedBudget = poorCampaigns.reduce((sum, c) => sum + c.spent, 0);
    optimizations.push({
      type: 'decrease_budget',
      priority: 'high',
      description: `Reallocate $${Math.round(wastedBudget * 0.5)} from ${poorCampaigns.length} underperforming campaigns to top performers`,
      expectedImpact: `Projected ROAS improvement of 30-50% on reallocated budget`,
      estimatedSavings: Math.round(wastedBudget * 0.3),
    });
  }

  return optimizations.sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

// ── AD COPY GENERATION ──

function generateAdCopyVariants(input: MetaAdsInput): AdCopyVariant[] {
  const variants: AdCopyVariant[] = [];

  for (const service of input.services.slice(0, 5)) {
    const angles = AD_ANGLES[service.service] || ['Professional treatment', 'Expert care'];

    for (const angle of angles.slice(0, 2)) {
      variants.push({
        forService: service.service,
        angle,
        headline: generateHeadline(service.service, angle),
        primaryText: generatePrimaryText(service, angle),
        description: `Book your ${service.service} at Rani Beauty Clinic. ${service.avgBookingValue > 500 ? 'Financing available.' : 'Walk-ins welcome.'}`,
        callToAction: 'Book Now',
        targetAudience: service.targetAudience,
        estimatedCTR: estimateAdCTR(service, angle),
      });
    }
  }

  return variants.sort((a, b) => b.estimatedCTR - a.estimatedCTR);
}

function generateHeadline(service: string, angle: string): string {
  const headlines: Record<string, Record<string, string>> = {
    'HydraFacial': {
      'Instant glow': 'Get Your Glow On — HydraFacial $225',
      'Red carpet ready': 'Red Carpet Skin in 60 Minutes',
      'Lunch-break facial': 'The Lunch-Break Facial Everyone Wants',
      'Glass skin effect': 'Glass Skin Is Possible — See How',
    },
    'Botox': {
      'Preventative Botox': 'Start Preventative Botox in Your 20s-30s',
      'Wrinkle-free confidence': 'Smooth. Natural. Confident.',
      'Quick 15-min treatment': '15 Minutes to a Fresher You',
      'Natural results': 'Botox That Looks Like You — Just Better',
    },
    'GLP-1': {
      'Weight loss solution': 'Medical Weight Loss That Actually Works',
      'Medical weight management': 'Doctor-Supervised GLP-1 Program',
      'Transform your body': 'Transform Your Body This Season',
      'Doctor-supervised': 'Physician-Guided Weight Loss from $399/mo',
    },
  };

  return headlines[service]?.[angle] || `${angle} — ${service} at Rani Beauty Clinic`;
}

function generatePrimaryText(service: ServiceAdData, angle: string): string {
  return `Ready for ${angle.toLowerCase()}? At Rani Beauty Clinic in Renton, WA, our ${service.service} treatment delivers real, visible results. Physician-supervised care with 5-star reviews.\n\nStarting at $${service.avgBookingValue}${service.avgBookingValue > 400 ? ' | Financing available via Cherry' : ''}.\n\nBook your appointment today.`;
}

function estimateAdCTR(service: ServiceAdData, angle: string): number {
  let baseCTR = 1.5;

  // Higher-value services tend to have lower CTR but higher conversion
  if (service.avgBookingValue > 500) baseCTR -= 0.3;
  if (service.avgBookingValue < 200) baseCTR += 0.4;

  // Certain angles perform better
  const highPerformAngles = ['Instant glow', 'Natural results', 'Quick', 'Transform', 'Never shave'];
  if (highPerformAngles.some(a => angle.includes(a))) baseCTR += 0.5;

  return Math.round(baseCTR * 100) / 100;
}

// ── BUDGET OPTIMIZATION ──

function optimizeBudget(
  input: MetaAdsInput,
  analysis: CampaignAnalysis[]
): BudgetRecommendation[] {
  const recommendations: BudgetRecommendation[] = [];

  for (const campaign of analysis) {
    const matchingCampaign = input.campaigns.find(c => c.id === campaign.campaignId);
    if (!matchingCampaign) continue;

    let recommendedBudget = matchingCampaign.budget;
    let reason = '';
    let expectedROAS = campaign.roas;

    switch (campaign.performance) {
      case 'excellent':
        recommendedBudget = Math.round(matchingCampaign.budget * 1.25);
        reason = `ROAS at ${campaign.roas}x exceeds target — scale budget 25%`;
        expectedROAS = campaign.roas * 0.9; // slight decrease with scale
        break;
      case 'good':
        recommendedBudget = Math.round(matchingCampaign.budget * 1.10);
        reason = `Solid performance at ${campaign.roas}x ROAS — gradual 10% increase`;
        expectedROAS = campaign.roas;
        break;
      case 'average':
        reason = `Maintain current budget. Focus on creative and targeting improvements`;
        break;
      case 'poor':
        recommendedBudget = Math.round(matchingCampaign.budget * 0.5);
        reason = `ROAS at ${campaign.roas}x — cut budget 50% and optimize before scaling`;
        expectedROAS = campaign.roas * 1.3; // expect improvement with optimization
        break;
      case 'critical':
        recommendedBudget = 0;
        reason = `ROAS below 1.0x — pause campaign and redesign`;
        expectedROAS = 0;
        break;
    }

    const change = matchingCampaign.budget > 0
      ? Math.round(((recommendedBudget - matchingCampaign.budget) / matchingCampaign.budget) * 100)
      : 0;

    if (change !== 0) {
      recommendations.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        currentBudget: matchingCampaign.budget,
        recommendedBudget,
        change,
        reason,
        expectedROAS,
      });
    }
  }

  return recommendations.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

// ── AUDIENCE ANALYSIS ──

function analyzeAudiences(input: MetaAdsInput): AudienceInsight[] {
  const insights: AudienceInsight[] = [];

  // Analyze by ad set targeting
  for (const adSet of input.adSets) {
    const adSetAds = input.ads.filter(ad => ad.adSetId === adSet.id);
    const totalSpent = adSetAds.reduce((sum, ad) => sum + ad.metrics.spent, 0);
    const totalConversions = adSetAds.reduce((sum, ad) => sum + ad.metrics.conversions, 0);
    const cpa = totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 999;
    const totalRevenue = adSetAds.reduce((sum, ad) => sum + ad.metrics.revenue, 0);

    const performance = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 25) : 0;

    const segment = `${adSet.targeting.ageMin}-${adSet.targeting.ageMax}, ${adSet.targeting.genders.join('/')} in ${adSet.targeting.locations.join(', ')}`;

    let recommendation = '';
    if (cpa < input.targetCPA * 0.7) {
      recommendation = 'Top performing audience — expand reach with lookalike';
    } else if (cpa > input.targetCPA * 1.5) {
      recommendation = 'High CPA — narrow targeting or test new interests';
    } else {
      recommendation = 'Performing within target — maintain and monitor';
    }

    insights.push({
      segment,
      size: adSet.targeting.radius > 15 ? 'Large' : adSet.targeting.radius > 8 ? 'Medium' : 'Small',
      performance: Math.min(100, performance),
      cpa,
      recommendation,
    });
  }

  return insights.sort((a, b) => b.performance - a.performance);
}

// ── CREATIVE FATIGUE DETECTION ──

function detectCreativeFatigue(input: MetaAdsInput): CreativeFatigueAlert[] {
  const alerts: CreativeFatigueAlert[] = [];

  for (const ad of input.ads) {
    if (ad.status !== 'active') continue;

    const daysSinceCreation = Math.ceil(
      (new Date().getTime() - new Date(ad.createdDate).getTime()) / 86400000
    );

    // High frequency = fatigue
    if (ad.metrics.frequency > CREATIVE_FATIGUE_FREQUENCY) {
      // Estimate CTR decline based on frequency
      const ctrDecline = Math.round((ad.metrics.frequency - 2) * 8); // ~8% per frequency point above 2

      alerts.push({
        adId: ad.id,
        adName: ad.name,
        frequency: ad.metrics.frequency,
        ctrDecline,
        daysRunning: daysSinceCreation,
        action: ctrDecline > 30
          ? 'Replace creative immediately — severe fatigue'
          : 'Refresh creative within 1 week — moderate fatigue',
      });
    }

    // Old creatives (30+ days)
    if (daysSinceCreation > 30 && ad.metrics.ctr < 1.0) {
      alerts.push({
        adId: ad.id,
        adName: ad.name,
        frequency: ad.metrics.frequency,
        ctrDecline: 0,
        daysRunning: daysSinceCreation,
        action: `Creative running ${daysSinceCreation} days with ${ad.metrics.ctr}% CTR. Test fresh variant.`,
      });
    }
  }

  return alerts.sort((a, b) => b.ctrDecline - a.ctrDecline);
}

// ── FUNNEL ANALYSIS ──

function analyzeFunnel(input: MetaAdsInput): FunnelStep[] {
  const totalImpressions = input.ads.reduce((sum, ad) => sum + ad.metrics.impressions, 0);
  const totalClicks = input.ads.reduce((sum, ad) => sum + ad.metrics.clicks, 0);
  const totalLeads = input.ads.reduce((sum, ad) => sum + ad.metrics.leads, 0);
  const totalConversions = input.ads.reduce((sum, ad) => sum + ad.metrics.conversions, 0);
  const totalSpent = input.ads.reduce((sum, ad) => sum + ad.metrics.spent, 0);

  const steps: FunnelStep[] = [
    {
      stage: 'Impressions',
      count: totalImpressions,
      conversionRate: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      costPerAction: totalImpressions > 0 ? Math.round((totalSpent / totalImpressions) * 1000) / 1000 : 0,
      dropoffRate: 0,
    },
    {
      stage: 'Clicks',
      count: totalClicks,
      conversionRate: totalClicks > 0 ? Math.round((totalLeads / totalClicks) * 10000) / 100 : 0,
      costPerAction: totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0,
      dropoffRate: totalImpressions > 0 ? Math.round((1 - totalClicks / totalImpressions) * 100) : 0,
    },
    {
      stage: 'Leads',
      count: totalLeads,
      conversionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 10000) / 100 : 0,
      costPerAction: totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0,
      dropoffRate: totalClicks > 0 ? Math.round((1 - totalLeads / totalClicks) * 100) : 0,
    },
    {
      stage: 'Bookings',
      count: totalConversions,
      conversionRate: 100, // end of funnel
      costPerAction: totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0,
      dropoffRate: totalLeads > 0 ? Math.round((1 - totalConversions / totalLeads) * 100) : 0,
    },
  ];

  return steps;
}

// ── AD SCORE ──

function calculateAdScore(summary: PerformanceSummary, input: MetaAdsInput): number {
  let score = 50;

  // ROAS vs target
  if (summary.overallROAS >= input.targetROAS * 1.5) score += 20;
  else if (summary.overallROAS >= input.targetROAS) score += 10;
  else if (summary.overallROAS >= input.targetROAS * 0.5) score -= 5;
  else score -= 15;

  // CPA vs target
  if (summary.overallCPA <= input.targetCPA * 0.7) score += 15;
  else if (summary.overallCPA <= input.targetCPA) score += 8;
  else if (summary.overallCPA > input.targetCPA * 1.5) score -= 10;

  // CTR health
  if (summary.avgCTR > 3.0) score += 10;
  else if (summary.avgCTR > 2.0) score += 5;
  else if (summary.avgCTR < 1.0) score -= 10;

  // Budget utilization
  if (summary.budgetUtilization > 80 && summary.budgetUtilization < 100) score += 5;
  if (summary.budgetUtilization > 100) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// ── PROJECTED ROAS ──

function projectROAS(input: MetaAdsInput, summary: PerformanceSummary): number {
  // Simple projection based on current trajectory
  const currentROAS = summary.overallROAS;
  const utilizationFactor = summary.budgetUtilization < 100 ? 1.05 : 0.95;

  return Math.round(currentROAS * utilizationFactor * 100) / 100;
}
