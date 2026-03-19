import { describe, it, expect } from 'vitest';
import {
  generateFinancialIntelligence,
  categorizeExpense,
  FinanceInput,
  RevenueEntry,
  ExpenseEntry,
} from '../pnl-engine';

function makeRevenue(overrides: Partial<RevenueEntry> = {}): RevenueEntry {
  return {
    date: '2026-03-01',
    amount: 500,
    service: 'HydraFacial',
    category: 'Facial',
    provider: 'Dr. Rina',
    paymentMethod: 'card',
    clientType: 'returning',
    ...overrides,
  };
}

function makeExpense(overrides: Partial<ExpenseEntry> = {}): ExpenseEntry {
  return {
    date: '2026-03-01',
    amount: 100,
    vendor: 'Generic Vendor',
    description: 'Misc purchase',
    ...overrides,
  };
}

function makeInput(overrides: Partial<FinanceInput> = {}): FinanceInput {
  return {
    revenue: [
      makeRevenue({ amount: 1000, service: 'HydraFacial' }),
      makeRevenue({ amount: 800, service: 'Botox', category: 'Injectable' }),
      makeRevenue({ amount: 500, service: 'VI Peel' }),
    ],
    expenses: [
      makeExpense({ amount: 500, vendor: 'Payroll', description: 'Staff salary', category: 'payroll' }),
      makeExpense({ amount: 300, vendor: 'Landlord', description: 'Monthly rent', category: 'rent' }),
      makeExpense({ amount: 200, vendor: 'Allergan', description: 'Botox supply', category: 'supplies' }),
    ],
    period: { start: '2026-03-01', end: '2026-03-31' },
    memberships: { count: 10, monthlyRevenue: 2000 },
    ...overrides,
  };
}

describe('generateFinancialIntelligence', () => {
  it('calculates profit margin correctly with normal revenue and expenses', () => {
    const result = generateFinancialIntelligence(makeInput());

    // Total revenue = service revenue (1000+800+500=2300) + membership (2000) = 4300
    expect(result.pnl.revenue.total).toBeGreaterThan(0);
    expect(result.pnl.grossProfit).toBeDefined();
    expect(result.pnl.grossMargin).toBeGreaterThanOrEqual(0);
    expect(result.pnl.grossMargin).toBeLessThanOrEqual(100);
    expect(result.pnl.netMargin).toBeDefined();

    // Net income = gross profit - operating expenses
    const expectedNet = result.pnl.grossProfit - result.pnl.operatingExpenses.total;
    expect(result.pnl.netIncome).toBe(expectedNet);
  });

  it('handles zero revenue without dividing by zero', () => {
    const result = generateFinancialIntelligence(makeInput({
      revenue: [],
      memberships: { count: 0, monthlyRevenue: 0 },
    }));

    expect(result.pnl.revenue.total).toBe(0);
    expect(result.pnl.grossMargin).toBe(0);
    expect(result.pnl.netMargin).toBe(0);
    expect(Number.isFinite(result.pnl.grossMargin)).toBe(true);
    expect(Number.isFinite(result.pnl.netMargin)).toBe(true);
  });

  it('returns a financial health score between 0 and 100', () => {
    const result = generateFinancialIntelligence(makeInput());

    expect(result.healthScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.healthScore.overall).toBeLessThanOrEqual(100);

    // Each component should also be in range
    const { profitability, growth, efficiency, stability, cashPosition } = result.healthScore.components;
    for (const score of [profitability, growth, efficiency, stability, cashPosition]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('categorizeExpense', () => {
  it('categorizes Allergan Botox supply as "supplies"', () => {
    const result = categorizeExpense({
      date: '2026-03-01',
      amount: 1500,
      vendor: 'Allergan',
      description: 'Botox 200 units',
    });
    expect(result).toBe('supplies');
  });

  it('categorizes Google Ads as "marketing"', () => {
    const result = categorizeExpense({
      date: '2026-03-01',
      amount: 500,
      vendor: 'Google',
      description: 'Google Ads campaign March',
    });
    expect(result).toBe('marketing');
  });

  it('categorizes unknown vendor as "misc"', () => {
    const result = categorizeExpense({
      date: '2026-03-01',
      amount: 50,
      vendor: 'Random Shop',
      description: 'Office decorations',
    });
    expect(result).toBe('misc');
  });

  it('respects pre-assigned category', () => {
    const result = categorizeExpense({
      date: '2026-03-01',
      amount: 200,
      vendor: 'Some Vendor',
      description: 'Something',
      category: 'equipment',
    });
    expect(result).toBe('equipment');
  });
});
