/**
 * GET /api/mastermind/pdf/serve?file={filename}
 *
 * Serves a previously stored PDF HTML file.
 * Returns the HTML content with appropriate headers
 * for browser viewing and print-to-PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { retrievePdf } from '@/lib/mastermind/pdf-storage';

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('file');

  if (!filename) {
    return NextResponse.json(
      { success: false, error: 'Missing file parameter' },
      { status: 400 }
    );
  }

  try {
    const html = await retrievePdf(filename);

    if (!html) {
      return NextResponse.json(
        { success: false, error: 'PDF not found' },
        { status: 404 }
      );
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=86400',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[PDF Serve] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve PDF' },
      { status: 500 }
    );
  }
}
