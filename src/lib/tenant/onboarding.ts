/**
 * RaniOS Tenant Onboarding Wizard
 *
 * 7-step onboarding flow for new tenants:
 * 1. Business info (name, address, phone, email)
 * 2. Airtable connection (PAT, base ID, test connection)
 * 3. Branding (colors, logo upload, fonts)
 * 4. Services import (from Airtable or manual entry)
 * 5. Team setup (providers, roles, permissions)
 * 6. Subscription selection
 * 7. Go live
 */

import { z } from 'zod';
import Stripe from 'stripe';
import type {
  TenantConfig,
  TenantBranding,
  SubscriptionTier,
  FeatureFlags,
} from './config';
import {
  DEFAULT_TENANT_CONFIG,
  TIER_FEATURES,
  TIER_PRICING,
  isValidSlug,
} from './config';
import { getTenantStore } from './resolver';
import { testTenantConnection } from './database';
import { createCustomer, createSubscription } from './billing';

// ─── Onboarding Step Types ──────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  { step: 1, name: 'business-info', label: 'Business Info', description: 'Tell us about your clinic' },
  { step: 2, name: 'airtable', label: 'Database', description: 'Connect your Airtable base' },
  { step: 3, name: 'branding', label: 'Branding', description: 'Customize your look' },
  { step: 4, name: 'services', label: 'Services', description: 'Import your service menu' },
  { step: 5, name: 'team', label: 'Team', description: 'Add your providers and staff' },
  { step: 6, name: 'subscription', label: 'Plan', description: 'Choose your subscription' },
  { step: 7, name: 'go-live', label: 'Go Live', description: 'Launch your dashboard' },
] as const;

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number]['name'];

export interface OnboardingProgress {
  tenantId: string;
  currentStep: number;
  completedSteps: number[];
  stepData: Record<number, Record<string, unknown>>;
  startedAt: string;
  lastUpdatedAt: string;
}

// ─── Step 1: Business Info ──────────────────────────────────────────────────

export const businessInfoSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required'),
  website: z.string().url().optional().or(z.literal('')),
  timezone: z.string().default('America/Los_Angeles'),
});

export type BusinessInfoData = z.infer<typeof businessInfoSchema>;

export async function processBusinessInfo(
  data: BusinessInfoData
): Promise<{ valid: boolean; errors?: string[] }> {
  const errors: string[] = [];

  // Validate slug uniqueness
  if (!isValidSlug(data.slug)) {
    errors.push('This slug is reserved or invalid. Try a different one.');
  } else {
    const store = getTenantStore();
    const existing = await store.getBySlug(data.slug);
    if (existing) {
      errors.push('This slug is already taken. Try a different one.');
    }
  }

  // Validate email format
  const emailParsed = z.string().email().safeParse(data.email);
  if (!emailParsed.success) {
    errors.push('Invalid email address.');
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

// ─── Step 2: Airtable Connection ────────────────────────────────────────────

export const airtableConnectionSchema = z.object({
  pat: z.string().min(10, 'Personal Access Token is required'),
  baseId: z.string().regex(/^app[a-zA-Z0-9]+$/, 'Invalid Airtable Base ID format'),
});

export type AirtableConnectionData = z.infer<typeof airtableConnectionSchema>;

export async function processAirtableConnection(
  data: AirtableConnectionData
): Promise<{ valid: boolean; errors?: string[]; tableCount?: number }> {
  const result = await testTenantConnection(data.pat, data.baseId);

  if (!result.success) {
    return { valid: false, errors: [result.error || 'Connection failed'] };
  }

  return { valid: true, tableCount: result.tableCount };
}

// ─── Step 3: Branding ───────────────────────────────────────────────────────

export const brandingSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name required'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  headingFont: z.string().default('Playfair Display'),
  bodyFont: z.string().default('Inter'),
  tagline: z.string().optional(),
});

export type BrandingData = z.infer<typeof brandingSchema>;

export function processBranding(data: BrandingData): TenantBranding {
  return {
    clinicName: data.clinicName,
    logoUrl: data.logoUrl || '/images/default-logo.png',
    colors: {
      primary: data.primaryColor,
      secondary: data.secondaryColor,
      accent: data.accentColor,
      background: data.backgroundColor,
      text: '#1A1A1A',
      muted: '#6B7280',
    },
    fonts: {
      heading: data.headingFont,
      body: data.bodyFont,
    },
    tagline: data.tagline,
  };
}

// ─── Step 4: Services Import ────────────────────────────────────────────────

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name required'),
  category: z.string().min(1, 'Category required'),
  price: z.number().min(0, 'Price must be non-negative'),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  description: z.string().optional(),
});

