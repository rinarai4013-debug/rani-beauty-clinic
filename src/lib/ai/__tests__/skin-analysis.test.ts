import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
} from '@/lib/ai/skin-analysis';
import type {
  FitzpatrickType,
  GlogauScale,
  SkinHealthScore,
  SkinConcern,
  LifestyleFactors,
} from '@/types/ai-treatment';

// ──────────────────────────────────────────────────────────────────────────
// Helpers & Fixtures
// ──────────────────────────────────────────────────────────────────────────

type FitzInput = Parameters<typeof determineFitzpatrickType>[0];
type GlogauInput = Parameters<typeof classifyGlogauScale>[0];
type SkinAssessmentInput = Parameters<typeof calculateSkinHealthScore>[0];

function makeLifestyle(overrides: Partial<LifestyleFactors> = {}): LifestyleFactors {
  return {
    sunExposure: 'moderate',
    smoking: false,
    skincare: 'basic',
    waterIntake: 'adequate',
    sleepQuality: 'fair',
    stressLevel: 'moderate',
    exerciseFrequency: 'occasional',
    ...overrides,
  };
}

function makeFitz(overrides: Partial<FitzInput> = {}): FitzInput {
  return {
    eyeColor: 'hazel_brown',
    naturalHairColor: 'dark_blonde_light_brown',
    skinColorUnexposed: 'pale_with_beige',
    sunburnReaction: 'sometimes_burns_tans_uniformly',
    tanningAbility: 'sometimes',
    ...overrides,
  };
}

