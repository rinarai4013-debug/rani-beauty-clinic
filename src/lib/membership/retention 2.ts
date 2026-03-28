/**
 * Membership Retention Engine — Rani Beauty Clinic
 *
 * Intelligent retention system for membership program:
 * - Churn prediction with membership-specific signals
 * - Engagement scoring (credit usage, visits, add-ons)
 * - At-risk member detection
 * - Save offers and win-back campaigns
 * - NPS tracking
 * - Satisfaction surveys at key milestones
 * - Retention analytics by tier, join month, provider
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type { MembershipTier, MembershipStatus } from './plans';
import { PLANS } from './plans';
import type { MemberBenefits } from './benefits';
import { calculateUtilizationScore } from './benefits';
import type { MemberBilling } from './billing';

// ── Types ────────────────────────────────────────────────────────────────

export interface MemberRetentionProfile {
  memberId: string;
  clientId: string;
  clientName: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinDate: string;
  monthsAsMember: number;

  // Engagement
  engagementScore: number; // 0-100
  engagementTrend: 'improving' | 'stable' | 'declining';
  creditUsageRate: number; // 0-100 percentage
  visitFrequency: number; // visits per month
  addOnPurchases: number; // count of add-on purchases
  lastVisitDate?: string;
  daysSinceLastVisit: number;

  // Risk
  churnRisk: 'low' | 'moderate' | 'high' | 'critical';
  churnScore: number; // 0-100
  riskFactors: RiskFactor[];

  // Satisfaction
  npsScore?: number; // -100 to 100
  npsCategory?: 'promoter' | 'passive' | 'detractor';
  lastSurveyDate?: string;
  surveysDue: number[];

  // Billing health
  paymentIssues: boolean;
  failedPaymentCount: number;

  // Recommendations
  retentionActions: RetentionAction[];
}

export interface RiskFactor {
  factor: string;
  score: number; // Contribution to churn score
  weight: number;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RetentionAction {
  id: string;
  type: RetentionActionType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  suggestedDate?: string;
  estimatedImpact: number; // 0-100, higher = more likely to retain
  automated: boolean;
}

export type RetentionActionType =
  | 'personal_outreach'
  | 'save_offer'
  | 'upgrade_incentive'
  | 'usage_reminder'
  | 'event_invitation'
  | 'satisfaction_survey'
  | 'win_back'
  | 'referral_prompt'
  | 'provider_check_in'
  | 'credit_bonus';

export interface EngagementInput {
  creditUsageRate: number; // 0-1 (percentage of credits used)
  visitFrequency: number; // visits per month
  addOnPurchaseCount: number;
  daysSinceLastVisit: number;
  guestPassUsage: number; // 0-1
  eventAttendance: number; // 0-1
  referralCount: number;
  monthsAsMember: number;
}

export interface SaveOffer {
  id: string;
  memberId: string;
  type: SaveOfferType;
  title: string;
  description: string;
  value: number;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

export type SaveOfferType =
  | 'free_upgrade_month'
  | 'credit_bonus'
  | 'price_lock'
  | 'downgrade_offer'
  | 'pause_offer'
  | 'complimentary_treatment'
  | 'extended_rollover';

export interface WinBackCampaign {
  id: string;
  memberId: string;
  clientName: string;
  previousTier: MembershipTier;
  cancelledAt: string;
  cancellationReason?: string;
  daysSinceCancellation: number;
  campaign: WinBackStep[];
  currentStep: number;
  status: 'active' | 'won_back' | 'exhausted' | 'opted_out';
}

export interface WinBackStep {
  step: number;
  dayAfterCancellation: number;
  channel: 'email' | 'sms' | 'phone';
  template: string;
  offer?: string;
  sent: boolean;
  sentAt?: string;
  responded: boolean;
  respondedAt?: string;
}

export interface NPSEntry {
  memberId: string;
  score: number; // 0-10
  category: 'promoter' | 'passive' | 'detractor';
  feedback?: string;
  surveyType: 'milestone' | 'periodic' | 'post_treatment' | 'exit';
  milestoneDays?: number;
  createdAt: string;
}

export interface RetentionAnalytics {
  overallRetentionRate: number;
  monthlyChurnRate: number;
  voluntaryChurnRate: number;
  involuntaryChurnRate: number;
  averageMembershipDuration: number; // months
  npsAverage: number;
  npsByTier: Record<MembershipTier, number>;
  retentionByTier: Record<MembershipTier, number>;
  retentionByJoinMonth: { month: string; retained: number; churned: number; rate: number }[];
  retentionByProvider: { provider: string; retained: number; churned: number; rate: number }[];
  atRiskCount: number;
  saveOfferAcceptRate: number;
  winBackRate: number;
  topChurnReasons: { reason: string; count: number; percentage: number }[];
}

// ── Engagement Scoring ───────────────────────────────────────────────────

const ENGAGEMENT_WEIGHTS = {
  creditUsage: 0.30,
  visitFrequency: 0.25,
  recency: 0.20,
  addOns: 0.10,
  social: 0.10, // guest passes + events + referrals
  tenure: 0.05,
};

/**
 * Calculate engagement score (0-100).
 * Higher = more engaged, lower churn risk.
 */
