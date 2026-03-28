/**
 * Skin Analysis Engine
 *
 * Comprehensive skin assessment system including:
 * - Fitzpatrick skin type determination
 * - Glogau photoaging scale classification
 * - Skin health scoring (0-100) across 8 dimensions
 * - Aging pattern detection
 * - Treatment priority ranking
 * - Progress tracking over time
 * - Age-matched benchmarks
 * - Personalized skincare routine recommendations
 */

import type {
  FitzpatrickType,
  GlogauScale,
  SkinAnalysis,
  SkinHealthScore,
  SkinDimensions,
  AgingPattern,
  AgingPatternType,
  TreatmentPriority,
  SkincareRoutine,
  SkincareStep,
  BenchmarkComparison,
  SkinProgressRecord,
  SkinConcern,
  LifestyleFactors,
} from '@/types/ai-treatment';

// ── FITZPATRICK DETERMINATION ──

interface FitzpatrickQuestionnaireInput {
  eyeColor: 'light_blue_green' | 'blue_hazel_green' | 'hazel_brown' | 'dark_brown' | 'brownish_black';
  naturalHairColor: 'red_light_blonde' | 'blonde' | 'dark_blonde_light_brown' | 'dark_brown' | 'black';
  skinColorUnexposed: 'reddish' | 'very_pale' | 'pale_with_beige' | 'olive_light_brown' | 'dark_brown' | 'deeply_pigmented';
  sunburnReaction: 'always_burns_never_tans' | 'usually_burns_tans_minimally' | 'sometimes_burns_tans_uniformly' | 'rarely_burns_tans_easily' | 'very_rarely_burns_tans_very_easily' | 'never_burns_deeply_pigmented';
  tanningAbility: 'never' | 'seldom' | 'sometimes' | 'often' | 'always' | 'always_deeply';
}

export function determineFitzpatrickType(input: FitzpatrickQuestionnaireInput): { type: FitzpatrickType; description: string } {
  let score = 0;

  // Eye color scoring
  const eyeScores: Record<string, number> = { light_blue_green: 0, blue_hazel_green: 1, hazel_brown: 2, dark_brown: 3, brownish_black: 4 };
  score += eyeScores[input.eyeColor] || 0;

  // Hair color scoring
  const hairScores: Record<string, number> = { red_light_blonde: 0, blonde: 1, dark_blonde_light_brown: 2, dark_brown: 3, black: 4 };
  score += hairScores[input.naturalHairColor] || 0;

  // Unexposed skin color
  const skinScores: Record<string, number> = { reddish: 0, very_pale: 1, pale_with_beige: 2, olive_light_brown: 3, dark_brown: 4, deeply_pigmented: 5 };
  score += skinScores[input.skinColorUnexposed] || 0;

  // Sunburn reaction
  const burnScores: Record<string, number> = { always_burns_never_tans: 0, usually_burns_tans_minimally: 1, sometimes_burns_tans_uniformly: 2, rarely_burns_tans_easily: 3, very_rarely_burns_tans_very_easily: 4, never_burns_deeply_pigmented: 5 };
  score += burnScores[input.sunburnReaction] || 0;

  // Tanning ability
  const tanScores: Record<string, number> = { never: 0, seldom: 1, sometimes: 2, often: 3, always: 4, always_deeply: 5 };
  score += tanScores[input.tanningAbility] || 0;

  // Classify
  let type: FitzpatrickType;
  if (score <= 4) type = 1;
  else if (score <= 8) type = 2;
  else if (score <= 12) type = 3;
  else if (score <= 16) type = 4;
  else if (score <= 20) type = 5;
  else type = 6;

  const descriptions: Record<FitzpatrickType, string> = {
    1: 'Type I — Very fair skin, light eyes, freckles. Always burns, never tans. Highest sun sensitivity.',
    2: 'Type II — Fair skin, light eyes. Burns easily, tans minimally. High sun sensitivity.',
    3: 'Type III — Medium skin tone. Sometimes burns, tans uniformly. Moderate sun sensitivity.',
    4: 'Type IV — Olive to moderate brown skin. Rarely burns, tans easily. Lower sun sensitivity.',
    5: 'Type V — Dark brown skin. Very rarely burns, tans very easily. Low sun sensitivity.',
    6: 'Type VI — Deeply pigmented dark skin. Never burns. Minimal sun sensitivity.',
  };

  return { type, description: descriptions[type] };
}

