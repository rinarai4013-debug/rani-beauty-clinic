import { describe, it, expect } from 'vitest';
import {
  calculatePointsFromSpend,
  determineTier,
  getNextTier,
  calculateTierProgress,
  getTierBenefits,
  checkTierUpgrade,
  pointsToDollars,
  dollarsToPoints,
  checkExpiry,
  calculateExpiryDate,
  checkVisitStreak,
  checkBirthdayMonth,
  validateRedemption,
  processTransaction,
  awardBonus,
  processRedemption,
  processExpiry,
  buildLoyaltyAccount,
  getTierDiscount,
  applyTierDiscount,
  getBirthdayBonus,
  getReferralBonus,
  buildAnalytics,
  generateTransactionId,
  POINTS_PER_DOLLAR,
  REFERRAL_BONUS_POINTS,
  BIRTHDAY_BONUS_POINTS,
  REVIEW_BONUS_POINTS,
  VISIT_STREAK_BONUS_POINTS,
  VISIT_STREAK_THRESHOLD,
  TIER_THRESHOLDS,
  SERVICE_MULTIPLIERS,
  INACTIVITY_EXPIRY_MONTHS,
  POINTS_TO_DOLLAR_RATIO,
  type PointsTransaction,
  type LoyaltyMember,
  type LoyaltyTier,
} from '../engine';

// ── Points Calculation ───────────────────────────────────────────────────

describe('calculatePointsFromSpend', () => {
  it('awards 1 point per dollar for standard services', () => {
    expect(calculatePointsFromSpend(100).points).toBe(100);
    expect(calculatePointsFromSpend(275).points).toBe(275);
    expect(calculatePointsFromSpend(2750).points).toBe(2750);
  });

  it('floors fractional amounts', () => {
    expect(calculatePointsFromSpend(99.99).points).toBe(99);
    expect(calculatePointsFromSpend(0.50).points).toBe(0);
  });

  it('returns 0 for negative or zero amounts', () => {
    expect(calculatePointsFromSpend(-50).points).toBe(0);
    expect(calculatePointsFromSpend(0).points).toBe(0);
  });

  it('applies 2x multiplier for membership services', () => {
    const result = calculatePointsFromSpend(100, 'membership');
    expect(result.points).toBe(200);
    expect(result.multiplier).toBe(2.0);
  });

  it('applies 1.5x multiplier for package services', () => {
    const result = calculatePointsFromSpend(100, 'package');
    expect(result.points).toBe(150);
    expect(result.multiplier).toBe(1.5);
  });

  it('doubles points during birthday month', () => {
    const result = calculatePointsFromSpend(100, 'standard', true);
    expect(result.points).toBe(200);
    expect(result.birthdayDoubled).toBe(true);
  });

  it('stacks birthday doubling with membership multiplier', () => {
    const result = calculatePointsFromSpend(100, 'membership', true);
    expect(result.points).toBe(400); // 100 * 2x * 2
    expect(result.birthdayDoubled).toBe(true);
    expect(result.multiplier).toBe(2.0);
  });

  it('stacks birthday doubling with package multiplier', () => {
    const result = calculatePointsFromSpend(200, 'package', true);
    expect(result.points).toBe(600); // 200 * 1.5 * 2
  });

  it('handles large amounts', () => {
    expect(calculatePointsFromSpend(10000).points).toBe(10000);
  });
});

// ── Tier Determination ───────────────────────────────────────────────────

describe('determineTier', () => {
  it('returns Silver for 0 points', () => {
    expect(determineTier(0)).toBe('Silver');
  });

  it('returns Silver below Gold threshold', () => {
    expect(determineTier(1999)).toBe('Silver');
  });

  it('returns Gold at exactly 2000 points', () => {
    expect(determineTier(2000)).toBe('Gold');
  });

  it('returns Gold for mid-range', () => {
    expect(determineTier(3500)).toBe('Gold');
    expect(determineTier(4999)).toBe('Gold');
  });

  it('returns Platinum at exactly 5000 points', () => {
    expect(determineTier(5000)).toBe('Platinum');
  });

  it('returns Platinum above threshold', () => {
    expect(determineTier(15000)).toBe('Platinum');
  });
});

