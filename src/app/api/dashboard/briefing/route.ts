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
import { fetchConsultIntelligence } from '@/lib/briefing/consult-intelligence';
import { fetchReactivationIntelligence } from '@/lib/briefing/reactivation-intelligence';
import { fetchProviderIntelligence } from '@/lib/briefing/provider-intelligence';
import { fetchFillIntelligence } from '@/lib/briefing/fill-intelligence';
import { buildGrowthIntelligence } from '@/lib/briefing/growth-intelligence';
import { buildExecutiveBriefing } from '@/lib/briefing/executive-os';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [revenue, schedule, alerts, marketing, cashFlow, aiHighlights, loyalty, referrals, providerPerformance, clientGrowth, consults, reactivation, providerInsights, fill] =
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
      fetchFillIntelligence(),
    ]);

  const growth = buildGrowthIntelligence(marketing, referrals, revenue);

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
}
