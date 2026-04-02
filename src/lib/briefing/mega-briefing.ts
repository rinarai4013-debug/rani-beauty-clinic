/**
 * Rani Beauty Clinic - CEO Mega Intelligence Briefing
 *
 * Master briefing combining all intelligence sources into a gorgeous
 * HTML email sent daily at 6AM PST to info@ranibeautyclinic.com.
 *
 * 8 sections: Financial, Operations, Marketing, Competitive Intelligence,
 * Industry News, Polymarket & Macro, AI Insights, Action Items.
 */

import type {
  RevenueSnapshot, ScheduleSnapshot, AlertSnapshot, AIHighlights, ActionItem,
  CashFlowSnapshot, LoyaltySnapshot,
} from './types';
import type { MarketIntelligence, RSSFeedItem } from './market-intelligence';
import type { AdsIntelligence, MetaAdsSummary, GoogleAdsSummary, MarketingEfficiencyRatio } from './ads-intelligence';
import type { PolymarketDigest, TopMover, PortfolioSummary } from './polymarket-digest';
import type { CompetitorIntelligence, CompetitorThreatScore, MarketShareEstimate } from './competitor-tracker';

// ── Mega Briefing Data Structure ──────────────────────────────

export interface MegaBriefingData {
  date: string;
  dayOfWeek: string;
  generatedAt: string;

  // Section 1: Financial Snapshot
  financial: FinancialSection;

  // Section 2: Clinic Operations
  operations: OperationsSection;

  // Section 3: Marketing Performance
  marketing: MarketingSection;

  // Section 4: Competitive Intelligence
  competitive: CompetitiveSection;

  // Section 5: Industry News
  industryNews: IndustryNewsSection;

  // Section 6: Polymarket & Macro
  polymarket: PolymarketSection;

  // Section 7: AI Insights & Recommendations
  aiInsights: AIInsightsSection;

  // Section 8: Action Items
  actionItems: ActionItemsSection;

  // Executive Summary
  executiveSummary: ExecutiveSummary;
}

