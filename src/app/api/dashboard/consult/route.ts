import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';

async function getConsultGenerator() {
  const consultEngine = await import('@/lib/consult/copilot-engine');
  return (
    ('generateConsultBriefing' in consultEngine && typeof consultEngine.generateConsultBriefing === 'function'
      ? consultEngine.generateConsultBriefing
      : consultEngine.generateConsultCopilot) as (input: unknown) => unknown
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = 'dashboard-consult';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const generator = await getConsultGenerator();
    const consult = generator({
      client: {
        name: 'Sample Client',
        previousServices: [],
        totalSpend: 0,
        visitCount: 0,
        membershipStatus: 'none',
      },
      concerns: ['glow'],
      consultType: 'new_client',
      timeAvailable: 30,
    });
    const payload = { status: 'ok', consult };
    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/consult][GET]', error);
    return NextResponse.json({ error: 'Failed to load consult intelligence' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = z.record(z.unknown()).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid consult request body' }, { status: 400 });
  }

  try {
    const generator = await getConsultGenerator();
    const briefing = generator(parsed.data);
    return NextResponse.json({ status: 'ok', briefing });
  } catch (error) {
    console.error('[dashboard/consult][POST]', error);
    return NextResponse.json({ error: 'Failed to generate consult briefing' }, { status: 500 });
  }
}
