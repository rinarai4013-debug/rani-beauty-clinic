import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getExecutiveBriefing } from '@/lib/dashboard/executive-briefing';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-executive-briefing';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const briefing = await getExecutiveBriefing();
    cache.set(cacheKey, briefing, TTL.REALTIME);
    return NextResponse.json(briefing);
  } catch (error) {
    console.error('[briefing] Failed to build executive briefing:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to build executive briefing' },
      { status: 503 },
    );
  }
}