export const servicesImportSchema = z.object({
  source: z.enum(['airtable', 'manual', 'template']),
  services: z.array(serviceSchema).optional(),
  templateId: z.string().optional(), // Pre-built service menu template
});

export type ServiceData = z.infer<typeof serviceSchema>;
export type ServicesImportData = z.infer<typeof servicesImportSchema>;

/** Default service categories for medspas */
export const SERVICE_CATEGORIES = [
  'Injectables',
  'Laser Treatments',
  'Facials & Peels',
  'Body Treatments',
  'Wellness & IV',
  'Skincare & Rx',
  'Consultations',
  'Packages',
] as const;

/** Pre-built template menus */
export const SERVICE_TEMPLATES: Record<string, ServiceData[]> = {
  'basic-medspa': [
    { name: 'Botox', category: 'Injectables', price: 12, duration: 30, description: 'Per unit pricing' },
    { name: 'Dermal Filler', category: 'Injectables', price: 650, duration: 45, description: 'Per syringe' },
    { name: 'HydraFacial', category: 'Facials & Peels', price: 250, duration: 60, description: 'Signature facial' },
    { name: 'Chemical Peel', category: 'Facials & Peels', price: 200, duration: 45, description: 'Light-medium peel' },
    { name: 'Laser Hair Removal', category: 'Laser Treatments', price: 150, duration: 30, description: 'Per area pricing' },
    { name: 'Microneedling', category: 'Facials & Peels', price: 350, duration: 60, description: 'With hyaluronic serum' },
    { name: 'B12 Injection', category: 'Wellness & IV', price: 35, duration: 15, description: 'Energy boost' },
    { name: 'Consultation', category: 'Consultations', price: 0, duration: 30, description: 'Complimentary' },
  ],
  'full-medspa': [
    { name: 'Botox', category: 'Injectables', price: 14, duration: 30 },
    { name: 'Dysport', category: 'Injectables', price: 5, duration: 30 },
    { name: 'Juvederm Voluma', category: 'Injectables', price: 800, duration: 45 },
    { name: 'Restylane', category: 'Injectables', price: 700, duration: 45 },
    { name: 'Sculptra', category: 'Injectables', price: 900, duration: 60 },
    { name: 'Kybella', category: 'Injectables', price: 600, duration: 45 },
    { name: 'HydraFacial Signature', category: 'Facials & Peels', price: 275, duration: 60 },
    { name: 'HydraFacial Deluxe', category: 'Facials & Peels', price: 375, duration: 75 },
    { name: 'VI Peel', category: 'Facials & Peels', price: 395, duration: 45 },
    { name: 'RF Microneedling', category: 'Facials & Peels', price: 500, duration: 60 },
    { name: 'Laser Hair Removal - Small', category: 'Laser Treatments', price: 100, duration: 20 },
    { name: 'Laser Hair Removal - Large', category: 'Laser Treatments', price: 350, duration: 45 },
    { name: 'IPL Photofacial', category: 'Laser Treatments', price: 400, duration: 45 },
    { name: 'Tattoo Removal', category: 'Laser Treatments', price: 300, duration: 30 },
    { name: 'CoolSculpting', category: 'Body Treatments', price: 750, duration: 60 },
    { name: 'IV Drip - Hydration', category: 'Wellness & IV', price: 175, duration: 45 },
    { name: 'IV Drip - NAD+', category: 'Wellness & IV', price: 400, duration: 90 },
    { name: 'GLP-1 Program', category: 'Wellness & IV', price: 499, duration: 30 },
    { name: 'Tretinoin Rx', category: 'Skincare & Rx', price: 99, duration: 15 },
    { name: 'Consultation', category: 'Consultations', price: 0, duration: 30 },
  ],
};

