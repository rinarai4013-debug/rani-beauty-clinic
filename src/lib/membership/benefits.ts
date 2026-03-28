/**
 * Benefits Tracking Engine — Rani Beauty Clinic
 *
 * Manages and tracks all membership benefit allocations:
 * - Monthly credit allocation and usage
 * - Discount application at checkout
 * - Priority booking enforcement
 * - Exclusive event access control
 * - Guest pass management
 * - Birthday & anniversary bonuses
 * - Referral bonuses
 * - Benefits utilization analytics
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type { MembershipTier, MembershipStatus } from './plans';
import { PLANS } from './plans';

// ── Types ────────────────────────────────────────────────────────────────

export interface MemberBenefits {
  memberId: string;
  clientId: string;
  clientName: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinDate: string;
  birthdayMonth?: number; // 1-12

  // Credits
  credits: CreditBalance;

  // Discounts
  discountPercent: number;
  discountUsedThisMonth: number; // Dollar amount saved

  // Booking
  priorityBooking: boolean;
  priorityBookingHours: number; // 0, 48, or 72

  // Events
  exclusiveEventAccess: boolean;
  eventsAttended: number;
  eventsInvited: number;

  // Guest Passes
  guestPassesPerQuarter: number;
  guestPassesUsedThisQuarter: number;
  guestPassHistory: GuestPass[];

  // Bonuses
  birthdayBonusAmount: number;
  birthdayBonusClaimed: boolean;
  birthdayBonusClaimedDate?: string;
  anniversaryBonusAmount: number;
  anniversaryBonusClaimed: boolean;
  anniversaryBonusClaimedDate?: string;

  // Referrals
  referralBonusPerReferral: number;
  totalReferrals: number;
  totalReferralBonusEarned: number;

  // Concierge
  dedicatedConcierge: boolean;

  // Add-ons
  complimentaryAddOns: string[];

  // Utilization
  utilizationScore: number; // 0-100
  lastActivityDate?: string;
}

export interface CreditBalance {
  monthlyAllocation: number;
  rolledOver: number;
  bonusCredits: number; // Birthday, anniversary, referral bonuses
  totalAvailable: number;
  usedThisMonth: number;
  remaining: number;
  rolloverDeadline: string; // ISO date
}

export interface GuestPass {
  id: string;
  memberId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  usedDate: string;
  service?: string;
  discountApplied: number; // Percentage
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  quarter: string; // Q1-Q4 YYYY
  createdAt: string;
}

export interface BenefitUsageEvent {
  id: string;
  memberId: string;
  type: BenefitUsageType;
  amount?: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type BenefitUsageType =
  | 'credit_used'
  | 'credit_allocated'
  | 'credit_rolled_over'
  | 'credit_expired'
  | 'discount_applied'
  | 'priority_booking'
  | 'guest_pass_used'
  | 'guest_pass_issued'
  | 'event_attended'
  | 'event_invited'
  | 'birthday_bonus'
  | 'anniversary_bonus'
  | 'referral_bonus'
  | 'addon_used';

export interface DiscountApplication {
  memberId: string;
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  creditApplied: number;
  outOfPocket: number;
  service: string;
  appliedAt: string;
}

export interface EventAccess {
  eventId: string;
  eventName: string;
  eventDate: string;
  minimumTier: MembershipTier;
  maxCapacity: number;
  currentRSVPs: number;
  memberStatus: 'eligible' | 'rsvped' | 'attended' | 'ineligible';
}

export interface BenefitUtilization {
  memberId: string;
  period: string; // YYYY-MM
  creditUtilization: number; // Percentage
  discountUtilization: number;
  guestPassUtilization: number;
  eventAttendance: number;
  overallScore: number; // 0-100
  trend: 'increasing' | 'stable' | 'declining';
}

export interface BenefitsAnalyticsSummary {
  totalMembers: number;
  averageCreditUtilization: number;
  averageDiscountUsage: number;
  totalCreditsIssued: number;
  totalCreditsUsed: number;
  totalCreditsExpired: number;
  creditUtilizationRate: number;
  guestPassesIssued: number;
  guestPassesUsed: number;
  guestPassConversionRate: number;
  eventsHosted: number;
  averageEventAttendance: number;
  birthdayBonusesClaimed: number;
  anniversaryBonusesClaimed: number;
  referralBonusesPaid: number;
  topUtilizers: { memberId: string; clientName: string; score: number }[];
  underUtilizers: { memberId: string; clientName: string; score: number }[];
  utilizationByTier: Record<MembershipTier, number>;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PRIORITY_BOOKING_HOURS: Record<MembershipTier, number> = {
  halo: 0,
  glow: 48,
  elite: 72,
};

export const GUEST_PASS_DISCOUNT: Record<MembershipTier, number> = {
  halo: 0,
  glow: 20, // 20% off for guests
  elite: 25, // 25% off for guests
};

const TIER_ORDER: MembershipTier[] = ['halo', 'glow', 'elite'];

// ── Core Benefits Functions ──────────────────────────────────────────────

/**
 * Initialize benefits for a new member.
 */
