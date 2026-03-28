// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  PLANS,
  MEMBERSHIP_TIERS,
  PLAN_COMPARISON,
  FOUNDING_MEMBER_RATES,
  UPGRADE_DOWNGRADE_RULES,
  ADD_ON_PRICING,
  SPECIAL_DISCOUNTS,
  getPlan,
  getAllPlans,
  getEffectiveMonthlyPrice,
  applyDiscount,
  calculateAddOnPrice,
  calculateGroupPrice,
  calculateProration,
  canChangeTier,
  getChangeRule,
  isFoundingSpotAvailable,
  getFoundingRate,
  recommendTier,
  calculateValueProposition,
  generateMembershipId,
  type MembershipTier,
  type BillingCycle,
} from '../plans';

// ── Plan Definitions ─────────────────────────────────────────────────────

describe('Membership Plans', () => {
  it('defines exactly 3 tiers', () => {
    expect(MEMBERSHIP_TIERS).toHaveLength(3);
    expect(MEMBERSHIP_TIERS).toEqual(['halo', 'glow', 'elite']);
  });

  it('has correct monthly prices', () => {
    expect(PLANS.halo.monthlyPrice).toBe(149);
    expect(PLANS.glow.monthlyPrice).toBe(249);
    expect(PLANS.elite.monthlyPrice).toBe(449);
  });

  it('prices are in ascending order', () => {
    expect(PLANS.halo.monthlyPrice).toBeLessThan(PLANS.glow.monthlyPrice);
    expect(PLANS.glow.monthlyPrice).toBeLessThan(PLANS.elite.monthlyPrice);
  });

  it('annual price saves 2 months', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      const plan = PLANS[tier];
      expect(plan.annualPrice).toBe(plan.monthlyPrice * 10);
      expect(plan.annualSavings).toBe(plan.monthlyPrice * 2);
    }
  });

  it('annual monthly equivalent is less than monthly price', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      const plan = PLANS[tier];
      expect(plan.annualMonthlyEquivalent).toBeLessThan(plan.monthlyPrice);
    }
  });

  it('every plan has a name and tagline', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      const plan = PLANS[tier];
      expect(plan.name).toBeTruthy();
      expect(plan.tagline).toBeTruthy();
    }
  });

  it('every plan has benefits array', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      expect(PLANS[tier].benefits.length).toBeGreaterThan(0);
    }
  });

  it('halo has lowest credits, elite has highest', () => {
    expect(PLANS.halo.monthlyCredits).toBeLessThan(PLANS.glow.monthlyCredits);
    expect(PLANS.glow.monthlyCredits).toBeLessThan(PLANS.elite.monthlyCredits);
  });

  it('halo credits = $100, glow = $200, elite = $400', () => {
    expect(PLANS.halo.monthlyCredits).toBe(100);
    expect(PLANS.glow.monthlyCredits).toBe(200);
    expect(PLANS.elite.monthlyCredits).toBe(400);
  });

  it('discount percents increase by tier', () => {
    expect(PLANS.halo.discountPercent).toBeLessThan(PLANS.glow.discountPercent);
    expect(PLANS.glow.discountPercent).toBeLessThan(PLANS.elite.discountPercent);
  });

  it('halo = 10%, glow = 15%, elite = 20% discount', () => {
    expect(PLANS.halo.discountPercent).toBe(10);
    expect(PLANS.glow.discountPercent).toBe(15);
    expect(PLANS.elite.discountPercent).toBe(20);
  });

  it('only elite has exclusive events', () => {
    expect(PLANS.halo.exclusiveEvents).toBe(false);
    expect(PLANS.glow.exclusiveEvents).toBe(false);
    expect(PLANS.elite.exclusiveEvents).toBe(true);
  });

  it('only elite has dedicated concierge', () => {
    expect(PLANS.halo.dedicatedConcierge).toBe(false);
    expect(PLANS.glow.dedicatedConcierge).toBe(false);
    expect(PLANS.elite.dedicatedConcierge).toBe(true);
  });

  it('guest passes: halo 0, glow 1, elite 2 per quarter', () => {
    expect(PLANS.halo.guestPassesPerQuarter).toBe(0);
    expect(PLANS.glow.guestPassesPerQuarter).toBe(1);
    expect(PLANS.elite.guestPassesPerQuarter).toBe(2);
  });

  it('birthday bonuses increase by tier', () => {
    expect(PLANS.halo.birthdayBonus).toBe(50);
    expect(PLANS.glow.birthdayBonus).toBe(100);
    expect(PLANS.elite.birthdayBonus).toBe(200);
  });

  it('creditRolloverMonths is 1 for all tiers', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      expect(PLANS[tier].creditRolloverMonths).toBe(1);
    }
  });
});

