/**
 * Aura Skin Scan™ — Orchestrator
 *
 * Coordinates existing analysis modules into a unified branded scan.
 * Takes ConsultationFormData + optional photo → produces AuraScanResult.
 *
 * Uses:
 * - calculateSkinHealthScore() from skin-analysis.ts (form-based, no API)
 * - determineFitzpatrickType() from skin-analysis.ts
 * - classifyGlogauScale() from skin-analysis.ts
 * - detectAgingPatterns() from skin-analysis.ts
 * - rankTreatmentPriorities() from skin-analysis.ts
 * - getMedicalWarnings() from conditional-logic-v2.ts
 */

import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';
import type {
  AuraScanResult,
  AuraScore,
  AuraGrade,
  AuraDeviceAnalysis,
  CategoryScore,
  SkinAnalysisCategory,
  ZoneAnalysis,
  FacialZone,
  AuraConcern,
  ConcernSeverity,
  ConcernUrgency,
  PredictiveMetrics,
  PredictedState,
  TreatmentReadiness,
} from '@/types/mastermind';
import type {
  SkinConcern,
  SkinAnalysis,
  SkinHealthScore,
  SkinDimensions,
  FitzpatrickType,
  LifestyleFactors,
  MedicalFlag,
} from '@/types/ai-treatment';
import { calculateSkinHealthScore, detectAgingPatterns, rankTreatmentPriorities } from '@/lib/ai/skin-analysis';
import { getMedicalWarnings } from '@/lib/consultation/conditional-logic-v2';

// ── MAIN ORCHESTRATOR ──

