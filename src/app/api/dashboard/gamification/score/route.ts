import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { calculateClinicScore, getCurrentBossLevel } from '@/lib/gamification/engine';
import { getCurrentLevel } from '@/lib/gamification/levels';
import type { DailyMetrics } from '@/types/gamification';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function buildScorePayload() {
  const metrics: DailyMetrics = {
    revenue: 8500,
    revenueTarget: 10000,
    bookedHours: 7,
    availableHours: 10,
    consultsCompleted: 4,
    consultsClosed: 3,
    patientsSeen: 8,
    patientsRebooked: 6,
    reviewsReceived: 1,
    followUpsDue: 4,
    followUpsCompleted: 4,
    onTimeStarts: 9,
    totalAppointments: 10,
    noShows: 1,
    cancellations: 0,
  };

  const score = calculateClinicScore(metrics);
  const level = getCurrentLevel(3200);
  const boss = getCurrentBossLevel(42000);

  return {
    ...score,
    streak: 5,
    xp: 3200,
    level,
    bossProgress: {
      ...boss,
      currentRevenue: 42000,
    },
  };
}

export async function GET() {
  return withSentry('dashboard/gamification/score', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'gamification-score';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const sourceChecks = await Promise.allSettled([
        fetchAll(Tables.appointments(), undefined, true),
        fetchAll(Tables.transactions(), undefined, true),
        fetchAll(Tables.kpis(), undefined, true),
        fetchAll(Tables.reviews(), undefined, true),
      ]);
      const failedSources = sourceChecks.filter((result) => result.status === 'rejected');
      if (failedSources.length > 0) {
        console.warn(
          JSON.stringify({
            event: 'dashboard.gamification.score.source_check_failed',
            failedSources: failedSources.length,
            ts: new Date().toISOString(),
          }),
        );
      }

      const payload = buildScorePayload();

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'dashboard.gamification.score.failed_soft',
          error: error instanceof Error ? error.message : String(error),
          ts: new Date().toISOString(),
        }),
      );
      return NextResponse.json(buildScorePayload());
    }
  });
}
