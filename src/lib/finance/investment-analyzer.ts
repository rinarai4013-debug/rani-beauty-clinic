/**
 * Investment & ROI Analyzer
 *
 * Equipment ROI, new service financial models, staff hiring ROI,
 * marketing channel comparison, location expansion modeling,
 * lease vs buy analysis, and payback period calculations
 * for Rani Beauty Clinic.
 */

// ── TYPES ──

export interface EquipmentInvestment {
  name: string;
  cost: number;
  installationCost: number;
  trainingCost: number;
  monthlyMaintenance: number;
  usefulLifeYears: number;
  salvageValue: number;
  estimatedTreatmentsPerMonth: number;
  revenuePerTreatment: number;
  costPerTreatment: number; // consumables
  requiredStaffHoursPerTreatment: number;
  staffCostPerHour: number;
  financingRate?: number; // annual interest rate if financed
  financingTermMonths?: number;
}

export interface ServiceLaunchModel {
  serviceName: string;
  equipmentCost: number;
  trainingCost: number;
  marketingLaunchBudget: number;
  monthlyMarketingBudget: number;
  pricePerSession: number;
  costPerSession: number;
  sessionsMonth1: number;
  sessionsMonth3: number; // expected at 3-month ramp
  sessionsMonth6: number; // expected at steady state
  monthlyOverhead: number;
}

export interface StaffHiringModel {
  role: string;
  annualSalary: number;
  benefits: number; // annual
  trainingCost: number;
  rampUpMonths: number;
  expectedRevenuePerHour: number;
  hoursPerWeek: number;
  utilizationTarget: number; // 0-1
}

export interface MarketingChannelModel {
  channel: string;
  monthlySpend: number;
  leadsPerMonth: number;
  conversionRate: number;
  avgFirstVisitRevenue: number;
  avgClientLTV: number;
  timeToFirstBooking: number; // days
}

export interface LocationExpansionModel {
  location: string;
  buildOutCost: number;
  monthlyRent: number;
  monthlyUtilities: number;
  staffCost: number; // monthly total
  equipmentCost: number;
  marketingBudget: number; // monthly
  projectedRevenue: {
    month3: number;
    month6: number;
    month12: number;
    month24: number;
  };
  leaseTerm: number; // months
}

export interface LeaseVsBuyInput {
  assetName: string;
  purchasePrice: number;
  leaseMonthlyCost: number;
  leaseTermMonths: number;
  leaseBuyoutPrice: number;
  maintenanceIfOwned: number; // annual
  maintenanceIfLeased: number; // annual (usually included)
  usefulLifeYears: number;
  salvageValue: number;
  taxRate: number; // marginal tax rate for depreciation benefit
  discountRate: number; // cost of capital / opportunity cost
}

// ── OUTPUT TYPES ──

export interface EquipmentROIResult {
  totalInvestment: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  annualROI: number;
  paybackMonths: number;
  fiveYearNPV: number;
  irr: number;
  breakEvenTreatments: number;
  monthlyBreakdown: MonthlyProjection[];
  financing?: FinancingAnalysis;
  recommendation: string;
}

export interface MonthlyProjection {
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
  cumulativeProfit: number;
  cumulativeROI: number;
}

export interface FinancingAnalysis {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  effectiveMonthlyProfit: number;
  paybackWithFinancing: number;
}

export interface ServiceLaunchResult {
  totalUpfrontCost: number;
  monthlyFixedCosts: number;
  breakEvenSessions: number;
  breakEvenMonth: number;
  yearOneRevenue: number;
  yearOneProfit: number;
  yearOneROI: number;
  steadyStateMonthlyProfit: number;
  monthlyProjections: MonthlyProjection[];
  riskFactors: string[];
  recommendation: string;
}

export interface StaffROIResult {
  totalHiringCost: number;
  annualFullCost: number;
  expectedAnnualRevenue: number;
  expectedAnnualProfit: number;
  roi: number;
  paybackMonths: number;
  revenuePerHour: number;
  costPerHour: number;
  profitPerHour: number;
  utilizationSensitivity: { utilization: number; annualProfit: number; roi: number }[];
  recommendation: string;
}

