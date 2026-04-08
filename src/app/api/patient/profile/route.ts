import { NextRequest, NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

const updateSchema = z.object({
  phone: z.string().min(1).max(20).optional(),
  preferredContact: z.enum(['Phone', 'Email', 'Text']).optional(),
}).strict();

export async function GET() {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await rateLimitedQuery(() =>
      Tables.clients().find(session.patientId)
    );

    return NextResponse.json({
      profile: {
        id: client.id,
        name: client.fields[FIELDS.clients.name] as string || '',
        email: client.fields[FIELDS.clients.email] as string || '',
        phone: client.fields[FIELDS.clients.phone] as string || '',
        preferredContact: client.fields[FIELDS.clients.preferredContact] as string || '',
        status: client.fields[FIELDS.clients.status] as string || '',
      },
    });
  } catch (error) {
    console.error('[Patient API] Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('patient-profile', ip, RATE_LIMITS.FORM);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.phone !== undefined) {
      updates[FIELDS.clients.phone] = parsed.data.phone;
    }
    if (parsed.data.preferredContact !== undefined) {
      updates[FIELDS.clients.preferredContact] = parsed.data.preferredContact;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateRecord(Tables.clients(), session.patientId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Patient API] Profile PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
