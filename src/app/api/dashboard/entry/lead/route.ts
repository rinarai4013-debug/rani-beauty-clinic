import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

const LeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
}).refine((value) => Boolean(value.email || value.phone), {
  message: 'Email or phone is required',
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'entry_lead')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = LeadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }

  try {
    const recordId = await createRecord(Tables.clients(), {
      Client: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
      Email: parsed.data.email ?? '',
      Phone: parsed.data.phone ?? '',
      Status: 'New Lead',
    });
    cache.invalidate('leads');
    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('[entry/lead]', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
