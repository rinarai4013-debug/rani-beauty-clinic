/**
 * Rani Beauty Clinic - CEO Briefing System
 *
 * Automated daily, weekly, monthly, and mega CEO briefing emails.
 * All generators export a single async function that returns a RenderedBriefing.
 */

// ── Core Briefing Generators ──────────────────────────────────
export { generateDailyBriefing, gatherDailyData, generateActionItems, renderDailyHtml } from './daily-ceo-email';
export { generateWeeklyBriefing, gatherWeeklyData, renderWeeklyHtml } from './weekly-ceo-email';
export { generateMonthlyBriefing, gatherMonthlyData, renderMonthlyHtml } from './monthly-ceo-email';

// ── Mega Intelligence Briefing ────────────────────────────────
export {
  assembleMegaBriefing,
  generateAndRenderMegaBriefing,
  renderMegaBriefingHTML,
  renderMegaBriefingText,
  buildFinancialSection,
  buildOperationsSection,
  buildMarketingSection,
  buildCompetitiveSection,
  buildIndustryNewsSection,
  buildPolymarketSection,
  buildAIInsightsSection,
  buildActionItems,
  buildExecutiveSummary,
} from './mega-briefing';

// ── Intelligence Modules ──────────────────────────────────────
export {
  generateMarketIntelligence,
  fetchIndustryNews,
  detectTreatmentTrends,
  calculateMarketPosition,
  generateMarketInsights,
  calculateRelevanceScore,
  parseRSSFeed,
  INDUSTRY_RSS_FEEDS,
  LOCAL_COMPETITORS,
  NATIONAL_CHAINS,
  TRACKED_TREATMENTS,
  TRACKED_MANUFACTURERS,
} from './market-intelligence';

export {
  generateAdsIntelligence,
  fetchMetaAdsPerformance,
  fetchGoogleAdsPerformance,
  calculateMetaSummary,
  calculateGoogleSummary,
  calculateBudgetPacing,
  detectMetaFatigue,
  compareChannels,
  generateAdsAlerts,
  generateAdsActionItems,
} from './ads-intelligence';

export {
  generatePolymarketDigest,
  fetchPolymarketMarkets,
  identifyTopMovers,
  findResolvingMarkets,
  findNewHighVolumeMarkets,
  calculateCategoryMomentum,
  calculatePortfolio,
  detectSignals,
  detectCorrelations,
  buildEventCalendar,
  calculateMarketSummary,
} from './polymarket-digest';

export {
  generateCompetitorIntelligence,
  calculateThreatScore,
  calculateServiceOverlap,
  calculateDistance,
  generateSWOT,
  estimateMarketShare,
  analyzeReviewSentiment,
  generateCompetitorActionItems,
  TRACKED_KEYWORDS,
} from './competitor-tracker';

// ── Types ─────────────────────────────────────────────────────
export type {
  DailyBriefingData,
  WeeklyBriefingData,
  MonthlyBriefingData,
  RenderedBriefing,
  BriefingLogEntry,
  BriefingSettings,
  ActionItem,
  RevenueSnapshot,
  ScheduleSnapshot,
  AlertSnapshot,
  LoyaltySnapshot,
  ReferralSnapshot,
  MarketingSnapshot,
  CashFlowSnapshot,
  ContentCalendarSnapshot,
  AIHighlights,
} from './types';

export type {
  MegaBriefingData,
  MegaRenderedBriefing,
  FinancialSection,
  OperationsSection,
  MarketingSection,
  CompetitiveSection,
  IndustryNewsSection,
  PolymarketSection,
  AIInsightsSection,
  ActionItemsSection,
  ExecutiveSummary,
} from './mega-briefing';

export type {
  MarketIntelligence,
  RSSFeedItem,
  LocalCompetitor,
  NationalChain,
  TreatmentTrend,
  FDAApproval,
  ManufacturerNews,
  RegulationChange,
} from './market-intelligence';

export type {
  AdsIntelligence,
  AdsIntelligenceConfig,
  MetaAdsPerformance,
  GoogleAdsPerformance,
  CrossChannelComparison,
  MetaAdsCampaignMetrics,
  GoogleAdsCampaignMetrics,
} from './ads-intelligence';

export type {
  PolymarketDigest,
  PolymarketMarket,
  TopMover,
  PortfolioSummary,
  SignalAlert,
  CategoryMomentum,
} from './polymarket-digest';

export type {
  CompetitorIntelligence,
  CompetitorThreatScore,
  CompetitorSWOT,
  CompetitorReviewSnapshot,
  MarketShareEstimate,
} from './competitor-tracker';
