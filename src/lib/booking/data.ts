import { format } from 'date-fns';
import { Tables, fetchAll, fetchFirst, createRecord, updateRecord, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { BOOKABLE_SERVICES } from './services';
import { DEFAULT_PROVIDERS, addMinutesToTime } from './availability';
import { getAppointments, getServices, isConfigured as isMangomintConfigured } from '@/lib/mangomint/client';
import { logEvent } from '@/lib/logging/structured-logger';
import type { Appointment, AppointmentStatus, BookableService, RoomId, WaitlistEntry, IntakeForm } from './types';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

const SERVICE_BY_NAME = new Map(
  BOOKABLE_SERVICES.map((s) => [normalizeKey(s.name), s]),
);

const PROVIDER_BY_NAME = new Map(
  DEFAULT_PROVIDERS.map((p) => [normalizeKey(p.providerName), p]),
);

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeTime(value?: string): string {
  if (!value) return '09:00';
  if (value.includes('T')) {
    const time = value.split('T')[1] ?? '';
    return time.substring(0, 5) || '09:00';
  }
  return value.length >= 5 ? value.substring(0, 5) : value;
}

function normalizeStatus(value?: string): AppointmentStatus {
  const v = (value || '').toLowerCase();
  if (v.includes('cancel')) return 'cancelled';
  if (v.includes('no-show') || v.includes('noshow')) return 'no-show';
  if (v.includes('completed')) return 'completed';
  if (v.includes('checked')) return 'checked-in';
  if (v.includes('in progress')) return 'in-progress';
  if (v.includes('reschedule')) return 'rescheduled';
  if (v.includes('confirm')) return 'confirmed';
  return 'pending';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function shouldRetryCreateAttempt(message: string): boolean {
  return message.includes('UNKNOWN_FIELD_NAME') || message.includes('INVALID_MULTIPLE_CHOICE_OPTIONS');
}

function resolveServiceByName(name: string | undefined): BookableService | undefined {
  if (!name) return undefined;
  const key = normalizeKey(name);
  const direct = SERVICE_BY_NAME.get(key);
  if (direct) return direct;

  for (const [k, svc] of SERVICE_BY_NAME.entries()) {
    if (key.includes(k) || k.includes(key)) return svc;
  }
  return undefined;
}

function resolveProviderId(name?: string): string {
  if (!name) return 'provider-unknown';
  const key = normalizeKey(name);
  const provider = PROVIDER_BY_NAME.get(key);
  return provider?.providerId ?? `provider-${key || 'unknown'}`;
}

function resolveRoomId(service?: BookableService): RoomId {
  if (service?.requiredRooms?.length) return service.requiredRooms[0];
  return 'glow';
}

function mapAirtableAppointment(record: { id: string; fields: Record<string, unknown> }): Appointment {
  const fields = record.fields;
  const serviceName = (fields[FIELDS.appointments.service] as string) || 'Unknown Service';
  const service = resolveServiceByName(serviceName);
  const providerName = (fields[FIELDS.appointments.provider] as string) || 'Unassigned';
  const date = (fields[FIELDS.appointments.date] as string) || format(new Date(), 'yyyy-MM-dd');
  const startTime = normalizeTime(fields[FIELDS.appointments.time] as string);
  const duration = Number(fields[FIELDS.appointments.duration] || service?.duration || 60);
  const endTime = addMinutesToTime(startTime, duration);

  const estimatedRevenue =
    Number(fields[FIELDS.appointments.amountPaid] || 0) ||
    Number(fields[FIELDS.appointments.amountQuoted] || 0) ||
    service?.price ||
    0;

  return {
    id: record.id,
    clientId: String(fields['Client ID'] || 'unknown'),
    clientName: String(fields['Client'] || fields['Client Name'] || 'Walk-in'),
    clientEmail: String(fields['Email'] || ''),
    clientPhone: String(fields['Phone'] || ''),
    serviceId: service?.id || `service-${normalizeKey(serviceName) || 'unknown'}`,
    serviceName,
    providerId: resolveProviderId(providerName),
    providerName,
    roomId: resolveRoomId(service),
    date,
    startTime,
    endTime,
    duration,
    status: normalizeStatus(fields[FIELDS.appointments.status] as string),
    isNewClient: false,
    isMember: false,
    estimatedRevenue,
    depositPaid: Number(fields[FIELDS.appointments.depositPaid] || 0) ? 1 : 0,
    notes: String(fields['Notes'] || ''),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEmergencySlot: false,
    source: 'internal',
  };
}

function mapMangomintAppointment(
  appointment: Record<string, unknown>,
  serviceMap: Map<number, { name: string; duration: number; price: number }>
): Appointment {
  const startAt = String(appointment.startAt || '');
  const endAt = String(appointment.endAt || '');
  const date = startAt ? startAt.substring(0, 10) : format(new Date(), 'yyyy-MM-dd');
  const startTime = normalizeTime(startAt);
  const endTime = endAt ? normalizeTime(endAt) : addMinutesToTime(startTime, 60);
  const duration = Math.max(5, Math.round((Date.parse(endAt) - Date.parse(startAt)) / 60000) || 60);

  const serviceIdNum = Number(appointment.serviceId || 0);
  const serviceFromApi = serviceMap.get(serviceIdNum);
  const service = resolveServiceByName(serviceFromApi?.name);
  const serviceName = serviceFromApi?.name || 'Unknown Service';

  const providerName =
    String(appointment.staffName || appointment.providerName || appointment.staff || '') ||
    `Staff ${appointment.staffId || 'Unknown'}`;

  return {
    id: `mm-${appointment.id || `${serviceIdNum}-${startAt}`}`,
    clientId: String(appointment.clientId || 'unknown'),
    clientName: String(appointment.clientName || 'Client'),
    clientEmail: String(appointment.clientEmail || ''),
    clientPhone: String(appointment.clientPhone || ''),
    serviceId: service?.id || `mangomint-${serviceIdNum || 'unknown'}`,
    serviceName,
    providerId: resolveProviderId(providerName),
    providerName,
    roomId: resolveRoomId(service),
    date,
    startTime,
    endTime,
    duration,
    status: normalizeStatus(String(appointment.status || 'scheduled')),
    isNewClient: false,
    isMember: false,
    estimatedRevenue: serviceFromApi?.price || service?.price || 0,
    depositPaid: 0,
    notes: String(appointment.notes || ''),
    createdAt: String(appointment.createdAt || new Date().toISOString()),
    updatedAt: String(appointment.updatedAt || new Date().toISOString()),
    isEmergencySlot: false,
    source: 'internal',
  };
}

export async function loadAppointmentsForRange(startDate: string, endDate: string): Promise<Appointment[]> {
  if (isMangomintConfigured()) {
    try {
      const services = await getServices();
      const serviceMap = new Map<number, { name: string; duration: number; price: number }>(
        services.map((s) => [s.id, { name: s.name, duration: s.duration, price: s.price }]),
      );

      const limit = 200;
      let offset = 0;
      const all: Appointment[] = [];

      while (true) {
        const page = await getAppointments({
          startDate,
          endDate,
          limit,
          offset,
        });
        if (!page || page.length === 0) break;
        all.push(...page.map((apt) => mapMangomintAppointment(apt as Record<string, unknown>, serviceMap)));
        if (page.length < limit) break;
        offset += limit;
      }

      if (all.length > 0) return all;
    } catch (err) {
      logEvent('integration', 'warn', 'Mangomint appointments fetch failed, falling back to Airtable', {
        error: String(err),
      });
    }
  }

  const formula = startDate === endDate
    ? `{${FIELDS.appointments.date}} = "${startDate}"`
    : `AND({${FIELDS.appointments.date}} >= "${startDate}", {${FIELDS.appointments.date}} <= "${endDate}")`;

  const records = await fetchAll<Record<string, unknown>>(Tables.appointments(), {
    filterByFormula: formula,
  }, true);

  return records.map(mapAirtableAppointment);
}

export async function loadAppointmentsForDate(date: string): Promise<Appointment[]> {
  return loadAppointmentsForRange(date, date);
}

export async function createAppointmentRecord(appointment: Appointment): Promise<string> {
  const service = resolveServiceByName(appointment.serviceName);
  const statusMap: Record<AppointmentStatus, string> = {
    pending: 'Scheduled',
    confirmed: 'Confirmed',
    'checked-in': 'Checked In',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No-Show',
    rescheduled: 'Rescheduled',
  };

  const primaryFields = {
    [FIELDS.appointments.service]: appointment.serviceName,
    [FIELDS.appointments.category]: service?.category || 'Other',
    [FIELDS.appointments.provider]: appointment.providerName,
    [FIELDS.appointments.date]: appointment.date,
    [FIELDS.appointments.time]: appointment.startTime,
    [FIELDS.appointments.duration]: appointment.duration,
    [FIELDS.appointments.status]: statusMap[appointment.status],
    [FIELDS.appointments.isConsult]: appointment.serviceId.startsWith('consult-'),
    [FIELDS.appointments.depositPaid]: appointment.depositPaid > 0,
    [FIELDS.appointments.amountQuoted]: appointment.estimatedRevenue,
    [FIELDS.appointments.bookingSource]: appointment.source,
  };

  const webhookCompatibleFields = {
    Date: appointment.date,
    Client: appointment.clientName,
    Service: appointment.serviceName,
    Provider: appointment.providerName,
    Status: statusMap[appointment.status],
    'Start Time': `${appointment.date}T${appointment.startTime}:00`,
    'End Time': `${appointment.date}T${appointment.endTime}:00`,
    Notes: appointment.notes || '',
  };

  const attempts: Array<Record<string, unknown>> = [
    primaryFields,
    {
      ...primaryFields,
      Client: appointment.clientName,
      Email: appointment.clientEmail,
      Phone: appointment.clientPhone,
      Notes: appointment.notes || '',
    },
    webhookCompatibleFields,
  ];

  let lastError: unknown;

  for (const fields of attempts) {
    try {
      const id = await rateLimitedQuery(() =>
        new Promise<string>((resolve, reject) => {
          Tables.appointments().create([{ fields }], { typecast: true }, (err, records) => {
            if (err) reject(err);
            else resolve(records?.[0]?.id || '');
          });
        }),
      );

      if (!id) {
        throw new Error('Appointment create returned no Airtable record ID');
      }

      return id;
    } catch (error) {
      lastError = error;
      const message = getErrorMessage(error);
      logEvent('integration', 'warn', 'Appointment create attempt failed', {
        appointmentDate: appointment.date,
        serviceName: appointment.serviceName,
        providerName: appointment.providerName,
        attemptedFields: Object.keys(fields),
        error: message,
      });

      if (!shouldRetryCreateAttempt(message)) {
        throw error;
      }
    }
  }

  logEvent('integration', 'error', 'All appointment create attempts failed', {
    appointmentDate: appointment.date,
    appointmentTime: appointment.startTime,
    serviceName: appointment.serviceName,
    providerName: appointment.providerName,
    clientName: appointment.clientName,
    attemptCount: attempts.length,
    attemptedFieldSets: attempts.map((fields) => Object.keys(fields)),
    error: getErrorMessage(lastError),
  });

  throw lastError instanceof Error ? lastError : new Error('Failed to create appointment record');
}

export async function updateAppointmentRecord(recordId: string, fields: Record<string, unknown>): Promise<void> {
  await updateRecord(Tables.appointments(), recordId, fields);
}

export async function loadWaitlistEntries(serviceId?: string): Promise<WaitlistEntry[]> {
  const formulaParts = ['{Type} = "Waitlist"'];
  if (serviceId) formulaParts.push(`FIND("${serviceId}", {Message})`);
  const formula = `AND(${formulaParts.join(',')})`;

  const records = await fetchAll<Record<string, unknown>>(Tables.messagesLog(), {
    filterByFormula: formula,
    sort: [{ field: 'Date', direction: 'desc' }],
  }, true);

  const entries: WaitlistEntry[] = [];
  for (const record of records) {
    const raw = String(record.fields['Message'] || '');
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as WaitlistEntry;
      entries.push({ ...parsed, id: record.id });
    } catch (err) {
      logEvent('integration', 'warn', 'Failed to parse waitlist entry', {
        recordId: record.id,
        error: String(err),
      });
    }
  }

  return entries;
}

export async function addWaitlistEntry(entry: WaitlistEntry): Promise<string> {
  return createRecord(Tables.messagesLog(), {
    Type: 'Waitlist',
    Direction: 'Inbound',
    Status: 'Active',
    Message: JSON.stringify(entry),
    Date: format(new Date(), 'yyyy-MM-dd'),
  });
}

export async function removeWaitlistEntry(entryId: string, reason: string): Promise<void> {
  await updateRecord(Tables.messagesLog(), entryId, {
    Status: 'Closed',
    Message: JSON.stringify({ entryId, removedAt: new Date().toISOString(), reason }),
  });
}

// ── Intake Draft Storage ────────────────────────────────────────────────────

const INTAKE_DRAFT_TYPE = 'Intake Draft';

function encodeDraftKey(key: string): string {
  return Buffer.from(key, 'utf8').toString('base64');
}

function buildDraftKey(clientId: string, appointmentId?: string, serviceId?: string): string {
  return `${clientId}:${appointmentId || ''}:${serviceId || ''}`;
}

function buildDraftMessage(encodedKey: string, formId: string, payload: Record<string, unknown>): string {
  return `key:${encodedKey}\nform:${formId}\n${JSON.stringify(payload)}`;
}

function parseDraftMessage(raw: string): { form?: IntakeForm; status?: string } | null {
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) return null;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as { form?: IntakeForm; status?: string };
    return parsed;
  } catch (err) {
    logEvent('integration', 'warn', 'Failed to parse intake draft payload', { error: String(err) });
    return null;
  }
}

