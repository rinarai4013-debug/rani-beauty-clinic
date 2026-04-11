import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getRevenueForecastSnapshot } from '@/lib/dashboard/revenue-intelligence';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-finance-forecast';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const forecast = await getRevenueForecastSnapshot();
    const payload = {
      status: 'ok',
      forecast,
    };
    cache.set(cacheKey, payload, TTL.REALTIME);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[finance/forecast] Failed to build revenue forecast:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to build revenue forecast' },
      { status: 503 },
    );
  }
}
