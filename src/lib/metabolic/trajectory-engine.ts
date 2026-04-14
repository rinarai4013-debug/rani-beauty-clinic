import type { MetabolicIntake, MetabolicRecommendation, MetabolicTrack } from '@/lib/metabolic/matrix';

type Tier = 'start' | 'transform' | 'elite';

export interface TrajectorySnapshot {
  month: number;
  bodyCompositionProgressPct: number;
  symptomReliefPct: number;
  metabolicStabilityPct: number;
  confidence: 'moderate' | 'high';
  narrative: string;
}

export interface TreatmentTrajectory {
  horizonMonths: number;
  withProtocol: TrajectorySnapshot[];
  withoutProtocol: TrajectorySnapshot[];
  comparisonSummary: string;
  photoSimulation: {
    withProtocol: string;
    withoutProtocol: string;
  };
}

interface TrackCurve {
  withBody: number;
  withSymptoms: number;
  withStability: number;
  withoutBody: number;
  withoutSymptoms: number;
  withoutStability: number;
}

const CURVES: Record<MetabolicTrack, TrackCurve> = {
  glp1: {
    withBody: 6.5,
    withSymptoms: 6.2,
    withStability: 5.8,
    withoutBody: 1.7,
    withoutSymptoms: 1.2,
    withoutStability: 1.4,
  },
  hormones: {
    withBody: 3.8,
    withSymptoms: 6.5,
    withStability: 6.3,
    withoutBody: 1.3,
    withoutSymptoms: 1.5,
    withoutStability: 1.6,
  },
  peptides: {
    withBody: 3.1,
    withSymptoms: 5.5,
    withStability: 5.2,
    withoutBody: 1.2,
    withoutSymptoms: 1.1,
    withoutStability: 1.4,
  },
  hybrid: {
    withBody: 5.8,
    withSymptoms: 7.2,
    withStability: 6.8,
    withoutBody: 1.5,
    withoutSymptoms: 1.3,
    withoutStability: 1.4,
  },
};