export interface MarketingROIResult {
  channels: {
    channel: string;
    monthlySpend: number;
    monthlyLeads: number;
    monthlyClients: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    monthlyROI: number;
    annualROI: number;
    paybackDays: number;
    recommendation: string;
  }[];
  bestChannel: string;
  worstChannel: string;
  optimalAllocation: { channel: string; suggestedSpend: number; expectedROI: number }[];
  totalMonthlyBudget: number;
  blendedROI: number;
}

export interface LocationExpansionResult {
  totalUpfrontCost: number;
  monthlyFixedCosts: number;
  breakEvenMonth: number;
  yearOneProfit: number;
  yearTwoProfit: number;
  fiveYearNPV: number;
  fiveYearROI: number;
  monthlyProjections: MonthlyProjection[];
  riskFactors: string[];
  recommendation: string;
}

export interface LeaseVsBuyResult {
  leaseTotal: number;
  buyTotal: number;
  leasePV: number; // present value
  buyPV: number;
  savings: number; // positive = buy is cheaper
  recommendation: 'lease' | 'buy';
  reasoning: string;
  comparison: {
    factor: string;
    lease: string;
    buy: string;
  }[];
}

// ── CORE FUNCTIONS ──

/**
 * Calculate Net Present Value for a cash flow stream.
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, t) => {
    return npv + cf / Math.pow(1 + discountRate, t);
  }, 0);
}

/**
 * Calculate Internal Rate of Return using Newton's method.
 */
export function calculateIRR(cashFlows: number[], maxIterations: number = 100): number {
  if (cashFlows.length < 2) return 0;

  let rate = 0.1; // initial guess
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      if (t > 0) {
        derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) break;
    if (derivative === 0) break;

    rate = rate - npv / derivative;

    // Guard against divergence
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 5;
  }

  return Math.round(rate * 10000) / 10000;
}

/**
 * Calculate monthly loan payment.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

/**
 * Equipment ROI calculator with depreciation and optional financing.
 */
