// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  linearRegression,
  movingAverage,
  exponentialSmoothing,
  doubleExponentialSmoothing,
  decomposeTimeSeries,
  calculateSeasonalFactors,
  analyzeTrend,
  forecastProviders,
  forecastCategories,
  generateConfidenceIntervals,
  runScenario,
  calculateBreakEven,
  generateForecast,
  type MonthlyDataPoint,
  type ProviderDataPoint,
  type ServiceCategoryDataPoint,
  type MonthlyProjection,
} from '../forecasting';

// ── Helpers ──

function makeMonthlyData(count: number, baseRevenue: number = 50000, growth: number = 1000): MonthlyDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    month: `2025-${String(i + 1).padStart(2, '0')}`,
    revenue: baseRevenue + growth * i,
    bookings: 100 + i * 5,
    newClients: 10 + i,
    avgTicket: (baseRevenue + growth * i) / (100 + i * 5),
  }));
}

function makeProviderData(): ProviderDataPoint[] {
  return [
    { provider: 'Dr. Rina', month: '2025-01', revenue: 30000, bookings: 60, hoursWorked: 120 },
    { provider: 'Dr. Rina', month: '2025-02', revenue: 32000, bookings: 65, hoursWorked: 125 },
    { provider: 'Dr. Rina', month: '2025-03', revenue: 35000, bookings: 70, hoursWorked: 130 },
    { provider: 'Mom', month: '2025-01', revenue: 20000, bookings: 40, hoursWorked: 100 },
    { provider: 'Mom', month: '2025-02', revenue: 21000, bookings: 42, hoursWorked: 100 },
    { provider: 'Mom', month: '2025-03', revenue: 22000, bookings: 45, hoursWorked: 105 },
  ];
}

// ── Linear Regression ──

