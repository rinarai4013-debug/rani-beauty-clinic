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
} from '@/lib/briefing/data-fetchers';
import { buildExecutiveBriefing } from '@/lib/briefing/executive-os';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [revenue, schedule, alerts, marketing, cashFlow, aiHighlights, loyalty, referrals] =
    await Promise.all([
      fetchRevenue(),
      fetchSchedule(),
      fetchAlerts(),
      fetchMarketing(),
      fetchCashFlow(),
      fetchAIHighlights(),
      fetchLoyalty(),
      fetchReferrals(),
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
  });

  return NextResponse.json({
    status: 'ok',
    briefing,
  });
}
