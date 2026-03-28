/**
 * Sales Pipeline Engine for Rani Beauty Clinic CRM
 *
 * 7-stage pipeline: New Lead → Contacted → Consultation Booked → Consulted → Treatment Planned → Converted → VIP
 * Handles stage transitions, velocity metrics, forecasting, auto-assignment, and lost lead tracking.
 */

import type {
  PipelineLead,
  PipelineStage,
  PipelineMetrics,
  PipelineForecast,
  StageTransition,
  LeadSource,
  LostReason,
  AssignmentRule,
  AssignmentStrategy,
  TeamMember,
  PIPELINE_STAGES,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** Ordered pipeline stages for index-based logic */
export const STAGE_ORDER: PipelineStage[] = [
  'new_lead',
  'contacted',
  'consultation_booked',
  'consulted',
  'treatment_planned',
  'converted',
  'vip',
];

/** Probability of conversion at each stage (used for revenue forecasting) */
export const STAGE_PROBABILITIES: Record<PipelineStage, number> = {
  new_lead: 0.10,
  contacted: 0.20,
  consultation_booked: 0.40,
  consulted: 0.55,
  treatment_planned: 0.75,
  converted: 0.95,
  vip: 1.0,
};

/** Default max days before a lead is considered stale at each stage */
export const STALE_THRESHOLDS: Record<PipelineStage, number> = {
  new_lead: 2,            // Must contact within 2 days
  contacted: 5,           // Must book consult within 5 days
  consultation_booked: 14, // Consult within 14 days of booking
  consulted: 7,           // Treatment plan within 7 days of consult
  treatment_planned: 14,  // Convert within 14 days of plan
  converted: 90,          // VIP within 90 days
  vip: 365,               // Yearly re-engagement
};

/** Allowed forward transitions */
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  new_lead: ['contacted'],
  contacted: ['consultation_booked'],
  consultation_booked: ['consulted'],
  consulted: ['treatment_planned'],
  treatment_planned: ['converted'],
  converted: ['vip'],
  vip: [],
};

/** Average treatment values for forecasting by source */
const SOURCE_AVG_VALUES: Record<LeadSource, number> = {
  website: 1200,
  google: 1500,
  instagram: 800,
  facebook: 900,
  referral: 2000,
  walk_in: 600,
  phone: 1400,
  mangomint: 1100,
  event: 1000,
  yelp: 1300,
  tiktok: 700,
  other: 1000,
};

// ─────────────────────────────────────────────────────────────
// STAGE TRANSITION ENGINE
// ─────────────────────────────────────────────────────────────

export interface TransitionResult {
  success: boolean;
  lead: PipelineLead;
  automationTriggers: string[];
  error?: string;
}

/**
 * Validate and execute a stage transition.
 * Returns the updated lead and any automation triggers.
 */
export function transitionStage(
  lead: PipelineLead,
  toStage: PipelineStage,
  by: string,
  note?: string,
): TransitionResult {
  const fromIndex = STAGE_ORDER.indexOf(lead.stage);
  const toIndex = STAGE_ORDER.indexOf(toStage);

  // Validate transition
  if (fromIndex === -1 || toIndex === -1) {
    return { success: false, lead, automationTriggers: [], error: 'Invalid stage' };
  }

  // Allow forward transitions only (no skipping more than 1 unless from new_lead)
  const validTargets = VALID_TRANSITIONS[lead.stage];
  if (!validTargets.includes(toStage)) {
    // Allow skip-ahead for fast-tracked leads (e.g., referral directly books)
    if (toIndex <= fromIndex) {
      return {
        success: false,
        lead,
        automationTriggers: [],
        error: `Cannot move backward from ${lead.stage} to ${toStage}`,
      };
    }
  }

  const now = new Date().toISOString();
  const transition: StageTransition = {
    from: lead.stage,
    to: toStage,
    at: now,
    by,
    note,
  };

  const automationTriggers = getAutomationTriggers(lead.stage, toStage);
  transition.automationTriggered = automationTriggers[0];

  const updatedLead: PipelineLead = {
    ...lead,
    previousStage: lead.stage,
    stage: toStage,
    enteredAt: now,
    lastActivityAt: now,
    stageHistory: [...lead.stageHistory, transition],
    daysInStage: 0,
    isStale: false,
  };

  return { success: true, lead: updatedLead, automationTriggers };
}

/**
 * Mark a lead as lost with a reason code.
 */
export function markLeadLost(
  lead: PipelineLead,
  reason: LostReason,
  by: string,
  note?: string,
): PipelineLead {
  const now = new Date().toISOString();
  const transition: StageTransition = {
    from: lead.stage,
    to: 'lost',
    at: now,
    by,
    note,
  };

  return {
    ...lead,
    previousStage: lead.stage,
    lostReason: reason,
    lostAt: now,
    lastActivityAt: now,
    stageHistory: [...lead.stageHistory, transition],
  };
}

