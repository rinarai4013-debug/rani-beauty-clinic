/**
 * RaniOS Stripe Subscription Management
 *
 * Handles customer creation, subscription lifecycle, webhook processing,
 * feature gating based on subscription tier, and usage metering.
 */

import Stripe from 'stripe';
import type {
  TenantConfig,
  SubscriptionTier,
  SubscriptionConfig,
  TenantUsage,
  UsageLimits,
} from './config';
import { TIER_PRICING, TIER_USAGE_LIMITS, TIER_FEATURES } from './config';
import { getTenantStore, invalidateTenantCache } from './resolver';
import { env } from '@/lib/env';

// ─── Stripe Client ──────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  }
  return _stripe;
}

/** Exposed for testing - inject a mock Stripe client */
export function setStripeClient(client: Stripe): void {
  _stripe = client;
}

// ─── Price ID Mapping ───────────────────────────────────────────────────────

/**
 * Map subscription tiers to Stripe Price IDs.
 * These must be configured in Stripe Dashboard and set via env vars.
 */
function getPriceId(tier: SubscriptionTier): string {
  const mapping: Record<SubscriptionTier, string> = {
    starter: env.STRIPE_PRICE_STARTER || '',
    professional: env.STRIPE_PRICE_PROFESSIONAL || '',
    enterprise: env.STRIPE_PRICE_ENTERPRISE || '',
  };

  const priceId = mapping[tier];
  if (!priceId) throw new Error(`Stripe Price ID not configured for tier: ${tier}`);
  return priceId;
}

// ─── Customer Management ────────────────────────────────────────────────────

export async function createCustomer(params: {
  tenantId: string;
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      tenantId: params.tenantId,
      ...params.metadata,
    },
  });

  return customer;
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return stripe.customers.update(customerId, params);
}

// ─── Subscription Management ────────────────────────────────────────────────

export interface CreateSubscriptionParams {
  tenantId: string;
  customerId: string;
  tier: SubscriptionTier;
  trialDays?: number;
  couponId?: string;
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  const priceId = getPriceId(params.tier);

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: params.customerId,
    items: [{ price: priceId }],
    metadata: {
      tenantId: params.tenantId,
      tier: params.tier,
    },
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  };

  if (params.trialDays) {
    subscriptionParams.trial_period_days = params.trialDays;
  }

  if (params.couponId) {
    subscriptionParams.coupon = params.couponId;
  }

  return stripe.subscriptions.create(subscriptionParams);
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice'],
    });
  } catch {
    return null;
  }
}

export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, params);
}

export async function cancelSubscription(
  subscriptionId: string,
  options: { immediately?: boolean } = {}
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (options.immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  // Cancel at period end (user keeps access until then)
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Change subscription tier (upgrade or downgrade).
 * Proration is applied automatically.
 */
export async function changeTier(
  subscriptionId: string,
  newTier: SubscriptionTier,
  tenantId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const newPriceId = getPriceId(newTier);

  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    metadata: {
      tenantId,
      tier: newTier,
    },
    proration_behavior: 'create_prorations',
  });

  return updated;
}

// ─── Checkout Session ───────────────────────────────────────────────────────

export async function createCheckoutSession(params: {
  tenantId: string;
  customerId: string;
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const priceId = getPriceId(params.tier);

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      metadata: {
        tenantId: params.tenantId,
        tier: params.tier,
      },
      ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
    },
    metadata: {
      tenantId: params.tenantId,
    },
  });
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

// ─── Webhook Processing ────────────────────────────────────────────────────

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export interface WebhookResult {
  handled: boolean;
  tenantId?: string;
  action?: string;
  error?: string;
}

/**
 * Process Stripe webhook events and update tenant state.
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<WebhookResult> {
  const store = getTenantStore();

  switch (event.type) {
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata.tenantId;
      if (!tenantId) return { handled: false, error: 'No tenantId in metadata' };

      const tier = (subscription.metadata.tier as SubscriptionTier) || 'starter';
      const config = await store.getById(tenantId);
      if (!config) return { handled: false, tenantId, error: 'Tenant not found' };

      await store.update(tenantId, {
        subscription: {
          ...config.subscription,
          tier,
          stripeSubscriptionId: subscription.id,
          status: mapStripeStatus(subscription.status),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        features: TIER_FEATURES[tier],
      });

      invalidateTenantCache(tenantId);
      return { handled: true, tenantId, action: 'subscription_created' };
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata.tenantId;
      if (!tenantId) return { handled: false, error: 'No tenantId in metadata' };

      const tier = (subscription.metadata.tier as SubscriptionTier) || 'starter';
      const config = await store.getById(tenantId);
      if (!config) return { handled: false, tenantId, error: 'Tenant not found' };

      await store.update(tenantId, {
        subscription: {
          ...config.subscription,
          tier,
          status: mapStripeStatus(subscription.status),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        features: TIER_FEATURES[tier],
      });

      invalidateTenantCache(tenantId);
      return { handled: true, tenantId, action: 'subscription_updated' };
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata.tenantId;
      if (!tenantId) return { handled: false, error: 'No tenantId in metadata' };

      const config = await store.getById(tenantId);
      if (!config) return { handled: false, tenantId, error: 'Tenant not found' };

      await store.update(tenantId, {
        subscription: {
          ...config.subscription,
          status: 'canceled',
          cancelAtPeriodEnd: false,
        },
        // Downgrade to minimal features on cancellation
        features: {
          churn: false,
          noShow: false,
          pricing: false,
          pnl: false,
          schedule: true, // Keep basic schedule access
          inventory: false,
          social: false,
          ads: false,
          consult: false,
          rag: false,
          phone: false,
          gamification: false,
          templates: false,
          plaid: false,
          whiteLabel: false,
        },
      });

      invalidateTenantCache(tenantId);
      return { handled: true, tenantId, action: 'subscription_deleted' };
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const tenantId = invoice.subscription_details?.metadata?.tenantId
        || (typeof invoice.subscription === 'string' ? undefined : undefined);

      if (!tenantId) {
        // Try to find tenant by customer ID
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
        if (!customerId) return { handled: false, error: 'No customer ID on invoice' };

        // We log this but don't block - invoice.paid is informational
        console.log(`[Billing] Invoice paid for customer ${customerId} (no tenantId in metadata)`);
        return { handled: true, action: 'invoice_paid_no_tenant' };
      }

      const config = await store.getById(tenantId);
      if (config) {
        // Reset usage counters for new billing period
        const now = new Date();
        await store.update(tenantId, {
          usage: {
            apiCalls: 0,
            aiTokens: 0,
            smsSent: 0,
            emailsSent: 0,
            storageBytes: config.usage.storageBytes, // Storage persists
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          },
        });
        invalidateTenantCache(tenantId);
      }

      return { handled: true, tenantId, action: 'invoice_paid' };
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

      console.error(`[Billing] Payment failed for customer ${customerId}`);
      // In production, trigger email notification to tenant owner
      return { handled: true, action: 'payment_failed' };
    }

    default:
      return { handled: false, action: `unhandled_event: ${event.type}` };
  }
}

// ─── Feature Gating ─────────────────────────────────────────────────────────

/**
 * Check if a tenant has access to a feature based on their subscription.
 * Returns { allowed, reason } for API-level gating.
 */
