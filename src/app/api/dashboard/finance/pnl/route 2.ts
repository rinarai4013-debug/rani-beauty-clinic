import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { generateFinancialIntelligence, type FinanceInput, type RevenueEntry, type ExpenseEntry } from '@/lib/finance/pnl-engine';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

    // Query Transactions table for ALL completed transactions (last 90 days)
    let transactionRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      transactionRecords = await fetchAll(
        Tables.transactions(),
        {
          filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${ninetyDaysAgoStr}'))`,
        }
      );
    } catch (err) {
      console.error('Error fetching transactions for P&L:', err);
    }

    // Separate into revenue (positive amounts) and expenses (negative amounts or [Expense] type)
    const revenue: RevenueEntry[] = [];
    const expenses: ExpenseEntry[] = [];

    for (const rec of transactionRecords) {
      const amount = Number(rec.fields[FIELDS.transactions.amount]) || 0;
      const dateStr = (rec.fields[FIELDS.transactions.date] as string) || now.toISOString().slice(0, 10);
      const type = (rec.fields[FIELDS.transactions.type] as string) || '';
      const serviceName = (rec.fields[FIELDS.transactions.serviceName] as string) || '';
      const provider = (rec.fields[FIELDS.transactions.provider] as string) || 'Unknown';
      const paymentMethod = ((rec.fields[FIELDS.transactions.paymentMethod] as string) || 'card').toLowerCase();
      const isFinancing = !!(rec.fields[FIELDS.transactions.isFinancing]);
      const clientIds = (rec.fields['Client'] as string[]) || [];

      // Determine if this is an expense or revenue
      const isExpense = amount < 0 || type.toLowerCase().includes('expense') || type.toLowerCase().includes('refund');

      if (isExpense) {
        expenses.push({
          date: dateStr,
          amount: Math.abs(amount),
          vendor: provider,
          description: serviceName || type || 'Expense',
          category: undefined, // Let the engine auto-categorize
        });
      } else {
        // Map payment method to engine's expected format
        let mappedPaymentMethod: 'cash' | 'card' | 'financing' | 'membership' | 'package' = 'card';
        if (paymentMethod.includes('cash')) mappedPaymentMethod = 'cash';
        else if (isFinancing || paymentMethod.includes('afterpay') || paymentMethod.includes('cherry') || paymentMethod.includes('patientfi')) mappedPaymentMethod = 'financing';

        // Infer category from service name
        const category = inferServiceCategory(serviceName);

        revenue.push({
          date: dateStr,
          amount,
          service: serviceName || 'Service',
          category,
          provider,
          paymentMethod: mappedPaymentMethod,
          clientType: 'returning', // Default; we don't store client type on transactions
          clientId: clientIds[0],
        });
      }
    }

    // Query memberships for MRR
    let membershipCount = 0;
    let membershipMRR = 0;
    try {
      const membershipRecords = await fetchAll(
        Tables.memberships(),
        { filterByFormula: `{${FIELDS.memberships.status}} = 'Active'` }
      );
      membershipCount = membershipRecords.length;
      membershipMRR = membershipRecords.reduce((sum, r) => {
        return sum + (Number(r.fields[FIELDS.memberships.monthlyPrice]) || 0);
      }, 0);
    } catch {
      // Table may be empty
    }

    const financeInput: FinanceInput = {
      revenue,
      expenses,
      period: {
        start: ninetyDaysAgoStr,
        end: now.toISOString().slice(0, 10),
      },
      memberships: {
        count: membershipCount,
        monthlyRevenue: membershipMRR || 0,
      },
      bankBalance: undefined,
      monthlyFixedCosts: 28000, // Known fixed costs for Rani
    };

    const result = generateFinancialIntelligence(financeInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('P&L generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate P&L report' },
      { status: 500 }
    );
  }
}

/** Infer service category from service name */
function inferServiceCategory(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('hydra') || name.includes('facial')) return 'Facial';
  if (name.includes('botox') || name.includes('filler') || name.includes('injectable')) return 'Injectable';
  if (name.includes('laser') || name.includes('pico') || name.includes('sofwave') || name.includes('rf micro')) return 'Laser';
  if (name.includes('peel') || name.includes('vi peel') || name.includes('prx')) return 'Peel';
  if (name.includes('glp') || name.includes('nad') || name.includes('b12') || name.includes('vitamin') || name.includes('glutathione') || name.includes('immune') || name.includes('wellness')) return 'Wellness';
  if (name.includes('hair') && name.includes('remov')) return 'Hair Removal';
  if (name.includes('consult')) return 'Consultation';
  return 'Other';
}
