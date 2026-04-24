import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * GET /api/dashboard/marketing
 * Marketing overview — aggregated KPIs, channel breakdown, recent leads, upcoming content.
 */
export async function GET() {
  return withSentry('dashboard/marketing', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
    // In production, these would aggregate from real Airtable data
    const data = {
      kpis: {
        totalLeads: 47,
        leadsTrend: 12,
        conversionRate: 34.2,
        conversionTrend: 2.8,
        adSpend: 4250,
        adSpendTrend: -5,
        roas: 3.8,
        roasTrend: 0.4,
        organicTraffic: 2840,
        avgReviewRating: 4.8,
      },
      channelBreakdown: [
        { channel: 'organic_search', leads: 18, conversions: 8, revenue: 12400, spend: 0 },
        { channel: 'paid_social', leads: 12, conversions: 4, revenue: 6200, spend: 2800 },
        { channel: 'referral', leads: 8, conversions: 5, revenue: 9100, spend: 0 },
        { channel: 'paid_search', leads: 5, conversions: 2, revenue: 3400, spend: 1450 },
        { channel: 'direct', leads: 4, conversions: 2, revenue: 2800, spend: 0 },
      ],
      recentLeads: [
        { name: 'Sarah M.', source: 'google_organic', score: 87, grade: 'A', date: '2026-03-25' },
        { name: 'Lisa K.', source: 'meta_ads', score: 72, grade: 'B', date: '2026-03-25' },
        { name: 'Jennifer W.', source: 'referral', score: 91, grade: 'A', date: '2026-03-24' },
        { name: 'Michelle T.', source: 'instagram_organic', score: 45, grade: 'C', date: '2026-03-24' },
        { name: 'Amanda R.', source: 'google_ads', score: 68, grade: 'B', date: '2026-03-23' },
      ],
      upcomingContent: [
        { title: 'Sofwave Results Timeline', type: 'blog_post', date: '2026-03-26', channel: 'blog' },
        { title: 'Spring Skin Prep Tips', type: 'educational_reel', date: '2026-03-27', channel: 'instagram' },
        { title: 'Client Transformation Story', type: 'social_post', date: '2026-03-28', channel: 'instagram' },
        { title: 'Monthly Newsletter', type: 'email_newsletter', date: '2026-03-28', channel: 'email' },
      ],
    };

      return NextResponse.json(data);
    } catch (error) {
      console.error('[Marketing Overview]', error);
      return NextResponse.json({ error: 'Failed to load marketing data' }, { status: 500 });
    }
  });
}
