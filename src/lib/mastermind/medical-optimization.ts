import type { ConsultationSubmitData } from '@/lib/consultation/schema';
import {
  BOOMRX_FORMULARY_ITEMS,
  type BoomRxCategory,
} from '@/lib/medical/boomrx-formulary';
import { recommendBoomRxBySymptoms } from '@/lib/medical/symptom-product-matrix';
import {
  generateFullMetabolicRecommendation,
  type MetabolicIntake,
  type MetabolicTrack,
} from '@/lib/metabolic/matrix';
import type { MastermindMedicalOptimization } from '@/types/mastermind';

type MedicalOfferSummary = {
  requestedTrack: MetabolicTrack;
  normalizedSymptoms: string[];
  providerReviewRequired: boolean;
  recommendedProducts: MastermindMedicalOptimization['recommendedProducts'];
  projectedMonthlyRetail: number;
  projectedMonthlyCOGS: number;
  projectedMonthlyGrossProfit: number;
  averageMarginPercent: number;
};

const CONCERN_TO_MEDICAL_SYMPTOM: Record<string, string> = {
  acne: 'acne-breakouts',
  'aging-skin': 'poor-sleep-recovery',
  hyperpigmentation: 'hyperpigmentation-skin-dullness',
  'skin-laxity': 'muscle-loss-low-performance',
  'dull-skin': 'hyperpigmentation-skin-dullness',
  'body-contouring': 'difficulty-losing-weight',
  'sun-damage': 'hyperpigmentation-skin-dullness',
  'large-pores': 'acne-breakouts',
};

const METABOLIC_GOAL_HINTS: Record<MetabolicTrack, Array<MetabolicIntake['goals'][number]>> = {
  glp1: ['weight-loss', 'body-recomposition', 'metabolic-health'],
  hormones: ['hormone-balance', 'energy', 'longevity'],
  peptides: ['recovery', 'performance', 'longevity'],
  hybrid: ['weight-loss', 'hormone-balance', 'recovery'],
};

const METABOLIC_SYMPTOM_HINTS: Record<MetabolicTrack, Array<MetabolicIntake['symptoms'][number]>> = {
  glp1: ['appetite-dysregulation', 'sugar-cravings', 'weight-plateau'],
  hormones: ['fatigue', 'brain-fog', 'low-libido', 'poor-sleep', 'mood-swings'],
  peptides: ['slow-recovery', 'inflammation', 'muscle-loss', 'fatigue'],
  hybrid: ['appetite-dysregulation', 'fatigue', 'poor-sleep', 'slow-recovery'],
};

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function goalsText(intakeData: Partial<ConsultationSubmitData>): string {
  return stringList(intakeData.goals).join(' ') || String(intakeData.goals || '');
}

function joinedIntakeText(intakeData: Partial<ConsultationSubmitData>): string {
  const extras = intakeData as Record<string, unknown>;
  return [
    ...stringList(intakeData.skinConcerns),
    ...stringList(intakeData.treatmentInterests),
    goalsText(intakeData),
    String(intakeData.medicalHistory || ''),
    String(intakeData.medications || ''),
    String(intakeData.clinicalNotes || ''),
    String(extras.currentMeds || ''),
  ]
    .join(' ')
    .toLowerCase();
}

export function deriveRequestedMedicalTrack(
  intakeData: Partial<ConsultationSubmitData>,
): MetabolicTrack {
  const interests = stringList(intakeData.treatmentInterests).map((item) => item.toLowerCase());
  const text = joinedIntakeText(intakeData);

  const wantsGlp1 =
    interests.some((item) => item.includes('glp') || item.includes('weight')) ||
    /\b(weight|fat loss|body contour|food noise|craving|a1c|insulin|pcos)\b/i.test(text);
  const wantsHormones =
    interests.some((item) => item.includes('hormone') || item.includes('trt') || item.includes('thyroid')) ||
    /\b(hormone|trt|thyroid|menopause|perimenopause|libido|testosterone)\b/i.test(text);
  const wantsPeptides =
    interests.some((item) => item.includes('peptide') || item.includes('nad') || item.includes('bpc') || item.includes('cjc')) ||
    /\b(peptide|nad|bpc|cjc|ipamorelin|sermorelin|recovery|inflammation|longevity|performance)\b/i.test(text);

  if (wantsGlp1 && (wantsHormones || wantsPeptides)) return 'hybrid';
  if (wantsGlp1) return 'glp1';
  if (wantsHormones) return 'hormones';
  if (wantsPeptides) return 'peptides';

  // Most aesthetic consultations still have recovery, inflammation,
  // pigment, or skin-quality adjacency. Default to peptide/wellness,
  // not GLP-1, so we do not over-route weight-loss medicine.
  return 'peptides';
}

