/**
 * Client Lifecycle Management for Rani Beauty Clinic CRM
 *
 * Stages: Prospect → First Visit → Active → Loyal → VIP → At-Risk → Dormant → Lost → Reactivated
 * Handles automatic transitions, milestone celebrations, retention risk, LTV projection, and win-back sequences.
 */

import type {
  ClientLifecycle,
  LifecycleStage,
  LifecycleTransitionRule,
  LifecycleMetrics,
  LifecycleMovement,
  Milestone,
  MilestoneType,
  TransitionCondition,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// TRANSITION RULES
// ─────────────────────────────────────────────────────────────

/**
 * Lifecycle transition rules ordered by priority (highest first).
 * Each rule evaluates conditions against client data and triggers stage changes.
 */
export const TRANSITION_RULES: LifecycleTransitionRule[] = [
  // Lost detection
  {
    from: '*',
    to: 'lost',
    conditions: [{ field: 'daysSinceLastVisit', operator: 'gt', value: 180 }],
    priority: 100,
  },
  // Dormant detection
  {
    from: '*',
    to: 'dormant',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'between', value: [91, 180] },
    ],
    priority: 95,
  },
  // At-Risk detection
  {
    from: 'active',
    to: 'at_risk',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'between', value: [46, 90] },
    ],
    priority: 90,
  },
  {
    from: 'loyal',
    to: 'at_risk',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'between', value: [46, 90] },
    ],
    priority: 89,
  },
  {
    from: 'vip',
    to: 'at_risk',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'between', value: [61, 90] },
    ],
    priority: 88,
  },
  // VIP promotion
  {
    from: 'loyal',
    to: 'vip',
    conditions: [
      { field: 'totalSpend', operator: 'gte', value: 5000 },
      { field: 'totalVisits', operator: 'gte', value: 10 },
    ],
    priority: 80,
  },
  // Loyal promotion
  {
    from: 'active',
    to: 'loyal',
    conditions: [
      { field: 'totalVisits', operator: 'gte', value: 5 },
      { field: 'totalSpend', operator: 'gte', value: 2000 },
      { field: 'daysSinceLastVisit', operator: 'lte', value: 45 },
    ],
    priority: 70,
  },
  // Active (returning client)
  {
    from: 'first_visit',
    to: 'active',
    conditions: [
      { field: 'totalVisits', operator: 'gte', value: 2 },
    ],
    priority: 60,
  },
  // First visit
  {
    from: 'prospect',
    to: 'first_visit',
    conditions: [
      { field: 'totalVisits', operator: 'gte', value: 1 },
    ],
    priority: 50,
  },
  // Reactivation
  {
    from: 'dormant',
    to: 'reactivated',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'lte', value: 14 },
      { field: 'totalVisits', operator: 'gte', value: 2 }, // returning after dormancy
    ],
    priority: 85,
  },
  {
    from: 'lost',
    to: 'reactivated',
    conditions: [
      { field: 'daysSinceLastVisit', operator: 'lte', value: 14 },
    ],
    priority: 84,
  },
  // Reactivated → Active
  {
    from: 'reactivated',
    to: 'active',
    conditions: [
      { field: 'totalVisits', operator: 'gte', value: 2 },
      { field: 'daysSinceLastVisit', operator: 'lte', value: 45 },
    ],
    priority: 75,
  },
];

// ─────────────────────────────────────────────────────────────
// LIFECYCLE EVALUATION
// ─────────────────────────────────────────────────────────────

export interface LifecycleInput {
  clientId: string;
  clientName: string;
  currentStage: LifecycleStage;
  totalVisits: number;
  totalSpend: number;
  avgTicket: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  hasMembership: boolean;
  membershipTier?: string;
  communicationPreference: 'email' | 'sms' | 'phone';
  visitDates: string[];
  transactionAmounts: number[];
  birthday?: string;
  firstVisitDate?: string;
}

/**
 * Evaluate a client's lifecycle stage and return recommended stage + milestones.
 */
