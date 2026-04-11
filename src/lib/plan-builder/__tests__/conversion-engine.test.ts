import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/plan-builder/ai-recommender', () => ({
  recommendTreatmentPlan: vi.fn(),
}));

vi.mock('@/lib/plan-builder/constraints', () => ({
  validatePlan: vi.fn(),
}));

import { getServiceById } from '@/data/services/unified-catalog';
import { recommendTreatmentPlan } from '@/lib/plan-builder/ai-recommender';
import { validatePlan } from '@/lib/plan-builder/constraints';
import { generateConversionPlan, type ConversionInput } from '@/lib/plan-builder/conversion-engine';

function recommendedService(
  serviceId: string,
  phase: 1 | 2 | 3,
  overrides: Partial<{
    reason: string;
    whyThisPhase: string;
    quickWin: boolean;
    anchorTreatment: boolean;
  }> = {},
) {
  return {
    service: getServiceById(serviceId)!,
    phase,
    reason: overrides.reason || `${serviceId} fits the plan`,
    whyThisPhase: overrides.whyThisPhase || `Phase ${phase} fit`,
    quickWin: overrides.quickWin ?? false,
    anchorTreatment: overrides.anchorTreatment ?? false,
  };
}

function makeInput(overrides: Partial<ConversionInput> = {}): ConversionInput {
  return {
    skinConcerns: ['aging-skin', 'hyperpigmentation'],
    treatmentInterests: ['botox', 'hydrafacial'],
    urgency: 'moderate',
    budgetSensitivity: 'value-seeking',
    engagementLevel: 'warm',
    ...overrides,
  };
}

describe('conversion-engine', () => {
  beforeEach(() => {
    vi.mocked(recommendTreatmentPlan).mockReset();
    vi.mocked(validatePlan).mockReset();
    vi.mocked(validatePlan).mockReturnValue([]);
  });

  it('maps consultation input into the recommender client profile', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([]);

    generateConversionPlan(makeInput({
      budgetSensitivity: 'investment-ready',
      urgency: 'same-day',
      previousTreatments: ['HydraFacial'],
      seasonality: 'spring',
      downtimeTolerance: 'minimal',
      contraindications: ['pregnancy'],
      fitzpatrickType: 3,
      painTolerance: 'medium',
    }));

    expect(vi.mocked(recommendTreatmentPlan)).toHaveBeenCalledWith({
      skinConcerns: ['aging-skin', 'hyperpigmentation'],
      treatmentInterests: ['botox', 'hydrafacial'],
      fitzpatrickType: 3,
      downtimeTolerance: 'minimal',
      budgetBand: 'premium',
      urgency: 'event-driven',
      painTolerance: 'medium',
      previousTreatments: ['HydraFacial'],
      seasonality: 'spring',
      contraindications: ['pregnancy'],
    });
  });

  it('caps cold-lead starter plans at the two cheapest phase 1 services', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('vi-peel', 1),
      recommendedService('consultation', 1),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
    ]);

    const plan = generateConversionPlan(makeInput({ engagementLevel: 'cold' }));

    expect(plan.starter.services).toHaveLength(2);
    expect(plan.starter.services.map(service => service.service.id)).toEqual([
      'consultation',
      'hydrafacial-signature',
    ]);
  });

  it('falls back to the first two recommendations when no phase 1 services exist', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
      recommendedService('sofwave-full-face', 2),
      recommendedService('tretinoin', 3),
    ]);

    const plan = generateConversionPlan(makeInput());

    expect(plan.starter.services.map(service => service.service.id)).toEqual([
      'rf-micro-face',
      'sofwave-full-face',
    ]);
  });

  it('includes premium phase 2 treatments for hot and returning leads', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('vi-peel', 1),
      recommendedService('consultation', 1),
      recommendedService('tretinoin', 2),
      recommendedService('glutathione-injection', 2),
      recommendedService('tri-immune-injection', 2),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
    ]);

    const plan = generateConversionPlan(makeInput({ engagementLevel: 'hot' }));

    expect(plan.core.services.some(service => service.service.id === 'rf-micro-face')).toBe(true);
  });

  it('builds whyThisPlan around the quick win and anchor treatments', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
      recommendedService('tretinoin', 3),
    ]);

    const plan = generateConversionPlan(makeInput());

    expect(plan.whyThisPlan).toContain('Signature HydraFacial');
    expect(plan.whyThisPlan).toContain('RF Microneedling - Full Face');
  });

  it('passes the constructed mock phases to constraint validation and returns warnings', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
      recommendedService('tretinoin', 3),
    ]);
    vi.mocked(validatePlan).mockReturnValue([
      { code: 'spacing', message: 'Needs more spacing', severity: 'medium' },
    ] as never);

    const plan = generateConversionPlan(makeInput());

    expect(vi.mocked(validatePlan)).toHaveBeenCalledTimes(1);
    expect(plan.warnings).toEqual([
      { code: 'spacing', message: 'Needs more spacing', severity: 'medium' },
    ]);
  });

  it('builds timeline, bundle shortcuts, and financing math from the core plan', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('vi-peel', 1),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
      recommendedService('tretinoin', 3),
    ]);

    const plan = generateConversionPlan(makeInput());

    expect(plan.timelineProjection[0].label).toBe('Month 1: Glow Activation');
    expect(plan.timelineProjection.at(-1)?.month).toBe(6);
    expect(plan.bundles.some(bundle => bundle.id === 'glow-starter')).toBe(true);
    expect(plan.revenue.corePackagePrice).toBe(Math.round(plan.core.totalPrice * 0.9));
    expect(plan.revenue.financingMonthly12).toBe(Math.ceil((plan.core.totalPrice * 0.9) / 12));
  });

  it('surfaces recurring revenue and upsell opportunities from missing categories', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
    ]);

    const plan = generateConversionPlan(makeInput({
      engagementLevel: 'returning',
      totalSpend: 2500,
      skinConcerns: ['aging'],
    }));

    expect(plan.revenue.recurringPotential).toBeGreaterThan(0);
    expect(plan.revenue.upsellOpportunities).toContain('Add Tretinoin ($99/mo) for at-home results amplification');
    expect(plan.revenue.upsellOpportunities).toContain('Consider Botox or fillers for immediate volume and line correction');
    expect(plan.revenue.upsellOpportunities).toContain('Offer membership pricing — this client is a strong membership candidate');
  });

  it('scores plan strength with labeled factors and improvement tips', () => {
    vi.mocked(recommendTreatmentPlan).mockReturnValue([
      recommendedService('hydrafacial-signature', 1, { quickWin: true }),
      recommendedService('rf-micro-face', 2, { anchorTreatment: true }),
      recommendedService('tretinoin', 3),
    ]);

    const plan = generateConversionPlan(makeInput({ fitzpatrickType: 4, downtimeTolerance: 'minimal' }));

    expect(plan.planStrength.factors).toHaveLength(5);
    expect(plan.planStrength.label).toMatch(/weak|moderate|strong|exceptional/);
    expect(plan.planStrength.score).toBeGreaterThan(0);
  });
});
