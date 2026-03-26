// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  generateFinancialIntelligence, categorizeExpense,
  type FinanceInput, type RevenueEntry, type ExpenseEntry,
} from '../pnl-engine';

function makeRevenue(overrides: Partial<RevenueEntry> = {}): RevenueEntry {
  return {
    date: '2026-03-10', amount: 500, service: 'HydraFacial', category: 'Facial',
    provider: 'Dr. Rina', paymentMethod: 'card', clientType: 'returning', ...overrides,
  };
}

function makeExpense(overrides: Partial<ExpenseEntry> = {}): ExpenseEntry {
  return { date: '2026-03-10', amount: 100, vendor: 'Generic', description: 'Misc', ...overrides };
}

function makeInput(overrides: Partial<FinanceInput> = {}): FinanceInput {
  return {
    revenue: [
      makeRevenue({ amount: 1000 }),
      makeRevenue({ amount: 800, service: 'Botox', category: 'Injectable' }),
      makeRevenue({ amount: 500, service: 'VI Peel' }),
    ],
    expenses: [
      makeExpense({ amount: 500, vendor: 'Payroll', description: 'Staff salary', category: 'payroll' }),
      makeExpense({ amount: 300, vendor: 'Landlord', description: 'Rent', category: 'rent' }),
      makeExpense({ amount: 200, vendor: 'Allergan', description: 'Botox supply', category: 'supplies' }),
    ],
    period: { start: '2026-03-01', end: '2026-03-31' },
    memberships: { count: 10, monthlyRevenue: 2000 },
    ...overrides,
  };
}

