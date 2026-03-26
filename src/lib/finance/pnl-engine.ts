/**
 * Automated P&L + Financial Intelligence Engine
 *
 * Generates real-time profit & loss statements, expense categorization,
 * margin analysis, and financial projections from Airtable transaction data.
 *
 * Capabilities:
 * 1. Auto-categorize expenses (payroll, rent, supplies, marketing, insurance)
 * 2. Calculate gross/net margins by service, provider, and category
 * 3. Generate monthly P&L statement
 * 4. Cash flow projections and runway analysis
 * 5. Break-even analysis by service
 * 6. Provider profitability ranking
 * 7. Financial health scoring
 */

// ── TYPES ──

export interface FinanceInput {
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  period: { start: string; end: string }; // YYYY-MM-DD
  memberships: { count: number; monthlyRevenue: number };
  previousPeriod?: { revenue: number; expenses: number; netIncome: number };
  bankBalance?: number;
  monthlyFixedCosts?: number;
}

export interface RevenueEntry {
  date: string;
  amount: number;
  service: string;
  category: string;
  provider: string;
  paymentMethod: 'cash' | 'card' | 'financing' | 'membership' | 'package';
  clientType: 'new' | 'returning' | 'member';
  clientId?: string;
}

export interface ExpenseEntry {
  date: string;
  amount: number;
  vendor: string;
  description: string;
  category?: ExpenseCategory;
}

export type ExpenseCategory =
  | 'payroll'
  | 'rent'
  | 'supplies'
  | 'marketing'
  | 'insurance'
  | 'equipment'
  | 'software'
  | 'utilities'
  | 'professional_services'
  | 'training'
  | 'misc';

// ── OUTPUT TYPES ──

export interface ProfitLossStatement {
  period: string;
  revenue: {
    services: number;
    memberships: number;
    packages: number;
    total: number;
    byCategory: { category: string; amount: number; percentage: number }[];
    byProvider: { provider: string; amount: number; percentage: number }[];
  };
  costOfServices: {
    supplies: number;
    providerCompensation: number;
    total: number;
  };
  grossProfit: number;
  grossMargin: number; // percentage
  operatingExpenses: {
    byCategory: { category: string; amount: number }[];
    total: number;
  };
  netIncome: number;
  netMargin: number; // percentage
  periodComparison?: {
    revenueChange: number; // percentage
    expenseChange: number;
    netIncomeChange: number;
  };
}

export interface ServiceMarginAnalysis {
  service: string;
  category: string;
  revenue: number;
  estimatedCost: number;
  grossProfit: number;
  grossMargin: number;
  bookings: number;
  avgTicket: number;
  revenuePerMinute: number;
  profitPerBooking: number;
  rank: number;
}

export interface ProviderProfitability {
  provider: string;
  revenue: number;
  estimatedCost: number; // compensation + supplies
  grossProfit: number;
  grossMargin: number;
  bookings: number;
  avgTicket: number;
  revenuePerHour: number;
  topServices: { service: string; revenue: number }[];
}

export interface CashFlowProjection {
  month: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetIncome: number;
  projectedBalance: number;
  runwayMonths: number; // at current burn rate
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  components: {
    profitability: number;
    growth: number;
    efficiency: number;
    stability: number;
    cashPosition: number;
  };
  alerts: string[];
  recommendations: string[];
}

export interface FinancialIntelligenceResult {
  pnl: ProfitLossStatement;
  serviceMargins: ServiceMarginAnalysis[];
  providerProfitability: ProviderProfitability[];
  cashFlowProjection: CashFlowProjection[];
  healthScore: FinancialHealthScore;
  insights: string[];
  kpis: FinancialKPIs;
}

export interface FinancialKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossMargin: number;
  netMargin: number;
  avgDailyRevenue: number;
  avgTicketSize: number;
  revenuePerClient: number;
  membershipRevenuePercent: number;
  financingAdoptionRate: number;
  newClientRevenuePercent: number;
  breakEvenDaily: number;
}

