import { z } from 'zod';

/**
 * Centralized environment variable validation for RaniOS.
 *
 * Required vars will throw at build / startup if missing.
 * Optional vars default to empty strings and are checked at call-sites.
 */

/* ── Schema ─────────────────────────────────────────────────── */

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default(process.env.NODE_ENV ?? 'development'),

  // Required - app won't function without these
  AIRTABLE_PAT: z.string().min(1, 'AIRTABLE_PAT is required').transform(v => v.trim()),
  AIRTABLE_BASE_ID: z.string().min(1, 'AIRTABLE_BASE_ID is required').transform(v => v.trim()),
  DASHBOARD_JWT_SECRET: z.string().min(1, 'DASHBOARD_JWT_SECRET is required').transform(v => v.trim()),

  // Required for AI features
  ANTHROPIC_API_KEY: z.string().optional().default(''),

  // Email
  RESEND_API_KEY: z.string().optional().default(''),
  CONTACT_EMAIL: z.string().optional().default('info@ranibeautyclinic.com'),
  FROM_EMAIL: z
    .string()
    .optional()
    .default('Rani Beauty Clinic <noreply@ranibeautyclinic.com>'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_FROM_NUMBER: z.string().optional().default(''),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  STRIPE_PRICE_STARTER: z.string().optional().default(''),
  STRIPE_PRICE_PROFESSIONAL: z.string().optional().default(''),
  STRIPE_PRICE_ENTERPRISE: z.string().optional().default(''),
  CHERRY_API_KEY: z.string().optional().default(''),
  CHERRY_WEBHOOK_SECRET: z.string().optional().default(''),
  PATIENTFI_API_KEY: z.string().optional().default(''),
  PATIENTFI_WEBHOOK_SECRET: z.string().optional().default(''),

  // Booking (webhook-only — Mangomint has no public API)
  MANGOMINT_WEBHOOK_SECRET: z.string().optional().default(''),

  // Automation
  N8N_WEBHOOK_URL: z.string().optional().default(''),

  // Banking
  PLAID_CLIENT_ID: z.string().optional().default(''),
  PLAID_SECRET: z.string().optional().default(''),
  PLAID_ENV: z.string().optional().default('sandbox'),

  // Vector DB / Embeddings
  PINECONE_API_KEY: z.string().optional().default(''),
  VOYAGE_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),

  // Voice AI
  VAPI_API_KEY: z.string().optional().default(''),
  VAPI_ASSISTANT_ID: z.string().optional().default(''),
  ELEVENLABS_VOICE_ID: z.string().optional().default(''),

  // Ads
  META_ACCESS_TOKEN: z.string().optional().default(''),
  META_AD_ACCOUNT_ID: z.string().optional().default(''),
  META_CAPI_WEBHOOK_SECRET: z.string().optional().default(''),

  // Google Ads OAuth (optional)
  GOOGLE_ADS_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_ADS_CLIENT_SECRET: z.string().optional().default(''),

  // Integrations
  SQUARE_ACCESS_TOKEN: z.string().optional().default(''),
  JOTFORM_API_KEY: z.string().optional().default(''),

  // WordPress
  WORDPRESS_ORIGIN: z.string().optional().default(''),

  // Dashboard users JSON
  DASHBOARD_USERS: z.string().optional().default('{}'),

  // Security / Automation secrets
  CRON_SECRET: z.string().optional().default(''),
  N8N_API_KEY: z.string().optional().default(''),

  // Public/runtime feature and site defaults
  NEXT_PUBLIC_DASHBOARD_FEATURES: z.string().optional().default(''),
  DASHBOARD_FEATURES: z.string().optional().default(''),
  INDEXNOW_KEY_PATH: z.string().optional().default(''),
  NEXT_PUBLIC_SITE_URL: z.string().optional().default('https://www.ranibeautyclinic.com'),
  NEXT_PUBLIC_BASE_URL: z.string().optional().default('https://ranibeautyclinic.com'),

  // Patient portal
  PATIENT_JWT_SECRET: z.string().optional().default(''),

  // External services
  REPLICATE_API_TOKEN: z.string().optional().default(''),
  HTML2PDF_API_KEY: z.string().optional().default(''),

  // Master base for multi-tenant mode (optional override)
  RANIOS_MASTER_PAT: z.string().optional().default(''),
  RANIOS_MASTER_BASE_ID: z.string().optional().default(''),

  // Square catalog IDs
  SQUARE_LOCATION_ID: z.string().optional().default(''),
  SQUARE_PLAN_HALO_MONTHLY: z.string().optional().default('plan_halo_monthly'),
  SQUARE_PLAN_HALO_ANNUAL: z.string().optional().default('plan_halo_annual'),
  SQUARE_PLAN_GLOW_MONTHLY: z.string().optional().default('plan_glow_monthly'),
  SQUARE_PLAN_GLOW_ANNUAL: z.string().optional().default('plan_glow_annual'),
  SQUARE_PLAN_ELITE_MONTHLY: z.string().optional().default('plan_elite_monthly'),
  SQUARE_PLAN_ELITE_ANNUAL: z.string().optional().default('plan_elite_annual'),
});

/* ── Parse & export ─────────────────────────────────────────── */

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    console.error(
      '\n╔══════════════════════════════════════════════╗\n' +
        '║  ⚠ Missing required environment variables    ║\n' +
        '╚══════════════════════════════════════════════╝\n' +
        formatted +
        '\n\nSee .env.example for reference.\n'
    );

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}

export const env = validateEnv();

/* ── Helper: check if an optional feature is configured ─────── */

export const hasFeature = {
  ai: () => Boolean(env.ANTHROPIC_API_KEY),
  email: () => Boolean(env.RESEND_API_KEY),
  sms: () =>
    Boolean(
      env.TWILIO_ACCOUNT_SID &&
        env.TWILIO_AUTH_TOKEN &&
        env.TWILIO_FROM_NUMBER
    ),
  stripe: () => Boolean(env.STRIPE_SECRET_KEY),
  cherry: () => Boolean(env.CHERRY_API_KEY),
  patientfi: () => Boolean(env.PATIENTFI_API_KEY),
  plaid: () => Boolean(env.PLAID_CLIENT_ID && env.PLAID_SECRET),
  pinecone: () => Boolean(env.PINECONE_API_KEY),
  embeddings: () => Boolean(env.VOYAGE_API_KEY || env.OPENAI_API_KEY),
  vapi: () => Boolean(env.VAPI_API_KEY && env.VAPI_ASSISTANT_ID),
  voiceClone: () => Boolean(env.ELEVENLABS_VOICE_ID),
  metaAds: () => Boolean(env.META_ACCESS_TOKEN && env.META_AD_ACCOUNT_ID),
  n8n: () => Boolean(env.N8N_WEBHOOK_URL),
} as const;