export function analyzeEquipmentROI(investment: EquipmentInvestment): EquipmentROIResult {
  const totalInvestment = investment.cost + investment.installationCost + investment.trainingCost;

  const monthlyRevenue = investment.estimatedTreatmentsPerMonth * investment.revenuePerTreatment;
  const monthlyConsumables = investment.estimatedTreatmentsPerMonth * investment.costPerTreatment;
  const monthlyStaffCost = investment.estimatedTreatmentsPerMonth *
    investment.requiredStaffHoursPerTreatment * investment.staffCostPerHour;
  const monthlyExpenses = monthlyConsumables + monthlyStaffCost + investment.monthlyMaintenance;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const annualProfit = monthlyProfit * 12;
  const annualROI = totalInvestment > 0 ? (annualProfit / totalInvestment) * 100 : 0;

  const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalInvestment / monthlyProfit) : -1;

  // Break-even treatments per month
  const profitPerTreatment = investment.revenuePerTreatment - investment.costPerTreatment -
    (investment.requiredStaffHoursPerTreatment * investment.staffCostPerHour);
  const breakEvenTreatments = profitPerTreatment > 0
    ? Math.ceil((totalInvestment + investment.monthlyMaintenance * 12) / (profitPerTreatment * 12))
    : -1;

  // Monthly breakdown for 60 months
  const monthlyBreakdown: MonthlyProjection[] = [];
  let cumulativeProfit = -totalInvestment;

  for (let m = 1; m <= 60; m++) {
    const revenue = monthlyRevenue;
    const expenses = monthlyExpenses;
    const profit = revenue - expenses;
    cumulativeProfit += profit;

    monthlyBreakdown.push({
      month: m,
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      profit: Math.round(profit),
      cumulativeProfit: Math.round(cumulativeProfit),
      cumulativeROI: totalInvestment > 0 ? Math.round((cumulativeProfit / totalInvestment) * 1000) / 10 : 0,
    });
  }

  // NPV (5-year, 8% discount rate)
  const annualCashFlows = [-totalInvestment];
  for (let y = 1; y <= 5; y++) {
    const yearRevenue = monthlyRevenue * 12;
    const yearExpenses = monthlyExpenses * 12;
    annualCashFlows.push(yearRevenue - yearExpenses);
  }
  // Add salvage value in year 5
  annualCashFlows[5] = (annualCashFlows[5] ?? 0) + investment.salvageValue;

  const fiveYearNPV = Math.round(calculateNPV(annualCashFlows, 0.08));
  const irr = calculateIRR(annualCashFlows);

  // Financing analysis
  let financing: FinancingAnalysis | undefined;
  if (investment.financingRate && investment.financingTermMonths) {
    const payment = calculateMonthlyPayment(
      investment.cost,
      investment.financingRate,
      investment.financingTermMonths,
    );
    const totalPayments = payment * investment.financingTermMonths;
    const totalInterest = totalPayments - investment.cost;

    financing = {
      monthlyPayment: Math.round(payment),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(totalPayments + investment.installationCost + investment.trainingCost),
      effectiveMonthlyProfit: Math.round(monthlyProfit - payment),
      paybackWithFinancing: (monthlyProfit - payment) > 0
        ? Math.ceil((investment.installationCost + investment.trainingCost) / (monthlyProfit - payment))
        : -1,
    };
  }

  let recommendation: string;
  if (annualROI > 50 && paybackMonths <= 12) {
    recommendation = `Strong investment. ${paybackMonths}-month payback with ${Math.round(annualROI)}% annual ROI. Proceed with confidence.`;
  } else if (annualROI > 25 && paybackMonths <= 24) {
    recommendation = `Good investment. ${paybackMonths}-month payback with ${Math.round(annualROI)}% annual ROI. Recommended.`;
  } else if (annualROI > 0) {
    recommendation = `Marginal investment. ${paybackMonths}-month payback with ${Math.round(annualROI)}% annual ROI. Consider alternatives or negotiate price.`;
  } else {
    recommendation = 'Investment does not generate positive return at projected utilization. Revisit volume assumptions or negotiate better terms.';
  }

  return {
    totalInvestment,
    monthlyRevenue: Math.round(monthlyRevenue),
    monthlyProfit: Math.round(monthlyProfit),
    annualROI: Math.round(annualROI * 10) / 10,
    paybackMonths,
    fiveYearNPV,
    irr: Math.round(irr * 10000) / 100, // as percentage
    breakEvenTreatments,
    monthlyBreakdown,
    financing,
    recommendation,
  };
}

/**
 * New service launch financial model.
 */
