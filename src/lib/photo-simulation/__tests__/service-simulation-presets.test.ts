import { describe, expect, it } from 'vitest';
import { getPresetsForService } from '@/lib/photo-simulation/filter-presets';

describe('photo-simulation/filter-presets service coverage', () => {
  it('maps injectables family to anti-aging/volume presets', () => {
    expect(getPresetsForService('botox', 'injectables')).toContain('anti-aging');
    expect(getPresetsForService('dysport', 'injectables')).toContain('anti-aging');
    expect(getPresetsForService('xeomin', 'injectables')).toContain('anti-aging');

    expect(getPresetsForService('dermal-fillers', 'injectables')).toContain('volume-restoration');
    expect(getPresetsForService('sculptra', 'injectables')).toContain('volume-restoration');
    expect(getPresetsForService('juvederm', 'injectables')).toContain('volume-restoration');
    expect(getPresetsForService('restylane', 'injectables')).toContain('volume-restoration');
    expect(getPresetsForService('radiesse', 'injectables')).toContain('volume-restoration');
  });

  it('maps energy and resurfacing services', () => {
    expect(getPresetsForService('prx-t33', 'chemical-peel')).toContain('collagen-boost');
    expect(getPresetsForService('rf-microneedling', 'rf-microneedling')).toContain('collagen-boost');
    expect(getPresetsForService('sofwave', 'skin-tightening')).toContain('skin-tightening');
    expect(getPresetsForService('laser-hair-removal', 'laser-hair-removal')).toContain('skin-rejuvenation');
  });

  it('maps metabolic and wellness pathways', () => {
    expect(getPresetsForService('glp-1', 'weight-management')).toContain('body-contouring');
    expect(getPresetsForService('hrt-female-start', 'hormones')).toContain('wellness-vitality');
    expect(getPresetsForService('peptide-elite-stack', 'wellness')).toContain('collagen-boost');
  });
});
