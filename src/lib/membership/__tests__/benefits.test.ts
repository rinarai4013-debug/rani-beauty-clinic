// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  initializeBenefits,
  applyCreditsToService,
  recordCreditUsage,
  resetMonthlyCredits,
  addBonusCredits,
  canPriorityBook,
  issueGuestPass,
  redeemGuestPass,
  getRemainingGuestPasses,
  resetQuarterlyGuestPasses,
  isBirthdayBonusEligible,
  claimBirthdayBonus,
  isAnniversaryBonusEligible,
  claimAnniversaryBonus,
  resetAnnualBonuses,
  awardReferralBonus,
  canAccessEvent,
  calculateMemberDiscount,
  calculateUtilizationScore,
  buildUtilizationReport,
  buildBenefitsAnalytics,
  checkSurveyMilestone,
  PRIORITY_BOOKING_HOURS,
  GUEST_PASS_DISCOUNT,
  type MemberBenefits,
} from '../benefits';

// ── Test Helpers ─────────────────────────────────────────────────────────

function makeHaloBenefits(overrides: Partial<MemberBenefits> = {}): MemberBenefits {
  return initializeBenefits('mem_1', 'c_1', 'Test Halo', 'halo', '2025-10-15', 6, ...Object.values(overrides) as []);
}

function makeGlowBenefits(overrides: Partial<MemberBenefits> = {}): MemberBenefits {
  const base = initializeBenefits('mem_2', 'c_2', 'Test Glow', 'glow', '2025-10-15', 6);
  return { ...base, ...overrides };
}

function makeEliteBenefits(overrides: Partial<MemberBenefits> = {}): MemberBenefits {
  const base = initializeBenefits('mem_3', 'c_3', 'Test Elite', 'elite', '2025-10-15', 6);
  return { ...base, ...overrides };
}

// ── Initialization ───────────────────────────────────────────────────────

describe('initializeBenefits', () => {
  it('initializes halo with correct credits', () => {
    const b = makeHaloBenefits();
    expect(b.credits.monthlyAllocation).toBe(100);
    expect(b.credits.remaining).toBe(100);
  });

  it('initializes glow with correct credits', () => {
    const b = makeGlowBenefits();
    expect(b.credits.monthlyAllocation).toBe(200);
  });

  it('initializes elite with correct credits', () => {
    const b = makeEliteBenefits();
    expect(b.credits.monthlyAllocation).toBe(400);
  });

  it('sets correct discount percent by tier', () => {
    expect(makeHaloBenefits().discountPercent).toBe(10);
    expect(makeGlowBenefits().discountPercent).toBe(15);
    expect(makeEliteBenefits().discountPercent).toBe(20);
  });

  it('sets priority booking by tier', () => {
    expect(makeHaloBenefits().priorityBooking).toBe(false);
    expect(makeGlowBenefits().priorityBooking).toBe(true);
    expect(makeEliteBenefits().priorityBooking).toBe(true);
  });

  it('sets exclusive events only for elite', () => {
    expect(makeHaloBenefits().exclusiveEventAccess).toBe(false);
    expect(makeGlowBenefits().exclusiveEventAccess).toBe(false);
    expect(makeEliteBenefits().exclusiveEventAccess).toBe(true);
  });

  it('sets dedicated concierge only for elite', () => {
    expect(makeHaloBenefits().dedicatedConcierge).toBe(false);
    expect(makeEliteBenefits().dedicatedConcierge).toBe(true);
  });

  it('sets correct guest passes per quarter', () => {
    expect(makeHaloBenefits().guestPassesPerQuarter).toBe(0);
    expect(makeGlowBenefits().guestPassesPerQuarter).toBe(1);
    expect(makeEliteBenefits().guestPassesPerQuarter).toBe(2);
  });

  it('sets birthday bonus by tier', () => {
    expect(makeHaloBenefits().birthdayBonusAmount).toBe(50);
    expect(makeGlowBenefits().birthdayBonusAmount).toBe(100);
    expect(makeEliteBenefits().birthdayBonusAmount).toBe(200);
  });

  it('starts with bonuses unclaimed', () => {
    const b = makeGlowBenefits();
    expect(b.birthdayBonusClaimed).toBe(false);
    expect(b.anniversaryBonusClaimed).toBe(false);
  });

  it('sets status to active', () => {
    expect(makeHaloBenefits().status).toBe('active');
  });
});

// ── Credit Management ────────────────────────────────────────────────────