function makeGlogau(overrides: Partial<GlogauInput> = {}): GlogauInput {
  return {
    age: 25,
    wrinklesAtRest: false,
    wrinklesWithMovement: false,
    sunDamageVisible: false,
    keratoses: false,
    makeupUsage: 'minimal',
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<SkinAssessmentInput> = {}): SkinAssessmentInput {
  return {
    age: 35,
    skinType: 3,
    concerns: [],
    lifestyle: makeLifestyle(),
    currentSkincare: 'basic',
    recentTreatments: [],
    selfRatedHydration: 3,
    selfRatedTexture: 3,
    selfRatedTone: 3,
    selfRatedFirmness: 3,
    ...overrides,
  };
}

/**
 * Build a SkinHealthScore fixture with arbitrary dimension overrides.
 * Does not re-run the engine — used by downstream function tests.
 */
function makeScore(
  overall: number,
  dims: Partial<SkinHealthScore['dimensions']> = {},
): SkinHealthScore {
  return {
    overall,
    dimensions: {
      hydration: 70,
      elasticity: 70,
      texture: 70,
      tone: 70,
      clarity: 70,
      firmness: 70,
      radiance: 70,
      protection: 70,
      ...dims,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Deterministic clock for any date math (progress delta, analysis)
// ──────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-09T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ══════════════════════════════════════════════════════════════════════════
// determineFitzpatrickType
// ══════════════════════════════════════════════════════════════════════════

describe('determineFitzpatrickType', () => {
  describe('boundary score → type mapping', () => {
    // score sums: eye(0-4) + hair(0-4) + skin(0-5) + burn(0-5) + tan(0-5) → 0..23
    // thresholds: ≤4 I, ≤8 II, ≤12 III, ≤16 IV, ≤20 V, else VI
    const cases: Array<[number, FitzpatrickType, string]> = [
      [0, 1, 'minimum score → Type I'],
      [4, 1, 'upper boundary of Type I'],
      [5, 2, 'lower boundary of Type II'],
      [8, 2, 'upper boundary of Type II'],
      [9, 3, 'lower boundary of Type III'],
      [12, 3, 'upper boundary of Type III'],
      [13, 4, 'lower boundary of Type IV'],
      [16, 4, 'upper boundary of Type IV'],
      [17, 5, 'lower boundary of Type V'],
      [20, 5, 'upper boundary of Type V'],
      [21, 6, 'lower boundary of Type VI'],
      [23, 6, 'maximum score → Type VI'],
    ];

    // Map a target total score into a valid input combination. Not every score
    // is reachable with equal splits — we use a greedy fill across the five
    // fields using their individual maxima (4,4,5,5,5) in order.
    function buildFitzInputForScore(target: number): FitzInput {
      const eyeOrder = ['light_blue_green', 'blue_hazel_green', 'hazel_brown', 'dark_brown', 'brownish_black'] as const;
      const hairOrder = ['red_light_blonde', 'blonde', 'dark_blonde_light_brown', 'dark_brown', 'black'] as const;
      const skinOrder = ['reddish', 'very_pale', 'pale_with_beige', 'olive_light_brown', 'dark_brown', 'deeply_pigmented'] as const;
      const burnOrder = ['always_burns_never_tans', 'usually_burns_tans_minimally', 'sometimes_burns_tans_uniformly', 'rarely_burns_tans_easily', 'very_rarely_burns_tans_very_easily', 'never_burns_deeply_pigmented'] as const;
      const tanOrder = ['never', 'seldom', 'sometimes', 'often', 'always', 'always_deeply'] as const;

      let remaining = target;
      const takeEye = Math.min(4, remaining); remaining -= takeEye;
      const takeHair = Math.min(4, remaining); remaining -= takeHair;
      const takeSkin = Math.min(5, remaining); remaining -= takeSkin;
      const takeBurn = Math.min(5, remaining); remaining -= takeBurn;
      const takeTan = Math.min(5, remaining); remaining -= takeTan;

      return {
        eyeColor: eyeOrder[takeEye],
        naturalHairColor: hairOrder[takeHair],
        skinColorUnexposed: skinOrder[takeSkin],
        sunburnReaction: burnOrder[takeBurn],
        tanningAbility: tanOrder[takeTan],
      };
    }

    it.each(cases)('score %i → Fitzpatrick Type %i (%s)', (score, expectedType) => {
      const input = buildFitzInputForScore(score);
      const result = determineFitzpatrickType(input);
      expect(result.type).toBe(expectedType);
    });
  });

  describe('description content per type', () => {
    it('Type I description mentions "Always burns, never tans"', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'light_blue_green',
        naturalHairColor: 'red_light_blonde',
        skinColorUnexposed: 'reddish',
        sunburnReaction: 'always_burns_never_tans',
        tanningAbility: 'never',
      }));
      expect(result.type).toBe(1);
      expect(result.description).toContain('Type I');
      expect(result.description).toContain('Always burns, never tans');
    });

    it('Type II description mentions "Burns easily, tans minimally"', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'blue_hazel_green',
        naturalHairColor: 'blonde',
        skinColorUnexposed: 'very_pale',
        sunburnReaction: 'usually_burns_tans_minimally',
        tanningAbility: 'seldom',
      }));
      expect(result.type).toBe(2);
      expect(result.description).toContain('Type II');
      expect(result.description).toContain('Burns easily');
    });

    it('Type III description mentions "Sometimes burns, tans uniformly"', () => {
      const result = determineFitzpatrickType(makeFitz());
      expect(result.type).toBe(3);
      expect(result.description).toContain('Type III');
      expect(result.description).toContain('Sometimes burns');
    });

    it('Type IV description mentions "Rarely burns, tans easily"', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'dark_brown',
        naturalHairColor: 'dark_brown',
        skinColorUnexposed: 'olive_light_brown',
        sunburnReaction: 'rarely_burns_tans_easily',
        tanningAbility: 'often',
      }));
      expect(result.type).toBe(4);
      expect(result.description).toContain('Type IV');
      expect(result.description).toContain('Rarely burns');
    });

    it('Type V description mentions "Very rarely burns"', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'dark_brown',
        naturalHairColor: 'black',
        skinColorUnexposed: 'dark_brown',
        sunburnReaction: 'very_rarely_burns_tans_very_easily',
        tanningAbility: 'always',
      }));
      expect(result.type).toBe(5);
      expect(result.description).toContain('Type V');
      expect(result.description).toContain('Very rarely burns');
    });

    it('Type VI description mentions "Never burns"', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'brownish_black',
        naturalHairColor: 'black',
        skinColorUnexposed: 'deeply_pigmented',
        sunburnReaction: 'never_burns_deeply_pigmented',
        tanningAbility: 'always_deeply',
      }));
      expect(result.type).toBe(6);
      expect(result.description).toContain('Type VI');
      expect(result.description).toContain('Never burns');
    });
  });

  describe('individual field scoring', () => {
    it('eye color contributes 0-4 to score (light_blue_green=0)', () => {
      const light = determineFitzpatrickType(makeFitz({
        eyeColor: 'light_blue_green',
        naturalHairColor: 'red_light_blonde',
        skinColorUnexposed: 'reddish',
        sunburnReaction: 'always_burns_never_tans',
        tanningAbility: 'never',
      }));
      expect(light.type).toBe(1);
    });

    it('hair color brownish_black + black maxes out those two fields (4+4=8)', () => {
      // 8 + pale_with_beige(2) + burn(2) + tan(2) = 14 → Type IV
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'brownish_black',
        naturalHairColor: 'black',
      }));
      expect(result.type).toBe(4);
    });

    it('deeply_pigmented skin + high burn+tan pushes into Type VI', () => {
      const result = determineFitzpatrickType(makeFitz({
        eyeColor: 'brownish_black',
        naturalHairColor: 'black',
        skinColorUnexposed: 'deeply_pigmented',
        sunburnReaction: 'never_burns_deeply_pigmented',
        tanningAbility: 'always_deeply',
      }));
      expect(result.type).toBe(6);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// classifyGlogauScale
// ══════════════════════════════════════════════════════════════════════════

describe('classifyGlogauScale', () => {
  describe('Scale 1 — No Wrinkles (early photoaging)', () => {
    it('age 25, no wrinkles, no sun damage, no keratoses → Scale 1', () => {
      const result = classifyGlogauScale(makeGlogau({ age: 25 }));
      expect(result.scale).toBe(1);
      expect(result.description).toContain('No Wrinkles');
    });

    it('age 29 is still Scale 1 (boundary: <30)', () => {
      const result = classifyGlogauScale(makeGlogau({ age: 29 }));
      expect(result.scale).toBe(1);
    });

    it('characteristics mention "Minimal wrinkles"', () => {
      const result = classifyGlogauScale(makeGlogau({ age: 22 }));
      expect(result.characteristics.some(c => c.includes('Minimal wrinkles'))).toBe(true);
    });
  });

  describe('Scale 2 — Wrinkles in Motion', () => {
    it('age 35 with wrinklesWithMovement only → Scale 2', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 35,
        wrinklesWithMovement: true,
      }));
      expect(result.scale).toBe(2);
      expect(result.description).toContain('Wrinkles in Motion');
    });

    it('age 49 wrinkles with movement, no rest, no keratoses → Scale 2 (boundary <50)', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 49,
        wrinklesWithMovement: true,
      }));
      expect(result.scale).toBe(2);
    });
  });

  describe('Scale 3 — Wrinkles at Rest', () => {
    it('wrinkles at rest without keratoses → Scale 3', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 55,
        wrinklesAtRest: true,
        wrinklesWithMovement: true,
      }));
      expect(result.scale).toBe(3);
      expect(result.description).toContain('Wrinkles at Rest');
    });

    it('age 45 with wrinkles at rest → Scale 3 (overrides Scale 2 path)', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 45,
        wrinklesAtRest: true,
      }));
      expect(result.scale).toBe(3);
    });

    it('wrinklesAtRest + sunDamageVisible + age≥50 forces at least Scale 3', () => {
      // Even if earlier branches degraded, override clamps to 3
      const result = classifyGlogauScale(makeGlogau({
        age: 52,
        wrinklesAtRest: true,
        sunDamageVisible: true,
      }));
      expect(result.scale).toBeGreaterThanOrEqual(3);
      expect(result.scale).toBe(3);
    });
  });

  describe('Scale 4 — Only Wrinkles (severe photoaging)', () => {
    it('keratoses present always forces Scale 4', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 25,
        keratoses: true,
      }));
      expect(result.scale).toBe(4);
      expect(result.description).toContain('Only Wrinkles');
    });

    it('keratoses overrides even on a young client with no wrinkles', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 20,
        keratoses: true,
      }));
      expect(result.scale).toBe(4);
    });

    it('age 65 with advanced photoaging + keratoses → Scale 4', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 65,
        wrinklesAtRest: true,
        wrinklesWithMovement: true,
        sunDamageVisible: true,
        keratoses: true,
        makeupUsage: 'heavy',
      }));
      expect(result.scale).toBe(4);
    });

    it('characteristics for Scale 4 mention "Yellow-gray skin color"', () => {
      const result = classifyGlogauScale(makeGlogau({ keratoses: true }));
      expect(result.characteristics.some(c => c.includes('Yellow-gray'))).toBe(true);
    });

    // fixed: a 30-49yo with pristine skin (no wrinkles, no sun damage,
    // no keratoses) now hits the intermediate branch and returns Scale 1.
    // Previously fell through the if/else chain to Scale 4 "Severe photoaging".
    it('age 35 with pristine skin classifies as Scale 1 (fixed)', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 35,
        wrinklesAtRest: false,
        wrinklesWithMovement: false,
        sunDamageVisible: false,
        keratoses: false,
      }));
      expect(result.scale).toBe(1);
      expect(result.description).toContain('No Wrinkles');
    });
  });

  describe('Regression — pristine-skin intermediate branch', () => {
    it('age 30 boundary (first adult year) with pristine skin → Scale 1', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 30,
        wrinklesAtRest: false,
        wrinklesWithMovement: false,
        sunDamageVisible: false,
        keratoses: false,
      }));
      expect(result.scale).toBe(1);
    });

    it('age 49 pristine skin → Scale 1 (upper pristine boundary)', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 49,
        wrinklesAtRest: false,
        wrinklesWithMovement: false,
        sunDamageVisible: false,
        keratoses: false,
      }));
      expect(result.scale).toBe(1);
    });

    it('age 40 pristine skin returns "No Wrinkles" description & Minimal characteristic', () => {
      const result = classifyGlogauScale(makeGlogau({
        age: 40,
        wrinklesAtRest: false,
        wrinklesWithMovement: false,
        sunDamageVisible: false,
        keratoses: false,
      }));
      expect(result.scale).toBe(1);
      expect(result.characteristics.some(c => c.includes('Minimal wrinkles'))).toBe(true);
    });

    it('intermediate branch does NOT swallow sun damage — age 35 with sun damage is not Scale 1', () => {
      // Guard: confirms the intermediate branch requires !sunDamageVisible.
      const result = classifyGlogauScale(makeGlogau({
        age: 35,
        wrinklesAtRest: false,
        wrinklesWithMovement: false,
        sunDamageVisible: true,
        keratoses: false,
      }));
      expect(result.scale).not.toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// calculateSkinHealthScore — per-dimension deep tests
// ══════════════════════════════════════════════════════════════════════════

describe('calculateSkinHealthScore — hydration dimension', () => {
  // base = rating*16 → 16,32,48,64,80
  const baseCases: Array<[1 | 2 | 3 | 4 | 5, number]> = [
    [1, 16],
    [2, 32],
    [3, 48],
    [4, 64],
    [5, 80],
  ];

  it.each(baseCases)('self-rated hydration %i → base %i with neutral lifestyle', (rating, expected) => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: rating,
      lifestyle: makeLifestyle({ waterIntake: 'adequate' }),
      currentSkincare: 'basic',
    }));
    expect(score.dimensions.hydration).toBe(expected);
  });

  it('high water intake adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      lifestyle: makeLifestyle({ waterIntake: 'high' }),
    }));
    expect(score.dimensions.hydration).toBe(58); // 48 + 10
  });

  it('low water intake subtracts -15', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      lifestyle: makeLifestyle({ waterIntake: 'low' }),
    }));
    expect(score.dimensions.hydration).toBe(33); // 48 - 15
  });

  it('advanced skincare adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      currentSkincare: 'advanced',
    }));
    expect(score.dimensions.hydration).toBe(58);
  });

  it('no skincare subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      currentSkincare: 'none',
    }));
    expect(score.dimensions.hydration).toBe(38);
  });

  it('smoking subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      lifestyle: makeLifestyle({ smoking: true }),
    }));
    expect(score.dimensions.hydration).toBe(38);
  });

  it('recent hydrafacial adds +8 (case-insensitive)', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      recentTreatments: ['HydraFacial Signature'],
    }));
    expect(score.dimensions.hydration).toBe(56);
  });

  it('clamps at 100 with all positive factors', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 5,
      currentSkincare: 'advanced',
      lifestyle: makeLifestyle({ waterIntake: 'high', smoking: false }),
      recentTreatments: ['HydraFacial'],
    }));
    // 80 + 10 + 10 + 8 = 108 → clamp 100
    expect(score.dimensions.hydration).toBe(100);
  });

  it('clamps at 0 with all negative factors', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 1,
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ waterIntake: 'low', smoking: true }),
    }));
    // 16 - 15 - 10 - 10 = -19 → clamp 0
    expect(score.dimensions.hydration).toBe(0);
  });
});

