import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRecord, fetchAll, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { getSession } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

const canViewIncidents = new Set(['ceo', 'provider', 'operations']);

const createIncidentSchema = z.object({
  clientName: z.string().min(1),
  servicesInvolved: z.array(z.string().min(1)).min(1),
  incidentDateTime: z.string().min(1),
  providerOnDuty: z.string().min(1),
  incidentType: z.enum([
    'side effect',
    'allergic reaction',
    'equipment malfunction',
    'protocol deviation',
    'other',
  ]),
  severity: z.enum(['mild', 'moderate', 'severe', 'hospitalization']),
  narrativeDescription: z.string().min(1),
  immediateActionTaken: z.string().min(1),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().optional().default(''),
  photoAttachments: z.array(z.string()).optional().default([]),
  medicalDirectorReviewStatus: z
    .enum(['pending', 'reviewed', 'resolved'])
    .optional()
    .default('pending'),
  medicalDirectorNotes: z.string().optional().default(''),
});

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(request: NextRequest) {
  return withSentry('dashboard/incidents:get', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canViewIncidents.has(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const endDate = parseDate(url.searchParams.get('endDate')) || new Date();
    const defaultStartDate = new Date(endDate);
    defaultStartDate.setDate(defaultStartDate.getDate() - 90);
    const startDate = parseDate(url.searchParams.get('startDate')) || defaultStartDate;
    const serviceTypeFilter = (url.searchParams.get('serviceType') || '').trim().toLowerCase();

    const records = await fetchAll<Record<string, unknown>>(Tables.incidents(), {}, true);
    const clientRecords = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      { fields: [FIELDS.clients.name], maxRecords: 500 },
      true,
    );

    const filtered = records.filter((record) => {
      const fields = record.fields;
      const incidentDateRaw = String(fields[FIELDS.incidents.incidentDateTime] || '');
      const incidentDate = parseDate(incidentDateRaw);
      if (!incidentDate) return false;

      if (incidentDate < startDate || incidentDate > endDate) return false;

      if (!serviceTypeFilter) return true;
      const services = String(fields[FIELDS.incidents.servicesInvolved] || '').toLowerCase();
      return services.includes(serviceTypeFilter);
    });

    filtered.sort((a, b) => {
      const aDate = parseDate(String(a.fields[FIELDS.incidents.incidentDateTime] || ''))?.getTime() || 0;
      const bDate = parseDate(String(b.fields[FIELDS.incidents.incidentDateTime] || ''))?.getTime() || 0;
      return bDate - aDate;
    });

    const availableServices = Array.from(
      new Set(
        records
          .map((record) => String(record.fields[FIELDS.incidents.servicesInvolved] || ''))
          .flatMap((value) => value.split(',').map((service) => service.trim()))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const clientOptions = Array.from(
      new Set(
        clientRecords
          .map((record) => String(record.fields[FIELDS.clients.name] || '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      incidents: filtered,
      availableServices,
      clientOptions,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        serviceType: serviceTypeFilter || null,
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withSentry('dashboard/incidents:post', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident payload', details: parsed.error.issues },
        { status: 422 },
      );
    }

    const data = parsed.data;
    const canWriteMedicalDirectorFields = session.role === 'ceo' || session.role === 'provider';

    const fields: Record<string, unknown> = {
      [FIELDS.incidents.clientName]: data.clientName,
      [FIELDS.incidents.servicesInvolved]: data.servicesInvolved.join(', '),
      [FIELDS.incidents.incidentDateTime]: data.incidentDateTime,
      [FIELDS.incidents.providerOnDuty]: data.providerOnDuty,
      [FIELDS.incidents.incidentType]: data.incidentType,
      [FIELDS.incidents.severity]: data.severity,
      [FIELDS.incidents.narrativeDescription]: data.narrativeDescription,
      [FIELDS.incidents.immediateActionTaken]: data.immediateActionTaken,
      [FIELDS.incidents.followUpRequired]: data.followUpRequired,
      [FIELDS.incidents.followUpNotes]: data.followUpNotes,
      [FIELDS.incidents.photoAttachments]: data.photoAttachments,
      [FIELDS.incidents.reportedBy]: session.displayName,
      [FIELDS.incidents.medicalDirectorReviewStatus]: canWriteMedicalDirectorFields
        ? data.medicalDirectorReviewStatus
        : 'pending',
      [FIELDS.incidents.medicalDirectorNotes]: canWriteMedicalDirectorFields
        ? data.medicalDirectorNotes
        : '',
    };

    const incidentId = await createRecord(Tables.incidents(), fields);

    return NextResponse.json({
      success: true,
      id: incidentId,
    });
  });
}
