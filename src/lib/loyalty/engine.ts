/**
 * Loyalty Engine - Rani Beauty Clinic
 *
 * Complete loyalty system with points calculation, tiered membership,
 * bonus multipliers, expiry handling, and special bonuses.
 *
 * Points: 1 point per $1 spent (base rate)
 * Multipliers: 2x membership services, 1.5x packages
 * Tiers: Silver (0-1999), Gold (2000-4999), Platinum (5000+)
 * Tier benefits: Gold = 5% discount + priority booking
 *                Platinum = 10% + free birthday treatment + VIP events
 * Redemption: 100 points = $1 credit
 * Expiry: 12 months of inactivity
 * Special bonuses: birthday (200), review (100), referral (500), 5th visit streak (300)
 */

// ── Types ────────────────────────────────────────────────────────────────

export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';
export type ServiceType = 'standard' | 'membership' | 'package';
export type BonusType = 'birthday' | 'review' | 'referral' | 'visit_streak' | 'tier_up';

export type PointsTransactionType =
  | 'treatment_spend'
  | 'referral_bonus'
  | 'birthday_bonus'
  | 'review_bonus'
  | 'visit_streak_bonus'
  | 'tier_up_bonus'
  | 'redemption'
  | 'expiration'
  | 'manual_adjustment';

export interface LoyaltyMember {
  clientId: string;
  clientName: string;
  email: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  currentBalance: number;
  tier: LoyaltyTier;
  lifetimeSpend: number;
  visitCount: number;
  lastActivityDate: string; // ISO date
  enrolledDate: string;
  birthdayMonth?: number; // 1-12
  streakCount: number; // consecutive visits within streak window
}

