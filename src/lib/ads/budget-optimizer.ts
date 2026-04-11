/**
 * Ads War Machine — Budget Optimizer Engine
 *
 * Optimizes ad spend across channels, services, and time periods:
 * - Daily budget pacing
 * - Channel allocation (Meta vs Google)
 * - Service-level budget allocation by margin
 * - Dayparting recommendations
 * - Seasonal budget adjustments
 * - Diminishing returns detection
 * - Budget scenario modeling
 * - Waste elimination
 * - CAC targets per service
 * - LTV:CAC ratio monitoring
 */

// ── TYPES ──

export interface BudgetConfig {
  totalMonthlyBudget: number;
  metaAllocation: number; // percentage 0-100
  googleAllocation: number; // percentage 0-100
  startDate: string;
  endDate: string;
}

export interface DailySpendData {
  date: string;
  channel: 'meta' | 'google';
  spent: number;
  budget: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface ServiceBudgetData {
  serviceId: string;
  serviceName: string;
  monthlySpend: number;
  revenue: number;
  leads: number;
  conversions: number;
  avgBookingValue: number;
  costPerLead: number;
  costPerConversion: number;
  roas: number;
  profitMargin: number; // percentage
  ltv: number; // lifetime value
}

export interface BudgetOptimizationResult {
  pacing: BudgetPacing;
  channelAllocation: ChannelAllocation;
  serviceAllocation: ServiceAllocation[];
  dayparting: DaypartingRecommendation[];
  seasonalAdjustments: SeasonalAdjustment[];
  diminishingReturns: DiminishingReturnsAlert[];
  scenarios: BudgetScenario[];
  wasteReport: WasteReport;
  cacTargets: CACTarget[];
  ltvCacRatios: LTVCACRatio[];
  overallScore: number; // 0-100
  recommendations: BudgetRecommendation[];
}

export interface BudgetPacing {
  dailyBudget: number;
  dailySpent: number;
  pacingRate: number; // percentage — 100 = on track
  daysElapsed: number;
  daysRemaining: number;
  projectedMonthEnd: number;
  budgetRemaining: number;
  status: 'under_pacing' | 'on_track' | 'over_pacing';
  recommendation: string;
}

export interface ChannelAllocation {
  meta: { budget: number; spent: number; roas: number; cpl: number; cpa: number; score: number };
  google: { budget: number; spent: number; roas: number; cpl: number; cpa: number; score: number };
  recommendation: string;
  suggestedSplit: { meta: number; google: number };
}

export interface ServiceAllocation {
  serviceId: string;
  serviceName: string;
  currentBudget: number;
  recommendedBudget: number;
  changePercent: number;
  reason: string;
  priority: 'increase' | 'maintain' | 'decrease' | 'pause';
  expectedROAS: number;
}

export interface DaypartingRecommendation {
  dayOfWeek: number; // 0=Sun, 6=Sat
  dayName: string;
  hours: { hour: number; multiplier: number; reason: string }[];
  peakHours: number[];
  lowHours: number[];
}

export interface SeasonalAdjustment {
  month: number;
  monthName: string;
  budgetMultiplier: number;
  reason: string;
  topServices: string[];
}

export interface DiminishingReturnsAlert {
  channel: 'meta' | 'google';
  serviceId?: string;
  currentSpend: number;
  optimalSpend: number;
  currentROAS: number;
  projectedROASAtOptimal: number;
  severity: 'warning' | 'critical';
  recommendation: string;
}

export interface BudgetScenario {
  label: string;
  dailyBudget: number;
  monthlyBudget: number;
  projectedLeads: number;
  projectedConversions: number;
  projectedRevenue: number;
  projectedROAS: number;
  projectedCPL: number;
  projectedCPA: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface WasteReport {
  totalWaste: number;
  wastePercent: number;
  underperformers: WasteItem[];
  totalRecoverable: number;
  recommendations: string[];
}

export interface WasteItem {
  type: 'campaign' | 'adset' | 'ad' | 'keyword';
  id: string;
  name: string;
  spent: number;
  returns: number;
  roas: number;
  action: 'pause' | 'reduce' | 'restructure';
  savingsEstimate: number;
}

export interface CACTarget {
  serviceId: string;
  serviceName: string;
  targetCAC: number;
  currentCAC: number;
  status: 'below_target' | 'on_target' | 'above_target' | 'critical';
  maxAcceptableCAC: number;
}

export interface LTVCACRatio {
  serviceId: string;
  serviceName: string;
  ltv: number;
  cac: number;
  ratio: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsustainable';
  benchmark: number; // target ratio
}

export interface BudgetRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'reallocate' | 'increase' | 'decrease' | 'pause' | 'test';
  description: string;
  expectedImpact: string;
  estimatedSavings?: number;
  estimatedGain?: number;
}

// ── SERVICE CAC TARGETS ──

const SERVICE_CAC_TARGETS: Record<string, { target: number; max: number; ltv: number }> = {
  botox: { target: 50, max: 80, ltv: 1200 },
  fillers: { target: 80, max: 120, ltv: 2400 },
  sofwave: { target: 200, max: 350, ltv: 5000 },
  hydrafacial: { target: 40, max: 65, ltv: 1800 },
  prx: { target: 60, max: 90, ltv: 1500 },
  vi_peel: { target: 50, max: 80, ltv: 1200 },
  picoway: { target: 70, max: 110, ltv: 2000 },
  rf_microneedling: { target: 80, max: 120, ltv: 2500 },
  laser_hair: { target: 100, max: 150, ltv: 3000 },
  glp1: { target: 60, max: 100, ltv: 4800 },
  wellness_injections: { target: 25, max: 40, ltv: 600 },
  rx_skincare: { target: 30, max: 50, ltv: 1200 },
  folix: { target: 80, max: 130, ltv: 2500 },
  memberships: { target: 50, max: 80, ltv: 4000 },
  consultation: { target: 20, max: 35, ltv: 2000 },
};

// ── SEASONAL MULTIPLIERS ──

const SEASONAL_MULTIPLIERS: SeasonalAdjustment[] = [
  { month: 1, monthName: 'January', budgetMultiplier: 0.85, reason: 'Post-holiday slowdown, reduced consumer spending', topServices: ['glp1', 'memberships', 'rx_skincare'] },
  { month: 2, monthName: 'February', budgetMultiplier: 1.15, reason: 'Valentine\'s pre-event demand, self-care push', topServices: ['botox', 'fillers', 'hydrafacial'] },
  { month: 3, monthName: 'March', budgetMultiplier: 1.10, reason: 'Spring refresh season begins', topServices: ['vi_peel', 'hydrafacial', 'laser_hair'] },
  { month: 4, monthName: 'April', budgetMultiplier: 1.15, reason: 'Spring events, wedding season starts', topServices: ['botox', 'fillers', 'sofwave'] },
  { month: 5, monthName: 'May', budgetMultiplier: 1.20, reason: 'Mother\'s Day + summer prep peak', topServices: ['hydrafacial', 'laser_hair', 'fillers'] },
  { month: 6, monthName: 'June', budgetMultiplier: 1.15, reason: 'Summer body prep, wedding season peak', topServices: ['laser_hair', 'glp1', 'hydrafacial'] },
  { month: 7, monthName: 'July', budgetMultiplier: 1.00, reason: 'Summer plateau — vacation spend competing', topServices: ['wellness_injections', 'hydrafacial'] },
  { month: 8, monthName: 'August', budgetMultiplier: 1.05, reason: 'Back-to-school refresh, early fall prep', topServices: ['hydrafacial', 'vi_peel', 'rx_skincare'] },
  { month: 9, monthName: 'September', budgetMultiplier: 1.15, reason: 'Fall refresh season — strong demand', topServices: ['sofwave', 'rf_microneedling', 'picoway'] },
  { month: 10, monthName: 'October', budgetMultiplier: 1.20, reason: 'Pre-holiday treatment season begins', topServices: ['sofwave', 'fillers', 'botox'] },
  { month: 11, monthName: 'November', budgetMultiplier: 1.25, reason: 'Holiday party prep + Black Friday gift cards', topServices: ['botox', 'fillers', 'memberships'] },
  { month: 12, monthName: 'December', budgetMultiplier: 1.10, reason: 'Gift cards + holiday events, drops late month', topServices: ['memberships', 'hydrafacial', 'wellness_injections'] },
];

// ── DAYPARTING DATA ──

const DAYPARTING_BASELINE: Record<number, { peakHours: number[]; lowHours: number[] }> = {
  0: { peakHours: [10, 11, 14, 15, 19, 20], lowHours: [0, 1, 2, 3, 4, 5, 6] }, // Sunday
  1: { peakHours: [8, 9, 12, 13, 18, 19], lowHours: [0, 1, 2, 3, 4, 5, 23] }, // Monday
  2: { peakHours: [8, 9, 12, 13, 18, 19], lowHours: [0, 1, 2, 3, 4, 5, 23] }, // Tuesday
  3: { peakHours: [8, 9, 12, 13, 18, 19], lowHours: [0, 1, 2, 3, 4, 5, 23] }, // Wednesday
  4: { peakHours: [8, 9, 12, 13, 17, 18], lowHours: [0, 1, 2, 3, 4, 5, 23] }, // Thursday
  5: { peakHours: [9, 10, 12, 13, 16, 17], lowHours: [0, 1, 2, 3, 4, 5, 23] }, // Friday
  6: { peakHours: [10, 11, 14, 15, 18, 19], lowHours: [0, 1, 2, 3, 4, 5, 6] }, // Saturday
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── CORE OPTIMIZER ──

/**
 * Run full budget optimization analysis
 */
export function optimizeBudget(config: {
  budget: BudgetConfig;
  dailySpend: DailySpendData[];
  serviceData: ServiceBudgetData[];
}): BudgetOptimizationResult {
  const { budget, dailySpend, serviceData } = config;

  const pacing = calculatePacing(budget, dailySpend);
  const channelAllocation = calculateChannelAllocation(budget, dailySpend);
  const serviceAllocation = calculateServiceAllocation(serviceData, budget.totalMonthlyBudget);
  const dayparting = calculateDayparting(dailySpend);
  const seasonalAdjustments = getSeasonalAdjustments();
  const diminishingReturns = detectDiminishingReturns(dailySpend, serviceData);
  const scenarios = modelBudgetScenarios(dailySpend, serviceData);
  const wasteReport = detectWaste(dailySpend, serviceData);
  const cacTargets = calculateCACTargets(serviceData);
  const ltvCacRatios = calculateLTVCACRatios(serviceData);

  const recommendations = generateBudgetRecommendations({
    pacing, channelAllocation, serviceAllocation, diminishingReturns, wasteReport, cacTargets, ltvCacRatios,
  });

  // Overall budget health score
  const overallScore = calculateBudgetScore({
    pacing, channelAllocation, wasteReport, cacTargets, ltvCacRatios,
  });

  return {
    pacing,
    channelAllocation,
    serviceAllocation,
    dayparting,
    seasonalAdjustments,
    diminishingReturns,
    scenarios,
    wasteReport,
    cacTargets,
    ltvCacRatios,
    overallScore,
    recommendations,
  };
}

// ── PACING ──

export function calculatePacing(budget: BudgetConfig, dailySpend: DailySpendData[]): BudgetPacing {
  const now = new Date();
  const start = new Date(budget.startDate);
  const end = new Date(budget.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const dailyBudget = budget.totalMonthlyBudget / totalDays;
  const totalSpent = dailySpend.reduce((sum, d) => sum + d.spent, 0);
  const expectedSpent = dailyBudget * daysElapsed;
  const pacingRate = expectedSpent > 0 ? (totalSpent / expectedSpent) * 100 : 0;
  const projectedMonthEnd = daysElapsed > 0 ? (totalSpent / daysElapsed) * totalDays : 0;
  const dailySpentAvg = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

  let status: BudgetPacing['status'];
  let recommendation: string;

  if (pacingRate < 85) {
    status = 'under_pacing';
    recommendation = `Spending ${Math.round(100 - pacingRate)}% below target. Increase daily budgets or expand targeting to capture available demand.`;
  } else if (pacingRate > 115) {
    status = 'over_pacing';
    recommendation = `Spending ${Math.round(pacingRate - 100)}% above target. Consider reducing bids or narrowing targeting to stay within budget.`;
  } else {
    status = 'on_track';
    recommendation = 'Budget pacing is healthy. Continue monitoring daily.';
  }

  return {
    dailyBudget: Math.round(dailyBudget * 100) / 100,
    dailySpent: Math.round(dailySpentAvg * 100) / 100,
    pacingRate: Math.round(pacingRate),
    daysElapsed,
    daysRemaining,
    projectedMonthEnd: Math.round(projectedMonthEnd * 100) / 100,
    budgetRemaining: Math.round((budget.totalMonthlyBudget - totalSpent) * 100) / 100,
    status,
    recommendation,
  };
}

// ── CHANNEL ALLOCATION ──

export function calculateChannelAllocation(budget: BudgetConfig, dailySpend: DailySpendData[]): ChannelAllocation {
  const metaSpend = dailySpend.filter(d => d.channel === 'meta');
  const googleSpend = dailySpend.filter(d => d.channel === 'google');

  const metaMetrics = aggregateMetrics(metaSpend);
  const googleMetrics = aggregateMetrics(googleSpend);

  const metaBudget = budget.totalMonthlyBudget * (budget.metaAllocation / 100);
  const googleBudget = budget.totalMonthlyBudget * (budget.googleAllocation / 100);

  const metaScore = scoreChannel(metaMetrics);
  const googleScore = scoreChannel(googleMetrics);
  const totalScore = metaScore + googleScore || 1;

  const suggestedMetaPct = Math.round((metaScore / totalScore) * 100);
  const suggestedGooglePct = 100 - suggestedMetaPct;

  let recommendation: string;
  if (Math.abs(suggestedMetaPct - budget.metaAllocation) > 15) {
    const winner = suggestedMetaPct > budget.metaAllocation ? 'Meta' : 'Google';
    recommendation = `${winner} is significantly outperforming. Consider shifting ${Math.abs(suggestedMetaPct - budget.metaAllocation)}% of budget toward ${winner}.`;
  } else {
    recommendation = 'Channel allocation is well-balanced based on current performance.';
  }

  return {
    meta: {
      budget: metaBudget,
      spent: metaMetrics.spent,
      roas: metaMetrics.roas,
      cpl: metaMetrics.cpl,
      cpa: metaMetrics.cpa,
      score: metaScore,
    },
    google: {
      budget: googleBudget,
      spent: googleMetrics.spent,
      roas: googleMetrics.roas,
      cpl: googleMetrics.cpl,
      cpa: googleMetrics.cpa,
      score: googleScore,
    },
    recommendation,
    suggestedSplit: { meta: suggestedMetaPct, google: suggestedGooglePct },
  };
}

// ── SERVICE ALLOCATION ──

export function calculateServiceAllocation(
  serviceData: ServiceBudgetData[],
  totalBudget: number
): ServiceAllocation[] {
  if (serviceData.length === 0) return [];

  // Score each service by ROAS-weighted margin efficiency
  const scored = serviceData.map(s => {
    const marginScore = s.profitMargin / 100;
    const roasScore = Math.min(s.roas / 5, 1); // Cap at 5x ROAS
    const ltvScore = Math.min(s.ltv / 5000, 1);
    const efficiencyScore = (marginScore * 0.3 + roasScore * 0.4 + ltvScore * 0.3);
    return { ...s, efficiencyScore };
  });

  scored.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  const totalEfficiency = scored.reduce((sum, s) => sum + s.efficiencyScore, 0) || 1;

  return scored.map(s => {
    const idealBudget = (s.efficiencyScore / totalEfficiency) * totalBudget;
    const changePercent = s.monthlySpend > 0 ? ((idealBudget - s.monthlySpend) / s.monthlySpend) * 100 : 100;

    let priority: ServiceAllocation['priority'];
    let reason: string;

    if (s.roas < 1) {
      priority = 'pause';
      reason = `ROAS below 1.0 (${s.roas.toFixed(1)}x) — losing money on this service's ads`;
    } else if (changePercent > 25) {
      priority = 'increase';
      reason = `High efficiency (${s.roas.toFixed(1)}x ROAS, ${s.profitMargin}% margin) — scale for more returns`;
    } else if (changePercent < -25) {
      priority = 'decrease';
      reason = `Below-average efficiency — reallocate to better performers`;
    } else {
      priority = 'maintain';
      reason = 'Performing at expected levels';
    }

    return {
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      currentBudget: s.monthlySpend,
      recommendedBudget: Math.round(idealBudget * 100) / 100,
      changePercent: Math.round(changePercent),
      reason,
      priority,
      expectedROAS: s.roas,
    };
  });
}

// ── DAYPARTING ──

export function calculateDayparting(dailySpend: DailySpendData[]): DaypartingRecommendation[] {
  return Array.from({ length: 7 }, (_, day) => {
    const baseline = DAYPARTING_BASELINE[day];
    const hours = Array.from({ length: 24 }, (_, hour) => {
      const isPeak = baseline.peakHours.includes(hour);
      const isLow = baseline.lowHours.includes(hour);
      const multiplier = isPeak ? 1.3 : isLow ? 0.5 : 1.0;
      const reason = isPeak
        ? 'Peak engagement and booking hours'
        : isLow
        ? 'Low activity — reduce spend'
        : 'Standard bidding';
      return { hour, multiplier, reason };
    });

    return {
      dayOfWeek: day,
      dayName: DAY_NAMES[day],
      hours,
      peakHours: baseline.peakHours,
      lowHours: baseline.lowHours,
    };
  });
}

// ── SEASONAL ──

export function getSeasonalAdjustments(): SeasonalAdjustment[] {
  return SEASONAL_MULTIPLIERS;
}

export function getCurrentSeasonalMultiplier(): number {
  const month = new Date().getMonth() + 1;
  return SEASONAL_MULTIPLIERS.find(s => s.month === month)?.budgetMultiplier || 1.0;
}

// ── DIMINISHING RETURNS ──

export function detectDiminishingReturns(
  dailySpend: DailySpendData[],
  serviceData: ServiceBudgetData[]
): DiminishingReturnsAlert[] {
  const alerts: DiminishingReturnsAlert[] = [];

  // Check each channel
  for (const channel of ['meta', 'google'] as const) {
    const channelData = dailySpend.filter(d => d.channel === channel);
    if (channelData.length < 7) continue;

    // Sort by date, check if ROAS is declining as spend increases
    const sorted = [...channelData].sort((a, b) => a.date.localeCompare(b.date));
    const recentHalf = sorted.slice(Math.floor(sorted.length / 2));
    const olderHalf = sorted.slice(0, Math.floor(sorted.length / 2));

    const recentAvgSpend = avg(recentHalf.map(d => d.spent));
    const olderAvgSpend = avg(olderHalf.map(d => d.spent));
    const recentROAS = safeROAS(recentHalf);
    const olderROAS = safeROAS(olderHalf);

    if (recentAvgSpend > olderAvgSpend * 1.2 && recentROAS < olderROAS * 0.8) {
      alerts.push({
        channel,
        currentSpend: recentAvgSpend,
        optimalSpend: olderAvgSpend,
        currentROAS: recentROAS,
        projectedROASAtOptimal: olderROAS,
        severity: recentROAS < olderROAS * 0.6 ? 'critical' : 'warning',
        recommendation: `${channel} showing diminishing returns. ROAS dropped ${Math.round((1 - recentROAS / olderROAS) * 100)}% as spend increased. Consider pulling back to $${Math.round(olderAvgSpend)}/day.`,
      });
    }
  }

  // Service-level
  for (const service of serviceData) {
    const targets = SERVICE_CAC_TARGETS[service.serviceId];
    if (!targets) continue;

    if (service.costPerConversion > targets.max) {
      alerts.push({
        channel: 'meta',
        serviceId: service.serviceId,
        currentSpend: service.monthlySpend,
        optimalSpend: service.monthlySpend * 0.7,
        currentROAS: service.roas,
        projectedROASAtOptimal: service.roas * 1.3,
        severity: 'warning',
        recommendation: `${service.serviceName} CAC ($${Math.round(service.costPerConversion)}) exceeds max target ($${targets.max}). Reduce spend 30% and optimize targeting.`,
      });
    }
  }

  return alerts;
}

// ── SCENARIO MODELING ──

export function modelBudgetScenarios(
  dailySpend: DailySpendData[],
  serviceData: ServiceBudgetData[]
): BudgetScenario[] {
  const metrics = aggregateMetrics(dailySpend);
  const currentDaily = metrics.spent / Math.max(dailySpend.length, 1);

  const baseLeadsPerDollar = metrics.leads / Math.max(metrics.spent, 1);
  const baseConversionsPerDollar = metrics.conversions / Math.max(metrics.spent, 1);
  const baseRevenuePerDollar = metrics.revenue / Math.max(metrics.spent, 1);

  const budgetLevels = [50, 100, 150, 200, 300, 500];

  return budgetLevels.map(daily => {
    const monthly = daily * 30;
    // Apply diminishing returns curve: efficiency drops as spend increases beyond current
    const scaleFactor = daily <= currentDaily
      ? 1.0
      : 1.0 - Math.log(daily / Math.max(currentDaily, 1)) * 0.1;
    const adjustedFactor = Math.max(0.5, scaleFactor);

    const projectedLeads = Math.round(monthly * baseLeadsPerDollar * adjustedFactor);
    const projectedConversions = Math.round(monthly * baseConversionsPerDollar * adjustedFactor);
    const projectedRevenue = Math.round(monthly * baseRevenuePerDollar * adjustedFactor);
    const projectedROAS = monthly > 0 ? projectedRevenue / monthly : 0;
    const projectedCPL = projectedLeads > 0 ? monthly / projectedLeads : 0;
    const projectedCPA = projectedConversions > 0 ? monthly / projectedConversions : 0;

    const confidence = daily <= currentDaily * 1.5 ? 'high' : daily <= currentDaily * 3 ? 'medium' : 'low';

    return {
      label: `$${daily}/day`,
      dailyBudget: daily,
      monthlyBudget: monthly,
      projectedLeads,
      projectedConversions,
      projectedRevenue,
      projectedROAS: Math.round(projectedROAS * 100) / 100,
      projectedCPL: Math.round(projectedCPL * 100) / 100,
      projectedCPA: Math.round(projectedCPA * 100) / 100,
      confidence,
    };
  });
}

// ── WASTE DETECTION ──

export function detectWaste(
  dailySpend: DailySpendData[],
  serviceData: ServiceBudgetData[]
): WasteReport {
  const underperformers: WasteItem[] = [];

  // Services with ROAS < 1.5 are wasting budget
  for (const service of serviceData) {
    if (service.roas < 1.0 && service.monthlySpend > 50) {
      underperformers.push({
        type: 'campaign',
        id: service.serviceId,
        name: `${service.serviceName} campaigns`,
        spent: service.monthlySpend,
        returns: service.revenue,
        roas: service.roas,
        action: 'pause',
        savingsEstimate: service.monthlySpend,
      });
    } else if (service.roas < 1.5 && service.monthlySpend > 100) {
      underperformers.push({
        type: 'campaign',
        id: service.serviceId,
        name: `${service.serviceName} campaigns`,
        spent: service.monthlySpend,
        returns: service.revenue,
        roas: service.roas,
        action: 'reduce',
        savingsEstimate: service.monthlySpend * 0.3,
      });
    }
  }

  const totalWaste = underperformers.reduce((sum, u) => sum + u.savingsEstimate, 0);
  const totalSpent = serviceData.reduce((sum, s) => sum + s.monthlySpend, 0);
  const wastePercent = totalSpent > 0 ? (totalWaste / totalSpent) * 100 : 0;

  const recommendations: string[] = [];
  if (wastePercent > 20) {
    recommendations.push('Over 20% of budget is underperforming. Immediate reallocation recommended.');
  }
  if (underperformers.some(u => u.action === 'pause')) {
    recommendations.push('Pause all campaigns with ROAS below 1.0 and redirect budget to top performers.');
  }
  recommendations.push('Review underperforming campaigns weekly to prevent budget waste.');

  return {
    totalWaste: Math.round(totalWaste),
    wastePercent: Math.round(wastePercent),
    underperformers,
    totalRecoverable: Math.round(totalWaste),
    recommendations,
  };
}

// ── CAC TARGETS ──

export function calculateCACTargets(serviceData: ServiceBudgetData[]): CACTarget[] {
  return serviceData.map(s => {
    const targets = SERVICE_CAC_TARGETS[s.serviceId] || { target: 75, max: 120, ltv: 2000 };
    const currentCAC = s.costPerConversion || 0;

    let status: CACTarget['status'];
    if (currentCAC === 0) status = 'below_target';
    else if (currentCAC <= targets.target) status = 'below_target';
    else if (currentCAC <= targets.max) status = 'on_target';
    else if (currentCAC <= targets.max * 1.5) status = 'above_target';
    else status = 'critical';

    return {
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      targetCAC: targets.target,
      currentCAC: Math.round(currentCAC),
      status,
      maxAcceptableCAC: targets.max,
    };
  });
}

// ── LTV:CAC RATIOS ──

export function calculateLTVCACRatios(serviceData: ServiceBudgetData[]): LTVCACRatio[] {
  return serviceData.map(s => {
    const targets = SERVICE_CAC_TARGETS[s.serviceId] || { target: 75, max: 120, ltv: 2000 };
    const cac = s.costPerConversion || 1;
    const ltv = s.ltv || targets.ltv;
    const ratio = ltv / cac;
    const benchmark = 3.0; // Industry standard: 3:1 LTV:CAC

    let status: LTVCACRatio['status'];
    if (ratio >= 5) status = 'excellent';
    else if (ratio >= 3) status = 'good';
    else if (ratio >= 2) status = 'acceptable';
    else if (ratio >= 1) status = 'poor';
    else status = 'unsustainable';

    return {
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      ltv: Math.round(ltv),
      cac: Math.round(cac),
      ratio: Math.round(ratio * 10) / 10,
      status,
      benchmark,
    };
  });
}

// ── RECOMMENDATION ENGINE ──

function generateBudgetRecommendations(data: {
  pacing: BudgetPacing;
  channelAllocation: ChannelAllocation;
  serviceAllocation: ServiceAllocation[];
  diminishingReturns: DiminishingReturnsAlert[];
  wasteReport: WasteReport;
  cacTargets: CACTarget[];
  ltvCacRatios: LTVCACRatio[];
}): BudgetRecommendation[] {
  const recs: BudgetRecommendation[] = [];

  // Pacing recommendations
  if (data.pacing.status === 'under_pacing') {
    recs.push({
      priority: 'high',
      type: 'increase',
      description: `Budget under-pacing by ${100 - data.pacing.pacingRate}%. Increase daily spend to fully utilize allocated budget.`,
      expectedImpact: `Capture ${Math.round((100 - data.pacing.pacingRate) / 100 * data.pacing.dailyBudget * 30)} in missed opportunity`,
    });
  }

  // Channel reallocation
  const splitDiff = Math.abs(data.channelAllocation.suggestedSplit.meta - (data.channelAllocation.meta.budget / (data.channelAllocation.meta.budget + data.channelAllocation.google.budget) * 100));
  if (splitDiff > 15) {
    recs.push({
      priority: 'medium',
      type: 'reallocate',
      description: `Shift budget toward ${data.channelAllocation.suggestedSplit.meta > 50 ? 'Meta' : 'Google'} — currently outperforming by ${Math.round(splitDiff)}%.`,
      expectedImpact: 'Improved overall ROAS through optimal channel mix',
    });
  }

  // Waste elimination
  if (data.wasteReport.totalWaste > 100) {
    recs.push({
      priority: 'high',
      type: 'pause',
      description: `$${data.wasteReport.totalWaste}/mo wasted on underperforming campaigns. Pause or restructure immediately.`,
      expectedImpact: `Recover $${data.wasteReport.totalRecoverable}/mo for better-performing campaigns`,
      estimatedSavings: data.wasteReport.totalWaste,
    });
  }

  // Service scaling
  const scaleUp = data.serviceAllocation.filter(s => s.priority === 'increase');
  if (scaleUp.length > 0) {
    recs.push({
      priority: 'medium',
      type: 'increase',
      description: `Scale budget for ${scaleUp.map(s => s.serviceName).join(', ')} — high-efficiency services with room to grow.`,
      expectedImpact: `Estimated ${Math.round(scaleUp.reduce((sum, s) => sum + s.expectedROAS, 0) / scaleUp.length * 10) / 10}x ROAS on increased spend`,
    });
  }

  // Diminishing returns
  for (const alert of data.diminishingReturns) {
    recs.push({
      priority: alert.severity === 'critical' ? 'high' : 'medium',
      type: 'decrease',
      description: alert.recommendation,
      expectedImpact: `Improve ROAS from ${alert.currentROAS.toFixed(1)}x to ~${alert.projectedROASAtOptimal.toFixed(1)}x`,
      estimatedSavings: Math.round(alert.currentSpend - alert.optimalSpend),
    });
  }

  // CAC alerts
  const criticalCAC = data.cacTargets.filter(c => c.status === 'critical');
  if (criticalCAC.length > 0) {
    recs.push({
      priority: 'high',
      type: 'decrease',
      description: `Critical CAC alert: ${criticalCAC.map(c => `${c.serviceName} ($${c.currentCAC} vs $${c.maxAcceptableCAC} max)`).join(', ')}`,
      expectedImpact: 'Bring acquisition costs within sustainable range',
    });
  }

  return recs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── SCORING ──

function calculateBudgetScore(data: {
  pacing: BudgetPacing;
  channelAllocation: ChannelAllocation;
  wasteReport: WasteReport;
  cacTargets: CACTarget[];
  ltvCacRatios: LTVCACRatio[];
}): number {
  let score = 100;

  // Pacing penalty
  if (data.pacing.status !== 'on_track') {
    score -= Math.min(20, Math.abs(100 - data.pacing.pacingRate) * 0.3);
  }

  // Waste penalty
  score -= Math.min(25, data.wasteReport.wastePercent * 0.5);

  // CAC penalty
  const criticalCount = data.cacTargets.filter(c => c.status === 'critical').length;
  const aboveCount = data.cacTargets.filter(c => c.status === 'above_target').length;
  score -= criticalCount * 8 + aboveCount * 3;

  // LTV:CAC bonus/penalty
  const avgRatio = data.ltvCacRatios.reduce((sum, r) => sum + r.ratio, 0) / Math.max(data.ltvCacRatios.length, 1);
  if (avgRatio >= 3) score += 5;
  if (avgRatio < 2) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── HELPERS ──

function aggregateMetrics(data: DailySpendData[]): { spent: number; revenue: number; leads: number; conversions: number; roas: number; cpl: number; cpa: number } {
  const spent = data.reduce((s, d) => s + d.spent, 0);
  const revenue = data.reduce((s, d) => s + d.revenue, 0);
  const leads = data.reduce((s, d) => s + d.leads, 0);
  const conversions = data.reduce((s, d) => s + d.conversions, 0);
  return {
    spent,
    revenue,
    leads,
    conversions,
    roas: spent > 0 ? revenue / spent : 0,
    cpl: leads > 0 ? spent / leads : 0,
    cpa: conversions > 0 ? spent / conversions : 0,
  };
}

function scoreChannel(metrics: ReturnType<typeof aggregateMetrics>): number {
  if (metrics.spent === 0) return 50;
  const roasScore = Math.min(metrics.roas / 5, 1) * 40;
  const cplScore = Math.max(0, 1 - metrics.cpl / 100) * 30;
  const volumeScore = Math.min(metrics.conversions / 50, 1) * 30;
  return Math.round(roasScore + cplScore + volumeScore);
}

function avg(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

function safeROAS(data: DailySpendData[]): number {
  const spent = data.reduce((s, d) => s + d.spent, 0);
  const revenue = data.reduce((s, d) => s + d.revenue, 0);
  return spent > 0 ? revenue / spent : 0;
}
