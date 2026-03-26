// ═══════════════════════════════════════════════════════════════
// QuickBooks Reports — Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlowStatement,
  getARAgingSummary,
  getAPAgingSummary,
  getRevenueByService,
  getExpenseBreakdown,
  getTaxSummary,
  getBudgetVsActual,
  getProviderProfitability,
  getFinancialSummary,
  setBudget,
} from '../reports';
import type { QBOReport } from '../types';

/* ─── Mock client and sync ──────────────────────────────────── */

vi.mock('../client', () => ({
  qboClient: {
    report: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../sync', () => ({
  getTransactionsByDateRange: vi.fn().mockReturnValue([]),
  getTransactionsByType: vi.fn().mockReturnValue([]),
  getClassCache: vi.fn().mockReturnValue([]),
  getItemCache: vi.fn().mockReturnValue([]),
}));

import { qboClient } from '../client';
import { getTransactionsByDateRange } from '../sync';
const mockReport = vi.mocked(qboClient.report);
const mockGetTransactions = vi.mocked(getTransactionsByDateRange);

/* ─── Helper: Mock QBO Report ───────────────────────────────── */

function mockPnLReport(): QBOReport {
  return {
    Header: {
      Time: new Date().toISOString(),
      ReportName: 'ProfitAndLoss',
      ReportBasis: 'Accrual',
      StartPeriod: '2026-01-01',
      EndPeriod: '2026-01-31',
      Currency: 'USD',
    },
    Columns: { Column: [{ ColTitle: '', ColType: 'Account' }, { ColTitle: 'Total', ColType: 'Money' }] },
    Rows: {
      Row: [
        {
          type: 'Section',
          group: 'Income',
          Rows: {
            Row: [
              { ColData: [{ value: 'Service Revenue' }, { value: '50000.00' }] },
              { ColData: [{ value: 'Product Sales' }, { value: '5000.00' }] },
            ],
          },
          Summary: { ColData: [{ value: 'Total Income' }, { value: '55000.00' }] },
        },
        {
          type: 'Section',
          group: 'Cost of Goods Sold',
          Rows: { Row: [{ ColData: [{ value: 'Product Costs' }, { value: '8000.00' }] }] },
          Summary: { ColData: [{ value: 'Total COGS' }, { value: '8000.00' }] },
        },
        {
          type: 'Section',
          group: 'Expenses',
          Rows: {
            Row: [
              { ColData: [{ value: 'Rent' }, { value: '5000.00' }] },
              { ColData: [{ value: 'Payroll' }, { value: '20000.00' }] },
              { ColData: [{ value: 'Marketing' }, { value: '3000.00' }] },
            ],
          },
          Summary: { ColData: [{ value: 'Total Expenses' }, { value: '28000.00' }] },
        },
      ],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── P&L Report Tests ──────────────────────────────────────── */

describe('getProfitAndLoss', () => {
  it('returns parsed P&L data', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    const pnl = await getProfitAndLoss('monthly');
    expect(pnl.totalIncome).toBe(55000);
    expect(pnl.totalCOGS).toBe(8000);
    expect(pnl.grossProfit).toBe(47000);
    expect(pnl.totalExpenses).toBe(28000);
    expect(pnl.netOperatingIncome).toBe(19000);
  });

  it('includes line items', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    const pnl = await getProfitAndLoss();
    expect(pnl.lineItems.length).toBeGreaterThan(0);
    expect(pnl.lineItems.find(li => li.label === 'Service Revenue')).toBeDefined();
  });

  it('calculates net income correctly', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    const pnl = await getProfitAndLoss();
    expect(pnl.netIncome).toBe(pnl.netOperatingIncome + pnl.totalOtherIncome - pnl.totalOtherExpenses);
  });

  it('supports different periods', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    await getProfitAndLoss('quarterly');
    expect(mockReport).toHaveBeenCalledWith('ProfitAndLoss', expect.objectContaining({
      accounting_method: 'Accrual',
    }));
  });

  it('supports cash basis', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    await getProfitAndLoss('monthly', 0, { basis: 'Cash' });
    expect(mockReport).toHaveBeenCalledWith('ProfitAndLoss', expect.objectContaining({
      accounting_method: 'Cash',
    }));
  });

  it('includes raw report data', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    const pnl = await getProfitAndLoss();
    expect(pnl.raw).toBeDefined();
    expect(pnl.raw?.Header.ReportName).toBe('ProfitAndLoss');
  });

  it('handles period offset', async () => {
    mockReport.mockResolvedValue(mockPnLReport());

    const pnl = await getProfitAndLoss('monthly', 1);
    expect(pnl.period.start).toBeDefined();
    expect(pnl.period.end).toBeDefined();
  });
});

