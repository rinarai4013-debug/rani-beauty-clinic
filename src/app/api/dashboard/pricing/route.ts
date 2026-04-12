import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { analyzePricing } from '@/lib/pricing/dynamic-engine';
import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('dashboard/pricing', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'dashboard-pricing';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const payload = analyzePricing({
        services: [],
        transactions: [],
        memberships: {
          totalMembers: 0,
          avgMemberSpend: 0,
          avgNonMemberSpend: 0,
          churnRate: 0,
        },
        utilization: {
          byDayOfWeek: [],
          byTimeSlot: [],
          overall: 0,
        },
        competitorPricing: [],
      });

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/pricing]', error);
      return NextResponse.json({ error: 'Failed to load pricing intelligence' }, { status: 500 });
    }

  });
}
