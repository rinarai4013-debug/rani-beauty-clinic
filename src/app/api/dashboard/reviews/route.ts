import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getReviewsSummary } from '@/lib/dashboard/reviews-summary';
import { cache, TTL } from '@/lib/cache';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-reviews-summary';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const summary = await getReviewsSummary();
    const payload = { status: 'ok', summary };
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/reviews]', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
