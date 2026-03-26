/**
 * Reward Catalog - Rani Beauty Clinic Loyalty Program
 *
 * Available rewards redeemable with loyalty points.
 * All point costs and item details for the loyalty reward store.
 *
 * Reward tiers:
 * - $25 credit (2500 pts)
 * - $50 credit (5000 pts)
 * - Free HydraFacial Express (7500 pts)
 * - Free Vitamin Injection (3000 pts)
 * - Upgrade to Signature HydraFacial (2000 pts)
 * - Free LED add-on (1500 pts)
 * - Birthday month: double points on all purchases
 */

import type { LoyaltyTier } from './engine';

// ── Types ────────────────────────────────────────────────────────────────

export type RewardCategory = 'credit' | 'treatment' | 'upgrade' | 'addon' | 'experience';

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  dollarValue: number;
  category: RewardCategory;
  minimumTier: LoyaltyTier;
  available: boolean;
  imageUrl?: string;
  serviceName?: string; // linked Rani service name
  limitPerMonth?: number;
  featured: boolean;
}

export interface RedemptionRequest {
  clientId: string;
  rewardId: string;
  pointsToRedeem: number;
}

export interface RedemptionResult {
  success: boolean;
  reward: LoyaltyReward | null;
  pointsDeducted: number;
  creditAmount: number;
  error?: string;
}

// ── Rewards Catalog ──────────────────────────────────────────────────────

export const REWARDS_CATALOG: LoyaltyReward[] = [
  // Credits
  {
    id: 'reward-25-credit',
    name: '$25 Treatment Credit',
    description: 'Apply $25 toward any Rani Beauty Clinic service.',
    pointsCost: 2500,
    dollarValue: 25,
    category: 'credit',
    minimumTier: 'Silver',
    available: true,
    featured: false,
  },
  {
    id: 'reward-50-credit',
    name: '$50 Treatment Credit',
    description: 'Apply $50 toward any Rani Beauty Clinic service.',
    pointsCost: 5000,
    dollarValue: 50,
    category: 'credit',
    minimumTier: 'Silver',
    available: true,
    featured: true,
  },

  // Treatments
  {
    id: 'reward-hydrafacial-express',
    name: 'Free HydraFacial Express',
    description: 'Complimentary HydraFacial Express treatment - deep cleanse + hydration in 30 minutes.',
    pointsCost: 7500,
    dollarValue: 175,
    category: 'treatment',
    minimumTier: 'Gold',
    available: true,
    serviceName: 'HydraFacial Express',
    featured: true,
  },
  {
    id: 'reward-vitamin-injection',
    name: 'Free Vitamin Injection',
    description: 'Choose from Vitamin D3, B12, Tri-Immune, or Glutathione injection - on us.',
    pointsCost: 3000,
    dollarValue: 75,
    category: 'treatment',
    minimumTier: 'Silver',
    available: true,
    serviceName: 'Wellness Injection',
    featured: false,
  },

  // Upgrades
  {
    id: 'reward-signature-upgrade',
    name: 'Upgrade to Signature HydraFacial',
    description: 'Upgrade your booked HydraFacial to the Signature experience with LED therapy + boost serum.',
    pointsCost: 2000,
    dollarValue: 100,
    category: 'upgrade',
    minimumTier: 'Silver',
    available: true,
    serviceName: 'HydraFacial Signature',
    featured: false,
  },

  // Add-ons
  {
    id: 'reward-led-addon',
    name: 'Free LED Add-On',
    description: 'Add complimentary LED light therapy to any facial or skin treatment.',
    pointsCost: 1500,
    dollarValue: 50,
    category: 'addon',
    minimumTier: 'Silver',
    available: true,
    featured: false,
  },

  // Premium tier rewards
  {
    id: 'reward-100-credit',
    name: '$100 Treatment Credit',
    description: 'Apply $100 toward any premium Rani Beauty Clinic service.',
    pointsCost: 10000,
    dollarValue: 100,
    category: 'credit',
    minimumTier: 'Gold',
    available: true,
    featured: false,
  },
  {
    id: 'reward-vip-experience',
    name: 'VIP Treatment Day',
    description: 'Extended appointment with luxury add-ons, champagne, and a curated skincare gift.',
    pointsCost: 15000,
    dollarValue: 500,
    category: 'experience',
    minimumTier: 'Platinum',
    available: true,
    limitPerMonth: 1,
    featured: true,
  },
];

