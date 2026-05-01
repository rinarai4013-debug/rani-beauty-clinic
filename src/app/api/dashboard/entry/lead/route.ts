import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, createRecord } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const LeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
}).refine((value) => Boolean(value.email || value.phone), {
  message: 'Email or phone is required',
});

export async function POST(request: NextRequest) {
  return withSentry('dashboard-entry-lead', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'entry_lead')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = LeadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
    }

    const clientName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    try {
      const recordId = await createRecord(Tables.clients(), {
        Client: clientName,
        Email: parsed.data.email ?? '',
        Phone: parsed.data.phone ?? '',
        Status: 'New Lead',
      });
      cache.invalidate('leads');

      // HIPAA §164.312(b): a new client record is a PHI create action.
      // Log name + the patient ID returned by Airtable for audit reconstruction.
      logPhiAccessFromRequest(request, session, {
        patientId: recordId,
        patientName: clientName,
        action: 'create',
        dataCategory: 'demographics',
        details: `Manual lead entry — email=${parsed.data.email ? 'yes' : 'no'} phone=${parsed.data.phone ? 'yes' : 'no'}`,
      });

      return NextResponse.json({ success: true, recordId });
    } catch (error) {
      console.error('[entry/lead]', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
  });
}
