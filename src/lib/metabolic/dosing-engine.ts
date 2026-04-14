import type { MetabolicIntake, MetabolicRecommendation, MetabolicTrack } from '@/lib/metabolic/matrix';

export interface DosageCheckpoint {
  week: number;
  label: string;
  targetDose: string;
  escalationGate: string;
  holdCriteria: string[];
}

export interface DosagePlan {
  track: MetabolicTrack;
  tier: 'start' | 'transform' | 'elite';
  mode: 'clinic' | 'home';
  startDose: string;
  pulseCadence: string;
  treatmentAreas: string[];
  escalationRules: string[];
  holdRules: string[];
  checkpoints: DosageCheckpoint[];
  monitoringLabs: string[];
  providerSignoffRequired: true;
  safetyNote: string;
}

const TRACK_AREAS: Record<MetabolicTrack, string[]> = {
  glp1: ['abdomen', 'thigh', 'upper arm'],
  hormones: ['systemic endocrine axis', 'metabolic markers', 'symptom domains'],
  peptides: ['subcutaneous target zones', 'recovery symptom domains'],
  hybrid: ['metabolic axis', 'endocrine axis', 'recovery/performance axis'],
};

function glp1Plan(tier: 'start' | 'transform' | 'elite', recommendation: MetabolicRecommendation): DosagePlan {
  const homeEligible = recommendation.fulfillment.allowed.includes('home');
  const startDoseByTier: Record<typeof tier, string> = {
    start: 'Semaglutide 0.25 mg weekly OR Tirzepatide 2.5 mg weekly',
    transform: 'Semaglutide 0.5 mg weekly OR Tirzepatide 5 mg weekly',
    elite: 'Semaglutide 1.0 mg weekly OR Tirzepatide 7.5 mg weekly',
  };

  return {
    track: 'glp1',
    tier,
    mode: homeEligible ? 'home' : 'clinic',
    startDose: startDoseByTier[tier],
    pulseCadence: 'Weekly subcutaneous pulse (7-day cadence)',
    treatmentAreas: TRACK_AREAS.glp1,
    escalationRules: [
      'Escalate only after 4-week tolerance window with stable GI profile.',
      'Use appetite suppression + adherence + side-effect composite to decide escalation.',
      'Single-step escalation per cycle; do not jump more than one dose band.',
    ],
    holdRules: [
      'Hold escalation if persistent nausea/vomiting >48h after pulse.',
      'De-escalate if hydration intolerance, severe constipation, or red-flag symptoms appear.',
      'Provider review required before any dose restart after interruption >14 days.',
    ],
    checkpoints: [
      { week: 0, label: 'Onboarding', targetDose: startDoseByTier[tier], escalationGate: 'Baseline review complete', holdCriteria: ['Active contraindication unresolved'] },
      { week: 2, label: 'Tolerance Check', targetDose: 'Maintain current dose', escalationGate: 'GI symptoms mild and improving', holdCriteria: ['Moderate/severe GI adverse effects'] },
      { week: 4, label: 'Escalation Decision', targetDose: 'Next dose band if criteria met', escalationGate: 'Adherence >85% and side effects controlled', holdCriteria: ['Adverse event or poor adherence'] },
      { week: 8, label: 'Momentum Review', targetDose: 'Maintain or escalate one step', escalationGate: 'Objective progress vs baseline', holdCriteria: ['No clinical benefit + side effects'] },
      { week: 12, label: 'Quarterly Reset', targetDose: 'Maintenance band selection', escalationGate: 'Quarterly labs and provider sign-off', holdCriteria: ['Lab safety concerns'] },
    ],
    monitoringLabs: ['CMP', 'A1c', 'Lipids', 'Weight/Waist trend'],
    providerSignoffRequired: true,
    safetyNote: 'Final dose selection requires provider authorization and medication reconciliation.',
  };
}

