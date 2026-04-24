import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_STATUSES = new Set([
  'unmatched',
  'auto-matched',
  'manually-matched',
  'excluded',
  'categorized',
]);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parsePositiveInt(value: string | null, fallback: number): number | null {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

function isValidIsoDate(value: string | null): boolean {
  if (!value) return true;
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  return withSentry('dashboard/plaid/transactions', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
      const storage = await readStorage();
      const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get('page'), 1);
    if (page === null) {
      return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
    }

    const limit = parsePositiveInt(searchParams.get('limit'), 50);
    if (limit === null) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    const safeLimit = Math.min(limit, 200);

    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    if (status && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 });
    }

    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
      return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
    }
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    if (search && search.length > 120) {
      return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
    }

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
    const start = (page - 1) * safeLimit;
    const paged = transactions.slice(start, start + safeLimit);

      return NextResponse.json({
        transactions: paged,
        total,
        page,
        hasMore: start + safeLimit < total,
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
  });
}
