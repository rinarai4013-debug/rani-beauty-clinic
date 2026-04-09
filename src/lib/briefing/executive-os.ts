import type {
  RevenueSnapshot,
  ScheduleSnapshot,
  AlertSnapshot,
  MarketingSnapshot,
  CashFlowSnapshot,
  AIHighlights,
  LoyaltySnapshot,
  ReferralSnapshot,
} from './types';

export type ExecutiveStatus = 'critical' | 'watch' | 'strong';
export type ExecutiveUrgency = 'now' | 'today' | 'this_week';
export type ExecutiveOwner = 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';

export interface ExecutiveMove {
  title: string;
  why: string;
  owner: ExecutiveOwner;
  urgency: ExecutiveUrgency;
  estimatedImpact: string;
  actionType:
    | 'revenue_recovery'
    | 'schedule_fill'
    | 'retention'
    | 'risk_control'
    | 'marketing'
    | 'client_experience';
}

export interface ExecutivePressurePoint {
  label: string;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
}

export interface ExecutiveScorecard {
  yesterdayRevenue: number;
  avgTicket: number;
  appointmentsToday: number;
  consultsToday: number;
  openGaps: number;
  criticalAlerts: number;
  warningAlerts: number;
  financingRevenue: number;
  newLeads: number;
  reviewVelocity: number;
  bankBalance: number | null;
  membershipMRR: number;
  referralRevenue: number;
}

export interface ExecutiveBriefing {
  status: ExecutiveStatus;
  headline: string;
  summary: string;
  scorecard: ExecutiveScorecard;
  topMoves: ExecutiveMove[];
  pressurePoints: ExecutivePressurePoint[];
  watchList: string[];
}

export interface ExecutiveBriefingInput {
  revenue: RevenueSnapshot;
  schedule: ScheduleSnapshot;
  alerts: AlertSnapshot;
  marketing: MarketingSnapshot;
  cashFlow: CashFlowSnapshot;
  aiHighlights: AIHighlights;
  loyalty: LoyaltySnapshot;
  referrals: ReferralSnapshot;
  providerPerformance?: Record<string, { revenue: number; appointments: number; shows: number; noShows: number }>;
  clientGrowth?: {
    totalClients: number;
    newClients: number;
    churnedClients: number;
    netGrowth: number;
  };
}

interface ProviderPressureSignal {
  provider: string;
  noShowRate: number;
  revenuePerAppointment: number;
}

function formatCurrency(value: number | null): string {
  if (value == null) return 'unknown cash position';
  return `$${Math.round(value).toLocaleString()}`;
}

function buildScorecard(input: ExecutiveBriefingInput): ExecutiveScorecard {
  return {
    yesterdayRevenue: input.revenue.total,
    avgTicket: input.revenue.avgTicket,
    appointmentsToday: input.schedule.totalAppointments,
    consultsToday: input.schedule.consultCount,
    openGaps: input.schedule.gaps.length,
    criticalAlerts: input.alerts.bySeverity.critical,
    warningAlerts: input.alerts.bySeverity.warning,
    financingRevenue: input.revenue.financingTotal,
    newLeads: input.marketing.newLeads,
    reviewVelocity: input.marketing.reviewVelocity,
    bankBalance: input.cashFlow.bankBalance,
    membershipMRR: input.loyalty.membershipMRR,
    referralRevenue: input.referrals.revenueAttributed,
  };
}

function buildPressurePoints(input: ExecutiveBriefingInput): ExecutivePressurePoint[] {
  const points: ExecutivePressurePoint[] = [];

  if (input.alerts.bySeverity.critical > 0) {
    points.push({
      label: 'Critical alerts',
      severity: 'critical',
      detail: `${input.alerts.bySeverity.critical} critical operational alerts need attention.`,
    });
  }

  if (input.schedule.gaps.length >= 2) {
    points.push({
      label: 'Open schedule gaps',
      severity: 'warning',
      detail: `${input.schedule.gaps.length} provider gaps are currently visible in today’s schedule.`,
    });
  }

  if (input.aiHighlights.highestNoShowRisk && input.aiHighlights.highestNoShowRisk.score >= 60) {
    points.push({
      label: 'No-show risk cluster',
      severity: 'warning',
      detail: `${input.aiHighlights.highestNoShowRisk.clientName} is at ${input.aiHighlights.highestNoShowRisk.score}% no-show risk.`,
    });
  }

  if (input.aiHighlights.revenueAnomaly) {
    points.push({
      label: 'Revenue anomaly',
      severity: 'warning',
      detail: input.aiHighlights.revenueAnomaly.message,
    });
  }

  if (input.marketing.newLeads >= 3 && input.schedule.consultCount === 0) {
    points.push({
      label: 'Consult bottleneck',
      severity: 'warning',
      detail: `${input.marketing.newLeads} fresh lead${input.marketing.newLeads === 1 ? '' : 's'} surfaced, but no consults are visible in today’s schedule.`,
    });
  }

  if (input.clientGrowth && input.clientGrowth.churnedClients > input.clientGrowth.newClients) {
    points.push({
      label: 'Retention drag',
      severity: 'warning',
      detail: `${input.clientGrowth.churnedClients} churned client${input.clientGrowth.churnedClients === 1 ? '' : 's'} outpaced ${input.clientGrowth.newClients} new client${input.clientGrowth.newClients === 1 ? '' : 's'}.`,
    });
  }

  const providerPressure = getProviderPressure(input.providerPerformance);
  if (providerPressure) {
    points.push({
      label: 'Provider friction',
      severity: providerPressure.noShowRate >= 20 ? 'warning' : 'info',
      detail: `${providerPressure.provider} is carrying a ${Math.round(providerPressure.noShowRate)}% no-show rate and ${formatCurrency(providerPressure.revenuePerAppointment)} per appointment.`,
    });
  }

  if (input.marketing.newLeads === 0) {
    points.push({
      label: 'Lead flow softness',
      severity: 'info',
      detail: 'No new leads were recorded in the current marketing snapshot.',
    });
  }

  return points;
}

