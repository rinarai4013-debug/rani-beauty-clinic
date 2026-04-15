import { z } from 'zod';

export const METABOLIC_TRACKS = ['glp1', 'hormones', 'peptides', 'hybrid'] as const;
export type MetabolicTrack = (typeof METABOLIC_TRACKS)[number];

export const FULFILLMENT_OPTIONS = ['clinic', 'home'] as const;
export type FulfillmentOption = (typeof FULFILLMENT_OPTIONS)[number];

export const METABOLIC_GOAL_OPTIONS = [
  'weight-loss',
  'body-recomposition',
  'metabolic-health',
  'energy',
  'hormone-balance',
  'recovery',
  'longevity',
  'performance',
] as const;

export const METABOLIC_SYMPTOM_OPTIONS = [
  'appetite-dysregulation',
  'sugar-cravings',
  'weight-plateau',
  'fatigue',
  'brain-fog',
  'low-libido',
  'poor-sleep',
  'mood-swings',
  'slow-recovery',
  'inflammation',
  'muscle-loss',
  'water-retention',
  'gut-bloating',
] as const;

export type MetabolicGoal = (typeof METABOLIC_GOAL_OPTIONS)[number];
export type MetabolicSymptom = (typeof METABOLIC_SYMPTOM_OPTIONS)[number];

const baseIntakeSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30).optional().default(''),
  goals: z.array(z.enum(METABOLIC_GOAL_OPTIONS)).min(1),
  symptoms: z.array(z.enum(METABOLIC_SYMPTOM_OPTIONS)).min(1),
  preferredTrack: z.enum(METABOLIC_TRACKS).optional(),
  fulfillmentPreference: z.enum(FULFILLMENT_OPTIONS).default('clinic'),
  timelineWeeks: z.number().int().min(1).max(104).optional(),
  currentMeds: z.string().trim().max(500).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
  source: z.string().trim().max(100).default('website-metabolic-intake'),
  medicalFlags: z.object({
    pregnant: z.boolean().default(false),
    breastfeeding: z.boolean().default(false),
    thyroidCancerHistory: z.boolean().default(false),
    pancreatitisHistory: z.boolean().default(false),
    gallbladderDisease: z.boolean().default(false),
    uncontrolledHypertension: z.boolean().default(false),
    severeDepression: z.boolean().default(false),
    eatingDisorderHistory: z.boolean().default(false),
  }).default({}),
  labs: z.object({
    baselineLabsCompleted: z.boolean().default(false),
    latestA1c: z.number().min(3).max(16).optional(),
    fastingGlucose: z.number().min(50).max(400).optional(),
    tsh: z.number().min(0).max(30).optional(),
  }).default({}),
});

export const metabolicIntakeSchema = baseIntakeSchema.transform((data) => ({
  ...data,
  medicalFlags: {
    pregnant: data.medicalFlags?.pregnant ?? false,
    breastfeeding: data.medicalFlags?.breastfeeding ?? false,
    thyroidCancerHistory: data.medicalFlags?.thyroidCancerHistory ?? false,
    pancreatitisHistory: data.medicalFlags?.pancreatitisHistory ?? false,
    gallbladderDisease: data.medicalFlags?.gallbladderDisease ?? false,
    uncontrolledHypertension: data.medicalFlags?.uncontrolledHypertension ?? false,
    severeDepression: data.medicalFlags?.severeDepression ?? false,
    eatingDisorderHistory: data.medicalFlags?.eatingDisorderHistory ?? false,
  },
  labs: {
    baselineLabsCompleted: data.labs?.baselineLabsCompleted ?? false,
    latestA1c: data.labs?.latestA1c,
    fastingGlucose: data.labs?.fastingGlucose,
    tsh: data.labs?.tsh,
  },
}));

export type MetabolicIntake = z.infer<typeof metabolicIntakeSchema>;

export interface MetabolicTier {
  tier: 'start' | 'transform' | 'elite';
  title: string;
  track: MetabolicTrack;
  monthlyEstimate: string;
  protocol: string[];
  monitoring: string[];
  bestFor: string;
}

export interface MetabolicRecommendation {
  status: 'eligible' | 'provider-review-required' | 'ineligible';
  recommendedTrack: MetabolicTrack;
  secondaryTracks: MetabolicTrack[];
  blockedTracks: MetabolicTrack[];
  riskFlags: string[];
  requiredNextSteps: string[];
  fulfillment: {
    allowed: FulfillmentOption[];
    recommended: FulfillmentOption;
    reason: string;
  };
  tiers: MetabolicTier[];
  providerHandoff: {
    summary: string;
    dosingFramework: string[];
    monitoringChecklist: string[];
    contraindicationNotes: string[];
  };
}