// ── GLOGAU PHOTOAGING CLASSIFICATION ──

interface GlogauInput {
  age: number;
  wrinklesAtRest: boolean;
  wrinklesWithMovement: boolean;
  sunDamageVisible: boolean;
  keratoses: boolean;
  makeupUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
}

export function classifyGlogauScale(input: GlogauInput): { scale: GlogauScale; description: string; characteristics: string[] } {
  let scale: GlogauScale;

  if (input.age < 30 && !input.wrinklesAtRest && !input.sunDamageVisible && !input.keratoses) {
    scale = 1;
  } else if (input.age < 50 && input.wrinklesWithMovement && !input.wrinklesAtRest && !input.keratoses) {
    scale = 2;
  } else if (input.wrinklesAtRest && !input.keratoses) {
    scale = 3;
  } else {
    scale = 4;
  }

  // Override based on strong indicators
  if (input.keratoses) scale = 4;
  if (input.wrinklesAtRest && input.sunDamageVisible && input.age >= 50) scale = Math.max(scale, 3) as GlogauScale;

  const results: Record<GlogauScale, { description: string; characteristics: string[] }> = {
    1: {
      description: 'No Wrinkles — Early photoaging',
      characteristics: ['Mild pigmentary changes', 'No keratoses', 'Minimal wrinkles', 'No or minimal makeup needed', 'Typically ages 20-30s'],
    },
    2: {
      description: 'Wrinkles in Motion — Early to moderate photoaging',
      characteristics: ['Early senile lentigines visible', 'No keratoses (may be palpable but not visible)', 'Wrinkles appear with facial movement', 'Usually wears some foundation', 'Typically ages 30-40s'],
    },
    3: {
      description: 'Wrinkles at Rest — Advanced photoaging',
      characteristics: ['Obvious dyschromia and telangiectasia', 'Visible keratoses', 'Wrinkles present even without movement', 'Always wears heavier foundation', 'Typically ages 50-60s'],
    },
    4: {
      description: 'Only Wrinkles — Severe photoaging',
      characteristics: ['Yellow-gray skin color', 'Prior skin malignancies', 'Wrinkled throughout, no normal skin', 'Cannot wear makeup (cakes and cracks)', 'Typically ages 60-70s+'],
    },
  };

  return { scale, ...results[scale] };
}

// ── SKIN HEALTH SCORING ──

interface SkinAssessmentInput {
  age: number;
  skinType: FitzpatrickType;
  concerns: SkinConcern[];
  lifestyle: LifestyleFactors;
  currentSkincare: 'none' | 'basic' | 'moderate' | 'advanced';
  recentTreatments: string[];
  selfRatedHydration: 1 | 2 | 3 | 4 | 5;
  selfRatedTexture: 1 | 2 | 3 | 4 | 5;
  selfRatedTone: 1 | 2 | 3 | 4 | 5;
  selfRatedFirmness: 1 | 2 | 3 | 4 | 5;
}

export function calculateSkinHealthScore(input: SkinAssessmentInput): SkinHealthScore {
  const base = 100;
  const dimensions: SkinDimensions = {
    hydration: calculateHydrationScore(input),
    elasticity: calculateElasticityScore(input),
    texture: calculateTextureScore(input),
    tone: calculateToneScore(input),
    clarity: calculateClarityScore(input),
    firmness: calculateFirmnessScore(input),
    radiance: calculateRadianceScore(input),
    protection: calculateProtectionScore(input),
  };

  // Weighted overall score
  const weights = {
    hydration: 0.15,
    elasticity: 0.15,
    texture: 0.15,
    tone: 0.10,
    clarity: 0.10,
    firmness: 0.15,
    radiance: 0.10,
    protection: 0.10,
  };

  const overall = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + dimensions[key as keyof SkinDimensions] * weight;
    }, 0)
  );

  return {
    overall: Math.max(0, Math.min(base, overall)),
    dimensions,
  };
}

