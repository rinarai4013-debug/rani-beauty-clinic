/**
 * Provider Compensation Engine
 *
 * Handles base salary, tiered commissions, service-specific rates,
 * product sales commission, membership bonuses, performance bonuses,
 * tips, payroll calculation, tax estimates, and pay equity analysis.
 *
 * Default commission tiers:
 *   $0–$20K = 30%
 *   $20K–$40K = 35%
 *   $40K+ = 40%
 */

import type {
  CompensationConfig,
  CompensationSummary,
  PayrollPeriod,
  CompensationModel,
  PayEquityAnalysis,
  CommissionTier,
  PerformanceBonusThreshold,
} from '@/types/providers';

// ── DEFAULTS ──

export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  { min: 0, max: 20000, rate: 0.30 },
  { min: 20000, max: 40000, rate: 0.35 },
  { min: 40000, max: null, rate: 0.40 },
];

export const DEFAULT_PRODUCT_COMMISSION_RATE = 0.10;
export const DEFAULT_MEMBERSHIP_ENROLLMENT_BONUS = 50;

export const DEFAULT_PERFORMANCE_BONUSES: PerformanceBonusThreshold[] = [
  { metric: 'revenue', target: 50000, bonusAmount: 1000, period: 'quarterly' },
  { metric: 'rebookRate', target: 80, bonusAmount: 500, period: 'quarterly' },
  { metric: 'reviewRating', target: 4.8, bonusAmount: 250, period: 'quarterly' },
  { metric: 'utilization', target: 85, bonusAmount: 500, period: 'quarterly' },
];

// Federal + state (WA has no state income tax) estimate
const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: null, rate: 0.32 },
];

const FICA_RATE = 0.0765; // Social Security (6.2%) + Medicare (1.45%)

// ── INPUT TYPES ──

export interface CompensationInput {
  config: CompensationConfig;
  providerName: string;
  periodStart: string;
  periodEnd: string;
  serviceRevenue: number;
  productSales: number;
  membershipEnrollments: number;
  tips: number;
  hoursWorked: number;
  performanceMetrics: Record<string, number>; // metric name → value
  annualGrossEstimate?: number;
}

// ── TIERED COMMISSION ──

export function calculateTieredCommission(
  revenue: number,
  tiers: CommissionTier[],
): { total: number; tierBreakdown: { tier: string; revenue: number; rate: number; commission: number }[] } {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let remaining = revenue;
  let total = 0;
  const tierBreakdown: { tier: string; revenue: number; rate: number; commission: number }[] = [];

  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierMax = tier.max ?? Infinity;
    const tierRange = tierMax - tier.min;
    const taxableInTier = Math.min(remaining, tierRange);
    const commission = taxableInTier * tier.rate;

    tierBreakdown.push({
      tier: tier.max ? `$${tier.min.toLocaleString()}–$${tier.max.toLocaleString()}` : `$${tier.min.toLocaleString()}+`,
      revenue: Math.round(taxableInTier * 100) / 100,
      rate: tier.rate,
      commission: Math.round(commission * 100) / 100,
    });

    total += commission;
    remaining -= taxableInTier;
  }

  return { total: Math.round(total * 100) / 100, tierBreakdown };
}

// ── SERVICE-SPECIFIC COMMISSION ──

export function calculateServiceCommission(
  serviceRevenue: Record<string, number>,
  serviceRates: Record<string, number>,
  defaultTiers: CommissionTier[],
): number {
  let overrideTotal = 0;
  let defaultRevenue = 0;

  for (const [service, revenue] of Object.entries(serviceRevenue)) {
    if (serviceRates[service] !== undefined) {
      overrideTotal += revenue * serviceRates[service];
    } else {
      defaultRevenue += revenue;
    }
  }

  const { total: tieredAmount } = calculateTieredCommission(defaultRevenue, defaultTiers);
  return Math.round((overrideTotal + tieredAmount) * 100) / 100;
}

// ── PRODUCT COMMISSION ──

export function calculateProductCommission(
  productSales: number,
  rate: number = DEFAULT_PRODUCT_COMMISSION_RATE,
): number {
  return Math.round(productSales * rate * 100) / 100;
}

// ── MEMBERSHIP BONUS ──

export function calculateMembershipBonuses(
  enrollments: number,
  bonusPerEnrollment: number = DEFAULT_MEMBERSHIP_ENROLLMENT_BONUS,
): number {
  return enrollments * bonusPerEnrollment;
}