describe('linearRegression', () => {
  it('returns slope 0 for flat data', () => {
    const r = linearRegression([{ x: 0, y: 10 }, { x: 1, y: 10 }, { x: 2, y: 10 }]);
    expect(r.slope).toBe(0);
    expect(r.intercept).toBe(10);
  });

  it('correctly fits a perfect linear trend', () => {
    const r = linearRegression([{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 4 }]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(0);
    expect(r.rSquared).toBeCloseTo(1);
  });

  it('handles single point', () => {
    const r = linearRegression([{ x: 0, y: 5 }]);
    expect(r.slope).toBe(0);
    expect(r.intercept).toBe(5);
  });

  it('calculates R-squared < 1 for noisy data', () => {
    const r = linearRegression([{ x: 0, y: 1 }, { x: 1, y: 5 }, { x: 2, y: 3 }, { x: 3, y: 7 }]);
    expect(r.rSquared).toBeLessThan(1);
    expect(r.rSquared).toBeGreaterThan(0);
  });

  it('handles negative slopes', () => {
    const r = linearRegression([{ x: 0, y: 100 }, { x: 1, y: 80 }, { x: 2, y: 60 }]);
    expect(r.slope).toBeLessThan(0);
  });
});

// ── Moving Average ──

describe('movingAverage', () => {
  it('returns same values for window=1', () => {
    const r = movingAverage([10, 20, 30], 1);
    expect(r).toEqual([10, 20, 30]);
  });

  it('smooths data with window=3', () => {
    const r = movingAverage([10, 20, 30, 40], 3);
    expect(r[0]).toBe(10);
    expect(r[1]).toBe(15);
    expect(r[2]).toBe(20);
    expect(r[3]).toBe(30);
  });

  it('handles empty array', () => {
    expect(movingAverage([], 3)).toEqual([]);
  });

  it('handles window larger than data', () => {
    const r = movingAverage([10, 20], 5);
    expect(r).toHaveLength(2);
  });

  it('handles window=0', () => {
    expect(movingAverage([1, 2, 3], 0)).toEqual([]);
  });
});

// ── Exponential Smoothing ──

describe('exponentialSmoothing', () => {
  it('returns first value unchanged', () => {
    const r = exponentialSmoothing([100, 200, 300], 0.5);
    expect(r[0]).toBe(100);
  });

  it('smooths toward recent values', () => {
    const r = exponentialSmoothing([100, 200, 200, 200], 0.5);
    expect(r[3]).toBeGreaterThan(r[1]);
  });

  it('handles alpha=1 (no smoothing)', () => {
    const r = exponentialSmoothing([10, 20, 30], 1);
    expect(r).toEqual([10, 20, 30]);
  });

  it('handles empty array', () => {
    expect(exponentialSmoothing([])).toEqual([]);
  });

  it('handles alpha=0 (complete smoothing)', () => {
    const r = exponentialSmoothing([10, 20, 30], 0);
    expect(r).toEqual([10, 10, 10]);
  });

  it('produces values between extremes', () => {
    const r = exponentialSmoothing([100, 0], 0.3);
    expect(r[1]).toBeGreaterThan(0);
    expect(r[1]).toBeLessThan(100);
  });
});

// ── Double Exponential Smoothing ──

describe('doubleExponentialSmoothing', () => {
  it('returns level and trend arrays', () => {
    const r = doubleExponentialSmoothing([10, 20, 30, 40]);
    expect(r.level).toHaveLength(4);
    expect(r.trend).toHaveLength(4);
    expect(r.forecast).toHaveLength(4);
  });

  it('handles single data point', () => {
    const r = doubleExponentialSmoothing([50]);
    expect(r.level).toEqual([50]);
  });

  it('detects upward trend', () => {
    const r = doubleExponentialSmoothing([10, 20, 30, 40, 50]);
    expect(r.trend[4]).toBeGreaterThan(0);
  });
});

// ── Time Series Decomposition ──

describe('decomposeTimeSeries', () => {
  it('returns decomposition for each data point', () => {
    const data = makeMonthlyData(6);
    const r = decomposeTimeSeries(data);
    expect(r).toHaveLength(6);
    expect(r[0]).toHaveProperty('observed');
    expect(r[0]).toHaveProperty('trend');
    expect(r[0]).toHaveProperty('seasonal');
    expect(r[0]).toHaveProperty('residual');
  });

  it('observed equals sum of components approximately', () => {
    const data = makeMonthlyData(6);
    const r = decomposeTimeSeries(data);
    for (const d of r) {
      // Observed should roughly equal trend + seasonal + residual
      const reconstructed = d.trend + d.seasonal + d.residual;
      expect(Math.abs(d.observed - reconstructed)).toBeLessThan(d.observed * 0.1 + 1);
    }
  });

  it('accepts custom seasonal factors', () => {
    const data = makeMonthlyData(3);
    const custom = { 1: 0.5, 2: 1.0, 3: 1.5, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1 };
    const r = decomposeTimeSeries(data, custom);
    expect(r).toHaveLength(3);
  });
});

// ── Seasonal Factors ──

describe('calculateSeasonalFactors', () => {
  it('returns default factors for insufficient data', () => {
    const r = calculateSeasonalFactors(makeMonthlyData(3));
    expect(Object.keys(r.byMonth)).toHaveLength(12);
    expect(r.seasonalStrength).toBe(0.5);
  });

  it('calculates factors from 12+ months of data', () => {
    const data = makeMonthlyData(12);
    const r = calculateSeasonalFactors(data);
    expect(r.peakMonth).toBeGreaterThanOrEqual(1);
    expect(r.peakMonth).toBeLessThanOrEqual(12);
    expect(r.troughMonth).toBeGreaterThanOrEqual(1);
    expect(r.troughMonth).toBeLessThanOrEqual(12);
  });

  it('factors average close to 1.0', () => {
    const data = makeMonthlyData(12, 50000, 0); // flat data
    const r = calculateSeasonalFactors(data);
    const avg = Object.values(r.byMonth).reduce((s, v) => s + v, 0) / 12;
    expect(avg).toBeCloseTo(1.0, 0);
  });
});

// ── Trend Analysis ──

describe('analyzeTrend', () => {
  it('detects growing trend', () => {
    const data = makeMonthlyData(6, 50000, 5000);
    const r = analyzeTrend(data);
    expect(r.direction).toBe('growing');
    expect(r.slope).toBeGreaterThan(0);
  });

  it('detects declining trend', () => {
    const data = makeMonthlyData(6, 50000, -5000);
    const r = analyzeTrend(data);
    expect(r.direction).toBe('declining');
    expect(r.slope).toBeLessThan(0);
  });

  it('detects stable trend for flat data', () => {
    const data = makeMonthlyData(6, 50000, 0);
    const r = analyzeTrend(data);
    expect(r.direction).toBe('stable');
  });

  it('handles single data point', () => {
    const r = analyzeTrend(makeMonthlyData(1));
    expect(r.direction).toBe('stable');
    expect(r.slope).toBe(0);
  });

  it('returns annualized growth rate', () => {
    const r = analyzeTrend(makeMonthlyData(6, 50000, 2000));
    expect(r.annualizedGrowthRate).toBeGreaterThan(0);
  });
});

// ── Provider Forecasts ──

describe('forecastProviders', () => {
  it('returns forecast per provider', () => {
    const r = forecastProviders(makeProviderData());
    expect(r).toHaveLength(2);
    expect(r.find(p => p.provider === 'Dr. Rina')).toBeDefined();
    expect(r.find(p => p.provider === 'Mom')).toBeDefined();
  });

  it('projects revenue from exponential smoothing', () => {
    const r = forecastProviders(makeProviderData());
    const rina = r.find(p => p.provider === 'Dr. Rina')!;
    expect(rina.projectedMonthlyRevenue).toBeGreaterThan(0);
    expect(rina.projectedBookings).toBeGreaterThan(0);
  });

  it('calculates revenue per hour', () => {
    const r = forecastProviders(makeProviderData());
    for (const p of r) {
      expect(p.revenuePerHour).toBeGreaterThan(0);
    }
  });

  it('detects growing provider', () => {
    const r = forecastProviders(makeProviderData());
    const rina = r.find(p => p.provider === 'Dr. Rina')!;
    expect(rina.growthRate).toBeGreaterThan(0);
  });
});

// ── Category Forecasts ──

describe('forecastCategories', () => {
  it('returns forecast per category', () => {
    const data: ServiceCategoryDataPoint[] = [
      { category: 'Injectable', month: '2025-01', revenue: 20000, bookings: 40 },
      { category: 'Injectable', month: '2025-02', revenue: 22000, bookings: 44 },
      { category: 'Facial', month: '2025-01', revenue: 10000, bookings: 30 },
      { category: 'Facial', month: '2025-02', revenue: 11000, bookings: 33 },
    ];
    const r = forecastCategories(data, 50000);
    expect(r).toHaveLength(2);
  });

  it('calculates share of total', () => {
    const data: ServiceCategoryDataPoint[] = [
      { category: 'A', month: '2025-01', revenue: 30000, bookings: 30 },
      { category: 'B', month: '2025-01', revenue: 20000, bookings: 20 },
    ];
    const r = forecastCategories(data, 50000);
    const totalShare = r.reduce((s, c) => s + c.shareOfTotal, 0);
    expect(totalShare).toBeCloseTo(100, 0);
  });

  it('sorts by projected revenue descending', () => {
    const data: ServiceCategoryDataPoint[] = [
      { category: 'Small', month: '2025-01', revenue: 5000, bookings: 10 },
      { category: 'Large', month: '2025-01', revenue: 50000, bookings: 50 },
    ];
    const r = forecastCategories(data, 55000);
    expect(r[0].category).toBe('Large');
  });
});

// ── Confidence Intervals ──

describe('generateConfidenceIntervals', () => {
  it('generates intervals for each projection', () => {
    const hist = makeMonthlyData(6);
    const projections: MonthlyProjection[] = Array.from({ length: 6 }, (_, i) => ({
      month: `2025-${String(7 + i).padStart(2, '0')}`,
      expected: 55000 + i * 1000,
      optimistic: 60000 + i * 1000,
      conservative: 50000 + i * 1000,
      growthRate: 2,
      seasonalFactor: 1,
    }));
    const r = generateConfidenceIntervals(hist, projections);
    expect(r).toHaveLength(6);
  });

  it('p10 < p50 < p90', () => {
    const hist = makeMonthlyData(6, 50000, 2000);
    const projections: MonthlyProjection[] = [{ month: '2025-07', expected: 60000, optimistic: 65000, conservative: 55000, growthRate: 2, seasonalFactor: 1 }];
    const r = generateConfidenceIntervals(hist, projections);
    expect(r[0].p10).toBeLessThan(r[0].p50);
    expect(r[0].p50).toBeLessThan(r[0].p90);
  });

  it('uncertainty grows with horizon', () => {
    const hist = makeMonthlyData(6, 50000, 2000);
    const projections: MonthlyProjection[] = Array.from({ length: 6 }, (_, i) => ({
      month: `2025-${String(7 + i).padStart(2, '0')}`,
      expected: 60000,
      optimistic: 65000,
      conservative: 55000,
      growthRate: 2,
      seasonalFactor: 1,
    }));
    const r = generateConfidenceIntervals(hist, projections);
    const spread0 = r[0].p90 - r[0].p10;
    const spread5 = r[5].p90 - r[5].p10;
    expect(spread5).toBeGreaterThan(spread0);
  });
});

// ── Scenario Planning ──

describe('runScenario', () => {
  const baseProjections: MonthlyProjection[] = Array.from({ length: 6 }, (_, i) => ({
    month: `2025-${String(7 + i).padStart(2, '0')}`,
    expected: 50000,
    optimistic: 55000,
    conservative: 45000,
    growthRate: 0,
    seasonalFactor: 1,
  }));

  it('add_provider increases revenue', () => {
    const r = runScenario(baseProjections, { type: 'add_provider', params: { revenuePerHour: 250, hoursPerWeek: 32, monthlySalary: 8000 } }, 50000);
    expect(r.incrementalRevenue).toBeGreaterThan(0);
    expect(r.type).toBe('add_provider');
  });

  it('price_increase shows positive impact', () => {
    const r = runScenario(baseProjections, { type: 'price_increase', params: { percentIncrease: 10 } }, 50000);
    expect(r.incrementalRevenue).toBeGreaterThan(0);
  });

  it('marketing_spend shows ramp-up effect', () => {
    const r = runScenario(baseProjections, { type: 'marketing_spend', params: { monthlyBudget: 5000, expectedROAS: 4 } }, 50000);
    const first = r.monthlyProjections[0];
    const last = r.monthlyProjections[r.monthlyProjections.length - 1];
    expect(last.scenario - last.baseline).toBeGreaterThanOrEqual(first.scenario - first.baseline);
  });

  it('returns label and ROI', () => {
    const r = runScenario(baseProjections, { type: 'add_service', params: { pricePoint: 500, monthlyBookings: 20, supplyCostPerUnit: 100, equipmentCost: 50000 } }, 50000);
    expect(r.label).toContain('Add service');
    expect(typeof r.roi).toBe('number');
  });

  it('handles expand_hours scenario', () => {
    const r = runScenario(baseProjections, { type: 'expand_hours', params: { additionalHoursPerWeek: 10, revenuePerHour: 200, staffCostPerHour: 50 } }, 50000);
    expect(r.incrementalRevenue).toBeGreaterThan(0);
  });
});

// ── Break-Even ──

describe('calculateBreakEven', () => {
  it('calculates break-even units', () => {
    const r = calculateBreakEven({ fixedCosts: 10000, variableCostPerUnit: 50, pricePerUnit: 200 });
    expect(r.breakEvenUnits).toBe(67); // ceil(10000 / 150)
  });

  it('calculates contribution margin', () => {
    const r = calculateBreakEven({ fixedCosts: 5000, variableCostPerUnit: 100, pricePerUnit: 500 });
    expect(r.contributionMargin).toBe(400);
    expect(r.contributionMarginRatio).toBeCloseTo(0.8, 2);
  });

  it('returns -1 for impossible break-even', () => {
    const r = calculateBreakEven({ fixedCosts: 10000, variableCostPerUnit: 200, pricePerUnit: 100 });
    expect(r.breakEvenUnits).toBe(-1);
  });

  it('includes overhead in calculation', () => {
    const r1 = calculateBreakEven({ fixedCosts: 10000, variableCostPerUnit: 50, pricePerUnit: 200 });
    const r2 = calculateBreakEven({ fixedCosts: 10000, variableCostPerUnit: 50, pricePerUnit: 200, monthlyOverhead: 1000 });
    expect(r2.breakEvenUnits).toBeGreaterThan(r1.breakEvenUnits);
  });

  it('calculates safety margin', () => {
    const r = calculateBreakEven({ fixedCosts: 5000, variableCostPerUnit: 50, pricePerUnit: 300 });
    expect(typeof r.safetyMargin).toBe('number');
  });
});

// ── Main Forecast Function ──

describe('generateForecast', () => {
  it('returns complete forecast result', () => {
    const r = generateForecast({ historicalData: makeMonthlyData(6), providerData: makeProviderData(), serviceCategoryData: [] });
    expect(r).toHaveProperty('projections');
    expect(r).toHaveProperty('trend');
    expect(r).toHaveProperty('seasonality');
    expect(r).toHaveProperty('providerForecasts');
    expect(r).toHaveProperty('categoryForecasts');
    expect(r).toHaveProperty('confidenceIntervals');
    expect(r).toHaveProperty('decomposition');
  });

  it('generates correct number of projections', () => {
    const r = generateForecast({ historicalData: makeMonthlyData(6) }, 12);
    expect(r.projections).toHaveLength(12);
  });

  it('projections have positive values', () => {
    const r = generateForecast({ historicalData: makeMonthlyData(6, 50000, 2000) });
    for (const p of r.projections) {
      expect(p.expected).toBeGreaterThanOrEqual(0);
      expect(p.optimistic).toBeGreaterThanOrEqual(p.expected);
      expect(p.conservative).toBeLessThanOrEqual(p.expected);
    }
  });

  it('handles empty provider/category data gracefully', () => {
    const r = generateForecast({ historicalData: makeMonthlyData(6), providerData: [], serviceCategoryData: [] });
    expect(r.providerForecasts).toEqual([]);
    expect(r.categoryForecasts).toEqual([]);
  });

  it('handles minimal historical data', () => {
    const r = generateForecast({ historicalData: makeMonthlyData(2) });
    expect(r.projections.length).toBeGreaterThan(0);
  });
});