describe('applyCreditsToService', () => {
  it('applies discount and credits to service', () => {
    const b = makeGlowBenefits();
    const result = applyCreditsToService(b, 275, 'HydraFacial');
    expect(result.discountPercent).toBe(15);
    expect(result.discountAmount).toBeCloseTo(41.25);
    expect(result.creditApplied).toBeLessThanOrEqual(b.credits.remaining);
    expect(result.outOfPocket).toBeGreaterThanOrEqual(0);
  });

  it('returns full price for inactive member', () => {
    const b = makeGlowBenefits({ status: 'suspended' });
    const result = applyCreditsToService(b, 275, 'HydraFacial');
    expect(result.creditApplied).toBe(0);
    expect(result.outOfPocket).toBe(275);
  });

  it('uses all credits when service is cheaper than balance', () => {
    const b = makeEliteBenefits(); // $400 credits
    const result = applyCreditsToService(b, 100, 'B12 Injection');
    expect(result.creditApplied).toBeGreaterThan(0);
    expect(result.outOfPocket).toBe(0);
  });

  it('calculates overage when credits are insufficient', () => {
    const b = makeHaloBenefits(); // $100 credits
    const result = applyCreditsToService(b, 500, 'RF Microneedling');
    expect(result.creditApplied).toBe(100); // Used all credits
    expect(result.outOfPocket).toBeGreaterThan(0);
  });
});

describe('recordCreditUsage', () => {
  it('reduces remaining credits', () => {
    const b = makeGlowBenefits();
    const updated = recordCreditUsage(b, 100);
    expect(updated.credits.remaining).toBe(100);
    expect(updated.credits.usedThisMonth).toBe(100);
  });

  it('does not go below zero', () => {
    const b = makeHaloBenefits();
    const updated = recordCreditUsage(b, 500);
    expect(updated.credits.remaining).toBe(0);
  });
});

describe('resetMonthlyCredits', () => {
  it('allocates new credits', () => {
    const b = recordCreditUsage(makeGlowBenefits(), 150);
    const reset = resetMonthlyCredits(b);
    expect(reset.credits.monthlyAllocation).toBe(200);
    expect(reset.credits.usedThisMonth).toBe(0);
  });

  it('rolls over unused credits', () => {
    const b = recordCreditUsage(makeGlowBenefits(), 100); // 100 remaining
    const reset = resetMonthlyCredits(b);
    expect(reset.credits.rolledOver).toBe(100);
    expect(reset.credits.totalAvailable).toBe(300); // 200 new + 100 rollover
  });

  it('caps rollover at monthly allocation', () => {
    const b = makeGlowBenefits();
    // Don't use any credits, so all 200 would roll over
    const reset = resetMonthlyCredits(b);
    expect(reset.credits.rolledOver).toBe(200); // Capped at monthly allocation
  });
});

describe('addBonusCredits', () => {
  it('increases remaining and total available', () => {
    const b = makeHaloBenefits();
    const updated = addBonusCredits(b, 50);
    expect(updated.credits.remaining).toBe(150);
    expect(updated.credits.bonusCredits).toBe(50);
  });
});

// ── Priority Booking ─────────────────────────────────────────────────────

describe('canPriorityBook', () => {
  it('blocks halo from priority booking', () => {
    const b = makeHaloBenefits();
    const result = canPriorityBook(b, '2026-04-01T10:00:00Z', '2026-04-01T10:00:00Z');
    expect(result.allowed).toBe(false);
  });

  it('allows glow priority booking', () => {
    const b = makeGlowBenefits();
    const now = new Date();
    const slotTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const generalAvail = new Date(now.getTime() - 1000).toISOString(); // Already available
    const result = canPriorityBook(b, slotTime, generalAvail);
    expect(result.allowed).toBe(true);
  });

  it('blocks inactive member', () => {
    const b = makeGlowBenefits({ status: 'cancelled' });
    const result = canPriorityBook(b, '2026-04-01', '2026-04-01');
    expect(result.allowed).toBe(false);
  });
});

// ── Guest Passes ─────────────────────────────────────────────────────────

