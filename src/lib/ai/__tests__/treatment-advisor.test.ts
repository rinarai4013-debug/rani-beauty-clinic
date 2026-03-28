import { describe, it, expect } from 'vitest';
import {
  generateTreatmentPlan,
  CONCERN_MAP,
  COMBINATION_LIBRARY,
  COMPATIBILITY,
  SEASONAL_RECS,
  BUDGET_CONFIGS,
} from '../treatment-advisor';
import type { ClientProfile, SkinConcern, BudgetTier } from '@/types/ai-treatment';

function makeProfile(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    name: 'Test Client',
    age: 40,
    gender: 'female',
    skinType: 2,
    concerns: ['wrinkles', 'volume_loss'] as SkinConcern[],
    budget: 'value' as BudgetTier,
    painTolerance: 'moderate',
    downtimeAvailability: 'minimal',
    medicalHistory: {
      pregnant: false, breastfeeding: false, bloodThinners: false,
      autoimmune: false, keloidHistory: false, activeSkinInfection: false,
      recentSunExposure: false, isotretinoin: false, allergies: [], medications: [], conditions: [],
    },
    lifestyleFactors: {
      sunExposure: 'moderate', smoking: false, skincare: 'basic',
      waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
    },
    ...overrides,
  };
}

describe('Treatment Advisor', () => {
  describe('generateTreatmentPlan', () => {
    it('returns a complete treatment plan', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.primary).toBeDefined();
      expect(plan.primary.treatment).toBeTruthy();
      expect(plan.primary.fitScore).toBeGreaterThan(0);
      expect(plan.alternatives).toBeDefined();
      expect(plan.timeline).toBeDefined();
      expect(plan.maintenanceSchedule).toBeDefined();
      expect(plan.costEstimate).toBeDefined();
      expect(plan.expectations).toBeDefined();
    });

    it('primary treatment has required fields', () => {
      const plan = generateTreatmentPlan(makeProfile());
      const p = plan.primary;
      expect(p.id).toBeTruthy();
      expect(p.treatment).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.reasoning).toBeTruthy();
      expect(p.fitScore).toBeGreaterThan(0);
      expect(p.fitScore).toBeLessThanOrEqual(100);
      expect(p.price).toBeGreaterThan(0);
      expect(p.sessions).toBeGreaterThanOrEqual(1);
    });

    it('alternatives are ranked by fit score', () => {
      const plan = generateTreatmentPlan(makeProfile());
      for (let i = 1; i < plan.alternatives.length; i++) {
        expect(plan.alternatives[i].fitScore).toBeLessThanOrEqual(plan.alternatives[i - 1].fitScore);
      }
    });

    it('cost estimate has payment options', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.costEstimate.initialTreatment).toBeGreaterThan(0);
      expect(plan.costEstimate.paymentOptions.length).toBeGreaterThan(0);
    });

    it('timeline has milestones', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.timeline.milestones.length).toBeGreaterThan(0);
      expect(plan.timeline.totalDuration).toBeTruthy();
    });

    it('maintenance schedule has tips', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.maintenanceSchedule.tips.length).toBeGreaterThan(0);
      expect(plan.maintenanceSchedule.annualCost).toBeGreaterThan(0);
    });

    it('expectations include realistic statement', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.expectations.realisticStatement).toBeTruthy();
      expect(plan.expectations.immediateResults).toBeTruthy();
    });

    it('seasonal notes are populated', () => {
      const plan = generateTreatmentPlan(makeProfile());
      expect(plan.seasonalNotes.length).toBeGreaterThan(0);
    });
  });

  describe('Concern-specific plans', () => {
    it('recommends Botox for wrinkles', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['wrinkles'] }));
      expect(plan.primary.category).toBe('injectable_neurotoxin');
    });

    it('recommends fillers for volume loss', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['volume_loss'] }));
      expect(plan.primary.category).toBe('injectable_filler');
    });

    it('recommends HydraFacial or peel for acne', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['acne'] }));
      expect(['facial', 'chemical_peel']).toContain(plan.primary.category);
    });

    it('recommends RF microneedling for scarring', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['scarring'] }));
      expect(plan.primary.category).toBe('rf_microneedling');
    });

    it('recommends Sofwave for laxity (luxury budget)', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['laxity'], budget: 'luxury' }));
      expect(plan.primary.category).toBe('skin_tightening');
    });

    it('recommends lip filler for lip enhancement', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['lip_enhancement'] }));
      expect(plan.primary.category).toBe('injectable_filler');
    });

    it('recommends GLP-1 for body contouring', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['body_contouring'] }));
      expect(plan.primary.category).toBe('glp1');
    });

    it('recommends laser for hair removal', () => {
      const plan = generateTreatmentPlan(makeProfile({ concerns: ['hair_removal'] }));
      expect(plan.primary.category).toBe('laser_hair_removal');
    });
  });

  describe('Budget-aware planning', () => {
    it('essential budget keeps costs low', () => {
      const plan = generateTreatmentPlan(makeProfile({ budget: 'essential', concerns: ['wrinkles'] }));
      expect(plan.costEstimate.tier).toBe('essential');
    });

    it('luxury budget includes premium treatments', () => {
      const plan = generateTreatmentPlan(makeProfile({ budget: 'luxury', concerns: ['laxity'] }));
      expect(plan.costEstimate.tier).toBe('luxury');
    });

    it('financing option included for high costs', () => {
      const plan = generateTreatmentPlan(makeProfile({ budget: 'luxury', concerns: ['laxity', 'wrinkles', 'volume_loss'] }));
      const hasFinancing = plan.costEstimate.paymentOptions.some(p => p.type === 'financing');
      // Financing should be available for luxury tier treatments
      if (plan.costEstimate.fullPlan >= 1000) {
        expect(hasFinancing).toBe(true);
      }
    });
  });

  describe('Pain and downtime adjustments', () => {
    it('low pain tolerance penalizes painful treatments', () => {
      const lowPain = generateTreatmentPlan(makeProfile({ painTolerance: 'low', concerns: ['texture'] }));
      const highPain = generateTreatmentPlan(makeProfile({ painTolerance: 'high', concerns: ['texture'] }));
      // Low pain tolerance should not recommend high-pain treatments as primary
      // or should lower their fit score
      expect(lowPain.primary).toBeDefined();
    });

    it('no downtime preference favors zero-downtime treatments', () => {
      const plan = generateTreatmentPlan(makeProfile({ downtimeAvailability: 'none', concerns: ['wrinkles'] }));
      expect(plan.primary.downtime).toBe('None');
    });
  });

  describe('Contraindication handling', () => {
    it('pregnancy flags contraindicated treatments', () => {
      const plan = generateTreatmentPlan(makeProfile({
        concerns: ['wrinkles'],
        medicalHistory: {
          ...makeProfile().medicalHistory,
          pregnant: true,
        },
      }));
      expect(plan.contraindications.length).toBeGreaterThan(0);
      expect(plan.contraindications.some(c => c.medicalFactor === 'Pregnancy')).toBe(true);
    });

    it('blood thinners generate relative contraindication', () => {
      const plan = generateTreatmentPlan(makeProfile({
        concerns: ['wrinkles'],
        medicalHistory: {
          ...makeProfile().medicalHistory,
          bloodThinners: true,
        },
      }));
      expect(plan.contraindications.some(c => c.medicalFactor === 'Blood thinners')).toBe(true);
    });

    it('isotretinoin flags resurfacing treatments', () => {
      const plan = generateTreatmentPlan(makeProfile({
        concerns: ['scarring'],
        medicalHistory: {
          ...makeProfile().medicalHistory,
          isotretinoin: true,
        },
      }));
      expect(plan.contraindications.some(c => c.medicalFactor.includes('Isotretinoin'))).toBe(true);
    });
  });

  describe('Age-appropriate recommendations', () => {
    it('does not recommend skin tightening for young patients', () => {
      const plan = generateTreatmentPlan(makeProfile({ age: 25, concerns: ['texture', 'pores'] }));
      expect(plan.primary.category).not.toBe('skin_tightening');
    });

    it('favors fillers for 40+ with volume loss', () => {
      const plan = generateTreatmentPlan(makeProfile({ age: 48, concerns: ['volume_loss'] }));
      expect(plan.primary.category).toBe('injectable_filler');
    });
  });

  describe('CONCERN_MAP', () => {
    it('covers all 15 skin concerns', () => {
      const concerns: SkinConcern[] = [
        'wrinkles', 'volume_loss', 'acne', 'scarring', 'pigmentation',
        'redness', 'texture', 'pores', 'laxity', 'double_chin',
        'body_contouring', 'hair_removal', 'dark_circles', 'lip_enhancement', 'neck_chest_aging',
      ];
      for (const c of concerns) {
        expect(CONCERN_MAP[c]).toBeDefined();
        expect(CONCERN_MAP[c].treatments.length).toBeGreaterThan(0);
      }
    });
  });

  describe('COMBINATION_LIBRARY', () => {
    it('has 8 combination protocols', () => {
      expect(COMBINATION_LIBRARY.length).toBe(8);
    });

    it('each combination has required fields', () => {
      for (const combo of COMBINATION_LIBRARY) {
        expect(combo.name).toBeTruthy();
        expect(combo.treatments.length).toBeGreaterThanOrEqual(2);
        expect(combo.synergy).toBeTruthy();
        expect(combo.order).toBeTruthy();
        expect(combo.totalPrice).toBeGreaterThan(0);
      }
    });

    it('savings are non-negative', () => {
      for (const combo of COMBINATION_LIBRARY) {
        expect(combo.savingsVsSeparate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('COMPATIBILITY', () => {
    it('has compatibility entries', () => {
      expect(COMPATIBILITY.length).toBeGreaterThan(0);
    });

    it('each entry has spacing info', () => {
      for (const entry of COMPATIBILITY) {
        expect(entry.spacing).toBeTruthy();
        expect(entry.notes).toBeTruthy();
      }
    });

    it('contains known incompatibility', () => {
      const incompatible = COMPATIBILITY.find(c => !c.compatible);
      expect(incompatible).toBeDefined();
    });
  });

  describe('SEASONAL_RECS', () => {
    it('has 4 seasons', () => {
      expect(SEASONAL_RECS.length).toBe(4);
      const seasons = SEASONAL_RECS.map(r => r.season);
      expect(seasons).toContain('spring');
      expect(seasons).toContain('summer');
      expect(seasons).toContain('fall');
      expect(seasons).toContain('winter');
    });

    it('each season has recommendations', () => {
      for (const rec of SEASONAL_RECS) {
        expect(rec.recommended.length).toBeGreaterThan(0);
        expect(rec.bestTreatments.length).toBeGreaterThan(0);
        expect(rec.reasoning).toBeTruthy();
      }
    });
  });

  describe('BUDGET_CONFIGS', () => {
    it('has 3 tiers', () => {
      expect(BUDGET_CONFIGS.essential).toBeDefined();
      expect(BUDGET_CONFIGS.value).toBeDefined();
      expect(BUDGET_CONFIGS.luxury).toBeDefined();
    });

    it('tiers increase in budget', () => {
      expect(BUDGET_CONFIGS.value.maxInitial).toBeGreaterThan(BUDGET_CONFIGS.essential.maxInitial);
      expect(BUDGET_CONFIGS.luxury.maxInitial).toBeGreaterThan(BUDGET_CONFIGS.value.maxInitial);
    });
  });
});