function buildTopMoves(input: ExecutiveBriefingInput): ExecutiveMove[] {
  const moves: ExecutiveMove[] = [];
  const providerPressure = getProviderPressure(input.providerPerformance);

  if (input.schedule.gaps.length > 0) {
    const firstGap = input.schedule.gaps[0];
    moves.push({
      title: `Fill ${input.schedule.gaps.length} open schedule gap${input.schedule.gaps.length === 1 ? '' : 's'}`,
      why: `Unused provider time is visible today, starting with ${firstGap.provider} at ${firstGap.startTime}.`,
      owner: 'frontdesk',
      urgency: 'today',
      estimatedImpact: `${input.schedule.gaps.length} additional appointments recovered`,
      actionType: 'schedule_fill',
    });
  }

  if (input.aiHighlights.topChurnRiskClient) {
    moves.push({
      title: `Re-engage ${input.aiHighlights.topChurnRiskClient.name}`,
      why: `They are the highest churn-risk client at ${input.aiHighlights.topChurnRiskClient.score}/100.`,
      owner: 'operations',
      urgency: 'today',
      estimatedImpact: 'Retention recovery on an at-risk client',
      actionType: 'retention',
    });
  }

  if (input.marketing.newLeads >= 3 && input.schedule.consultCount === 0) {
    moves.push({
      title: `Convert ${input.marketing.newLeads} fresh leads into consults`,
      why: 'Lead volume is showing up, but the consult calendar is not catching it yet.',
      owner: 'frontdesk',
      urgency: 'today',
      estimatedImpact: 'Protect near-term conversion momentum',
      actionType: 'marketing',
    });
  }

  if (input.aiHighlights.highestNoShowRisk) {
    moves.push({
      title: `Confirm ${input.aiHighlights.highestNoShowRisk.clientName}'s appointment`,
      why: `${input.aiHighlights.highestNoShowRisk.service} is flagged at ${input.aiHighlights.highestNoShowRisk.score}% no-show risk.`,
      owner: 'frontdesk',
      urgency: 'now',
      estimatedImpact: 'Protect one vulnerable booking',
      actionType: 'risk_control',
    });
  }

  if (providerPressure) {
    moves.push({
      title: `Stabilize ${providerPressure.provider}'s schedule quality`,
      why: `${providerPressure.provider} is showing elevated no-show pressure and softer yield per appointment.`,
      owner: 'operations',
      urgency: providerPressure.noShowRate >= 20 ? 'today' : 'this_week',
      estimatedImpact: 'Recover provider utilization and schedule yield',
      actionType: 'schedule_fill',
    });
  }

  if (input.clientGrowth && input.clientGrowth.churnedClients > input.clientGrowth.newClients) {
    moves.push({
      title: 'Launch a member save push',
      why: `Client churn is outrunning new growth (${input.clientGrowth.churnedClients} churned vs ${input.clientGrowth.newClients} new).`,
      owner: 'operations',
      urgency: 'today',
      estimatedImpact: 'Reduce retention drag before it compounds',
      actionType: 'retention',
    });
  }

  if (input.marketing.newLeads > 0) {
    moves.push({
      title: `Work today's ${input.marketing.newLeads} new lead${input.marketing.newLeads === 1 ? '' : 's'}`,
      why: 'Fresh leads are the highest-intent opportunities in the pipeline.',
      owner: 'marketing',
      urgency: 'today',
      estimatedImpact: 'Higher consult and booking conversion',
      actionType: 'marketing',
    });
  }

  if (input.revenue.financingTotal > 0) {
    moves.push({
      title: 'Review financed revenue conversions',
      why: `Financing contributed $${Math.round(input.revenue.financingTotal).toLocaleString()} in the current revenue snapshot.`,
      owner: 'ceo',
      urgency: 'this_week',
      estimatedImpact: 'Improve package and close strategy',
      actionType: 'revenue_recovery',
    });
  }

  if (moves.length === 0) {
    moves.push({
      title: 'Maintain clean operating rhythm',
      why: 'No urgent risks surfaced in the current snapshot, so consistency is the best lever.',
      owner: 'operations',
      urgency: 'today',
      estimatedImpact: 'Protect current momentum',
      actionType: 'client_experience',
    });
  }

  return moves.slice(0, 5);
}