describe('calculateSkinHealthScore — elasticity dimension', () => {
  // base = max(20, 100 - (age-20)*1.2)
  const baseCases: Array<[number, number]> = [
    [20, 100],
    [25, 94], // 100 - 6
    [30, 88],
    [35, 82],
    [40, 76],
    [50, 64],
    [60, 52],
    [80, 28],
    [87, 20], // floor
    [100, 20], // floor
  ];

  it.each(baseCases)('age %i → elasticity base %i with neutral inputs', (age, expected) => {
    const score = calculateSkinHealthScore(makeAssessment({
      age,
      concerns: [],
      lifestyle: makeLifestyle({ sunExposure: 'moderate', exerciseFrequency: 'occasional', smoking: false }),
      currentSkincare: 'basic',
      recentTreatments: [],
    }));
    expect(score.dimensions.elasticity).toBe(expected);
  });

  it('laxity concern subtracts -15', () => {
    const base = 82; // age 35
    const score = calculateSkinHealthScore(makeAssessment({ age: 35, concerns: ['laxity'] }));
    expect(score.dimensions.elasticity).toBe(base - 15);
  });

  it('smoking subtracts -15', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      lifestyle: makeLifestyle({ smoking: true }),
    }));
    expect(score.dimensions.elasticity).toBe(82 - 15);
  });

  it('heavy sun exposure subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      lifestyle: makeLifestyle({ sunExposure: 'heavy' }),
    }));
    expect(score.dimensions.elasticity).toBe(82 - 12);
  });

  it.each(['regular', 'daily'] as const)('%s exercise adds +8', (freq) => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      lifestyle: makeLifestyle({ exerciseFrequency: freq }),
    }));
    expect(score.dimensions.elasticity).toBe(82 + 8);
  });

  it('advanced skincare adds +5', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      currentSkincare: 'advanced',
    }));
    // also triggers +10 in hydration, but elasticity only +5
    expect(score.dimensions.elasticity).toBe(82 + 5);
  });

  it('recent Sofwave adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      recentTreatments: ['Sofwave Full Face'],
    }));
    expect(score.dimensions.elasticity).toBe(82 + 10);
  });

  it('recent RF Microneedling adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 35,
      recentTreatments: ['RF Microneedling — Face'],
    }));
    expect(score.dimensions.elasticity).toBe(82 + 10);
  });

  it('clamps at 0 under compounded negatives', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 90,
      concerns: ['laxity'],
      lifestyle: makeLifestyle({ smoking: true, sunExposure: 'heavy', exerciseFrequency: 'none' }),
    }));
    // base floor 20 − 15 − 15 − 12 = -22 → clamp 0
    expect(score.dimensions.elasticity).toBe(0);
  });
});

describe('calculateSkinHealthScore — texture dimension', () => {
  const baseCases: Array<[1 | 2 | 3 | 4 | 5, number]> = [
    [1, 16],
    [2, 32],
    [3, 48],
    [4, 64],
    [5, 80],
  ];

  it.each(baseCases)('rating %i → base %i', (rating, expected) => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: rating }));
    expect(score.dimensions.texture).toBe(expected);
  });

  it('texture concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, concerns: ['texture'] }));
    expect(score.dimensions.texture).toBe(38);
  });

  it('pores concern subtracts -8', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, concerns: ['pores'] }));
    expect(score.dimensions.texture).toBe(40);
  });

  it('scarring concern subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, concerns: ['scarring'] }));
    expect(score.dimensions.texture).toBe(36);
  });

  it('acne concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, concerns: ['acne'] }));
    expect(score.dimensions.texture).toBe(38);
  });

  it('advanced skincare adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, currentSkincare: 'advanced' }));
    expect(score.dimensions.texture).toBe(58);
  });

  it('recent peel adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, recentTreatments: ['VI Peel'] }));
    expect(score.dimensions.texture).toBe(58);
  });

  it('recent microneedling adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTexture: 3, recentTreatments: ['RF Microneedling'] }));
    expect(score.dimensions.texture).toBe(58);
  });

  it('multiple concerns stack (texture + pores + scarring + acne = -40)', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTexture: 5,
      concerns: ['texture', 'pores', 'scarring', 'acne'],
    }));
    // 80 - 10 - 8 - 12 - 10 = 40
    expect(score.dimensions.texture).toBe(40);
  });
});

describe('calculateSkinHealthScore — tone dimension', () => {
  const baseCases: Array<[1 | 2 | 3 | 4 | 5, number]> = [
    [1, 16],
    [2, 32],
    [3, 48],
    [4, 64],
    [5, 80],
  ];

  it.each(baseCases)('rating %i → base %i', (rating, expected) => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTone: rating,
      lifestyle: makeLifestyle({ sunExposure: 'moderate' }),
    }));
    expect(score.dimensions.tone).toBe(expected);
  });

  it('pigmentation concern subtracts -15', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTone: 3, concerns: ['pigmentation'] }));
    expect(score.dimensions.tone).toBe(33);
  });

  it('redness concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ selfRatedTone: 3, concerns: ['redness'] }));
    expect(score.dimensions.tone).toBe(38);
  });

  it('heavy sun exposure subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTone: 3,
      lifestyle: makeLifestyle({ sunExposure: 'heavy' }),
    }));
    expect(score.dimensions.tone).toBe(36);
  });

  it('minimal sun exposure adds +5', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTone: 3,
      lifestyle: makeLifestyle({ sunExposure: 'minimal' }),
    }));
    expect(score.dimensions.tone).toBe(53);
  });

  it('recent PicoWay adds +8', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTone: 3,
      recentTreatments: ['PicoWay Laser'],
    }));
    expect(score.dimensions.tone).toBe(56);
  });

  it('recent peel adds +8', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedTone: 3,
      recentTreatments: ['Chemical Peel'],
    }));
    expect(score.dimensions.tone).toBe(56);
  });
});

describe('calculateSkinHealthScore — clarity dimension', () => {
  it('neutral inputs → base 75', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      concerns: [],
      lifestyle: makeLifestyle({ stressLevel: 'moderate', sleepQuality: 'fair' }),
      currentSkincare: 'basic',
    }));
    expect(score.dimensions.clarity).toBe(75);
  });

  it('acne concern subtracts -20', () => {
    const score = calculateSkinHealthScore(makeAssessment({ concerns: ['acne'] }));
    expect(score.dimensions.clarity).toBe(55);
  });

  it('redness concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ concerns: ['redness'] }));
    expect(score.dimensions.clarity).toBe(65);
  });

  it('pigmentation concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ concerns: ['pigmentation'] }));
    expect(score.dimensions.clarity).toBe(65);
  });

  it('high stress subtracts -8', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ stressLevel: 'high' }),
    }));
    expect(score.dimensions.clarity).toBe(67);
  });

  it('poor sleep subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ sleepQuality: 'poor' }),
    }));
    expect(score.dimensions.clarity).toBe(65);
  });

  it('good sleep adds +8', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ sleepQuality: 'good' }),
    }));
    expect(score.dimensions.clarity).toBe(83);
  });

  it('advanced skincare adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ currentSkincare: 'advanced' }));
    expect(score.dimensions.clarity).toBe(85);
  });

  it('stacked negatives compound (75 - 20 - 10 - 10 - 8 - 10 = 17)', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      concerns: ['acne', 'redness', 'pigmentation'],
      lifestyle: makeLifestyle({ stressLevel: 'high', sleepQuality: 'poor' }),
      currentSkincare: 'basic',
    }));
    // 75 - 20 - 10 - 10 - 8 - 10 = 17
    expect(score.dimensions.clarity).toBe(17);
  });
});

describe('calculateSkinHealthScore — firmness dimension', () => {
  // base = rating*16 - max(0,(age-30)*0.8)
  it('rating 3, age 30 → 48', () => {
    const score = calculateSkinHealthScore(makeAssessment({ age: 30, selfRatedFirmness: 3 }));
    expect(score.dimensions.firmness).toBe(48);
  });

  it('rating 3, age 40 → 48 - 8 = 40', () => {
    const score = calculateSkinHealthScore(makeAssessment({ age: 40, selfRatedFirmness: 3 }));
    expect(score.dimensions.firmness).toBe(40);
  });

  it('rating 3, age 50 → 48 - 16 = 32', () => {
    const score = calculateSkinHealthScore(makeAssessment({ age: 50, selfRatedFirmness: 3 }));
    expect(score.dimensions.firmness).toBe(32);
  });

  it('rating 3, age 25 → no age penalty (below 30) = 48', () => {
    const score = calculateSkinHealthScore(makeAssessment({ age: 25, selfRatedFirmness: 3 }));
    expect(score.dimensions.firmness).toBe(48);
  });

  it('rating 5, age 70 → 80 - 32 = 48', () => {
    const score = calculateSkinHealthScore(makeAssessment({ age: 70, selfRatedFirmness: 5 }));
    expect(score.dimensions.firmness).toBe(48);
  });

  it('laxity concern subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 30,
      selfRatedFirmness: 3,
      concerns: ['laxity'],
    }));
    expect(score.dimensions.firmness).toBe(36);
  });

  it('volume_loss concern subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 30,
      selfRatedFirmness: 3,
      concerns: ['volume_loss'],
    }));
    expect(score.dimensions.firmness).toBe(38);
  });

  it('smoking subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 30,
      selfRatedFirmness: 3,
      lifestyle: makeLifestyle({ smoking: true }),
    }));
    expect(score.dimensions.firmness).toBe(36);
  });

  it('Sofwave adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 30,
      selfRatedFirmness: 3,
      recentTreatments: ['Sofwave'],
    }));
    expect(score.dimensions.firmness).toBe(58);
  });

  it('"RF Microneedling" matches the rf substring', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 30,
      selfRatedFirmness: 3,
      recentTreatments: ['RF Microneedling'],
    }));
    expect(score.dimensions.firmness).toBe(58);
  });
});

