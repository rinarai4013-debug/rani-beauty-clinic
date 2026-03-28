import { generateForecast } from '../forecasting-v2';
import type { ForecastInput, ForecastResult } from '../forecasting-v2';

// ── HELPERS ──

function makeHistoricalData(days: number = 60) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dow = d.getDay();
    const isWeekday = dow >= 1 && dow <= 5;
    const base = isWeekday ? 2200 : dow === 6 ? 1400 : 200;
    const variance = (Math.random() - 0.5) * 600;
    data.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.max(0, Math.round(base + variance)),
      bookings: Math.max(1, Math.round((base + variance) / 350)),
      avgTicket: 350 + Math.round((Math.random() - 0.5) * 100),
      newClients: Math.round(Math.random() * 3),
      returningClients: Math.round(Math.random() * 6 + 2),
      dayOfWeek: dow,
      month: d.getMonth() + 1,
    });
  }
  return data;
}

function makeInput(overrides: Partial<ForecastInput> = {}): ForecastInput {
  return {
    historicalRevenue: makeHistoricalData(),
    appointments: [],
    marketing: [
      { date: '2026-03-20', channel: 'Meta', spend: 50, leads: 3, bookings: 1 },
      { date: '2026-03-21', channel: 'Meta', spend: 60, leads: 4, bookings: 2 },
      { date: '2026-03-22', channel: 'Google', spend: 40, leads: 2, bookings: 1 },
    ],
    providers: [
      { name: 'Rina', hoursPerWeek: 40, avgRevenuePerHour: 250, utilizationTarget: 0.75 },
      { name: 'Mom', hoursPerWeek: 35, avgRevenuePerHour: 180, utilizationTarget: 0.70 },
    ],
    memberships: { activeMembers: 45, avgMonthlyMRR: 8500, churnRate: 0.05, growthRate: 0.08 },
    seasonality: [
      { month: 1, multiplier: 0.90, notes: 'Slow' },
      { month: 2, multiplier: 0.95, notes: 'Picking up' },
      { month: 3, multiplier: 1.05, notes: 'Spring' },
      { month: 4, multiplier: 1.10, notes: 'Wedding' },
      { month: 5, multiplier: 1.08, notes: 'Pre-summer' },
      { month: 6, multiplier: 0.95, notes: 'Summer' },
      { month: 7, multiplier: 0.90, notes: 'Vacation' },
      { month: 8, multiplier: 0.92, notes: 'Late summer' },
      { month: 9, multiplier: 1.10, notes: 'Fall revival' },
      { month: 10, multiplier: 1.12, notes: 'Pre-holiday' },
      { month: 11, multiplier: 1.15, notes: 'Holiday' },
      { month: 12, multiplier: 1.05, notes: 'Year end' },
    ],
    currentGoals: { monthlyTarget: 60000, quarterlyTarget: 180000, annualTarget: 720000 },
    pipelineLeads: 18,
    consultsScheduled: 7,
    ...overrides,
  };
}

// ── TESTS ──