const TIER_MULTIPLIER: Record<Tier, number> = {
  start: 1,
  transform: 1.2,
  elite: 1.35,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function confidenceFor(intake: MetabolicIntake): 'moderate' | 'high' {
  return intake.labs.baselineLabsCompleted ? 'high' : 'moderate';
}

function riskDrag(intake: MetabolicIntake): number {
  const flags = intake.medicalFlags;
  const activeFlags = [
    flags.pregnant,
    flags.breastfeeding,
    flags.thyroidCancerHistory,
    flags.pancreatitisHistory,
    flags.gallbladderDisease,
    flags.uncontrolledHypertension,
    flags.severeDepression,
    flags.eatingDisorderHistory,
  ].filter(Boolean).length;
  return activeFlags * 0.9;
}

function withNarrative(track: MetabolicTrack, month: number) {
  if (track === 'glp1') return `Month ${month}: appetite control and body-composition momentum should be visibly stronger with protocol adherence.`;
  if (track === 'hormones') return `Month ${month}: endocrine stability and energy consistency are expected to improve with lab-guided adjustments.`;
  if (track === 'peptides') return `Month ${month}: recovery quality and inflammation-control trend should improve with cycle compliance.`;
  return `Month ${month}: multi-axis improvement expected (metabolic + endocrine + recovery) with synchronized protocol execution.`;
}

function withoutNarrative(track: MetabolicTrack, month: number) {
  if (track === 'glp1') return `Month ${month}: progress may plateau without appetite-regulation support and structured dose governance.`;
  if (track === 'hormones') return `Month ${month}: symptoms may fluctuate without endocrine protocol stabilization.`;
  if (track === 'peptides') return `Month ${month}: recovery/inflammation trajectory is likely slower without peptide cycle support.`;
  return `Month ${month}: blended symptom clusters may persist without coordinated treatment across all axes.`;
}

export function buildTreatmentTrajectory(
  intake: MetabolicIntake,
  recommendation: MetabolicRecommendation,
  tier: Tier = 'start',
  horizonMonths = 6,
): TreatmentTrajectory {
  const track = recommendation.recommendedTrack;
  const curve = CURVES[track];
  const tierMultiplier = TIER_MULTIPLIER[tier];
  const adherenceFactor = recommendation.fulfillment.recommended === 'home' ? 0.95 : 1;
  const drag = riskDrag(intake);
  const confidence = confidenceFor(intake);

  const withProtocol: TrajectorySnapshot[] = [];
  const withoutProtocol: TrajectorySnapshot[] = [];

  for (let month = 1; month <= horizonMonths; month += 1) {
    const monthWeight = Math.log2(month + 1);

    const withBody = clamp(
      Math.round(month * curve.withBody * tierMultiplier * adherenceFactor - drag * monthWeight),
      3,
      95,
    );
    const withSymptoms = clamp(
      Math.round(month * curve.withSymptoms * tierMultiplier - drag * 0.8 * monthWeight),
      4,
      95,
    );
    const withStability = clamp(
      Math.round(month * curve.withStability * tierMultiplier - drag * 0.7 * monthWeight),
      6,
      95,
    );

    const withoutBody = clamp(
      Math.round(month * curve.withoutBody - drag * 0.45 * monthWeight),
      1,
      32,
    );
    const withoutSymptoms = clamp(
      Math.round(month * curve.withoutSymptoms - drag * 0.35 * monthWeight),
      1,
      28,
    );
    const withoutStability = clamp(
      Math.round(month * curve.withoutStability - drag * 0.4 * monthWeight),
      1,
      30,
    );

    withProtocol.push({
      month,
      bodyCompositionProgressPct: withBody,
      symptomReliefPct: withSymptoms,
      metabolicStabilityPct: withStability,
      confidence,
      narrative: withNarrative(track, month),
    });

    withoutProtocol.push({
      month,
      bodyCompositionProgressPct: withoutBody,
      symptomReliefPct: withoutSymptoms,
      metabolicStabilityPct: withoutStability,
      confidence: 'moderate',
      narrative: withoutNarrative(track, month),
    });
  }

  const finalWith = withProtocol[withProtocol.length - 1];
  const finalWithout = withoutProtocol[withoutProtocol.length - 1];
  const delta = finalWith.bodyCompositionProgressPct - finalWithout.bodyCompositionProgressPct;

  return {
    horizonMonths,
    withProtocol,
    withoutProtocol,
    comparisonSummary: `${track.toUpperCase()} track projects ~${delta}% better body-composition progress by month ${horizonMonths} with treatment vs no-treatment path.`,
    photoSimulation: {
      withProtocol: `Provider-grade simulation prompt: ${track} track, ${tier} tier, month ${horizonMonths}, show healthier contour, reduced inflammation markers, improved skin vitality, realistic clinical lighting, no over-editing.`,
      withoutProtocol: `Provider-grade simulation prompt: same subject, no-treatment path by month ${horizonMonths}, limited contour change, persistent inflammation cues, realistic baseline lighting, no exaggerated deterioration.`,
    },
  };
}

export type PeptideTrajectoryTier = 'foundation' | 'performance' | 'elite';

export function buildPeptideTierTrajectory(
  tier: PeptideTrajectoryTier,
  horizonMonths = 6,
): TreatmentTrajectory {
  const tierBoost: Record<PeptideTrajectoryTier, number> = {
    foundation: 0.9,
    performance: 1.1,
    elite: 1.25,
  };

  const boost = tierBoost[tier];
  const withProtocol: TrajectorySnapshot[] = [];
  const withoutProtocol: TrajectorySnapshot[] = [];

  for (let month = 1; month <= horizonMonths; month += 1) {
    const factor = month * boost;
    withProtocol.push({
      month,
      bodyCompositionProgressPct: clamp(Math.round(factor * 3.2), 3, 88),
      symptomReliefPct: clamp(Math.round(factor * 5.8), 4, 92),
      metabolicStabilityPct: clamp(Math.round(factor * 5.3), 5, 90),
      confidence: 'moderate',
      narrative: `Month ${month}: peptide ${tier} trajectory projects improved recovery/inflammation control as tolerated.`,
    });
    withoutProtocol.push({
      month,
      bodyCompositionProgressPct: clamp(Math.round(month * 1.3), 1, 30),
      symptomReliefPct: clamp(Math.round(month * 1.2), 1, 26),
      metabolicStabilityPct: clamp(Math.round(month * 1.4), 1, 28),
      confidence: 'moderate',
      narrative: `Month ${month}: without peptide protocol, recovery and inflammation trends are likely slower.`,
    });
  }

  const finalWith = withProtocol[withProtocol.length - 1];
  const finalWithout = withoutProtocol[withoutProtocol.length - 1];

  return {
    horizonMonths,
    withProtocol,
    withoutProtocol,
    comparisonSummary: `Peptide ${tier} trajectory projects ~${finalWith.symptomReliefPct - finalWithout.symptomReliefPct}% better symptom relief by month ${horizonMonths}.`,
    photoSimulation: {
      withProtocol: `Provider-grade simulation prompt: peptide ${tier} protocol, month ${horizonMonths}, show reduced inflammation cues, stronger vitality, realistic texture and lighting.`,
      withoutProtocol: `Provider-grade simulation prompt: no peptide protocol by month ${horizonMonths}, slower recovery cues and flatter vitality trend, realistic baseline lighting.`,
    },
  };
}
