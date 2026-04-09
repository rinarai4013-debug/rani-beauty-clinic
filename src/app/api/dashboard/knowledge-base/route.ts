import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import * as knowledgeBase from '@/lib/rag/knowledge-base';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get('q');
  const cacheKey = query ? `knowledge-base-search:${query}` : 'knowledge-base-stats';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const payload = query
      ? knowledgeBase.searchKnowledgeBase(query)
      : (
          (knowledgeBase as { getKnowledgeBaseStats?: () => unknown }).getKnowledgeBaseStats
          ?? knowledgeBase.buildKnowledgeBase
        )();

    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/knowledge-base]', error);
    return NextResponse.json({ error: 'Failed to load knowledge base data' }, { status: 500 });
  }
}