export function initializeBenefits(
  memberId: string,
  clientId: string,
  clientName: string,
  tier: MembershipTier,
  joinDate: string,
  birthdayMonth?: number,
): MemberBenefits {
  const plan = PLANS[tier];
  const now = new Date().toISOString();

  const rolloverDeadline = new Date();
  rolloverDeadline.setMonth(rolloverDeadline.getMonth() + 2);
  rolloverDeadline.setDate(0);

  return {
    memberId,
    clientId,
    clientName,
    tier,
    status: 'active',
    joinDate,
    birthdayMonth,
    credits: {
      monthlyAllocation: plan.monthlyCredits,
      rolledOver: 0,
      bonusCredits: 0,
      totalAvailable: plan.monthlyCredits,
      usedThisMonth: 0,
      remaining: plan.monthlyCredits,
      rolloverDeadline: rolloverDeadline.toISOString(),
    },
    discountPercent: plan.discountPercent,
    discountUsedThisMonth: 0,
    priorityBooking: plan.priorityBooking,
    priorityBookingHours: PRIORITY_BOOKING_HOURS[tier],
    exclusiveEventAccess: plan.exclusiveEvents,
    eventsAttended: 0,
    eventsInvited: 0,
    guestPassesPerQuarter: plan.guestPassesPerQuarter,
    guestPassesUsedThisQuarter: 0,
    guestPassHistory: [],
    birthdayBonusAmount: plan.birthdayBonus,
    birthdayBonusClaimed: false,
    anniversaryBonusAmount: plan.anniversaryBonus,
    anniversaryBonusClaimed: false,
    referralBonusPerReferral: plan.referralBonus,
    totalReferrals: 0,
    totalReferralBonusEarned: 0,
    dedicatedConcierge: plan.dedicatedConcierge,
    complimentaryAddOns: plan.complimentaryAddOns,
    utilizationScore: 0,
    lastActivityDate: now,
  };
}

// ── Credit Management ────────────────────────────────────────────────────

/**
 * Apply treatment credits to a service purchase.
 */
export function applyCreditsToService(
  benefits: MemberBenefits,
  servicePrice: number,
  serviceName: string,
): DiscountApplication {
  if (benefits.status !== 'active' || servicePrice <= 0) {
    return {
      memberId: benefits.memberId,
      originalPrice: servicePrice,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: servicePrice,
      creditApplied: 0,
      outOfPocket: servicePrice,
      service: serviceName,
      appliedAt: new Date().toISOString(),
    };
  }

  // First apply membership discount to the price
  const discountAmount = Math.round(servicePrice * (benefits.discountPercent / 100) * 100) / 100;
  const discountedPrice = Math.round((servicePrice - discountAmount) * 100) / 100;

  // Then apply available credits
  const creditApplied = Math.min(benefits.credits.remaining, discountedPrice);
  const outOfPocket = Math.round((discountedPrice - creditApplied) * 100) / 100;

  return {
    memberId: benefits.memberId,
    originalPrice: servicePrice,
    discountPercent: benefits.discountPercent,
    discountAmount,
    finalPrice: discountedPrice,
    creditApplied,
    outOfPocket: Math.max(outOfPocket, 0),
    service: serviceName,
    appliedAt: new Date().toISOString(),
  };
}

/**
 * Record credit usage after a transaction.
 */
export function recordCreditUsage(
  benefits: MemberBenefits,
  amount: number,
): MemberBenefits {
  const remaining = Math.max(benefits.credits.remaining - amount, 0);
  return {
    ...benefits,
    credits: {
      ...benefits.credits,
      usedThisMonth: benefits.credits.usedThisMonth + amount,
      remaining,
    },
    lastActivityDate: new Date().toISOString(),
  };
}

/**
 * Monthly credit reset — allocate new credits and handle rollover.
 */
