import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { Tables, fetchAll, createRecord, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { cache, TTL } from '@/lib/cache';

const SavePlanSchema = z.object({
  client: z.array(z.string()).optional(),
  clientName: z.string().min(1),
  planName: z.string().min(1),
  planTier: z.string(),
  planValue: z.number().min(0),
  servicesIncluded: z.string(),
  intakeRecordId: z.string().optional(),
});

const planBuilderQuerySchema = z.object({
  id: z.string().trim().min(1).optional(),
});

const UpdatePlanSchema = z.object({
  id: z.string().min(1),
  planTier: z.string().optional(),
  planValue: z.number().min(0).optional(),
  planName: z.string().min(1).optional(),
  servicesIncluded: z.string().optional(),
  status: z.enum(['Draft', 'Sent', 'Viewed', 'Selected', 'Booked', 'Expired', 'Archived']).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = planBuilderQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { id: planId } = parsedQuery.data;

  try {
    if (planId) {
      const cacheKey = `treatment-plan-${planId}`;
      const cached = cache.get<Record<string, unknown>>(cacheKey);
      if (cached) return NextResponse.json(cached);

      const record = await Tables.treatmentPlans().find(planId);
      const data = { id: record.id, fields: record.fields };
      cache.set(cacheKey, data, TTL.STANDARD);
      return NextResponse.json(data);
    }

    const cacheKey = 'treatment-plans-list';
    const cached = cache.get<unknown[]>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const records = await fetchAll(Tables.treatmentPlans(), {
      filterByFormula: `{${FIELDS.treatmentPlans.status}} != 'Archived'`,
      sort: [{ field: FIELDS.treatmentPlans.createdDate, direction: 'desc' }],
    });

    const data = records.map((r) => ({ id: r.id, fields: r.fields }));
    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Plan Builder API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = SavePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid plan data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fields: Record<string, unknown> = {
      [FIELDS.treatmentPlans.clientName]: parsed.data.clientName,
      'Plan Name': parsed.data.planName,
      [FIELDS.treatmentPlans.planTier]: parsed.data.planTier,
      [FIELDS.treatmentPlans.planValue]: parsed.data.planValue,
      [FIELDS.treatmentPlans.servicesIncluded]: parsed.data.servicesIncluded,
      [FIELDS.treatmentPlans.status]: 'Draft',
      [FIELDS.treatmentPlans.createdDate]: new Date().toISOString().split('T')[0],
    };

    if (parsed.data.client?.length) {
      fields[FIELDS.treatmentPlans.client] = parsed.data.client;
    }
    if (parsed.data.intakeRecordId) {
      fields[FIELDS.treatmentPlans.intakeRecordId] = parsed.data.intakeRecordId;
    }

    const recordId = await createRecord(Tables.treatmentPlans(), fields);
    cache.invalidatePrefix('treatment-plans');

    return NextResponse.json({ id: recordId }, { status: 201 });
  } catch (error) {
    console.error('[Plan Builder API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpdatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const fields: Record<string, unknown> = {};

    if (updates.planTier) fields[FIELDS.treatmentPlans.planTier] = updates.planTier;
    if (updates.planValue !== undefined) fields[FIELDS.treatmentPlans.planValue] = updates.planValue;
    if (updates.planName) fields['Plan Name'] = updates.planName;
    if (updates.servicesIncluded) fields[FIELDS.treatmentPlans.servicesIncluded] = updates.servicesIncluded;
    if (updates.status) fields[FIELDS.treatmentPlans.status] = updates.status;

    await updateRecord(Tables.treatmentPlans(), id, fields);
    cache.invalidatePrefix('treatment-plans');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Plan Builder API] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = planBuilderQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { id: planId } = parsedQuery.data;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    await updateRecord(Tables.treatmentPlans(), planId, {
      [FIELDS.treatmentPlans.status]: 'Archived',
    });
    cache.invalidatePrefix('treatment-plans');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Plan Builder API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to archive plan' }, { status: 500 });
  }
}
