import { describe, it, expect } from 'vitest';
import {
  calculateMRR,
  calculateARR,
  calculateNRR,
  calculateLTV,
  calculateCAC,
  calculateLTVCACRatio,
  calculatePaybackPeriod,
  calculateLogoChurn,
  calculateRevenueChurn,
  calculateNetRevenueChurn,
  buildCohortData,
  calculateRevenueBreakdown,
  calculateCACByChannel,
  calculateQuickRatio,
  interpretQuickRatio,
  calculateRunway,
  calculateSegmentRevenue,
  computeSaaSMetrics,
  formatCurrency,
  formatPercentage,
  formatCompact,
} from '../analytics-dashboard';

// ─── MRR / ARR ────────────────────────────────────────────────────

describe('MRR Calculation', () => {
  it('calculates MRR from monthly subscriptions', () => {
    const subs = [
      { plan: 'starter', billingCycle: 'monthly' as const, status: 'active', monthlyPrice: 199, annualPrice: 1990, addOnMRR: 0 },
      { plan: 'professional', billingCycle: 'monthly' as const, status: 'active', monthlyPrice: 499, annualPrice: 4990, addOnMRR: 0 },
    ];
    expect(calculateMRR(subs)).toBe(698);
  });

  it('calculates MRR from annual subscriptions', () => {
    const subs = [
      { plan: 'enterprise', billingCycle: 'annual' as const, status: 'active', monthlyPrice: 999, annualPrice: 9990, addOnMRR: 0 },
    ];
    expect(calculateMRR(subs)).toBeCloseTo(832.5, 0);
  });

  it('includes add-on MRR', () => {
    const subs = [
      { plan: 'professional', billingCycle: 'monthly' as const, status: 'active', monthlyPrice: 499, annualPrice: 4990, addOnMRR: 50 },
    ];
    expect(calculateMRR(subs)).toBe(549);
  });

  it('excludes cancelled subscriptions', () => {
    const subs = [
      { plan: 'starter', billingCycle: 'monthly' as const, status: 'cancelled', monthlyPrice: 199, annualPrice: 1990, addOnMRR: 0 },
    ];
    expect(calculateMRR(subs)).toBe(0);
  });

  it('includes trialing subscriptions', () => {
    const subs = [
      { plan: 'starter', billingCycle: 'monthly' as const, status: 'trialing', monthlyPrice: 199, annualPrice: 1990, addOnMRR: 0 },
    ];
    expect(calculateMRR(subs)).toBe(199);
  });
});

describe('ARR', () => {
  it('is MRR * 12', () => {
    expect(calculateARR(5000)).toBe(60000);
    expect(calculateARR(0)).toBe(0);
  });
});

// ─── Net Revenue Retention ────────────────────────────────────────

describe('NRR', () => {
  it('returns 100% with no changes', () => {
    expect(calculateNRR(10000, 0, 0, 0)).toBe(100);
  });

  it('returns > 100% with expansion', () => {
    expect(calculateNRR(10000, 2000, 500, 500)).toBe(110);
  });

  it('returns < 100% with churn', () => {
    expect(calculateNRR(10000, 0, 500, 2000)).toBe(75);
  });

  it('returns 0 for zero starting MRR', () => {
    expect(calculateNRR(0, 100, 0, 0)).toBe(0);
  });
});

// ─── LTV / CAC ────────────────────────────────────────────────────

describe('LTV', () => {
  it('calculates with default margin', () => {
    const ltv = calculateLTV(500, 12);
    expect(ltv).toBe(4800); // 500 * 12 * 0.8
  });

  it('calculates with custom margin', () => {
    const ltv = calculateLTV(500, 12, 90);
    expect(ltv).toBe(5400);
  });
});

describe('CAC', () => {
  it('calculates correctly', () => {
    expect(calculateCAC(10000, 20)).toBe(500);
  });

  it('returns 0 for no customers', () => {
    expect(calculateCAC(10000, 0)).toBe(0);
  });
});

describe('LTV:CAC Ratio', () => {
  it('calculates correctly', () => {
    expect(calculateLTVCACRatio(6000, 2000)).toBe(3);
  });

  it('returns 0 for zero CAC', () => {
    expect(calculateLTVCACRatio(6000, 0)).toBe(0);
  });
});

