import { NextRequest, NextResponse } from 'next/server';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { logWebhookEvent } from '@/lib/logging/structured-logger';

// POST — receive Mangomint webhook events
// Webhook URL to configure in Mangomint:
// https://www.ranibeautyclinic.com/api/webhooks/mangomint
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
    if (signature !== expected) {
      logWebhookEvent('mangomint', 'unknown', false, { error: 'Invalid signature' });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event || payload.type || 'unknown';
    const data = payload.data || payload;

    logWebhookEvent('mangomint', event, true, { dataPreview: JSON.stringify(data).substring(0, 200) });

    // Handle different event types
    switch (event) {
      case 'appointment.created':
      case 'appointment.updated':
      case 'appointment.completed': {
        // Sync appointment to Airtable
        const apt = data;
        const mangomintId = String(apt.id || '');
        const date = apt.startAt?.substring(0, 10) || apt.date || new Date().toISOString().substring(0, 10);
        const clientName = [apt.clientFirstName, apt.clientLastName].filter(Boolean).join(' ') || apt.clientName || 'Walk-in';
        const serviceName = apt.serviceName || apt.service?.name || 'Treatment';

        const fields = {
          Date: date,
          Client: clientName,
          Service: serviceName,
          Provider: apt.staffName || apt.staff?.name || 'Rani',
          Status: event === 'appointment.completed' ? 'Completed' : (apt.status || 'Scheduled'),
          'Start Time': apt.startAt || '',
          'End Time': apt.endAt || '',
          Notes: apt.notes || '',
          'MangoMint Appointment ID': mangomintId,
        };

        // For updates, search for existing record first
        if (event === 'appointment.updated' && mangomintId) {
          const existingId = await rateLimitedQuery(() =>
            new Promise<string | null>((resolve) => {
              Tables.appointments()
                .select({
                  filterByFormula: `{MangoMint Appointment ID} = "${sanitizeFormulaValue(mangomintId)}"`,
                  maxRecords: 1,
                  fields: ['MangoMint Appointment ID'],
                })
                .firstPage((err, records) => {
                  if (err || !records || records.length === 0) resolve(null);
                  else resolve(records[0].id);
                });
            })
          );

          if (existingId) {
            await rateLimitedQuery(() =>
              new Promise<void>((resolve, reject) => {
                Tables.appointments().update(
                  [{ id: existingId, fields }],
                  { typecast: true },
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              })
            );
            cache.invalidatePrefix('schedule');
            cache.invalidatePrefix('kpi');
            break;
          }
        }

        await rateLimitedQuery(() =>
          new Promise<void>((resolve, reject) => {
            Tables.appointments().create(
              [{ fields }],
              { typecast: true },
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          })
        );

        // Invalidate schedule cache
        cache.invalidatePrefix('schedule');
        cache.invalidatePrefix('kpi');
        break;
      }

      case 'appointment.cancelled': {
        // Log cancellation
        console.log('Appointment cancelled:', data.id);
        cache.invalidatePrefix('schedule');
        break;
      }

      case 'client.created':
      case 'client.updated': {
        // Sync client to Airtable
        const client = data;
        const name = [client.firstName, client.lastName].filter(Boolean).join(' ');
        const email = client.email || '';

        if (name) {
          // Check if client already exists by email
          let existingRecordId: string | null = null;
          if (email) {
            existingRecordId = await rateLimitedQuery(() =>
              new Promise<string | null>((resolve) => {
                Tables.clients()
                  .select({
                    filterByFormula: `{Email} = "${sanitizeFormulaValue(email)}"`,
                    maxRecords: 1,
                    fields: ['Email'],
                  })
                  .firstPage((err, records) => {
                    if (err || !records || records.length === 0) resolve(null);
                    else resolve(records[0].id);
                  });
              })
            );

            if (existingRecordId && event === 'client.created') {
              // Skip duplicate
              break;
            }
          }

          const clientFields = {
            Client: name,
            Email: email,
            Phone: client.mobilePhone || client.phone || '',
            Status: 'Active',
          };

          if (existingRecordId && event === 'client.updated') {
            // Update existing record
            await rateLimitedQuery(() =>
              new Promise<void>((resolve, reject) => {
                Tables.clients().update(
                  [{ id: existingRecordId!, fields: clientFields }],
                  { typecast: true },
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              })
            );
          } else {
            // Create new record
            await rateLimitedQuery(() =>
              new Promise<void>((resolve, reject) => {
                Tables.clients().create(
                  [{ fields: clientFields }],
                  { typecast: true },
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              })
            );
          }
        }

        cache.invalidatePrefix('clients');
        break;
      }

      case 'sale.completed': {
        // Sync sale/transaction to Airtable
        const sale = data;
        await rateLimitedQuery(() =>
          new Promise<void>((resolve, reject) => {
            Tables.transactions().create(
              [
                {
                  fields: {
                    Date: sale.date || new Date().toISOString().substring(0, 10),
                    Type: 'Service Payment',
                    Amount: sale.total || sale.amount || 0,
                    'Payment Method': `Mangomint (${sale.paymentMethod || 'Card'})`,
                    Status: 'Completed',
                    'Service Name': sale.serviceName || 'Treatment',
                  },
                },
              ],
              { typecast: true },
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          })
        );

        cache.invalidatePrefix('revenue');
        cache.invalidatePrefix('kpi');
        break;
      }

      default:
        console.log(`Unhandled Mangomint event: ${event}`);
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    logWebhookEvent('mangomint', 'processing', false, { error: String(error) });
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    );
  }
}

// GET — health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'mangomint',
    configured: !!process.env.MANGOMINT_WEBHOOK_SECRET,
    url: 'https://www.ranibeautyclinic.com/api/webhooks/mangomint',
    supportedEvents: [
      'appointment.created',
      'appointment.updated',
      'appointment.completed',
      'appointment.cancelled',
      'client.created',
      'client.updated',
      'sale.completed',
    ],
  });
}
