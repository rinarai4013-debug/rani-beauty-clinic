import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SaleSchema = z.object({
  amount: z.number().positive(),
  serviceName: z.string().min(1),
  paymentMethod: z.string().min(1),
  provider: z.string().min(1),
  isFinancing: z.boolean().optional(),
  financingProvider: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withSentry('dashboard-entry-sale', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'entry_sale')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = SaleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
    }

    try {
      const recordId = await createRecord(Tables.transactions(), {
        Amount: parsed.data.amount,
        'Service Name': parsed.data.serviceName,
        'Payment Method': parsed.data.paymentMethod,
        Provider: parsed.data.provider,
        Type: 'Service',
        Status: 'Completed',
        'Is Financing': parsed.data.isFinancing ?? false,
        'Financing Provider': parsed.data.financingProvider ?? '',
      });
      cache.invalidate('kpis');
      cache.invalidate('revenue');
      return NextResponse.json({ success: true, recordId });
    } catch (error) {
      console.error('[entry/sale]', error);
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }
  });
}
