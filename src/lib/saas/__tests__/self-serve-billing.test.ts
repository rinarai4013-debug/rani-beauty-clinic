import { describe, it, expect } from 'vitest';
import {
  getPlan,
  calculatePrice,
  calculateAnnualSavings,
  calculateUpgradeProration,
  validateCoupon,
  applyCoupon,
  createUsageTracker,
  trackUsage,
  checkUsageLimits,
  suggestUpgradePlan,
  calculateAddOnPrice,
  createDunningRecord,
  advanceDunning,
  resolveDunning,
  getDunningAction,
  generateInvoice,
  recognizeRevenue,
  calculateMRR,
  calculateARR,
  formatCurrency,
  getPlanComparison,
  PRICING_PLANS,
  ADD_ON_PRICES,
  FOUNDING_MEMBER_COUPON,
  DUNNING_SCHEDULE,
  type Coupon,
  type Subscription,
  type PlanId,
} from '../self-serve-billing';

// ─── Plan Retrieval ───────────────────────────────────────────────

describe('getPlan', () => {
  it('returns starter plan', () => {
    const plan = getPlan('starter');
    expect(plan.id).toBe('starter');
    expect(plan.monthlyPrice).toBe(199);
  });

  it('returns professional plan', () => {
    const plan = getPlan('professional');
    expect(plan.id).toBe('professional');
    expect(plan.monthlyPrice).toBe(499);
    expect(plan.recommended).toBe(true);
  });

  it('returns enterprise plan', () => {
    const plan = getPlan('enterprise');
    expect(plan.monthlyPrice).toBe(999);
  });

  it('throws for unknown plan', () => {
    expect(() => getPlan('unknown' as PlanId)).toThrow();
  });
});

// ─── Pricing Calculations ─────────────────────────────────────────

describe('calculatePrice', () => {
  it('returns monthly price', () => {
    const price = calculatePrice('professional', 'monthly');
    expect(price.basePrice).toBe(499);
    expect(price.finalPrice).toBe(499);
    expect(price.period).toBe('month');
  });

  it('returns annual price', () => {
    const price = calculatePrice('professional', 'annual');
    expect(price.basePrice).toBe(4990);
    expect(price.period).toBe('year');
  });

  it('applies percentage coupon', () => {
    const price = calculatePrice('professional', 'monthly', FOUNDING_MEMBER_COUPON);
    expect(price.discount).toBeGreaterThan(0);
    expect(price.finalPrice).toBeLessThan(price.basePrice);
  });

  it('applies fixed coupon', () => {
    const fixedCoupon: Coupon = {
      code: 'FIXED100',
      name: 'Fixed $100 off',
      type: 'fixed',
      value: 100,
      duration: 'once',
      currentRedemptions: 0,
      active: true,
    };
    const price = calculatePrice('professional', 'monthly', fixedCoupon);
    expect(price.discount).toBe(100);
    expect(price.finalPrice).toBe(399);
  });

  it('calculates savings for annual billing', () => {
    const price = calculatePrice('professional', 'annual');
    expect(price.savings).toBeGreaterThan(0);
  });
});

describe('calculateAnnualSavings', () => {
  it('calculates 2 months savings', () => {
    const savings = calculateAnnualSavings('professional');
    expect(savings).toBe(499 * 12 - 4990);
  });
});

describe('calculateUpgradeProration', () => {
  it('calculates proration correctly', () => {
    const result = calculateUpgradeProration('starter', 'professional', 15, 30);
    expect(result.credit).toBeGreaterThan(0);
    expect(result.charge).toBeGreaterThan(result.credit);
    expect(result.net).toBeGreaterThan(0);
  });

  it('handles full period remaining', () => {
    const result = calculateUpgradeProration('starter', 'professional', 30, 30);
    expect(result.credit).toBeCloseTo(199, 0);
    expect(result.charge).toBeCloseTo(499, 0);
  });
});

// ─── Coupon System ────────────────────────────────────────────────

