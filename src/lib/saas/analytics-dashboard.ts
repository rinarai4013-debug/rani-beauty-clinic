/**
 * RaniOS SaaS Metrics & Analytics Dashboard
 *
 * MRR, ARR, churn rates, LTV:CAC, cohort analysis,
 * funnel conversions, revenue recognition, quick ratio,
 * and complete SaaS financial metrics.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface SaaSMetrics {
  mrr: number;
  arr: number;
  netRevenueRetention: number; // percentage
  customerCount: number;
  avgRevenuePerCustomer: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  churn: ChurnMetrics;
  expansion: ExpansionMetrics;
  funnel: FunnelMetrics;
  cohorts: CohortData[];
  revenueBySegment: SegmentRevenue[];
  quickRatio: number;
  runway: RunwayMetrics;
  calculatedAt: string;
}

export interface ChurnMetrics {
  logoChurnRate: number; // % of customers lost
  revenueChurnRate: number; // % of MRR lost
  customersLost: number;
  mrrLost: number;
  avgChurnedCustomerMRR: number;
  churnReasons: { reason: string; count: number; percentage: number }[];
}

export interface ExpansionMetrics {
  expansionMRR: number;
  contractionMRR: number;
  netExpansion: number;
  upgrades: number;
  downgrades: number;
  addOnRevenue: number;
}

export interface FunnelMetrics {
  visitors: number;
  leads: number;
  trials: number;
  paidCustomers: number;
  conversionRates: {
    visitorToLead: number;
    leadToTrial: number;
    trialToPaid: number;
    overallVisitorToPaid: number;
  };
  pipelineValue: number;
  pipelineVelocity: number;
  avgDealSize: number;
  avgSalesCycle: number; // days
}

export interface CohortData {
  cohort: string; // YYYY-MM
  signups: number;
  retention: number[]; // retention rate by month (index 0 = month 0, always 100%)
  revenue: number[]; // cumulative revenue by month
  churnedCount: number;
  currentCustomers: number;
  avgLTV: number;
}

export interface SegmentRevenue {
  segment: string;
  customerCount: number;
  mrr: number;
  percentOfTotal: number;
  avgMRR: number;
  churnRate: number;
  ltv: number;
}

export interface RunwayMetrics {
  cashOnHand: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  netBurn: number;
  runwayMonths: number;
  profitableDate?: string;
}

export interface CACByChannel {
  channel: string;
  spend: number;
  leads: number;
  customers: number;
  cac: number;
  costPerLead: number;
  conversionRate: number;
  roi: number;
}

export interface RevenueBreakdown {
  month: string;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnMRR: number;
  reactivationMRR: number;
  netNewMRR: number;
  totalMRR: number;
}

export interface CustomerMetrics {
  tenantId: string;
  clinicName: string;
  plan: string;
  mrr: number;
  ltv: number;
  monthsActive: number;
  healthScore: number;
  lastLoginAt: string;
  riskLevel: string;
}

// ─── MRR / ARR Calculation ────────────────────────────────────────

export function calculateMRR(
  subscriptions: {
    plan: string;
    billingCycle: 'monthly' | 'annual';
    status: string;
    monthlyPrice: number;
    annualPrice: number;
    addOnMRR: number;
  }[]
): number {
  return subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((total, sub) => {
      const baseMRR =
        sub.billingCycle === 'annual'
          ? sub.annualPrice / 12
          : sub.monthlyPrice;
      return total + baseMRR + sub.addOnMRR;
    }, 0);
}

export function calculateARR(mrr: number): number {
  return Math.round(mrr * 12);
}

// ─── Net Revenue Retention ────────────────────────────────────────

export function calculateNRR(
  startingMRR: number,
  expansionMRR: number,
  contractionMRR: number,
  churnMRR: number
): number {
  if (startingMRR === 0) return 0;
  return Math.round(
    ((startingMRR + expansionMRR - contractionMRR - churnMRR) / startingMRR) *
      100
  );
}

// ─── LTV / CAC ────────────────────────────────────────────────────

export function calculateLTV(
  avgMRR: number,
  avgLifetimeMonths: number,
  grossMarginPercent: number = 80
): number {
  return Math.round(avgMRR * avgLifetimeMonths * (grossMarginPercent / 100));
}

export function calculateCAC(
  totalAcquisitionCost: number,
  newCustomers: number
): number {
  if (newCustomers === 0) return 0;
  return Math.round(totalAcquisitionCost / newCustomers);
}

export function calculateLTVCACRatio(ltv: number, cac: number): number {
  if (cac === 0) return 0;
  return Math.round((ltv / cac) * 10) / 10;
}

export function calculatePaybackPeriod(cac: number, avgMRR: number): number {
  if (avgMRR === 0) return Infinity;
  return Math.round((cac / avgMRR) * 10) / 10;
}

// ─── Churn Rates ──────────────────────────────────────────────────

export function calculateLogoChurn(
  customersLost: number,
  startingCustomers: number
): number {
  if (startingCustomers === 0) return 0;
  return Math.round((customersLost / startingCustomers) * 1000) / 10;
}

export function calculateRevenueChurn(
  mrrLost: number,
  startingMRR: number
): number {
  if (startingMRR === 0) return 0;
  return Math.round((mrrLost / startingMRR) * 1000) / 10;
}

export function calculateNetRevenueChurn(
  mrrLost: number,
  expansionMRR: number,
  startingMRR: number
): number {
  if (startingMRR === 0) return 0;
  return Math.round(((mrrLost - expansionMRR) / startingMRR) * 1000) / 10;
}

// ─── Cohort Analysis ──────────────────────────────────────────────

export function buildCohortData(
  customers: {
    id: string;
    signupMonth: string; // YYYY-MM
    active: boolean;
    cancelledMonth?: string;
    monthlyRevenue: number[];
  }[]
): CohortData[] {
  const cohortMap = new Map<string, typeof customers>();

  for (const customer of customers) {
    const existing = cohortMap.get(customer.signupMonth) ?? [];
    existing.push(customer);
    cohortMap.set(customer.signupMonth, existing);
  }

  const cohorts: CohortData[] = [];

  for (const [month, members] of cohortMap) {
    const signups = members.length;
    const currentCustomers = members.filter((m) => m.active).length;
    const churnedCount = signups - currentCustomers;

    // Calculate retention by month
    const maxMonths = 12;
    const retention: number[] = [100]; // month 0 always 100%
    const revenue: number[] = [0];

    for (let m = 1; m <= maxMonths; m++) {
      const activeAtMonth = members.filter((member) => {
        if (!member.cancelledMonth) return true;
        const cancelMonth = monthDiff(month, member.cancelledMonth);
        return cancelMonth > m;
      }).length;

      retention.push(signups > 0 ? Math.round((activeAtMonth / signups) * 100) : 0);

      const monthRevenue = members.reduce((sum, member) => {
        return sum + (member.monthlyRevenue[m] ?? 0);
      }, 0);
      revenue.push(Math.round(monthRevenue));
    }

    const totalRevenue = revenue.reduce((a, b) => a + b, 0);
    const avgLTV = signups > 0 ? Math.round(totalRevenue / signups) : 0;

    cohorts.push({
      cohort: month,
      signups,
      retention,
      revenue,
      churnedCount,
      currentCustomers,
      avgLTV,
    });
  }

  return cohorts.sort((a, b) => a.cohort.localeCompare(b.cohort));
}

// ─── Revenue Breakdown ────────────────────────────────────────────

export function calculateRevenueBreakdown(
  events: {
    type: 'new' | 'expansion' | 'contraction' | 'churn' | 'reactivation';
    month: string;
    mrr: number;
  }[],
  startingMRR: number = 0
): RevenueBreakdown[] {
  const monthMap = new Map<string, RevenueBreakdown>();

  for (const event of events) {
    if (!monthMap.has(event.month)) {
      monthMap.set(event.month, {
        month: event.month,
        newMRR: 0,
        expansionMRR: 0,
        contractionMRR: 0,
        churnMRR: 0,
        reactivationMRR: 0,
        netNewMRR: 0,
        totalMRR: 0,
      });
    }

    const entry = monthMap.get(event.month)!;
    switch (event.type) {
      case 'new':
        entry.newMRR += event.mrr;
        break;
      case 'expansion':
        entry.expansionMRR += event.mrr;
        break;
      case 'contraction':
        entry.contractionMRR += event.mrr;
        break;
      case 'churn':
        entry.churnMRR += event.mrr;
        break;
      case 'reactivation':
        entry.reactivationMRR += event.mrr;
        break;
    }
  }

  const months = [...monthMap.keys()].sort();
  let runningMRR = startingMRR;
  const result: RevenueBreakdown[] = [];

  for (const month of months) {
    const entry = monthMap.get(month)!;
    entry.netNewMRR =
      entry.newMRR +
      entry.expansionMRR +
      entry.reactivationMRR -
      entry.contractionMRR -
      entry.churnMRR;
    runningMRR += entry.netNewMRR;
    entry.totalMRR = Math.round(runningMRR);
    result.push(entry);
  }

  return result;
}

// ─── CAC by Channel ───────────────────────────────────────────────

export function calculateCACByChannel(
  channels: {
    channel: string;
    spend: number;
    leads: number;
    customers: number;
  }[],
  avgLTV: number
): CACByChannel[] {
  return channels.map((ch) => {
    const cac = ch.customers > 0 ? Math.round(ch.spend / ch.customers) : 0;
    const costPerLead = ch.leads > 0 ? Math.round(ch.spend / ch.leads) : 0;
    const conversionRate =
      ch.leads > 0 ? Math.round((ch.customers / ch.leads) * 100) : 0;
    const roi = cac > 0 ? Math.round(((avgLTV - cac) / cac) * 100) : 0;

    return {
      ...ch,
      cac,
      costPerLead,
      conversionRate,
      roi,
    };
  });
}

// ─── Quick Ratio ──────────────────────────────────────────────────

export function calculateQuickRatio(
  newMRR: number,
  expansionMRR: number,
  reactivationMRR: number,
  contractionMRR: number,
  churnMRR: number
): number {
  const losses = contractionMRR + churnMRR;
  if (losses === 0) return Infinity;
  const gains = newMRR + expansionMRR + reactivationMRR;
  return Math.round((gains / losses) * 10) / 10;
}

export function interpretQuickRatio(ratio: number): {
  grade: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  message: string;
} {
  if (ratio >= 4) {
    return {
      grade: 'excellent',
      message: 'Outstanding growth efficiency. Revenue gains vastly outpace losses.',
    };
  }
  if (ratio >= 2) {
    return {
      grade: 'good',
      message: 'Healthy growth. Gains are meaningfully outpacing losses.',
    };
  }
  if (ratio >= 1) {
    return {
      grade: 'needs_improvement',
      message: 'Marginal growth. Losses are nearly offsetting gains.',
    };
  }
  return {
    grade: 'poor',
    message: 'Revenue is shrinking. Churn and contraction exceed new revenue.',
  };
}

// ─── Runway Calculation ───────────────────────────────────────────

export function calculateRunway(
  cashOnHand: number,
  monthlyBurn: number,
  monthlyRevenue: number
): RunwayMetrics {
  const netBurn = monthlyBurn - monthlyRevenue;
  const runwayMonths =
    netBurn > 0 ? Math.round((cashOnHand / netBurn) * 10) / 10 : Infinity;

  let profitableDate: string | undefined;
  if (monthlyRevenue > monthlyBurn) {
    profitableDate = 'Now (profitable)';
  } else if (monthlyRevenue > 0) {
    // Estimate months to profitability based on growth rate
    const monthsToBreakeven = Math.ceil(
      (monthlyBurn - monthlyRevenue) / (monthlyRevenue * 0.15) // assume 15% growth
    );
    if (monthsToBreakeven < 36) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthsToBreakeven);
      profitableDate = date.toISOString().split('T')[0];
    }
  }

  return {
    cashOnHand,
    monthlyBurn,
    monthlyRevenue,
    netBurn: Math.max(0, netBurn),
    runwayMonths: netBurn <= 0 ? Infinity : runwayMonths,
    profitableDate,
  };
}

// ─── Segment Analysis ─────────────────────────────────────────────

export function calculateSegmentRevenue(
  customers: {
    segment: string;
    mrr: number;
    active: boolean;
    monthsActive: number;
  }[]
): SegmentRevenue[] {
  const segments = new Map<
    string,
    { count: number; activeMRR: number; totalMonths: number; churned: number; total: number }
  >();

  for (const customer of customers) {
    const existing = segments.get(customer.segment) ?? {
      count: 0,
      activeMRR: 0,
      totalMonths: 0,
      churned: 0,
      total: 0,
    };

    existing.total += 1;
    if (customer.active) {
      existing.count += 1;
      existing.activeMRR += customer.mrr;
    } else {
      existing.churned += 1;
    }
    existing.totalMonths += customer.monthsActive;

    segments.set(customer.segment, existing);
  }

  const totalMRR = [...segments.values()].reduce((s, v) => s + v.activeMRR, 0);

  return [...segments.entries()].map(([segment, data]) => ({
    segment,
    customerCount: data.count,
    mrr: Math.round(data.activeMRR),
    percentOfTotal: totalMRR > 0 ? Math.round((data.activeMRR / totalMRR) * 100) : 0,
    avgMRR: data.count > 0 ? Math.round(data.activeMRR / data.count) : 0,
    churnRate: data.total > 0 ? Math.round((data.churned / data.total) * 100) : 0,
    ltv: data.total > 0
      ? Math.round((data.activeMRR / Math.max(1, data.count)) * (data.totalMonths / data.total))
      : 0,
  }));
}

// ─── Complete SaaS Metrics Computation ────────────────────────────

export function computeSaaSMetrics(input: {
  subscriptions: {
    plan: string;
    billingCycle: 'monthly' | 'annual';
    status: string;
    monthlyPrice: number;
    annualPrice: number;
    addOnMRR: number;
  }[];
  customersLost: number;
  startingCustomers: number;
  startingMRR: number;
  mrrLost: number;
  expansionMRR: number;
  contractionMRR: number;
  reactivationMRR: number;
  totalAcquisitionCost: number;
  newCustomers: number;
  avgLifetimeMonths: number;
  visitors: number;
  leads: number;
  trials: number;
  avgSalesCycleDays: number;
}): SaaSMetrics {
  const mrr = calculateMRR(input.subscriptions);
  const arr = calculateARR(mrr);
  const customerCount = input.subscriptions.filter(
    (s) => s.status === 'active'
  ).length;
  const avgRevenuePerCustomer =
    customerCount > 0 ? Math.round(mrr / customerCount) : 0;
  const nrr = calculateNRR(
    input.startingMRR,
    input.expansionMRR,
    input.contractionMRR,
    input.mrrLost
  );

  const ltv = calculateLTV(avgRevenuePerCustomer, input.avgLifetimeMonths);
  const cac = calculateCAC(input.totalAcquisitionCost, input.newCustomers);
  const ltvCacRatio = calculateLTVCACRatio(ltv, cac);
  const paybackPeriodMonths = calculatePaybackPeriod(cac, avgRevenuePerCustomer);

  const logoChurnRate = calculateLogoChurn(input.customersLost, input.startingCustomers);
  const revenueChurnRate = calculateRevenueChurn(input.mrrLost, input.startingMRR);

  const quickRatio = calculateQuickRatio(
    mrr - input.startingMRR + input.mrrLost + input.contractionMRR - input.expansionMRR - input.reactivationMRR,
    input.expansionMRR,
    input.reactivationMRR,
    input.contractionMRR,
    input.mrrLost
  );

  const avgDealSize =
    input.newCustomers > 0
      ? Math.round(
          ((mrr - input.startingMRR + input.mrrLost) / input.newCustomers) * 12
        )
      : 0;

  const pipelineValue =
    input.trials * avgDealSize * 0.4 + input.leads * avgDealSize * 0.1;

  return {
    mrr: Math.round(mrr),
    arr,
    netRevenueRetention: nrr,
    customerCount,
    avgRevenuePerCustomer,
    ltv,
    cac,
    ltvCacRatio,
    paybackPeriodMonths,
    churn: {
      logoChurnRate,
      revenueChurnRate,
      customersLost: input.customersLost,
      mrrLost: input.mrrLost,
      avgChurnedCustomerMRR:
        input.customersLost > 0
          ? Math.round(input.mrrLost / input.customersLost)
          : 0,
      churnReasons: [],
    },
    expansion: {
      expansionMRR: input.expansionMRR,
      contractionMRR: input.contractionMRR,
      netExpansion: input.expansionMRR - input.contractionMRR,
      upgrades: 0,
      downgrades: 0,
      addOnRevenue: 0,
    },
    funnel: {
      visitors: input.visitors,
      leads: input.leads,
      trials: input.trials,
      paidCustomers: input.newCustomers,
      conversionRates: {
        visitorToLead:
          input.visitors > 0
            ? Math.round((input.leads / input.visitors) * 1000) / 10
            : 0,
        leadToTrial:
          input.leads > 0
            ? Math.round((input.trials / input.leads) * 1000) / 10
            : 0,
        trialToPaid:
          input.trials > 0
            ? Math.round((input.newCustomers / input.trials) * 1000) / 10
            : 0,
        overallVisitorToPaid:
          input.visitors > 0
            ? Math.round((input.newCustomers / input.visitors) * 10000) / 100
            : 0,
      },
      pipelineValue: Math.round(pipelineValue),
      pipelineVelocity: input.newCustomers / 30,
      avgDealSize,
      avgSalesCycle: input.avgSalesCycleDays,
    },
    cohorts: [],
    revenueBySegment: [],
    quickRatio,
    runway: {
      cashOnHand: 0,
      monthlyBurn: 0,
      monthlyRevenue: mrr,
      netBurn: 0,
      runwayMonths: Infinity,
    },
    calculatedAt: new Date().toISOString(),
  };
}

// ─── Formatting Helpers ───────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}%`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

// ─── Helpers ──────────────────────────────────────────────────────

function monthDiff(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}