// ── EXPENSE CATEGORIZATION ──

const EXPENSE_KEYWORDS: Record<ExpenseCategory, string[]> = {
  payroll: ['payroll', 'salary', 'wages', 'compensation', 'bonus', 'commission', 'staff', 'w2', '1099'],
  rent: ['rent', 'lease', 'mortgage', 'property', 'space'],
  supplies: ['supplies', 'consumable', 'serum', 'needle', 'botox', 'filler', 'laser', 'hydrafacial', 'peel', 'gloves', 'medical'],
  marketing: ['marketing', 'ads', 'meta', 'google', 'facebook', 'instagram', 'advertising', 'seo', 'campaign', 'promotion', 'sendgrid', 'twilio'],
  insurance: ['insurance', 'malpractice', 'liability', 'coverage', 'premium'],
  equipment: ['equipment', 'machine', 'device', 'sofwave', 'candela', 'cutera', 'repair', 'maintenance'],
  software: ['software', 'subscription', 'saas', 'mangomint', 'n8n', 'vercel', 'airtable', 'twilio', 'stripe', 'plaid'],
  utilities: ['utility', 'electric', 'water', 'gas', 'internet', 'phone', 'wifi'],
  professional_services: ['legal', 'accounting', 'cpa', 'lawyer', 'consultant', 'compliance'],
  training: ['training', 'certification', 'course', 'conference', 'education', 'cme'],
  misc: [],
};

