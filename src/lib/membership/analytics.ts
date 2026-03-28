/**
 * Membership Analytics Engine — Rani Beauty Clinic
 *
 * Comprehensive analytics for the membership program:
 * - MRR / ARR calculations
 * - Churn rate (voluntary, involuntary, total)
 * - LTV by tier
 * - Net revenue retention
 * - Expansion & contraction revenue
 * - Cohort analysis (retention by join month)
 * - Revenue per member
 * - Average membership duration
 * - Upgrade/downgrade rates
 * - Seasonal enrollment patterns
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type { MembershipTier, BillingCycle, MembershipStatus } from './plans';
import { PLANS, MEMBERSHIP_TIERS } from './plans';

// ── Types ────────────────────────────────────────────────────────────────

export interface MemberRecord {
  memberId: string;
  clientId: string;
  clientName: string;
  tier: MembershipTier;
  billingCycle: BillingCycle;
  status: MembershipStatus;
  monthlyRate: number;
  joinDate: string; // ISO date
  cancelledAt?: string;
  pausedAt?: string;
  previousTier?: MembershipTier;
  upgradedAt?: string;
  downgradedAt?: string;
  provider?: string;
  additionalRevenue: number; // Add-on services beyond membership
}

export interface RevenueEvent {
  memberId: string;
  type: 'new' | 'upgrade' | 'downgrade' | 'churn' | 'reactivation' | 'renewal' | 'add_on';
  amount: number; // Monthly revenue change (positive or negative)
  previousAmount?: number;
  date: string;
  tier: MembershipTier;
  previousTier?: MembershipTier;
}

export interface CohortData {
  cohort: string; // YYYY-MM
  startingMembers: number;
  retentionByMonth: number[]; // Percentage retained at each month [m1, m2, m3, ...]
  revenueByMonth: number[];
  churnedByMonth: number[];
}

export interface MembershipAnalyticsDashboard {
  // Revenue
  mrr: number;
  mrrGrowth: number; // Percentage change from previous month
  arr: number;
  arrProjection: number;
  revenuePerMember: number;
  totalRevenue: number;

  // Churn
  churnRate: ChurnRates;
  averageMembershipDuration: number; // months

  // LTV
  ltvByTier: Record<MembershipTier, number>;
  averageLTV: number;

  // Growth
  netRevenueRetention: number; // Percentage
  expansionRevenue: number;
  contractionRevenue: number;
  newMRR: number;
  churnedMRR: number;

  // Members
  totalMembers: number;
  activeMembers: number;
  pausedMembers: number;
  cancelledMembers: number;
  tierDistribution: Record<MembershipTier, number>;
  billingCycleDistribution: Record<BillingCycle, number>;

  // Rates
  upgradeRate: number; // Percentage
  downgradeRate: number;
  enrollmentRate: number;

  // Cohort
  cohorts: CohortData[];

  // Seasonal
  seasonalPatterns: SeasonalPattern[];

  // Trends
  mrrHistory: { month: string; mrr: number; members: number }[];
}

export interface ChurnRates {
  total: number; // Monthly churn rate as percentage
  voluntary: number;
  involuntary: number;
  grossChurn: number;
  netChurn: number; // After reactivations
}

export interface SeasonalPattern {
  month: number; // 1-12
  monthName: string;
  enrollments: number;
  cancellations: number;
  netChange: number;
  trend: 'strong' | 'moderate' | 'weak';
}

export interface MRRMovement {
  month: string;
  startingMRR: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  reactivationMRR: number;
  endingMRR: number;
  netNewMRR: number;
}

// ── Core Analytics Functions ─────────────────────────────────────────────

/**
 * Calculate Monthly Recurring Revenue.
 */
export function calculateMRR(members: MemberRecord[]): number {
  return members
    .filter(m => m.status === 'active' || m.status === 'past_due')
    .reduce((sum, m) => sum + m.monthlyRate, 0);
}

/**
 * Calculate Annual Recurring Revenue (MRR x 12).
 */
export function calculateARR(mrr: number): number {
  return Math.round(mrr * 12 * 100) / 100;
}

/**
 * Project ARR based on current growth trend.
 */
export function projectARR(
  currentMRR: number,
  monthlyGrowthRate: number,
  monthsToProject: number = 12,
): number {
  let projectedMRR = currentMRR;
  for (let i = 0; i < monthsToProject; i++) {
    projectedMRR *= (1 + monthlyGrowthRate / 100);
  }
  return Math.round(projectedMRR * 12 * 100) / 100;
}

/**
 * Calculate MRR growth rate (month over month).
 */
