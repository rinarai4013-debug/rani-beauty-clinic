import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

export async function GET(request: NextRequest) {
  return withSentry('dashboard/knowledge-base', async () => {
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
      const knowledgeBase = await import('@/lib/rag/knowledge-base');
      const payload = query
        ? knowledgeBase.searchKnowledgeBase(query)
        : (
            ('getKnowledgeBaseStats' in knowledgeBase && typeof knowledgeBase.getKnowledgeBaseStats === 'function'
              ? knowledgeBase.getKnowledgeBaseStats
              : knowledgeBase.buildKnowledgeBase)
          )();

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/knowledge-base]', error);
      return NextResponse.json({ error: 'Failed to load knowledge base data' }, { status: 500 });
    }

  });
}
