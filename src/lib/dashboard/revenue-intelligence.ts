import { getDashboardKpis, getNoShowRisk, getProviderPerformance } from '@/lib/dashboard/mangomint-intelligence';

export interface RevenueForecastSnapshot {
  generatedAt: string;
  targetMonth: number;
  monthToDateRevenue: number;
  projectedMonthRevenue: number;
  gapToTarget: number;
  daysElapsed: number;
  daysRemaining: number;
  paceRequiredPerDay: number;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  topPressurePoints: string[];
  executiveSummary: string;
  recommendedMoves: Array<{
    title: string;
    reason: string;
    urgency: 'today' | 'this_week' | 'monitor';
  }>;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function getRevenueForecastSnapshot(): Promise<RevenueForecastSnapshot> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysElapsed = Math.max(1, now.getDate());
  const daysRemaining = Math.max(0, monthEnd.getDate() - now.getDate());

  const [kpis, noShowRisks, providers] = await Promise.all([
    getDashboardKpis(),
    getNoShowRisk(now.toISOString().slice(0, 10)),
    getProviderPerformance(),
  ]);

  const targetMonth = kpis.revenue.target;
  const monthToDateRevenue = kpis.revenue.mtd;
  const projectedMonthRevenue = kpis.revenue.projectedMonth;
  const gapToTarget = Math.max(0, targetMonth - projectedMonthRevenue);
  const paceRequiredPerDay = daysRemaining > 0
    ? round(Math.max(0, targetMonth - monthToDateRevenue) / daysRemaining)
    : Math.max(0, targetMonth - monthToDateRevenue);

  const highRiskNoShows = noShowRisks.filter((risk) => risk.riskLevel === 'high').length;
  const urgentProviderPressure = providers.filter((provider) => provider.fillPressure === 'urgent').length;
  const consultStrength = kpis.consults.closeRate >= 55 ? 1 : kpis.consults.closeRate >= 40 ? 0.5 : 0;
  const utilizationStrength = kpis.bookings.utilization >= 70 ? 1 : kpis.bookings.utilization >= 55 ? 0.5 : 0;
  const rebookStrength = kpis.clients.rebookRate >= 45 ? 1 : kpis.clients.rebookRate >= 30 ? 0.5 : 0;
  const alertPenalty = Math.min(1, kpis.alerts.filter((alert) => alert.severity === 'critical').length / 4);
  const noShowPenalty = Math.min(1, highRiskNoShows / 5);
  const providerPenalty = Math.min(1, urgentProviderPressure / 3);

  const confidenceScore = clamp(
    round(
      (
        consultStrength * 25 +
        utilizationStrength * 20 +
        rebookStrength * 15 +
        Math.max(0, 1 - noShowPenalty) * 15 +
        Math.max(0, 1 - alertPenalty) * 15 +
        Math.max(0, 1 - providerPenalty) * 10
      ),
    ),
    0,
    100,
  );

  const confidence: RevenueForecastSnapshot['confidence'] =
    confidenceScore >= 75 ? 'high' : confidenceScore >= 50 ? 'medium' : 'low';

  const topPressurePoints: string[] = [];
  if (gapToTarget > 0) {
    topPressurePoints.push(`Current projection is $${gapToTarget.toLocaleString()} short of target.`);
  }
  if (highRiskNoShows > 0) {
    topPressurePoints.push(`${highRiskNoShows} high-risk appointments need proactive confirmation today.`);
  }
  if (urgentProviderPressure > 0) {
    topPressurePoints.push(`${urgentProviderPressure} provider schedule${urgentProviderPressure === 1 ? '' : 's'} need fill-pressure action.`);
  }
  if (kpis.consults.closeRate < 50) {
    topPressurePoints.push(`Consult close rate is ${kpis.consults.closeRate}%; premium package conversion needs tightening.`);
  }
  if (kpis.clients.rebookRate < 40) {
    topPressurePoints.push(`Rebook rate is ${kpis.clients.rebookRate}%; retention is leaving money behind.`);
  }

  const recommendedMoves: RevenueForecastSnapshot['recommendedMoves'] = [
    {
      title: 'Work same-day fill pressure first',
      reason: urgentProviderPressure > 0
        ? 'Provider capacity is available right now; convert idle slots before buying more demand.'
        : 'Protect schedule density so paid traffic lands on an already-sharp calendar.',
      urgency: urgentProviderPressure > 0 ? 'today' : 'this_week',
    },
    {
      title: 'Push premium consult closes with financing',
      reason: `Current consult close rate is ${kpis.consults.closeRate}%; high-ticket conversions are the fastest route to target pace.`,
      urgency: kpis.consults.closeRate < 55 ? 'today' : 'this_week',
    },
    {
      title: 'Prevent avoidable no-shows',
      reason: highRiskNoShows > 0
        ? `${highRiskNoShows} appointments are high-risk and worth live confirmation.`
        : 'Keep confirmation discipline tight before ad volume increases.',
      urgency: highRiskNoShows > 0 ? 'today' : 'monitor',
    },
    {
      title: 'Use reactivation to bridge the gap',
      reason: gapToTarget > 0
        ? `You need about $${paceRequiredPerDay.toLocaleString()}/day for the rest of the month; reactivation is the fastest controllable lever.`
        : 'Reactivation can compound momentum without extra ad spend.',
      urgency: gapToTarget > 0 ? 'this_week' : 'monitor',
    },
  ];

  const executiveSummary =
    gapToTarget <= 0
      ? `Projection is currently on pace to meet or beat the $${targetMonth.toLocaleString()} monthly target. Keep schedule density, consult closes, and rebooking discipline high.`
      : `Projection is currently short of target. To close the gap, the clinic needs roughly $${paceRequiredPerDay.toLocaleString()} per remaining day, with the fastest wins coming from consult conversion, reactivation, and protecting booked capacity.`;

  return {
    generatedAt: now.toISOString(),
    targetMonth,
    monthToDateRevenue,
    projectedMonthRevenue,
    gapToTarget,
    daysElapsed,
    daysRemaining,
    paceRequiredPerDay,
    confidence,
    confidenceScore,
    topPressurePoints,
    executiveSummary,
    recommendedMoves,
  };
}