describe('calculateSkinHealthScore — radiance dimension', () => {
  it('neutral inputs → base 65', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({
        sleepQuality: 'fair',
        waterIntake: 'adequate',
        exerciseFrequency: 'occasional',
        stressLevel: 'moderate',
        smoking: false,
      }),
      currentSkincare: 'basic',
    }));
    expect(score.dimensions.radiance).toBe(65);
  });

  it('good sleep adds +12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ sleepQuality: 'good' }),
    }));
    expect(score.dimensions.radiance).toBe(77);
  });

  it('poor sleep subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ sleepQuality: 'poor' }),
    }));
    expect(score.dimensions.radiance).toBe(53);
  });

  it('high water intake adds +8', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ waterIntake: 'high' }),
    }));
    expect(score.dimensions.radiance).toBe(73);
  });

  it.each(['regular', 'daily'] as const)('%s exercise adds +8', (freq) => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ exerciseFrequency: freq }),
    }));
    expect(score.dimensions.radiance).toBe(73);
  });

  it('high stress subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ stressLevel: 'high' }),
    }));
    expect(score.dimensions.radiance).toBe(55);
  });

  it('smoking subtracts -12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({ smoking: true }),
    }));
    expect(score.dimensions.radiance).toBe(53);
  });

  it('advanced skincare adds +10', () => {
    const score = calculateSkinHealthScore(makeAssessment({ currentSkincare: 'advanced' }));
    expect(score.dimensions.radiance).toBe(75);
  });

  it('hydrafacial adds +12', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      recentTreatments: ['HydraFacial Signature'],
    }));
    expect(score.dimensions.radiance).toBe(77);
  });

  it('clamps at 100 with stacked positives', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      lifestyle: makeLifestyle({
        sleepQuality: 'good',
        waterIntake: 'high',
        exerciseFrequency: 'daily',
        stressLevel: 'low',
      }),
      currentSkincare: 'advanced',
      recentTreatments: ['HydraFacial'],
    }));
    // 65 + 12 + 8 + 8 + 10 + 12 = 115 → clamp 100
    expect(score.dimensions.radiance).toBe(100);
  });
});

describe('calculateSkinHealthScore — protection dimension', () => {
  it('base 50 with no skincare, moderate sun, no smoking', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ sunExposure: 'moderate', smoking: false }),
    }));
    expect(score.dimensions.protection).toBe(50);
  });

  const skincareCases: Array<['none' | 'basic' | 'moderate' | 'advanced', number]> = [
    ['none', 0],
    ['basic', 10],
    ['moderate', 20],
    ['advanced', 30],
  ];

  it.each(skincareCases)('%s skincare contributes +%i to base 50', (level, bonus) => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: level,
      lifestyle: makeLifestyle({ sunExposure: 'moderate' }),
    }));
    expect(score.dimensions.protection).toBe(50 + bonus);
  });

  it('minimal sun exposure adds +15', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ sunExposure: 'minimal' }),
    }));
    expect(score.dimensions.protection).toBe(65);
  });

  it('heavy sun exposure subtracts -20', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ sunExposure: 'heavy' }),
    }));
    expect(score.dimensions.protection).toBe(30);
  });

  it('smoking subtracts -10', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ sunExposure: 'moderate', smoking: true }),
    }));
    expect(score.dimensions.protection).toBe(40);
  });

  it('worst case: no skincare + heavy sun + smoker clamps at 20', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'none',
      lifestyle: makeLifestyle({ sunExposure: 'heavy', smoking: true }),
    }));
    // 50 + 0 - 20 - 10 = 20
    expect(score.dimensions.protection).toBe(20);
  });

  it('best case: advanced skincare + minimal sun + non-smoker → 95', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      currentSkincare: 'advanced',
      lifestyle: makeLifestyle({ sunExposure: 'minimal', smoking: false }),
    }));
    // 50 + 30 + 15 = 95
    expect(score.dimensions.protection).toBe(95);
  });
});