export function resetMonthlyCredits(benefits: MemberBenefits): MemberBenefits {
  const plan = PLANS[benefits.tier];
  const rolloverAmount = Math.min(benefits.credits.remaining, plan.monthlyCredits);

  const rolloverDeadline = new Date();
  rolloverDeadline.setMonth(rolloverDeadline.getMonth() + 2);
  rolloverDeadline.setDate(0);

  return {
    ...benefits,
    credits: {
      monthlyAllocation: plan.monthlyCredits,
      rolledOver: rolloverAmount,
      bonusCredits: 0, // Reset monthly bonus credits
      totalAvailable: plan.monthlyCredits + rolloverAmount,
      usedThisMonth: 0,
      remaining: plan.monthlyCredits + rolloverAmount,
      rolloverDeadline: rolloverDeadline.toISOString(),
    },
    discountUsedThisMonth: 0,
  };
}

/**
 * Add bonus credits (birthday, anniversary, referral).
 */
export function addBonusCredits(benefits: MemberBenefits, amount: number): MemberBenefits {
  return {
    ...benefits,
    credits: {
      ...benefits.credits,
      bonusCredits: benefits.credits.bonusCredits + amount,
      totalAvailable: benefits.credits.totalAvailable + amount,
      remaining: benefits.credits.remaining + amount,
    },
  };
}

// ── Priority Booking ─────────────────────────────────────────────────────

/**
 * Check if a member can book a slot before general availability.
 */
export function canPriorityBook(
  benefits: MemberBenefits,
  slotTime: string,
  generalAvailabilityTime: string,
): { allowed: boolean; reason?: string } {
  if (benefits.status !== 'active') {
    return { allowed: false, reason: 'Membership is not active' };
  }
  if (!benefits.priorityBooking) {
    return { allowed: false, reason: 'Priority booking not included in your plan' };
  }

  const slot = new Date(slotTime);
  const generalAvail = new Date(generalAvailabilityTime);
  const now = new Date();

  // Members can book X hours before general availability opens
  const memberEarlyAccess = new Date(generalAvail);
  memberEarlyAccess.setHours(memberEarlyAccess.getHours() - benefits.priorityBookingHours);

  if (now < memberEarlyAccess) {
    return { allowed: false, reason: `Priority booking opens ${benefits.priorityBookingHours} hours before general availability` };
  }

  return { allowed: true };
}

// ── Guest Pass Management ────────────────────────────────────────────────

/**
 * Issue a guest pass for a member.
 */
export function issueGuestPass(
  benefits: MemberBenefits,
  guestName: string,
  guestEmail?: string,
  guestPhone?: string,
): { success: boolean; guestPass?: GuestPass; error?: string } {
  if (benefits.status !== 'active') {
    return { success: false, error: 'Membership is not active' };
  }
  if (benefits.guestPassesPerQuarter === 0) {
    return { success: false, error: 'Guest passes are not included in your plan' };
  }
  if (benefits.guestPassesUsedThisQuarter >= benefits.guestPassesPerQuarter) {
    return { success: false, error: `All ${benefits.guestPassesPerQuarter} guest pass(es) for this quarter have been used` };
  }

  const now = new Date();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

  const guestPass: GuestPass = {
    id: generateGuestPassId(),
    memberId: benefits.memberId,
    guestName,
    guestEmail,
    guestPhone,
    usedDate: '',
    discountApplied: GUEST_PASS_DISCOUNT[benefits.tier],
    status: 'pending',
    quarter,
    createdAt: now.toISOString(),
  };

  return { success: true, guestPass };
}

/**
 * Redeem a guest pass.
 */
export function redeemGuestPass(
  guestPass: GuestPass,
  service: string,
): GuestPass {
  return {
    ...guestPass,
    usedDate: new Date().toISOString(),
    service,
    status: 'used',
  };
}

/**
 * Get remaining guest passes for the current quarter.
 */
export function getRemainingGuestPasses(benefits: MemberBenefits): number {
  return Math.max(benefits.guestPassesPerQuarter - benefits.guestPassesUsedThisQuarter, 0);
}

/**
 * Reset guest pass count at the start of a new quarter.
 */
export function resetQuarterlyGuestPasses(benefits: MemberBenefits): MemberBenefits {
  return {
    ...benefits,
    guestPassesUsedThisQuarter: 0,
  };
}

// ── Birthday & Anniversary Bonuses ───────────────────────────────────────

/**
 * Check if a member is eligible for their birthday bonus.
 */
