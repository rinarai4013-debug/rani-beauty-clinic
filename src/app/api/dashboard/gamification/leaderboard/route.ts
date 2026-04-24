import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  return withSentry('dashboard/gamification/leaderboard', async () => {
    try {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.role, 'view_leaderboard')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cacheKey = 'gamification-leaderboard';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const payload = {
      entries: [
        { id: 'mom', name: 'Mom', role: 'provider', totalXP: 1400, level: 5, achievements: 7, weeklyScore: 92 },
        { id: 'rina', name: 'Rina', role: 'ceo', totalXP: 1200, level: 4, achievements: 6, weeklyScore: 88 },
        { id: 'front', name: 'Front Desk', role: 'frontdesk', totalXP: 900, level: 3, achievements: 4, weeklyScore: 81 },
      ],
    };

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (err) {
      console.error('[dashboard/gamification/leaderboard]', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