describe('Payback Period', () => {
  it('calculates correctly', () => {
    expect(calculatePaybackPeriod(1000, 500)).toBe(2);
  });

  it('returns Infinity for zero MRR', () => {
    expect(calculatePaybackPeriod(1000, 0)).toBe(Infinity);
  });
});

// ─── Churn Rates ──────────────────────────────────────────────────

describe('Churn Rates', () => {
  it('calculates logo churn', () => {
    expect(calculateLogoChurn(5, 100)).toBe(5);
  });

  it('calculates revenue churn', () => {
    expect(calculateRevenueChurn(500, 10000)).toBe(5);
  });

  it('calculates net revenue churn', () => {
    const netChurn = calculateNetRevenueChurn(500, 300, 10000);
    expect(netChurn).toBe(2); // (500-300)/10000 = 2%
  });

  it('net churn can be negative (expansion > churn)', () => {
    const netChurn = calculateNetRevenueChurn(200, 500, 10000);
    expect(netChurn).toBeLessThan(0);
  });

  it('returns 0 for zero starting values', () => {
    expect(calculateLogoChurn(0, 0)).toBe(0);
    expect(calculateRevenueChurn(0, 0)).toBe(0);
  });
});

// ─── Cohort Analysis ──────────────────────────────────────────────

describe('Cohort Analysis', () => {
  it('builds cohort from customer data', () => {
    const customers = [
      { id: '1', signupMonth: '2026-01', active: true, monthlyRevenue: [0, 499, 499, 499] },
      { id: '2', signupMonth: '2026-01', active: false, cancelledMonth: '2026-03', monthlyRevenue: [0, 499, 499] },
      { id: '3', signupMonth: '2026-02', active: true, monthlyRevenue: [0, 199, 199] },
    ];

    const cohorts = buildCohortData(customers);
    expect(cohorts).toHaveLength(2);
    expect(cohorts[0].cohort).toBe('2026-01');
    expect(cohorts[0].signups).toBe(2);
    expect(cohorts[0].retention[0]).toBe(100);
  });

  it('calculates avg LTV per cohort', () => {
    const customers = [
      { id: '1', signupMonth: '2026-01', active: true, monthlyRevenue: [0, 499, 499, 499] },
    ];
    const cohorts = buildCohortData(customers);
    expect(cohorts[0].avgLTV).toBeGreaterThan(0);
  });
});

// ─── Revenue Breakdown ────────────────────────────────────────────

describe('Revenue Breakdown', () => {
  it('calculates monthly breakdown', () => {
    const events = [
      { type: 'new' as const, month: '2026-01', mrr: 1000 },
      { type: 'expansion' as const, month: '2026-01', mrr: 200 },
      { type: 'churn' as const, month: '2026-01', mrr: 100 },
      { type: 'new' as const, month: '2026-02', mrr: 800 },
    ];

    const breakdown = calculateRevenueBreakdown(events, 5000);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].netNewMRR).toBe(1100);
    expect(breakdown[0].totalMRR).toBe(6100);
  });

  it('accumulates MRR across months', () => {
    const events = [
      { type: 'new' as const, month: '2026-01', mrr: 500 },
      { type: 'new' as const, month: '2026-02', mrr: 300 },
    ];

    const breakdown = calculateRevenueBreakdown(events, 1000);
    expect(breakdown[1].totalMRR).toBe(1800);
  });
});

// ─── CAC by Channel ───────────────────────────────────────────────

describe('CAC by Channel', () => {
  it('calculates per-channel metrics', () => {
    const channels = [
      { channel: 'Google Ads', spend: 5000, leads: 100, customers: 10 },
      { channel: 'Organic', spend: 0, leads: 200, customers: 20 },
    ];

    const result = calculateCACByChannel(channels, 5000);
    expect(result).toHaveLength(2);
    expect(result[0].cac).toBe(500);
    expect(result[1].cac).toBe(0);
    expect(result[0].conversionRate).toBe(10);
    expect(result[1].conversionRate).toBe(10);
  });

  it('calculates ROI', () => {
    const channels = [
      { channel: 'Ads', spend: 1000, leads: 50, customers: 5 },
    ];
    const result = calculateCACByChannel(channels, 3000);
    expect(result[0].roi).toBeGreaterThan(0);
  });
});

// ─── Quick Ratio ──────────────────────────────────────────────────

