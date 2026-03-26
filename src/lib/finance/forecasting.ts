/**
 * Revenue Forecasting Engine
 *
 * Time series decomposition, seasonal adjustment, provider-level projections,
 * scenario planning, and break-even analysis for Rani Beauty Clinic.
 *
 * All monetary values in USD. Periods are calendar months.
 */

// ── TYPES ──

export interface MonthlyDataPoint {
  month: string; // YYYY-MM
  revenue: number;
  bookings: number;
  newClients: number;
  avgTicket: number;
}

export interface ProviderDataPoint {
  provider: string;
  month: string;
  revenue: number;
  bookings: number;
  hoursWorked: number;
}

export interface ServiceCategoryDataPoint {
  category: string;
  month: string;
  revenue: number;
  bookings: number;
}

export interface ForecastInput {
  historicalData: MonthlyDataPoint[];
  providerData?: ProviderDataPoint[];
  serviceCategoryData?: ServiceCategoryDataPoint[];
  currentMonthPartial?: { revenue: number; daysElapsed: number; daysInMonth: number };
}

export interface ForecastResult {
  projections: MonthlyProjection[];
  trend: TrendAnalysis;
  seasonality: SeasonalFactors;
  providerForecasts: ProviderForecast[];
  categoryForecasts: CategoryForecast[];
  confidenceIntervals: ConfidenceInterval[];
  decomposition: TimeSeriesDecomposition[];
}

export interface MonthlyProjection {
  month: string;
  expected: number;
  optimistic: number;
  conservative: number;
  growthRate: number;
  seasonalFactor: number;
}

export interface TrendAnalysis {
  slope: number; // monthly revenue change
  intercept: number;
  rSquared: number;
  direction: 'growing' | 'declining' | 'stable';
  monthlyGrowthRate: number;
  annualizedGrowthRate: number;
}

export interface SeasonalFactors {
  /** 1.0 = average month; 1.15 = 15% above average; 0.85 = 15% below */
  byMonth: Record<number, number>;
  peakMonth: number;
  troughMonth: number;
  seasonalStrength: number; // 0-1, how much seasonality matters
}

export interface ProviderForecast {
  provider: string;
  projectedMonthlyRevenue: number;
  projectedBookings: number;
  revenuePerHour: number;
  growthRate: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface CategoryForecast {
  category: string;
  projectedMonthlyRevenue: number;
  growthRate: number;
  shareOfTotal: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface ConfidenceInterval {
  month: string;
  p10: number; // 10th percentile (pessimistic)
  p25: number;
  p50: number; // median
  p75: number;
  p90: number; // 90th percentile (optimistic)
}

export interface TimeSeriesDecomposition {
  month: string;
  observed: number;
  trend: number;
  seasonal: number;
  residual: number;
}

// ── SCENARIO PLANNING ──

export type ScenarioType =
  | 'add_provider'
  | 'remove_provider'
  | 'add_service'
  | 'price_increase'
  | 'price_decrease'
  | 'marketing_spend'
  | 'expand_hours';

export interface ScenarioInput {
  type: ScenarioType;
  params: Record<string, number | string>;
}

export interface ScenarioResult {
  type: ScenarioType;
  label: string;
  baselineRevenue: number;
  projectedRevenue: number;
  incrementalRevenue: number;
  incrementalProfit: number;
  roi: number;
  paybackMonths: number;
  monthlyProjections: { month: string; baseline: number; scenario: number }[];
}

// ── BREAK-EVEN ──

export interface BreakEvenInput {
  fixedCosts: number; // monthly
  variableCostPerUnit: number;
  pricePerUnit: number;
  monthlyOverhead?: number;
}

export interface BreakEvenResult {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  monthsToBreakEven: number;
  safetyMargin: number; // % above break-even at current volume
}

// ── SEASONAL ADJUSTMENT FACTORS ──
// Med spa seasonality based on industry patterns

const DEFAULT_SEASONAL_FACTORS: Record<number, number> = {
  1: 0.82, // January: post-holiday slowdown, New Year detox
  2: 0.88, // February: Valentine's self-care bump
  3: 0.95, // March: spring prep begins
  4: 1.05, // April: wedding/event season prep
  5: 1.10, // May: pre-summer treatments
  6: 1.08, // June: laser season, body treatments
  7: 0.95, // July: summer slowdown (vacations)
  8: 0.92, // August: back-to-school, low bookings
  9: 1.05, // September: fall refresh, back-to-routine
  10: 1.10, // October: pre-holiday prep begins
  11: 1.12, // November: holiday packages, gift cards
  12: 0.98, // December: holiday rush early, then slowdown
};

// ── CORE FUNCTIONS ──

/**
 * Calculate linear regression on an array of (x, y) points.
 */
export function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, rSquared: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const p of points) {
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - (slope * p.x + intercept)) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, rSquared };
}

