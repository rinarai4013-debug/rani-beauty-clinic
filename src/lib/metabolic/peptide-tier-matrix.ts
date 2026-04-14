import type { FulfillmentOption } from '@/lib/metabolic/matrix';
import type { PeptideGoal, PeptideIntake, PeptideSymptom } from '@/lib/metabolic/peptide-intake-schema';

export type PeptideTier = 'foundation' | 'performance' | 'elite';

export interface PeptidePackageTier {
  tier: PeptideTier;
  name: string;
  compounds: string[];
  monthlyEstimate: string;
  fulfillmentAllowed: FulfillmentOption[];
  protocol: string[];
  monitoring: string[];
  bestFor: string;
}

export interface PeptideRecommendation {
  track: 'peptides';
  status: 'eligible' | 'provider-review-required' | 'ineligible';
  recommendedTier: PeptideTier;
  blockedCompounds: string[];
  riskFlags: string[];
  requiredNextSteps: string[];
  fulfillment: {
    allowed: FulfillmentOption[];
    recommended: FulfillmentOption;
    reason: string;
  };
  tiers: PeptidePackageTier[];
  providerHandoff: {
    summary: string;
    dosingFramework: string[];
    monitoringChecklist: string[];
    contraindicationNotes: string[];
    providerSignoffRequired: true;
    safetyNote: string;
  };
}

const GOAL_SET_PERFORMANCE: PeptideGoal[] = ['performance', 'longevity'];
const SYMPTOM_SET_PERFORMANCE: PeptideSymptom[] = ['inflammation', 'muscle-loss'];

const TIER_DEFINITIONS: Record<PeptideTier, Omit<PeptidePackageTier, 'fulfillmentAllowed'>> = {
  foundation: {
    tier: 'foundation',
    name: 'Peptide Foundation',
    compounds: ['BPC-157'],
    monthlyEstimate: '$249-$399',
    protocol: [
      'As tolerated, begin BPC-157 in a conservative daily cadence.',
      'If indicated, adjust cadence after 2-4 week response review.',
      'Use symptom trend + tolerance markers before any escalation.',
    ],
    monitoring: [
      'Baseline symptom index and treatment goals confirmed.',
      'Week-2 tolerance check and hydration/adverse-effect review.',
      'Week-4 provider checkpoint for protocol refinement.',
    ],
    bestFor: 'Recovery, inflammation control, gut support, and foundational tissue repair.',
  },
  performance: {
    tier: 'performance',
    name: 'Peptide Performance',
    compounds: ['CJC-1295', 'Ipamorelin', 'BPC-157'],
    monthlyEstimate: '$399-$649',
    protocol: [
      'As tolerated, bedtime GH-axis pulse with supportive daytime recovery peptide framework.',
      'If indicated, synchronize cycle updates on 4-week review intervals.',
      'Escalate only when symptom/lab checkpoints confirm readiness.',
    ],
    monitoring: [
      'Baseline labs (including IGF-1 if indicated) before GH-axis escalation.',
      'Week-4 and week-8 provider checkpoints with cycle adherence review.',
      'Cycle-close assessment before continuation or deload decisions.',
    ],
    bestFor: 'Recovery + performance goals with body composition and sleep optimization needs.',
  },
  elite: {
    tier: 'elite',
    name: 'Peptide Elite',
    compounds: ['CJC-1295', 'Ipamorelin', 'Sermorelin', 'BPC-157'],
    monthlyEstimate: '$649-$949',
    protocol: [
      'Provider-reviewed multi-compound architecture with staged phase progression.',
      'As tolerated, use cycle + deload sequencing to reduce response fatigue.',
      'If indicated, refine protocol only after objective trend review.',
    ],
    monitoring: [
      'Monthly provider governance review with safety/risk recalibration.',
      'Quarterly biomarker panel and compatibility reassessment.',
      'Adherence + side-effect telemetry captured before each escalation gate.',
    ],
    bestFor: 'High-touch longevity and performance optimization requiring physician oversight.',
  },
};

function hasAnyGoal(intake: PeptideIntake, list: PeptideGoal[]): boolean {
  return intake.goals.some((goal) => list.includes(goal));
}

