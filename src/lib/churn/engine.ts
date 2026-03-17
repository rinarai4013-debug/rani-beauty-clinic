/**
 * Churn Prediction Engine for Rani Beauty Clinic
 *
 * Scores clients 0–100 on churn risk based on behavioral signals.
 * Higher score = higher risk of churning.
 *
 * Factors:
 * 1. Recency (40%) — Days since last visit
 * 2. Frequency decline (20%) — Visit frequency trending down
 * 3. Monetary trend (15%) — Spending decreasing
 * 4. Membership status (15%) — Active membership = lower risk
 * 5. Engagement (10%) — Recent communication responses
 */

export interface ChurnInput {
  daysSinceLastVisit: number;
  visitDates: string[]; // ISO date strings, sorted newest first
  transactionAmounts: number[]; // Amounts sorted newest first (matching visit dates)
  hasMembership: boolean;
  membershipTier?: string;
  totalMessages: number;
  recentMessageCount: number; // Messages in last 30 days
  status: string;
}

export interface ChurnScore {
  score: number; // 0-100, higher = more likely to churn
  risk: 'low' | 'moderate' | 'high' | 'critical';
  factors: ChurnFactor[];
  recommendation: string;
}

export interface ChurnFactor {
  name: string;
  score: number; // 0-100 contribution
  weight: number; // percentage weight
  detail: string;
}

const WEIGHTS = {
  recency: 0.40,
  frequency: 0.20,
  monetary: 0.15,
  membership: 0.15,
  engagement: 0.10,
};

/**
 * Calculate recency score (0-100).
 * 0 days = 0 risk, 120+ days = 100 risk
 */
function scoreRecency(daysSinceLastVisit: number): { score: number; detail: string } {
  if (daysSinceLastVisit <= 0) return { score: 0, detail: 'Visited today' };
  if (daysSinceLastVisit <= 14) return { score: 5, detail: `${daysSinceLastVisit}d ago — recent` };
  if (daysSinceLastVisit <= 30) return { score: 15, detail: `${daysSinceLastVisit}d ago — normal` };
  if (daysSinceLastVisit <= 45) return { score: 35, detail: `${daysSinceLastVisit}d ago — starting to lapse` };
  if (daysSinceLastVisit <= 60) return { score: 55, detail: `${daysSinceLastVisit}d ago — lapsing` };
  if (daysSinceLastVisit <= 90) return { score: 75, detail: `${daysSinceLastVisit}d ago — at risk` };
  if (daysSinceLastVisit <= 120) return { score: 90, detail: `${daysSinceLastVisit}d ago — high risk` };
  return { score: 100, detail: `${daysSinceLastVisit}d ago — likely churned` };
}

/**
 * Calculate frequency decline score (0-100).
 * Compares recent 3-month visit frequency to prior 3-month frequency.
 */
function scoreFrequency(visitDates: string[]): { score: number; detail: string } {
  if (visitDates.length <= 1) return { score: 50, detail: 'Too few visits to analyze trend' };

  const now = Date.now();
  const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

  const recentVisits = visitDates.filter(d => new Date(d).getTime() > threeMonthsAgo).length;
  const priorVisits = visitDates.filter(d => {
    const t = new Date(d).getTime();
    return t > sixMonthsAgo && t <= threeMonthsAgo;
  }).length;

  if (priorVisits === 0 && recentVisits === 0) return { score: 70, detail: 'No visits in 6 months' };
  if (priorVisits === 0) return { score: 10, detail: `${recentVisits} recent visits, new client` };

  const ratio = recentVisits / priorVisits;
  if (ratio >= 1.0) return { score: 5, detail: `Frequency stable or increasing (${recentVisits} vs ${priorVisits})` };
  if (ratio >= 0.7) return { score: 25, detail: `Slight decline (${recentVisits} vs ${priorVisits})` };
  if (ratio >= 0.4) return { score: 55, detail: `Declining (${recentVisits} vs ${priorVisits})` };
  if (ratio > 0) return { score: 80, detail: `Sharp decline (${recentVisits} vs ${priorVisits})` };
  return { score: 95, detail: `Stopped visiting (0 vs ${priorVisits})` };
}

/**
 * Calculate monetary trend score (0-100).
 * Compares average recent spend to prior average.
 */