/**
 * Simple Moving Average over the last `window` data points.
 */
export function movingAverage(data: number[], window: number): number[] {
  if (window <= 0 || data.length === 0) return [];
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return result;
}

/**
 * Exponential smoothing (single, Holt-Winters style).
 */
export function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

/**
 * Double exponential smoothing (Holt's method) for trend extraction.
 */
export function doubleExponentialSmoothing(
  data: number[],
  alpha: number = 0.3,
  beta: number = 0.1,
): { level: number[]; trend: number[]; forecast: number[] } {
  if (data.length < 2) {
    return { level: [...data], trend: [0], forecast: [...data] };
  }

  const level: number[] = [data[0]];
  const trend: number[] = [data[1] - data[0]];
  const forecast: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
    level.push(newLevel);
    trend.push(newTrend);
    forecast.push(newLevel + newTrend);
  }

  return { level, trend, forecast };
}

/**
 * Decompose a time series into trend, seasonal, and residual components.
 */
export function decomposeTimeSeries(
  data: MonthlyDataPoint[],
  customSeasonalFactors?: Record<number, number>,
): TimeSeriesDecomposition[] {
  const revenues = data.map(d => d.revenue);
  const seasonalFactors = customSeasonalFactors || DEFAULT_SEASONAL_FACTORS;

  // Trend via 3-month moving average (or smaller if data is short)
  const windowSize = Math.min(3, Math.max(1, Math.floor(revenues.length / 2)));
  const trendValues = movingAverage(revenues, windowSize);

  return data.map((d, i) => {
    const monthNum = parseInt(d.month.split('-')[1], 10);
    const seasonal = (seasonalFactors[monthNum] ?? 1.0) - 1.0; // deviation from 1.0
    const trendVal = trendValues[i] ?? revenues[i];
    const observed = d.revenue;
    const residual = observed - trendVal - (trendVal * seasonal);

    return {
      month: d.month,
      observed,
      trend: Math.round(trendVal),
      seasonal: Math.round(trendVal * seasonal),
      residual: Math.round(residual),
    };
  });
}

/**
 * Calculate seasonal factors from historical data.
 * Falls back to default med spa seasonality if insufficient data.
 */
export function calculateSeasonalFactors(data: MonthlyDataPoint[]): SeasonalFactors {
  if (data.length < 6) {
    // Not enough history, use industry defaults
    const entries = Object.entries(DEFAULT_SEASONAL_FACTORS).map(([m, f]) => [parseInt(m), f] as [number, number]);
    const peak = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    const trough = entries.reduce((a, b) => b[1] < a[1] ? b : a);
    return {
      byMonth: { ...DEFAULT_SEASONAL_FACTORS },
      peakMonth: peak[0],
      troughMonth: trough[0],
      seasonalStrength: 0.5,
    };
  }

  // Group by month and compute average revenue per month
  const byMonth: Record<number, number[]> = {};
  for (const d of data) {
    const m = parseInt(d.month.split('-')[1], 10);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(d.revenue);
  }

  const overallAvg = data.reduce((s, d) => s + d.revenue, 0) / data.length;
  const factors: Record<number, number> = {};

  for (let m = 1; m <= 12; m++) {
    if (byMonth[m] && byMonth[m].length > 0) {
      const monthAvg = byMonth[m].reduce((s, v) => s + v, 0) / byMonth[m].length;
      factors[m] = overallAvg > 0 ? monthAvg / overallAvg : 1.0;
    } else {
      factors[m] = DEFAULT_SEASONAL_FACTORS[m] ?? 1.0;
    }
  }

  const entries = Object.entries(factors).map(([m, f]) => [parseInt(m), f] as [number, number]);
  const peak = entries.reduce((a, b) => b[1] > a[1] ? b : a);
  const trough = entries.reduce((a, b) => b[1] < a[1] ? b : a);

  // Seasonal strength: std deviation of factors
  const factorValues = Object.values(factors);
  const factorMean = factorValues.reduce((s, v) => s + v, 0) / factorValues.length;
  const factorStd = Math.sqrt(factorValues.reduce((s, v) => s + (v - factorMean) ** 2, 0) / factorValues.length);
  const seasonalStrength = Math.min(1, factorStd / 0.15); // normalize: 0.15 std = full strength

  return {
    byMonth: factors,
    peakMonth: peak[0],
    troughMonth: trough[0],
    seasonalStrength,
  };
}