export function calculateEngagementScore(input: EngagementInput): {
  score: number;
  breakdown: Record<string, number>;
} {
  // Credit usage (0-100)
  const creditScore = Math.min(input.creditUsageRate * 100, 100);

  // Visit frequency (0-100) - Target: 1-2 visits/month
  let visitScore = 0;
  if (input.visitFrequency >= 2) visitScore = 100;
  else if (input.visitFrequency >= 1.5) visitScore = 90;
  else if (input.visitFrequency >= 1) visitScore = 75;
  else if (input.visitFrequency >= 0.5) visitScore = 50;
  else if (input.visitFrequency > 0) visitScore = 25;

  // Recency (0-100)
  let recencyScore = 100;
  if (input.daysSinceLastVisit > 90) recencyScore = 5;
  else if (input.daysSinceLastVisit > 60) recencyScore = 20;
  else if (input.daysSinceLastVisit > 45) recencyScore = 40;
  else if (input.daysSinceLastVisit > 30) recencyScore = 60;
  else if (input.daysSinceLastVisit > 14) recencyScore = 80;

  // Add-on purchases (0-100)
  const addOnScore = Math.min(input.addOnPurchaseCount * 25, 100);

  // Social engagement (guest passes, events, referrals)
  const socialScore = Math.min(
    (input.guestPassUsage * 30) + (input.eventAttendance * 30) + (input.referralCount * 20),
    100,
  );

  // Tenure (longer = slightly more engaged baseline)
  const tenureScore = Math.min(input.monthsAsMember * 5, 100);

  const score = Math.round(
    creditScore * ENGAGEMENT_WEIGHTS.creditUsage +
    visitScore * ENGAGEMENT_WEIGHTS.visitFrequency +
    recencyScore * ENGAGEMENT_WEIGHTS.recency +
    addOnScore * ENGAGEMENT_WEIGHTS.addOns +
    socialScore * ENGAGEMENT_WEIGHTS.social +
    tenureScore * ENGAGEMENT_WEIGHTS.tenure
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      creditUsage: Math.round(creditScore),
      visitFrequency: Math.round(visitScore),
      recency: Math.round(recencyScore),
      addOns: Math.round(addOnScore),
      social: Math.round(socialScore),
      tenure: Math.round(tenureScore),
    },
  };
}

// ── Membership Churn Prediction ──────────────────────────────────────────

const CHURN_WEIGHTS = {
  engagement: 0.35,
  creditUsage: 0.20,
  paymentHealth: 0.15,
  tenure: 0.10,
  satisfaction: 0.10,
  visitRecency: 0.10,
};

/**
 * Predict membership churn risk.
 * Combines engagement score with membership-specific signals.
 */
