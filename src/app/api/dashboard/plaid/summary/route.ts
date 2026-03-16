import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { CATEGORY_LABELS } from '@/lib/plaid/categories';
import type { RaniExpenseCategory, BankFeedSummary } from '@/types/plaid';

export async function GET(request: NextRequest) {
  const storage = readStorage();
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'mtd';

  if (!storage.accessToken) {
    return NextResponse.json({ error: 'Not connected' }, { status: 400 });
  }

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'wtd': {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last30':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const filtered = storage.transactions.filter(
    (tx) => tx.date >= startStr && !tx.pending
  );

  // Calculate inflow (negative amounts in Plaid = money in) and outflow (positive = money out)
  let monthlyInflow = 0;
  let monthlyOutflow = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of filtered) {
    if (tx.amount < 0) {
      monthlyInflow += Math.abs(tx.amount);
    } else {
      monthlyOutflow += tx.amount;
      // Categorize expenses
      const cat = tx.raniCategory || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    }
  }

  // Build expense breakdown
  const totalExpenses = monthlyOutflow;
  const expensesByCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: CATEGORY_LABELS[category as RaniExpenseCategory] || category,
      amount: Math.round(amount * 100) / 100,
      pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Build weekly cashflow
  const weeklyMap: Record<string, { income: number; expenses: number }> = {};
  for (const tx of filtered) {
    const txDate = new Date(tx.date);
    const weekStart = new Date(txDate);
    weekStart.setDate(txDate.getDate() - txDate.getDay());
    const weekKey = `W${Math.ceil((txDate.getDate()) / 7)}`;

    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { income: 0, expenses: 0 };

    if (tx.amount < 0) {
      weeklyMap[weekKey].income += Math.abs(tx.amount);
    } else {
      weeklyMap[weekKey].expenses += tx.amount;
    }
  }

  const weeklycashflow = Object.entries(weeklyMap)
    .map(([week, data]) => ({
      week,
      income: Math.round(data.income),
      expenses: Math.round(data.expenses),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Total balances from accounts
  const totalBalance = storage.accounts.reduce(
    (sum, acc) => sum + (acc.balances.current || 0), 0
  );
  const totalAvailable = storage.accounts.reduce(
    (sum, acc) => sum + (acc.balances.available || 0), 0
  );

  const unreconciledCount = storage.transactions.filter(
    (tx) => tx.reconciliationStatus === 'unmatched' && !tx.pending
  ).length;

  const summary: BankFeedSummary = {
    accounts: storage.accounts,
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalAvailable: Math.round(totalAvailable * 100) / 100,
    transactionCount: filtered.length,
    unreconciledCount,
    lastSync: storage.lastSyncedAt,
    monthlyInflow: Math.round(monthlyInflow * 100) / 100,
    monthlyOutflow: Math.round(monthlyOutflow * 100) / 100,
    weeklycashflow,
    expensesByCategory,
  };

  return NextResponse.json(summary);
}
