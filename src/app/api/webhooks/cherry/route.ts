import { NextRequest, NextResponse } from 'next/server';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache } from '@/lib/cache';
import { env, hasFeature } from '@/lib/env';
import { logWebhookEvent } from '@/lib/logging/structured-logger';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// POST — receive Cherry financing webhook events
// Webhook URL to configure in Cherry dashboard:
// https://www.ranibeautyclinic.com/api/webhooks/cherry
export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('cherry-webhook', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) return rateLimitResponse(resetIn);

  const body = await request.text();

  // MANDATORY: verify webhook signature
  if (!env.CHERRY_WEBHOOK_SECRET) {
    logWebhookEvent('cherry', 'unknown', false, { error: 'Webhook secret not configured' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const signature = request.headers.get('x-cherry-signature');
  if (!signature) {
    logWebhookEvent('cherry', 'unknown', false, { error: 'Missing signature' });
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const crypto = await import('crypto');
  const expected = crypto
    .createHmac('sha256', env.CHERRY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  if (signature !== expected) {
    logWebhookEvent('cherry', 'unknown', false, { error: 'Invalid signature' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = payload.event || payload.type || 'unknown';
  const data = payload.data || payload;

  logWebhookEvent('cherry', event, true, { dataPreview: JSON.stringify(data).substring(0, 200) });

  try {
    switch (event) {
      // ── application_submitted ──────────────────────────────────
      case 'application_submitted': {
        const clientName = data.clientName || data.client_name || 'Unknown';
        const clientEmail = data.email || data.clientEmail || '';

        logWebhookEvent('cherry', 'application_submitted', true, { clientName, clientEmail });

        // Create Alert
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Financing Application',
                      Severity: 'info',
                      Message: `Financing application submitted — ${clientName}`,
                      'Action Recommended': 'Monitor for approval status',
                      Status: 'Active',
                      'Created Date': new Date().toISOString(),
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
        } catch (alertErr) {
          logWebhookEvent('cherry', 'application_submitted', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }

        // Forward to n8n (fire and forget)
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/financing-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'application_submitted', source: 'cherry', clientName, clientEmail, data }),
          }).catch(() => {});
        }
        break;
      }

      // ── application_approved ───────────────────────────────────
      case 'application_approved': {
        const clientName = data.clientName || data.client_name || 'Unknown';
        const clientEmail = data.email || data.clientEmail || '';
        const approvedAmount = data.approvedAmount || data.approved_amount || 0;

        logWebhookEvent('cherry', 'application_approved', true, { clientName, approvedAmount });

        // Update client record if found by email — add "Cherry Approved" tag
        if (clientEmail) {
          try {
            const existingId = await rateLimitedQuery(() =>
              new Promise<string | null>((resolve) => {
                Tables.clients()
                  .select({
                    filterByFormula: `{Email} = "${sanitizeFormulaValue(clientEmail)}"`,
                    maxRecords: 1,
                    fields: ['Email'],
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
                  Tables.clients().update(
                    [{ id: existingId, fields: { Status: 'Active' } }],
                    { typecast: true },
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                })
              );
            }
          } catch (clientErr) {
            logWebhookEvent('cherry', 'application_approved', false, {
              error: `Airtable client update failed: ${String(clientErr)}`,
            });
          }
        }

        // Create Alert (success)
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Financing Approved',
                      Severity: 'info',
                      Message: `Financing approved — ${clientName} for $${Number(approvedAmount).toLocaleString()}`,
                      'Action Recommended': 'Schedule treatment — client has financing approved',
                      Status: 'Active',
                      'Created Date': new Date().toISOString(),
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
        } catch (alertErr) {
          logWebhookEvent('cherry', 'application_approved', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }

        // Forward to n8n
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/financing-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'application_approved', source: 'cherry', clientName, clientEmail, approvedAmount, data }),
          }).catch(() => {});
        }
        break;
      }

      // ── application_declined ───────────────────────────────────
      case 'application_declined': {
        const clientName = data.clientName || data.client_name || 'Unknown';
        const clientEmail = data.email || data.clientEmail || '';

        logWebhookEvent('cherry', 'application_declined', true, { clientName });

        // Create Alert (info severity)
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Financing Declined',
                      Severity: 'info',
                      Message: `Financing declined — ${clientName}`,
                      'Action Recommended': 'Offer alternative payment plans (Afterpay, PatientFi, or in-house)',
                      Status: 'Active',
                      'Created Date': new Date().toISOString(),
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
        } catch (alertErr) {
          logWebhookEvent('cherry', 'application_declined', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }

        // Forward to n8n for follow-up (offer alternative payment plans)
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/financing-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'application_declined', source: 'cherry', clientName, clientEmail, data }),
          }).catch(() => {});
        }
        break;
      }

      // ── transaction_completed ──────────────────────────────────
      case 'transaction_completed': {
        const clientName = data.clientName || data.client_name || 'Unknown';
        const amount = data.amount || data.transactionAmount || 0;
        const planDetails = data.planDetails || data.plan_details || data.plan || 'Standard financing plan';
        const date = data.date || new Date().toISOString().substring(0, 10);

        logWebhookEvent('cherry', 'transaction_completed', true, { clientName, amount });

        // Create Airtable Transaction record
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.transactions().create(
                [
                  {
                    fields: {
                      'Client Name': clientName,
                      Amount: Number(amount),
                      'Payment Method': 'Cherry',
                      Type: 'Service Payment',
                      Date: date,
                      Status: 'Completed',
                      'Is Financing': true,
                      'Financing Provider': 'Cherry',
                      Notes: `Cherry financing — ${planDetails}`,
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
        } catch (airtableErr) {
          logWebhookEvent('cherry', 'transaction_completed', false, {
            error: `Airtable transaction create failed: ${String(airtableErr)}`,
          });
        }

        // Invalidate caches
        cache.invalidatePrefix('revenue');
        cache.invalidatePrefix('kpi');
        cache.invalidatePrefix('transactions');

        // Forward to n8n
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/financing-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'transaction_completed', source: 'cherry', clientName, amount, planDetails, date, data }),
          }).catch(() => {});
        }
        break;
      }

      default:
        console.log(`Unhandled Cherry event: ${event}`);
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    logWebhookEvent('cherry', event, false, { error: String(error) });
    // Always return 200 for valid signatures — Cherry retries on non-2xx
    return NextResponse.json({ received: true, event, error: 'Processing error' });
  }
}

// GET — health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'cherry',
    configured: Boolean(env.CHERRY_API_KEY && env.CHERRY_WEBHOOK_SECRET),
    events: [
      'application_submitted',
      'application_approved',
      'application_declined',
      'transaction_completed',
    ],
  });
}
