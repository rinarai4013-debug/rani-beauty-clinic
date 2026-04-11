import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { buildGamificationScorePayload } from '@/lib/dashboard/gamification-summary';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leaderboard')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'gamification-score';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const payload = await buildGamificationScorePayload();
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/gamification/score]', error);
    return NextResponse.json({ error: 'Failed to load gamification score' }, { status: 500 });
  }
}
