import { describe, it, expect } from 'vitest';
import {
  calculatePointsFromSpend,
  determineTier,
  getNextTier,
  calculateTierProgress,
  getTierBenefits,
  pointsToDollars,
  dollarsToPoints,
  checkExpiry,
  calculateExpiryDate,
  validateRedemption,
  getTierDiscount,
  applyTierDiscount,
  getBirthdayBonus,
  getReferralBonus,
  POINTS_PER_DOLLAR,
  SERVICE_MULTIPLIERS,
  TIER_THRESHOLDS,
} from '../engine';

describe('points calculation', () => {
  it('awards base points per dollar spent', () => {
    const result = calculatePointsFromSpend(100, 'standard');
    expect(result.points).toBeGreaterThan(0);
    expect(result.multiplier).toBeGreaterThan(0);
  });

  it('doubles points during birthday month', () => {
    const normal = calculatePointsFromSpend(100, 'standard', false);
    const birthday = calculatePointsFromSpend(100, 'standard', true);
    expect(birthday.points).toBe(normal.points * 2);
    expect(birthday.birthdayDoubled).toBe(true);
  });

  it('returns 0 points for zero spend', () => {
    const result = calculatePointsFromSpend(0, 'standard');
    expect(result.points).toBe(0);
  });

  it('exports POINTS_PER_DOLLAR constant', () => {
    expect(POINTS_PER_DOLLAR).toBe(1);
  });

  it('exports SERVICE_MULTIPLIERS for known types', () => {
    expect(typeof SERVICE_MULTIPLIERS.standard).toBe('number');
    expect(typeof SERVICE_MULTIPLIERS.membership).toBe('number');
    expect(typeof SERVICE_MULTIPLIERS.package).toBe('number');
  });
});

describe('tier determination', () => {
  it('returns Silver for zero points', () => {
    expect(determineTier(0)).toBe('Silver');
  });

  it('returns Platinum for very high points', () => {
    expect(determineTier(999999)).toBe('Platinum');
  });

  it('exports TIER_THRESHOLDS', () => {
    expect(TIER_THRESHOLDS.Silver).toBeDefined();
    expect(TIER_THRESHOLDS.Gold).toBeDefined();
    expect(TIER_THRESHOLDS.Platinum).toBeDefined();
  });
});

describe('getNextTier', () => {
  it('returns Gold as next tier for Silver', () => {
    expect(getNextTier('Silver')).toBe('Gold');
  });

  it('returns null for Platinum (highest tier)', () => {
    expect(getNextTier('Platinum')).toBeNull();
  });
});

describe('calculateTierProgress', () => {
  it('returns progress and nextTier', () => {
    const result = calculateTierProgress(0);
    expect(result).toHaveProperty('progress');
    expect(result).toHaveProperty('pointsToNextTier');
    expect(result).toHaveProperty('nextTier');
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(100);
  });
});

describe('getTierBenefits', () => {
  it('returns benefits for each tier', () => {
    for (const tier of ['Silver', 'Gold', 'Platinum'] as const) {
      const benefits = getTierBenefits(tier);
      expect(benefits).toBeDefined();
    }
  });
});

describe('point conversion', () => {
  it('converts points to dollars', () => {
    expect(typeof pointsToDollars(100)).toBe('number');
    expect(pointsToDollars(0)).toBe(0);
  });

  it('converts dollars to points', () => {
    expect(typeof dollarsToPoints(100)).toBe('number');
    expect(dollarsToPoints(0)).toBe(0);
  });
});

describe('expiry checks', () => {
  it('returns false for recent activity', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 30);
    expect(checkExpiry(recent.toISOString())).toBe(false);
  });

  it('returns true for very old activity', () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 2);
    expect(checkExpiry(old.toISOString())).toBe(true);
  });

  it('calculates expiry date as a future date', () => {
    const expiry = calculateExpiryDate(new Date().toISOString());
    expect(new Date(expiry).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('validateRedemption', () => {
  it('rejects redemption with insufficient points', () => {
    const result = validateRedemption(50, 100);
    expect(result.valid).toBe(false);
  });

  it('accepts redemption with sufficient points (multiple of 100)', () => {
    const result = validateRedemption(200, 100);
    expect(result.valid).toBe(true);
  });
});

describe('tier discounts', () => {
  it('returns a discount for Platinum', () => {
    expect(getTierDiscount('Platinum')).toBeGreaterThan(0);
  });

  it('applies discount to price', () => {
    const { finalPrice, discountAmount } = applyTierDiscount(100, 'Platinum');
    expect(finalPrice).toBeLessThanOrEqual(100);
    expect(discountAmount).toBeGreaterThanOrEqual(0);
  });
});

describe('bonuses', () => {
  it('returns birthday bonus for each tier', () => {
    expect(getBirthdayBonus('Silver')).toBeGreaterThanOrEqual(0);
    expect(getBirthdayBonus('Gold')).toBeGreaterThanOrEqual(getBirthdayBonus('Silver'));
    expect(getBirthdayBonus('Platinum')).toBeGreaterThanOrEqual(getBirthdayBonus('Gold'));
  });

  it('returns referral bonus for each tier', () => {
    expect(getReferralBonus('Silver')).toBeGreaterThanOrEqual(0);
    expect(getReferralBonus('Gold')).toBeGreaterThanOrEqual(getReferralBonus('Silver'));
    expect(getReferralBonus('Platinum')).toBeGreaterThanOrEqual(getReferralBonus('Gold'));
  });
});