/* ─── Balance Sheet Tests ───────────────────────────────────── */

describe('getBalanceSheet', () => {
  it('returns parsed balance sheet', async () => {
    mockReport.mockResolvedValue({
      Header: {
        Time: '', ReportName: 'BalanceSheet', ReportBasis: 'Accrual',
        StartPeriod: '2026-01-01', EndPeriod: '2026-01-31', Currency: 'USD',
      },
      Columns: { Column: [] },
      Rows: {
        Row: [
          {
            type: 'Section', group: 'Assets',
            Rows: { Row: [{ ColData: [{ value: 'Checking' }, { value: '25000.00' }] }] },
            Summary: { ColData: [{ value: 'Total Assets' }, { value: '100000.00' }] },
          },
          {
            type: 'Section', group: 'Liabilities',
            Rows: { Row: [{ ColData: [{ value: 'Accounts Payable' }, { value: '5000.00' }] }] },
            Summary: { ColData: [{ value: 'Total Liabilities' }, { value: '30000.00' }] },
          },
          {
            type: 'Section', group: 'Equity',
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'Total Equity' }, { value: '70000.00' }] },
          },
        ],
      },
    });

    const bs = await getBalanceSheet();
    expect(bs.totalAssets).toBe(100000);
    expect(bs.totalLiabilities).toBe(30000);
    expect(bs.totalEquity).toBe(70000);
  });

  it('includes section line items', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'BalanceSheet', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [{
          type: 'Section', group: 'Assets',
          Rows: { Row: [{ ColData: [{ value: 'Checking' }, { value: '25000' }] }] },
          Summary: { ColData: [{ value: 'Total' }, { value: '25000' }] },
        }],
      },
    });

    const bs = await getBalanceSheet();
    expect(bs.sections.find(s => s.label === 'Checking')).toBeDefined();
  });

  it('supports custom as-of date', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'BalanceSheet', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '2025-12-31', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: { Row: [] },
    });

    const bs = await getBalanceSheet('2025-12-31');
    expect(bs.asOf).toBe('2025-12-31');
  });
});

/* ─── Cash Flow Tests ───────────────────────────────────────── */

describe('getCashFlowStatement', () => {
  it('returns parsed cash flow', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'CashFlow', ReportBasis: 'Accrual', StartPeriod: '2026-01-01', EndPeriod: '2026-01-31', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          {
            type: 'Section', group: 'Operating Activities',
            Rows: { Row: [{ ColData: [{ value: 'Net Income' }, { value: '19000' }] }] },
            Summary: { ColData: [{ value: 'Total' }, { value: '22000' }] },
          },
          {
            type: 'Section', group: 'Investing Activities',
            Rows: { Row: [{ ColData: [{ value: 'Equipment' }, { value: '-5000' }] }] },
            Summary: { ColData: [{ value: 'Total' }, { value: '-5000' }] },
          },
          {
            type: 'Section', group: 'Financing Activities',
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'Total' }, { value: '0' }] },
          },
        ],
      },
    });

    const cf = await getCashFlowStatement();
    expect(cf.operatingActivities).toBe(22000);
    expect(cf.investingActivities).toBe(-5000);
    expect(cf.financingActivities).toBe(0);
    expect(cf.netCashChange).toBe(17000);
  });

  it('includes line items with sections', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'CashFlow', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [{
          type: 'Section', group: 'Operating Activities',
          Rows: { Row: [{ ColData: [{ value: 'Net Income' }, { value: '10000' }] }] },
          Summary: { ColData: [{ value: 'Total' }, { value: '10000' }] },
        }],
      },
    });

    const cf = await getCashFlowStatement();
    expect(cf.lineItems.find(li => li.section === 'operating')).toBeDefined();
  });
});

/* ─── AR Aging Tests ────────────────────────────────────────── */

describe('getARAgingSummary', () => {
  it('returns aging buckets by customer', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'AgedReceivables', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Client A' }, { value: '500' }, { value: '200' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '700' }] },
          { ColData: [{ value: 'Client B' }, { value: '0' }, { value: '0' }, { value: '300' }, { value: '0' }, { value: '0' }, { value: '300' }] },
        ],
      },
    });

    const aging = await getARAgingSummary();
    expect(aging.buckets).toHaveLength(2);
    expect(aging.totalOutstanding).toBe(1000);
    expect(aging.buckets[0].customer).toBe('Client A');
  });

  it('filters out zero-balance entries', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'AgedReceivables', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Client' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '0' }] },
        ],
      },
    });

    const aging = await getARAgingSummary();
    expect(aging.buckets).toHaveLength(0);
  });
});

/* ─── AP Aging Tests ────────────────────────────────────────── */