export function analyzeServiceLaunch(model: ServiceLaunchModel): ServiceLaunchResult {
  const totalUpfrontCost = model.equipmentCost + model.trainingCost + model.marketingLaunchBudget;
  const monthlyFixedCosts = model.monthlyMarketingBudget + model.monthlyOverhead;

  // Ramp curve: month 1 → month 3 → month 6 (steady state)
  const profitPerSession = model.pricePerSession - model.costPerSession;
  const breakEvenSessions = (monthlyFixedCosts > 0 && profitPerSession > 0)
    ? Math.ceil(monthlyFixedCosts / profitPerSession)
    : -1;

  const monthlyProjections: MonthlyProjection[] = [];
  let cumulativeProfit = -totalUpfrontCost;
  let breakEvenMonth = -1;

  for (let m = 1; m <= 24; m++) {
    // Interpolate sessions based on ramp
    let sessions: number;
    if (m <= 1) sessions = model.sessionsMonth1;
    else if (m <= 3) sessions = model.sessionsMonth1 + (model.sessionsMonth3 - model.sessionsMonth1) * ((m - 1) / 2);
    else if (m <= 6) sessions = model.sessionsMonth3 + (model.sessionsMonth6 - model.sessionsMonth3) * ((m - 3) / 3);
    else sessions = model.sessionsMonth6;

    const revenue = Math.round(sessions * model.pricePerSession);
    const variableCosts = Math.round(sessions * model.costPerSession);
    const expenses = variableCosts + monthlyFixedCosts;
    const profit = revenue - expenses;
    cumulativeProfit += profit;

    if (breakEvenMonth === -1 && cumulativeProfit >= 0) {
      breakEvenMonth = m;
    }

    monthlyProjections.push({
      month: m,
      revenue,
      expenses: Math.round(expenses),
      profit: Math.round(profit),
      cumulativeProfit: Math.round(cumulativeProfit),
      cumulativeROI: totalUpfrontCost > 0 ? Math.round((cumulativeProfit / totalUpfrontCost) * 1000) / 10 : 0,
    });
  }

  const yearOneRevenue = monthlyProjections.slice(0, 12).reduce((s, p) => s + p.revenue, 0);
  const yearOneExpenses = monthlyProjections.slice(0, 12).reduce((s, p) => s + p.expenses, 0);
  const yearOneProfit = yearOneRevenue - yearOneExpenses - totalUpfrontCost;
  const yearOneROI = totalUpfrontCost > 0 ? (yearOneProfit / totalUpfrontCost) * 100 : 0;

  const steadyStateMonthlyProfit = Math.round(
    model.sessionsMonth6 * profitPerSession - monthlyFixedCosts,
  );

  const riskFactors: string[] = [];
  if (model.sessionsMonth1 < 5) riskFactors.push('Low initial volume — aggressive marketing needed');
  if (breakEvenMonth > 12) riskFactors.push('Break-even exceeds 12 months — validate demand before launch');
  if (profitPerSession < model.pricePerSession * 0.3) riskFactors.push('Thin margins — monitor COGS closely');
  if (model.marketingLaunchBudget < model.equipmentCost * 0.1) riskFactors.push('Launch marketing budget may be insufficient');

  let recommendation: string;
  if (yearOneROI > 50 && breakEvenMonth <= 6) {
    recommendation = `Excellent launch opportunity. Break-even in ${breakEvenMonth} months with ${Math.round(yearOneROI)}% Year 1 ROI.`;
  } else if (yearOneROI > 0 && breakEvenMonth <= 12) {
    recommendation = `Viable launch. Break-even in ${breakEvenMonth} months. Monitor ramp closely.`;
  } else {
    recommendation = 'Risky launch. Consider phased approach or validating demand with minimal investment first.';
  }

  return {
    totalUpfrontCost,
    monthlyFixedCosts,
    breakEvenSessions,
    breakEvenMonth,
    yearOneRevenue,
    yearOneProfit: Math.round(yearOneProfit),
    yearOneROI: Math.round(yearOneROI * 10) / 10,
    steadyStateMonthlyProfit,
    monthlyProjections,
    riskFactors,
    recommendation,
  };
}

/**
 * Staff hiring ROI analysis.
 */
export function analyzeStaffHiring(model: StaffHiringModel): StaffROIResult {
  const totalHiringCost = model.trainingCost;
  const annualBenefits = model.benefits;
  const annualFullCost = model.annualSalary + annualBenefits;
  const costPerHour = annualFullCost / (model.hoursPerWeek * 52);

  const billableHoursPerYear = model.hoursPerWeek * 52 * model.utilizationTarget;
  const expectedAnnualRevenue = billableHoursPerYear * model.expectedRevenuePerHour;
  const expectedAnnualProfit = expectedAnnualRevenue - annualFullCost;

  const roi = annualFullCost > 0 ? (expectedAnnualProfit / annualFullCost) * 100 : 0;
  const paybackMonths = expectedAnnualProfit > 0
    ? Math.ceil(totalHiringCost / (expectedAnnualProfit / 12))
    : -1;

  const profitPerHour = model.expectedRevenuePerHour - costPerHour;

  // Utilization sensitivity analysis
  const utilizationSensitivity = [0.50, 0.60, 0.70, 0.80, 0.90, 1.0].map(u => {
    const hours = model.hoursPerWeek * 52 * u;
    const revenue = hours * model.expectedRevenuePerHour;
    const profit = revenue - annualFullCost;
    return {
      utilization: u,
      annualProfit: Math.round(profit),
      roi: annualFullCost > 0 ? Math.round((profit / annualFullCost) * 1000) / 10 : 0,
    };
  });

  let recommendation: string;
  if (roi > 100 && paybackMonths <= 3) {
    recommendation = `Hire immediately. ${Math.round(roi)}% ROI at ${Math.round(model.utilizationTarget * 100)}% utilization. Revenue covers cost ${(expectedAnnualRevenue / annualFullCost).toFixed(1)}x.`;
  } else if (roi > 30) {
    recommendation = `Good hire. ${Math.round(roi)}% ROI. Ensure utilization stays above ${Math.round(model.utilizationTarget * 100)}%.`;
  } else if (roi > 0) {
    recommendation = 'Marginal ROI. Only proceed if there is clear unmet demand or strategic growth requirement.';
  } else {
    recommendation = 'Negative ROI at projected utilization. Delay hiring until demand justifies the cost.';
  }

  return {
    totalHiringCost,
    annualFullCost: Math.round(annualFullCost),
    expectedAnnualRevenue: Math.round(expectedAnnualRevenue),
    expectedAnnualProfit: Math.round(expectedAnnualProfit),
    roi: Math.round(roi * 10) / 10,
    paybackMonths,
    revenuePerHour: Math.round(model.expectedRevenuePerHour),
    costPerHour: Math.round(costPerHour),
    profitPerHour: Math.round(profitPerHour),
    utilizationSensitivity,
    recommendation,
  };
}