export interface PointsTransaction {
  id: string;
  clientId: string;
  type: PointsTransactionType;
  points: number; // positive = earned, negative = redeemed/expired
  balance: number; // balance after transaction
  description: string;
  metadata?: {
    transactionId?: string;
    amountSpent?: number;
    multiplier?: number;
    bonusType?: BonusType;
    rewardId?: string;
    serviceType?: ServiceType;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface TierBenefits {
  tier: LoyaltyTier;
  discountPercent: number;
  priorityBooking: boolean;
  freeBirthdayTreatment: boolean;
  vipEvents: boolean;
  birthdayBonus: number;
  referralBonus: number;
  freeAddons: string[];
  description: string;
}

export interface LoyaltyAccount {
  clientId: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  currentBalance: number;
  tier: LoyaltyTier;
  tierProgress: number;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  benefits: TierBenefits;
}

export interface BonusBreakdown {
  type: BonusType;
  points: number;
  description: string;
}

export interface TransactionResult {
  basePoints: number;
  multiplier: number;
  birthdayDoubled: boolean;
  bonuses: BonusBreakdown[];
  totalPoints: number;
  tierUpgrade: { upgraded: boolean; newTier: LoyaltyTier; bonusPoints: number } | null;
  newBalance: number;
  newVisitCount: number;
  newStreakCount: number;
}

export interface LoyaltyAnalytics {
  totalMembers: number;
  activeMembers: number;
  tierDistribution: Record<LoyaltyTier, number>;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  pointsInCirculation: number;
  redemptionRate: number;
  averageBalance: number;
  topMembers: { clientId: string; clientName: string; balance: number; tier: LoyaltyTier }[];
  recentTransactions: PointsTransaction[];
  monthlyIssuance: { month: string; earned: number; redeemed: number }[];
}

// ── Constants ────────────────────────────────────────────────────────────

export const POINTS_PER_DOLLAR = 1;

export const SERVICE_MULTIPLIERS: Record<ServiceType, number> = {
  standard: 1.0,
  membership: 2.0,
  package: 1.5,
};

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  Silver: 0,
  Gold: 2000,
  Platinum: 5000,
};

export const TIER_BENEFITS_MAP: Record<LoyaltyTier, TierBenefits> = {
  Silver: {
    tier: 'Silver',
    discountPercent: 0,
    priorityBooking: false,
    freeBirthdayTreatment: false,
    vipEvents: false,
    birthdayBonus: 200,
    referralBonus: 500,
    freeAddons: [],
    description: 'Welcome to the Rani Loyalty family. Earn 1 point per $1 spent.',
  },
  Gold: {
    tier: 'Gold',
    discountPercent: 5,
    priorityBooking: true,
    freeBirthdayTreatment: false,
    vipEvents: false,
    birthdayBonus: 200,
    referralBonus: 500,
    freeAddons: ['LED light therapy add-on'],
    description: '5% discount on all services + priority booking access.',
  },
  Platinum: {
    tier: 'Platinum',
    discountPercent: 10,
    priorityBooking: true,
    freeBirthdayTreatment: true,
    vipEvents: true,
    birthdayBonus: 200,
    referralBonus: 500,
    freeAddons: ['LED light therapy add-on', 'Complimentary skincare sample'],
    description: '10% discount + complimentary birthday treatment + VIP event invitations.',
  },
};

// Bonus point values
export const REFERRAL_BONUS_POINTS = 500;
export const BIRTHDAY_BONUS_POINTS = 200;
export const REVIEW_BONUS_POINTS = 100;
export const VISIT_STREAK_BONUS_POINTS = 300;
export const VISIT_STREAK_THRESHOLD = 5; // every 5th visit
export const STREAK_WINDOW_DAYS = 45; // max days between visits
export const INACTIVITY_EXPIRY_MONTHS = 12;
export const POINTS_TO_DOLLAR_RATIO = 100; // 100 points = $1
export const TIER_UP_BONUS: Record<LoyaltyTier, number> = {
  Silver: 0,
  Gold: 250,
  Platinum: 500,
};

// ── Core Engine Functions ────────────────────────────────────────────────

/**
 * Calculate points earned from a treatment spend amount.
 * Applies service type multiplier: 1x standard, 2x membership, 1.5x package.
 * Doubles points during birthday month.
 */
export function calculatePointsFromSpend(
  amountInDollars: number,
  serviceType: ServiceType = 'standard',
  isBirthdayMonth: boolean = false,
): { points: number; multiplier: number; birthdayDoubled: boolean } {
  if (amountInDollars <= 0) return { points: 0, multiplier: 1.0, birthdayDoubled: false };

  const multiplier = SERVICE_MULTIPLIERS[serviceType];
  let points = Math.floor(amountInDollars * POINTS_PER_DOLLAR * multiplier);
  let birthdayDoubled = false;

  if (isBirthdayMonth) {
    points *= 2;
    birthdayDoubled = true;
  }

  return { points, multiplier, birthdayDoubled };
}

/**
 * Determine the loyalty tier based on total lifetime points earned.
 */
export function determineTier(totalPointsEarned: number): LoyaltyTier {
  if (totalPointsEarned >= TIER_THRESHOLDS.Platinum) return 'Platinum';
  if (totalPointsEarned >= TIER_THRESHOLDS.Gold) return 'Gold';
  return 'Silver';
}

/**
 * Get the next tier above the current one, or null if already at top.
 */
export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const tiers: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  const idx = tiers.indexOf(currentTier);
  return idx < tiers.length - 1 ? tiers[idx + 1] : null;
}

/**
 * Calculate progress percentage toward the next tier.
 */
export function calculateTierProgress(totalPointsEarned: number): {
  progress: number;
  pointsToNextTier: number;
  nextTier: LoyaltyTier | null;
} {
  const currentTier = determineTier(totalPointsEarned);
  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    return { progress: 100, pointsToNextTier: 0, nextTier: null };
  }

  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];
  const range = nextThreshold - currentThreshold;
  const pointsInRange = totalPointsEarned - currentThreshold;
  const progress = Math.min(Math.round((pointsInRange / range) * 100), 100);
  const pointsToNextTier = Math.max(nextThreshold - totalPointsEarned, 0);

  return { progress, pointsToNextTier, nextTier };
}

/**
 * Get benefits for a given tier.
 */
export function getTierBenefits(tier: LoyaltyTier): TierBenefits {
  return TIER_BENEFITS_MAP[tier];
}

/**
 * Check if member should receive a tier upgrade.
 */
