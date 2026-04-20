import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRecord, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

export type MangomintEventType =
  | 'appointment-booked'
  | 'appointment-completed'
  | 'appointment-cancelled'
  | 'form-submitted';

export interface MangomintProcessResult {
  forwardedToN8n: boolean;
}

export function extractMangomintSignature(headers: Headers): string {
  return (
    headers.get('x-mangomint-signature') ||
    headers.get('x-signature') ||
    headers.get('mangomint-signature') ||
    ''
  );
}

export function computeMangomintSignature(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyMangomintSignature(
  signatureHeader: string,
  rawBody: string,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;

  const provided = signatureHeader.replace(/^sha256=/i, '').trim();
  const expected = computeMangomintSignature(secret, rawBody);

  try {
    return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

function extractAppointmentCore(payload: Record<string, unknown>) {
  const startAt = String(payload.startAt || payload.start_at || payload.dateTime || '');
  const parsedDate = startAt ? new Date(startAt) : null;

  const appointmentDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString().slice(0, 10)
      : String(payload.date || '').slice(0, 10);

  const appointmentTime =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString().slice(11, 16)
      : String(payload.time || '').slice(0, 5);

  const serviceName = String(
    payload.serviceName ||
      payload.service_name ||
      (payload.service as Record<string, unknown> | undefined)?.name ||
      'unknown service',
  );

  const providerName = String(
    payload.providerName ||
      payload.staffName ||
      (payload.staff as Record<string, unknown> | undefined)?.name ||
      'unknown provider',
  );

  const duration = Number(payload.duration || payload.durationMinutes || 0);

  return {
    appointmentDate,
    appointmentTime,
    serviceName,
    providerName,
    duration,
  };
}

async function writeAppointment(eventType: MangomintEventType, payload: Record<string, unknown>) {
  const statusMap: Record<MangomintEventType, string> = {
    'appointment-booked': 'Scheduled',
    'appointment-completed': 'Completed',
    'appointment-cancelled': 'Cancelled',
    'form-submitted': 'Submitted',
  };

  const { appointmentDate, appointmentTime, serviceName, providerName, duration } =
    extractAppointmentCore(payload);

  const fields: Record<string, unknown> = {
    [FIELDS.appointments.date]: appointmentDate || new Date().toISOString().slice(0, 10),
    [FIELDS.appointments.time]: appointmentTime || '',
    [FIELDS.appointments.service]: serviceName,
    [FIELDS.appointments.provider]: providerName,
    [FIELDS.appointments.status]: statusMap[eventType],
    [FIELDS.appointments.duration]: duration || undefined,
    [FIELDS.appointments.bookingSource]: 'Mangomint Webhook',
    'MangoMint Appointment ID': String(payload.id || payload.appointmentId || ''),
    Notes: JSON.stringify(payload),
  };

  await createRecord(Tables.appointments(), fields);
}

async function writeFormSubmission(payload: Record<string, unknown>) {
  const firstName = String(payload.firstName || payload.first_name || '');
  const lastName = String(payload.lastName || payload.last_name || '');
  const fullName = `${firstName} ${lastName}`.trim() || String(payload.name || 'unknown client');

  const fields: Record<string, unknown> = {
    'Full Name': fullName,
    Email: String(payload.email || ''),
    'Phone Number': String(payload.phone || payload.mobilePhone || ''),
    Source: 'Mangomint Form Submission',
    'Processing Status': 'New',
    Message: JSON.stringify(payload),
  };

  await createRecord(Tables.intakes(), fields);
}

async function forwardToN8n(eventType: MangomintEventType, payload: Record<string, unknown>) {
  const n8nBase = process.env.N8N_WEBHOOK_URL;
  if (!n8nBase) return false;

  const url = `${n8nBase.replace(/\/$/, '')}/mangomint-${eventType}`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType,
      source: 'mangomint',
      receivedAt: new Date().toISOString(),
      payload,
    }),
  });

  return true;
}

export async function processMangomintWebhook(
  eventType: MangomintEventType,
  payload: Record<string, unknown>,
): Promise<MangomintProcessResult> {
  if (eventType === 'form-submitted') {
    await writeFormSubmission(payload);
  } else {
    await writeAppointment(eventType, payload);
  }

  const forwardedToN8n = await forwardToN8n(eventType, payload);
  return { forwardedToN8n };
}
