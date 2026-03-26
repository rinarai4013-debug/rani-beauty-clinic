/**
 * Cash Flow Management Engine
 *
 * Operating cash flow tracking, AR aging, cost modeling, payroll projections,
 * burn rate analysis, runway calculation, and seasonal reserve recommendations
 * for Rani Beauty Clinic.
 */

// ── TYPES ──

export interface CashFlowInput {
  bankBalance: number;
  monthlyRevenue: number[];  // last 6-12 months
  monthlyExpenses: number[]; // last 6-12 months
  fixedCosts: FixedCost[];
  variableCosts: VariableCost[];
  receivables: Receivable[];
  payroll: PayrollEntry[];
  upcomingObligations: Obligation[];
  creditLineAvailable?: number;
}

export interface FixedCost {
  name: string;
  category: CostCategory;
  monthlyAmount: number;
  annualAmount?: number;
  dueDay?: number; // day of month
  notes?: string;
}

export interface VariableCost {
  name: string;
  category: CostCategory;
  avgMonthlyAmount: number;
  lastThreeMonths: number[];
  percentOfRevenue?: number;
}

export type CostCategory =
  | 'rent'
  | 'payroll'
  | 'supplies'
  | 'insurance'
  | 'marketing'
  | 'software'
  | 'utilities'
  | 'equipment_lease'
  | 'professional_services'
  | 'taxes'
  | 'loan_payment'
  | 'misc';

export interface Receivable {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  source: 'cherry_financing' | 'insurance' | 'payment_plan' | 'other';
  status: 'current' | 'past_due_30' | 'past_due_60' | 'past_due_90' | 'written_off';
  probability: number; // 0-1 likelihood of collection
}

export interface PayrollEntry {
  employeeName: string;
  role: 'provider' | 'front_desk' | 'manager' | 'marketing' | 'other';
  grossPay: number;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  federalWithholding: number;
  stateWithholding: number;
  fica: number;
  benefits: number;
  commission?: number;
}

export interface Obligation {
  name: string;
  amount: number;
  dueDate: string;
  category: CostCategory;
  recurring: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// ── OUTPUT TYPES ──

export interface CashFlowResult {
  currentPosition: CashPosition;
  operatingCashFlow: OperatingCashFlow;
  receivablesAging: ReceivablesAging;
  costBreakdown: CostBreakdown;
  payrollSummary: PayrollSummary;
  burnRate: BurnRateAnalysis;
  runway: RunwayAnalysis;
  seasonalReserves: SeasonalReserveRecommendation;
  emergencyFund: EmergencyFundScore;
  monthlyProjections: CashFlowMonthProjection[];
  alerts: CashFlowAlert[];
}

export interface CashPosition {
  bankBalance: number;
  expectedReceivables: number; // probability-weighted
  totalAvailable: number; // balance + credit line
  netCashPosition: number; // balance - upcoming obligations
  upcomingObligationsTotal: number;
  daysOfCashOnHand: number;
}

export interface OperatingCashFlow {
  monthlyInflow: number;
  monthlyOutflow: number;
  netOperatingCashFlow: number;
  trend: 'improving' | 'declining' | 'stable';
  threeMonthAvg: number;
  sixMonthAvg: number;
}

export interface ReceivablesAging {
  current: { count: number; amount: number };
  pastDue30: { count: number; amount: number };
  pastDue60: { count: number; amount: number };
  pastDue90: { count: number; amount: number };
  writtenOff: { count: number; amount: number };
  totalOutstanding: number;
  weightedCollectable: number;
  avgDaysOutstanding: number;
  collectionRate: number;
}

export interface CostBreakdown {
  totalFixed: number;
  totalVariable: number;
  totalMonthly: number;
  fixedPercentage: number;
  variablePercentage: number;
  byCategory: { category: CostCategory; amount: number; percentage: number }[];
  topExpenses: { name: string; amount: number; category: CostCategory }[];
}

export interface PayrollSummary {
  totalGross: number;
  totalNet: number;
  totalTaxWithholding: number;
  totalFICA: number;
  totalBenefits: number;
  employerCost: number; // gross + employer FICA + benefits
  payrollAsPercentOfRevenue: number;
  byRole: { role: string; count: number; totalCost: number }[];
  nextPayrollDate: string;
  nextPayrollAmount: number;
}

export interface BurnRateAnalysis {
  monthlyBurnRate: number;
  dailyBurnRate: number;
  weeklyBurnRate: number;
  burnRateTrend: 'increasing' | 'decreasing' | 'stable';
  burnRateThreeMonthAvg: number;
  grossBurnRate: number; // expenses only
  netBurnRate: number;   // expenses - revenue
}

export interface RunwayAnalysis {
  monthsOfRunway: number;
  runwayEndDate: string;
  status: 'healthy' | 'caution' | 'critical';
  scenarioRunway: {
    optimistic: number;  // +20% revenue
    expected: number;
    conservative: number; // -20% revenue
    zeroRevenue: number;  // worst case
  };
}

export interface SeasonalReserveRecommendation {
  currentReserve: number;
  recommendedReserve: number;
  gap: number;
  monthlyContribution: number; // suggested monthly savings
  peakExpenseMonth: number;
  leanestRevenueMonth: number;
  monthlyRecommendations: { month: number; reserveNeeded: number; reason: string }[];
}

export interface EmergencyFundScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  currentMonths: number; // months of expenses covered
  targetMonths: number;  // recommended 3-6 months
  shortfall: number;
  recommendation: string;
}