describe('Quick Ratio', () => {
  it('calculates correctly', () => {
    expect(calculateQuickRatio(3000, 1000, 500, 500, 500)).toBe(4.5);
  });

  it('returns Infinity for no losses', () => {
    expect(calculateQuickRatio(1000, 500, 0, 0, 0)).toBe(Infinity);
  });

  it('interprets quick ratio grades', () => {
    expect(interpretQuickRatio(5).grade).toBe('excellent');
    expect(interpretQuickRatio(3).grade).toBe('good');
    expect(interpretQuickRatio(1.5).grade).toBe('needs_improvement');
    expect(interpretQuickRatio(0.5).grade).toBe('poor');
  });
});

// ─── Runway ───────────────────────────────────────────────────────

describe('Runway', () => {
  it('calculates runway months', () => {
    const result = calculateRunway(100000, 20000, 10000);
    expect(result.netBurn).toBe(10000);
    expect(result.runwayMonths).toBe(10);
  });

  it('returns Infinity when profitable', () => {
    const result = calculateRunway(50000, 10000, 15000);
    expect(result.runwayMonths).toBe(Infinity);
  });

  it('sets profitableDate when already profitable', () => {
    const result = calculateRunway(50000, 10000, 15000);
    expect(result.profitableDate).toContain('profitable');
  });
});

// ─── Segment Revenue ──────────────────────────────────────────────

describe('Segment Revenue', () => {
  it('calculates per-segment metrics', () => {
    const customers = [
      { segment: 'small', mrr: 199, active: true, monthsActive: 6 },
      { segment: 'small', mrr: 199, active: true, monthsActive: 3 },
      { segment: 'medium', mrr: 499, active: true, monthsActive: 12 },
      { segment: 'medium', mrr: 0, active: false, monthsActive: 2 },
    ];

    const result = calculateSegmentRevenue(customers);
    expect(result).toHaveLength(2);

    const small = result.find((s) => s.segment === 'small');
    expect(small?.customerCount).toBe(2);
    expect(small?.mrr).toBe(398);
  });

  it('calculates churn rate per segment', () => {
    const customers = [
      { segment: 'test', mrr: 199, active: true, monthsActive: 6 },
      { segment: 'test', mrr: 0, active: false, monthsActive: 2 },
    ];
    const result = calculateSegmentRevenue(customers);
    expect(result[0].churnRate).toBe(50);
  });
});

// ─── Complete Metrics ─────────────────────────────────────────────

describe('computeSaaSMetrics', () => {
  it('returns complete metrics object', () => {
    const metrics = computeSaaSMetrics({
      subscriptions: [
        { plan: 'professional', billingCycle: 'monthly', status: 'active', monthlyPrice: 499, annualPrice: 4990, addOnMRR: 0 },
      ],
      customersLost: 1,
      startingCustomers: 10,
      startingMRR: 4990,
      mrrLost: 499,
      expansionMRR: 200,
      contractionMRR: 100,
      reactivationMRR: 0,
      totalAcquisitionCost: 5000,
      newCustomers: 2,
      avgLifetimeMonths: 12,
      visitors: 10000,
      leads: 500,
      trials: 50,
      avgSalesCycleDays: 14,
    });

    expect(metrics.mrr).toBeDefined();
    expect(metrics.arr).toBeDefined();
    expect(metrics.netRevenueRetention).toBeDefined();
    expect(metrics.ltv).toBeDefined();
    expect(metrics.cac).toBeDefined();
    expect(metrics.ltvCacRatio).toBeDefined();
    expect(metrics.churn).toBeDefined();
    expect(metrics.expansion).toBeDefined();
    expect(metrics.funnel).toBeDefined();
    expect(metrics.quickRatio).toBeDefined();
    expect(metrics.calculatedAt).toBeDefined();
  });
});

// ─── Formatting ───────────────────────────────────────────────────

describe('Formatting', () => {
  it('formatCurrency formats correctly', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formatPercentage includes sign', () => {
    expect(formatPercentage(5)).toBe('+5%');
    expect(formatPercentage(-3)).toBe('-3%');
  });

  it('formatCompact uses K and M', () => {
    expect(formatCompact(500)).toBe('$500');
    expect(formatCompact(5000)).toBe('$5.0K');
    expect(formatCompact(1500000)).toBe('$1.5M');
  });
});