// ── Plan Access Functions ────────────────────────────────────────────────

describe('getPlan', () => {
  it('returns correct plan for each tier', () => {
    expect(getPlan('halo').name).toBe('Halo');
    expect(getPlan('glow').name).toBe('Glow');
    expect(getPlan('elite').name).toBe('Elite');
  });
});

describe('getAllPlans', () => {
  it('returns 3 plans sorted by price', () => {
    const plans = getAllPlans();
    expect(plans).toHaveLength(3);
    expect(plans[0].monthlyPrice).toBeLessThanOrEqual(plans[1].monthlyPrice);
    expect(plans[1].monthlyPrice).toBeLessThanOrEqual(plans[2].monthlyPrice);
  });
});

// ── Pricing ──────────────────────────────────────────────────────────────

describe('getEffectiveMonthlyPrice', () => {
  it('returns base price for monthly billing without discount', () => {
    expect(getEffectiveMonthlyPrice('halo', 'monthly')).toBe(149);
    expect(getEffectiveMonthlyPrice('glow', 'monthly')).toBe(249);
    expect(getEffectiveMonthlyPrice('elite', 'monthly')).toBe(449);
  });

  it('returns lower price for annual billing', () => {
    const monthly = getEffectiveMonthlyPrice('glow', 'monthly');
    const annual = getEffectiveMonthlyPrice('glow', 'annual');
    expect(annual).toBeLessThan(monthly);
  });

  it('applies student discount correctly', () => {
    const base = getEffectiveMonthlyPrice('halo', 'monthly');
    const discounted = getEffectiveMonthlyPrice('halo', 'monthly', 'student');
    expect(discounted).toBeLessThan(base);
    expect(discounted).toBeCloseTo(149 * 0.85, 1);
  });

  it('applies military discount correctly', () => {
    const discounted = getEffectiveMonthlyPrice('glow', 'monthly', 'military');
    expect(discounted).toBeCloseTo(249 * 0.85, 1);
  });

  it('no discount returns full price', () => {
    expect(getEffectiveMonthlyPrice('elite', 'monthly', 'none')).toBe(449);
  });
});

describe('applyDiscount', () => {
  it('returns zero discount for "none" type', () => {
    const result = applyDiscount(249, 'none');
    expect(result.discountPercent).toBe(0);
    expect(result.finalPrice).toBe(249);
  });

  it('applies student discount (15%)', () => {
    const result = applyDiscount(149, 'student');
    expect(result.discountPercent).toBe(15);
    expect(result.discountAmount).toBeCloseTo(22.35, 1);
    expect(result.finalPrice).toBeCloseTo(126.65, 1);
  });

  it('applies founding member discount (20%)', () => {
    const result = applyDiscount(449, 'founding');
    expect(result.discountPercent).toBe(20);
    expect(result.discountAmount).toBeCloseTo(89.80, 1);
  });

  it('handles zero price', () => {
    const result = applyDiscount(0, 'student');
    expect(result.finalPrice).toBe(0);
  });
});

// ── Add-On Pricing ───────────────────────────────────────────────────────

describe('calculateAddOnPrice', () => {
  it('applies family 20% discount', () => {
    const price = calculateAddOnPrice('glow', 'family');
    expect(price).toBeCloseTo(249 * 0.8, 1);
  });

  it('applies couples 15% discount', () => {
    const price = calculateAddOnPrice('elite', 'couples');
    expect(price).toBeCloseTo(449 * 0.85, 1);
  });

  it('applies corporate 25% discount', () => {
    const price = calculateAddOnPrice('halo', 'corporate');
    expect(price).toBeCloseTo(149 * 0.75, 1);
  });
});