export interface CashFlowMonthProjection {
  month: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  endingBalance: number;
  cumulativeCashFlow: number;
}

export interface CashFlowAlert {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  actionRequired: string;
  dueDate?: string;
  amount?: number;
}

// ── SEASONAL CASH NEEDS ──
// Based on med spa operational patterns

const SEASONAL_EXPENSE_FACTORS: Record<number, number> = {
  1: 1.05,  // January: annual renewals, insurance premiums
  2: 0.95,  // February: lighter month
  3: 1.00,  // March: spring inventory restocking
  4: 1.10,  // April: Q1 taxes, equipment maintenance
  5: 1.05,  // May: marketing push for summer
  6: 1.00,  // June: stable
  7: 0.90,  // July: lower activity, lower costs
  8: 0.95,  // August: back-to-school prep
  9: 1.05,  // September: fall inventory, training
  10: 1.10, // October: holiday marketing spend begins
  11: 1.15, // November: peak marketing, inventory buildup
  12: 1.05, // December: holiday bonuses, year-end
};

// ── CORE FUNCTIONS ──

/**
 * Calculate accounts receivable aging and collection metrics.
 */
export function analyzeReceivables(receivables: Receivable[]): ReceivablesAging {
  const buckets = {
    current: { count: 0, amount: 0 },
    pastDue30: { count: 0, amount: 0 },
    pastDue60: { count: 0, amount: 0 },
    pastDue90: { count: 0, amount: 0 },
    writtenOff: { count: 0, amount: 0 },
  };

  let weightedTotal = 0;
  let totalDaysOutstanding = 0;
  const now = new Date();

  for (const r of receivables) {
    const bucket = r.status === 'current' ? 'current'
      : r.status === 'past_due_30' ? 'pastDue30'
      : r.status === 'past_due_60' ? 'pastDue60'
      : r.status === 'past_due_90' ? 'pastDue90'
      : 'writtenOff';

    buckets[bucket].count++;
    buckets[bucket].amount += r.amount;
    weightedTotal += r.amount * r.probability;

    const dueDate = new Date(r.dueDate);
    const daysOut = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));
    totalDaysOutstanding += daysOut;
  }

  const totalOutstanding = receivables.reduce((s, r) => s + r.amount, 0);
  const nonWrittenOff = receivables.filter(r => r.status !== 'written_off');
  const collectionRate = totalOutstanding > 0 ? weightedTotal / totalOutstanding : 1;

  return {
    ...buckets,
    totalOutstanding: Math.round(totalOutstanding),
    weightedCollectable: Math.round(weightedTotal),
    avgDaysOutstanding: nonWrittenOff.length > 0
      ? Math.round(totalDaysOutstanding / nonWrittenOff.length)
      : 0,
    collectionRate: Math.round(collectionRate * 1000) / 1000,
  };
}

/**
 * Build cost breakdown from fixed and variable costs.
 */