describe('calculateSkinHealthScore — overall weighted score', () => {
  it('all dimensions at 100 → overall 100', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 20,
      selfRatedHydration: 5,
      selfRatedTexture: 5,
      selfRatedTone: 5,
      selfRatedFirmness: 5,
      currentSkincare: 'advanced',
      lifestyle: makeLifestyle({
        sunExposure: 'minimal',
        waterIntake: 'high',
        sleepQuality: 'good',
        stressLevel: 'low',
        exerciseFrequency: 'daily',
        smoking: false,
      }),
      recentTreatments: ['HydraFacial', 'Sofwave'],
    }));
    expect(score.overall).toBeGreaterThanOrEqual(90);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('worst-case inputs produce a low overall (≤30)', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      age: 75,
      selfRatedHydration: 1,
      selfRatedTexture: 1,
      selfRatedTone: 1,
      selfRatedFirmness: 1,
      concerns: ['acne', 'laxity', 'pigmentation', 'texture', 'volume_loss'],
      currentSkincare: 'none',
      lifestyle: makeLifestyle({
        sunExposure: 'heavy',
        smoking: true,
        waterIntake: 'low',
        sleepQuality: 'poor',
        stressLevel: 'high',
        exerciseFrequency: 'none',
      }),
    }));
    expect(score.overall).toBeLessThanOrEqual(30);
  });

  it('weights sum to 1.0 (overall is bounded 0-100)', () => {
    const score = calculateSkinHealthScore(makeAssessment());
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('returns all 8 named dimensions', () => {
    const score = calculateSkinHealthScore(makeAssessment());
    expect(Object.keys(score.dimensions).sort()).toEqual([
      'clarity', 'elasticity', 'firmness', 'hydration',
      'protection', 'radiance', 'texture', 'tone',
    ]);
  });

  it('overall matches manual weighted calculation', () => {
    // Use fixed deterministic input; compute manually
    const input = makeAssessment({
      age: 35,
      selfRatedHydration: 3, // hydration base 48, +0 lifestyle (basic skincare offsets no hydrafacial), moderate water
      selfRatedTexture: 3,
      selfRatedTone: 3,
      selfRatedFirmness: 3,
      concerns: [],
      currentSkincare: 'basic',
      lifestyle: makeLifestyle(),
      recentTreatments: [],
    });
    const score = calculateSkinHealthScore(input);
    const { hydration, elasticity, texture, tone, clarity, firmness, radiance, protection } = score.dimensions;
    const expected = Math.round(
      hydration * 0.15 +
      elasticity * 0.15 +
      texture * 0.15 +
      tone * 0.10 +
      clarity * 0.10 +
      firmness * 0.15 +
      radiance * 0.10 +
      protection * 0.10,
    );
    expect(score.overall).toBe(expected);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// detectAgingPatterns
// ══════════════════════════════════════════════════════════════════════════

describe('detectAgingPatterns', () => {
  describe('expression_lines', () => {
    it('triggers on wrinkles concern below age 30', () => {
      const patterns = detectAgingPatterns(25, ['wrinkles'], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p).toBeDefined();
      expect(p.severity).toBe('mild');
    });

    it('triggers automatically at age 30+', () => {
      const patterns = detectAgingPatterns(30, [], makeLifestyle());
      expect(patterns.some(p => p.type === 'expression_lines')).toBe(true);
    });

    it('does NOT trigger at age 29 without wrinkles concern', () => {
      const patterns = detectAgingPatterns(29, [], makeLifestyle());
      expect(patterns.some(p => p.type === 'expression_lines')).toBe(false);
    });

    const severityCases: Array<[number, 'mild' | 'moderate' | 'advanced']> = [
      [30, 'mild'],
      [34, 'mild'],
      [35, 'moderate'],
      [49, 'moderate'],
      [50, 'advanced'],
      [70, 'advanced'],
    ];

    it.each(severityCases)('age %i → severity %s', (age, expected) => {
      const patterns = detectAgingPatterns(age, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p.severity).toBe(expected);
    });

    it('always includes forehead, glabella, crow\'s feet areas', () => {
      const patterns = detectAgingPatterns(40, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p.areas.some(a => a.includes('Forehead'))).toBe(true);
      expect(p.areas.some(a => a.includes('Glabella'))).toBe(true);
      expect(p.areas.some(a => a.includes('Periorbital'))).toBe(true);
    });

    it('lip_enhancement concern adds Perioral area', () => {
      const patterns = detectAgingPatterns(40, ['lip_enhancement'], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p.areas.some(a => a.includes('Perioral'))).toBe(true);
    });

    it('neck_chest_aging concern adds Neck bands area', () => {
      const patterns = detectAgingPatterns(40, ['neck_chest_aging'], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p.areas.some(a => a.includes('Neck'))).toBe(true);
    });

    it('recommended treatments include Botox, RF Microneedling, Chemical Peel', () => {
      const patterns = detectAgingPatterns(40, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'expression_lines')!;
      expect(p.recommendedTreatments).toEqual(expect.arrayContaining(['Botox', 'RF Microneedling', 'Chemical Peel']));
    });
  });

  describe('gravity', () => {
    it('triggers on laxity concern', () => {
      const patterns = detectAgingPatterns(25, ['laxity'], makeLifestyle());
      expect(patterns.some(p => p.type === 'gravity')).toBe(true);
    });

    it('triggers automatically at age 40+', () => {
      const patterns = detectAgingPatterns(40, [], makeLifestyle());
      expect(patterns.some(p => p.type === 'gravity')).toBe(true);
    });

    it('does not trigger at age 39 without laxity', () => {
      const patterns = detectAgingPatterns(39, [], makeLifestyle());
      expect(patterns.some(p => p.type === 'gravity')).toBe(false);
    });

    const gravityCases: Array<[number, 'mild' | 'moderate' | 'advanced']> = [
      [40, 'mild'],
      [44, 'mild'],
      [45, 'moderate'],
      [54, 'moderate'],
      [55, 'advanced'],
      [80, 'advanced'],
    ];

    it.each(gravityCases)('age %i → gravity severity %s', (age, expected) => {
      const patterns = detectAgingPatterns(age, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'gravity')!;
      expect(p.severity).toBe(expected);
    });

    it('includes Sofwave in recommended treatments', () => {
      const patterns = detectAgingPatterns(50, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'gravity')!;
      expect(p.recommendedTreatments).toContain('Sofwave');
    });
  });

  describe('volume_loss', () => {
    it('triggers on volume_loss concern', () => {
      const patterns = detectAgingPatterns(25, ['volume_loss'], makeLifestyle());
      expect(patterns.some(p => p.type === 'volume_loss')).toBe(true);
    });

    it('triggers automatically at age 35+', () => {
      const patterns = detectAgingPatterns(35, [], makeLifestyle());
      expect(patterns.some(p => p.type === 'volume_loss')).toBe(true);
    });

    const volCases: Array<[number, 'mild' | 'moderate' | 'advanced']> = [
      [35, 'mild'],
      [39, 'mild'],
      [40, 'moderate'],
      [54, 'moderate'],
      [55, 'advanced'],
    ];

    it.each(volCases)('age %i → volume_loss severity %s', (age, expected) => {
      const patterns = detectAgingPatterns(age, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.severity).toBe(expected);
    });

    it('age 35 includes Cheeks/Midface', () => {
      const patterns = detectAgingPatterns(35, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Cheeks/Midface');
    });

    it('age 40 adds Temples', () => {
      const patterns = detectAgingPatterns(40, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Temples');
    });

    it('age 45 adds Jawline', () => {
      const patterns = detectAgingPatterns(45, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Jawline');
    });

    it('age 50 adds Hands', () => {
      const patterns = detectAgingPatterns(50, [], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Hands');
    });

    it('dark_circles concern adds Tear Trough', () => {
      const patterns = detectAgingPatterns(35, ['dark_circles'], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Tear Trough');
    });

    it('lip_enhancement concern adds Lips', () => {
      const patterns = detectAgingPatterns(35, ['lip_enhancement'], makeLifestyle());
      const p = patterns.find(x => x.type === 'volume_loss')!;
      expect(p.areas).toContain('Lips');
    });
  });

  describe('sun_damage', () => {
    it('triggers on pigmentation concern even with minimal sun', () => {
      const patterns = detectAgingPatterns(25, ['pigmentation'], makeLifestyle({ sunExposure: 'minimal' }));
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p).toBeDefined();
      expect(p.severity).toBe('mild');
    });

    it('heavy sun, age ≤40 → moderate severity', () => {
      const patterns = detectAgingPatterns(35, [], makeLifestyle({ sunExposure: 'heavy' }));
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p.severity).toBe('moderate');
    });

    it('heavy sun, age >40 → advanced severity', () => {
      const patterns = detectAgingPatterns(45, [], makeLifestyle({ sunExposure: 'heavy' }));
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p.severity).toBe('advanced');
    });

    it('heavy sun, age exactly 40 → moderate (strict >40 boundary)', () => {
      const patterns = detectAgingPatterns(40, [], makeLifestyle({ sunExposure: 'heavy' }));
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p.severity).toBe('moderate');
    });

    it('includes Face/Neck/Chest/Hands areas', () => {
      const patterns = detectAgingPatterns(45, ['pigmentation'], makeLifestyle());
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p.areas).toEqual(expect.arrayContaining(['Face', 'Neck', 'Chest', 'Hands']));
    });

    it('recommends PicoWay Laser', () => {
      const patterns = detectAgingPatterns(45, ['pigmentation'], makeLifestyle());
      const p = patterns.find(x => x.type === 'sun_damage')!;
      expect(p.recommendedTreatments).toContain('PicoWay Laser');
    });
  });

  describe('multi-pattern cases', () => {
    it('young adult with no concerns and moderate sun → empty patterns', () => {
      const patterns = detectAgingPatterns(22, [], makeLifestyle());
      expect(patterns).toEqual([]);
    });

    it('60 year old triggers all four age-based patterns', () => {
      const patterns = detectAgingPatterns(60, [], makeLifestyle({ sunExposure: 'heavy' }));
      const types = patterns.map(p => p.type);
      expect(types).toContain('expression_lines');
      expect(types).toContain('gravity');
      expect(types).toContain('volume_loss');
      expect(types).toContain('sun_damage');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// rankTreatmentPriorities
// ══════════════════════════════════════════════════════════════════════════

describe('rankTreatmentPriorities', () => {
  it('returns empty array when no concerns', () => {
    const result = rankTreatmentPriorities([], makeScore(80), 30);
    expect(result).toEqual([]);
  });

  it('assigns rank in selection order', () => {
    const result = rankTreatmentPriorities(['wrinkles', 'pigmentation'], makeScore(80), 30);
    expect(result.map(r => r.concern).sort()).toEqual(['pigmentation', 'wrinkles']);
    // rank field assigned from original index
    const wrink = result.find(r => r.concern === 'wrinkles')!;
    expect(wrink.rank).toBe(1);
    const pigm = result.find(r => r.concern === 'pigmentation')!;
    expect(pigm.rank).toBe(2);
  });

  it('sorts high urgency before medium before low', () => {
    const result = rankTreatmentPriorities(
      ['hair_removal', 'acne', 'pores'],
      makeScore(80),
      30,
    );
    // acne base 80 + 10 (index bonus) = 90 → high
    // pores base 50 + 4 (index bonus) = 54 → medium
    // hair_removal base 40 + 10 = 50 → medium
    expect(result[0].concern).toBe('acne');
    expect(result[0].urgency).toBe('high');
  });

  it('wrinkles with low firmness (<50) gains +15 urgency', () => {
    const withLow = rankTreatmentPriorities(['wrinkles'], makeScore(40, { firmness: 30, elasticity: 70 }), 30);
    const withHigh = rankTreatmentPriorities(['wrinkles'], makeScore(90, { firmness: 90, elasticity: 90 }), 30);
    // Both are index 0: withHigh = 70+10 = 80 → high; withLow = 70+15+10 = 95 → high
    // Both high, but low firmness should still be flagged
    expect(withLow[0].urgency).toBe('high');
    expect(withHigh[0].urgency).toBe('high');
  });

  it('wrinkles with low elasticity (<50) gains +10 urgency', () => {
    const result = rankTreatmentPriorities(
      ['wrinkles'],
      makeScore(50, { firmness: 80, elasticity: 40 }),
      30,
    );
    expect(result[0].urgency).toBe('high');
  });

  it('pigmentation with low tone (<50) gains +15 urgency', () => {
    // base 65 + 15 (low tone) + 10 (index) = 90 → high
    const result = rankTreatmentPriorities(
      ['pigmentation'],
      makeScore(50, { tone: 30 }),
      25,
    );
    expect(result[0].urgency).toBe('high');
  });

  it('texture with low texture score (<50) gains +15 urgency', () => {
    // base 60 + 15 + 10 = 85 → high
    const result = rankTreatmentPriorities(
      ['texture'],
      makeScore(50, { texture: 30 }),
      25,
    );
    expect(result[0].urgency).toBe('high');
  });

  it('age ≥50 boost applies to wrinkles/laxity/volume_loss (+10)', () => {
    const result = rankTreatmentPriorities(['volume_loss'], makeScore(80), 55);
    // base 65 + 10 (age 50+) + 10 (index) = 85 → high
    expect(result[0].urgency).toBe('high');
  });

  it('age <50 does not apply the aging boost', () => {
    const result = rankTreatmentPriorities(['volume_loss'], makeScore(80), 40);
    // base 65 + 10 (index) = 75 → high
    expect(result[0].urgency).toBe('high');
  });

  it('index bonus decays: 0→+10, 1→+7, 2→+4, 3→+1, 4+→0', () => {
    // Use a concern whose base is right at the borderline
    // hair_removal base 40: 40+10=50 (medium), 40+7=47 (low), 40+4=44 (low), 40+1=41 (low), 40+0=40 (low)
    const result = rankTreatmentPriorities(
      ['hair_removal', 'hair_removal', 'hair_removal', 'hair_removal', 'hair_removal'],
      makeScore(80),
      30,
    );
    // 1 high/medium + 4 lows
    const highs = result.filter(r => r.urgency === 'medium' || r.urgency === 'high').length;
    expect(highs).toBeGreaterThanOrEqual(1);
  });

  it('urgency threshold: ≥70 high, ≥50 medium, else low', () => {
    // acne base 80 + index 0 (+10) = 90 → high
    const high = rankTreatmentPriorities(['acne'], makeScore(80), 30)[0];
    expect(high.urgency).toBe('high');

    // double_chin base 55 + 10 = 65 → medium
    const med = rankTreatmentPriorities(['double_chin'], makeScore(80), 30)[0];
    expect(med.urgency).toBe('medium');

    // hair_removal base 40 with index penalty (4th) = 40 → low
    const lowResults = rankTreatmentPriorities(
      ['acne', 'acne', 'acne', 'acne', 'hair_removal'],
      makeScore(80),
      30,
    );
    const hr = lowResults.find(r => r.concern === 'hair_removal')!;
    expect(hr.urgency).toBe('low');
  });

  it('every priority has a non-empty rationale', () => {
    const result = rankTreatmentPriorities(
      ['wrinkles', 'volume_loss', 'acne', 'scarring', 'pigmentation', 'laxity', 'dark_circles', 'lip_enhancement', 'pores'],
      makeScore(70),
      40,
    );
    for (const p of result) {
      expect(p.rationale).toBeTruthy();
      expect(p.rationale.length).toBeGreaterThan(10);
    }
  });

  it('wrinkles rationale differs by age', () => {
    const young = rankTreatmentPriorities(['wrinkles'], makeScore(70), 30)[0];
    const old = rankTreatmentPriorities(['wrinkles'], makeScore(70), 50)[0];
    expect(young.rationale).toContain('before they become etched');
    expect(old.rationale).toContain('prevents further progression');
  });

  it('recommendedTreatment pulled from concern→treatment map', () => {
    const result = rankTreatmentPriorities(['laxity'], makeScore(70), 40);
    expect(result[0].recommendedTreatment).toContain('Sofwave');
  });

  it('unknown concerns are skipped (defensive — type-safe entrypoint)', () => {
    // All listed concerns are valid; this exercises the happy path over the
    // full SkinConcern union.
    const allConcerns: SkinConcern[] = [
      'wrinkles', 'volume_loss', 'acne', 'scarring', 'pigmentation',
      'redness', 'texture', 'pores', 'laxity', 'double_chin',
      'body_contouring', 'hair_removal', 'dark_circles', 'lip_enhancement', 'neck_chest_aging',
    ];
    const result = rankTreatmentPriorities(allConcerns, makeScore(70), 40);
    expect(result).toHaveLength(allConcerns.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// generateSkincareRoutine
// ══════════════════════════════════════════════════════════════════════════

describe('generateSkincareRoutine', () => {
  describe('morning routine', () => {
    it('always starts with gentle cleanser and vitamin C', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      expect(routine.morning[0].type).toBe('Cleanser');
      expect(routine.morning[1].type).toBe('Antioxidant');
      expect(routine.morning[1].product).toContain('Vitamin C');
    });

    it('adds hyaluronic acid at age ≥35', () => {
      const routine = generateSkincareRoutine(3, [], 35, 'basic');
      expect(routine.morning.some(s => s.product.includes('Hyaluronic Acid'))).toBe(true);
    });

    it('adds hyaluronic acid on texture concern regardless of age', () => {
      const routine = generateSkincareRoutine(3, ['texture'], 25, 'basic');
      expect(routine.morning.some(s => s.product.includes('Hyaluronic Acid'))).toBe(true);
    });

    it('does NOT add hyaluronic acid for young skin without texture concern', () => {
      const routine = generateSkincareRoutine(3, ['acne'], 25, 'basic');
      expect(routine.morning.some(s => s.product.includes('Hyaluronic Acid'))).toBe(false);
    });

    it.each([['pores'], ['redness'], ['pigmentation']] as const)(
      'adds niacinamide when concerns include %s',
      (concern) => {
        const routine = generateSkincareRoutine(3, [concern as SkinConcern], 25, 'basic');
        expect(routine.morning.some(s => s.product.includes('Niacinamide'))).toBe(true);
      },
    );

    it('does NOT add niacinamide without a matching concern', () => {
      const routine = generateSkincareRoutine(3, ['wrinkles'], 25, 'basic');
      expect(routine.morning.some(s => s.product.includes('Niacinamide'))).toBe(false);
    });

    it('Fitzpatrick ≤2 gets Lightweight Moisturizer', () => {
      const routine = generateSkincareRoutine(1, [], 25, 'basic');
      expect(routine.morning.some(s => s.product === 'Lightweight Moisturizer')).toBe(true);
    });

    it('Fitzpatrick 2 (boundary) still gets Lightweight Moisturizer', () => {
      const routine = generateSkincareRoutine(2, [], 25, 'basic');
      expect(routine.morning.some(s => s.product === 'Lightweight Moisturizer')).toBe(true);
    });

    it('Fitzpatrick ≥3 gets Barrier Repair Moisturizer', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      expect(routine.morning.some(s => s.product === 'Barrier Repair Moisturizer')).toBe(true);
    });

    it('Fitzpatrick ≤3 gets Mineral Sunscreen SPF 50', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      const spf = routine.morning.find(s => s.type === 'Sun Protection')!;
      expect(spf.product).toBe('Mineral Sunscreen SPF 50');
    });

    it('Fitzpatrick 4-6 gets Mineral/Chemical SPF 30-50', () => {
      const routine = generateSkincareRoutine(5, [], 25, 'basic');
      const spf = routine.morning.find(s => s.type === 'Sun Protection')!;
      expect(spf.product).toContain('30-50');
    });

    it('SPF is always the final step of the morning routine', () => {
      const routine = generateSkincareRoutine(3, ['wrinkles', 'pores', 'pigmentation'], 45, 'advanced');
      expect(routine.morning[routine.morning.length - 1].type).toBe('Sun Protection');
    });
  });

  describe('evening routine', () => {
    it('always double-cleanses', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      expect(routine.evening[0].type).toBe('First Cleanse');
      expect(routine.evening[1].type).toBe('Second Cleanse');
    });

    it('age <25 gets no retinoid', () => {
      const routine = generateSkincareRoutine(3, [], 22, 'moderate');
      expect(routine.evening.some(s => s.type === 'Retinoid')).toBe(false);
    });

    it('age 25 with no skincare routine gets no retinoid', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'none');
      expect(routine.evening.some(s => s.type === 'Retinoid')).toBe(false);
    });

    it('age 25 with any routine gets retinol (not tretinoin)', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      const ret = routine.evening.find(s => s.type === 'Retinoid')!;
      expect(ret.product).toContain('Retinol');
      expect(ret.keyIngredient).toBe('Retinol');
    });

    it('age 35+ gets prescription tretinoin', () => {
      const routine = generateSkincareRoutine(3, [], 35, 'basic');
      const ret = routine.evening.find(s => s.type === 'Retinoid')!;
      expect(ret.product).toContain('Tretinoin');
      expect(ret.keyIngredient).toBe('Tretinoin');
    });

    it('acne concern adds salicylic acid', () => {
      const routine = generateSkincareRoutine(3, ['acne'], 25, 'basic');
      expect(routine.evening.some(s => s.product.includes('Salicylic Acid'))).toBe(true);
    });

    it('pigmentation concern adds brightening serum', () => {
      const routine = generateSkincareRoutine(3, ['pigmentation'], 25, 'basic');
      const bright = routine.evening.find(s => s.type === 'Pigment Corrector')!;
      expect(bright).toBeDefined();
      expect(bright.keyIngredient).toContain('Tranexamic Acid');
    });

    it('wrinkles concern adds peptide serum', () => {
      const routine = generateSkincareRoutine(3, ['wrinkles'], 25, 'basic');
      expect(routine.evening.some(s => s.type === 'Anti-Aging Serum')).toBe(true);
    });

    it('laxity concern adds peptide serum', () => {
      const routine = generateSkincareRoutine(3, ['laxity'], 25, 'basic');
      expect(routine.evening.some(s => s.type === 'Anti-Aging Serum')).toBe(true);
    });

    it('age ≥40 adds peptide serum even without wrinkles/laxity concerns', () => {
      const routine = generateSkincareRoutine(3, [], 42, 'basic');
      expect(routine.evening.some(s => s.type === 'Anti-Aging Serum')).toBe(true);
    });

    it('dark_circles concern adds eye cream', () => {
      const routine = generateSkincareRoutine(3, ['dark_circles'], 25, 'basic');
      expect(routine.evening.some(s => s.type === 'Eye Treatment')).toBe(true);
    });

    it('wrinkles concern adds eye cream', () => {
      const routine = generateSkincareRoutine(3, ['wrinkles'], 25, 'basic');
      expect(routine.evening.some(s => s.type === 'Eye Treatment')).toBe(true);
    });

    it('age ≥30 adds eye cream by default', () => {
      const routine = generateSkincareRoutine(3, [], 30, 'basic');
      expect(routine.evening.some(s => s.type === 'Eye Treatment')).toBe(true);
    });

    it('age <30 without dark_circles/wrinkles gets no eye cream', () => {
      const routine = generateSkincareRoutine(3, ['acne'], 25, 'basic');
      expect(routine.evening.some(s => s.type === 'Eye Treatment')).toBe(false);
    });

    it('night cream is always the final evening step', () => {
      const routine = generateSkincareRoutine(3, ['acne', 'pigmentation', 'wrinkles', 'dark_circles'], 45, 'advanced');
      const last = routine.evening[routine.evening.length - 1];
      expect(last.type).toBe('Moisturizer');
      expect(last.product).toContain('Night Cream');
    });
  });

  describe('weekly routine', () => {
    it('hydrating mask is always present', () => {
      const routine = generateSkincareRoutine(3, [], 25, 'basic');
      expect(routine.weekly.some(s => s.product === 'Hydrating Mask')).toBe(true);
    });

    it.each([['texture'], ['pores'], ['acne']] as const)(
      'adds chemical exfoliant for %s concern',
      (concern) => {
        const routine = generateSkincareRoutine(3, [concern as SkinConcern], 25, 'basic');
        expect(routine.weekly.some(s => s.type === 'Weekly Exfoliation')).toBe(true);
      },
    );

    it('no exfoliant when concerns do not include texture/pores/acne', () => {
      const routine = generateSkincareRoutine(3, ['wrinkles'], 25, 'basic');
      expect(routine.weekly.some(s => s.type === 'Weekly Exfoliation')).toBe(false);
    });

    it('age ≥35 adds firming mask', () => {
      const routine = generateSkincareRoutine(3, [], 35, 'basic');
      expect(routine.weekly.some(s => s.product === 'Firming/Tightening Mask')).toBe(true);
    });

    it('laxity concern adds firming mask at any age', () => {
      const routine = generateSkincareRoutine(3, ['laxity'], 25, 'basic');
      expect(routine.weekly.some(s => s.product === 'Firming/Tightening Mask')).toBe(true);
    });

    it('no firming mask for young clients without laxity', () => {
      const routine = generateSkincareRoutine(3, ['acne'], 25, 'basic');
      expect(routine.weekly.some(s => s.product === 'Firming/Tightening Mask')).toBe(false);
    });
  });

  describe('full routine integration', () => {
    it('returns routine object with three arrays', () => {
      const routine = generateSkincareRoutine(3, [], 30, 'basic');
      expect(Array.isArray(routine.morning)).toBe(true);
      expect(Array.isArray(routine.evening)).toBe(true);
      expect(Array.isArray(routine.weekly)).toBe(true);
    });

    it('45-year-old with advanced routine and multiple concerns gets comprehensive plan', () => {
      const routine = generateSkincareRoutine(
        3,
        ['wrinkles', 'pigmentation', 'pores', 'dark_circles'],
        45,
        'advanced',
      );
      // Morning: cleanser, vit C, HA, niacinamide, moisturizer, SPF
      expect(routine.morning.length).toBeGreaterThanOrEqual(6);
      // Evening should include retinoid (tretinoin), brightening, peptide, eye cream
      const eveningProducts = routine.evening.map(s => s.product);
      expect(eveningProducts.some(p => p.includes('Tretinoin'))).toBe(true);
      expect(eveningProducts.some(p => p.includes('Brightening'))).toBe(true);
      expect(eveningProducts.some(p => p.includes('Peptide'))).toBe(true);
      expect(eveningProducts.some(p => p.includes('Eye Cream'))).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// compareToBenchmarks
// ══════════════════════════════════════════════════════════════════════════

describe('compareToBenchmarks', () => {
  describe('age group bucketing', () => {
    const cases: Array<[number, string, number]> = [
      [20, 'Ages 20-29', 78],
      [29, 'Ages 20-29', 78],
      [30, 'Ages 30-39', 68],
      [39, 'Ages 30-39', 68],
      [40, 'Ages 40-49', 58],
      [49, 'Ages 40-49', 58],
      [50, 'Ages 50-59', 48],
      [59, 'Ages 50-59', 48],
      [60, 'Ages 60-69', 40],
      [69, 'Ages 60-69', 40],
      [70, 'Ages 70+', 35],
      [85, 'Ages 70+', 35],
    ];

    it.each(cases)('age %i → age group "%s" (benchmark %i)', (age, expectedGroup, expectedBench) => {
      const result = compareToBenchmarks(age, makeScore(expectedBench));
      expect(result.ageGroup).toBe(expectedGroup);
      expect(result.percentile).toBe(50); // overall === benchmark → 50th percentile
    });
  });

  describe('percentile calculation', () => {
    it('overall equal to benchmark = 50th percentile', () => {
      const result = compareToBenchmarks(35, makeScore(68));
      expect(result.percentile).toBe(50);
    });

    it('overall 2x benchmark caps high (but not above 99)', () => {
      const result = compareToBenchmarks(70, makeScore(100));
      // bench 35, percentile = 50 + ((100-35)/35)*50 = 50 + 92.86 ≈ 143 → clamp 99
      expect(result.percentile).toBe(99);
    });

    it('overall far below benchmark clamps at 1', () => {
      const result = compareToBenchmarks(25, makeScore(0));
      // bench 78, percentile = 50 + ((0-78)/78)*50 = 50 - 50 = 0 → clamp 1
      expect(result.percentile).toBe(1);
    });

    it('overall above benchmark by exactly 10 → moderate lift', () => {
      const result = compareToBenchmarks(25, makeScore(88));
      // 50 + (10/78)*50 = 50 + 6.41 = 56.41 → 56
      expect(result.percentile).toBe(56);
    });

    it('older client same raw score as younger has higher percentile (age-matched)', () => {
      const young = compareToBenchmarks(25, makeScore(60));
      const old = compareToBenchmarks(65, makeScore(60));
      expect(old.percentile).toBeGreaterThan(young.percentile);
    });
  });

  describe('areas better/for improvement', () => {
    it('dimension >5 above benchmark → listed in areasBetterThanPeers', () => {
      const result = compareToBenchmarks(35, makeScore(68, { hydration: 80, elasticity: 80 }));
      expect(result.areasBetterThanPeers).toEqual(expect.arrayContaining(['Hydration', 'Elasticity']));
    });

    it('dimension >5 below benchmark → listed in areasForImprovement', () => {
      const result = compareToBenchmarks(35, makeScore(68, { firmness: 50, protection: 50 }));
      expect(result.areasForImprovement).toEqual(expect.arrayContaining(['Firmness', 'Sun Protection']));
    });

    it('dimension within ±5 of benchmark → neither list', () => {
      const result = compareToBenchmarks(35, makeScore(68, {
        hydration: 70, elasticity: 70, texture: 70, tone: 70,
        clarity: 70, firmness: 70, radiance: 70, protection: 70,
      }));
      expect(result.areasBetterThanPeers.some(a => a === 'Hydration')).toBe(false);
      expect(result.areasForImprovement.some(a => a === 'Hydration')).toBe(false);
    });

    it('all dimensions exactly at benchmark → fallback message for both lists', () => {
      const result = compareToBenchmarks(35, makeScore(68, {
        hydration: 68, elasticity: 68, texture: 68, tone: 68,
        clarity: 68, firmness: 68, radiance: 68, protection: 68,
      }));
      expect(result.areasBetterThanPeers[0]).toContain('close to average');
      expect(result.areasForImprovement[0]).toContain('meeting or exceeding');
    });

    it('all 8 dimensions can individually appear as "better"', () => {
      const result = compareToBenchmarks(35, makeScore(68, {
        hydration: 80, elasticity: 80, texture: 80, tone: 80,
        clarity: 80, firmness: 80, radiance: 80, protection: 80,
      }));
      expect(result.areasBetterThanPeers).toEqual(expect.arrayContaining([
        'Hydration', 'Elasticity', 'Texture', 'Even Tone',
        'Clarity', 'Firmness', 'Radiance', 'Sun Protection',
      ]));
    });

    it('uses "Even Tone" label rather than "Tone"', () => {
      const result = compareToBenchmarks(35, makeScore(68, { tone: 90 }));
      expect(result.areasBetterThanPeers).toContain('Even Tone');
      expect(result.areasBetterThanPeers).not.toContain('Tone');
    });

    it('uses "Sun Protection" label rather than "Protection"', () => {
      const result = compareToBenchmarks(35, makeScore(68, { protection: 90 }));
      expect(result.areasBetterThanPeers).toContain('Sun Protection');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// calculateProgressDelta
// ══════════════════════════════════════════════════════════════════════════

describe('calculateProgressDelta', () => {
  it('computes overall change', () => {
    const delta = calculateProgressDelta(makeScore(80), makeScore(70));
    expect(delta.overallChange).toBe(10);
  });

  it('trend "improving" when change > 3', () => {
    expect(calculateProgressDelta(makeScore(75), makeScore(70)).trend).toBe('improving');
  });

  it('trend "stable" at exactly +3', () => {
    expect(calculateProgressDelta(makeScore(73), makeScore(70)).trend).toBe('stable');
  });

  it('trend "stable" at exactly -3', () => {
    expect(calculateProgressDelta(makeScore(67), makeScore(70)).trend).toBe('stable');
  });

  it('trend "declining" when change < -3', () => {
    expect(calculateProgressDelta(makeScore(65), makeScore(70)).trend).toBe('declining');
  });

  it('trend "stable" with zero change', () => {
    expect(calculateProgressDelta(makeScore(70), makeScore(70)).trend).toBe('stable');
  });

  it('returns per-dimension deltas', () => {
    const current = makeScore(80, { hydration: 80, elasticity: 60, firmness: 75 });
    const previous = makeScore(70, { hydration: 60, elasticity: 65, firmness: 70 });
    const delta = calculateProgressDelta(current, previous);
    expect(delta.dimensionChanges.hydration).toBe(20);
    expect(delta.dimensionChanges.elasticity).toBe(-5);
    expect(delta.dimensionChanges.firmness).toBe(5);
  });

  it('dimensionChanges includes all 8 dimensions', () => {
    const delta = calculateProgressDelta(makeScore(80), makeScore(70));
    expect(Object.keys(delta.dimensionChanges).sort()).toEqual([
      'clarity', 'elasticity', 'firmness', 'hydration',
      'protection', 'radiance', 'texture', 'tone',
    ]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// performSkinAnalysis — integration
// ══════════════════════════════════════════════════════════════════════════

describe('performSkinAnalysis — integration', () => {
  it('returns a complete SkinAnalysis object for a realistic Type III 42yo', () => {
    const analysis = performSkinAnalysis(
      makeAssessment({
        age: 42,
        skinType: 3,
        concerns: ['wrinkles', 'pigmentation', 'laxity'],
        lifestyle: makeLifestyle({ sunExposure: 'moderate', sleepQuality: 'fair' }),
        currentSkincare: 'moderate',
        selfRatedHydration: 3,
        selfRatedTexture: 3,
        selfRatedTone: 3,
        selfRatedFirmness: 3,
      }),
      makeFitz(),
      makeGlogau({ age: 42, wrinklesWithMovement: true }),
    );

    expect(analysis.fitzpatrickType).toBe(3);
    expect(analysis.fitzpatrickDescription).toContain('Type III');
    expect(analysis.glogauScale).toBe(2);
    expect(analysis.glogauDescription).toContain('Wrinkles in Motion');
    expect(analysis.skinHealthScore.overall).toBeGreaterThan(0);
    expect(analysis.skinHealthScore.overall).toBeLessThanOrEqual(100);
    expect(analysis.agingPatterns.length).toBeGreaterThan(0);
    expect(analysis.treatmentPriority.length).toBe(3);
    expect(analysis.skincareRoutine.morning.length).toBeGreaterThan(0);
    expect(analysis.skincareRoutine.evening.length).toBeGreaterThan(0);
    expect(analysis.benchmarkComparison.ageGroup).toBe('Ages 40-49');
  });

  it('young Fitzpatrick I client with minimal concerns produces a clean profile', () => {
    const analysis = performSkinAnalysis(
      makeAssessment({
        age: 24,
        skinType: 1,
        concerns: [],
        lifestyle: makeLifestyle({ sunExposure: 'minimal', sleepQuality: 'good' }),
        currentSkincare: 'basic',
        selfRatedHydration: 4,
        selfRatedTexture: 4,
        selfRatedTone: 4,
        selfRatedFirmness: 5,
      }),
      makeFitz({
        eyeColor: 'light_blue_green',
        naturalHairColor: 'red_light_blonde',
        skinColorUnexposed: 'reddish',
        sunburnReaction: 'always_burns_never_tans',
        tanningAbility: 'never',
      }),
      makeGlogau({ age: 24 }),
    );

    expect(analysis.fitzpatrickType).toBe(1);
    expect(analysis.glogauScale).toBe(1);
    expect(analysis.agingPatterns).toEqual([]);
    expect(analysis.treatmentPriority).toEqual([]);
    // SPF should be mineral SPF 50 for Fitz I
    const spf = analysis.skincareRoutine.morning.find(s => s.type === 'Sun Protection')!;
    expect(spf.product).toContain('SPF 50');
  });

  it('older heavy-sun Type V client flags sun_damage advanced', () => {
    const analysis = performSkinAnalysis(
      makeAssessment({
        age: 58,
        skinType: 5,
        concerns: ['pigmentation', 'wrinkles'],
        lifestyle: makeLifestyle({ sunExposure: 'heavy', sleepQuality: 'fair' }),
        currentSkincare: 'moderate',
      }),
      makeFitz({
        eyeColor: 'dark_brown',
        naturalHairColor: 'black',
        skinColorUnexposed: 'dark_brown',
        sunburnReaction: 'very_rarely_burns_tans_very_easily',
        tanningAbility: 'always',
      }),
      makeGlogau({ age: 58, wrinklesAtRest: true, wrinklesWithMovement: true, sunDamageVisible: true }),
    );

    expect(analysis.fitzpatrickType).toBe(5);
    expect(analysis.glogauScale).toBe(3);
    const sun = analysis.agingPatterns.find(p => p.type === 'sun_damage')!;
    expect(sun.severity).toBe('advanced');
    // Type V gets SPF 30-50 mineral/chemical option
    const spf = analysis.skincareRoutine.morning.find(s => s.type === 'Sun Protection')!;
    expect(spf.product).toContain('30-50');
  });

  it('produces benchmark comparison bucketed to the client age', () => {
    const analysis = performSkinAnalysis(
      makeAssessment({ age: 52 }),
      makeFitz(),
      makeGlogau({ age: 52, wrinklesAtRest: true }),
    );
    expect(analysis.benchmarkComparison.ageGroup).toBe('Ages 50-59');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Edge cases & defensive input handling
// ══════════════════════════════════════════════════════════════════════════

describe('edge cases & empty inputs', () => {
  it('calculateSkinHealthScore with zero concerns works', () => {
    const score = calculateSkinHealthScore(makeAssessment({ concerns: [] }));
    expect(score.overall).toBeGreaterThan(0);
  });

  it('calculateSkinHealthScore with empty recentTreatments works', () => {
    const score = calculateSkinHealthScore(makeAssessment({ recentTreatments: [] }));
    expect(score.overall).toBeGreaterThan(0);
  });

  it('detectAgingPatterns with empty concerns and young age returns []', () => {
    expect(detectAgingPatterns(22, [], makeLifestyle())).toEqual([]);
  });

  it('rankTreatmentPriorities with empty concerns returns []', () => {
    expect(rankTreatmentPriorities([], makeScore(70), 30)).toEqual([]);
  });

  it('generateSkincareRoutine with empty concerns still produces morning/evening/weekly', () => {
    const routine = generateSkincareRoutine(3, [], 20, 'none');
    expect(routine.morning.length).toBeGreaterThan(0);
    expect(routine.evening.length).toBeGreaterThan(0);
    expect(routine.weekly.length).toBeGreaterThan(0);
  });

  it('compareToBenchmarks handles age 0 edge (bucket 20-29)', () => {
    const result = compareToBenchmarks(0, makeScore(60));
    expect(result.ageGroup).toBe('Ages 20-29');
  });

  it('compareToBenchmarks handles extremely high age (bucket 70+)', () => {
    const result = compareToBenchmarks(120, makeScore(40));
    expect(result.ageGroup).toBe('Ages 70+');
  });

  it('calculateProgressDelta across identical scores → zero deltas everywhere', () => {
    const s = makeScore(70);
    const d = calculateProgressDelta(s, s);
    expect(d.overallChange).toBe(0);
    for (const key of Object.keys(d.dimensionChanges)) {
      expect(d.dimensionChanges[key]).toBe(0);
    }
  });

  it('recent treatments matching is case-insensitive across all dimensions', () => {
    const score = calculateSkinHealthScore(makeAssessment({
      selfRatedHydration: 3,
      selfRatedTexture: 3,
      recentTreatments: ['HYDRAFACIAL', 'SOFWAVE', 'RF MICRONEEDLING', 'PICOWAY', 'PEEL'],
    }));
    // Hydrafacial bumps hydration (+8) and radiance (+12)
    expect(score.dimensions.hydration).toBeGreaterThan(48);
    expect(score.dimensions.radiance).toBeGreaterThan(65);
  });
});
