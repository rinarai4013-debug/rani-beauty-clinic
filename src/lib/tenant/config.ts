/**
 * RaniOS Multi-Tenant Configuration System
 *
 * Defines the complete tenant configuration schema including branding,
 * features, subscription tiers, and module access controls.
 */

// ─── Subscription Tiers ─────────────────────────────────────────────────────

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  stripePriceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  currentPeriodEnd: string; // ISO date
  trialEnd?: string; // ISO date
  cancelAtPeriodEnd: boolean;
}

export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; name: string; description: string }> = {
  starter: {
    monthly: 199,
    name: 'Starter',
    description: 'Basic dashboard with KPIs, scheduling, and client management',
  },
  professional: {
    monthly: 499,
    name: 'Professional',
    description: 'AI-powered engines: churn prediction, pricing intelligence, consult co-pilot',
  },
  enterprise: {
    monthly: 999,
    name: 'Enterprise',
    description: 'Full suite with white-label, RAG knowledge base, phone agent, and priority support',
  },
};

// ─── Feature Flags ──────────────────────────────────────────────────────────

export interface FeatureFlags {
  churn: boolean;          // Churn prediction engine
  noShow: boolean;         // No-show risk scoring
  pricing: boolean;        // Dynamic pricing intelligence
  pnl: boolean;            // P&L intelligence + financial health
  schedule: boolean;       // Schedule optimizer
  inventory: boolean;      // Inventory auto-manager
  social: boolean;         // Social media AI content engine
  ads: boolean;            // Meta Ads AI manager
  consult: boolean;        // AI consult co-pilot
  rag: boolean;            // RAG knowledge base
  phone: boolean;          // Vapi AI phone agent
  gamification: boolean;   // Gamification engine + leaderboard
  templates: boolean;      // Communication templates (post-treatment, reactivation, pre-consult)
  plaid: boolean;          // Bank connection via Plaid
  whiteLabel: boolean;     // White-label (remove RaniOS branding)
}

export const TIER_FEATURES: Record<SubscriptionTier, FeatureFlags> = {
  starter: {
    churn: false,
    noShow: false,
    pricing: false,
    pnl: false,
    schedule: true,
    inventory: false,
    social: false,
    ads: false,
    consult: false,
    rag: false,
    phone: false,
    gamification: true,
    templates: false,
    plaid: false,
    whiteLabel: false,
  },
  professional: {
    churn: true,
    noShow: true,
    pricing: true,
    pnl: true,
    schedule: true,
    inventory: true,
    social: true,
    ads: true,
    consult: true,
    rag: false,
    phone: false,
    gamification: true,
    templates: true,
    plaid: true,
    whiteLabel: false,
  },
  enterprise: {
    churn: true,
    noShow: true,
    pricing: true,
    pnl: true,
    schedule: true,
    inventory: true,
    social: true,
    ads: true,
    consult: true,
    rag: true,
    phone: true,
    gamification: true,
    templates: true,
    plaid: true,
    whiteLabel: true,
  },
};

// ─── Branding ───────────────────────────────────────────────────────────────

export interface TenantBranding {
  clinicName: string;
  logoUrl: string;
  faviconUrl?: string;
  colors: {
    primary: string;     // Main brand color (e.g., '#0F1D2C' navy for Rani)
    secondary: string;   // Secondary color (e.g., '#C9A96E' gold for Rani)
    accent: string;      // Accent highlights
    background: string;  // Page background (e.g., '#F8F6F1' cream for Rani)
    text: string;        // Primary text color
    muted: string;       // Muted/secondary text
  };
  fonts: {
    heading: string;     // Display/heading font (e.g., 'Playfair Display')
    body: string;        // Body text font (e.g., 'Montserrat')
  };
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  address?: string;
}

// ─── Airtable Connection ────────────────────────────────────────────────────

export interface TenantAirtableConfig {
  baseId: string;
  pat: string; // Personal Access Token - encrypted at rest
  /** Optional: override default table names if tenant uses different names */
  tableOverrides?: Partial<Record<string, string>>;
}

// ─── Integration Config ─────────────────────────────────────────────────────

export interface TenantIntegrations {
  mangomint?: { apiKey: string; companyId: string };
  square?: { accessToken: string; locationId: string };
  stripe?: { secretKey: string; webhookSecret: string };
  twilio?: { accountSid: string; authToken: string; fromNumber: string };
  resend?: { apiKey: string; fromEmail: string };
  meta?: { accessToken: string; adAccountId: string };
  vapi?: { apiKey: string; assistantId: string };
  pinecone?: { apiKey: string; indexName: string };
  n8n?: { webhookUrl: string; apiKey: string };
}

// ─── Usage Metering ─────────────────────────────────────────────────────────