export function analyzeCosts(
  fixedCosts: FixedCost[],
  variableCosts: VariableCost[],
): CostBreakdown {
  const totalFixed = fixedCosts.reduce((s, c) => s + c.monthlyAmount, 0);
  const totalVariable = variableCosts.reduce((s, c) => s + c.avgMonthlyAmount, 0);
  const totalMonthly = totalFixed + totalVariable;

  // Aggregate by category
  const categoryTotals: Record<string, number> = {};
  for (const c of fixedCosts) {
    categoryTotals[c.category] = (categoryTotals[c.category] ?? 0) + c.monthlyAmount;
  }
  for (const c of variableCosts) {
    categoryTotals[c.category] = (categoryTotals[c.category] ?? 0) + c.avgMonthlyAmount;
  }

  const byCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: category as CostCategory,
      amount: Math.round(amount),
      percentage: totalMonthly > 0 ? Math.round((amount / totalMonthly) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top 5 individual expenses
  const allCosts = [
    ...fixedCosts.map(c => ({ name: c.name, amount: c.monthlyAmount, category: c.category })),
    ...variableCosts.map(c => ({ name: c.name, amount: c.avgMonthlyAmount, category: c.category })),
  ].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    totalFixed: Math.round(totalFixed),
    totalVariable: Math.round(totalVariable),
    totalMonthly: Math.round(totalMonthly),
    fixedPercentage: totalMonthly > 0 ? Math.round((totalFixed / totalMonthly) * 1000) / 10 : 0,
    variablePercentage: totalMonthly > 0 ? Math.round((totalVariable / totalMonthly) * 1000) / 10 : 0,
    byCategory,
    topExpenses: allCosts,
  };
}

/**
 * Calculate payroll projections with tax withholding.
 */
export function analyzePayroll(
  payroll: PayrollEntry[],
  monthlyRevenue: number,
): PayrollSummary {
  let totalGross = 0;
  let totalFederal = 0;
  let totalState = 0;
  let totalFICA = 0;
  let totalBenefits = 0;

  const roleAgg: Record<string, { count: number; totalCost: number }> = {};

  for (const p of payroll) {
    // Normalize to monthly amounts
    let multiplier = 1;
    switch (p.payFrequency) {
      case 'weekly': multiplier = 52 / 12; break;
      case 'biweekly': multiplier = 26 / 12; break;
      case 'semimonthly': multiplier = 2; break;
      case 'monthly': multiplier = 1; break;
    }

    const monthlyGross = p.grossPay * multiplier;
    const monthlyFederal = p.federalWithholding * multiplier;
    const monthlyState = p.stateWithholding * multiplier;
    const monthlyFICA = p.fica * multiplier;
    const monthlyBenefits = p.benefits * multiplier;
    const monthlyCommission = (p.commission ?? 0) * multiplier;

    totalGross += monthlyGross + monthlyCommission;
    totalFederal += monthlyFederal;
    totalState += monthlyState;
    totalFICA += monthlyFICA;
    totalBenefits += monthlyBenefits;

    // Employer cost: gross + employer FICA (7.65%) + benefits
    const employerFICA = monthlyGross * 0.0765;
    const totalCost = monthlyGross + monthlyCommission + employerFICA + monthlyBenefits;

    if (!roleAgg[p.role]) roleAgg[p.role] = { count: 0, totalCost: 0 };
    roleAgg[p.role].count++;
    roleAgg[p.role].totalCost += totalCost;
  }

  const totalTaxWithholding = totalFederal + totalState;
  const totalNet = totalGross - totalTaxWithholding - totalFICA;
  const employerFICATotal = totalGross * 0.0765;
  const employerCost = totalGross + employerFICATotal + totalBenefits;

  const byRole = Object.entries(roleAgg).map(([role, data]) => ({
    role,
    count: data.count,
    totalCost: Math.round(data.totalCost),
  }));

  // Next payroll date (assume biweekly Friday)
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
  const nextPayrollDate = nextFriday.toISOString().split('T')[0];

  return {
    totalGross: Math.round(totalGross),
    totalNet: Math.round(totalNet),
    totalTaxWithholding: Math.round(totalTaxWithholding),
    totalFICA: Math.round(totalFICA),
    totalBenefits: Math.round(totalBenefits),
    employerCost: Math.round(employerCost),
    payrollAsPercentOfRevenue: monthlyRevenue > 0
      ? Math.round((employerCost / monthlyRevenue) * 1000) / 10
      : 0,
    byRole,
    nextPayrollDate,
    nextPayrollAmount: Math.round(totalGross / 2), // biweekly estimate
  };
}