export async function runAuraScan(
  intakeData: Partial<ConsultationFormData>,
  medicalData?: Partial<MedicalHistoryFormData>
): Promise<AuraScanResult> {
  const scanId = `aura_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const age = calculateAge(intakeData.dob);
  const concerns = mapIntakeConcerns(intakeData.skinConcerns as string[] || []);
  const lifestyle = buildLifestyleFactors(medicalData);
  const fitzpatrickType = mapSkinTypeToFitzpatrick(intakeData.skinType as string);

  // 1. Calculate skin health score (pure computation)
  const skinHealthScore = calculateSkinHealthScore({
    age,
    skinType: fitzpatrickType,
    concerns,
    lifestyle,
    currentSkincare: mapSkincareLevel(intakeData),
    recentTreatments: extractRecentTreatments(intakeData.treatmentHistory as string),
    selfRatedHydration: 3 as 1 | 2 | 3 | 4 | 5,
    selfRatedTexture: 3 as 1 | 2 | 3 | 4 | 5,
    selfRatedTone: 3 as 1 | 2 | 3 | 4 | 5,
    selfRatedFirmness: 3 as 1 | 2 | 3 | 4 | 5,
  });

  // 2. Detect aging patterns
  const agingPatterns = detectAgingPatterns(age, concerns, lifestyle);

  // 3. Rank treatment priorities
  const treatmentPriorities = rankTreatmentPriorities(concerns, skinHealthScore, age);

  // 4. Build Aura Score
  const auraScore = calculateAuraScore(skinHealthScore, age, fitzpatrickType);

  // 5. Analyze zones
  const targetAreas = (intakeData.targetAreas as string[]) || [];
  const zoneAnalysis = analyzeZones(targetAreas, concerns, skinHealthScore, age);

  // 6. Detect concerns
  const detectedConcerns = detectConcerns(concerns, zoneAnalysis, skinHealthScore);

  // 7. Build predictions
  const predictiveMetrics = buildPredictiveMetrics(auraScore, concerns, age, lifestyle);

  // 8. Assess treatment readiness
  const treatmentReadiness = assessTreatmentReadiness(medicalData);

  // 9. Get medical flags
  const medicalFlags = buildMedicalFlags(medicalData);

  // 10. Assemble full skin analysis
  const skinAnalysis: SkinAnalysis = {
    fitzpatrickType,
    fitzpatrickDescription: `Fitzpatrick Type ${fitzpatrickType}`,
    glogauScale: age < 30 ? 1 : age < 50 ? 2 : age < 60 ? 3 : 4,
    glogauDescription: '',
    skinHealthScore,
    agingPatterns,
    treatmentPriority: treatmentPriorities,
    skincareRoutine: { morning: [], evening: [], weekly: [] },
    benchmarkComparison: {
      ageGroup: `${Math.floor(age / 10) * 10}s`,
      percentile: auraScore.percentile,
      areasBetterThanPeers: [],
      areasForImprovement: concerns.map((c) => c.replace(/_/g, ' ')),
    },
  };

  // 11. Build AURA device-style 5-category analysis
  const auraDeviceAnalysis = buildAuraDeviceAnalysis(skinHealthScore, concerns, age);

  return {
    scanId,
    timestamp: new Date().toISOString(),
    auraScore,
    auraDeviceAnalysis,
    zoneAnalysis,
    detectedConcerns,
    predictiveMetrics,
    treatmentReadiness,
    skinAnalysis,
    medicalFlags,
  };
}

// ── AURA SCORE CALCULATION ──

export function calculateAuraScore(
  skinHealth: SkinHealthScore,
  age: number,
  fitzpatrick: FitzpatrickType
): AuraScore {
  const overall = skinHealth.overall;
  const grade = scoreToGrade(overall);
  const label = gradeToLabel(grade);

  // Skin age estimation: base on age, adjust by score
  const scoreRatio = overall / 70; // 70 is "average" baseline
  const skinAge = Math.round(age + (1 - scoreRatio) * 10);
  const skinAgeDelta = skinAge - age;

  // Percentile: how does this score compare to peers
  const percentile = calculatePercentile(overall, age);

  return {
    overall,
    grade,
    label,
    breakdown: skinHealth.dimensions,
    skinAge,
    chronologicalAge: age,
    skinAgeDelta,
    percentile,
  };
}

function scoreToGrade(score: number): AuraGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function gradeToLabel(grade: AuraGrade): string {
  const labels: Record<AuraGrade, string> = {
    'A+': 'Exceptional',
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Needs Attention',
    F: 'Requires Intervention',
  };
  return labels[grade];
}

function calculatePercentile(score: number, age: number): number {
  // Simple age-adjusted percentile estimation
  // Younger people have naturally higher scores, so we normalize
  const ageAdjustedBaseline = Math.max(40, 85 - (age - 25) * 0.5);
  const delta = score - ageAdjustedBaseline;
  return Math.round(Math.max(5, Math.min(99, 50 + delta * 2)));
}

// ── ZONE ANALYSIS ──

const ZONE_DISPLAY_NAMES: Record<string, FacialZone> = {
  forehead: 'forehead',
  temples: 'temples_left',
  'around-eyes': 'periorbital_left',
  cheeks: 'cheeks_left',
  nose: 'chin', // map nose to chin zone for simplicity
  'upper-lip': 'lips',
  chin: 'chin',
  jawline: 'jawline',
  neck: 'neck',
  decollete: 'decolletage',
};

const ZONE_LABELS: Record<FacialZone, string> = {
  forehead: 'Forehead',
  glabella: 'Between Brows',
  periorbital_left: 'Left Eye Area',
  periorbital_right: 'Right Eye Area',
  temples_left: 'Left Temple',
  temples_right: 'Right Temple',
  cheeks_left: 'Left Cheek',
  cheeks_right: 'Right Cheek',
  nasolabial_left: 'Left Smile Line',
  nasolabial_right: 'Right Smile Line',
  lips: 'Lips',
  marionette_left: 'Left Marionette',
  marionette_right: 'Right Marionette',
  jawline: 'Jawline',
  chin: 'Chin',
  neck: 'Neck',
  decolletage: 'Decolletage',
};

function analyzeZones(
  targetAreas: string[],
  concerns: SkinConcern[],
  skinHealth: SkinHealthScore,
  age: number
): ZoneAnalysis[] {
  const zones: ZoneAnalysis[] = [];

  for (const area of targetAreas) {
    const facialZone = ZONE_DISPLAY_NAMES[area];
    if (!facialZone) continue;

    // Deterministic variance keeps results stable between runs for the same intake.
    const variance = zoneVarianceSeed(facialZone, age, concerns);
    const zoneScore = Math.round(
      Math.max(20, Math.min(95, skinHealth.overall + variance))
    );

    // Skin age for this zone
    const zoneSkinAge = Math.round(age + (1 - zoneScore / 70) * 8);

    // Map concerns to this zone
    const zoneConcerns = concerns.map((c, i) => ({
      type: c.replace(/_/g, ' '),
      severity: Math.round(Math.max(20, 100 - zoneScore + i * 5)),
      treatmentPriority: Math.min(5, i + 1),
    }));

    // Recommendations based on zone
    const recommendations = getZoneRecommendations(facialZone, concerns, age);

    zones.push({
      zone: facialZone,
      zoneName: ZONE_LABELS[facialZone] || facialZone,
      overallScore: zoneScore,
      skinAge: zoneSkinAge,
      concerns: zoneConcerns.slice(0, 3), // Top 3 concerns per zone
      recommendations,
    });
  }

  // If no zones selected, add defaults
  if (zones.length === 0) {
    const defaultZones: FacialZone[] = ['forehead', 'cheeks_left', 'jawline'];
    for (const zone of defaultZones) {
      zones.push({
        zone,
        zoneName: ZONE_LABELS[zone],
        overallScore: skinHealth.overall,
        skinAge: age,
        concerns: [],
        recommendations: [],
      });
    }
  }

  return zones;
}

function zoneVarianceSeed(zone: FacialZone, age: number, concerns: SkinConcern[]): number {
  const signature = `${zone}|${age}|${concerns.slice().sort().join(',')}`;
  let hash = 0;
  for (let index = 0; index < signature.length; index += 1) {
    hash = ((hash << 5) - hash + signature.charCodeAt(index)) | 0;
  }

  return (Math.abs(hash) % 21) - 10;
}

function getZoneRecommendations(
  zone: FacialZone,
  concerns: SkinConcern[],
  age: number
): string[] {
  const recs: string[] = [];

  if (['forehead', 'glabella'].includes(zone)) {
    if (age >= 30) recs.push('Botox for expression lines');
    if (concerns.includes('texture')) recs.push('RF Microneedling for skin renewal');
  }
  if (['periorbital_left', 'periorbital_right'].includes(zone)) {
    recs.push('Botox for crow\'s feet');
    if (concerns.includes('dark_circles')) recs.push('Filler for tear trough');
  }
  if (['cheeks_left', 'cheeks_right'].includes(zone)) {
    if (concerns.includes('volume_loss') || age >= 40) recs.push('Dermal filler for volume restoration');
    if (concerns.includes('pigmentation')) recs.push('PicoWay for pigmentation');
  }
  if (zone === 'jawline') {
    if (concerns.includes('laxity')) recs.push('Sofwave for skin tightening');
    recs.push('RF Microneedling for definition');
  }
  if (zone === 'lips') {
    if (concerns.includes('lip_enhancement')) recs.push('Lip filler for volume and definition');
  }
  if (zone === 'neck') {
    recs.push('Sofwave neck treatment');
    recs.push('PRX-T33 for texture improvement');
  }

  return recs.length > 0 ? recs : ['HydraFacial for overall skin health'];
}

// ── CONCERN DETECTION ──

function detectConcerns(
  concerns: SkinConcern[],
  zones: ZoneAnalysis[],
  skinHealth: SkinHealthScore
): AuraConcern[] {
  return concerns.map((concern, i) => {
    const relatedZones = zones
      .filter((z) => z.concerns.some((c) => c.type === concern.replace(/_/g, ' ')))
      .map((z) => z.zone);

    const dimensionScore = getConcernDimensionScore(concern, skinHealth.dimensions);
    const severity: ConcernSeverity =
      dimensionScore < 40 ? 'severe' : dimensionScore < 60 ? 'moderate' : 'mild';
    const urgency: ConcernUrgency =
      severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low';

    return {
      id: `concern_${concern}_${i}`,
      concern,
      severity,
      score: Math.round(100 - dimensionScore),
      zones: relatedZones.length > 0 ? relatedZones : ['cheeks_left'],
      trending: 'stable' as const,
      urgency,
      description: getConcernDescription(concern, severity),
      clinicalNote: getConcernClinicalNote(concern, severity),
    };
  });
}

function getConcernDimensionScore(
  concern: SkinConcern,
  dims: SkinDimensions
): number {
  const mapping: Partial<Record<SkinConcern, keyof SkinDimensions>> = {
    wrinkles: 'firmness',
    volume_loss: 'firmness',
    acne: 'clarity',
    scarring: 'texture',
    pigmentation: 'tone',
    redness: 'tone',
    texture: 'texture',
    pores: 'texture',
    laxity: 'elasticity',
  };
  const key = mapping[concern];
  return key ? dims[key] : 60;
}

function getConcernDescription(concern: SkinConcern, severity: ConcernSeverity): string {
  const descriptions: Partial<Record<SkinConcern, Record<ConcernSeverity, string>>> = {
    wrinkles: {
      mild: 'Fine lines are beginning to appear, mainly visible with facial expressions.',
      moderate: 'Lines are visible at rest and deepen with expressions. Early intervention can prevent further progression.',
      severe: 'Deep lines and wrinkles are present at rest. A combination approach will yield the best results.',
    },
    pigmentation: {
      mild: 'Minor uneven tone or a few sun spots are present.',
      moderate: 'Noticeable pigmentation irregularities across multiple areas.',
      severe: 'Significant hyperpigmentation requiring targeted treatment.',
    },
    laxity: {
      mild: 'Subtle loss of firmness, primarily around the jawline.',
      moderate: 'Visible skin laxity affecting facial contours.',
      severe: 'Significant sagging requiring collagen-stimulating treatments.',
    },
    acne: {
      mild: 'Occasional breakouts with mostly clear skin.',
      moderate: 'Regular breakouts that affect skin clarity and confidence.',
      severe: 'Persistent acne requiring a comprehensive treatment protocol.',
    },
  };
  return (
    descriptions[concern]?.[severity] ||
    `${severity.charAt(0).toUpperCase() + severity.slice(1)} ${concern.replace(/_/g, ' ')} detected.`
  );
}

function getConcernClinicalNote(concern: SkinConcern, severity: ConcernSeverity): string {
  return `${concern.replace(/_/g, ' ')} — ${severity} grade. Assessment based on intake questionnaire and zone analysis. Recommend clinical evaluation for treatment planning.`;
}

// ── PREDICTIVE METRICS ──

function buildPredictiveMetrics(
  auraScore: AuraScore,
  concerns: SkinConcern[],
  age: number,
  lifestyle: LifestyleFactors
): PredictiveMetrics {
  const baseScore = auraScore.overall;

  // Without intervention: gradual decline
  const annualDecline = lifestyle.smoking ? 4 : lifestyle.sunExposure === 'heavy' ? 3 : 2;

  const withoutIntervention = {
    sixMonths: buildPredictedState(baseScore - annualDecline / 2, age + 0.5, concerns),
    oneYear: buildPredictedState(baseScore - annualDecline, age + 1, concerns),
    threeYears: buildPredictedState(baseScore - annualDecline * 3, age + 3, concerns),
    fiveYears: buildPredictedState(baseScore - annualDecline * 5, age + 5, concerns),
  };

  // With treatment: improvement trajectory
  const withTreatment = {
    threeMonths: buildPredictedState(baseScore + 8, age - 1, concerns),
    sixMonths: buildPredictedState(baseScore + 15, age - 3, concerns),
    oneYear: buildPredictedState(baseScore + 20, age - 5, concerns),
  };

  const riskFactors = [];
  if (lifestyle.smoking) {
    riskFactors.push({
      factor: 'Smoking',
      impact: 'high' as const,
      description: 'Accelerates collagen breakdown and reduces blood flow to skin',
    });
  }
  if (lifestyle.sunExposure === 'heavy') {
    riskFactors.push({
      factor: 'Sun Exposure',
      impact: 'high' as const,
      description: 'UV radiation is the #1 cause of premature skin aging',
    });
  }
  if (lifestyle.stressLevel === 'high') {
    riskFactors.push({
      factor: 'High Stress',
      impact: 'medium' as const,
      description: 'Cortisol breaks down collagen and triggers inflammatory responses',
    });
  }
  if (lifestyle.sleepQuality === 'poor') {
    riskFactors.push({
      factor: 'Poor Sleep',
      impact: 'medium' as const,
      description: 'Skin repair happens during deep sleep — poor sleep impairs recovery',
    });
  }

  return { withoutIntervention, withTreatment, riskFactors };
}

function buildPredictedState(
  projectedScore: number,
  projectedSkinAge: number,
  currentConcerns: SkinConcern[]
): PredictedState {
  const score = Math.round(Math.max(15, Math.min(98, projectedScore)));
  return {
    auraScore: score,
    skinAge: Math.round(projectedSkinAge),
    topConcerns: currentConcerns.slice(0, 3).map((c) => c.replace(/_/g, ' ')),
    newConcernsEmerging:
      score < 50 ? ['increased sensitivity', 'deeper lines'] : [],
  };
}

// ── TREATMENT READINESS ──

function assessTreatmentReadiness(
  medicalData?: Partial<MedicalHistoryFormData>
): TreatmentReadiness {
  const requiredPrep: string[] = [];
  let readyForTreatment = true;
  let skinBarrierStatus: 'compromised' | 'adequate' | 'strong' = 'adequate';

  if (!medicalData) {
    return { readyForTreatment: true, requiredPrep: [], seasonalConsiderations: [], skinBarrierStatus: 'adequate' };
  }

  if (medicalData.pregnant || medicalData.breastfeeding) {
    readyForTreatment = false;
    requiredPrep.push('Most treatments are contraindicated during pregnancy/breastfeeding');
  }

  if (medicalData.activeSkinInfection) {
    readyForTreatment = false;
    requiredPrep.push('Resolve active skin infection before treatment');
    skinBarrierStatus = 'compromised';
  }

  if (medicalData.isotretinoinHistory) {
    const endDate = medicalData.isotretinoinEndDate
      ? new Date(medicalData.isotretinoinEndDate)
      : null;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (!endDate || endDate > sixMonthsAgo) {
      requiredPrep.push('Wait 6 months post-isotretinoin before resurfacing treatments');
      skinBarrierStatus = 'compromised';
    }
  }

  if (medicalData.recentSunExposure) {
    requiredPrep.push('Wait 2-4 weeks after significant sun exposure before laser/peel treatments');
  }

  if (medicalData.bloodThinners) {
    requiredPrep.push('Discuss blood thinner management with physician before injectable procedures');
  }

  // Seasonal considerations
  const month = new Date().getMonth();
  const seasonalConsiderations: string[] = [];
  if (month >= 4 && month <= 8) {
    seasonalConsiderations.push('Summer months: avoid aggressive peels and laser treatments due to sun exposure risk');
    seasonalConsiderations.push('Focus on protective treatments and maintenance during sunny months');
  } else {
    seasonalConsiderations.push('Fall/Winter is ideal for laser treatments and deeper peels');
  }

  return {
    readyForTreatment,
    requiredPrep,
    seasonalConsiderations,
    skinBarrierStatus,
  };
}

// ── MEDICAL FLAGS ──

function buildMedicalFlags(
  medicalData?: Partial<MedicalHistoryFormData>
): MedicalFlag[] {
  if (!medicalData) return [];

  const warnings = getMedicalWarnings(medicalData);
  return warnings.map((w) => ({
    flag: w.message,
    severity: w.severity,
    action: w.recommendation,
    relatedTreatments: w.affectedTreatments,
  }));
}

// ── UTILITY FUNCTIONS ──

function calculateAge(dob?: string): number {
  if (!dob) return 35; // Default
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function mapIntakeConcerns(intakeConcerns: string[]): SkinConcern[] {
  const mapping: Record<string, SkinConcern> = {
    acne: 'acne',
    'aging-skin': 'wrinkles',
    hyperpigmentation: 'pigmentation',
    'skin-laxity': 'laxity',
    'unwanted-hair': 'hair_removal',
    'dull-skin': 'texture',
    'body-contouring': 'body_contouring',
    'sun-damage': 'pigmentation',
    'large-pores': 'pores',
  };
  return intakeConcerns
    .map((c) => mapping[c])
    .filter((c): c is SkinConcern => !!c);
}

function mapSkinTypeToFitzpatrick(skinType?: string): FitzpatrickType {
  // Rough mapping from basic skin type to Fitzpatrick
  // In a full implementation, this would use the questionnaire
  const mapping: Record<string, FitzpatrickType> = {
    sensitive: 1,
    normal: 2,
    dry: 2,
    combination: 3,
    oily: 3,
  };
  return mapping[skinType || 'normal'] || 3;
}

function buildLifestyleFactors(
  medicalData?: Partial<MedicalHistoryFormData>
): LifestyleFactors {
  if (!medicalData) {
    return {
      sunExposure: 'moderate',
      smoking: false,
      skincare: 'basic',
      waterIntake: 'adequate',
      sleepQuality: 'fair',
      stressLevel: 'moderate',
      exerciseFrequency: 'occasional',
    };
  }
  return {
    sunExposure: medicalData.sunProtectionHabit === 'always' ? 'minimal' : medicalData.sunProtectionHabit === 'never' ? 'heavy' : 'moderate',
    smoking: medicalData.smokingStatus === 'current',
    skincare: 'basic',
    waterIntake: medicalData.waterIntake || 'adequate',
    sleepQuality: medicalData.sleepQuality || 'fair',
    stressLevel: medicalData.stressLevel || 'moderate',
    exerciseFrequency: 'occasional',
  };
}

function mapSkincareLevel(intakeData: Partial<ConsultationFormData>): 'none' | 'basic' | 'moderate' | 'advanced' {
  // Infer from treatment history text
  const history = (intakeData.treatmentHistory as string) || '';
  if (history.toLowerCase().includes('retinol') || history.toLowerCase().includes('serum')) return 'advanced';
  if (history.toLowerCase().includes('moisturizer') || history.toLowerCase().includes('sunscreen')) return 'moderate';
  if (history.length > 0) return 'basic';
  return 'basic';
}

function extractRecentTreatments(history?: string): string[] {
  if (!history) return [];
  const keywords = [
    'hydrafacial', 'botox', 'filler', 'peel', 'laser', 'microneedling',
    'rf microneedling', 'sofwave', 'prp', 'ipl', 'picoway',
  ];
  return keywords.filter((k) => history.toLowerCase().includes(k));
}

// ── AURA device-STYLE 5-CATEGORY ANALYSIS ──

function buildAuraDeviceAnalysis(
  skinHealth: SkinHealthScore,
  concerns: SkinConcern[],
  age: number
): AuraDeviceAnalysis {
  const dims = skinHealth.dimensions;

  // Map skin dimensions to AURA device's 5 categories
  // AURA device scores: 1-5 (mild→severe) for absolute, negative=better for peer
  const categories: CategoryScore[] = [
    {
      category: 'wrinkles',
      label: 'Wrinkles',
      absoluteScore: dimensionToAuca(dims.firmness, dims.elasticity),
      peerScore: dimensionToPeer(dims.firmness, age),
      severity: scoreSeverity(dims.firmness),
      description: wrinkleDescription(dims.firmness, age),
    },
    {
      category: 'texture',
      label: 'Texture',
      absoluteScore: dimensionToAuca(dims.texture),
      peerScore: dimensionToPeer(dims.texture, age),
      severity: scoreSeverity(dims.texture),
      description: textureDescription(dims.texture),
    },
    {
      category: 'brownSpots',
      label: 'Brown Spots',
      absoluteScore: dimensionToAuca(dims.tone, dims.clarity),
      peerScore: dimensionToPeer(dims.tone, age),
      severity: scoreSeverity(dims.tone),
      description: brownSpotsDescription(dims.tone, concerns),
    },
    {
      category: 'redAreas',
      label: 'Red Areas',
      absoluteScore: dimensionToAuca(dims.clarity),
      peerScore: dimensionToPeer(dims.clarity, age),
      severity: scoreSeverity(dims.clarity),
      description: redAreasDescription(dims.clarity, concerns),
    },
    {
      category: 'pores',
      label: 'Pores',
      absoluteScore: dimensionToAuca(dims.texture, dims.hydration),
      peerScore: dimensionToPeer(dims.texture, age),
      severity: scoreSeverity(dims.texture),
      description: poresDescription(dims.texture, dims.hydration),
    },
  ];

  // Weighted composite (matches AURA device's "Skin Score")
  const weights = [0.25, 0.20, 0.20, 0.15, 0.20]; // wrinkles, texture, brown, red, pores
  const compositeSkinScore = Math.round(
    categories.reduce((sum, cat, i) => sum + cat.peerScore * weights[i], 0) * 10
  ) / 10;

  return {
    categories,
    compositeSkinScore,
    scoringMode: 'absolute',
  };
}

/** Convert 0-100 skin dimension to AURA device 1-5 scale (inverted: high dim = low severity) */
function dimensionToAuca(...dims: number[]): number {
  const avg = dims.reduce((a, b) => a + b, 0) / dims.length;
  // 100→1.0 (mild), 0→5.0 (severe)
  return Math.round((5 - (avg / 100) * 4) * 10) / 10;
}

/** Convert dimension to peer-comparative score (-3 to +3, negative = better) */
function dimensionToPeer(dim: number, age: number): number {
  // Baseline expected score for age
  const expected = Math.max(30, 85 - (age - 25) * 0.6);
  const delta = dim - expected;
  // Map to -3 → +3 range
  return Math.round(Math.max(-3, Math.min(3, -delta / 15)) * 10) / 10;
}

function scoreSeverity(dim: number): ConcernSeverity {
  if (dim >= 70) return 'mild';
  if (dim >= 45) return 'moderate';
  return 'severe';
}

function wrinkleDescription(firmness: number, age: number): string {
  if (firmness >= 75) return 'Minimal lines, skin appears smooth and firm.';
  if (firmness >= 55) return 'Moderate lines visible at rest, primarily in expression areas.';
  return 'Deep wrinkles present at rest. Collagen-stimulating treatments recommended.';
}

function textureDescription(texture: number): string {
  if (texture >= 75) return 'Smooth, even skin surface with minimal irregularity.';
  if (texture >= 55) return 'Some roughness and unevenness detectable.';
  return 'Significant texture irregularities requiring resurfacing treatment.';
}

function brownSpotsDescription(tone: number, concerns: SkinConcern[]): string {
  if (tone >= 75) return 'Even skin tone with minimal pigmentation irregularities.';
  if (concerns.includes('pigmentation')) return 'Noticeable hyperpigmentation and uneven tone requiring targeted treatment.';
  return 'Moderate brown spots and uneven pigmentation detected.';
}

function redAreasDescription(clarity: number, concerns: SkinConcern[]): string {
  if (clarity >= 75) return 'Clear complexion with minimal redness.';
  if (concerns.includes('redness') || concerns.includes('acne')) return 'Visible redness and vascular patterns requiring attention.';
  return 'Some redness detected, possibly related to sensitivity or vascular concerns.';
}

function poresDescription(texture: number, hydration: number): string {
  if (texture >= 75 && hydration >= 70) return 'Refined pores with good hydration balance.';
  if (texture >= 55) return 'Moderately visible pores, especially in the T-zone.';
  return 'Enlarged pores requiring deep cleansing and pore-refining treatments.';
}
