import { NextResponse } from 'next/server';
import { getSession } from "@/lib/auth/session";
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * GET /api/dashboard/revenue-optimizer
 *
 * Returns a unified summary of all revenue optimization engines.
 * Sub-routes provide detailed data for each engine.
 */

export async function GET() {
  return withSentry('dashboard/revenue-optimizer', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

    // In production, these would pull from Airtable and compute in real-time.
    // For now, return structured mock data that matches engine output types.
    const summary = {
      totalAddressableGap: 47850,
      gapByCategory: {
        emptySlots: 12400,
        underperformingDays: 8200,
        decliningServices: 5600,
        overdueRebookings: 11200,
        membershipUnderutilization: 3450,
        dormantHighValue: 7000,
      },
      fillabilityScore: 72,
      urgencyScore: 65,
      todayTarget: 2800,
      todayBooked: 1950,
      weekTarget: 15400,
      weekBooked: 8200,
      monthForecast: 58000,
      monthTarget: 60000,
      topActions: [
        { title: 'Fill 3 empty slots today', revenue: 1200, priority: 95 },
        { title: 'Rebook 8 overdue Botox clients', revenue: 2800, priority: 88 },
        { title: 'Activate 5 underutilizing members', revenue: 1500, priority: 82 },
        { title: 'Win back 3 dormant VIP clients', revenue: 3200, priority: 78 },
        { title: 'Boost HydraFacial bookings (down 25%)', revenue: 1400, priority: 65 },
      ],
      retentionRate: 68,
      avgTicket: 385,
      membershipMRR: 8500,
      pricingHealthScore: 74,
      opportunityCount: 42,
    };

      return NextResponse.json(summary);
    } catch (error) {
      console.error('Revenue optimizer error:', error);
      return NextResponse.json(
        { error: 'Failed to compute revenue optimization' },
        { status: 500 },
      );
    }
  });
}
