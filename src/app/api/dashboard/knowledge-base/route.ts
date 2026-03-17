import { NextResponse } from 'next/server';
import { buildKnowledgeBase, searchKnowledgeBase, buildRAGContext } from '@/lib/rag/knowledge-base';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') as string | undefined;
    const service = searchParams.get('service') as string | undefined;

    // If query param provided, return search results
    if (query) {
      const context = buildRAGContext(query, {
        category: category as never,
        service: service || undefined,
      });

      return NextResponse.json({
        success: true,
        data: context,
        generatedAt: new Date().toISOString(),
      });
    }

    // Otherwise return knowledge base stats
    const stats = buildKnowledgeBase();

    return NextResponse.json({
      success: true,
      data: stats,
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