/**
 * Analyze overall revenue trend from historical data.
 */
export function analyzeTrend(data: MonthlyDataPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      slope: 0,
      intercept: data[0]?.revenue ?? 0,
      rSquared: 0,
      direction: 'stable',
      monthlyGrowthRate: 0,
      annualizedGrowthRate: 0,
    };
  }

  const points = data.map((d, i) => ({ x: i, y: d.revenue }));
  const reg = linearRegression(points);

  const avgRevenue = data.reduce((s, d) => s + d.revenue, 0) / data.length;
  const monthlyGrowthRate = avgRevenue > 0 ? (reg.slope / avgRevenue) * 100 : 0;
  const annualizedGrowthRate = ((1 + monthlyGrowthRate / 100) ** 12 - 1) * 100;

  let direction: 'growing' | 'declining' | 'stable';
  if (monthlyGrowthRate > 1) direction = 'growing';
  else if (monthlyGrowthRate < -1) direction = 'declining';
  else direction = 'stable';

  return {
    slope: Math.round(reg.slope),
    intercept: Math.round(reg.intercept),
    rSquared: Math.round(reg.rSquared * 1000) / 1000,
    direction,
    monthlyGrowthRate: Math.round(monthlyGrowthRate * 10) / 10,
    annualizedGrowthRate: Math.round(annualizedGrowthRate * 10) / 10,
  };
}

/**
 * Generate provider-level revenue forecasts.
 */
export function forecastProviders(providerData: ProviderDataPoint[]): ProviderForecast[] {
  const byProvider: Record<string, ProviderDataPoint[]> = {};
  for (const d of providerData) {
    if (!byProvider[d.provider]) byProvider[d.provider] = [];
    byProvider[d.provider].push(d);
  }

  return Object.entries(byProvider).map(([provider, data]) => {
    // Sort by month
    data.sort((a, b) => a.month.localeCompare(b.month));

    const revenues = data.map(d => d.revenue);
    const bookings = data.map(d => d.bookings);
    const hours = data.map(d => d.hoursWorked);

    // Use exponential smoothing for the projection
    const smoothed = exponentialSmoothing(revenues, 0.4);
    const projectedRevenue = smoothed[smoothed.length - 1] ?? 0;

    const smoothedBookings = exponentialSmoothing(bookings, 0.4);
    const projectedBookings = Math.round(smoothedBookings[smoothedBookings.length - 1] ?? 0);

    const totalHours = hours.reduce((s, v) => s + v, 0);
    const totalRevenue = revenues.reduce((s, v) => s + v, 0);
    const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Growth rate from last 3 months
    const recent = revenues.slice(-3);
    let growthRate = 0;
    if (recent.length >= 2 && recent[0] > 0) {
      growthRate = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
    }

    let trend: 'growing' | 'declining' | 'stable';
    if (growthRate > 5) trend = 'growing';
    else if (growthRate < -5) trend = 'declining';
    else trend = 'stable';

    return {
      provider,
      projectedMonthlyRevenue: Math.round(projectedRevenue),
      projectedBookings,
      revenuePerHour: Math.round(revenuePerHour),
      growthRate: Math.round(growthRate * 10) / 10,
      trend,
    };
  });
}

