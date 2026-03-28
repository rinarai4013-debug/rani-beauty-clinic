import { describe, it, expect } from 'vitest';
import {
  determineFitzpatrickType,
  classifyGlogauScale,
  calculateSkinHealthScore,
  detectAgingPatterns,
  rankTreatmentPriorities,
  generateSkincareRoutine,
  compareToBenchmarks,
  calculateProgressDelta,
  performSkinAnalysis,
} from '../skin-analysis';

describe('Skin Analysis Engine', () => {
  describe('determineFitzpatrickType', () => {
    it('classifies very fair skin as Type I', () => {
      const result = determineFitzpatrickType({
        eyeColor: 'light_blue_green',
        naturalHairColor: 'red_light_blonde',
        skinColorUnexposed: 'reddish',
        sunburnReaction: 'always_burns_never_tans',
        tanningAbility: 'never',
      });
      expect(result.type).toBe(1);
      expect(result.description).toContain('Type I');
    });

    it('classifies fair skin as Type II', () => {
      const result = determineFitzpatrickType({
        eyeColor: 'blue_hazel_green',
        naturalHairColor: 'blonde',
        skinColorUnexposed: 'very_pale',
        sunburnReaction: 'usually_burns_tans_minimally',
        tanningAbility: 'seldom',
      });
      expect(result.type).toBe(2);
    });

    it('classifies medium skin as Type III', () => {
      const result = determineFitzpatrickType({
        eyeColor: 'hazel_brown',
        naturalHairColor: 'dark_blonde_light_brown',
        skinColorUnexposed: 'pale_with_beige',
        sunburnReaction: 'sometimes_burns_tans_uniformly',
        tanningAbility: 'sometimes',
      });
      expect(result.type).toBe(3);
    });

    it('classifies olive skin as Type IV', () => {
      const result = determineFitzpatrickType({
        eyeColor: 'dark_brown',
        naturalHairColor: 'dark_brown',
        skinColorUnexposed: 'olive_light_brown',
        sunburnReaction: 'rarely_burns_tans_easily',
        tanningAbility: 'often',
      });
      expect(result.type).toBe(4);
    });

    it('classifies dark skin as Type V-VI', () => {
      const result = determineFitzpatrickType({
        eyeColor: 'brownish_black',
        naturalHairColor: 'black',
        skinColorUnexposed: 'deeply_pigmented',
        sunburnReaction: 'never_burns_deeply_pigmented',
        tanningAbility: 'always_deeply',
      });
      expect(result.type).toBeGreaterThanOrEqual(5);
    });

    it('returns description for every type', () => {
      const inputs = [
        { eyeColor: 'light_blue_green' as const, naturalHairColor: 'red_light_blonde' as const, skinColorUnexposed: 'reddish' as const, sunburnReaction: 'always_burns_never_tans' as const, tanningAbility: 'never' as const },
        { eyeColor: 'brownish_black' as const, naturalHairColor: 'black' as const, skinColorUnexposed: 'deeply_pigmented' as const, sunburnReaction: 'never_burns_deeply_pigmented' as const, tanningAbility: 'always_deeply' as const },
      ];
      for (const input of inputs) {
        const result = determineFitzpatrickType(input);
        expect(result.description).toBeTruthy();
        expect(result.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('classifyGlogauScale', () => {
    it('classifies young skin as Scale 1', () => {
      const result = classifyGlogauScale({
        age: 25, wrinklesAtRest: false, wrinklesWithMovement: false,
        sunDamageVisible: false, keratoses: false, makeupUsage: 'none',
      });
      expect(result.scale).toBe(1);
    });

    it('classifies early aging as Scale 2', () => {
      const result = classifyGlogauScale({
        age: 38, wrinklesAtRest: false, wrinklesWithMovement: true,
        sunDamageVisible: false, keratoses: false, makeupUsage: 'minimal',
      });
      expect(result.scale).toBe(2);
    });

    it('classifies advanced aging as Scale 3', () => {
      const result = classifyGlogauScale({
        age: 55, wrinklesAtRest: true, wrinklesWithMovement: true,
        sunDamageVisible: true, keratoses: false, makeupUsage: 'heavy',
      });
      expect(result.scale).toBe(3);
    });

    it('classifies severe aging with keratoses as Scale 4', () => {
      const result = classifyGlogauScale({
        age: 65, wrinklesAtRest: true, wrinklesWithMovement: true,
        sunDamageVisible: true, keratoses: true, makeupUsage: 'heavy',
      });
      expect(result.scale).toBe(4);
    });

    it('returns characteristics for every scale', () => {
      const result = classifyGlogauScale({
        age: 55, wrinklesAtRest: true, wrinklesWithMovement: true,
        sunDamageVisible: true, keratoses: false, makeupUsage: 'heavy',
      });
      expect(result.characteristics.length).toBeGreaterThan(0);
      expect(result.description).toBeTruthy();
    });
  });

  describe('calculateSkinHealthScore', () => {
    const baseInput = {
      age: 35,
      skinType: 2 as const,
      concerns: [] as any[],
      lifestyle: {
        sunExposure: 'moderate' as const,
        smoking: false,
        skincare: 'moderate' as const,
        waterIntake: 'adequate' as const,
        sleepQuality: 'good' as const,
        stressLevel: 'moderate' as const,
        exerciseFrequency: 'regular' as const,
      },
      currentSkincare: 'moderate' as const,
      recentTreatments: [],
      selfRatedHydration: 3 as const,
      selfRatedTexture: 3 as const,
      selfRatedTone: 3 as const,
      selfRatedFirmness: 3 as const,
    };

    it('returns overall score 0-100', () => {
      const result = calculateSkinHealthScore(baseInput);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('returns all 8 dimensions', () => {
      const result = calculateSkinHealthScore(baseInput);
      expect(result.dimensions.hydration).toBeDefined();
      expect(result.dimensions.elasticity).toBeDefined();
      expect(result.dimensions.texture).toBeDefined();
      expect(result.dimensions.tone).toBeDefined();
      expect(result.dimensions.clarity).toBeDefined();
      expect(result.dimensions.firmness).toBeDefined();
      expect(result.dimensions.radiance).toBeDefined();
      expect(result.dimensions.protection).toBeDefined();
    });

    it('all dimensions are 0-100', () => {
      const result = calculateSkinHealthScore(baseInput);
      for (const [, value] of Object.entries(result.dimensions)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('smoking reduces scores', () => {
      const smoker = calculateSkinHealthScore({
        ...baseInput,
        lifestyle: { ...baseInput.lifestyle, smoking: true },
      });
      const nonSmoker = calculateSkinHealthScore(baseInput);
      expect(smoker.overall).toBeLessThan(nonSmoker.overall);
    });

    it('advanced skincare improves scores', () => {
      const advanced = calculateSkinHealthScore({
        ...baseInput,
        currentSkincare: 'advanced',
      });
      const none = calculateSkinHealthScore({
        ...baseInput,
        currentSkincare: 'none',
      });
      expect(advanced.overall).toBeGreaterThan(none.overall);
    });

    it('high water intake improves hydration', () => {
      const high = calculateSkinHealthScore({
        ...baseInput,
        lifestyle: { ...baseInput.lifestyle, waterIntake: 'high' },
      });
      const low = calculateSkinHealthScore({
        ...baseInput,
        lifestyle: { ...baseInput.lifestyle, waterIntake: 'low' },
      });
      expect(high.dimensions.hydration).toBeGreaterThan(low.dimensions.hydration);
    });

    it('concerns reduce related scores', () => {
      const withAcne = calculateSkinHealthScore({
        ...baseInput,
        concerns: ['acne', 'texture'],
      });
      const noConcerns = calculateSkinHealthScore(baseInput);
      expect(withAcne.dimensions.texture).toBeLessThan(noConcerns.dimensions.texture);
    });

    it('age affects elasticity', () => {
      const young = calculateSkinHealthScore({ ...baseInput, age: 25 });
      const older = calculateSkinHealthScore({ ...baseInput, age: 55 });
      expect(young.dimensions.elasticity).toBeGreaterThan(older.dimensions.elasticity);
    });

    it('recent HydraFacial improves radiance', () => {
      const withTreatment = calculateSkinHealthScore({
        ...baseInput,
        recentTreatments: ['HydraFacial'],
      });
      const without = calculateSkinHealthScore(baseInput);
      expect(withTreatment.dimensions.radiance).toBeGreaterThanOrEqual(without.dimensions.radiance);
    });
  });

  describe('detectAgingPatterns', () => {
    it('detects expression lines for age 35+ with wrinkle concerns', () => {
      const patterns = detectAgingPatterns(35, ['wrinkles'], {
        sunExposure: 'moderate', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      expect(patterns.some(p => p.type === 'expression_lines')).toBe(true);
    });

    it('detects gravity effects for age 40+', () => {
      const patterns = detectAgingPatterns(45, ['laxity'], {
        sunExposure: 'moderate', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      expect(patterns.some(p => p.type === 'gravity')).toBe(true);
    });

    it('detects sun damage with heavy exposure', () => {
      const patterns = detectAgingPatterns(40, ['pigmentation'], {
        sunExposure: 'heavy', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      expect(patterns.some(p => p.type === 'sun_damage')).toBe(true);
    });

    it('detects volume loss for age 35+', () => {
      const patterns = detectAgingPatterns(38, ['volume_loss'], {
        sunExposure: 'moderate', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      expect(patterns.some(p => p.type === 'volume_loss')).toBe(true);
    });

    it('each pattern has recommended treatments', () => {
      const patterns = detectAgingPatterns(50, ['wrinkles', 'laxity', 'pigmentation'], {
        sunExposure: 'heavy', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      for (const p of patterns) {
        expect(p.recommendedTreatments.length).toBeGreaterThan(0);
      }
    });

    it('severity increases with age', () => {
      const young = detectAgingPatterns(32, ['wrinkles'], {
        sunExposure: 'moderate', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      const older = detectAgingPatterns(55, ['wrinkles'], {
        sunExposure: 'moderate', smoking: false, skincare: 'basic',
        waterIntake: 'adequate', sleepQuality: 'fair', stressLevel: 'moderate', exerciseFrequency: 'occasional',
      });
      const youngSeverity = young.find(p => p.type === 'expression_lines')?.severity;
      const olderSeverity = older.find(p => p.type === 'expression_lines')?.severity;
      const severityOrder = { mild: 0, moderate: 1, advanced: 2 };
      if (youngSeverity && olderSeverity) {
        expect(severityOrder[olderSeverity]).toBeGreaterThanOrEqual(severityOrder[youngSeverity]);
      }
    });
  });

  describe('rankTreatmentPriorities', () => {
    const score = {
      overall: 60,
      dimensions: { hydration: 65, elasticity: 55, texture: 45, tone: 50, clarity: 60, firmness: 55, radiance: 60, protection: 50 },
    };

    it('returns priorities for each concern', () => {
      const priorities = rankTreatmentPriorities(['wrinkles', 'pigmentation'], score, 45);
      expect(priorities.length).toBe(2);
    });

    it('sorts by urgency', () => {
      const priorities = rankTreatmentPriorities(
        ['wrinkles', 'pigmentation', 'pores', 'hair_removal'],
        score, 45
      );
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(urgencyOrder[priorities[i].urgency]).toBeGreaterThanOrEqual(urgencyOrder[priorities[i - 1].urgency]);
      }
    });

    it('each priority has a treatment recommendation', () => {
      const priorities = rankTreatmentPriorities(['acne', 'scarring'], score, 30);
      for (const p of priorities) {
        expect(p.recommendedTreatment).toBeTruthy();
        expect(p.rationale).toBeTruthy();
      }
    });

    it('low texture score increases texture concern urgency', () => {
      const lowTexture = {
        overall: 50,
        dimensions: { ...score.dimensions, texture: 30 },
      };
      const priorities = rankTreatmentPriorities(['texture'], lowTexture, 40);
      expect(priorities[0].urgency).toBe('high');
    });
  });

  describe('generateSkincareRoutine', () => {
    it('always includes SPF in morning routine', () => {
      const routine = generateSkincareRoutine(2, ['wrinkles'], 35, 'basic');
      expect(routine.morning.some(s => s.type === 'Sun Protection')).toBe(true);
    });

    it('always includes cleanser in morning and evening', () => {
      const routine = generateSkincareRoutine(2, ['wrinkles'], 35, 'basic');
      expect(routine.morning.some(s => s.type === 'Cleanser')).toBe(true);
      expect(routine.evening.some(s => s.type.includes('Cleanse'))).toBe(true);
    });

    it('includes retinoid for age 25+', () => {
      const routine = generateSkincareRoutine(2, ['wrinkles'], 35, 'basic');
      expect(routine.evening.some(s => s.type === 'Retinoid')).toBe(true);
    });

    it('no retinoid for none skincare routine', () => {
      const routine = generateSkincareRoutine(2, ['wrinkles'], 35, 'none');
      expect(routine.evening.some(s => s.type === 'Retinoid')).toBe(false);
    });

    it('includes salicylic acid for acne', () => {
      const routine = generateSkincareRoutine(2, ['acne'], 25, 'moderate');
      expect(routine.evening.some(s => s.type === 'Exfoliant')).toBe(true);
    });

    it('includes brightening for pigmentation', () => {
      const routine = generateSkincareRoutine(3, ['pigmentation'], 40, 'moderate');
      expect(routine.evening.some(s => s.type === 'Pigment Corrector')).toBe(true);
    });

    it('includes eye cream for dark circles', () => {
      const routine = generateSkincareRoutine(2, ['dark_circles'], 35, 'moderate');
      expect(routine.evening.some(s => s.type === 'Eye Treatment')).toBe(true);
    });

    it('morning steps are ordered', () => {
      const routine = generateSkincareRoutine(2, ['wrinkles'], 40, 'advanced');
      for (let i = 1; i < routine.morning.length; i++) {
        expect(routine.morning[i].order).toBeGreaterThan(routine.morning[i - 1].order);
      }
    });

    it('includes weekly treatments', () => {
      const routine = generateSkincareRoutine(2, ['texture'], 35, 'moderate');
      expect(routine.weekly.length).toBeGreaterThan(0);
    });
  });

  describe('compareToBenchmarks', () => {
    it('returns age group', () => {
      const result = compareToBenchmarks(35, { overall: 70, dimensions: { hydration: 70, elasticity: 70, texture: 70, tone: 70, clarity: 70, firmness: 70, radiance: 70, protection: 70 } });
      expect(result.ageGroup).toContain('30-39');
    });

    it('higher score gives higher percentile', () => {
      const high = compareToBenchmarks(35, { overall: 85, dimensions: { hydration: 85, elasticity: 85, texture: 85, tone: 85, clarity: 85, firmness: 85, radiance: 85, protection: 85 } });
      const low = compareToBenchmarks(35, { overall: 45, dimensions: { hydration: 45, elasticity: 45, texture: 45, tone: 45, clarity: 45, firmness: 45, radiance: 45, protection: 45 } });
      expect(high.percentile).toBeGreaterThan(low.percentile);
    });

    it('percentile is between 1 and 99', () => {
      const result = compareToBenchmarks(50, { overall: 50, dimensions: { hydration: 50, elasticity: 50, texture: 50, tone: 50, clarity: 50, firmness: 50, radiance: 50, protection: 50 } });
      expect(result.percentile).toBeGreaterThanOrEqual(1);
      expect(result.percentile).toBeLessThanOrEqual(99);
    });
  });

  describe('calculateProgressDelta', () => {
    it('detects improvement', () => {
      const current = { overall: 75, dimensions: { hydration: 75, elasticity: 70, texture: 75, tone: 70, clarity: 75, firmness: 70, radiance: 75, protection: 80 } };
      const previous = { overall: 65, dimensions: { hydration: 65, elasticity: 65, texture: 60, tone: 65, clarity: 65, firmness: 65, radiance: 65, protection: 70 } };
      const delta = calculateProgressDelta(current, previous);
      expect(delta.overallChange).toBe(10);
      expect(delta.trend).toBe('improving');
    });

    it('detects decline', () => {
      const current = { overall: 50, dimensions: { hydration: 50, elasticity: 50, texture: 50, tone: 50, clarity: 50, firmness: 50, radiance: 50, protection: 50 } };
      const previous = { overall: 65, dimensions: { hydration: 65, elasticity: 65, texture: 65, tone: 65, clarity: 65, firmness: 65, radiance: 65, protection: 65 } };
      const delta = calculateProgressDelta(current, previous);
      expect(delta.overallChange).toBe(-15);
      expect(delta.trend).toBe('declining');
    });

    it('detects stability', () => {
      const current = { overall: 65, dimensions: { hydration: 65, elasticity: 65, texture: 65, tone: 65, clarity: 65, firmness: 65, radiance: 65, protection: 65 } };
      const previous = { overall: 64, dimensions: { hydration: 64, elasticity: 64, texture: 64, tone: 64, clarity: 64, firmness: 64, radiance: 64, protection: 64 } };
      const delta = calculateProgressDelta(current, previous);
      expect(delta.trend).toBe('stable');
    });
  });

  describe('performSkinAnalysis (integration)', () => {
    it('returns complete analysis', () => {
      const result = performSkinAnalysis(
        {
          age: 40, skinType: 3, concerns: ['wrinkles', 'pigmentation'],
          lifestyle: { sunExposure: 'moderate', smoking: false, skincare: 'moderate', waterIntake: 'adequate', sleepQuality: 'good', stressLevel: 'moderate', exerciseFrequency: 'regular' },
          currentSkincare: 'moderate', recentTreatments: [], selfRatedHydration: 3, selfRatedTexture: 3, selfRatedTone: 3, selfRatedFirmness: 3,
        },
        { eyeColor: 'hazel_brown', naturalHairColor: 'dark_blonde_light_brown', skinColorUnexposed: 'pale_with_beige', sunburnReaction: 'sometimes_burns_tans_uniformly', tanningAbility: 'sometimes' },
        { age: 40, wrinklesAtRest: false, wrinklesWithMovement: true, sunDamageVisible: false, keratoses: false, makeupUsage: 'minimal' },
      );
      expect(result.fitzpatrickType).toBe(3);
      expect(result.glogauScale).toBe(2);
      expect(result.skinHealthScore.overall).toBeGreaterThan(0);
      expect(result.treatmentPriority.length).toBe(2);
      expect(result.skincareRoutine.morning.length).toBeGreaterThan(0);
      expect(result.benchmarkComparison.ageGroup).toBeTruthy();
    });
  });
});
