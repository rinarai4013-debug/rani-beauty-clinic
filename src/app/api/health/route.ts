import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

  return NextResponse.json(
    {
      status: missingRequiredEnv.length === 0 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'rani-beauty-clinic',
      checks: {
        app: true,
        requiredEnv,
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
