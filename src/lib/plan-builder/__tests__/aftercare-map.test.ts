import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/services/unified-catalog', () => ({
  UNIFIED_CATALOG: [
    { id: 'hydrafacial-signature', category: 'facial' },
    { id: 'vi-peel', category: 'chemical-peel' },
    { id: 'botox', category: 'injectables' },
    { id: 'semaglutide-follow-up', category: 'weight-management' },
  ],
}));

import {
  SERVICE_CARE_MAP,
  getCareInstructions,
} from '@/lib/plan-builder/aftercare-map';

describe('plan-builder/aftercare-map', () => {
  it('builds category care instructions for catalog services', () => {
    expect(getCareInstructions('hydrafacial-signature')).toEqual(
      expect.objectContaining({
        expectedDowntime: 'None — mild redness may last 1-2 hours',
      })
    );
  });

  it('applies service-specific overrides when present', () => {
    expect(getCareInstructions('vi-peel')).toEqual(
      expect.objectContaining({
        expectedDowntime: '5-7 days of peeling; redness for 1-3 days',
        postCare: expect.arrayContaining([
          'Do NOT wash your face for 4 hours after application',
        ]),
      })
    );
  });

  it('supports direct category lookups', () => {
    expect(getCareInstructions('injectables')).toEqual(
      expect.objectContaining({
        avoidAfter: expect.arrayContaining([
          'Lying flat for 4 hours post-Botox',
        ]),
      })
    );
  });

  it('returns null when neither a service nor category can be resolved', () => {
    expect(getCareInstructions('unknown-service')).toBeNull();
  });

  it('never uses infusion wording in care instructions', () => {
    expect(JSON.stringify(SERVICE_CARE_MAP).toLowerCase()).not.toContain('infusion');
  });
});