// ── Next Tier ────────────────────────────────────────────────────────────

describe('getNextTier', () => {
  it('returns Gold for Silver', () => expect(getNextTier('Silver')).toBe('Gold'));
  it('returns Platinum for Gold', () => expect(getNextTier('Gold')).toBe('Platinum'));
  it('returns null for Platinum', () => expect(getNextTier('Platinum')).toBeNull());
});

// ── Tier Progress ────────────────────────────────────────────────────────

describe('calculateTierProgress', () => {
  it('shows 0% at Silver start', () => {
    const r = calculateTierProgress(0);
    expect(r.progress).toBe(0);
    expect(r.pointsToNextTier).toBe(2000);
    expect(r.nextTier).toBe('Gold');
  });

  it('shows 50% toward Gold at 1000', () => {
    const r = calculateTierProgress(1000);
    expect(r.progress).toBe(50);
    expect(r.pointsToNextTier).toBe(1000);
  });

  it('shows progress toward Platinum for Gold members', () => {
    const r = calculateTierProgress(3500);
    expect(r.progress).toBe(50);
    expect(r.pointsToNextTier).toBe(1500);
    expect(r.nextTier).toBe('Platinum');
  });

  it('shows 100% for Platinum', () => {
    const r = calculateTierProgress(8000);
    expect(r.progress).toBe(100);
    expect(r.pointsToNextTier).toBe(0);
    expect(r.nextTier).toBeNull();
  });
});

// ── Tier Benefits ────────────────────────────────────────────────────────

describe('getTierBenefits', () => {
  it('Silver has no discount or priority', () => {
    const b = getTierBenefits('Silver');
    expect(b.discountPercent).toBe(0);
    expect(b.priorityBooking).toBe(false);
    expect(b.freeBirthdayTreatment).toBe(false);
  });

  it('Gold has 5% discount + priority booking', () => {
    const b = getTierBenefits('Gold');
    expect(b.discountPercent).toBe(5);
    expect(b.priorityBooking).toBe(true);
  });

  it('Platinum has 10% + birthday treatment + VIP', () => {
    const b = getTierBenefits('Platinum');
    expect(b.discountPercent).toBe(10);
    expect(b.priorityBooking).toBe(true);
    expect(b.freeBirthdayTreatment).toBe(true);
    expect(b.vipEvents).toBe(true);
  });
});

// ── Tier Upgrade ─────────────────────────────────────────────────────────

describe('checkTierUpgrade', () => {
  it('detects Silver to Gold upgrade', () => {
    const r = checkTierUpgrade('Silver', 2000);
    expect(r.upgraded).toBe(true);
    expect(r.newTier).toBe('Gold');
    expect(r.bonusPoints).toBe(250);
  });

  it('detects Gold to Platinum upgrade', () => {
    const r = checkTierUpgrade('Gold', 5000);
    expect(r.upgraded).toBe(true);
    expect(r.newTier).toBe('Platinum');
    expect(r.bonusPoints).toBe(500);
  });

  it('returns false when no upgrade', () => {
    const r = checkTierUpgrade('Silver', 1500);
    expect(r.upgraded).toBe(false);
  });

  it('returns false for same tier', () => {
    const r = checkTierUpgrade('Gold', 3000);
    expect(r.upgraded).toBe(false);
  });
});

// ── Points / Dollar Conversions ──────────────────────────────────────────

describe('pointsToDollars', () => {
  it('converts 100 points to $1', () => expect(pointsToDollars(100)).toBe(1));
  it('converts 2500 points to $25', () => expect(pointsToDollars(2500)).toBe(25));
  it('floors partial dollars', () => expect(pointsToDollars(150)).toBe(1.5));
  it('converts 0 points to $0', () => expect(pointsToDollars(0)).toBe(0));
});

