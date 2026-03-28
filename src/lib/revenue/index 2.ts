/**
 * Revenue Maximizer — Unified Module Index
 *
 * Six engines working together to find and capture every dollar
 * of revenue for the clinic.
 */

export { analyzeRevenueGaps, REBOOK_INTERVALS, DAY_NAMES } from './gap-finder';
export type {
  GapFinderInput, GapFinderResult, GapSummary,
  EmptySlotGap, DayPerformanceGap, ServiceDeclineGap,
  OverdueClientGap, MembershipUnderutilizationGap,
  DormantHighValueGap, RevenueActionItem,
} from './gap-finder';

export { generateUpsellRecommendations, analyzeBatchUpsells, COMPATIBILITY_MATRIX } from './upsell-engine';
export type {
  UpsellInput, UpsellResult, UpsellRecommendation,
  MembershipConversionOpp, PackageUpgradeOpp,
  RetailSuggestion, TicketImpact, UpsellScript,
  BatchUpsellResult,
} from './upsell-engine';

export { optimizePricing } from './pricing-optimizer';
export type {
  PricingOptimizerInput, PricingOptimizerResult,
  TimePricingTier, DayPricingAnalysis, LastMinuteStrategy,
  CompetitivePosition, PriceSensitivityResult,
  BundleOptimization, MarginAnalysis, PricingSummary,
} from './pricing-optimizer';

export { analyzeRetention, SERVICE_REBOOK_DAYS } from './retention-machine';
export type {
  RetentionInput, RetentionResult, RetentionSummary,
  RebookingTrigger, RebookReminder, WinBackCampaign,
  VipRetentionAction, MembershipRenewalAction,
  PackageCompletionAction, FeedbackRecoveryAction,
  RetentionMetrics,
} from './retention-machine';

export { generateForecast } from './forecasting-v2';
export type {
  ForecastInput, ForecastResult, MonthlyForecast,
  WeeklyTarget, DailyTarget, ScenarioModel,
  GoalDecomposition, LeadingIndicator,
  ConfidenceInterval, CashFlowProjection,
  ForecastSummary,
} from './forecasting-v2';

export { scoreOpportunities } from './opportunity-scorer';
export type {
  OpportunityScorerInput, OpportunityScorerResult,
  ScoredOpportunity, OpportunityCategory,
  WeeklyOpportunityReport, CategoryBreakdown,
  ROITracking, ActionLearning,
} from './opportunity-scorer';