interface TrackProfile {
  score: number;
  blockReason?: string;
}

function buildTrackProfiles(intake: MetabolicIntake): Record<MetabolicTrack, TrackProfile> {
  const symptoms = new Set(intake.symptoms);
  const goals = new Set(intake.goals);
  const flags = intake.medicalFlags;

  const profile: Record<MetabolicTrack, TrackProfile> = {
    glp1: { score: 0 },
    hormones: { score: 0 },
    peptides: { score: 0 },
    hybrid: { score: 0 },
  };

  if (goals.has('weight-loss') || goals.has('body-recomposition') || goals.has('metabolic-health')) profile.glp1.score += 3;
  if (symptoms.has('appetite-dysregulation') || symptoms.has('sugar-cravings') || symptoms.has('weight-plateau')) profile.glp1.score += 2;
  if (intake.labs.latestA1c && intake.labs.latestA1c >= 5.7) profile.glp1.score += 1;

  if (goals.has('hormone-balance') || goals.has('energy') || goals.has('longevity')) profile.hormones.score += 2;
  if (symptoms.has('fatigue') || symptoms.has('brain-fog') || symptoms.has('low-libido') || symptoms.has('mood-swings') || symptoms.has('poor-sleep')) {
    profile.hormones.score += 3;
  }
  if (symptoms.has('muscle-loss') || symptoms.has('water-retention')) profile.hormones.score += 1;

  if (goals.has('recovery') || goals.has('performance') || goals.has('longevity')) profile.peptides.score += 2;
  if (symptoms.has('slow-recovery') || symptoms.has('inflammation') || symptoms.has('gut-bloating') || symptoms.has('fatigue')) {
    profile.peptides.score += 3;
  }

  const topTwo = [profile.glp1.score, profile.hormones.score, profile.peptides.score]
    .sort((a, b) => b - a)
    .slice(0, 2);
  if (topTwo[0] >= 3 && topTwo[1] >= 3) profile.hybrid.score = 4;

  if (flags.pregnant || flags.breastfeeding) {
    profile.glp1.blockReason = 'Pregnancy/breastfeeding requires provider-only evaluation; GLP-1 not auto-eligible.';
    profile.hormones.blockReason = 'Pregnancy/breastfeeding requires provider-only hormone review.';
    profile.peptides.blockReason = 'Pregnancy/breastfeeding requires provider-only peptide review.';
  }

  if (flags.thyroidCancerHistory || flags.pancreatitisHistory) {
    profile.glp1.blockReason = 'Thyroid cancer/pancreatitis history blocks automatic GLP-1 protocol assignment.';
  }

  if (flags.eatingDisorderHistory) {
    profile.glp1.blockReason = 'Eating disorder history requires physician clearance before appetite-suppressing protocols.';
  }

  return profile;
}

function rankTracks(profile: Record<MetabolicTrack, TrackProfile>): MetabolicTrack[] {
  return (Object.entries(profile) as Array<[MetabolicTrack, TrackProfile]>)
    .filter(([, value]) => !value.blockReason)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([track]) => track);
}