describe('dollarsToPoints', () => {
  it('converts $1 to 100 points', () => expect(dollarsToPoints(1)).toBe(100));
  it('converts $25 to 2500 points', () => expect(dollarsToPoints(25)).toBe(2500));
  it('ceils fractional conversions', () => expect(dollarsToPoints(0.5)).toBe(50));
});

// ── Expiry ───────────────────────────────────────────────────────────────

describe('checkExpiry', () => {
  it('returns false for recent activity', () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 3);
    expect(checkExpiry(recent.toISOString())).toBe(false);
  });

  it('returns true for 12+ months inactivity', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 13);
    expect(checkExpiry(old.toISOString())).toBe(true);
  });

  it('returns true at exactly 12 months', () => {
    const now = new Date(2025, 5, 15);
    const lastActivity = new Date(2024, 5, 15);
    expect(checkExpiry(lastActivity.toISOString(), now)).toBe(true);
  });
});

describe('calculateExpiryDate', () => {
  it('adds 12 months to earn date', () => {
    const expiry = new Date(calculateExpiryDate('2025-01-15T00:00:00.000Z'));
    expect(expiry.getMonth()).toBe(0); // January
    expect(expiry.getFullYear()).toBe(2026);
  });
});

// ── Visit Streak ─────────────────────────────────────────────────────────

describe('checkVisitStreak', () => {
  it('qualifies at 5th visit', () => {
    const now = new Date();
    const lastVisit = new Date(now);
    lastVisit.setDate(lastVisit.getDate() - 10);
    const r = checkVisitStreak(5, lastVisit.toISOString(), now);
    expect(r.qualifies).toBe(true);
    expect(r.bonusPoints).toBe(300);
  });

  it('qualifies at 10th visit', () => {
    const now = new Date();
    const lastVisit = new Date(now);
    lastVisit.setDate(lastVisit.getDate() - 7);
    const r = checkVisitStreak(10, lastVisit.toISOString(), now);
    expect(r.qualifies).toBe(true);
  });

  it('does not qualify at 3rd visit', () => {
    const now = new Date();
    const lastVisit = new Date(now);
    lastVisit.setDate(lastVisit.getDate() - 5);
    const r = checkVisitStreak(3, lastVisit.toISOString(), now);
    expect(r.qualifies).toBe(false);
    expect(r.bonusPoints).toBe(0);
  });

  it('breaks streak after 45+ days', () => {
    const now = new Date();
    const lastVisit = new Date(now);
    lastVisit.setDate(lastVisit.getDate() - 50);
    const r = checkVisitStreak(5, lastVisit.toISOString(), now);
    expect(r.streakBroken).toBe(true);
    expect(r.streakCount).toBe(1);
    expect(r.qualifies).toBe(false);
  });
});

// ── Birthday Month ───────────────────────────────────────────────────────

describe('checkBirthdayMonth', () => {
  it('returns true during birthday month', () => {
    const march = new Date(2025, 2, 15);
    expect(checkBirthdayMonth(3, march)).toBe(true);
  });

  it('returns false outside birthday month', () => {
    const march = new Date(2025, 2, 15);
    expect(checkBirthdayMonth(7, march)).toBe(false);
  });

  it('returns false for undefined birthday', () => {
    expect(checkBirthdayMonth(undefined)).toBe(false);
  });

  it('returns false for invalid month', () => {
    expect(checkBirthdayMonth(0)).toBe(false);
    expect(checkBirthdayMonth(13)).toBe(false);
  });
});

// ── Validate Redemption ──────────────────────────────────────────────────

describe('validateRedemption', () => {
  it('validates sufficient balance', () => {
    const r = validateRedemption(5000, 2500);
    expect(r.valid).toBe(true);
  });

  it('rejects insufficient balance', () => {
    const r = validateRedemption(100, 500);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('Insufficient');
  });

  it('rejects non-multiple-of-100', () => {
    const r = validateRedemption(5000, 250);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('multiples of 100');
  });

  it('rejects zero or negative', () => {
    expect(validateRedemption(5000, 0).valid).toBe(false);
    expect(validateRedemption(5000, -100).valid).toBe(false);
  });
});

// ── Process Transaction ──────────────────────────────────────────────────

