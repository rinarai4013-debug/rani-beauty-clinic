import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateAllLandingPages,
  generateLandingPage,
  scoreLandingPagePerformance,
} from '@/lib/ads/landing-page-generator';

describe('landing-page-generator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateLandingPage builds the service-specific template with ordered sections', () => {
    const page = generateLandingPage({
      serviceId: 'glp1',
      utmSource: 'Meta',
      utmMedium: 'PaidSocial',
      utmCampaign: 'SpringLaunch',
    });

    expect(page.id).toBe('lp_glp1_Meta_1775822400000');
    expect(page.slug).toBe('glp1-meta-springlaunch');
    expect(page.template).toBe('glp1');
    expect(page.sections.map(section => section.type)).toEqual([
      'hero',
      'problem',
      'solution',
      'social_proof',
      'process',
      'pricing',
      'testimonials',
      'faq',
      'provider',
      'cta',
    ]);
    expect(page.sections.at(-1)?.disclaimer).toContain('Results may vary');
  });

  it('generateLandingPage can omit A/B variants when requested', () => {
    const page = generateLandingPage({
      serviceId: 'botox',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'BotoxQ2',
      includeABVariants: false,
    });

    expect(page.abTestVariants).toEqual([]);
  });

  it('generateLandingPage builds UTM content and service-specific conversion events', () => {
    const page = generateLandingPage({
      serviceId: 'laser_hair',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'SmoothSummer',
    });

    expect(page.utm).toEqual({
      source: 'google',
      medium: 'cpc',
      campaign: 'SmoothSummer',
      content: 'laser_hair',
      term: 'laser+hair',
    });
    expect(page.conversionTracking.customEvents.some(event => event.name === 'service_laser_hair_interest')).toBe(true);
  });

  it('unknown services fall back to the generic landing page template', () => {
    const page = generateLandingPage({
      serviceId: 'mystery_service',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'Fallback',
    });

    expect(page.template).toBe('general_service');
    expect(page.sections).toHaveLength(3);
    expect(page.performanceScore).toBe(60);
    expect(page.title).toContain('mystery_service');
  });

  it('mobile optimizations include sticky CTA and page-speed requirements', () => {
    const page = generateLandingPage({
      serviceId: 'hydrafacial',
      utmSource: 'meta',
      utmMedium: 'paid_social',
      utmCampaign: 'GlowNow',
    });

    expect(page.mobileOptimizations.some(item => item.element === 'Hero CTA' && item.priority === 'critical')).toBe(true);
    expect(page.mobileOptimizations.some(item => item.element === 'Page speed' && item.optimization.includes('LCP < 2.5s'))).toBe(true);
  });

  it('scoreLandingPagePerformance rewards strong metrics and avoids recommendations', () => {
    const result = scoreLandingPagePerformance({
      bounceRate: 35,
      avgTimeOnPage: 180,
      conversionRate: 9,
      mobileConversionRate: 6,
      loadTime: 1.8,
    });

    expect(result.score).toBe(100);
    expect(result.recommendations).toEqual([]);
  });

  it('scoreLandingPagePerformance penalizes weak metrics with targeted recommendations', () => {
    const result = scoreLandingPagePerformance({
      bounceRate: 75,
      avgTimeOnPage: 30,
      conversionRate: 2,
      mobileConversionRate: 1,
      loadTime: 4.2,
    });

    expect(result.score).toBeLessThan(50);
    expect(result.recommendations).toContain('High bounce rate. Improve hero section and page load speed.');
    expect(result.recommendations).toContain('Poor mobile conversion. Check mobile UX, form usability, and click-to-call.');
    expect(result.recommendations).toContain('Slow page load. Optimize images, defer scripts, enable caching.');
  });

  it('generateAllLandingPages creates one page for each configured landing data entry', () => {
    const pages = generateAllLandingPages('meta', 'paid_social', 'AprilPush');

    expect(pages).toHaveLength(5);
    expect(pages.map(page => page.serviceId)).toEqual([
      'glp1',
      'botox',
      'hydrafacial',
      'wellness',
      'peptides',
    ]);
  });
});