/**
 * Get automation triggers for a stage transition.
 */
function getAutomationTriggers(from: PipelineStage, to: PipelineStage): string[] {
  const triggers: string[] = [];

  if (to === 'contacted') {
    triggers.push('new_lead_welcome_sequence');
  }
  if (to === 'consultation_booked') {
    triggers.push('pre_consultation_prep');
    triggers.push('appointment_confirmation');
  }
  if (to === 'consulted') {
    triggers.push('post_consultation_follow_up');
  }
  if (to === 'treatment_planned') {
    triggers.push('treatment_plan_sent');
    triggers.push('create_follow_up_task');
  }
  if (to === 'converted') {
    triggers.push('welcome_new_client');
    triggers.push('review_request_7day');
    triggers.push('treatment_reminder_schedule');
  }
  if (to === 'vip') {
    triggers.push('vip_welcome');
    triggers.push('vip_appreciation');
  }

  return triggers;
}

// ─────────────────────────────────────────────────────────────
// PIPELINE METRICS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate comprehensive pipeline metrics from a list of leads.
 */
export function calculatePipelineMetrics(leads: PipelineLead[]): PipelineMetrics {
  const activeLeads = leads.filter(l => !l.lostReason);
  const convertedLeads = leads.filter(l => l.stage === 'converted' || l.stage === 'vip');
  const lostLeads = leads.filter(l => l.lostReason);

  // Count by stage
  const leadsByStage = {} as Record<PipelineStage, number>;
  for (const stage of STAGE_ORDER) {
    leadsByStage[stage] = activeLeads.filter(l => l.stage === stage).length;
  }

  // Conversion rates per stage
  const conversionRates = calculateConversionRates(leads);

  // Average time per stage
  const avgTimePerStage = calculateAvgTimePerStage(leads);

  // Pipeline velocity (avg total days from new_lead to converted)
  const pipelineVelocity = calculatePipelineVelocity(convertedLeads);

  // Revenue metrics
  const totalPipelineValue = activeLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const forecastedRevenue = activeLeads.reduce(
    (sum, l) => sum + l.estimatedValue * STAGE_PROBABILITIES[l.stage],
    0,
  );

  // Revenue by source
  const revenueBySource = {} as Record<LeadSource, number>;
  for (const lead of convertedLeads) {
    revenueBySource[lead.source] = (revenueBySource[lead.source] || 0) + (lead.actualValue || lead.estimatedValue);
  }

  // Lost leads by reason
  const lostLeadsByReason = {} as Record<LostReason, number>;
  for (const lead of lostLeads) {
    if (lead.lostReason) {
      lostLeadsByReason[lead.lostReason] = (lostLeadsByReason[lead.lostReason] || 0) + 1;
    }
  }

  // Win rate
  const winRate = leads.length > 0
    ? (convertedLeads.length / leads.length) * 100
    : 0;

  // Avg deal size
  const avgDealSize = convertedLeads.length > 0
    ? convertedLeads.reduce((sum, l) => sum + (l.actualValue || l.estimatedValue), 0) / convertedLeads.length
    : 0;

  return {
    totalLeads: leads.length,
    leadsByStage,
    conversionRates,
    avgTimePerStage,
    pipelineVelocity,
    totalPipelineValue,
    forecastedRevenue,
    revenueBySource,
    staleLeadCount: activeLeads.filter(l => l.isStale).length,
    lostLeadsByReason,
    winRate,
    avgDealSize,
  };
}

/**
 * Calculate conversion rate between each adjacent stage.
 */
function calculateConversionRates(leads: PipelineLead[]): Record<PipelineStage, number> {
  const rates = {} as Record<PipelineStage, number>;

  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    const currentStage = STAGE_ORDER[i];
    const nextStage = STAGE_ORDER[i + 1];

    // Count leads that were ever in currentStage
    const inCurrent = leads.filter(l =>
      l.stage === currentStage ||
      l.stageHistory.some(h => h.from === currentStage),
    ).length;

    // Count leads that moved to nextStage or beyond
    const movedForward = leads.filter(l => {
      const stageIdx = STAGE_ORDER.indexOf(l.stage);
      return stageIdx > i || l.stageHistory.some(h => h.to === nextStage);
    }).length;

    rates[currentStage] = inCurrent > 0 ? (movedForward / inCurrent) * 100 : 0;
  }
  rates.vip = 100;

  return rates;
}

/**
 * Calculate average days spent in each stage.
 */
