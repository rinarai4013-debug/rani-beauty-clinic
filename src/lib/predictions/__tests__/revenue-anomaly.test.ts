// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectRevenueAnomalies, type AnomalyInput } from '../revenue-anomaly';

function makeDailyRevenue(amounts: number[]): AnomalyInput['dailyRevenue'] {
  const now = new Date();
  return amounts.map((amount, i) => ({
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString().slice(0, 10),
    amount,
  }));
}

function makeInput(overrides: Partial<AnomalyInput> = {}): AnomalyInput {
  return {
    dailyRevenue: makeDailyRevenue([4000, 4200, 3800, 4100, 3900, 4000, 4300]),
    todayRevenue: 4000,
    targets: { daily: 4000, weekly: 23000, monthly: 100000 },
    ...overrides,
  };
}

describe('Revenue Anomaly Detection Engine', () => {
  // ── Structure ──
  it('returns anomalies array, healthScore, summary, projectedMonthEnd', () => {
    const r = detectRevenueAnomalies(makeInput());
    expect(r).toHaveProperty('anomalies');
    expect(r).toHaveProperty('healthScore');
    expect(r).toHaveProperty('summary');
    expect(r).toHaveProperty('projectedMonthEnd');
  });

  it('healthScore is 0-100', () => {
    const r = detectRevenueAnomalies(makeInput());
    expect(r.healthScore).toBeGreaterThanOrEqual(0);
    expect(r.healthScore).toBeLessThanOrEqual(100);
  });

  // ── Target Deviation ──
  it('detects critical below-target (>= 30% below)', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 2500 }));
    const a = r.anomalies.find(a => a.type === 'below_target');
    expect(a).toBeDefined();
    expect(a!.severity).toBe('critical');
  });

  it('detects warning below-target (15-30% below)', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 3200 }));
    const a = r.anomalies.find(a => a.type === 'below_target');
    expect(a).toBeDefined();
    expect(a!.severity).toBe('warning');
  });

  it('detects above-target spike (50%+ above)', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 6500 }));
    const a = r.anomalies.find(a => a.type === 'above_target');
    expect(a).toBeDefined();
    expect(a!.severity).toBe('info');
  });

  it('no anomaly when revenue is on target', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 4000 }));
    const target = r.anomalies.find(a => a.type === 'below_target' || a.type === 'above_target');
    expect(target).toBeUndefined();
  });

  it('handles zero daily target', () => {
    const r = detectRevenueAnomalies(makeInput({
      targets: { daily: 0, weekly: 0, monthly: 0 },
    }));
    expect(r.anomalies.find(a => a.type === 'below_target')).toBeUndefined();
  });

  // ── Rolling Average (requires 5+ days now) ──
  it('detects critical rolling avg drop (>= 40% below)', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 2000 }));
    const a = r.anomalies.find(a => a.type === 'rolling_avg_drop');
    expect(a).toBeDefined();
    expect(a!.severity).toBe('critical');
  });

  it('skips rolling avg with fewer than 5 days of data', () => {
    const r = detectRevenueAnomalies(makeInput({
      dailyRevenue: makeDailyRevenue([4000, 4000, 4000]),
      todayRevenue: 1000,
    }));
    expect(r.anomalies.find(a => a.type === 'rolling_avg_drop')).toBeUndefined();
  });

  it('detects rolling avg spike', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 7000 }));
    const a = r.anomalies.find(a => a.type === 'rolling_avg_spike');
    expect(a).toBeDefined();
    expect(a!.severity).toBe('info');
  });

  // ── Provider Imbalance (fixed for 2 providers) ──
  it('does NOT flag 75% split with only 2 providers (threshold raised to 85%)', () => {
    const r = detectRevenueAnomalies(makeInput({
      byProvider: [
        { provider: 'Dr. Rina', revenue: 3000 },
        { provider: 'Mom', revenue: 1000 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'provider_imbalance')).toBeUndefined();
  });

  it('flags 90% split with 2 providers', () => {
    const r = detectRevenueAnomalies(makeInput({
      byProvider: [
        { provider: 'Dr. Rina', revenue: 9000 },
        { provider: 'Mom', revenue: 1000 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'provider_imbalance')).toBeDefined();
  });

  it('flags 80% split with 3+ providers', () => {
    const r = detectRevenueAnomalies(makeInput({
      byProvider: [
        { provider: 'Dr. Rina', revenue: 8000 },
        { provider: 'Mom', revenue: 1000 },
        { provider: 'Esthetician', revenue: 1000 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'provider_imbalance')).toBeDefined();
  });

  it('no imbalance with single provider', () => {
    const r = detectRevenueAnomalies(makeInput({
      byProvider: [{ provider: 'Dr. Rina', revenue: 4000 }],
    }));
    expect(r.anomalies.find(a => a.type === 'provider_imbalance')).toBeUndefined();
  });

  // ── Financing Spike ──
  it('detects financing spike (40%+ of transactions)', () => {
    const r = detectRevenueAnomalies(makeInput({
      byPaymentMethod: [
        { method: 'Cherry', amount: 2000, count: 5 },
        { method: 'Card', amount: 3000, count: 5 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'financing_spike')).toBeDefined();
  });

  it('no financing spike below 40%', () => {
    const r = detectRevenueAnomalies(makeInput({
      byPaymentMethod: [
        { method: 'Cherry', amount: 500, count: 1 },
        { method: 'Card', amount: 5000, count: 10 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'financing_spike')).toBeUndefined();
  });

  it('skips financing check with fewer than 3 transactions', () => {
    const r = detectRevenueAnomalies(makeInput({
      byPaymentMethod: [
        { method: 'Cherry', amount: 1000, count: 2 },
      ],
    }));
    expect(r.anomalies.find(a => a.type === 'financing_spike')).toBeUndefined();
  });

  // ── Health Score ──
  it('perfect health when no anomalies', () => {
    const r = detectRevenueAnomalies(makeInput());
    expect(r.healthScore).toBe(100);
    expect(r.summary).toContain('healthy');
  });

  it('health score deducted for critical anomalies', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 2000 }));
    expect(r.healthScore).toBeLessThan(100);
  });

  // ── Projections ──
  it('projects month-end revenue > 0', () => {
    const r = detectRevenueAnomalies(makeInput());
    expect(r.projectedMonthEnd).toBeGreaterThan(0);
  });

  // ── Edge Cases ──
  it('handles empty dailyRevenue', () => {
    const r = detectRevenueAnomalies(makeInput({ dailyRevenue: [] }));
    expect(r.healthScore).toBeGreaterThanOrEqual(0);
  });

  it('handles zero todayRevenue', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 0 }));
    expect(r.anomalies.find(a => a.type === 'below_target')).toBeDefined();
  });

  it('summary mentions critical alerts when present', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 2000 }));
    expect(r.summary).toContain('critical');
  });

  it('summary mentions warnings when present', () => {
    const r = detectRevenueAnomalies(makeInput({ todayRevenue: 3200 }));
    expect(r.summary).toContain('warning');
  });
});
