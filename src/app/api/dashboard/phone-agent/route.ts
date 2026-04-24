import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  return withSentry('dashboard/phone-agent', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = 'dashboard-phone-agent';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const phoneAgent = await import('@/lib/phone/vapi-agent');
      const payload = (
        ('getPhoneAgentConfig' in phoneAgent && typeof phoneAgent.getPhoneAgentConfig === 'function'
          ? phoneAgent.getPhoneAgentConfig
          : phoneAgent.configurePhoneAgent)
      )();
      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/phone-agent]', error);
      return NextResponse.json({ error: 'Failed to load phone agent config' }, { status: 500 });
    }
  });
}
