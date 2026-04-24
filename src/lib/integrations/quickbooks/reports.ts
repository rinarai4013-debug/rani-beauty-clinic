// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — Report Generation
// P&L, Balance Sheet, Cash Flow, AR/AP Aging, Tax, Budget
// ═══════════════════════════════════════════════════════════════

import { qboClient } from './client';
import {
  getTransactionsByDateRange,
  getTransactionsByType,
  getClassCache,
  getItemCache,
} from './sync';
import type {
  QBOReport,
  QBOReportRow,
  ClinicExpenseCategory,
  ClinicBudget,
  ClinicFinancialSummary,
} from './types';

/* ─── Date Helpers ──────────────────────────────────────────── */

function getDateRange(period: 'monthly' | 'quarterly' | 'annual', offset = 0): { start: string; end: string } {
  const now = new Date();

  switch (period) {
    case 'monthly': {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      return {
        start: month.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }
    case 'quarterly': {
      const qStart = Math.floor(now.getMonth() / 3) * 3 - offset * 3;
      const start = new Date(now.getFullYear(), qStart, 1);
      const end = new Date(now.getFullYear(), qStart + 3, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }
    case 'annual': {
      const year = now.getFullYear() - offset;
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      };
    }
  }
}

function parseReportRows(rows: QBOReportRow[]): Array<{ label: string; values: string[] }> {
  const result: Array<{ label: string; values: string[] }> = [];

  for (const row of rows) {
    if (row.ColData) {
      result.push({
        label: row.ColData[0]?.value || '',
        values: row.ColData.slice(1).map(c => c.value),
      });
    }
    if (row.Header?.ColData) {
      result.push({
        label: row.Header.ColData[0]?.value || '',
        values: row.Header.ColData.slice(1).map(c => c.value),
      });
    }
    if (row.Rows?.Row) {
      result.push(...parseReportRows(row.Rows.Row));
    }
    if (row.Summary?.ColData) {
      result.push({
        label: `Total ${row.Header?.ColData?.[0]?.value || ''}`.trim(),
        values: row.Summary.ColData.slice(1).map(c => c.value),
      });
    }
  }

  return result;
}

/* ─── P&L Report ────────────────────────────────────────────── */

export interface PnLReport {
  period: { start: string; end: string };
  basis: 'Accrual' | 'Cash';
  totalIncome: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netOperatingIncome: number;
  totalOtherIncome: number;
  totalOtherExpenses: number;
  netIncome: number;
  lineItems: Array<{
    section: 'income' | 'cogs' | 'expense' | 'other_income' | 'other_expense';
    label: string;
    amount: number;
  }>;
  raw?: QBOReport;
}

export async function getProfitAndLoss(
  period: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  offset = 0,
  options?: { basis?: 'Accrual' | 'Cash'; summarize?: boolean },
): Promise<PnLReport> {
  const { start, end } = getDateRange(period, offset);
  const basis = options?.basis || 'Accrual';

  const report = await qboClient.report('ProfitAndLoss', {
    start_date: start,
    end_date: end,
    accounting_method: basis,
    summarize_column_by: options?.summarize ? 'Month' : 'Total',
  });

  const rows = report.Rows.Row;
  const lineItems: PnLReport['lineItems'] = [];
  let totalIncome = 0;
  let totalCOGS = 0;
  let totalExpenses = 0;
  let totalOtherIncome = 0;
  let totalOtherExpenses = 0;

  for (const row of rows) {
    const group = row.group?.toLowerCase() || '';
    const section = group.includes('income') && !group.includes('other')
      ? 'income'
      : group.includes('cogs') || group.includes('cost of goods')
        ? 'cogs'
        : group.includes('other income')
          ? 'other_income'
          : group.includes('other expense')
            ? 'other_expense'
            : 'expense';

    if (row.Summary?.ColData) {
      const amount = parseFloat(row.Summary.ColData[1]?.value || '0');
      switch (section) {
        case 'income': totalIncome = amount; break;
        case 'cogs': totalCOGS = amount; break;
        case 'expense': totalExpenses = amount; break;
        case 'other_income': totalOtherIncome = amount; break;
        case 'other_expense': totalOtherExpenses = amount; break;
      }
    }

    if (row.Rows?.Row) {
      for (const subRow of row.Rows.Row) {
        if (subRow.ColData) {
          lineItems.push({
            section,
            label: subRow.ColData[0]?.value || '',
            amount: parseFloat(subRow.ColData[1]?.value || '0'),
          });
        }
      }
    }
  }

  const grossProfit = totalIncome - totalCOGS;
  const netOperatingIncome = grossProfit - totalExpenses;
  const netIncome = netOperatingIncome + totalOtherIncome - totalOtherExpenses;

  return {
    period: { start, end },
    basis,
    totalIncome,
    totalCOGS,
    grossProfit,
    totalExpenses,
    netOperatingIncome,
    totalOtherIncome,
    totalOtherExpenses,
    netIncome,
    lineItems,
    raw: report,
  };
}

/* ─── Balance Sheet ─────────────────────────────────────────── */

export interface BalanceSheetReport {
  asOf: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  sections: Array<{
    section: 'assets' | 'liabilities' | 'equity';
    label: string;
    amount: number;
  }>;
  raw?: QBOReport;
}

export async function getBalanceSheet(asOfDate?: string): Promise<BalanceSheetReport> {
  const asOf = asOfDate || new Date().toISOString().split('T')[0];

  const report = await qboClient.report('BalanceSheet', {
    ...(asOfDate ? {} : { date_macro: 'Today' }),
    end_date: asOf,
  });

  const sections: BalanceSheetReport['sections'] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const row of report.Rows.Row) {
    const group = row.group?.toLowerCase() || '';
    const section = group.includes('asset')
      ? 'assets' as const
      : group.includes('liabilit')
        ? 'liabilities' as const
        : 'equity' as const;

    if (row.Summary?.ColData) {
      const amount = parseFloat(row.Summary.ColData[1]?.value || '0');
      switch (section) {
        case 'assets': totalAssets = amount; break;
        case 'liabilities': totalLiabilities = amount; break;
        case 'equity': totalEquity = amount; break;
      }
    }

    if (row.Rows?.Row) {
      for (const subRow of row.Rows.Row) {
        if (subRow.ColData) {
          sections.push({
            section,
            label: subRow.ColData[0]?.value || '',
            amount: parseFloat(subRow.ColData[1]?.value || '0'),
          });
        }
        // Nested sections
        if (subRow.Rows?.Row) {
          for (const nested of subRow.Rows.Row) {
            if (nested.ColData) {
              sections.push({
                section,
                label: nested.ColData[0]?.value || '',
                amount: parseFloat(nested.ColData[1]?.value || '0'),
              });
            }
          }
        }
      }
    }
  }

  return { asOf, totalAssets, totalLiabilities, totalEquity, sections, raw: report };
}