function buildTiers(track: MetabolicTrack): MetabolicTier[] {
  if (track === 'glp1') {
    return [
      {
        tier: 'start',
        title: 'GLP-1 Starter',
        track,
        monthlyEstimate: '$349-$499',
        protocol: [
          'Provider-selected start: semaglutide 0.25 mg weekly OR tirzepatide 2.5 mg weekly.',
          'Pulse schedule: 7-day dosing cadence with GI symptom check at 24h/72h after each dose.',
          'Primary improvement areas: appetite regulation, craving control, and early waist reduction.',
        ],
        monitoring: ['Baseline CMP/A1c/lipids', 'GI tolerance check-in week 2', 'Dose escalation decision at week 4'],
        bestFor: 'New GLP-1 patients needing close ramp-up support',
      },
      {
        tier: 'transform',
        title: 'GLP-1 Transform',
        track,
        monthlyEstimate: '$499-$799',
        protocol: [
          'Escalation framework: semaglutide 0.5-1.0 mg weekly OR tirzepatide 5-7.5 mg weekly as tolerated.',
          'Pulse schedule: hold/escalate decision every 4 weeks based on side-effect and adherence score.',
          'Primary improvement areas: steady fat-mass reduction, improved fasting glucose trend, and plateau prevention.',
        ],
        monitoring: ['Monthly weight + waist trend', 'Quarterly lab panel', 'Adherence + hunger score tracking'],
        bestFor: 'Patients targeting aggressive body recomposition',
      },
      {
        tier: 'elite',
        title: 'GLP-1 Elite',
        track,
        monthlyEstimate: '$799-$1199',
        protocol: [
          'Advanced range (provider-gated): semaglutide 1.7-2.4 mg OR tirzepatide 10-15 mg weekly.',
          'Pulse schedule: monthly optimization cycle with rescue pathways for GI intolerance or plateau.',
          'Primary improvement areas: high-velocity body recomposition and long-term maintenance architecture.',
        ],
        monitoring: ['Bi-weekly KPI review', 'Quarterly advanced lab review', 'Maintenance/taper strategy'],
        bestFor: 'High-touch patients targeting fastest safe results',
      },
    ];
  }

  if (track === 'hormones') {
    return [
      {
        tier: 'start',
        title: 'Hormone Baseline',
        track,
        monthlyEstimate: '$299-$449',
        protocol: [
          'Provider-led baseline protocol: symptom inventory + full endocrine lab panel before start.',
          'Dosing cadence framework: micro-adjustment window every 2-4 weeks (not fixed calendar escalation).',
          'Primary improvement areas: sleep quality, daytime energy, mood stability, and libido recovery.',
        ],
        monitoring: ['Baseline hormone panel', 'BP/sleep/mood tracking', 'Dose safety review'],
        bestFor: 'Patients with fatigue, sleep, mood, or libido shifts',
      },
      {
        tier: 'transform',
        title: 'Hormone Rebalance',
        track,
        monthlyEstimate: '$449-$699',
        protocol: [
          'Optimization framework: symptom-weighted dose refinements with 6-8 week lab checkpoints.',
          'Pulse schedule: adjust one variable per cycle (dose, frequency, or adjunct) to isolate response.',
          'Primary improvement areas: body composition, cognitive clarity, and cycle-specific symptom control.',
        ],
        monitoring: ['6-8 week lab recheck', 'Symptom severity scorecard', 'Provider optimization review'],
        bestFor: 'Patients needing active protocol tuning',
      },
      {
        tier: 'elite',
        title: 'Hormone Performance',
        track,
        monthlyEstimate: '$699-$999',
        protocol: [
          'Precision maintenance: advanced lab-informed periodization across quarterly cycles.',
          'Pulse schedule: planned optimization + stabilization blocks to avoid overcorrection.',
          'Primary improvement areas: performance output, recovery speed, and long-horizon endocrine stability.',
        ],
        monitoring: ['Monthly KPI dashboard', 'Quarterly endocrine lab cycle', 'Long-term risk surveillance'],
        bestFor: 'Patients prioritizing performance and longevity outcomes',
      },
    ];
  }

  if (track === 'hybrid') {
    return [
      {
        tier: 'start',
        title: 'Hybrid Onboarding',
        track,
        monthlyEstimate: '$549-$799',
        protocol: [
          'Layered start: low-dose GLP-1 + targeted hormone/wellness support based on baseline labs.',
          'Pulse schedule: staggered onboarding (one major protocol change every 2 weeks).',
          'Primary improvement areas: appetite + energy correction without overwhelming adaptation load.',
        ],
        monitoring: ['Baseline metabolic + hormone labs', 'Week 2 and week 4 provider checkpoints', 'Escalation eligibility review'],
        bestFor: 'Patients needing metabolic + hormonal support together',
      },
      {
        tier: 'transform',
        title: 'Hybrid Transform',
        track,
        monthlyEstimate: '$799-$1199',
        protocol: [
          'Dual-track optimization: GLP-1 titration synchronized with endocrine symptom scorecard.',
          'Pulse schedule: 4-week metabolic review + 6-8 week endocrine lab recalibration.',
          'Primary improvement areas: fat-loss momentum plus sleep/mood/libido normalization.',
        ],
        monitoring: ['Bi-weekly KPI review', '6-8 week lab refresh', 'Risk-gated protocol escalations'],
        bestFor: 'Patients with complex symptom clusters and ambitious goals',
      },
      {
        tier: 'elite',
        title: 'Hybrid Elite',
        track,
        monthlyEstimate: '$1199-$1599',
        protocol: [
          'High-touch integrated dosing architecture with provider-gated escalation limits.',
          'Pulse schedule: monthly composite review across metabolic, endocrine, and recovery markers.',
          'Primary improvement areas: maximum safe recomposition with durable maintenance planning.',
        ],
        monitoring: ['Weekly trend dashboard', 'Quarterly comprehensive labs', 'Provider strategy calls'],
        bestFor: 'Patients wanting fastest comprehensive medical optimization',
      },
    ];
  }

  return [
    {
      tier: 'start',
      title: 'Peptide Foundation',
      track,
      monthlyEstimate: '$249-$399',
      protocol: [
        'Entry peptide framework: BPC-157 250-500 mcg once/twice daily or equivalent starter protocol.',
        'Pulse schedule: 5-on/2-off or nightly pulse selected by symptom profile and tolerance.',
        'Primary improvement areas: inflammation control, sleep depth, and baseline recovery speed.',
      ],
      monitoring: ['Baseline symptom score', '2-4 week response checkpoint', 'Tolerance review'],
      bestFor: 'Recovery, inflammation, and energy support',
    },
    {
      tier: 'transform',
      title: 'Peptide Transform',
      track,
      monthlyEstimate: '$399-$649',
      protocol: [
        'Layered protocol: CJC-1295/Ipamorelin bedtime pulse + daytime recovery peptide as indicated.',
        'Pulse schedule: 8-12 week cycle with midpoint review and cycle-end reset planning.',
        'Primary improvement areas: lean-mass retention, tissue recovery, and workout response quality.',
      ],
      monitoring: ['Monthly symptom trend review', 'Cycle-end outcome review', 'Dose and cadence optimization'],
      bestFor: 'Patients needing stronger results for recovery/performance',
    },
    {
      tier: 'elite',
      title: 'Peptide Elite',
      track,
      monthlyEstimate: '$649-$949',
      protocol: [
        'Advanced stack: multi-phase peptide strategy with provider-reviewed compound compatibility.',
        'Pulse schedule: cycle + deload architecture to reduce receptor fatigue and sustain response.',
        'Primary improvement areas: performance output, body composition quality, and longevity support.',
      ],
      monitoring: ['Bi-weekly response telemetry', 'Quarterly objective marker review', 'Long-term maintenance protocol'],
      bestFor: 'High-performance and longevity-focused patients',
    },
  ];
}

