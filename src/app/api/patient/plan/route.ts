import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, fetchFirst } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

export async function GET() {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const safeName = sanitizeFormulaValue(session.name);

    // Fetch the active (non-archived) treatment plan for this client
    const plans = await fetchFirst(
      Tables.treatmentPlans(),
      1,
      {
        filterByFormula: `AND({${FIELDS.treatmentPlans.clientName}} = '${safeName}', {${FIELDS.treatmentPlans.status}} != 'Archived')`,
        sort: [{ field: FIELDS.treatmentPlans.createdDate, direction: 'desc' }],
      },
      true // skipTestFilter — Treatment Plans table may not have "Is Test"
    );

    if (plans.length === 0) {
      return NextResponse.json({ plan: null });
    }

    const record = plans[0];
    const fields = record.fields as Record<string, unknown>;

    // Parse services included (may be JSON string or plain text)
    let servicesIncluded: unknown = fields[FIELDS.treatmentPlans.servicesIncluded];
    if (typeof servicesIncluded === 'string') {
      try {
        servicesIncluded = JSON.parse(servicesIncluded);
      } catch {
        // Keep as plain text if not valid JSON
      }
    }

    return NextResponse.json({
      plan: {
        id: record.id,
        planTier: fields[FIELDS.treatmentPlans.planTier] || '',
        planValue: fields[FIELDS.treatmentPlans.planValue] || 0,
        servicesIncluded,
        status: fields[FIELDS.treatmentPlans.status] || '',
        createdDate: fields[FIELDS.treatmentPlans.createdDate] || '',
        planUrl: fields[FIELDS.treatmentPlans.planUrl] || '',
      },
    });
  } catch (error) {
    console.error('[Patient API] Plan error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment plan' },
      { status: 500 }
    );
  }
}
