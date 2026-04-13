import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  fetchRevenue,
  fetchSchedule,
  fetchAlerts,
  fetchMarketing,
  fetchCashFlow,
  fetchAIHighlights,
  fetchLoyalty,
  fetchReferrals,
  fetchProviderPerformance,
  fetchClientGrowth,
  fetchBookingAttribution,
  getDaysAgo,
  getToday,
} from '@/lib/briefing/data-fetchers';
import { fetchConsultIntelligence } from '@/lib/briefing/consult-intelligence';
import { fetchReactivationIntelligence } from '@/lib/briefing/reactivation-intelligence';
import { fetchProviderIntelligence } from '@/lib/briefing/provider-intelligence';
import { fetchFillIntelligence } from '@/lib/briefing/fill-intelligence';
import { buildGrowthIntelligence } from '@/lib/briefing/growth-intelligence';
import { buildExecutiveBriefing } from '@/lib/briefing/executive-os';
import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('dashboard/briefing', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [revenue, schedule, alerts, marketing, cashFlow, aiHighlights, loyalty, referrals, providerPerformance, clientGrowth, consults, reactivation, providerInsights, attribution] =
      await Promise.all([
        fetchRevenue(),
        fetchSchedule(),
        fetchAlerts(),
        fetchMarketing(),
        fetchCashFlow(),
        fetchAIHighlights(),
        fetchLoyalty(),
        fetchReferrals(),
        fetchProviderPerformance(getDaysAgo(7), getToday()),
        fetchClientGrowth(),
        fetchConsultIntelligence(),
        fetchReactivationIntelligence(),
        fetchProviderIntelligence(),
        fetchBookingAttribution(getDaysAgo(30), getToday()),
      ]);

    const growth = buildGrowthIntelligence(marketing, referrals, revenue, attribution);
    const fill = await fetchFillIntelligence({ consults, reactivation });

    const briefing = buildExecutiveBriefing({
      revenue,
      schedule,
      alerts,
      marketing,
      cashFlow,
      aiHighlights,
      loyalty,
      referrals,
      providerPerformance,
      clientGrowth,
      consults,
      reactivation,
      providerInsights,
      fill,
      growth,
    });

    return NextResponse.json({
      status: 'ok',
      briefing,
    });
  });
}
