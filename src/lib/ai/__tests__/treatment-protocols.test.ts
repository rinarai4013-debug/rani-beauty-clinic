import { describe, it, expect } from 'vitest';
import {
  getAllProtocols,
  getProtocolById,
  getProtocolsByCategory,
  getProtocolsForConcerns,
  checkContraindications,
  searchProtocols,
  getProtocolCount,
  getProtocolCategories,
} from '../treatment-protocols';

describe('Treatment Protocols Library', () => {
  describe('getAllProtocols', () => {
    it('returns all protocols (47 total)', () => {
      const protocols = getAllProtocols();
      expect(protocols.length).toBe(47);
    });

    it('every protocol has required fields', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.category).toBeTruthy();
        expect(p.version).toBeTruthy();
        expect(p.indication.length).toBeGreaterThan(0);
        expect(p.contraindications.length).toBeGreaterThan(0);
        expect(p.preCare.length).toBeGreaterThan(0);
        expect(p.technique.steps.length).toBeGreaterThan(0);
        expect(p.technique.duration).toBeGreaterThan(0);
        expect(p.postCare.length).toBeGreaterThan(0);
        expect(p.expectedResults.immediatePost).toBeTruthy();
        expect(p.expectedResults.oneWeek).toBeTruthy();
        expect(p.expectedResults.oneMonth).toBeTruthy();
        expect(p.pricing.basePrice).toBeGreaterThan(0);
        expect(p.icd10Codes.length).toBeGreaterThan(0);
      }
    });

    it('no protocol recommends infusion as a treatment — only injection', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        // Check name and indication — should never say "infusion"
        expect(p.name.toLowerCase()).not.toContain('infusion');
        for (const ind of p.indication) {
          expect(ind.toLowerCase()).not.toContain('infusion');
        }
      }
    });

    it('all protocol IDs are unique', () => {
      const protocols = getAllProtocols();
      const ids = protocols.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getProtocolById', () => {
    it('returns correct protocol', () => {
      const p = getProtocolById('botox-forehead');
      expect(p).toBeDefined();
      expect(p!.name).toContain('Forehead');
    });

    it('returns undefined for unknown ID', () => {
      expect(getProtocolById('nonexistent')).toBeUndefined();
    });

    it('returns botox lip flip', () => {
      const p = getProtocolById('botox-lip-flip');
      expect(p).toBeDefined();
      expect(p!.category).toBe('injectable_neurotoxin');
    });

    it('returns filler cheeks', () => {
      const p = getProtocolById('filler-cheeks');
      expect(p).toBeDefined();
      expect(p!.category).toBe('injectable_filler');
    });

    it('returns RF microneedling face', () => {
      const p = getProtocolById('rfmn-face');
      expect(p).toBeDefined();
      expect(p!.technique.duration).toBe(45);
    });

    it('returns sofwave full face', () => {
      const p = getProtocolById('sofwave-full-face');
      expect(p).toBeDefined();
      expect(p!.pricing.basePrice).toBe(3500);
    });

    it('returns GLP-1 semaglutide', () => {
      const p = getProtocolById('glp1-semaglutide');
      expect(p).toBeDefined();
      expect(p!.category).toBe('glp1');
    });

    it('returns NAD+ injection protocol', () => {
      const p = getProtocolById('nad-injection');
      expect(p).toBeDefined();
      expect(p!.category).toBe('nad_injection');
    });

    it('returns HRT protocol', () => {
      const p = getProtocolById('hrt-protocol');
      expect(p).toBeDefined();
      expect(p!.category).toBe('hrt');
    });
  });

  describe('getProtocolsByCategory', () => {
    it('returns 10 neurotoxin protocols', () => {
      const results = getProtocolsByCategory('injectable_neurotoxin');
      expect(results.length).toBe(10);
    });

    it('returns 9 filler protocols', () => {
      const results = getProtocolsByCategory('injectable_filler');
      expect(results.length).toBe(9);
    });

    it('returns 5 RF microneedling protocols', () => {
      const results = getProtocolsByCategory('rf_microneedling');
      expect(results.length).toBe(5);
    });

    it('returns 4 Sofwave protocols', () => {
      const results = getProtocolsByCategory('skin_tightening');
      expect(results.length).toBe(4);
    });

    it('returns 6 laser hair removal protocols', () => {
      const results = getProtocolsByCategory('laser_hair_removal');
      expect(results.length).toBe(6);
    });

    it('returns 4 chemical peel protocols', () => {
      const results = getProtocolsByCategory('chemical_peel');
      expect(results.length).toBe(4);
    });

    it('returns 3 HydraFacial protocols', () => {
      const results = getProtocolsByCategory('facial');
      expect(results.length).toBe(3);
    });

    it('returns 2 GLP-1 protocols', () => {
      const results = getProtocolsByCategory('glp1');
      expect(results.length).toBe(2);
    });

    it('returns empty for unknown category', () => {
      const results = getProtocolsByCategory('unknown' as any);
      expect(results.length).toBe(0);
    });
  });

  describe('getProtocolsForConcerns', () => {
    it('finds protocols for wrinkle concerns', () => {
      const results = getProtocolsForConcerns(['wrinkle', 'fine lines']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds protocols for acne', () => {
      const results = getProtocolsForConcerns(['acne']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds protocols for weight loss', () => {
      const results = getProtocolsForConcerns(['weight loss', 'BMI']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for unmatched concerns', () => {
      const results = getProtocolsForConcerns(['xyznonexistent']);
      expect(results.length).toBe(0);
    });
  });

  describe('checkContraindications', () => {
    it('flags pregnancy for Botox', () => {
      const result = checkContraindications('botox-forehead', {
        pregnant: true, breastfeeding: false, bloodThinners: false, autoimmune: false, conditions: [], medications: [],
      });
      expect(result.safe).toBe(false);
      expect(result.flags.some(f => f.severity === 'absolute')).toBe(true);
    });

    it('flags blood thinners as relative for fillers', () => {
      const result = checkContraindications('filler-cheeks', {
        pregnant: false, breastfeeding: false, bloodThinners: true, autoimmune: false, conditions: [], medications: [],
      });
      expect(result.flags.some(f => f.severity === 'relative')).toBe(true);
    });

    it('returns safe for healthy patient', () => {
      const result = checkContraindications('hydrafacial-signature', {
        pregnant: false, breastfeeding: false, bloodThinners: false, autoimmune: false, conditions: [], medications: [],
      });
      expect(result.safe).toBe(true);
      expect(result.flags.length).toBe(0);
    });

    it('flags breastfeeding for neurotoxin', () => {
      const result = checkContraindications('botox-glabella', {
        pregnant: false, breastfeeding: true, bloodThinners: false, autoimmune: false, conditions: [], medications: [],
      });
      expect(result.safe).toBe(false);
    });

    it('handles unknown protocol ID', () => {
      const result = checkContraindications('nonexistent', {
        pregnant: false, breastfeeding: false, bloodThinners: false, autoimmune: false, conditions: [], medications: [],
      });
      expect(result.safe).toBe(false);
    });

    it('detects neuromuscular disorder contraindication', () => {
      const result = checkContraindications('botox-forehead', {
        pregnant: false, breastfeeding: false, bloodThinners: false, autoimmune: false,
        conditions: ['neuromuscular disorders'], medications: [],
      });
      expect(result.flags.length).toBeGreaterThan(0);
    });
  });

  describe('searchProtocols', () => {
    it('finds Botox protocols by name', () => {
      const results = searchProtocols('botox');
      expect(results.length).toBeGreaterThanOrEqual(8);
    });

    it('finds HydraFacial by name', () => {
      const results = searchProtocols('hydrafacial');
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('finds by indication', () => {
      const results = searchProtocols('gummy smile');
      expect(results.length).toBeGreaterThan(0);
    });

    it('case insensitive', () => {
      const upper = searchProtocols('BOTOX');
      const lower = searchProtocols('botox');
      expect(upper.length).toBe(lower.length);
    });

    it('returns empty for no match', () => {
      const results = searchProtocols('xyznonexistent123');
      expect(results.length).toBe(0);
    });
  });

  describe('getProtocolCount', () => {
    it('returns 40', () => {
      expect(getProtocolCount()).toBe(47);
    });
  });

  describe('getProtocolCategories', () => {
    it('returns all categories with counts', () => {
      const cats = getProtocolCategories();
      expect(cats.length).toBeGreaterThan(0);
      const total = cats.reduce((sum, c) => sum + c.count, 0);
      expect(total).toBe(47);
    });

    it('each category has a label', () => {
      const cats = getProtocolCategories();
      for (const cat of cats) {
        expect(cat.label).toBeTruthy();
        expect(cat.count).toBeGreaterThan(0);
      }
    });
  });

  describe('Protocol Data Integrity', () => {
    it('all prices are positive numbers', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        expect(p.pricing.basePrice).toBeGreaterThan(0);
        if (p.pricing.priceRange) {
          expect(p.pricing.priceRange.min).toBeGreaterThan(0);
          expect(p.pricing.priceRange.max).toBeGreaterThanOrEqual(p.pricing.priceRange.min);
        }
      }
    });

    it('all durations are positive', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        expect(p.technique.duration).toBeGreaterThan(0);
        expect(p.technique.duration).toBeLessThanOrEqual(120);
      }
    });

    it('all ICD-10 codes follow pattern', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        for (const code of p.icd10Codes) {
          expect(code).toMatch(/^[A-Z]\d{2}/);
        }
      }
    });

    it('all versions follow semver-like pattern', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        expect(p.version).toMatch(/^\d+\.\d+$/);
      }
    });

    it('all dates are valid ISO format', () => {
      const protocols = getAllProtocols();
      for (const p of protocols) {
        expect(new Date(p.lastUpdated).toString()).not.toBe('Invalid Date');
      }
    });
  });
});
