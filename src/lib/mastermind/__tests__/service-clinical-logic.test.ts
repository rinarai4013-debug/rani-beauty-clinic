import { describe, expect, it } from 'vitest';
import { getServiceById } from '@/data/services/unified-catalog';
import { generatePackages } from '@/lib/plan-builder/package-generator';
import type { PlanPhase, SelectedService } from '@/lib/plan-builder/types';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { mockAuraScanResult } from '../mock-data';
import { deriveServiceClinicalLogic } from '../service-clinical-logic';

function phasesWith(service: SelectedService): [PlanPhase, PlanPhase, PlanPhase] {
  return [
    { id: 1, label: 'Foundation', description: '', services: [] },
    { id: 2, label: 'Active', description: '', services: [service] },
    { id: 3, label: 'Maintenance', description: '', services: [] },
  ];
}

describe('service clinical logic', () => {
  it('extends laser hair removal for dense daily-shaving hormonal patterns', () => {
    const service = getServiceById('lhr-full-body');
    expect(service).toBeTruthy();

    const baseScan = mockAuraScanResult();
    const scan = {
      ...baseScan,
      skinAnalysis: {
        ...baseScan.skinAnalysis,
        fitzpatrickType: 4 as const,
      },
    };
    const intake = {
      skinConcerns: ['unwanted-hair'],
      treatmentInterests: ['laser hair removal'],
      targetAreas: ['full body', 'chin', 'upper lip'],
      treatmentHistory: 'First time laser. Thick coarse dark hair, shaving daily, PCOS hormonal chin hair.',
      recentSunExposure: true,
    } as Partial<ConsultationFormData>;

    const logic = deriveServiceClinicalLogic(service!, scan, intake);

    expect(logic.sessionsRequired).toBeGreaterThanOrEqual(9);
    expect(logic.intervalWeeks).toBeGreaterThanOrEqual(6);
    expect(logic.riskLevel).toBe('moderate');
    expect(logic.contraindications.join(' ')).toMatch(/sun exposure/i);
    expect(logic.clinicalRationale).toMatch(/prior-laser|prior laser|shaving|Fitzpatrick/i);
  });

  it('lets package pricing use clinically derived sessions instead of catalog defaults only', () => {
    const service = getServiceById('lhr-full-body');
    expect(service).toBeTruthy();

    const selected: SelectedService = {
      id: 'sel_lhr_full_body',
      serviceId: service!.id,
      service: service!,
      quantity: 1,
      recommendedSessions: 9,
      recommendedIntervalWeeks: 6,
      notes: 'Dense hair, daily shaving, hormonal pattern',
      phase: 2,
    };

    const packages = generatePackages(phasesWith(selected));
    const transform = packages.find((pkg) => pkg.tier === 'Transform');

    expect(transform).toBeTruthy();
    expect(transform!.lineItems[0].qty).toBe(9);
    expect(transform!.originalPrice).toBe(service!.price * 9);
    expect(transform!.sessions).toBe(9);
  });
});