function scoreMonetary(amounts: number[]): { score: number; detail: string } {
  if (amounts.length <= 1) return { score: 30, detail: 'Too few transactions to analyze' };

  const midpoint = Math.floor(amounts.length / 2);
  const recentAvg = amounts.slice(0, midpoint).reduce((s, a) => s + a, 0) / midpoint;
  const priorAvg = amounts.slice(midpoint).reduce((s, a) => s + a, 0) / (amounts.length - midpoint);

  if (priorAvg === 0) return { score: 20, detail: 'No prior spend baseline' };

  const ratio = recentAvg / priorAvg;
  if (ratio >= 1.0) return { score: 5, detail: `Spending up ($${Math.round(recentAvg)} avg)` };
  if (ratio >= 0.7) return { score: 25, detail: `Spending stable ($${Math.round(recentAvg)} avg)` };
  if (ratio >= 0.4) return { score: 55, detail: `Spending declining ($${Math.round(recentAvg)} vs $${Math.round(priorAvg)})` };
  return { score: 85, detail: `Spending dropped significantly` };
}

/**
 * Score membership status (0-100).
 * Active membership = much lower churn risk.
 */
function scoreMembership(hasMembership: boolean, tier?: string): { score: number; detail: string } {
  if (!hasMembership) return { score: 60, detail: 'No active membership' };

  const tierMap: Record<string, number> = {
    'Diamond': 5,
    'Platinum': 8,
    'Gold': 10,
    'Silver': 15,
    'Bronze': 20,
  };

  const score = tierMap[tier || ''] ?? 15;
  return { score, detail: `Active ${tier || ''} member` };
}

/**
 * Score engagement (0-100).
 * Recent communication = lower risk.
 */
function scoreEngagement(totalMessages: number, recentCount: number): { score: number; detail: string } {
  if (totalMessages === 0) return { score: 50, detail: 'No messages in system' };
  if (recentCount >= 3) return { score: 5, detail: `${recentCount} messages in last 30d — highly engaged` };
  if (recentCount >= 1) return { score: 20, detail: `${recentCount} message(s) in last 30d` };
  if (totalMessages >= 5) return { score: 45, detail: 'Previously engaged, now quiet' };
  return { score: 65, detail: 'Low engagement history' };
}

/**
 * Calculate the full churn prediction score.
 */
export function predictChurn(input: ChurnInput): ChurnScore {
  const recency = scoreRecency(input.daysSinceLastVisit);
  const frequency = scoreFrequency(input.visitDates);
  const monetary = scoreMonetary(input.transactionAmounts);
  const membership = scoreMembership(input.hasMembership, input.membershipTier);
  const engagement = scoreEngagement(input.totalMessages, input.recentMessageCount);

  const weightedScore = Math.round(
    recency.score * WEIGHTS.recency +
    frequency.score * WEIGHTS.frequency +
    monetary.score * WEIGHTS.monetary +
    membership.score * WEIGHTS.membership +
    engagement.score * WEIGHTS.engagement
  );

  const score = Math.min(100, Math.max(0, weightedScore));

  const risk: ChurnScore['risk'] =
    score >= 75 ? 'critical' :
    score >= 50 ? 'high' :
    score >= 25 ? 'moderate' :
    'low';

  const factors: ChurnFactor[] = [
    { name: 'Recency', score: recency.score, weight: WEIGHTS.recency * 100, detail: recency.detail },
    { name: 'Frequency', score: frequency.score, weight: WEIGHTS.frequency * 100, detail: frequency.detail },
    { name: 'Monetary', score: monetary.score, weight: WEIGHTS.monetary * 100, detail: monetary.detail },
    { name: 'Membership', score: membership.score, weight: WEIGHTS.membership * 100, detail: membership.detail },
    { name: 'Engagement', score: engagement.score, weight: WEIGHTS.engagement * 100, detail: engagement.detail },
  ];

  const recommendation = getRecommendation(score, input, factors);

  return { score, risk, factors, recommendation };
}

function getRecommendation(
  score: number,
  input: ChurnInput,
  factors: ChurnFactor[]
): string {
  if (score < 25) return 'Client is engaged and healthy. Continue regular touch points.';

  const topFactor = [...factors].sort((a, b) => b.score - a.score)[0];

  if (score >= 75) {
    if (!input.hasMembership) {
      return `URGENT: ${input.daysSinceLastVisit}+ days since last visit. Send personalized reactivation offer with exclusive discount. Consider membership pitch.`;
    }
    return `URGENT: High churn risk despite membership. Personal outreach from provider recommended. Offer a complimentary treatment or upgrade.`;
  }

  if (score >= 50) {
    if (topFactor.name === 'Recency') {
      return `Client hasn't visited in ${input.daysSinceLastVisit} days. Send a "we miss you" text with a seasonal offer.`;
    }
    if (topFactor.name === 'Frequency') {
      return 'Visit frequency declining. Recommend booking their next appointment before they leave today.';
    }
    if (topFactor.name === 'Monetary') {
      return 'Spending is declining. Consider presenting a package deal or membership to lock in value.';
    }
    return 'Monitor closely. Schedule a check-in call or send a personalized treatment recommendation.';
  }

  // 25-49
  return 'Low-moderate risk. Ensure regular automated touchpoints (birthday, seasonal offers) are active.';
}
