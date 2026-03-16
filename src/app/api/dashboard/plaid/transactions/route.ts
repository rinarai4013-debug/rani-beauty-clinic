import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';

export async function GET(request: NextRequest) {
  const storage = readStorage();
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
}
