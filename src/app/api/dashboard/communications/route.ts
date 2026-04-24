import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import {
  getCommunicationAnalytics,
  getConversationStats,
  getAllCampaigns,
} from '@/lib/communications';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


// GET /api/dashboard/communications - Overview data
export async function GET(request: Request) {
  return withSentry('dashboard/communications', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const analytics = getCommunicationAnalytics();
      const conversationStats = getConversationStats();
      const campaigns = getAllCampaigns();

      const activeCampaigns = campaigns.filter(
        c => c.status === 'sending' || c.status === 'scheduled'
      );

      return NextResponse.json({
        success: true,
        data: {
          analytics: {
            totalSent: analytics.totalSent,
            avgOpenRate: analytics.avgOpenRate,
            avgClickRate: analytics.avgClickRate,
            totalRevenueAttributed: analytics.totalRevenueAttributed,
          },
          conversations: conversationStats,
          campaigns: {
            total: campaigns.length,
            active: activeCampaigns.length,
            scheduled: campaigns.filter(c => c.status === 'scheduled').length,
          },
        },
      });
    } catch (err) {
      console.error('[Communications Overview]', err);
      return NextResponse.json(
        { error: 'Failed to load communication overview' },
        { status: 500 }
      );
    }
  });
}
