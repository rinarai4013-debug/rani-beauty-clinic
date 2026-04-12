import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { withSentry } from '@/lib/sentry-utils';

export async function GET(request: NextRequest) {
  return withSentry('dashboard/plaid/transactions', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
      const storage = await readStorage();
      const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status'); // unmatched, auto-matched, manually-matched, excluded, categorized
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let transactions = [...storage.transactions];

    // Filter by status
    if (status) {
      transactions = transactions.filter((tx) => tx.reconciliationStatus === status);
    }

    // Filter by Rani category
    if (category) {
      transactions = transactions.filter((tx) => tx.raniCategory === category);
    }

    // Filter by date range
    if (startDate) {
      transactions = transactions.filter((tx) => tx.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((tx) => tx.date <= endDate);
    }

    // Search by name/merchant
    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(
        (tx) =>
          tx.name.toLowerCase().includes(q) ||
          (tx.merchantName && tx.merchantName.toLowerCase().includes(q))
      );
    }

    const total = transactions.length;
    const start = (page - 1) * limit;
    const paged = transactions.slice(start, start + limit);

      return NextResponse.json({
        transactions: paged,
        total,
        page,
        hasMore: start + limit < total,
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
  });
}