/* ─── Cash Flow Statement ───────────────────────────────────── */

export interface CashFlowReport {
  period: { start: string; end: string };
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashChange: number;
  beginningCash: number;
  endingCash: number;
  lineItems: Array<{
    section: 'operating' | 'investing' | 'financing';
    label: string;
    amount: number;
  }>;
  raw?: QBOReport;
}

export async function getCashFlowStatement(
  period: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  offset = 0,
): Promise<CashFlowReport> {
  const { start, end } = getDateRange(period, offset);

  const report = await qboClient.report('CashFlow', {
    start_date: start,
    end_date: end,
  });

  const lineItems: CashFlowReport['lineItems'] = [];
  let operatingActivities = 0;
  let investingActivities = 0;
  let financingActivities = 0;

  for (const row of report.Rows.Row) {
    const group = row.group?.toLowerCase() || '';
    const section = group.includes('operat')
      ? 'operating' as const
      : group.includes('invest')
        ? 'investing' as const
        : 'financing' as const;

    if (row.Summary?.ColData) {
      const amount = parseFloat(row.Summary.ColData[1]?.value || '0');
      switch (section) {
        case 'operating': operatingActivities = amount; break;
        case 'investing': investingActivities = amount; break;
        case 'financing': financingActivities = amount; break;
      }
    }

    if (row.Rows?.Row) {
      for (const subRow of row.Rows.Row) {
        if (subRow.ColData) {
          lineItems.push({
            section,
            label: subRow.ColData[0]?.value || '',
            amount: parseFloat(subRow.ColData[1]?.value || '0'),
          });
        }
      }
    }
  }

  const netCashChange = operatingActivities + investingActivities + financingActivities;

  return {
    period: { start, end },
    operatingActivities,
    investingActivities,
    financingActivities,
    netCashChange,
    beginningCash: 0, // Would need separate query
    endingCash: netCashChange,
    lineItems,
    raw: report,
  };
}

