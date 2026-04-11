/**
 * Membership Billing Engine — Rani Beauty Clinic
 *
 * Handles all billing operations for the membership program:
 * - Square recurring billing integration
 * - Payment method management
 * - Invoice generation
 * - Failed payment handling with retry logic
 * - Grace period & dunning sequence
 * - Credit balance management with rollover
 * - Pause/resume membership
 * - Cancellation flow with save offers
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type { MembershipTier, BillingCycle, MembershipStatus, DiscountType } from './plans';
import { PLANS, getEffectiveMonthlyPrice, ANNUAL_DISCOUNT_MONTHS } from './plans';
import { env } from '../env';

// ── Types ────────────────────────────────────────────────────────────────

export interface MemberBilling {
  memberId: string;
  clientId: string;
  clientName: string;
  email: string;
  tier: MembershipTier;
  billingCycle: BillingCycle;
  discountType: DiscountType;
  status: MembershipStatus;
  monthlyRate: number;
  squareSubscriptionId?: string;
  squareCustomerId?: string;
  defaultPaymentMethodId?: string;
  paymentMethods: PaymentMethod[];
  currentPeriodStart: string; // ISO date
  currentPeriodEnd: string;
  nextBillingDate: string;
  createdAt: string;
  cancelledAt?: string;
  pausedAt?: string;
  pauseResumeDate?: string;
  pauseMonthsUsed: number; // Out of MAX_PAUSE_MONTHS_PER_YEAR
  gracePeriodEndsAt?: string;
  failedPaymentCount: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  creditBalance: number; // Unused treatment credits in dollars
  rolledOverCredits: number; // Credits from previous month
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  squareCardId?: string;
  addedAt: string;
}

export interface Invoice {
  id: string;
  memberId: string;
  clientId: string;
  amount: number;
  subtotal: number;
  discount: number;
  tax: number;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'refunded' | 'voided';
  description: string;
  lineItems: InvoiceLineItem[];
  paymentMethodId?: string;
  squareInvoiceId?: string;
  squarePaymentId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  paidAt?: string;
  failedAt?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'membership' | 'add_on' | 'credit' | 'adjustment' | 'proration';
}

export interface DunningStep {
  step: number;
  type: 'payment_failed' | 'retry_1' | 'retry_2' | 'retry_3' | 'final_warning' | 'suspended';
  dayAfterFailure: number;
  action: string;
  emailTemplate: string;
  smsTemplate?: string;
}

export interface PauseRequest {
  memberId: string;
  pauseMonths: number; // 1 or 2
  reason: string;
  resumeDate: string; // ISO date when membership resumes
}

export interface CancellationRequest {
  memberId: string;
  reason: CancellationReason;
  feedback?: string;
  effectiveDate: 'immediate' | 'end_of_period';
  saveOfferAccepted: boolean;
  saveOfferType?: SaveOfferType;
}

export type CancellationReason =
  | 'too_expensive'
  | 'not_using_enough'
  | 'moving'
  | 'switching_provider'
  | 'dissatisfied'
  | 'financial_hardship'
  | 'other';

export type SaveOfferType =
  | 'free_upgrade_month'
  | 'credit_bonus'
  | 'price_lock'
  | 'downgrade_offer'
  | 'pause_offer';

export interface SaveOffer {
  type: SaveOfferType;
  label: string;
  description: string;
  value: number; // Dollar value of the offer
  applicableReasons: CancellationReason[];
  expiresInDays: number;
}

export interface PaymentRetryResult {
  success: boolean;
  retryNumber: number;
  nextRetryDate?: string;
  error?: string;
  shouldSuspend: boolean;
}

export interface CreditAllocation {
  memberId: string;
  month: string; // YYYY-MM
  allocated: number;
  rolledOver: number;
  totalAvailable: number;
  used: number;
  remaining: number;
  expiresAt: string; // End of next month (rollover deadline)
}

// ── Constants ────────────────────────────────────────────────────────────

export const MAX_PAUSE_MONTHS_PER_YEAR = 2;
export const MAX_PAYMENT_RETRIES = 3;
export const GRACE_PERIOD_DAYS = 7;
export const RETRY_SCHEDULE_DAYS = [1, 3, 7]; // Days after initial failure to retry
export const TAX_RATE = 0; // WA state: no sales tax on membership dues (service charges taxed separately)

// ── Dunning Sequence ─────────────────────────────────────────────────────

export const DUNNING_SEQUENCE: DunningStep[] = [
  {
    step: 1,
    type: 'payment_failed',
    dayAfterFailure: 0,
    action: 'Send payment failed notification',
    emailTemplate: 'dunning_payment_failed',
    smsTemplate: 'dunning_payment_failed_sms',
  },
  {
    step: 2,
    type: 'retry_1',
    dayAfterFailure: 1,
    action: 'First automatic retry',
    emailTemplate: 'dunning_retry_1',
  },
  {
    step: 3,
    type: 'retry_2',
    dayAfterFailure: 3,
    action: 'Second automatic retry',
    emailTemplate: 'dunning_retry_2',
    smsTemplate: 'dunning_retry_2_sms',
  },
  {
    step: 4,
    type: 'retry_3',
    dayAfterFailure: 7,
    action: 'Final automatic retry',
    emailTemplate: 'dunning_retry_3',
  },
  {
    step: 5,
    type: 'final_warning',
    dayAfterFailure: 7,
    action: 'Send final warning — membership will be suspended',
    emailTemplate: 'dunning_final_warning',
    smsTemplate: 'dunning_final_warning_sms',
  },
  {
    step: 6,
    type: 'suspended',
    dayAfterFailure: 7,
    action: 'Suspend membership, revoke benefits',
    emailTemplate: 'dunning_suspended',
    smsTemplate: 'dunning_suspended_sms',
  },
];

// ── Save Offers ──────────────────────────────────────────────────────────

export const SAVE_OFFERS: SaveOffer[] = [
  {
    type: 'free_upgrade_month',
    label: 'Complimentary Upgrade',
    description: 'Enjoy one month at the next tier, on us — experience the full Rani transformation.',
    value: 100,
    applicableReasons: ['not_using_enough', 'dissatisfied'],
    expiresInDays: 7,
  },
  {
    type: 'credit_bonus',
    label: 'Bonus Treatment Credits',
    description: 'We\'ll add $150 in bonus treatment credits to your next month — your journey deserves investment.',
    value: 150,
    applicableReasons: ['too_expensive', 'not_using_enough', 'financial_hardship'],
    expiresInDays: 7,
  },
  {
    type: 'price_lock',
    label: 'Price Lock Guarantee',
    description: 'Lock in your current rate for the next 12 months — no increases, guaranteed.',
    value: 0,
    applicableReasons: ['too_expensive', 'financial_hardship'],
    expiresInDays: 14,
  },
  {
    type: 'downgrade_offer',
    label: 'Adjust Your Plan',
    description: 'Step to a more comfortable tier while keeping your member benefits active.',
    value: 0,
    applicableReasons: ['too_expensive', 'not_using_enough', 'financial_hardship'],
    expiresInDays: 14,
  },
  {
    type: 'pause_offer',
    label: 'Take a Break',
    description: 'Pause your membership for up to 2 months — your benefits will be waiting when you return.',
    value: 0,
    applicableReasons: ['moving', 'financial_hardship', 'not_using_enough'],
    expiresInDays: 14,
  },
];

// ── Core Billing Functions ───────────────────────────────────────────────

/**
 * Generate an invoice for a billing period.
 */