export function isBirthdayBonusEligible(benefits: MemberBenefits, now?: Date): boolean {
  const currentDate = now || new Date();
  if (!benefits.birthdayMonth) return false;
  if (benefits.birthdayBonusClaimed) return false;
  if (benefits.status !== 'active') return false;
  return currentDate.getMonth() + 1 === benefits.birthdayMonth;
}

/**
 * Claim the birthday bonus.
 */
export function claimBirthdayBonus(benefits: MemberBenefits): {
  success: boolean;
  updatedBenefits: MemberBenefits;
  bonusAmount: number;
  error?: string;
} {
  if (!isBirthdayBonusEligible(benefits)) {
    return {
      success: false,
      updatedBenefits: benefits,
      bonusAmount: 0,
      error: 'Not eligible for birthday bonus',
    };
  }

  const updated = addBonusCredits(benefits, benefits.birthdayBonusAmount);
  return {
    success: true,
    updatedBenefits: {
      ...updated,
      birthdayBonusClaimed: true,
      birthdayBonusClaimedDate: new Date().toISOString(),
    },
    bonusAmount: benefits.birthdayBonusAmount,
  };
}

/**
 * Check if a member is eligible for their anniversary bonus.
 */
export function isAnniversaryBonusEligible(benefits: MemberBenefits, now?: Date): boolean {
  const currentDate = now || new Date();
  if (benefits.anniversaryBonusAmount === 0) return false;
  if (benefits.anniversaryBonusClaimed) return false;
  if (benefits.status !== 'active') return false;

  const joinDate = new Date(benefits.joinDate);
  // Check if current month/day matches join month/day
  return (
    currentDate.getMonth() === joinDate.getMonth() &&
    currentDate.getDate() === joinDate.getDate()
  );
}

/**
 * Claim the anniversary bonus.
 */
export function claimAnniversaryBonus(benefits: MemberBenefits): {
  success: boolean;
  updatedBenefits: MemberBenefits;
  bonusAmount: number;
  yearsAsMember: number;
  error?: string;
} {
  if (!isAnniversaryBonusEligible(benefits)) {
    return {
      success: false,
      updatedBenefits: benefits,
      bonusAmount: 0,
      yearsAsMember: 0,
      error: 'Not eligible for anniversary bonus',
    };
  }

  const joinDate = new Date(benefits.joinDate);
  const now = new Date();
  const yearsAsMember = now.getFullYear() - joinDate.getFullYear();

  const updated = addBonusCredits(benefits, benefits.anniversaryBonusAmount);
  return {
    success: true,
    updatedBenefits: {
      ...updated,
      anniversaryBonusClaimed: true,
      anniversaryBonusClaimedDate: new Date().toISOString(),
    },
    bonusAmount: benefits.anniversaryBonusAmount,
    yearsAsMember,
  };
}

/**
 * Reset annual bonus flags (call at the start of each year).
 */
export function resetAnnualBonuses(benefits: MemberBenefits): MemberBenefits {
  return {
    ...benefits,
    birthdayBonusClaimed: false,
    birthdayBonusClaimedDate: undefined,
    anniversaryBonusClaimed: false,
    anniversaryBonusClaimedDate: undefined,
  };
}

// ── Referral Bonuses ─────────────────────────────────────────────────────

/**
 * Award a referral bonus when a referred friend completes their first treatment.
 */
export function awardReferralBonus(benefits: MemberBenefits): {
  updatedBenefits: MemberBenefits;
  bonusAmount: number;
} {
  const bonusAmount = benefits.referralBonusPerReferral;
  const updated = addBonusCredits(benefits, bonusAmount);

  return {
    updatedBenefits: {
      ...updated,
      totalReferrals: benefits.totalReferrals + 1,
      totalReferralBonusEarned: benefits.totalReferralBonusEarned + bonusAmount,
    },
    bonusAmount,
  };
}

// ── Event Access ─────────────────────────────────────────────────────────

/**
 * Check if a member can access an exclusive event.
 */
export function canAccessEvent(
  benefits: MemberBenefits,
  minimumTier: MembershipTier,
): { allowed: boolean; reason?: string } {
  if (benefits.status !== 'active') {
    return { allowed: false, reason: 'Membership is not active' };
  }
  if (!benefits.exclusiveEventAccess) {
    return { allowed: false, reason: 'Event access not included in your plan — upgrade to Elite for exclusive events' };
  }

  const memberTierIndex = TIER_ORDER.indexOf(benefits.tier);
  const requiredTierIndex = TIER_ORDER.indexOf(minimumTier);

  if (memberTierIndex < requiredTierIndex) {
    return { allowed: false, reason: `This event requires ${PLANS[minimumTier].name} tier or higher` };
  }

  return { allowed: true };
}

