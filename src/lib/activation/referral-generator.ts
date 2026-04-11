/**
 * Referral Code Generator
 * Rani Beauty Clinic - Revenue Activation System
 *
 * Extends the existing referral engine with revenue activation features:
 * - Generates unique RANI-XXXX codes per patient
 * - $50 credit for referrer, $25 off first visit for referee
 * - Tracks referral chains (who referred whom)
 * - Calculates referral revenue attribution
 * - Generates shareable links: ranibeautyclinic.com/ref/RANI-XXXX
 * - Monthly referral leaderboard with competitive gamification
 *
 * Integrates with the existing referral engine at /src/lib/referral/engine.ts
 */

import crypto from 'crypto';
import {
  generateReferralCode,
  isValidReferralCode,
  type Referral,
  type ReferralStatus,
  type TopReferrer,
  REFERRER_REWARD,
  REFEREE_REWARD,
  REFERRAL_EXPIRY_DAYS,
  BASE_URL,
} from '@/lib/referral/engine';

// ── Types ────────────────────────────────────────────────────────────────

export interface ReferralCodeRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  code: string;
  shareUrl: string;
  createdAt: string;
  isActive: boolean;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralChain: ReferralChainEntry[];
}

export interface ReferralChainEntry {
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  status: ReferralStatus;
  referredAt: string;
  completedAt?: string;
  revenueGenerated: number;
  servicesBooked: string[];
}

