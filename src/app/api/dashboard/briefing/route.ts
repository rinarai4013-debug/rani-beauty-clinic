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
  getDaysAgo,
  getToday,
} from '@/lib/briefing/data-fetchers';
import { buildExecutiveBriefing } from '@/lib/briefing/executive-os';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [revenue, schedule, alerts, marketing, cashFlow, aiHighlights, loyalty, referrals, providerPerformance, clientGrowth] =
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
    ]);

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
  });

  return NextResponse.json({
    status: 'ok',
    briefing,
  });
}
