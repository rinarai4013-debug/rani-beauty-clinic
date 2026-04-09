import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { getDashboardCommunicationTemplates } from '@/lib/dashboard/communication-templates';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const category = new URL(request.url).searchParams.get('category');
  const cacheKey = `communications-templates:${category || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const templates = getDashboardCommunicationTemplates().filter((template) =>
    category ? template.category === category : true
  );

  cache.set(cacheKey, templates, TTL.SLOW);
  return NextResponse.json(templates);
}