export function calculateMRRGrowth(currentMRR: number, previousMRR: number): number {
  if (previousMRR === 0) return currentMRR > 0 ? 100 : 0;
  return Math.round(((currentMRR - previousMRR) / previousMRR) * 10000) / 100;
}

// ── Churn Calculations ───────────────────────────────────────────────────

/**
 * Calculate churn rates for a given period.
 */
export function calculateChurnRates(
  startOfPeriodMembers: number,
  voluntaryChurned: number,
  involuntaryChurned: number,
  reactivated: number,
): ChurnRates {
  if (startOfPeriodMembers === 0) {
    return { total: 0, voluntary: 0, involuntary: 0, grossChurn: 0, netChurn: 0 };
  }

  const totalChurned = voluntaryChurned + involuntaryChurned;
  const grossChurn = Math.round((totalChurned / startOfPeriodMembers) * 10000) / 100;
  const netChurn = Math.round(((totalChurned - reactivated) / startOfPeriodMembers) * 10000) / 100;

  return {
    total: grossChurn,
    voluntary: Math.round((voluntaryChurned / startOfPeriodMembers) * 10000) / 100,
    involuntary: Math.round((involuntaryChurned / startOfPeriodMembers) * 10000) / 100,
    grossChurn,
    netChurn: Math.max(0, netChurn),
  };
}

/**
 * Calculate MRR churn (churned revenue as % of starting MRR).
 */
export function calculateMRRChurn(churnedMRR: number, startingMRR: number): number {
  if (startingMRR === 0) return 0;
  return Math.round((churnedMRR / startingMRR) * 10000) / 100;
}

// ── LTV Calculations ─────────────────────────────────────────────────────

/**
 * Calculate Lifetime Value for a tier.
 * LTV = ARPU / Monthly Churn Rate
 */
export function calculateLTV(
  averageMonthlyRevenue: number,
  monthlyChurnRate: number,
): number {
  if (monthlyChurnRate <= 0) return averageMonthlyRevenue * 120; // Cap at 10 years
  return Math.round((averageMonthlyRevenue / (monthlyChurnRate / 100)) * 100) / 100;
}

/**
 * Calculate LTV by tier.
 */
export function calculateLTVByTier(
  members: MemberRecord[],
  cancelledMembers: MemberRecord[],
  periodMonths: number = 12,
): Record<MembershipTier, number> {
  const result: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };

  for (const tier of MEMBERSHIP_TIERS) {
    const tierMembers = members.filter(m => m.tier === tier && (m.status === 'active' || m.status === 'past_due'));
    const tierCancelled = cancelledMembers.filter(m => m.tier === tier);
    const totalForTier = tierMembers.length + tierCancelled.length;

    if (totalForTier === 0) continue;

    const avgRevenue = tierMembers.length > 0
      ? tierMembers.reduce((s, m) => s + m.monthlyRate + (m.additionalRevenue / 12), 0) / tierMembers.length
      : PLANS[tier].monthlyPrice;

    const churnRate = totalForTier > 0
      ? (tierCancelled.length / totalForTier / periodMonths) * 100
      : 2; // Default 2% monthly churn

    result[tier] = calculateLTV(avgRevenue, Math.max(churnRate, 0.5));
  }

  return result;
}

// ── Revenue Retention ────────────────────────────────────────────────────

/**
 * Calculate Net Revenue Retention (NRR).
 * NRR > 100% means expansion revenue exceeds churned revenue.
 */
export function calculateNetRevenueRetention(
  startingMRR: number,
  expansionMRR: number,
  contractionMRR: number,
  churnedMRR: number,
): number {
  if (startingMRR === 0) return 100;
  const nrr = ((startingMRR + expansionMRR - contractionMRR - churnedMRR) / startingMRR) * 100;
  return Math.round(nrr * 10) / 10;
}

/**
 * Calculate expansion revenue from upgrades and add-ons.
 */