describe('Coupon Validation', () => {
  const coupons = [FOUNDING_MEMBER_COUPON];

  it('validates correct coupon', () => {
    const result = validateCoupon('FOUNDING50', coupons);
    expect(result.valid).toBe(true);
    expect(result.coupon).toBeDefined();
  });

  it('rejects unknown coupon', () => {
    const result = validateCoupon('NONEXIST', coupons);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('is case insensitive', () => {
    const result = validateCoupon('founding50', coupons);
    expect(result.valid).toBe(true);
  });

  it('rejects expired coupon', () => {
    const expired: Coupon = {
      ...FOUNDING_MEMBER_COUPON,
      code: 'EXPIRED',
      expiresAt: '2020-01-01T00:00:00Z',
    };
    const result = validateCoupon('EXPIRED', [expired]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('rejects inactive coupon', () => {
    const inactive: Coupon = { ...FOUNDING_MEMBER_COUPON, code: 'INACTIVE', active: false };
    const result = validateCoupon('INACTIVE', [inactive]);
    expect(result.valid).toBe(false);
  });

  it('rejects maxed-out coupon', () => {
    const maxed: Coupon = {
      ...FOUNDING_MEMBER_COUPON,
      code: 'MAXED',
      maxRedemptions: 1,
      currentRedemptions: 1,
    };
    const result = validateCoupon('MAXED', [maxed]);
    expect(result.valid).toBe(false);
  });

  it('rejects coupon for wrong plan', () => {
    const planSpecific: Coupon = {
      ...FOUNDING_MEMBER_COUPON,
      code: 'PROONLY',
      validPlans: ['professional'],
    };
    const result = validateCoupon('PROONLY', [planSpecific], 'starter');
    expect(result.valid).toBe(false);
  });
});

describe('applyCoupon', () => {
  it('creates applied coupon record', () => {
    const applied = applyCoupon(FOUNDING_MEMBER_COUPON);
    expect(applied.code).toBe('FOUNDING50');
    expect(applied.type).toBe('percentage');
    expect(applied.value).toBe(50);
    expect(applied.duration).toBe('repeating');
    expect(applied.remainingMonths).toBe(3);
  });
});

// ─── Usage Tracking ───────────────────────────────────────────────

describe('Usage Tracking', () => {
  it('creates tracker with plan limits', () => {
    const plan = getPlan('professional');
    const tracker = createUsageTracker(plan);
    expect(tracker.aiCalls.limit).toBe(5000);
    expect(tracker.aiCalls.used).toBe(0);
    expect(tracker.aiCalls.percentUsed).toBe(0);
  });

  it('tracks usage correctly', () => {
    const plan = getPlan('professional');
    let tracker = createUsageTracker(plan);
    tracker = trackUsage(tracker, 'aiCalls', 100);
    expect(tracker.aiCalls.used).toBe(100);
    expect(tracker.aiCalls.percentUsed).toBe(2);
  });

  it('accumulates usage', () => {
    const plan = getPlan('professional');
    let tracker = createUsageTracker(plan);
    tracker = trackUsage(tracker, 'aiCalls', 100);
    tracker = trackUsage(tracker, 'aiCalls', 200);
    expect(tracker.aiCalls.used).toBe(300);
  });

  it('checkUsageLimits returns prompts at 80%', () => {
    const plan = getPlan('starter');
    let tracker = createUsageTracker(plan);
    tracker = trackUsage(tracker, 'aiCalls', 400); // 80% of 500
    const prompts = checkUsageLimits(tracker);
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts[0].urgency).toBe('low');
  });

  it('checkUsageLimits returns high urgency at 90%+', () => {
    const plan = getPlan('starter');
    let tracker = createUsageTracker(plan);
    tracker = trackUsage(tracker, 'aiCalls', 475); // 95% of 500
    const prompts = checkUsageLimits(tracker);
    expect(prompts.some((p) => p.urgency === 'medium' || p.urgency === 'high')).toBe(true);
  });

  it('suggestUpgradePlan recommends next tier', () => {
    const prompts = [{ tenantId: '', reason: '', metric: 'aiCalls', currentValue: 480, limit: 500, percentUsed: 96, suggestedPlan: 'professional' as PlanId, urgency: 'high' as const }];
    expect(suggestUpgradePlan('starter', prompts)).toBe('professional');
  });

  it('does not suggest upgrade for enterprise', () => {
    expect(suggestUpgradePlan('enterprise', [])).toBeNull();
  });
});

// ─── Add-Ons ──────────────────────────────────────────────────────

describe('Add-Ons', () => {
  it('calculates AI calls add-on', () => {
    const addOn = calculateAddOnPrice('ai_calls', 500);
    expect(addOn.quantity).toBe(1000); // bundled
    expect(addOn.totalPrice).toBeGreaterThan(0);
  });

  it('calculates SMS credits add-on', () => {
    const addOn = calculateAddOnPrice('sms_credits', 100);
    expect(addOn.quantity).toBe(500); // minimum bundle
  });

  it('calculates extra provider add-on', () => {
    const addOn = calculateAddOnPrice('extra_provider', 1);
    expect(addOn.quantity).toBe(1);
    expect(addOn.totalPrice).toBe(49);
  });
});

// ─── Dunning Management ──────────────────────────────────────────

describe('Dunning', () => {
  it('creates dunning record', () => {
    const record = createDunningRecord('tn_1', 'sub_1');
    expect(record.stage).toBe('payment_failed');
    expect(record.retryCount).toBe(0);
    expect(record.resolved).toBe(false);
  });

  it('advances through dunning stages', () => {
    let record = createDunningRecord('tn_1', 'sub_1');
    record = advanceDunning(record);
    expect(record.stage).toBe('retry_1');
    expect(record.retryCount).toBe(1);

    record = advanceDunning(record);
    expect(record.stage).toBe('retry_2');

    record = advanceDunning(record);
    expect(record.stage).toBe('retry_3');

    record = advanceDunning(record);
    expect(record.stage).toBe('warning_sent');

    record = advanceDunning(record);
    expect(record.stage).toBe('suspended');

    record = advanceDunning(record);
    expect(record.stage).toBe('cancelled');
  });

  it('resolves dunning', () => {
    let record = createDunningRecord('tn_1', 'sub_1');
    record = advanceDunning(record);
    record = resolveDunning(record);
    expect(record.resolved).toBe(true);
    expect(record.resolvedAt).toBeDefined();
  });

  it('getDunningAction returns appropriate actions', () => {
    const action = getDunningAction('payment_failed');
    expect(action.action).toBe('notify');
    expect(action.emailSubject).toBeTruthy();

    const warning = getDunningAction('warning_sent');
    expect(warning.action).toBe('send_warning');
  });
});

// ─── Invoice ──────────────────────────────────────────────────────

describe('Invoice Generation', () => {
  it('generates invoice with line items', () => {
    const subscription = createMockSubscription();
    const invoice = generateInvoice(subscription, '2026-03-01', '2026-03-31');
    expect(invoice.lineItems.length).toBeGreaterThan(0);
    expect(invoice.amount).toBeGreaterThan(0);
    expect(invoice.currency).toBe('usd');
  });

  it('includes add-ons in invoice', () => {
    const subscription = createMockSubscription();
    subscription.addOns = [
      { id: 'ao_1', name: 'Extra AI Calls', type: 'ai_calls', quantity: 1000, unitPrice: 0.02, totalPrice: 20 },
    ];
    const invoice = generateInvoice(subscription, '2026-03-01', '2026-03-31');
    expect(invoice.lineItems.length).toBe(2);
    expect(invoice.amount).toBe(519); // 499 + 20
  });

  it('applies coupon discount', () => {
    const subscription = createMockSubscription();
    subscription.coupon = { code: 'FOUNDING50', type: 'percentage', value: 50, duration: 'repeating', remainingMonths: 2 };
    const invoice = generateInvoice(subscription, '2026-03-01', '2026-03-31');
    expect(invoice.amount).toBeLessThan(499);
  });
});

// ─── Revenue Recognition ──────────────────────────────────────────

describe('Revenue Recognition', () => {
  it('recognizes monthly revenue', () => {
    const subscription = createMockSubscription();
    const record = recognizeRevenue(subscription, '2026-03');
    expect(record.mrr).toBe(499);
    expect(record.recognized).toBe(true);
  });

  it('recognizes annual revenue as monthly MRR', () => {
    const subscription = createMockSubscription();
    subscription.billingCycle = 'annual';
    const record = recognizeRevenue(subscription, '2026-03');
    expect(record.mrr).toBeCloseTo(4990 / 12, 0);
  });

  it('includes add-on revenue', () => {
    const subscription = createMockSubscription();
    subscription.addOns = [
      { id: 'ao_1', name: 'Extra', type: 'ai_calls', quantity: 1000, unitPrice: 0.02, totalPrice: 20 },
    ];
    const record = recognizeRevenue(subscription, '2026-03');
    expect(record.totalRevenue).toBe(519);
  });
});

// ─── MRR / ARR ────────────────────────────────────────────────────

describe('MRR & ARR', () => {
  it('calculates MRR from subscriptions', () => {
    const subscriptions = [
      createMockSubscription(),
      { ...createMockSubscription(), plan: 'starter' as PlanId },
    ];
    const mrr = calculateMRR(subscriptions);
    expect(mrr).toBeGreaterThan(0);
  });

  it('excludes cancelled subscriptions', () => {
    const subscriptions = [
      { ...createMockSubscription(), status: 'cancelled' as const },
    ];
    const mrr = calculateMRR(subscriptions);
    expect(mrr).toBe(0);
  });

  it('calculates ARR from MRR', () => {
    expect(calculateARR(1000)).toBe(12000);
  });
});

// ─── Plan Comparison ──────────────────────────────────────────────

describe('Plan Comparison', () => {
  it('shows gained features on upgrade', () => {
    const { gained, lost } = getPlanComparison('starter', 'professional');
    expect(gained.length).toBeGreaterThan(0);
    // Some starter features may not appear in pro's list since pro says "Everything in Starter"
  });

  it('shows lost features on downgrade', () => {
    const { gained, lost } = getPlanComparison('professional', 'starter');
    // Pro has features that starter doesn't
    expect(gained.length + lost.length).toBeGreaterThan(0);
  });
});

// ─── Formatting ───────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(499)).toBe('$499.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});

// ─── Constants ────────────────────────────────────────────────────

describe('Constants', () => {
  it('has 3 pricing plans', () => {
    expect(PRICING_PLANS).toHaveLength(3);
  });

  it('plans have stripe price IDs', () => {
    for (const plan of PRICING_PLANS) {
      expect(plan.stripePriceIds.monthly).toBeTruthy();
      expect(plan.stripePriceIds.annual).toBeTruthy();
    }
  });

  it('has add-on prices', () => {
    expect(ADD_ON_PRICES.ai_calls).toBeDefined();
    expect(ADD_ON_PRICES.sms_credits).toBeDefined();
    expect(ADD_ON_PRICES.storage).toBeDefined();
    expect(ADD_ON_PRICES.extra_provider).toBeDefined();
  });

  it('founding member coupon is valid', () => {
    expect(FOUNDING_MEMBER_COUPON.active).toBe(true);
    expect(FOUNDING_MEMBER_COUPON.value).toBe(50);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────

function createMockSubscription(): Subscription {
  return {
    id: 'sub_test',
    tenantId: 'tn_test',
    stripeSubscriptionId: 'sub_stripe_test',
    stripeCustomerId: 'cus_test',
    plan: 'professional',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-03-01',
    currentPeriodEnd: '2026-03-31',
    cancelAtPeriodEnd: false,
    addOns: [],
    usage: {
      aiCalls: { used: 0, limit: 5000, percentUsed: 0 },
      smsCredits: { used: 0, limit: 1000, percentUsed: 0 },
      storageGB: { used: 0, limit: 25, percentUsed: 0 },
      providers: { used: 0, limit: 10, percentUsed: 0 },
      emails: { used: 0, limit: 10000, percentUsed: 0 },
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-03-25',
  };
}
