import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Service Name': string;
  'Payment Method': string;
  'Status': string;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_finance')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<unknown>('finance-expenses');
    if (cached) {
      return NextResponse.json(cached);
    }

    const records = await fetchAll<TransactionFields>(Tables.transactions(), {
      filterByFormula: `OR({Type} = 'Expense', {Type} = 'Inventory')`,
    });

    const expenses = records.map((r) => ({
      id: r.id,
      date: r.fields['Date'] || '',
      type: r.fields['Type'] || '',
      amount: Math.abs(r.fields['Amount'] || 0),
      category: r.fields['Service Name'] || 'Uncategorized',
      paymentMethod: r.fields['Payment Method'] || '',
      status: r.fields['Status'] || '',
    }));

    // Group by category
    const categoryMap = new Map<string, number>();
    for (const exp of expenses) {
      const existing = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, existing + exp.amount);
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const data = {
      expenses,
      summary: {
        total: Math.round(total * 100) / 100,
        byCategory,
      },
    };

    cache.set('finance-expenses', data, TTL.SLOW);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}