function hormonesPlan(tier: 'start' | 'transform' | 'elite', intake: MetabolicIntake): DosagePlan {
  return {
    track: 'hormones',
    tier,
    mode: intake.labs.baselineLabsCompleted ? 'home' : 'clinic',
    startDose: tier === 'start'
      ? 'Conservative initiation protocol after baseline endocrine panel'
      : tier === 'transform'
        ? 'Symptom-weighted optimization band (single-variable adjustment cycle)'
        : 'Advanced periodized optimization protocol (provider-gated)',
    pulseCadence: 'Micro-adjustment cadence every 2-6 weeks depending on symptom/lab response',
    treatmentAreas: TRACK_AREAS.hormones,
    escalationRules: [
      'Adjust one variable per cycle (dose OR frequency OR adjunct).',
      'Require 6-8 week objective data before non-urgent escalation.',
      'Quarterly maintenance cycle once stable response achieved.',
    ],
    holdRules: [
      'Hold adjustment if blood pressure, mood, or sleep instability worsens.',
      'Pause escalation pending lab anomalies or unresolved safety flags.',
      'Immediate provider reassessment required for severe adverse effects.',
    ],
    checkpoints: [
      { week: 0, label: 'Baseline Panel', targetDose: 'Provider-selected starting band', escalationGate: 'Baseline labs reviewed', holdCriteria: ['Incomplete baseline panel'] },
      { week: 3, label: 'Symptom Delta Review', targetDose: 'Maintain band', escalationGate: 'Symptom trend favorable', holdCriteria: ['Symptom destabilization'] },
      { week: 6, label: 'Lab-Informed Adjustment', targetDose: 'Single-variable optimization', escalationGate: 'Lab + symptom concordance', holdCriteria: ['Lab risk markers'] },
      { week: 12, label: 'Protocol Consolidation', targetDose: 'Maintenance or staged escalation', escalationGate: 'Quarterly review complete', holdCriteria: ['Unresolved side effects'] },
    ],
    monitoringLabs: ['Hormone panel', 'CBC/CMP', 'Lipid profile', 'Symptom scorecard'],
    providerSignoffRequired: true,
    safetyNote: 'Hormone protocols require physician oversight and lab-verified progression.',
  };
}

function peptidePlan(tier: 'start' | 'transform' | 'elite'): DosagePlan {
  const startDose = tier === 'start'
    ? 'BPC-157 250-500 mcg once/twice daily'
    : tier === 'transform'
      ? 'CJC-1295/Ipamorelin bedtime pulse + daytime recovery support'
      : 'Advanced stack with provider-reviewed compatibility matrix';

  return {
    track: 'peptides',
    tier,
    mode: 'home',
    startDose,
    pulseCadence: 'Cycle-based pulse (typically 5-on/2-off or nightly pulse per protocol)',
    treatmentAreas: TRACK_AREAS.peptides,
    escalationRules: [
      'Escalate only after cycle midpoint outcome review.',
      'Do not stack additional compounds until primary compound tolerance confirmed.',
      'Use 8-12 week cycles with structured deload windows.',
    ],
    holdRules: [
      'Hold escalation for unresolved edema, headache, or sleep disruption.',
      'Pause stack additions if recovery metrics do not improve as expected.',
      'Provider reassessment required before restarting after adverse event.',
    ],
    checkpoints: [
      { week: 0, label: 'Cycle Start', targetDose: startDose, escalationGate: 'Provider education complete', holdCriteria: ['Contraindication unresolved'] },
      { week: 2, label: 'Response Check', targetDose: 'Maintain', escalationGate: 'Sleep/recovery trend improving', holdCriteria: ['No tolerance'] },
      { week: 6, label: 'Mid-Cycle Review', targetDose: 'Refine cadence', escalationGate: 'Objective response signal', holdCriteria: ['Adverse trend'] },
      { week: 10, label: 'Cycle Closeout', targetDose: 'Decide next cycle or deload', escalationGate: 'Provider review and KPI summary', holdCriteria: ['Safety concern'] },
    ],
    monitoringLabs: ['Inflammation markers (as indicated)', 'Body composition trend', 'Recovery and sleep telemetry'],
    providerSignoffRequired: true,
    safetyNote: 'Peptide stacks must be provider-approved before multi-compound escalation.',
  };
}

function hybridPlan(tier: 'start' | 'transform' | 'elite'): DosagePlan {
  return {
    track: 'hybrid',
    tier,
    mode: tier === 'start' ? 'clinic' : 'home',
    startDose: tier === 'start'
      ? 'Low-dose GLP-1 + conservative endocrine support (staggered onboarding)'
      : tier === 'transform'
        ? 'Dual-track optimization with synchronized review cadence'
        : 'Integrated high-touch protocol with monthly composite governance',
    pulseCadence: 'Staggered protocol changes; avoid simultaneous major adjustments',
    treatmentAreas: TRACK_AREAS.hybrid,
    escalationRules: [
      'Stagger metabolic and endocrine changes by at least one review cycle.',
      'Monthly composite decision score required for each escalation.',
      'Prioritize lowest effective doses across both tracks.',
    ],
    holdRules: [
      'Hold dual escalation when combined side-effect burden rises.',
      'Pause one axis if objective gains flatten and safety burden increases.',
      'Provider sign-off required before re-synchronizing both tracks.',
    ],
    checkpoints: [
      { week: 0, label: 'Clinic Onboarding', targetDose: 'Low-dose dual-track start', escalationGate: 'Baseline composite reviewed', holdCriteria: ['Any unresolved contraindication'] },
      { week: 4, label: 'Axis-1 Review', targetDose: 'One-axis adjustment only', escalationGate: 'Tolerance confirmed', holdCriteria: ['Instability'] },
      { week: 8, label: 'Axis-2 Review', targetDose: 'Second-axis adjustment if needed', escalationGate: 'Composite score improving', holdCriteria: ['Cumulative side effects'] },
      { week: 12, label: 'Quarterly Synthesis', targetDose: 'Maintenance architecture', escalationGate: 'Labs + KPI convergence', holdCriteria: ['Safety marker deviation'] },
    ],
    monitoringLabs: ['Metabolic panel', 'Hormone panel', 'Adherence + symptom telemetry', 'Body composition trend'],
    providerSignoffRequired: true,
    safetyNote: 'Hybrid protocols require stricter oversight due to multi-axis interaction risk.',
  };
}