/**
 * Generate service category growth forecasts.
 */
export function forecastCategories(
  categoryData: ServiceCategoryDataPoint[],
  totalProjectedRevenue: number,
): CategoryForecast[] {
  const byCategory: Record<string, ServiceCategoryDataPoint[]> = {};
  for (const d of categoryData) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }

  const forecasts = Object.entries(byCategory).map(([category, data]) => {
    data.sort((a, b) => a.month.localeCompare(b.month));
    const revenues = data.map(d => d.revenue);

    const smoothed = exponentialSmoothing(revenues, 0.4);
    const projected = smoothed[smoothed.length - 1] ?? 0;

    const recent = revenues.slice(-3);
    let growthRate = 0;
    if (recent.length >= 2 && recent[0] > 0) {
      growthRate = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
    }

    let trend: 'growing' | 'declining' | 'stable';
    if (growthRate > 5) trend = 'growing';
    else if (growthRate < -5) trend = 'declining';
    else trend = 'stable';

    return {
      category,
      projectedMonthlyRevenue: Math.round(projected),
      growthRate: Math.round(growthRate * 10) / 10,
      shareOfTotal: 0,
      trend,
    };
  });

  // Calculate share of total
  const totalProjected = forecasts.reduce((s, f) => s + f.projectedMonthlyRevenue, 0);
  for (const f of forecasts) {
    f.shareOfTotal = totalProjected > 0
      ? Math.round((f.projectedMonthlyRevenue / totalProjected) * 1000) / 10
      : 0;
  }

  return forecasts.sort((a, b) => b.projectedMonthlyRevenue - a.projectedMonthlyRevenue);
}

/**
 * Generate confidence intervals for projections.
 */
export function generateConfidenceIntervals(
  historicalData: MonthlyDataPoint[],
  projections: MonthlyProjection[],
): ConfidenceInterval[] {
  // Calculate historical volatility (coefficient of variation)
  const revenues = historicalData.map(d => d.revenue);
  const mean = revenues.reduce((s, v) => s + v, 0) / revenues.length;
  const std = Math.sqrt(revenues.reduce((s, v) => s + (v - mean) ** 2, 0) / revenues.length);
  const cv = mean > 0 ? std / mean : 0.15;

  return projections.map((p, i) => {
    // Uncertainty grows with projection horizon
    const horizonMultiplier = 1 + (i * 0.1);
    const spread = p.expected * cv * horizonMultiplier;

    return {
      month: p.month,
      p10: Math.round(p.expected - 1.28 * spread),
      p25: Math.round(p.expected - 0.67 * spread),
      p50: Math.round(p.expected),
      p75: Math.round(p.expected + 0.67 * spread),
      p90: Math.round(p.expected + 1.28 * spread),
    };
  });
}

/**
 * Run a what-if scenario and project the impact.
 */
