/**
 * Membership Plan Definitions — Rani Beauty Clinic
 *
 * Three tiers of luxury membership designed for discerning clients
 * who invest in their aesthetic journey.
 *
 * Tiers:
 *   Halo  ($149/mo) — Entry-level essentials
 *   Glow  ($249/mo) — Enhanced transformation experience
 *   Elite ($449/mo) — The ultimate Rani experience
 *
 * Annual billing saves 2 months (pay 10, get 12).
 * Founding members retain grandfathered rates indefinitely.
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import { MEMBERSHIP_PLAN_COPY } from '@/data/membership-copy';

// ── Types ────────────────────────────────────────────────────────────────

export type MembershipTier = 'halo' | 'glow' | 'elite';
export type BillingCycle = 'monthly' | 'annual';
export type MembershipStatus =
  | 'active'
  | 'paused'
  | 'suspended'
  | 'cancelled'
  | 'pending'
  | 'past_due'
  | 'trialing';
export type DiscountType = 'student' | 'military' | 'founding' | 'corporate' | 'family' | 'none';

export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number; // Total annual price (10 months)
  annualMonthlyEquivalent: number; // Annual price / 12
  annualSavings: number; // Dollar amount saved annually
  benefits: MembershipBenefit[];
  monthlyCredits: number; // Dollar value of monthly treatment credits
  creditRolloverMonths: number; // How many months credits roll over
  discountPercent: number; // On additional services beyond credits
  priorityBooking: boolean;
  guestPassesPerQuarter: number;
  exclusiveEvents: boolean;
  birthdayBonus: number; // Dollar value
  anniversaryBonus: number; // Dollar value
  referralBonus: number; // Dollar value per referral
  dedicatedConcierge: boolean;
  complimentaryAddOns: string[];
}

export interface MembershipBenefit {
  id: string;
  label: string;
  description: string;
  category: 'treatment' | 'discount' | 'access' | 'perk' | 'concierge';
  included: boolean;
  value?: string; // Display value like "$150/mo" or "15%"
}

export interface AddOnPricing {
  type: 'family' | 'couples' | 'corporate';
  label: string;
  description: string;
  additionalPerPerson: number; // Monthly per additional member
  minimumMembers?: number;
  maximumMembers?: number;
  discountPercent: number; // Discount on the per-person rate
}

export interface SpecialDiscount {
  type: DiscountType;
  label: string;
  discountPercent: number;
  requiresVerification: boolean;
  verificationMethod: string;
  stackable: boolean; // Can combine with other discounts
  description: string;
}

export interface UpgradeDowngradeRule {
  from: MembershipTier;
  to: MembershipTier;
  direction: 'upgrade' | 'downgrade';
  prorationType: 'immediate_credit' | 'next_cycle' | 'prorated';
  effectiveDate: 'immediate' | 'next_billing_cycle';
  restrictions: string[];
  minimumTenure: number; // Months before allowed
  cooldownPeriod: number; // Months before can change again
}

export interface PlanComparisonItem {
  feature: string;
  category: string;
  halo: string | boolean;
  glow: string | boolean;
  elite: string | boolean;
}

export interface FoundingMemberRate {
  tier: MembershipTier;
  originalMonthlyPrice: number;
  foundingMonthlyPrice: number;
  savings: number;
  lockedUntil: 'lifetime' | string; // ISO date or 'lifetime'
  maxFoundingMembers: number;
  currentFoundingMembers: number;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEMBERSHIP_TIERS: MembershipTier[] = ['halo', 'glow', 'elite'];

export const ANNUAL_DISCOUNT_MONTHS = 2; // Save 2 months on annual billing

// ── Plan Definitions ─────────────────────────────────────────────────────

const HALO_BENEFITS: MembershipBenefit[] = [
  { id: 'halo-credits', label: 'Monthly Treatment Credits', description: '$100 in treatment credits each month', category: 'treatment', included: true, value: '$100/mo' },
  { id: 'halo-discount', label: 'Service Discount', description: '10% off all additional services beyond credits', category: 'discount', included: true, value: '10%' },
  { id: 'halo-hydrafacial', label: 'Monthly HydraFacial', description: 'One signature HydraFacial per month at membership rate', category: 'treatment', included: true, value: '1/mo' },
  { id: 'halo-rollover', label: 'Credit Rollover', description: 'Unused credits roll over for 1 month', category: 'perk', included: true, value: '1 month' },
  { id: 'halo-birthday', label: 'Birthday Bonus', description: '$50 bonus credit during your birthday month', category: 'perk', included: true, value: '$50' },
  { id: 'halo-priority', label: 'Priority Booking', description: 'Book up to 48 hours before general availability', category: 'access', included: false },
  { id: 'halo-guest', label: 'Guest Passes', description: 'Bring a friend with a complimentary consultation', category: 'access', included: false },
  { id: 'halo-events', label: 'Exclusive Events', description: 'VIP access to Rani launch events and previews', category: 'access', included: false },
  { id: 'halo-concierge', label: 'Dedicated Concierge', description: 'Personal aesthetic advisor for your journey', category: 'concierge', included: false },
];

const GLOW_BENEFITS: MembershipBenefit[] = [
  { id: 'glow-credits', label: 'Monthly Treatment Credits', description: '$200 in treatment credits each month', category: 'treatment', included: true, value: '$200/mo' },
  { id: 'glow-discount', label: 'Service Discount', description: '15% off all additional services beyond credits', category: 'discount', included: true, value: '15%' },
  { id: 'glow-hydrafacial', label: 'Monthly HydraFacial', description: 'One signature HydraFacial per month included', category: 'treatment', included: true, value: 'Included' },
  { id: 'glow-injection', label: 'Quarterly Wellness Injection', description: 'One premium wellness injection per quarter (B12, Glutathione, or Tri-Immune)', category: 'treatment', included: true, value: '1/quarter' },
  { id: 'glow-rollover', label: 'Credit Rollover', description: 'Unused credits roll over for 1 month', category: 'perk', included: true, value: '1 month' },
  { id: 'glow-birthday', label: 'Birthday Bonus', description: '$100 bonus credit during your birthday month', category: 'perk', included: true, value: '$100' },
  { id: 'glow-anniversary', label: 'Anniversary Bonus', description: '$75 bonus on your membership anniversary', category: 'perk', included: true, value: '$75' },
  { id: 'glow-priority', label: 'Priority Booking', description: 'Book up to 48 hours before general availability', category: 'access', included: true },
  { id: 'glow-guest', label: 'Guest Passes', description: 'One guest pass per quarter — bring a friend for 20% off', category: 'access', included: true, value: '1/quarter' },
  { id: 'glow-events', label: 'Exclusive Events', description: 'VIP access to Rani launch events and previews', category: 'access', included: false },
  { id: 'glow-concierge', label: 'Dedicated Concierge', description: 'Personal aesthetic advisor for your journey', category: 'concierge', included: false },
];

const ELITE_BENEFITS: MembershipBenefit[] = [
  { id: 'elite-credits', label: 'Monthly Treatment Credits', description: '$400 in treatment credits each month', category: 'treatment', included: true, value: '$400/mo' },
  { id: 'elite-discount', label: 'Service Discount', description: '20% off all additional services beyond credits', category: 'discount', included: true, value: '20%' },
  { id: 'elite-hydrafacial', label: 'Monthly HydraFacial', description: 'Signature HydraFacial included monthly', category: 'treatment', included: true, value: 'Included' },
  { id: 'elite-injection', label: 'Monthly Wellness Injection', description: 'One premium wellness injection per month (your choice)', category: 'treatment', included: true, value: '1/mo' },
  { id: 'elite-peel', label: 'Quarterly Chemical Peel', description: 'One VI Peel or PRX-T33 per quarter', category: 'treatment', included: true, value: '1/quarter' },
  { id: 'elite-rollover', label: 'Credit Rollover', description: 'Unused credits roll over for 1 month', category: 'perk', included: true, value: '1 month' },
  { id: 'elite-birthday', label: 'Birthday Bonus', description: '$200 bonus credit during your birthday month', category: 'perk', included: true, value: '$200' },
  { id: 'elite-anniversary', label: 'Anniversary Bonus', description: '$150 bonus on your membership anniversary', category: 'perk', included: true, value: '$150' },
  { id: 'elite-referral', label: 'Referral Bonus', description: '$100 credit for each referred member who joins', category: 'perk', included: true, value: '$100' },
  { id: 'elite-priority', label: 'Priority Booking', description: 'Book up to 72 hours before general availability', category: 'access', included: true, value: '72hr advance' },
  { id: 'elite-guest', label: 'Guest Passes', description: 'Two guest passes per quarter — friends get 25% off', category: 'access', included: true, value: '2/quarter' },
  { id: 'elite-events', label: 'Exclusive Events', description: 'VIP access to Rani launch events, previews, and private masterclasses', category: 'access', included: true },
  { id: 'elite-concierge', label: 'Dedicated Concierge', description: 'Personal aesthetic advisor — direct text/call line for your journey', category: 'concierge', included: true },
  { id: 'elite-addons', label: 'Complimentary Add-Ons', description: 'LED therapy, dermaplaning, and skincare samples included', category: 'treatment', included: true },
];

export const PLANS: Record<MembershipTier, MembershipPlan> = {
  halo: {
    tier: 'halo',
    name: MEMBERSHIP_PLAN_COPY.halo.name,
    tagline: MEMBERSHIP_PLAN_COPY.halo.tagline,
    monthlyPrice: MEMBERSHIP_PLAN_COPY.halo.monthlyPrice,
    annualPrice: MEMBERSHIP_PLAN_COPY.halo.monthlyPrice * 10, // $1,490 (save 2 months = $298)
    annualMonthlyEquivalent: Math.round((MEMBERSHIP_PLAN_COPY.halo.monthlyPrice * 10) / 12 * 100) / 100,
    annualSavings: MEMBERSHIP_PLAN_COPY.halo.monthlyPrice * 2,
    benefits: HALO_BENEFITS,
    monthlyCredits: 100,
    creditRolloverMonths: 1,
    discountPercent: 10,
    priorityBooking: false,
    guestPassesPerQuarter: 0,
    exclusiveEvents: false,
    birthdayBonus: 50,
    anniversaryBonus: 0,
    referralBonus: 50,
    dedicatedConcierge: false,
    complimentaryAddOns: [],
  },
  glow: {
    tier: 'glow',
    name: MEMBERSHIP_PLAN_COPY.glow.name,
    tagline: MEMBERSHIP_PLAN_COPY.glow.tagline,
    monthlyPrice: MEMBERSHIP_PLAN_COPY.glow.monthlyPrice,
    annualPrice: MEMBERSHIP_PLAN_COPY.glow.monthlyPrice * 10, // $2,490 (save 2 months = $498)
    annualMonthlyEquivalent: Math.round((MEMBERSHIP_PLAN_COPY.glow.monthlyPrice * 10) / 12 * 100) / 100,
    annualSavings: MEMBERSHIP_PLAN_COPY.glow.monthlyPrice * 2,
    benefits: GLOW_BENEFITS,
    monthlyCredits: 200,
    creditRolloverMonths: 1,
    discountPercent: 15,
    priorityBooking: true,
    guestPassesPerQuarter: 1,
    exclusiveEvents: false,
    birthdayBonus: 100,
    anniversaryBonus: 75,
    referralBonus: 75,
    dedicatedConcierge: false,
    complimentaryAddOns: [],
  },
  elite: {
    tier: 'elite',
    name: MEMBERSHIP_PLAN_COPY.elite.name,
    tagline: MEMBERSHIP_PLAN_COPY.elite.tagline,
    monthlyPrice: MEMBERSHIP_PLAN_COPY.elite.monthlyPrice,
    annualPrice: MEMBERSHIP_PLAN_COPY.elite.monthlyPrice * 10, // $4,490 (save 2 months = $898)
    annualMonthlyEquivalent: Math.round((MEMBERSHIP_PLAN_COPY.elite.monthlyPrice * 10) / 12 * 100) / 100,
    annualSavings: MEMBERSHIP_PLAN_COPY.elite.monthlyPrice * 2,
    benefits: ELITE_BENEFITS,
    monthlyCredits: 400,
    creditRolloverMonths: 1,
    discountPercent: 20,
    priorityBooking: true,
    guestPassesPerQuarter: 2,
    exclusiveEvents: true,
    birthdayBonus: 200,
    anniversaryBonus: 150,
    referralBonus: 100,
    dedicatedConcierge: true,
    complimentaryAddOns: ['LED light therapy', 'Dermaplaning add-on', 'Skincare sample kit'],
  },
};

// ── Add-On Pricing ───────────────────────────────────────────────────────

export const ADD_ON_PRICING: AddOnPricing[] = [
  {
    type: 'family',
    label: 'Family Add-On',
    description: 'Add family members to your membership at a reduced rate',
    additionalPerPerson: 0, // Calculated per tier
    minimumMembers: 2,
    maximumMembers: 6,
    discountPercent: 20, // 20% off per additional family member
  },
  {
    type: 'couples',
    label: 'Couples Membership',
    description: 'Two memberships, one journey — save together',
    additionalPerPerson: 0,
    minimumMembers: 2,
    maximumMembers: 2,
    discountPercent: 15, // 15% off the second membership
  },
  {
    type: 'corporate',
    label: 'Corporate Wellness',
    description: 'Elevate your team with luxury aesthetic wellness benefits',
    additionalPerPerson: 0,
    minimumMembers: 5,
    maximumMembers: 50,
    discountPercent: 25, // 25% off per member
  },
];

/**
 * Calculate the monthly price for an add-on member.
 */