describe('calculateGroupPrice', () => {
  it('calculates total for a couple', () => {
    const result = calculateGroupPrice('glow', 'couples', 2);
    expect(result.primaryPrice).toBe(249);
    expect(result.addOnPrice).toBeLessThan(249);
    expect(result.totalMonthly).toBeGreaterThan(249);
    expect(result.totalMonthly).toBeLessThan(249 * 2);
  });

  it('annual price is 10 months of total', () => {
    const result = calculateGroupPrice('halo', 'family', 3);
    expect(result.totalAnnual).toBe(result.totalMonthly * 10);
  });

  it('savings per member is positive', () => {
    const result = calculateGroupPrice('elite', 'corporate', 10);
    expect(result.savingsPerMember).toBeGreaterThan(0);
  });
});

// ── Founding Members ─────────────────────────────────────────────────────

describe('Founding Member Rates', () => {
  it('has rates for all 3 tiers', () => {
    expect(FOUNDING_MEMBER_RATES).toHaveLength(3);
  });

  it('founding rates are lower than standard', () => {
    for (const rate of FOUNDING_MEMBER_RATES) {
      expect(rate.foundingMonthlyPrice).toBeLessThan(rate.originalMonthlyPrice);
    }
  });

  it('max founding members is 50 per tier', () => {
    for (const rate of FOUNDING_MEMBER_RATES) {
      expect(rate.maxFoundingMembers).toBe(50);
    }
  });

  it('isFoundingSpotAvailable returns true when spots exist', () => {
    expect(isFoundingSpotAvailable('halo')).toBe(true);
  });

  it('getFoundingRate returns correct data', () => {
    const rate = getFoundingRate('elite');
    expect(rate).not.toBeNull();
    expect(rate!.foundingMonthlyPrice).toBe(359);
  });
});

// ── Upgrade / Downgrade ──────────────────────────────────────────────────

describe('Upgrade/Downgrade Rules', () => {
  it('has 6 rules (3 upgrade + 3 downgrade)', () => {
    expect(UPGRADE_DOWNGRADE_RULES).toHaveLength(6);
  });

  it('upgrades are immediate', () => {
    const upgradeRules = UPGRADE_DOWNGRADE_RULES.filter(r => r.direction === 'upgrade');
    for (const rule of upgradeRules) {
      expect(rule.effectiveDate).toBe('immediate');
    }
  });

  it('downgrades take effect next billing cycle', () => {
    const downgradeRules = UPGRADE_DOWNGRADE_RULES.filter(r => r.direction === 'downgrade');
    for (const rule of downgradeRules) {
      expect(rule.effectiveDate).toBe('next_billing_cycle');
    }
  });

  it('downgrades require minimum 3 months tenure', () => {
    const downgradeRules = UPGRADE_DOWNGRADE_RULES.filter(r => r.direction === 'downgrade');
    for (const rule of downgradeRules) {
      expect(rule.minimumTenure).toBe(3);
    }
  });
});

