/**
 * Billing System Test Suite
 *
 * Tests Stripe integration, subscription management, feature gating,
 * usage metering, and webhook processing.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  checkFeatureAccess,
  trackUsage,
  getUsage,
  getBillingSummary,
  handleWebhookEvent,
} from '../billing';
import {
  DEFAULT_TENANT_CONFIG,
  TIER_FEATURES,
  TIER_PRICING,
  TIER_USAGE_LIMITS,
  type TenantConfig,
  type SubscriptionTier,
} from '../config';
import { InMemoryTenantStore, setTenantStore, clearTenantCache } from '../resolver';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function makeTenant(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    ...DEFAULT_TENANT_CONFIG,
    id: `test-${Date.now()}`,
    name: 'Test Spa',
    slug: 'test-spa',
    active: true,
    subscription: {
      tier: 'professional',
      stripePriceId: 'price_xxx',
      stripeCustomerId: 'cus_xxx',
      stripeSubscriptionId: 'sub_xxx',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
    },
    features: TIER_FEATURES.professional,
    usage: {
      apiCalls: 0,
      aiTokens: 0,
      smsSent: 0,
      emailsSent: 0,
      storageBytes: 0,
      period: new Date().toISOString().slice(0, 7),
    },
    ...overrides,
  };
}

let store: InMemoryTenantStore;

beforeEach(() => {
  clearTenantCache();
  store = new InMemoryTenantStore();
  setTenantStore(store);
});

// ─── checkFeatureAccess ─────────────────────────────────────────────────────

describe('checkFeatureAccess', () => {
  it('allows enabled features', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.professional });
    const result = checkFeatureAccess(tenant, 'churn');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('blocks disabled features', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.starter });
    const result = checkFeatureAccess(tenant, 'churn');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Professional');
  });

  it('blocks canceled subscriptions', () => {
    const tenant = makeTenant({
      subscription: {
        ...DEFAULT_TENANT_CONFIG.subscription,
        status: 'canceled',
        tier: 'professional',
      },
      features: TIER_FEATURES.professional,
    });
    const result = checkFeatureAccess(tenant, 'churn');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('canceled');
  });

  it('allows past_due within 7-day grace period', () => {
    const tenant = makeTenant({
      subscription: {
        ...DEFAULT_TENANT_CONFIG.subscription,
        status: 'past_due',
        tier: 'professional',
        currentPeriodEnd: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
      },
      features: TIER_FEATURES.professional,
    });
    const result = checkFeatureAccess(tenant, 'churn');
    expect(result.allowed).toBe(true);
  });

  it('blocks past_due after 7-day grace period', () => {
    const tenant = makeTenant({
      subscription: {
        ...DEFAULT_TENANT_CONFIG.subscription,
        status: 'past_due',
        tier: 'professional',
        currentPeriodEnd: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
      },
      features: TIER_FEATURES.professional,
    });
    const result = checkFeatureAccess(tenant, 'churn');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('overdue');
  });

  it('starter can access schedule (included feature)', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.starter });
    const result = checkFeatureAccess(tenant, 'schedule');
    expect(result.allowed).toBe(true);
  });

  it('starter cannot access rag (enterprise feature)', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.starter });
    const result = checkFeatureAccess(tenant, 'rag');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Enterprise');
  });

  it('professional cannot access phone (enterprise feature)', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.professional });
    const result = checkFeatureAccess(tenant, 'phone');
    expect(result.allowed).toBe(false);
  });

  it('enterprise can access all features', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.enterprise });
    const features = Object.keys(TIER_FEATURES.enterprise) as (keyof typeof TIER_FEATURES.enterprise)[];
    for (const feature of features) {
      const result = checkFeatureAccess(tenant, feature);
      expect(result.allowed).toBe(true);
    }
  });
});

// ─── Usage Metering ─────────────────────────────────────────────────────────

describe('trackUsage', () => {
  it('increments usage counter', async () => {
    const tenant = makeTenant({ id: 'usage-test-1' });
    await store.create(tenant);

    const result = await trackUsage('usage-test-1', 'apiCalls', 1);
    expect(result.current).toBe(1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(TIER_USAGE_LIMITS.professional.maxApiCalls - 1);
  });

  it('tracks large increments', async () => {
    const tenant = makeTenant({ id: 'usage-test-2' });
    await store.create(tenant);

    const result = await trackUsage('usage-test-2', 'aiTokens', 1000);
    expect(result.current).toBe(1000);
    expect(result.allowed).toBe(true);
  });

  it('reports when limit exceeded', async () => {
    const tenant = makeTenant({
      id: 'usage-test-3',
      usage: {
        apiCalls: TIER_USAGE_LIMITS.professional.maxApiCalls - 5,
        aiTokens: 0,
        smsSent: 0,
        emailsSent: 0,
        storageBytes: 0,
        period: new Date().toISOString().slice(0, 7),
      },
    });
    await store.create(tenant);

    const result = await trackUsage('usage-test-3', 'apiCalls', 10);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets usage on period change', async () => {
    const tenant = makeTenant({
      id: 'usage-test-4',
      usage: {
        apiCalls: 5000,
        aiTokens: 100000,
        smsSent: 100,
        emailsSent: 500,
        storageBytes: 1000,
        period: '2025-01', // Old period
      },
    });
    await store.create(tenant);

    const result = await trackUsage('usage-test-4', 'apiCalls', 1);
    // Should have reset to 0, then added 1
    expect(result.current).toBe(1);
  });

  it('throws for unknown tenant', async () => {
    await expect(trackUsage('nonexistent', 'apiCalls', 1)).rejects.toThrow();
  });
});

describe('getUsage', () => {
  it('returns usage with percentages', async () => {
    const tenant = makeTenant({
      id: 'usage-get-1',
      usage: {
        apiCalls: 50000,
        aiTokens: 2500000,
        smsSent: 2500,
        emailsSent: 10000,
        storageBytes: 5368709120,
        period: new Date().toISOString().slice(0, 7),
      },
    });
    await store.create(tenant);

    const result = await getUsage('usage-get-1');
    expect(result.usage.apiCalls).toBe(50000);
    expect(result.limits).toEqual(TIER_USAGE_LIMITS.professional);
    expect(result.percentages.apiCalls).toBe(50);
    expect(result.percentages.aiTokens).toBe(50);
  });

  it('throws for unknown tenant', async () => {
    await expect(getUsage('nonexistent')).rejects.toThrow();
  });
});

// ─── getBillingSummary ──────────────────────────────────────────────────────

describe('getBillingSummary', () => {
  it('returns correct tier info', () => {
    const tenant = makeTenant();
    const summary = getBillingSummary(tenant);
    expect(summary.tierName).toBe('Professional');
    expect(summary.price).toBe(499);
    expect(summary.status).toBe('active');
  });

  it('lists enabled features', () => {
    const tenant = makeTenant({ features: TIER_FEATURES.starter });
    const summary = getBillingSummary(tenant);
    expect(summary.features).toContain('schedule');
    expect(summary.features).toContain('gamification');
    expect(summary.features).not.toContain('churn');
  });

  it('returns all features for enterprise', () => {
    const tenant = makeTenant({
      subscription: { ...DEFAULT_TENANT_CONFIG.subscription, tier: 'enterprise' },
      features: TIER_FEATURES.enterprise,
    });
    const summary = getBillingSummary(tenant);
    expect(summary.tierName).toBe('Enterprise');
    expect(summary.price).toBe(999);
    expect(summary.features).toContain('rag');
    expect(summary.features).toContain('phone');
    expect(summary.features).toContain('whiteLabel');
  });
});

// ─── Webhook Processing ─────────────────────────────────────────────────────

describe('handleWebhookEvent', () => {
  it('handles subscription.created', async () => {
    const tenant = makeTenant({ id: 'webhook-test-1' });
    await store.create(tenant);

    const event = {
      type: 'customer.subscription.created' as const,
      data: {
        object: {
          id: 'sub_new',
          metadata: { tenantId: 'webhook-test-1', tier: 'enterprise' },
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          trial_end: null,
          cancel_at_period_end: false,
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('subscription_created');

    // Verify tenant was updated
    const updated = await store.getById('webhook-test-1');
    expect(updated!.subscription.stripeSubscriptionId).toBe('sub_new');
    expect(updated!.features).toEqual(TIER_FEATURES.enterprise);
  });

  it('handles subscription.updated', async () => {
    const tenant = makeTenant({ id: 'webhook-test-2' });
    await store.create(tenant);

    const event = {
      type: 'customer.subscription.updated' as const,
      data: {
        object: {
          id: 'sub_updated',
          metadata: { tenantId: 'webhook-test-2', tier: 'starter' },
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          trial_end: null,
          cancel_at_period_end: true,
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('subscription_updated');

    const updated = await store.getById('webhook-test-2');
    expect(updated!.subscription.cancelAtPeriodEnd).toBe(true);
  });

  it('handles subscription.deleted', async () => {
    const tenant = makeTenant({ id: 'webhook-test-3' });
    await store.create(tenant);

    const event = {
      type: 'customer.subscription.deleted' as const,
      data: {
        object: {
          id: 'sub_deleted',
          metadata: { tenantId: 'webhook-test-3' },
          status: 'canceled',
          current_period_end: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false,
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('subscription_deleted');

    const updated = await store.getById('webhook-test-3');
    expect(updated!.subscription.status).toBe('canceled');
    // Should have minimal features after cancellation
    expect(updated!.features.churn).toBe(false);
    expect(updated!.features.schedule).toBe(true); // Basic schedule kept
  });

  it('handles invoice.payment_failed', async () => {
    const event = {
      type: 'invoice.payment_failed' as const,
      data: {
        object: {
          id: 'inv_failed',
          customer: 'cus_xxx',
          subscription: 'sub_xxx',
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('payment_failed');
  });

  it('returns not-handled for missing tenantId', async () => {
    const event = {
      type: 'customer.subscription.created' as const,
      data: {
        object: {
          id: 'sub_no_tenant',
          metadata: {},
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false,
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(false);
    expect(result.error).toContain('tenantId');
  });

  it('returns not-handled for unknown event type', async () => {
    const event = {
      type: 'some.unknown.event' as const,
      data: { object: {} },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(false);
  });

  it('handles invoice.paid and resets usage', async () => {
    const tenant = makeTenant({
      id: 'webhook-test-5',
      usage: {
        apiCalls: 50000,
        aiTokens: 1000000,
        smsSent: 500,
        emailsSent: 5000,
        storageBytes: 1073741824,
        period: '2026-02',
      },
    });
    await store.create(tenant);

    const event = {
      type: 'invoice.paid' as const,
      data: {
        object: {
          id: 'inv_paid',
          customer: 'cus_xxx',
          subscription: 'sub_xxx',
          subscription_details: {
            metadata: { tenantId: 'webhook-test-5' },
          },
        },
      },
    } as any;

    const result = await handleWebhookEvent(event);
    expect(result.handled).toBe(true);
    expect(result.action).toBe('invoice_paid');

    const updated = await store.getById('webhook-test-5');
    expect(updated!.usage.apiCalls).toBe(0);
    expect(updated!.usage.aiTokens).toBe(0);
    // Storage should persist
    expect(updated!.usage.storageBytes).toBe(1073741824);
  });
});

// ─── Tier Pricing Constants ─────────────────────────────────────────────────

describe('Tier Pricing', () => {
  it('has correct prices', () => {
    expect(TIER_PRICING.starter.monthly).toBe(199);
    expect(TIER_PRICING.professional.monthly).toBe(499);
    expect(TIER_PRICING.enterprise.monthly).toBe(999);
  });

  it('has names for all tiers', () => {
    expect(TIER_PRICING.starter.name).toBe('Starter');
    expect(TIER_PRICING.professional.name).toBe('Professional');
    expect(TIER_PRICING.enterprise.name).toBe('Enterprise');
  });

  it('has descriptions for all tiers', () => {
    for (const tier of ['starter', 'professional', 'enterprise'] as SubscriptionTier[]) {
      expect(TIER_PRICING[tier].description.length).toBeGreaterThan(10);
    }
  });
});
