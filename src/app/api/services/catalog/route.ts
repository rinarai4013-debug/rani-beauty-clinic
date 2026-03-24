import { NextResponse } from 'next/server';
import { UNIFIED_CATALOG } from '@/data/services/unified-catalog';

export async function GET() {
  return NextResponse.json(
    { services: UNIFIED_CATALOG, count: UNIFIED_CATALOG.length },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