describe('canChangeTier', () => {
  it('allows upgrade when in good standing', () => {
    const result = canChangeTier('halo', 'glow', 0, 12, true);
    expect(result.allowed).toBe(true);
  });

  it('blocks upgrade when not in good standing', () => {
    const result = canChangeTier('halo', 'glow', 0, 12, false);
    expect(result.allowed).toBe(false);
  });

  it('blocks downgrade before minimum tenure', () => {
    const result = canChangeTier('elite', 'glow', 1, 12, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('3 months');
  });

  it('allows downgrade after minimum tenure', () => {
    const result = canChangeTier('elite', 'glow', 4, 12, true);
    expect(result.allowed).toBe(true);
  });

  it('blocks same tier change', () => {
    const result = canChangeTier('glow', 'glow', 12, 12, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Already');
  });

  it('blocks change within cooldown period', () => {
    const result = canChangeTier('elite', 'halo', 6, 1, true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('wait');
  });
});

describe('calculateProration', () => {
  it('returns zero for next_cycle proration', () => {
    const result = calculateProration('elite', 'glow', 15, 30);
    expect(result.effectiveDate).toBe('next_billing_cycle');
    expect(result.netAmount).toBe(0);
  });

  it('calculates immediate upgrade proration', () => {
    const result = calculateProration('halo', 'glow', 15, 30);
    expect(result.effectiveDate).toBe('immediate');
    expect(result.chargeAmount).toBeGreaterThan(result.creditAmount);
    expect(result.netAmount).toBeGreaterThan(0);
  });

  it('proration is zero at end of cycle', () => {
    const result = calculateProration('halo', 'elite', 0, 30);
    expect(result.creditAmount).toBe(0);
    expect(result.chargeAmount).toBe(0);
  });
});

// ── Comparison Matrix ────────────────────────────────────────────────────

describe('Plan Comparison', () => {
  it('has comparison items', () => {
    expect(PLAN_COMPARISON.length).toBeGreaterThan(10);
  });

  it('every item has all 3 tier values', () => {
    for (const item of PLAN_COMPARISON) {
      expect(item).toHaveProperty('halo');
      expect(item).toHaveProperty('glow');
      expect(item).toHaveProperty('elite');
    }
  });

  it('has items for each category', () => {
    const categories = new Set(PLAN_COMPARISON.map(i => i.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});

// ── Special Discounts ────────────────────────────────────────────────────

describe('Special Discounts', () => {
  it('has student, military, founding, corporate discounts', () => {
    const types = SPECIAL_DISCOUNTS.map(d => d.type);
    expect(types).toContain('student');
    expect(types).toContain('military');
    expect(types).toContain('founding');
    expect(types).toContain('corporate');
  });

  it('student and military are 15% and require verification', () => {
    const student = SPECIAL_DISCOUNTS.find(d => d.type === 'student')!;
    const military = SPECIAL_DISCOUNTS.find(d => d.type === 'military')!;
    expect(student.discountPercent).toBe(15);
    expect(military.discountPercent).toBe(15);
    expect(student.requiresVerification).toBe(true);
    expect(military.requiresVerification).toBe(true);
  });

  it('founding member discount is 20%', () => {
    const founding = SPECIAL_DISCOUNTS.find(d => d.type === 'founding')!;
    expect(founding.discountPercent).toBe(20);
  });

  it('no discounts are stackable', () => {
    for (const d of SPECIAL_DISCOUNTS) {
      expect(d.stackable).toBe(false);
    }
  });
});

// ── Utility Functions ────────────────────────────────────────────────────

describe('recommendTier', () => {
  it('recommends halo for low spenders', () => {
    expect(recommendTier(100)).toBe('halo');
    expect(recommendTier(150)).toBe('halo');
  });

  it('recommends glow for moderate spenders', () => {
    expect(recommendTier(200)).toBe('glow');
    expect(recommendTier(300)).toBe('glow');
  });

  it('recommends elite for high spenders', () => {
    expect(recommendTier(350)).toBe('elite');
    expect(recommendTier(500)).toBe('elite');
  });
});

describe('calculateValueProposition', () => {
  it('returns positive value multiplier', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      const value = calculateValueProposition(tier);
      expect(value.valueMultiplier).toBeGreaterThan(0);
    }
  });

  it('monthly credits match plan', () => {
    expect(calculateValueProposition('halo').monthlyCredits).toBe(100);
    expect(calculateValueProposition('glow').monthlyCredits).toBe(200);
    expect(calculateValueProposition('elite').monthlyCredits).toBe(400);
  });
});

describe('generateMembershipId', () => {
  it('starts with mem_', () => {
    const id = generateMembershipId();
    expect(id.startsWith('mem_')).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateMembershipId()));
    expect(ids.size).toBe(50);
  });
});

// ── Content Compliance ───────────────────────────────────────────────────

describe('Content compliance', () => {
  it('never uses the word infusion in plan benefits', () => {
    for (const tier of MEMBERSHIP_TIERS) {
      const plan = PLANS[tier];
      for (const benefit of plan.benefits) {
        expect(benefit.label.toLowerCase()).not.toContain('infusion');
        expect(benefit.description.toLowerCase()).not.toContain('infusion');
      }
    }
  });

  it('uses injection instead of infusion in benefits', () => {
    const allBenefits = MEMBERSHIP_TIERS.flatMap(t => PLANS[t].benefits);
    const injectionBenefits = allBenefits.filter(b =>
      b.label.toLowerCase().includes('injection') || b.description.toLowerCase().includes('injection')
    );
    expect(injectionBenefits.length).toBeGreaterThan(0);
  });
});