export function runScenario(
  baseProjections: MonthlyProjection[],
  scenario: ScenarioInput,
  currentAvgRevenue: number,
): ScenarioResult {
  const { type, params } = scenario;

  let label = '';
  let monthlyImpact = 0;
  let monthlyCost = 0;
  let upfrontCost = 0;
  let rampMonths = 1;

  switch (type) {
    case 'add_provider': {
      const revenuePerHour = (params.revenuePerHour as number) || 250;
      const hoursPerWeek = (params.hoursPerWeek as number) || 32;
      const salary = (params.monthlySalary as number) || 8000;
      monthlyImpact = revenuePerHour * hoursPerWeek * 4.33;
      monthlyCost = salary;
      rampMonths = 3;
      label = `Add provider ($${Math.round(revenuePerHour)}/hr, ${hoursPerWeek}hrs/wk)`;
      break;
    }
    case 'remove_provider': {
      const lostRevenue = (params.monthlyRevenue as number) || 20000;
      monthlyImpact = -lostRevenue;
      monthlyCost = -(params.monthlySalary as number || 8000);
      label = `Remove provider (-$${Math.round(lostRevenue).toLocaleString()}/mo revenue)`;
      break;
    }
    case 'add_service': {
      const pricePoint = (params.pricePoint as number) || 500;
      const expectedBookings = (params.monthlyBookings as number) || 20;
      const supplyCost = (params.supplyCostPerUnit as number) || 100;
      monthlyImpact = pricePoint * expectedBookings;
      monthlyCost = supplyCost * expectedBookings;
      upfrontCost = (params.equipmentCost as number) || 0;
      rampMonths = (params.rampMonths as number) || 3;
      label = `Add service ($${pricePoint} x ${expectedBookings} bookings/mo)`;
      break;
    }
    case 'price_increase': {
      const increasePercent = (params.percentIncrease as number) || 10;
      // Price elasticity: assume 5% volume decrease for every 10% price increase
      const volumeDecline = (increasePercent / 10) * 0.05;
      monthlyImpact = currentAvgRevenue * (increasePercent / 100) * (1 - volumeDecline);
      label = `Price increase +${increasePercent}% (est. ${Math.round(volumeDecline * 100)}% volume decline)`;
      break;
    }
    case 'price_decrease': {
      const decreasePercent = (params.percentDecrease as number) || 10;
      const volumeIncrease = (decreasePercent / 10) * 0.08;
      monthlyImpact = currentAvgRevenue * (-decreasePercent / 100 + volumeIncrease);
      label = `Price decrease -${decreasePercent}% (est. ${Math.round(volumeIncrease * 100)}% volume increase)`;
      break;
    }
    case 'marketing_spend': {
      const monthlyBudget = (params.monthlyBudget as number) || 3000;
      const expectedROAS = (params.expectedROAS as number) || 4;
      monthlyImpact = monthlyBudget * expectedROAS;
      monthlyCost = monthlyBudget;
      rampMonths = 2;
      label = `Marketing spend $${monthlyBudget.toLocaleString()}/mo (${expectedROAS}x ROAS)`;
      break;
    }
    case 'expand_hours': {
      const additionalHours = (params.additionalHoursPerWeek as number) || 10;
      const revenuePerHour = (params.revenuePerHour as number) || 200;
      const staffCostPerHour = (params.staffCostPerHour as number) || 50;
      monthlyImpact = additionalHours * revenuePerHour * 4.33;
      monthlyCost = additionalHours * staffCostPerHour * 4.33;
      label = `Expand hours +${additionalHours}hrs/wk`;
      break;
    }
  }

  const netMonthlyImpact = monthlyImpact - monthlyCost;
  const baselineTotal = baseProjections.reduce((s, p) => s + p.expected, 0);

  const monthlyProjections = baseProjections.map((p, i) => {
    // Ramp-up factor: 0 at month 0, 1.0 at rampMonths
    const rampFactor = Math.min(1, (i + 1) / Math.max(1, rampMonths));
    const scenarioRevenue = p.expected + (netMonthlyImpact * rampFactor);
    return {
      month: p.month,
      baseline: p.expected,
      scenario: Math.round(scenarioRevenue),
    };
  });

  const projectedTotal = monthlyProjections.reduce((s, p) => s + p.scenario, 0);
  const incrementalRevenue = projectedTotal - baselineTotal;
  const incrementalProfit = incrementalRevenue - (upfrontCost);

  const paybackMonths = netMonthlyImpact > 0 && upfrontCost > 0
    ? Math.ceil(upfrontCost / netMonthlyImpact)
    : netMonthlyImpact > 0 ? 0 : Infinity;

  const totalCost = upfrontCost + (monthlyCost * baseProjections.length);
  const roi = totalCost > 0 ? ((incrementalRevenue - totalCost) / totalCost) * 100 : incrementalRevenue > 0 ? Infinity : 0;

  return {
    type,
    label,
    baselineRevenue: Math.round(baselineTotal),
    projectedRevenue: Math.round(projectedTotal),
    incrementalRevenue: Math.round(incrementalRevenue),
    incrementalProfit: Math.round(incrementalProfit),
    roi: Math.round(roi * 10) / 10,
    paybackMonths: paybackMonths === Infinity ? -1 : paybackMonths,
    monthlyProjections,
  };
}