async function findDraftRecordByKey(encodedKey: string): Promise<{ id: string; fields: Record<string, unknown> } | null> {
  const formula = `AND({Type} = "${INTAKE_DRAFT_TYPE}", FIND("key:${sanitizeFormulaValue(encodedKey)}", {Message}))`;
  const records = await fetchFirst<Record<string, unknown>>(Tables.messagesLog(), 1, { filterByFormula: formula }, true);
  return records[0] || null;
}

async function findDraftRecordByFormId(formId: string): Promise<{ id: string; fields: Record<string, unknown> } | null> {
  const formula = `AND({Type} = "${INTAKE_DRAFT_TYPE}", FIND("form:${sanitizeFormulaValue(formId)}", {Message}))`;
  const records = await fetchFirst<Record<string, unknown>>(Tables.messagesLog(), 1, { filterByFormula: formula }, true);
  return records[0] || null;
}

export async function getOrCreateIntakeDraft(
  clientId: string,
  appointmentId: string | undefined,
  serviceId: string | undefined,
  createForm: () => IntakeForm,
): Promise<{ recordId: string; form: IntakeForm }> {
  const key = buildDraftKey(clientId, appointmentId, serviceId);
  const encodedKey = encodeDraftKey(key);
  const existing = await findDraftRecordByKey(encodedKey);

  if (existing) {
    const message = String(existing.fields['Message'] || '');
    const parsed = parseDraftMessage(message);
    if (parsed?.form) {
      return { recordId: existing.id, form: parsed.form };
    }
  }

  const form = createForm();
  const payload = {
    form,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const message = buildDraftMessage(encodedKey, form.id, payload);

  const recordId = await createRecord(Tables.messagesLog(), {
    Type: INTAKE_DRAFT_TYPE,
    Direction: 'Inbound',
    Status: 'Active',
    Message: message,
    Date: format(new Date(), 'yyyy-MM-dd'),
  });

  return { recordId, form };
}

export async function updateIntakeDraftByFormId(formId: string, form: IntakeForm, status = 'draft'): Promise<void> {
  const record = await findDraftRecordByFormId(formId);
  if (!record) {
    throw new Error('Intake draft not found');
  }

  const message = String(record.fields['Message'] || '');
  const keyMatch = message.match(/key:([^\n]+)/);
  const encodedKey = keyMatch?.[1] || encodeDraftKey(formId);

  const payload = {
    form,
    status,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const nextMessage = buildDraftMessage(encodedKey, form.id, payload);

  await updateRecord(Tables.messagesLog(), record.id, {
    Message: nextMessage,
    Status: status === 'submitted' ? 'Closed' : 'Active',
  });
}

export async function getIntakeDraftByFormId(formId: string): Promise<IntakeForm | null> {
  const record = await findDraftRecordByFormId(formId);
  if (!record) return null;
  const message = String(record.fields['Message'] || '');
  const parsed = parseDraftMessage(message);
  return parsed?.form ?? null;
}
