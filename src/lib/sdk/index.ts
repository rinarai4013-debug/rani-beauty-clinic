/**
 * RaniOS TypeScript SDK
 *
 * Programmatic access to the RaniOS medspa operations platform.
 *
 * @example
 * ```ts
 * import { RaniOSClient } from '@/lib/sdk';
 *
 * const ranios = new RaniOSClient({
 *   apiKey: 'rani_live_abc123...',
 *   tenantId: 'my-clinic',
 * });
 *
 * // Revenue KPIs
 * const { data: kpis } = await ranios.revenue.getKPIs();
 *
 * // At-risk clients
 * const { data: atRisk } = await ranios.clients.getAtRisk();
 *
 * // AI chat
 * const { data: chat } = await ranios.ai.chat({ message: 'Hello!' });
 * ```
 *
 * @packageDocumentation
 */

// ─── Client ─────────────────────────────────────────────────────────────────

export { RaniOSClient } from './client';
export type {
  RaniOSClientConfig,
  SDKRequestOptions,
  SDKResponse,
  SDKPaginatedResponse,
  SDKListParams,
} from './client';

// ─── Errors ─────────────────────────────────────────────────────────────────

export {
  RaniOSError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  FeatureNotAvailableError,
} from './client';
export type { SDKErrorCode } from './client';

// ─── Auth ───────────────────────────────────────────────────────────────────

export {
  generateAPIKey,
  hashAPIKey,
  validateAPIKey,
  hasScope,
  hasAllScopes,
  hasAnyScope,
  parseKeyEnvironment,
  isValidKeyFormat,
  redactKey,
  SCOPE_PRESETS,
  ALL_SCOPES,
  READ_ONLY_SCOPES,
  SCOPE_DESCRIPTIONS,
} from './auth';
export type {
  APIKeyEnvironment,
  APIKeyScope,
  APIKeyRecord,
  CreateAPIKeyParams,
  CreateAPIKeyResult,
  ValidateKeyResult,
} from './auth';

// ─── Resources ──────────────────────────────────────────────────────────────

export { ClientsResource } from './resources/clients';
export type {
  Client,
  ClientDetail,
  ChurnRisk,
  TreatmentRecommendation,
  AtRiskClient,
  ClientsListParams,
} from './resources/clients';

export { AppointmentsResource } from './resources/appointments';
export type {
  Appointment,
  NoShowRisk,
  AppointmentsListParams,
  UpcomingOptions,
} from './resources/appointments';

export { RevenueResource } from './resources/revenue';
export type {
  RevenueKPIs,
  RevenueTrend,
  RevenueTrendsResponse,
  RevenueAnomaly,
  RevenueAnomaliesResponse,
  RevenueKPIOptions,
  RevenueTrendOptions,
} from './resources/revenue';

export { ScheduleResource } from './resources/schedule';
export type {
  ScheduleEntry,
  DailySchedule,
  ScheduleGap,
  ScheduleConflict,
  ProviderBalance,
  RevenueOpportunity,
  ScheduleOptimization,
} from './resources/schedule';

export { InventoryResource } from './resources/inventory';
export type {
  InventoryAlert,
  WasteAnalysis,
  InventoryIntelligence,
} from './resources/inventory';

export { LoyaltyResource } from './resources/loyalty';
export type {
  LoyaltyMember,
  PointsTransaction,
  LoyaltyReward,
  AwardPointsParams,
  RedeemRewardParams,
  RedeemRewardResult,
} from './resources/loyalty';

export { ReferralsResource } from './resources/referrals';
export type {
  ReferralCode,
  ReferralConversion,
  ReferralStats,
  GenerateReferralParams,
} from './resources/referrals';

export { AIResource } from './resources/ai';
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  TreatmentPlan,
  RecommendRequest,
  RecommendResponse,
  IntakeAnalysis,
  IntakeRequest,
} from './resources/ai';

export { TemplatesResource } from './resources/templates';
export type {
  TemplateStep,
  PostTreatmentTemplate,
  PostTreatmentRequest,
  ReactivationTemplate,
  ReactivationRequest,
  PreConsultTemplate,
  PreConsultRequest,
} from './resources/templates';
