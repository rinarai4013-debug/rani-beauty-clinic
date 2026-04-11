/**
 * Ads War Machine - Auto-Scaler Engine
 *
 * Automated scaling engine for ad campaigns. Monitors performance
 * thresholds, adjusts budgets, rotates creatives, optimizes platform
 * splits, and provides kill-switch protection.
 *
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export type ScaleDirection = 'up' | 'down' | 'hold' | 'pause' | 'kill';
export type MetricName = 'cpa' | 'roas' | 'ctr' | 'conversion_rate' | 'frequency' | 'spend' | 'leads' | 'revenue';

export interface AutoScalerInput {
  campaigns: CampaignPerformance[];
  dailySpendCap: number;
  monthlyBudget: number;
  targetCPA: number;
  targetROAS: number;
  minCTR: number;
  daysOfData: number;
  platformSplit: { meta: number; google: number };
}

export interface CampaignPerformance {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  status: 'active' | 'paused' | 'killed';
  dailyBudget: number;
  spent: number; // total spent in current period
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  frequency: number;
  daysRunning: number;
  lastScaleDate?: string;
  consecutiveScaleUps: number;
  consecutiveScaleDowns: number;
}

export interface AutoScalerResult {
  decisions: ScaleDecision[];
  platformOptimization: PlatformSplitResult;
  creativeRotations: CreativeRotationAction[];
  guardrailStatus: GuardrailStatus;
  diminishingReturns: DiminishingReturnsAlert[];
  breakEvenAnalysis: BreakEvenResult[];
  killSwitchStatus: KillSwitchStatus;
  overallHealthScore: number;
  summary: string;
}

export interface ScaleDecision {
  campaignId: string;
  campaignName: string;
  direction: ScaleDirection;
  currentBudget: number;
  newBudget: number;
  changePercent: number;
  reason: string;
  confidence: number;
  triggeredBy: ThresholdTrigger[];
  executionTime: 'immediate' | 'next_day' | 'scheduled';
  cooldownUntil?: string;
}

export interface ThresholdTrigger {
  metric: MetricName;
  currentValue: number;
  threshold: number;
  direction: 'above' | 'below';
  severity: 'critical' | 'warning' | 'info';
}

export interface PlatformSplitResult {
  currentSplit: { meta: number; google: number };
  recommendedSplit: { meta: number; google: number };
  reason: string;
  metaROAS: number;
  googleROAS: number;
  metaCPA: number;
  googleCPA: number;
}

export interface CreativeRotationAction {
  campaignId: string;
  action: 'rotate_in' | 'rotate_out' | 'refresh' | 'test_new';
  reason: string;
  urgency: 'immediate' | 'this_week' | 'next_cycle';
}

export interface GuardrailStatus {
  dailySpendOnTrack: boolean;
  currentDailySpend: number;
  dailySpendCap: number;
  monthlyBudgetRemaining: number;
  projectedMonthEndSpend: number;
  overBudgetRisk: boolean;
  hardStopTriggered: boolean;
  warnings: string[];
}

export interface DiminishingReturnsAlert {
  campaignId: string;
  campaignName: string;
  metric: string;
  currentSpend: number;
  optimalSpend: number;
  marginalROAS: number;
  recommendation: string;
}

export interface BreakEvenResult {
  campaignId: string;
  campaignName: string;
  currentROAS: number;
  breakEvenROAS: number;
  isAboveBreakEven: boolean;
  margin: number; // percentage above/below break-even
  avgBookingValue: number;
  costPerBooking: number;
  profitPerBooking: number;
}

export interface KillSwitchStatus {
  active: boolean;
  triggeredCampaigns: string[];
  reason?: string;
  totalSaved: number;
  reactivationConditions: string[];
}

// ── CONSTANTS ──

const SCALE_UP_RULES = {
  minDaysBeforeScale: 3, // wait 3 days before scaling up
  maxScalePercent: 20, // max 20% increase per scale
  maxConsecutiveScaleUps: 5, // stop scaling after 5 consecutive ups
  roasThreshold: 2.5, // scale up if ROAS > 2.5x
  cpaThresholdMultiplier: 0.8, // scale up if CPA < 80% of target
  ctrMinimum: 1.0, // don't scale up if CTR below 1%
  minConversions: 3, // need at least 3 conversions to validate
};

const SCALE_DOWN_RULES = {
  immediateIfCPAMultiplier: 2.0, // immediate scale down if CPA > 2x target
  gradualIfCPAMultiplier: 1.3, // gradual scale down if CPA > 1.3x target
  scaleDownPercent: 15, // decrease by 15% each time
  maxConsecutiveScaleDowns: 3, // kill after 3 consecutive downs
  minBudgetFloor: 10, // never go below $10/day
};

const KILL_SWITCH_RULES = {
  roasMinimum: 0.5, // kill if ROAS below 0.5x
  cpaMaxMultiplier: 3.0, // kill if CPA > 3x target
  minSpendBeforeKill: 100, // need $100+ spent before killing
  minDaysBeforeKill: 5, // wait 5 days minimum
};

const DIMINISHING_RETURNS = {
  marginalROASThreshold: 1.2, // marginal ROAS below 1.2 = diminishing returns
  spendIncrementForTest: 0.1, // test 10% increments
};

// ── MAIN ENGINE ──

export function runAutoScaler(input: AutoScalerInput): AutoScalerResult {
  const decisions = generateScaleDecisions(input);
  const platformOptimization = optimizePlatformSplit(input);
  const creativeRotations = identifyCreativeRotations(input);
  const guardrailStatus = checkGuardrails(input, decisions);
  const diminishingReturns = detectDiminishingReturns(input);
  const breakEvenAnalysis = calculateBreakEven(input);
  const killSwitchStatus = evaluateKillSwitch(input);
  const overallHealthScore = calculateHealthScore(input, decisions, guardrailStatus);
  const summary = generateSummary(decisions, guardrailStatus, killSwitchStatus, overallHealthScore);

  // Apply guardrail corrections
  if (guardrailStatus.overBudgetRisk) {
    for (const decision of decisions) {
      if (decision.direction === 'up') {
        decision.direction = 'hold';
        decision.newBudget = decision.currentBudget;
        decision.changePercent = 0;
        decision.reason = `Scale-up blocked: over-budget risk. ${decision.reason}`;
      }
    }
  }

  return {
    decisions,
    platformOptimization,
    creativeRotations,
    guardrailStatus,
    diminishingReturns,
    breakEvenAnalysis,
    killSwitchStatus,
    overallHealthScore,
    summary,
  };
}

// ── SCALE DECISIONS ──

function generateScaleDecisions(input: AutoScalerInput): ScaleDecision[] {
  const decisions: ScaleDecision[] = [];

  for (const campaign of input.campaigns) {
    if (campaign.status === 'killed') continue;

    const triggers: ThresholdTrigger[] = evaluateThresholds(campaign, input);
    const direction = determineDirection(campaign, triggers, input);
    const { newBudget, changePercent } = calculateNewBudget(campaign, direction, input);

    const cooldownDays = direction === 'up' ? SCALE_UP_RULES.minDaysBeforeScale : 1;
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() + cooldownDays);

    decisions.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      direction,
      currentBudget: campaign.dailyBudget,
      newBudget,
      changePercent,
      reason: buildDecisionReason(direction, triggers, campaign),
      confidence: calculateConfidence(campaign, triggers),
      triggeredBy: triggers,
      executionTime: direction === 'down' && triggers.some(t => t.severity === 'critical') ? 'immediate' : 'next_day',
      cooldownUntil: cooldownDate.toISOString().split('T')[0],
    });
  }

  return decisions.sort((a, b) => {
    const dirOrder: Record<ScaleDirection, number> = { kill: 0, pause: 1, down: 2, hold: 3, up: 4 };
    return dirOrder[a.direction] - dirOrder[b.direction];
  });
}

function evaluateThresholds(campaign: CampaignPerformance, input: AutoScalerInput): ThresholdTrigger[] {
  const triggers: ThresholdTrigger[] = [];

  // CPA evaluation
  if (campaign.conversions > 0) {
    if (campaign.cpa > input.targetCPA * KILL_SWITCH_RULES.cpaMaxMultiplier) {
      triggers.push({ metric: 'cpa', currentValue: campaign.cpa, threshold: input.targetCPA * KILL_SWITCH_RULES.cpaMaxMultiplier, direction: 'above', severity: 'critical' });
    } else if (campaign.cpa > input.targetCPA * SCALE_DOWN_RULES.immediateIfCPAMultiplier) {
      triggers.push({ metric: 'cpa', currentValue: campaign.cpa, threshold: input.targetCPA * SCALE_DOWN_RULES.immediateIfCPAMultiplier, direction: 'above', severity: 'critical' });
    } else if (campaign.cpa > input.targetCPA * SCALE_DOWN_RULES.gradualIfCPAMultiplier) {
      triggers.push({ metric: 'cpa', currentValue: campaign.cpa, threshold: input.targetCPA * SCALE_DOWN_RULES.gradualIfCPAMultiplier, direction: 'above', severity: 'warning' });
    } else if (campaign.cpa < input.targetCPA * SCALE_UP_RULES.cpaThresholdMultiplier) {
      triggers.push({ metric: 'cpa', currentValue: campaign.cpa, threshold: input.targetCPA * SCALE_UP_RULES.cpaThresholdMultiplier, direction: 'below', severity: 'info' });
    }
  }

  // ROAS evaluation
  if (campaign.spent > 50) {
    if (campaign.roas < KILL_SWITCH_RULES.roasMinimum) {
      triggers.push({ metric: 'roas', currentValue: campaign.roas, threshold: KILL_SWITCH_RULES.roasMinimum, direction: 'below', severity: 'critical' });
    } else if (campaign.roas < 1.0) {
      triggers.push({ metric: 'roas', currentValue: campaign.roas, threshold: 1.0, direction: 'below', severity: 'warning' });
    } else if (campaign.roas > SCALE_UP_RULES.roasThreshold) {
      triggers.push({ metric: 'roas', currentValue: campaign.roas, threshold: SCALE_UP_RULES.roasThreshold, direction: 'above', severity: 'info' });
    }
  }

  // CTR evaluation
  if (campaign.impressions > 1000) {
    if (campaign.ctr < 0.5) {
      triggers.push({ metric: 'ctr', currentValue: campaign.ctr, threshold: 0.5, direction: 'below', severity: 'critical' });
    } else if (campaign.ctr < input.minCTR) {
      triggers.push({ metric: 'ctr', currentValue: campaign.ctr, threshold: input.minCTR, direction: 'below', severity: 'warning' });
    }
  }

  // Frequency evaluation
  if (campaign.frequency > 5.0) {
    triggers.push({ metric: 'frequency', currentValue: campaign.frequency, threshold: 5.0, direction: 'above', severity: 'critical' });
  } else if (campaign.frequency > 3.5) {
    triggers.push({ metric: 'frequency', currentValue: campaign.frequency, threshold: 3.5, direction: 'above', severity: 'warning' });
  }

  return triggers;
}

function determineDirection(
  campaign: CampaignPerformance,
  triggers: ThresholdTrigger[],
  input: AutoScalerInput,
): ScaleDirection {
  const criticals = triggers.filter(t => t.severity === 'critical');
  const warnings = triggers.filter(t => t.severity === 'warning');
  const positives = triggers.filter(t => t.severity === 'info');

  // Kill switch
  if (
    campaign.spent >= KILL_SWITCH_RULES.minSpendBeforeKill &&
    campaign.daysRunning >= KILL_SWITCH_RULES.minDaysBeforeKill &&
    criticals.some(t => t.metric === 'roas' && t.currentValue < KILL_SWITCH_RULES.roasMinimum)
  ) {
    return 'kill';
  }

  // Too many consecutive scale downs = pause
  if (campaign.consecutiveScaleDowns >= SCALE_DOWN_RULES.maxConsecutiveScaleDowns) {
    return 'pause';
  }

  // Critical triggers = scale down
  if (criticals.length > 0) {
    return 'down';
  }

  // Warnings dominate = scale down
  if (warnings.length >= 2) {
    return 'down';
  }

  // Positive signals and no warnings = scale up
  if (
    positives.length >= 2 &&
    warnings.length === 0 &&
    campaign.daysRunning >= SCALE_UP_RULES.minDaysBeforeScale &&
    campaign.conversions >= SCALE_UP_RULES.minConversions &&
    campaign.consecutiveScaleUps < SCALE_UP_RULES.maxConsecutiveScaleUps
  ) {
    return 'up';
  }

  // Single positive and no negatives
  if (positives.length > 0 && warnings.length === 0 && criticals.length === 0 && campaign.daysRunning >= SCALE_UP_RULES.minDaysBeforeScale) {
    return 'up';
  }

  return 'hold';
}

function calculateNewBudget(
  campaign: CampaignPerformance,
  direction: ScaleDirection,
  input: AutoScalerInput,
): { newBudget: number; changePercent: number } {
  switch (direction) {
    case 'up': {
      const increase = Math.min(SCALE_UP_RULES.maxScalePercent, 20);
      const newBudget = Math.round(campaign.dailyBudget * (1 + increase / 100) * 100) / 100;
      return { newBudget: Math.min(newBudget, input.dailySpendCap * 0.4), changePercent: increase };
    }
    case 'down': {
      const decrease = SCALE_DOWN_RULES.scaleDownPercent;
      const newBudget = Math.max(
        SCALE_DOWN_RULES.minBudgetFloor,
        Math.round(campaign.dailyBudget * (1 - decrease / 100) * 100) / 100
      );
      return { newBudget, changePercent: -decrease };
    }
    case 'pause':
    case 'kill':
      return { newBudget: 0, changePercent: -100 };
    default:
      return { newBudget: campaign.dailyBudget, changePercent: 0 };
  }
}

function buildDecisionReason(
  direction: ScaleDirection,
  triggers: ThresholdTrigger[],
  campaign: CampaignPerformance,
): string {
  const parts: string[] = [];

  switch (direction) {
    case 'kill':
      parts.push(`Kill switch triggered: ROAS at ${campaign.roas}x after $${campaign.spent} spent over ${campaign.daysRunning} days.`);
      break;
    case 'pause':
      parts.push(`Paused after ${campaign.consecutiveScaleDowns} consecutive scale-downs. Needs creative or targeting overhaul.`);
      break;
    case 'down':
      for (const t of triggers.filter(t => t.severity === 'critical' || t.severity === 'warning')) {
        parts.push(`${t.metric.toUpperCase()} at ${t.currentValue} (threshold: ${t.threshold})`);
      }
      break;
    case 'up':
      for (const t of triggers.filter(t => t.severity === 'info')) {
        parts.push(`${t.metric.toUpperCase()} at ${t.currentValue} (target: ${t.threshold})`);
      }
      parts.push(`Scaling 20% after ${campaign.daysRunning} days of strong performance.`);
      break;
    case 'hold':
      parts.push('Metrics within acceptable range. Holding current budget.');
      break;
  }

  return parts.join(' ');
}

function calculateConfidence(campaign: CampaignPerformance, triggers: ThresholdTrigger[]): number {
  let confidence = 50;

  // More data = more confidence
  if (campaign.daysRunning > 14) confidence += 15;
  else if (campaign.daysRunning > 7) confidence += 10;
  else confidence -= 10;

  // More conversions = more confidence
  if (campaign.conversions > 20) confidence += 15;
  else if (campaign.conversions > 10) confidence += 10;
  else if (campaign.conversions > 5) confidence += 5;

  // Clear trigger signals = more confidence
  if (triggers.length >= 2 && triggers.every(t => t.severity === triggers[0].severity)) {
    confidence += 10;
  }

  // High spend = more reliable data
  if (campaign.spent > 500) confidence += 10;

  return Math.max(20, Math.min(95, confidence));
}

// ── PLATFORM SPLIT OPTIMIZATION ──

function optimizePlatformSplit(input: AutoScalerInput): PlatformSplitResult {
  const metaCampaigns = input.campaigns.filter(c => c.platform === 'meta' && c.status === 'active');
  const googleCampaigns = input.campaigns.filter(c => c.platform === 'google' && c.status === 'active');

  const metaSpent = metaCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const metaRevenue = metaCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const metaConversions = metaCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const metaROAS = metaSpent > 0 ? Math.round((metaRevenue / metaSpent) * 100) / 100 : 0;
  const metaCPA = metaConversions > 0 ? Math.round(metaSpent / metaConversions) : 999;

  const googleSpent = googleCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const googleRevenue = googleCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const googleConversions = googleCampaigns.reduce((sum, c) => sum + c.conversions, 0);
  const googleROAS = googleSpent > 0 ? Math.round((googleRevenue / googleSpent) * 100) / 100 : 0;
  const googleCPA = googleConversions > 0 ? Math.round(googleSpent / googleConversions) : 999;

  // Calculate optimal split based on ROAS performance
  let recommendedMeta = input.platformSplit.meta;
  let recommendedGoogle = input.platformSplit.google;
  let reason = 'Maintaining current platform split.';

  if (metaROAS > 0 && googleROAS > 0) {
    const totalROAS = metaROAS + googleROAS;
    const metaWeight = metaROAS / totalROAS;
    const googleWeight = googleROAS / totalROAS;

    // Gradual shift (max 10% change per cycle)
    const idealMeta = Math.round(metaWeight * 100);
    const idealGoogle = Math.round(googleWeight * 100);

    const metaDiff = idealMeta - input.platformSplit.meta;
    const maxShift = 10;
    const actualShift = Math.max(-maxShift, Math.min(maxShift, metaDiff));

    recommendedMeta = input.platformSplit.meta + actualShift;
    recommendedGoogle = 100 - recommendedMeta;

    if (actualShift > 3) {
      reason = `Shifting ${actualShift}% budget from Google to Meta. Meta ROAS (${metaROAS}x) outperforming Google (${googleROAS}x).`;
    } else if (actualShift < -3) {
      reason = `Shifting ${Math.abs(actualShift)}% budget from Meta to Google. Google ROAS (${googleROAS}x) outperforming Meta (${metaROAS}x).`;
    } else {
      reason = `Platform performance is balanced. Meta ROAS: ${metaROAS}x, Google ROAS: ${googleROAS}x.`;
    }
  }

  return {
    currentSplit: input.platformSplit,
    recommendedSplit: { meta: recommendedMeta, google: recommendedGoogle },
    reason,
    metaROAS,
    googleROAS,
    metaCPA,
    googleCPA,
  };
}

// ── CREATIVE ROTATION ──

function identifyCreativeRotations(input: AutoScalerInput): CreativeRotationAction[] {
  const actions: CreativeRotationAction[] = [];

  for (const campaign of input.campaigns) {
    if (campaign.status !== 'active') continue;

    // High frequency = rotate creative
    if (campaign.frequency > 4.0) {
      actions.push({
        campaignId: campaign.id,
        action: 'rotate_out',
        reason: `Frequency at ${campaign.frequency}x. Creative fatigue detected. Rotate in fresh variant.`,
        urgency: campaign.frequency > 5.5 ? 'immediate' : 'this_week',
      });
    }

    // Low CTR but decent ROAS = test new creative
    if (campaign.ctr < 1.0 && campaign.roas > 1.5) {
      actions.push({
        campaignId: campaign.id,
        action: 'test_new',
        reason: `CTR at ${campaign.ctr}% but ROAS at ${campaign.roas}x. Test new creative to improve click-through.`,
        urgency: 'this_week',
      });
    }

    // Old campaign = refresh
    if (campaign.daysRunning > 30) {
      actions.push({
        campaignId: campaign.id,
        action: 'refresh',
        reason: `Campaign running ${campaign.daysRunning} days. Time for creative refresh even if performing.`,
        urgency: 'next_cycle',
      });
    }
  }

  return actions.sort((a, b) => {
    const uOrder: Record<string, number> = { immediate: 0, this_week: 1, next_cycle: 2 };
    return (uOrder[a.urgency] || 2) - (uOrder[b.urgency] || 2);
  });
}

// ── GUARDRAILS ──

function checkGuardrails(input: AutoScalerInput, decisions: ScaleDecision[]): GuardrailStatus {
  const currentDailySpend = input.campaigns
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + c.dailyBudget, 0);

  const projectedDailySpend = decisions.reduce((sum, d) => {
    if (d.direction !== 'kill' && d.direction !== 'pause') {
      return sum + d.newBudget;
    }
    return sum;
  }, 0);

  const daysElapsed = input.daysOfData;
  const daysRemaining = 30 - (daysElapsed % 30);
  const totalSpent = input.campaigns.reduce((sum, c) => sum + c.spent, 0);
  const projectedMonthEnd = totalSpent + (projectedDailySpend * daysRemaining);
  const monthlyBudgetRemaining = input.monthlyBudget - totalSpent;
  const overBudgetRisk = projectedMonthEnd > input.monthlyBudget * 1.1;

  const warnings: string[] = [];
  if (projectedDailySpend > input.dailySpendCap) {
    warnings.push(`Projected daily spend ($${Math.round(projectedDailySpend)}) exceeds daily cap ($${input.dailySpendCap})`);
  }
  if (overBudgetRisk) {
    warnings.push(`Projected month-end spend ($${Math.round(projectedMonthEnd)}) exceeds monthly budget ($${input.monthlyBudget})`);
  }
  if (monthlyBudgetRemaining < 0) {
    warnings.push(`Monthly budget already exceeded by $${Math.round(Math.abs(monthlyBudgetRemaining))}`);
  }
  if (daysRemaining <= 5 && monthlyBudgetRemaining > input.monthlyBudget * 0.2) {
    warnings.push(`${daysRemaining} days left with ${Math.round((monthlyBudgetRemaining / input.monthlyBudget) * 100)}% budget unspent. Consider increasing daily spend.`);
  }

  return {
    dailySpendOnTrack: projectedDailySpend <= input.dailySpendCap,
    currentDailySpend,
    dailySpendCap: input.dailySpendCap,
    monthlyBudgetRemaining,
    projectedMonthEndSpend: projectedMonthEnd,
    overBudgetRisk,
    hardStopTriggered: monthlyBudgetRemaining < 0,
    warnings,
  };
}

// ── DIMINISHING RETURNS ──

function detectDiminishingReturns(input: AutoScalerInput): DiminishingReturnsAlert[] {
  const alerts: DiminishingReturnsAlert[] = [];

  for (const campaign of input.campaigns) {
    if (campaign.status !== 'active' || campaign.spent < 200) continue;

    // Approximate marginal ROAS using current metrics
    // If ROAS is decreasing as spend increases, diminishing returns exist
    const revenuePerDollar = campaign.spent > 0 ? campaign.revenue / campaign.spent : 0;

    // Heuristic: high spend + declining ROAS = diminishing returns
    const avgDailySpend = campaign.daysRunning > 0 ? campaign.spent / campaign.daysRunning : 0;
    const marginalROAS = campaign.roas * (1 - (avgDailySpend / 500) * 0.1); // rough decay model

    if (marginalROAS < DIMINISHING_RETURNS.marginalROASThreshold && campaign.roas > 1.0) {
      const optimalSpend = Math.round(campaign.spent * (campaign.roas / (campaign.roas + 0.5)));

      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        metric: 'Marginal ROAS',
        currentSpend: campaign.spent,
        optimalSpend,
        marginalROAS: Math.round(marginalROAS * 100) / 100,
        recommendation: `Marginal ROAS approaching ${Math.round(marginalROAS * 100) / 100}x. Consider capping daily budget at $${Math.round(optimalSpend / Math.max(campaign.daysRunning, 1))} or reallocating surplus to other campaigns.`,
      });
    }
  }

  return alerts;
}

// ── BREAK-EVEN CALCULATOR ──

function calculateBreakEven(input: AutoScalerInput): BreakEvenResult[] {
  const results: BreakEvenResult[] = [];

  // Average cost structure for medspa
  const avgProductCostRatio = 0.20; // 20% product/supply cost
  const avgLaborCostRatio = 0.25; // 25% labor cost
  const avgOverheadRatio = 0.15; // 15% overhead

  for (const campaign of input.campaigns) {
    if (campaign.conversions === 0) continue;

    const avgBookingValue = campaign.revenue / campaign.conversions;
    const costPerBooking = campaign.cpa;
    const grossMargin = avgBookingValue * (1 - avgProductCostRatio - avgLaborCostRatio - avgOverheadRatio);
    const breakEvenCPA = grossMargin; // break even when CPA = gross margin
    const breakEvenROAS = avgBookingValue / breakEvenCPA;
    const profitPerBooking = grossMargin - costPerBooking;
    const isAboveBreakEven = campaign.cpa < breakEvenCPA;
    const margin = breakEvenCPA > 0 ? Math.round(((breakEvenCPA - campaign.cpa) / breakEvenCPA) * 100) : 0;

    results.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      currentROAS: campaign.roas,
      breakEvenROAS: Math.round(breakEvenROAS * 100) / 100,
      isAboveBreakEven,
      margin,
      avgBookingValue: Math.round(avgBookingValue),
      costPerBooking: Math.round(costPerBooking),
      profitPerBooking: Math.round(profitPerBooking),
    });
  }

  return results.sort((a, b) => b.margin - a.margin);
}

// ── KILL SWITCH ──

function evaluateKillSwitch(input: AutoScalerInput): KillSwitchStatus {
  const triggeredCampaigns: string[] = [];
  let totalSaved = 0;

  for (const campaign of input.campaigns) {
    if (campaign.status !== 'active') continue;

    const shouldKill =
      campaign.spent >= KILL_SWITCH_RULES.minSpendBeforeKill &&
      campaign.daysRunning >= KILL_SWITCH_RULES.minDaysBeforeKill &&
      (
        campaign.roas < KILL_SWITCH_RULES.roasMinimum ||
        (campaign.conversions > 0 && campaign.cpa > input.targetCPA * KILL_SWITCH_RULES.cpaMaxMultiplier)
      );

    if (shouldKill) {
      triggeredCampaigns.push(campaign.id);
      // Estimate savings = remaining monthly budget for this campaign
      const remainingDays = 30 - (campaign.daysRunning % 30);
      totalSaved += campaign.dailyBudget * remainingDays;
    }
  }

  return {
    active: triggeredCampaigns.length > 0,
    triggeredCampaigns,
    reason: triggeredCampaigns.length > 0
      ? `${triggeredCampaigns.length} campaign(s) triggered kill switch due to ROAS below ${KILL_SWITCH_RULES.roasMinimum}x or CPA exceeding ${KILL_SWITCH_RULES.cpaMaxMultiplier}x target.`
      : undefined,
    totalSaved: Math.round(totalSaved),
    reactivationConditions: [
      'Creative refresh with new angles and messaging',
      'Targeting overhaul (new audiences or narrowed geo)',
      'Landing page optimization with improved conversion elements',
      'Budget reset to minimum ($10-15/day) for testing phase',
      'Minimum 7-day testing period before any scale-up',
    ],
  };
}

// ── HEALTH SCORE ──

function calculateHealthScore(
  input: AutoScalerInput,
  decisions: ScaleDecision[],
  guardrails: GuardrailStatus,
): number {
  let score = 50;

  // Scale-up decisions = healthy
  const scaleUps = decisions.filter(d => d.direction === 'up').length;
  const scaleDowns = decisions.filter(d => d.direction === 'down' || d.direction === 'kill' || d.direction === 'pause').length;
  score += scaleUps * 5;
  score -= scaleDowns * 8;

  // Guardrail health
  if (guardrails.dailySpendOnTrack) score += 10;
  if (guardrails.overBudgetRisk) score -= 15;
  if (guardrails.hardStopTriggered) score -= 25;

  // Average ROAS across active campaigns
  const activeCampaigns = input.campaigns.filter(c => c.status === 'active');
  if (activeCampaigns.length > 0) {
    const avgROAS = activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length;
    if (avgROAS > 3.0) score += 20;
    else if (avgROAS > 2.0) score += 10;
    else if (avgROAS < 1.0) score -= 15;
  }

  // Average CPA health
  if (activeCampaigns.length > 0) {
    const avgCPA = activeCampaigns.reduce((sum, c) => sum + c.cpa, 0) / activeCampaigns.length;
    if (avgCPA < input.targetCPA * 0.8) score += 10;
    else if (avgCPA > input.targetCPA * 1.5) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

// ── SUMMARY ──

function generateSummary(
  decisions: ScaleDecision[],
  guardrails: GuardrailStatus,
  killSwitch: KillSwitchStatus,
  healthScore: number,
): string {
  const scaleUps = decisions.filter(d => d.direction === 'up').length;
  const scaleDowns = decisions.filter(d => d.direction === 'down').length;
  const paused = decisions.filter(d => d.direction === 'pause').length;
  const killed = decisions.filter(d => d.direction === 'kill').length;
  const holds = decisions.filter(d => d.direction === 'hold').length;

  let summary = `Health Score: ${healthScore}/100. `;

  if (scaleUps > 0) summary += `Scaling up ${scaleUps} campaign(s). `;
  if (scaleDowns > 0) summary += `Scaling down ${scaleDowns} campaign(s). `;
  if (paused > 0) summary += `Pausing ${paused} campaign(s). `;
  if (killed > 0) summary += `Kill switch on ${killed} campaign(s). `;
  if (holds > 0) summary += `Holding ${holds} campaign(s) steady. `;

  if (guardrails.overBudgetRisk) {
    summary += 'WARNING: Over-budget risk detected. Scale-ups blocked. ';
  }

  if (killSwitch.active) {
    summary += `Kill switch active on ${killSwitch.triggeredCampaigns.length} campaign(s). Estimated savings: $${killSwitch.totalSaved}. `;
  }

  if (healthScore >= 70) {
    summary += 'Campaign portfolio is healthy. Continue scaling winners.';
  } else if (healthScore >= 40) {
    summary += 'Some campaigns need attention. Focus on optimization before scaling.';
  } else {
    summary += 'Campaign portfolio needs immediate intervention. Review underperformers.';
  }

  return summary;
}