describe('Forecasting V2', () => {
  describe('generateForecast', () => {
    it('should return valid result structure', () => {
      const result = generateForecast(makeInput());
      expect(result.monthlyForecast).toBeDefined();
      expect(result.weeklyTargets).toBeDefined();
      expect(result.dailyTargets).toBeDefined();
      expect(result.scenarioModels).toBeDefined();
      expect(result.goalDecomposition).toBeDefined();
      expect(result.leadingIndicators).toBeDefined();
      expect(result.laggingCorrelations).toBeDefined();
      expect(result.confidenceIntervals).toBeDefined();
      expect(result.cashFlowProjection).toBeDefined();
      expect(result.regressionFactors).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Monthly Forecast', () => {
    it('should have predicted revenue > 0', () => {
      const result = generateForecast(makeInput());
      expect(result.monthlyForecast.predicted).toBeGreaterThan(0);
    });

    it('should have low <= predicted <= high', () => {
      const result = generateForecast(makeInput());
      expect(result.monthlyForecast.low).toBeLessThanOrEqual(result.monthlyForecast.predicted);
      expect(result.monthlyForecast.high).toBeGreaterThanOrEqual(result.monthlyForecast.predicted);
    });

    it('should have confidence between 0-100', () => {
      const result = generateForecast(makeInput());
      expect(result.monthlyForecast.confidence).toBeGreaterThanOrEqual(0);
      expect(result.monthlyForecast.confidence).toBeLessThanOrEqual(100);
    });

    it('should include membership MRR', () => {
      const result = generateForecast(makeInput());
      expect(result.monthlyForecast.membershipMRR).toBeGreaterThan(0);
    });
  });

  describe('Weekly Targets', () => {
    it('should generate up to 5 weeks', () => {
      const result = generateForecast(makeInput());
      expect(result.weeklyTargets.length).toBeLessThanOrEqual(5);
      expect(result.weeklyTargets.length).toBeGreaterThan(0);
    });

    it('should have target > 0 for each week', () => {
      const result = generateForecast(makeInput());
      for (const week of result.weeklyTargets) {
        expect(week.target).toBeGreaterThan(0);
      }
    });

    it('should have valid date ranges', () => {
      const result = generateForecast(makeInput());
      for (const week of result.weeklyTargets) {
        expect(new Date(week.weekEnd).getTime()).toBeGreaterThan(new Date(week.weekStart).getTime());
      }
    });
  });

  describe('Daily Targets', () => {
    it('should generate 14 days of targets', () => {
      const result = generateForecast(makeInput());
      expect(result.dailyTargets.length).toBe(14);
    });

    it('should have valid status values', () => {
      const validStatuses = ['on-pace', 'behind', 'ahead', 'at-risk'];
      const result = generateForecast(makeInput());
      for (const day of result.dailyTargets) {
        expect(validStatuses).toContain(day.status);
      }
    });

    it('should have decreasing confidence for future days', () => {
      const result = generateForecast(makeInput());
      // First day should have higher confidence than last day
      expect(result.dailyTargets[0].confidence).toBeGreaterThan(result.dailyTargets[13].confidence);
    });

    it('should include day of week names', () => {
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const result = generateForecast(makeInput());
      for (const day of result.dailyTargets) {
        expect(validDays).toContain(day.dayOfWeek);
      }
    });
  });

  describe('Scenario Models', () => {
    it('should generate multiple scenarios', () => {
      const result = generateForecast(makeInput());
      expect(result.scenarioModels.length).toBeGreaterThanOrEqual(3);
    });

    it('should have all scenarios above baseline', () => {
      const result = generateForecast(makeInput());
      for (const scenario of result.scenarioModels) {
        expect(scenario.delta).toBeGreaterThan(0);
      }
    });

    it('should have valid feasibility levels', () => {
      const validLevels = ['high', 'moderate', 'aggressive'];
      const result = generateForecast(makeInput());
      for (const scenario of result.scenarioModels) {
        expect(validLevels).toContain(scenario.feasibility);
      }
    });

    it('should have annual = monthly * 12', () => {
      const result = generateForecast(makeInput());
      for (const scenario of result.scenarioModels) {
        expect(scenario.annualRevenue).toBe(Math.round(scenario.monthlyRevenue * 12));
      }
    });
  });

  describe('Goal Decomposition', () => {
    it('should have required appointments > 0', () => {
      const result = generateForecast(makeInput());
      expect(result.goalDecomposition.requiredAppointments).toBeGreaterThan(0);
    });

    it('should have a plan with steps', () => {
      const result = generateForecast(makeInput());
      expect(result.goalDecomposition.plan.length).toBeGreaterThan(0);
    });

    it('should have the correct monthly target', () => {
      const result = generateForecast(makeInput());
      expect(result.goalDecomposition.monthlyTarget).toBe(60000);
    });
  });

  describe('Leading Indicators', () => {
    it('should return multiple indicators', () => {
      const result = generateForecast(makeInput());
      expect(result.leadingIndicators.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid trend values', () => {
      const validTrends = ['up', 'down', 'stable'];
      const result = generateForecast(makeInput());
      for (const ind of result.leadingIndicators) {
        expect(validTrends).toContain(ind.trend);
      }
    });

    it('should have positive lag days', () => {
      const result = generateForecast(makeInput());
      for (const ind of result.leadingIndicators) {
        expect(ind.lagDays).toBeGreaterThan(0);
      }
    });
  });

  describe('Lagging Correlations', () => {
    it('should return correlations', () => {
      const result = generateForecast(makeInput());
      expect(result.laggingCorrelations.length).toBeGreaterThan(0);
    });

    it('should have correlation between -1 and 1', () => {
      const result = generateForecast(makeInput());
      for (const corr of result.laggingCorrelations) {
        expect(corr.correlation).toBeGreaterThanOrEqual(-1);
        expect(corr.correlation).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Monte Carlo Simulation', () => {
    it('should run 1000 simulations', () => {
      const result = generateForecast(makeInput());
      expect(result.confidenceIntervals.simulationRuns).toBe(1000);
    });

    it('should have percentiles in correct order', () => {
      const result = generateForecast(makeInput());
      const ci = result.confidenceIntervals;
      expect(ci.p10).toBeLessThanOrEqual(ci.p25);
      expect(ci.p25).toBeLessThanOrEqual(ci.p50);
      expect(ci.p50).toBeLessThanOrEqual(ci.p75);
      expect(ci.p75).toBeLessThanOrEqual(ci.p90);
    });

    it('should have positive standard deviation', () => {
      const result = generateForecast(makeInput());
      expect(result.confidenceIntervals.standardDeviation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cash Flow Projection', () => {
    it('should project 6 months', () => {
      const result = generateForecast(makeInput());
      expect(result.cashFlowProjection.length).toBe(6);
    });

    it('should have positive revenue for all months', () => {
      const result = generateForecast(makeInput());
      for (const month of result.cashFlowProjection) {
        expect(month.projectedRevenue).toBeGreaterThan(0);
      }
    });

    it('should have revenue > expenses (positive net)', () => {
      const result = generateForecast(makeInput());
      for (const month of result.cashFlowProjection) {
        expect(month.netCashFlow).toBeGreaterThan(0);
      }
    });

    it('should have increasing cumulative cash flow', () => {
      const result = generateForecast(makeInput());
      for (let i = 1; i < result.cashFlowProjection.length; i++) {
        expect(result.cashFlowProjection[i].cumulativeCashFlow).toBeGreaterThan(
          result.cashFlowProjection[i - 1].cumulativeCashFlow
        );
      }
    });
  });

  describe('Regression Factors', () => {
    it('should analyze multiple factors', () => {
      const result = generateForecast(makeInput());
      expect(result.regressionFactors.length).toBeGreaterThanOrEqual(3);
    });

    it('should sort by significance', () => {
      const result = generateForecast(makeInput());
      for (let i = 1; i < result.regressionFactors.length; i++) {
        expect(result.regressionFactors[i].significance).toBeLessThanOrEqual(
          result.regressionFactors[i - 1].significance
        );
      }
    });
  });

  describe('Summary', () => {
    it('should have today and week targets', () => {
      const result = generateForecast(makeInput());
      expect(result.summary.todayTarget).toBeGreaterThan(0);
      expect(result.summary.weekTarget).toBeGreaterThan(0);
    });

    it('should identify biggest opportunity and risk', () => {
      const result = generateForecast(makeInput());
      expect(result.summary.biggestOpportunity).toBeTruthy();
      expect(result.summary.biggestRisk).toBeTruthy();
    });

    it('should have month pace between 0-200', () => {
      const result = generateForecast(makeInput());
      expect(result.summary.monthPacePercent).toBeGreaterThanOrEqual(0);
      expect(result.summary.monthPacePercent).toBeLessThanOrEqual(200);
    });
  });
});