export async function processServicesImport(
  data: ServicesImportData,
  _airtableConfig?: { pat: string; baseId: string }
): Promise<{ valid: boolean; services: ServiceData[]; errors?: string[] }> {
  if (data.source === 'template' && data.templateId) {
    const template = SERVICE_TEMPLATES[data.templateId];
    if (!template) {
      return { valid: false, services: [], errors: ['Template not found'] };
    }
    return { valid: true, services: template };
  }

  if (data.source === 'manual' && data.services) {
    const validated: ServiceData[] = [];
    const errors: string[] = [];

    for (const svc of data.services) {
      const result = serviceSchema.safeParse(svc);
      if (result.success) {
        validated.push(result.data);
      } else {
        errors.push(`Service "${svc.name}": ${result.error.issues[0].message}`);
      }
    }

    return {
      valid: errors.length === 0,
      services: validated,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  if (data.source === 'airtable' && _airtableConfig) {
    // Import from tenant's Airtable Packages/Services table
    try {
      const Airtable = (await import('airtable')).default;
      const at = new Airtable({ apiKey: _airtableConfig.pat });
      const base = at.base(_airtableConfig.baseId);

      const records = await base('Packages')
        .select({ maxRecords: 100 })
        .firstPage();

      const services: ServiceData[] = records.map((r) => ({
        name: (r.fields['Name'] as string) || 'Unnamed',
        category: (r.fields['Category'] as string) || 'Uncategorized',
        price: Number(r.fields['Price'] || 0),
        duration: Number(r.fields['Duration'] || 30),
        description: (r.fields['Description'] as string) || '',
      }));

      return { valid: true, services };
    } catch (err) {
      return {
        valid: false,
        services: [],
        errors: [`Failed to import from Airtable: ${err instanceof Error ? err.message : 'Unknown error'}`],
      };
    }
  }

  return { valid: false, services: [], errors: ['No import source specified'] };
}

// ─── Step 5: Team Setup ─────────────────────────────────────────────────────

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['ceo', 'provider', 'frontdesk', 'marketing', 'operations']),
  title: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const teamSetupSchema = z.object({
  members: z.array(teamMemberSchema).min(1, 'At least one team member required'),
});

export type TeamMemberData = z.infer<typeof teamMemberSchema>;
export type TeamSetupData = z.infer<typeof teamSetupSchema>;

export function processTeamSetup(data: TeamSetupData): {
  valid: boolean;
  members: TeamMemberData[];
  errors?: string[];
} {
  const errors: string[] = [];

  // Ensure at least one CEO/owner
  const hasCeo = data.members.some((m) => m.role === 'ceo');
  if (!hasCeo) {
    errors.push('At least one team member must have the CEO/Owner role.');
  }

  // Check for duplicate emails
  const emails = data.members.map((m) => m.email.toLowerCase());
  const dupes = emails.filter((e, i) => emails.indexOf(e) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate email addresses: ${[...new Set(dupes)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    members: data.members,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ─── Step 6: Subscription Selection ─────────────────────────────────────────

export const subscriptionSchema = z.object({
  tier: z.enum(['starter', 'professional', 'enterprise']),
  paymentMethodId: z.string().optional(), // Stripe payment method ID
  couponCode: z.string().optional(),
});

export type SubscriptionSelectionData = z.infer<typeof subscriptionSchema>;

export async function processSubscription(
  tenantId: string,
  ownerEmail: string,
  clinicName: string,
  data: SubscriptionSelectionData
): Promise<{
  valid: boolean;
  customerId?: string;
  subscriptionId?: string;
  clientSecret?: string;
  errors?: string[];
}> {
  try {
    // Create Stripe customer
    const customer = await createCustomer({
      tenantId,
      email: ownerEmail,
      name: clinicName,
    });

    // Create subscription
    const subscription = await createSubscription({
      tenantId,
      customerId: customer.id,
      tier: data.tier,
      trialDays: 14, // 14-day free trial
      couponId: data.couponCode || undefined,
    });

    // Extract client secret for payment confirmation
    // Expanded via expand: ['latest_invoice.payment_intent'] in createSubscription
    const invoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;

    return {
      valid: true,
      customerId: customer.id,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || undefined,
    };
  } catch (err) {
    return {
      valid: false,
      errors: [`Subscription creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
    };
  }
}

// ─── Step 7: Go Live ────────────────────────────────────────────────────────

export interface GoLiveResult {
  success: boolean;
  tenantId: string;
  dashboardUrl: string;
  errors?: string[];
}

export async function processGoLive(
  tenantId: string,
  onboardingData: Record<number, Record<string, unknown>>
): Promise<GoLiveResult> {
  const store = getTenantStore();
  const errors: string[] = [];

  try {
    // Validate all steps were completed
    const requiredSteps = [1, 2, 3, 6]; // Steps 4, 5 optional
    for (const step of requiredSteps) {
      if (!onboardingData[step]) {
        errors.push(`Step ${step} (${ONBOARDING_STEPS[step - 1].label}) is incomplete.`);
      }
    }

    if (errors.length > 0) {
      return { success: false, tenantId, dashboardUrl: '', errors };
    }

    // Build complete tenant config from onboarding data
    const businessInfo = onboardingData[1] as BusinessInfoData;
    const airtableData = onboardingData[2] as AirtableConnectionData;
    const brandingData = onboardingData[3] as BrandingData;
    const subscriptionData = onboardingData[6] as SubscriptionSelectionData & {
      customerId?: string;
      subscriptionId?: string;
    };

    const tier: SubscriptionTier = subscriptionData?.tier || 'starter';
    const branding = processBranding(brandingData);
    const features: FeatureFlags = TIER_FEATURES[tier];

    await store.update(tenantId, {
      name: businessInfo.name,
      slug: businessInfo.slug,
      airtable: {
        baseId: airtableData.baseId,
        pat: airtableData.pat,
      },
      branding: {
        ...branding,
        supportEmail: businessInfo.email,
        supportPhone: businessInfo.phone,
        website: businessInfo.website || undefined,
        address: businessInfo.address,
      },
      features,
      subscription: {
        tier,
        stripePriceId: '',
        stripeCustomerId: subscriptionData?.customerId || '',
        stripeSubscriptionId: subscriptionData?.subscriptionId || '',
        status: 'trialing',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      },
      timezone: businessInfo.timezone || 'America/Los_Angeles',
      onboardingStep: 7,
      onboardingComplete: true,
      active: true,
    });

    const dashboardUrl = `https://${businessInfo.slug}.ranios.com/dashboard`;

    return {
      success: true,
      tenantId,
      dashboardUrl,
    };
  } catch (err) {
    return {
      success: false,
      tenantId,
      dashboardUrl: '',
      errors: [`Go-live failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
    };
  }
}

// ─── Onboarding State Management ────────────────────────────────────────────

const onboardingState = new Map<string, OnboardingProgress>();

export function getOnboardingProgress(tenantId: string): OnboardingProgress | null {
  return onboardingState.get(tenantId) || null;
}

export function initOnboarding(tenantId: string): OnboardingProgress {
  const progress: OnboardingProgress = {
    tenantId,
    currentStep: 1,
    completedSteps: [],
    stepData: {},
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  onboardingState.set(tenantId, progress);
  return progress;
}

export function updateOnboardingStep(
  tenantId: string,
  step: number,
  data: Record<string, unknown>
): OnboardingProgress {
  let progress = onboardingState.get(tenantId);
  if (!progress) {
    progress = initOnboarding(tenantId);
  }

  progress.stepData[step] = data;
  if (!progress.completedSteps.includes(step)) {
    progress.completedSteps.push(step);
    progress.completedSteps.sort();
  }
  progress.currentStep = Math.min(step + 1, 7);
  progress.lastUpdatedAt = new Date().toISOString();

  onboardingState.set(tenantId, progress);
  return progress;
}

export function resetOnboarding(tenantId: string): void {
  onboardingState.delete(tenantId);
}

// ─── Create New Tenant ──────────────────────────────────────────────────────

/**
 * Initialize a new tenant record in the store.
 * Called at the beginning of onboarding.
 */
export async function createNewTenant(params: {
  ownerEmail: string;
  ownerName: string;
}): Promise<TenantConfig> {
  const store = getTenantStore();

  const id = generateTenantId();
  const slug = generateSlug(params.ownerName);

  const config: Omit<TenantConfig, 'createdAt' | 'updatedAt'> = {
    ...DEFAULT_TENANT_CONFIG,
    id,
    name: '',
    slug,
    ownerId: params.ownerEmail,
    airtable: { baseId: '', pat: '' },
    branding: {
      ...DEFAULT_TENANT_CONFIG.branding,
      clinicName: '',
    },
    features: TIER_FEATURES.starter,
    subscription: {
      tier: 'starter',
      stripePriceId: '',
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      status: 'incomplete',
      currentPeriodEnd: '',
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
    onboardingStep: 0,
    onboardingComplete: false,
    active: false, // Inactive until go-live
  };

  const created = await store.create(config);
  initOnboarding(id);

  return created;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateTenantId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-|-$/g, '') || 'clinic';
}

/**
 * Get subscription tier comparison for the pricing page.
 */
export function getTierComparison(): Array<{
  tier: SubscriptionTier;
  name: string;
  price: number;
  description: string;
  features: FeatureFlags;
  highlighted: boolean;
}> {
  return [
    {
      tier: 'starter' as SubscriptionTier,
      name: TIER_PRICING.starter.name,
      price: TIER_PRICING.starter.monthly,
      description: TIER_PRICING.starter.description,
      features: TIER_FEATURES.starter,
      highlighted: false,
    },
    {
      tier: 'professional' as SubscriptionTier,
      name: TIER_PRICING.professional.name,
      price: TIER_PRICING.professional.monthly,
      description: TIER_PRICING.professional.description,
      features: TIER_FEATURES.professional,
      highlighted: true, // Most popular
    },
    {
      tier: 'enterprise' as SubscriptionTier,
      name: TIER_PRICING.enterprise.name,
      price: TIER_PRICING.enterprise.monthly,
      description: TIER_PRICING.enterprise.description,
      features: TIER_FEATURES.enterprise,
      highlighted: false,
    },
  ];
}

// Re-export step validation schemas for use in API routes
export {
  businessInfoSchema as step1Schema,
  airtableConnectionSchema as step2Schema,
  brandingSchema as step3Schema,
  servicesImportSchema as step4Schema,
  teamSetupSchema as step5Schema,
  subscriptionSchema as step6Schema,
};