export function normalizeClinicalSymptoms(
  intakeData: Partial<ConsultationSubmitData>,
): string[] {
  const mapped = new Set<string>();
  const concerns = stringList(intakeData.skinConcerns).map((item) => item.toLowerCase());
  const text = joinedIntakeText(intakeData);

  for (const concern of concerns) {
    const mappedSymptom = CONCERN_TO_MEDICAL_SYMPTOM[concern];
    if (mappedSymptom) mapped.add(mappedSymptom);
  }

  if (/\b(weight|fat loss|food noise|craving|body contour)\b/i.test(text) || concerns.includes('body-contouring')) {
    mapped.add('difficulty-losing-weight');
    mapped.add('food-noise-cravings');
  }
  if (/\b(energy|fatigue|burnout|brain fog|focus)\b/i.test(text)) {
    mapped.add('fatigue-low-energy');
    mapped.add('brain-fog-focus');
  }
  if (/\b(recovery|heal|injury|inflammation|joint|aches)\b/i.test(text)) {
    mapped.add('slow-injury-healing');
    mapped.add('inflammation-joint-pain');
  }
  if (/\b(sleep|insomnia)\b/i.test(text)) {
    mapped.add('poor-sleep-recovery');
  }
  if (/\b(libido|sexual|testosterone)\b/i.test(text)) {
    mapped.add('low-libido-sexual-dysfunction');
  }
  if (/\b(menopause|perimenopause|hot flashes)\b/i.test(text)) {
    mapped.add('perimenopause-menopause');
  }

  if (mapped.size === 0) {
    mapped.add('fatigue-low-energy');
    mapped.add('hyperpigmentation-skin-dullness');
  }

  return Array.from(mapped);
}

function trackFallbackCategories(track: MetabolicTrack): BoomRxCategory[] {
  switch (track) {
    case 'glp1':
      return ['glp1', 'wellness'];
    case 'hormones':
      return ['hormone', 'sexual-health', 'wellness'];
    case 'peptides':
      return ['peptide', 'wellness'];
    case 'hybrid':
      return ['glp1', 'hormone', 'peptide', 'wellness'];
  }
}

function catalogFallbackOffers(
  requestedTrack: MetabolicTrack,
  normalizedSymptoms: string[],
): MedicalOfferSummary {
  const categoryPriority = trackFallbackCategories(requestedTrack);
  const ranked = [...BOOMRX_FORMULARY_ITEMS]
    .filter((item) => categoryPriority.includes(item.category))
    .sort((left, right) => {
      if (right.suggestedGrossProfit !== left.suggestedGrossProfit) {
        return right.suggestedGrossProfit - left.suggestedGrossProfit;
      }
      return right.suggestedRetail - left.suggestedRetail;
    });

  const recommendedProducts = (ranked.length > 0 ? ranked : BOOMRX_FORMULARY_ITEMS)
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      score: 1,
      suggestedRetail: item.suggestedRetail,
      suggestedGrossProfit: item.suggestedGrossProfit,
      suggestedMarginPercent: item.suggestedMarginPercent,
      rationale: ['catalog-fallback'],
    }));

  const projectedMonthlyRetail = recommendedProducts.reduce((sum, item) => sum + item.suggestedRetail, 0);
  const projectedMonthlyGrossProfit = recommendedProducts.reduce((sum, item) => sum + item.suggestedGrossProfit, 0);
  const projectedMonthlyCOGS = Number(Math.max(projectedMonthlyRetail - projectedMonthlyGrossProfit, 0).toFixed(2));
  const averageMarginPercent = Number(
    (
      recommendedProducts.reduce((sum, item) => sum + item.suggestedMarginPercent, 0) /
      Math.max(recommendedProducts.length, 1)
    ).toFixed(1),
  );

  return {
    requestedTrack,
    normalizedSymptoms,
    providerReviewRequired: true,
    recommendedProducts,
    projectedMonthlyRetail,
    projectedMonthlyCOGS,
    projectedMonthlyGrossProfit,
    averageMarginPercent,
  };
}

