import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { analyzeCashFlow, type CashFlowInput, type FixedCost, type VariableCost, type Receivable, type PayrollEntry, type Obligation } from '@/lib/finance/cash-flow';

/**
 * GET /api/dashboard/finance/cash-flow
 * Cash flow analysis with burn rate, runway, reserves, and projections.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch last 12 months of transactions
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = twelveMonthsAgo.toISOString().slice(0, 10);

    let records: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      records = await fetchAll(Tables.transactions(), {
        filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${startDate}'))`,
      });
    } catch (err) {
      console.error('Error fetching transactions for cash flow:', err);
    }

    // Aggregate monthly revenue and expenses
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    for (const rec of records) {
      const amount = Number(rec.fields[FIELDS.transactions.amount]) || 0;
      const date = String(rec.fields[FIELDS.transactions.date] ?? '').slice(0, 7);
      if (!date) continue;

      if (!monthlyData[date]) monthlyData[date] = { revenue: 0, expenses: 0 };
      if (amount > 0) monthlyData[date].revenue += amount;
      else monthlyData[date].expenses += Math.abs(amount);
    }

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyRevenue = sortedMonths.map(m => monthlyData[m].revenue);
    const monthlyExpenses = sortedMonths.map(m => monthlyData[m].expenses);

    // Default fixed costs for Rani Beauty Clinic
    const fixedCosts: FixedCost[] = [
      { name: 'Rent', category: 'rent', monthlyAmount: 4500, dueDay: 1 },
      { name: 'Insurance', category: 'insurance', monthlyAmount: 800 },
      { name: 'Software (Mangomint + tools)', category: 'software', monthlyAmount: 600 },
      { name: 'Utilities', category: 'utilities', monthlyAmount: 350 },
    ];

    const variableCosts: VariableCost[] = [
      { name: 'Clinical Supplies', category: 'supplies', avgMonthlyAmount: 3000, lastThreeMonths: monthlyExpenses.slice(-3).map(e => e * 0.25) },
      { name: 'Marketing', category: 'marketing', avgMonthlyAmount: 2000, lastThreeMonths: monthlyExpenses.slice(-3).map(e => e * 0.15) },
    ];

    // Placeholder receivables, payroll, and obligations
    const receivables: Receivable[] = [];
    const payroll: PayrollEntry[] = [];
    const obligations: Obligation[] = [];

    // Estimate bank balance from recent data
    const recentRevenue = monthlyRevenue.slice(-3);
    const recentExpenses = monthlyExpenses.slice(-3);
    const avgNetMonthly = recentRevenue.length > 0
      ? (recentRevenue.reduce((s, v) => s + v, 0) - recentExpenses.reduce((s, v) => s + v, 0)) / recentRevenue.length
      : 0;
    const estimatedBankBalance = Math.max(0, avgNetMonthly * 6); // rough estimate

    const input: CashFlowInput = {
      bankBalance: estimatedBankBalance,
      monthlyRevenue,
      monthlyExpenses,
      fixedCosts,
      variableCosts,
      receivables,
      payroll,
      upcomingObligations: obligations,
    };

    const result = analyzeCashFlow(input);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Cash flow API error:', err);
    return NextResponse.json({ error: 'Failed to analyze cash flow' }, { status: 500 });
  }
}