function calculateHydrationScore(input: SkinAssessmentInput): number {
  let score = input.selfRatedHydration * 16; // 16-80 base

  // Lifestyle adjustments
  if (input.lifestyle.waterIntake === 'high') score += 10;
  else if (input.lifestyle.waterIntake === 'low') score -= 15;

  if (input.currentSkincare === 'advanced') score += 10;
  else if (input.currentSkincare === 'none') score -= 10;

  if (input.lifestyle.smoking) score -= 10;

  if (input.recentTreatments.some(t => t.toLowerCase().includes('hydrafacial'))) score += 8;

  return clamp(score, 0, 100);
}

function calculateElasticityScore(input: SkinAssessmentInput): number {
  // Age is the primary factor for elasticity
  let score = Math.max(20, 100 - (input.age - 20) * 1.2);

  if (input.concerns.includes('laxity')) score -= 15;
  if (input.lifestyle.smoking) score -= 15;
  if (input.lifestyle.sunExposure === 'heavy') score -= 12;
  if (input.lifestyle.exerciseFrequency === 'regular' || input.lifestyle.exerciseFrequency === 'daily') score += 8;
  if (input.currentSkincare === 'advanced') score += 5;

  if (input.recentTreatments.some(t => t.toLowerCase().includes('sofwave') || t.toLowerCase().includes('rf microneedling'))) score += 10;

  return clamp(score, 0, 100);
}

function calculateTextureScore(input: SkinAssessmentInput): number {
  let score = input.selfRatedTexture * 16;

  if (input.concerns.includes('texture')) score -= 10;
  if (input.concerns.includes('pores')) score -= 8;
  if (input.concerns.includes('scarring')) score -= 12;
  if (input.concerns.includes('acne')) score -= 10;

  if (input.currentSkincare === 'advanced') score += 10;
  if (input.recentTreatments.some(t => t.toLowerCase().includes('peel') || t.toLowerCase().includes('microneedling'))) score += 10;

  return clamp(score, 0, 100);
}

function calculateToneScore(input: SkinAssessmentInput): number {
  let score = input.selfRatedTone * 16;

  if (input.concerns.includes('pigmentation')) score -= 15;
  if (input.concerns.includes('redness')) score -= 10;
  if (input.lifestyle.sunExposure === 'heavy') score -= 12;
  if (input.lifestyle.sunExposure === 'minimal') score += 5;

  if (input.recentTreatments.some(t => t.toLowerCase().includes('picoway') || t.toLowerCase().includes('peel'))) score += 8;

  return clamp(score, 0, 100);
}

function calculateClarityScore(input: SkinAssessmentInput): number {
  let score = 75;

  if (input.concerns.includes('acne')) score -= 20;
  if (input.concerns.includes('redness')) score -= 10;
  if (input.concerns.includes('pigmentation')) score -= 10;

  if (input.lifestyle.stressLevel === 'high') score -= 8;
  if (input.lifestyle.sleepQuality === 'poor') score -= 10;
  if (input.lifestyle.sleepQuality === 'good') score += 8;
  if (input.currentSkincare === 'advanced') score += 10;

  return clamp(score, 0, 100);
}

function calculateFirmnessScore(input: SkinAssessmentInput): number {
  let score = input.selfRatedFirmness * 16;

  const agePenalty = Math.max(0, (input.age - 30) * 0.8);
  score -= agePenalty;

  if (input.concerns.includes('laxity')) score -= 12;
  if (input.concerns.includes('volume_loss')) score -= 10;
  if (input.lifestyle.smoking) score -= 12;

  if (input.recentTreatments.some(t => t.toLowerCase().includes('sofwave') || t.toLowerCase().includes('rf'))) score += 10;

  return clamp(score, 0, 100);
}

