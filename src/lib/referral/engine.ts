/**
 * Referral Engine - Rani Beauty Clinic
 *
 * Generate unique referral codes, track referral pipeline, and manage rewards.
 *
 * Referrer reward: $50 credit after referee's first paid treatment
 * Referee reward: $25 off first treatment
 * Anti-abuse: max 10 active referrals, 1 reward per unique referee
 * Attribution: 30-day cookie + code lookup
 * Code format: RANI-[4 alphanumeric]
 */

import crypto from 'crypto';

// ── Types ────────────────────────────────────────────────────────────────

export type ReferralStatus =
  | 'sent'        // Code shared / link sent
  | 'clicked'     // Referee clicked the link
  | 'booked'      // Referee booked first appointment
  | 'completed'   // Referee completed first treatment
  | 'rewarded'    // Both rewards issued
  | 'expired';    // Attribution window expired

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referralCode: string;      // RANI-XXXX format
  refereeEmail?: string;
  refereeName?: string;
  refereeId?: string;
  status: ReferralStatus;
  createdAt: string;
  clickedAt?: string;
  bookedAt?: string;
  completedAt?: string;
  rewardedAt?: string;
  referrerRewardIssued: boolean;
  refereeRewardIssued: boolean;
  source?: 'sms' | 'email' | 'link' | 'social';
  attributionExpiry: string;  // 30-day cookie expiry
}

export interface ReferralReward {
  type: 'credit' | 'loyalty_points';
  amount: number;
  description: string;
}

export interface ReferralStats {
  totalReferrals: number;
  sent: number;
  clicked: number;
  booked: number;
  completed: number;
  rewarded: number;
  expired: number;
  totalRewardsEarned: number;
  conversionRate: number;
  funnelRates: {
    sentToClicked: number;
    clickedToBooked: number;
    bookedToCompleted: number;
  };
}

export interface ReferralShareContent {
  referralCode: string;
  shareUrl: string;
  smsText: string;
  emailSubject: string;
  emailBody: string;
}

export interface TopReferrer {
  referrerId: string;
  referrerName: string;
  totalReferrals: number;
  completedReferrals: number;
  totalRewardsEarned: number;
  conversionRate: number;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRER_REWARD: ReferralReward = {
  type: 'credit',
  amount: 50,
  description: '$50 treatment credit for each friend who completes their first visit',
};

export const REFERRER_POINTS_REWARD: ReferralReward = {
  type: 'loyalty_points',
  amount: 500,
  description: '500 loyalty points per converted referral',
};

export const REFEREE_REWARD: ReferralReward = {
  type: 'credit',
  amount: 25,
  description: '$25 off your first treatment at Rani Beauty Clinic',
};

export const REFERRAL_EXPIRY_DAYS = 30; // Attribution window
export const MAX_ACTIVE_REFERRALS = 10; // Anti-abuse limit
export const REFERRAL_CODE_LENGTH = 4;
export const BASE_URL = 'https://ranibeautyclinic.com';

// ── Code Generation ──────────────────────────────────────────────────────

/**
 * Generate a unique referral code in RANI-XXXX format.
 * Uses uppercase letters (excluding I, O) and digits (excluding 0, 1) for clarity.
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `RANI-${code}`;
}

/**
 * Validate that a string matches the RANI-XXXX referral code format.
 */
export function isValidReferralCode(code: string): boolean {
  return /^RANI-[A-HJ-NP-Z2-9]{4}$/.test(code);
}

// ── Anti-Abuse ───────────────────────────────────────────────────────────

/**
 * Check if a referrer has reached the max active referrals limit.
 * Active = not expired and not rewarded.
 */
export function checkActiveReferralLimit(
  referrals: Referral[],
  referrerId: string,
): { allowed: boolean; activeCount: number; reason?: string } {
  const active = referrals.filter(
    r => r.referrerId === referrerId &&
      r.status !== 'expired' &&
      r.status !== 'rewarded'
  );

  if (active.length >= MAX_ACTIVE_REFERRALS) {
    return {
      allowed: false,
      activeCount: active.length,
      reason: `Maximum ${MAX_ACTIVE_REFERRALS} active referrals reached. Wait for existing referrals to complete or expire.`,
    };
  }

  return { allowed: true, activeCount: active.length };
}

/**
 * Check if a referee has already been referred (1 reward per unique referee).
 */
export function checkDuplicateReferee(
  referrals: Referral[],
  refereeEmail: string,
): { isDuplicate: boolean; existingReferral?: Referral } {
  const existing = referrals.find(
    r => r.refereeEmail?.toLowerCase() === refereeEmail.toLowerCase() &&
      r.status !== 'expired'
  );

  return {
    isDuplicate: !!existing,
    existingReferral: existing,
  };
}

/**
 * Check if a referrer is trying to refer themselves.
 */
export function checkSelfReferral(
  referrerEmail: string,
  refereeEmail: string,
): boolean {
  return referrerEmail.toLowerCase() === refereeEmail.toLowerCase();
}

// ── Referral Pipeline ────────────────────────────────────────────────────

/**
 * Create a new referral record.
 */
export function createReferral(
  referrerId: string,
  referrerName: string,
  referralCode?: string,
  source?: Referral['source'],
): Referral {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + REFERRAL_EXPIRY_DAYS);

