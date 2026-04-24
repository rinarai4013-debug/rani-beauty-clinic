import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { generateWeeklyBrief } from '@/lib/backlinks/engine';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  return withSentry('dashboard/backlinks', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'backlinks:brief';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const brief = generateWeeklyBrief();

      const result = {
        brief,
        asOf: new Date().toISOString(),
      };

      cache.set(cacheKey, result, TTL.RELAXED);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Backlink brief error:', error);
      return NextResponse.json(
        { error: 'Failed to generate backlink brief' },
        { status: 500 }
      );
    }
  });
}
