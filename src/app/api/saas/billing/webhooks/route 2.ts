/**
 * Stripe Billing Webhooks
 *
 * POST - Handle Stripe subscription lifecycle events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createDunningRecord,
  advanceDunning,
  resolveDunning,
  getDunningAction,
  type DunningStage,
} from '@/lib/saas/self-serve-billing';

// Stripe event types we handle
type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.trial_will_end';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // In production: verify Stripe webhook signature
    // const sig = req.headers.get('stripe-signature');
    // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    const event = JSON.parse(body);
    const eventType = event.type as StripeEventType;

    let result: Record<string, unknown> = { received: true };

    switch (eventType) {
      case 'checkout.session.completed': {
        // New subscription - trigger provisioning
        const session = event.data?.object;
        result = {
          action: 'provision_tenant',
          customerId: session?.customer,
          subscriptionId: session?.subscription,
          email: session?.customer_email,
          // In production: call /api/saas/onboarding/provision
        };
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data?.object;
        result = {
          action: 'subscription_created',
          subscriptionId: subscription?.id,
          status: subscription?.status,
          plan: subscription?.items?.data?.[0]?.price?.id,
        };
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data?.object;
        const previousAttributes = event.data?.previous_attributes;

        // Detect upgrade/downgrade
        const planChanged = previousAttributes?.items;
        const statusChanged = previousAttributes?.status;

        result = {
          action: planChanged ? 'plan_changed' : statusChanged ? 'status_changed' : 'subscription_updated',
          subscriptionId: subscription?.id,
          status: subscription?.status,
          cancelAtPeriodEnd: subscription?.cancel_at_period_end,
        };
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data?.object;
        result = {
          action: 'subscription_cancelled',
          subscriptionId: subscription?.id,
          // In production: suspend tenant, send cancellation email
        };
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data?.object;
        result = {
          action: 'payment_succeeded',
          invoiceId: invoice?.id,
          amount: invoice?.amount_paid,
          // In production: resolve any dunning records, update billing status
        };
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data?.object;
        const tenantId = invoice?.metadata?.tenantId || 'unknown';
        const subscriptionId = invoice?.subscription;

        // Start dunning process
        const dunning = createDunningRecord(tenantId, subscriptionId);
        const action = getDunningAction(dunning.stage);

        result = {
          action: 'payment_failed',
          invoiceId: invoice?.id,
          dunning: {
            stage: dunning.stage,
            action: action.action,
            emailSubject: action.emailSubject,
          },
          // In production: send dunning email, schedule retries
        };
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data?.object;
        result = {
          action: 'trial_ending',
          subscriptionId: subscription?.id,
          trialEnd: subscription?.trial_end,
          // In production: send trial-ending email with upgrade CTA
        };
        break;
      }

      default:
        result = { action: 'unhandled', eventType };
    }

    return NextResponse.json({
      received: true,
      eventType,
      ...result,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
