import { getDashboardKpis, getNoShowRisk, getProviderPerformance, getUpcomingSchedule } from '@/lib/dashboard/mangomint-intelligence';
import { getRevenueForecastSnapshot } from '@/lib/dashboard/revenue-intelligence';

export interface ExecutiveBriefing {
  generatedAt: string;
  status: 'critical' | 'watch' | 'strong';
  headline: string;
  summary: string;
  topMoves: Array<{
    title: string;
    owner: 'front-desk' | 'provider' | 'owner' | 'marketing' | 'ops';
    urgency: 'today' | 'this_week' | 'monitor';
    reason: string;
  }>;
  pressurePoints: string[];
  scorecard: {
    revenueMonthToDate: number;
    projectedMonthRevenue: number;
    gapToTarget: number;
    bookingsToday: number;
    utilization: number;
    consultCloseRate: number;
    rebookRate: number;
    highRiskNoShows: number;
  };
  watchList: {
    noShows: Array<{
      clientName: string;
      service: string;
      time: string;
      riskScore: number;
    }>;
    providerPressure: Array<{
      provider: string;
      utilization: number;
      fillPressure: string;
      recommendation: string;
    }>;
    upcomingVipSlots: Array<{
      clientName: string;
      service: string;
      provider: string;
      date: string;
      time: string;
      estimatedRevenue: number;
    }>;
  };
}

function determineStatus(input: {
  gapToTarget: number;
  highRiskNoShows: number;
  criticalAlerts: number;
  utilization: number;
  closeRate: number;
}): ExecutiveBriefing['status'] {
  if (input.criticalAlerts > 0 || input.highRiskNoShows >= 4 || input.utilization < 50) return 'critical';
  if (input.gapToTarget > 0 || input.closeRate < 50 || input.highRiskNoShows >= 2) return 'watch';
  return 'strong';
}