describe('processTransaction', () => {
  const baseMember: LoyaltyMember = {
    clientId: 'c-1',
    clientName: 'Test Client',
    email: 'test@test.com',
    totalPointsEarned: 1500,
    totalPointsRedeemed: 0,
    totalPointsExpired: 0,
    currentBalance: 1500,
    tier: 'Silver',
    lifetimeSpend: 1500,
    visitCount: 4,
    lastActivityDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    enrolledDate: '2024-01-01',
    streakCount: 4,
  };

  it('calculates base points for standard service', () => {
    const r = processTransaction(baseMember, 275);
    expect(r.basePoints).toBe(275);
    expect(r.multiplier).toBe(1.0);
  });

  it('applies membership multiplier', () => {
    const r = processTransaction(baseMember, 100, 'membership');
    expect(r.basePoints).toBe(200);
    expect(r.multiplier).toBe(2.0);
  });

  it('triggers visit streak at 5th visit', () => {
    const r = processTransaction(baseMember, 100);
    expect(r.newVisitCount).toBe(5);
    const streakBonus = r.bonuses.find(b => b.type === 'visit_streak');
    expect(streakBonus).toBeDefined();
    expect(streakBonus!.points).toBe(300);
  });

  it('triggers tier upgrade to Gold', () => {
    const member = { ...baseMember, totalPointsEarned: 1800, currentBalance: 1800 };
    const r = processTransaction(member, 250);
    expect(r.tierUpgrade).not.toBeNull();
    expect(r.tierUpgrade!.newTier).toBe('Gold');
    expect(r.tierUpgrade!.bonusPoints).toBe(250);
  });

  it('updates balance correctly', () => {
    const r = processTransaction(baseMember, 500);
    expect(r.newBalance).toBeGreaterThan(baseMember.currentBalance);
  });
});

// ── Award Bonus ──────────────────────────────────────────────────────────

describe('awardBonus', () => {
  const member: LoyaltyMember = {
    clientId: 'c-1', clientName: 'Test', email: 'test@test.com',
    totalPointsEarned: 1000, totalPointsRedeemed: 0, totalPointsExpired: 0,
    currentBalance: 1000, tier: 'Silver', lifetimeSpend: 1000,
    visitCount: 3, lastActivityDate: new Date().toISOString(),
    enrolledDate: '2024-01-01', streakCount: 3,
  };

  it('awards birthday bonus of 200', () => {
    const r = awardBonus(member, 'birthday');
    expect(r.points).toBe(200);
    expect(r.newBalance).toBe(1200);
  });

  it('awards review bonus of 100', () => {
    const r = awardBonus(member, 'review');
    expect(r.points).toBe(100);
  });

  it('awards referral bonus of 500', () => {
    const r = awardBonus(member, 'referral');
    expect(r.points).toBe(500);
    expect(r.newBalance).toBe(1500);
  });
});

// ── Process Redemption ───────────────────────────────────────────────────

describe('processRedemption', () => {
  const member: LoyaltyMember = {
    clientId: 'c-1', clientName: 'Test', email: 'test@test.com',
    totalPointsEarned: 5000, totalPointsRedeemed: 0, totalPointsExpired: 0,
    currentBalance: 5000, tier: 'Gold', lifetimeSpend: 5000,
    visitCount: 10, lastActivityDate: new Date().toISOString(),
    enrolledDate: '2024-01-01', streakCount: 10,
  };

  it('processes valid redemption', () => {
    const r = processRedemption(member, 2500, '$25 credit');
    expect(r.valid).toBe(true);
    expect(r.dollarValue).toBe(25);
    expect(r.newBalance).toBe(2500);
    expect(r.newTotalRedeemed).toBe(2500);
  });

  it('rejects insufficient balance', () => {
    const r = processRedemption(member, 10000, '$100 credit');
    expect(r.valid).toBe(false);
    expect(r.newBalance).toBe(5000);
  });
});

// ── Process Expiry ───────────────────────────────────────────────────────