function buildWatchList(input: ExecutiveBriefingInput): string[] {
  const items: string[] = [];

  if (input.marketing.reviewVelocity < 1) {
    items.push('Review velocity is soft and may need a fresh request push.');
  }

  if (input.loyalty.churnedMembers > input.loyalty.newMembers) {
    items.push('Membership churn is outpacing new member starts.');
  }

  if (input.schedule.consultCount === 0) {
    items.push('No consults are visible in today’s schedule snapshot.');
  }

  if (input.cashFlow.bankBalance != null && input.cashFlow.bankBalance < 10000) {
    items.push('Cash position is below the preferred comfort threshold.');
  }

  if (input.clientGrowth && input.clientGrowth.netGrowth <= 0) {
    items.push('Client growth is flat to negative, so retention needs a closer daily look.');
  }

  const providerPressure = getProviderPressure(input.providerPerformance);
  if (providerPressure && providerPressure.noShowRate >= 15) {
    items.push(`${providerPressure.provider} has a rising no-show pattern worth tightening up.`);
  }

  return items.slice(0, 4);
}

function getProviderPressure(
  providerPerformance?: Record<string, { revenue: number; appointments: number; shows: number; noShows: number }>
): ProviderPressureSignal | null {
  if (!providerPerformance) return null;

  const ranked = Object.entries(providerPerformance)
    .map(([provider, stats]) => {
      const noShowRate = stats.appointments > 0 ? (stats.noShows / stats.appointments) * 100 : 0;
      const revenuePerAppointment = stats.shows > 0 ? stats.revenue / stats.shows : 0;
      return { provider, noShowRate, revenuePerAppointment };
    })
    .filter((signal) => signal.noShowRate > 0 || signal.revenuePerAppointment > 0)
    .sort((a, b) => (b.noShowRate - a.noShowRate) || (a.revenuePerAppointment - b.revenuePerAppointment));

  return ranked[0] ?? null;
}

function deriveStatus(scorecard: ExecutiveScorecard, pressurePoints: ExecutivePressurePoint[]): ExecutiveStatus {
  if (
    scorecard.criticalAlerts > 0 ||
    pressurePoints.some((point) => point.severity === 'critical')
  ) {
    return 'critical';
  }

  if (
    scorecard.openGaps >= 2 ||
    scorecard.warningAlerts > 0 ||
    pressurePoints.some((point) => point.severity === 'warning')
  ) {
    return 'watch';
  }

  return 'strong';
}

function buildHeadline(status: ExecutiveStatus, scorecard: ExecutiveScorecard, topMoves: ExecutiveMove[]): string {
  if (status === 'critical') {
    return `Protect operations first: ${scorecard.criticalAlerts} critical alert${scorecard.criticalAlerts === 1 ? '' : 's'} need immediate attention.`;
  }

  if (status === 'watch') {
    return topMoves[0]
      ? `${topMoves[0].title} is the highest-leverage move today.`
      : 'Momentum is good, but a few operational signals need active attention.';
  }

  return `Operations are steady with ${scorecard.appointmentsToday} appointments and a ${formatCurrency(scorecard.bankBalance)} cash position.`;
}

function buildSummary(
  status: ExecutiveStatus,
  scorecard: ExecutiveScorecard,
  pressurePoints: ExecutivePressurePoint[],
): string {
  const pressureSummary = pressurePoints.length
    ? `${pressurePoints.length} pressure point${pressurePoints.length === 1 ? '' : 's'} surfaced`
    : 'no meaningful pressure points surfaced';

  if (status === 'critical') {
    return `The clinic needs active intervention today: ${pressureSummary}, ${scorecard.openGaps} schedule gaps, and ${scorecard.consultsToday} consult${scorecard.consultsToday === 1 ? '' : 's'} on deck.`;
  }

  if (status === 'watch') {
    return `The business is stable but needs operator attention: ${pressureSummary}, ${scorecard.newLeads} new lead${scorecard.newLeads === 1 ? '' : 's'}, and ${scorecard.consultsToday} consult${scorecard.consultsToday === 1 ? '' : 's'} in the schedule snapshot.`;
  }

  return `The clinic is running from a position of strength: ${pressureSummary}, ${scorecard.newLeads} new lead${scorecard.newLeads === 1 ? '' : 's'}, and ${formatCurrency(scorecard.yesterdayRevenue)} in revenue.`;
}

export function buildExecutiveBriefing(input: ExecutiveBriefingInput): ExecutiveBriefing {
  const scorecard = buildScorecard(input);
  const pressurePoints = buildPressurePoints(input);
  const topMoves = buildTopMoves(input);
  const watchList = buildWatchList(input);
  const status = deriveStatus(scorecard, pressurePoints);

  return {
    status,
    headline: buildHeadline(status, scorecard, topMoves),
    summary: buildSummary(status, scorecard, pressurePoints),
    scorecard,
    topMoves,
    pressurePoints,
    watchList,
  };
}
