import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getScheduleOptimizationSnapshot } from '@/lib/dashboard/mangomint-intelligence';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_schedule')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cacheKey = `schedule-optimize:${startDate}:${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const optimization = await getScheduleOptimizationSnapshot(startDate, endDate);
  cache.set(cacheKey, optimization, TTL.MODERATE);
  return NextResponse.json(optimization);
}
