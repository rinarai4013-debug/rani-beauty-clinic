import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Tables, fetchAll, createRecord, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

// ─── GET: List saved plans (paginated, sorted by date) ───────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

    const records = await fetchAll(
      Tables.treatmentPlans(),
      {
        sort: [{ field: FIELDS.treatmentPlans.createdDate, direction: 'desc' }],
        fields: [
          FIELDS.treatmentPlans.clientName,
          FIELDS.treatmentPlans.planTier,
          FIELDS.treatmentPlans.planValue,
          FIELDS.treatmentPlans.status,
          FIELDS.treatmentPlans.createdDate,
          FIELDS.treatmentPlans.servicesIncluded,
        ],
      },
      true // skipTestFilter — Treatment Plans may not have Is Test field
    );

    // Manual pagination
    const total = records.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = records.slice(start, end);

    return NextResponse.json({
      success: true,
      plans: paginated.map((r) => ({
        id: r.id,
        clientName: r.fields[FIELDS.treatmentPlans.clientName as keyof typeof r.fields] || '',
        tier: r.fields[FIELDS.treatmentPlans.planTier as keyof typeof r.fields] || '',
        value: r.fields[FIELDS.treatmentPlans.planValue as keyof typeof r.fields] || 0,
        status: r.fields[FIELDS.treatmentPlans.status as keyof typeof r.fields] || 'Draft',
        createdDate: r.fields[FIELDS.treatmentPlans.createdDate as keyof typeof r.fields] || '',
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error('[plan-builder] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to load plans' },
      { status: 500 }
    );
  }
}

// ─── POST: Save or send a plan ───────────────────────────────────────

interface PlanBuilderBody {
  action: 'save' | 'send';
  planId?: string | null;
  data: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as PlanBuilderBody;

    if (!body.data) {
      return NextResponse.json({ error: 'Missing plan data' }, { status: 400 });
    }

    const planFields = body.data as Record<string, unknown>;

    // Set status based on action
    if (body.action === 'send') {
      planFields['Status'] = 'Sent';
    } else {
      planFields['Status'] = planFields['Status'] || 'Draft';
    }

    let planId: string;

    if (body.planId) {
      // Update existing plan
      await updateRecord(Tables.treatmentPlans(), body.planId, planFields);
      planId = body.planId;
    } else {
      // Create new plan
      planId = await createRecord(Tables.treatmentPlans(), planFields);
    }

    return NextResponse.json({
      success: true,
      planId,
      action: body.action,
    });
  } catch (err) {
    console.error('[plan-builder] POST error:', err);
    return NextResponse.json(
      { error: 'Failed to save plan' },
      { status: 500 }
    );
  }
}
