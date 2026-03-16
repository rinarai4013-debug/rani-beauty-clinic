import { NextRequest, NextResponse } from 'next/server';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { cache } from '@/lib/cache';

// POST — receive Mangomint webhook events
// Webhook URL to configure in Mangomint:
// https://ranibeautyclinic.com/api/webhooks/mangomint
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Optional: verify webhook signature
    const signature = request.headers.get('x-mangomint-signature');
    if (process.env.MANGOMINT_WEBHOOK_SECRET && signature) {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', process.env.MANGOMINT_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = payload.event || payload.type || 'unknown';
    const data = payload.data || payload;

    console.log(`Mangomint webhook: ${event}`, JSON.stringify(data).substring(0, 200));

    // Handle different event types
    switch (event) {
      case 'appointment.created':
      case 'appointment.updated':
      case 'appointment.completed': {
        // Sync appointment to Airtable
        const apt = data;
        const date = apt.startAt?.substring(0, 10) || apt.date || new Date().toISOString().substring(0, 10);
        const clientName = [apt.clientFirstName, apt.clientLastName].filter(Boolean).join(' ') || apt.clientName || 'Walk-in';
        const serviceName = apt.serviceName || apt.service?.name || 'Treatment';

        await rateLimitedQuery(() =>
          new Promise<void>((resolve, reject) => {
            Tables.appointments().create(
              [
                {
                  fields: {
                    Date: date,
                    Client: clientName,
                    Service: serviceName,
                    Provider: apt.staffName || apt.staff?.name || 'Rani',
                    Status: event === 'appointment.completed' ? 'Completed' : (apt.status || 'Scheduled'),
                    'Start Time': apt.startAt || '',
                    'End Time': apt.endAt || '',
                    Notes: apt.notes || '',
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
          if (email) {
            const existing = await rateLimitedQuery(() =>
              new Promise<boolean>((resolve) => {
                Tables.clients()
                  .select({
                    filterByFormula: `{Email} = "${email}"`,
                    maxRecords: 1,
                    fields: ['Email'],
                  })
                  .firstPage((err, records) => {
                    if (err || !records || records.length === 0) resolve(false);
                    else resolve(true);
                  });
              })
            );

            if (existing && event === 'client.created') {
              // Skip duplicate
              break;
            }
          }

          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.clients().create(
                [
                  {
                    fields: {
                      Client: name,
                      Email: email,
                      Phone: client.mobilePhone || client.phone || '',
                      Status: 'Active',
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
    console.error('Mangomint webhook error:', error);
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
    url: 'https://ranibeautyclinic.com/api/webhooks/mangomint',
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
