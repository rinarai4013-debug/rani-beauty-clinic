import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

const ExpenseSchema = z.object({
  amount: z.number().positive(),
  vendor: z.string().min(1),
  category: z.string().min(1),
  paymentMethod: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withSentry('dashboard-entry-expense', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'entry_expense')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = ExpenseSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
    }

    try {
      const recordId = await createRecord(Tables.transactions(), {
        Amount: -parsed.data.amount,
        Type: 'Expense',
        Status: 'Completed',
        Vendor: parsed.data.vendor,
        Category: parsed.data.category,
        'Payment Method': parsed.data.paymentMethod ?? '',
      });
      cache.invalidate('finance-expenses');
      return NextResponse.json({ success: true, recordId });
    } catch (error) {
      console.error('[entry/expense]', error);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
  });
}
