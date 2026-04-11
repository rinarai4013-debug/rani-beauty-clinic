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
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-marketing-reviews-summary';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const summary = await getReviewsSummary(14, 5);
    const payload = { status: 'ok', summary };
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/marketing/reviews]', error);
    return NextResponse.json({ error: 'Failed to load marketing reviews' }, { status: 500 });
  }
}
