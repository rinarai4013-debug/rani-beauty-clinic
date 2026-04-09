import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import * as socialEngine from '@/lib/social/auto-post-engine';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = 'dashboard-social';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const generator =
      (socialEngine as { generateWeeklyPlan?: (input: unknown) => unknown }).generateWeeklyPlan
      ?? socialEngine.generateSocialPlan;

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
}