export function buildDosagePlan(
  intake: MetabolicIntake,
  recommendation: MetabolicRecommendation,
  tier: 'start' | 'transform' | 'elite' = 'start',
): DosagePlan {
  if (recommendation.recommendedTrack === 'glp1') return glp1Plan(tier, recommendation);
  if (recommendation.recommendedTrack === 'hormones') return hormonesPlan(tier, intake);
  if (recommendation.recommendedTrack === 'peptides') return peptidePlan(tier);
  return hybridPlan(tier);
}

export type PeptideProtocolTier = 'foundation' | 'performance' | 'elite';

export interface PeptideCompoundDoseLine {
  compound: string;
  startingDose: string;
  cadence: string;
  cycleLength: string;
  escalationGate: string;
}

export interface PeptideDoseGovernance {
  tier: PeptideProtocolTier;
  fulfillment: 'clinic' | 'home';
  doseLines: PeptideCompoundDoseLine[];
  monitoringChecklist: string[];
  holdCriteria: string[];
  providerSignoffRequired: true;
  safetyNote: string;
}

export function buildPeptideDoseGovernance(
  tier: PeptideProtocolTier,
  fulfillment: 'clinic' | 'home',
  labsComplete: boolean,
): PeptideDoseGovernance {
  const foundation: PeptideCompoundDoseLine[] = [
    {
      compound: 'BPC-157',
      startingDose: '250-500 mcg once/twice daily as tolerated',
      cadence: 'daily pulse',
      cycleLength: '6-8 weeks',
      escalationGate: 'Escalate only if week-2/week-4 symptom trend supports change',
    },
  ];

  const performance: PeptideCompoundDoseLine[] = [
    {
      compound: 'CJC-1295 / Ipamorelin',
      startingDose: 'Provider-selected conservative bedtime pulse',
      cadence: 'nightly pulse',
      cycleLength: '8-12 weeks',
      escalationGate: 'Escalate if indicated by tolerance + objective progress + labs',
    },
    {
      compound: 'BPC-157',
      startingDose: '250-500 mcg once/twice daily as tolerated',
      cadence: 'daily support',
      cycleLength: '8-12 weeks',
      escalationGate: 'Adjust only after provider checkpoint',
    },
  ];

  const elite: PeptideCompoundDoseLine[] = [
    ...performance,
    {
      compound: 'Sermorelin',
      startingDose: 'Provider-gated adjunct dose as tolerated',
      cadence: 'nightly/alternate-nightly per protocol',
      cycleLength: '8-12 weeks with deload planning',
      escalationGate: 'Add only if indicated and compatibility reviewed',
    },
  ];

  const byTier: Record<PeptideProtocolTier, PeptideCompoundDoseLine[]> = {
    foundation,
    performance,
    elite,
  };

  const monitoringChecklist = [
    'Baseline vitals and contraindication review completed',
    labsComplete ? 'Baseline labs verified and current' : 'Baseline labs pending; clinic-first onboarding required',
    'Week-2 and week-4 tolerance/symptom checkpoints scheduled',
    'Escalation decision documented before protocol changes',
  ];

  const holdCriteria = [
    'Hold escalation if adverse effects are persistent or worsening',
    'Pause stack additions if objective progress is not clearly favorable',
    'Require provider reassessment after any interruption >14 days',
  ];

  return {
    tier,
    fulfillment,
    doseLines: byTier[tier],
    monitoringChecklist,
    holdCriteria,
    providerSignoffRequired: true,
    safetyNote:
      'Provider authorization required before dispensing. Dosing remains conditional (as tolerated, if indicated, per protocol).',
  };
}