export function checkTierUpgrade(
  currentTier: LoyaltyTier,
  newLifetimeEarned: number,
): { upgraded: boolean; newTier: LoyaltyTier; bonusPoints: number } {
  const newTier = determineTier(newLifetimeEarned);
  const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  const currentIdx = tierOrder.indexOf(currentTier);
  const newIdx = tierOrder.indexOf(newTier);

  if (newIdx > currentIdx) {
    return { upgraded: true, newTier, bonusPoints: TIER_UP_BONUS[newTier] };
  }
  return { upgraded: false, newTier: currentTier, bonusPoints: 0 };
}

/**
 * Convert points to dollar credit value. 100 points = $1.
 */
export function pointsToDollars(points: number): number {
  return Math.floor(points / POINTS_TO_DOLLAR_RATIO * 100) / 100;
}

/**
 * Convert dollar amount to points.
 */
export function dollarsToPoints(dollars: number): number {
  return Math.ceil(dollars * POINTS_TO_DOLLAR_RATIO);
}

/**
 * Check if points should expire based on inactivity.
 * Points expire after 12 months of no activity.
 */
export function checkExpiry(lastActivityDate: string, now?: Date): boolean {
  const lastActivity = new Date(lastActivityDate);
  const currentDate = now || new Date();
  const monthsDiff =
    (currentDate.getFullYear() - lastActivity.getFullYear()) * 12 +
    (currentDate.getMonth() - lastActivity.getMonth());
  return monthsDiff >= INACTIVITY_EXPIRY_MONTHS;
}

/**
 * Calculate the expiry date for points.
 */
export function calculateExpiryDate(earnDate: string): string {
  const date = new Date(earnDate);
  date.setMonth(date.getMonth() + INACTIVITY_EXPIRY_MONTHS);
  return date.toISOString();
}

/**
 * Check if a member qualifies for a visit streak bonus.
 * Awards 300 points every 5th consecutive visit (within 45-day window).
 */
export function checkVisitStreak(
  newVisitCount: number,
  lastVisitDate: string | null,
  currentDate?: Date,
): { qualifies: boolean; streakCount: number; bonusPoints: number; streakBroken: boolean } {
  const now = currentDate || new Date();

  // Check if streak is broken (more than 45 days since last visit)
  if (lastVisitDate) {
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > STREAK_WINDOW_DAYS) {
      return { qualifies: false, streakCount: 1, bonusPoints: 0, streakBroken: true };
    }
  }

  const qualifies = newVisitCount > 0 && newVisitCount % VISIT_STREAK_THRESHOLD === 0;
  return {
    qualifies,
    streakCount: newVisitCount,
    bonusPoints: qualifies ? VISIT_STREAK_BONUS_POINTS : 0,
    streakBroken: false,
  };
}

/**
 * Check if member qualifies for birthday bonus.
 */
export function checkBirthdayMonth(
  birthdayMonth: number | undefined,
  currentDate?: Date,
): boolean {
  if (!birthdayMonth || birthdayMonth < 1 || birthdayMonth > 12) return false;
  const now = currentDate || new Date();
  return now.getMonth() + 1 === birthdayMonth;
}

/**
 * Validate a redemption request.
 */
export function validateRedemption(
  currentBalance: number,
  pointsToRedeem: number,
): { valid: boolean; error?: string } {
  if (pointsToRedeem <= 0) {
    return { valid: false, error: 'Points to redeem must be positive' };
  }
  if (pointsToRedeem > currentBalance) {
    return { valid: false, error: `Insufficient balance. Current: ${currentBalance}, Requested: ${pointsToRedeem}` };
  }
  if (pointsToRedeem % 100 !== 0) {
    return { valid: false, error: 'Points must be redeemed in multiples of 100' };
  }
  return { valid: true };
}

/**
 * Process a purchase and calculate all applicable points + bonuses.
 */
