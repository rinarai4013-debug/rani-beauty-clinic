import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import type Airtable from 'airtable';
import crypto from 'node:crypto';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { env } from '@/lib/env';
import { logWebhookEvent } from '@/lib/logging/structured-logger';
import { captureWebhookEvent } from '@/lib/sentry-utils';
import { verifyWebhookSignature } from '@/lib/webhooks/verify-signature';
import { z } from 'zod';

// ─── Mangomint Webhook Handler ───
// Handles ALL Mangomint webhook events:
//   appointment.created, appointment.updated, appointment.completed, appointment.cancelled, appointment.noshow
//   sale.completed
//   client.created, client.updated
//   membership.created, membership.cancelled
//
// Webhook URL: https://www.ranibeautyclinic.com/api/webhooks/mangomint

// ─── Helpers ───

const WEBHOOK_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
const ALERT_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const mangomintPayloadSchema = z.object({
  event: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  data: z.unknown().optional(),
});

async function forwardToN8n(webhookPath: string, payload: unknown): Promise<void> {
  const n8nUrl = env.N8N_WEBHOOK_URL;
  if (!n8nUrl) return;
  try {
    const response = await fetch(`${n8nUrl}${webhookPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logWebhookEvent('mangomint', 'n8n-forward', false, {
        webhookPath,
        status: response.status,
        responseBody: body.substring(0, 500),
      });
      return;
    }
    logWebhookEvent('mangomint', 'n8n-forward', true, { webhookPath, status: response.status });
  } catch (err) {
    logWebhookEvent('mangomint', 'n8n-forward', false, { webhookPath, error: String(err) });
  }
}

function getMangomintId(data: Record<string, unknown>, fallbackEvent: string): string {
  return String(
    data.id ||
      data.appointmentId ||
      data.saleId ||
      data.clientId ||
      data.membershipId ||
      fallbackEvent
  );
}

function buildWebhookDedupeKey(
  event: string,
  data: Record<string, unknown>,
  requestBody: string,
  requestId: string | null
): string {
  const identity = String(getMangomintId(data, requestId || event));
  const freshness =
    String(
      data.updatedAt ||
      data.completed_at ||
      data.completedAt ||
      data.cancel_date ||
      data.cancelDate ||
      data.startAt ||
      data.status ||
      '',
    );

  const payloadHash = crypto
    .createHash('sha256')
    .update(requestBody)
    .digest('hex')
    .slice(0, 12);

  return `mangomint:webhook:${event}:${identity}:${freshness}:${payloadHash}`;
}

function shouldSkipDuplicateWebhook(
  event: string,
  data: Record<string, unknown>,
  requestBody: string,
  requestId: string | null
): boolean {
  const key = buildWebhookDedupeKey(event, data, requestBody, requestId);
  if (cache.get<boolean>(key)) {
    return true;
  }
  cache.set(key, true, WEBHOOK_DEDUPE_TTL_MS);
  return false;
}

function shouldCreateAlertOnce(key: string): boolean {
  if (cache.get<boolean>(key)) {
    return false;
  }
  cache.set(key, true, ALERT_DEDUPE_TTL_MS);
  return true;
}

async function findRecordByField(
  table: ReturnType<typeof Tables.appointments>,
  fieldName: string,
  value: string,
  fields?: string[]
): Promise<string | null> {
  return rateLimitedQuery(() =>
    new Promise<string | null>((resolve) => {
      table
        .select({
          filterByFormula: `{${fieldName}} = "${sanitizeFormulaValue(value)}"`,
          maxRecords: 1,
          ...(fields ? { fields } : {}),
        })
        .firstPage((err, records) => {
          if (err || !records || records.length === 0) resolve(null);
          else resolve(records[0].id);
        });
    })
  );
}

async function upsertRecord(
  table: ReturnType<typeof Tables.appointments>,
  existingId: string | null,
  fields: Record<string, unknown>
): Promise<void> {
  const airtableFields = fields as Partial<Airtable.FieldSet>;

  if (existingId) {
    await rateLimitedQuery(() =>
      new Promise<void>((resolve, reject) => {
        table.update([{ id: existingId, fields: airtableFields }], { typecast: true }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
    );
  } else {
    await rateLimitedQuery(() =>
      new Promise<void>((resolve, reject) => {
        table.create([{ fields: airtableFields }], { typecast: true }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
    );
  }
}

function extractAppointmentFields(data: Record<string, unknown>, statusOverride?: string) {
  const date = (data.startAt as string)?.substring(0, 10) || (data.date as string) || new Date().toISOString().substring(0, 10);
  const clientName = [(data.clientFirstName as string), (data.clientLastName as string)].filter(Boolean).join(' ') || (data.clientName as string) || 'Walk-in';
  const serviceName = (data.serviceName as string) || (data.service as Record<string, string>)?.name || 'Treatment';

  return {
    Date: date,
    Client: clientName,
    Service: serviceName,
    Provider: (data.staffName as string) || (data.staff as Record<string, string>)?.name || 'Rani',
    Status: statusOverride || (data.status as string) || 'Scheduled',
    'Start Time': (data.startAt as string) || '',
    'End Time': (data.endAt as string) || '',
    Notes: (data.notes as string) || '',
    'MangoMint Appointment ID': String(data.id || ''),
  };
}

// ─── Event Handlers ───

async function handleAppointmentCreated(data: Record<string, unknown>, payload: unknown) {
  const mangomintId = String(data.id || '');
  const fields = extractAppointmentFields(data);

  // Idempotency: check if this Mangomint appointment already exists
  const existingId = mangomintId
    ? await findRecordByField(Tables.appointments(), 'MangoMint Appointment ID', mangomintId, ['MangoMint Appointment ID'])
    : null;

  await upsertRecord(Tables.appointments(), existingId, fields);
  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
  await forwardToN8n('/webhook/booking-sync', payload);
}

async function handleAppointmentUpdated(data: Record<string, unknown>) {
  const mangomintId = String(data.id || '');
  if (!mangomintId) return;

  const fields = extractAppointmentFields(data);
  const existingId = await findRecordByField(
    Tables.appointments(),
    'MangoMint Appointment ID',
    mangomintId,
    ['MangoMint Appointment ID']
  );

  await upsertRecord(Tables.appointments(), existingId, fields);
  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
}

async function handleAppointmentCompleted(data: Record<string, unknown>, payload: unknown) {
  const mangomintId = String(data.id || '');
  const existingId = mangomintId
    ? await findRecordByField(Tables.appointments(), 'MangoMint Appointment ID', mangomintId, ['MangoMint Appointment ID'])
    : null;

  if (existingId) {
    await upsertRecord(Tables.appointments(), existingId, { Status: 'Completed' });
  } else {
    const fields = extractAppointmentFields(data, 'Completed');
    await upsertRecord(Tables.appointments(), null, fields);
  }

  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
  cache.invalidatePrefix('revenue');
  await forwardToN8n('/webhook/post-treatment-trigger', payload);
}

async function handleAppointmentCancelled(data: Record<string, unknown>) {
  const mangomintId = String(data.id || '');
  if (!mangomintId) return;

  const existingId = await findRecordByField(
    Tables.appointments(),
    'MangoMint Appointment ID',
    mangomintId,
    ['MangoMint Appointment ID']
  );

    if (existingId) {
      const cancelReason = (data.cancellationReason as string) || (data.cancelReason as string) || '';
      const isLateCancellation = (data.isLateCancellation as boolean) || false;

    await upsertRecord(Tables.appointments(), existingId, {
      Status: 'Cancelled',
      Notes: `Cancelled${cancelReason ? ': ' + cancelReason : ''}${isLateCancellation ? ' (LATE - fee applies)' : ''}`,
    });

    // Create alert for late cancellations
    if (isLateCancellation && shouldCreateAlertOnce(`mangomint:alert:late-cancellation:${mangomintId}`)) {
      try {
        await rateLimitedQuery(() =>
          new Promise<void>((resolve, reject) => {
            Tables.alerts().create(
              [{
                fields: {
                  Type: 'late_cancellation',
                  Severity: 'warning',
                  Message: `Late cancellation: ${(data.clientName as string) || 'Client'} - 50% fee applies`,
                  'Action Recommended': 'Charge late cancellation fee per policy',
                  Status: 'active',
                },
              }],
              { typecast: true },
              (err) => { if (err) reject(err); else resolve(); }
            );
          })
        );
      } catch {
        // Alert creation is best-effort
      }
    }
  }

  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
}

async function handleAppointmentNoshow(data: Record<string, unknown>) {
  const mangomintId = String(data.id || '');
  if (!mangomintId) return;

  const existingId = await findRecordByField(
    Tables.appointments(),
    'MangoMint Appointment ID',
    mangomintId,
    ['MangoMint Appointment ID']
  );

  if (existingId) {
    await upsertRecord(Tables.appointments(), existingId, {
      Status: 'No-Show',
      Notes: 'No-show - 100% fee applies per policy',
    });
  }

  // Create no-show alert
  const clientName = [(data.clientFirstName as string), (data.clientLastName as string)].filter(Boolean).join(' ') || (data.clientName as string) || 'Client';
  const serviceName = (data.serviceName as string) || 'appointment';

  if (shouldCreateAlertOnce(`mangomint:alert:no-show:${mangomintId}`)) {
    try {
      await rateLimitedQuery(() =>
        new Promise<void>((resolve, reject) => {
          Tables.alerts().create(
            [{
              fields: {
                Type: 'no_show',
                Severity: 'warning',
                Message: `No-show: ${clientName} missed ${serviceName} - charge 100% fee`,
                'Action Recommended': 'Charge no-show fee. Consider adding to watch list.',
                Status: 'active',
              },
            }],
            { typecast: true },
            (err) => { if (err) reject(err); else resolve(); }
          );
        })
      );
    } catch {
      // Alert creation is best-effort
    }
  }

  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
}

async function handleSaleCompleted(data: Record<string, unknown>, payload: unknown) {
  const mangomintSaleId = String(data.id || '');
  const services = (data.services as Array<Record<string, unknown>>) || [];
  const primaryService = services[0];

  const fields: Record<string, unknown> = {
    Date: (data.completed_at as string) || (data.date as string) || new Date().toISOString().substring(0, 10),
    Type: 'Service Payment',
    Amount: (data.total as number) || (data.amount as number) || 0,
    'Payment Method': `Mangomint (${(data.payment_method as string) || (data.paymentMethod as string) || 'Card'})`,
    Status: 'Completed',
    'Service Name': (primaryService?.name as string) || (data.serviceName as string) || 'Treatment',
    Provider: (primaryService?.provider_name as string) || '',
    'Source': 'Mangomint Webhook',
    'MangoMint Sale ID': mangomintSaleId,
  };

  // Idempotency: check if this sale already exists
  const existingId = mangomintSaleId
    ? await findRecordByField(Tables.transactions(), 'MangoMint Sale ID', mangomintSaleId, ['MangoMint Sale ID'])
    : null;

  await upsertRecord(Tables.transactions(), existingId, fields);

  cache.invalidatePrefix('revenue');
  cache.invalidatePrefix('kpi');
  await forwardToN8n('/webhook/sale-completed', payload);
}

async function handleClientCreated(data: Record<string, unknown>) {
  const name = [(data.firstName as string), (data.lastName as string)].filter(Boolean).join(' ');
  const email = (data.email as string) || '';
  if (!name) return;

  // Check for existing client by email to prevent duplicates
  if (email) {
    const existingId = await findRecordByField(Tables.clients(), 'Email', email, ['Email']);
    if (existingId) return;
  }

  const fields: Record<string, unknown> = {
    Client: name,
    Email: email,
    Phone: (data.mobilePhone as string) || (data.phone as string) || '',
    Status: 'Active',
    'MangoMint Client ID': String(data.id || ''),
  };

  await upsertRecord(Tables.clients(), null, fields);
  cache.invalidatePrefix('clients');
}

async function handleClientUpdated(data: Record<string, unknown>) {
  const name = [(data.firstName as string), (data.lastName as string)].filter(Boolean).join(' ');
  const email = (data.email as string) || '';
  if (!name) return;

  // Find by Mangomint Client ID first, then fall back to email
  const mangomintId = String(data.id || '');
  let existingId: string | null = null;

  if (mangomintId) {
    existingId = await findRecordByField(Tables.clients(), 'MangoMint Client ID', mangomintId, ['MangoMint Client ID']);
  }
  if (!existingId && email) {
    existingId = await findRecordByField(Tables.clients(), 'Email', email, ['Email']);
  }

  const fields: Record<string, unknown> = {
    Client: name,
    Email: email,
    Phone: (data.mobilePhone as string) || (data.phone as string) || '',
    Status: 'Active',
    'MangoMint Client ID': mangomintId,
  };

  if (existingId) {
    await upsertRecord(Tables.clients(), existingId, fields);
  } else {
    await upsertRecord(Tables.clients(), null, fields);
  }

  cache.invalidatePrefix('clients');
}

async function handleMembershipCreated(data: Record<string, unknown>, payload: unknown) {
  const mangomintMembershipId = String(data.id || '');

  const fields: Record<string, unknown> = {
    Tier: (data.membership_name as string) || (data.membershipName as string) || (data.membership_tier as string) || 'Unknown',
    'Monthly Price': (data.price as number) || (data.monthlyPrice as number) || 0,
    Status: 'Active',
    'Start Date': (data.start_date as string) || (data.startDate as string) || new Date().toISOString().split('T')[0],
    'Billing Frequency': (data.billing_frequency as string) || 'Monthly',
    'MangoMint Membership ID': mangomintMembershipId,
    'Source': 'Mangomint Webhook',
  };

  // Idempotency: check if this membership already exists
  const existingId = mangomintMembershipId
    ? await findRecordByField(Tables.memberships(), 'MangoMint Membership ID', mangomintMembershipId, ['MangoMint Membership ID'])
    : null;

  await upsertRecord(Tables.memberships(), existingId, fields);
  cache.invalidatePrefix('kpi');
  cache.invalidatePrefix('clients');
  await forwardToN8n('/webhook/membership-started', payload);
}

async function handleMembershipCancelled(data: Record<string, unknown>, payload: unknown) {
  const mangomintId = String(data.id || '');

  // Find existing active membership
  let existingId: string | null = null;
  if (mangomintId) {
    existingId = await rateLimitedQuery(() =>
      new Promise<string | null>((resolve) => {
        Tables.memberships()
          .select({
            filterByFormula: `AND({MangoMint Membership ID} = "${sanitizeFormulaValue(mangomintId)}", {Status} = "Active")`,
            maxRecords: 1,
            fields: ['MangoMint Membership ID'],
          })
          .firstPage((err, records) => {
            if (err || !records || records.length === 0) resolve(null);
            else resolve(records[0].id);
          });
      })
    );
  }

  if (existingId) {
    await upsertRecord(Tables.memberships(), existingId, {
      Status: 'Canceled',
      'Cancel Date': (data.cancel_date as string) || (data.cancelDate as string) || new Date().toISOString().split('T')[0],
      'Cancel Reason': (data.cancel_reason as string) || (data.cancelReason as string) || 'Canceled via Mangomint',
    });
  }

  // Create churn alert
  const clientName = (data.client_name as string) || (data.clientName as string) || 'Client';
  const membershipName = (data.membership_name as string) || (data.membershipName as string) || 'membership';
  const cancelReason = (data.cancel_reason as string) || (data.cancelReason as string) || '';

  try {
    await rateLimitedQuery(() =>
      new Promise<void>((resolve, reject) => {
        Tables.alerts().create(
          [{
            fields: {
              Type: 'membership_churn',
              Severity: 'warning',
              Message: `${clientName} canceled their ${membershipName}${cancelReason ? ': ' + cancelReason : ''}`,
              'Action Recommended': 'Reach out within 24h with retention offer. Consider 1 free month or tier downgrade.',
              Status: 'active',
            },
          }],
          { typecast: true },
          (err) => { if (err) reject(err); else resolve(); }
        );
      })
    );
  } catch {
    // Alert is best-effort
  }

  cache.invalidatePrefix('kpi');
  cache.invalidatePrefix('clients');
  await forwardToN8n('/webhook/membership-canceled', payload);
}

// ─── Main POST Handler ───

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const mangomintTimestamp = parseMangomintTimestamp(request.headers.get('x-mangomint-timestamp'));

    if (!env.MANGOMINT_WEBHOOK_SECRET) {
      Sentry.captureMessage('Mangomint webhook secret is not configured', { level: 'warning' });
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    const signature = request.headers.get('x-mangomint-signature');
    const requestId = getMangomintRequestId(request);

    if (!verifyWebhookSignature({
      rawBody: body,
      signature,
      secret: env.MANGOMINT_WEBHOOK_SECRET,
      signaturePrefix: null,
    })) {
      const hasSignature = Boolean(request.headers.get('x-mangomint-signature'));
      logWebhookEvent(
        'mangomint',
        'unknown',
        false,
        { error: hasSignature ? 'Invalid signature' : 'Missing signature' },
      );
      if (hasSignature) {
        Sentry.captureMessage('Mangomint webhook received invalid signature', { level: 'warning' });
      }
      return NextResponse.json(
        { error: hasSignature ? 'Invalid signature' : 'Missing signature' },
        { status: 401 },
      );
    }

    if (isMangomintTimestampReplay(mangomintTimestamp)) {
      logWebhookEvent('mangomint', 'replay', false, {
        error: 'Stale or invalid replay timestamp',
        timestamp: mangomintTimestamp ? String(mangomintTimestamp) : null,
      });
      Sentry.captureMessage('Mangomint webhook replay timestamp outside tolerance', { level: 'warning' });
      return NextResponse.json({ error: 'Webhook replay window expired' }, { status: 401 });
    }

    let payload;
    try {
      payload = mangomintPayloadSchema.parse(JSON.parse(body));
    } catch {
      logWebhookEvent('mangomint', 'parse', false, { error: 'Invalid JSON payload' });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    logWebhookEvent('mangomint', 'parse', true, { bodySize: body.length });
    const event = payload.event || payload.type || 'unknown';
    const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data as Record<string, unknown>
      : {};

    if (shouldSkipDuplicateWebhook(event, data, body, requestId)) {
      logWebhookEvent('mangomint', event, true, { note: 'Duplicate webhook skipped' });
      captureWebhookEvent('mangomint', event, true, { duplicate: true });
      return NextResponse.json({ received: true, event, duplicate: true });
    }

    logWebhookEvent('mangomint', event, true, { dataPreview: JSON.stringify(data).substring(0, 200) });

    // Route to handler by event type
    switch (event) {
      case 'appointment.created':
        await handleAppointmentCreated(data, payload);
        break;

      case 'appointment.updated':
        await handleAppointmentUpdated(data);
        break;

      case 'appointment.completed':
        await handleAppointmentCompleted(data, payload);
        break;

      case 'appointment.cancelled':
      case 'appointment.canceled':
        await handleAppointmentCancelled(data);
        break;

      case 'appointment.noshow':
      case 'appointment.no_show':
        await handleAppointmentNoshow(data);
        break;

      case 'sale.completed':
        await handleSaleCompleted(data, payload);
        break;

      case 'client.created':
        await handleClientCreated(data);
        break;

      case 'client.updated':
        await handleClientUpdated(data);
        break;

      case 'membership.created':
      case 'membership.started':
        await handleMembershipCreated(data, payload);
        break;

      case 'membership.cancelled':
      case 'membership.canceled':
        await handleMembershipCancelled(data, payload);
        break;

      default:
        logWebhookEvent('mangomint', event, true, { note: 'Unhandled event type' });
    }

    captureWebhookEvent('mangomint', event, true);
    return NextResponse.json({ received: true, event });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'webhook-mangomint' } });
    captureWebhookEvent('mangomint', 'processing', false, { error: String(error) });
    logWebhookEvent('mangomint', 'processing', false, { error: String(error) });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET - reject non-POST requests (no health check info exposed)
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
function parseMangomintTimestamp(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const timestamp = Number(trimmed);
  if (!Number.isFinite(timestamp)) return null;

  return trimmed.length <= 10 ? timestamp * 1000 : timestamp;
}

function isMangomintTimestampReplay(timestamp: number | null): boolean {
  if (!timestamp) return false;

  const now = Date.now();
  return Math.abs(now - timestamp) > WEBHOOK_TIMESTAMP_TOLERANCE_MS;
}

function getMangomintRequestId(request: NextRequest): string | null {
  return (
    request.headers.get('x-mangomint-request-id') ??
    request.headers.get('x-mangomint-delivery-id') ??
    request.headers.get('x-request-id') ??
    null
  );
}