/**
 * Break-even analysis for a new service or equipment purchase.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCosts, variableCostPerUnit, pricePerUnit, monthlyOverhead = 0 } = input;

  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const contributionMarginRatio = pricePerUnit > 0 ? contributionMargin / pricePerUnit : 0;

  const totalFixedCosts = fixedCosts + monthlyOverhead;
  const breakEvenUnits = contributionMargin > 0
    ? Math.ceil(totalFixedCosts / contributionMargin)
    : Infinity;

  const breakEvenRevenue = breakEvenUnits === Infinity ? Infinity : breakEvenUnits * pricePerUnit;

  // Assume 20 units/month capacity for months-to-break-even
  const monthlyUnits = 20;
  const monthlyProfit = (monthlyUnits * contributionMargin) - monthlyOverhead;
  const monthsToBreakEven = monthlyProfit > 0 ? Math.ceil(fixedCosts / monthlyProfit) : -1;

  // Safety margin (assuming current volume = monthlyUnits)
  const safetyMargin = breakEvenUnits < Infinity && breakEvenUnits > 0
    ? ((monthlyUnits - breakEvenUnits) / breakEvenUnits) * 100
    : 0;

  return {
    breakEvenUnits: breakEvenUnits === Infinity ? -1 : breakEvenUnits,
    breakEvenRevenue: breakEvenRevenue === Infinity ? -1 : Math.round(breakEvenRevenue),
    contributionMargin: Math.round(contributionMargin * 100) / 100,
    contributionMarginRatio: Math.round(contributionMarginRatio * 1000) / 1000,
    monthsToBreakEven,
    safetyMargin: Math.round(safetyMargin * 10) / 10,
  };
}

/**
 * Main forecasting function: generates complete revenue forecast.
 */
export function generateForecast(
  input: ForecastInput,
  horizonMonths: number = 12,
): ForecastResult {
  const { historicalData, providerData = [], serviceCategoryData = [] } = input;

  // 1. Trend analysis
  const trend = analyzeTrend(historicalData);

  // 2. Seasonal factors
  const seasonality = calculateSeasonalFactors(historicalData);

  // 3. Time series decomposition
  const decomposition = decomposeTimeSeries(historicalData, seasonality.byMonth);

  // 4. Generate monthly projections
  const lastMonth = historicalData[historicalData.length - 1];
  const lastRevenue = lastMonth?.revenue ?? 0;
  const lastMonthStr = lastMonth?.month ?? new Date().toISOString().slice(0, 7);

  const projections: MonthlyProjection[] = [];
  for (let i = 1; i <= horizonMonths; i++) {
    const date = new Date(lastMonthStr + '-01');
    date.setMonth(date.getMonth() + i);
    const month = date.toISOString().slice(0, 7);
    const monthNum = date.getMonth() + 1;

    const trendValue = trend.intercept + trend.slope * (historicalData.length + i - 1);
    const seasonalFactor = seasonality.byMonth[monthNum] ?? 1.0;
    const expected = Math.max(0, trendValue * seasonalFactor);

    // Optimistic: +15% growth on top of trend
    const optimistic = expected * 1.15;
    // Conservative: -10% from expected
    const conservative = expected * 0.90;

    const growthRate = lastRevenue > 0 ? ((expected - lastRevenue) / lastRevenue) * 100 : 0;

    projections.push({
      month,
      expected: Math.round(expected),
      optimistic: Math.round(optimistic),
      conservative: Math.round(conservative),
      growthRate: Math.round(growthRate * 10) / 10,
      seasonalFactor: Math.round(seasonalFactor * 100) / 100,
    });
  }

  // 5. Provider forecasts
  const providerForecasts = forecastProviders(providerData);

  // 6. Category forecasts
  const totalProjected = projections[0]?.expected ?? 0;
  const categoryForecasts = forecastCategories(serviceCategoryData, totalProjected);

  // 7. Confidence intervals
  const confidenceIntervals = generateConfidenceIntervals(historicalData, projections);

  return {
    projections,
    trend,
    seasonality,
    providerForecasts,
    categoryForecasts,
    confidenceIntervals,
    decomposition,
  };
}