export function predictMembershipChurn(input: {
  engagementScore: number;
  creditUsageRate: number;
  failedPaymentCount: number;
  monthsAsMember: number;
  npsScore?: number;
  daysSinceLastVisit: number;
  status: MembershipStatus;
}): {
  score: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  factors: RiskFactor[];
} {
  // Invert engagement (low engagement = high churn risk)
  const engagementRisk = 100 - input.engagementScore;

  // Credit usage risk (low usage = high risk)
  const creditRisk = Math.round((1 - input.creditUsageRate) * 100);

  // Payment health risk
  let paymentRisk = 0;
  if (input.failedPaymentCount >= 3) paymentRisk = 100;
  else if (input.failedPaymentCount === 2) paymentRisk = 70;
  else if (input.failedPaymentCount === 1) paymentRisk = 40;

  // Tenure risk (newer members churn more)
  let tenureRisk = 0;
  if (input.monthsAsMember < 2) tenureRisk = 60;
  else if (input.monthsAsMember < 4) tenureRisk = 40;
  else if (input.monthsAsMember < 6) tenureRisk = 25;
  else if (input.monthsAsMember < 12) tenureRisk = 15;
  else tenureRisk = 5;

  // Satisfaction risk (based on NPS if available)
  let satisfactionRisk = 30; // Default moderate if no NPS
  if (input.npsScore !== undefined) {
    if (input.npsScore <= 6) satisfactionRisk = 80; // Detractor
    else if (input.npsScore <= 8) satisfactionRisk = 30; // Passive
    else satisfactionRisk = 5; // Promoter
  }

  // Visit recency risk
  let recencyRisk = 0;
  if (input.daysSinceLastVisit > 90) recencyRisk = 95;
  else if (input.daysSinceLastVisit > 60) recencyRisk = 70;
  else if (input.daysSinceLastVisit > 45) recencyRisk = 50;
  else if (input.daysSinceLastVisit > 30) recencyRisk = 30;
  else if (input.daysSinceLastVisit > 14) recencyRisk = 10;

  // Status override
  if (input.status === 'suspended') {
    return {
      score: 95,
      risk: 'critical',
      factors: [{ factor: 'Suspended', score: 95, weight: 100, detail: 'Membership is suspended', severity: 'high' }],
    };
  }

  const score = Math.round(
    engagementRisk * CHURN_WEIGHTS.engagement +
    creditRisk * CHURN_WEIGHTS.creditUsage +
    paymentRisk * CHURN_WEIGHTS.paymentHealth +
    tenureRisk * CHURN_WEIGHTS.tenure +
    satisfactionRisk * CHURN_WEIGHTS.satisfaction +
    recencyRisk * CHURN_WEIGHTS.visitRecency
  );

  const clampedScore = Math.min(100, Math.max(0, score));

  const risk: 'low' | 'moderate' | 'high' | 'critical' =
    clampedScore >= 75 ? 'critical' :
    clampedScore >= 50 ? 'high' :
    clampedScore >= 25 ? 'moderate' :
    'low';

  const factors: RiskFactor[] = [
    {
      factor: 'Engagement',
      score: engagementRisk,
      weight: CHURN_WEIGHTS.engagement * 100,
      detail: `Engagement score: ${input.engagementScore}/100`,
      severity: engagementRisk > 60 ? 'high' : engagementRisk > 30 ? 'medium' : 'low',
    },
    {
      factor: 'Credit Usage',
      score: creditRisk,
      weight: CHURN_WEIGHTS.creditUsage * 100,
      detail: `Using ${Math.round(input.creditUsageRate * 100)}% of monthly credits`,
      severity: creditRisk > 60 ? 'high' : creditRisk > 30 ? 'medium' : 'low',
    },
    {
      factor: 'Payment Health',
      score: paymentRisk,
      weight: CHURN_WEIGHTS.paymentHealth * 100,
      detail: input.failedPaymentCount > 0
        ? `${input.failedPaymentCount} failed payment(s)`
        : 'Payments current',
      severity: paymentRisk > 60 ? 'high' : paymentRisk > 30 ? 'medium' : 'low',
    },
    {
      factor: 'Tenure',
      score: tenureRisk,
      weight: CHURN_WEIGHTS.tenure * 100,
      detail: `${input.monthsAsMember} months as member`,
      severity: tenureRisk > 40 ? 'high' : tenureRisk > 20 ? 'medium' : 'low',
    },
    {
      factor: 'Satisfaction',
      score: satisfactionRisk,
      weight: CHURN_WEIGHTS.satisfaction * 100,
      detail: input.npsScore !== undefined ? `NPS score: ${input.npsScore}` : 'No NPS data',
      severity: satisfactionRisk > 60 ? 'high' : satisfactionRisk > 30 ? 'medium' : 'low',
    },
    {
      factor: 'Visit Recency',
      score: recencyRisk,
      weight: CHURN_WEIGHTS.visitRecency * 100,
      detail: `Last visit ${input.daysSinceLastVisit} days ago`,
      severity: recencyRisk > 60 ? 'high' : recencyRisk > 30 ? 'medium' : 'low',
    },
  ];

  return { score: clampedScore, risk, factors };
}

// ── At-Risk Detection ────────────────────────────────────────────────────

