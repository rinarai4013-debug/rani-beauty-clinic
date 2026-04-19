import { describe, expect, it } from 'vitest';
import { applyPlanPreferencesToPlan } from '@/lib/mastermind/plan-generator';
import { mockMastermindPlan } from '@/lib/mastermind/mock-data';

describe('mastermind/plan-generator preferences', () => {
  it('filters recommendations and package line items by include/exclude service hints', () => {
    const basePlan = mockMastermindPlan();

    const filtered = applyPlanPreferencesToPlan(
      basePlan,
      {
        planPreferences: {
          includeServiceHints: ['hydrafacial'],
          excludeServiceHints: ['botox'],
          includeProductRecommendations: false,
        },
      } as any,
    );

    const allRecommendations = [
      ...filtered.recommendations.primary,
      ...filtered.recommendations.complementary,
      ...filtered.recommendations.maintenance,
    ];
    const recommendationNames = allRecommendations.map((t) => t.treatmentName.toLowerCase());

    expect(recommendationNames.some((name) => name.includes('hydrafacial'))).toBe(true);
    expect(recommendationNames.some((name) => name.includes('botox'))).toBe(false);

    expect(
      filtered.aftercarePreview.every((aftercare) => aftercare.productsRecommended.length === 0),
    ).toBe(true);

    const transformPackage = filtered.packages.find((pkg) => pkg.tier === 'Transform');
    expect(transformPackage).toBeDefined();
    expect(
      transformPackage!.lineItems.some((lineItem) => lineItem.service.toLowerCase().includes('botox')),
    ).toBe(false);
  });

  it('returns the original plan when no plan preferences are present', () => {
    const basePlan = mockMastermindPlan();
    const unchanged = applyPlanPreferencesToPlan(basePlan, { firstName: 'Rina' } as any);

    expect(unchanged).toBe(basePlan);
  });

  it('keeps recommendations when include hints do not match but still honors product toggle', () => {
    const basePlan = mockMastermindPlan();

    const filtered = applyPlanPreferencesToPlan(
      basePlan,
      {
        planPreferences: {
          includeServiceHints: ['not-a-real-service'],
          excludeServiceHints: [],
          includeProductRecommendations: false,
        },
      } as any,
    );

    expect(filtered.recommendations.primary.length).toBe(basePlan.recommendations.primary.length);
    expect(
      filtered.aftercarePreview.every((aftercare) => aftercare.productsRecommended.length === 0),
    ).toBe(true);
  });
});
