/**
 * Revenue Opportunity Scoring & Ranking Engine
 *
 * Scores every potential revenue action (0-100), generates daily
 * "Top 10 Revenue Actions", weekly opportunity reports, and tracks
 * ROI per action. Self-improving: learns from what worked.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface OpportunityScorerInput {
  gapActions: GapAction[];
  upsellOpportunities: UpsellOpp[];
  retentionActions: RetentionAction[];
  pricingOpportunities: PricingOpp[];
  reactivationTargets: ReactivationTarget[];
  membershipCandidates: MembershipCandidate[];
  historicalOutcomes: ActionOutcome[];
  currentDate: string;
}

export interface GapAction {
  type: 'fill-slot';
  date: string;
  provider: string;
  timeSlot: string;
  estimatedRevenue: number;
  daysUntil: number;
  suggestedServices: string[];
}

export interface UpsellOpp {
  type: 'upsell';
  clientId: string;
  clientName: string;
  currentService: string;
  suggestedService: string;
  propensityScore: number;
  revenueImpact: number;
}

export interface RetentionAction {
  type: 'rebook' | 'winback' | 'vip-retention';
  clientId: string;
  clientName: string;
  daysSinceVisit: number;
  estimatedRevenue: number;
  urgency: string;
  churnRisk?: number;
  totalSpend?: number;
}

export interface PricingOpp {
  type: 'price-increase' | 'bundle' | 'last-minute-fill';
  service: string;
  currentPrice?: number;
  suggestedPrice?: number;
  estimatedRevenueImpact: number;
  description: string;
}

export interface ReactivationTarget {
  type: 'reactivation';
  clientId: string;
  clientName: string;
  daysSinceVisit: number;
  totalSpend: number;
  lastService: string;
  winBackProbability: number;
  estimatedRevenue: number;
}

export interface MembershipCandidate {
  type: 'membership-conversion';
  clientId: string;
  clientName: string;
  visitCount: number;
  avgTicket: number;
  suggestedTier: string;
  monthlyPrice: number;
  conversionLikelihood: number;
  annualValue: number;
}

export interface ActionOutcome {
  actionId: string;
  category: string;
  result: 'success' | 'partial' | 'failed' | 'no-response';
  revenueGenerated: number;
  date: string;
  notes?: string;
}

// ── OUTPUT TYPES ──

export interface OpportunityScorerResult {
  scoredOpportunities: ScoredOpportunity[];
  dailyTopTen: ScoredOpportunity[];
  weeklyReport: WeeklyOpportunityReport;
  categoryBreakdown: CategoryBreakdown[];
  roiTracking: ROITracking;
  learnings: ActionLearning[];
}

export interface ScoredOpportunity {
  id: string;
  category: OpportunityCategory;
  title: string;
  description: string;
  score: number; // 0-100
  scoreBreakdown: {
    revenueWeight: number;
    effortWeight: number;
    timeWeight: number;
    probabilityWeight: number;
  };
  estimatedRevenue: number;
  effort: 'low' | 'medium' | 'high';
  timeToImpact: 'immediate' | 'this-week' | 'this-month' | 'next-month';
  probability: number; // 0-100
  expectedValue: number; // revenue * probability
  targetClient?: string;
  suggestedAction: string;
  suggestedScript?: string;
  tags: string[];
}

export type OpportunityCategory =
  | 'fill-empty-slot'
  | 'upsell-existing'
  | 'rebook-overdue'
  | 'reactivate-dormant'
  | 'win-back-lapsed'
  | 'vip-retention'
  | 'new-client-acquisition'
  | 'price-optimization'
  | 'package-conversion'
  | 'membership-conversion';

export interface WeeklyOpportunityReport {
  weekOf: string;
  totalOpportunityValue: number;
  topOpportunities: ScoredOpportunity[];
  categoryDistribution: { category: string; count: number; totalValue: number }[];
  previousWeekComparison: {
    totalValue: number;
    actionsCompleted: number;
    revenueCapture: number;
    captureRate: number;
  };
  recommendations: string[];
}

export interface CategoryBreakdown {
  category: OpportunityCategory;
  count: number;
  totalEstimatedRevenue: number;
  avgScore: number;
  avgProbability: number;
  expectedTotalValue: number;
  topAction: string;
}

export interface ROITracking {
  totalActionsTracked: number;
  successRate: number;
  totalRevenueGenerated: number;
  avgRevenuePerAction: number;
  bestPerformingCategory: string;
  worstPerformingCategory: string;
  trendsOverTime: { week: string; actions: number; revenue: number; successRate: number }[];
}

export interface ActionLearning {
  category: string;
  insight: string;
  recommendation: string;
  confidence: number; // 0-100
  basedOnActions: number; // number of data points
}

// ── SCORING WEIGHTS ──

const SCORING_WEIGHTS = {
  revenue: 0.35,
  effort: 0.20,
  timeToImpact: 0.25,
  probability: 0.20,
};

const REVENUE_SCALE: Array<{ threshold: number; score: number }> = [
  { threshold: 3000, score: 100 },
  { threshold: 1500, score: 85 },
  { threshold: 750, score: 70 },
  { threshold: 400, score: 55 },
  { threshold: 200, score: 40 },
  { threshold: 50, score: 20 },
  { threshold: 0, score: 5 },
];

const EFFORT_SCORES: Record<string, number> = {
  low: 90,
  medium: 60,
  high: 30,
};

const TIME_SCORES: Record<string, number> = {
  immediate: 100,
  'this-week': 75,
  'this-month': 45,
  'next-month': 20,
};

// ── CORE ENGINE ──

export function scoreOpportunities(input: OpportunityScorerInput): OpportunityScorerResult {
  const allOpportunities: ScoredOpportunity[] = [];
  let opId = 0;

  // Score gap actions (fill empty slots)
  for (const gap of input.gapActions) {
    allOpportunities.push(scoreGapAction(gap, ++opId));
  }

  // Score upsells
  for (const upsell of input.upsellOpportunities) {
    allOpportunities.push(scoreUpsellOpp(upsell, ++opId));
  }

  // Score retention actions
  for (const action of input.retentionActions) {
    allOpportunities.push(scoreRetentionAction(action, ++opId));
  }

  // Score pricing opportunities
  for (const pricing of input.pricingOpportunities) {
    allOpportunities.push(scorePricingOpp(pricing, ++opId));
  }

  // Score reactivation targets
  for (const target of input.reactivationTargets) {
    allOpportunities.push(scoreReactivationTarget(target, ++opId));
  }

  // Score membership candidates
  for (const candidate of input.membershipCandidates) {
    allOpportunities.push(scoreMembershipCandidate(candidate, ++opId));
  }

  // Apply learning adjustments from historical outcomes
  applyLearningAdjustments(allOpportunities, input.historicalOutcomes);

  // Sort by score
  allOpportunities.sort((a, b) => b.score - a.score);

  const dailyTopTen = allOpportunities.slice(0, 10);
  const categoryBreakdown = buildCategoryBreakdown(allOpportunities);
  const weeklyReport = buildWeeklyReport(allOpportunities, input);
  const roiTracking = buildROITracking(input.historicalOutcomes);
  const learnings = extractLearnings(input.historicalOutcomes);

  return {
    scoredOpportunities: allOpportunities.slice(0, 50),
    dailyTopTen,
    weeklyReport,
    categoryBreakdown,
    roiTracking,
    learnings,
  };
}

// ── SCORING FUNCTIONS ──

function scoreGapAction(gap: GapAction, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(gap.estimatedRevenue);
  const effortScore = gap.daysUntil <= 1 ? EFFORT_SCORES.medium : EFFORT_SCORES.low;
  const timeScore = gap.daysUntil === 0 ? TIME_SCORES.immediate : gap.daysUntil <= 7 ? TIME_SCORES['this-week'] : TIME_SCORES['this-month'];
  const probabilityScore = gap.daysUntil <= 1 ? 40 : gap.daysUntil <= 3 ? 55 : 70;

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  return {
    id: `opp-${id}`,
    category: 'fill-empty-slot',
    title: `Fill ${gap.timeSlot} slot with ${gap.provider}`,
    description: `Empty ${gap.timeSlot} on ${gap.date} (${gap.provider}). Suggested: ${gap.suggestedServices.join(', ')}`,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: gap.estimatedRevenue,
    effort: gap.daysUntil <= 1 ? 'medium' : 'low',
    timeToImpact: gap.daysUntil === 0 ? 'immediate' : gap.daysUntil <= 7 ? 'this-week' : 'this-month',
    probability: probabilityScore,
    expectedValue: Math.round(gap.estimatedRevenue * probabilityScore / 100),
    suggestedAction: `Contact waitlist clients and recent inquiries to fill this opening.`,
    suggestedScript: `Great news -- we have a last-minute opening ${gap.daysUntil === 0 ? 'today' : 'this week'} for ${gap.suggestedServices[0] || 'a treatment'}. Would you like to grab it?`,
    tags: ['fill-gap', gap.daysUntil <= 1 ? 'urgent' : 'planned'],
  };
}

function scoreUpsellOpp(upsell: UpsellOpp, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(upsell.revenueImpact);
  const effortScore = EFFORT_SCORES.low;
  const timeScore = TIME_SCORES.immediate;
  const probabilityScore = upsell.propensityScore;

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  return {
    id: `opp-${id}`,
    category: 'upsell-existing',
    title: `Upsell ${upsell.suggestedService} to ${upsell.clientName}`,
    description: `${upsell.clientName} is booked for ${upsell.currentService}. Suggest ${upsell.suggestedService} add-on ($${upsell.revenueImpact}).`,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: upsell.revenueImpact,
    effort: 'low',
    timeToImpact: 'immediate',
    probability: probabilityScore,
    expectedValue: Math.round(upsell.revenueImpact * probabilityScore / 100),
    targetClient: upsell.clientName,
    suggestedAction: `During ${upsell.clientName}'s ${upsell.currentService} visit, suggest ${upsell.suggestedService}.`,
    tags: ['upsell', 'in-visit'],
  };
}

function scoreRetentionAction(action: RetentionAction, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(action.estimatedRevenue);
  const effort = action.type === 'vip-retention' ? 'high' : action.type === 'winback' ? 'medium' : 'low';
  const effortScore = EFFORT_SCORES[effort];
  const timeScore = action.urgency === 'overdue' || action.urgency === 'critical'
    ? TIME_SCORES['this-week']
    : TIME_SCORES['this-month'];

  let probabilityScore = 50;
  if (action.type === 'rebook') probabilityScore = 65;
  if (action.type === 'vip-retention') probabilityScore = 55;
  if (action.type === 'winback') probabilityScore = 30;
  if (action.daysSinceVisit > 90) probabilityScore -= 15;
  if (action.totalSpend && action.totalSpend > 3000) probabilityScore += 10;

  probabilityScore = Math.min(90, Math.max(5, probabilityScore));

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  const categoryMap: Record<string, OpportunityCategory> = {
    'rebook': 'rebook-overdue',
    'winback': 'win-back-lapsed',
    'vip-retention': 'vip-retention',
  };

  return {
    id: `opp-${id}`,
    category: categoryMap[action.type] || 'rebook-overdue',
    title: `${action.type === 'rebook' ? 'Rebook' : action.type === 'vip-retention' ? 'VIP retention' : 'Win back'}: ${action.clientName}`,
    description: `${action.clientName} last visited ${action.daysSinceVisit} days ago. ${action.urgency === 'critical' ? 'CRITICAL: Immediate action needed.' : ''}`,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: action.estimatedRevenue,
    effort,
    timeToImpact: action.urgency === 'critical' ? 'this-week' : 'this-month',
    probability: probabilityScore,
    expectedValue: Math.round(action.estimatedRevenue * probabilityScore / 100),
    targetClient: action.clientName,
    suggestedAction: generateRetentionScript(action),
    tags: [action.type, action.urgency === 'critical' ? 'urgent' : 'standard'],
  };
}

function scorePricingOpp(pricing: PricingOpp, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(pricing.estimatedRevenueImpact);
  const effortScore = pricing.type === 'last-minute-fill' ? EFFORT_SCORES.low : EFFORT_SCORES.medium;
  const timeScore = pricing.type === 'last-minute-fill' ? TIME_SCORES.immediate : TIME_SCORES['this-month'];
  const probabilityScore = pricing.type === 'last-minute-fill' ? 50 : pricing.type === 'bundle' ? 60 : 70;

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  return {
    id: `opp-${id}`,
    category: 'price-optimization',
    title: `${pricing.type === 'price-increase' ? 'Price increase' : pricing.type === 'bundle' ? 'New bundle' : 'Last-minute fill'}: ${pricing.service}`,
    description: pricing.description,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: pricing.estimatedRevenueImpact,
    effort: pricing.type === 'last-minute-fill' ? 'low' : 'medium',
    timeToImpact: pricing.type === 'last-minute-fill' ? 'immediate' : 'this-month',
    probability: probabilityScore,
    expectedValue: Math.round(pricing.estimatedRevenueImpact * probabilityScore / 100),
    suggestedAction: pricing.description,
    tags: ['pricing', pricing.type],
  };
}

function scoreReactivationTarget(target: ReactivationTarget, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(target.estimatedRevenue);
  const effortScore = EFFORT_SCORES.medium;
  const timeScore = TIME_SCORES['this-month'];
  const probabilityScore = target.winBackProbability;

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  return {
    id: `opp-${id}`,
    category: 'reactivate-dormant',
    title: `Reactivate ${target.clientName} (${target.daysSinceVisit}d dormant)`,
    description: `$${target.totalSpend.toLocaleString()} lifetime spend, last had ${target.lastService}. ${target.winBackProbability}% win-back probability.`,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: target.estimatedRevenue,
    effort: 'medium',
    timeToImpact: 'this-month',
    probability: target.winBackProbability,
    expectedValue: Math.round(target.estimatedRevenue * target.winBackProbability / 100),
    targetClient: target.clientName,
    suggestedAction: `Send personalized reactivation message referencing their ${target.lastService} experience.`,
    tags: ['reactivation', target.daysSinceVisit > 90 ? 'long-dormant' : 'recent-lapsed'],
  };
}

function scoreMembershipCandidate(candidate: MembershipCandidate, id: number): ScoredOpportunity {
  const revenueScore = getRevenueScore(candidate.annualValue / 12);
  const effortScore = EFFORT_SCORES.medium;
  const timeScore = TIME_SCORES['this-week'];
  const probabilityScore = candidate.conversionLikelihood;

  const score = Math.round(
    revenueScore * SCORING_WEIGHTS.revenue +
    effortScore * SCORING_WEIGHTS.effort +
    timeScore * SCORING_WEIGHTS.timeToImpact +
    probabilityScore * SCORING_WEIGHTS.probability,
  );

  return {
    id: `opp-${id}`,
    category: 'membership-conversion',
    title: `Convert ${candidate.clientName} to ${candidate.suggestedTier} membership`,
    description: `${candidate.visitCount} visits, $${candidate.avgTicket} avg ticket. ${candidate.suggestedTier} at $${candidate.monthlyPrice}/mo would save them money and lock in recurring revenue.`,
    score,
    scoreBreakdown: {
      revenueWeight: revenueScore,
      effortWeight: effortScore,
      timeWeight: timeScore,
      probabilityWeight: probabilityScore,
    },
    estimatedRevenue: candidate.annualValue / 12,
    effort: 'medium',
    timeToImpact: 'this-week',
    probability: candidate.conversionLikelihood,
    expectedValue: Math.round((candidate.annualValue / 12) * candidate.conversionLikelihood / 100),
    targetClient: candidate.clientName,
    suggestedAction: `During ${candidate.clientName}'s next visit, present ${candidate.suggestedTier} membership benefits.`,
    suggestedScript: `Based on how often you visit, the ${candidate.suggestedTier} membership at $${candidate.monthlyPrice}/mo would actually save you money while unlocking priority booking and exclusive perks.`,
    tags: ['membership', 'conversion'],
  };
}

// ── LEARNING ADJUSTMENTS ──

function applyLearningAdjustments(opportunities: ScoredOpportunity[], outcomes: ActionOutcome[]): void {
  if (outcomes.length < 5) return; // need minimum data

  const categorySuccess = new Map<string, { total: number; success: number }>();

  for (const outcome of outcomes) {
    if (!categorySuccess.has(outcome.category)) {
      categorySuccess.set(outcome.category, { total: 0, success: 0 });
    }
    const data = categorySuccess.get(outcome.category)!;
    data.total++;
    if (outcome.result === 'success' || outcome.result === 'partial') data.success++;
  }

  for (const opp of opportunities) {
    const data = categorySuccess.get(opp.category);
    if (!data || data.total < 3) continue;

    const historicalSuccessRate = data.success / data.total;
    const adjustment = (historicalSuccessRate - 0.5) * 10; // +/- 5 points
    opp.score = Math.min(100, Math.max(0, opp.score + Math.round(adjustment)));
  }
}

// ── CATEGORY BREAKDOWN ──

function buildCategoryBreakdown(opportunities: ScoredOpportunity[]): CategoryBreakdown[] {
  const categories = new Map<OpportunityCategory, ScoredOpportunity[]>();

  for (const opp of opportunities) {
    if (!categories.has(opp.category)) categories.set(opp.category, []);
    categories.get(opp.category)!.push(opp);
  }

  return [...categories.entries()].map(([category, opps]) => ({
    category,
    count: opps.length,
    totalEstimatedRevenue: Math.round(opps.reduce((s, o) => s + o.estimatedRevenue, 0)),
    avgScore: Math.round(opps.reduce((s, o) => s + o.score, 0) / opps.length),
    avgProbability: Math.round(opps.reduce((s, o) => s + o.probability, 0) / opps.length),
    expectedTotalValue: Math.round(opps.reduce((s, o) => s + o.expectedValue, 0)),
    topAction: opps[0]?.suggestedAction || '',
  })).sort((a, b) => b.expectedTotalValue - a.expectedTotalValue);
}

// ── WEEKLY REPORT ──

function buildWeeklyReport(opportunities: ScoredOpportunity[], input: OpportunityScorerInput): WeeklyOpportunityReport {
  const totalValue = opportunities.reduce((s, o) => s + o.estimatedRevenue, 0);

  const categoryDist = new Map<string, { count: number; totalValue: number }>();
  for (const opp of opportunities) {
    const existing = categoryDist.get(opp.category) || { count: 0, totalValue: 0 };
    existing.count++;
    existing.totalValue += opp.estimatedRevenue;
    categoryDist.set(opp.category, existing);
  }

  // Previous week comparison from historical outcomes
  const recentOutcomes = input.historicalOutcomes.filter(o => {
    const daysAgo = Math.floor((new Date(input.currentDate).getTime() - new Date(o.date).getTime()) / 86400000);
    return daysAgo <= 7;
  });

  const prevWeekRevenue = recentOutcomes.reduce((s, o) => s + o.revenueGenerated, 0);
  const prevWeekActions = recentOutcomes.length;
  const prevSuccessful = recentOutcomes.filter(o => o.result === 'success' || o.result === 'partial').length;

  return {
    weekOf: input.currentDate,
    totalOpportunityValue: Math.round(totalValue),
    topOpportunities: opportunities.slice(0, 10),
    categoryDistribution: [...categoryDist.entries()].map(([category, data]) => ({
      category,
      count: data.count,
      totalValue: Math.round(data.totalValue),
    })),
    previousWeekComparison: {
      totalValue: Math.round(prevWeekRevenue),
      actionsCompleted: prevWeekActions,
      revenueCapture: Math.round(prevWeekRevenue),
      captureRate: prevWeekActions > 0 ? Math.round((prevSuccessful / prevWeekActions) * 100) : 0,
    },
    recommendations: generateWeeklyRecommendations(opportunities, recentOutcomes),
  };
}

function generateWeeklyRecommendations(opps: ScoredOpportunity[], outcomes: ActionOutcome[]): string[] {
  const recs: string[] = [];

  const fillSlots = opps.filter(o => o.category === 'fill-empty-slot');
  if (fillSlots.length > 5) {
    recs.push(`${fillSlots.length} empty slots identified this week. Prioritize filling same-day and next-day openings first.`);
  }

  const vipActions = opps.filter(o => o.category === 'vip-retention');
  if (vipActions.length > 0) {
    recs.push(`${vipActions.length} VIP client${vipActions.length > 1 ? 's need' : ' needs'} personal attention. These are your highest-value relationships.`);
  }

  const membershipOpps = opps.filter(o => o.category === 'membership-conversion');
  if (membershipOpps.length >= 3) {
    recs.push(`${membershipOpps.length} clients are strong membership conversion candidates. Run a membership drive this week.`);
  }

  const successRate = outcomes.length > 0
    ? outcomes.filter(o => o.result === 'success').length / outcomes.length
    : 0;
  if (successRate < 0.3 && outcomes.length >= 5) {
    recs.push('Action success rate is below 30%. Focus on higher-probability opportunities and refine outreach scripts.');
  }

  recs.push('Review and act on the top 3 opportunities daily for maximum revenue capture.');

  return recs.slice(0, 5);
}

// ── ROI TRACKING ──

function buildROITracking(outcomes: ActionOutcome[]): ROITracking {
  if (outcomes.length === 0) {
    return {
      totalActionsTracked: 0,
      successRate: 0,
      totalRevenueGenerated: 0,
      avgRevenuePerAction: 0,
      bestPerformingCategory: 'N/A',
      worstPerformingCategory: 'N/A',
      trendsOverTime: [],
    };
  }

  const successful = outcomes.filter(o => o.result === 'success' || o.result === 'partial');
  const totalRevenue = outcomes.reduce((s, o) => s + o.revenueGenerated, 0);

  // Category performance
  const catPerf = new Map<string, { total: number; success: number; revenue: number }>();
  for (const o of outcomes) {
    const data = catPerf.get(o.category) || { total: 0, success: 0, revenue: 0 };
    data.total++;
    if (o.result === 'success' || o.result === 'partial') data.success++;
    data.revenue += o.revenueGenerated;
    catPerf.set(o.category, data);
  }

  let bestCat = 'N/A';
  let worstCat = 'N/A';
  let bestRate = 0;
  let worstRate = 1;

  for (const [cat, data] of catPerf) {
    if (data.total < 2) continue;
    const rate = data.success / data.total;
    if (rate > bestRate) { bestRate = rate; bestCat = cat; }
    if (rate < worstRate) { worstRate = rate; worstCat = cat; }
  }

  // Weekly trends
  const weekMap = new Map<string, { actions: number; revenue: number; success: number }>();
  for (const o of outcomes) {
    const week = getWeekStart(o.date);
    const data = weekMap.get(week) || { actions: 0, revenue: 0, success: 0 };
    data.actions++;
    data.revenue += o.revenueGenerated;
    if (o.result === 'success' || o.result === 'partial') data.success++;
    weekMap.set(week, data);
  }

  return {
    totalActionsTracked: outcomes.length,
    successRate: Math.round((successful.length / outcomes.length) * 100),
    totalRevenueGenerated: Math.round(totalRevenue),
    avgRevenuePerAction: Math.round(totalRevenue / outcomes.length),
    bestPerformingCategory: bestCat,
    worstPerformingCategory: worstCat,
    trendsOverTime: [...weekMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data]) => ({
        week,
        actions: data.actions,
        revenue: Math.round(data.revenue),
        successRate: Math.round((data.success / data.actions) * 100),
      })),
  };
}

// ── EXTRACT LEARNINGS ──

function extractLearnings(outcomes: ActionOutcome[]): ActionLearning[] {
  const learnings: ActionLearning[] = [];

  const catData = new Map<string, ActionOutcome[]>();
  for (const o of outcomes) {
    if (!catData.has(o.category)) catData.set(o.category, []);
    catData.get(o.category)!.push(o);
  }

  for (const [category, actions] of catData) {
    if (actions.length < 3) continue;

    const successRate = actions.filter(a => a.result === 'success').length / actions.length;
    const avgRevenue = actions.reduce((s, a) => s + a.revenueGenerated, 0) / actions.length;

    if (successRate > 0.6) {
      learnings.push({
        category,
        insight: `${category} actions have a ${Math.round(successRate * 100)}% success rate with $${Math.round(avgRevenue)} avg revenue.`,
        recommendation: `Increase volume of ${category} actions -- they are your highest-performing category.`,
        confidence: Math.min(95, 50 + actions.length * 5),
        basedOnActions: actions.length,
      });
    } else if (successRate < 0.25) {
      learnings.push({
        category,
        insight: `${category} actions have only ${Math.round(successRate * 100)}% success rate.`,
        recommendation: `Refine approach for ${category} actions. Consider timing, messaging, or targeting adjustments.`,
        confidence: Math.min(90, 40 + actions.length * 5),
        basedOnActions: actions.length,
      });
    }
  }

  return learnings.sort((a, b) => b.confidence - a.confidence);
}

// ── HELPERS ──

function getRevenueScore(revenue: number): number {
  for (const level of REVENUE_SCALE) {
    if (revenue >= level.threshold) return level.score;
  }
  return 5;
}

function generateRetentionScript(action: RetentionAction): string {
  const firstName = action.clientName.split(' ')[0];
  if (action.type === 'vip-retention') {
    return `Personal call: "${firstName}, this is [name] from Rani Beauty Clinic. As one of our most valued clients, I wanted to personally check in and ensure you are happy with your results."`;
  }
  if (action.type === 'winback') {
    return `SMS: "Hi ${firstName}! We miss you at Rani Beauty Clinic. It has been a while -- we would love to welcome you back for your next treatment. Reply BOOK for our next available opening!"`;
  }
  return `SMS: "${firstName}, just a friendly reminder -- your next treatment is due! Book now to keep your results on track. Reply BOOK or call us!"`;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
