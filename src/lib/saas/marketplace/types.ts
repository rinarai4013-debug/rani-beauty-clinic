// =============================================================================
// RaniOS Marketplace Types
// =============================================================================

export type IntegrationCategory =
  | 'crm'
  | 'payments'
  | 'communications'
  | 'ehr'
  | 'scheduling'
  | 'accounting'
  | 'marketing'
  | 'ai'
  | 'reviews'
  | 'analytics';

export type IntegrationPricing = 'free' | 'paid' | 'premium';

export type SetupComplexity = 'simple' | 'moderate' | 'advanced';

export type ConnectionMethod = 'oauth2' | 'api_key' | 'webhook' | 'manual';

export type IntegrationStatus =
  | 'available'
  | 'connecting'
  | 'connected'
  | 'configured'
  | 'active'
  | 'paused'
  | 'error'
  | 'disconnected';

export type SyncMode = 'full' | 'incremental' | 'realtime';

export type WebhookEventType =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.completed'
  | 'client.created'
  | 'client.updated'
  | 'payment.completed'
  | 'payment.refunded'
  | 'invoice.created'
  | 'invoice.paid'
  | 'review.received'
  | 'lead.created'
  | 'message.sent'
  | 'message.received'
  | 'inventory.low'
  | 'membership.created'
  | 'membership.cancelled'
  | 'custom';

export interface IntegrationDefinition {
  id: string;
  name: string;
  slug: string;
  category: IntegrationCategory;
  description: string;
  longDescription: string;
  icon: string;
  pricing: IntegrationPricing;
  monthlyPrice: number | null;
  setupComplexity: SetupComplexity;
  connectionMethod: ConnectionMethod;
  documentationUrl: string;
  requiredScopes: string[];
  webhookEvents: WebhookEventType[];
  features: string[];
  tier: 'starter' | 'pro' | 'enterprise';
  isPopular: boolean;
  isFeatured: boolean;
  isNew: boolean;
  version: string;
  author: string;
  supportUrl: string;
  privacyUrl: string;
}

export interface IntegrationInstance {
  id: string;
  tenantId: string;
  integrationId: string;
  status: IntegrationStatus;
  connectionMethod: ConnectionMethod;
  credentials: EncryptedCredentials;
  config: IntegrationConfig;
  webhookUrl: string | null;
  webhookSecret: string | null;
  syncMode: SyncMode;
  lastSyncAt: string | null;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  errorMessage: string | null;
  usageMetrics: IntegrationUsageMetrics;
  healthScore: number;
  installedAt: string;
  updatedAt: string;
}

export interface EncryptedCredentials {
  accessToken: string | null;
  refreshToken: string | null;
  apiKey: string | null;
  clientId: string | null;
  clientSecret: string | null;
  additionalFields: Record<string, string>;
  expiresAt: string | null;
}

export interface IntegrationConfig {
  syncInterval: number;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  fieldMappings: FieldMapping[];
  filters: DataFilter[];
  transforms: DataTransform[];
  notifications: NotificationConfig;
  retryPolicy: RetryPolicy;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform: string | null;
  required: boolean;
}

export interface DataFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string | number | string[];
}

export interface DataTransform {
  type: 'map' | 'format' | 'calculate' | 'lookup' | 'default';
  sourceField: string;
  targetField: string;
  config: Record<string, unknown>;
}

export interface NotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  onWarning: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface IntegrationUsageMetrics {
  apiCallsToday: number;
  apiCallsThisMonth: number;
  dataRecordsSynced: number;
  lastApiCallAt: string | null;
  avgResponseTimeMs: number;
  errorRate: number;
  quotaUsed: number;
  quotaLimit: number;
}

export interface IntegrationHealthReport {
  integrationId: string;
  tenantId: string;
  score: number;
  status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheckItem[];
  recommendations: string[];
  lastCheckedAt: string;
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  detail: string | null;
}

export interface MarketplaceSearchParams {
  query: string;
  category: IntegrationCategory | null;
  pricing: IntegrationPricing | null;
  tier: 'starter' | 'pro' | 'enterprise' | null;
  sortBy: 'name' | 'popularity' | 'newest' | 'price';
  page: number;
  pageSize: number;
}

export interface MarketplaceSearchResult {
  integrations: IntegrationDefinition[];
  total: number;
  page: number;
  pageSize: number;
  categories: { category: IntegrationCategory; count: number }[];
}

// Connector types

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  state: string;
  codeVerifier?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface OAuth2TokenResponse {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface ApiKeyConfig {
  headerName: string;
  prefix: string;
  apiKey: string;
}

export interface WebhookRegistration {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface ConnectorRateLimit {
  maxRequests: number;
  windowMs: number;
  currentCount: number;
  resetAt: string;
}

export interface SyncResult {
  mode: SyncMode;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: SyncError[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface SyncError {
  recordId: string;
  field: string | null;
  message: string;
  code: string;
}
