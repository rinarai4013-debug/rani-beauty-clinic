import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getDashboardKpis } from '@/lib/dashboard/mangomint-intelligence';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-kpis-live';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const data = await getDashboardKpis();
    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[kpis] Failed to fetch dashboard KPIs:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to load KPIs. Airtable may be temporarily unavailable.' },
      { status: 503 },
    );
  }
}
