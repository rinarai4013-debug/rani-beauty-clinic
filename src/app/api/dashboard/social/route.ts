import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('dashboard/social', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = 'dashboard-social';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const socialEngine = await import('@/lib/social/auto-post-engine');
      const generator = (
        'generateWeeklyPlan' in socialEngine && typeof socialEngine.generateWeeklyPlan === 'function'
          ? socialEngine.generateWeeklyPlan
          : socialEngine.generateSocialPlan
      ) as (_input: unknown) => unknown;

    const payload = generator({
      services: [],
      recentPromotions: [],
      clinicStats: {
        totalClients: 0,
        monthlyBookings: 0,
        googleRating: 0,
        reviewCount: 0,
        topService: 'HydraFacial',
        membershipCount: 0,
      },
      seasonality: {
        currentMonth: 4,
        upcomingHolidays: [],
        season: 'spring',
        weddingSeason: false,
      },
    });

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/social]', error);
      return NextResponse.json({ error: 'Failed to load social plan' }, { status: 500 });
    }
  });
}
