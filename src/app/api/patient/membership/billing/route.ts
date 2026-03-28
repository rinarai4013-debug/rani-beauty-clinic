import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

export async function GET() {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch the client record to get linked transaction IDs
    const client = await rateLimitedQuery(() =>
      Tables.clients().find(session.patientId)
    );

    const transactionIds = (client.fields[FIELDS.clients.transactions] as string[]) || [];

    if (transactionIds.length === 0) {
      return NextResponse.json({ billingHistory: [] });
    }

    // Fetch all linked transaction records
    const transactionRecords = await Promise.all(
      transactionIds.map((id) =>
        rateLimitedQuery(() => Tables.transactions().find(id))
      )
    );

    // Filter for membership-related transactions
    const membershipTypes = ['Membership', 'Membership Payment', 'Recurring'];
    const billingHistory = transactionRecords
      .filter((record) => {
        const type = record.fields[FIELDS.transactions.type] as string || '';
        const serviceName = record.fields[FIELDS.transactions.serviceName] as string || '';
        return (
          membershipTypes.some((t) => type.toLowerCase().includes(t.toLowerCase())) ||
          serviceName.toLowerCase().includes('membership')
        );
      })
      .map((record) => ({
        id: record.id,
        date: record.fields[FIELDS.transactions.date] as string || '',
        amount: record.fields[FIELDS.transactions.amount] as number || 0,
        type: record.fields[FIELDS.transactions.type] as string || '',
        serviceName: record.fields[FIELDS.transactions.serviceName] as string || '',
        status: record.fields[FIELDS.transactions.status] as string || '',
        paymentMethod: record.fields[FIELDS.transactions.paymentMethod] as string || '',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ billingHistory });
  } catch (error) {
    console.error('[Patient API] Membership billing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