function hasAnySymptom(intake: PeptideIntake, list: PeptideSymptom[]): boolean {
  return intake.symptoms.some((symptom) => list.includes(symptom));
}

export function recommendPeptideTier(intake: PeptideIntake): PeptideTier {
  const goals = intake.goals;
  const symptoms = intake.symptoms;

  const eliteByCount = goals.length >= 3;
  const eliteByMix = goals.includes('performance') && goals.includes('body-recomposition');
  if (eliteByCount || eliteByMix) return 'elite';

  const performanceByGoals = hasAnyGoal(intake, GOAL_SET_PERFORMANCE) && goals.includes('recovery');
  const performanceBySymptoms = hasAnySymptom(intake, SYMPTOM_SET_PERFORMANCE);
  if (performanceByGoals || performanceBySymptoms) return 'performance';

  if (symptoms.includes('post-surgical-healing') || symptoms.includes('tendon-injury')) {
    return 'performance';
  }

  return 'foundation';
}

function buildRiskDecision(intake: PeptideIntake, tier: PeptideTier) {
  const flags = intake.medicalFlags;
  const blockedCompounds = new Set<string>();
  const riskFlags: string[] = [];
  const requiredNextSteps: string[] = [];
  let status: PeptideRecommendation['status'] = 'eligible';

  const ghCompounds = ['CJC-1295', 'Ipamorelin', 'Sermorelin'];
  const injectableCompounds = ['BPC-157', 'CJC-1295', 'Ipamorelin', 'Sermorelin'];

  if (flags.pregnant || flags.breastfeeding) {
    status = 'ineligible';
    injectableCompounds.forEach((c) => blockedCompounds.add(c));
    riskFlags.push('Pregnancy/breastfeeding: peptide protocols are blocked pending provider-only evaluation.');
    requiredNextSteps.push('Provider-only consultation required; do not auto-assign peptide protocols.');
  }

  if (flags.organTransplant || flags.autoimmuneSuppressed) {
    status = 'ineligible';
    injectableCompounds.forEach((c) => blockedCompounds.add(c));
    riskFlags.push('Organ transplant/immunosuppression: peptide protocols blocked for safety review.');
    requiredNextSteps.push('Obtain specialist clearance prior to any peptide consideration.');
  }

  if (flags.activeCancer) {
    ghCompounds.forEach((c) => blockedCompounds.add(c));
    if (status !== 'ineligible') status = 'provider-review-required';
    riskFlags.push('Active cancer: GH-releasing peptides are blocked; foundation-only pathway requires provider review.');
    requiredNextSteps.push('Restrict to non-GH compounds pending oncology/provider approval.');
  }

  if (flags.activeInfection) {
    injectableCompounds.forEach((c) => blockedCompounds.add(c));
    if (status !== 'ineligible') status = 'provider-review-required';
    riskFlags.push('Active infection: injectable peptide starts are blocked pending clinical clearance.');
    requiredNextSteps.push('Clear active infection before initiating peptide injections.');
  }

  if (flags.bleedingDisorder) {
    injectableCompounds.forEach((c) => blockedCompounds.add(c));
    if (status !== 'ineligible') status = 'provider-review-required';
    riskFlags.push('Bleeding disorder: injectable administration requires provider review and risk mitigation.');
    requiredNextSteps.push('Confirm injection safety plan with provider before dispensing.');
  }

  let fulfillmentAllowed: FulfillmentOption[] = ['clinic', 'home'];
  const ghNeeded = tier !== 'foundation';
  if (ghNeeded && !intake.labs.baselineLabsCompleted) {
    fulfillmentAllowed = ['clinic'];
    if (status === 'eligible') status = 'provider-review-required';
    riskFlags.push('Baseline labs incomplete: home fulfillment blocked for GH-releasing peptide tiers.');
    requiredNextSteps.push('Complete baseline labs before home fulfillment can be approved.');
  }

  if (status === 'ineligible') {
    fulfillmentAllowed = ['clinic'];
  }

  if (requiredNextSteps.length === 0) {
    requiredNextSteps.push('Provider review and sign-off required before dispensing.');
  }

  return {
    status,
    blockedCompounds: Array.from(blockedCompounds),
    riskFlags,
    requiredNextSteps,
    fulfillmentAllowed,
  };
}