describe('processExpiry', () => {
  it('identifies inactive members for expiry', () => {
    const now = new Date(2026, 3, 1);
    const members: LoyaltyMember[] = [
      {
        clientId: 'c-1', clientName: 'Active', email: '',
        totalPointsEarned: 1000, totalPointsRedeemed: 0, totalPointsExpired: 0,
        currentBalance: 1000, tier: 'Silver', lifetimeSpend: 1000,
        visitCount: 3, lastActivityDate: new Date(2026, 2, 1).toISOString(),
        enrolledDate: '2024-01-01', streakCount: 3,
      },
      {
        clientId: 'c-2', clientName: 'Lapsed', email: '',
        totalPointsEarned: 2000, totalPointsRedeemed: 0, totalPointsExpired: 0,
        currentBalance: 2000, tier: 'Gold', lifetimeSpend: 2000,
        visitCount: 5, lastActivityDate: new Date(2025, 2, 1).toISOString(),
        enrolledDate: '2024-01-01', streakCount: 5,
      },
    ];

    const expired = processExpiry(members, now);
    expect(expired).toHaveLength(1);
    expect(expired[0].clientId).toBe('c-2');
    expect(expired[0].pointsExpired).toBe(2000);
  });

  it('skips members with zero balance', () => {
    const now = new Date(2026, 3, 1);
    const members: LoyaltyMember[] = [{
      clientId: 'c-1', clientName: 'Empty', email: '',
      totalPointsEarned: 1000, totalPointsRedeemed: 1000, totalPointsExpired: 0,
      currentBalance: 0, tier: 'Silver', lifetimeSpend: 1000,
      visitCount: 3, lastActivityDate: new Date(2024, 1, 1).toISOString(),
      enrolledDate: '2024-01-01', streakCount: 0,
    }];
    expect(processExpiry(members, now)).toHaveLength(0);
  });
});

// ── Build Loyalty Account ────────────────────────────────────────────────

describe('buildLoyaltyAccount', () => {
  const makeTx = (points: number, type: string = 'treatment_spend'): PointsTransaction => ({
    id: `tx-${Math.random()}`,
    clientId: 'c-1',
    type: type as PointsTransaction['type'],
    points,
    balance: 0,
    description: 'Test',
    createdAt: '2024-01-01T00:00:00Z',
  });

  it('builds from empty history', () => {
    const a = buildLoyaltyAccount('c-1', []);
    expect(a.currentBalance).toBe(0);
    expect(a.tier).toBe('Silver');
  });

  it('sums earned points', () => {
    const a = buildLoyaltyAccount('c-1', [makeTx(500), makeTx(300), makeTx(200)]);
    expect(a.totalPointsEarned).toBe(1000);
    expect(a.currentBalance).toBe(1000);
  });

  it('tracks redemptions', () => {
    const a = buildLoyaltyAccount('c-1', [makeTx(2000), makeTx(-500, 'redemption')]);
    expect(a.totalPointsEarned).toBe(2000);
    expect(a.totalPointsRedeemed).toBe(500);
    expect(a.currentBalance).toBe(1500);
    expect(a.tier).toBe('Gold');
  });

  it('never goes below zero', () => {
    const a = buildLoyaltyAccount('c-1', [makeTx(100), makeTx(-200, 'redemption')]);
    expect(a.currentBalance).toBe(0);
  });

  it('tracks expirations separately', () => {
    const a = buildLoyaltyAccount('c-1', [makeTx(1000), makeTx(-200, 'expiration')]);
    expect(a.totalPointsExpired).toBe(200);
    expect(a.currentBalance).toBe(800);
  });
});

// ── Tier Discount ────────────────────────────────────────────────────────

describe('applyTierDiscount', () => {
  it('Silver pays full price', () => {
    const r = applyTierDiscount(275, 'Silver');
    expect(r.finalPrice).toBe(275);
    expect(r.discountAmount).toBe(0);
  });

  it('Gold gets 5% off', () => {
    const r = applyTierDiscount(275, 'Gold');
    expect(r.discountPercent).toBe(5);
    expect(r.discountAmount).toBe(13.75);
    expect(r.finalPrice).toBe(261.25);
  });

  it('Platinum gets 10% off', () => {
    const r = applyTierDiscount(275, 'Platinum');
    expect(r.discountPercent).toBe(10);
    expect(r.discountAmount).toBe(27.5);
    expect(r.finalPrice).toBe(247.5);
  });

  it('preserves original price', () => {
    expect(applyTierDiscount(500, 'Platinum').originalPrice).toBe(500);
  });
});