/**
 * Marketing channel ROI comparison.
 */
export function analyzeMarketingROI(channels: MarketingChannelModel[]): MarketingROIResult {
  const channelResults = channels.map(c => {
    const monthlyClients = c.leadsPerMonth * c.conversionRate;
    const cac = monthlyClients > 0 ? c.monthlySpend / monthlyClients : Infinity;
    const ltvCacRatio = cac > 0 && cac < Infinity ? c.avgClientLTV / cac : 0;
    const monthlyRevenue = monthlyClients * c.avgFirstVisitRevenue;
    const monthlyROI = c.monthlySpend > 0 ? ((monthlyRevenue - c.monthlySpend) / c.monthlySpend) * 100 : 0;
    const annualROI = c.monthlySpend > 0 ? (((monthlyClients * c.avgClientLTV) - c.monthlySpend * 12) / (c.monthlySpend * 12)) * 100 : 0;
    const paybackDays = c.avgFirstVisitRevenue > 0 && monthlyClients > 0
      ? Math.round(c.monthlySpend / (monthlyRevenue / 30))
      : -1;

    let recommendation: string;
    if (ltvCacRatio >= 5) recommendation = 'Scale aggressively — exceptional channel performance';
    else if (ltvCacRatio >= 3) recommendation = 'Healthy channel — maintain and optimize';
    else if (ltvCacRatio >= 1) recommendation = 'Below target — improve conversion or reduce spend';
    else recommendation = 'Unprofitable — pause and restructure';

    return {
      channel: c.channel,
      monthlySpend: c.monthlySpend,
      monthlyLeads: c.leadsPerMonth,
      monthlyClients: Math.round(monthlyClients * 10) / 10,
      cac: cac === Infinity ? -1 : Math.round(cac),
      ltv: Math.round(c.avgClientLTV),
      ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
      monthlyROI: Math.round(monthlyROI),
      annualROI: Math.round(annualROI),
      paybackDays,
      recommendation,
    };
  });

  const sorted = [...channelResults].sort((a, b) => b.ltvCacRatio - a.ltvCacRatio);
  const bestChannel = sorted[0]?.channel ?? 'N/A';
  const worstChannel = sorted[sorted.length - 1]?.channel ?? 'N/A';

  const totalBudget = channels.reduce((s, c) => s + c.monthlySpend, 0);

  // Optimal allocation: redistribute budget proportional to LTV:CAC
  const totalRatio = channelResults.reduce((s, c) => s + Math.max(0, c.ltvCacRatio), 0);
  const optimalAllocation = channelResults.map(c => {
    const weight = totalRatio > 0 ? Math.max(0, c.ltvCacRatio) / totalRatio : 1 / channelResults.length;
    const suggestedSpend = Math.round(totalBudget * weight);
    return {
      channel: c.channel,
      suggestedSpend,
      expectedROI: c.annualROI,
    };
  });

  const totalRevenue = channelResults.reduce((s, c) => s + c.monthlyClients * c.ltv, 0);
  const blendedROI = totalBudget > 0 ? Math.round(((totalRevenue - totalBudget * 12) / (totalBudget * 12)) * 100) : 0;

  return {
    channels: channelResults,
    bestChannel,
    worstChannel,
    optimalAllocation,
    totalMonthlyBudget: totalBudget,
    blendedROI,
  };
}