// ── Catalog Functions ────────────────────────────────────────────────────

/**
 * Get all rewards available to a member's tier.
 */
export function getAvailableRewards(
  tier: LoyaltyTier,
  currentBalance: number,
): (LoyaltyReward & { canAfford: boolean })[] {
  const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  const memberTierIdx = tierOrder.indexOf(tier);

  return REWARDS_CATALOG
    .filter(r => r.available && tierOrder.indexOf(r.minimumTier) <= memberTierIdx)
    .map(r => ({
      ...r,
      canAfford: currentBalance >= r.pointsCost,
    }))
    .sort((a, b) => a.pointsCost - b.pointsCost);
}

/**
 * Get featured rewards for display.
 */
export function getFeaturedRewards(): LoyaltyReward[] {
  return REWARDS_CATALOG.filter(r => r.featured && r.available);
}

/**
 * Find a reward by ID.
 */
export function getRewardById(rewardId: string): LoyaltyReward | null {
  return REWARDS_CATALOG.find(r => r.id === rewardId) || null;
}

/**
 * Validate if a member can redeem a specific reward.
 */
export function canRedeem(
  rewardId: string,
  tier: LoyaltyTier,
  currentBalance: number,
): { allowed: boolean; reason?: string } {
  const reward = getRewardById(rewardId);
  if (!reward) {
    return { allowed: false, reason: 'Reward not found' };
  }

  if (!reward.available) {
    return { allowed: false, reason: 'This reward is currently unavailable' };
  }

  const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  if (tierOrder.indexOf(tier) < tierOrder.indexOf(reward.minimumTier)) {
    return { allowed: false, reason: `Requires ${reward.minimumTier} tier or above` };
  }

  if (currentBalance < reward.pointsCost) {
    const shortfall = reward.pointsCost - currentBalance;
    return { allowed: false, reason: `Insufficient points. Need ${shortfall} more points.` };
  }

  return { allowed: true };
}

/**
 * Process a reward redemption.
 */
export function processRewardRedemption(
  rewardId: string,
  tier: LoyaltyTier,
  currentBalance: number,
): RedemptionResult {
  const validation = canRedeem(rewardId, tier, currentBalance);
  if (!validation.allowed) {
    return {
      success: false,
      reward: null,
      pointsDeducted: 0,
      creditAmount: 0,
      error: validation.reason,
    };
  }

  const reward = getRewardById(rewardId)!;
  return {
    success: true,
    reward,
    pointsDeducted: reward.pointsCost,
    creditAmount: reward.dollarValue,
  };
}

/**
 * Get rewards grouped by category.
 */
export function getRewardsByCategory(): Record<RewardCategory, LoyaltyReward[]> {
  const grouped: Record<RewardCategory, LoyaltyReward[]> = {
    credit: [],
    treatment: [],
    upgrade: [],
    addon: [],
    experience: [],
  };

  for (const reward of REWARDS_CATALOG) {
    if (reward.available) {
      grouped[reward.category].push(reward);
    }
  }

  return grouped;
}

/**
 * Get total number of available rewards for a tier.
 */
export function getRewardCount(tier: LoyaltyTier): number {
  const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  const memberTierIdx = tierOrder.indexOf(tier);
  return REWARDS_CATALOG.filter(r =>
    r.available && tierOrder.indexOf(r.minimumTier) <= memberTierIdx
  ).length;
}

/**
 * Get category display labels.
 */
export function getCategoryLabel(category: RewardCategory): string {
  const labels: Record<RewardCategory, string> = {
    credit: 'Treatment Credits',
    treatment: 'Complimentary Treatments',
    upgrade: 'Service Upgrades',
    addon: 'Free Add-Ons',
    experience: 'VIP Experiences',
  };
  return labels[category];
}

/**
 * Calculate how many times a reward can be redeemed with current balance.
 */
export function maxRedemptions(rewardId: string, currentBalance: number): number {
  const reward = getRewardById(rewardId);
  if (!reward) return 0;
  return Math.floor(currentBalance / reward.pointsCost);
}
