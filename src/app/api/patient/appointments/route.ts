import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('patient/appointments', async () => {
    try {
      const session = await getPatientSession();
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Fetch the client record to get linked appointment IDs
      const client = await rateLimitedQuery(() => Tables.clients().find(session.patientId));

      const appointmentIds = (client.fields[FIELDS.clients.appointments] as string[]) || [];

      if (appointmentIds.length === 0) {
        return NextResponse.json({ upcoming: [], past: [] });
      }

      // Fetch all linked appointment records
      const appointmentRecords = await Promise.all(
        appointmentIds.map((id) => rateLimitedQuery(() => Tables.appointments().find(id))),
      );

      const now = new Date();

      const appointments = appointmentRecords.map((record) => ({
        id: record.id,
        service: (record.fields[FIELDS.appointments.service] as string) || '',
        date: (record.fields[FIELDS.appointments.date] as string) || '',
        time: (record.fields[FIELDS.appointments.time] as string) || '',
        duration: (record.fields[FIELDS.appointments.duration] as number) || 0,
        status: (record.fields[FIELDS.appointments.status] as string) || '',
        provider: (record.fields[FIELDS.appointments.provider] as string) || '',
        category: (record.fields[FIELDS.appointments.category] as string) || '',
      }));

      const upcoming = appointments
        .filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate >= now && apt.status !== 'Cancelled' && apt.status !== 'No-Show';
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const past = appointments
        .filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate < now || apt.status === 'Completed';
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return NextResponse.json({ upcoming, past });
    } catch (error) {
      console.error('[Patient API] Appointments error:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
  });
}
