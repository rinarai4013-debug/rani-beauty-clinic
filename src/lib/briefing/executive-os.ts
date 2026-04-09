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
  activeConsults: number;
  consultPipelineValue: number;
  stuckConsults: number;
  reviewNeeded: number;
  openGaps: number;
  criticalAlerts: number;
  warningAlerts: number;
  financingRevenue: number;
  newLeads: number;
  reviewVelocity: number;
  bankBalance: number | null;
  membershipMRR: number;
  referralRevenue: number;
  reactivationValue: number;
  highPriorityReactivationCount: number;
  providerPressureProvider: string | null;
  fillValue: number;
  financingReadyConsults: number;
  avgConsultCloseProbability: number;
  topGrowthChannel: string | null;
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
  consults?: {
    activeConsults: number;
    weightedPipelineValue: number;
    stuckCount: number;
    staleCount: number;
    reviewNeededCount: number;
    bookedCount: number;
    financingReadyCount: number;
    avgCloseProbability: number;
    topPriority:
      | {
          patientName: string;
          action: string;
          estimatedValue: number;
        }
      | null;
    topOpportunities: {
      patientName: string;
      action: string;
      estimatedValue: number;
      closeProbability: number;
      clinicStatus: string;
      financingReady?: boolean;
    }[];
  };
  reactivation?: {
    totalRecoverableValue: number;
    lapsed30: number;
    lapsed60: number;
    lapsed90: number;
    churned: number;
    highPriorityCount: number;
    topOpportunities: {
      clientName: string;
      status: string;
      preferredContact: string;
      estimatedValue: number;
      priority: 'high' | 'medium' | 'low';
      action: string;
    }[];
  };
  providerInsights?: {
    pressureProvider: string | null;
    underfilledProviders: number;
    openGapCount: number;
    topEntries: {
      provider: string;
      noShowRate: number;
      revenuePerShow: number;
      gapCount: number;
      status: 'underfilled' | 'watch' | 'strong';
      recommendation: string;
    }[];
  };
  fill?: {
    openGapCount: number;
    totalRecoverableValue: number;
    topOpportunities: {
      provider: string;
      startTime: string;
      duration: number;
      suggestedService: string;
      suggestedAction: 'outreach_lapsed' | 'book_consult' | 'offer_walkin';
      estimatedValue: number;
    }[];
  };
  growth?: {
    topChannel: string | null;
    weakestChannel: string | null;
    referralRevenue: number;
    topChannels: {
      channel: string;
      leads: number;
      estimatedRevenue: number;
      efficiency: 'strong' | 'watch' | 'weak';
    }[];
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
    activeConsults: input.consults?.activeConsults ?? 0,
    consultPipelineValue: input.consults?.weightedPipelineValue ?? 0,
    stuckConsults: input.consults?.stuckCount ?? 0,
    reviewNeeded: input.consults?.reviewNeededCount ?? 0,
    openGaps: input.schedule.gaps.length,
    criticalAlerts: input.alerts.bySeverity.critical,
    warningAlerts: input.alerts.bySeverity.warning,
    financingRevenue: input.revenue.financingTotal,
    newLeads: input.marketing.newLeads,
    reviewVelocity: input.marketing.reviewVelocity,
    bankBalance: input.cashFlow.bankBalance,
    membershipMRR: input.loyalty.membershipMRR,
    referralRevenue: input.referrals.revenueAttributed,
    reactivationValue: input.reactivation?.totalRecoverableValue ?? 0,
    highPriorityReactivationCount: input.reactivation?.highPriorityCount ?? 0,
    providerPressureProvider: input.providerInsights?.pressureProvider ?? null,
    fillValue: input.fill?.totalRecoverableValue ?? 0,
    financingReadyConsults: input.consults?.financingReadyCount ?? 0,
    avgConsultCloseProbability: input.consults?.avgCloseProbability ?? 0,
    topGrowthChannel: input.growth?.topChannel ?? null,
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

  if ((input.consults?.stuckCount ?? 0) > 0) {
    points.push({
      label: 'Stalled consult value',
      severity: input.consults!.stuckCount >= 3 ? 'warning' : 'info',
      detail: `${input.consults!.stuckCount} consult${input.consults!.stuckCount === 1 ? '' : 's'} are stalled in the pipeline with ${formatCurrency(input.consults!.weightedPipelineValue)} still in play.`,
    });
  }

  if ((input.consults?.reviewNeededCount ?? 0) > 0) {
    points.push({
      label: 'Provider review backlog',
      severity: 'warning',
      detail: `${input.consults!.reviewNeededCount} consult plan${input.consults!.reviewNeededCount === 1 ? '' : 's'} need provider review before they can advance.`,
    });
  }

  if ((input.consults?.financingReadyCount ?? 0) > 0) {
    points.push({
      label: 'Financing-ready consults',
      severity: 'info',
      detail: `${input.consults!.financingReadyCount} consult${input.consults!.financingReadyCount === 1 ? '' : 's'} are large enough to warrant financing-forward follow-up.`,
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
  const providerInsight = input.providerInsights?.topEntries[0];
  if (providerPressure) {
    points.push({
      label: 'Provider friction',
      severity: providerPressure.noShowRate >= 20 ? 'warning' : 'info',
      detail: `${providerPressure.provider} is carrying a ${Math.round(providerPressure.noShowRate)}% no-show rate and ${formatCurrency(providerPressure.revenuePerAppointment)} per appointment.`,
    });
  }

  if ((input.reactivation?.highPriorityCount ?? 0) > 0) {
    points.push({
      label: 'Reactivation backlog',
      severity: input.reactivation!.highPriorityCount >= 3 ? 'warning' : 'info',
      detail: `${input.reactivation!.highPriorityCount} high-priority win-back client${input.reactivation!.highPriorityCount === 1 ? '' : 's'} represent ${formatCurrency(input.reactivation!.totalRecoverableValue)} in recoverable value.`,
    });
  }

  if (providerInsight && providerInsight.status === 'underfilled') {
    points.push({
      label: 'Underfilled provider capacity',
      severity: 'warning',
      detail: `${providerInsight.provider} has ${providerInsight.gapCount} open gap${providerInsight.gapCount === 1 ? '' : 's'} and ${providerInsight.noShowRate}% no-show exposure this week.`,
    });
  }

  if ((input.fill?.openGapCount ?? 0) > 0) {
    points.push({
      label: 'Recoverable schedule value',
      severity: input.fill!.openGapCount >= 3 ? 'warning' : 'info',
      detail: `${input.fill!.openGapCount} open slot${input.fill!.openGapCount === 1 ? '' : 's'} hold ${formatCurrency(input.fill!.totalRecoverableValue)} in same-day recovery potential.`,
    });
  }

  if (input.growth?.weakestChannel) {
    points.push({
      label: 'Channel softness',
      severity: 'info',
      detail: `${input.growth.weakestChannel} is the weakest current channel and may need message or spend adjustment.`,
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
  const providerInsight = input.providerInsights?.topEntries[0];

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

  if (input.consults?.topPriority) {
    moves.push({
      title: `Move ${input.consults.topPriority.patientName} forward`,
      why: `${input.consults.topPriority.action} on a consult worth ${formatCurrency(input.consults.topPriority.estimatedValue)}.`,
      owner: input.consults.reviewNeededCount > 0 ? 'provider' : 'frontdesk',
      urgency: 'today',
      estimatedImpact: `Protect ${formatCurrency(input.consults.topPriority.estimatedValue)} of consult value`,
      actionType: 'revenue_recovery',
    });
  }

  if (input.consults?.topOpportunities[0]?.financingReady) {
    const financingTarget = input.consults.topOpportunities.find((consult) => consult.financingReady);
    if (financingTarget) {
      moves.push({
        title: `Close ${financingTarget.patientName} with financing`,
        why: `${financingTarget.patientName} is ${financingTarget.clinicStatus} with ${financingTarget.closeProbability}% close probability and a financing-sized plan.`,
        owner: 'provider',
        urgency: 'today',
        estimatedImpact: `Protect ${formatCurrency(financingTarget.estimatedValue)} with a payment-path follow-up`,
        actionType: 'revenue_recovery',
      });
    }
  }

  if (input.reactivation?.topOpportunities[0]) {
    const target = input.reactivation.topOpportunities[0];
    moves.push({
      title: `Win back ${target.clientName}`,
      why: `${target.status} is sitting in the highest-value reactivation slot and prefers ${target.preferredContact.toLowerCase()} outreach.`,
      owner: 'operations',
      urgency: target.priority === 'high' ? 'today' : 'this_week',
      estimatedImpact: `Recover ${formatCurrency(target.estimatedValue)} in lapsed value`,
      actionType: 'retention',
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

  if (providerInsight && providerInsight.status === 'underfilled') {
    moves.push({
      title: `Fill ${providerInsight.provider}'s open capacity`,
      why: providerInsight.recommendation,
      owner: 'frontdesk',
      urgency: 'today',
      estimatedImpact: `${providerInsight.gapCount} gap${providerInsight.gapCount === 1 ? '' : 's'} available for recovery`,
      actionType: 'schedule_fill',
    });
  }

  if (input.fill?.topOpportunities[0]) {
    const slot = input.fill.topOpportunities[0];
    moves.push({
      title: `Recover ${slot.provider}'s ${slot.startTime} slot`,
      why: `${slot.duration}-minute opening is best used for ${slot.suggestedService} with ${slot.suggestedAction.replace('_', ' ')} outreach.`,
      owner: 'frontdesk',
      urgency: 'today',
      estimatedImpact: `Recover ${formatCurrency(slot.estimatedValue)} of slot value`,
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

  if (input.growth?.topChannels[0]) {
    moves.push({
      title: `Double down on ${input.growth.topChannels[0].channel}`,
      why: `${input.growth.topChannels[0].channel} is currently the top growth channel by estimated value.`,
      owner: 'marketing',
      urgency: 'this_week',
      estimatedImpact: `Protect ${formatCurrency(input.growth.topChannels[0].estimatedRevenue)} of channel momentum`,
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

  return moves
    .sort((a, b) => scoreMove(b) - scoreMove(a))
    .slice(0, 10);
}

function scoreMove(move: ExecutiveMove): number {
  const urgencyScore = move.urgency === 'now' ? 30 : move.urgency === 'today' ? 20 : 10;
  const actionScore =
    move.actionType === 'revenue_recovery' ? 12 :
    move.actionType === 'retention' ? 11 :
    move.actionType === 'schedule_fill' ? 10 :
    move.actionType === 'risk_control' ? 9 :
    move.actionType === 'marketing' ? 7 :
    5;

  return urgencyScore + actionScore;
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

  if ((input.consults?.reviewNeededCount ?? 0) > 0) {
    items.push(`${input.consults!.reviewNeededCount} consult review${input.consults!.reviewNeededCount === 1 ? '' : 's'} are waiting on provider action.`);
  }

  if (input.cashFlow.bankBalance != null && input.cashFlow.bankBalance < 10000) {
    items.push('Cash position is below the preferred comfort threshold.');
  }

  if (input.clientGrowth && input.clientGrowth.netGrowth <= 0) {
    items.push('Client growth is flat to negative, so retention needs a closer daily look.');
  }

  if ((input.reactivation?.lapsed90 ?? 0) > 0) {
    items.push(`${input.reactivation!.lapsed90} clients are in the 90-day lapse bucket and should not sit idle.`);
  }

  if ((input.consults?.staleCount ?? 0) > 0) {
    items.push(`${input.consults!.staleCount} consult${input.consults!.staleCount === 1 ? '' : 's'} have been quiet for a week or more.`);
  }

  if (input.growth?.weakestChannel) {
    items.push(`${input.growth.weakestChannel} is currently the weakest growth channel.`);
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
