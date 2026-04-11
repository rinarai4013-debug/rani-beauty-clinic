/**
 * RaniOS Self-Serve Billing System
 *
 * Stripe subscription management, 3 pricing tiers,
 * usage-based add-ons, dunning management, coupon system,
 * upgrade prompts, and revenue recognition.
 */

import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────

export const CreateSubscriptionSchema = z.object({
  tenantId: z.string().min(1),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  couponCode: z.string().optional(),
  paymentMethodId: z.string().min(1),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

export const UpgradeSchema = z.object({
  tenantId: z.string().min(1),
  fromPlan: z.enum(['starter', 'professional', 'enterprise']),
  toPlan: z.enum(['starter', 'professional', 'enterprise']),
  immediate: z.boolean().default(true),
});

export type UpgradeInput = z.infer<typeof UpgradeSchema>;

// ─── Types ────────────────────────────────────────────────────────

export type PlanId = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'suspended';

export interface PricingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number; // per month when paid annually
  annualTotal: number;
  features: PlanFeature[];
  limits: PlanLimits;
  recommended: boolean;
  stripePriceIds: {
    monthly: string;
    annual: string;
  };
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
  tooltip?: string;
}

export interface PlanLimits {
  providers: number;
  aiCalls: number; // per month
  smsCredits: number; // per month
  storageGB: number;
  emailsPerMonth: number;
  customIntegrations: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  coupon?: AppliedCoupon;
  addOns: AddOn[];
  usage: UsageTracking;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  duration: 'once' | 'repeating' | 'forever';
  remainingMonths?: number;
}

export interface AddOn {
  id: string;
  name: string;
  type: 'ai_calls' | 'sms_credits' | 'storage' | 'extra_provider';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UsageTracking {
  aiCalls: { used: number; limit: number; percentUsed: number };
  smsCredits: { used: number; limit: number; percentUsed: number };
  storageGB: { used: number; limit: number; percentUsed: number };
  providers: { used: number; limit: number; percentUsed: number };
  emails: { used: number; limit: number; percentUsed: number };
}

export interface Invoice {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  paidAt?: string;
  dueDate: string;
  pdfUrl?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Coupon {
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  validPlans?: PlanId[];
  expiresAt?: string;
  active: boolean;
}

export type DunningStage =
  | 'payment_failed'
  | 'retry_1'
  | 'retry_2'
  | 'retry_3'
  | 'warning_sent'
  | 'suspended'
  | 'cancelled';

export interface DunningRecord {
  tenantId: string;
  subscriptionId: string;
  stage: DunningStage;
  failedAt: string;
  retryCount: number;
  lastRetryAt?: string;
  nextRetryAt?: string;
  warningSentAt?: string;
  suspendedAt?: string;
  cancelledAt?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface UpgradePrompt {
  tenantId: string;
  reason: string;
  metric: string;
  currentValue: number;
  limit: number;
  percentUsed: number;
  suggestedPlan: PlanId;
  suggestedAddOn?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface RevenueRecord {
  tenantId: string;
  month: string; // YYYY-MM
  mrr: number;
  addOnRevenue: number;
  totalRevenue: number;
  plan: PlanId;
  billingCycle: BillingCycle;
  recognized: boolean;
}

// ─── Constants ────────────────────────────────────────────────────

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo practitioners getting started',
    monthlyPrice: 199,
    annualPrice: 166, // ~$166/mo = $1,990/yr (2 months free)
    annualTotal: 1990,
    recommended: false,
    stripePriceIds: {
      monthly: 'price_starter_monthly',
      annual: 'price_starter_annual',
    },
    limits: {
      providers: 2,
      aiCalls: 500,
      smsCredits: 200,
      storageGB: 5,
      emailsPerMonth: 1000,
      customIntegrations: 0,
    },
    features: [
      { name: 'Operations Dashboard', included: true },
      { name: 'CRM & Client Profiles', included: true },
      { name: 'Appointment Scheduling', included: true },
      { name: 'Basic Reports & KPIs', included: true },
      { name: 'Up to 2 Providers', included: true, limit: '2' },
      { name: '500 AI Calls/month', included: true, limit: '500' },
      { name: 'Email Campaigns', included: false },
      { name: 'SMS Campaigns', included: false },
      { name: 'AI Chat Widget', included: false },
      { name: 'Churn Prediction', included: false },
      { name: 'Dynamic Pricing', included: false },
      { name: 'Social Media AI', included: false },
      { name: 'Meta Ads Manager', included: false },
      { name: 'Consult Co-Pilot', included: false },
      { name: 'Phone Agent AI', included: false },
      { name: 'API Access', included: false },
      { name: 'White Label', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing practices that want AI power',
    monthlyPrice: 499,
    annualPrice: 416, // ~$416/mo = $4,990/yr
    annualTotal: 4990,
    recommended: true,
    stripePriceIds: {
      monthly: 'price_professional_monthly',
      annual: 'price_professional_annual',
    },
    limits: {
      providers: 10,
      aiCalls: 5000,
      smsCredits: 1000,
      storageGB: 25,
      emailsPerMonth: 10000,
      customIntegrations: 2,
    },
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Up to 10 Providers', included: true, limit: '10' },
      { name: '5,000 AI Calls/month', included: true, limit: '5,000' },
      { name: 'Email Campaigns', included: true },
      { name: 'SMS Campaigns', included: true, limit: '1,000/mo' },
      { name: 'AI Chat Widget', included: true },
      { name: 'AI Treatment Recommendations', included: true },
      { name: 'Churn Prediction', included: true },
      { name: 'No-Show Prediction', included: true },
      { name: 'Dynamic Pricing', included: true },
      { name: 'Social Media AI', included: true },
      { name: 'Consult Co-Pilot', included: true },
      { name: 'Schedule Optimizer', included: true },
      { name: 'Gamification Engine', included: true },
      { name: 'Meta Ads Manager', included: false },
      { name: 'Phone Agent AI', included: false },
      { name: 'API Access', included: false },
      { name: 'White Label', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For multi-provider clinics that want it all',
    monthlyPrice: 999,
    annualPrice: 833, // ~$833/mo = $9,990/yr
    annualTotal: 9990,
    recommended: false,
    stripePriceIds: {
      monthly: 'price_enterprise_monthly',
      annual: 'price_enterprise_annual',
    },
    limits: {
      providers: 999,
      aiCalls: 50000,
      smsCredits: 5000,
      storageGB: 100,
      emailsPerMonth: 50000,
      customIntegrations: 999,
    },
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Unlimited Providers', included: true },
      { name: '50,000 AI Calls/month', included: true, limit: '50,000' },
      { name: 'Meta Ads AI Manager', included: true },
      { name: 'AI Phone Agent', included: true },
      { name: 'RAG Knowledge Base', included: true },
      { name: 'P&L Intelligence', included: true },
      { name: 'Inventory Auto-Manager', included: true },
      { name: 'API Access', included: true },
      { name: 'White Label Branding', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom Onboarding', included: true },
    ],
  },
];

export const ADD_ON_PRICES = {
  ai_calls: { name: 'Extra AI Calls', unitPrice: 0.02, unit: 'call', bundle: 1000 },
  sms_credits: { name: 'Extra SMS Credits', unitPrice: 0.05, unit: 'SMS', bundle: 500 },
  storage: { name: 'Extra Storage', unitPrice: 5, unit: 'GB', bundle: 10 },
  extra_provider: { name: 'Extra Provider Seat', unitPrice: 49, unit: 'provider/mo', bundle: 1 },
} as const;

export const DUNNING_SCHEDULE = {
  retry_1: { daysAfterFailure: 1, action: 'retry_payment' },
  retry_2: { daysAfterFailure: 3, action: 'retry_payment' },
  retry_3: { daysAfterFailure: 7, action: 'retry_payment' },
  warning: { daysAfterFailure: 10, action: 'send_warning' },
  suspend: { daysAfterFailure: 14, action: 'suspend_account' },
  cancel: { daysAfterFailure: 30, action: 'cancel_subscription' },
} as const;

export const FOUNDING_MEMBER_COUPON: Coupon = {
  code: 'FOUNDING50',
  name: 'Founding Member — 50% off first 3 months',
  type: 'percentage',
  value: 50,
  duration: 'repeating',
  durationInMonths: 3,
  maxRedemptions: 100,
  currentRedemptions: 0,
  active: true,
};

// ─── Pricing Calculations ─────────────────────────────────────────

export function getPlan(planId: PlanId): PricingPlan {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

export function calculatePrice(
  planId: PlanId,
  billingCycle: BillingCycle,
  coupon?: Coupon
): {
  basePrice: number;
  discount: number;
  finalPrice: number;
  savings: number;
  period: string;
} {
  const plan = getPlan(planId);
  const isAnnual = billingCycle === 'annual';
  const basePrice = isAnnual ? plan.annualTotal : plan.monthlyPrice;
  const period = isAnnual ? 'year' : 'month';

  let discount = 0;

  if (coupon && coupon.active) {
    // Check if coupon is valid for this plan
    if (coupon.validPlans && !coupon.validPlans.includes(planId)) {
      discount = 0;
    } else if (coupon.type === 'percentage') {
      discount = Math.round(basePrice * (coupon.value / 100));
    } else {
      discount = Math.min(coupon.value, basePrice);
    }
  }

  const finalPrice = basePrice - discount;
  const annualSavings = isAnnual
    ? plan.monthlyPrice * 12 - plan.annualTotal
    : 0;

  return {
    basePrice,
    discount,
    finalPrice,
    savings: annualSavings + discount,
    period,
  };
}

export function calculateAnnualSavings(planId: PlanId): number {
  const plan = getPlan(planId);
  return plan.monthlyPrice * 12 - plan.annualTotal;
}

export function calculateUpgradeProration(
  fromPlan: PlanId,
  toPlan: PlanId,
  daysRemainingInPeriod: number,
  totalDaysInPeriod: number
): { credit: number; charge: number; net: number } {
  const from = getPlan(fromPlan);
  const to = getPlan(toPlan);
  const ratio = daysRemainingInPeriod / totalDaysInPeriod;

  const credit = Math.round(from.monthlyPrice * ratio * 100) / 100;
  const charge = Math.round(to.monthlyPrice * ratio * 100) / 100;

  return {
    credit,
    charge,
    net: Math.round((charge - credit) * 100) / 100,
  };
}

// ─── Coupon System ────────────────────────────────────────────────

export function validateCoupon(
  code: string,
  coupons: Coupon[],
  planId?: PlanId
): { valid: boolean; coupon?: Coupon; error?: string } {
  const coupon = coupons.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );

  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  if (!coupon.active) {
    return { valid: false, error: 'This coupon is no longer active' };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'This coupon has expired' };
  }

  if (
    coupon.maxRedemptions &&
    coupon.currentRedemptions >= coupon.maxRedemptions
  ) {
    return { valid: false, error: 'This coupon has reached its redemption limit' };
  }

  if (planId && coupon.validPlans && !coupon.validPlans.includes(planId)) {
    return { valid: false, error: 'This coupon is not valid for the selected plan' };
  }

  return { valid: true, coupon };
}

export function applyCoupon(coupon: Coupon): AppliedCoupon {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    duration: coupon.duration,
    remainingMonths: coupon.durationInMonths,
  };
}

// ─── Usage Tracking ───────────────────────────────────────────────

export function createUsageTracker(plan: PricingPlan): UsageTracking {
  return {
    aiCalls: { used: 0, limit: plan.limits.aiCalls, percentUsed: 0 },
    smsCredits: { used: 0, limit: plan.limits.smsCredits, percentUsed: 0 },
    storageGB: { used: 0, limit: plan.limits.storageGB, percentUsed: 0 },
    providers: { used: 0, limit: plan.limits.providers, percentUsed: 0 },
    emails: { used: 0, limit: plan.limits.emailsPerMonth, percentUsed: 0 },
  };
}

export function trackUsage(
  usage: UsageTracking,
  metric: keyof UsageTracking,
  amount: number = 1
): UsageTracking {
  const current = usage[metric];
  const newUsed = current.used + amount;
  return {
    ...usage,
    [metric]: {
      ...current,
      used: newUsed,
      percentUsed: current.limit > 0 ? Math.round((newUsed / current.limit) * 100) : 0,
    },
  };
}

export function checkUsageLimits(usage: UsageTracking): UpgradePrompt[] {
  const prompts: UpgradePrompt[] = [];

  const checks: {
    metric: keyof UsageTracking;
    label: string;
    addOn?: string;
  }[] = [
    { metric: 'aiCalls', label: 'AI calls', addOn: 'ai_calls' },
    { metric: 'smsCredits', label: 'SMS credits', addOn: 'sms_credits' },
    { metric: 'storageGB', label: 'storage', addOn: 'storage' },
    { metric: 'providers', label: 'provider seats', addOn: 'extra_provider' },
    { metric: 'emails', label: 'emails' },
  ];

  for (const check of checks) {
    const data = usage[check.metric];
    if (data.percentUsed >= 90) {
      prompts.push({
        tenantId: '', // filled in by caller
        reason: `You've used ${data.percentUsed}% of your ${check.label} this month`,
        metric: check.metric,
        currentValue: data.used,
        limit: data.limit,
        percentUsed: data.percentUsed,
        suggestedPlan: 'professional', // will be refined by caller
        suggestedAddOn: check.addOn,
        urgency: data.percentUsed >= 100 ? 'high' : 'medium',
      });
    } else if (data.percentUsed >= 75) {
      prompts.push({
        tenantId: '',
        reason: `You're approaching your ${check.label} limit (${data.percentUsed}% used)`,
        metric: check.metric,
        currentValue: data.used,
        limit: data.limit,
        percentUsed: data.percentUsed,
        suggestedPlan: 'professional',
        suggestedAddOn: check.addOn,
        urgency: 'low',
      });
    }
  }

  return prompts;
}

export function suggestUpgradePlan(
  currentPlan: PlanId,
  prompts: UpgradePrompt[]
): PlanId | null {
  if (currentPlan === 'enterprise') return null;

  const hasHighUrgency = prompts.some((p) => p.urgency === 'high');
  const hasMediumUrgency = prompts.some((p) => p.urgency === 'medium');

  if (hasHighUrgency) {
    return currentPlan === 'starter' ? 'professional' : 'enterprise';
  }
  if (hasMediumUrgency && prompts.length >= 2) {
    return currentPlan === 'starter' ? 'professional' : 'enterprise';
  }
  return null;
}

// ─── Add-On Management ────────────────────────────────────────────

export function calculateAddOnPrice(
  type: keyof typeof ADD_ON_PRICES,
  quantity: number
): AddOn {
  const addOn = ADD_ON_PRICES[type];
  const bundles = Math.ceil(quantity / addOn.bundle);
  const totalQuantity = bundles * addOn.bundle;
  const totalPrice = bundles * addOn.unitPrice * addOn.bundle;

  return {
    id: `addon_${type}_${Date.now()}`,
    name: addOn.name,
    type,
    quantity: totalQuantity,
    unitPrice: addOn.unitPrice,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

// ─── Dunning Management ──────────────────────────────────────────

export function createDunningRecord(
  tenantId: string,
  subscriptionId: string
): DunningRecord {
  return {
    tenantId,
    subscriptionId,
    stage: 'payment_failed',
    failedAt: new Date().toISOString(),
    retryCount: 0,
    resolved: false,
  };
}

export function advanceDunning(record: DunningRecord): DunningRecord {
  const updated = { ...record };
  const now = new Date().toISOString();

  switch (updated.stage) {
    case 'payment_failed':
      updated.stage = 'retry_1';
      updated.retryCount = 1;
      updated.lastRetryAt = now;
      updated.nextRetryAt = addDays(now, DUNNING_SCHEDULE.retry_2.daysAfterFailure);
      break;
    case 'retry_1':
      updated.stage = 'retry_2';
      updated.retryCount = 2;
      updated.lastRetryAt = now;
      updated.nextRetryAt = addDays(now, DUNNING_SCHEDULE.retry_3.daysAfterFailure - DUNNING_SCHEDULE.retry_2.daysAfterFailure);
      break;
    case 'retry_2':
      updated.stage = 'retry_3';
      updated.retryCount = 3;
      updated.lastRetryAt = now;
      updated.nextRetryAt = addDays(now, DUNNING_SCHEDULE.warning.daysAfterFailure - DUNNING_SCHEDULE.retry_3.daysAfterFailure);
      break;
    case 'retry_3':
      updated.stage = 'warning_sent';
      updated.warningSentAt = now;
      break;
    case 'warning_sent':
      updated.stage = 'suspended';
      updated.suspendedAt = now;
      break;
    case 'suspended':
      updated.stage = 'cancelled';
      updated.cancelledAt = now;
      break;
  }

  return updated;
}

export function resolveDunning(record: DunningRecord): DunningRecord {
  return {
    ...record,
    resolved: true,
    resolvedAt: new Date().toISOString(),
  };
}

export function getDunningAction(
  stage: DunningStage
): { action: string; emailSubject: string; emailBody: string } {
  const actions: Record<DunningStage, { action: string; emailSubject: string; emailBody: string }> = {
    payment_failed: {
      action: 'notify',
      emailSubject: 'Action Required: Payment Failed for RaniOS',
      emailBody: 'Your recent payment could not be processed. Please update your payment method to avoid service interruption.',
    },
    retry_1: {
      action: 'retry_payment',
      emailSubject: 'Payment Retry: RaniOS Subscription',
      emailBody: 'We will automatically retry your payment. No action needed if you have updated your payment method.',
    },
    retry_2: {
      action: 'retry_payment',
      emailSubject: 'Second Payment Attempt: RaniOS',
      emailBody: 'We are trying your payment again. Please ensure your payment method is up to date.',
    },
    retry_3: {
      action: 'retry_payment',
      emailSubject: 'Final Payment Attempt: RaniOS',
      emailBody: 'This is our last automatic retry. Please update your payment method immediately to keep your account active.',
    },
    warning_sent: {
      action: 'send_warning',
      emailSubject: 'Account Suspension Warning: RaniOS',
      emailBody: 'Your account will be suspended in 4 days if payment is not received. Update your payment method now to avoid losing access.',
    },
    suspended: {
      action: 'suspend_account',
      emailSubject: 'Account Suspended: RaniOS',
      emailBody: 'Your RaniOS account has been suspended due to non-payment. Update your payment method to reactivate immediately.',
    },
    cancelled: {
      action: 'cancel_subscription',
      emailSubject: 'Subscription Cancelled: RaniOS',
      emailBody: 'Your RaniOS subscription has been cancelled due to non-payment. Contact us to reactivate your account and restore your data.',
    },
  };

  return actions[stage];
}

// ─── Invoice Generation ───────────────────────────────────────────

export function generateInvoice(
  subscription: Subscription,
  periodStart: string,
  periodEnd: string
): Invoice {
  const plan = getPlan(subscription.plan);
  const basePrice =
    subscription.billingCycle === 'annual'
      ? plan.annualTotal
      : plan.monthlyPrice;

  const lineItems: InvoiceLineItem[] = [
    {
      description: `RaniOS ${plan.name} Plan (${subscription.billingCycle})`,
      quantity: 1,
      unitPrice: basePrice,
      amount: basePrice,
    },
  ];

  // Add-ons
  for (const addOn of subscription.addOns) {
    lineItems.push({
      description: addOn.name,
      quantity: addOn.quantity,
      unitPrice: addOn.unitPrice,
      amount: addOn.totalPrice,
    });
  }

  // Apply coupon
  let totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  if (subscription.coupon) {
    const discount =
      subscription.coupon.type === 'percentage'
        ? totalAmount * (subscription.coupon.value / 100)
        : subscription.coupon.value;

    lineItems.push({
      description: `Discount (${subscription.coupon.code})`,
      quantity: 1,
      unitPrice: -discount,
      amount: -discount,
    });
    totalAmount -= discount;
  }

  const dueDate = new Date(periodStart);
  dueDate.setDate(dueDate.getDate() + 7);

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tenantId: subscription.tenantId,
    stripeInvoiceId: '',
    amount: Math.round(totalAmount * 100) / 100,
    currency: 'usd',
    status: 'open',
    periodStart,
    periodEnd,
    lineItems,
    dueDate: dueDate.toISOString(),
  };
}

// ─── Revenue Recognition ──────────────────────────────────────────

export function recognizeRevenue(
  subscription: Subscription,
  month: string
): RevenueRecord {
  const plan = getPlan(subscription.plan);
  const mrr =
    subscription.billingCycle === 'annual'
      ? Math.round((plan.annualTotal / 12) * 100) / 100
      : plan.monthlyPrice;

  const addOnRevenue = subscription.addOns.reduce(
    (sum, a) => sum + a.totalPrice,
    0
  );

  return {
    tenantId: subscription.tenantId,
    month,
    mrr,
    addOnRevenue,
    totalRevenue: mrr + addOnRevenue,
    plan: subscription.plan,
    billingCycle: subscription.billingCycle,
    recognized: true,
  };
}

export function calculateMRR(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((total, sub) => {
      const plan = getPlan(sub.plan);
      const mrr =
        sub.billingCycle === 'annual'
          ? plan.annualTotal / 12
          : plan.monthlyPrice;

      const addOnMrr = sub.addOns.reduce((sum, a) => sum + a.totalPrice, 0);
      return total + mrr + addOnMrr;
    }, 0);
}

export function calculateARR(mrr: number): number {
  return mrr * 12;
}

// ─── Helpers ──────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getPlanComparison(
  fromPlan: PlanId,
  toPlan: PlanId
): { gained: string[]; lost: string[] } {
  const from = getPlan(fromPlan);
  const to = getPlan(toPlan);

  const fromFeatures = new Set(
    from.features.filter((f) => f.included).map((f) => f.name)
  );
  const toFeatures = new Set(
    to.features.filter((f) => f.included).map((f) => f.name)
  );

  const gained = [...toFeatures].filter((f) => !fromFeatures.has(f));
  const lost = [...fromFeatures].filter((f) => !toFeatures.has(f));

  return { gained, lost };
}