function calculateRadianceScore(input: SkinAssessmentInput): number {
  let score = 65;

  if (input.lifestyle.sleepQuality === 'good') score += 12;
  else if (input.lifestyle.sleepQuality === 'poor') score -= 12;

  if (input.lifestyle.waterIntake === 'high') score += 8;
  if (input.lifestyle.exerciseFrequency === 'regular' || input.lifestyle.exerciseFrequency === 'daily') score += 8;
  if (input.lifestyle.stressLevel === 'high') score -= 10;
  if (input.lifestyle.smoking) score -= 12;

  if (input.currentSkincare === 'advanced') score += 10;
  if (input.recentTreatments.some(t => t.toLowerCase().includes('hydrafacial'))) score += 12;

  return clamp(score, 0, 100);
}

function calculateProtectionScore(input: SkinAssessmentInput): number {
  let score = 50;

  // Skincare routine is key
  if (input.currentSkincare === 'advanced') score += 30;
  else if (input.currentSkincare === 'moderate') score += 20;
  else if (input.currentSkincare === 'basic') score += 10;

  if (input.lifestyle.sunExposure === 'minimal') score += 15;
  else if (input.lifestyle.sunExposure === 'heavy') score -= 20;

  if (input.lifestyle.smoking) score -= 10;

  return clamp(score, 0, 100);
}

// ── AGING PATTERN DETECTION ──

export function detectAgingPatterns(
  age: number,
  concerns: SkinConcern[],
  lifestyle: LifestyleFactors,
): AgingPattern[] {
  const patterns: AgingPattern[] = [];

  // Expression lines
  if (concerns.includes('wrinkles') || age >= 30) {
    const severity = age < 35 ? 'mild' : age < 50 ? 'moderate' : 'advanced';
    patterns.push({
      type: 'expression_lines' as AgingPatternType,
      severity,
      areas: determineExpressionAreas(concerns),
      recommendedTreatments: ['Botox', 'RF Microneedling', 'Chemical Peel'],
    });
  }

  // Gravity effects
  if (concerns.includes('laxity') || age >= 40) {
    const severity = age < 45 ? 'mild' : age < 55 ? 'moderate' : 'advanced';
    patterns.push({
      type: 'gravity' as AgingPatternType,
      severity,
      areas: ['Jawline', 'Jowls', 'Neck', 'Brows'],
      recommendedTreatments: ['Sofwave', 'Dermal Fillers — Jawline', 'RF Microneedling', 'Botox — Neck Bands'],
    });
  }

  // Volume loss
  if (concerns.includes('volume_loss') || age >= 35) {
    const severity = age < 40 ? 'mild' : age < 55 ? 'moderate' : 'advanced';
    patterns.push({
      type: 'volume_loss' as AgingPatternType,
      severity,
      areas: determineVolumeLossAreas(concerns, age),
      recommendedTreatments: ['Dermal Fillers — Cheeks', 'Dermal Fillers — Temples', 'Dermal Fillers — Lips'],
    });
  }

  // Sun damage
  if (concerns.includes('pigmentation') || lifestyle.sunExposure === 'heavy') {
    const severity = lifestyle.sunExposure === 'heavy' && age > 40 ? 'advanced' : lifestyle.sunExposure === 'heavy' ? 'moderate' : 'mild';
    patterns.push({
      type: 'sun_damage' as AgingPatternType,
      severity,
      areas: ['Face', 'Neck', 'Chest', 'Hands'],
      recommendedTreatments: ['PicoWay Laser', 'VI Peel', 'Chemical Peel', 'HydraFacial'],
    });
  }

  return patterns;
}

function determineExpressionAreas(concerns: SkinConcern[]): string[] {
  const areas: string[] = [];
  areas.push('Forehead (horizontal lines)');
  areas.push('Glabella (frown lines/11s)');
  areas.push('Periorbital (crow\'s feet)');
  if (concerns.includes('lip_enhancement')) areas.push('Perioral (lip lines)');
  if (concerns.includes('neck_chest_aging')) areas.push('Neck (bands)');
  return areas;
}

