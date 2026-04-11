import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getProviderPerformance } from '@/lib/dashboard/mangomint-intelligence';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_providers')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'provider-performance-live';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const providers = await getProviderPerformance();
    const data = { providers };
    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[providers] Failed to fetch performance:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to load provider performance data.' },
      { status: 503 },
    );
  }
}
