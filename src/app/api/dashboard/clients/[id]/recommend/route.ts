import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { recommendNextTreatment } from '@/lib/recommendations/engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const client = await rateLimitedQuery(() => Tables.clients().find(id));
    const appointmentIds = (client.fields['Appointments'] as string[] | undefined) ?? [];

    const appointments = appointmentIds.length
      ? await fetchAll<{ 'Service Name'?: string; 'Service Category'?: string; Date?: string; 'Amount Paid'?: number }>(
          Tables.appointments(),
          {
            filterByFormula: `OR(${appointmentIds.map((value) => `RECORD_ID() = '${value}'`).join(',')})`,
          }
        )
      : [];

    const result = recommendNextTreatment({
      treatmentHistory: appointments.map((record) => ({
        service: record.fields['Service Name'] ?? '',
        category: record.fields['Service Category'] ?? '',
        date: record.fields.Date ?? '',
        amountPaid: record.fields['Amount Paid'] ?? 0,
      })),
      avgSpend: 0,
      daysSinceLastVisit: 30,
    });

    return NextResponse.json(
      'recommendations' in result
        ? result
        : {
            recommendations: [result.primary, ...result.alternatives],
            strategies: result.insights,
          }
    );
  } catch (error) {
    console.error('[clients/recommend]', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