export interface FinancialSection {
  yesterdayRevenue: number;
  mtdRevenue: number;
  monthlyTarget: number;
  pacingPercent: number;
  pacingStatus: 'ahead' | 'on_track' | 'behind' | 'critical';
  cashPosition: number | null;
  runway: number | null;
  outstandingAR: number;
  overdueInvoices: number;
  yesterdayVsAvg: number; // percentage
  revenueByProvider: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface OperationsSection {
  todayAppointments: number;
  todayGaps: number;
  todayProviders: string[];
  todayConsults: number;
  activeAlerts: { critical: number; warning: number; info: number };
  alertItems: Array<{ severity: string; message: string }>;
  staffTrainingCompletion: number; // percentage
  inventoryAlerts: Array<{ product: string; status: string }>;
  utilization: number; // percentage
}

export interface MarketingSection {
  metaAds: MetaAdsBriefing | null;
  googleAds: GoogleAdsBriefing | null;
  organic: OrganicBriefing;
  crossChannelWinner: string | null;
  overallEfficiency: MarketingEfficiencyRatio | null;
}

export interface MetaAdsBriefing {
  spend: number;
  roas: number;
  topCampaign: string;
  topCampaignROAS: number;
  fatigueAlerts: number;
  budgetPacing: string;
}

export interface GoogleAdsBriefing {
  spend: number;
  cpa: number;
  impressionShare: number;
  topKeyword: string;
  wastedSpend: number;
  newOpportunities: number;
}

export interface OrganicBriefing {
  newLeads: number;
  seoRankingChanges: number;
  reviewVelocity: number;
  newReviews7d: number;
  avgRating: number;
}

export interface CompetitiveSection {
  topThreats: Array<{ name: string; score: number; change: string }>;
  competitorMoves: Array<{ competitor: string; action: string }>;
  yourPosition: { reviewRank: number; keywordRank: number | null };
  marketShare: number;
  threatsAndOpportunities: string[];
}

export interface IndustryNewsSection {
  topStories: Array<{ title: string; source: string; relevance: number }>;
  fdaUpdates: Array<{ title: string; impact: string }>;
  productUpdates: Array<{ manufacturer: string; headline: string }>;
  treatmentTrends: Array<{ treatment: string; direction: string; opportunity: string }>;
}

export interface PolymarketSection {
  topMovers: Array<{ market: string; change: number; direction: string }>;
  resolutionAlerts: Array<{ market: string; hours: number; leading: string; confidence: string }>;
  portfolio: { totalPnL: number; totalPnLPercent: number } | null;
  keyEvents: Array<{ date: string; title: string }>;
  overallSentiment: string;
}

export interface AIInsightsSection {
  churnEngine: Array<{ clientName: string; score: number; suggestedAction: string }>;
  revenueAnomaly: { flag: boolean; message: string } | null;
  dynamicPricing: Array<{ service: string; recommendation: string }>;
  scheduleOptimizer: { utilizationRate: number; suggestions: string[] };
}

export interface ActionItemsSection {
  critical: MegaActionItem[];
  important: MegaActionItem[];
  opportunistic: MegaActionItem[];
}

export interface MegaActionItem {
  category: string;
  action: string;
  reason: string;
  source: string;
}

export interface ExecutiveSummary {
  revenueStatus: string;
  biggestOpportunity: string;
  biggestRisk: string;
}

// ── Builder Functions ─────────────────────────────────────────

/**
 * Build the financial section from revenue and cash flow data
 */
export function buildFinancialSection(
  revenue: RevenueSnapshot | null,
  cashFlow: CashFlowSnapshot | null,
  mtdRevenue: number,
  monthlyTarget: number,
  yesterdayVsAvg: number
): FinancialSection {
  const pacingPercent = monthlyTarget > 0 ? Math.round((mtdRevenue / monthlyTarget) * 100) : 0;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedPacing = Math.round((dayOfMonth / daysInMonth) * 100);

  let pacingStatus: FinancialSection['pacingStatus'] = 'on_track';
  if (pacingPercent >= expectedPacing + 10) pacingStatus = 'ahead';
  else if (pacingPercent < expectedPacing - 20) pacingStatus = 'critical';
  else if (pacingPercent < expectedPacing - 5) pacingStatus = 'behind';

  return {
    yesterdayRevenue: revenue?.total ?? 0,
    mtdRevenue,
    monthlyTarget,
    pacingPercent,
    pacingStatus,
    cashPosition: cashFlow?.bankBalance ?? null,
    runway: cashFlow?.runway ?? null,
    outstandingAR: 0,
    overdueInvoices: 0,
    yesterdayVsAvg,
    revenueByProvider: revenue?.byProvider ?? {},
    revenueByCategory: revenue?.byCategory ?? {},
  };
}

/**
 * Build the operations section
 */
export function buildOperationsSection(
  schedule: ScheduleSnapshot | null,
  alerts: AlertSnapshot | null,
  inventoryAlerts: Array<{ product: string; status: string }> = []
): OperationsSection {
  return {
    todayAppointments: schedule?.totalAppointments ?? 0,
    todayGaps: schedule?.gaps?.length ?? 0,
    todayProviders: schedule?.byProvider ? Object.keys(schedule.byProvider) : [],
    todayConsults: schedule?.consultCount ?? 0,
    activeAlerts: alerts?.bySeverity ?? { critical: 0, warning: 0, info: 0 },
    alertItems: (alerts?.items ?? []).slice(0, 5).map(a => ({
      severity: a.severity,
      message: a.message,
    })),
    staffTrainingCompletion: 100,
    inventoryAlerts,
    utilization: 0,
  };
}

/**
 * Build the marketing section from ads intelligence
 */
export function buildMarketingSection(
  adsIntel: AdsIntelligence | null,
  organicData?: Partial<OrganicBriefing>
): MarketingSection {
  let metaAds: MetaAdsBriefing | null = null;
  if (adsIntel?.meta) {
    const ms = adsIntel.meta.summary;
    metaAds = {
      spend: ms.totalSpend,
      roas: ms.overallROAS,
      topCampaign: ms.topCampaign,
      topCampaignROAS: ms.topCampaignROAS,
      fatigueAlerts: adsIntel.meta.fatigueAlerts.length,
      budgetPacing: adsIntel.meta.budgetPacing.pacingStatus,
    };
  }

  let googleAds: GoogleAdsBriefing | null = null;
  if (adsIntel?.google) {
    const gs = adsIntel.google.summary;
    googleAds = {
      spend: gs.totalSpend,
      cpa: gs.avgCPA,
      impressionShare: gs.avgImpressionShare,
      topKeyword: gs.topKeyword,
      wastedSpend: gs.wastedSpend,
      newOpportunities: gs.newOpportunities,
    };
  }

  return {
    metaAds,
    googleAds,
    organic: {
      newLeads: organicData?.newLeads ?? 0,
      seoRankingChanges: organicData?.seoRankingChanges ?? 0,
      reviewVelocity: organicData?.reviewVelocity ?? 0,
      newReviews7d: organicData?.newReviews7d ?? 0,
      avgRating: organicData?.avgRating ?? 4.9,
    },
    crossChannelWinner: adsIntel?.crossChannel?.winner ?? null,
    overallEfficiency: adsIntel?.crossChannel?.overallEfficiency ?? null,
  };
}

/**
 * Build competitive intelligence section
 */
export function buildCompetitiveSection(
  compIntel: CompetitorIntelligence | null
): CompetitiveSection {
  if (!compIntel) {
    return {
      topThreats: [],
      competitorMoves: [],
      yourPosition: { reviewRank: 0, keywordRank: null },
      marketShare: 0,
      threatsAndOpportunities: [],
    };
  }

  const topThreats = compIntel.topThreats.map(t => ({
    name: t.competitorName,
    score: t.overallScore,
    change: t.trend,
  }));

  const competitorMoves = compIntel.websiteChanges.slice(0, 5).map(c => ({
    competitor: c.competitorName,
    action: c.description,
  }));

  const raniShare = compIntel.marketShare.find(m => m.competitorName === 'Rani Beauty Clinic');

  return {
    topThreats,
    competitorMoves,
    yourPosition: { reviewRank: 0, keywordRank: null },
    marketShare: raniShare?.estimatedShare ?? 0,
    threatsAndOpportunities: compIntel.actionItems.slice(0, 3).map(a => a.action),
  };
}

/**
 * Build industry news section
 */
export function buildIndustryNewsSection(
  marketIntel: MarketIntelligence | null
): IndustryNewsSection {
  if (!marketIntel) {
    return { topStories: [], fdaUpdates: [], productUpdates: [], treatmentTrends: [] };
  }

  return {
    topStories: marketIntel.industryNews.topStories.slice(0, 3).map(s => ({
      title: s.title,
      source: s.source,
      relevance: s.relevanceScore,
    })),
    fdaUpdates: marketIntel.fdaTracker.recentApprovals.slice(0, 3).map(a => ({
      title: `${a.productName} (${a.manufacturer})`,
      impact: a.impact,
    })),
    productUpdates: marketIntel.manufacturerNews.slice(0, 3).map(n => ({
      manufacturer: n.manufacturer,
      headline: n.headline,
    })),
    treatmentTrends: marketIntel.treatmentTrends
      .filter(t => t.revenueOpportunity !== 'low')
      .slice(0, 5)
      .map(t => ({
        treatment: t.treatment,
        direction: t.trendDirection,
        opportunity: t.revenueOpportunity,
      })),
  };
}

/**
 * Build Polymarket section
 */
export function buildPolymarketSection(
  digest: PolymarketDigest | null
): PolymarketSection {
  if (!digest) {
    return {
      topMovers: [],
      resolutionAlerts: [],
      portfolio: null,
      keyEvents: [],
      overallSentiment: 'neutral',
    };
  }

  return {
    topMovers: digest.topMovers.slice(0, 5).map(m => ({
      market: m.market.title,
      change: m.priceChange24h,
      direction: m.direction,
    })),
    resolutionAlerts: digest.resolvingMarkets.slice(0, 5).map(m => ({
      market: m.market.title,
      hours: m.hoursUntilResolution,
      leading: m.leadingOutcome,
      confidence: m.confidence,
    })),
    portfolio: digest.portfolio ? {
      totalPnL: digest.portfolio.totalPnL,
      totalPnLPercent: digest.portfolio.totalPnLPercent,
    } : null,
    keyEvents: digest.eventCalendar.slice(0, 5).map(e => ({
      date: e.date,
      title: e.title,
    })),
    overallSentiment: digest.marketSummary.overallSentiment,
  };
}

/**
 * Build AI insights section
 */
export function buildAIInsightsSection(
  aiHighlights: AIHighlights | null
): AIInsightsSection {
  const churnEngine: AIInsightsSection['churnEngine'] = [];
  if (aiHighlights?.topChurnRiskClient) {
    churnEngine.push({
      clientName: aiHighlights.topChurnRiskClient.name,
      score: aiHighlights.topChurnRiskClient.score,
      suggestedAction: `Last visit: ${aiHighlights.topChurnRiskClient.lastVisit}. Send personalized reactivation offer.`,
    });
  }

  let revenueAnomaly: AIInsightsSection['revenueAnomaly'] = null;
  if (aiHighlights?.revenueAnomaly) {
    revenueAnomaly = {
      flag: true,
      message: `${aiHighlights.revenueAnomaly.type}: ${aiHighlights.revenueAnomaly.message}`,
    };
  }

  return {
    churnEngine,
    revenueAnomaly,
    dynamicPricing: [],
    scheduleOptimizer: { utilizationRate: 0, suggestions: [] },
  };
}

/**
 * Build prioritized action items from all sections
 */
export function buildActionItems(
  briefing: Omit<MegaBriefingData, 'actionItems' | 'executiveSummary'>
): ActionItemsSection {
  const critical: MegaActionItem[] = [];
  const important: MegaActionItem[] = [];
  const opportunistic: MegaActionItem[] = [];

  // Financial actions
  if (briefing.financial.pacingStatus === 'critical') {
    critical.push({
      category: 'Revenue',
      action: 'Revenue is significantly behind target - push for same-day bookings and upsells',
      reason: `MTD at ${briefing.financial.pacingPercent}% of monthly target`,
      source: 'Financial',
    });
  } else if (briefing.financial.pacingStatus === 'behind') {
    important.push({
      category: 'Revenue',
      action: 'Review booking pipeline and push consult conversions',
      reason: `Revenue pacing ${briefing.financial.pacingPercent}% of target`,
      source: 'Financial',
    });
  }

  // Operations actions
  if (briefing.operations.activeAlerts.critical > 0) {
    critical.push({
      category: 'Operations',
      action: `Address ${briefing.operations.activeAlerts.critical} critical alert(s)`,
      reason: briefing.operations.alertItems.find(a => a.severity === 'critical')?.message || 'Critical alert detected',
      source: 'Operations',
    });
  }

  if (briefing.operations.todayGaps > 2) {
    important.push({
      category: 'Schedule',
      action: `Fill ${briefing.operations.todayGaps} schedule gaps today`,
      reason: 'Each gap = missed revenue opportunity',
      source: 'Operations',
    });
  }

  if (briefing.operations.inventoryAlerts.length > 0) {
    important.push({
      category: 'Inventory',
      action: `Reorder ${briefing.operations.inventoryAlerts.length} low-stock item(s)`,
      reason: 'Prevent service interruptions',
      source: 'Operations',
    });
  }

  // Marketing actions
  if (briefing.marketing.metaAds && briefing.marketing.metaAds.fatigueAlerts > 0) {
    important.push({
      category: 'Marketing',
      action: `Refresh ${briefing.marketing.metaAds.fatigueAlerts} fatigued ad creative(s)`,
      reason: 'Creative fatigue reducing CTR and wasting spend',
      source: 'Meta Ads',
    });
  }

  if (briefing.marketing.googleAds && briefing.marketing.googleAds.wastedSpend > 100) {
    important.push({
      category: 'Marketing',
      action: `Pause non-converting Google keywords ($${briefing.marketing.googleAds.wastedSpend} wasted)`,
      reason: 'Reallocate budget to performing keywords',
      source: 'Google Ads',
    });
  }

  // Competitive actions
  for (const threat of briefing.competitive.topThreats.slice(0, 2)) {
    if (threat.score >= 70) {
      important.push({
        category: 'Competitive',
        action: `Monitor ${threat.name} (threat score: ${threat.score})`,
        reason: 'High competitive threat detected',
        source: 'Competitor Tracker',
      });
    }
  }

  // AI-driven actions
  for (const client of briefing.aiInsights.churnEngine) {
    if (client.score >= 70) {
      important.push({
        category: 'Client Retention',
        action: `Reach out to ${client.clientName} (churn risk: ${client.score}%)`,
        reason: client.suggestedAction,
        source: 'AI Churn Engine',
      });
    }
  }

  // Opportunistic
  if (briefing.operations.todayConsults > 0) {
    opportunistic.push({
      category: 'Sales',
      action: `${briefing.operations.todayConsults} consult(s) today - prepare closing strategy`,
      reason: 'Consults are your highest-value conversion opportunity',
      source: 'Schedule',
    });
  }

  for (const trend of briefing.industryNews.treatmentTrends.filter(t => t.opportunity === 'high')) {
    opportunistic.push({
      category: 'Growth',
      action: `Explore ${trend.treatment} - rising demand trend`,
      reason: `Treatment trending ${trend.direction} with high revenue opportunity`,
      source: 'Market Intelligence',
    });
  }

  return { critical, important, opportunistic };
}

/**
 * Build executive summary
 */
export function buildExecutiveSummary(briefing: Omit<MegaBriefingData, 'executiveSummary'>): ExecutiveSummary {
  // Revenue status
  let revenueStatus = '';
  const f = briefing.financial;
  if (f.pacingStatus === 'ahead') {
    revenueStatus = `Revenue tracking ${f.pacingPercent}% of target - ahead of pace. Yesterday: $${f.yesterdayRevenue.toLocaleString()}.`;
  } else if (f.pacingStatus === 'on_track') {
    revenueStatus = `Revenue on track at ${f.pacingPercent}% of $${f.monthlyTarget.toLocaleString()} target. Yesterday: $${f.yesterdayRevenue.toLocaleString()}.`;
  } else if (f.pacingStatus === 'behind') {
    revenueStatus = `Revenue behind at ${f.pacingPercent}% of target. Need to accelerate bookings.`;
  } else {
    revenueStatus = `Revenue critically behind at ${f.pacingPercent}% of target. Immediate action required.`;
  }

  // Biggest opportunity
  let biggestOpportunity = 'No specific opportunities identified today.';
  const actions = briefing.actionItems;
  if (actions.opportunistic.length > 0) {
    biggestOpportunity = actions.opportunistic[0].action;
  }
  if (briefing.operations.todayConsults >= 2) {
    biggestOpportunity = `${briefing.operations.todayConsults} consults today - high conversion opportunity.`;
  }
  if (briefing.marketing.metaAds && briefing.marketing.metaAds.roas > 4) {
    biggestOpportunity = `Meta Ads ROAS at ${briefing.marketing.metaAds.roas}x - scale top-performing campaigns.`;
  }

  // Biggest risk
  let biggestRisk = 'No critical risks detected.';
  if (actions.critical.length > 0) {
    biggestRisk = actions.critical[0].action;
  } else if (f.pacingStatus === 'behind' || f.pacingStatus === 'critical') {
    biggestRisk = `Revenue pacing at ${f.pacingPercent}% - risk of missing monthly target.`;
  }

  return { revenueStatus, biggestOpportunity, biggestRisk };
}

/**
 * Assemble the complete mega briefing
 */
export async function assembleMegaBriefing(inputs: {
  revenue?: RevenueSnapshot | null;
  schedule?: ScheduleSnapshot | null;
  alerts?: AlertSnapshot | null;
  cashFlow?: CashFlowSnapshot | null;
  loyalty?: LoyaltySnapshot | null;
  aiHighlights?: AIHighlights | null;
  mtdRevenue?: number;
  monthlyTarget?: number;
  yesterdayVsAvg?: number;
  adsIntelligence?: AdsIntelligence | null;
  marketIntelligence?: MarketIntelligence | null;
  polymarketDigest?: PolymarketDigest | null;
  competitorIntelligence?: CompetitorIntelligence | null;
  organicData?: Partial<OrganicBriefing>;
  inventoryAlerts?: Array<{ product: string; status: string }>;
}): Promise<MegaBriefingData> {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const financial = buildFinancialSection(
    inputs.revenue ?? null,
    inputs.cashFlow ?? null,
    inputs.mtdRevenue ?? 0,
    inputs.monthlyTarget ?? 80000,
    inputs.yesterdayVsAvg ?? 0
  );

  const operations = buildOperationsSection(
    inputs.schedule ?? null,
    inputs.alerts ?? null,
    inputs.inventoryAlerts
  );

  const marketing = buildMarketingSection(
    inputs.adsIntelligence ?? null,
    inputs.organicData
  );

  const competitive = buildCompetitiveSection(inputs.competitorIntelligence ?? null);
  const industryNews = buildIndustryNewsSection(inputs.marketIntelligence ?? null);
  const polymarket = buildPolymarketSection(inputs.polymarketDigest ?? null);
  const aiInsights = buildAIInsightsSection(inputs.aiHighlights ?? null);

  const date = now.toISOString().split('T')[0];
  const dayOfWeek = days[now.getDay()];

  // Build partial briefing to derive action items
  const partialBriefing = {
    date,
    dayOfWeek,
    generatedAt: now.toISOString(),
    financial,
    operations,
    marketing,
    competitive,
    industryNews,
    polymarket,
    aiInsights,
  };

  const actionItems = buildActionItems(partialBriefing);

  const fullBriefing = { ...partialBriefing, actionItems } as Omit<MegaBriefingData, 'executiveSummary'> & { executiveSummary?: ExecutiveSummary };
  const executiveSummary = buildExecutiveSummary(fullBriefing as MegaBriefingData);

  return {
    ...partialBriefing,
    actionItems,
    executiveSummary,
  };
}

// ── HTML Email Rendering ──────────────────────────────────────

const COLORS = {
  navy: '#0F1D2C',
  navyLight: '#1A2B3C',
  gold: '#C9A96E',
  goldLight: '#D4B87A',
  cream: '#F8F6F1',
  white: '#FFFFFF',
  red: '#E74C3C',
  green: '#27AE60',
  yellow: '#F39C12',
  gray: '#7F8C8D',
  grayLight: '#ECF0F1',
  textDark: '#2C3E50',
  textMuted: '#95A5A6',
};

/**
 * Render the mega briefing as a beautiful HTML email
 */
export function renderMegaBriefingHTML(data: MegaBriefingData): string {
  const formattedDate = formatDate(data.date);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rani Intelligence Briefing - ${formattedDate}</title>
<style>
  body { margin: 0; padding: 0; background: ${COLORS.grayLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 680px; margin: 0 auto; background: ${COLORS.white}; }
  .header { background: ${COLORS.navy}; padding: 32px 24px; text-align: center; }
  .header h1 { color: ${COLORS.gold}; font-family: Georgia, 'Playfair Display', serif; font-size: 24px; margin: 0 0 4px 0; letter-spacing: 2px; }
  .header .date { color: ${COLORS.goldLight}; font-size: 14px; letter-spacing: 1px; }
  .exec-box { background: linear-gradient(135deg, ${COLORS.navyLight}, ${COLORS.navy}); margin: 0; padding: 24px; color: ${COLORS.white}; }
  .exec-box h2 { color: ${COLORS.gold}; font-size: 16px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; }
  .exec-item { margin: 8px 0; font-size: 14px; line-height: 1.5; }
  .exec-label { color: ${COLORS.goldLight}; font-weight: 600; }
  .section { padding: 24px; border-bottom: 1px solid ${COLORS.grayLight}; }
  .section-header { display: flex; align-items: center; margin-bottom: 16px; }
  .section-header h2 { color: ${COLORS.navy}; font-size: 18px; margin: 0; border-bottom: 2px solid ${COLORS.gold}; padding-bottom: 4px; display: inline-block; }
  .section-num { background: ${COLORS.gold}; color: ${COLORS.navy}; font-weight: 700; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px; flex-shrink: 0; }
  .kpi-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
  .kpi-card { flex: 1; min-width: 120px; background: ${COLORS.cream}; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi-value { font-size: 24px; font-weight: 700; color: ${COLORS.navy}; }
  .kpi-label { font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .kpi-badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .badge-green { background: #E8F5E9; color: ${COLORS.green}; }
  .badge-yellow { background: #FFF8E1; color: ${COLORS.yellow}; }
  .badge-red { background: #FFEBEE; color: ${COLORS.red}; }
  .badge-gray { background: ${COLORS.grayLight}; color: ${COLORS.gray}; }
  .bar-chart { margin: 8px 0; }
  .bar-row { display: flex; align-items: center; margin: 6px 0; font-size: 13px; }
  .bar-label { width: 100px; color: ${COLORS.textDark}; font-size: 12px; flex-shrink: 0; }
  .bar-track { flex: 1; height: 16px; background: ${COLORS.grayLight}; border-radius: 8px; overflow: hidden; margin: 0 8px; }
  .bar-fill { height: 100%; border-radius: 8px; transition: width 0.3s; }
  .bar-value { width: 60px; text-align: right; font-weight: 600; font-size: 12px; color: ${COLORS.navy}; }
  .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
  .mini-table th { background: ${COLORS.cream}; color: ${COLORS.navy}; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; }
  .mini-table td { padding: 8px 12px; border-bottom: 1px solid ${COLORS.grayLight}; color: ${COLORS.textDark}; }
  .action-list { list-style: none; padding: 0; margin: 8px 0; }
  .action-item { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid ${COLORS.grayLight}; font-size: 13px; }
  .action-check { width: 18px; height: 18px; border: 2px solid ${COLORS.gold}; border-radius: 3px; margin-right: 10px; flex-shrink: 0; margin-top: 1px; }
  .action-text { flex: 1; }
  .action-category { font-size: 10px; text-transform: uppercase; color: ${COLORS.gold}; font-weight: 600; letter-spacing: 0.5px; }
  .action-desc { color: ${COLORS.textDark}; line-height: 1.4; }
  .action-reason { color: ${COLORS.textMuted}; font-size: 11px; margin-top: 2px; }
  .priority-critical .action-check { border-color: ${COLORS.red}; }
  .priority-important .action-check { border-color: ${COLORS.yellow}; }
  .priority-opportunistic .action-check { border-color: ${COLORS.green}; }
  .news-item { padding: 10px 0; border-bottom: 1px solid ${COLORS.grayLight}; }
  .news-title { font-weight: 600; color: ${COLORS.navy}; font-size: 13px; }
  .news-source { font-size: 11px; color: ${COLORS.textMuted}; }
  .footer { background: ${COLORS.navy}; padding: 24px; text-align: center; }
  .footer a { color: ${COLORS.gold}; text-decoration: none; font-size: 12px; margin: 0 8px; }
  .footer .copyright { color: ${COLORS.textMuted}; font-size: 11px; margin-top: 12px; }
  .empty-state { color: ${COLORS.textMuted}; font-size: 13px; font-style: italic; padding: 8px 0; }
  @media (max-width: 600px) {
    .kpi-row { flex-direction: column; }
    .kpi-card { min-width: auto; }
    .bar-label { width: 70px; font-size: 11px; }
    .section { padding: 16px; }
  }
</style>
</head>
<body>
<div class="container">

${renderHeader(formattedDate, data.dayOfWeek)}
${renderExecutiveSummary(data.executiveSummary)}
${renderFinancialSection(data.financial)}
${renderOperationsSection(data.operations)}
${renderMarketingSection(data.marketing)}
${renderCompetitiveSection(data.competitive)}
${renderIndustryNewsSection(data.industryNews)}
${renderPolymarketSection(data.polymarket)}
${renderAIInsightsSection(data.aiInsights)}
${renderActionItemsSection(data.actionItems)}
${renderFooter(data.generatedAt)}

</div>
</body>
</html>`;
}

function renderHeader(date: string, dayOfWeek: string): string {
  return `<div class="header">
  <h1>RANI INTELLIGENCE BRIEFING</h1>
  <div class="date">${dayOfWeek.toUpperCase()} &bull; ${date}</div>
</div>`;
}

function renderExecutiveSummary(summary: ExecutiveSummary): string {
  return `<div class="exec-box">
  <h2>Executive Summary</h2>
  <div class="exec-item"><span class="exec-label">Revenue:</span> ${escapeHtml(summary.revenueStatus)}</div>
  <div class="exec-item"><span class="exec-label">Opportunity:</span> ${escapeHtml(summary.biggestOpportunity)}</div>
  <div class="exec-item"><span class="exec-label">Risk:</span> ${escapeHtml(summary.biggestRisk)}</div>
</div>`;
}

function renderFinancialSection(f: FinancialSection): string {
  const pacingBadge = f.pacingStatus === 'ahead' ? 'badge-green'
    : f.pacingStatus === 'on_track' ? 'badge-green'
    : f.pacingStatus === 'behind' ? 'badge-yellow'
    : 'badge-red';

  const changeIndicator = f.yesterdayVsAvg >= 0 ? `+${f.yesterdayVsAvg}%` : `${f.yesterdayVsAvg}%`;
  const changeBadge = f.yesterdayVsAvg >= 0 ? 'badge-green' : 'badge-red';

  return `<div class="section">
  <div class="section-header"><span class="section-num">1</span><h2>Financial Snapshot</h2></div>
  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-value">$${formatNumber(f.yesterdayRevenue)}</div>
      <div class="kpi-label">Yesterday</div>
      <div class="kpi-badge ${changeBadge}">${changeIndicator} vs avg</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${formatNumber(f.mtdRevenue)}</div>
      <div class="kpi-label">Month to Date</div>
      <div class="kpi-badge ${pacingBadge}">${f.pacingPercent}% of target</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${formatNumber(f.monthlyTarget)}</div>
      <div class="kpi-label">Monthly Target</div>
      <div class="kpi-badge badge-gray">${f.pacingStatus.replace('_', ' ')}</div>
    </div>
  </div>
  ${f.cashPosition !== null ? `<div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-value">$${formatNumber(f.cashPosition)}</div>
      <div class="kpi-label">Cash Position</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${f.runway !== null ? f.runway + ' days' : 'N/A'}</div>
      <div class="kpi-label">Runway</div>
    </div>
  </div>` : ''}
  ${renderProviderBars(f.revenueByProvider)}
</div>`;
}

function renderProviderBars(byProvider: Record<string, number>): string {
  const entries = Object.entries(byProvider);
  if (entries.length === 0) return '';

  const max = Math.max(...entries.map(([, v]) => v));
  if (max === 0) return '';

  return `<div class="bar-chart">
    ${entries.map(([name, value]) => {
      const pct = Math.round((value / max) * 100);
      return `<div class="bar-row">
        <span class="bar-label">${escapeHtml(name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${COLORS.gold}"></div></div>
        <span class="bar-value">$${formatNumber(value)}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderOperationsSection(o: OperationsSection): string {
  const alertTotal = o.activeAlerts.critical + o.activeAlerts.warning + o.activeAlerts.info;
  return `<div class="section">
  <div class="section-header"><span class="section-num">2</span><h2>Clinic Operations</h2></div>
  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-value">${o.todayAppointments}</div>
      <div class="kpi-label">Appointments Today</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${o.todayConsults}</div>
      <div class="kpi-label">Consults</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${o.todayGaps}</div>
      <div class="kpi-label">Schedule Gaps</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${alertTotal}</div>
      <div class="kpi-label">Active Alerts</div>
      ${o.activeAlerts.critical > 0 ? `<div class="kpi-badge badge-red">${o.activeAlerts.critical} critical</div>` : ''}
    </div>
  </div>
  ${o.alertItems.length > 0 ? `<div style="margin-top:8px">
    ${o.alertItems.map(a => `<div style="font-size:13px;padding:4px 0;color:${a.severity === 'critical' ? COLORS.red : a.severity === 'warning' ? COLORS.yellow : COLORS.gray}">
      ${a.severity === 'critical' ? '&#9888;' : a.severity === 'warning' ? '&#9888;' : '&#8505;'} ${escapeHtml(a.message)}
    </div>`).join('')}
  </div>` : ''}
  ${o.inventoryAlerts.length > 0 ? `<div style="margin-top:8px;font-size:13px;color:${COLORS.yellow}">&#9888; ${o.inventoryAlerts.length} inventory alert(s): ${o.inventoryAlerts.map(a => a.product).join(', ')}</div>` : ''}
</div>`;
}

function renderMarketingSection(m: MarketingSection): string {
  let metaHtml = '<div class="empty-state">Meta Ads not connected</div>';
  if (m.metaAds) {
    const roasBadge = m.metaAds.roas >= 3 ? 'badge-green' : m.metaAds.roas >= 2 ? 'badge-yellow' : 'badge-red';
    metaHtml = `<div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-value">$${formatNumber(m.metaAds.spend)}</div>
        <div class="kpi-label">Meta Spend</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.metaAds.roas}x</div>
        <div class="kpi-label">ROAS</div>
        <div class="kpi-badge ${roasBadge}">${m.metaAds.roas >= 3 ? 'Good' : m.metaAds.roas >= 2 ? 'OK' : 'Low'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.metaAds.fatigueAlerts}</div>
        <div class="kpi-label">Fatigue Alerts</div>
        ${m.metaAds.fatigueAlerts > 0 ? '<div class="kpi-badge badge-yellow">Action Needed</div>' : ''}
      </div>
    </div>
    <div style="font-size:12px;color:${COLORS.textMuted}">Top: ${escapeHtml(m.metaAds.topCampaign)} (${m.metaAds.topCampaignROAS}x ROAS) | Pacing: ${m.metaAds.budgetPacing}</div>`;
  }

  let googleHtml = '<div class="empty-state">Google Ads not connected</div>';
  if (m.googleAds) {
    googleHtml = `<div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-value">$${formatNumber(m.googleAds.spend)}</div>
        <div class="kpi-label">Google Spend</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">$${formatNumber(m.googleAds.cpa)}</div>
        <div class="kpi-label">CPA</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.googleAds.impressionShare}%</div>
        <div class="kpi-label">Impression Share</div>
      </div>
    </div>
    ${m.googleAds.wastedSpend > 0 ? `<div style="font-size:12px;color:${COLORS.yellow}">&#9888; $${formatNumber(m.googleAds.wastedSpend)} wasted on non-converting keywords</div>` : ''}`;
  }

  let efficiencyHtml = '';
  if (m.overallEfficiency) {
    const merBadge = m.overallEfficiency.status === 'exceeding' ? 'badge-green'
      : m.overallEfficiency.status === 'on_target' ? 'badge-green'
      : m.overallEfficiency.status === 'below_target' ? 'badge-yellow'
      : 'badge-red';
    efficiencyHtml = `<div style="margin-top:12px;padding:12px;background:${COLORS.cream};border-radius:8px;font-size:13px">
      <strong>Overall Efficiency:</strong> ${m.overallEfficiency.mer}x MER
      <span class="kpi-badge ${merBadge}">${m.overallEfficiency.status.replace('_', ' ')}</span>
      ${m.crossChannelWinner && m.crossChannelWinner !== 'tie' ? ` | Winner: ${m.crossChannelWinner === 'meta' ? 'Meta' : 'Google'}` : ''}
    </div>`;
  }

  return `<div class="section">
  <div class="section-header"><span class="section-num">3</span><h2>Marketing Performance</h2></div>
  <div style="margin-bottom:12px"><strong style="color:${COLORS.navy};font-size:14px">Meta Ads</strong></div>
  ${metaHtml}
  <div style="margin:16px 0 12px"><strong style="color:${COLORS.navy};font-size:14px">Google Ads</strong></div>
  ${googleHtml}
  <div style="margin:12px 0 8px"><strong style="color:${COLORS.navy};font-size:14px">Organic</strong></div>
  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-value">${m.organic.newLeads}</div>
      <div class="kpi-label">New Leads</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${m.organic.avgRating}</div>
      <div class="kpi-label">Avg Rating</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${m.organic.newReviews7d}</div>
      <div class="kpi-label">Reviews (7d)</div>
    </div>
  </div>
  ${efficiencyHtml}
</div>`;
}

function renderCompetitiveSection(c: CompetitiveSection): string {
  if (c.topThreats.length === 0 && c.competitorMoves.length === 0) {
    return `<div class="section">
  <div class="section-header"><span class="section-num">4</span><h2>Competitive Intelligence</h2></div>
  <div class="empty-state">No competitor data available. Connect Google Places API for tracking.</div>
</div>`;
  }

  return `<div class="section">
  <div class="section-header"><span class="section-num">4</span><h2>Competitive Intelligence</h2></div>
  ${c.topThreats.length > 0 ? `<table class="mini-table">
    <tr><th>Competitor</th><th>Threat Score</th><th>Trend</th></tr>
    ${c.topThreats.map(t => `<tr>
      <td>${escapeHtml(t.name)}</td>
      <td><span class="kpi-badge ${t.score >= 70 ? 'badge-red' : t.score >= 50 ? 'badge-yellow' : 'badge-green'}">${t.score}/100</span></td>
      <td>${t.change}</td>
    </tr>`).join('')}
  </table>` : ''}
  ${c.marketShare > 0 ? `<div style="font-size:13px;margin-top:8px">Estimated market share: <strong>${c.marketShare}%</strong></div>` : ''}
  ${c.threatsAndOpportunities.length > 0 ? `<div style="margin-top:8px">
    ${c.threatsAndOpportunities.map(t => `<div style="font-size:13px;padding:3px 0;color:${COLORS.textDark}">&bull; ${escapeHtml(t)}</div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderIndustryNewsSection(n: IndustryNewsSection): string {
  const hasContent = n.topStories.length > 0 || n.fdaUpdates.length > 0 || n.treatmentTrends.length > 0;

  if (!hasContent) {
    return `<div class="section">
  <div class="section-header"><span class="section-num">5</span><h2>Industry News</h2></div>
  <div class="empty-state">No industry news available. RSS feeds will populate after first fetch.</div>
</div>`;
  }

  return `<div class="section">
  <div class="section-header"><span class="section-num">5</span><h2>Industry News</h2></div>
  ${n.topStories.length > 0 ? n.topStories.map(s => `<div class="news-item">
    <div class="news-title">${escapeHtml(s.title)}</div>
    <div class="news-source">${escapeHtml(s.source)} &bull; Relevance: ${s.relevance}%</div>
  </div>`).join('') : ''}
  ${n.fdaUpdates.length > 0 ? `<div style="margin-top:12px"><strong style="font-size:13px;color:${COLORS.navy}">FDA Updates</strong>
    ${n.fdaUpdates.map(f => `<div style="font-size:13px;padding:3px 0">&bull; ${escapeHtml(f.title)} (${f.impact} impact)</div>`).join('')}
  </div>` : ''}
  ${n.treatmentTrends.length > 0 ? `<div style="margin-top:12px"><strong style="font-size:13px;color:${COLORS.navy}">Treatment Trends</strong>
    ${n.treatmentTrends.map(t => `<div style="font-size:13px;padding:3px 0">
      ${t.direction === 'rising' ? '&#8593;' : t.direction === 'declining' ? '&#8595;' : '&#8594;'}
      <strong>${escapeHtml(t.treatment)}</strong> - ${t.direction}
      <span class="kpi-badge ${t.opportunity === 'high' ? 'badge-green' : t.opportunity === 'medium' ? 'badge-yellow' : 'badge-gray'}">${t.opportunity}</span>
    </div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderPolymarketSection(p: PolymarketSection): string {
  if (p.topMovers.length === 0 && p.resolutionAlerts.length === 0) {
    return `<div class="section">
  <div class="section-header"><span class="section-num">6</span><h2>Polymarket &amp; Macro</h2></div>
  <div class="empty-state">No Polymarket data available. Configure POLYMARKET_API_URL to enable.</div>
</div>`;
  }

  return `<div class="section">
  <div class="section-header"><span class="section-num">6</span><h2>Polymarket &amp; Macro</h2></div>
  <div style="font-size:13px;margin-bottom:8px">Sentiment: <span class="kpi-badge ${p.overallSentiment === 'risk_on' ? 'badge-green' : p.overallSentiment === 'risk_off' ? 'badge-red' : 'badge-gray'}">${p.overallSentiment.replace('_', ' ')}</span></div>
  ${p.topMovers.length > 0 ? `<table class="mini-table">
    <tr><th>Market</th><th>Change</th></tr>
    ${p.topMovers.map(m => `<tr>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.market.substring(0, 60))}</td>
      <td><span class="kpi-badge ${m.direction === 'up' ? 'badge-green' : 'badge-red'}">${m.direction === 'up' ? '+' : ''}${(m.change * 100).toFixed(1)}%</span></td>
    </tr>`).join('')}
  </table>` : ''}
  ${p.portfolio ? `<div style="margin-top:8px;font-size:13px">Portfolio P&L: <span class="kpi-badge ${p.portfolio.totalPnL >= 0 ? 'badge-green' : 'badge-red'}">$${formatNumber(p.portfolio.totalPnL)} (${p.portfolio.totalPnLPercent >= 0 ? '+' : ''}${p.portfolio.totalPnLPercent}%)</span></div>` : ''}
  ${p.keyEvents.length > 0 ? `<div style="margin-top:8px"><strong style="font-size:13px;color:${COLORS.navy}">Key Events This Week</strong>
    ${p.keyEvents.map(e => `<div style="font-size:12px;padding:2px 0;color:${COLORS.textMuted}">${e.date}: ${escapeHtml(e.title)}</div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderAIInsightsSection(ai: AIInsightsSection): string {
  return `<div class="section">
  <div class="section-header"><span class="section-num">7</span><h2>AI Insights &amp; Recommendations</h2></div>
  ${ai.churnEngine.length > 0 ? `<div style="margin-bottom:12px">
    <strong style="font-size:13px;color:${COLORS.navy}">Churn Risk Clients</strong>
    ${ai.churnEngine.map(c => `<div style="font-size:13px;padding:4px 0">
      <span class="kpi-badge badge-red">${c.score}% risk</span> <strong>${escapeHtml(c.clientName)}</strong> - ${escapeHtml(c.suggestedAction)}
    </div>`).join('')}
  </div>` : '<div class="empty-state">No churn alerts today</div>'}
  ${ai.revenueAnomaly ? `<div style="font-size:13px;padding:8px;background:#FFEBEE;border-radius:6px;margin:8px 0">
    &#9888; <strong>Revenue Anomaly:</strong> ${escapeHtml(ai.revenueAnomaly.message)}
  </div>` : ''}
  ${ai.scheduleOptimizer.utilizationRate > 0 ? `<div style="font-size:13px;margin-top:8px">
    Schedule utilization: <strong>${ai.scheduleOptimizer.utilizationRate}%</strong>
    ${ai.scheduleOptimizer.suggestions.map(s => `<div style="font-size:12px;color:${COLORS.textMuted};padding:2px 0">&bull; ${escapeHtml(s)}</div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderActionItemsSection(items: ActionItemsSection): string {
  const allItems = [
    ...items.critical.map(i => ({ ...i, priority: 'critical' })),
    ...items.important.map(i => ({ ...i, priority: 'important' })),
    ...items.opportunistic.map(i => ({ ...i, priority: 'opportunistic' })),
  ];

  if (allItems.length === 0) {
    return `<div class="section">
  <div class="section-header"><span class="section-num">8</span><h2>Today's Action Items</h2></div>
  <div class="empty-state">No action items generated. All systems nominal.</div>
</div>`;
  }

  return `<div class="section">
  <div class="section-header"><span class="section-num">8</span><h2>Today's Action Items</h2></div>
  ${items.critical.length > 0 ? `<div style="margin-bottom:12px;font-size:12px;color:${COLORS.red};font-weight:600;text-transform:uppercase">Critical (Must Do Today)</div>` : ''}
  ${items.critical.map(i => renderActionItem(i, 'critical')).join('')}
  ${items.important.length > 0 ? `<div style="margin:12px 0 8px;font-size:12px;color:${COLORS.yellow};font-weight:600;text-transform:uppercase">Important (Should Do Today)</div>` : ''}
  ${items.important.map(i => renderActionItem(i, 'important')).join('')}
  ${items.opportunistic.length > 0 ? `<div style="margin:12px 0 8px;font-size:12px;color:${COLORS.green};font-weight:600;text-transform:uppercase">Opportunistic (If Time Allows)</div>` : ''}
  ${items.opportunistic.map(i => renderActionItem(i, 'opportunistic')).join('')}
</div>`;
}

function renderActionItem(item: MegaActionItem, priority: string): string {
  return `<div class="action-item priority-${priority}">
  <div class="action-check"></div>
  <div class="action-text">
    <div class="action-category">${escapeHtml(item.category)} &bull; ${escapeHtml(item.source)}</div>
    <div class="action-desc">${escapeHtml(item.action)}</div>
    <div class="action-reason">${escapeHtml(item.reason)}</div>
  </div>
</div>`;
}

function renderFooter(generatedAt: string): string {
  return `<div class="footer">
  <div>
    <a href="https://www.ranibeautyclinic.com/dashboard">Dashboard</a>
    <a href="https://www.ranibeautyclinic.com/dashboard/clients">Clients</a>
    <a href="https://www.ranibeautyclinic.com/dashboard/meta-ads">Ads</a>
    <a href="https://www.ranibeautyclinic.com/dashboard/pnl">P&amp;L</a>
    <a href="https://www.ranibeautyclinic.com/dashboard/schedule-optimizer">Schedule</a>
  </div>
  <div class="copyright">
    Generated at ${new Date(generatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST<br>
    Rani Intelligence Briefing &bull; Powered by RaniOS
  </div>
</div>`;
}

// ── Plain Text Rendering ──────────────────────────────────────

/**
 * Render a plain text version of the briefing
 */
export function renderMegaBriefingText(data: MegaBriefingData): string {
  const lines: string[] = [];
  const sep = '═'.repeat(60);
  const subsep = '─'.repeat(40);

  lines.push(sep);
  lines.push(`RANI INTELLIGENCE BRIEFING`);
  lines.push(`${data.dayOfWeek} | ${formatDate(data.date)}`);
  lines.push(sep);

  lines.push('');
  lines.push('EXECUTIVE SUMMARY');
  lines.push(subsep);
  lines.push(`Revenue: ${data.executiveSummary.revenueStatus}`);
  lines.push(`Opportunity: ${data.executiveSummary.biggestOpportunity}`);
  lines.push(`Risk: ${data.executiveSummary.biggestRisk}`);

  lines.push('');
  lines.push('1. FINANCIAL SNAPSHOT');
  lines.push(subsep);
  lines.push(`Yesterday: $${formatNumber(data.financial.yesterdayRevenue)} (${data.financial.yesterdayVsAvg >= 0 ? '+' : ''}${data.financial.yesterdayVsAvg}% vs avg)`);
  lines.push(`MTD: $${formatNumber(data.financial.mtdRevenue)} / $${formatNumber(data.financial.monthlyTarget)} (${data.financial.pacingPercent}%)`);
  lines.push(`Status: ${data.financial.pacingStatus.toUpperCase()}`);

  lines.push('');
  lines.push('2. OPERATIONS');
  lines.push(subsep);
  lines.push(`Appointments: ${data.operations.todayAppointments} | Consults: ${data.operations.todayConsults} | Gaps: ${data.operations.todayGaps}`);
  lines.push(`Alerts: ${data.operations.activeAlerts.critical} critical, ${data.operations.activeAlerts.warning} warning`);

  lines.push('');
  lines.push('3. MARKETING');
  lines.push(subsep);
  if (data.marketing.metaAds) {
    lines.push(`Meta: $${formatNumber(data.marketing.metaAds.spend)} spend, ${data.marketing.metaAds.roas}x ROAS`);
  }
  if (data.marketing.googleAds) {
    lines.push(`Google: $${formatNumber(data.marketing.googleAds.spend)} spend, $${formatNumber(data.marketing.googleAds.cpa)} CPA`);
  }

  lines.push('');
  lines.push('8. ACTION ITEMS');
  lines.push(subsep);
  for (const item of data.actionItems.critical) {
    lines.push(`[CRITICAL] ${item.action}`);
  }
  for (const item of data.actionItems.important) {
    lines.push(`[IMPORTANT] ${item.action}`);
  }
  for (const item of data.actionItems.opportunistic) {
    lines.push(`[OPTIONAL] ${item.action}`);
  }

  lines.push('');
  lines.push(sep);
  lines.push(`Generated: ${data.generatedAt}`);

  return lines.join('\n');
}

// ── Rendered Briefing Output ──────────────────────────────────

export interface MegaRenderedBriefing {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  data: MegaBriefingData;
  generatedAt: string;
}

/**
 * Generate and render the complete mega briefing
 */
export async function generateAndRenderMegaBriefing(inputs: Parameters<typeof assembleMegaBriefing>[0]): Promise<MegaRenderedBriefing> {
  const data = await assembleMegaBriefing(inputs);
  const html = renderMegaBriefingHTML(data);
  const text = renderMegaBriefingText(data);

  const formattedDate = formatDate(data.date);
  const pacingEmoji = data.financial.pacingStatus === 'ahead' ? '+++' :
    data.financial.pacingStatus === 'on_track' ? '++' :
    data.financial.pacingStatus === 'behind' ? '+' : '!!!';

  return {
    subject: `[${pacingEmoji}] Rani Intelligence Briefing - ${formattedDate}`,
    preheader: data.executiveSummary.revenueStatus.substring(0, 100),
    html,
    text,
    data,
    generatedAt: data.generatedAt,
  };
}

// ── Utility ───────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