export interface ReferralRevenueSummary {
  totalReferralRevenue: number;
  totalRewardsPaid: number;
  netReferralRevenue: number;
  roi: number; // percentage
  avgRevenuePerReferral: number;
  avgCostPerAcquisition: number;
  topReferralSources: { source: string; count: number; revenue: number }[];
  monthlyTrend: { month: string; referrals: number; revenue: number; rewards: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  patientId: string;
  patientName: string;
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  totalRevenueGenerated: number;
  conversionRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  streak: number; // consecutive months with at least 1 referral
}

export interface ReferralLeaderboard {
  period: string; // "2026-03" format
  entries: LeaderboardEntry[];
  totalReferrals: number;
  totalRevenue: number;
  topReferrer: LeaderboardEntry | null;
  milestones: ReferralMilestone[];
}

export interface ReferralMilestone {
  patientName: string;
  achievement: string;
  description: string;
  earnedAt: string;
}

export interface BulkCodeGeneration {
  codes: ReferralCodeRecord[];
  totalGenerated: number;
  shareMessages: ShareMessage[];
}

export interface ShareMessage {
  patientId: string;
  patientName: string;
  code: string;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  socialCaption: string;
  shareUrl: string;
}

// ── Constants ────────────────────────────────────────────────────────────

const SHARE_BASE_URL = `${BASE_URL}/ref`;

const LEADERBOARD_TIERS = {
  platinum: { minReferrals: 10, label: 'Platinum', reward: '$200 bonus credit' },
  gold: { minReferrals: 5, label: 'Gold', reward: '$100 bonus credit' },
  silver: { minReferrals: 3, label: 'Silver', reward: '$50 bonus credit' },
  bronze: { minReferrals: 1, label: 'Bronze', reward: 'Thank you gift' },
} as const;

const AVG_FIRST_VISIT_REVENUE = 350;
const AVG_LIFETIME_VISITS = 8;
const AVG_VISIT_VALUE = 300;

// ── Code Generation ────────────────────────────────────────────────────

/**
 * Generate a referral code record for a patient.
 * Uses the existing engine's code generation (RANI-XXXX format).
 */
export function generateCodeForPatient(
  patientId: string,
  patientName: string,
  patientEmail: string,
  patientPhone: string,
): ReferralCodeRecord {
  const code = generateReferralCode();
  const shareUrl = `${SHARE_BASE_URL}/${code}`;

  return {
    id: `refcode-${crypto.randomUUID()}`,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    code,
    shareUrl,
    createdAt: new Date().toISOString(),
    isActive: true,
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0,
    referralChain: [],
  };
}

/**
 * Generate codes in bulk for a list of patients.
 * Also generates share messages for each patient.
 */
export function generateBulkCodes(
  patients: { id: string; name: string; email: string; phone: string }[],
): BulkCodeGeneration {
  const codes: ReferralCodeRecord[] = [];
  const shareMessages: ShareMessage[] = [];

  for (const patient of patients) {
    const record = generateCodeForPatient(patient.id, patient.name, patient.email, patient.phone);
    codes.push(record);

    const firstName = patient.name.split(' ')[0] || patient.name;
    shareMessages.push(generateShareMessage(patient.id, firstName, record.code, record.shareUrl));
  }

  return {
    codes,
    totalGenerated: codes.length,
    shareMessages,
  };
}

/**
 * Generate personalized share messages for a patient's referral code.
 */
export function generateShareMessage(
  patientId: string,
  firstName: string,
  code: string,
  shareUrl: string,
): ShareMessage {
  const smsMessage = `${firstName}, you can share your Rani referral code with friends! They get $25 off their first visit and you earn $50 credit. Your code: ${code}. Share this link: ${shareUrl}`;

  const emailSubject = `Share the Rani glow, ${firstName}`;

  const emailBody = `Hi ${firstName},

Thank you for being part of the Rani family. We would love for you to share the experience with friends and family.

Here is your personal referral code: ${code}

How it works:
1. Share your code or link with someone you think would love Rani
2. They get $25 off their first visit
3. After they complete their first treatment, you receive a $50 credit

Your personal referral link: ${shareUrl}

The best part? There is no limit to how many friends you can refer. Every successful referral earns you another $50 credit.

Thank you for spreading the word!

Warmly,
Rina
Rani Beauty Clinic
401 Olympia Ave NE Unit 101, Renton WA 98056
(425) 539-4440`;

  const socialCaption = `I found my glow at @ranibeautyclinic and you should too! Use my code ${code} for $25 off your first visit. Trust me, you will thank me later. Book at ${shareUrl}`;

  return {
    patientId,
    patientName: firstName,
    code,
    smsMessage,
    emailSubject,
    emailBody,
    socialCaption,
    shareUrl,
  };
}

// ── Referral Chain Tracking ──────────────────────────────────────────────

/**
 * Add a new entry to a referral chain.
 */
export function addToReferralChain(
  record: ReferralCodeRecord,
  referee: {
    id: string;
    name: string;
    email: string;
    servicesBooked: string[];
  },
): ReferralCodeRecord {
  const entry: ReferralChainEntry = {
    refereeId: referee.id,
    refereeName: referee.name,
    refereeEmail: referee.email,
    status: 'booked',
    referredAt: new Date().toISOString(),
    revenueGenerated: 0,
    servicesBooked: referee.servicesBooked,
  };

  return {
    ...record,
    totalReferrals: record.totalReferrals + 1,
    pendingReferrals: record.pendingReferrals + 1,
    referralChain: [...record.referralChain, entry],
  };
}

/**
 * Mark a referral as completed (referee finished first treatment).
 */
export function completeReferral(
  record: ReferralCodeRecord,
  refereeId: string,
  revenueGenerated: number,
): ReferralCodeRecord {
  const updatedChain = record.referralChain.map(entry => {
    if (entry.refereeId === refereeId && entry.status !== 'rewarded') {
      return {
        ...entry,
        status: 'completed' as ReferralStatus,
        completedAt: new Date().toISOString(),
        revenueGenerated,
      };
    }
    return entry;
  });

  const completed = updatedChain.filter(e => e.status === 'completed' || e.status === 'rewarded');

  return {
    ...record,
    successfulReferrals: completed.length,
    pendingReferrals: record.totalReferrals - completed.length,
    totalRewardsEarned: completed.length * REFERRER_REWARD.amount,
    referralChain: updatedChain,
  };
}

// ── Revenue Attribution ──────────────────────────────────────────────────

/**
 * Calculate total revenue attributed to referrals.
 */
export function calculateReferralRevenueAttribution(
  records: ReferralCodeRecord[],
): ReferralRevenueSummary {
  let totalReferralRevenue = 0;
  let totalSuccessful = 0;
  const sourceMap = new Map<string, { count: number; revenue: number }>();
  const monthlyMap = new Map<string, { referrals: number; revenue: number; rewards: number }>();

  for (const record of records) {
    for (const entry of record.referralChain) {
      if (entry.status === 'completed' || entry.status === 'rewarded') {
        totalReferralRevenue += entry.revenueGenerated;
        totalSuccessful++;

        // Track by month
        const month = entry.referredAt.substring(0, 7);
        const existing = monthlyMap.get(month) || { referrals: 0, revenue: 0, rewards: 0 };
        existing.referrals++;
        existing.revenue += entry.revenueGenerated;
        existing.rewards += REFERRER_REWARD.amount + REFEREE_REWARD.amount;
        monthlyMap.set(month, existing);
      }
    }
  }

  // Also count projected lifetime value of referred patients
  const projectedLifetimeRevenue = totalSuccessful * AVG_LIFETIME_VISITS * AVG_VISIT_VALUE;

  const totalRewardsPaid = totalSuccessful * (REFERRER_REWARD.amount + REFEREE_REWARD.amount);
  const netReferralRevenue = totalReferralRevenue - totalRewardsPaid;
  const roi = totalRewardsPaid > 0 ? Math.round((netReferralRevenue / totalRewardsPaid) * 100) : 0;

  const avgRevenuePerReferral = totalSuccessful > 0
    ? Math.round(totalReferralRevenue / totalSuccessful)
    : 0;

  const avgCostPerAcquisition = totalSuccessful > 0
    ? Math.round(totalRewardsPaid / totalSuccessful)
    : 0;

  // Monthly trend
  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalReferralRevenue,
    totalRewardsPaid,
    netReferralRevenue,
    roi,
    avgRevenuePerReferral,
    avgCostPerAcquisition,
    topReferralSources: [], // populated from tracking data
    monthlyTrend,
  };
}

