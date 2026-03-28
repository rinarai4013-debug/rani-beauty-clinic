import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { buildKnowledgeBase, searchKnowledgeBase, buildRAGContext } from '@/lib/rag/knowledge-base';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') as string | undefined;
    const service = searchParams.get('service') as string | undefined;
    const pineconeConnected = !!process.env.PINECONE_API_KEY;

    // If query param provided, return search results
    if (query) {
      // If Pinecone is configured, attempt vector search
      if (pineconeConnected) {
        try {
          const { searchPinecone } = await import('@/lib/rag/knowledge-base');
          const pineconeResults = await searchPinecone(query, {
            category: category as never,
            service: service || undefined,
          });

          return NextResponse.json({
            success: true,
            data: pineconeResults,
            pineconeConnected: true,
            generatedAt: new Date().toISOString(),
          });
        } catch (pineconeError) {
          console.warn('Pinecone search failed, falling back to keyword search:', pineconeError);
          // Fall through to keyword search below
        }
      }

      // Keyword search fallback
      const context = buildRAGContext(query, {
        category: category as never,
        service: service || undefined,
      });

      return NextResponse.json({
        success: true,
        data: context,
        pineconeConnected: false,
        generatedAt: new Date().toISOString(),
      });
    }

    // Otherwise return knowledge base stats
    const stats = buildKnowledgeBase();

    return NextResponse.json({
      success: true,
      data: stats,
      pineconeConnected,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Knowledge base error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query knowledge base' },
      { status: 500 }
    );
  }
}
