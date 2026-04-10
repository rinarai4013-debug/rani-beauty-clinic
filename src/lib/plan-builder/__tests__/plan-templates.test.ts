import { describe, expect, it, vi } from 'vitest';

const getServiceById = vi.fn((id: string) => {
  const services: Record<string, any> = {
    consultation: { id: 'consultation', name: 'Consultation' },
    'hydrafacial-signature': { id: 'hydrafacial-signature', name: 'HydraFacial Signature' },
    botox: { id: 'botox', name: 'Botox' },
  };
  return services[id] ?? null;
});

vi.mock('@/data/services/unified-catalog', () => ({
  getServiceById,
}));

import {
  PLAN_TEMPLATES,
  getTemplate,
  getTemplatesForConcerns,
  resolveTemplateServices,
} from '@/lib/plan-builder/plan-templates';

describe('plan-builder/plan-templates', () => {
  it('contains a broad catalog of quick-start templates', () => {
    expect(PLAN_TEMPLATES.length).toBeGreaterThan(5);
  });

  it('returns a template by id when present', () => {
    expect(getTemplate('anti-aging-glow')).toEqual(
      expect.objectContaining({
        id: 'anti-aging-glow',
        name: 'Anti-Aging Glow',
      })
    );
  });

  it('returns null for unknown template ids', () => {
    expect(getTemplate('not-real')).toBeNull();
  });

  it('finds templates for matching concerns and sorts by relevance', () => {
    const results = getTemplatesForConcerns(['skin-laxity', 'aging-skin']);

    expect(results[0]).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/smooth-and-tight|skin-tightening-focus/),
      })
    );
  });

  it('resolves template service references and skips unknown service ids', () => {
    const result = resolveTemplateServices({
      id: 'custom',
      name: 'Custom',
      description: 'Custom test template',
      targetConcerns: ['aging-skin'],
      icon: 'Sparkles',
      services: [
        { serviceId: 'consultation', phase: 1, notes: 'Start here' },
        { serviceId: 'missing-service', phase: 2, notes: 'Should be dropped' },
        { serviceId: 'botox', phase: 3, notes: 'Maintain' },
      ],
    });

    expect(result).toEqual([
      {
        service: { id: 'consultation', name: 'Consultation' },
        phase: 1,
        notes: 'Start here',
      },
      {
        service: { id: 'botox', name: 'Botox' },
        phase: 3,
        notes: 'Maintain',
      },
    ]);
  });

  it('never uses infusion wording in the template catalog', () => {
    expect(JSON.stringify(PLAN_TEMPLATES).toLowerCase()).not.toContain('infusion');
  });
});