/* ─── AR Aging ──────────────────────────────────────────────── */

export interface AgingReport {
  asOf: string;
  totalOutstanding: number;
  buckets: Array<{
    customer: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
  }>;
  raw?: QBOReport;
}

export async function getARAgingSummary(asOfDate?: string): Promise<AgingReport> {
  const asOf = asOfDate || new Date().toISOString().split('T')[0];

  const report = await qboClient.report('AgedReceivables', {
    ...(asOfDate ? {} : { date_macro: 'Today' }),
    report_date: asOf,
  });

  const parsed = parseReportRows(report.Rows.Row);
  const buckets: AgingReport['buckets'] = [];
  let totalOutstanding = 0;

  for (const row of parsed) {
    if (row.label && row.values.length >= 5 && !row.label.startsWith('Total')) {
      const total = parseFloat(row.values[row.values.length - 1] || '0');
      if (total !== 0) {
        buckets.push({
          customer: row.label,
          current: parseFloat(row.values[0] || '0'),
          days1to30: parseFloat(row.values[1] || '0'),
          days31to60: parseFloat(row.values[2] || '0'),
          days61to90: parseFloat(row.values[3] || '0'),
          over90: parseFloat(row.values[4] || '0'),
          total,
        });
        totalOutstanding += total;
      }
    }
  }

  return { asOf, totalOutstanding, buckets, raw: report };
}

/* ─── AP Aging ──────────────────────────────────────────────── */

export async function getAPAgingSummary(asOfDate?: string): Promise<AgingReport> {
  const asOf = asOfDate || new Date().toISOString().split('T')[0];

  const report = await qboClient.report('AgedPayables', {
    ...(asOfDate ? {} : { date_macro: 'Today' }),
    report_date: asOf,
  });

  const parsed = parseReportRows(report.Rows.Row);
  const buckets: AgingReport['buckets'] = [];
  let totalOutstanding = 0;

  for (const row of parsed) {
    if (row.label && row.values.length >= 5 && !row.label.startsWith('Total')) {
      const total = parseFloat(row.values[row.values.length - 1] || '0');
      if (total !== 0) {
        buckets.push({
          customer: row.label, // vendor in AP context
          current: parseFloat(row.values[0] || '0'),
          days1to30: parseFloat(row.values[1] || '0'),
          days31to60: parseFloat(row.values[2] || '0'),
          days61to90: parseFloat(row.values[3] || '0'),
          over90: parseFloat(row.values[4] || '0'),
          total,
        });
        totalOutstanding += total;
      }
    }
  }

  return { asOf, totalOutstanding, buckets, raw: report };
}

/* ─── Revenue by Service Category ───────────────────────────── */

export interface RevenueByServiceReport {
  period: { start: string; end: string };
  totalRevenue: number;
  byService: Array<{ serviceName: string; revenue: number; percentage: number }>;
}