  return {
    id: `ref-${crypto.randomUUID()}`,
    referrerId,
    referrerName,
    referralCode: referralCode || generateReferralCode(),
    status: 'sent',
    createdAt: now.toISOString(),
    referrerRewardIssued: false,
    refereeRewardIssued: false,
    source: source || 'link',
    attributionExpiry: expiry.toISOString(),
  };
}

/**
 * Advance a referral to the next status in the pipeline.
 * Validates forward-only progression (except expired which can happen from any state).
 */
export function advanceReferral(
  referral: Referral,
  newStatus: ReferralStatus,
  data?: {
    refereeEmail?: string;
    refereeName?: string;
    refereeId?: string;
  },
): Referral {
  const statusOrder: ReferralStatus[] = ['sent', 'clicked', 'booked', 'completed', 'rewarded'];
  const currentIdx = statusOrder.indexOf(referral.status);
  const newIdx = statusOrder.indexOf(newStatus);

  // Can only advance forward (except to 'expired')
  if (newStatus !== 'expired' && newIdx <= currentIdx) {
    return referral;
  }

  const updated: Referral = { ...referral, status: newStatus };

  if (data?.refereeEmail) updated.refereeEmail = data.refereeEmail;
  if (data?.refereeName) updated.refereeName = data.refereeName;
  if (data?.refereeId) updated.refereeId = data.refereeId;

  const now = new Date().toISOString();
  switch (newStatus) {
    case 'clicked':
      updated.clickedAt = now;
      break;
    case 'booked':
      updated.bookedAt = now;
      break;
    case 'completed':
      updated.completedAt = now;
      break;
    case 'rewarded':
      updated.rewardedAt = now;
      updated.referrerRewardIssued = true;
      updated.refereeRewardIssued = true;
      break;
  }

  return updated;
}

/**
 * Check if a referral's attribution window has expired.
 */
export function isReferralExpired(referral: Referral, now?: Date): boolean {
  if (referral.status === 'completed' || referral.status === 'rewarded') {
    return false;
  }
  if (referral.status === 'expired') return true;

  const currentDate = now || new Date();
  return currentDate > new Date(referral.attributionExpiry);
}

/**
 * Check if referrer reward should be issued.
 * Requires: completed status + reward not yet issued.
 */
export function shouldIssueReferrerReward(referral: Referral): boolean {
  return referral.status === 'completed' && !referral.referrerRewardIssued;
}

/**
 * Check if referee reward should be issued.
 * Issued when they first book (before their treatment).
 */
export function shouldIssueRefereeReward(referral: Referral): boolean {
  return (
    (referral.status === 'booked' || referral.status === 'completed' || referral.status === 'rewarded') &&
    !referral.refereeRewardIssued
  );
}

/**
 * Mark referrer reward as issued.
 */
export function markReferrerRewardIssued(referral: Referral): Referral {
  return { ...referral, referrerRewardIssued: true };
}

/**
 * Mark referee reward as issued.
 */
export function markRefereeRewardIssued(referral: Referral): Referral {
  return { ...referral, refereeRewardIssued: true };
}

// ── Attribution ──────────────────────────────────────────────────────────

/**
 * Look up a referral by code (for code-based attribution).
 */
export function lookupByCode(
  referrals: Referral[],
  code: string,
): Referral | null {
  return referrals.find(
    r => r.referralCode === code && r.status !== 'expired' && r.status !== 'rewarded'
  ) || null;
}

/**
 * Calculate the attribution cookie expiry date (30 days from click).
 */
export function getAttributionExpiry(clickDate?: Date): string {
  const date = clickDate || new Date();
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + REFERRAL_EXPIRY_DAYS);
  return expiry.toISOString();
}

// ── Statistics ───────────────────────────────────────────────────────────

/**
 * Calculate referral statistics from a list of referrals.
 */
