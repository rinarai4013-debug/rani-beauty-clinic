// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validatePlan } from '@/lib/plan-builder/constraints';
import type { PlanPhase, SelectedService } from '@/lib/plan-builder/types';

function makeService(overrides: Partial<SelectedService['service']> = {}): SelectedService['service'] {
  return {
    id: overrides.id || 'service-id',
    slug: overrides.slug || 'service-slug',
    name: overrides.name || 'Service',
    category: overrides.category || 'facial',
    price: overrides.price ?? 200,
    sessions: overrides.sessions ?? 1,
    concerns: overrides.concerns || [],
    description: overrides.description || 'desc',
    duration: overrides.duration ?? 60,
    providerType: overrides.providerType || 'esthetician',
    parentSlug: overrides.parentSlug,
  } as SelectedService['service'];
}

function makeSelectedService(id: string, phase: 1 | 2 | 3, serviceOverrides: Partial<SelectedService['service']> = {}): SelectedService {
  return {
    id,
    serviceId: serviceOverrides.id || id,
    service: makeService(serviceOverrides),
    quantity: 1,
    notes: '',
    phase,
  };
}

function makePhases(phase1: SelectedService[] = [], phase2: SelectedService[] = [], phase3: SelectedService[] = []): [PlanPhase, PlanPhase, PlanPhase] {
  return [
    { id: 1, label: 'Phase 1', description: 'Foundation', services: phase1 },
    { id: 2, label: 'Phase 2', description: 'Active', services: phase2 },
    { id: 3, label: 'Phase 3', description: 'Maintenance', services: phase3 },
  ];
}

describe('validatePlan', () => {
  it('warns when RF microneedling and chemical peels share a phase', () => {
    const warnings = validatePlan(
      makePhases([
        makeSelectedService('rf', 1, { id: 'rf', name: 'RF Microneedling', category: 'rf-microneedling' }),
        makeSelectedService('peel', 1, { id: 'vi-peel', name: 'VI Peel', category: 'chemical-peel' }),
      ])
    );

    expect(warnings.some((warning) => warning.message.includes('RF Microneedling and chemical peels'))).toBe(true);
  });

  it('warns when Phase 1 is empty but later phases contain services', () => {
    const warnings = validatePlan(
      makePhases(
        [],
        [makeSelectedService('laser', 2, { id: 'laser', name: 'Laser Resurfacing', category: 'laser' })],
        []
      )
    );

    expect(warnings.some((warning) => warning.message.includes('Phase 1 (Foundation) is empty'))).toBe(true);
  });

  it('surfaces prep guidance when advanced treatments start without a foundational facial', () => {
    const warnings = validatePlan(
      makePhases(
        [makeSelectedService('laser', 1, { id: 'laser', name: 'Laser Resurfacing', category: 'laser' })],
        [],
        []
      )
    );

    expect(warnings.some((warning) => warning.message.includes('prep facial'))).toBe(true);
  });
});
