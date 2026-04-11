import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

import { withSentry } from '@/lib/sentry-utils';


export async function GET() {
  return withSentry('patient/treatments', async () => {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch the client record to get linked appointment IDs
    const client = await rateLimitedQuery(() =>
      Tables.clients().find(session.patientId)
    );

    const appointmentIds = (client.fields[FIELDS.clients.appointments] as string[]) || [];

    if (appointmentIds.length === 0) {
      return NextResponse.json({ treatments: [] });
    }

    // Fetch all linked appointment records
    const appointmentRecords = await Promise.all(
      appointmentIds.map((id) =>
        rateLimitedQuery(() => Tables.appointments().find(id))
      )
    );

    // Filter for completed treatments only
    const treatments = appointmentRecords
      .filter((record) => record.fields[FIELDS.appointments.status] === 'Completed')
      .map((record) => ({
        id: record.id,
        service: record.fields[FIELDS.appointments.service] as string || '',
        date: record.fields[FIELDS.appointments.date] as string || '',
        time: record.fields[FIELDS.appointments.time] as string || '',
        duration: record.fields[FIELDS.appointments.duration] as number || 0,
        provider: record.fields[FIELDS.appointments.provider] as string || '',
        category: record.fields[FIELDS.appointments.category] as string || '',
        amountPaid: record.fields[FIELDS.appointments.amountPaid] as number || 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ treatments });
  } catch (error) {
    console.error('[Patient API] Treatments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatments' },
      { status: 500 }
    );
  }

  });
}