export function calculateAddOnPrice(tier: MembershipTier, addOnType: AddOnPricing['type']): number {
  const plan = PLANS[tier];
  const addOn = ADD_ON_PRICING.find(a => a.type === addOnType);
  if (!addOn) return plan.monthlyPrice;

  const discount = addOn.discountPercent / 100;
  return Math.round(plan.monthlyPrice * (1 - discount) * 100) / 100;
}

/**
 * Calculate total monthly cost for a group membership.
 */
export function calculateGroupPrice(
  tier: MembershipTier,
  addOnType: AddOnPricing['type'],
  totalMembers: number,
): { primaryPrice: number; addOnPrice: number; totalMonthly: number; totalAnnual: number; savingsPerMember: number } {
  const plan = PLANS[tier];
  const addOnPrice = calculateAddOnPrice(tier, addOnType);
  const additionalMembers = Math.max(totalMembers - 1, 0);
  const totalMonthly = plan.monthlyPrice + (addOnPrice * additionalMembers);
  const totalAnnual = totalMonthly * 10; // Annual = 10 months
  const savingsPerMember = plan.monthlyPrice - addOnPrice;

  return { primaryPrice: plan.monthlyPrice, addOnPrice, totalMonthly, totalAnnual, savingsPerMember };
}

// ── Special Discounts ────────────────────────────────────────────────────