/**
 * Location expansion financial model.
 */
export function analyzeLocationExpansion(model: LocationExpansionModel): LocationExpansionResult {
  const totalUpfrontCost = model.buildOutCost + model.equipmentCost;
  const monthlyFixedCosts = model.monthlyRent + model.monthlyUtilities + model.staffCost + model.marketingBudget;

  const monthlyProjections: MonthlyProjection[] = [];
  let cumulativeProfit = -totalUpfrontCost;
  let breakEvenMonth = -1;

  for (let m = 1; m <= 60; m++) {
    // Revenue ramp
    let revenue: number;
    if (m <= 3) revenue = model.projectedRevenue.month3 * (m / 3);
    else if (m <= 6) revenue = model.projectedRevenue.month3 + (model.projectedRevenue.month6 - model.projectedRevenue.month3) * ((m - 3) / 3);
    else if (m <= 12) revenue = model.projectedRevenue.month6 + (model.projectedRevenue.month12 - model.projectedRevenue.month6) * ((m - 6) / 6);
    else if (m <= 24) revenue = model.projectedRevenue.month12 + (model.projectedRevenue.month24 - model.projectedRevenue.month12) * ((m - 12) / 12);
    else revenue = model.projectedRevenue.month24 * (1 + 0.003 * (m - 24)); // 0.3%/mo growth after Y2

    revenue = Math.round(revenue);
    const expenses = monthlyFixedCosts;
    const profit = revenue - expenses;
    cumulativeProfit += profit;

    if (breakEvenMonth === -1 && cumulativeProfit >= 0) {
      breakEvenMonth = m;
    }

    monthlyProjections.push({
      month: m,
      revenue,
      expenses: Math.round(expenses),
      profit: Math.round(profit),
      cumulativeProfit: Math.round(cumulativeProfit),
      cumulativeROI: totalUpfrontCost > 0 ? Math.round((cumulativeProfit / totalUpfrontCost) * 1000) / 10 : 0,
    });
  }

  const yearOneProfit = monthlyProjections.slice(0, 12).reduce((s, p) => s + p.profit, 0) - totalUpfrontCost;
  const yearTwoProfit = monthlyProjections.slice(12, 24).reduce((s, p) => s + p.profit, 0);

  // 5-year NPV
  const annualCashFlows = [-totalUpfrontCost];
  for (let y = 1; y <= 5; y++) {
    const yearProfit = monthlyProjections.slice((y - 1) * 12, y * 12).reduce((s, p) => s + p.profit, 0);
    annualCashFlows.push(yearProfit);
  }
  const fiveYearNPV = Math.round(calculateNPV(annualCashFlows, 0.08));
  const fiveYearTotal = annualCashFlows.reduce((s, v) => s + v, 0);
  const fiveYearROI = totalUpfrontCost > 0 ? Math.round((fiveYearTotal / totalUpfrontCost) * 1000) / 10 : 0;

  const riskFactors: string[] = [];
  if (breakEvenMonth > 18) riskFactors.push('Break-even exceeds 18 months — high capital requirement');
  if (totalUpfrontCost > 200000) riskFactors.push('Significant upfront capital — consider phased investment');
  if (model.leaseTerm < breakEvenMonth) riskFactors.push('Lease term shorter than break-even — negotiate longer term');
  if (monthlyFixedCosts > model.projectedRevenue.month12 * 0.7) riskFactors.push('High fixed cost ratio — limited margin for error');

  let recommendation: string;
  if (fiveYearNPV > 100000 && breakEvenMonth <= 18) {
    recommendation = `Strong expansion opportunity. Break-even in ${breakEvenMonth} months. 5-year NPV of $${fiveYearNPV.toLocaleString()}.`;
  } else if (fiveYearNPV > 0 && breakEvenMonth <= 24) {
    recommendation = `Viable expansion with moderate risk. Break-even in ${breakEvenMonth} months. Requires disciplined execution.`;
  } else {
    recommendation = 'High-risk expansion. Consider a smaller pilot or alternative growth strategies.';
  }

  return {
    totalUpfrontCost,
    monthlyFixedCosts,
    breakEvenMonth,
    yearOneProfit: Math.round(yearOneProfit),
    yearTwoProfit: Math.round(yearTwoProfit),
    fiveYearNPV,
    fiveYearROI,
    monthlyProjections,
    riskFactors,
    recommendation,
  };
}