export interface TenantUsage {
  apiCalls: number;
  aiTokens: number;
  smsSent: number;
  emailsSent: number;
  storageBytes: number;
  period: string; // e.g., '2026-03'
}

export interface UsageLimits {
  maxApiCalls: number;
  maxAiTokens: number;
  maxSmsSent: number;
  maxEmailsSent: number;
  maxStorageBytes: number;
}

export const TIER_USAGE_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  starter: {
    maxApiCalls: 10_000,
    maxAiTokens: 500_000,
    maxSmsSent: 500,
    maxEmailsSent: 2_000,
    maxStorageBytes: 1_073_741_824, // 1 GB
  },
  professional: {
    maxApiCalls: 100_000,
    maxAiTokens: 5_000_000,
    maxSmsSent: 5_000,
    maxEmailsSent: 20_000,
    maxStorageBytes: 10_737_418_240, // 10 GB
  },
  enterprise: {
    maxApiCalls: 1_000_000,
    maxAiTokens: 50_000_000,
    maxSmsSent: 50_000,
    maxEmailsSent: 200_000,
    maxStorageBytes: 107_374_182_400, // 100 GB
  },
};

// ─── Tenant Config (Root) ───────────────────────────────────────────────────

export interface TenantConfig {
  id: string;                         // Unique tenant ID (UUID)
  name: string;                       // Business name
  slug: string;                       // URL slug (subdomain-safe: lowercase, alphanumeric + hyphens)
  customDomain?: string;              // Optional CNAME (e.g., 'dashboard.luxmedspa.com')
  ownerId: string;                    // Owner user ID
  airtable: TenantAirtableConfig;
  branding: TenantBranding;
  features: FeatureFlags;
  subscription: SubscriptionConfig;
  integrations: TenantIntegrations;
  usage: TenantUsage;
  onboardingStep: number;             // 0 = not started, 7 = complete
  onboardingComplete: boolean;
  timezone: string;                   // IANA timezone (e.g., 'America/Los_Angeles')
  createdAt: string;                  // ISO date
  updatedAt: string;                  // ISO date
  active: boolean;                    // Soft delete / deactivation flag
}

// ─── Default Tenant (Rani Beauty Clinic) ────────────────────────────────────

export const DEFAULT_TENANT_ID = 'rani-beauty-clinic';

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  id: DEFAULT_TENANT_ID,
  name: 'Rani Beauty Clinic',
  slug: 'rani',
  ownerId: 'rina',
  airtable: {
    baseId: process.env.AIRTABLE_BASE_ID || 'app1SwhSfwe8GKUg4',
    pat: process.env.AIRTABLE_PAT || '',
  },
  branding: {
    clinicName: 'Rani Beauty Clinic',
    logoUrl: '/images/logo.png',
    colors: {
      primary: '#0F1D2C',
      secondary: '#C9A96E',
      accent: '#D4AF37',
      background: '#F8F6F1',
      text: '#1A1A1A',
      muted: '#6B7280',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Montserrat',
    },
    tagline: 'Premier Medspa & Wellness',
    supportEmail: 'info@ranibeautyclinic.com',
    supportPhone: '(425) 555-0100',
    website: 'https://www.ranibeautyclinic.com',
    address: '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
  },
  features: TIER_FEATURES.enterprise, // Rani gets all features
  subscription: {
    tier: 'enterprise',
    stripePriceId: '',
    stripeCustomerId: '',
    stripeSubscriptionId: '',
    status: 'active',
    currentPeriodEnd: '2099-12-31T23:59:59Z',
    cancelAtPeriodEnd: false,
  },
  integrations: {},
  usage: {
    apiCalls: 0,
    aiTokens: 0,
    smsSent: 0,
    emailsSent: 0,
    storageBytes: 0,
    period: new Date().toISOString().slice(0, 7),
  },
  onboardingStep: 7,
  onboardingComplete: true,
  timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  active: true,
};

// ─── Validation Helpers ─────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'auth', 'login',
  'signup', 'register', 'billing', 'support', 'help', 'docs',
  'status', 'mail', 'blog', 'static', 'assets', 'cdn',
  'onboarding', 'settings', 'account', 'tenant', 'ranios',
]);

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function isFeatureEnabled(config: TenantConfig, feature: keyof FeatureFlags): boolean {
  if (!config.active) return false;
  if (config.subscription.status !== 'active' && config.subscription.status !== 'trialing') return false;
  return config.features[feature] === true;
}

export function getTierForFeature(feature: keyof FeatureFlags): SubscriptionTier {
  if (TIER_FEATURES.starter[feature]) return 'starter';
  if (TIER_FEATURES.professional[feature]) return 'professional';
  return 'enterprise';
}

export function canUpgrade(currentTier: SubscriptionTier): SubscriptionTier | null {
  if (currentTier === 'starter') return 'professional';
  if (currentTier === 'professional') return 'enterprise';
  return null;
}