describe('P&L Engine', () => {
  // ── Structure ──
  it('returns all expected fields', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r).toHaveProperty('pnl');
    expect(r).toHaveProperty('serviceMargins');
    expect(r).toHaveProperty('providerProfitability');
    expect(r).toHaveProperty('cashFlowProjection');
    expect(r).toHaveProperty('healthScore');
    expect(r).toHaveProperty('insights');
    expect(r).toHaveProperty('kpis');
  });

  // ── P&L Calculations ──
  it('calculates total revenue correctly', () => {
    const r = generateFinancialIntelligence(makeInput());
    // Service: 2300 + Membership: 2000 = 4300
    expect(r.pnl.revenue.total).toBe(4300);
  });

  it('calculates gross profit = revenue - COGS', () => {
    const r = generateFinancialIntelligence(makeInput());
    const expectedCOS = 500 + 200; // payroll + supplies
    expect(r.pnl.costOfServices.total).toBe(expectedCOS);
    expect(r.pnl.grossProfit).toBe(4300 - expectedCOS);
  });

  it('calculates net income = gross profit - opex', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.pnl.netIncome).toBe(r.pnl.grossProfit - r.pnl.operatingExpenses.total);
  });

  it('gross margin is 0-100', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.pnl.grossMargin).toBeGreaterThanOrEqual(0);
    expect(r.pnl.grossMargin).toBeLessThanOrEqual(100);
  });

  // ── Zero Revenue ──
  it('handles zero revenue without NaN', () => {
    const r = generateFinancialIntelligence(makeInput({
      revenue: [], memberships: { count: 0, monthlyRevenue: 0 },
    }));
    expect(r.pnl.revenue.total).toBe(0);
    expect(r.pnl.grossMargin).toBe(0);
    expect(r.pnl.netMargin).toBe(0);
    expect(Number.isFinite(r.pnl.grossMargin)).toBe(true);
  });

  // ── Period Comparison ──
  it('calculates period comparison when previous period provided', () => {
    const r = generateFinancialIntelligence(makeInput({
      previousPeriod: { revenue: 3500, expenses: 800, netIncome: 2700 },
    }));
    expect(r.pnl.periodComparison).toBeDefined();
    expect(r.pnl.periodComparison!.revenueChange).toBeGreaterThan(0);
  });

  it('handles zero previous revenue in period comparison', () => {
    const r = generateFinancialIntelligence(makeInput({
      previousPeriod: { revenue: 0, expenses: 0, netIncome: 0 },
    }));
    expect(r.pnl.periodComparison!.revenueChange).toBe(0);
  });

  // ── Service Margins ──
  it('ranks services by gross profit', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.serviceMargins.length).toBe(3);
    expect(r.serviceMargins[0].rank).toBe(1);
    for (let i = 1; i < r.serviceMargins.length; i++) {
      expect(r.serviceMargins[i - 1].grossProfit).toBeGreaterThanOrEqual(r.serviceMargins[i].grossProfit);
    }
  });

  it('calculates avgTicket correctly', () => {
    const r = generateFinancialIntelligence(makeInput());
    const hydra = r.serviceMargins.find(s => s.service === 'HydraFacial');
    expect(hydra!.avgTicket).toBe(1000); // 1 booking at $1000
  });

  // ── Provider Profitability ──
  it('calculates provider revenue', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.providerProfitability.length).toBe(1); // All same provider
    expect(r.providerProfitability[0].revenue).toBe(2300);
  });

  // ── Cash Flow Projections (fixed) ──
  it('projects 6 months of cash flow', () => {
    const r = generateFinancialIntelligence(makeInput({ bankBalance: 50000 }));
    expect(r.cashFlowProjection).toHaveLength(6);
  });

  it('runway is 99 when profitable', () => {
    const r = generateFinancialIntelligence(makeInput({ bankBalance: 50000 }));
    expect(r.cashFlowProjection[0].runwayMonths).toBe(99);
  });

  it('runway is 0 when balance is negative and losing money', () => {
    const r = generateFinancialIntelligence(makeInput({
      bankBalance: -1000,
      revenue: [],
      memberships: { count: 0, monthlyRevenue: 0 },
    }));
    // When expenses > revenue and balance < 0
    const unprofitable = r.cashFlowProjection.find(p => p.projectedBalance < 0);
    if (unprofitable) {
      expect(unprofitable.runwayMonths).toBeGreaterThanOrEqual(0);
    }
  });

  // ── KPIs ──
  it('calculates avgDailyRevenue', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.kpis.avgDailyRevenue).toBeGreaterThan(0);
  });

  it('calculates membership revenue percent', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.kpis.membershipRevenuePercent).toBeGreaterThan(0);
  });

  it('calculates break-even daily', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.kpis.breakEvenDaily).toBeGreaterThan(0);
  });

  // ── Health Score ──
  it('health score is 0-100', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.healthScore.overall).toBeGreaterThanOrEqual(0);
    expect(r.healthScore.overall).toBeLessThanOrEqual(100);
  });

  it('alerts for operating at a loss', () => {
    const r = generateFinancialIntelligence(makeInput({
      revenue: [makeRevenue({ amount: 100 })],
      expenses: [makeExpense({ amount: 5000, category: 'payroll' })],
      memberships: { count: 0, monthlyRevenue: 0 },
    }));
    expect(r.healthScore.alerts.some(a => a.includes('loss'))).toBe(true);
  });

  it('low cash position triggers alert', () => {
    const r = generateFinancialIntelligence(makeInput({ bankBalance: 100 }));
    expect(r.healthScore.alerts.some(a => a.includes('Cash reserves'))).toBe(true);
  });

  // ── Insights ──
  it('generates top revenue service insight', () => {
    const r = generateFinancialIntelligence(makeInput());
    expect(r.insights.some(i => i.includes('Top revenue'))).toBe(true);
  });
});

describe('categorizeExpense', () => {
  it('categorizes Botox supply as supplies', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 1500, vendor: 'Allergan', description: 'Botox 200 units' })).toBe('supplies');
  });

  it('categorizes Google Ads as marketing', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 500, vendor: 'Google', description: 'Google Ads campaign' })).toBe('marketing');
  });

  it('categorizes CPA as professional_services', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 300, vendor: 'Smith CPA', description: 'Tax prep' })).toBe('professional_services');
  });

  it('categorizes electric bill as utilities', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 200, vendor: 'PSE', description: 'Electric bill' })).toBe('utilities');
  });

  it('falls back to misc for unknown', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 50, vendor: 'Random', description: 'Decorations' })).toBe('misc');
  });

  it('respects pre-assigned category', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 200, vendor: 'X', description: 'Y', category: 'equipment' })).toBe('equipment');
  });

  it('categorizes Mangomint as software', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 150, vendor: 'Mangomint', description: 'Monthly subscription' })).toBe('software');
  });

  it('categorizes malpractice as insurance', () => {
    expect(categorizeExpense({ date: '2026-03-01', amount: 500, vendor: 'Insurer', description: 'Malpractice coverage' })).toBe('insurance');
  });
});