export function calculateReferralStats(referrals: Referral[]): ReferralStats {
  const counts: Record<ReferralStatus, number> = {
    sent: 0,
    clicked: 0,
    booked: 0,
    completed: 0,
    rewarded: 0,
    expired: 0,
  };

  for (const ref of referrals) {
    counts[ref.status]++;
  }

  const totalReferrals = referrals.length;
  const successfulConversions = counts.completed + counts.rewarded;
  const conversionRate = totalReferrals > 0 ? Math.round((successfulConversions / totalReferrals) * 100) : 0;
  const totalRewardsEarned = successfulConversions * REFERRER_REWARD.amount;

  // Funnel rates
  const totalSent = totalReferrals;
  const totalClicked = counts.clicked + counts.booked + counts.completed + counts.rewarded;
  const totalBooked = counts.booked + counts.completed + counts.rewarded;

  const sentToClicked = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const clickedToBooked = totalClicked > 0 ? Math.round((totalBooked / totalClicked) * 100) : 0;
  const bookedToCompleted = totalBooked > 0 ? Math.round((successfulConversions / totalBooked) * 100) : 0;

  return {
    totalReferrals,
    ...counts,
    totalRewardsEarned,
    conversionRate,
    funnelRates: { sentToClicked, clickedToBooked, bookedToCompleted },
  };
}

/**
 * Get top referrers ranked by completed referrals.
 */
export function getTopReferrers(referrals: Referral[], limit: number = 10): TopReferrer[] {
  const referrerMap = new Map<string, { name: string; total: number; completed: number }>();

  for (const ref of referrals) {
    const existing = referrerMap.get(ref.referrerId) || {
      name: ref.referrerName,
      total: 0,
      completed: 0,
    };
    existing.total++;
    if (ref.status === 'completed' || ref.status === 'rewarded') {
      existing.completed++;
    }
    referrerMap.set(ref.referrerId, existing);
  }

  return Array.from(referrerMap.entries())
    .map(([id, data]) => ({
      referrerId: id,
      referrerName: data.name,
      totalReferrals: data.total,
      completedReferrals: data.completed,
      totalRewardsEarned: data.completed * REFERRER_REWARD.amount,
      conversionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.completedReferrals - a.completedReferrals || b.totalReferrals - a.totalReferrals)
    .slice(0, limit);
}

/**
 * Calculate revenue attributed to referrals.
 */
export function calculateReferralRevenue(
  referrals: Referral[],
  averageFirstVisitRevenue: number = 350,
): { totalRevenue: number; totalRewardsCost: number; netRevenue: number; roi: number } {
  const completed = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded');
  const totalRevenue = completed.length * averageFirstVisitRevenue;
  const totalRewardsCost = completed.length * (REFERRER_REWARD.amount + REFEREE_REWARD.amount);
  const netRevenue = totalRevenue - totalRewardsCost;
  const roi = totalRewardsCost > 0 ? Math.round((netRevenue / totalRewardsCost) * 100) : 0;

  return { totalRevenue, totalRewardsCost, netRevenue, roi };
}

// ── Share Content Generator ──────────────────────────────────────────────

/**
 * Generate share content for a referral code.
 */
export function generateShareContent(
  referralCode: string,
  referrerFirstName: string,
  baseUrl: string = BASE_URL,
): ReferralShareContent {
  const shareUrl = `${baseUrl}/get-started?ref=${referralCode}`;

  return {
    referralCode,
    shareUrl,
    smsText: `${referrerFirstName} thinks you'd love Rani Beauty Clinic! Use code ${referralCode} for $25 off your first treatment. Book here: ${shareUrl}`,
    emailSubject: `${referrerFirstName} invited you to Rani Beauty Clinic`,
    emailBody: `Hi there!\n\nI wanted to share my favorite medspa with you. Rani Beauty Clinic offers amazing treatments - I've been going there and the results speak for themselves.\n\nUse my code ${referralCode} for $25 off your first treatment.\n\nBook here: ${shareUrl}\n\nYou'll thank me later!\n\n${referrerFirstName}`,
  };
}

// ── Display Helpers ──────────────────────────────────────────────────────

/**
 * Get display label for a referral status.
 */
export function getReferralStatusLabel(status: ReferralStatus): string {
  const labels: Record<ReferralStatus, string> = {
    sent: 'Sent',
    clicked: 'Clicked',
    booked: 'Booked',
    completed: 'Completed',
    rewarded: 'Rewarded',
    expired: 'Expired',
  };
  return labels[status];
}

/**
 * Get status color class for a referral status (Tailwind).
 */
export function getReferralStatusColor(status: ReferralStatus): string {
  const colors: Record<ReferralStatus, string> = {
    sent: 'bg-yellow-100 text-yellow-800',
    clicked: 'bg-blue-100 text-blue-800',
    booked: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    rewarded: 'bg-emerald-100 text-emerald-800',
    expired: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
}

/**
 * Get active referral codes for a referrer.
 */
export function getActiveReferralCodes(
  referrals: Referral[],
  referrerId: string,
): { code: string; status: ReferralStatus; createdAt: string }[] {
  return referrals
    .filter(r => r.referrerId === referrerId && r.status !== 'expired')
    .map(r => ({ code: r.referralCode, status: r.status, createdAt: r.createdAt }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