export function checkFeatureAccess(
  tenant: TenantConfig,
  feature: keyof typeof TIER_FEATURES.starter
): { allowed: boolean; reason?: string } {
  // Check subscription status
  if (tenant.subscription.status === 'canceled') {
    return { allowed: false, reason: 'Subscription is canceled. Please resubscribe.' };
  }

  if (tenant.subscription.status === 'past_due') {
    // Grace period - allow access for 7 days
    const end = new Date(tenant.subscription.currentPeriodEnd);
    const grace = new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() > grace) {
      return { allowed: false, reason: 'Payment is overdue. Please update your payment method.' };
    }
  }

  // Check feature flag
  if (!tenant.features[feature]) {
    const tier = Object.entries(TIER_FEATURES).find(
      ([, features]) => features[feature]
    )?.[0] as SubscriptionTier | undefined;

    const tierName = tier ? TIER_PRICING[tier].name : 'Enterprise';
    const tierPrice = tier ? TIER_PRICING[tier].monthly : 999;

    return {
      allowed: false,
      reason: `This feature requires the ${tierName} plan ($${tierPrice}/mo). Upgrade to access.`,
    };
  }

  return { allowed: true };
}

// ─── Usage Metering ─────────────────────────────────────────────────────────

export type UsageMetric = keyof Omit<TenantUsage, 'period'>;

/**
 * Increment a usage counter for a tenant.
 * Returns { allowed, remaining } - if limit exceeded, allowed=false.
 */
export async function trackUsage(
  tenantId: string,
  metric: UsageMetric,
  amount: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const store = getTenantStore();
  const config = await store.getById(tenantId);
  if (!config) throw new Error(`Tenant ${tenantId} not found`);

  const limits = TIER_USAGE_LIMITS[config.subscription.tier];
  const limitKey = `max${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof UsageLimits;
  const limit = limits[limitKey];

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Reset if period changed
  let usage = { ...config.usage };
  if (usage.period !== currentPeriod) {
    usage = {
      apiCalls: 0,
      aiTokens: 0,
      smsSent: 0,
      emailsSent: 0,
      storageBytes: usage.storageBytes,
      period: currentPeriod,
    };
  }

  const current = usage[metric] + amount;
  const allowed = current <= limit;

  // Always update usage (even if over limit - we track but may soft-block)
  usage[metric] = current;
  await store.update(tenantId, { usage });
  invalidateTenantCache(tenantId);

  return {
    allowed,
    current,
    limit,
    remaining: Math.max(0, limit - current),
  };
}

/**
 * Get current usage for a tenant.
 */
export async function getUsage(tenantId: string): Promise<{
  usage: TenantUsage;
  limits: UsageLimits;
  percentages: Record<UsageMetric, number>;
}> {
  const store = getTenantStore();
  const config = await store.getById(tenantId);
  if (!config) throw new Error(`Tenant ${tenantId} not found`);

  const limits = TIER_USAGE_LIMITS[config.subscription.tier];

  const percentages: Record<string, number> = {};
  for (const key of ['apiCalls', 'aiTokens', 'smsSent', 'emailsSent', 'storageBytes'] as UsageMetric[]) {
    const limitKey = `max${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof UsageLimits;
    percentages[key] = limits[limitKey] > 0
      ? Math.round((config.usage[key] / limits[limitKey]) * 100)
      : 0;
  }

  return {
    usage: config.usage,
    limits,
    percentages: percentages as Record<UsageMetric, number>,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionConfig['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'trialing':
      return 'trialing';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    default:
      return 'active';
  }
}

/**
 * Get a human-readable billing summary for a tenant.
 */
export function getBillingSummary(config: TenantConfig): {
  tierName: string;
  price: number;
  status: string;
  renewsAt: string;
  features: string[];
} {
  const tier = config.subscription.tier;
  const pricing = TIER_PRICING[tier];
  const features = Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  return {
    tierName: pricing.name,
    price: pricing.monthly,
    status: config.subscription.status,
    renewsAt: config.subscription.currentPeriodEnd,
    features,
  };
}
