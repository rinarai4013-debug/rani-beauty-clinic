import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import {
  generateFinancialIntelligence,
  type FinanceInput,
  type RevenueEntry,
  type ExpenseEntry,
} from '@/lib/finance/pnl-engine';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * GET /api/dashboard/finance/pnl
 *
 * Returns P&L intelligence from real Airtable transaction data.
 * Engine: src/lib/finance/pnl-engine.ts — generateFinancialIntelligence()
 * Agent: Finance Strategist
 *
 * Queries: Transactions table (revenue) + Alerts table (expenses logged via entry forms)
 */

interface TransactionFields {
  'Date': string;
  'Amount': number;
  'Service Name': string;
  'Category': string;
  'Provider': string;
  'Payment Method': string;
}

interface ExpenseAlertFields {
  'Type': string;
  'Message': string;
  'Created Date': string;
}

export async function GET() {
  return withSentry('dashboard/finance/pnl', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_finance')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cacheKey = 'finance-pnl';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate current month period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    // Previous month for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0];

    const safePeriodStart = sanitizeFormulaValue(periodStart);
    const safePeriodEnd = sanitizeFormulaValue(periodEnd);
    const safePrevMonthStart = sanitizeFormulaValue(prevMonthStart);
    const safePrevMonthEnd = sanitizeFormulaValue(prevMonthEnd);

    // Fetch current and previous month data in parallel
    const [currentTransactions, prevTransactions, expenseAlerts, memberships] =
      await Promise.all([
        fetchAll<TransactionFields>(Tables.transactions(), {
          filterByFormula: `AND(IS_AFTER({Date}, '${safePeriodStart}'), IS_BEFORE({Date}, '${safePeriodEnd}'))`,
        }).catch(() => []),
        fetchAll<TransactionFields>(Tables.transactions(), {
          filterByFormula: `AND(IS_AFTER({Date}, '${safePrevMonthStart}'), IS_BEFORE({Date}, '${safePrevMonthEnd}'))`,
        }).catch(() => []),
        fetchAll<ExpenseAlertFields>(Tables.alerts(), {
          filterByFormula: `AND(SEARCH("[Expense", {Message}), IS_AFTER({Created Date}, '${safePeriodStart}'))`,
        }).catch(() => []),
        fetchAll<{ Status: string; Tier: string }>(Tables.memberships(), {
          filterByFormula: `{Status} = 'Active'`,
        }).catch(() => []),
      ]);

    // Transform transactions into RevenueEntry format
    const revenue: RevenueEntry[] = currentTransactions
      .filter(t => t.fields['Amount'] && t.fields['Date'])
      .map(t => ({
        date: t.fields['Date'],
        amount: t.fields['Amount'] || 0,
        service: t.fields['Service Name'] || 'Unknown',
        category: t.fields['Category'] || 'Other',
        provider: t.fields['Provider'] || 'Unknown',
        paymentMethod: (t.fields['Payment Method'] || 'card') as RevenueEntry['paymentMethod'],
        clientType: 'returning' as const,
      }));

    // Parse expense alerts into ExpenseEntry format
    const expenses: ExpenseEntry[] = expenseAlerts
      .map(r => {
        const msg = r.fields['Message'] || '';
        const amountMatch = msg.match(/\$([0-9,.]+)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 0;
        return {
          date: r.fields['Created Date'] || periodStart,
          amount,
          category: 'misc' as const,
          description: msg,
          vendor: '',
        };
      })
      .filter(e => e.amount > 0);

    // Previous period summary
    const prevRevenue = prevTransactions.reduce(
      (sum, t) => sum + (t.fields['Amount'] || 0),
      0
    );

    // Membership data
    const activeMemberCount = memberships.length;
    const estimatedMRR = activeMemberCount * 199; // Avg membership price

    const financeInput: FinanceInput = {
      revenue,
      expenses,
      period: { start: periodStart, end: periodEnd },
      memberships: {
        count: activeMemberCount,
        monthlyRevenue: estimatedMRR,
      },
      previousPeriod: {
        revenue: prevRevenue,
        expenses: 0, // Historical expenses not tracked yet
        netIncome: prevRevenue,
      },
    };

    // Handle empty data gracefully
    if (revenue.length === 0 && expenses.length === 0) {
      const emptyResult = {
        success: true,
        data: null,
        message:
          'No financial data for current period. Revenue appears once transactions are recorded in Airtable.',
        generatedAt: new Date().toISOString(),
      };
      cache.set(cacheKey, emptyResult, TTL.SLOW);
      return NextResponse.json(emptyResult);
    }

    const intelligence = generateFinancialIntelligence(financeInput);

    const result = {
      success: true,
      data: intelligence,
      generatedAt: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.SLOW);
      return NextResponse.json(result);
    } catch (error) {
      console.error('P&L intelligence error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate P&L intelligence' },
        { status: 500 }
      );
    }
  });
}