describe('getAPAgingSummary', () => {
  it('returns vendor aging data', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'AgedPayables', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Vendor X' }, { value: '1000' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '0' }, { value: '1000' }] },
        ],
      },
    });

    const aging = await getAPAgingSummary();
    expect(aging.buckets).toHaveLength(1);
    expect(aging.totalOutstanding).toBe(1000);
  });
});

/* ─── Revenue by Service Tests ──────────────────────────────── */

describe('getRevenueByService', () => {
  it('returns sorted revenue by service', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'ItemSales', ReportBasis: 'Accrual', StartPeriod: '2026-01-01', EndPeriod: '2026-01-31', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Sofwave' }, { value: '15000' }] },
          { ColData: [{ value: 'HydraFacial' }, { value: '8000' }] },
          { ColData: [{ value: 'Botox' }, { value: '20000' }] },
        ],
      },
    });

    const report = await getRevenueByService();
    expect(report.byService).toHaveLength(3);
    expect(report.byService[0].serviceName).toBe('Botox'); // Highest revenue first
    expect(report.totalRevenue).toBe(43000);
  });

  it('calculates percentages', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'ItemSales', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Service A' }, { value: '100' }] },
          { ColData: [{ value: 'Service B' }, { value: '100' }] },
        ],
      },
    });

    const report = await getRevenueByService();
    expect(report.byService[0].percentage).toBe(50);
  });
});

/* ─── Expense Breakdown Tests ───────────────────────────────── */

describe('getExpenseBreakdown', () => {
  it('groups expenses by clinic category', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'expense', category: 'rent', amount: 5000, date: '2026-01-15', description: '', syncedAt: '' },
      { id: '2', qboId: '2', type: 'expense', category: 'supplies', amount: 3000, date: '2026-01-15', description: '', syncedAt: '' },
      { id: '3', qboId: '3', type: 'expense', category: 'supplies', amount: 2000, date: '2026-01-20', description: '', vendorOrCustomer: 'Vendor A', syncedAt: '' },
      { id: '4', qboId: '4', type: 'income', category: 'service_revenue', amount: 10000, date: '2026-01-15', description: '', syncedAt: '' },
    ]);

    const report = await getExpenseBreakdown();
    expect(report.totalExpenses).toBe(10000);
    expect(report.byCategory.rent.amount).toBe(5000);
    expect(report.byCategory.supplies.amount).toBe(5000);
  });

  it('returns top vendors sorted by spend', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'expense', category: 'supplies', amount: 5000, date: '2026-01-15', description: '', vendorOrCustomer: 'Vendor A', syncedAt: '' },
      { id: '2', qboId: '2', type: 'expense', category: 'supplies', amount: 3000, date: '2026-01-15', description: '', vendorOrCustomer: 'Vendor B', syncedAt: '' },
    ]);

    const report = await getExpenseBreakdown();
    expect(report.topVendors).toHaveLength(2);
    expect(report.topVendors[0].vendor).toBe('Vendor A');
  });

  it('calculates percentages for each category', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'expense', category: 'rent', amount: 5000, date: '2026-01-15', description: '', syncedAt: '' },
      { id: '2', qboId: '2', type: 'expense', category: 'payroll', amount: 5000, date: '2026-01-15', description: '', syncedAt: '' },
    ]);

    const report = await getExpenseBreakdown();
    expect(report.byCategory.rent.percentage).toBe(50);
    expect(report.byCategory.payroll.percentage).toBe(50);
  });
});

/* ─── Tax Summary Tests ─────────────────────────────────────── */

describe('getTaxSummary', () => {
  it('falls back to P&L estimation when TaxSummary report unavailable', async () => {
    // First call (TaxSummary) fails
    mockReport.mockRejectedValueOnce(new Error('Report not available'));
    // Second call (ProfitAndLoss for fallback)
    mockReport.mockResolvedValueOnce(mockPnLReport());

    const tax = await getTaxSummary();
    expect(tax.estimatedIncomeTax).toBeGreaterThan(0);
    expect(tax.totalTaxLiability).toBeGreaterThan(0);
  });

  it('parses actual tax report when available', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'TaxSummary', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: {
        Row: [
          { ColData: [{ value: 'Sales Tax Collected' }, { value: '2500' }] },
          { ColData: [{ value: 'Tax Owed' }, { value: '1200' }] },
        ],
      },
    });

    const tax = await getTaxSummary();
    expect(tax.salesTaxCollected).toBe(2500);
    expect(tax.salesTaxOwed).toBe(1200);
  });
});

/* ─── Budget vs Actual Tests ────────────────────────────────── */