// ── PERFORMANCE BONUSES ──

export function calculatePerformanceBonuses(
  metrics: Record<string, number>,
  thresholds: PerformanceBonusThreshold[],
): { total: number; earned: { metric: string; target: number; actual: number; bonus: number }[] } {
  const earned: { metric: string; target: number; actual: number; bonus: number }[] = [];
  let total = 0;

  for (const threshold of thresholds) {
    const actual = metrics[threshold.metric];
    if (actual !== undefined && actual >= threshold.target) {
      earned.push({
        metric: threshold.metric,
        target: threshold.target,
        actual,
        bonus: threshold.bonusAmount,
      });
      total += threshold.bonusAmount;
    }
  }

  return { total, earned };
}

// ── TAX ESTIMATE ──

export function estimateTaxWithholding(annualGross: number): number {
  // Federal income tax
  let federalTax = 0;
  let remaining = annualGross;
  for (const bracket of FEDERAL_TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketMax = bracket.max ?? Infinity;
    const bracketRange = bracketMax - bracket.min;
    const taxableInBracket = Math.min(remaining, bracketRange);
    federalTax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  // FICA
  const fica = annualGross * FICA_RATE;

  return Math.round((federalTax + fica) * 100) / 100;
}

export function estimatePerPeriodTax(annualGross: number, periods: number = 26): number {
  const annualTax = estimateTaxWithholding(annualGross);
  return Math.round((annualTax / periods) * 100) / 100;
}

// ── PAYROLL PERIOD CALCULATION ──

export function calculatePayrollPeriod(input: CompensationInput): PayrollPeriod {
  const { config, periodStart, periodEnd, serviceRevenue, productSales, membershipEnrollments, tips, performanceMetrics } = input;

  const basePay = config.payFrequency === 'biweekly'
    ? Math.round((config.baseSalary / 26) * 100) / 100
    : Math.round((config.baseSalary / 12) * 100) / 100;

  const { total: serviceCommission } = calculateTieredCommission(serviceRevenue, config.commissionTiers);
  const productCommission = calculateProductCommission(productSales, config.productCommissionRate);
  const membershipBonuses = calculateMembershipBonuses(membershipEnrollments, config.membershipEnrollmentBonus);
  const { total: performanceBonuses } = calculatePerformanceBonuses(performanceMetrics, config.performanceBonusThresholds);

  const grossPay = basePay + serviceCommission + productCommission + membershipBonuses + performanceBonuses + tips;

  // Annualize for tax estimate
  const periodsPerYear = config.payFrequency === 'biweekly' ? 26 : 12;
  const annualEstimate = input.annualGrossEstimate ?? grossPay * periodsPerYear;
  const estimatedTaxWithholding = estimatePerPeriodTax(annualEstimate, periodsPerYear);

  // Benefits cost (rough estimate: 20% of base salary allocated per period)
  const benefitsCost = Math.round((config.baseSalary * 0.20 / periodsPerYear) * 100) / 100;

  const netPay = Math.round((grossPay - estimatedTaxWithholding - benefitsCost) * 100) / 100;

  return {
    startDate: periodStart,
    endDate: periodEnd,
    providerId: config.providerId,
    basePay,
    serviceCommission,
    productCommission,
    membershipBonuses,
    performanceBonuses,
    tips,
    grossPay: Math.round(grossPay * 100) / 100,
    estimatedTaxWithholding,
    benefitsCost,
    netPay,
  };
}

// ── COMPENSATION SUMMARY ──

export function generateCompensationSummary(input: CompensationInput): CompensationSummary {
  const payroll = calculatePayrollPeriod(input);
  const { tierBreakdown } = calculateTieredCommission(input.serviceRevenue, input.config.commissionTiers);

  const activeTier = tierBreakdown.length > 0 ? tierBreakdown[tierBreakdown.length - 1] : null;
  const effectiveHourlyRate = input.hoursWorked > 0
    ? Math.round((payroll.grossPay / input.hoursWorked) * 100) / 100
    : 0;

  return {
    providerId: input.config.providerId,
    providerName: input.providerName,
    period: `${input.periodStart} to ${input.periodEnd}`,
    baseSalary: payroll.basePay,
    totalCommissions: payroll.serviceCommission + payroll.productCommission,
    totalBonuses: payroll.membershipBonuses + payroll.performanceBonuses,
    totalTips: payroll.tips,
    grossCompensation: payroll.grossPay,
    estimatedTaxes: payroll.estimatedTaxWithholding,
    benefitsCost: payroll.benefitsCost,
    netCompensation: payroll.netPay,
    effectiveHourlyRate,
    commissionBreakdown: {
      serviceCommission: payroll.serviceCommission,
      productCommission: payroll.productCommission,
      membershipBonuses: payroll.membershipBonuses,
      tier: activeTier?.tier ?? 'N/A',
      tierRate: activeTier?.rate ?? 0,
    },
  };
}

// ── WHAT-IF COMPENSATION MODELING ──

export function modelCompensation(
  baseInput: CompensationInput,
  scenario: string,
  overrides: Partial<CompensationInput>,
): CompensationModel {
  const currentComp = generateCompensationSummary(baseInput);
  const projectedInput = { ...baseInput, ...overrides };
  const projectedComp = generateCompensationSummary(projectedInput);

  const difference = Math.round((projectedComp.grossCompensation - currentComp.grossCompensation) * 100) / 100;
  const percentChange = currentComp.grossCompensation > 0
    ? Math.round((difference / currentComp.grossCompensation) * 1000) / 10
    : 0;

  return {
    scenario,
    currentComp,
    projectedComp,
    difference,
    percentChange,
  };
}

// ── PAY EQUITY ANALYSIS ──

export function analyzePayEquity(
  providers: { name: string; role: string; totalComp: number; hoursWorked: number }[],
): PayEquityAnalysis {
  if (providers.length === 0) {
    return { providers: [], avgRate: 0, median: 0, spreadPercent: 0, equityScore: 100, flags: [] };
  }

  const withRates = providers.map(p => ({
    name: p.name,
    role: p.role,
    effectiveRate: p.hoursWorked > 0 ? Math.round((p.totalComp / p.hoursWorked) * 100) / 100 : 0,
    totalComp: p.totalComp,
  }));

  const rates = withRates.map(p => p.effectiveRate).filter(r => r > 0);
  if (rates.length === 0) {
    return { providers: withRates, avgRate: 0, median: 0, spreadPercent: 0, equityScore: 100, flags: [] };
  }

  const avgRate = Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100;
  const sortedRates = [...rates].sort((a, b) => a - b);
  const median = sortedRates.length % 2 === 0
    ? (sortedRates[sortedRates.length / 2 - 1] + sortedRates[sortedRates.length / 2]) / 2
    : sortedRates[Math.floor(sortedRates.length / 2)];

  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const spreadPercent = avgRate > 0
    ? Math.round(((maxRate - minRate) / avgRate) * 1000) / 10
    : 0;

  // Equity score: 100 = perfect equity, penalize spread
  const equityScore = Math.max(0, Math.round(100 - spreadPercent * 2));

  const flags: string[] = [];
  if (spreadPercent > 30) {
    flags.push('Significant pay disparity detected — review compensation structures');
  }

  // Check for same-role disparities
  const roleGroups = new Map<string, number[]>();
  for (const p of withRates) {
    const group = roleGroups.get(p.role) || [];
    group.push(p.effectiveRate);
    roleGroups.set(p.role, group);
  }

  for (const [role, roleRates] of roleGroups) {
    if (roleRates.length < 2) continue;
    const roleMax = Math.max(...roleRates);
    const roleMin = Math.min(...roleRates);
    const roleAvg = roleRates.reduce((a, b) => a + b, 0) / roleRates.length;
    const roleSpread = roleAvg > 0 ? ((roleMax - roleMin) / roleAvg) * 100 : 0;
    if (roleSpread > 20) {
      flags.push(`${role} role has ${roleSpread.toFixed(1)}% pay spread — may indicate inequity`);
    }
  }

  return {
    providers: withRates,
    avgRate,
    median: Math.round(median * 100) / 100,
    spreadPercent,
    equityScore,
    flags,
  };
}

// ── BIWEEKLY PAYROLL PERIODS ──

export function generatePayrollDates(year: number): { start: string; end: string }[] {
  const periods: { start: string; end: string }[] = [];
  const startDate = new Date(year, 0, 1);

  // Adjust to first Monday
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() + 1);
  }

  for (let i = 0; i < 26; i++) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + i * 14);
    const end = new Date(start);
    end.setDate(end.getDate() + 13);

    if (start.getFullYear() > year) break;

    periods.push({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  }

  return periods;
}
