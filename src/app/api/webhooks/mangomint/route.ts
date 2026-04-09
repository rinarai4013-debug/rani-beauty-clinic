import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Tables, rateLimitedQuery, fetchFirst } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { FIELDS } from '@/lib/airtable/tables';
import { logWebhookEvent } from '@/lib/logging/structured-logger';
import { captureWebhookEvent } from '@/lib/sentry-utils';

// ─── Mangomint Webhook Handler ───
// Handles ALL Mangomint webhook events:
//   appointment.created, appointment.updated, appointment.completed, appointment.cancelled, appointment.noshow
//   sale.completed
//   client.created, client.updated
//   membership.created, membership.cancelled
//
// Webhook URL: https://www.ranibeautyclinic.com/api/webhooks/mangomint

// ─── Helpers ───

async function forwardToN8n(webhookPath: string, payload: unknown): Promise<void> {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) return;
  try {
    await fetch(`${n8nUrl}${webhookPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // n8n forwarding is best-effort
  }
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
  if (existingId) {
    await rateLimitedQuery(() =>
      new Promise<void>((resolve, reject) => {
        table.update([{ id: existingId, fields }] as Parameters<typeof table.update>[0], { typecast: true }, (err: unknown) => {
          if (err) reject(err);
          else resolve();
        });
      })
    );
  } else {
    await rateLimitedQuery(() =>
      new Promise<void>((resolve, reject) => {
        table.create([{ fields }] as unknown as Parameters<typeof table.create>[0], { typecast: true }, (err: unknown) => {
          if (err) reject(err);
          else resolve();
        });
      })
    );
  }
}

type ClientRecordFields = Record<string, unknown>;

function getMangomintClientId(data: Record<string, unknown>): string {
  return String(
    data.clientId ||
    data.client_id ||
    (data.client as Record<string, unknown> | undefined)?.id ||
    ''
  );
}

async function findClientRecord(
  email?: string,
  mangomintClientId?: string,
  fields?: string[]
): Promise<{ id: string; fields: ClientRecordFields } | null> {
  if (mangomintClientId) {
    const byMangomint = await fetchFirst<ClientRecordFields>(
      Tables.clients(),
      1,
      {
        filterByFormula: `{${FIELDS.clients.mangomintClientId}} = "${sanitizeFormulaValue(mangomintClientId)}"`,
        ...(fields ? { fields } : {}),
      },
      true
    );
    if (byMangomint.length > 0) return byMangomint[0];
  }

  if (email) {
    const byEmail = await fetchFirst<ClientRecordFields>(
      Tables.clients(),
      1,
      {
        filterByFormula: `{${FIELDS.clients.email}} = '${sanitizeFormulaValue(email)}'`,
        ...(fields ? { fields } : {}),
      },
      true
    );
    if (byEmail.length > 0) return byEmail[0];
  }

  return null;
}

function inferFirstBookingSource(
  data: Record<string, unknown>,
  clientFields: ClientRecordFields
): string {
  const rawBookingSource = String(
    data.bookingSource ||
    data.booking_source ||
    data.source ||
    ''
  ).toLowerCase();

  if (rawBookingSource.includes('walk')) return 'Walk-In';
  if (rawBookingSource.includes('phone') || rawBookingSource.includes('call')) return 'Phone Call';
  if (rawBookingSource.includes('mango')) return 'Mangomint Direct';

  const landingPage = String(clientFields[FIELDS.clients.leadLandingPage] || '').toLowerCase();
  const leadOffer = String(clientFields[FIELDS.clients.leadOffer] || '').toLowerCase();
  const leadMedium = String(clientFields[FIELDS.clients.leadMedium] || '').toLowerCase();

  if (landingPage.includes('/tv')) return 'TV Landing Page';
  if (landingPage.includes('/glp1')) return 'GLP-1 Landing Page';
  if (landingPage.includes('/weight-loss')) return 'Weight Loss Landing';
  if (landingPage.includes('/contact')) return 'Website Contact Form';
  if (leadOffer.includes('newsletter') || leadMedium === 'email') return 'Newsletter';
  if (leadOffer.includes('ai concierge')) return 'AI Chat';
  if (leadOffer.includes('15-minute phone consultation')) return 'Quick Consult';
  if (leadOffer.includes('skin treatment plan')) return 'Skin Quiz';

  return 'Mangomint Direct';
}

async function backfillClientBookingAttribution(data: Record<string, unknown>) {
  const clientEmail = String(data.clientEmail || data.email || '').trim();
  const mangomintClientId = getMangomintClientId(data);
  if (!clientEmail && !mangomintClientId) return;

  const client = await findClientRecord(clientEmail, mangomintClientId, [
    FIELDS.clients.email,
    FIELDS.clients.leadLandingPage,
    FIELDS.clients.leadOffer,
    FIELDS.clients.leadMedium,
    FIELDS.clients.firstBookingSource,
    FIELDS.clients.firstBookingOffer,
    FIELDS.clients.mangomintClientId,
  ]);

  if (!client) return;

  const updates: Record<string, unknown> = {};

  if (mangomintClientId && !client.fields[FIELDS.clients.mangomintClientId]) {
    updates[FIELDS.clients.mangomintClientId] = mangomintClientId;
  }

  if (!client.fields[FIELDS.clients.firstBookingSource]) {
    updates[FIELDS.clients.firstBookingSource] = inferFirstBookingSource(data, client.fields);
  }

  if (!client.fields[FIELDS.clients.firstBookingOffer]) {
    const leadOffer = String(client.fields[FIELDS.clients.leadOffer] || '').trim();
    const serviceName =
      String(data.serviceName || (data.service as Record<string, unknown> | undefined)?.name || '').trim();
    if (leadOffer) {
      updates[FIELDS.clients.firstBookingOffer] = leadOffer;
    } else if (serviceName) {
      updates[FIELDS.clients.firstBookingOffer] = serviceName;
    }
  }

  if (Object.keys(updates).length > 0) {
    await upsertRecord(Tables.clients(), client.id, updates);
    cache.invalidatePrefix('clients');
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
    'Booking Source': (data.bookingSource as string) || (data.booking_source as string) || '',
    'MangoMint Appointment ID': String(data.id || ''),
  };
}

// ─── Event Handlers ───

async function handleAppointmentCreated(data: Record<string, unknown>, payload: unknown) {
  const fields = extractAppointmentFields(data);
  await upsertRecord(Tables.appointments(), null, fields);
  await backfillClientBookingAttribution(data);
  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
  await forwardToN8n('/webhook/booking-sync', payload);

  // Consultation-to-booking sync: auto-mark matching consultation as "booked"
  syncConsultationBooking(data).catch(err => {
    console.error('[Mangomint] Consultation booking sync failed (non-blocking):', err);
  });
}

/**
 * When a Mangomint booking comes in, find any matching consultation
 * (by email or phone) and auto-mark it as "booked" with a log entry.
 */
async function syncConsultationBooking(data: Record<string, unknown>): Promise<void> {
  const clientEmail = (data.clientEmail as string) || (data.email as string) || '';
  const clientPhone = (data.clientPhone as string) || (data.mobilePhone as string) || (data.phone as string) || '';
  const mangomintId = String(data.id || '');

  if (!clientEmail && !clientPhone) return;

  try {
    const { getAllSessionsAsync, getSessionByIdAsync, saveSessionAsync, sessionReducer } = await import('@/lib/mastermind/session');
    const sessions = await getAllSessionsAsync();

    // Find matching sessions that aren't already booked
    for (const session of sessions) {
      if (session.clinicStatus === 'booked' || session.bookedAppointmentId) continue;

      const sessionEmail = session.patientEmail || (session.intakeData?.email as string) || '';
      const sessionPhone = (session.intakeData?.phone as string) || '';

      const emailMatch = clientEmail && sessionEmail && clientEmail.toLowerCase() === sessionEmail.toLowerCase();
      const phoneMatch = clientPhone && sessionPhone && clientPhone.replace(/\D/g, '') === sessionPhone.replace(/\D/g, '');

      if (emailMatch || phoneMatch) {
        // Mark as booked via reducer for proper activity logging
        let updated = sessionReducer(session, { type: 'SET_BOOKED', appointmentId: mangomintId });
        updated = sessionReducer(updated, {
          type: 'SET_CLINIC_STATUS',
          status: 'booked',
          actor: 'Mangomint sync',
        });
        await saveSessionAsync(updated);
        console.log(`[Mangomint] Auto-linked booking ${mangomintId} to consultation ${session.id} (${session.patientName})`);
        break; // Only link to the most recent matching session
      }
    }
  } catch (err) {
    console.warn('[Mangomint] Consultation sync lookup failed:', err);
  }
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

  await backfillClientBookingAttribution(data);
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
    if (isLateCancellation) {
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

  cache.invalidatePrefix('schedule');
  cache.invalidatePrefix('kpi');
}

async function handleSaleCompleted(data: Record<string, unknown>, payload: unknown) {
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
    'MangoMint Sale ID': String(data.id || ''),
  };

  await upsertRecord(Tables.transactions(), null, fields);

  cache.invalidatePrefix('revenue');
  cache.invalidatePrefix('kpi');
  await forwardToN8n('/webhook/sale-completed', payload);
}

async function handleClientCreated(data: Record<string, unknown>) {
  const name = [(data.firstName as string), (data.lastName as string)].filter(Boolean).join(' ');
  const email = (data.email as string) || '';
  if (!name) return;

  const existing = await findClientRecord(email, String(data.id || ''), [
    FIELDS.clients.email,
    FIELDS.clients.mangomintClientId,
  ]);

  const fields: Record<string, unknown> = {
    Client: name,
    Email: email,
    Phone: (data.mobilePhone as string) || (data.phone as string) || '',
    Status: 'Active',
    [FIELDS.clients.mangomintClientId]: String(data.id || ''),
  };

  await upsertRecord(Tables.clients(), existing?.id || null, fields);
  cache.invalidatePrefix('clients');
}

async function handleClientUpdated(data: Record<string, unknown>) {
  const name = [(data.firstName as string), (data.lastName as string)].filter(Boolean).join(' ');
  const email = (data.email as string) || '';
  if (!name) return;

  // Find by Mangomint Client ID first, then by email
  const mangomintId = String(data.id || '');
  let existingId: string | null = null;

  if (email) {
    existingId = await findRecordByField(Tables.clients(), 'Email', email, ['Email']);
  }

  const fields: Record<string, unknown> = {
    Client: name,
    Email: email,
    Phone: (data.mobilePhone as string) || (data.phone as string) || '',
    Status: 'Active',
    [FIELDS.clients.mangomintClientId]: mangomintId,
  };

  if (existingId) {
    await upsertRecord(Tables.clients(), existingId, fields);
  } else {
    await upsertRecord(Tables.clients(), null, fields);
  }

  cache.invalidatePrefix('clients');
}

async function handleMembershipCreated(data: Record<string, unknown>, payload: unknown) {
  const fields: Record<string, unknown> = {
    Tier: (data.membership_name as string) || (data.membershipName as string) || (data.membership_tier as string) || 'Unknown',
    'Monthly Price': (data.price as number) || (data.monthlyPrice as number) || 0,
    Status: 'Active',
    'Start Date': (data.start_date as string) || (data.startDate as string) || new Date().toISOString().split('T')[0],
    'Billing Frequency': (data.billing_frequency as string) || 'Monthly',
    'MangoMint Membership ID': String(data.id || ''),
    'Source': 'Mangomint Webhook',
  };

  await upsertRecord(Tables.memberships(), null, fields);
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

    // MANDATORY: verify webhook signature
    if (!process.env.MANGOMINT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
    }

    const signature = request.headers.get('x-mangomint-signature');
    if (!signature) {
      logWebhookEvent('mangomint', 'unknown', false, { error: 'Missing signature' });
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const crypto = await import('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.MANGOMINT_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logWebhookEvent('mangomint', 'unknown', false, { error: 'Invalid signature' });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event || payload.type || 'unknown';
    const data = payload.data || payload;

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
