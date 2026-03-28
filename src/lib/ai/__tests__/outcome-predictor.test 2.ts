import { describe, it, expect } from 'vitest';
import {
  predictOutcome,
  predictOutcomes,
  createOutcomeRecord,
  OUTCOME_PROFILES,
} from '../outcome-predictor';
import type { ClientProfile, SkinConcern } from '@/types/ai-treatment';

function makeProfile(overrides: Partial<ClientProfile> = {}): ClientProfile {
  return {
    name: 'Test Client',
    age: 40,
    gender: 'female',
    skinType: 2,
    concerns: ['wrinkles'] as SkinConcern[],
    budget: 'value',
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

describe('Outcome Predictor', () => {
  describe('predictOutcome', () => {
    it('returns prediction for Botox forehead', () => {
      const result = predictOutcome(makeProfile(), 'botox-forehead');
      expect(result.treatmentId).toBe('botox-forehead');
      expect(result.treatmentName).toContain('Botox');
      expect(result.satisfactionLikelihood).toBeGreaterThan(0);
      expect(result.satisfactionLikelihood).toBeLessThanOrEqual(10);
    });

    it('returns prediction for filler cheeks', () => {
      const result = predictOutcome(makeProfile(), 'filler-cheeks');
      expect(result.treatmentId).toBe('filler-cheeks');
      expect(result.resultsDuration.typical).toBeTruthy();
    });

    it('returns prediction for RF microneedling', () => {
      const result = predictOutcome(makeProfile(), 'rfmn-face');
      expect(result.sessionsNeeded.recommended).toBe(3);
    });

    it('returns prediction for Sofwave', () => {
      const result = predictOutcome(makeProfile(), 'sofwave-full-face');
      expect(result.sessionsNeeded.recommended).toBe(1);
    });

    it('returns prediction for laser hair removal', () => {
      const result = predictOutcome(makeProfile(), 'lhr-face');
      expect(result.sessionsNeeded.recommended).toBeGreaterThanOrEqual(6);
    });

    it('returns prediction for VI Peel', () => {
      const result = predictOutcome(makeProfile(), 'peel-vi');
      expect(result.sideEffects.length).toBeGreaterThan(0);
    });

    it('returns prediction for HydraFacial', () => {
      const result = predictOutcome(makeProfile(), 'hydrafacial-signature');
      expect(result.satisfactionLikelihood).toBeGreaterThanOrEqual(8);
    });

    it('returns prediction for GLP-1', () => {
      const result = predictOutcome(makeProfile(), 'glp1-semaglutide');
      expect(result.sessionsNeeded.recommended).toBeGreaterThanOrEqual(12);
    });

    it('returns generic prediction for unknown treatment', () => {
      const result = predictOutcome(makeProfile(), 'unknown-treatment');
      expect(result.treatmentId).toBe('unknown-treatment');
      expect(result.satisfactionLikelihood).toBe(8.0);
    });

    it('has photo timeline points', () => {
      const result = predictOutcome(makeProfile(), 'botox-forehead');
      expect(result.photoTimeline.length).toBeGreaterThan(0);
      for (const point of result.photoTimeline) {
        expect(point.timing).toBeTruthy();
        expect(point.expectedAppearance).toBeTruthy();
      }
    });

    it('has expectation calibration', () => {
      const result = predictOutcome(makeProfile(), 'botox-forehead');
      expect(result.expectationCalibration.realisticOutcome).toBeTruthy();
      expect(result.expectationCalibration.bestCase).toBeTruthy();
      expect(result.expectationCalibration.worstCase).toBeTruthy();
      expect(result.expectationCalibration.commonMisconceptions.length).toBeGreaterThan(0);
    });
  });

  describe('Satisfaction adjustments', () => {
    it('smoking reduces satisfaction', () => {
      const smoker = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, smoking: true } }),
        'botox-forehead'
      );
      const nonSmoker = predictOutcome(makeProfile(), 'botox-forehead');
      expect(smoker.satisfactionLikelihood).toBeLessThan(nonSmoker.satisfactionLikelihood);
    });

    it('advanced skincare improves satisfaction', () => {
      const advanced = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, skincare: 'advanced' } }),
        'botox-forehead'
      );
      const none = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, skincare: 'none' } }),
        'botox-forehead'
      );
      expect(advanced.satisfactionLikelihood).toBeGreaterThan(none.satisfactionLikelihood);
    });

    it('satisfaction is always 1-10', () => {
      const profiles = [
        makeProfile({ age: 20 }),
        makeProfile({ age: 70 }),
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, smoking: true, sunExposure: 'heavy' } }),
      ];
      for (const profile of profiles) {
        const result = predictOutcome(profile, 'botox-forehead');
        expect(result.satisfactionLikelihood).toBeGreaterThanOrEqual(1);
        expect(result.satisfactionLikelihood).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Duration adjustments', () => {
    it('includes factors extending results', () => {
      const result = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, sunExposure: 'minimal', skincare: 'advanced' } }),
        'botox-forehead'
      );
      expect(result.resultsDuration.factorsExtending.length).toBeGreaterThan(0);
    });

    it('includes factors reducing results', () => {
      const result = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, smoking: true, sunExposure: 'heavy' } }),
        'botox-forehead'
      );
      expect(result.resultsDuration.factorsReducing.length).toBeGreaterThan(0);
      expect(result.resultsDuration.factorsReducing.some(f => f.toLowerCase().includes('smoking'))).toBe(true);
    });
  });

  describe('Side effect adjustments', () => {
    it('blood thinners increase bruising probability', () => {
      const withBT = predictOutcome(
        makeProfile({ medicalHistory: { ...makeProfile().medicalHistory, bloodThinners: true } }),
        'botox-forehead'
      );
      const withoutBT = predictOutcome(makeProfile(), 'botox-forehead');
      const btBruising = withBT.sideEffects.find(se => se.effect.toLowerCase().includes('bruis'));
      const noBTBruising = withoutBT.sideEffects.find(se => se.effect.toLowerCase().includes('bruis'));
      if (btBruising && noBTBruising) {
        expect(btBruising.probability).toBeGreaterThan(noBTBruising.probability);
      }
    });

    it('darker skin increases PIH risk for RF', () => {
      const darkSkin = predictOutcome(makeProfile({ skinType: 5 }), 'rfmn-face');
      const lightSkin = predictOutcome(makeProfile({ skinType: 2 }), 'rfmn-face');
      const darkPIH = darkSkin.sideEffects.find(se => se.effect.toLowerCase().includes('hyperpigmentation'));
      const lightPIH = lightSkin.sideEffects.find(se => se.effect.toLowerCase().includes('hyperpigmentation'));
      if (darkPIH && lightPIH) {
        expect(darkPIH.probability).toBeGreaterThan(lightPIH.probability);
      }
    });

    it('all probabilities are 0-100', () => {
      const result = predictOutcome(makeProfile(), 'filler-cheeks');
      for (const se of result.sideEffects) {
        expect(se.probability).toBeGreaterThanOrEqual(0);
        expect(se.probability).toBeLessThanOrEqual(100);
      }
    });

    it('each side effect has management info', () => {
      const result = predictOutcome(makeProfile(), 'filler-cheeks');
      for (const se of result.sideEffects) {
        expect(se.management).toBeTruthy();
        expect(se.duration).toBeTruthy();
      }
    });
  });

  describe('Session adjustments', () => {
    it('older patients may need more RF sessions', () => {
      const older = predictOutcome(makeProfile({ age: 60 }), 'rfmn-face');
      const younger = predictOutcome(makeProfile({ age: 35 }), 'rfmn-face');
      expect(older.sessionsNeeded.recommended).toBeGreaterThanOrEqual(younger.sessionsNeeded.recommended);
    });

    it('darker skin may need more laser sessions', () => {
      const dark = predictOutcome(makeProfile({ skinType: 5 }), 'lhr-face');
      const light = predictOutcome(makeProfile({ skinType: 2 }), 'lhr-face');
      expect(dark.sessionsNeeded.recommended).toBeGreaterThanOrEqual(light.sessionsNeeded.recommended);
    });
  });

  describe('Outcome factors', () => {
    it('identifies positive factors', () => {
      const result = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, sunExposure: 'minimal', skincare: 'advanced', exerciseFrequency: 'regular' } }),
        'botox-forehead'
      );
      expect(result.outcomeFactors.some(f => f.impact === 'improves')).toBe(true);
    });

    it('identifies negative factors', () => {
      const result = predictOutcome(
        makeProfile({ lifestyleFactors: { ...makeProfile().lifestyleFactors!, smoking: true, sunExposure: 'heavy', sleepQuality: 'poor' } }),
        'botox-forehead'
      );
      expect(result.outcomeFactors.some(f => f.impact === 'reduces')).toBe(true);
    });

    it('each factor has a recommendation', () => {
      const result = predictOutcome(makeProfile(), 'botox-forehead');
      for (const factor of result.outcomeFactors) {
        expect(factor.recommendation).toBeTruthy();
        expect(factor.magnitude).toBeTruthy();
      }
    });
  });

  describe('predictOutcomes (batch)', () => {
    it('returns predictions for multiple treatments', () => {
      const results = predictOutcomes(makeProfile(), ['botox-forehead', 'filler-cheeks', 'rfmn-face']);
      expect(results.length).toBe(3);
      expect(results[0].treatmentId).toBe('botox-forehead');
      expect(results[1].treatmentId).toBe('filler-cheeks');
      expect(results[2].treatmentId).toBe('rfmn-face');
    });

    it('handles empty array', () => {
      const results = predictOutcomes(makeProfile(), []);
      expect(results.length).toBe(0);
    });
  });

  describe('createOutcomeRecord', () => {
    it('creates a valid record', () => {
      const record = createOutcomeRecord(
        'client-123',
        'botox-forehead',
        '2026-03-01',
        makeProfile(),
        { satisfaction: 9, resultsDuration: '4 months', sideEffects: ['mild bruising'], sessionsCompleted: 1, wouldRepeat: true },
      );
      expect(record.clientId).toBe('client-123');
      expect(record.treatmentId).toBe('botox-forehead');
      expect(record.outcome.satisfaction).toBe(9);
      expect(record.demographics.age).toBe(40);
    });
  });

  describe('OUTCOME_PROFILES database', () => {
    it('has profiles for key treatments', () => {
      expect(OUTCOME_PROFILES['botox-forehead']).toBeDefined();
      expect(OUTCOME_PROFILES['filler-cheeks']).toBeDefined();
      expect(OUTCOME_PROFILES['rfmn-face']).toBeDefined();
      expect(OUTCOME_PROFILES['sofwave-full-face']).toBeDefined();
      expect(OUTCOME_PROFILES['lhr-face']).toBeDefined();
      expect(OUTCOME_PROFILES['peel-vi']).toBeDefined();
      expect(OUTCOME_PROFILES['hydrafacial-signature']).toBeDefined();
      expect(OUTCOME_PROFILES['glp1-semaglutide']).toBeDefined();
    });

    it('each profile has required fields', () => {
      for (const [, profile] of Object.entries(OUTCOME_PROFILES)) {
        expect(profile.baseSatisfaction).toBeGreaterThan(0);
        expect(profile.baseSatisfaction).toBeLessThanOrEqual(10);
        expect(profile.durationRange.typical).toBeTruthy();
        expect(profile.sideEffects.length).toBeGreaterThan(0);
        expect(profile.sessionRange.recommended).toBeGreaterThanOrEqual(1);
        expect(profile.photoTimeline.length).toBeGreaterThan(0);
      }
    });

    it('no profile text says infusion', () => {
      const text = JSON.stringify(OUTCOME_PROFILES).toLowerCase();
      expect(text).not.toContain('infusion');
    });
  });

  describe('Expectation calibration', () => {
    it('Botox calibration mentions natural expression', () => {
      const result = predictOutcome(makeProfile(), 'botox-forehead');
      const misconceptions = result.expectationCalibration.commonMisconceptions;
      expect(misconceptions.some(m => m.toLowerCase().includes('freeze') || m.toLowerCase().includes('natural'))).toBe(true);
    });

    it('Filler calibration mentions swelling', () => {
      const result = predictOutcome(makeProfile(), 'filler-cheeks');
      const misconceptions = result.expectationCalibration.commonMisconceptions;
      expect(misconceptions.some(m => m.toLowerCase().includes('swoll') || m.toLowerCase().includes('swelling'))).toBe(true);
    });

    it('RF calibration mentions series treatment', () => {
      const result = predictOutcome(makeProfile(), 'rfmn-face');
      const misconceptions = result.expectationCalibration.commonMisconceptions;
      expect(misconceptions.some(m => m.toLowerCase().includes('series') || m.toLowerCase().includes('one session'))).toBe(true);
    });

    it('GLP-1 calibration mentions lifestyle', () => {
      const result = predictOutcome(makeProfile(), 'glp1-semaglutide');
      const misconceptions = result.expectationCalibration.commonMisconceptions;
      expect(misconceptions.some(m => m.toLowerCase().includes('magic') || m.toLowerCase().includes('exercise'))).toBe(true);
    });
  });
});