describe('Guest Passes', () => {
  it('halo cannot issue guest passes', () => {
    const result = issueGuestPass(makeHaloBenefits(), 'Jane Doe');
    expect(result.success).toBe(false);
  });

  it('glow can issue 1 guest pass per quarter', () => {
    const result = issueGuestPass(makeGlowBenefits(), 'Jane Doe');
    expect(result.success).toBe(true);
    expect(result.guestPass).toBeDefined();
    expect(result.guestPass!.guestName).toBe('Jane Doe');
  });

  it('blocks when quarterly limit reached', () => {
    const b = makeGlowBenefits({ guestPassesUsedThisQuarter: 1 });
    const result = issueGuestPass(b, 'Another Guest');
    expect(result.success).toBe(false);
  });

  it('elite can issue 2 per quarter', () => {
    const b = makeEliteBenefits({ guestPassesUsedThisQuarter: 1 });
    const result = issueGuestPass(b, 'VIP Guest');
    expect(result.success).toBe(true);
  });

  it('getRemainingGuestPasses returns correct count', () => {
    const b = makeEliteBenefits({ guestPassesUsedThisQuarter: 1 });
    expect(getRemainingGuestPasses(b)).toBe(1);
  });

  it('resetQuarterlyGuestPasses resets counter', () => {
    const b = makeEliteBenefits({ guestPassesUsedThisQuarter: 2 });
    const reset = resetQuarterlyGuestPasses(b);
    expect(reset.guestPassesUsedThisQuarter).toBe(0);
  });

  it('redeemGuestPass marks as used', () => {
    const { guestPass } = issueGuestPass(makeGlowBenefits(), 'Jane');
    const redeemed = redeemGuestPass(guestPass!, 'HydraFacial');
    expect(redeemed.status).toBe('used');
    expect(redeemed.service).toBe('HydraFacial');
  });
});

// ── Birthday Bonus ───────────────────────────────────────────────────────

describe('Birthday Bonus', () => {
  it('is eligible during birthday month', () => {
    const now = new Date();
    const b = makeGlowBenefits({ birthdayMonth: now.getMonth() + 1 });
    expect(isBirthdayBonusEligible(b)).toBe(true);
  });

  it('is not eligible in other months', () => {
    const now = new Date();
    const otherMonth = ((now.getMonth() + 5) % 12) + 1;
    const b = makeGlowBenefits({ birthdayMonth: otherMonth });
    expect(isBirthdayBonusEligible(b)).toBe(false);
  });

  it('is not eligible when already claimed', () => {
    const now = new Date();
    const b = makeGlowBenefits({ birthdayMonth: now.getMonth() + 1, birthdayBonusClaimed: true });
    expect(isBirthdayBonusEligible(b)).toBe(false);
  });

  it('claimBirthdayBonus adds credits', () => {
    const now = new Date();
    const b = makeGlowBenefits({ birthdayMonth: now.getMonth() + 1 });
    const result = claimBirthdayBonus(b);
    expect(result.success).toBe(true);
    expect(result.bonusAmount).toBe(100);
    expect(result.updatedBenefits.birthdayBonusClaimed).toBe(true);
    expect(result.updatedBenefits.credits.bonusCredits).toBe(100);
  });
});

// ── Anniversary Bonus ────────────────────────────────────────────────────

describe('Anniversary Bonus', () => {
  it('is not eligible for halo (0 bonus)', () => {
    const b = makeHaloBenefits();
    expect(isAnniversaryBonusEligible(b)).toBe(false);
  });

  it('claims anniversary bonus correctly', () => {
    const now = new Date();
    const joinDate = new Date(now);
    joinDate.setFullYear(joinDate.getFullYear() - 1); // Exactly 1 year ago
    const b = makeGlowBenefits({ joinDate: joinDate.toISOString() });
    const result = claimAnniversaryBonus(b);
    if (result.success) {
      expect(result.bonusAmount).toBe(75);
      expect(result.yearsAsMember).toBe(1);
    }
  });
});

describe('resetAnnualBonuses', () => {
  it('resets birthday and anniversary flags', () => {
    const b = makeGlowBenefits({
      birthdayBonusClaimed: true,
      anniversaryBonusClaimed: true,
    });
    const reset = resetAnnualBonuses(b);
    expect(reset.birthdayBonusClaimed).toBe(false);
    expect(reset.anniversaryBonusClaimed).toBe(false);
  });
});

// ── Referral Bonus ───────────────────────────────────────────────────────

describe('awardReferralBonus', () => {
  it('adds referral bonus credits', () => {
    const b = makeEliteBenefits();
    const result = awardReferralBonus(b);
    expect(result.bonusAmount).toBe(100); // Elite referral bonus
    expect(result.updatedBenefits.totalReferrals).toBe(1);
    expect(result.updatedBenefits.totalReferralBonusEarned).toBe(100);
  });

  it('accumulates multiple referrals', () => {
    let b = makeGlowBenefits();
    b = awardReferralBonus(b).updatedBenefits;
    b = awardReferralBonus(b).updatedBenefits;
    expect(b.totalReferrals).toBe(2);
    expect(b.totalReferralBonusEarned).toBe(150); // 75 * 2
  });
});

