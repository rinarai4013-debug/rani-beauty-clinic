import { fetchFirst, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { DEFAULT_PROVIDERS } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES, getServiceById } from '@/lib/booking/services';
import type { BookingRequest } from '@/lib/booking/types';
import { getAppointments, getServices, type MangomintAppointment } from './client';

interface AirtableClientFields {
  [FIELDS.clients.name]?: string;
  [FIELDS.clients.email]?: string;
  [FIELDS.clients.phone]?: string;
  [FIELDS.clients.mangomintClientId]?: string;
}

interface AirtableAppointmentFields {
  [FIELDS.appointments.service]?: string;
  [FIELDS.appointments.provider]?: string;
  [FIELDS.appointments.date]?: string;
  [FIELDS.appointments.time]?: string;
  Client?: string;
  Email?: string;
  Phone?: string;
  'Client ID'?: string;
  [FIELDS.appointments.mangomintAppointmentId]?: string;
}

export interface MangomintServiceMapping {
  internalServiceId: string;
  internalServiceName: string;
  mangomintServiceId: number | null;
  mangomintServiceName?: string;
  confidence: 'exact' | 'fuzzy' | 'unresolved';
}

export interface MangomintClientMapping {
  airtableClientRecordId: string | null;
  clientName: string;
  email?: string;
  phone?: string;
  mangomintClientId: number | null;
  matchStrategy: 'record-id' | 'email' | 'phone' | 'new-client' | 'none';
}

export interface MangomintProviderMapping {
  internalProviderId: string;
  internalProviderName: string;
  mangomintStaffId: number | null;
  confidence: 'exact' | 'inferred' | 'unresolved';
  sampleSize: number;
}

export interface MangomintAppointmentMapping {
  airtableAppointmentRecordId: string;
  mangomintAppointmentId: number | null;
  serviceName?: string;
  providerName?: string;
  date?: string;
  time?: string;
  status: 'linked' | 'unlinked' | 'not_found';
}

export interface MangomintWritebackReadiness {
  mode: 'hosted-booking' | 'operator-assisted' | 'direct-api-ready';
  service: MangomintServiceMapping;
  provider: MangomintProviderMapping;
  client: MangomintClientMapping;
  appointment?: MangomintAppointmentMapping;
  blockers: string[];
  strengths: string[];
}

export interface MangomintMappingSummary {
  services: {
    total: number;
    exact: number;
    fuzzy: number;
    unresolved: number;
    coverage: number;
  };
  providers: {
    total: number;
    exact: number;
    inferred: number;
    unresolved: number;
    coverage: number;
  };
}