export function categorizeExpense(expense: ExpenseEntry): ExpenseCategory {
  if (expense.category) return expense.category;

  const text = `${expense.vendor} ${expense.description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(EXPENSE_KEYWORDS)) {
    if (category === 'misc') continue;
    if (keywords.some(kw => text.includes(kw))) {
      return category as ExpenseCategory;
    }
  }

  return 'misc';
}

// ── SERVICE COST ESTIMATION ──

// Estimated cost as percentage of revenue (industry benchmarks for medspa)
const SERVICE_COST_RATIOS: Record<string, number> = {
  'HydraFacial': 0.25,
  'Botox': 0.30,
  'Fillers': 0.35,
  'VI Peel': 0.20,
  'PRX-T33': 0.22,
  'RF Microneedling': 0.20,
  'Laser Hair Removal': 0.15,
  'Sofwave': 0.15,
  'PicoWay': 0.18,
  'GLP-1': 0.40,
  'NAD+': 0.30,
  'B12': 0.15,
  'Glutathione': 0.20,
  'Vitamin D3': 0.15,
  'Tri-Immune': 0.20,
};

function estimateServiceCost(service: string, revenue: number): number {
  const ratio = SERVICE_COST_RATIOS[service] || 0.25; // default 25% COGS
  return Math.round(revenue * ratio);
}

// ── MAIN ENGINE ──

export function generateFinancialIntelligence(input: FinanceInput): FinancialIntelligenceResult {
  const categorizedExpenses = input.expenses.map(e => ({
    ...e,
    category: categorizeExpense(e),
  }));

  const pnl = generatePnL(input.revenue, categorizedExpenses, input);
  const serviceMargins = analyzeServiceMargins(input.revenue);
  const providerProfitability = analyzeProviderProfitability(input.revenue);
  const cashFlowProjection = projectCashFlow(input, pnl);
  const kpis = calculateKPIs(input, pnl);
  const healthScore = calculateFinancialHealth(pnl, kpis, input);
  const insights = generateFinancialInsights(pnl, serviceMargins, kpis, input);

  return {
    pnl,
    serviceMargins,
    providerProfitability,
    cashFlowProjection,
    healthScore,
    insights,
    kpis,
  };
}

// ── P&L GENERATION ──

function generatePnL(
  revenue: RevenueEntry[],
  expenses: (ExpenseEntry & { category: ExpenseCategory })[],
  input: FinanceInput
): ProfitLossStatement {
  // Revenue breakdown
  const serviceRevenue = revenue
    .filter(r => r.paymentMethod !== 'membership')
    .reduce((sum, r) => sum + r.amount, 0);
  const membershipRevenue = input.memberships.monthlyRevenue;
  const packageRevenue = revenue
    .filter(r => r.paymentMethod === 'package')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalRevenue = serviceRevenue + membershipRevenue;

  // By category
  const categoryMap = new Map<string, number>();
  revenue.forEach(r => {
    categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + r.amount);
  });
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / totalRevenue) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  // By provider
  const providerMap = new Map<string, number>();
  revenue.forEach(r => {
    providerMap.set(r.provider, (providerMap.get(r.provider) || 0) + r.amount);
  });
  const byProvider = Array.from(providerMap.entries())
    .map(([provider, amount]) => ({
      provider,
      amount,
      percentage: Math.round((amount / totalRevenue) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Cost of services
  const suppliesCost = expenses
    .filter(e => e.category === 'supplies')
    .reduce((sum, e) => sum + e.amount, 0);
  const providerComp = expenses
    .filter(e => e.category === 'payroll')
    .reduce((sum, e) => sum + e.amount, 0);
  const cos = suppliesCost + providerComp;

  const grossProfit = totalRevenue - cos;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  // Operating expenses (everything except COGS)
  const opexCategories: ExpenseCategory[] = [
    'rent', 'marketing', 'insurance', 'equipment', 'software',
    'utilities', 'professional_services', 'training', 'misc',
  ];
  const opexMap = new Map<string, number>();
  expenses
    .filter(e => opexCategories.includes(e.category))
    .forEach(e => {
      opexMap.set(e.category, (opexMap.get(e.category) || 0) + e.amount);
    });
  const opexByCategory = Array.from(opexMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const totalOpex = opexByCategory.reduce((sum, e) => sum + e.amount, 0);

  const netIncome = grossProfit - totalOpex;
  const netMargin = totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0;

  // Period comparison
  let periodComparison;
  if (input.previousPeriod) {
    const prev = input.previousPeriod;
    periodComparison = {
      revenueChange: prev.revenue > 0 ? Math.round(((totalRevenue - prev.revenue) / prev.revenue) * 100) : 0,
      expenseChange: prev.expenses > 0 ? Math.round((((cos + totalOpex) - prev.expenses) / prev.expenses) * 100) : 0,
      netIncomeChange: prev.netIncome !== 0 ? Math.round(((netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100) : 0,
    };
  }

  return {
    period: `${input.period.start} to ${input.period.end}`,
    revenue: {
      services: serviceRevenue,
      memberships: membershipRevenue,
      packages: packageRevenue,
      total: totalRevenue,
      byCategory,
      byProvider,
    },
    costOfServices: {
      supplies: suppliesCost,
      providerCompensation: providerComp,
      total: cos,
    },
    grossProfit,
    grossMargin,
    operatingExpenses: {
      byCategory: opexByCategory,
      total: totalOpex,
    },
    netIncome,
    netMargin,
    periodComparison,
  };
}

// ── SERVICE MARGIN ANALYSIS ──

function analyzeServiceMargins(revenue: RevenueEntry[]): ServiceMarginAnalysis[] {
  const serviceMap = new Map<string, RevenueEntry[]>();
  revenue.forEach(r => {
    const entries = serviceMap.get(r.service) || [];
    entries.push(r);
    serviceMap.set(r.service, entries);
  });

  const analyses: ServiceMarginAnalysis[] = [];
  for (const [service, entries] of serviceMap.entries()) {
    const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);
    const estimatedCost = estimateServiceCost(service, totalRevenue);
    const grossProfit = totalRevenue - estimatedCost;
    const avgTicket = totalRevenue / entries.length;

    // Estimate duration from pricing data (rough mapping)
    const estimatedDuration = avgTicket > 1000 ? 90 : avgTicket > 500 ? 60 : avgTicket > 200 ? 45 : 30;

    analyses.push({
      service,
      category: entries[0]?.category || 'Unknown',
      revenue: totalRevenue,
      estimatedCost,
      grossProfit,
      grossMargin: Math.round((grossProfit / totalRevenue) * 100),
      bookings: entries.length,
      avgTicket: Math.round(avgTicket),
      revenuePerMinute: Math.round((avgTicket / estimatedDuration) * 100) / 100,
      profitPerBooking: Math.round(grossProfit / entries.length),
      rank: 0, // set below
    });
  }

  // Rank by profitability
  analyses.sort((a, b) => b.grossProfit - a.grossProfit);
  analyses.forEach((a, i) => { a.rank = i + 1; });

  return analyses;
}

// ── PROVIDER PROFITABILITY ──

function analyzeProviderProfitability(revenue: RevenueEntry[]): ProviderProfitability[] {
  const providerMap = new Map<string, RevenueEntry[]>();
  revenue.forEach(r => {
    const entries = providerMap.get(r.provider) || [];
    entries.push(r);
    providerMap.set(r.provider, entries);
  });

  const results: ProviderProfitability[] = [];
  for (const [provider, entries] of providerMap.entries()) {
    const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);
    // Estimate provider cost at 35% of revenue (typical commission + benefits)
    const estimatedCost = Math.round(totalRevenue * 0.35);
    const grossProfit = totalRevenue - estimatedCost;

    // Top services
    const serviceRevMap = new Map<string, number>();
    entries.forEach(e => {
      serviceRevMap.set(e.service, (serviceRevMap.get(e.service) || 0) + e.amount);
    });
    const topServices = Array.from(serviceRevMap.entries())
      .map(([service, rev]) => ({ service, revenue: rev }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Estimate hours worked (8 hr days)
    const uniqueDays = new Set(entries.map(e => e.date)).size;
    const hoursWorked = uniqueDays * 8;

    results.push({
      provider,
      revenue: totalRevenue,
      estimatedCost,
      grossProfit,
      grossMargin: Math.round((grossProfit / totalRevenue) * 100),
      bookings: entries.length,
      avgTicket: Math.round(totalRevenue / entries.length),
      revenuePerHour: hoursWorked > 0 ? Math.round(totalRevenue / hoursWorked) : 0,
      topServices,
    });
  }

  return results.sort((a, b) => b.revenue - a.revenue);
}

// ── CASH FLOW PROJECTION ──

function projectCashFlow(
  input: FinanceInput,
  pnl: ProfitLossStatement
): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];
  const startBalance = input.bankBalance || 0;
  const monthlyRevenue = pnl.revenue.total;
  const monthlyExpenses = pnl.costOfServices.total + pnl.operatingExpenses.total;

  // Growth assumptions
  const revenueGrowthRate = 0.03; // 3% monthly growth
  const expenseGrowthRate = 0.01; // 1% monthly expense growth

  let balance = startBalance;

  for (let i = 0; i < 6; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    const monthStr = month.toLocaleString('default', { month: 'short', year: 'numeric' });

    const projectedRev = Math.round(monthlyRevenue * Math.pow(1 + revenueGrowthRate, i));
    const projectedExp = Math.round(monthlyExpenses * Math.pow(1 + expenseGrowthRate, i));
    const projectedNet = projectedRev - projectedExp;
    balance += projectedNet;

    // Runway: if losing money (burn > 0), how many months until zero
    const monthlyBurn = projectedExp - projectedRev;
    const runway = monthlyBurn > 0 && balance > 0 ? Math.round(balance / monthlyBurn) : monthlyBurn > 0 ? 0 : 99;

    projections.push({
      month: monthStr,
      projectedRevenue: projectedRev,
      projectedExpenses: projectedExp,
      projectedNetIncome: projectedNet,
      projectedBalance: balance,
      runwayMonths: Math.max(0, runway),
    });
  }

  return projections;
}

// ── KPIs ──

function calculateKPIs(input: FinanceInput, pnl: ProfitLossStatement): FinancialKPIs {
  const days = Math.max(1, Math.ceil(
    (new Date(input.period.end).getTime() - new Date(input.period.start).getTime()) / 86400000
  ));

  const financingTransactions = input.revenue.filter(r => r.paymentMethod === 'financing');
  const newClientRevenue = input.revenue
    .filter(r => r.clientType === 'new')
    .reduce((sum, r) => sum + r.amount, 0);
  const uniqueClients = new Set(
    input.revenue
      .filter(r => r.clientId)
      .map(r => r.clientId)
  ).size || input.revenue.length; // Fallback to transaction count if no clientIds

  const fixedCosts = input.monthlyFixedCosts || (pnl.operatingExpenses.total * 0.7); // 70% fixed
  const breakEvenDaily = fixedCosts / 30;

  return {
    totalRevenue: pnl.revenue.total,
    totalExpenses: pnl.costOfServices.total + pnl.operatingExpenses.total,
    netIncome: pnl.netIncome,
    grossMargin: pnl.grossMargin,
    netMargin: pnl.netMargin,
    avgDailyRevenue: Math.round(pnl.revenue.total / days),
    avgTicketSize: input.revenue.length > 0
      ? Math.round(pnl.revenue.total / input.revenue.length)
      : 0,
    revenuePerClient: uniqueClients > 0
      ? Math.round(pnl.revenue.total / uniqueClients)
      : 0,
    membershipRevenuePercent: pnl.revenue.total > 0
      ? Math.round((pnl.revenue.memberships / pnl.revenue.total) * 100)
      : 0,
    financingAdoptionRate: input.revenue.length > 0
      ? Math.round((financingTransactions.length / input.revenue.length) * 100)
      : 0,
    newClientRevenuePercent: pnl.revenue.total > 0
      ? Math.round((newClientRevenue / pnl.revenue.total) * 100)
      : 0,
    breakEvenDaily: Math.round(breakEvenDaily),
  };
}

// ── FINANCIAL HEALTH SCORE ──

function calculateFinancialHealth(
  pnl: ProfitLossStatement,
  kpis: FinancialKPIs,
  input: FinanceInput
): FinancialHealthScore {
  const alerts: string[] = [];
  const recommendations: string[] = [];

  // Profitability (0-100)
  let profitability = 50;
  if (pnl.netMargin > 20) profitability = 90;
  else if (pnl.netMargin > 15) profitability = 80;
  else if (pnl.netMargin > 10) profitability = 70;
  else if (pnl.netMargin > 5) profitability = 55;
  else if (pnl.netMargin > 0) profitability = 40;
  else {
    profitability = 20;
    alerts.push('Business is operating at a loss this period');
    recommendations.push('Review expenses immediately - identify top 3 cost reduction opportunities');
  }

  // Growth (0-100)
  let growth = 50;
  if (pnl.periodComparison) {
    const revChange = pnl.periodComparison.revenueChange;
    if (revChange > 20) growth = 95;
    else if (revChange > 10) growth = 85;
    else if (revChange > 5) growth = 70;
    else if (revChange > 0) growth = 55;
    else if (revChange > -5) growth = 40;
    else {
      growth = 20;
      alerts.push(`Revenue declined ${Math.abs(revChange)}% vs prior period`);
      recommendations.push('Activate reactivation campaigns for lapsed clients');
    }
  }

  // Efficiency (0-100)
  let efficiency = 50;
  if (pnl.grossMargin > 65) efficiency = 90;
  else if (pnl.grossMargin > 55) efficiency = 75;
  else if (pnl.grossMargin > 45) efficiency = 60;
  else {
    efficiency = 35;
    alerts.push(`Gross margin at ${pnl.grossMargin}% - below industry standard of 55-70%`);
    recommendations.push('Review supplier costs and consider negotiating bulk rates');
  }

  // Stability (0-100) - based on revenue mix
  let stability = 50;
  if (kpis.membershipRevenuePercent > 30) stability = 85;
  else if (kpis.membershipRevenuePercent > 20) stability = 70;
  else if (kpis.membershipRevenuePercent > 10) stability = 55;
  else {
    stability = 35;
    recommendations.push('Increase membership revenue to 20%+ for predictable recurring income');
  }

  // Cash position (0-100)
  let cashPosition = 50;
  if (input.bankBalance) {
    const monthsOfExpenses = input.bankBalance / (kpis.totalExpenses || 1);
    if (monthsOfExpenses > 6) cashPosition = 95;
    else if (monthsOfExpenses > 3) cashPosition = 80;
    else if (monthsOfExpenses > 1) cashPosition = 55;
    else {
      cashPosition = 25;
      alerts.push('Cash reserves below 1 month of operating expenses');
      recommendations.push('Build 3-month cash reserve as priority');
    }
  }

  const overall = Math.round(
    profitability * 0.30 +
    growth * 0.20 +
    efficiency * 0.20 +
    stability * 0.15 +
    cashPosition * 0.15
  );

  return {
    overall,
    components: { profitability, growth, efficiency, stability, cashPosition },
    alerts,
    recommendations,
  };
}

// ── INSIGHTS ──

function generateFinancialInsights(
  pnl: ProfitLossStatement,
  serviceMargins: ServiceMarginAnalysis[],
  kpis: FinancialKPIs,
  input: FinanceInput
): string[] {
  const insights: string[] = [];

  // Top revenue service
  if (serviceMargins.length > 0) {
    const top = serviceMargins[0];
    insights.push(
      `Top revenue generator: ${top.service} - $${top.revenue.toLocaleString()} (${top.grossMargin}% margin, ${top.bookings} bookings)`
    );
  }

  // Best margin service
  const bestMargin = [...serviceMargins].sort((a, b) => b.grossMargin - a.grossMargin)[0];
  if (bestMargin && bestMargin.service !== serviceMargins[0]?.service) {
    insights.push(
      `Highest margin service: ${bestMargin.service} at ${bestMargin.grossMargin}%. Consider pushing this service harder in marketing.`
    );
  }

  // Revenue mix
  if (kpis.newClientRevenuePercent > 40) {
    insights.push(
      `${kpis.newClientRevenuePercent}% of revenue from new clients - great acquisition but focus on retention to build LTV.`
    );
  } else if (kpis.newClientRevenuePercent < 15) {
    insights.push(
      `Only ${kpis.newClientRevenuePercent}% from new clients - increase marketing spend to maintain growth pipeline.`
    );
  }

  // Financing opportunity
  if (kpis.financingAdoptionRate < 15) {
    insights.push(
      `Financing adoption at ${kpis.financingAdoptionRate}%. Proactively offering Cherry on $500+ services could increase avg ticket 15-25%.`
    );
  }

  // Break-even analysis
  if (kpis.avgDailyRevenue > kpis.breakEvenDaily) {
    const cushion = Math.round(((kpis.avgDailyRevenue - kpis.breakEvenDaily) / kpis.breakEvenDaily) * 100);
    insights.push(
      `Daily revenue ($${kpis.avgDailyRevenue.toLocaleString()}) exceeds break-even ($${kpis.breakEvenDaily.toLocaleString()}) by ${cushion}%. Healthy operating cushion.`
    );
  } else {
    insights.push(
      `⚠️ Daily revenue ($${kpis.avgDailyRevenue.toLocaleString()}) below break-even ($${kpis.breakEvenDaily.toLocaleString()}). Focus on filling schedule and increasing ticket size.`
    );
  }

  return insights;
}