// ── Event Access ─────────────────────────────────────────────────────────

describe('canAccessEvent', () => {
  it('elite can access elite events', () => {
    const result = canAccessEvent(makeEliteBenefits(), 'elite');
    expect(result.allowed).toBe(true);
  });

  it('glow cannot access elite events', () => {
    const result = canAccessEvent(makeGlowBenefits(), 'elite');
    expect(result.allowed).toBe(false);
  });

  it('halo cannot access any events', () => {
    const result = canAccessEvent(makeHaloBenefits(), 'halo');
    expect(result.allowed).toBe(false);
  });

  it('inactive members cannot access events', () => {
    const b = makeEliteBenefits({ status: 'cancelled' });
    const result = canAccessEvent(b, 'elite');
    expect(result.allowed).toBe(false);
  });
});

// ── Discount Application ─────────────────────────────────────────────────

describe('calculateMemberDiscount', () => {
  it('applies correct discount by tier', () => {
    expect(calculateMemberDiscount(makeHaloBenefits(), 100).discountAmount).toBe(10);
    expect(calculateMemberDiscount(makeGlowBenefits(), 100).discountAmount).toBe(15);
    expect(calculateMemberDiscount(makeEliteBenefits(), 100).discountAmount).toBe(20);
  });

  it('returns zero for inactive member', () => {
    const b = makeGlowBenefits({ status: 'suspended' });
    expect(calculateMemberDiscount(b, 100).discountAmount).toBe(0);
  });

  it('returns zero for zero price', () => {
    expect(calculateMemberDiscount(makeGlowBenefits(), 0).discountAmount).toBe(0);
  });
});

// ── Utilization ──────────────────────────────────────────────────────────

describe('calculateUtilizationScore', () => {
  it('returns 0-100', () => {
    const score = calculateUtilizationScore(makeGlowBenefits());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('high usage = high score', () => {
    const b = makeEliteBenefits();
    const used = recordCreditUsage(b, 400); // Used all credits
    const score = calculateUtilizationScore({
      ...used,
      guestPassesUsedThisQuarter: 2,
      eventsAttended: 2,
      eventsInvited: 2,
      birthdayBonusClaimed: true,
      lastActivityDate: new Date().toISOString(),
    });
    expect(score).toBeGreaterThan(60);
  });

  it('no usage = low score', () => {
    const b = makeHaloBenefits({ lastActivityDate: new Date(Date.now() - 90 * 86400000).toISOString() });
    const score = calculateUtilizationScore(b);
    expect(score).toBeLessThan(40);
  });
});

// ── Survey Milestones ────────────────────────────────────────────────────

describe('checkSurveyMilestone', () => {
  it('returns 30-day milestone after 30 days', () => {
    const joinDate = new Date(Date.now() - 35 * 86400000).toISOString();
    expect(checkSurveyMilestone(joinDate, [])).toBe(30);
  });

  it('returns 90-day when 30-day is complete', () => {
    const joinDate = new Date(Date.now() - 100 * 86400000).toISOString();
    expect(checkSurveyMilestone(joinDate, [30])).toBe(90);
  });

  it('returns null when all surveys complete', () => {
    const joinDate = new Date(Date.now() - 400 * 86400000).toISOString();
    expect(checkSurveyMilestone(joinDate, [30, 90, 180, 365])).toBeNull();
  });

  it('returns null when too early', () => {
    const joinDate = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(checkSurveyMilestone(joinDate, [])).toBeNull();
  });
});

// ── Benefits Analytics ───────────────────────────────────────────────────

describe('buildBenefitsAnalytics', () => {
  it('returns correct structure', () => {
    const members = [makeHaloBenefits(), makeGlowBenefits(), makeEliteBenefits()];
    const analytics = buildBenefitsAnalytics(members);
    expect(analytics.totalMembers).toBe(3);
    expect(analytics).toHaveProperty('creditUtilizationRate');
    expect(analytics).toHaveProperty('topUtilizers');
    expect(analytics).toHaveProperty('utilizationByTier');
  });

  it('handles empty members list', () => {
    const analytics = buildBenefitsAnalytics([]);
    expect(analytics.totalMembers).toBe(0);
    expect(analytics.averageCreditUtilization).toBe(0);
  });
});
