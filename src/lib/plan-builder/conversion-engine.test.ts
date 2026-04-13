import { describe, expect, it, vi } from 'vitest';

import type { RecommendedService, ClientProfile } from '@/lib/plan-builder/ai-recommender';
import type { UnifiedService } from '@/data/services/unified-catalog';
import type { PlanWarning } from '@/lib/plan-builder/constraints';

import { generateConversionPlan } from '@/lib/plan-builder/conversion-engine';

const mockValidatePlan = vi.fn<PlanWarning[], [any]>();
const mockRecommendTreatmentPlan = vi.fn<RecommendedService[], [ClientProfile]>();

vi.mock('@/lib/plan-builder/constraints', () => ({
  validatePlan: (...args: unknown[]) => mockValidatePlan(...args),
}));

vi.mock('@/lib/plan-builder/ai-recommender', () => ({
  recommendTreatmentPlan: (...args: unknown[]) => mockRecommendTreatmentPlan(...args),
}));

function serviceFixture(overrides: Partial<UnifiedService>): UnifiedService {
  return {
    id: overrides.id ?? 'service-id',
    name: overrides.name ?? 'Service',
    category: overrides.category ?? 'facial',
    price: overrides.price ?? 225,
    duration: overrides.duration ?? 60,
    sessions: overrides.sessions ?? 1,
    description: overrides.description ?? 'Clinic treatment',
    concerns: overrides.concerns ?? ['dull-skin'],
    bodyAreas: overrides.bodyAreas ?? ['face'],
    parentSlug: overrides.parentSlug,
    financingEligible: overrides.financingEligible ?? false,
    ...overrides,
  };
}

const recs: RecommendedService[] = [
  {
    service: serviceFixture({
      id: 'hydrafacial-signature',
      name: 'Signature HydraFacial',
      category: 'facial',
      price: 225,
    }),
    phase: 1,
    reason: 'Gentle glow start',
    fitScore: 0.92,
    quickWin: true,
    isQuickWin: true,
    anchorTreatment: false,
    whyThisPhase: 'Quick visible result first',
  },
  {
    service: serviceFixture({ id: 'vi-peel', name: 'VI Peel', category: 'chemical-peel', price: 325 }),
    phase: 1,
    reason: 'Address texture',
    fitScore: 0.88,
    quickWin: false,
    isQuickWin: false,
    anchorTreatment: false,
    whyThisPhase: 'Phase 1 skin prep',
  },
  {
    service: serviceFixture({ id: 'sofwave-full-face', name: 'Sofwave Full Face', category: 'skin-tightening', price: 2250 }),
    phase: 2,
    reason: 'Anchor tightening',
    fitScore: 0.97,
    anchorTreatment: true,
    isAnchor: true,
    whyThisPhase: 'Deep structural work in phase 2',
  },
  {
    service: serviceFixture({ id: 'rf-micro-face', name: 'RF Microneedling - Full Face', category: 'rf-microneedling', price: 750 }),
    phase: 3,
    reason: 'Maintenance collagen work',
    fitScore: 0.75,
    whyThisPhase: 'Touch-forward collagen phase',
  },
];

describe('plan-builder/conversion-engine', () => {
  it('generates starter/core/elite tiers using phase guidance', () => {
    mockValidatePlan.mockReturnValue([]);
    mockRecommendTreatmentPlan.mockReturnValue(recs);

    const plan = generateConversionPlan({
      skinConcerns: ['aging'],
      treatmentInterests: ['skin'],
      urgency: 'moderate',
      budgetSensitivity: 'value-seeking',
      engagementLevel: 'warm',
      fitzpatrickType: 3,
      previousTreatments: ['consultation'],
    });

    expect(plan.starter.services.map((s) => s.service.id)).toEqual(['hydrafacial-signature', 'vi-peel']);
    expect(plan.core.services.some((s) => s.service.id === 'sofwave-full-face')).toBe(true);
    expect(plan.core.services).toHaveLength(3);
    expect(plan.elite.services.length).toBeGreaterThanOrEqual(4);
    expect(plan.timelineProjection.length).toBeGreaterThan(0);
    expect(plan.bundles[0]).toEqual(
      expect.objectContaining({
        id: 'glow-starter',
      })
    );
  });

  it('caps cold-lead starter at two services and sorts by price', () => {
    mockValidatePlan.mockReturnValue([]);
    mockRecommendTreatmentPlan.mockReturnValue(recs);

    const plan = generateConversionPlan({
      skinConcerns: ['aging'],
      treatmentInterests: ['skin'],
      urgency: 'moderate',
      budgetSensitivity: 'price-conscious',
      engagementLevel: 'cold',
      fitzpatrickType: 2,
    });

    expect(plan.starter.services.length).toBeLessThanOrEqual(2);
    expect(plan.starter.services[0].service.price).toBeLessThanOrEqual(plan.starter.services[1].service.price);
  });

  it('surfaces validation warnings as pass-through', () => {
    const warning = {
      type: 'service-load',
      phase: 1,
      message: 'Too many phase-1 services',
      fixSuggestion: 'Trim one quick-win service',
    } as PlanWarning;

    mockValidatePlan.mockReturnValue([warning]);
    mockRecommendTreatmentPlan.mockReturnValue(recs);

    const plan = generateConversionPlan({
      skinConcerns: ['aging'],
      treatmentInterests: ['texture'],
      urgency: 'same-day',
      budgetSensitivity: 'investment-ready',
      engagementLevel: 'returning',
    });

    expect(plan.warnings).toEqual([warning]);
    expect(plan.planStrength.label).toBe('exceptional');
  });

  it('computes revenue and financing projections from core package math', () => {
    mockValidatePlan.mockReturnValue([]);
    mockRecommendTreatmentPlan.mockReturnValue(recs);

    const plan = generateConversionPlan({
      skinConcerns: ['aging'],
      treatmentInterests: ['tightening'],
      urgency: 'same-day',
      budgetSensitivity: 'investment-ready',
      engagementLevel: 'hot',
      fitzpatrickType: 4,
      totalSpend: 3000,
    });

    expect(plan.revenue.corePackagePrice).toBe(Math.round(plan.core.totalPrice * 0.9));
    expect(plan.revenue.savings).toBe(plan.revenue.retailValue - plan.revenue.corePackagePrice);
    expect(plan.revenue.financingMonthly12).toBe(Math.ceil(plan.revenue.corePackagePrice / 12));
    expect(plan.revenue.financingMonthly24).toBe(Math.ceil(plan.revenue.corePackagePrice / 24));
    expect(plan.bundles.length).toBeGreaterThan(0);
  });
});