/**
 * Calculate the total economic impact of the referral program.
 * Includes both direct revenue and projected lifetime value.
 */
export function calculateReferralEconomicImpact(
  records: ReferralCodeRecord[],
): {
  directRevenue: number;
  projectedLifetimeValue: number;
  totalRewards: number;
  netImpact: number;
  costPerAcquisition: number;
  lifetimeROI: number;
} {
  let totalSuccessful = 0;
  let directRevenue = 0;

  for (const record of records) {
    for (const entry of record.referralChain) {
      if (entry.status === 'completed' || entry.status === 'rewarded') {
        totalSuccessful++;
        directRevenue += entry.revenueGenerated;
      }
    }
  }

  const projectedLifetimeValue = totalSuccessful * AVG_LIFETIME_VISITS * AVG_VISIT_VALUE;
  const totalRewards = totalSuccessful * (REFERRER_REWARD.amount + REFEREE_REWARD.amount);
  const netImpact = projectedLifetimeValue - totalRewards;
  const costPerAcquisition = totalSuccessful > 0 ? Math.round(totalRewards / totalSuccessful) : 0;
  const lifetimeROI = totalRewards > 0 ? Math.round((netImpact / totalRewards) * 100) : 0;

  return {
    directRevenue,
    projectedLifetimeValue,
    totalRewards,
    netImpact,
    costPerAcquisition,
    lifetimeROI,
  };
}

// ── Leaderboard ────────────────────────────────────────────────────────

/**
 * Determine referral tier based on successful referrals.
 */
export function getReferralTier(successfulReferrals: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (successfulReferrals >= LEADERBOARD_TIERS.platinum.minReferrals) return 'platinum';
  if (successfulReferrals >= LEADERBOARD_TIERS.gold.minReferrals) return 'gold';
  if (successfulReferrals >= LEADERBOARD_TIERS.silver.minReferrals) return 'silver';
  return 'bronze';
}

/**
 * Calculate referral streak (consecutive months with at least 1 referral).
 */