export const SPECIAL_DISCOUNTS: SpecialDiscount[] = [
  {
    type: 'student',
    label: 'Student Discount',
    discountPercent: 15,
    requiresVerification: true,
    verificationMethod: 'Valid student ID or .edu email required',
    stackable: false,
    description: '15% off any membership tier for full-time students',
  },
  {
    type: 'military',
    label: 'Military & First Responder',
    discountPercent: 15,
    requiresVerification: true,
    verificationMethod: 'Military ID, VA card, or department badge required',
    stackable: false,
    description: '15% off for active duty, veterans, and first responders',
  },
  {
    type: 'founding',
    label: 'Founding Member',
    discountPercent: 20,
    requiresVerification: false,
    verificationMethod: 'Automatically applied — limited to first 50 members',
    stackable: false,
    description: 'Lock in 20% below standard rates for as long as you remain a member',
  },
  {
    type: 'corporate',
    label: 'Corporate Partner',
    discountPercent: 25,
    requiresVerification: true,
    verificationMethod: 'Corporate partnership agreement required',
    stackable: false,
    description: '25% off for approved corporate wellness partners (5+ members)',
  },
];

/**
 * Apply a discount to a plan price.
 */
export function applyDiscount(
  monthlyPrice: number,
  discountType: DiscountType,
): { originalPrice: number; discountPercent: number; discountAmount: number; finalPrice: number } {
  if (discountType === 'none' || discountType === 'family') {
    return { originalPrice: monthlyPrice, discountPercent: 0, discountAmount: 0, finalPrice: monthlyPrice };
  }

  const discount = SPECIAL_DISCOUNTS.find(d => d.type === discountType);
  if (!discount) {
    return { originalPrice: monthlyPrice, discountPercent: 0, discountAmount: 0, finalPrice: monthlyPrice };
  }

  const discountAmount = Math.round(monthlyPrice * (discount.discountPercent / 100) * 100) / 100;
  return {
    originalPrice: monthlyPrice,
    discountPercent: discount.discountPercent,
    discountAmount,
    finalPrice: monthlyPrice - discountAmount,
  };
}