function normalizeKey(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function providerNameFromId(providerId?: string): string {
  if (!providerId) return '';
  return DEFAULT_PROVIDERS.find((provider) => provider.providerId === providerId)?.providerName || providerId;
}

async function getAllMangomintAppointments(startDate: string, endDate: string): Promise<MangomintAppointment[]> {
  const limit = 200;
  let offset = 0;
  const all: MangomintAppointment[] = [];

  while (true) {
    const page = await getAppointments({ startDate, endDate, limit, offset });
    if (!page.length) break;
    all.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  return all;
}

export async function resolveMangomintServiceMapping(serviceId: string): Promise<MangomintServiceMapping> {
  const service = getServiceById(serviceId);
  const fallbackName = service?.name || serviceId;
  const services = await getServices();
  const target = normalizeKey(fallbackName);

  const exact = services.find((candidate) => normalizeKey(candidate.name) === target);
  if (exact) {
    return {
      internalServiceId: serviceId,
      internalServiceName: fallbackName,
      mangomintServiceId: exact.id,
      mangomintServiceName: exact.name,
      confidence: 'exact',
    };
  }

  const fuzzy = services.find((candidate) => {
    const candidateKey = normalizeKey(candidate.name);
    return target.includes(candidateKey) || candidateKey.includes(target);
  });

  if (fuzzy) {
    return {
      internalServiceId: serviceId,
      internalServiceName: fallbackName,
      mangomintServiceId: fuzzy.id,
      mangomintServiceName: fuzzy.name,
      confidence: 'fuzzy',
    };
  }

  return {
    internalServiceId: serviceId,
    internalServiceName: fallbackName,
    mangomintServiceId: null,
    confidence: 'unresolved',
  };
}

async function lookupClientByFormula(formula: string): Promise<{ id: string; fields: AirtableClientFields } | null> {
  const records = await fetchFirst<AirtableClientFields>(
    Tables.clients(),
    1,
    { filterByFormula: formula },
    true,
  );
  return records[0] || null;
}

async function lookupAppointmentByFormula(
  formula: string,
): Promise<{ id: string; fields: AirtableAppointmentFields } | null> {
  const records = await fetchFirst<AirtableAppointmentFields>(
    Tables.appointments(),
    1,
    { filterByFormula: formula },
    true,
  );
  return records[0] || null;
}

export async function resolveMangomintClientMapping(request: BookingRequest): Promise<MangomintClientMapping> {
  const email = request.clientInfo?.email?.trim();
  const phone = request.clientInfo?.phone?.trim();
  const fallbackName = request.clientInfo
    ? `${request.clientInfo.firstName} ${request.clientInfo.lastName}`.trim()
    : 'Existing client';

  if (request.clientId) {
    const record = await lookupClientByFormula(`RECORD_ID() = "${sanitizeFormulaValue(request.clientId)}"`);
    if (record) {
      return {
        airtableClientRecordId: record.id,
        clientName: String(record.fields[FIELDS.clients.name] || fallbackName),
        email: String(record.fields[FIELDS.clients.email] || email || ''),
        phone: String(record.fields[FIELDS.clients.phone] || phone || ''),
        mangomintClientId: Number(record.fields[FIELDS.clients.mangomintClientId] || 0) || null,
        matchStrategy: 'record-id',
      };
    }
  }

  if (email) {
    const record = await lookupClientByFormula(`LOWER({${FIELDS.clients.email}}) = LOWER("${sanitizeFormulaValue(email)}")`);
    if (record) {
      return {
        airtableClientRecordId: record.id,
        clientName: String(record.fields[FIELDS.clients.name] || fallbackName),
        email,
        phone: String(record.fields[FIELDS.clients.phone] || phone || ''),
        mangomintClientId: Number(record.fields[FIELDS.clients.mangomintClientId] || 0) || null,
        matchStrategy: 'email',
      };
    }
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const record = await lookupClientByFormula(`SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({${FIELDS.clients.phone}}, " ", ""), "-", ""), "(", ""), ")", "") = "${sanitizeFormulaValue(digits)}"`);
    if (record) {
      return {
        airtableClientRecordId: record.id,
        clientName: String(record.fields[FIELDS.clients.name] || fallbackName),
        email: String(record.fields[FIELDS.clients.email] || email || ''),
        phone,
        mangomintClientId: Number(record.fields[FIELDS.clients.mangomintClientId] || 0) || null,
        matchStrategy: 'phone',
      };
    }
  }

  return {
    airtableClientRecordId: null,
    clientName: fallbackName,
    email,
    phone,
    mangomintClientId: null,
    matchStrategy: request.clientInfo ? 'new-client' : 'none',
  };
}

export async function resolveMangomintAppointmentMapping(
  airtableAppointmentRecordId: string,
): Promise<MangomintAppointmentMapping> {
  const record = await lookupAppointmentByFormula(`RECORD_ID() = "${sanitizeFormulaValue(airtableAppointmentRecordId)}"`);
  if (!record) {
    return {
      airtableAppointmentRecordId,
      mangomintAppointmentId: null,
      status: 'not_found',
    };
  }

  const mangomintAppointmentId = Number(record.fields[FIELDS.appointments.mangomintAppointmentId] || 0) || null;
  return {
    airtableAppointmentRecordId,
    mangomintAppointmentId,
    serviceName: String(record.fields[FIELDS.appointments.service] || ''),
    providerName: String(record.fields[FIELDS.appointments.provider] || ''),
    date: String(record.fields[FIELDS.appointments.date] || ''),
    time: String(record.fields[FIELDS.appointments.time] || ''),
    status: mangomintAppointmentId ? 'linked' : 'unlinked',
  };
}

export async function buildBookingRequestFromAppointmentRecord(
  airtableAppointmentRecordId: string,
): Promise<BookingRequest | null> {
  const record = await lookupAppointmentByFormula(`RECORD_ID() = "${sanitizeFormulaValue(airtableAppointmentRecordId)}"`);
  if (!record) return null;

  const serviceName = String(record.fields[FIELDS.appointments.service] || '');
  const providerName = String(record.fields[FIELDS.appointments.provider] || '');
  const service =
    BOOKABLE_SERVICES.find((candidate) => normalizeKey(candidate.name) === normalizeKey(serviceName)) ||
    BOOKABLE_SERVICES.find((candidate) => normalizeKey(serviceName).includes(normalizeKey(candidate.name)));
  const provider =
    DEFAULT_PROVIDERS.find((candidate) => normalizeKey(candidate.providerName) === normalizeKey(providerName)) ||
    DEFAULT_PROVIDERS.find((candidate) => normalizeKey(providerName).includes(normalizeKey(candidate.providerName)));

  if (!service || !provider) return null;

  const clientId = String(record.fields['Client ID'] || '').trim() || undefined;
  const email = String(record.fields.Email || '').trim();
  const phone = String(record.fields.Phone || '').trim();
  const clientName = String(record.fields.Client || '').trim();
  const [firstName = '', ...rest] = clientName.split(' ').filter(Boolean);
  const lastName = rest.join(' ');

  return {
    serviceId: service.id,
    providerId: provider.providerId,
    roomId: service.requiredRooms[0] || 'glow',
    date: String(record.fields[FIELDS.appointments.date] || ''),
    startTime: String(record.fields[FIELDS.appointments.time] || ''),
    clientId,
    clientInfo: email || phone
      ? {
          firstName: firstName || 'Client',
          lastName,
          email: email || 'unknown@ranibeautyclinic.com',
          phone: phone || '0000000000',
        }
      : undefined,
    source: 'internal',
  };
}

export async function resolveMangomintProviderMapping(
  providerId?: string,
  providerName?: string,
): Promise<MangomintProviderMapping> {
  const internalProviderName = providerName || providerNameFromId(providerId) || 'Unassigned';
  const internalProviderId = providerId || normalizeKey(internalProviderName) || 'unknown-provider';
  const target = normalizeKey(internalProviderName);

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  const end = new Date(now);
  end.setDate(now.getDate() + 30);

  const appointments = await getAllMangomintAppointments(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  );

  const matches = appointments.filter((appointment) => {
    const appointmentProvider = normalizeKey(
      String((appointment as unknown as Record<string, unknown>).staffName || (appointment as unknown as Record<string, unknown>).providerName || ''),
    );
    return appointmentProvider === target || appointmentProvider.includes(target) || target.includes(appointmentProvider);
  });

  const counts = new Map<number, number>();
  for (const appointment of matches) {
    counts.set(appointment.staffId, (counts.get(appointment.staffId) || 0) + 1);
  }

  const [bestStaffId, sampleSize = 0] =
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || [];

  return {
    internalProviderId,
    internalProviderName,
    mangomintStaffId: typeof bestStaffId === 'number' ? bestStaffId : null,
    confidence: sampleSize >= 2 ? 'exact' : sampleSize === 1 ? 'inferred' : 'unresolved',
    sampleSize,
  };
}

export async function getMangomintWritebackReadiness(
  request: BookingRequest,
  airtableAppointmentRecordId?: string,
): Promise<MangomintWritebackReadiness> {
  const [service, provider, client, appointment] = await Promise.all([
    resolveMangomintServiceMapping(request.serviceId),
    resolveMangomintProviderMapping(request.providerId),
    resolveMangomintClientMapping(request),
    airtableAppointmentRecordId
      ? resolveMangomintAppointmentMapping(airtableAppointmentRecordId)
      : Promise.resolve(undefined),
  ]);

  const blockers: string[] = [];
  const strengths: string[] = [];

  if (service.mangomintServiceId) strengths.push(`Service mapped to Mangomint service ${service.mangomintServiceId}.`);
  else blockers.push(`No Mangomint service match found for ${service.internalServiceName}.`);

  if (provider.mangomintStaffId) strengths.push(`Provider mapped to Mangomint staff ${provider.mangomintStaffId}.`);
  else blockers.push(`No Mangomint staff match found for ${provider.internalProviderName}.`);

  if (client.mangomintClientId) strengths.push(`Client linked to Mangomint client ${client.mangomintClientId}.`);
  else if (client.matchStrategy === 'new-client') blockers.push('Client is new and still needs Mangomint-side client creation or hosted booking capture.');
  else blockers.push('Client is not linked to a Mangomint client record yet.');

  if (appointment) {
    if (appointment.mangomintAppointmentId) strengths.push(`Appointment linked to Mangomint appointment ${appointment.mangomintAppointmentId}.`);
    else blockers.push('Appointment record exists in Airtable but is not linked to a Mangomint appointment yet.');
  }

  const mode =
    blockers.length === 0
      ? 'direct-api-ready'
      : appointment?.mangomintAppointmentId || service.mangomintServiceId || provider.mangomintStaffId || client.mangomintClientId
        ? 'operator-assisted'
        : 'hosted-booking';

  return { mode, service, provider, client, appointment, blockers, strengths };
}

export async function getMangomintMappingSummary(): Promise<MangomintMappingSummary> {
  const [serviceMappings, providerMappings] = await Promise.all([
    Promise.all(BOOKABLE_SERVICES.map((service) => resolveMangomintServiceMapping(service.id))),
    Promise.all(DEFAULT_PROVIDERS.map((provider) => resolveMangomintProviderMapping(provider.providerId, provider.providerName))),
  ]);

  const exactServices = serviceMappings.filter((mapping) => mapping.confidence === 'exact').length;
  const fuzzyServices = serviceMappings.filter((mapping) => mapping.confidence === 'fuzzy').length;
  const exactProviders = providerMappings.filter((mapping) => mapping.confidence === 'exact').length;
  const inferredProviders = providerMappings.filter((mapping) => mapping.confidence === 'inferred').length;

  return {
    services: {
      total: serviceMappings.length,
      exact: exactServices,
      fuzzy: fuzzyServices,
      unresolved: serviceMappings.length - exactServices - fuzzyServices,
      coverage: Math.round(((exactServices + fuzzyServices) / Math.max(serviceMappings.length, 1)) * 100),
    },
    providers: {
      total: providerMappings.length,
      exact: exactProviders,
      inferred: inferredProviders,
      unresolved: providerMappings.length - exactProviders - inferredProviders,
      coverage: Math.round(((exactProviders + inferredProviders) / Math.max(providerMappings.length, 1)) * 100),
    },
  };
}