function allowedFulfillment(track: MetabolicTrack, labsComplete: boolean): FulfillmentOption[] {
  if (track === 'hormones' && !labsComplete) return ['clinic'];
  if (track === 'hybrid' && !labsComplete) return ['clinic'];
  return ['clinic', 'home'];
}

function buildProviderHandoff(intake: MetabolicIntake, recommendation: Omit<MetabolicRecommendation, 'providerHandoff'>): MetabolicRecommendation['providerHandoff'] {
  const contraindicationNotes = recommendation.riskFlags.length > 0
    ? recommendation.riskFlags
    : ['No hard contraindication flags from intake; provider confirmation still required.'];

  const dosingFrameworkByTrack: Record<MetabolicTrack, string[]> = {
    glp1: [
      'Start low: semaglutide 0.25 mg or tirzepatide 2.5 mg weekly, escalate only after tolerance review.',
      'Escalation pulse: 4-week intervals with hold/de-escalate option for persistent GI symptoms.',
      'Dose decision uses appetite suppression + adherence + adverse event score, not timeline alone.',
    ],
    hormones: [
      'Initiate only after baseline endocrine panel and contraindication review.',
      'Adjust one variable per cycle (dose OR frequency OR adjunct) to preserve signal quality.',
      'Re-check labs every 6-8 weeks during optimization, then quarterly in maintenance.',
    ],
    peptides: [
      'Use single-compound onboarding before stacking when possible.',
      'Apply cycle + deload logic (typically 8-12 week cycle) to limit response decay.',
      'Track sleep, soreness, and performance markers before advancing dose complexity.',
    ],
    hybrid: [
      'Sequence changes: GLP-1 and hormone/peptide adjustments should be staggered, not simultaneous.',
      'Run monthly composite review (weight trend + symptom score + lab movement) before escalation.',
      'Use lowest effective doses across tracks to minimize cumulative side-effect burden.',
    ],
  };

  return {
    summary: `${intake.firstName} ${intake.lastName}: ${recommendation.recommendedTrack.toUpperCase()} track suggested, ${recommendation.fulfillment.recommended} fulfillment, goals=${intake.goals.join(', ')}, symptoms=${intake.symptoms.join(', ')}.`,
    dosingFramework: dosingFrameworkByTrack[recommendation.recommendedTrack],
    monitoringChecklist: [
      'Baseline vitals + medication reconciliation complete',
      'Required baseline labs ordered/reviewed before progression',
      '2-4 week follow-up booked before protocol launch',
      'Patient education confirmed (administration, side effects, red flags)',
    ],
    contraindicationNotes,
  };
}