// ── Founding Member Rates ────────────────────────────────────────────────

export const FOUNDING_MEMBER_RATES: FoundingMemberRate[] = [
  {
    tier: 'halo',
    originalMonthlyPrice: MEMBERSHIP_PLAN_COPY.halo.monthlyPrice,
    foundingMonthlyPrice: 119,
    savings: MEMBERSHIP_PLAN_COPY.halo.monthlyPrice - 119,
    lockedUntil: 'lifetime',
    maxFoundingMembers: 50,
    currentFoundingMembers: 0,
  },
  {
    tier: 'glow',
    originalMonthlyPrice: MEMBERSHIP_PLAN_COPY.glow.monthlyPrice,
    foundingMonthlyPrice: 199,
    savings: MEMBERSHIP_PLAN_COPY.glow.monthlyPrice - 199,
    lockedUntil: 'lifetime',
    maxFoundingMembers: 50,
    currentFoundingMembers: 0,
  },
  {
    tier: 'elite',
    originalMonthlyPrice: MEMBERSHIP_PLAN_COPY.elite.monthlyPrice,
    foundingMonthlyPrice: 359,
    savings: MEMBERSHIP_PLAN_COPY.elite.monthlyPrice - 359,
    lockedUntil: 'lifetime',
    maxFoundingMembers: 50,
    currentFoundingMembers: 0,
  },
];

