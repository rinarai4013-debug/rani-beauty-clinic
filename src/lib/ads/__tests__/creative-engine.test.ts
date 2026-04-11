import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import {
  AD_SIZES,
  CTA_TEXT,
  RANI_SERVICES,
  generateAllFrameworks,
  generateAllVisuals,
  generateCopy,
  generateCreativeBatch,
  generateDKITemplates,
  generateDescriptions,
  generateFullCatalog,
  generateHeadlines,
  generateRSA,
  generateVisual,
  getFrameworks,
  getServiceById,
} from '@/lib/ads/creative-engine';

describe('creative-engine', () => {
  const botox = RANI_SERVICES.find(service => service.id === 'botox')!;
  const consultation = RANI_SERVICES.find(service => service.id === 'consultation')!;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateCopy returns framework output with service keywords attached', () => {
    const generated = generateCopy('aida', botox);

    expect(generated.framework).toBe('aida');
    expect(generated.service.id).toBe('botox');
    expect(generated.headline.length).toBeGreaterThan(0);
    expect(generated.primaryText).toContain('Rani Beauty Clinic');
    expect(generated.cta).toBe(CTA_TEXT.book_now);
    expect(generated.keywords).toEqual(botox.keywords);
  });

  it('generateAllFrameworks returns all 15 copy frameworks exactly once', () => {
    const allFrameworks = generateAllFrameworks(botox);

    expect(allFrameworks).toHaveLength(15);
    expect(new Set(allFrameworks.map(item => item.framework)).size).toBe(15);
    expect(allFrameworks.every(item => item.service.id === 'botox')).toBe(true);
  });

  it('generateHeadlines returns the five documented headline styles', () => {
    const headlines = generateHeadlines(botox);

    expect(headlines).toHaveLength(5);
    expect(headlines.map(item => item.style)).toEqual([
      'short',
      'long',
      'question',
      'stat',
      'emotional',
    ]);
  });

  it('generateDescriptions returns benefit, social proof, and educational variants', () => {
    const descriptions = generateDescriptions(botox);

    expect(descriptions).toHaveLength(3);
    expect(descriptions.map(item => item.style)).toEqual([
      'benefit',
      'social_proof',
      'educational',
    ]);
    expect(descriptions[0].text).toContain(botox.priceRange);
  });

  it('generateDKITemplates routes consultation traffic to the booking URL', () => {
    const templates = generateDKITemplates(consultation);

    expect(templates).toHaveLength(3);
    expect(templates.every(template => template.finalUrl === 'https://ranibeautyclinic.com/book')).toBe(true);
    expect(templates[0].headline).toContain('{KeyWord:Free Consultation}');
  });

  it('generateRSA enforces headline and description length limits and pins the first headline', () => {
    const rsa = generateRSA(consultation);

    expect(rsa.headlines).toHaveLength(15);
    expect(rsa.descriptions).toHaveLength(4);
    expect(rsa.headlines.every(headline => headline.length <= 30)).toBe(true);
    expect(rsa.descriptions.every(description => description.length <= 90)).toBe(true);
    expect(rsa.pinnedHeadlines).toEqual({ 1: 0 });
    expect(rsa.finalUrl).toBe('https://ranibeautyclinic.com/book');
  });

  it('generateVisual uses the size dimensions and returns SVG markup', () => {
    const visual = generateVisual('service_spotlight', botox, 'story');

    expect(visual.size).toBe('story');
    expect(visual.width).toBe(AD_SIZES.story.width);
    expect(visual.height).toBe(AD_SIZES.story.height);
    expect(visual.svg).toContain('<svg');
    expect(visual.svg).toContain('Botox');
  });

  it('generateAllVisuals returns all 10 visual templates for a size', () => {
    const visuals = generateAllVisuals(botox, 'feed');

    expect(visuals).toHaveLength(10);
    expect(new Set(visuals.map(visual => visual.template)).size).toBe(10);
    expect(visuals.every(visual => visual.width === AD_SIZES.feed.width)).toBe(true);
  });

  it('generateCreativeBatch includes copy, search assets, visuals, and deterministic timestamps', () => {
    const batch = generateCreativeBatch(botox, ['feed', 'story']);

    expect(batch.service.id).toBe('botox');
    expect(batch.copy).toHaveLength(15);
    expect(batch.headlines).toHaveLength(5);
    expect(batch.descriptions).toHaveLength(3);
    expect(batch.dkiTemplates).toHaveLength(3);
    expect(batch.visuals).toHaveLength(20);
    expect(batch.generatedAt).toBe('2026-04-10T12:00:00.000Z');
  });

  it('generateFullCatalog builds one creative batch per service', () => {
    const catalog = generateFullCatalog(['feed']);

    expect(catalog).toHaveLength(RANI_SERVICES.length);
    expect(catalog[0].visuals).toHaveLength(10);
    expect(catalog.every(item => item.copy.length === 15)).toBe(true);
  });

  it('getServiceById resolves known services and returns undefined for unknown ids', () => {
    expect(getServiceById('botox')?.name).toBe('Botox');
    expect(getServiceById('missing-service')).toBeUndefined();
  });

  it('getFrameworks exposes all documented framework definitions', () => {
    const frameworks = getFrameworks();

    expect(frameworks).toHaveLength(15);
    expect(frameworks[0]).toMatchObject({ id: 'pas', label: 'PAS' });
    expect(frameworks.at(-1)).toMatchObject({ id: 'seasonal', label: 'Seasonal' });
  });
});
