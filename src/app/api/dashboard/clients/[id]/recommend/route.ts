import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { recommendNextTreatment } from '@/lib/recommendations/engine';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSentry('dashboard/clients/[id]/recommend', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const { id } = await params;
      const client = await rateLimitedQuery(() => Tables.clients().find(id));

      // HIPAA §164.312(b): log the PHI access. Treatment recommendations
      // read the full appointment history for the patient.
      logPhiAccessFromRequest(request, session, {
        patientId: client.id,
        patientName: (client.fields['Client'] as string) || 'Unknown',
        action: 'view',
        dataCategory: 'treatment_records',
        details: 'Next-best-treatment recommendation — appointment history',
      });

      const appointmentIds = (client.fields['Appointments'] as string[] | undefined) ?? [];

      const appointments = appointmentIds.length
        ? await fetchAll<{ 'Service Name'?: string; 'Service Category'?: string; Date?: string; 'Amount Paid'?: number }>(
            Tables.appointments(),
            {
              filterByFormula: `OR(${appointmentIds.map((value) => `RECORD_ID() = '${sanitizeFormulaValue(value)}'`).join(',')})`,
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
  });
}