export async function getExecutiveBriefing(): Promise<ExecutiveBriefing> {
  const [kpis, forecast, noShowRisks, providers, upcoming] = await Promise.all([
    getDashboardKpis(),
    getRevenueForecastSnapshot(),
    getNoShowRisk(new Date().toISOString().slice(0, 10)),
    getProviderPerformance(),
    getUpcomingSchedule(3),
  ]);

  const highRiskNoShows = noShowRisks.filter((risk) => risk.riskLevel === 'high');
  const criticalAlerts = kpis.alerts.filter((alert) => alert.severity === 'critical').length;
  const urgentProviders = providers.filter((provider) => provider.fillPressure === 'urgent');
  const highValueUpcoming = upcoming
    .filter((item) => item.estimatedRevenue >= 500)
    .slice(0, 5)
    .map((item) => ({
      clientName: item.clientName,
      service: item.service,
      provider: item.provider,
      date: item.date,
      time: item.time,
      estimatedRevenue: item.estimatedRevenue,
    }));

  const status = determineStatus({
    gapToTarget: forecast.gapToTarget,
    highRiskNoShows: highRiskNoShows.length,
    criticalAlerts,
    utilization: kpis.bookings.utilization,
    closeRate: kpis.consults.closeRate,
  });

  const headline =
    status === 'strong'
      ? 'Clinic momentum is healthy. Protect pace and keep the schedule dense.'
      : status === 'watch'
        ? 'The clinic is on watch. Revenue pace is recoverable, but today needs deliberate action.'
        : 'Clinic pressure is elevated. Tight operator action is needed today to protect revenue and schedule integrity.';

  const summary =
    forecast.gapToTarget <= 0
      ? `Projection is currently at $${forecast.projectedMonthRevenue.toLocaleString()} against a $${forecast.targetMonth.toLocaleString()} target. Focus on protecting conversion, rebooking, and premium slot quality.`
      : `Projection is currently $${forecast.gapToTarget.toLocaleString()} short of target. The fastest controllable levers are consult conversion, same-week reactivation, and proactive handling of at-risk bookings.`;

  const topMoves: ExecutiveBriefing['topMoves'] = [
    {
      title: 'Close same-day consult opportunities',
      owner: 'owner',
      urgency: kpis.consults.closeRate < 55 ? 'today' : 'this_week',
      reason: `Consult close rate is ${kpis.consults.closeRate}%; this is the fastest path to premium revenue.`,
    },
    {
      title: 'Protect the schedule from avoidable no-shows',
      owner: 'front-desk',
      urgency: highRiskNoShows.length > 0 ? 'today' : 'monitor',
      reason: highRiskNoShows.length > 0
        ? `${highRiskNoShows.length} high-risk appointments need live confirmation.`
        : 'No-show risk is currently manageable, but confirmation discipline still matters.',
    },
    {
      title: 'Fill underutilized provider capacity',
      owner: 'ops',
      urgency: urgentProviders.length > 0 ? 'today' : 'this_week',
      reason: urgentProviders.length > 0
        ? `${urgentProviders.length} provider schedule${urgentProviders.length === 1 ? '' : 's'} are underfilled right now.`
        : 'Provider capacity is usable, but should be matched with higher-ticket demand.',
    },
    {
      title: 'Use reactivation to bridge the revenue gap',
      owner: 'marketing',
      urgency: forecast.gapToTarget > 0 ? 'this_week' : 'monitor',
      reason: forecast.gapToTarget > 0
        ? `The clinic needs about $${forecast.paceRequiredPerDay.toLocaleString()} per remaining day to hit target.`
        : 'Reactivation can add margin-friendly revenue without extra acquisition cost.',
    },
  ];

  const pressurePoints: string[] = [];
  if (forecast.gapToTarget > 0) {
    pressurePoints.push(`Revenue projection is $${forecast.gapToTarget.toLocaleString()} below target.`);
  }
  if (highRiskNoShows.length > 0) {
    pressurePoints.push(`${highRiskNoShows.length} appointments are flagged high-risk for no-show.`);
  }
  if (urgentProviders.length > 0) {
    pressurePoints.push(`${urgentProviders.length} provider schedule${urgentProviders.length === 1 ? '' : 's'} need fill-pressure action.`);
  }
  if (kpis.consults.closeRate < 50) {
    pressurePoints.push(`Consult close rate is ${kpis.consults.closeRate}%, which is below premium pace.`);
  }
  if (kpis.clients.rebookRate < 40) {
    pressurePoints.push(`Rebook rate is ${kpis.clients.rebookRate}%, leaving retention revenue on the table.`);
  }
  if (criticalAlerts > 0) {
    pressurePoints.push(`${criticalAlerts} critical dashboard alert${criticalAlerts === 1 ? '' : 's'} remain active.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    status,
    headline,
    summary,
    topMoves,
    pressurePoints,
    scorecard: {
      revenueMonthToDate: kpis.revenue.mtd,
      projectedMonthRevenue: forecast.projectedMonthRevenue,
      gapToTarget: forecast.gapToTarget,
      bookingsToday: kpis.bookings.today,
      utilization: kpis.bookings.utilization,
      consultCloseRate: kpis.consults.closeRate,
      rebookRate: kpis.clients.rebookRate,
      highRiskNoShows: highRiskNoShows.length,
    },
    watchList: {
      noShows: highRiskNoShows.slice(0, 5).map((risk) => ({
        clientName: risk.clientName,
        service: risk.service,
        time: risk.time,
        riskScore: risk.riskScore,
      })),
      providerPressure: providers
        .filter((provider) => provider.fillPressure !== 'light')
        .slice(0, 5)
        .map((provider) => ({
          provider: provider.provider,
          utilization: provider.utilization,
          fillPressure: provider.fillPressure,
          recommendation: provider.recommendation,
        })),
      upcomingVipSlots: highValueUpcoming,
    },
  };
}