export interface GenerateMetabolicRecommendationOptions {
  forceTrack?: MetabolicTrack;
}

export function generateMetabolicRecommendation(
  intake: MetabolicIntake,
  options: GenerateMetabolicRecommendationOptions = {},
): MetabolicRecommendation {
  const profile = buildTrackProfiles(intake);
  const blockedTracks = (Object.entries(profile) as Array<[MetabolicTrack, TrackProfile]>)
    .filter(([, v]) => Boolean(v.blockReason))
    .map(([k]) => k)
    .filter((k) => k !== 'hybrid');

  const ranked = rankTracks(profile).filter((t) => t !== 'hybrid');
  let recommendedTrack: MetabolicTrack = options.forceTrack ?? intake.preferredTrack ?? ranked[0] ?? 'glp1';

  if (!options.forceTrack && recommendedTrack !== 'hybrid' && blockedTracks.includes(recommendedTrack)) {
    recommendedTrack = ranked.find((track) => !blockedTracks.includes(track)) ?? 'peptides';
  }

  if (
    !options.forceTrack &&
    ranked.length >= 2 &&
    ranked[0] !== ranked[1] &&
    profile.hybrid.score >= 4 &&
    !blockedTracks.includes('glp1') &&
    !blockedTracks.includes('hormones')
  ) {
    recommendedTrack = 'hybrid';
  }

  const riskFlags = (Object.values(profile)
    .map((value) => value.blockReason)
    .filter(Boolean) as string[]);

  const forcedTrackBlocked = options.forceTrack
    ? options.forceTrack === 'hybrid'
      ? blockedTracks.includes('glp1') || blockedTracks.includes('hormones')
      : blockedTracks.includes(options.forceTrack)
    : false;

  const status: MetabolicRecommendation['status'] = blockedTracks.length === 3
    ? 'ineligible'
    : riskFlags.length > 0 || forcedTrackBlocked
      ? 'provider-review-required'
      : 'eligible';

  const allowed = allowedFulfillment(recommendedTrack, intake.labs.baselineLabsCompleted);
  const preferred = intake.fulfillmentPreference;
  const recommendedFulfillment = allowed.includes(preferred) ? preferred : allowed[0];

  const requiredNextSteps = [
    ...(forcedTrackBlocked
      ? [`${recommendedTrack.toUpperCase()} track is currently safety-gated; provider override review is required.`]
      : []),
    'Provider review and protocol sign-off required before dispensing or administration.',
    intake.labs.baselineLabsCompleted ? 'Baseline labs present; verify recency and completeness.' : 'Complete baseline labs before final protocol approval.',
    recommendedFulfillment === 'home'
      ? 'Confirm shipping eligibility, medication handling counseling, and home-administration training.'
      : 'Schedule in-clinic onboarding and first-dose observation (if indicated).',
  ];

  const tiers = buildTiers(recommendedTrack);

  const baseRecommendation: Omit<MetabolicRecommendation, 'providerHandoff'> = {
    status,
    recommendedTrack,
    secondaryTracks: ranked.filter((track) => track !== recommendedTrack).slice(0, 2),
    blockedTracks,
    riskFlags,
    requiredNextSteps,
    fulfillment: {
      allowed,
      recommended: recommendedFulfillment,
      reason: allowed.includes(preferred)
        ? `Patient preference (${preferred}) is eligible for ${recommendedTrack} track.`
        : `Patient preference (${preferred}) is not eligible for ${recommendedTrack}; defaulting to ${recommendedFulfillment}.`,
    },
    tiers,
  };

  return {
    ...baseRecommendation,
    providerHandoff: buildProviderHandoff(intake, baseRecommendation),
  };
}
