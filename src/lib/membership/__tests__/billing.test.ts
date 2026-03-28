// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  generateInvoice,
  processPaymentRetry,
  getDunningStep,
  calculateGracePeriodEnd,
  isInGracePeriod,
  shouldSuspend,
  allocateMonthlyCredits,
  useCredits,
  areCreditsExpired,
  validatePauseRequest,
  calculateResumeDate,
  shouldResume,
  getSaveOffers,
  calculateCancellationDate,
  calculateCancellationRefund,
  buildCancellationSummary,
  canRemovePaymentMethod,
  isCardExpiringSoon,
  getExpiringCards,
  calculateNextBillingDate,
  calculatePeriodEnd,
  calculateAnnualBreakdown,
  determineBillingHealth,
  buildBillingSummary,
  buildSquareSubscriptionRequest,
  getSquarePlanVariationId,
  daysBetween,
  MAX_PAYMENT_RETRIES,
  MAX_PAUSE_MONTHS_PER_YEAR,
  GRACE_PERIOD_DAYS,
  DUNNING_SEQUENCE,
  SAVE_OFFERS,
  type MemberBilling,
  type PaymentMethod,
  type CreditAllocation,
} from '../billing';

// ── Test Helpers ─────────────────────────────────────────────────────────

function makeBilling(overrides: Partial<MemberBilling> = {}): MemberBilling {
  return {
    memberId: 'mem_test',
    clientId: 'c_test',
    clientName: 'Test Member',
    email: 'test@example.com',
    tier: 'glow',
    billingCycle: 'monthly',
    discountType: 'none',
    status: 'active',
    monthlyRate: 249,
    paymentMethods: [
      { id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242', expiryMonth: 12, expiryYear: 2027, isDefault: true, addedAt: '2025-01-01' },
    ],
    currentPeriodStart: '2026-03-01T00:00:00Z',
    currentPeriodEnd: '2026-04-01T00:00:00Z',
    nextBillingDate: '2026-04-01T00:00:00Z',
    createdAt: '2025-10-01T00:00:00Z',
    pauseMonthsUsed: 0,
    failedPaymentCount: 0,
    creditBalance: 0,
    rolledOverCredits: 0,
    ...overrides,
  };
}

// ── Invoice Generation ───────────────────────────────────────────────────

describe('generateInvoice', () => {
  it('creates an invoice with correct structure', () => {
    const billing = makeBilling();
    const invoice = generateInvoice(billing, '2026-03-01', '2026-04-01');
    expect(invoice.id).toMatch(/^inv_/);
    expect(invoice.memberId).toBe('mem_test');
    expect(invoice.status).toBe('pending');
    expect(invoice.lineItems.length).toBeGreaterThanOrEqual(1);
  });

  it('includes membership line item', () => {
    const billing = makeBilling();
    const invoice = generateInvoice(billing, '2026-03-01', '2026-04-01');
    const membershipLine = invoice.lineItems.find(l => l.type === 'membership');
    expect(membershipLine).toBeDefined();
    expect(membershipLine!.amount).toBe(249);
  });

  it('applies discount when present', () => {
    const billing = makeBilling({ discountType: 'student' });
    const invoice = generateInvoice(billing, '2026-03-01', '2026-04-01');
    expect(invoice.amount).toBeLessThan(249);
  });

  it('includes additional line items', () => {
    const billing = makeBilling();
    const invoice = generateInvoice(billing, '2026-03-01', '2026-04-01', [
      { description: 'Add-on', quantity: 1, unitPrice: 50, amount: 50, type: 'add_on' },
    ]);
    expect(invoice.lineItems).toHaveLength(2);
    expect(invoice.amount).toBeGreaterThan(249);
  });
});

// ── Payment Retry ────────────────────────────────────────────────────────

describe('processPaymentRetry', () => {
  it('returns next retry date on first retry', () => {
    const result = processPaymentRetry(makeBilling(), 0);
    expect(result.retryNumber).toBe(1);
    expect(result.nextRetryDate).toBeDefined();
    expect(result.shouldSuspend).toBe(false);
  });

  it('suspends after max retries', () => {
    const result = processPaymentRetry(makeBilling(), MAX_PAYMENT_RETRIES);
    expect(result.shouldSuspend).toBe(true);
  });

  it('increments retry number', () => {
    expect(processPaymentRetry(makeBilling(), 0).retryNumber).toBe(1);
    expect(processPaymentRetry(makeBilling(), 1).retryNumber).toBe(2);
    expect(processPaymentRetry(makeBilling(), 2).retryNumber).toBe(3);
  });
});

// ── Dunning ──────────────────────────────────────────────────────────────

describe('getDunningStep', () => {
  it('returns first step for 0 failures', () => {
    const step = getDunningStep(0);
    expect(step.type).toBe('payment_failed');
  });

  it('returns suspended step for 5+ failures', () => {
    const step = getDunningStep(5);
    expect(step.type).toBe('suspended');
  });

  it('has 6 dunning steps', () => {
    expect(DUNNING_SEQUENCE).toHaveLength(6);
  });

  it('every step has email template', () => {
    for (const step of DUNNING_SEQUENCE) {
      expect(step.emailTemplate).toBeTruthy();
    }
  });
});

// ── Grace Period ─────────────────────────────────────────────────────────

describe('Grace Period', () => {
  it('calculateGracePeriodEnd adds 7 days', () => {
    const start = new Date('2026-03-01T00:00:00Z');
    const end = calculateGracePeriodEnd(start.toISOString());
    const endDate = new Date(end);
    const daysDiff = Math.round((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(GRACE_PERIOD_DAYS);
  });

  it('isInGracePeriod returns true during grace period', () => {
    const billing = makeBilling({
      gracePeriodEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isInGracePeriod(billing)).toBe(true);
  });

  it('isInGracePeriod returns false after grace period', () => {
    const billing = makeBilling({
      gracePeriodEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(isInGracePeriod(billing)).toBe(false);
  });

  it('isInGracePeriod returns false when no grace period set', () => {
    expect(isInGracePeriod(makeBilling())).toBe(false);
  });
});

// ── Suspension ───────────────────────────────────────────────────────────

describe('shouldSuspend', () => {
  it('returns false for healthy member', () => {
    expect(shouldSuspend(makeBilling())).toBe(false);
  });

  it('returns false with fewer than max retries', () => {
    expect(shouldSuspend(makeBilling({ failedPaymentCount: 1 }))).toBe(false);
  });

  it('returns true after max retries and grace period expired', () => {
    const billing = makeBilling({
      failedPaymentCount: 3,
      gracePeriodEndsAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(shouldSuspend(billing)).toBe(true);
  });

  it('returns false for already suspended member', () => {
    expect(shouldSuspend(makeBilling({ status: 'suspended' }))).toBe(false);
  });
});

// ── Credits ──────────────────────────────────────────────────────────────

describe('allocateMonthlyCredits', () => {
  it('allocates monthly credits based on tier', () => {
    const billing = makeBilling();
    const allocation = allocateMonthlyCredits(billing, 0, '2026-03');
    expect(allocation.allocated).toBe(200); // Glow = $200
    expect(allocation.totalAvailable).toBe(200);
  });

  it('rolls over unused credits', () => {
    const billing = makeBilling();
    const allocation = allocateMonthlyCredits(billing, 80, '2026-03');
    expect(allocation.rolledOver).toBe(80);
    expect(allocation.totalAvailable).toBe(280);
  });

  it('caps rollover at one months worth', () => {
    const billing = makeBilling();
    const allocation = allocateMonthlyCredits(billing, 500, '2026-03');
    expect(allocation.rolledOver).toBe(200); // Capped at monthly allocation
  });
});

describe('useCredits', () => {
  it('uses credits from available balance', () => {
    const alloc: CreditAllocation = {
      memberId: 'mem_test', month: '2026-03', allocated: 200,
      rolledOver: 0, totalAvailable: 200, used: 0, remaining: 200,
      expiresAt: '2026-05-01T00:00:00Z',
    };
    const result = useCredits(alloc, 150);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(50);
    expect(result.overageAmount).toBe(0);
  });

  it('calculates overage when exceeding balance', () => {
    const alloc: CreditAllocation = {
      memberId: 'mem_test', month: '2026-03', allocated: 200,
      rolledOver: 0, totalAvailable: 200, used: 0, remaining: 100,
      expiresAt: '2026-05-01T00:00:00Z',
    };
    const result = useCredits(alloc, 150);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.overageAmount).toBe(50);
  });

  it('handles zero amount', () => {
    const alloc: CreditAllocation = {
      memberId: 'mem_test', month: '2026-03', allocated: 200,
      rolledOver: 0, totalAvailable: 200, used: 0, remaining: 200,
      expiresAt: '2026-05-01T00:00:00Z',
    };
    const result = useCredits(alloc, 0);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(200);
  });
});

// ── Pause / Resume ───────────────────────────────────────────────────────

describe('validatePauseRequest', () => {
  it('allows pause for active member', () => {
    expect(validatePauseRequest(makeBilling(), 1).valid).toBe(true);
  });

  it('blocks pause for non-active member', () => {
    const billing = makeBilling({ status: 'paused' });
    expect(validatePauseRequest(billing, 1).valid).toBe(false);
  });

  it('blocks more than 2 months pause per year', () => {
    const billing = makeBilling({ pauseMonthsUsed: 2 });
    expect(validatePauseRequest(billing, 1).valid).toBe(false);
  });

  it('allows up to max pause months', () => {
    const billing = makeBilling({ pauseMonthsUsed: 1 });
    expect(validatePauseRequest(billing, 1).valid).toBe(true);
  });

  it('blocks invalid pause duration', () => {
    expect(validatePauseRequest(makeBilling(), 3).valid).toBe(false);
    expect(validatePauseRequest(makeBilling(), 0).valid).toBe(false);
  });
});

describe('shouldResume', () => {
  it('returns false for active member', () => {
    expect(shouldResume(makeBilling())).toBe(false);
  });

  it('returns true when resume date has passed', () => {
    const billing = makeBilling({
      status: 'paused',
      pauseResumeDate: new Date(Date.now() - 1000).toISOString(),
    });
    expect(shouldResume(billing)).toBe(true);
  });

  it('returns false when resume date is in future', () => {
    const billing = makeBilling({
      status: 'paused',
      pauseResumeDate: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(shouldResume(billing)).toBe(false);
  });
});

// ── Cancellation ─────────────────────────────────────────────────────────

describe('Cancellation', () => {
  it('getSaveOffers returns offers for each reason', () => {
    const reasons = ['too_expensive', 'not_using_enough', 'financial_hardship'] as const;
    for (const reason of reasons) {
      const offers = getSaveOffers(reason);
      expect(offers.length).toBeGreaterThan(0);
    }
  });

  it('save offers exist', () => {
    expect(SAVE_OFFERS.length).toBeGreaterThanOrEqual(4);
  });

  it('calculateCancellationRefund returns zero for end_of_period', () => {
    const billing = makeBilling();
    const refund = calculateCancellationRefund(billing, 'end_of_period');
    expect(refund.refundAmount).toBe(0);
  });

  it('buildCancellationSummary includes save offers', () => {
    const billing = makeBilling();
    const summary = buildCancellationSummary(billing, 'too_expensive', 'end_of_period');
    expect(summary.saveOffers.length).toBeGreaterThan(0);
    expect(summary.creditBalanceForfeited).toBe(0);
  });
});

// ── Payment Method Management ────────────────────────────────────────────

describe('canRemovePaymentMethod', () => {
  it('blocks removing last payment method', () => {
    const billing = makeBilling();
    const result = canRemovePaymentMethod(billing, 'pm_1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('last payment method');
  });

  it('blocks removing default when others exist', () => {
    const billing = makeBilling({
      paymentMethods: [
        { id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242', isDefault: true, addedAt: '2025-01-01' },
        { id: 'pm_2', type: 'card', brand: 'MC', last4: '5555', isDefault: false, addedAt: '2025-02-01' },
      ],
    });
    const result = canRemovePaymentMethod(billing, 'pm_1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('default');
  });

  it('allows removing non-default when multiple exist', () => {
    const billing = makeBilling({
      paymentMethods: [
        { id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242', isDefault: true, addedAt: '2025-01-01' },
        { id: 'pm_2', type: 'card', brand: 'MC', last4: '5555', isDefault: false, addedAt: '2025-02-01' },
      ],
    });
    expect(canRemovePaymentMethod(billing, 'pm_2').allowed).toBe(true);
  });

  it('returns false for non-existent method', () => {
    expect(canRemovePaymentMethod(makeBilling(), 'pm_999').allowed).toBe(false);
  });
});

describe('isCardExpiringSoon', () => {
  it('returns true for card expiring within 30 days', () => {
    // Card expires end of current month → within 30 days
    const now = new Date();
    const method: PaymentMethod = {
      id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242',
      expiryMonth: now.getMonth() + 1, expiryYear: now.getFullYear(), isDefault: true, addedAt: '2025-01-01',
    };
    expect(isCardExpiringSoon(method, now)).toBe(true);
  });

  it('returns false for card expiring far in future', () => {
    const now = new Date('2026-03-15');
    const method: PaymentMethod = {
      id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242',
      expiryMonth: 12, expiryYear: 2027, isDefault: true, addedAt: '2025-01-01',
    };
    expect(isCardExpiringSoon(method, now)).toBe(false);
  });

  it('returns false for bank type', () => {
    const method: PaymentMethod = {
      id: 'pm_1', type: 'bank', last4: '1234', isDefault: true, addedAt: '2025-01-01',
    };
    expect(isCardExpiringSoon(method)).toBe(false);
  });
});

// ── Billing Health ───────────────────────────────────────────────────────

describe('determineBillingHealth', () => {
  it('returns healthy for clean billing', () => {
    const result = determineBillingHealth(makeBilling());
    expect(result.health).toBe('healthy');
    expect(result.issues).toHaveLength(0);
  });

  it('returns warning for failed payments', () => {
    const result = determineBillingHealth(makeBilling({ failedPaymentCount: 1 }));
    expect(result.health).toBe('warning');
  });

  it('returns critical for suspended', () => {
    const result = determineBillingHealth(makeBilling({ status: 'suspended' }));
    expect(result.health).toBe('critical');
  });
});

// ── Summary ──────────────────────────────────────────────────────────────

describe('buildBillingSummary', () => {
  it('aggregates billing data correctly', () => {
    const billings = [
      makeBilling({ status: 'active', monthlyRate: 149 }),
      makeBilling({ status: 'active', monthlyRate: 249 }),
      makeBilling({ status: 'paused', monthlyRate: 449 }),
      makeBilling({ status: 'suspended', monthlyRate: 149 }),
    ];
    const summary = buildBillingSummary(billings);
    expect(summary.totalActive).toBe(2);
    expect(summary.totalPaused).toBe(1);
    expect(summary.totalSuspended).toBe(1);
    expect(summary.totalMRR).toBe(398);
  });
});

// ── Date Helpers ─────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('calculates days between dates', () => {
    expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
  });
});

describe('calculateNextBillingDate', () => {
  it('adds 1 month for monthly billing', () => {
    const start = new Date('2026-03-01T00:00:00Z');
    const next = calculateNextBillingDate(start.toISOString(), 'monthly');
    const nextDate = new Date(next);
    // Should be ~1 month later
    const monthDiff = (nextDate.getFullYear() - start.getFullYear()) * 12 + (nextDate.getMonth() - start.getMonth());
    expect(monthDiff).toBe(1);
  });

  it('adds 1 year for annual billing', () => {
    const start = new Date('2026-03-01T00:00:00Z');
    const next = calculateNextBillingDate(start.toISOString(), 'annual');
    const nextDate = new Date(next);
    expect(nextDate.getFullYear() - start.getFullYear()).toBe(1);
  });
});

describe('calculateAnnualBreakdown', () => {
  it('shows savings over monthly billing', () => {
    const result = calculateAnnualBreakdown('glow');
    expect(result.totalSavings).toBeGreaterThan(0);
    expect(result.monthsFree).toBe(2);
    expect(result.annualMonthlyEquivalent).toBeLessThan(result.monthlyRate);
  });
});

// ── Square Integration ───────────────────────────────────────────────────

describe('Square Integration', () => {
  it('getSquarePlanVariationId returns correct format', () => {
    const id = getSquarePlanVariationId('glow', 'monthly');
    expect(id).toContain('glow');
    expect(id).toContain('monthly');
  });

  it('buildSquareSubscriptionRequest has required fields', () => {
    const billing = makeBilling({ squareCustomerId: 'sq_cust_123' });
    const req = buildSquareSubscriptionRequest(billing);
    expect(req.idempotencyKey).toContain('sub_');
    expect(req.customerId).toBe('sq_cust_123');
    expect(req.planVariationId).toBeTruthy();
  });
});