/**
 * Check if founding member spots are available for a tier.
 */
export function isFoundingSpotAvailable(tier: MembershipTier): boolean {
  const rate = FOUNDING_MEMBER_RATES.find(r => r.tier === tier);
  return !!rate && rate.currentFoundingMembers < rate.maxFoundingMembers;
}

/**
 * Get the founding member rate for a tier.
 */
export function getFoundingRate(tier: MembershipTier): FoundingMemberRate | null {
  return FOUNDING_MEMBER_RATES.find(r => r.tier === tier) ?? null;
}

// ── Upgrade / Downgrade Rules ────────────────────────────────────────────

export const UPGRADE_DOWNGRADE_RULES: UpgradeDowngradeRule[] = [
  // Upgrades
  {
    from: 'halo', to: 'glow', direction: 'upgrade',
    prorationType: 'immediate_credit',
    effectiveDate: 'immediate',
    restrictions: ['Account must be in good standing', 'No pending payments'],
    minimumTenure: 0,
    cooldownPeriod: 1,
  },
  {
    from: 'halo', to: 'elite', direction: 'upgrade',
    prorationType: 'immediate_credit',
    effectiveDate: 'immediate',
    restrictions: ['Account must be in good standing', 'No pending payments'],
    minimumTenure: 0,
    cooldownPeriod: 1,
  },
  {
    from: 'glow', to: 'elite', direction: 'upgrade',
    prorationType: 'immediate_credit',
    effectiveDate: 'immediate',
    restrictions: ['Account must be in good standing', 'No pending payments'],
    minimumTenure: 0,
    cooldownPeriod: 1,
  },
  // Downgrades
  {
    from: 'elite', to: 'glow', direction: 'downgrade',
    prorationType: 'next_cycle',
    effectiveDate: 'next_billing_cycle',
    restrictions: ['Minimum 3 months at current tier', 'No active save offer'],
    minimumTenure: 3,
    cooldownPeriod: 3,
  },
  {
    from: 'elite', to: 'halo', direction: 'downgrade',
    prorationType: 'next_cycle',
    effectiveDate: 'next_billing_cycle',
    restrictions: ['Minimum 3 months at current tier', 'No active save offer'],
    minimumTenure: 3,
    cooldownPeriod: 3,
  },
  {
    from: 'glow', to: 'halo', direction: 'downgrade',
    prorationType: 'next_cycle',
    effectiveDate: 'next_billing_cycle',
    restrictions: ['Minimum 3 months at current tier', 'No active save offer'],
    minimumTenure: 3,
    cooldownPeriod: 3,
  },
];