/**
 * Calculate burn rate trends.
 */
export function analyzeBurnRate(
  monthlyRevenue: number[],
  monthlyExpenses: number[],
): BurnRateAnalysis {
  const recentExpenses = monthlyExpenses.slice(-3);
  const recentRevenue = monthlyRevenue.slice(-3);

  const avgExpenses = recentExpenses.length > 0
    ? recentExpenses.reduce((s, v) => s + v, 0) / recentExpenses.length
    : 0;
  const avgRevenue = recentRevenue.length > 0
    ? recentRevenue.reduce((s, v) => s + v, 0) / recentRevenue.length
    : 0;

  const threeMonthAvgExpenses = avgExpenses;
  const sixMonthExpenses = monthlyExpenses.slice(-6);
  const sixMonthAvg = sixMonthExpenses.length > 0
    ? sixMonthExpenses.reduce((s, v) => s + v, 0) / sixMonthExpenses.length
    : avgExpenses;

  // Trend detection
  let burnRateTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentExpenses.length >= 3) {
    const first = recentExpenses[0];
    const last = recentExpenses[recentExpenses.length - 1];
    if (first > 0) {
      const changePercent = ((last - first) / first) * 100;
      if (changePercent > 5) burnRateTrend = 'increasing';
      else if (changePercent < -5) burnRateTrend = 'decreasing';
    }
  }

  const netBurn = avgExpenses - avgRevenue;

  return {
    monthlyBurnRate: Math.round(avgExpenses),
    dailyBurnRate: Math.round(avgExpenses / 30),
    weeklyBurnRate: Math.round(avgExpenses / 4.33),
    burnRateTrend,
    burnRateThreeMonthAvg: Math.round(threeMonthAvgExpenses),
    grossBurnRate: Math.round(avgExpenses),
    netBurnRate: Math.round(netBurn),
  };
}

/**
 * Calculate cash runway under multiple scenarios.
 */
export function calculateRunway(
  bankBalance: number,
  monthlyRevenue: number[],
  monthlyExpenses: number[],
  creditLine: number = 0,
): RunwayAnalysis {
  const avgRevenue = monthlyRevenue.length > 0
    ? monthlyRevenue.reduce((s, v) => s + v, 0) / monthlyRevenue.length
    : 0;
  const avgExpenses = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length
    : 0;

  const totalCash = bankBalance + creditLine;
  const netBurn = avgExpenses - avgRevenue;

  // Expected runway
  const expectedMonths = netBurn > 0 ? totalCash / netBurn : netBurn <= 0 ? 999 : 0;

  // Optimistic: +20% revenue
  const optimisticNetBurn = avgExpenses - (avgRevenue * 1.2);
  const optimisticMonths = optimisticNetBurn > 0 ? totalCash / optimisticNetBurn : 999;

  // Conservative: -20% revenue
  const conservativeNetBurn = avgExpenses - (avgRevenue * 0.8);
  const conservativeMonths = conservativeNetBurn > 0 ? totalCash / conservativeNetBurn : 999;

  // Zero revenue (worst case)
  const zeroRevenueMonths = avgExpenses > 0 ? totalCash / avgExpenses : 999;

  const cappedExpected = Math.min(999, Math.max(0, expectedMonths));
  let status: 'healthy' | 'caution' | 'critical';
  if (cappedExpected >= 6 || netBurn <= 0) status = 'healthy';
  else if (cappedExpected >= 3) status = 'caution';
  else status = 'critical';

  const runwayEndDate = new Date();
  runwayEndDate.setMonth(runwayEndDate.getMonth() + Math.floor(cappedExpected));

  return {
    monthsOfRunway: Math.round(cappedExpected * 10) / 10,
    runwayEndDate: runwayEndDate.toISOString().split('T')[0],
    status,
    scenarioRunway: {
      optimistic: Math.min(999, Math.round(optimisticMonths * 10) / 10),
      expected: Math.min(999, Math.round(expectedMonths * 10) / 10),
      conservative: Math.min(999, Math.round(conservativeMonths * 10) / 10),
      zeroRevenue: Math.min(999, Math.round(zeroRevenueMonths * 10) / 10),
    },
  };
}

/**
 * Generate seasonal cash reserve recommendations.
 */
