import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { buildKnowledgeBase } from '@/lib/rag/knowledge-base';
import { cache, TTL } from '@/lib/cache';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-knowledge-base';
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const payload = buildKnowledgeBase();
    cache.set(cacheKey, payload, TTL.RELAXED);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/knowledge-base]', error);
    return NextResponse.json({ error: 'Failed to load knowledge base' }, { status: 500 });
  }
}
