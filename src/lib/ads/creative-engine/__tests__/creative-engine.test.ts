import { describe, it, expect } from 'vitest';
import {
  AD_SIZES,
  generateAllFrameworks,
  generateAllVisuals,
  generateCopy,
  generateCreativeBatch,
  generateDescriptions,
  generateDKITemplates,
  generateFullCatalog,
  generateHeadlines,
  generateRSA,
  generateVisual,
  getFrameworks,
  getServiceById,
  RANI_SERVICES,
} from '../creative-engine';

describe('creative-engine', () => {
  const botox = RANI_SERVICES.find((service) => service.id === 'botox');

  if (!botox) {
    throw new Error('Expected botox service fixture to exist');
  }

  describe('catalog and service lookup', () => {
    it('returns the full list of frameworks', () => {
      const frameworks = getFrameworks();

      expect(frameworks).toHaveLength(15);
      expect(frameworks.map((framework) => framework.id)).toEqual([
        'pas',
        'aida',
        'bab',
        'fab',
        'story',
        'question',
        'stat',
        'testimonial',
        'social_proof',
        'urgency',
        'authority',
        'educational',
        'comparison',
        'lifestyle',
        'seasonal',
      ]);
      frameworks.forEach((framework) => {
        expect(framework.label).toBeTruthy();
        expect(framework.description).toBeTruthy();
      });
    });

    it('looks up a service by id and returns undefined when missing', () => {
      expect(getServiceById('botox')?.name).toBe('Botox');
      expect(getServiceById('not-a-service')).toBeUndefined();
    });

    it('generates a full catalog for every service', () => {
      const catalog = generateFullCatalog(['story']);
      const expectedServiceCount = RANI_SERVICES.length;

      expect(catalog).toHaveLength(expectedServiceCount);
      expect(new Set(catalog.map((entry) => entry.service.id)).size).toBe(expectedServiceCount);
    });
  });

  describe('copy generation', () => {
    it('generates all 15 copy frameworks for a service', () => {
      const all = generateAllFrameworks(botox);

      expect(all).toHaveLength(15);
      expect(all[0]).toMatchObject({ framework: 'pas', service: botox });
      expect(all.map((copy) => copy.framework)).toEqual([
        'pas',
        'aida',
        'bab',
        'fab',
        'story',
        'question',
        'stat',
        'testimonial',
        'social_proof',
        'urgency',
        'authority',
        'educational',
        'comparison',
        'lifestyle',
        'seasonal',
      ]);
      all.forEach((copy) => {
        expect(copy.primaryText).toBeTruthy();
        expect(copy.description).toBeTruthy();
        expect(copy.keywords).toEqual(botox.keywords);
      });
      expect(all.every((copy) => typeof copy.cta === 'string')).toBe(true);
      expect(all.every((copy) => copy.keywords.length > 0)).toBe(true);
    });

    it('generates a copy variant for a specific framework', () => {
      const copy = generateCopy('social_proof', botox);

      expect(copy.framework).toBe('social_proof');
      expect(copy.service.id).toBe(botox.id);
      expect(copy.headline.length).toBeGreaterThan(0);
      expect(copy.description).toContain(botox.socialProofStat);
      expect(copy.primaryText.length).toBeGreaterThan(0);
      expect(copy.keywords).toEqual(botox.keywords);
      expect(copy.primaryText.toLowerCase()).not.toContain('infusion');
    });

    it('generates five headline variants with expected style set', () => {
      const headlines = generateHeadlines(botox);

      expect(headlines).toHaveLength(5);
      expect(headlines.map((item) => item.style)).toEqual([
        'short',
        'long',
        'question',
        'stat',
        'emotional',
      ]);
      expect(headlines.map((item) => item.text)).toContain(`${botox.name} — Real Results`);
      expect(headlines.every((item) => item.text.length > 0)).toBe(true);
    });

    it('generates three description variants', () => {
      const descriptions = generateDescriptions(botox);

      expect(descriptions).toHaveLength(3);
      expect(descriptions[0].style).toBe('benefit');
      expect(descriptions[1].style).toBe('social_proof');
      expect(descriptions[2].style).toBe('educational');
      expect(descriptions.every((desc) => desc.text.includes(botox.name) || desc.text.includes('Rani Beauty Clinic'))).toBe(true);
    });

    it('builds DKI templates and keeps URLs valid for service ids', () => {
      const dki = generateDKITemplates(botox);

      expect(dki).toHaveLength(3);
      dki.forEach((template) => {
        expect(template.headline).toContain('{KeyWord:Botox}');
        expect(template.service).toBe(botox.id);
        expect(template.finalUrl).toBe('https://www.ranibeautyclinic.com/botox');
      });
      expect(dki[1].finalUrl).toBe('https://www.ranibeautyclinic.com/botox');
    });

    it('generates RSA content with valid character counts', () => {
      const rsa = generateRSA(botox);

      expect(rsa.headlines).toHaveLength(15);
      expect(rsa.descriptions).toHaveLength(4);
      expect(rsa.service).toBe(botox.id);
      expect(rsa.finalUrl).toBe('https://www.ranibeautyclinic.com/botox');
      expect(rsa.headlines.every((headline) => headline.length <= 30)).toBe(true);
      expect(rsa.descriptions.every((description) => description.length <= 90)).toBe(true);
      expect(rsa.pinnedHeadlines).toEqual({ 1: 0 });
    });
  });

  describe('visual generation', () => {
    it('generates an SVG visual for one template + size', () => {
      const visual = generateVisual('before_after', botox, 'feed');

      expect(visual.template).toBe('before_after');
      expect(visual.size).toBe('feed');
      expect(visual.width).toBe(AD_SIZES.feed.width);
      expect(visual.height).toBe(AD_SIZES.feed.height);
      expect(visual.service).toBe(botox.id);
      expect(visual.svg).toContain('<svg');
      expect(visual.svg).toContain(botox.name);
      expect(visual.svg).toContain('Rani Beauty Clinic');
      expect(visual.svg).toContain('#0F1D2C');
      expect(visual.svg.toLowerCase()).not.toContain('infusion');
    });

    it('generates 10 visual templates for one size', () => {
      const visuals = generateAllVisuals(botox, 'story');

      expect(visuals).toHaveLength(10);
      expect(visuals.every((visual) => visual.service === botox.id)).toBe(true);
      expect(visuals.every((visual) => visual.size === 'story')).toBe(true);
      const templateNames = visuals.map((visual) => visual.template);
      const uniqueNames = Array.from(new Set(templateNames));
      expect(uniqueNames).toHaveLength(10);
    });

    it('generates all templates across multiple sizes in one creative batch', () => {
      const batch = generateCreativeBatch(botox, ['feed', 'story']);

      expect(batch.copy).toHaveLength(15);
      expect(batch.headlines).toHaveLength(5);
      expect(batch.descriptions).toHaveLength(3);
      expect(batch.dkiTemplates).toHaveLength(3);
      expect(batch.rsa.headlines).toHaveLength(15);
      expect(batch.visuals).toHaveLength(20);
      expect(batch.generatedAt).toBeTruthy();
      expect(new Date(batch.generatedAt).toString()).not.toBe('Invalid Date');
    });
  });
});