export function recommendSeasonalReserves(
  monthlyExpenses: number[],
  monthlyRevenue: number[],
  currentBalance: number,
): SeasonalReserveRecommendation {
  const avgExpenses = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length
    : 0;
  const avgRevenue = monthlyRevenue.length > 0
    ? monthlyRevenue.reduce((s, v) => s + v, 0) / monthlyRevenue.length
    : 0;

  // Recommend 3 months of operating expenses as reserve
  const recommendedReserve = avgExpenses * 3;
  const gap = Math.max(0, recommendedReserve - currentBalance);
  const monthlyContribution = gap > 0 ? Math.round(gap / 12) : 0;

  // Find peak expense and leanest revenue months
  const monthlyRecs: { month: number; reserveNeeded: number; reason: string }[] = [];

  for (let m = 1; m <= 12; m++) {
    const factor = SEASONAL_EXPENSE_FACTORS[m] ?? 1.0;
    const projectedExpense = avgExpenses * factor;
    const reserveNeeded = Math.round(projectedExpense * 0.5); // 50% buffer for each month

    let reason = 'Standard operating reserve';
    if (m === 1) reason = 'Annual renewals and insurance premiums due';
    else if (m === 4) reason = 'Q1 estimated taxes due (federal + WA B&O)';
    else if (m === 10) reason = 'Holiday marketing spend ramp-up';
    else if (m === 11) reason = 'Peak inventory buildup + marketing spend';
    else if (m === 12) reason = 'Year-end bonuses and holiday expenses';

    monthlyRecs.push({ month: m, reserveNeeded, reason });
  }

  const peakMonth = monthlyRecs.reduce((a, b) => b.reserveNeeded > a.reserveNeeded ? b : a).month;
  // Leanest revenue = highest seasonal expense factor (most expensive relative to revenue)
  const leanestMonth = 1; // January is typically the leanest for med spas

  return {
    currentReserve: Math.round(currentBalance),
    recommendedReserve: Math.round(recommendedReserve),
    gap: Math.round(gap),
    monthlyContribution,
    peakExpenseMonth: peakMonth,
    leanestRevenueMonth: leanestMonth,
    monthlyRecommendations: monthlyRecs,
  };
}

/**
 * Score emergency fund adequacy.
 */
export function scoreEmergencyFund(
  bankBalance: number,
  monthlyExpenses: number[],
): EmergencyFundScore {
  const avgExpenses = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length
    : 1; // avoid division by zero

  const targetMonths = 4; // med spa recommended: 4 months
  const targetAmount = avgExpenses * targetMonths;
  const currentMonths = avgExpenses > 0 ? bankBalance / avgExpenses : 0;

  // Score: 100 if 6+ months, 0 if 0 months
  const score = Math.min(100, Math.round((currentMonths / 6) * 100));

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 30) grade = 'D';
  else grade = 'F';

  const shortfall = Math.max(0, targetAmount - bankBalance);

  let recommendation: string;
  if (currentMonths >= 6) {
    recommendation = 'Excellent emergency fund. Consider investing excess reserves for growth.';
  } else if (currentMonths >= 4) {
    recommendation = 'Solid emergency fund. Maintain current savings rate.';
  } else if (currentMonths >= 2) {
    recommendation = `Build emergency fund by saving $${Math.round(shortfall / 6).toLocaleString()}/month to reach ${targetMonths}-month target.`;
  } else {
    recommendation = `Critical: only ${Math.round(currentMonths * 10) / 10} months of runway. Prioritize building reserves immediately.`;
  }

  return {
    score,
    grade,
    currentMonths: Math.round(currentMonths * 10) / 10,
    targetMonths,
    shortfall: Math.round(shortfall),
    recommendation,
  };
}

/**
 * Generate cash flow alerts based on current position.
 */
