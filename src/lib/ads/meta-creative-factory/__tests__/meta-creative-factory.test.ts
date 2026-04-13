import { describe, it, expect } from 'vitest';
import {
  generateABTestVariants,
  generateCreativeSuite,
  generateCreativeStats,
  detectCreativeFatigue,
  generateRefreshSchedule,
  generateSVGTemplate,
  getCreativeStats,
} from '../meta-creative-factory';
import { getServiceById } from '../creative-engine';
import type { MetaCreative } from '../meta-creative-factory';

describe('meta-creative-factory', () => {
  const botoxService = getServiceById('botox');

  if (!botoxService) {
    throw new Error('Expected botox fixture to exist');
  }

  it('builds a single-image creative suite with defaults', () => {
    const creatives = generateCreativeSuite({ serviceId: botoxService.id, variantsPerFormat: 2 });

    expect(creatives).toHaveLength(2);
    creatives.forEach((creative, idx) => {
      expect(creative.serviceId).toBe('botox');
      expect(creative.serviceName).toBe('Botox');
      expect(creative.format).toBe('single_image');
      expect(creative.audienceSegment).toBe('women_25_45');
      expect(creative.status).toBe('draft');
      expect(creative.id).toBe(`creative_botox_women_25_45_single_image_v${idx + 1}`);
      expect(creative.abTestGroup).toBe(`group_${String.fromCharCode(65 + idx)}`);
      expect(creative.visualTemplate).toBeDefined();
      expect(creative.svgTemplate).toContain('<svg');
    });
  });

  it('builds multi-format suites for a specific audience and service', () => {
    const creatives = generateCreativeSuite({
      serviceId: botoxService.id,
      audienceSegments: ['women_45_65', 'men_30_55'],
      formats: ['single_image', 'carousel', 'video_script', 'story', 'collection'],
      variantsPerFormat: 1,
    });

    expect(creatives).toHaveLength(10);
    const formatSet = Array.from(new Set(creatives.map((creative) => creative.format)));
    expect(formatSet.sort()).toEqual(['carousel', 'collection', 'single_image', 'story', 'video_script'].sort());

    const bySegment = {
      women_45_65: creatives.filter((creative) => creative.audienceSegment === 'women_45_65').length,
      men_30_55: creatives.filter((creative) => creative.audienceSegment === 'men_30_55').length,
    };
    expect(bySegment.women_45_65).toBe(5);
    expect(bySegment.men_30_55).toBe(5);

    creatives
      .filter((creative) => creative.format === 'single_image')
      .forEach((creative) => {
        expect(creative.visualTemplate).toBeDefined();
        expect(creative.svgTemplate).toContain('BEAUTY CLINIC');
      });

    creatives
      .filter((creative) => creative.format === 'carousel')
      .forEach((creative) => {
        expect((creative.carouselCards || []).length).toBe(5);
      });

    creatives
      .filter((creative) => creative.format === 'video_script')
      .forEach((creative) => {
        expect(creative.videoScript?.duration).toBe(30);
        expect(creative.videoScript?.segments).toHaveLength(4);
      });

    creatives
      .filter((creative) => creative.format === 'story')
      .forEach((creative) => {
        expect(creative.storySlides?.length).toBe(4);
        expect(creative.storySlides?.at(-1)?.ctaButton).toContain('Book Now');
      });

    creatives
      .filter((creative) => creative.format === 'collection')
      .forEach((creative) => {
        expect(creative.collectionItems?.length).toBeGreaterThanOrEqual(1);
      });
  });

  it('adapts body content for audience variants', () => {
    const creatives = generateCreativeSuite({
      serviceId: botoxService.id,
      audienceSegments: ['men_30_55', 'retargeting', 'new_clients'],
      variantsPerFormat: 1,
      formats: ['single_image'],
    });

    const men = creatives.find((creative) => creative.audienceSegment === 'men_30_55');
    const returning = creatives.find((creative) => creative.audienceSegment === 'retargeting');
    const newClient = creatives.find((creative) => creative.audienceSegment === 'new_clients');

    expect(men?.body).toContain('Results-driven care for men who value their time.');
    expect(returning?.body).toContain('Still thinking about it?');
    expect(newClient?.body).toContain('First visit? Complimentary consultation, zero pressure.');
  });

  it('generates SVG creatives from base creative payload', () => {
    const creatives = generateCreativeSuite({ serviceId: botoxService.id, formats: ['single_image'], variantsPerFormat: 1 });
    const template = generateSVGTemplate(creatives[0]);

    expect(template).toContain('<svg');
    expect(template).toContain('BEAUTY CLINIC');
    expect(template).toContain('Renton, WA | ranibeautyclinic.com');
    expect(template.toLowerCase()).not.toContain('infusion');
  });

  it('builds A/B variants with distinct ids and test groups', () => {
    const creatives = generateCreativeSuite({ serviceId: botoxService.id, variantsPerFormat: 1, formats: ['single_image'] });
    const [control] = creatives;
    const testPlan = generateABTestVariants(control, 3);

    expect(testPlan.controlVariant.id).toBe(control.id);
    expect(testPlan.testVariants).toHaveLength(3);
    testPlan.testVariants.forEach((variant, idx) => {
      expect(variant.id).toBe(`${control.id}_variant_${idx + 1}`);
      expect(variant.abTestGroup).toBe(`group_${String.fromCharCode(66 + idx)}`);
      expect(variant.serviceId).toBe(control.serviceId);
      expect(variant.status).toBe('draft');
      expect(variant.format).toBe(control.format);
    });
  });

  it('returns no fatigue signal when creative metrics are missing', () => {
    const creatives = generateCreativeSuite({ serviceId: botoxService.id, variantsPerFormat: 1, formats: ['single_image'] });
    const result = detectCreativeFatigue(creatives[0]);

    expect(result.isFatigued).toBe(false);
    expect(result.fatigueScore).toBe(0);
    expect(result.suggestedAction).toBe('monitor');
    expect(result.signals).toHaveLength(0);
    expect(result.recommendation).toContain('No performance data available');
  });

  it('flags heavily fatigued creatives and computes refresh schedule', () => {
    const stressedCreative = generateCreativeSuite({
      serviceId: botoxService.id,
      variantsPerFormat: 1,
      formats: ['single_image'],
    })[0];

    const fatiguedCreative: MetaCreative = {
      ...stressedCreative,
      performanceMetrics: {
        impressions: 10000,
        clicks: 120,
        ctr: 0.35,
        leads: 2,
        conversions: 0,
        spent: 350,
        cpa: 175,
        roas: 0.8,
        frequency: 5.8,
        relevanceScore: 2,
        daysRunning: 60,
      },
    };

    const restedCreative = generateCreativeSuite({
      serviceId: botoxService.id,
      variantsPerFormat: 1,
      formats: ['single_image'],
    })[0];

    const schedule = generateRefreshSchedule([
      fatiguedCreative,
      restedCreative,
    ]);

    expect(schedule).toHaveLength(2);
    expect(schedule[0].creativeId).toBe(fatiguedCreative.id);
    expect(schedule[0].newVariantQueued).toBe(true);
    expect(schedule[0].priority).toBe('urgent');
    expect(schedule[0].refreshDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schedule[1].creativeId).toBe(restedCreative.id);
    expect(schedule[1].newVariantQueued).toBe(false);
    expect(['monitoring', 'scheduled']).toContain(schedule[1].priority);
  });

  it('aggregates creative stats across format and segment', () => {
    const sampleCreatives = generateCreativeSuite({
      serviceId: botoxService.id,
      audienceSegments: ['women_25_45', 'women_45_65'],
      formats: ['single_image', 'story'],
      variantsPerFormat: 2,
    });

    const stats = getCreativeStats(sampleCreatives);

    expect(stats.total).toBe(sampleCreatives.length);
    expect(stats.byFormat.single_image).toBe(4);
    expect(stats.byFormat.story).toBe(4);
    expect(stats.bySegment.women_25_45).toBe(4);
    expect(stats.bySegment.women_45_65).toBe(4);
    expect(stats.byStatus.draft).toBe(sampleCreatives.length);
    expect(stats.fatigued).toBe(0);
  });

  it('still runs when service is unknown and uses fallback naming', () => {
    const creative = generateCreativeSuite({
      serviceId: 'mystery_service',
      formats: ['single_image'],
      variantsPerFormat: 1,
    })[0];

    expect(creative.serviceId).toBe('mystery_service');
    expect(creative.serviceName).toBe('mystery_service');
    expect(creative.headline).toBe('mystery_service at Rani Beauty Clinic');
    expect(creative.description).toBe('Book your mystery_service treatment at Rani Beauty Clinic in Renton, WA.');
  });

  it('has tests for stats aggregator imported alias compatibility', () => {
    const sampleCreatives = generateCreativeSuite({ serviceId: botoxService.id, variantsPerFormat: 1, formats: ['single_image'] });
    const stats = getCreativeStats(sampleCreatives);

    expect(stats.total).toBe(sampleCreatives.length);
    expect(stats.bySegment.women_25_45).toBe(sampleCreatives.length);
    expect(Object.keys(stats.byService).length).toBeGreaterThanOrEqual(1);
  });
});