/**
 * Find the rule for a specific tier change.
 */
export function getChangeRule(from: MembershipTier, to: MembershipTier): UpgradeDowngradeRule | null {
  return UPGRADE_DOWNGRADE_RULES.find(r => r.from === from && r.to === to) ?? null;
}

/**
 * Check if a tier change is allowed given the member's tenure.
 */
export function canChangeTier(
  from: MembershipTier,
  to: MembershipTier,
  monthsAtCurrentTier: number,
  monthsSinceLastChange: number,
  isInGoodStanding: boolean,
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: false, reason: 'Already on this tier' };

  const rule = getChangeRule(from, to);
  if (!rule) return { allowed: false, reason: 'Invalid tier change' };

  if (!isInGoodStanding) {
    return { allowed: false, reason: 'Account must be in good standing to change tiers' };
  }
  if (monthsAtCurrentTier < rule.minimumTenure) {
    return { allowed: false, reason: `Must be on current tier for at least ${rule.minimumTenure} months (${monthsAtCurrentTier} months so far)` };
  }
  if (monthsSinceLastChange < rule.cooldownPeriod) {
    return { allowed: false, reason: `Must wait ${rule.cooldownPeriod} months between tier changes (${monthsSinceLastChange} months since last change)` };
  }

  return { allowed: true };
}

/**
 * Calculate proration for a tier change.
 */
export function calculateProration(
  fromTier: MembershipTier,
  toTier: MembershipTier,
  daysRemainingInCycle: number,
  totalDaysInCycle: number,
  billingCycle: BillingCycle = 'monthly',
): { creditAmount: number; chargeAmount: number; netAmount: number; effectiveDate: 'immediate' | 'next_billing_cycle' } {
  const rule = getChangeRule(fromTier, toTier);
  if (!rule) {
    return { creditAmount: 0, chargeAmount: 0, netAmount: 0, effectiveDate: 'next_billing_cycle' };
  }

  if (rule.prorationType === 'next_cycle') {
    return { creditAmount: 0, chargeAmount: 0, netAmount: 0, effectiveDate: 'next_billing_cycle' };
  }

  const fromPrice = billingCycle === 'annual' ? PLANS[fromTier].annualMonthlyEquivalent : PLANS[fromTier].monthlyPrice;
  const toPrice = billingCycle === 'annual' ? PLANS[toTier].annualMonthlyEquivalent : PLANS[toTier].monthlyPrice;

  const dailyRate = totalDaysInCycle > 0 ? daysRemainingInCycle / totalDaysInCycle : 0;
  const creditAmount = Math.round(fromPrice * dailyRate * 100) / 100;
  const chargeAmount = Math.round(toPrice * dailyRate * 100) / 100;
  const netAmount = Math.round((chargeAmount - creditAmount) * 100) / 100;

  return { creditAmount, chargeAmount, netAmount, effectiveDate: 'immediate' };
}

// ── Plan Comparison Matrix ───────────────────────────────────────────────