// ── Discount Application ─────────────────────────────────────────────────

/**
 * Calculate the member discount for a service.
 */
export function calculateMemberDiscount(
  benefits: MemberBenefits,
  servicePrice: number,
): { discountPercent: number; discountAmount: number; finalPrice: number } {
  if (benefits.status !== 'active' || servicePrice <= 0) {
    return { discountPercent: 0, discountAmount: 0, finalPrice: servicePrice };
  }

  const discountAmount = Math.round(servicePrice * (benefits.discountPercent / 100) * 100) / 100;
  const finalPrice = Math.round((servicePrice - discountAmount) * 100) / 100;

  return { discountPercent: benefits.discountPercent, discountAmount, finalPrice };
}

// ── Utilization Analytics ────────────────────────────────────────────────

/**
 * Calculate a member's benefit utilization score (0-100).
 * Measures how much value the member is extracting from their membership.
 */
export function calculateUtilizationScore(benefits: MemberBenefits): number {
  const weights = {
    creditUsage: 0.50,
    guestPasses: 0.15,
    events: 0.10,
    bonuses: 0.15,
    engagement: 0.10,
  };

  // Credit utilization (what % of monthly credits are they using?)
  const creditTotal = benefits.credits.monthlyAllocation + benefits.credits.rolledOver;
  const creditScore = creditTotal > 0
    ? Math.min((benefits.credits.usedThisMonth / creditTotal) * 100, 100)
    : 0;

  // Guest pass utilization
  const guestPassScore = benefits.guestPassesPerQuarter > 0
    ? (benefits.guestPassesUsedThisQuarter / benefits.guestPassesPerQuarter) * 100
    : (benefits.guestPassesPerQuarter === 0 ? 100 : 0); // N/A = full score

  // Event attendance
  const eventScore = benefits.eventsInvited > 0
    ? (benefits.eventsAttended / benefits.eventsInvited) * 100
    : (benefits.exclusiveEventAccess ? 0 : 100); // N/A = full score

  // Bonus claiming
  let bonusItems = 0;
  let bonusClaimed = 0;
  if (benefits.birthdayBonusAmount > 0) { bonusItems++; if (benefits.birthdayBonusClaimed) bonusClaimed++; }
  if (benefits.anniversaryBonusAmount > 0) { bonusItems++; if (benefits.anniversaryBonusClaimed) bonusClaimed++; }
  const bonusScore = bonusItems > 0 ? (bonusClaimed / bonusItems) * 100 : 100;

  // Overall engagement (days since last activity)
  let engagementScore = 100;
  if (benefits.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(benefits.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 60) engagementScore = 10;
    else if (daysSinceActivity > 30) engagementScore = 40;
    else if (daysSinceActivity > 14) engagementScore = 70;
    else engagementScore = 100;
  }

  const score = Math.round(
    creditScore * weights.creditUsage +
    guestPassScore * weights.guestPasses +
    eventScore * weights.events +
    bonusScore * weights.bonuses +
    engagementScore * weights.engagement
  );

  return Math.min(100, Math.max(0, score));
}

/**
 * Build a utilization report for a member over a period.
 */
export function buildUtilizationReport(
  benefits: MemberBenefits,
  previousScore: number,
): BenefitUtilization {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentScore = calculateUtilizationScore(benefits);

  const creditTotal = benefits.credits.monthlyAllocation + benefits.credits.rolledOver;
  const creditUtilization = creditTotal > 0
    ? Math.round((benefits.credits.usedThisMonth / creditTotal) * 100)
    : 0;

  const guestPassUtilization = benefits.guestPassesPerQuarter > 0
    ? Math.round((benefits.guestPassesUsedThisQuarter / benefits.guestPassesPerQuarter) * 100)
    : 0;

  const eventAttendance = benefits.eventsInvited > 0
    ? Math.round((benefits.eventsAttended / benefits.eventsInvited) * 100)
    : 0;

  const trend: BenefitUtilization['trend'] =
    currentScore > previousScore + 5 ? 'increasing' :
    currentScore < previousScore - 5 ? 'declining' :
    'stable';

  return {
    memberId: benefits.memberId,
    period,
    creditUtilization,
    discountUtilization: benefits.discountUsedThisMonth,
    guestPassUtilization,
    eventAttendance,
    overallScore: currentScore,
    trend,
  };
}

