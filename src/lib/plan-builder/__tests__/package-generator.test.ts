// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { generatePackages } from '@/lib/plan-builder/package-generator';
import type { PlanPhase, SelectedService } from '@/lib/plan-builder/types';

function makeSelectedService(
  id: string,
  phase: 1 | 2 | 3,
  price: number,
  sessions = 1,
  quantity = 1,
  concerns: string[] = []
): SelectedService {
  return {
    id,
    serviceId: id,
    quantity,
    notes: '',
    phase,
    service: {
      id,
      slug: id,
      name: id,
      category: 'facial',
      price,
      sessions,
      concerns,
      description: 'desc',
      duration: 60,
      providerType: 'esthetician',
    } as SelectedService['service'],
  };
}

function makePhases(phase1: SelectedService[] = [], phase2: SelectedService[] = [], phase3: SelectedService[] = []): [PlanPhase, PlanPhase, PlanPhase] {
  return [
    { id: 1, label: 'Phase 1', description: 'Foundation', services: phase1 },
    { id: 2, label: 'Phase 2', description: 'Active', services: phase2 },
    { id: 3, label: 'Phase 3', description: 'Maintenance', services: phase3 },
  ];
}

describe('generatePackages', () => {
  it('builds Start, Transform, and Elite with the expected discounts and payment math', () => {
    const phases = makePhases(
      [makeSelectedService('HydraFacial', 1, 200, 1, 1, ['hydration'])],
      [makeSelectedService('Microneedling', 2, 300, 2, 1, ['texture'])],
      [makeSelectedService('Maintenance Facial', 3, 150, 1, 1, ['glow'])]
    );

    const packages = generatePackages(phases);

    expect(packages.map((pkg) => pkg.tier)).toEqual(['Start', 'Transform', 'Elite']);
    expect(packages[0].price).toBe(200);
    expect(packages[1].originalPrice).toBe(800);
    expect(packages[1].price).toBe(720);
    expect(packages[1].savingsVsStandalone).toBe(80);
    expect(packages[2].originalPrice).toBe(950);
    expect(packages[2].price).toBe(808);
    expect(packages[2].savingsVsStandalone).toBe(142);
    expect(packages[2].monthlyPayment12).toBe(Math.ceil(808 / 12));
  });

  it('returns only Start when later phases are empty', () => {
    const packages = generatePackages(
      makePhases([makeSelectedService('HydraFacial', 1, 225, 1, 2, ['hydration'])], [], [])
    );

    expect(packages).toHaveLength(1);
    expect(packages[0].tier).toBe('Start');
    expect(packages[0].price).toBe(450);
  });
});