export function calculateStreak(referralDates: string[]): number {
  if (referralDates.length === 0) return 0;

  const months = referralDates
    .map(d => d.substring(0, 7))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b.localeCompare(a)); // newest first

  let streak = 0;
  const now = new Date();
  let expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const month of months) {
    if (month === expectedMonth) {
      streak++;
      // Move to previous month
      const [y, m] = expectedMonth.split('-').map(Number);
      if (m === 1) {
        expectedMonth = `${y - 1}-12`;
      } else {
        expectedMonth = `${y}-${String(m - 1).padStart(2, '0')}`;
      }
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Build the monthly referral leaderboard.
 */
export function buildLeaderboard(
  records: ReferralCodeRecord[],
  period?: string,
): ReferralLeaderboard {
  const now = new Date();
  const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const entries: LeaderboardEntry[] = records
    .filter(r => r.totalReferrals > 0)
    .map(record => {
      // Filter chain to current period
      const periodReferrals = record.referralChain.filter(e =>
        e.referredAt.startsWith(currentPeriod)
      );

      const periodCompleted = periodReferrals.filter(e =>
        e.status === 'completed' || e.status === 'rewarded'
      );

      const totalRevenueGenerated = record.referralChain
        .filter(e => e.status === 'completed' || e.status === 'rewarded')
        .reduce((s, e) => s + e.revenueGenerated, 0);

      const referralDates = record.referralChain.map(e => e.referredAt);
      const streak = calculateStreak(referralDates);

      return {
        rank: 0, // set after sorting
        patientId: record.patientId,
        patientName: record.patientName,
        code: record.code,
        totalReferrals: record.totalReferrals,
        successfulReferrals: record.successfulReferrals,
        totalRewardsEarned: record.totalRewardsEarned,
        totalRevenueGenerated,
        conversionRate: record.totalReferrals > 0
          ? Math.round((record.successfulReferrals / record.totalReferrals) * 100)
          : 0,
        tier: getReferralTier(record.successfulReferrals),
        streak,
      };
    })
    .sort((a, b) =>
      b.successfulReferrals - a.successfulReferrals ||
      b.totalRevenueGenerated - a.totalRevenueGenerated
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Generate milestones
  const milestones: ReferralMilestone[] = [];
  for (const entry of entries) {
    if (entry.successfulReferrals === 10) {
      milestones.push({
        patientName: entry.patientName,
        achievement: 'Platinum Referrer',
        description: `${entry.patientName} reached 10 successful referrals! Earned ${LEADERBOARD_TIERS.platinum.reward}.`,
        earnedAt: new Date().toISOString(),
      });
    } else if (entry.successfulReferrals === 5) {
      milestones.push({
        patientName: entry.patientName,
        achievement: 'Gold Referrer',
        description: `${entry.patientName} reached 5 successful referrals! Earned ${LEADERBOARD_TIERS.gold.reward}.`,
        earnedAt: new Date().toISOString(),
      });
    }
    if (entry.streak >= 3) {
      milestones.push({
        patientName: entry.patientName,
        achievement: `${entry.streak}-Month Streak`,
        description: `${entry.patientName} has referred someone every month for ${entry.streak} months straight!`,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  const totalReferrals = entries.reduce((s, e) => s + e.totalReferrals, 0);
  const totalRevenue = entries.reduce((s, e) => s + e.totalRevenueGenerated, 0);

  return {
    period: currentPeriod,
    entries: entries.slice(0, 25),
    totalReferrals,
    totalRevenue,
    topReferrer: entries.length > 0 ? entries[0] : null,
    milestones,
  };
}

// ── Shareable Link Handler ──────────────────────────────────────────────

/**
 * Parse a referral code from a URL path.
 * Handles: /ref/RANI-XXXX, /get-started?ref=RANI-XXXX
 */
export function parseReferralFromUrl(url: string): string | null {
  // Direct ref URL: /ref/RANI-XXXX
  const refMatch = url.match(/\/ref\/(RANI-[A-HJ-NP-Z2-9]{4})/);
  if (refMatch) return refMatch[1];

  // Query param: ?ref=RANI-XXXX
  const paramMatch = url.match(/[?&]ref=(RANI-[A-HJ-NP-Z2-9]{4})/);
  if (paramMatch) return paramMatch[1];

  return null;
}

/**
 * Generate the referral landing page URL.
 */
export function getReferralUrl(code: string): string {
  if (!isValidReferralCode(code)) {
    throw new Error(`Invalid referral code format: ${code}`);
  }
  return `${SHARE_BASE_URL}/${code}`;
}

// ── Notification Messages ────────────────────────────────────────────

/**
 * Generate the notification message when a referral converts.
 */
export function generateConversionNotification(
  referrerName: string,
  refereeName: string,
  rewardAmount: number,
): { sms: string; email: string } {
  const firstName = referrerName.split(' ')[0] || referrerName;

  return {
    sms: `${firstName}, great news! Your friend ${refereeName} just completed their first visit at Rani. You earned a $${rewardAmount} credit. Thank you for spreading the word!`,
    email: `Hi ${firstName},\n\nWonderful news! Your referral, ${refereeName}, just completed their first visit at Rani Beauty Clinic.\n\nAs a thank you, we have added a $${rewardAmount} credit to your account. You can use it on any service at your next visit.\n\nKeep sharing and keep earning!\n\nWarmly,\nRina\nRani Beauty Clinic`,
  };
}

/**
 * Generate the welcome message for a referred patient.
 */
export function generateRefereeWelcome(
  refereeName: string,
  referrerName: string,
  discountAmount: number,
  code: string,
): { sms: string; email: string } {
  const firstName = refereeName.split(' ')[0] || refereeName;
  const referrerFirst = referrerName.split(' ')[0] || referrerName;

  return {
    sms: `hi ${firstName}! welcome to Rani Beauty Clinic. ${referrerFirst} referred you and we're so glad you're here! Enjoy $${discountAmount} off your first visit. Book at ${BOOKING_URL}`,
    email: `Hi ${firstName},\n\nWelcome to Rani Beauty Clinic! ${referrerFirst} shared their referral code with you, and we are so excited to meet you.\n\nYou have $${discountAmount} off your first treatment. Simply mention your code ${code} when you book or check in.\n\nWe cannot wait to help you discover your best self.\n\nSee you soon,\nRina\nRani Beauty Clinic\n401 Olympia Ave NE Unit 101, Renton WA 98056\n(425) 539-4440`,
  };
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';

// ── Export Helpers ────────────────────────────────────────────────────

/**
 * Export leaderboard data as CSV.
 */
export function exportLeaderboardCSV(leaderboard: ReferralLeaderboard): string {
  const headers = [
    'Rank',
    'Name',
    'Code',
    'Total Referrals',
    'Successful',
    'Conversion Rate',
    'Rewards Earned',
    'Revenue Generated',
    'Tier',
    'Streak',
  ];

  const rows = leaderboard.entries.map(e => [
    e.rank,
    `"${e.patientName}"`,
    e.code,
    e.totalReferrals,
    e.successfulReferrals,
    `${e.conversionRate}%`,
    `$${e.totalRewardsEarned}`,
    `$${e.totalRevenueGenerated}`,
    e.tier,
    e.streak,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export all referral codes as CSV for reporting.
 */
export function exportReferralCodesCSV(records: ReferralCodeRecord[]): string {
  const headers = [
    'Patient Name',
    'Email',
    'Code',
    'Share URL',
    'Total Referrals',
    'Successful',
    'Pending',
    'Rewards Earned',
    'Active',
    'Created',
  ];

  const rows = records.map(r => [
    `"${r.patientName}"`,
    `"${r.patientEmail}"`,
    r.code,
    r.shareUrl,
    r.totalReferrals,
    r.successfulReferrals,
    r.pendingReferrals,
    `$${r.totalRewardsEarned}`,
    r.isActive,
    r.createdAt.substring(0, 10),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
