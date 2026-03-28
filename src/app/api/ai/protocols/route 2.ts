import { NextRequest, NextResponse } from 'next/server';
import { getAllProtocols, getProtocolCategories, searchProtocols, getProtocolById } from '@/lib/ai/treatment-protocols';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const id = searchParams.get('id');
    const category = searchParams.get('category');

    // Get single protocol by ID
    if (id) {
      const protocol = getProtocolById(id);
      if (!protocol) {
        return NextResponse.json({ success: false, error: 'Protocol not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: protocol });
    }

    // Search
    if (query) {
      const results = searchProtocols(query);
      return NextResponse.json({
        success: true,
        data: { protocols: results, count: results.length },
      });
    }

    // Get all
    let protocols = getAllProtocols();
    if (category) {
      protocols = protocols.filter(p => p.category === category);
    }

    const categories = getProtocolCategories();

    return NextResponse.json({
      success: true,
      data: {
        protocols,
        categories,
        count: protocols.length,
      },
    });
  } catch (error) {
    console.error('Protocols API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch protocols' },
      { status: 500 }
    );
  }
}