function determineVolumeLossAreas(concerns: SkinConcern[], age: number): string[] {
  const areas: string[] = [];
  if (age >= 35) areas.push('Cheeks/Midface');
  if (age >= 40) areas.push('Temples');
  if (concerns.includes('dark_circles')) areas.push('Tear Trough');
  if (concerns.includes('lip_enhancement')) areas.push('Lips');
  if (age >= 45) areas.push('Jawline');
  if (age >= 50) areas.push('Hands');
  return areas;
}

// ── TREATMENT PRIORITY RANKING ──

export function rankTreatmentPriorities(
  concerns: SkinConcern[],
  skinScore: SkinHealthScore,
  age: number,
): TreatmentPriority[] {
  const priorities: TreatmentPriority[] = [];

  const CONCERN_TREATMENTS: Record<SkinConcern, { treatment: string; baseUrgency: number }> = {
    wrinkles: { treatment: 'Botox + RF Microneedling', baseUrgency: 70 },
    volume_loss: { treatment: 'Dermal Fillers', baseUrgency: 65 },
    acne: { treatment: 'Chemical Peel + HydraFacial', baseUrgency: 80 },
    scarring: { treatment: 'RF Microneedling — Acne Scars', baseUrgency: 60 },
    pigmentation: { treatment: 'PicoWay Laser + VI Peel', baseUrgency: 65 },
    redness: { treatment: 'HydraFacial + Gentle Chemical Peel', baseUrgency: 55 },
    texture: { treatment: 'RF Microneedling + Chemical Peel', baseUrgency: 60 },
    pores: { treatment: 'RF Microneedling + HydraFacial', baseUrgency: 50 },
    laxity: { treatment: 'Sofwave + RF Microneedling', baseUrgency: 70 },
    double_chin: { treatment: 'GLP-1 + Sofwave', baseUrgency: 55 },
    body_contouring: { treatment: 'GLP-1 Program', baseUrgency: 50 },
    hair_removal: { treatment: 'Laser Hair Removal', baseUrgency: 40 },
    dark_circles: { treatment: 'Dermal Filler — Tear Trough', baseUrgency: 60 },
    lip_enhancement: { treatment: 'Dermal Filler — Lips', baseUrgency: 45 },
    neck_chest_aging: { treatment: 'Sofwave Neck + RF Microneedling', baseUrgency: 60 },
  };

  concerns.forEach((concern, index) => {
    const config = CONCERN_TREATMENTS[concern];
    if (!config) return;

    // Adjust urgency based on skin scores
    let urgencyScore = config.baseUrgency;

    // Lower skin dimension scores increase urgency
    if (concern === 'wrinkles' || concern === 'laxity') {
      if (skinScore.dimensions.firmness < 50) urgencyScore += 15;
      if (skinScore.dimensions.elasticity < 50) urgencyScore += 10;
    }
    if (concern === 'pigmentation' || concern === 'redness') {
      if (skinScore.dimensions.tone < 50) urgencyScore += 15;
    }
    if (concern === 'texture' || concern === 'pores' || concern === 'scarring') {
      if (skinScore.dimensions.texture < 50) urgencyScore += 15;
    }

    // Age adjustments
    if (age >= 50 && (concern === 'wrinkles' || concern === 'laxity' || concern === 'volume_loss')) {
      urgencyScore += 10;
    }

    // Priority by selection order (first = most important to client)
    urgencyScore += Math.max(0, 10 - index * 3);

    const urgency: 'high' | 'medium' | 'low' = urgencyScore >= 70 ? 'high' : urgencyScore >= 50 ? 'medium' : 'low';

    priorities.push({
      rank: index + 1,
      concern,
      urgency,
      recommendedTreatment: config.treatment,
      rationale: generatePriorityRationale(concern, urgency, age),
    });
  });

  // Sort by urgency score (implicit through urgency field)
  return priorities.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

function generatePriorityRationale(concern: SkinConcern, urgency: string, age: number): string {
  const rationales: Partial<Record<SkinConcern, string>> = {
    wrinkles: `Dynamic and static lines ${age >= 45 ? 'deepen with time — addressing now prevents further progression' : 'are most effectively treated early, before they become etched'}`,
    volume_loss: 'Restoring midface volume creates a foundation that improves multiple concerns simultaneously — the strategic first step',
    acne: 'Active acne must be controlled before pursuing other treatments — clear skin is the foundation for all aesthetic goals',
    scarring: 'Scar remodeling requires a series of treatments — starting sooner means reaching your goals faster',
    pigmentation: 'Sun damage is cumulative — treating now while protecting prevents further darkening and premature aging',
    laxity: 'Collagen stimulation treatments are most effective when started before significant laxity develops',
    dark_circles: 'Under-eye hollows create a tired appearance that ages the entire face — strategic restoration provides a refreshed look',
    lip_enhancement: 'Subtle lip enhancement creates beautiful proportional balance and can be built gradually over time',
  };

  return rationales[concern] || `Addressing ${concern.replace(/_/g, ' ')} will contribute significantly to your overall skin health and confidence`;
}

// ── SKINCARE ROUTINE RECOMMENDATIONS ──

export function generateSkincareRoutine(
  skinType: FitzpatrickType,
  concerns: SkinConcern[],
  age: number,
  currentRoutine: 'none' | 'basic' | 'moderate' | 'advanced',
): SkincareRoutine {
  const morning: SkincareStep[] = [
    { order: 1, product: 'Gentle Cleanser', type: 'Cleanser', instruction: 'Cleanse with lukewarm water for 30 seconds. Pat dry gently.', keyIngredient: 'Ceramides' },
    { order: 2, product: 'Vitamin C Serum', type: 'Antioxidant', instruction: 'Apply 4-5 drops to face and neck. Allow to absorb 1-2 minutes.', keyIngredient: 'L-Ascorbic Acid 15-20%' },
  ];

  // Add hyaluronic acid for dehydrated/texture concerns
  if (concerns.includes('texture') || age >= 35) {
    morning.push({ order: 3, product: 'Hyaluronic Acid Serum', type: 'Hydrating Serum', instruction: 'Apply to damp skin for maximum absorption.', keyIngredient: 'Multi-weight Hyaluronic Acid' });
  }

  // Add niacinamide for pores/redness
  if (concerns.includes('pores') || concerns.includes('redness') || concerns.includes('pigmentation')) {
    morning.push({ order: morning.length + 1, product: 'Niacinamide Serum', type: 'Brightening/Balancing', instruction: 'Apply thin layer. Works synergistically with Vitamin C.', keyIngredient: 'Niacinamide 5-10%' });
  }

  // Moisturizer
  morning.push({
    order: morning.length + 1,
    product: skinType <= 2 ? 'Lightweight Moisturizer' : 'Barrier Repair Moisturizer',
    type: 'Moisturizer',
    instruction: 'Apply to face and neck. Lock in previous products.',
    keyIngredient: 'Ceramides + Peptides',
  });

  // SPF always last
  morning.push({
    order: morning.length + 1,
    product: skinType <= 3 ? 'Mineral Sunscreen SPF 50' : 'Mineral/Chemical Sunscreen SPF 30-50',
    type: 'Sun Protection',
    instruction: 'Apply generously. Reapply every 2 hours with sun exposure. This is your most important step.',
    keyIngredient: 'Zinc Oxide / Titanium Dioxide',
  });

  // Evening routine
  const evening: SkincareStep[] = [
    { order: 1, product: 'Oil Cleanser or Micellar Water', type: 'First Cleanse', instruction: 'Remove makeup and sunscreen. Massage gently for 30 seconds.', keyIngredient: 'Squalane / Micellar technology' },
    { order: 2, product: 'Gentle Cleanser', type: 'Second Cleanse', instruction: 'Cleanse skin thoroughly. Double cleansing ensures clean base for treatments.', keyIngredient: 'Ceramides' },
  ];

  // Active treatments (evening)
  if (age >= 25 && currentRoutine !== 'none') {
    evening.push({
      order: 3,
      product: age >= 35 ? 'Prescription Retinoid (Tretinoin 0.025-0.05%)' : 'Retinol Serum (0.3-0.5%)',
      type: 'Retinoid',
      instruction: 'Apply pea-sized amount after skin is fully dry. Start 2-3x/week, build to nightly. The gold standard for anti-aging.',
      keyIngredient: age >= 35 ? 'Tretinoin' : 'Retinol',
    });
  }

  if (concerns.includes('acne')) {
    evening.push({
      order: evening.length + 1,
      product: 'Salicylic Acid Treatment',
      type: 'Exfoliant',
      instruction: 'Apply to affected areas. Alternate nights with retinoid.',
      keyIngredient: 'Salicylic Acid 2%',
    });
  }

  if (concerns.includes('pigmentation')) {
    evening.push({
      order: evening.length + 1,
      product: 'Brightening Serum',
      type: 'Pigment Corrector',
      instruction: 'Apply to areas of concern. Can layer under retinoid.',
      keyIngredient: 'Tranexamic Acid + Alpha Arbutin',
    });
  }

  // Peptide serum for aging concerns
  if (concerns.includes('wrinkles') || concerns.includes('laxity') || age >= 40) {
    evening.push({
      order: evening.length + 1,
      product: 'Peptide Complex Serum',
      type: 'Anti-Aging Serum',
      instruction: 'Apply to face and neck. Peptides support collagen production.',
      keyIngredient: 'Copper Peptides + Matrixyl',
    });
  }

  // Eye cream
  if (concerns.includes('dark_circles') || concerns.includes('wrinkles') || age >= 30) {
    evening.push({
      order: evening.length + 1,
      product: 'Eye Cream',
      type: 'Eye Treatment',
      instruction: 'Dab gently around orbital bone with ring finger. Never tug delicate eye area.',
      keyIngredient: 'Caffeine + Peptides + Vitamin K',
    });
  }

  // Night moisturizer
  evening.push({
    order: evening.length + 1,
    product: 'Rich Night Cream',
    type: 'Moisturizer',
    instruction: 'Apply as final step. Seal in actives and support overnight repair.',
    keyIngredient: 'Ceramides + Squalane + Niacinamide',
  });

  // Weekly treatments
  const weekly: SkincareStep[] = [];

  if (concerns.includes('texture') || concerns.includes('pores') || concerns.includes('acne')) {
    weekly.push({
      order: 1,
      product: 'Chemical Exfoliant',
      type: 'Weekly Exfoliation',
      instruction: 'Use 1-2x per week. Skip retinoid on exfoliation nights.',
      keyIngredient: 'AHA (Glycolic/Lactic) or BHA (Salicylic)',
    });
  }

  weekly.push({
    order: weekly.length + 1,
    product: 'Hydrating Mask',
    type: 'Weekly Treatment',
    instruction: 'Apply thick layer for 15-20 minutes 1-2x per week. Great self-care ritual.',
    keyIngredient: 'Hyaluronic Acid + Aloe + Ceramides',
  });

  if (age >= 35 || concerns.includes('laxity')) {
    weekly.push({
      order: weekly.length + 1,
      product: 'Firming/Tightening Mask',
      type: 'Weekly Treatment',
      instruction: 'Apply 1x per week. Look for collagen-supporting ingredients.',
      keyIngredient: 'Peptides + Collagen + Vitamin C',
    });
  }

  return { morning, evening, weekly };
}

// ── BENCHMARK COMPARISON ──

export function compareToBenchmarks(age: number, skinScore: SkinHealthScore): BenchmarkComparison {
  // Age-matched benchmarks (simulated from clinical data patterns)
  const benchmarks: Record<string, number> = {
    '20-29': 78,
    '30-39': 68,
    '40-49': 58,
    '50-59': 48,
    '60-69': 40,
    '70+': 35,
  };

  let ageGroup: string;
  let benchmarkScore: number;

  if (age < 30) { ageGroup = '20-29'; benchmarkScore = 78; }
  else if (age < 40) { ageGroup = '30-39'; benchmarkScore = 68; }
  else if (age < 50) { ageGroup = '40-49'; benchmarkScore = 58; }
  else if (age < 60) { ageGroup = '50-59'; benchmarkScore = 48; }
  else if (age < 70) { ageGroup = '60-69'; benchmarkScore = 40; }
  else { ageGroup = '70+'; benchmarkScore = 35; }

  const percentile = Math.round(
    50 + ((skinScore.overall - benchmarkScore) / benchmarkScore) * 50
  );

  const dims = skinScore.dimensions;
  const dimBenchmark = benchmarkScore; // Simplified — each dimension compared to overall benchmark

  const betterAreas: string[] = [];
  const improvementAreas: string[] = [];

  if (dims.hydration > dimBenchmark + 5) betterAreas.push('Hydration');
  else if (dims.hydration < dimBenchmark - 5) improvementAreas.push('Hydration');

  if (dims.elasticity > dimBenchmark + 5) betterAreas.push('Elasticity');
  else if (dims.elasticity < dimBenchmark - 5) improvementAreas.push('Elasticity');

  if (dims.texture > dimBenchmark + 5) betterAreas.push('Texture');
  else if (dims.texture < dimBenchmark - 5) improvementAreas.push('Texture');

  if (dims.tone > dimBenchmark + 5) betterAreas.push('Even Tone');
  else if (dims.tone < dimBenchmark - 5) improvementAreas.push('Even Tone');

  if (dims.clarity > dimBenchmark + 5) betterAreas.push('Clarity');
  else if (dims.clarity < dimBenchmark - 5) improvementAreas.push('Clarity');

  if (dims.firmness > dimBenchmark + 5) betterAreas.push('Firmness');
  else if (dims.firmness < dimBenchmark - 5) improvementAreas.push('Firmness');

  if (dims.radiance > dimBenchmark + 5) betterAreas.push('Radiance');
  else if (dims.radiance < dimBenchmark - 5) improvementAreas.push('Radiance');

  if (dims.protection > dimBenchmark + 5) betterAreas.push('Sun Protection');
  else if (dims.protection < dimBenchmark - 5) improvementAreas.push('Sun Protection');

  return {
    ageGroup: `Ages ${ageGroup}`,
    percentile: clamp(percentile, 1, 99),
    areasBetterThanPeers: betterAreas.length > 0 ? betterAreas : ['Your skin health is close to average for your age group'],
    areasForImprovement: improvementAreas.length > 0 ? improvementAreas : ['You are meeting or exceeding benchmarks in all areas'],
  };
}

// ── PROGRESS TRACKING ──

export function calculateProgressDelta(
  current: SkinHealthScore,
  previous: SkinHealthScore,
): { overallChange: number; dimensionChanges: Record<string, number>; trend: 'improving' | 'stable' | 'declining' } {
  const overallChange = current.overall - previous.overall;

  const dimensionChanges: Record<string, number> = {};
  for (const key of Object.keys(current.dimensions) as Array<keyof SkinDimensions>) {
    dimensionChanges[key] = current.dimensions[key] - previous.dimensions[key];
  }

  const trend = overallChange > 3 ? 'improving' : overallChange < -3 ? 'declining' : 'stable';

  return { overallChange, dimensionChanges, trend };
}

// ── FULL SKIN ANALYSIS ──

export function performSkinAnalysis(
  input: SkinAssessmentInput,
  fitzpatrickInput: FitzpatrickQuestionnaireInput,
  glogauInput: GlogauInput,
): SkinAnalysis {
  const fitzpatrick = determineFitzpatrickType(fitzpatrickInput);
  const glogau = classifyGlogauScale(glogauInput);
  const skinScore = calculateSkinHealthScore(input);
  const agingPatterns = detectAgingPatterns(input.age, input.concerns, input.lifestyle);
  const priorities = rankTreatmentPriorities(input.concerns, skinScore, input.age);
  const routine = generateSkincareRoutine(input.skinType, input.concerns, input.age, input.currentSkincare);
  const benchmark = compareToBenchmarks(input.age, skinScore);

  return {
    fitzpatrickType: fitzpatrick.type,
    fitzpatrickDescription: fitzpatrick.description,
    glogauScale: glogau.scale,
    glogauDescription: glogau.description,
    skinHealthScore: skinScore,
    agingPatterns,
    treatmentPriority: priorities,
    skincareRoutine: routine,
    benchmarkComparison: benchmark,
  };
}

// ── UTILITY ──

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