export function processTransaction(
  member: LoyaltyMember,
  amountSpent: number,
  serviceType: ServiceType = 'standard',
  currentDate?: Date,
): TransactionResult {
  const now = currentDate || new Date();
  const isBirthdayMonth = checkBirthdayMonth(member.birthdayMonth, now);
  const { points: basePoints, multiplier, birthdayDoubled } =
    calculatePointsFromSpend(amountSpent, serviceType, isBirthdayMonth);

  const bonuses: BonusBreakdown[] = [];

  // Visit streak
  const newVisitCount = member.visitCount + 1;
  const streak = checkVisitStreak(newVisitCount, member.lastActivityDate, now);
  if (streak.qualifies) {
    bonuses.push({
      type: 'visit_streak',
      points: streak.bonusPoints,
      description: `${VISIT_STREAK_THRESHOLD}th visit streak bonus`,
    });
  }

  const bonusTotal = bonuses.reduce((sum, b) => sum + b.points, 0);
  let totalPoints = basePoints + bonusTotal;
  const newLifetimeEarned = member.totalPointsEarned + totalPoints;

  // Tier upgrade check
  const tierUpgrade = checkTierUpgrade(member.tier, newLifetimeEarned);
  if (tierUpgrade.upgraded && tierUpgrade.bonusPoints > 0) {
    bonuses.push({
      type: 'tier_up',
      points: tierUpgrade.bonusPoints,
      description: `Welcome to ${tierUpgrade.newTier} tier`,
    });
    totalPoints += tierUpgrade.bonusPoints;
  }

  const newBalance = member.currentBalance + totalPoints;

  return {
    basePoints,
    multiplier,
    birthdayDoubled,
    bonuses,
    totalPoints,
    tierUpgrade: tierUpgrade.upgraded ? tierUpgrade : null,
    newBalance,
    newVisitCount,
    newStreakCount: streak.streakCount,
  };
}

/**
 * Award a special bonus (birthday, review, referral).
 */
export function awardBonus(
  member: LoyaltyMember,
  bonusType: BonusType,
): { points: number; newBalance: number; newLifetimeEarned: number; description: string } {
  const bonusMap: Record<BonusType, number> = {
    birthday: BIRTHDAY_BONUS_POINTS,
    review: REVIEW_BONUS_POINTS,
    referral: REFERRAL_BONUS_POINTS,
    visit_streak: VISIT_STREAK_BONUS_POINTS,
    tier_up: TIER_UP_BONUS[member.tier] || 0,
  };

  const points = bonusMap[bonusType];
  const descriptions: Record<BonusType, string> = {
    birthday: 'Happy birthday bonus',
    review: 'Thank you for your Google review',
    referral: 'Referral bonus - friend completed first treatment',
    visit_streak: `${VISIT_STREAK_THRESHOLD}-visit streak bonus`,
    tier_up: 'Tier upgrade bonus',
  };

  return {
    points,
    newBalance: member.currentBalance + points,
    newLifetimeEarned: member.totalPointsEarned + points,
    description: descriptions[bonusType],
  };
}

/**
 * Process a points redemption.
 */
export function processRedemption(
  member: LoyaltyMember,
  pointsToRedeem: number,
  _rewardDescription: string,
): { valid: boolean; error?: string; dollarValue: number; newBalance: number; newTotalRedeemed: number } {
  const validation = validateRedemption(member.currentBalance, pointsToRedeem);
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
      dollarValue: 0,
      newBalance: member.currentBalance,
      newTotalRedeemed: member.totalPointsRedeemed,
    };
  }

  return {
    valid: true,
    dollarValue: pointsToDollars(pointsToRedeem),
    newBalance: member.currentBalance - pointsToRedeem,
    newTotalRedeemed: member.totalPointsRedeemed + pointsToRedeem,
  };
}

/**
 * Expire points for inactive members.
 */
export function processExpiry(
  members: LoyaltyMember[],
  now?: Date,
): { clientId: string; pointsExpired: number; reason: string }[] {
  const currentDate = now || new Date();
  return members
    .filter(m => m.currentBalance > 0 && checkExpiry(m.lastActivityDate, currentDate))
    .map(m => ({
      clientId: m.clientId,
      pointsExpired: m.currentBalance,
      reason: `${INACTIVITY_EXPIRY_MONTHS} months of inactivity`,
    }));
}

/**
 * Build a complete loyalty account from transaction history.
 */