/**
 * Lease vs buy analysis.
 */
export function analyzeLeaseVsBuy(input: LeaseVsBuyInput): LeaseVsBuyResult {
  const {
    purchasePrice, leaseMonthlyCost, leaseTermMonths, leaseBuyoutPrice,
    maintenanceIfOwned, maintenanceIfLeased, usefulLifeYears,
    salvageValue, taxRate, discountRate,
  } = input;

  // Total cost of leasing
  const totalLeasePayments = leaseMonthlyCost * leaseTermMonths;
  const totalLeaseMaintenance = (maintenanceIfLeased / 12) * leaseTermMonths;
  const leaseTotal = totalLeasePayments + totalLeaseMaintenance + leaseBuyoutPrice;

  // Total cost of buying
  const annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears;
  const depreciationTaxSavings = annualDepreciation * taxRate * usefulLifeYears;
  const totalBuyMaintenance = maintenanceIfOwned * usefulLifeYears;
  const buyTotal = purchasePrice + totalBuyMaintenance - salvageValue - depreciationTaxSavings;

  // Present value comparison (monthly discount rate)
  const monthlyDiscount = discountRate / 12;

  // Lease PV
  let leasePV = 0;
  for (let m = 1; m <= leaseTermMonths; m++) {
    leasePV += (leaseMonthlyCost + maintenanceIfLeased / 12) / Math.pow(1 + monthlyDiscount, m);
  }
  leasePV += leaseBuyoutPrice / Math.pow(1 + monthlyDiscount, leaseTermMonths);

  // Buy PV
  let buyPV = purchasePrice;
  for (let y = 1; y <= usefulLifeYears; y++) {
    buyPV += (maintenanceIfOwned - annualDepreciation * taxRate) / Math.pow(1 + discountRate, y);
  }
  buyPV -= salvageValue / Math.pow(1 + discountRate, usefulLifeYears);

  const savings = Math.round(leasePV - buyPV); // positive = buy is cheaper
  const recommendation = savings > 0 ? 'buy' as const : 'lease' as const;

  const comparison = [
    {
      factor: 'Total Cost',
      lease: `$${Math.round(leaseTotal).toLocaleString()}`,
      buy: `$${Math.round(buyTotal).toLocaleString()}`,
    },
    {
      factor: 'Present Value',
      lease: `$${Math.round(leasePV).toLocaleString()}`,
      buy: `$${Math.round(buyPV).toLocaleString()}`,
    },
    {
      factor: 'Monthly Cost',
      lease: `$${Math.round(leaseMonthlyCost).toLocaleString()}`,
      buy: `$${Math.round(purchasePrice / (usefulLifeYears * 12) + maintenanceIfOwned / 12).toLocaleString()}`,
    },
    {
      factor: 'Tax Benefits',
      lease: 'Deduct lease payments',
      buy: `Depreciation saves $${Math.round(depreciationTaxSavings).toLocaleString()}`,
    },
    {
      factor: 'Flexibility',
      lease: 'Upgrade at end of term',
      buy: 'Ownership + salvage value',
    },
    {
      factor: 'Cash Required',
      lease: `$${Math.round(leaseMonthlyCost).toLocaleString()}/mo`,
      buy: `$${Math.round(purchasePrice).toLocaleString()} upfront`,
    },
  ];

  const reasoning = recommendation === 'buy'
    ? `Buying saves $${Math.abs(savings).toLocaleString()} in present value over the asset's life. The depreciation tax benefit and salvage value make ownership more economical.`
    : `Leasing saves $${Math.abs(savings).toLocaleString()} in present value. Lower upfront cash requirement and flexibility to upgrade make leasing the better choice.`;

  return {
    leaseTotal: Math.round(leaseTotal),
    buyTotal: Math.round(buyTotal),
    leasePV: Math.round(leasePV),
    buyPV: Math.round(buyPV),
    savings,
    recommendation,
    reasoning,
    comparison,
  };
}