export const PLAN_COMPARISON: PlanComparisonItem[] = [
  // Treatment
  { feature: 'Monthly Treatment Credits', category: 'Treatment', halo: '$100', glow: '$200', elite: '$400' },
  { feature: 'Signature HydraFacial', category: 'Treatment', halo: 'Member rate', glow: 'Included', elite: 'Included' },
  { feature: 'Wellness Injections', category: 'Treatment', halo: false, glow: '1/quarter', elite: '1/month' },
  { feature: 'Chemical Peel (VI or PRX-T33)', category: 'Treatment', halo: false, glow: false, elite: '1/quarter' },
  { feature: 'Complimentary Add-Ons', category: 'Treatment', halo: false, glow: false, elite: 'LED, Dermaplaning, Samples' },

  // Savings
  { feature: 'Service Discount', category: 'Savings', halo: '10%', glow: '15%', elite: '20%' },
  { feature: 'Credit Rollover', category: 'Savings', halo: '1 month', glow: '1 month', elite: '1 month' },
  { feature: 'Annual Billing Savings', category: 'Savings', halo: '$298/yr', glow: '$498/yr', elite: '$898/yr' },

  // Access
  { feature: 'Priority Booking', category: 'Access', halo: false, glow: '48hr advance', elite: '72hr advance' },
  { feature: 'Guest Passes', category: 'Access', halo: false, glow: '1/quarter', elite: '2/quarter' },
  { feature: 'Exclusive Events', category: 'Access', halo: false, glow: false, elite: true },
  { feature: 'Dedicated Concierge', category: 'Access', halo: false, glow: false, elite: true },

  // Perks
  { feature: 'Birthday Bonus', category: 'Perks', halo: '$50', glow: '$100', elite: '$200' },
  { feature: 'Anniversary Bonus', category: 'Perks', halo: false, glow: '$75', elite: '$150' },
  { feature: 'Referral Bonus', category: 'Perks', halo: '$50', glow: '$75', elite: '$100' },
];

// ── Utility Functions ────────────────────────────────────────────────────

/**
 * Get a plan by tier.
 */
export function getPlan(tier: MembershipTier): MembershipPlan {
  return PLANS[tier];
}

/**
 * Get the effective monthly price for a plan given billing cycle and discount.
 */
export function getEffectiveMonthlyPrice(
  tier: MembershipTier,
  billingCycle: BillingCycle,
  discountType: DiscountType = 'none',
): number {
  const plan = PLANS[tier];
  const basePrice = billingCycle === 'annual' ? plan.annualMonthlyEquivalent : plan.monthlyPrice;
  const { finalPrice } = applyDiscount(basePrice, discountType);
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Get all plan tiers sorted by price ascending.
 */
export function getAllPlans(): MembershipPlan[] {
  return MEMBERSHIP_TIERS.map(t => PLANS[t]);
}

/**
 * Calculate the value proposition of a tier (savings vs a la carte).
 */
export function calculateValueProposition(tier: MembershipTier): {
  monthlyCredits: number;
  annualCreditValue: number;
  annualMembershipCost: number;
  annualSavingsVsAlaCarte: number;
  valueMultiplier: number;
} {
  const plan = PLANS[tier];
  const annualCreditValue = plan.monthlyCredits * 12;
  const annualMembershipCost = plan.monthlyPrice * 12;
  // Include birthday + anniversary as bonus value
  const totalAnnualValue = annualCreditValue + plan.birthdayBonus + plan.anniversaryBonus;
  const annualSavingsVsAlaCarte = totalAnnualValue - annualMembershipCost;
  const valueMultiplier = annualMembershipCost > 0
    ? Math.round((totalAnnualValue / annualMembershipCost) * 100) / 100
    : 0;

  return {
    monthlyCredits: plan.monthlyCredits,
    annualCreditValue,
    annualMembershipCost,
    annualSavingsVsAlaCarte,
    valueMultiplier,
  };
}

/**
 * Get the recommended tier based on monthly treatment spend.
 */
export function recommendTier(monthlySpend: number): MembershipTier {
  if (monthlySpend >= 350) return 'elite';
  if (monthlySpend >= 200) return 'glow';
  return 'halo';
}

/**
 * Generate a unique membership ID.
 */
export function generateMembershipId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mem_${timestamp}_${random}`;
}