export function generateCashFlowAlerts(
  position: CashPosition,
  burnRate: BurnRateAnalysis,
  runway: RunwayAnalysis,
  obligations: Obligation[],
  emergencyScore: EmergencyFundScore,
): CashFlowAlert[] {
  const alerts: CashFlowAlert[] = [];

  // Critical: low runway
  if (runway.status === 'critical') {
    alerts.push({
      severity: 'critical',
      category: 'runway',
      message: `Cash runway is critically low at ${runway.monthsOfRunway} months`,
      actionRequired: 'Immediately review expenses and explore revenue acceleration strategies',
    });
  } else if (runway.status === 'caution') {
    alerts.push({
      severity: 'warning',
      category: 'runway',
      message: `Cash runway is ${runway.monthsOfRunway} months — below 6-month safety threshold`,
      actionRequired: 'Build cash reserves and monitor burn rate closely',
    });
  }

  // Negative cash flow
  if (burnRate.netBurnRate > 0) {
    alerts.push({
      severity: 'warning',
      category: 'cash_flow',
      message: `Net cash outflow of $${burnRate.netBurnRate.toLocaleString()}/month`,
      actionRequired: 'Expenses exceed revenue — review cost structure',
    });
  }

  // Increasing burn rate
  if (burnRate.burnRateTrend === 'increasing') {
    alerts.push({
      severity: 'info',
      category: 'burn_rate',
      message: 'Monthly expenses trending upward over last 3 months',
      actionRequired: 'Review recent expense increases to ensure they drive proportional revenue growth',
    });
  }

  // Upcoming high-priority obligations
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 86400000);
  for (const o of obligations) {
    const dueDate = new Date(o.dueDate);
    if (dueDate <= twoWeeksOut && o.priority === 'critical') {
      alerts.push({
        severity: 'critical',
        category: 'obligation',
        message: `${o.name}: $${o.amount.toLocaleString()} due ${o.dueDate}`,
        actionRequired: 'Ensure sufficient funds for this obligation',
        dueDate: o.dueDate,
        amount: o.amount,
      });
    }
  }

  // Emergency fund
  if (emergencyScore.grade === 'F') {
    alerts.push({
      severity: 'critical',
      category: 'emergency_fund',
      message: `Emergency fund critically low: ${emergencyScore.currentMonths} months of expenses`,
      actionRequired: emergencyScore.recommendation,
    });
  } else if (emergencyScore.grade === 'D') {
    alerts.push({
      severity: 'warning',
      category: 'emergency_fund',
      message: `Emergency fund below target: ${emergencyScore.currentMonths} months of expenses`,
      actionRequired: emergencyScore.recommendation,
    });
  }

  // Low days of cash on hand
  if (position.daysOfCashOnHand < 14) {
    alerts.push({
      severity: 'critical',
      category: 'liquidity',
      message: `Only ${position.daysOfCashOnHand} days of cash on hand`,
      actionRequired: 'Accelerate receivables collection and defer non-essential expenses',
    });
  } else if (position.daysOfCashOnHand < 30) {
    alerts.push({
      severity: 'warning',
      category: 'liquidity',
      message: `${position.daysOfCashOnHand} days of cash on hand — below 30-day threshold`,
      actionRequired: 'Monitor daily cash position and prioritize incoming payments',
    });
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

/**
 * Generate monthly cash flow projections for the next N months.
 */
export function projectCashFlow(
  bankBalance: number,
  monthlyRevenue: number[],
  monthlyExpenses: number[],
  months: number = 6,
): CashFlowMonthProjection[] {
  const avgRevenue = monthlyRevenue.length > 0
    ? monthlyRevenue.reduce((s, v) => s + v, 0) / monthlyRevenue.length
    : 0;
  const avgExpenses = monthlyExpenses.length > 0
    ? monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length
    : 0;

  // Use slight growth trend from recent data
  let growthRate = 0;
  if (monthlyRevenue.length >= 3) {
    const recent = monthlyRevenue.slice(-3);
    growthRate = recent[0] > 0 ? ((recent[2] - recent[0]) / recent[0]) / 3 : 0;
  }

  const projections: CashFlowMonthProjection[] = [];
  let runningBalance = bankBalance;
  let cumulativeCashFlow = 0;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    const month = date.toISOString().slice(0, 7);
    const monthNum = date.getMonth() + 1;

    const inflow = Math.round(avgRevenue * (1 + growthRate * (i + 1)));
    const expenseFactor = SEASONAL_EXPENSE_FACTORS[monthNum] ?? 1.0;
    const outflow = Math.round(avgExpenses * expenseFactor);
    const net = inflow - outflow;

    runningBalance += net;
    cumulativeCashFlow += net;

    projections.push({
      month,
      projectedInflow: inflow,
      projectedOutflow: outflow,
      netCashFlow: net,
      endingBalance: Math.round(runningBalance),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
    });
  }

  return projections;
}

/**
 * Main cash flow analysis function.
 */