export function buildLoyaltyAccount(
  clientId: string,
  transactions: PointsTransaction[],
): LoyaltyAccount {
  let totalEarned = 0;
  let totalRedeemed = 0;
  let totalExpired = 0;

  for (const tx of transactions) {
    if (tx.type === 'expiration') {
      totalExpired += Math.abs(tx.points);
    } else if (tx.points > 0) {
      totalEarned += tx.points;
    } else {
      totalRedeemed += Math.abs(tx.points);
    }
  }

  const balance = Math.max(totalEarned - totalRedeemed - totalExpired, 0);
  const tier = determineTier(totalEarned);
  const { progress, pointsToNextTier, nextTier } = calculateTierProgress(totalEarned);

  return {
    clientId,
    totalPointsEarned: totalEarned,
    totalPointsRedeemed: totalRedeemed,
    totalPointsExpired: totalExpired,
    currentBalance: balance,
    tier,
    tierProgress: progress,
    nextTier,
    pointsToNextTier,
    benefits: getTierBenefits(tier),
  };
}

/**
 * Get discount percentage for a tier.
 */
export function getTierDiscount(tier: LoyaltyTier): number {
  return TIER_BENEFITS_MAP[tier].discountPercent;
}

/**
 * Apply tier discount to a treatment price.
 */
export function applyTierDiscount(price: number, tier: LoyaltyTier): {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
} {
  const discountPercent = getTierDiscount(tier);
  const discountAmount = Math.round(price * (discountPercent / 100) * 100) / 100;
  return {
    originalPrice: price,
    discountPercent,
    discountAmount,
    finalPrice: price - discountAmount,
  };
}

/**
 * Get birthday bonus for a given tier.
 */
export function getBirthdayBonus(tier: LoyaltyTier): number {
  return TIER_BENEFITS_MAP[tier].birthdayBonus;
}

/**
 * Get referral bonus for a given tier.
 */
export function getReferralBonus(tier: LoyaltyTier): number {
  return TIER_BENEFITS_MAP[tier].referralBonus;
}

/**
 * Build loyalty analytics from member data.
 */
export function buildAnalytics(
  members: LoyaltyMember[],
  transactions: PointsTransaction[],
  now?: Date,
): LoyaltyAnalytics {
  const currentDate = now || new Date();
  const ninetyDaysAgo = new Date(currentDate);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const activeMembers = members.filter(m => new Date(m.lastActivityDate) >= ninetyDaysAgo).length;
  const tierDistribution: Record<LoyaltyTier, number> = { Silver: 0, Gold: 0, Platinum: 0 };
  let totalIssued = 0;
  let totalRedeemed = 0;
  let totalExpired = 0;
  let totalBalance = 0;

  for (const member of members) {
    tierDistribution[member.tier]++;
    totalIssued += member.totalPointsEarned;
    totalRedeemed += member.totalPointsRedeemed;
    totalExpired += member.totalPointsExpired;
    totalBalance += member.currentBalance;
  }

  const topMembers = [...members]
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 10)
    .map(m => ({ clientId: m.clientId, clientName: m.clientName, balance: m.currentBalance, tier: m.tier }));

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  // Monthly issuance for last 6 months
  const monthlyIssuance: { month: string; earned: number; redeemed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(currentDate);
    monthDate.setMonth(monthDate.getMonth() - i);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTxs = transactions.filter(t => t.createdAt.startsWith(monthKey));
    const earned = monthTxs.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0);
    const redeemed = monthTxs.filter(t => t.type === 'redemption').reduce((sum, t) => sum + Math.abs(t.points), 0);
    monthlyIssuance.push({ month: monthKey, earned, redeemed });
  }

  const redemptionRate = totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0;

  return {
    totalMembers: members.length,
    activeMembers,
    tierDistribution,
    totalPointsIssued: totalIssued,
    totalPointsRedeemed: totalRedeemed,
    totalPointsExpired: totalExpired,
    pointsInCirculation: totalBalance,
    redemptionRate,
    averageBalance: members.length > 0 ? Math.round(totalBalance / members.length) : 0,
    topMembers,
    recentTransactions,
    monthlyIssuance,
  };
}

/**
 * Generate a unique point transaction ID.
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `pt_${timestamp}_${random}`;
}