function buildTiers(allowed: FulfillmentOption[]): PeptidePackageTier[] {
  const baselineModes = (['clinic', 'home'] as const).filter((mode) => allowed.includes(mode));
  return (Object.values(TIER_DEFINITIONS) as Array<Omit<PeptidePackageTier, 'fulfillmentAllowed'>>).map((tier) => ({
    ...tier,
    fulfillmentAllowed:
      tier.tier === 'foundation' ? baselineModes : allowed.slice(),
  }));
}

function buildProviderHandoff(
  intake: PeptideIntake,
  recommendation: {
    status: PeptideRecommendation['status'];
    tier: PeptideTier;
    blockedCompounds: string[];
    riskFlags: string[];
    recommendedFulfillment: FulfillmentOption;
  },
): PeptideRecommendation['providerHandoff'] {
  const contraindicationNotes =
    recommendation.riskFlags.length > 0
      ? recommendation.riskFlags
      : ['No hard contraindications detected from intake; provider confirmation still required.'];

  const dosingFrameworkByTier: Record<PeptideTier, string[]> = {
    foundation: [
      'BPC-157 start dose should be selected by provider based on symptom severity and tolerance.',
      'Cadence adjustments should occur only if indicated by week-2/week-4 response trends.',
      'Escalation should be deferred when side-effect profile is not clearly stable.',
    ],
    performance: [
      'CJC-1295/Ipamorelin entry should begin conservatively, as tolerated, after baseline labs.',
      'Cycle escalation should be considered only if indicated by IGF-1/symptom checkpoints.',
      'Compound sequencing should be staggered; avoid simultaneous major dose jumps.',
    ],
    elite: [
      'Multi-compound stack should be activated only after provider compatibility review.',
      'Deload windows should be programmed if indicated to protect response durability.',
      'Any escalation should be conditional on objective improvement plus safety stability.',
    ],
  };

  return {
    summary: `${intake.firstName} ${intake.lastName}: peptide ${recommendation.tier} tier suggested, ${recommendation.recommendedFulfillment} fulfillment, goals=${intake.goals.join(', ')}, symptoms=${intake.symptoms.join(', ')}.`,
    dosingFramework: dosingFrameworkByTier[recommendation.tier],
    monitoringChecklist: [
      'Baseline labs/vitals reviewed before protocol launch.',
      'Week-2 and week-4 symptom + tolerance check-ins scheduled.',
      'Escalation gates documented before any dose complexity changes.',
      'Medication reconciliation completed prior to dispensing.',
    ],
    contraindicationNotes,
    providerSignoffRequired: true,
    safetyNote:
      'Provider authorization required before dispensing. Dose/cycle decisions must remain conditional (as tolerated, if indicated, per protocol).',
  };
}

export function generatePeptideRecommendation(intake: PeptideIntake): PeptideRecommendation {
  const tier = recommendPeptideTier(intake);
  const risk = buildRiskDecision(intake, tier);

  const preferred = intake.fulfillmentPreference;
  const recommendedFulfillment = risk.fulfillmentAllowed.includes(preferred)
    ? preferred
    : risk.fulfillmentAllowed[0] ?? 'clinic';

  const fulfillmentReason = risk.fulfillmentAllowed.includes(preferred)
    ? `Patient preference (${preferred}) is eligible for peptide ${tier} protocol.`
    : `Patient preference (${preferred}) is blocked by safety gates; defaulting to ${recommendedFulfillment}.`;

  const tiers = buildTiers(risk.fulfillmentAllowed);

  return {
    track: 'peptides',
    status: risk.status,
    recommendedTier: tier,
    blockedCompounds: risk.blockedCompounds,
    riskFlags: risk.riskFlags,
    requiredNextSteps: risk.requiredNextSteps,
    fulfillment: {
      allowed: risk.fulfillmentAllowed,
      recommended: recommendedFulfillment,
      reason: fulfillmentReason,
    },
    tiers,
    providerHandoff: buildProviderHandoff(intake, {
      status: risk.status,
      tier,
      blockedCompounds: risk.blockedCompounds,
      riskFlags: risk.riskFlags,
      recommendedFulfillment,
    }),
  };
}