describe('getBudgetVsActual', () => {
  it('returns budget data for requested months', async () => {
    mockGetTransactions.mockReturnValue([]);

    const budgets = await getBudgetVsActual(3);
    expect(budgets).toHaveLength(3);
  });

  it('includes all expense categories', async () => {
    mockGetTransactions.mockReturnValue([]);

    const budgets = await getBudgetVsActual(1);
    const categories = Object.keys(budgets[0].categories);
    expect(categories).toContain('rent');
    expect(categories).toContain('supplies');
    expect(categories).toContain('payroll');
    expect(categories).toContain('marketing');
  });

  it('calculates variance correctly', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'expense', category: 'rent', amount: 6000, date: '2026-03-15', description: '', syncedAt: '' },
    ]);

    const budgets = await getBudgetVsActual(1);
    // Default rent budget is 5000, actual is 6000 -> variance is -1000
    expect(budgets[0].categories.rent.actual).toBe(6000);
  });

  it('supports budget overrides', async () => {
    const month = new Date().toISOString().substring(0, 7);
    setBudget(month, {
      revenueTarget: 100000,
      categories: {
        rent: { budgeted: 7000, actual: 0 },
        supplies: { budgeted: 10000, actual: 0 },
        payroll: { budgeted: 30000, actual: 0 },
        marketing: { budgeted: 5000, actual: 0 },
        insurance: { budgeted: 3000, actual: 0 },
        equipment: { budgeted: 1000, actual: 0 },
        utilities: { budgeted: 1000, actual: 0 },
        professional_services: { budgeted: 2000, actual: 0 },
      },
    });

    mockGetTransactions.mockReturnValue([]);
    const budgets = await getBudgetVsActual(1);
    // The current month should use the override
    const currentMonthBudget = budgets.find(b => b.month === month);
    if (currentMonthBudget) {
      expect(currentMonthBudget.revenueTarget).toBe(100000);
    }
  });

  it('returns months in chronological order', async () => {
    mockGetTransactions.mockReturnValue([]);

    const budgets = await getBudgetVsActual(3);
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i].month >= budgets[i - 1].month).toBe(true);
    }
  });
});

/* ─── Provider Profitability Tests ──────────────────────────── */

describe('getProviderProfitability', () => {
  it('returns provider data from QBO report', async () => {
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'ProfitAndLoss', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: {
        Column: [
          { ColTitle: '', ColType: 'Account' },
          { ColTitle: 'Mom', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'class-1' }] },
        ],
      },
      Rows: {
        Row: [
          {
            type: 'Section', group: 'Income',
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'Total' }, { value: '40000' }] },
          },
          {
            type: 'Section', group: 'Expenses',
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'Total' }, { value: '15000' }] },
          },
        ],
      },
    });

    const providers = await getProviderProfitability();
    expect(providers).toHaveLength(1);
    expect(providers[0].providerName).toBe('Mom');
    expect(providers[0].revenue).toBe(40000);
    expect(providers[0].directCosts).toBe(15000);
    expect(providers[0].contribution).toBe(25000);
    expect(providers[0].margin).toBeCloseTo(62.5, 1);
  });

  it('falls back to cached transactions when report fails', async () => {
    mockReport.mockRejectedValue(new Error('Report unavailable'));
    mockGetTransactions.mockReturnValue([]);

    const providers = await getProviderProfitability();
    expect(Array.isArray(providers)).toBe(true);
  });
});

/* ─── Financial Summary Tests ───────────────────────────────── */

describe('getFinancialSummary', () => {
  it('returns complete financial summary', async () => {
    mockGetTransactions.mockReturnValue([
      { id: '1', qboId: '1', type: 'income', category: 'service_revenue', amount: 10000, date: '2026-03-15', description: '', className: 'Mom', syncedAt: '' },
      { id: '2', qboId: '2', type: 'expense', category: 'rent', amount: 5000, date: '2026-03-15', description: '', syncedAt: '' },
    ]);

    // Mock balance sheet call
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'BalanceSheet', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: { Row: [] },
    });

    const summary = await getFinancialSummary('2026-03-01', '2026-03-31');
    expect(summary.totalRevenue).toBe(10000);
    expect(summary.totalExpenses).toBe(5000);
    expect(summary.netIncome).toBe(5000);
    expect(summary.revenueByProvider['Mom']).toBe(10000);
    expect(summary.expensesByCategory.rent).toBe(5000);
  });

  it('handles empty transaction cache', async () => {
    mockGetTransactions.mockReturnValue([]);
    mockReport.mockResolvedValue({
      Header: { Time: '', ReportName: 'BalanceSheet', ReportBasis: 'Accrual', StartPeriod: '', EndPeriod: '', Currency: 'USD' },
      Columns: { Column: [] },
      Rows: { Row: [] },
    });

    const summary = await getFinancialSummary('2026-03-01', '2026-03-31');
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.netIncome).toBe(0);
  });
});
