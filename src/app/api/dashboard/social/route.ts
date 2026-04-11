import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { generateSocialPlan } from '@/lib/social/auto-post-engine';
import { cache, TTL } from '@/lib/cache';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-social-plan';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const payload = generateSocialPlan({
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
        currentMonth: new Date().getMonth() + 1,
        upcomingHolidays: [],
        season: 'spring',
        weddingSeason: false,
      },
    });
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/social]', error);
    return NextResponse.json({ error: 'Failed to build social plan' }, { status: 500 });
  }
}
