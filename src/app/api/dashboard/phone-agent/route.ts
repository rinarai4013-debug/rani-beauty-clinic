import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { configurePhoneAgent } from '@/lib/phone/vapi-agent';
import { cache, TTL } from '@/lib/cache';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-phone-agent';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const payload = configurePhoneAgent();
    cache.set(cacheKey, payload, TTL.RELAXED);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/phone-agent]', error);
    return NextResponse.json({ error: 'Failed to load phone agent config' }, { status: 500 });
  }
}
