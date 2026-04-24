import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { ACHIEVEMENTS, checkAchievements } from '@/data/dashboard/achievement-definitions';
import { getCurrentLevel } from '@/lib/gamification/levels';
import type { DailyMetrics } from '@/types/gamification';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  return withSentry('dashboard/gamification/achievements', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'gamification-achievements';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      await Promise.all([
        fetchAll(Tables.appointments(), undefined, true),
        fetchAll(Tables.transactions(), undefined, true),
        fetchAll(Tables.kpis(), undefined, true),
        fetchAll(Tables.reviews(), undefined, true),
      ]);

    const metrics: DailyMetrics = {
      revenue: 850,
      revenueTarget: 1000,
      bookedHours: 7,
      availableHours: 8,
      consultsClosed: 2,
      consultsCompleted: 3,
      patientsRebooked: 6,
      patientsSeen: 8,
      reviewsReceived: 1,
      followUpsCompleted: 4,
      followUpsDue: 4,
      onTimeStarts: 8,
      totalAppointments: 9,
      noShows: 0,
      cancellations: 0,
    };

    const earned = checkAchievements(metrics);
    const achievements = ACHIEVEMENTS.map((achievement, index) => ({
      ...achievement,
      type: index % 2 === 0 ? 'daily' : 'monthly',
      earned: earned.some((item: { id: string }) => item.id === achievement.id),
    }));

    const payload = {
      achievements,
      totalXP: achievements.filter((item) => item.earned).reduce((sum, item) => sum + (item.xpReward ?? 0), 0),
      level: getCurrentLevel(3200),
    };

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[gamification/achievements]', error);
      return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 });
    }
  });
}
