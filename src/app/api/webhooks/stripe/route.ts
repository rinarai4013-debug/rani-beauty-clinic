import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache } from '@/lib/cache';
import { env, hasFeature } from '@/lib/env';
import { logWebhookEvent } from '@/lib/logging/structured-logger';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { captureWebhookEvent, captureCheckoutEvent } from '@/lib/sentry-utils';

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

// POST - receive Stripe webhook events
// Webhook URL to configure in Stripe Dashboard:
// https://www.ranibeautyclinic.com/api/webhooks/stripe
export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('stripe-webhook', ip, RATE_LIMITS.WEBHOOK);
  if (!allowed) return rateLimitResponse(resetIn);

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  const endpointSecret = getWebhookSecret();

  if (!signature || !endpointSecret) {
    logWebhookEvent('stripe', 'unknown', false, { error: 'Missing signature or webhook secret' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    logWebhookEvent('stripe', 'unknown', false, { error: `Signature verification failed: ${String(err)}` });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  logWebhookEvent('stripe', event.type, true, { eventId: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const planId = metadata.planId || '';
        const tier = metadata.tier || '';
        const clientName = metadata.clientName || session.customer_details?.name || 'Unknown';
        const amount = (session.amount_total || 0) / 100;

        // Create transaction record in Airtable
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.transactions().create(
                [
                  {
                    fields: {
                      'Client Name': clientName,
                      Amount: amount,
                      'Payment Method': 'Stripe',
                      Type: 'Deposit',
                      Date: new Date().toISOString(),
                      Notes: `Treatment plan deposit - ${tier} tier`,
                      Status: 'Completed',
                      'Stripe Session ID': session.id,
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
          logWebhookEvent('stripe', 'checkout.session.completed', false, {
            error: `Airtable transaction create failed: ${String(airtableErr)}`,
            sessionId: session.id,
          });
        }

        // Update treatment plan status if planId exists
        if (planId) {
          try {
            const existingId = await rateLimitedQuery(() =>
              new Promise<string | null>((resolve) => {
                Tables.intakes()
                  .select({
                    filterByFormula: `{Intake Record ID} = "${sanitizeFormulaValue(planId)}"`,
                    maxRecords: 1,
                    fields: ['Intake Record ID'],
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
                  Tables.intakes().update(
                    [{ id: existingId, fields: { 'Processing Status': 'Responded' } }],
                    { typecast: true },
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                })
              );
            }
          } catch (updateErr) {
            logWebhookEvent('stripe', 'checkout.session.completed', false, {
              error: `Airtable intake update failed: ${String(updateErr)}`,
              planId,
            });
          }
        }

        // Forward to n8n (fire and forget)
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/stripe-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'checkout.session.completed', planId, tier, clientName, amount, sessionId: session.id }),
          }).catch(() => {});
        }

        // Invalidate caches
        cache.invalidatePrefix('revenue');
        cache.invalidatePrefix('kpi');
        cache.invalidatePrefix('transactions');

        logWebhookEvent('stripe', 'checkout.session.completed', true, { planId, tier, amount });
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const planId = metadata.planId || '';
        const tier = metadata.tier || '';
        const clientName = metadata.clientName || session.customer_details?.name || 'Unknown';

        logWebhookEvent('stripe', 'checkout.session.expired', true, { planId, tier, clientName });

        // Create alert in Airtable
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Abandoned Checkout',
                      Severity: 'warning',
                      Message: `Abandoned checkout - ${clientName} (${tier} tier, Plan: ${planId})`,
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
          logWebhookEvent('stripe', 'checkout.session.expired', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }

        // Forward to n8n for abandoned cart recovery (fire and forget)
        if (hasFeature.n8n()) {
          fetch(`${env.N8N_WEBHOOK_URL}/webhook/stripe-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'checkout.session.expired', planId, tier, clientName }),
          }).catch(() => {});
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const error = paymentIntent.last_payment_error;

        logWebhookEvent('stripe', 'payment_intent.payment_failed', true, {
          paymentIntentId: paymentIntent.id,
          errorCode: error?.code,
          errorMessage: error?.message,
        });

        // Create alert
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Payment Failed',
                      Severity: 'warning',
                      Message: `Payment failed - ${error?.message || 'Unknown error'} (${paymentIntent.id})`,
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
          logWebhookEvent('stripe', 'payment_intent.payment_failed', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const sessionId = charge.payment_intent as string;

        logWebhookEvent('stripe', 'charge.refunded', true, {
          chargeId: charge.id,
          amount: (charge.amount_refunded || 0) / 100,
        });

        // Find and update the original transaction record
        if (sessionId) {
          try {
            const existingId = await rateLimitedQuery(() =>
              new Promise<string | null>((resolve) => {
                Tables.transactions()
                  .select({
                    filterByFormula: `{Stripe Session ID} = "${sanitizeFormulaValue(sessionId)}"`,
                    maxRecords: 1,
                    fields: ['Stripe Session ID'],
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
                  Tables.transactions().update(
                    [{ id: existingId, fields: { Status: 'Refunded' } }],
                    { typecast: true },
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                })
              );
            }
          } catch (updateErr) {
            logWebhookEvent('stripe', 'charge.refunded', false, {
              error: `Airtable transaction update failed: ${String(updateErr)}`,
            });
          }
        }

        // Create alert
        try {
          await rateLimitedQuery(() =>
            new Promise<void>((resolve, reject) => {
              Tables.alerts().create(
                [
                  {
                    fields: {
                      Type: 'Refund Processed',
                      Severity: 'info',
                      Message: `Charge refunded - $${((charge.amount_refunded || 0) / 100).toFixed(2)} (${charge.id})`,
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
          logWebhookEvent('stripe', 'charge.refunded', false, {
            error: `Airtable alert create failed: ${String(alertErr)}`,
          });
        }

        // Invalidate revenue caches
        cache.invalidatePrefix('revenue');
        cache.invalidatePrefix('kpi');
        cache.invalidatePrefix('transactions');
        break;
      }

      default:
        logWebhookEvent('stripe', event.type, true, { note: 'Unhandled event type' });
    }

    captureWebhookEvent('stripe', event.type, true);
    return NextResponse.json({ received: true, event: event.type });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'webhook-stripe', event: event.type } });
    captureWebhookEvent('stripe', event.type, false, { error: String(error) });
    logWebhookEvent('stripe', event.type, false, { error: String(error) });
    // Always return 200 for valid signatures - Stripe retries on non-2xx
    return NextResponse.json({ received: true, event: event.type, error: 'Processing error' });
  }
}

// GET - reject non-POST requests (no health check info exposed)
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