export function evaluateLifecycle(input: LifecycleInput): ClientLifecycle {
  const newStage = determineStage(input);
  const milestones = evaluateMilestones(input);
  const projectedLTV = calculateProjectedLTV(input);
  const retentionRiskScore = calculateRetentionRisk(input);
  const nextMilestone = milestones.find(m => !m.achieved);

  return {
    clientId: input.clientId,
    clientName: input.clientName,
    stage: newStage,
    previousStage: newStage !== input.currentStage ? input.currentStage : undefined,
    enteredStageAt: new Date().toISOString(),
    daysInStage: 0,
    totalVisits: input.totalVisits,
    totalSpend: input.totalSpend,
    avgTicket: input.avgTicket,
    lastVisitDate: input.lastVisitDate,
    daysSinceLastVisit: input.daysSinceLastVisit,
    projectedLTV,
    retentionRiskScore,
    hasMembership: input.hasMembership,
    membershipTier: input.membershipTier,
    milestones,
    nextMilestone,
    communicationPreference: input.communicationPreference,
  };
}

/**
 * Determine the correct lifecycle stage based on transition rules.
 */
export function determineStage(input: LifecycleInput): LifecycleStage {
  // Sort rules by priority (highest first)
  const sortedRules = [...TRANSITION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Check if rule applies to current stage
    if (rule.from !== '*' && rule.from !== input.currentStage) continue;

    // Evaluate all conditions
    const allConditionsMet = rule.conditions.every(cond =>
      evaluateCondition(cond, input),
    );

    if (allConditionsMet) {
      return rule.to;
    }
  }

  return input.currentStage;
}

/**
 * Evaluate a single transition condition against client data.
 */
export function evaluateCondition(
  condition: TransitionCondition,
  input: LifecycleInput,
): boolean {
  const fieldValue = getFieldValue(condition.field, input);
  if (fieldValue === undefined) return false;

  switch (condition.operator) {
    case 'gt':
      return (fieldValue as number) > (condition.value as number);
    case 'lt':
      return (fieldValue as number) < (condition.value as number);
    case 'eq':
      return fieldValue === condition.value;
    case 'gte':
      return (fieldValue as number) >= (condition.value as number);
    case 'lte':
      return (fieldValue as number) <= (condition.value as number);
    case 'between': {
      const [min, max] = condition.value as number[];
      return (fieldValue as number) >= min && (fieldValue as number) <= max;
    }
    case 'in':
      return (condition.value as (string | number)[]).includes(fieldValue as string | number);
    default:
      return false;
  }
}

function getFieldValue(field: string, input: LifecycleInput): number | string | undefined {
  const fieldMap: Record<string, number | string | undefined> = {
    totalVisits: input.totalVisits,
    totalSpend: input.totalSpend,
    avgTicket: input.avgTicket,
    daysSinceLastVisit: input.daysSinceLastVisit,
    hasMembership: input.hasMembership ? 1 : 0,
    membershipTier: input.membershipTier,
  };
  return fieldMap[field];
}

// ─────────────────────────────────────────────────────────────
// MILESTONE CELEBRATIONS
// ─────────────────────────────────────────────────────────────

const MILESTONE_DEFINITIONS: {
  type: MilestoneType;
  label: string;
  targetValue: number;
  rewardOffered?: string;
}[] = [
  { type: 'visit_count', label: '5th Visit', targetValue: 5, rewardOffered: 'Complimentary add-on treatment' },
  { type: 'visit_count', label: '10th Visit', targetValue: 10, rewardOffered: 'Exclusive VIP upgrade' },
  { type: 'visit_count', label: '25th Visit', targetValue: 25, rewardOffered: 'Signature treatment complimentary' },
  { type: 'spend_threshold', label: '$1,000 Invested', targetValue: 1000, rewardOffered: 'Luxury skincare gift' },
  { type: 'spend_threshold', label: '$5,000 Invested', targetValue: 5000, rewardOffered: 'VIP membership upgrade' },
  { type: 'spend_threshold', label: '$10,000 Invested', targetValue: 10000, rewardOffered: 'Complimentary signature treatment' },
  { type: 'anniversary', label: '1 Year Anniversary', targetValue: 365, rewardOffered: 'Anniversary special package' },
  { type: 'anniversary', label: '2 Year Anniversary', targetValue: 730, rewardOffered: 'Loyalty appreciation gift' },
  { type: 'birthday', label: 'Birthday', targetValue: 0, rewardOffered: 'Birthday beauty package' },
  { type: 'referral_milestone', label: 'First Referral', targetValue: 1, rewardOffered: 'Referral credit' },
  { type: 'referral_milestone', label: '5 Referrals', targetValue: 5, rewardOffered: 'VIP referral ambassador status' },
];

/**
 * Evaluate all milestones for a client.
 */
