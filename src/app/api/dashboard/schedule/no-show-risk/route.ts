import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getNoShowRisk } from '@/lib/dashboard/mangomint-intelligence';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_schedule')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawDate = searchParams.get('date') || '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().split('T')[0];

  const cacheKey = `no-show-risk:${date}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const risks = await getNoShowRisk(date);
    const data = {
      date,
      count: risks.length,
      highRiskCount: risks.filter((item) => item.riskLevel === 'high').length,
      risks,
    };
    cache.set(cacheKey, data, TTL.REALTIME);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[no-show-risk] Failed to compute risks:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to load no-show risk data.', date },
      { status: 503 },
    );
  }
}
