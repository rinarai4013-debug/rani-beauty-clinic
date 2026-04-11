import { NextResponse } from 'next/server';
import { hasFeature } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint.
 *
 * Reports:
 * - Core required env presence (boolean only, never values)
 * - Optional integration readiness via hasFeature helpers
 * - App status: "ok" | "degraded"
 *
 * Returns 200 if all required env vars are present, 503 if degraded.
 */

const REQUIRED_ENV_VARS = [
  'AIRTABLE_PAT',
  'AIRTABLE_BASE_ID',
  'DASHBOARD_JWT_SECRET',
] as const;

export async function GET() {
  const requiredEnv = Object.fromEntries(
    REQUIRED_ENV_VARS.map((name) => [name, Boolean(process.env[name])])
  );

  const missingRequiredEnv = Object.entries(requiredEnv)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  // Optional integration status — safe booleans only, never secret values
  const integrations = {
    ai: hasFeature.ai(),
    email: hasFeature.email(),
    sms: hasFeature.sms(),
    stripe: hasFeature.stripe(),
    cherry: hasFeature.cherry(),
    plaid: hasFeature.plaid(),
    pinecone: hasFeature.pinecone(),
    vapi: hasFeature.vapi(),
    metaAds: hasFeature.metaAds(),
    n8n: hasFeature.n8n(),
  };

  return NextResponse.json(
    {
      status: missingRequiredEnv.length === 0 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'rani-beauty-clinic',
      checks: {
        app: true,
        requiredEnv,
        integrations,
      },
      missingRequiredEnv,
    },
    {
      status: missingRequiredEnv.length === 0 ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