export async function getRevenueByService(
  period: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  offset = 0,
): Promise<RevenueByServiceReport> {
  const { start, end } = getDateRange(period, offset);

  // Use QBO Sales by Product/Service report
  const report = await qboClient.report('ItemSales', {
    start_date: start,
    end_date: end,
    summarize_column_by: 'Total',
  });

  const parsed = parseReportRows(report.Rows.Row);
  let totalRevenue = 0;
  const byService: Array<{ serviceName: string; revenue: number; percentage: number }> = [];

  for (const row of parsed) {
    if (row.label && row.values.length > 0 && !row.label.startsWith('Total')) {
      // Last value is usually amount
      const revenue = parseFloat(row.values[row.values.length - 1] || '0');
      if (revenue > 0) {
        byService.push({ serviceName: row.label, revenue, percentage: 0 });
        totalRevenue += revenue;
      }
    }
  }

  // Calculate percentages
  for (const item of byService) {
    item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
  }

  // Sort by revenue descending
  byService.sort((a, b) => b.revenue - a.revenue);

  return { period: { start, end }, totalRevenue, byService };
}

/* ─── Expense Breakdown ─────────────────────────────────────── */

export interface ExpenseBreakdownReport {
  period: { start: string; end: string };
  totalExpenses: number;
  byCategory: Record<ClinicExpenseCategory, { amount: number; percentage: number }>;
  topVendors: Array<{ vendor: string; amount: number }>;
}

