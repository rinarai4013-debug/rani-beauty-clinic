/**
 * RaniOS Billing API
 *
 * Subscription management and Stripe webhook processing.
 *
 * GET    /api/tenant/billing             - Get billing summary
 * POST   /api/tenant/billing             - Actions: checkout, portal, change-tier, cancel, resume
 * POST   /api/tenant/billing (webhook)   - Stripe webhook handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCheckoutSession,
  createBillingPortalSession,
  changeTier,
  cancelSubscription,
  resumeSubscription,
  getUsage,
  constructWebhookEvent,
  handleWebhookEvent,
  getBillingSummary,
  trackUsage,
} from '@/lib/tenant/billing';
import { getTenantStore } from '@/lib/tenant/resolver';
import { getSession } from '@/lib/auth/session';
import type { SubscriptionTier } from '@/lib/tenant/config';

// ─── GET: Billing Summary ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 });
  }

  const store = getTenantStore();
  const tenant = await store.getById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const summary = getBillingSummary(tenant);
  const usage = await getUsage(tenantId);

  return NextResponse.json({
    ...summary,
    usage: usage.usage,
    limits: usage.limits,
    usagePercentages: usage.percentages,
  });
}

// ─── POST: Billing Actions & Webhook ────────────────────────────────────────

const billingActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('checkout'),
    tier: z.enum(['starter', 'professional', 'enterprise']),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    trialDays: z.number().optional(),
  }),
  z.object({
    action: z.literal('portal'),
    returnUrl: z.string().url(),
  }),
  z.object({
    action: z.literal('change-tier'),
    tier: z.enum(['starter', 'professional', 'enterprise']),
  }),
  z.object({
    action: z.literal('cancel'),
    immediately: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('resume'),
  }),
  z.object({
    action: z.literal('track-usage'),
    metric: z.enum(['apiCalls', 'aiTokens', 'smsSent', 'emailsSent', 'storageBytes']),
    amount: z.number().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  // Check if this is a Stripe webhook (raw body, signature header)
  const signature = request.headers.get('stripe-signature');

  if (signature) {
    return handleStripeWebhook(request, signature);
  }

  // Otherwise, it's a billing action from an authenticated user
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = billingActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const store = getTenantStore();
    const tenant = await store.getById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const data = parsed.data;

    switch (data.action) {
      case 'checkout': {
        if (!tenant.subscription.stripeCustomerId) {
          return NextResponse.json(
            { error: 'Stripe customer not created. Complete onboarding first.' },
            { status: 400 }
          );
        }

        const session = await createCheckoutSession({
          tenantId,
          customerId: tenant.subscription.stripeCustomerId,
          tier: data.tier as SubscriptionTier,
          successUrl: data.successUrl,
          cancelUrl: data.cancelUrl,
          trialDays: data.trialDays,
        });

        return NextResponse.json({ url: session.url });
      }

      case 'portal': {
        if (!tenant.subscription.stripeCustomerId) {
          return NextResponse.json(
            { error: 'No Stripe customer. Complete onboarding first.' },
            { status: 400 }
          );
        }

        const portalSession = await createBillingPortalSession({
          customerId: tenant.subscription.stripeCustomerId,
          returnUrl: data.returnUrl,
        });

        return NextResponse.json({ url: portalSession.url });
      }

      case 'change-tier': {
        if (!tenant.subscription.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No active subscription' },
            { status: 400 }
          );
        }

        // Only CEO can change tiers
        if (session.role !== 'ceo') {
          return NextResponse.json(
            { error: 'Only the owner can change subscription tiers' },
            { status: 403 }
          );
        }

        const subscription = await changeTier(
          tenant.subscription.stripeSubscriptionId,
          data.tier as SubscriptionTier,
          tenantId
        );

        return NextResponse.json({
          success: true,
          tier: data.tier,
          subscriptionId: subscription.id,
        });
      }

      case 'cancel': {
        if (!tenant.subscription.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No active subscription' },
            { status: 400 }
          );
        }

        if (session.role !== 'ceo') {
          return NextResponse.json(
            { error: 'Only the owner can cancel subscriptions' },
            { status: 403 }
          );
        }

        const subscription = await cancelSubscription(
          tenant.subscription.stripeSubscriptionId,
          { immediately: data.immediately }
        );

        return NextResponse.json({
          success: true,
          cancelAt: data.immediately ? 'now' : subscription.current_period_end,
        });
      }

      case 'resume': {
        if (!tenant.subscription.stripeSubscriptionId) {
          return NextResponse.json(
            { error: 'No subscription to resume' },
            { status: 400 }
          );
        }

        const subscription = await resumeSubscription(
          tenant.subscription.stripeSubscriptionId
        );

        return NextResponse.json({
          success: true,
          status: subscription.status,
        });
      }

      case 'track-usage': {
        const result = await trackUsage(tenantId, data.metric, data.amount || 1);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[API:Billing] Action failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Stripe Webhook Handler ─────────────────────────────────────────────────

async function handleStripeWebhook(
  request: NextRequest,
  signature: string
): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const event = constructWebhookEvent(rawBody, signature);
    const result = await handleWebhookEvent(event);

    if (result.handled) {
      console.log(`[Webhook] ${event.type} → ${result.action} (tenant: ${result.tenantId || 'none'})`);
      return NextResponse.json({ received: true, action: result.action });
    }

    return NextResponse.json({ received: true, action: 'ignored' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
