import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getCommunicationAnalytics, getProviderComparison } from '@/lib/communications';

// GET /api/dashboard/communications/analytics
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') ?? '30d';

  try {
    // Calculate date range
    const end = new Date();
    const start = new Date();
    switch (range) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    const analytics = getCommunicationAnalytics({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const providers = getProviderComparison();

    return NextResponse.json({
      success: true,
      data: analytics,
      providers,
      range,
    });
  } catch (err) {
    console.error('[Analytics GET]', err);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
