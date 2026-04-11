import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('patient/membership', async () => {
    try {
      const session = await getPatientSession();
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Fetch the client record to get linked membership IDs
      const client = await rateLimitedQuery(() => Tables.clients().find(session.patientId));

      const membershipIds = (client.fields[FIELDS.clients.memberships] as string[]) || [];

      if (membershipIds.length === 0) {
        return NextResponse.json({ membership: null });
      }

      // Fetch all linked membership records
      const membershipRecords = await Promise.all(
        membershipIds.map((id) => rateLimitedQuery(() => Tables.memberships().find(id))),
      );

      // Find the active membership (prefer Active, fall back to most recent)
      const memberships = membershipRecords.map((record) => ({
        id: record.id,
        tier: (record.fields[FIELDS.memberships.tier] as string) || '',
        monthlyPrice: (record.fields[FIELDS.memberships.monthlyPrice] as number) || 0,
        status: (record.fields[FIELDS.memberships.status] as string) || '',
        startDate: (record.fields[FIELDS.memberships.startDate] as string) || '',
      }));

      const activeMembership =
        memberships.find((m) => m.status === 'Active') ||
        memberships.sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0];

      return NextResponse.json({
        membership: activeMembership || null,
        allMemberships: memberships,
      });
    } catch (error) {
      console.error('[Patient API] Membership error:', error);
      return NextResponse.json({ error: 'Failed to fetch membership' }, { status: 500 });
    }
  });
}
