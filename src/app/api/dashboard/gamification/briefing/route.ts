import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { buildGamificationBriefingPayload } from '@/lib/dashboard/gamification-summary';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leaderboard')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'gamification-briefing';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const payload = await buildGamificationBriefingPayload();
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/gamification/briefing]', error);
    return NextResponse.json({ error: 'Failed to load gamification briefing' }, { status: 500 });
  }
}
