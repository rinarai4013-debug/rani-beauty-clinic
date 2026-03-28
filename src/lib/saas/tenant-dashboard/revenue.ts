/**
 * RaniOS Tenant Dashboard — Revenue Tracking Module
 *
 * Revenue by service/provider/day/source, trend analysis, anomaly detection,
 * P&L summary, expense tracking, and cash flow overview.
 * All queries scoped to tenant via TenantDatabaseClient.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevenueBreakdown {
  byService: RevenueByDimension[];
  byProvider: RevenueByDimension[];
  byDay: DailyRevenue[];
  bySource: RevenueByDimension[];
  byPaymentMethod: RevenueByDimension[];
  total: number;
  period: { start: string; end: string };
}

export interface RevenueByDimension {
  name: string;
  revenue: number;
  count: number;
  percentage: number;
  avgTransaction: number;
  trend: number;          // % change vs prior period
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
  avgTransaction: number;
  dayOfWeek: string;
  isAnomaly: boolean;
}

// ─── Trend Analysis ─────────────────────────────────────────────────────────

export interface RevenueTrend {
  period: string;
  data: TrendDataPoint[];
  movingAverage: number[];
  growthRate: number;       // % period over period
  projectedEndOfMonth: number;
  seasonalIndex: number;    // 0.5–1.5 (1 = average)
  bestDay: { date: string; revenue: number };
  worstDay: { date: string; revenue: number };
}

export interface TrendDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  cumulative: number;
}

// ─── Anomaly Detection ──────────────────────────────────────────────────────

export interface RevenueAnomaly {
  date: string;
  actual: number;
  expected: number;
  deviation: number;       // %
  type: 'spike' | 'drop' | 'pattern_break';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  possibleCause: string;
}

export interface AnomalyReport {
  anomalies: RevenueAnomaly[];
  healthScore: number;     // 0–100
  summary: string;
  projectedMonthEnd: number;
}

// ─── P&L Summary ────────────────────────────────────────────────────────────

export interface PnLSummary {
  revenue: PnLLineItem;
  costOfGoods: PnLLineItem;
  grossProfit: PnLLineItem;
  operatingExpenses: ExpenseCategory[];
  totalExpenses: PnLLineItem;
  netIncome: PnLLineItem;
  margins: {
    gross: number;
    operating: number;
    net: number;
  };
  period: { start: string; end: string };
}

export interface PnLLineItem {
  amount: number;
  priorPeriod: number;
  change: number;         // %
  percentOfRevenue: number;
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  budget: number;
  variance: number;       // %
  percentOfRevenue: number;
  subcategories: { name: string; amount: number }[];
}

// ─── Expense Tracking ───────────────────────────────────────────────────────

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategoryType;
  subcategory: string;
  description: string;
  amount: number;
  vendor: string;
  recurring: boolean;
  receiptUrl?: string;
  approvedBy?: string;
}

export type ExpenseCategoryType =
  | 'product_costs'
  | 'labor'
  | 'rent'
  | 'marketing'
  | 'equipment'
  | 'insurance'
  | 'supplies'
  | 'admin'
  | 'utilities'
  | 'other';

export interface ExpenseSummary {
  total: number;
  byCategory: { category: ExpenseCategoryType; amount: number; percentage: number; trend: number }[];
  monthOverMonth: number;
  budgetUtilization: number; // 0–100
  topVendors: { name: string; amount: number }[];
}

// ─── Cash Flow ──────────────────────────────────────────────────────────────

export interface CashFlowOverview {
  currentBalance: number;
  inflows: CashFlowEntry[];
  outflows: CashFlowEntry[];
  netCashFlow: number;
  projection: CashFlowProjection[];
  runway: number;          // months at current burn rate
}

export interface CashFlowEntry {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'inflow' | 'outflow';
}

export interface CashFlowProjection {
  month: string;
  projectedInflow: number;
  projectedOutflow: number;
  projectedBalance: number;
}

// ─── Revenue Breakdown ──────────────────────────────────────────────────────

export async function getRevenueBreakdown(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  startDate: string,
  endDate: string
): Promise<RevenueBreakdown> {
  const transactions = await db.fetchAll<{
    Date: string;
    Service: string;
    Provider: string;
    Amount: number;
    'Payment Method': string;
    Source: string;
    Status: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startDate}'), IS_BEFORE({Date}, '${endDate}'), {Status} != 'Refunded')`,
    fields: ['Date', 'Service', 'Provider', 'Amount', 'Payment Method', 'Source', 'Status'],
  });

  const serviceMap = new Map<string, { revenue: number; count: number }>();
  const providerMap = new Map<string, { revenue: number; count: number }>();
  const dayMap = new Map<string, { revenue: number; count: number }>();
  const sourceMap = new Map<string, { revenue: number; count: number }>();
  const methodMap = new Map<string, { revenue: number; count: number }>();
  let total = 0;

  for (const { fields } of transactions) {
    const amount = fields.Amount || 0;
    total += amount;

    const service = fields.Service || 'Unknown';
    const svc = serviceMap.get(service) || { revenue: 0, count: 0 };
    svc.revenue += amount; svc.count++; serviceMap.set(service, svc);

    const provider = fields.Provider || 'Unknown';
    const prov = providerMap.get(provider) || { revenue: 0, count: 0 };
    prov.revenue += amount; prov.count++; providerMap.set(provider, prov);

    const day = (fields.Date || '').split('T')[0];
    const d = dayMap.get(day) || { revenue: 0, count: 0 };
    d.revenue += amount; d.count++; dayMap.set(day, d);

    const source = fields.Source || 'Walk-in';
    const src = sourceMap.get(source) || { revenue: 0, count: 0 };
    src.revenue += amount; src.count++; sourceMap.set(source, src);

    const method = fields['Payment Method'] || 'Card';
    const mth = methodMap.get(method) || { revenue: 0, count: 0 };
    mth.revenue += amount; mth.count++; methodMap.set(method, mth);
  }

  const toDimension = (map: Map<string, { revenue: number; count: number }>): RevenueByDimension[] =>
    Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
        percentage: total > 0 ? Math.round((data.revenue / total) * 1000) / 10 : 0,
        avgTransaction: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
        trend: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDay: DailyRevenue[] = Array.from(dayMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      transactions: data.count,
      avgTransaction: data.count > 0 ? Math.round((data.revenue / data.count) * 100) / 100 : 0,
      dayOfWeek: dayNames[new Date(date).getDay()],
      isAnomaly: false,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Mark anomalies (simple: >2 std dev from mean)
  if (byDay.length > 5) {
    const revenues = byDay.map(d => d.revenue);
    const mean = revenues.reduce((s, r) => s + r, 0) / revenues.length;
    const stdDev = Math.sqrt(revenues.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / revenues.length);
    for (const day of byDay) {
      if (Math.abs(day.revenue - mean) > 2 * stdDev) {
        day.isAnomaly = true;
      }
    }
  }

  return {
    byService: toDimension(serviceMap),
    byProvider: toDimension(providerMap),
    byDay,
    bySource: toDimension(sourceMap),
    byPaymentMethod: toDimension(methodMap),
    total: Math.round(total * 100) / 100,
    period: { start: startDate, end: endDate },
  };
}

// ─── Trend Analysis ─────────────────────────────────────────────────────────

export async function getRevenueTrend(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  days = 30
): Promise<RevenueTrend> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 86400000);

  const transactions = await db.fetchAll<{
    Date: string;
    Amount: number;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startDate.toISOString()}'), {Status} != 'Refunded')`,
    fields: ['Date', 'Amount'],
  });

  // Aggregate by day
  const dayMap = new Map<string, { revenue: number; count: number }>();
  for (const { fields } of transactions) {
    const day = (fields.Date || '').split('T')[0];
    const existing = dayMap.get(day) || { revenue: 0, count: 0 };
    existing.revenue += fields.Amount || 0;
    existing.count++;
    dayMap.set(day, existing);
  }

  // Fill in missing days
  const data: TrendDataPoint[] = [];
  let cumulative = 0;
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dayData = dayMap.get(dateStr) || { revenue: 0, count: 0 };
    cumulative += dayData.revenue;
    data.push({
      date: dateStr,
      revenue: Math.round(dayData.revenue * 100) / 100,
      transactions: dayData.count,
      cumulative: Math.round(cumulative * 100) / 100,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // 7-day moving average
  const movingAverage = data.map((_, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    return Math.round((window.reduce((s, d) => s + d.revenue, 0) / window.length) * 100) / 100;
  });

  // Growth rate (compare first half to second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = data.slice(midpoint).reduce((s, d) => s + d.revenue, 0);
  const growthRate = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 1000) / 10 : 0;

  // Month-end projection
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthToDateRevenue = data
    .filter(d => d.date >= new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
    .reduce((s, d) => s + d.revenue, 0);
  const avgDailyRevenue = dayOfMonth > 0 ? monthToDateRevenue / dayOfMonth : 0;
  const projectedEndOfMonth = Math.round(avgDailyRevenue * daysInMonth);

  // Best/worst days
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const bestDay = sorted[0] || { date: '', revenue: 0 };
  const worstDay = sorted[sorted.length - 1] || { date: '', revenue: 0 };

  return {
    period: `${days}d`,
    data,
    movingAverage,
    growthRate,
    projectedEndOfMonth,
    seasonalIndex: 1.0,
    bestDay: { date: bestDay.date, revenue: bestDay.revenue },
    worstDay: { date: worstDay.date, revenue: worstDay.revenue },
  };
}

// ─── Anomaly Detection ──────────────────────────────────────────────────────

export async function detectRevenueAnomalies(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  days = 30
): Promise<AnomalyReport> {
  const trend = await getRevenueTrend(db, tenant, days);
  const data = trend.data;

  if (data.length < 7) {
    return {
      anomalies: [],
      healthScore: 100,
      summary: 'Insufficient data for anomaly detection. Need at least 7 days.',
      projectedMonthEnd: trend.projectedEndOfMonth,
    };
  }

  const revenues = data.map(d => d.revenue);
  const mean = revenues.reduce((s, r) => s + r, 0) / revenues.length;
  const stdDev = Math.sqrt(revenues.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / revenues.length);

  const anomalies: RevenueAnomaly[] = [];

  // Method 1: Statistical deviation
  for (const point of data) {
    if (stdDev === 0) continue;
    const zScore = (point.revenue - mean) / stdDev;
    if (Math.abs(zScore) > 2) {
      const deviation = Math.round(((point.revenue - mean) / mean) * 100);
      anomalies.push({
        date: point.date,
        actual: point.revenue,
        expected: Math.round(mean * 100) / 100,
        deviation,
        type: zScore > 0 ? 'spike' : 'drop',
        severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
        description: zScore > 0
          ? `Revenue spike: $${point.revenue} vs $${Math.round(mean)} avg (+${deviation}%)`
          : `Revenue drop: $${point.revenue} vs $${Math.round(mean)} avg (${deviation}%)`,
        possibleCause: zScore > 0 ? 'Large transaction or promotion' : 'Cancellations or slow day',
      });
    }
  }

  // Method 2: Day-of-week pattern breaks
  const dowAverages: Record<number, number[]> = {};
  for (const point of data) {
    const dow = new Date(point.date).getDay();
    if (!dowAverages[dow]) dowAverages[dow] = [];
    dowAverages[dow].push(point.revenue);
  }

  for (const point of data) {
    const dow = new Date(point.date).getDay();
    const dowValues = dowAverages[dow] || [];
    if (dowValues.length < 2) continue;
    const dowMean = dowValues.reduce((s, v) => s + v, 0) / dowValues.length;
    const dowDeviation = Math.abs(point.revenue - dowMean) / (dowMean || 1);
    if (dowDeviation > 0.5 && !anomalies.find(a => a.date === point.date)) {
      anomalies.push({
        date: point.date,
        actual: point.revenue,
        expected: Math.round(dowMean * 100) / 100,
        deviation: Math.round(((point.revenue - dowMean) / (dowMean || 1)) * 100),
        type: 'pattern_break',
        severity: 'info',
        description: `Unusual for ${new Date(point.date).toLocaleDateString('en', { weekday: 'long' })}`,
        possibleCause: 'Day-of-week pattern deviation',
      });
    }
  }

  const healthScore = Math.max(0, Math.round(
    100 - anomalies.filter(a => a.severity === 'critical').length * 15
        - anomalies.filter(a => a.severity === 'warning').length * 5
  ));

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const summary = criticalCount > 0
    ? `${criticalCount} critical anomaly detected. Revenue pattern needs attention.`
    : anomalies.length > 0
    ? `${anomalies.length} minor anomalies detected. Revenue is generally stable.`
    : 'No anomalies detected. Revenue patterns are healthy.';

  return {
    anomalies: anomalies.sort((a, b) => b.date.localeCompare(a.date)),
    healthScore,
    summary,
    projectedMonthEnd: trend.projectedEndOfMonth,
  };
}

// ─── P&L Summary ────────────────────────────────────────────────────────────

export async function getPnLSummary(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  startDate: string,
  endDate: string
): Promise<PnLSummary> {
  const [transactions, expenses] = await Promise.all([
    db.fetchAll<{ Amount: number; Status: string }>('Transactions', {
      filterByFormula: `AND(IS_AFTER({Date}, '${startDate}'), IS_BEFORE({Date}, '${endDate}'), {Status} != 'Refunded')`,
      fields: ['Amount', 'Status'],
    }),
    db.fetchAll<{
      Category: string;
      Subcategory: string;
      Amount: number;
      Date: string;
    }>('Transactions', {
      filterByFormula: `AND(IS_AFTER({Date}, '${startDate}'), IS_BEFORE({Date}, '${endDate}'), {Type} = 'Expense')`,
      fields: ['Category', 'Subcategory', 'Amount', 'Date'],
    }),
  ]);

  const totalRevenue = transactions.reduce((s, r) => s + (r.fields.Amount || 0), 0);

  // Estimated COGS (30% of revenue for med spas)
  const cogsRate = 0.30;
  const cogs = totalRevenue * cogsRate;
  const grossProfit = totalRevenue - cogs;

  // Categorize expenses
  const expenseCategories: Record<string, { amount: number; items: { name: string; amount: number }[] }> = {
    'Product Costs': { amount: cogs * 0.5, items: [] },
    'Labor': { amount: totalRevenue * 0.25, items: [] },
    'Rent & Utilities': { amount: 5000, items: [] },
    'Marketing': { amount: totalRevenue * 0.08, items: [] },
    'Equipment': { amount: 1000, items: [] },
    'Insurance': { amount: 2000, items: [] },
    'Supplies': { amount: totalRevenue * 0.03, items: [] },
    'Admin & Software': { amount: 1500, items: [] },
  };

  for (const exp of expenses) {
    const cat = exp.fields.Category || 'Admin & Software';
    if (expenseCategories[cat]) {
      expenseCategories[cat].amount += exp.fields.Amount || 0;
      expenseCategories[cat].items.push({
        name: exp.fields.Subcategory || 'General',
        amount: exp.fields.Amount || 0,
      });
    }
  }

  const opExpenses: ExpenseCategory[] = Object.entries(expenseCategories).map(([name, data]) => ({
    name,
    amount: Math.round(data.amount * 100) / 100,
    budget: Math.round(data.amount * 1.1 * 100) / 100, // 10% buffer as budget
    variance: -10,
    percentOfRevenue: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 1000) / 10 : 0,
    subcategories: data.items,
  }));

  const totalExpenses = opExpenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const line = (amount: number, prior = 0): PnLLineItem => ({
    amount: Math.round(amount * 100) / 100,
    priorPeriod: Math.round(prior * 100) / 100,
    change: prior > 0 ? Math.round(((amount - prior) / prior) * 1000) / 10 : 0,
    percentOfRevenue: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 1000) / 10 : 0,
  });

  return {
    revenue: line(totalRevenue),
    costOfGoods: line(cogs),
    grossProfit: line(grossProfit),
    operatingExpenses: opExpenses,
    totalExpenses: line(totalExpenses),
    netIncome: line(netIncome),
    margins: {
      gross: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0,
      operating: totalRevenue > 0 ? Math.round(((grossProfit - totalExpenses + cogs) / totalRevenue) * 1000) / 10 : 0,
      net: totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 1000) / 10 : 0,
    },
    period: { start: startDate, end: endDate },
  };
}

// ─── Expense Summary ────────────────────────────────────────────────────────

export async function getExpenseSummary(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  startDate: string,
  endDate: string
): Promise<ExpenseSummary> {
  const expenses = await db.fetchAll<{
    Category: string;
    Amount: number;
    Vendor: string;
    Date: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startDate}'), IS_BEFORE({Date}, '${endDate}'), {Type} = 'Expense')`,
    fields: ['Category', 'Amount', 'Vendor', 'Date'],
  });

  const total = expenses.reduce((s, e) => s + (e.fields.Amount || 0), 0);
  const categoryMap = new Map<string, number>();
  const vendorMap = new Map<string, number>();

  for (const exp of expenses) {
    const cat = (exp.fields.Category || 'other') as ExpenseCategoryType;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + (exp.fields.Amount || 0));
    const vendor = exp.fields.Vendor || 'Unknown';
    vendorMap.set(vendor, (vendorMap.get(vendor) || 0) + (exp.fields.Amount || 0));
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category: category as ExpenseCategoryType,
    amount: Math.round(amount * 100) / 100,
    percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    trend: 0,
  })).sort((a, b) => b.amount - a.amount);

  const topVendors = Array.from(vendorMap.entries())
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    total: Math.round(total * 100) / 100,
    byCategory,
    monthOverMonth: 0,
    budgetUtilization: 75, // Would compare against budget
    topVendors,
  };
}

// ─── Cash Flow ──────────────────────────────────────────────────────────────

export async function getCashFlowOverview(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  months = 3
): Promise<CashFlowOverview> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const transactions = await db.fetchAll<{
    Date: string;
    Amount: number;
    Type: string;
    Service: string;
    Category: string;
    Status: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startDate}'), {Status} != 'Refunded')`,
    fields: ['Date', 'Amount', 'Type', 'Service', 'Category', 'Status'],
  });

  const inflows: CashFlowEntry[] = [];
  const outflows: CashFlowEntry[] = [];

  for (const { fields } of transactions) {
    const entry: CashFlowEntry = {
      date: fields.Date || '',
      description: fields.Service || fields.Category || 'Transaction',
      amount: fields.Amount || 0,
      category: fields.Category || fields.Service || '',
      type: fields.Type === 'Expense' ? 'outflow' : 'inflow',
    };

    if (entry.type === 'inflow') inflows.push(entry);
    else outflows.push(entry);
  }

  const totalInflow = inflows.reduce((s, e) => s + e.amount, 0);
  const totalOutflow = outflows.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  // Simple projection
  const avgMonthlyInflow = totalInflow;
  const avgMonthlyOutflow = totalOutflow;
  const projection: CashFlowProjection[] = [];
  let balance = netCashFlow;

  for (let i = 1; i <= months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    balance += avgMonthlyInflow - avgMonthlyOutflow;
    projection.push({
      month: monthDate.toISOString().slice(0, 7),
      projectedInflow: Math.round(avgMonthlyInflow * 100) / 100,
      projectedOutflow: Math.round(avgMonthlyOutflow * 100) / 100,
      projectedBalance: Math.round(balance * 100) / 100,
    });
  }

  const monthlyBurn = avgMonthlyOutflow - avgMonthlyInflow;
  const runway = monthlyBurn > 0 ? Math.max(0, Math.round(netCashFlow / monthlyBurn)) : 999;

  return {
    currentBalance: Math.round(netCashFlow * 100) / 100,
    inflows: inflows.slice(0, 20),
    outflows: outflows.slice(0, 20),
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    projection,
    runway,
  };
}