export function evaluateMilestones(input: LifecycleInput): Milestone[] {
  return MILESTONE_DEFINITIONS.map(def => {
    let currentValue: number;
    let achieved: boolean;

    switch (def.type) {
      case 'visit_count':
        currentValue = input.totalVisits;
        achieved = input.totalVisits >= def.targetValue;
        break;
      case 'spend_threshold':
        currentValue = input.totalSpend;
        achieved = input.totalSpend >= def.targetValue;
        break;
      case 'anniversary':
        if (input.firstVisitDate) {
          const daysSinceFirst = daysBetween(input.firstVisitDate, new Date().toISOString());
          currentValue = daysSinceFirst;
          achieved = daysSinceFirst >= def.targetValue;
        } else {
          currentValue = 0;
          achieved = false;
        }
        break;
      case 'birthday':
        if (input.birthday) {
          const today = new Date();
          const bday = new Date(input.birthday);
          bday.setFullYear(today.getFullYear());
          const daysUntil = daysBetween(today.toISOString(), bday.toISOString());
          currentValue = daysUntil;
          achieved = daysUntil <= 7 && daysUntil >= 0;
        } else {
          currentValue = 0;
          achieved = false;
        }
        break;
      default:
        currentValue = 0;
        achieved = false;
    }

    return {
      type: def.type,
      label: def.label,
      targetValue: def.targetValue,
      currentValue,
      achieved,
      rewardOffered: def.rewardOffered,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// PROJECTED LIFETIME VALUE
// ─────────────────────────────────────────────────────────────

/** LTV multipliers by lifecycle stage */
const LTV_MULTIPLIERS: Record<LifecycleStage, number> = {
  prospect: 0.5,
  first_visit: 2.0,
  active: 3.5,
  loyal: 5.0,
  vip: 8.0,
  at_risk: 1.5,
  dormant: 0.5,
  lost: 0.1,
  reactivated: 3.0,
};

/**
 * Calculate projected lifetime value based on current behavior and stage.
 */
export function calculateProjectedLTV(input: LifecycleInput): number {
  if (input.totalVisits === 0) {
    // Prospect - estimate based on avg new client value
    return 1200 * LTV_MULTIPLIERS.prospect;
  }

  const avgSpendPerVisit = input.totalSpend / input.totalVisits;

  // Calculate visit frequency (visits per month)
  let visitsPerMonth: number;
  if (input.visitDates.length >= 2) {
    const firstVisit = new Date(input.visitDates[input.visitDates.length - 1]).getTime();
    const lastVisit = new Date(input.visitDates[0]).getTime();
    const monthSpan = Math.max(1, (lastVisit - firstVisit) / (1000 * 60 * 60 * 24 * 30));
    visitsPerMonth = input.totalVisits / monthSpan;
  } else {
    visitsPerMonth = 0.5; // Default for single visit
  }

  // 12-month projected value
  const projectedAnnual = avgSpendPerVisit * visitsPerMonth * 12;

  // Apply stage multiplier (accounts for likely retention)
  const stage = determineStage(input);
  const multiplier = LTV_MULTIPLIERS[stage];

  return Math.round(projectedAnnual * multiplier);
}

// ─────────────────────────────────────────────────────────────
// RETENTION RISK SCORING
// ─────────────────────────────────────────────────────────────

/**
 * Calculate retention risk score (0-100, higher = more likely to leave).
 */
export function calculateRetentionRisk(input: LifecycleInput): number {
  let risk = 0;

  // Recency factor (0-40)
  if (input.daysSinceLastVisit <= 14) risk += 0;
  else if (input.daysSinceLastVisit <= 30) risk += 10;
  else if (input.daysSinceLastVisit <= 45) risk += 20;
  else if (input.daysSinceLastVisit <= 60) risk += 30;
  else if (input.daysSinceLastVisit <= 90) risk += 35;
  else risk += 40;

  // Frequency decline (0-25)
  if (input.visitDates.length >= 4) {
    const recentInterval = averageInterval(input.visitDates.slice(0, 3));
    const historicalInterval = averageInterval(input.visitDates.slice(3));
    if (historicalInterval > 0 && recentInterval > historicalInterval * 1.5) {
      risk += 25;
    } else if (historicalInterval > 0 && recentInterval > historicalInterval * 1.2) {
      risk += 15;
    }
  }

  // Spend decline (0-15)
  if (input.transactionAmounts.length >= 4) {
    const recentAvg = average(input.transactionAmounts.slice(0, 2));
    const historicalAvg = average(input.transactionAmounts.slice(2));
    if (recentAvg < historicalAvg * 0.7) risk += 15;
    else if (recentAvg < historicalAvg * 0.85) risk += 8;
  }

  // Membership protection (0 to -15)
  if (input.hasMembership) {
    risk = Math.max(0, risk - 15);
  }

  // Low visit count risk (0-10)
  if (input.totalVisits <= 1) risk += 10;
  else if (input.totalVisits <= 2) risk += 5;

  // Visit consistency bonus (0 to -10)
  if (input.totalVisits >= 5 && input.daysSinceLastVisit <= 30) {
    risk = Math.max(0, risk - 10);
  }

  return Math.min(100, Math.max(0, risk));
}

// ─────────────────────────────────────────────────────────────
// COMMUNICATION TEMPLATES BY STAGE
// ─────────────────────────────────────────────────────────────

export interface StageTemplate {
  stage: LifecycleStage;
  templates: {
    subject: string;
    body: string;
    channel: 'email' | 'sms';
    timing: string;
  }[];
}

export const STAGE_TEMPLATES: StageTemplate[] = [
  {
    stage: 'prospect',
    templates: [
      {
        subject: 'Welcome to Rani Beauty Clinic',
        body: 'Hi {{clientName}}, thank you for your interest in Rani Beauty Clinic. We specialize in luxury medical aesthetics, from advanced skin rejuvenation to precision injection treatments. Let us help you begin your transformation journey.',
        channel: 'email',
        timing: 'immediate',
      },
    ],
  },
  {
    stage: 'first_visit',
    templates: [
      {
        subject: 'Thank You for Visiting Rani Beauty Clinic',
        body: 'Hi {{clientName}}, it was a pleasure meeting you today. We hope your experience was everything you expected and more. Your personalized treatment plan is ready for review.',
        channel: 'email',
        timing: '2 hours post-visit',
      },
    ],
  },
  {
    stage: 'at_risk',
    templates: [
      {
        subject: 'We Miss You, {{clientName}}',
        body: "Hi {{clientName}}, it's been a while since your last visit. Your results deserve ongoing care. As a valued client, we have a special offer to welcome you back.",
        channel: 'email',
        timing: 'upon entering at_risk',
      },
      {
        subject: 'Quick check-in from Rani Beauty Clinic',
        body: 'Hi {{clientName}}, just checking in. Would you like to schedule your next treatment? Reply to this message and we will get you booked.',
        channel: 'sms',
        timing: '3 days after email',
      },
    ],
  },
  {
    stage: 'dormant',
    templates: [
      {
        subject: 'A Special Invitation to Return',
        body: "Hi {{clientName}}, we haven't seen you in a while and we'd love to welcome you back. Your skin deserves the best care. We've prepared an exclusive offer just for you.",
        channel: 'email',
        timing: 'upon entering dormant',
      },
    ],
  },
  {
    stage: 'vip',
    templates: [
      {
        subject: 'Welcome to VIP Status, {{clientName}}',
        body: 'Hi {{clientName}}, congratulations on achieving VIP status at Rani Beauty Clinic. You now have access to exclusive benefits, priority booking, and special VIP-only offers. Thank you for trusting us with your beauty journey.',
        channel: 'email',
        timing: 'upon entering vip',
      },
    ],
  },
  {
    stage: 'reactivated',
    templates: [
      {
        subject: 'Welcome Back, {{clientName}}!',
        body: "Hi {{clientName}}, we're so glad to see you again! Your return means a lot to us. Let's pick up right where we left off on your transformation journey.",
        channel: 'email',
        timing: 'upon entering reactivated',
      },
    ],
  },
];

/**
 * Get communication templates for a lifecycle stage.
 */
export function getStageTemplates(stage: LifecycleStage): StageTemplate | undefined {
  return STAGE_TEMPLATES.find(t => t.stage === stage);
}

// ─────────────────────────────────────────────────────────────
// WIN-BACK SEQUENCES
// ─────────────────────────────────────────────────────────────

export interface WinBackSequence {
  stage: LifecycleStage;
  steps: WinBackStep[];
}

export interface WinBackStep {
  dayOffset: number;
  channel: 'email' | 'sms' | 'call';
  action: string;
  template: string;
  escalation?: string;
}

export const WIN_BACK_SEQUENCES: WinBackSequence[] = [
  {
    stage: 'at_risk',
    steps: [
      { dayOffset: 0, channel: 'email', action: 'Send personal check-in', template: 'at_risk_email_1' },
      { dayOffset: 3, channel: 'sms', action: 'Follow-up text', template: 'at_risk_sms_1' },
      { dayOffset: 7, channel: 'call', action: 'Personal call from provider', template: 'at_risk_call_1', escalation: 'provider' },
      { dayOffset: 14, channel: 'email', action: 'Special offer', template: 'at_risk_email_2' },
    ],
  },
  {
    stage: 'dormant',
    steps: [
      { dayOffset: 0, channel: 'email', action: 'Reactivation email with exclusive offer', template: 'dormant_email_1' },
      { dayOffset: 5, channel: 'sms', action: 'Limited-time offer text', template: 'dormant_sms_1' },
      { dayOffset: 10, channel: 'email', action: 'Before/after showcase of new results', template: 'dormant_email_2' },
      { dayOffset: 20, channel: 'call', action: 'Personal outreach', template: 'dormant_call_1', escalation: 'frontdesk' },
      { dayOffset: 30, channel: 'email', action: 'Final attempt with highest-value offer', template: 'dormant_email_3' },
    ],
  },
  {
    stage: 'lost',
    steps: [
      { dayOffset: 0, channel: 'email', action: 'We miss you campaign', template: 'lost_email_1' },
      { dayOffset: 14, channel: 'email', action: 'New services/technology announcement', template: 'lost_email_2' },
      { dayOffset: 30, channel: 'email', action: 'Quarterly newsletter with results', template: 'lost_email_3' },
    ],
  },
];

/**
 * Get the win-back sequence for a lifecycle stage.
 */
export function getWinBackSequence(stage: LifecycleStage): WinBackSequence | undefined {
  return WIN_BACK_SEQUENCES.find(s => s.stage === stage);
}

// ─────────────────────────────────────────────────────────────
// LIFECYCLE METRICS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate lifecycle metrics from a list of client lifecycles.
 */
export function calculateLifecycleMetrics(
  clients: ClientLifecycle[],
  recentMovements: LifecycleMovement[] = [],
): LifecycleMetrics {
  const clientsByStage: Record<LifecycleStage, number> = {
    prospect: 0, first_visit: 0, active: 0, loyal: 0, vip: 0,
    at_risk: 0, dormant: 0, lost: 0, reactivated: 0,
  };

  const ltvByStage: Record<LifecycleStage, number[]> = {
    prospect: [], first_visit: [], active: [], loyal: [], vip: [],
    at_risk: [], dormant: [], lost: [], reactivated: [],
  };

  for (const client of clients) {
    clientsByStage[client.stage]++;
    ltvByStage[client.stage].push(client.projectedLTV);
  }

  const avgLTVByStage: Record<LifecycleStage, number> = {} as Record<LifecycleStage, number>;
  const retentionRateByStage: Record<LifecycleStage, number> = {} as Record<LifecycleStage, number>;

  for (const stage of Object.keys(clientsByStage) as LifecycleStage[]) {
    const values = ltvByStage[stage];
    avgLTVByStage[stage] = values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;

    const stageClients = clients.filter(c => c.stage === stage);
    const retained = stageClients.filter(c => c.retentionRiskScore < 50).length;
    retentionRateByStage[stage] = stageClients.length > 0
      ? Math.round((retained / stageClients.length) * 100)
      : 0;
  }

  const atRiskCount = clientsByStage.at_risk + clientsByStage.dormant;

  const reactivated = clients.filter(c => c.stage === 'reactivated').length;
  const dormantAndLost = clientsByStage.dormant + clientsByStage.lost + reactivated;
  const reactivationRate = dormantAndLost > 0
    ? Math.round((reactivated / dormantAndLost) * 100)
    : 0;

  return {
    clientsByStage,
    avgLTVByStage,
    retentionRateByStage,
    transitionsThisMonth: recentMovements,
    atRiskCount,
    reactivationRate,
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.max(0, Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24)));
}

function averageInterval(dates: string[]): number {
  if (dates.length < 2) return 0;
  let totalDays = 0;
  for (let i = 0; i < dates.length - 1; i++) {
    totalDays += daysBetween(dates[i], dates[i + 1]);
  }
  return totalDays / (dates.length - 1);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