/**
 * Identify at-risk members from a list.
 */
export function identifyAtRiskMembers(
  profiles: MemberRetentionProfile[],
  threshold: number = 50,
): MemberRetentionProfile[] {
  return profiles
    .filter(p => p.churnScore >= threshold && p.status === 'active')
    .sort((a, b) => b.churnScore - a.churnScore);
}

/**
 * Generate recommended retention actions for a member.
 */
export function generateRetentionActions(profile: MemberRetentionProfile): RetentionAction[] {
  const actions: RetentionAction[] = [];

  // Credit usage is low
  if (profile.creditUsageRate < 30) {
    actions.push({
      id: `act_usage_${profile.memberId}`,
      type: 'usage_reminder',
      priority: profile.creditUsageRate < 10 ? 'high' : 'medium',
      title: 'Send credit usage reminder',
      description: `${profile.clientName} is only using ${Math.round(profile.creditUsageRate)}% of their monthly credits. Send a personalized treatment recommendation to encourage booking.`,
      estimatedImpact: 35,
      automated: true,
    });
  }

  // Haven't visited recently
  if (profile.daysSinceLastVisit > 30) {
    actions.push({
      id: `act_outreach_${profile.memberId}`,
      type: 'personal_outreach',
      priority: profile.daysSinceLastVisit > 60 ? 'urgent' : 'high',
      title: 'Personal outreach',
      description: `${profile.clientName} hasn't visited in ${profile.daysSinceLastVisit} days. ${profile.daysSinceLastVisit > 60 ? 'Provider call recommended.' : 'Send a personalized "we miss you" message.'}`,
      estimatedImpact: profile.daysSinceLastVisit > 60 ? 50 : 30,
      automated: false,
    });
  }

  // Payment issues
  if (profile.paymentIssues) {
    actions.push({
      id: `act_payment_${profile.memberId}`,
      type: 'personal_outreach',
      priority: 'urgent',
      title: 'Resolve payment issues',
      description: `${profile.clientName} has ${profile.failedPaymentCount} failed payment(s). Reach out to help update payment method before suspension.`,
      estimatedImpact: 60,
      automated: false,
    });
  }

  // High churn risk — offer save deal
  if (profile.churnScore >= 60) {
    actions.push({
      id: `act_save_${profile.memberId}`,
      type: 'save_offer',
      priority: 'high',
      title: 'Present a save offer',
      description: `${profile.clientName} is at high risk of churning (score: ${profile.churnScore}). Consider offering bonus credits or a complimentary treatment.`,
      estimatedImpact: 45,
      automated: false,
    });
  }

  // Eligible for upgrade
  if (profile.tier !== 'elite' && profile.engagementScore > 70) {
    actions.push({
      id: `act_upgrade_${profile.memberId}`,
      type: 'upgrade_incentive',
      priority: 'low',
      title: 'Suggest tier upgrade',
      description: `${profile.clientName} is highly engaged. They may benefit from upgrading to ${profile.tier === 'halo' ? 'Glow' : 'Elite'} for additional benefits.`,
      estimatedImpact: 25,
      automated: true,
    });
  }

  // Survey due
  if (profile.surveysDue.length > 0) {
    actions.push({
      id: `act_survey_${profile.memberId}`,
      type: 'satisfaction_survey',
      priority: 'medium',
      title: 'Send satisfaction survey',
      description: `${profile.clientName} is due for their ${profile.surveysDue[0]}-day membership check-in.`,
      estimatedImpact: 20,
      automated: true,
    });
  }

  // Referral prompt for engaged members
  if (profile.engagementScore > 60 && profile.churnScore < 30) {
    actions.push({
      id: `act_referral_${profile.memberId}`,
      type: 'referral_prompt',
      priority: 'low',
      title: 'Prompt for referral',
      description: `${profile.clientName} is a satisfied member — a perfect candidate for a referral ask.`,
      estimatedImpact: 15,
      automated: true,
    });
  }

  return actions.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── Win-Back Campaigns ───────────────────────────────────────────────────

/**
 * Create a win-back campaign for a cancelled member.
 */
export function createWinBackCampaign(
  memberId: string,
  clientName: string,
  previousTier: MembershipTier,
  cancelledAt: string,
  cancellationReason?: string,
): WinBackCampaign {
  const daysSinceCancellation = Math.floor(
    (Date.now() - new Date(cancelledAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const campaign: WinBackStep[] = [
    {
      step: 1,
      dayAfterCancellation: 3,
      channel: 'email',
      template: 'win_back_gentle',
      sent: false,
      responded: false,
    },
    {
      step: 2,
      dayAfterCancellation: 14,
      channel: 'email',
      template: 'win_back_offer',
      offer: 'Rejoin and receive $100 in bonus treatment credits',
      sent: false,
      responded: false,
    },
    {
      step: 3,
      dayAfterCancellation: 30,
      channel: 'sms',
      template: 'win_back_sms',
      offer: 'Exclusive return offer: first month 50% off',
      sent: false,
      responded: false,
    },
    {
      step: 4,
      dayAfterCancellation: 60,
      channel: 'email',
      template: 'win_back_final',
      offer: 'Last chance: founding member rates for returning members',
      sent: false,
      responded: false,
    },
    {
      step: 5,
      dayAfterCancellation: 90,
      channel: 'phone',
      template: 'win_back_call',
      sent: false,
      responded: false,
    },
  ];

  return {
    id: `wb_${memberId}_${Date.now().toString(36)}`,
    memberId,
    clientName,
    previousTier,
    cancelledAt,
    cancellationReason,
    daysSinceCancellation,
    campaign,
    currentStep: 0,
    status: 'active',
  };
}

/**
 * Get the next win-back step to execute.
 */
export function getNextWinBackStep(campaign: WinBackCampaign): WinBackStep | null {
  if (campaign.status !== 'active') return null;

  const now = new Date();
  const cancelDate = new Date(campaign.cancelledAt);
  const daysSinceCancellation = Math.floor(
    (now.getTime() - cancelDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (const step of campaign.campaign) {
    if (!step.sent && daysSinceCancellation >= step.dayAfterCancellation) {
      return step;
    }
  }

  return null;
}

// ── NPS Management ───────────────────────────────────────────────────────

/**
 * Classify an NPS score into promoter/passive/detractor.
 */
export function classifyNPS(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/**
 * Calculate the aggregate NPS from individual scores.
 */
export function calculateAggregateNPS(entries: NPSEntry[]): number {
  if (entries.length === 0) return 0;

  const promoters = entries.filter(e => e.category === 'promoter').length;
  const detractors = entries.filter(e => e.category === 'detractor').length;

  return Math.round(((promoters - detractors) / entries.length) * 100);
}

/**
 * Calculate NPS by tier.
 */
export function calculateNPSByTier(
  entries: NPSEntry[],
  memberTiers: Record<string, MembershipTier>,
): Record<MembershipTier, number> {
  const byTier: Record<MembershipTier, NPSEntry[]> = {
    halo: [], glow: [], elite: [],
  };

  for (const entry of entries) {
    const tier = memberTiers[entry.memberId];
    if (tier) byTier[tier].push(entry);
  }

  return {
    halo: calculateAggregateNPS(byTier.halo),
    glow: calculateAggregateNPS(byTier.glow),
    elite: calculateAggregateNPS(byTier.elite),
  };
}

// ── Retention Analytics ──────────────────────────────────────────────────

/**
 * Build comprehensive retention analytics.
 */
export function buildRetentionAnalytics(input: {
  activeMembers: MemberRetentionProfile[];
  cancelledMembers: { memberId: string; tier: MembershipTier; joinDate: string; cancelledAt: string; reason?: string; voluntary: boolean }[];
  npsEntries: NPSEntry[];
  memberTiers: Record<string, MembershipTier>;
  saveOffers: { accepted: number; total: number };
  winBacks: { won: number; total: number };
  totalMonths?: number; // Period to calculate over
}): RetentionAnalytics {
  const totalMembers = input.activeMembers.length + input.cancelledMembers.length;
  const periodMonths = input.totalMonths || 12;

  // Churn rates
  const voluntaryChurned = input.cancelledMembers.filter(m => m.voluntary).length;
  const involuntaryChurned = input.cancelledMembers.filter(m => !m.voluntary).length;
  const totalChurned = input.cancelledMembers.length;

  const monthlyChurnRate = totalMembers > 0
    ? Math.round((totalChurned / totalMembers / periodMonths) * 10000) / 100
    : 0;
  const voluntaryChurnRate = totalMembers > 0
    ? Math.round((voluntaryChurned / totalMembers / periodMonths) * 10000) / 100
    : 0;
  const involuntaryChurnRate = totalMembers > 0
    ? Math.round((involuntaryChurned / totalMembers / periodMonths) * 10000) / 100
    : 0;
  const overallRetentionRate = 100 - (monthlyChurnRate * periodMonths);

  // Average membership duration
  const allDurations = [
    ...input.activeMembers.map(m => m.monthsAsMember),
    ...input.cancelledMembers.map(m => {
      const join = new Date(m.joinDate);
      const cancel = new Date(m.cancelledAt);
      return Math.max(1, Math.round((cancel.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    }),
  ];
  const averageMembershipDuration = allDurations.length > 0
    ? Math.round(allDurations.reduce((s, d) => s + d, 0) / allDurations.length * 10) / 10
    : 0;

  // NPS
  const npsAverage = calculateAggregateNPS(input.npsEntries);
  const npsByTier = calculateNPSByTier(input.npsEntries, input.memberTiers);

  // Retention by tier
  const retentionByTier: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  for (const tier of ['halo', 'glow', 'elite'] as MembershipTier[]) {
    const tierTotal = input.activeMembers.filter(m => m.tier === tier).length +
      input.cancelledMembers.filter(m => m.tier === tier).length;
    const tierActive = input.activeMembers.filter(m => m.tier === tier).length;
    retentionByTier[tier] = tierTotal > 0 ? Math.round((tierActive / tierTotal) * 100) : 100;
  }

  // Retention by join month
  const joinMonths = new Map<string, { retained: number; churned: number }>();
  for (const m of input.activeMembers) {
    const month = m.joinDate.substring(0, 7);
    const entry = joinMonths.get(month) || { retained: 0, churned: 0 };
    entry.retained++;
    joinMonths.set(month, entry);
  }
  for (const m of input.cancelledMembers) {
    const month = m.joinDate.substring(0, 7);
    const entry = joinMonths.get(month) || { retained: 0, churned: 0 };
    entry.churned++;
    joinMonths.set(month, entry);
  }
  const retentionByJoinMonth = Array.from(joinMonths.entries())
    .map(([month, { retained, churned }]) => ({
      month,
      retained,
      churned,
      rate: Math.round((retained / (retained + churned)) * 100),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // At-risk count
  const atRiskCount = input.activeMembers.filter(m => m.churnScore >= 50).length;

  // Top churn reasons
  const reasonCounts = new Map<string, number>();
  for (const m of input.cancelledMembers) {
    const reason = m.reason || 'unknown';
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  }
  const topChurnReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalChurned > 0 ? Math.round((count / totalChurned) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    overallRetentionRate: Math.max(0, Math.round(overallRetentionRate * 10) / 10),
    monthlyChurnRate,
    voluntaryChurnRate,
    involuntaryChurnRate,
    averageMembershipDuration,
    npsAverage,
    npsByTier,
    retentionByTier,
    retentionByJoinMonth,
    retentionByProvider: [], // Would come from appointment data
    atRiskCount,
    saveOfferAcceptRate: input.saveOffers.total > 0
      ? Math.round((input.saveOffers.accepted / input.saveOffers.total) * 100)
      : 0,
    winBackRate: input.winBacks.total > 0
      ? Math.round((input.winBacks.won / input.winBacks.total) * 100)
      : 0,
    topChurnReasons,
  };
}

// ── Satisfaction Surveys ─────────────────────────────────────────────────

export const SURVEY_MILESTONES = [30, 90, 180, 365] as const;

/**
 * Get surveys that are due for a member.
 */
export function getSurveysDue(
  joinDate: string,
  completedMilestones: number[],
  now?: Date,
): number[] {
  const currentDate = now || new Date();
  const join = new Date(joinDate);
  const daysSinceJoin = Math.floor(
    (currentDate.getTime() - join.getTime()) / (1000 * 60 * 60 * 24)
  );

  return SURVEY_MILESTONES.filter(
    milestone => daysSinceJoin >= milestone && !completedMilestones.includes(milestone)
  );
}

/**
 * Create an NPS entry.
 */
export function createNPSEntry(
  memberId: string,
  score: number,
  surveyType: NPSEntry['surveyType'],
  feedback?: string,
  milestoneDays?: number,
): NPSEntry {
  return {
    memberId,
    score: Math.min(10, Math.max(0, score)),
    category: classifyNPS(score),
    feedback,
    surveyType,
    milestoneDays,
    createdAt: new Date().toISOString(),
  };
}