export function buildMedicalOffers(
  intakeData: Partial<ConsultationSubmitData>,
  requestedTrack = deriveRequestedMedicalTrack(intakeData),
): MedicalOfferSummary {
  const normalizedSymptoms = normalizeClinicalSymptoms(intakeData);

  try {
    const bundle = recommendBoomRxBySymptoms({
      symptoms: normalizedSymptoms,
      goals: [goalsText(intakeData)].filter(Boolean),
      requestedTrack,
      limit: 10,
    });

    return {
      requestedTrack,
      normalizedSymptoms: bundle.normalizedSymptoms,
      providerReviewRequired: true,
      recommendedProducts: bundle.recommendations.map((candidate) => ({
        id: candidate.item.id,
        label: candidate.item.label,
        category: candidate.item.category,
        score: candidate.score,
        suggestedRetail: candidate.item.suggestedRetail,
        suggestedGrossProfit: candidate.item.suggestedGrossProfit,
        suggestedMarginPercent: candidate.item.suggestedMarginPercent,
        rationale: candidate.rationale,
      })),
      projectedMonthlyRetail: bundle.projectedMonthlyRetail,
      projectedMonthlyCOGS: bundle.projectedMonthlyCOGS,
      projectedMonthlyGrossProfit: bundle.projectedMonthlyGrossProfit,
      averageMarginPercent: bundle.averageMarginPercent,
    };
  } catch {
    return catalogFallbackOffers(requestedTrack, normalizedSymptoms);
  }
}

function buildMetabolicIntake(
  intakeData: Partial<ConsultationSubmitData>,
  requestedTrack: MetabolicTrack,
): MetabolicIntake {
  const extras = intakeData as Record<string, unknown>;
  const currentMeds =
    typeof extras.medications === 'string'
      ? extras.medications
      : typeof extras.currentMeds === 'string'
        ? extras.currentMeds
        : '';
  const baselineLabsCompleted =
    extras.requiresLabWork === true ||
    extras.baselineLabsCompleted === true;

  return {
    firstName: intakeData.firstName || 'Unknown',
    lastName: intakeData.lastName || 'Unknown',
    email: intakeData.email || 'unknown@rani.local',
    phone: typeof intakeData.phone === 'string' ? intakeData.phone : undefined,
    goals: METABOLIC_GOAL_HINTS[requestedTrack],
    symptoms: METABOLIC_SYMPTOM_HINTS[requestedTrack],
    preferredTrack: requestedTrack,
    fulfillmentPreference: 'clinic',
    currentMeds,
    notes: typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes : '',
    source: 'mastermind-plan-generator',
    medicalFlags: {
      pregnant: intakeData.pregnant === true,
      breastfeeding: intakeData.breastfeeding === true,
      thyroidCancerHistory:
        intakeData.thyroidCancerHistory === true ||
        intakeData.medullaryThyroidCancerFamily === true ||
        /\b(medullary|thyroid cancer|MTC)\b/i.test(String(intakeData.medicalHistory || '')),
      pancreatitisHistory:
        intakeData.pancreatitisHistory === true ||
        /\bpancreatitis\b/i.test(String(intakeData.medicalHistory || '')) ||
        /\bpancreatitis\b/i.test(String(currentMeds || '')),
      gallbladderDisease:
        intakeData.gallbladderDisease === true ||
        /\b(gallstone|gallbladder|cholecyst)/i.test(String(intakeData.medicalHistory || '')),
      uncontrolledHypertension:
        intakeData.uncontrolledHypertension === true ||
        /\buncontrolled hypertension\b|\bsevere htn\b/i.test(String(intakeData.medicalHistory || '')),
      severeDepression:
        intakeData.severeDepression === true ||
        /\bsevere depression\b|\bsuicidal\b/i.test(String(intakeData.medicalHistory || '')),
      eatingDisorderHistory:
        intakeData.eatingDisorderHistory === true ||
        /\b(anorexia|bulimia|binge eating)\b/i.test(String(intakeData.medicalHistory || '')),
    },
    labs: {
      baselineLabsCompleted,
      latestA1c: typeof extras.latestA1c === 'number' ? extras.latestA1c : undefined,
      fastingGlucose: typeof extras.fastingGlucose === 'number' ? extras.fastingGlucose : undefined,
      tsh: typeof extras.tsh === 'number' ? extras.tsh : undefined,
    },
    biometrics: {
      heightInches: typeof extras.heightInches === 'number' ? extras.heightInches : undefined,
      weightLbs: typeof extras.weightLbs === 'number' ? extras.weightLbs : undefined,
      bmi: typeof extras.bmi === 'number' ? extras.bmi : undefined,
    },
    peptideHistory: {
      priorPeptideExposure: extras.priorPeptideExposure === true,
      tolerance:
        extras.peptideTolerance === 'sensitive' ||
        extras.peptideTolerance === 'standard' ||
        extras.peptideTolerance === 'high'
          ? extras.peptideTolerance
          : 'unknown',
      preferredRoute:
        extras.peptideRoute === 'subcutaneous' ||
        extras.peptideRoute === 'intramuscular' ||
        extras.peptideRoute === 'oral'
          ? extras.peptideRoute
          : 'no-preference',
    },
  };
}

