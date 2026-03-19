import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll, createRecord } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

interface TreatmentPlanFields {
  'Client'?: string[];         // Linked record
  'Plan Tier'?: string;
  'Plan Value'?: number;
  'Services Included'?: string;
  'Plan URL'?: string;
  'Status'?: string;
  'Created Date'?: string;
  'Intake Record ID'?: string;
  'Client Name'?: string;
}

interface AlertCreateFields {
  'Type': string;
  'Severity': string;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
}

/**
 * GET /api/dashboard/treatment-plans?clientId=xxx
 * Fetch treatment plans for a specific client.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientId = request.nextUrl.searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'clientId query param is required' }, { status: 400 });
  }

  const cacheKey = `treatment-plans-${clientId}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const safeId = sanitizeFormulaValue(clientId);
    const records = await fetchAll<TreatmentPlanFields>(Tables.treatmentPlans(), {
      filterByFormula: `FIND("${safeId}", ARRAYJOIN({Client}))`,
      sort: [{ field: 'Created Date', direction: 'desc' }],
    }, true);

    const plans = records.map((r) => ({
      id: r.id,
      clientId: r.fields['Client']?.[0] || null,
      planTier: r.fields['Plan Tier'] || '',
      planValue: r.fields['Plan Value'] || 0,
      servicesIncluded: r.fields['Services Included'] || '',
      planUrl: r.fields['Plan URL'] || '',
      status: r.fields['Status'] || 'Sent',
      createdDate: r.fields['Created Date'] || '',
      intakeRecordId: r.fields['Intake Record ID'] || '',
      clientName: r.fields['Client Name'] || '',
    }));

    const data = { plans };
    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Treatment plans GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch treatment plans' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/treatment-plans
 * Save a treatment plan record to Airtable.
 * Also creates a follow-up alert if the plan status is "Sent".
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_clients')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      planTier,
      planValue,
      servicesIncluded,
      planUrl,
      status,
      intakeRecordId,
    } = body;

    if (!clientName || !planTier) {
      return NextResponse.json({ error: 'clientName and planTier are required' }, { status: 400 });
    }

    const fields: Partial<TreatmentPlanFields> = {
      'Plan Tier': planTier,
      'Plan Value': planValue || 0,
      'Services Included': servicesIncluded || '',
      'Plan URL': planUrl || '',
      'Status': status || 'Sent',
      'Created Date': new Date().toISOString(),
      'Intake Record ID': intakeRecordId || '',
      'Client Name': clientName,
    };

    // Link to client record if we have a client ID
    if (clientId) {
      fields['Client'] = [clientId];
    }

    const recordId = await createRecord<TreatmentPlanFields>(Tables.treatmentPlans(), fields);

    // Create a follow-up alert if plan was just sent (not yet booked)
    if ((status || 'Sent') !== 'Booked') {
      try {
        await createRecord<AlertCreateFields>(Tables.alerts(), {
          'Type': 'follow_up',
          'Severity': 'warning',
          'Message': `${clientName} received a ${planTier} treatment plan ($${planValue?.toLocaleString() || '0'}) but hasn't booked yet`,
          'Action Recommended': `Follow up with ${clientName} about their ${planTier} plan. Call or text to answer questions and help them book.`,
          'Status': 'active',
          'Created Date': new Date().toISOString(),
        });
      } catch (alertErr) {
        console.error('Failed to create follow-up alert:', alertErr);
        // Don't fail the whole request if alert creation fails
      }
    }

    // Invalidate related caches
    cache.invalidatePrefix('treatment-plans');
    cache.invalidate('alerts');

    return NextResponse.json({ success: true, recordId });
  } catch (error) {
    console.error('Treatment plans POST error:', error);
    return NextResponse.json({ error: 'Failed to save treatment plan' }, { status: 500 });
  }
}