export function analyzeCashFlow(input: CashFlowInput): CashFlowResult {
  const {
    bankBalance,
    monthlyRevenue,
    monthlyExpenses,
    fixedCosts,
    variableCosts,
    receivables,
    payroll,
    upcomingObligations,
    creditLineAvailable = 0,
  } = input;

  // 1. Receivables
  const receivablesAging = analyzeReceivables(receivables);

  // 2. Cost breakdown
  const costBreakdown = analyzeCosts(fixedCosts, variableCosts);

  // 3. Payroll
  const currentRevenue = monthlyRevenue[monthlyRevenue.length - 1] ?? 0;
  const payrollSummary = analyzePayroll(payroll, currentRevenue);

  // 4. Burn rate
  const burnRate = analyzeBurnRate(monthlyRevenue, monthlyExpenses);

  // 5. Runway
  const runway = calculateRunway(bankBalance, monthlyRevenue, monthlyExpenses, creditLineAvailable);

  // 6. Cash position
  const upcomingTotal = upcomingObligations.reduce((s, o) => s + o.amount, 0);
  const dailyBurn = burnRate.dailyBurnRate;
  const daysOfCash = dailyBurn > 0 ? Math.floor(bankBalance / dailyBurn) : 999;

  const currentPosition: CashPosition = {
    bankBalance: Math.round(bankBalance),
    expectedReceivables: receivablesAging.weightedCollectable,
    totalAvailable: Math.round(bankBalance + creditLineAvailable),
    netCashPosition: Math.round(bankBalance - upcomingTotal),
    upcomingObligationsTotal: Math.round(upcomingTotal),
    daysOfCashOnHand: Math.min(999, daysOfCash),
  };

  // 7. Operating cash flow
  const avgRevenueRecent = monthlyRevenue.slice(-3);
  const avgExpenseRecent = monthlyExpenses.slice(-3);
  const monthlyInflow = avgRevenueRecent.length > 0
    ? avgRevenueRecent.reduce((s, v) => s + v, 0) / avgRevenueRecent.length
    : 0;
  const monthlyOutflow = avgExpenseRecent.length > 0
    ? avgExpenseRecent.reduce((s, v) => s + v, 0) / avgExpenseRecent.length
    : 0;

  const threeMonthAvg = monthlyInflow - monthlyOutflow;
  const sixMonthRev = monthlyRevenue.slice(-6);
  const sixMonthExp = monthlyExpenses.slice(-6);
  const sixMonthAvgInflow = sixMonthRev.length > 0 ? sixMonthRev.reduce((s, v) => s + v, 0) / sixMonthRev.length : 0;
  const sixMonthAvgOutflow = sixMonthExp.length > 0 ? sixMonthExp.reduce((s, v) => s + v, 0) / sixMonthExp.length : 0;

  let ocfTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (threeMonthAvg > (sixMonthAvgInflow - sixMonthAvgOutflow) * 1.05) ocfTrend = 'improving';
  else if (threeMonthAvg < (sixMonthAvgInflow - sixMonthAvgOutflow) * 0.95) ocfTrend = 'declining';

  const operatingCashFlow: OperatingCashFlow = {
    monthlyInflow: Math.round(monthlyInflow),
    monthlyOutflow: Math.round(monthlyOutflow),
    netOperatingCashFlow: Math.round(monthlyInflow - monthlyOutflow),
    trend: ocfTrend,
    threeMonthAvg: Math.round(threeMonthAvg),
    sixMonthAvg: Math.round(sixMonthAvgInflow - sixMonthAvgOutflow),
  };

  // 8. Seasonal reserves
  const seasonalReserves = recommendSeasonalReserves(monthlyExpenses, monthlyRevenue, bankBalance);

  // 9. Emergency fund
  const emergencyFund = scoreEmergencyFund(bankBalance, monthlyExpenses);

  // 10. Monthly projections
  const monthlyProjections = projectCashFlow(bankBalance, monthlyRevenue, monthlyExpenses, 6);

  // 11. Alerts
  const alerts = generateCashFlowAlerts(
    currentPosition,
    burnRate,
    runway,
    upcomingObligations,
    emergencyFund,
  );

  return {
    currentPosition,
    operatingCashFlow,
    receivablesAging,
    costBreakdown,
    payrollSummary,
    burnRate,
    runway,
    seasonalReserves,
    emergencyFund,
    monthlyProjections,
    alerts,
  };
}