export function buildMastermindMedicalOptimization(
  intakeData: Partial<ConsultationSubmitData>,
): MastermindMedicalOptimization {
  const requestedTrack = deriveRequestedMedicalTrack(intakeData);
  const offers = buildMedicalOffers(intakeData, requestedTrack);
  const metabolicIntake = buildMetabolicIntake(intakeData, requestedTrack);
  const recommendation = generateFullMetabolicRecommendation(metabolicIntake, {
    forceTrack: requestedTrack,
  });

  const peptidePlan = recommendation.dosageFramework.personalizedPeptidePlan;

  return {
    generatedAt: new Date().toISOString(),
    requestedTrack,
    status: recommendation.status,
    recommendedTrack: recommendation.recommendedTrack,
    secondaryTracks: recommendation.secondaryTracks,
    blockedTracks: recommendation.blockedTracks,
    providerSignoffRequired: true,
    normalizedSymptoms: offers.normalizedSymptoms,
    riskFlags: recommendation.riskFlags,
    requiredNextSteps: recommendation.requiredNextSteps,
    fulfillment: recommendation.fulfillment,
    tierRecommendation: {
      tier: recommendation.tierRecommendation.tier,
      intensityScore: recommendation.tierRecommendation.intensityScore,
      rationale: recommendation.tierRecommendation.rationale,
      constrainedByStatus: recommendation.tierRecommendation.constrainedByStatus,
    },
    dosageFramework: {
      track: recommendation.dosageFramework.track,
      tier: recommendation.dosageFramework.tier,
      startRange: recommendation.dosageFramework.startRange,
      cadence: recommendation.dosageFramework.cadence,
      escalationCriteria: recommendation.dosageFramework.escalationCriteria,
      holdRules: recommendation.dosageFramework.holdRules,
      monitoringCadence: recommendation.dosageFramework.monitoringCadence,
      providerAuthorizationNote: recommendation.dosageFramework.providerAuthorizationNote,
      constrainedByStatus: recommendation.dosageFramework.constrainedByStatus,
      personalizedPeptidePlan: peptidePlan
        ? {
            strategy: peptidePlan.strategy,
            dataCompleteness: peptidePlan.dataCompleteness,
            computedFrom: peptidePlan.computedFrom,
            warnings: peptidePlan.warnings,
            candidates: peptidePlan.candidates,
          }
        : null,
    },
    recommendedProducts: offers.recommendedProducts,
    projectedMonthlyRetail: offers.projectedMonthlyRetail,
    projectedMonthlyCOGS: offers.projectedMonthlyCOGS,
    projectedMonthlyGrossProfit: offers.projectedMonthlyGrossProfit,
    averageMarginPercent: offers.averageMarginPercent,
    providerSummary:
      `${recommendation.providerHandoff.summary} ` +
      `Provider sign-off is required before dispensing or administration. ` +
      `Top BoomRx opportunity: ${offers.recommendedProducts[0]?.label || 'review catalog match'}.`,
  };
}