export async function getExpenseBreakdown(
  period: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  offset = 0,
): Promise<ExpenseBreakdownReport> {
  const { start, end } = getDateRange(period, offset);
  const expenses = getTransactionsByDateRange(start, end).filter(t => t.type === 'expense');

  const categories: Record<ClinicExpenseCategory, number> = {
    rent: 0,
    supplies: 0,
    payroll: 0,
    marketing: 0,
    insurance: 0,
    equipment: 0,
    utilities: 0,
    professional_services: 0,
  };

  const vendorTotals: Record<string, number> = {};

  for (const expense of expenses) {
    if (expense.category in categories) {
      categories[expense.category as ClinicExpenseCategory] += expense.amount;
    }
    if (expense.vendorOrCustomer) {
      vendorTotals[expense.vendorOrCustomer] = (vendorTotals[expense.vendorOrCustomer] || 0) + expense.amount;
    }
  }

  const totalExpenses = Object.values(categories).reduce((sum, v) => sum + v, 0);

  const byCategory = {} as Record<ClinicExpenseCategory, { amount: number; percentage: number }>;
  for (const [cat, amount] of Object.entries(categories)) {
    byCategory[cat as ClinicExpenseCategory] = {
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    };
  }

  const topVendors = Object.entries(vendorTotals)
    .map(([vendor, amount]) => ({ vendor, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return { period: { start, end }, totalExpenses, byCategory, topVendors };
}

/* ─── Tax Summary ───────────────────────────────────────────── */

export interface TaxSummaryReport {
  period: { start: string; end: string };
  salesTaxCollected: number;
  salesTaxOwed: number;
  estimatedIncomeTax: number;
  payrollTaxEstimate: number;
  totalTaxLiability: number;
  details: Array<{ taxType: string; amount: number }>;
}

export async function getTaxSummary(
  period: 'monthly' | 'quarterly' | 'annual' = 'quarterly',
  offset = 0,
): Promise<TaxSummaryReport> {
  const { start, end } = getDateRange(period, offset);

  // Use QBO Tax Summary report
  let report: QBOReport;
  try {
    report = await qboClient.report('TaxSummary', {
      start_date: start,
      end_date: end,
    });
  } catch {
    // Tax Summary report may not be available — estimate from P&L
    const pnl = await getProfitAndLoss(period, offset);

    const estimatedIncomeTax = Math.max(0, pnl.netIncome * 0.25); // ~25% estimated
    const payrollExpenses = pnl.lineItems
      .filter(li => li.section === 'expense' && li.label.toLowerCase().includes('payroll'))
      .reduce((sum, li) => sum + li.amount, 0);
    const payrollTaxEstimate = payrollExpenses * 0.0765; // FICA rate

    return {
      period: { start, end },
      salesTaxCollected: 0,
      salesTaxOwed: 0,
      estimatedIncomeTax,
      payrollTaxEstimate,
      totalTaxLiability: estimatedIncomeTax + payrollTaxEstimate,
      details: [
        { taxType: 'Estimated Income Tax', amount: estimatedIncomeTax },
        { taxType: 'Estimated Payroll Tax (FICA)', amount: payrollTaxEstimate },
      ],
    };
  }

  const parsed = parseReportRows(report.Rows.Row);
  let salesTaxCollected = 0;
  let salesTaxOwed = 0;
  const details: Array<{ taxType: string; amount: number }> = [];

  for (const row of parsed) {
    if (row.values.length > 0) {
      const amount = parseFloat(row.values[row.values.length - 1] || '0');
      details.push({ taxType: row.label, amount });
      if (row.label.toLowerCase().includes('collected')) salesTaxCollected += amount;
      if (row.label.toLowerCase().includes('owed') || row.label.toLowerCase().includes('payable')) salesTaxOwed += amount;
    }
  }

  return {
    period: { start, end },
    salesTaxCollected,
    salesTaxOwed,
    estimatedIncomeTax: 0,
    payrollTaxEstimate: 0,
    totalTaxLiability: salesTaxOwed,
    details,
  };
}

/* ─── Budget vs Actual ──────────────────────────────────────── */

// Default monthly budgets for the clinic (can be configured via dashboard)
const DEFAULT_MONTHLY_BUDGETS: Record<ClinicExpenseCategory, number> = {
  rent: 5000,
  supplies: 8000,
  payroll: 25000,
  marketing: 3000,
  insurance: 2000,
  equipment: 2000,
  utilities: 800,
  professional_services: 1500,
};

const DEFAULT_REVENUE_TARGET = 80000;

const budgetOverrides: Record<string, ClinicBudget> = {};

export function setBudget(month: string, budget: Partial<ClinicBudget>): void {
  budgetOverrides[month] = {
    month,
    categories: budget.categories || {} as ClinicBudget['categories'],
    revenueTarget: budget.revenueTarget || DEFAULT_REVENUE_TARGET,
    actualRevenue: budget.actualRevenue || 0,
  };
}

export async function getBudgetVsActual(
  months = 6,
): Promise<Array<ClinicBudget & { variance: number; variancePercent: number }>> {
  const results: Array<ClinicBudget & { variance: number; variancePercent: number }> = [];

  for (let i = 0; i < months; i++) {
    const { start, end } = getDateRange('monthly', i);
    const month = start.substring(0, 7); // YYYY-MM

    const transactions = getTransactionsByDateRange(start, end);
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const actualRevenue = income.reduce((sum, t) => sum + t.amount, 0);

    const override = budgetOverrides[month];
    const revenueTarget = override?.revenueTarget || DEFAULT_REVENUE_TARGET;

    const categories = {} as Record<ClinicExpenseCategory, { budgeted: number; actual: number }>;
    for (const cat of Object.keys(DEFAULT_MONTHLY_BUDGETS) as ClinicExpenseCategory[]) {
      const budgeted = override?.categories[cat]?.budgeted ?? DEFAULT_MONTHLY_BUDGETS[cat];
      const actual = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      categories[cat] = { budgeted, actual };
    }

    const totalBudgeted = Object.values(categories).reduce((s, c) => s + c.budgeted, 0);
    const totalActual = Object.values(categories).reduce((s, c) => s + c.actual, 0);
    const variance = totalBudgeted - totalActual;
    const variancePercent = totalBudgeted > 0 ? (variance / totalBudgeted) * 100 : 0;

    results.push({
      month,
      categories,
      revenueTarget,
      actualRevenue,
      variance,
      variancePercent,
    });
  }

  return results.reverse(); // Oldest to newest
}

/* ─── Provider Profitability ────────────────────────────────── */

export interface ProviderProfitability {
  providerName: string;
  classId: string;
  revenue: number;
  directCosts: number;
  contribution: number;
  margin: number;
}

export async function getProviderProfitability(
  period: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  offset = 0,
): Promise<ProviderProfitability[]> {
  const { start, end } = getDateRange(period, offset);

  // Try QBO ProfitAndLoss report by class (provider mapping)
  try {
    const report = await qboClient.report('ProfitAndLoss', {
      start_date: start,
      end_date: end,
      summarize_column_by: 'Class',
    });

    const columns = report.Columns.Column;
    const providers: ProviderProfitability[] = [];

    // Columns after the first (label) represent classes/providers
    for (let i = 1; i < columns.length; i++) {
      const providerName = columns[i].ColTitle || `Provider ${i}`;
      let revenue = 0;
      let directCosts = 0;

      for (const row of report.Rows.Row) {
        const group = row.group?.toLowerCase() || '';
        if (row.Summary?.ColData && row.Summary.ColData[i]) {
          const amount = parseFloat(row.Summary.ColData[i].value || '0');
          if (group.includes('income')) revenue = amount;
          else if (group.includes('expense') || group.includes('cogs')) directCosts += amount;
        }
      }

      const contribution = revenue - directCosts;
      providers.push({
        providerName,
        classId: columns[i].MetaData?.find(m => m.Name === 'ColKey')?.Value || '',
        revenue,
        directCosts,
        contribution,
        margin: revenue > 0 ? (contribution / revenue) * 100 : 0,
      });
    }

    return providers.filter(p => p.revenue > 0 || p.directCosts > 0);
  } catch {
    // Fallback: use cached transactions with class mapping
    const transactions = getTransactionsByDateRange(start, end);
    const classes = getClassCache();
    const providerMap: Record<string, { revenue: number; costs: number }> = {};

    for (const cls of classes) {
      providerMap[cls.Name] = { revenue: 0, costs: 0 };
    }

    for (const txn of transactions) {
      if (txn.className) {
        if (!providerMap[txn.className]) providerMap[txn.className] = { revenue: 0, costs: 0 };
        if (txn.type === 'income') providerMap[txn.className].revenue += txn.amount;
        else providerMap[txn.className].costs += txn.amount;
      }
    }

    return Object.entries(providerMap)
      .filter(([, v]) => v.revenue > 0 || v.costs > 0)
      .map(([name, v]) => ({
        providerName: name,
        classId: classes.find(c => c.Name === name)?.Id || '',
        revenue: v.revenue,
        directCosts: v.costs,
        contribution: v.revenue - v.costs,
        margin: v.revenue > 0 ? ((v.revenue - v.costs) / v.revenue) * 100 : 0,
      }));
  }
}

/* ─── Financial Summary ─────────────────────────────────────── */

export async function getFinancialSummary(
  startDate: string,
  endDate: string,
): Promise<ClinicFinancialSummary> {
  const transactions = getTransactionsByDateRange(startDate, endDate);
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const revenueByCategory: Record<string, number> = {};
  for (const txn of income) {
    revenueByCategory[txn.category] = (revenueByCategory[txn.category] || 0) + txn.amount;
  }

  const expensesByCategory: Record<ClinicExpenseCategory, number> = {
    rent: 0, supplies: 0, payroll: 0, marketing: 0,
    insurance: 0, equipment: 0, utilities: 0, professional_services: 0,
  };
  for (const txn of expenses) {
    if (txn.category in expensesByCategory) {
      expensesByCategory[txn.category as ClinicExpenseCategory] += txn.amount;
    }
  }

  const revenueByProvider: Record<string, number> = {};
  for (const txn of income) {
    const provider = txn.className || 'Unassigned';
    revenueByProvider[provider] = (revenueByProvider[provider] || 0) + txn.amount;
  }

  const totalRevenue = income.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  // Get balance sheet values
  let cashBalance = 0;
  let accountsReceivable = 0;
  let accountsPayable = 0;
  try {
    const bs = await getBalanceSheet(endDate);
    for (const section of bs.sections) {
      if (section.label.toLowerCase().includes('checking') || section.label.toLowerCase().includes('savings')) {
        cashBalance += section.amount;
      }
      if (section.label.toLowerCase().includes('accounts receivable')) {
        accountsReceivable = section.amount;
      }
      if (section.label.toLowerCase().includes('accounts payable')) {
        accountsPayable = section.amount;
      }
    }
  } catch {
    // Balance sheet not available
  }

  return {
    period: { start: startDate, end: endDate },
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    revenueByCategory,
    expensesByCategory,
    revenueByProvider,
    cashBalance,
    accountsReceivable,
    accountsPayable,
  };
}