export function calculateExpansionRevenue(events: RevenueEvent[]): number {
  return events
    .filter(e => e.type === 'upgrade' || e.type === 'add_on')
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate contraction revenue from downgrades.
 */
export function calculateContractionRevenue(events: RevenueEvent[]): number {
  return Math.abs(
    events
      .filter(e => e.type === 'downgrade')
      .reduce((sum, e) => sum + e.amount, 0)
  );
}

/**
 * Build MRR movement for a month.
 */
export function buildMRRMovement(
  month: string,
  startingMRR: number,
  events: RevenueEvent[],
): MRRMovement {
  const monthEvents = events.filter(e => e.date.startsWith(month));

  const newMRR = monthEvents
    .filter(e => e.type === 'new')
    .reduce((s, e) => s + e.amount, 0);

  const expansionMRR = monthEvents
    .filter(e => e.type === 'upgrade' || e.type === 'add_on')
    .reduce((s, e) => s + e.amount, 0);

  const contractionMRR = Math.abs(monthEvents
    .filter(e => e.type === 'downgrade')
    .reduce((s, e) => s + e.amount, 0));

  const churnedMRR = Math.abs(monthEvents
    .filter(e => e.type === 'churn')
    .reduce((s, e) => s + e.amount, 0));

  const reactivationMRR = monthEvents
    .filter(e => e.type === 'reactivation')
    .reduce((s, e) => s + e.amount, 0);

  const endingMRR = startingMRR + newMRR + expansionMRR + reactivationMRR - contractionMRR - churnedMRR;
  const netNewMRR = newMRR + expansionMRR + reactivationMRR - contractionMRR - churnedMRR;

  return {
    month,
    startingMRR: Math.round(startingMRR * 100) / 100,
    newMRR: Math.round(newMRR * 100) / 100,
    expansionMRR: Math.round(expansionMRR * 100) / 100,
    contractionMRR: Math.round(contractionMRR * 100) / 100,
    churnedMRR: Math.round(churnedMRR * 100) / 100,
    reactivationMRR: Math.round(reactivationMRR * 100) / 100,
    endingMRR: Math.round(endingMRR * 100) / 100,
    netNewMRR: Math.round(netNewMRR * 100) / 100,
  };
}

// ── Member Distribution ──────────────────────────────────────────────────

/**
 * Calculate tier distribution.
 */
export function calculateTierDistribution(members: MemberRecord[]): Record<MembershipTier, number> {
  const distribution: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  for (const m of members) {
    if (m.status === 'active' || m.status === 'past_due') {
      distribution[m.tier]++;
    }
  }
  return distribution;
}

/**
 * Calculate billing cycle distribution.
 */
export function calculateBillingCycleDistribution(members: MemberRecord[]): Record<BillingCycle, number> {
  const distribution: Record<BillingCycle, number> = { monthly: 0, annual: 0 };
  for (const m of members) {
    if (m.status === 'active' || m.status === 'past_due') {
      distribution[m.billingCycle]++;
    }
  }
  return distribution;
}

// ── Upgrade / Downgrade Rates ────────────────────────────────────────────

/**
 * Calculate upgrade and downgrade rates.
 */
export function calculateTierChangeRates(
  events: RevenueEvent[],
  totalActiveMembers: number,
  periodMonths: number = 1,
): { upgradeRate: number; downgradeRate: number } {
  const upgrades = events.filter(e => e.type === 'upgrade').length;
  const downgrades = events.filter(e => e.type === 'downgrade').length;

  return {
    upgradeRate: totalActiveMembers > 0
      ? Math.round((upgrades / totalActiveMembers / periodMonths) * 10000) / 100
      : 0,
    downgradeRate: totalActiveMembers > 0
      ? Math.round((downgrades / totalActiveMembers / periodMonths) * 10000) / 100
      : 0,
  };
}

// ── Cohort Analysis ──────────────────────────────────────────────────────

/**
 * Build cohort analysis data.
 * Groups members by their join month and tracks retention over time.
 */
export function buildCohortAnalysis(
  members: MemberRecord[],
  maxMonths: number = 12,
): CohortData[] {
  // Group by join month
  const cohortMap = new Map<string, MemberRecord[]>();
  for (const m of members) {
    const cohort = m.joinDate.substring(0, 7); // YYYY-MM
    const existing = cohortMap.get(cohort) || [];
    existing.push(m);
    cohortMap.set(cohort, existing);
  }

  const now = new Date();
  const cohorts: CohortData[] = [];

  for (const [cohort, cohortMembers] of cohortMap.entries()) {
    const cohortDate = new Date(`${cohort}-01`);
    const monthsSinceCohort = Math.floor(
      (now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthsSinceCohort < 1) continue;

    const startingMembers = cohortMembers.length;
    const retentionByMonth: number[] = [];
    const revenueByMonth: number[] = [];
    const churnedByMonth: number[] = [];

    for (let month = 0; month < Math.min(monthsSinceCohort, maxMonths); month++) {
      const checkDate = new Date(cohortDate);
      checkDate.setMonth(checkDate.getMonth() + month + 1);

      const retained = cohortMembers.filter(m => {
        if (m.status === 'active' || m.status === 'paused' || m.status === 'past_due') return true;
        if (m.cancelledAt) {
          return new Date(m.cancelledAt) > checkDate;
        }
        return true;
      }).length;

      const churned = startingMembers - retained;
      const retentionRate = startingMembers > 0
        ? Math.round((retained / startingMembers) * 100)
        : 0;

      retentionByMonth.push(retentionRate);
      churnedByMonth.push(churned);

      // Revenue for this month from cohort
      const monthRevenue = cohortMembers
        .filter(m => {
          if (m.cancelledAt && new Date(m.cancelledAt) <= checkDate) return false;
          return true;
        })
        .reduce((s, m) => s + m.monthlyRate, 0);
      revenueByMonth.push(Math.round(monthRevenue * 100) / 100);
    }

    cohorts.push({
      cohort,
      startingMembers,
      retentionByMonth,
      revenueByMonth,
      churnedByMonth,
    });
  }

  return cohorts.sort((a, b) => a.cohort.localeCompare(b.cohort));
}

// ── Seasonal Analysis ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Analyze seasonal enrollment patterns.
 */
export function analyzeSeasonalPatterns(
  members: MemberRecord[],
): SeasonalPattern[] {
  const monthly: Record<number, { enrollments: number; cancellations: number }> = {};

  // Initialize all months
  for (let m = 1; m <= 12; m++) {
    monthly[m] = { enrollments: 0, cancellations: 0 };
  }

  for (const member of members) {
    const joinMonth = new Date(member.joinDate).getMonth() + 1;
    monthly[joinMonth].enrollments++;

    if (member.cancelledAt) {
      const cancelMonth = new Date(member.cancelledAt).getMonth() + 1;
      monthly[cancelMonth].cancellations++;
    }
  }

  const maxEnrollments = Math.max(...Object.values(monthly).map(m => m.enrollments));

  return Object.entries(monthly).map(([monthStr, data]) => {
    const month = parseInt(monthStr);
    const netChange = data.enrollments - data.cancellations;
    const enrollmentRatio = maxEnrollments > 0 ? data.enrollments / maxEnrollments : 0;

    return {
      month,
      monthName: MONTH_NAMES[month - 1],
      enrollments: data.enrollments,
      cancellations: data.cancellations,
      netChange,
      trend: enrollmentRatio > 0.7 ? 'strong' as const :
             enrollmentRatio > 0.4 ? 'moderate' as const :
             'weak' as const,
    };
  });
}

// ── Revenue Per Member ───────────────────────────────────────────────────

/**
 * Calculate average revenue per member (ARPM).
 */
export function calculateRevenuePerMember(
  totalMRR: number,
  activeMembers: number,
): number {
  if (activeMembers === 0) return 0;
  return Math.round((totalMRR / activeMembers) * 100) / 100;
}

/**
 * Calculate ARPM by tier.
 */
export function calculateRevenuePerMemberByTier(
  members: MemberRecord[],
): Record<MembershipTier, number> {
  const result: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };

  for (const tier of MEMBERSHIP_TIERS) {
    const tierMembers = members.filter(
      m => m.tier === tier && (m.status === 'active' || m.status === 'past_due')
    );
    if (tierMembers.length === 0) continue;

    const totalRevenue = tierMembers.reduce(
      (s, m) => s + m.monthlyRate + (m.additionalRevenue / 12), 0
    );
    result[tier] = Math.round((totalRevenue / tierMembers.length) * 100) / 100;
  }

  return result;
}

// ── Average Duration ─────────────────────────────────────────────────────

/**
 * Calculate average membership duration in months.
 */
export function calculateAverageDuration(members: MemberRecord[]): number {
  if (members.length === 0) return 0;

  const now = new Date();
  const durations = members.map(m => {
    const start = new Date(m.joinDate);
    const end = m.cancelledAt ? new Date(m.cancelledAt) : now;
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  });

  return Math.round(durations.reduce((s, d) => s + d, 0) / durations.length * 10) / 10;
}

/**
 * Calculate average duration by tier.
 */
export function calculateAverageDurationByTier(
  members: MemberRecord[],
): Record<MembershipTier, number> {
  const result: Record<MembershipTier, number> = { halo: 0, glow: 0, elite: 0 };
  for (const tier of MEMBERSHIP_TIERS) {
    const tierMembers = members.filter(m => m.tier === tier);
    result[tier] = calculateAverageDuration(tierMembers);
  }
  return result;
}

// ── MRR History ──────────────────────────────────────────────────────────

/**
 * Build MRR history from member data.
 */
export function buildMRRHistory(
  members: MemberRecord[],
  months: number = 12,
): { month: string; mrr: number; members: number }[] {
  const now = new Date();
  const history: { month: string; mrr: number; members: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const activeInMonth = members.filter(m => {
      const joinDate = new Date(m.joinDate);
      if (joinDate > monthEnd) return false;
      if (m.cancelledAt && new Date(m.cancelledAt) < new Date(date.getFullYear(), date.getMonth(), 1)) return false;
      return true;
    });

    const mrr = activeInMonth.reduce((s, m) => s + m.monthlyRate, 0);

    history.push({
      month: monthKey,
      mrr: Math.round(mrr * 100) / 100,
      members: activeInMonth.length,
    });
  }

  return history;
}

// ── Full Dashboard Builder ───────────────────────────────────────────────

/**
 * Build the complete membership analytics dashboard.
 */
export function buildAnalyticsDashboard(input: {
  members: MemberRecord[];
  events: RevenueEvent[];
  previousMonthMRR: number;
  periodMonths?: number;
}): MembershipAnalyticsDashboard {
  const { members, events, previousMonthMRR, periodMonths = 12 } = input;

  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'past_due');
  const pausedMembers = members.filter(m => m.status === 'paused');
  const cancelledMembers = members.filter(m => m.status === 'cancelled');

  // Revenue
  const mrr = calculateMRR(members);
  const mrrGrowth = calculateMRRGrowth(mrr, previousMonthMRR);
  const arr = calculateARR(mrr);
  const arrProjection = projectARR(mrr, mrrGrowth);
  const revenuePerMember = calculateRevenuePerMember(mrr, activeMembers.length);
  const totalRevenue = mrr * periodMonths;

  // Churn
  const voluntaryChurned = cancelledMembers.length; // Simplified
  const involuntaryChurned = members.filter(m => m.status === 'suspended').length;
  const reactivated = events.filter(e => e.type === 'reactivation').length;
  const startOfPeriodMembers = members.length; // Simplified
  const churnRate = calculateChurnRates(startOfPeriodMembers, voluntaryChurned, involuntaryChurned, reactivated);

  // Duration
  const averageMembershipDuration = calculateAverageDuration(members);

  // LTV
  const ltvByTier = calculateLTVByTier(activeMembers, cancelledMembers, periodMonths);
  const avgLTV = Object.values(ltvByTier).reduce((s, v) => s + v, 0) / MEMBERSHIP_TIERS.length;

  // Revenue retention
  const expansionRevenue = calculateExpansionRevenue(events);
  const contractionRevenue = calculateContractionRevenue(events);
  const churnedMRR = Math.abs(events.filter(e => e.type === 'churn').reduce((s, e) => s + e.amount, 0));
  const newMRR = events.filter(e => e.type === 'new').reduce((s, e) => s + e.amount, 0);
  const netRevenueRetention = calculateNetRevenueRetention(previousMonthMRR, expansionRevenue, contractionRevenue, churnedMRR);

  // Distribution
  const tierDistribution = calculateTierDistribution(members);
  const billingCycleDistribution = calculateBillingCycleDistribution(members);

  // Rates
  const { upgradeRate, downgradeRate } = calculateTierChangeRates(events, activeMembers.length);
  const enrollmentRate = startOfPeriodMembers > 0
    ? Math.round((events.filter(e => e.type === 'new').length / startOfPeriodMembers) * 10000) / 100
    : 0;

  // Cohort
  const cohorts = buildCohortAnalysis(members);

  // Seasonal
  const seasonalPatterns = analyzeSeasonalPatterns(members);

  // History
  const mrrHistory = buildMRRHistory(members);

  return {
    mrr: Math.round(mrr * 100) / 100,
    mrrGrowth,
    arr: Math.round(arr * 100) / 100,
    arrProjection: Math.round(arrProjection * 100) / 100,
    revenuePerMember,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    churnRate,
    averageMembershipDuration,
    ltvByTier,
    averageLTV: Math.round(avgLTV * 100) / 100,
    netRevenueRetention,
    expansionRevenue: Math.round(expansionRevenue * 100) / 100,
    contractionRevenue: Math.round(contractionRevenue * 100) / 100,
    newMRR: Math.round(newMRR * 100) / 100,
    churnedMRR: Math.round(churnedMRR * 100) / 100,
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    pausedMembers: pausedMembers.length,
    cancelledMembers: cancelledMembers.length,
    tierDistribution,
    billingCycleDistribution,
    upgradeRate,
    downgradeRate,
    enrollmentRate,
    cohorts,
    seasonalPatterns,
    mrrHistory,
  };
}
