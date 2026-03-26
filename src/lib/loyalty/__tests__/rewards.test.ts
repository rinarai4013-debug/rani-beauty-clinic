import { describe, it, expect } from 'vitest';
import {
  REWARDS_CATALOG,
  getAvailableRewards,
  getFeaturedRewards,
  getRewardById,
  canRedeem,
  processRewardRedemption,
  getRewardsByCategory,
  getRewardCount,
  getCategoryLabel,
  maxRedemptions,
  type LoyaltyReward,
  type RewardCategory,
} from '../rewards';

// ── Catalog Structure ────────────────────────────────────────────────────

describe('REWARDS_CATALOG', () => {
  it('has all required rewards', () => {
    const ids = REWARDS_CATALOG.map(r => r.id);
    expect(ids).toContain('reward-25-credit');
    expect(ids).toContain('reward-50-credit');
    expect(ids).toContain('reward-hydrafacial-express');
    expect(ids).toContain('reward-vitamin-injection');
    expect(ids).toContain('reward-signature-upgrade');
    expect(ids).toContain('reward-led-addon');
  });

  it('has correct point costs for key rewards', () => {
    const find = (id: string) => REWARDS_CATALOG.find(r => r.id === id)!;
    expect(find('reward-25-credit').pointsCost).toBe(2500);
    expect(find('reward-50-credit').pointsCost).toBe(5000);
    expect(find('reward-hydrafacial-express').pointsCost).toBe(7500);
    expect(find('reward-vitamin-injection').pointsCost).toBe(3000);
    expect(find('reward-signature-upgrade').pointsCost).toBe(2000);
    expect(find('reward-led-addon').pointsCost).toBe(1500);
  });

  it('all rewards have positive point costs', () => {
    for (const r of REWARDS_CATALOG) {
      expect(r.pointsCost).toBeGreaterThan(0);
    }
  });

  it('all rewards have positive dollar values', () => {
    for (const r of REWARDS_CATALOG) {
      expect(r.dollarValue).toBeGreaterThan(0);
    }
  });

  it('all rewards have unique IDs', () => {
    const ids = REWARDS_CATALOG.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Available Rewards ────────────────────────────────────────────────────

describe('getAvailableRewards', () => {
  it('Silver members see Silver-tier rewards only', () => {
    const rewards = getAvailableRewards('Silver', 50000);
    const higherTier = rewards.filter(r => r.minimumTier === 'Gold' || r.minimumTier === 'Platinum');
    expect(higherTier.length).toBe(0);
    expect(rewards.length).toBeGreaterThan(0);
  });

  it('Gold members see Silver + Gold rewards', () => {
    const rewards = getAvailableRewards('Gold', 50000);
    const platOnly = rewards.filter(r => r.minimumTier === 'Platinum');
    expect(platOnly.length).toBe(0);
    expect(rewards.length).toBeGreaterThan(getAvailableRewards('Silver', 50000).length);
  });

  it('Platinum members see all rewards', () => {
    const rewards = getAvailableRewards('Platinum', 50000);
    const available = REWARDS_CATALOG.filter(r => r.available);
    expect(rewards.length).toBe(available.length);
  });

  it('marks canAfford based on balance', () => {
    const rewards = getAvailableRewards('Platinum', 2000);
    const affordable = rewards.filter(r => r.canAfford);
    const unaffordable = rewards.filter(r => !r.canAfford);
    expect(affordable.length).toBeGreaterThan(0);
    expect(unaffordable.length).toBeGreaterThan(0);
  });

  it('sorts by points cost ascending', () => {
    const rewards = getAvailableRewards('Platinum', 50000);
    for (let i = 1; i < rewards.length; i++) {
      expect(rewards[i].pointsCost).toBeGreaterThanOrEqual(rewards[i - 1].pointsCost);
    }
  });
});

// ── Featured Rewards ─────────────────────────────────────────────────────

describe('getFeaturedRewards', () => {
  it('returns only featured rewards', () => {
    const featured = getFeaturedRewards();
    expect(featured.length).toBeGreaterThan(0);
    for (const r of featured) {
      expect(r.featured).toBe(true);
    }
  });

  it('excludes unavailable rewards', () => {
    const featured = getFeaturedRewards();
    for (const r of featured) {
      expect(r.available).toBe(true);
    }
  });
});

// ── Get Reward By ID ─────────────────────────────────────────────────────

describe('getRewardById', () => {
  it('finds existing reward', () => {
    const r = getRewardById('reward-25-credit');
    expect(r).not.toBeNull();
    expect(r!.name).toContain('$25');
  });

  it('returns null for unknown ID', () => {
    expect(getRewardById('nonexistent')).toBeNull();
  });
});

// ── Can Redeem ───────────────────────────────────────────────────────────

describe('canRedeem', () => {
  it('allows with sufficient balance and tier', () => {
    const r = canRedeem('reward-led-addon', 'Silver', 2000);
    expect(r.allowed).toBe(true);
  });

  it('rejects insufficient balance', () => {
    const r = canRedeem('reward-25-credit', 'Silver', 100);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('Insufficient');
  });

  it('rejects insufficient tier', () => {
    const r = canRedeem('reward-vip-experience', 'Silver', 50000);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('Platinum');
  });

  it('rejects unknown reward', () => {
    const r = canRedeem('fake-id', 'Platinum', 50000);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('Reward not found');
  });
});

// ── Process Reward Redemption ────────────────────────────────────────────

describe('processRewardRedemption', () => {
  it('processes valid redemption', () => {
    const r = processRewardRedemption('reward-25-credit', 'Silver', 5000);
    expect(r.success).toBe(true);
    expect(r.reward).not.toBeNull();
    expect(r.pointsDeducted).toBe(2500);
    expect(r.creditAmount).toBe(25);
  });

  it('fails for insufficient balance', () => {
    const r = processRewardRedemption('reward-50-credit', 'Silver', 100);
    expect(r.success).toBe(false);
    expect(r.error).toContain('Insufficient');
  });

  it('fails for insufficient tier', () => {
    const r = processRewardRedemption('reward-hydrafacial-express', 'Silver', 50000);
    expect(r.success).toBe(false);
    expect(r.error).toContain('Gold');
  });
});

// ── Rewards By Category ──────────────────────────────────────────────────

describe('getRewardsByCategory', () => {
  it('groups rewards into categories', () => {
    const grouped = getRewardsByCategory();
    expect(grouped.credit.length).toBeGreaterThan(0);
    expect(grouped.addon.length).toBeGreaterThan(0);
  });

  it('covers all category types', () => {
    const grouped = getRewardsByCategory();
    const categories = Object.keys(grouped) as RewardCategory[];
    expect(categories).toContain('credit');
    expect(categories).toContain('treatment');
    expect(categories).toContain('upgrade');
    expect(categories).toContain('addon');
    expect(categories).toContain('experience');
  });
});

// ── Reward Count ─────────────────────────────────────────────────────────

describe('getRewardCount', () => {
  it('Platinum sees more rewards than Silver', () => {
    expect(getRewardCount('Platinum')).toBeGreaterThan(getRewardCount('Silver'));
  });

  it('Gold sees more than Silver', () => {
    expect(getRewardCount('Gold')).toBeGreaterThanOrEqual(getRewardCount('Silver'));
  });
});

// ── Category Labels ──────────────────────────────────────────────────────

describe('getCategoryLabel', () => {
  it('returns readable labels', () => {
    expect(getCategoryLabel('credit')).toBe('Treatment Credits');
    expect(getCategoryLabel('treatment')).toBe('Complimentary Treatments');
    expect(getCategoryLabel('upgrade')).toBe('Service Upgrades');
    expect(getCategoryLabel('addon')).toBe('Free Add-Ons');
    expect(getCategoryLabel('experience')).toBe('VIP Experiences');
  });
});

// ── Max Redemptions ──────────────────────────────────────────────────────

describe('maxRedemptions', () => {
  it('calculates how many times reward can be redeemed', () => {
    expect(maxRedemptions('reward-25-credit', 7500)).toBe(3);
    expect(maxRedemptions('reward-25-credit', 2500)).toBe(1);
    expect(maxRedemptions('reward-25-credit', 1000)).toBe(0);
  });

  it('returns 0 for unknown reward', () => {
    expect(maxRedemptions('nonexistent', 50000)).toBe(0);
  });
});