// ── Analytics ────────────────────────────────────────────────────────────

describe('buildAnalytics', () => {
  it('calculates tier distribution', () => {
    const members: LoyaltyMember[] = [
      makeMember('c-1', 500, 'Silver'),
      makeMember('c-2', 3000, 'Gold'),
      makeMember('c-3', 6000, 'Platinum'),
    ];
    const analytics = buildAnalytics(members, []);
    expect(analytics.tierDistribution.Silver).toBe(1);
    expect(analytics.tierDistribution.Gold).toBe(1);
    expect(analytics.tierDistribution.Platinum).toBe(1);
  });

  it('counts active members within 90 days', () => {
    const now = new Date(2026, 3, 1);
    const members: LoyaltyMember[] = [
      makeMember('c-1', 500, 'Silver', new Date(2026, 2, 15).toISOString()),
      makeMember('c-2', 500, 'Silver', new Date(2025, 10, 1).toISOString()),
    ];
    const analytics = buildAnalytics(members, [], now);
    expect(analytics.activeMembers).toBe(1);
  });

  it('calculates redemption rate', () => {
    const members: LoyaltyMember[] = [
      { ...makeMember('c-1', 1000, 'Silver'), totalPointsRedeemed: 500 },
    ];
    const analytics = buildAnalytics(members, []);
    expect(analytics.redemptionRate).toBe(50);
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe('constants', () => {
  it('points per dollar is 1', () => expect(POINTS_PER_DOLLAR).toBe(1));
  it('referral bonus is 500', () => expect(REFERRAL_BONUS_POINTS).toBe(500));
  it('birthday bonus is 200', () => expect(BIRTHDAY_BONUS_POINTS).toBe(200));
  it('review bonus is 100', () => expect(REVIEW_BONUS_POINTS).toBe(100));
  it('streak bonus is 300', () => expect(VISIT_STREAK_BONUS_POINTS).toBe(300));
  it('streak threshold is 5', () => expect(VISIT_STREAK_THRESHOLD).toBe(5));
  it('100 points = $1', () => expect(POINTS_TO_DOLLAR_RATIO).toBe(100));
  it('expiry is 12 months', () => expect(INACTIVITY_EXPIRY_MONTHS).toBe(12));

  it('multipliers: standard=1, membership=2, package=1.5', () => {
    expect(SERVICE_MULTIPLIERS.standard).toBe(1.0);
    expect(SERVICE_MULTIPLIERS.membership).toBe(2.0);
    expect(SERVICE_MULTIPLIERS.package).toBe(1.5);
  });

  it('tier thresholds ascending', () => {
    expect(TIER_THRESHOLDS.Silver).toBeLessThan(TIER_THRESHOLDS.Gold);
    expect(TIER_THRESHOLDS.Gold).toBeLessThan(TIER_THRESHOLDS.Platinum);
  });
});

describe('generateTransactionId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateTransactionId()));
    expect(ids.size).toBe(50);
  });

  it('starts with pt_ prefix', () => {
    expect(generateTransactionId()).toMatch(/^pt_/);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────

function makeMember(id: string, earned: number, tier: LoyaltyTier, lastActivity?: string): LoyaltyMember {
  return {
    clientId: id,
    clientName: `Client ${id}`,
    email: `${id}@test.com`,
    totalPointsEarned: earned,
    totalPointsRedeemed: 0,
    totalPointsExpired: 0,
    currentBalance: earned,
    tier,
    lifetimeSpend: earned,
    visitCount: 5,
    lastActivityDate: lastActivity || new Date().toISOString(),
    enrolledDate: '2024-01-01',
    streakCount: 5,
  };
}
