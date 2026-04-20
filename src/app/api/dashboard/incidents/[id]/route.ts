import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateRecord, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { getSession } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

const patchIncidentSchema = z.object({
  medicalDirectorReviewStatus: z.enum(['pending', 'reviewed', 'resolved']).optional(),
  medicalDirectorNotes: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'hospitalization']).optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withSentry('dashboard/incidents/[id]:patch', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canEditMedicalDirectorFields = session.role === 'ceo' || session.role === 'provider';
    if (!canEditMedicalDirectorFields) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = patchIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident update payload', details: parsed.error.issues },
        { status: 422 },
      );
    }

    const data = parsed.data;
    const fields: Record<string, unknown> = {};

    if (typeof data.medicalDirectorReviewStatus === 'string') {
      fields[FIELDS.incidents.medicalDirectorReviewStatus] = data.medicalDirectorReviewStatus;
    }
    if (typeof data.medicalDirectorNotes === 'string') {
      fields[FIELDS.incidents.medicalDirectorNotes] = data.medicalDirectorNotes;
    }
    if (typeof data.severity === 'string') {
      fields[FIELDS.incidents.severity] = data.severity;
    }
    if (typeof data.followUpRequired === 'boolean') {
      fields[FIELDS.incidents.followUpRequired] = data.followUpRequired;
    }
    if (typeof data.followUpNotes === 'string') {
      fields[FIELDS.incidents.followUpNotes] = data.followUpNotes;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    await updateRecord(Tables.incidents(), params.id, fields);

    return NextResponse.json({
      success: true,
      id: params.id,
    });
  });
}