export function generateInvoice(
  billing: MemberBilling,
  periodStart: string,
  periodEnd: string,
  additionalLineItems: InvoiceLineItem[] = [],
): Invoice {
  const plan = PLANS[billing.tier];
  const effectiveRate = getEffectiveMonthlyPrice(billing.tier, billing.billingCycle, billing.discountType);

  const membershipLine: InvoiceLineItem = {
    description: `${plan.name} Membership — ${billing.billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing`,
    quantity: 1,
    unitPrice: effectiveRate,
    amount: effectiveRate,
    type: 'membership',
  };

  const allLineItems = [membershipLine, ...additionalLineItems];
  const subtotal = allLineItems.reduce((sum, item) => sum + item.amount, 0);
  const discount = billing.monthlyRate - effectiveRate;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const dueDate = periodStart;

  return {
    id: generateInvoiceId(),
    memberId: billing.memberId,
    clientId: billing.clientId,
    amount: total,
    subtotal,
    discount: discount > 0 ? discount : 0,
    tax,
    status: 'pending',
    description: `${plan.name} Membership — ${formatPeriod(periodStart, periodEnd)}`,
    lineItems: allLineItems,
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    dueDate,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Process a payment retry after failure.
 */
export function processPaymentRetry(
  billing: MemberBilling,
  currentRetryCount: number,
): PaymentRetryResult {
  if (currentRetryCount >= MAX_PAYMENT_RETRIES) {
    return {
      success: false,
      retryNumber: currentRetryCount,
      shouldSuspend: true,
      error: 'Maximum retries exceeded — membership will be suspended',
    };
  }

  const nextRetryDayOffset = RETRY_SCHEDULE_DAYS[currentRetryCount] ?? RETRY_SCHEDULE_DAYS[RETRY_SCHEDULE_DAYS.length - 1];
  const nextRetryDate = new Date();
  nextRetryDate.setDate(nextRetryDate.getDate() + nextRetryDayOffset);

  return {
    success: false,
    retryNumber: currentRetryCount + 1,
    nextRetryDate: nextRetryDate.toISOString(),
    shouldSuspend: false,
  };
}

/**
 * Get the current dunning step based on retry count.
 */
export function getDunningStep(failedPaymentCount: number): DunningStep {
  const stepIndex = Math.min(failedPaymentCount, DUNNING_SEQUENCE.length - 1);
  return DUNNING_SEQUENCE[stepIndex];
}

/**
 * Calculate the grace period end date from the first failure.
 */
export function calculateGracePeriodEnd(firstFailureDate: string): string {
  const date = new Date(firstFailureDate);
  date.setDate(date.getDate() + GRACE_PERIOD_DAYS);
  return date.toISOString();
}

/**
 * Check if a member is within their grace period.
 */
export function isInGracePeriod(billing: MemberBilling, now?: Date): boolean {
  if (!billing.gracePeriodEndsAt) return false;
  const currentDate = now || new Date();
  return currentDate < new Date(billing.gracePeriodEndsAt);
}

/**
 * Determine if the membership should be suspended.
 */
export function shouldSuspend(billing: MemberBilling, now?: Date): boolean {
  if (billing.status === 'suspended') return false;
  if (billing.failedPaymentCount < MAX_PAYMENT_RETRIES) return false;
  if (billing.gracePeriodEndsAt) {
    const currentDate = now || new Date();
    return currentDate >= new Date(billing.gracePeriodEndsAt);
  }
  return billing.failedPaymentCount >= MAX_PAYMENT_RETRIES;
}

// ── Credit Management ────────────────────────────────────────────────────

/**
 * Allocate monthly credits for a member.
 * Rolls over unused credits from the previous month (max 1 month rollover).
 */
export function allocateMonthlyCredits(
  billing: MemberBilling,
  previousMonthRemaining: number,
  month: string, // YYYY-MM
): CreditAllocation {
  const plan = PLANS[billing.tier];
  const newCredits = plan.monthlyCredits;
  // Only roll over if within the allowed rollover period
  const rolledOver = Math.min(previousMonthRemaining, plan.monthlyCredits); // Cap rollover at 1 month's worth
  const totalAvailable = newCredits + rolledOver;

  const periodEnd = new Date(`${month}-01`);
  periodEnd.setMonth(periodEnd.getMonth() + 2); // Expires end of next month
  periodEnd.setDate(0); // Last day of that month

  return {
    memberId: billing.memberId,
    month,
    allocated: newCredits,
    rolledOver,
    totalAvailable,
    used: 0,
    remaining: totalAvailable,
    expiresAt: periodEnd.toISOString(),
  };
}

/**
 * Use credits from a member's balance.
 */
export function useCredits(
  allocation: CreditAllocation,
  amount: number,
): { success: boolean; remaining: number; overageAmount: number } {
  if (amount <= 0) return { success: true, remaining: allocation.remaining, overageAmount: 0 };

  if (amount <= allocation.remaining) {
    return {
      success: true,
      remaining: Math.round((allocation.remaining - amount) * 100) / 100,
      overageAmount: 0,
    };
  }

  // Partial credit use — member pays the overage
  const overage = Math.round((amount - allocation.remaining) * 100) / 100;
  return {
    success: true,
    remaining: 0,
    overageAmount: overage,
  };
}

/**
 * Check if credits have expired (past the rollover window).
 */
export function areCreditsExpired(allocation: CreditAllocation, now?: Date): boolean {
  const currentDate = now || new Date();
  return currentDate > new Date(allocation.expiresAt);
}

// ── Pause / Resume ───────────────────────────────────────────────────────

/**
 * Validate a pause request.
 */
export function validatePauseRequest(
  billing: MemberBilling,
  pauseMonths: number,
): { valid: boolean; error?: string } {
  if (billing.status !== 'active') {
    return { valid: false, error: 'Only active memberships can be paused' };
  }
  if (pauseMonths < 1 || pauseMonths > 2) {
    return { valid: false, error: 'Pause duration must be 1 or 2 months' };
  }
  if (billing.pauseMonthsUsed + pauseMonths > MAX_PAUSE_MONTHS_PER_YEAR) {
    const remaining = MAX_PAUSE_MONTHS_PER_YEAR - billing.pauseMonthsUsed;
    return {
      valid: false,
      error: remaining > 0
        ? `Only ${remaining} pause month(s) remaining this year`
        : 'All pause months for this year have been used',
    };
  }
  return { valid: true };
}

/**
 * Calculate the resume date for a paused membership.
 */
export function calculateResumeDate(pauseStartDate: string, pauseMonths: number): string {
  const date = new Date(pauseStartDate);
  date.setMonth(date.getMonth() + pauseMonths);
  return date.toISOString();
}

/**
 * Check if a paused membership should resume.
 */
export function shouldResume(billing: MemberBilling, now?: Date): boolean {
  if (billing.status !== 'paused') return false;
  if (!billing.pauseResumeDate) return false;
  const currentDate = now || new Date();
  return currentDate >= new Date(billing.pauseResumeDate);
}

// ── Cancellation Flow ────────────────────────────────────────────────────

/**
 * Get applicable save offers for a cancellation reason.
 */
export function getSaveOffers(reason: CancellationReason): SaveOffer[] {
  return SAVE_OFFERS.filter(offer => offer.applicableReasons.includes(reason));
}

/**
 * Calculate the effective cancellation date.
 */
export function calculateCancellationDate(
  billing: MemberBilling,
  effectiveDate: 'immediate' | 'end_of_period',
): string {
  if (effectiveDate === 'immediate') {
    return new Date().toISOString();
  }
  return billing.currentPeriodEnd;
}

/**
 * Calculate any refund due on cancellation.
 */
export function calculateCancellationRefund(
  billing: MemberBilling,
  effectiveDate: 'immediate' | 'end_of_period',
  now?: Date,
): { refundAmount: number; daysRemaining: number; totalDays: number } {
  if (effectiveDate === 'end_of_period') {
    return { refundAmount: 0, daysRemaining: 0, totalDays: 0 };
  }

  const currentDate = now || new Date();
  const periodEnd = new Date(billing.currentPeriodEnd);
  const periodStart = new Date(billing.currentPeriodStart);

  if (currentDate >= periodEnd) {
    return { refundAmount: 0, daysRemaining: 0, totalDays: 0 };
  }

  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyRate = billing.monthlyRate / totalDays;
  const refundAmount = Math.round(dailyRate * daysRemaining * 100) / 100;

  return { refundAmount, daysRemaining, totalDays };
}

/**
 * Build the complete cancellation summary.
 */
export function buildCancellationSummary(
  billing: MemberBilling,
  reason: CancellationReason,
  effectiveDate: 'immediate' | 'end_of_period',
): {
  cancellationDate: string;
  refund: ReturnType<typeof calculateCancellationRefund>;
  saveOffers: SaveOffer[];
  creditBalanceForfeited: number;
  benefitsEndDate: string;
} {
  const cancellationDate = calculateCancellationDate(billing, effectiveDate);
  const refund = calculateCancellationRefund(billing, effectiveDate);
  const saveOffers = getSaveOffers(reason);

  return {
    cancellationDate,
    refund,
    saveOffers,
    creditBalanceForfeited: billing.creditBalance,
    benefitsEndDate: effectiveDate === 'immediate' ? cancellationDate : billing.currentPeriodEnd,
  };
}

// ── Payment Method Management ────────────────────────────────────────────

/**
 * Validate a payment method can be removed.
 */
export function canRemovePaymentMethod(
  billing: MemberBilling,
  paymentMethodId: string,
): { allowed: boolean; reason?: string } {
  const method = billing.paymentMethods.find(m => m.id === paymentMethodId);
  if (!method) return { allowed: false, reason: 'Payment method not found' };

  if (billing.paymentMethods.length <= 1) {
    return { allowed: false, reason: 'Cannot remove the last payment method — at least one is required for active membership' };
  }

  if (method.isDefault && billing.paymentMethods.length > 1) {
    return { allowed: false, reason: 'Set a different default payment method before removing this one' };
  }

  return { allowed: true };
}

/**
 * Check if a card is expiring soon (within 30 days).
 */
export function isCardExpiringSoon(method: PaymentMethod, now?: Date): boolean {
  if (method.type !== 'card' || !method.expiryMonth || !method.expiryYear) return false;

  const currentDate = now || new Date();
  const expiryDate = new Date(method.expiryYear, method.expiryMonth, 0); // Last day of expiry month
  const thirtyDaysFromNow = new Date(currentDate);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return expiryDate <= thirtyDaysFromNow;
}

/**
 * Get expiring cards for a billing record.
 */
export function getExpiringCards(billing: MemberBilling, now?: Date): PaymentMethod[] {
  return billing.paymentMethods.filter(m => isCardExpiringSoon(m, now));
}

// ── Billing Calculations ─────────────────────────────────────────────────

/**
 * Calculate the next billing date from the current period end.
 */
export function calculateNextBillingDate(
  currentPeriodEnd: string,
  billingCycle: BillingCycle,
): string {
  const date = new Date(currentPeriodEnd);
  if (billingCycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

/**
 * Calculate the billing period end from a start date.
 */
export function calculatePeriodEnd(
  periodStart: string,
  billingCycle: BillingCycle,
): string {
  const date = new Date(periodStart);
  if (billingCycle === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

/**
 * Calculate annual pricing breakdown.
 */
export function calculateAnnualBreakdown(
  tier: MembershipTier,
  discountType: DiscountType = 'none',
): {
  monthlyRate: number;
  annualRate: number;
  annualMonthlyEquivalent: number;
  totalSavings: number;
  monthsFree: number;
} {
  const plan = PLANS[tier];
  const monthlyRate = getEffectiveMonthlyPrice(tier, 'monthly', discountType);
  const annualRate = monthlyRate * (12 - ANNUAL_DISCOUNT_MONTHS);
  const annualMonthlyEquivalent = Math.round((annualRate / 12) * 100) / 100;
  const totalSavings = monthlyRate * 12 - annualRate;

  return {
    monthlyRate,
    annualRate,
    annualMonthlyEquivalent,
    totalSavings,
    monthsFree: ANNUAL_DISCOUNT_MONTHS,
  };
}

/**
 * Determine the billing status based on membership state.
 */
export function determineBillingHealth(billing: MemberBilling): {
  health: 'healthy' | 'warning' | 'critical';
  issues: string[];
} {
  const issues: string[] = [];

  if (billing.failedPaymentCount > 0) {
    issues.push(`${billing.failedPaymentCount} failed payment attempt(s)`);
  }
  if (billing.gracePeriodEndsAt) {
    issues.push('In grace period');
  }
  if (billing.status === 'past_due') {
    issues.push('Payment past due');
  }
  if (billing.status === 'suspended') {
    issues.push('Membership suspended');
  }
  if (getExpiringCards(billing).length > 0) {
    issues.push('Card expiring soon');
  }

  const health: 'healthy' | 'warning' | 'critical' =
    billing.status === 'suspended' || billing.failedPaymentCount >= MAX_PAYMENT_RETRIES ? 'critical' :
    issues.length > 0 ? 'warning' :
    'healthy';

  return { health, issues };
}

// ── Square Integration Helpers ───────────────────────────────────────────

/**
 * Build the Square subscription plan request body.
 */
export function buildSquareSubscriptionRequest(
  billing: MemberBilling,
): {
  idempotencyKey: string;
  locationId: string;
  customerId: string;
  planVariationId: string;
  startDate: string;
  cardId?: string;
  priceOverrideMoney?: { amount: number; currency: string };
} {
  const plan = PLANS[billing.tier];
  const effectiveRate = getEffectiveMonthlyPrice(billing.tier, billing.billingCycle, billing.discountType);
  const amountCents = Math.round(effectiveRate * 100);

  return {
    idempotencyKey: `sub_${billing.memberId}_${Date.now()}`,
    locationId: env.SQUARE_LOCATION_ID,
    customerId: billing.squareCustomerId || '',
    planVariationId: getSquarePlanVariationId(billing.tier, billing.billingCycle),
    startDate: billing.currentPeriodStart.split('T')[0],
    cardId: billing.defaultPaymentMethodId,
    priceOverrideMoney: effectiveRate !== plan.monthlyPrice
      ? { amount: amountCents, currency: 'USD' }
      : undefined,
  };
}

/**
 * Map tier + billing cycle to Square catalog plan variation ID.
 * These would be configured in Square catalog.
 */
export function getSquarePlanVariationId(tier: MembershipTier, cycle: BillingCycle): string {
  const planMap: Record<string, string> = {
    'halo_monthly': env.SQUARE_PLAN_HALO_MONTHLY,
    'halo_annual': env.SQUARE_PLAN_HALO_ANNUAL,
    'glow_monthly': env.SQUARE_PLAN_GLOW_MONTHLY,
    'glow_annual': env.SQUARE_PLAN_GLOW_ANNUAL,
    'elite_monthly': env.SQUARE_PLAN_ELITE_MONTHLY,
    'elite_annual': env.SQUARE_PLAN_ELITE_ANNUAL,
  };

  return planMap[`${tier}_${cycle}`] || `plan_${tier}_${cycle}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `inv_${timestamp}_${random}`;
}

function formatPeriod(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(s)} — ${fmt(e)}`;
}

/**
 * Calculate days between two dates.
 */
export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate a billing summary for dashboard display.
 */
export function buildBillingSummary(billings: MemberBilling[]): {
  totalActive: number;
  totalPaused: number;
  totalSuspended: number;
  totalPastDue: number;
  totalMRR: number;
  failedPayments: number;
  expiringCards: number;
  inGracePeriod: number;
} {
  let totalActive = 0;
  let totalPaused = 0;
  let totalSuspended = 0;
  let totalPastDue = 0;
  let totalMRR = 0;
  let failedPayments = 0;
  let expiringCards = 0;
  let inGracePeriod = 0;

  for (const b of billings) {
    switch (b.status) {
      case 'active': totalActive++; totalMRR += b.monthlyRate; break;
      case 'paused': totalPaused++; break;
      case 'suspended': totalSuspended++; break;
      case 'past_due': totalPastDue++; totalMRR += b.monthlyRate; break;
    }
    if (b.failedPaymentCount > 0) failedPayments++;
    if (getExpiringCards(b).length > 0) expiringCards++;
    if (isInGracePeriod(b)) inGracePeriod++;
  }

  return {
    totalActive,
    totalPaused,
    totalSuspended,
    totalPastDue,
    totalMRR: Math.round(totalMRR * 100) / 100,
    failedPayments,
    expiringCards,
    inGracePeriod,
  };
}
