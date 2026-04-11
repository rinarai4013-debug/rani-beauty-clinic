import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/lib/plaid/storage';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { z } from 'zod';

const plaidTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(500).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    status: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    search: z.string().trim().max(200).optional(),
  })
  .partial()
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 50,
    status: value.status,
    category: value.category,
    startDate: value.startDate,
    endDate: value.endDate,
    search: value.search,
  }))
  .superRefine((data, context) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      context.addIssue({
        code: 'custom',
        message: 'startDate must be before or equal to endDate',
        path: ['startDate'],
      });
    }
  });

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'manage_bank_connections')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const storage = await readStorage();
    const { searchParams } = new URL(request.url);

    const parsedQuery = plaidTransactionsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const {
      page,
      limit,
      status,
      category,
      startDate,
      endDate,
      search,
    } = parsedQuery.data;

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
}