/**
 * Build aggregate benefits analytics across all members.
 */
export function buildBenefitsAnalytics(members: MemberBenefits[]): BenefitsAnalyticsSummary {
  const activeMembers = members.filter(m => m.status === 'active');
  let totalCreditsIssued = 0;
  let totalCreditsUsed = 0;
  let totalCreditUtilization = 0;
  let totalDiscountUsage = 0;
  let totalGuestPassesIssued = 0;
  let totalGuestPassesUsed = 0;
  let birthdayBonusesClaimed = 0;
  let anniversaryBonusesClaimed = 0;
  let referralBonusesPaid = 0;

  const utilizationByTier: Record<MembershipTier, number[]> = {
    halo: [], glow: [], elite: [],
  };

  const scored: { memberId: string; clientName: string; score: number }[] = [];

  for (const m of activeMembers) {
    const score = calculateUtilizationScore(m);
    scored.push({ memberId: m.memberId, clientName: m.clientName, score });
    utilizationByTier[m.tier].push(score);

    totalCreditsIssued += m.credits.monthlyAllocation;
    totalCreditsUsed += m.credits.usedThisMonth;
    totalCreditUtilization += m.credits.monthlyAllocation > 0
      ? m.credits.usedThisMonth / m.credits.monthlyAllocation
      : 0;
    totalDiscountUsage += m.discountUsedThisMonth;
    totalGuestPassesIssued += m.guestPassesPerQuarter;
    totalGuestPassesUsed += m.guestPassesUsedThisQuarter;
    if (m.birthdayBonusClaimed) birthdayBonusesClaimed++;
    if (m.anniversaryBonusClaimed) anniversaryBonusesClaimed++;
    referralBonusesPaid += m.totalReferralBonusEarned;
  }

  const sortedByScore = [...scored].sort((a, b) => b.score - a.score);
  const topUtilizers = sortedByScore.slice(0, 10);
  const underUtilizers = [...scored].sort((a, b) => a.score - b.score).slice(0, 10);

  const avgTierUtil: Record<MembershipTier, number> = {
    halo: avg(utilizationByTier.halo),
    glow: avg(utilizationByTier.glow),
    elite: avg(utilizationByTier.elite),
  };

  return {
    totalMembers: activeMembers.length,
    averageCreditUtilization: activeMembers.length > 0
      ? Math.round((totalCreditUtilization / activeMembers.length) * 100)
      : 0,
    averageDiscountUsage: activeMembers.length > 0
      ? Math.round(totalDiscountUsage / activeMembers.length * 100) / 100
      : 0,
    totalCreditsIssued,
    totalCreditsUsed,
    totalCreditsExpired: totalCreditsIssued - totalCreditsUsed,
    creditUtilizationRate: totalCreditsIssued > 0
      ? Math.round((totalCreditsUsed / totalCreditsIssued) * 100)
      : 0,
    guestPassesIssued: totalGuestPassesIssued,
    guestPassesUsed: totalGuestPassesUsed,
    guestPassConversionRate: totalGuestPassesIssued > 0
      ? Math.round((totalGuestPassesUsed / totalGuestPassesIssued) * 100)
      : 0,
    eventsHosted: 0, // Would come from events table
    averageEventAttendance: 0,
    birthdayBonusesClaimed,
    anniversaryBonusesClaimed,
    referralBonusesPaid,
    topUtilizers,
    underUtilizers,
    utilizationByTier: avgTierUtil,
  };
}

// ── Scheduling Surveys ───────────────────────────────────────────────────

export type SurveyMilestone = 30 | 90 | 180 | 365;

/**
 * Check which satisfaction survey milestone a member has reached.
 */
export function checkSurveyMilestone(
  joinDate: string,
  completedSurveys: SurveyMilestone[],
  now?: Date,
): SurveyMilestone | null {
  const currentDate = now || new Date();
  const join = new Date(joinDate);
  const daysSinceJoin = Math.floor(
    (currentDate.getTime() - join.getTime()) / (1000 * 60 * 60 * 24)
  );

  const milestones: SurveyMilestone[] = [30, 90, 180, 365];
  for (const milestone of milestones) {
    if (daysSinceJoin >= milestone && !completedSurveys.includes(milestone)) {
      return milestone;
    }
  }
  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function generateGuestPassId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `gp_${timestamp}_${random}`;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}
