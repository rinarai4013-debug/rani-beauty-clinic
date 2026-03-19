import { describe, it, expect } from 'vitest';
import { detectRevenueAnomalies, AnomalyInput } from '../revenue-anomaly';

function makeDailyRevenue(amounts: number[]): AnomalyInput['dailyRevenue'] {
  const now = new Date();
  return amounts.map((amount, i) => ({
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString().slice(0, 10),
    amount,
  }));
}

describe('detectRevenueAnomalies', () => {
  it('detects below-target revenue', () => {
    const result = detectRevenueAnomalies({
      dailyRevenue: makeDailyRevenue([4000, 4200, 3800, 4100, 3900, 4000, 4300]),
      todayRevenue: 2500, // 37.5% below $4000 target → critical
      targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    });

    const belowTarget = result.anomalies.find(a => a.type === 'below_target');
    expect(belowTarget).toBeDefined();
    expect(belowTarget!.severity).toBe('critical');
    expect(result.healthScore).toBeLessThan(100);
  });

  it('detects rolling average drop', () => {
    // 7-day avg is ~4000, today is 2000 → 50% drop → critical
    const result = detectRevenueAnomalies({
      dailyRevenue: makeDailyRevenue([4000, 4200, 3800, 4100, 3900, 4000, 4300]),
      todayRevenue: 2000,
      targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    });

    const rollingDrop = result.anomalies.find(a => a.type === 'rolling_avg_drop');
    expect(rollingDrop).toBeDefined();
    expect(rollingDrop!.severity).toBe('critical');
    expect(rollingDrop!.deviation).toBeLessThan(-40);
  });

  it('returns healthy result with no anomalies when revenue is on target', () => {
    const result = detectRevenueAnomalies({
      dailyRevenue: makeDailyRevenue([4000, 4100, 3900, 4050, 3950, 4000, 4100]),
      todayRevenue: 4000,
      targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    });

    expect(result.healthScore).toBe(100);
    expect(result.summary).toContain('healthy');
  });

  it('handles empty daily revenue array', () => {
    const result = detectRevenueAnomalies({
      dailyRevenue: [],
      todayRevenue: 3000,
      targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    });

    // Should not crash — rolling avg and DOW detection need data
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.anomalies).toBeDefined();
  });

  it('calculates projected month-end revenue', () => {
    const result = detectRevenueAnomalies({
      dailyRevenue: makeDailyRevenue([4000, 4000, 4000, 4000, 4000, 4000, 4000]),
      todayRevenue: 4000,
      targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    });

    expect(result.projectedMonthEnd).toBeGreaterThan(0);
  });
});