function calculateAvgTimePerStage(leads: PipelineLead[]): Record<PipelineStage, number> {
  const stageTimes: Record<PipelineStage, number[]> = {
    new_lead: [],
    contacted: [],
    consultation_booked: [],
    consulted: [],
    treatment_planned: [],
    converted: [],
    vip: [],
  };

  for (const lead of leads) {
    for (const transition of lead.stageHistory) {
      if (transition.from !== 'lost') {
        const fromStage = transition.from as PipelineStage;
        // Find when they entered this stage
        const enteredTransition = lead.stageHistory.find(h => h.to === fromStage);
        if (enteredTransition) {
          const days = daysBetween(enteredTransition.at, transition.at);
          stageTimes[fromStage].push(days);
        }
      }
    }

    // Current stage time
    if (!lead.lostReason) {
      stageTimes[lead.stage].push(lead.daysInStage);
    }
  }

  const avgTimePerStage = {} as Record<PipelineStage, number>;
  for (const stage of STAGE_ORDER) {
    const times = stageTimes[stage];
    avgTimePerStage[stage] = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10
      : 0;
  }

  return avgTimePerStage;
}

/**
 * Calculate average pipeline velocity (days from first stage to conversion).
 */
function calculatePipelineVelocity(convertedLeads: PipelineLead[]): number {
  if (convertedLeads.length === 0) return 0;

  const totalDays = convertedLeads.reduce((sum, lead) => {
    return sum + daysBetween(lead.createdAt, lead.enteredAt);
  }, 0);

  return Math.round(totalDays / convertedLeads.length * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// STALE LEAD DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Check if a lead is stale based on its current stage and days without activity.
 */
export function isLeadStale(lead: PipelineLead): boolean {
  if (lead.lostReason) return false;
  const threshold = STALE_THRESHOLDS[lead.stage];
  const daysSinceActivity = daysBetween(lead.lastActivityAt, new Date().toISOString());
  return daysSinceActivity > threshold;
}

/**
 * Detect all stale leads and return them with urgency ranking.
 */
export function detectStaleLeads(leads: PipelineLead[]): PipelineLead[] {
  return leads
    .filter(l => !l.lostReason && isLeadStale(l))
    .sort((a, b) => {
      // Sort by staleness severity: higher stage + more overdue = more urgent
      const aUrgency = STAGE_ORDER.indexOf(a.stage) * 10 +
        daysBetween(a.lastActivityAt, new Date().toISOString());
      const bUrgency = STAGE_ORDER.indexOf(b.stage) * 10 +
        daysBetween(b.lastActivityAt, new Date().toISOString());
      return bUrgency - aUrgency;
    });
}

// ─────────────────────────────────────────────────────────────
// AUTO-ASSIGNMENT
// ─────────────────────────────────────────────────────────────

/**
 * Assign a lead to a team member based on the configured strategy.
 */
export function assignLead(
  lead: PipelineLead,
  rule: AssignmentRule,
): PipelineLead {
  const assignee = selectAssignee(lead, rule);
  if (!assignee) return lead;

  return {
    ...lead,
    assignedTo: assignee.id,
    lastActivityAt: new Date().toISOString(),
  };
}

/**
 * Select the best assignee based on strategy.
 */
function selectAssignee(
  lead: PipelineLead,
  rule: AssignmentRule,
): TeamMember | null {
  const available = rule.teamMembers.filter(m => m.isAvailable);
  if (available.length === 0) return null;

  switch (rule.strategy) {
    case 'round_robin':
      return roundRobinAssign(available);

    case 'capacity_based':
      return capacityBasedAssign(available);

    case 'specialty_based':
      return specialtyBasedAssign(lead, available, rule.specialtyMap || {});

    default:
      return available[0];
  }
}

function roundRobinAssign(members: TeamMember[]): TeamMember {
  // Pick the member with the lowest current load
  return members.reduce((min, m) => m.currentLoad < min.currentLoad ? m : min, members[0]);
}

function capacityBasedAssign(members: TeamMember[]): TeamMember {
  // Pick the member with most available capacity (capacity - currentLoad)
  return members.reduce((best, m) => {
    const available = m.capacity - m.currentLoad;
    const bestAvailable = best.capacity - best.currentLoad;
    return available > bestAvailable ? m : best;
  }, members[0]);
}

function specialtyBasedAssign(
  lead: PipelineLead,
  members: TeamMember[],
  specialtyMap: Record<string, string[]>,
): TeamMember {
  // Try to match by tag/service specialty
  for (const tag of lead.tags) {
    const specialists = specialtyMap[tag];
    if (specialists) {
      const match = members.find(m => specialists.includes(m.id) && m.currentLoad < m.capacity);
      if (match) return match;
    }
  }
  // Fallback to capacity-based
  return capacityBasedAssign(members);
}

// ─────────────────────────────────────────────────────────────
// PIPELINE FORECASTING
// ─────────────────────────────────────────────────────────────

/**
 * Generate revenue forecasts from the current pipeline.
 */
export function generateForecast(
  leads: PipelineLead[],
  periods: number = 3,
): PipelineForecast[] {
  const activeLeads = leads.filter(l => !l.lostReason);
  const forecasts: PipelineForecast[] = [];

  for (let i = 0; i < periods; i++) {
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() + i);
    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Weighted revenue based on stage probability and timing
    let expectedRevenue = 0;
    let bestCase = 0;
    let worstCase = 0;
    let dealCount = 0;

    for (const lead of activeLeads) {
      const probability = STAGE_PROBABILITIES[lead.stage];
      const timeDecay = Math.max(0, 1 - (i * 0.15)); // Decrease confidence over time
      const adjustedProb = probability * timeDecay;

      const value = lead.estimatedValue || SOURCE_AVG_VALUES[lead.source];
      expectedRevenue += value * adjustedProb;
      bestCase += value * Math.min(1, adjustedProb * 1.5);
      worstCase += value * adjustedProb * 0.5;

      if (adjustedProb > 0.3) dealCount++;
    }

    forecasts.push({
      period: periodLabel,
      expectedRevenue: Math.round(expectedRevenue),
      bestCase: Math.round(bestCase),
      worstCase: Math.round(worstCase),
      dealCount,
      weightedProbability: activeLeads.length > 0
        ? expectedRevenue / activeLeads.reduce((s, l) => s + l.estimatedValue, 0) * 100
        : 0,
    });
  }

  return forecasts;
}

// ─────────────────────────────────────────────────────────────
// LEAD SCORING
// ─────────────────────────────────────────────────────────────

export interface LeadScoreInput {
  source: LeadSource;
  daysSinceCreated: number;
  hasEmail: boolean;
  hasPhone: boolean;
  responseTime?: number;    // hours
  consultBooked: boolean;
  estimatedValue: number;
  engagementCount: number;  // total interactions
  isReferral: boolean;
  hasMembership: boolean;
}

/**
 * Score a lead 0-100 based on quality signals.
 */
export function scoreLead(input: LeadScoreInput): number {
  let score = 0;

  // Source quality (0-25)
  const sourceScores: Partial<Record<LeadSource, number>> = {
    referral: 25, google: 20, phone: 18, website: 15, mangomint: 15,
    yelp: 14, instagram: 12, facebook: 10, event: 10, walk_in: 8, tiktok: 7, other: 5,
  };
  score += sourceScores[input.source] || 5;

  // Contact info completeness (0-10)
  if (input.hasEmail) score += 5;
  if (input.hasPhone) score += 5;

  // Response time (0-15)
  if (input.responseTime !== undefined) {
    if (input.responseTime <= 1) score += 15;
    else if (input.responseTime <= 4) score += 12;
    else if (input.responseTime <= 12) score += 8;
    else if (input.responseTime <= 24) score += 4;
  }

  // Consultation booked (0-15)
  if (input.consultBooked) score += 15;

  // Estimated value (0-15)
  if (input.estimatedValue >= 3000) score += 15;
  else if (input.estimatedValue >= 1500) score += 12;
  else if (input.estimatedValue >= 800) score += 8;
  else if (input.estimatedValue >= 300) score += 4;

  // Engagement (0-10)
  if (input.engagementCount >= 5) score += 10;
  else if (input.engagementCount >= 3) score += 7;
  else if (input.engagementCount >= 1) score += 4;

  // Referral bonus (0-5)
  if (input.isReferral) score += 5;

  // Membership interest (0-5)
  if (input.hasMembership) score += 5;

  return Math.min(100, score);
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.max(0, Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24)));
}

/**
 * Create a new pipeline lead with defaults.
 */
export function createLead(input: {
  clientId: string;
  clientName: string;
  email: string;
  phone: string;
  source: LeadSource;
  estimatedValue?: number;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
}): PipelineLead {
  const now = new Date().toISOString();
  return {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clientId: input.clientId,
    clientName: input.clientName,
    email: input.email,
    phone: input.phone,
    stage: 'new_lead',
    source: input.source,
    assignedTo: input.assignedTo || '',
    estimatedValue: input.estimatedValue || SOURCE_AVG_VALUES[input.source],
    enteredAt: now,
    createdAt: now,
    lastActivityAt: now,
    stageHistory: [],
    tags: input.tags || [],
    notes: input.notes || '',
    score: 0,
    isStale: false,
    daysInStage: 0,
  };
}
