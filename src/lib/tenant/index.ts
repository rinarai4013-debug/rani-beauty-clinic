/**
 * RaniOS Multi-Tenant System - Public API
 *
 * Re-exports all tenant modules for clean imports:
 *   import { useTenant, getTenantDatabase, TIER_PRICING } from '@/lib/tenant';
 */

// Config: types, constants, feature flags, tier definitions
export {
  type TenantConfig,
  type TenantBranding,
  type FeatureFlags,
  type SubscriptionConfig,
  type SubscriptionTier,
  type TenantAirtableConfig,
  type TenantIntegrations,
  type TenantUsage,
  type UsageLimits,
  TIER_PRICING,
  TIER_FEATURES,
  TIER_USAGE_LIMITS,
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_CONFIG,
  isValidSlug,
  isFeatureEnabled,
  getTierForFeature,
  canUpgrade,
} from './config';

// Resolver: tenant resolution from subdomain, domain, session
export {
  resolveTenant,
  resolveFromSubdomain,
  resolveFromCustomDomain,
  resolveFromSession,
  resolveById,
  extractSubdomain,
  isCustomDomain,
  getTenantStore,
  setTenantStore,
  invalidateTenantCache,
  clearTenantCache,
  type TenantStore,
  type ResolveContext,
  InMemoryTenantStore,
  AirtableTenantStore,
} from './resolver';

// Context: React provider, hooks, feature gating components
export {
  TenantProvider,
  useTenant,
  useFeatureGate,
  FeatureGate,
  UpgradePrompt,
  getTenantFromHeaders,
  getTenantConfigFromHeaders,
  parseTenantHeader,
} from './context';

// Database: tenant-scoped Airtable client
export {
  createTenantDatabase,
  getTenantDatabase,
  evictTenantDatabase,
  assertTenantMatch,
  testTenantConnection,
  clearTenantDatabaseCache,
  invalidateTenantTableCache,
  TenantIsolationError,
  type TenantDatabaseClient,
  type TenantTables,
} from './database';

// Billing: Stripe subscription management
export {
  createCustomer,
  getCustomer,
  createSubscription,
  getSubscription,
  changeTier,
  cancelSubscription,
  resumeSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
  checkFeatureAccess,
  trackUsage,
  getUsage,
  getBillingSummary,
} from './billing';

// Onboarding: tenant setup wizard
export {
  ONBOARDING_STEPS,
  createNewTenant,
  getOnboardingProgress,
  initOnboarding,
  updateOnboardingStep,
  resetOnboarding,
  processBusinessInfo,
  processAirtableConnection,
  processBranding,
  processServicesImport,
  processTeamSetup,
  processSubscription,
  processGoLive,
  getTierComparison,
  SERVICE_CATEGORIES,
  SERVICE_TEMPLATES,
  type OnboardingProgress,
  type OnboardingStepName,
  type BusinessInfoData,
  type AirtableConnectionData,
  type BrandingData,
  type ServiceData,
  type ServicesImportData,
  type TeamMemberData,
  type TeamSetupData,
  type SubscriptionSelectionData,
} from './onboarding';
