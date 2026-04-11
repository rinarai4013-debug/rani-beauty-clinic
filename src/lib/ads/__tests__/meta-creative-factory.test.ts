import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  detectCreativeFatigue,
  generateABTestVariants,
  generateCreativeSuite,
  generateFullCreativeSuite,
  generateRefreshSchedule,
  generateSVGTemplate,
  getCreativeStats,
  type MetaCreative,
} from '@/lib/ads/meta-creative-factory';

describe('meta-creative-factory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateCreativeSuite expands across audience segments, formats, and variants', () => {
    const creatives = generateCreativeSuite({
      serviceId: 'botox',
      audienceSegments: ['women_25_45', 'men_30_55'],
      formats: ['single_image', 'story'],
      variantsPerFormat: 2,
    });

    expect(creatives).toHaveLength(8);
    expect(new Set(creatives.map(creative => creative.id)).size).toBe(8);
    expect(creatives.filter(creative => creative.format === 'single_image').every(creative => !!creative.svgTemplate)).toBe(true);
    expect(creatives.filter(creative => creative.format === 'story').every(creative => creative.storySlides?.length === 4)).toBe(true);
  });

  it('audience adaptation appends the men-specific results-driven body line', () => {
    const [creative] = generateCreativeSuite({
      serviceId: 'glp1',
      audienceSegments: ['men_30_55'],
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    expect(creative.body).toContain('Results-driven care for men who value their time.');
  });

  it('audience adaptation appends local and new-client context where appropriate', () => {
    const [pnwCreative] = generateCreativeSuite({
      serviceId: 'hydrafacial',
      audienceSegments: ['pnw_locals'],
      formats: ['single_image'],
      variantsPerFormat: 1,
    });
    const [newClientCreative] = generateCreativeSuite({
      serviceId: 'hydrafacial',
      audienceSegments: ['new_clients'],
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    expect(pnwCreative.body).toContain('Located in Renton, serving the greater PNW community.');
    expect(newClientCreative.body).toContain('Complimentary consultation, zero pressure.');
  });

  it('generateSVGTemplate renders branded SVG markup for a creative', () => {
    const [creative] = generateCreativeSuite({
      serviceId: 'sofwave',
      audienceSegments: ['women_45_65'],
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    const svg = generateSVGTemplate(creative);

    expect(svg).toContain('<svg');
    expect(svg).toContain('RANI');
    expect(svg).toContain(creative.serviceName.toUpperCase());
    expect(svg).toContain(creative.cta.toUpperCase());
  });

  it('generateABTestVariants rotates hook, CTA, and ab test group names', () => {
    const [baseCreative] = generateCreativeSuite({
      serviceId: 'glp1',
      audienceSegments: ['women_25_45'],
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    const testPlan = generateABTestVariants(baseCreative, 3);

    expect(testPlan.controlVariant.id).toBe(baseCreative.id);
    expect(testPlan.testVariants).toHaveLength(3);
    expect(testPlan.testVariants.map(variant => variant.abTestGroup)).toEqual(['group_B', 'group_C', 'group_D']);
    expect(testPlan.testVariants.every(variant => !!variant.svgTemplate)).toBe(true);
  });

  it('detectCreativeFatigue returns monitor status when no performance data exists', () => {
    const [creative] = generateCreativeSuite({
      serviceId: 'botox',
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    expect(detectCreativeFatigue(creative)).toEqual({
      creativeId: creative.id,
      isFatigued: false,
      fatigueScore: 0,
      signals: [],
      recommendation: 'No performance data available. Monitor once live.',
      suggestedAction: 'monitor',
    });
  });

  it('detectCreativeFatigue marks severely fatigued creatives for replacement', () => {
    const [creative] = generateCreativeSuite({
      serviceId: 'glp1',
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    const fatigued = detectCreativeFatigue({
      ...creative,
      performanceMetrics: {
        impressions: 12000,
        clicks: 60,
        ctr: 0.4,
        leads: 5,
        conversions: 2,
        spent: 1800,
        cpa: 900,
        roas: 1.1,
        frequency: 5.3,
        relevanceScore: 2,
        daysRunning: 46,
      },
    });

    expect(fatigued.isFatigued).toBe(true);
    expect(fatigued.fatigueScore).toBeGreaterThanOrEqual(70);
    expect(fatigued.suggestedAction).toBe('replace');
    expect(fatigued.signals.length).toBeGreaterThanOrEqual(4);
  });

  it('generateRefreshSchedule sorts urgent creatives before scheduled and monitoring ones', () => {
    const [freshCreative] = generateCreativeSuite({
      serviceId: 'hydrafacial',
      formats: ['single_image'],
      variantsPerFormat: 1,
    });
    const [fatiguedCreative] = generateCreativeSuite({
      serviceId: 'hydrafacial',
      formats: ['single_image'],
      variantsPerFormat: 1,
    });

    const schedule = generateRefreshSchedule([
      {
        ...freshCreative,
        performanceMetrics: {
          impressions: 5000,
          clicks: 150,
          ctr: 3,
          leads: 20,
          conversions: 10,
          spent: 600,
          cpa: 60,
          roas: 4,
          frequency: 1.6,
          relevanceScore: 8,
          daysRunning: 10,
        },
      },
      {
        ...fatiguedCreative,
        performanceMetrics: {
          impressions: 12000,
          clicks: 60,
          ctr: 0.4,
          leads: 5,
          conversions: 2,
          spent: 1800,
          cpa: 900,
          roas: 1.1,
          frequency: 5.3,
          relevanceScore: 2,
          daysRunning: 46,
        },
      },
    ]);

    expect(schedule[0].priority).toBe('urgent');
    expect(schedule[0].newVariantQueued).toBe(true);
    expect(schedule[1].priority).toBe('monitoring');
  });

  it('generateFullCreativeSuite creates the expected volume across services, segments, and formats', () => {
    const creatives = generateFullCreativeSuite(['botox', 'glp1']);

    expect(creatives).toHaveLength(64);
    expect(creatives.filter(creative => creative.format === 'carousel').length).toBe(16);
  });

  it('getCreativeStats summarizes totals by format, segment, service, and status', () => {
    const creatives = generateFullCreativeSuite(['botox']);
    const fatiguedCreative: MetaCreative = { ...creatives[0], status: 'fatigued' };
    const stats = getCreativeStats([fatiguedCreative, ...creatives.slice(1)]);

    expect(stats.total).toBe(32);
    expect(stats.byService.botox).toBe(32);
    expect(stats.byStatus.fatigued).toBe(1);
    expect(stats.fatigued).toBe(1);
  });
});
