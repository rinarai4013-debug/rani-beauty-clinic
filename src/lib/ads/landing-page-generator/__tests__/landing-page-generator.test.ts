import { describe, it, expect } from 'vitest';
import {
  generateAllLandingPages,
  generateLandingPage,
  scoreLandingPagePerformance,
} from '../landing-page-generator';
import { RANI_SERVICES } from '../creative-engine';

describe('landing-page-generator', () => {
  const glp1 = RANI_SERVICES.find((service) => service.id === 'glp1');
  const hydrafacial = RANI_SERVICES.find((service) => service.id === 'hydrafacial');

  if (!glp1 || !hydrafacial) {
    throw new Error('Expected glp1 and hydrafacial fixtures to exist');
  }

  it('generates a full hydrafacial landing page with required sections', () => {
    const page = generateLandingPage({
      serviceId: hydrafacial.id,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'launch',
      includeABVariants: true,
    });

    expect(page.template).toBe('aesthetic_facial');
    expect(page.serviceId).toBe('hydrafacial');
    expect(page.title).toContain('HydraFacial');
    expect(page.metaDescription).toContain('HydraFacial');
    expect(page.metaDescription).toContain('Renton, WA');
    expect(page.slug).toBe('hydrafacial-google-launch');
    expect(page.sections).toHaveLength(10);
    expect(page.sections.map((section) => section.type)).toContain('hero');
    expect(page.sections.map((section) => section.type)).toContain('faq');
    expect(page.sections[0].type).toBe('hero');
    expect(page.sections[0].cta?.text).toBeTruthy();
    expect(page.sections.every((section) => section.order >= 1)).toBe(true);
    expect(page.sections.map((section) => section.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page.abTestVariants.length).toBe(4);
    expect(page.utm).toMatchObject({ source: 'google', medium: 'cpc', campaign: 'launch', content: 'hydrafacial' });
    expect(page.conversionTracking.customEvents.length).toBe(9);
    expect(page.conversionTracking.primaryGoal).toBe('consultation_booking');
    expect(page.mobileOptimizations.some((item) => item.priority === 'critical')).toBe(true);
    expect(page.performanceScore).toBe(100);
    expect(page.sections.every((section) => !section.cta || typeof section.cta.url === 'string')).toBe(true);
    expect(page.sections.find((section) => section.type === 'cta')?.disclaimer?.toLowerCase()).not.toContain('infusion');
  });

  it('generates a GLP-1 landing page with GLP-1 pricing and service-specific sections', () => {
    const page = generateLandingPage({
      serviceId: glp1.id,
      utmSource: 'facebook',
      utmMedium: 'social',
      utmCampaign: 'glp1-launch',
      includeABVariants: false,
    });

    const pricingSection = page.sections.find((section) => section.type === 'pricing');
    const faqSection = page.sections.find((section) => section.type === 'faq');

    expect(page.template).toBe('glp1');
    expect(page.slug).toBe('glp1-facebook-glp1-launch');
    expect(pricingSection?.bullets?.some((bullet) => bullet.includes('GLP-1 Monthly Program: From $399/mo'))).toBe(true);
    expect(pricingSection?.bullets?.some((bullet) => bullet.includes('Premium Program: From $599/mo'))).toBe(true);
    expect(faqSection?.body).toContain('How quickly will I see results?');
    expect(page.abTestVariants).toHaveLength(0);
    expect(page.performanceScore).toBe(100);
    expect(page.sections.find((section) => section.type === 'solution')?.headline).not.toContain('How HydraFacial?');
    expect(page.sections.find((section) => section.type === 'solution')?.headline).toContain('GLP-1');
  });

  it('falls back to generic landing page for unknown services', () => {
    const page = generateLandingPage({
      serviceId: 'mystery-service',
      utmSource: 'email',
      utmMedium: 'newsletter',
      utmCampaign: 'retention',
      includeABVariants: true,
    });

    expect(page.serviceName).toBe('mystery-service');
    expect(page.template).toBe('general_service');
    expect(page.sections).toHaveLength(3);
    expect(page.sections.map((section) => section.order)).toEqual([1, 2, 3]);
    expect(page.sections[0].type).toBe('hero');
    expect(page.sections[1].type).toBe('solution');
    expect(page.sections[2].type).toBe('cta');
    expect(page.slug).toBe('mystery-service-landing');
    expect(page.id).toContain('lp_generic_mystery-service_');
    expect(page.performanceScore).toBe(60);
    expect(page.conversionTracking.secondaryGoals).toContain('phone_call');
  });

  it('scales landing pages from all configured services', () => {
    const pages = generateAllLandingPages('instagram', 'social', 'fall-launch');

    const expectedServiceIds = ['glp1', 'botox', 'hydrafacial', 'wellness', 'peptides'];

    expect(pages.length).toBeGreaterThanOrEqual(expectedServiceIds.length);
    expect(pages.every((page) => page.utm.source === 'instagram' && page.utm.campaign === 'fall-launch')).toBe(true);
    pages.forEach((page) => {
      expect(page.utm.content).toBe(page.serviceId);
      expect(page.mobileOptimizations.some((opt) => opt.priority === 'critical')).toBe(true);
      expect(page.conversionTracking.customEvents.length).toBe(9);
      expect(page.sections.length).toBeGreaterThanOrEqual(3);
    });
    expectedServiceIds.forEach((serviceId) => {
      expect(pages.some((page) => page.serviceId === serviceId)).toBe(true);
    });
  });

  it('scores landing performance with recommendations when weak', () => {
    const metrics = {
      bounceRate: 72,
      avgTimeOnPage: 35,
      conversionRate: 2,
      mobileConversionRate: 1,
      loadTime: 4,
    };

    const result = scoreLandingPagePerformance(metrics);

    expect(result.score).toBe(5);
    expect(result.recommendations.length).toBe(5);
    expect(result.recommendations).toContain('High bounce rate. Improve hero section and page load speed.');
    expect(result.recommendations).toContain('Low time on page. Add more engaging content or video.');
    expect(result.recommendations).toContain('Low conversion rate. Test new CTAs, add urgency, or simplify the form.');
    expect(result.recommendations).toContain('Slow page load. Optimize images, defer scripts, enable caching.');
  });

  it('scores landing performance with excellent results and no recommendations', () => {
    const metrics = {
      bounceRate: 22,
      avgTimeOnPage: 180,
      conversionRate: 9.2,
      mobileConversionRate: 6.3,
      loadTime: 1.2,
    };

    const result = scoreLandingPagePerformance(metrics);

    expect(result.score).toBe(100);
    expect(result.recommendations).toHaveLength(0);
  });

  it('respects score boundaries exactly at threshold transitions', () => {
    const metrics = {
      bounceRate: 40,
      avgTimeOnPage: 60,
      conversionRate: 3,
      mobileConversionRate: 2,
      loadTime: 3,
    };

    const result = scoreLandingPagePerformance(metrics);

    expect(result.score).toBe(30);
    expect(result.recommendations).toContain('Low time on page. Add more engaging content or video.');
    expect(result.recommendations).toHaveLength(3);
  });

  it('keeps all generated page copy free from forbidden language', () => {
    const pages = generateAllLandingPages('google', 'display', 'clean-copy');

    for (const page of pages) {
      const serialized = JSON.stringify(page).toLowerCase();
      expect(serialized).not.toContain('infusion');
      expect(serialized).toContain('rani beauty clinic');
      expect(page.sections.length).toBeGreaterThanOrEqual(3);
      const ctaSection = page.sections.find((section) => section.type === 'cta');
      expect(ctaSection?.disclaimer?.length).toBeGreaterThan(0);
    }
  });

  it('creates pages with deterministic section ordering', () => {
    const page = generateLandingPage({
      serviceId: hydrafacial.id,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'ordering',
    });

    expect(page.sections.map((section) => section.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page.sections[0].type).toBe('hero');
    expect(page.sections[8].type).toBe('provider');
    expect(page.sections[9].type).toBe('cta');
    expect(page.sections[2].type).toBe('solution');
  });
});
