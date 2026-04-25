/**
 * Dosage Governance Framework
 *
 * Provider-safe, track × tier dosage reference tables.
 *
 * IMPORTANT: All output is for PROVIDER REFERENCE ONLY.
 * - No imperative prescribing language ("take X now")
 * - No specific doses recommended without provider authorization
 * - All protocol initiation requires explicit provider authorization
 */

import type { MetabolicIntake, MetabolicTrack } from './matrix';
import type { TierLevel, SafetyStatus } from './tier-matrix';

// ── Output Type ──

export interface DosageFramework {
  track: MetabolicTrack;
  tier: TierLevel;
  startRange: string;
  cadence: string;
  escalationCriteria: string[];
  holdRules: string[];
  monitoringCadence: string[];
  providerAuthorizationNote: string;
  constrainedByStatus: boolean;
  personalizedPeptidePlan: PersonalizedPeptidePlan | null;
}

export interface PersonalizedPeptideDoseCandidate {
  compound: string;
  targetIntent: string;
  startDose: string;
  escalationWindow: string;
  route: 'subcutaneous' | 'intramuscular' | 'topical';
  cadence: string;
  cycleLength: string;
  confidence: 'moderate' | 'high';
  rationale: string[];
}

export interface PersonalizedPeptidePlan {
  strategy: 'recovery-first' | 'performance-stack' | 'metabolic-repair' | 'longevity-stack';
  dataCompleteness: 'low' | 'medium' | 'high';
  computedFrom: string[];
  warnings: string[];
  candidates: PersonalizedPeptideDoseCandidate[];
}

// ── Internal Table ──

interface DosingEntry {
  startRange: string;
  cadence: string;
  escalationCriteria: string[];
  holdRules: string[];
  monitoringCadence: string[];
}

const DOSING_TABLE: Record<MetabolicTrack, Record<TierLevel, DosingEntry>> = {
  glp1: {
    foundation: {
      startRange:
        'Provider-selected low-end range for GLP-1 agonist class (e.g., semaglutide 0.25 mg equivalent or tirzepatide 2.5 mg equivalent weekly). Exact agent and dose determination require provider prescription.',
      cadence:
        'Weekly subcutaneous protocol on a consistent day; provider to confirm specific timing and patient training.',
      escalationCriteria: [
        'Inadequate appetite/weight response after 4 weeks at current range — provider review required.',
        'Tolerability confirmed: no unresolved GI adverse events at current level.',
        'Provider review and explicit step-up authorization required before any range increase.',
      ],
      holdRules: [
        'Active nausea/vomiting grade 2+ — protocol hold pending provider assessment.',
        'Any acute pancreatitis presentation — hold and provider escalation required immediately.',
        'Fasting glucose < 70 mg/dL — hold and provider reassessment required.',
        'Planned surgical procedure — provider guidance on hold duration required.',
      ],
      monitoringCadence: [
        'Baseline: weight, waist circumference, A1c, fasting glucose, CMP.',
        'Week 2: GI tolerability check-in with provider or clinical staff.',
        'Week 4: Dose escalation eligibility review with provider.',
        'Month 3: Lab recheck — A1c, metabolic panel.',
      ],
    },
    performance: {
      startRange:
        'Mid-range GLP-1 protocol reference (e.g., semaglutide 0.5–1.0 mg or tirzepatide 5–7.5 mg weekly range). Agent selection and dose determination require provider authorization.',
      cadence:
        'Weekly subcutaneous protocol; maintain consistent schedule. Dose hold/escalation decision every 4 weeks with provider.',
      escalationCriteria: [
        'Suboptimal metabolic response after 4-week hold at current range — provider review required.',
        'Provider-confirmed tolerability at current level.',
        'Written step-up order from prescribing provider required before range increase.',
      ],
      holdRules: [
        'GI symptoms requiring medical management — hold pending provider direction.',
        'Abnormal liver enzymes (> 3× ULN) — hold and provider notification required.',
        'Sustained heart rate increase > 20 bpm — hold and provider notification required.',
        'Pregnancy confirmed — protocol hold required; provider to reassess entire program.',
      ],
      monitoringCadence: [
        'Monthly: weight trend, appetite score, adherence review.',
        'Month 2: Provider visit; metabolic labs and optimization review.',
        'Month 3: Comprehensive panel — A1c, lipids, CMP, thyroid if indicated.',
        'Quarterly thereafter per provider discretion.',
      ],
    },
    elite: {
      startRange:
        'Advanced GLP-1 range reference (e.g., semaglutide 1.7–2.4 mg or tirzepatide 10–15 mg weekly range). Requires documented provider review of tolerability history and labs before authorization.',
      cadence:
        'Weekly subcutaneous protocol; maintenance or deload schedule per provider-designed protocol.',
      escalationCriteria: [
        'Only with documented plateau at lower range AND provider-confirmed safety clearance.',
        'Recent labs (< 90 days) must be reviewed by provider before any range advancement.',
      ],
      holdRules: [
        'New cardiovascular, renal, or hepatic findings — hold and provider review required.',
        'Pre-surgical hold: provider confirmation of protocol pause required at least 2 weeks prior.',
        'All grade 2+ adverse events — hold and provider contact within 24 hours.',
      ],
      monitoringCadence: [
        'Bi-weekly: digital weight and symptom telemetry.',
        'Monthly: provider optimization visit.',
        'Quarterly: advanced labs — A1c, lipids, CMP, eGFR, thyroid.',
        'Annual: comprehensive cardiovascular risk review.',
      ],
    },
  },

  hormones: {
    foundation: {
      startRange:
        'Initiation-level hormone protocol reference pending full endocrine panel review. Provider to determine specific agent, formulation, and starting range based on lab values and clinical assessment.',
      cadence:
        'Provider-determined cadence following lab-informed protocol; typically 2–4 week titration cycles with one variable adjusted per cycle.',
      escalationCriteria: [
        'Persistent symptom burden (fatigue, sleep, libido) after 6–8 weeks at initiation range.',
        '6–8 week follow-up labs reviewed by provider showing subtherapeutic levels.',
        'One protocol variable adjusted per cycle with provider sign-off.',
      ],
      holdRules: [
        'Unresolved bleeding, clotting, or cardiovascular symptoms — hold and provider assessment required.',
        'Abnormal liver function tests — hold and provider review required.',
        'Confirmed pregnancy — hold required; provider to manage protocol.',
        'Mood or psychiatric deterioration — hold and provider contact required.',
      ],
      monitoringCadence: [
        'Baseline: full hormone panel (estradiol/testosterone/progesterone/FSH/LH/DHEA-S/thyroid), CMP.',
        'Week 4–6: Symptom severity review with provider.',
        'Week 6–8: Lab recheck for provider-guided protocol adjustment.',
        'Quarterly thereafter with provider visit.',
      ],
    },
    performance: {
      startRange:
        'Intermediate hormone protocol reference. Dose ranges based on provider interpretation of 6–8 week lab rechecks. Provider must authorize each adjustment cycle.',
      cadence:
        'Lab-guided titration every 6–8 weeks; provider visit required at each adjustment cycle.',
      escalationCriteria: [
        'Confirmed subtherapeutic levels on follow-up labs with provider review.',
        'Persistent priority symptoms scoring above provider-defined threshold after previous cycle.',
        'Tolerability confirmed at current level.',
      ],
      holdRules: [
        'New cardiovascular risk factors — provider review required before continuation.',
        'Abnormal mammography or pelvic findings — hold pending specialist clearance.',
        'New psychiatric or neurological symptoms — hold and provider contact required same day.',
      ],
      monitoringCadence: [
        'Month 1–2: Symptom scorecard reviewed with provider.',
        'Month 2: Full endocrine panel recheck.',
        'Month 3–6: Optimization review with provider.',
        'Ongoing: Annual comprehensive hormone and metabolic panel.',
      ],
    },
    elite: {
      startRange:
        'Advanced hormone protocol reference for performance and longevity goals. Requires documented endocrine panel history, prior response data, and provider authorization.',
      cadence:
        'Quarterly optimization cycles; monthly provider check-ins for advanced protocol management.',
      escalationCriteria: [
        'Documented suboptimal response at performance tier with comprehensive labs reviewed by provider.',
        'Provider specialist consultation completed where applicable.',
      ],
      holdRules: [
        'Any grade 2+ adverse hormonal event — hold and provider contact within 24 hours.',
        'All new major medical diagnoses — provider reassessment of full protocol required.',
      ],
      monitoringCadence: [
        'Monthly: symptom KPI review with provider.',
        'Quarterly: full endocrine and metabolic lab cycle.',
        'Annual: long-term hormonal risk surveillance including cardiovascular and relevant oncologic markers per provider.',
      ],
    },
  },

  peptides: {
    foundation: {
      startRange:
        'Initiation-range peptide protocol reference (e.g., BPC-157 equivalent 250–500 mcg range, or similar recovery-class peptide). Exact agent, formulation, and dose determination require provider authorization.',
      cadence:
        '5-days-on / 2-days-off pulse, or nightly protocol per provider preference; 8–12 week initial cycle.',
      escalationCriteria: [
        'Inadequate recovery, sleep, or inflammation response after 4 weeks at initiation range — provider review required.',
        'Provider confirms tolerability and reviews response metrics before any range change.',
        'Single-agent protocol confirmed before any stacking consideration.',
      ],
      holdRules: [
        'Injection-site reaction beyond mild transient redness — hold and provider assessment required.',
        'New autoimmune flare or inflammatory diagnosis — hold and provider review required.',
        'Active infection or fever — hold until resolved and provider approves resumption.',
      ],
      monitoringCadence: [
        'Baseline: symptom severity score (recovery, sleep, inflammation).',
        'Week 2–4: Response checkpoint with provider or clinical staff.',
        'Cycle end (8–12 weeks): Outcome review and deload decision with provider.',
      ],
    },
    performance: {
      startRange:
        'Intermediate peptide protocol reference (e.g., CJC-1295/Ipamorelin combination range or equivalent). Each compound and dose determination require individual provider authorization.',
      cadence:
        '8–12 week cycle with bedtime GH-secretagogue pulse and daytime recovery peptide per provider protocol.',
      escalationCriteria: [
        'Response plateau at foundation tier confirmed with provider review.',
        'Tolerability of single agent established before any stacking.',
        'Provider authorization required for each compound addition.',
      ],
      holdRules: [
        'GH-secretagogue protocol: hold if active malignancy is suspected — provider clearance required.',
        'Carpal tunnel symptoms or fluid retention — hold GH-class peptides and provider contact required.',
        'Any new oncologic concern — hold all peptides and provider assessment required.',
      ],
      monitoringCadence: [
        'Monthly: recovery metrics, sleep score, body composition trend.',
        'Cycle midpoint: provider optimization review.',
        'Cycle end: full outcome review; deload or advancement decision with provider.',
      ],
    },
    elite: {
      startRange:
        'Advanced multi-phase peptide protocol reference. Compound compatibility review required. All components and dose ranges require documented provider authorization per compound.',
      cadence:
        'Cycle and deload architecture (typically 12 weeks protocol / 4 weeks deload) per provider design.',
      escalationCriteria: [
        'Only with documented response history at performance tier reviewed by provider.',
        'Comprehensive provider protocol review required before elite protocol initiation.',
      ],
      holdRules: [
        'Any grade 2+ adverse event — hold all compounds and provider contact within 24 hours.',
        'New malignancy suspicion — hold all peptides immediately; oncology referral through provider.',
        'Annual provider safety review required to continue at elite tier.',
      ],
      monitoringCadence: [
        'Bi-weekly: performance telemetry and symptom tracking.',
        'Quarterly: objective performance markers and labs per provider protocol.',
        'Annual: long-term safety review and cycle planning with provider.',
      ],
    },
  },

  hybrid: {
    foundation: {
      startRange:
        'Conservative dual-track initiation reference. Low-end GLP-1 range plus targeted hormone or peptide support. Sequential onboarding required — one major protocol change every 2 weeks per provider plan.',
      cadence:
        'Staggered initiation per provider schedule; 4-week provider checkpoint mandatory after initial onboarding.',
      escalationCriteria: [
        'Both tracks tolerability confirmed after 4–6 weeks.',
        'Provider review of composite metabolic and hormonal or recovery response required.',
        'No simultaneous escalation of both tracks without explicit provider authorization.',
      ],
      holdRules: [
        'Any adverse event on either track — hold both components and provider contact required.',
        'GI adverse event: GLP-1 component hold; provider decision on hormone or peptide continuation.',
        'Cardiovascular or hormonal concern: hold all components; provider assessment required.',
      ],
      monitoringCadence: [
        'Baseline: full metabolic and hormone or recovery labs.',
        'Week 2 and 4: Staggered component check-ins with provider.',
        'Month 2: Composite protocol review with provider.',
      ],
    },
    performance: {
      startRange:
        'Mid-tier dual-track reference. GLP-1 optimization plus endocrine scorecard recalibration. Each track managed on an independent escalation schedule with provider oversight.',
      cadence:
        'GLP-1: weekly; Hormone or Peptide: per endocrine or recovery protocol. 4-week metabolic review and 6–8 week endocrine recalibration cadence.',
      escalationCriteria: [
        'Individual track escalation gates as per respective foundation tier rules.',
        'No cross-track escalation within the same 4-week window without provider authorization.',
      ],
      holdRules: [
        'Adverse event on any component: hold that component; provider contact required same day.',
        'Cardiac, renal, or hepatic finding: hold all components; immediate provider review required.',
      ],
      monitoringCadence: [
        'Bi-weekly: KPI dashboard review.',
        'Month 2: Comprehensive labs per all active track protocols.',
        'Provider visit required at each dual-track adjustment point.',
      ],
    },
    elite: {
      startRange:
        'High-acuity integrated protocol reference. All dosing decisions require provider authorization per track. Monthly composite review is mandatory.',
      cadence:
        'Weekly GLP-1 protocol plus hormone or peptide schedule per provider design; monthly composite optimization review.',
      escalationCriteria: [
        'All component escalations require independent provider review and written authorization.',
        'Monthly composite KPI review must confirm safety and efficacy before any protocol change.',
      ],
      holdRules: [
        'Any grade 2+ adverse event on any component — hold all and provider contact within 24 hours.',
        'New major comorbidity — full protocol suspension pending provider reassessment.',
      ],
      monitoringCadence: [
        'Weekly: trend dashboard across all active protocols.',
        'Quarterly: comprehensive labs per all active track protocols.',
        'Bi-annual: provider strategy review and long-term risk surveillance.',
      ],
    },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function calculatePeptideDoseMultiplier(intake: MetabolicIntake, status: SafetyStatus): number {
  const weight = intake.biometrics.weightLbs;
  const tolerance = intake.peptideHistory.tolerance;

  let multiplier = 1;
  if (typeof weight === 'number') {
    if (weight >= 240) multiplier += 0.2;
    else if (weight >= 200) multiplier += 0.1;
    else if (weight <= 120) multiplier -= 0.15;
    else if (weight <= 150) multiplier -= 0.05;
  }

  if (tolerance === 'sensitive') multiplier -= 0.2;
  if (tolerance === 'high') multiplier += 0.15;

  if (!intake.labs.baselineLabsCompleted) multiplier -= 0.1;
  if (intake.medicalFlags.uncontrolledHypertension || intake.medicalFlags.severeDepression) {
    multiplier -= 0.1;
  }
  if (status !== 'eligible') multiplier -= 0.15;

  return clamp(multiplier, 0.65, 1.35);
}

function resolveDataCompleteness(intake: MetabolicIntake): 'low' | 'medium' | 'high' {
  let score = 0;
  if (typeof intake.biometrics.weightLbs === 'number') score += 1;
  if (typeof intake.biometrics.bmi === 'number') score += 1;
  if (intake.labs.baselineLabsCompleted) score += 1;
  if (intake.peptideHistory.tolerance !== 'unknown') score += 1;
  if (intake.peptideHistory.priorPeptideExposure) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function buildPeptideWarnings(intake: MetabolicIntake, status: SafetyStatus): string[] {
  const warnings: string[] = [];
  if (!intake.labs.baselineLabsCompleted) {
    warnings.push('Baseline labs are incomplete; provider should use conservative initiation and confirm safety markers first.');
  }
  if (status !== 'eligible') {
    warnings.push('Safety status is constrained; provider review is required before any peptide start-range authorization.');
  }
  if (intake.medicalFlags.pregnant || intake.medicalFlags.breastfeeding) {
    warnings.push('Pregnancy or breastfeeding flag present; peptide protocol requires explicit provider-only review.');
  }
  if (intake.medicalFlags.uncontrolledHypertension) {
    warnings.push('Uncontrolled hypertension flag present; defer escalation until blood-pressure control is documented.');
  }
  return warnings;
}

function buildPeptidePersonalizedPlan(
  intake: MetabolicIntake,
  track: MetabolicTrack,
  tier: TierLevel,
  status: SafetyStatus,
): PersonalizedPeptidePlan | null {
  if (track !== 'peptides' && track !== 'hybrid') {
    return null;
  }

  const symptoms = new Set(intake.symptoms);
  const goals = new Set(intake.goals);
  const multiplier = calculatePeptideDoseMultiplier(intake, status);

  const recoveryLead =
    symptoms.has('slow-recovery') ||
    symptoms.has('inflammation') ||
    symptoms.has('gut-bloating') ||
    goals.has('recovery');
  const performanceLead = goals.has('performance') || symptoms.has('muscle-loss');
  const metabolicLead =
    goals.has('energy') ||
    goals.has('longevity') ||
    symptoms.has('fatigue') ||
    symptoms.has('brain-fog');

  const strategy: PersonalizedPeptidePlan['strategy'] = recoveryLead
    ? 'recovery-first'
    : performanceLead
      ? 'performance-stack'
      : metabolicLead
        ? 'metabolic-repair'
        : 'longevity-stack';

  const candidates: PersonalizedPeptideDoseCandidate[] = [];
  const computedFrom = ['goals', 'symptoms', 'medicalFlags', 'labs.baselineLabsCompleted'];
  if (typeof intake.biometrics.weightLbs === 'number') computedFrom.push('biometrics.weightLbs');
  if (typeof intake.biometrics.bmi === 'number') computedFrom.push('biometrics.bmi');
  if (intake.peptideHistory.tolerance !== 'unknown') computedFrom.push('peptideHistory.tolerance');
  if (intake.peptideHistory.priorPeptideExposure) computedFrom.push('peptideHistory.priorPeptideExposure');

  const bpcBaseByTier: Record<TierLevel, number> = {
    foundation: 250,
    performance: 350,
    elite: 500,
  };
  const bpcStart = clamp(roundToNearest(bpcBaseByTier[tier] * multiplier, 25), 200, 700);
  const bpcUpper = clamp(roundToNearest(bpcStart * 1.8, 25), 350, 1000);

  if (recoveryLead || strategy === 'recovery-first') {
    candidates.push({
      compound: 'BPC-157',
      targetIntent: 'Recovery + inflammation modulation',
      startDose: `Provider-start reference: ${bpcStart} mcg per dose`,
      escalationWindow: `Provider-reviewed range: ${bpcStart}-${bpcUpper} mcg per dose`,
      route: intake.peptideHistory.preferredRoute === 'intramuscular' ? 'intramuscular' : 'subcutaneous',
      cadence: 'Once daily for foundational recovery; may split to twice-daily based on provider review.',
      cycleLength: '8-12 week cycle, then deload reassessment.',
      confidence: intake.labs.baselineLabsCompleted ? 'high' : 'moderate',
      rationale: [
        'Recovery/inflammation signal detected in goals or symptoms.',
        'Dose scaled by weight + tolerance profile with conservative safety clamp.',
      ],
    });
  }

  const cjcBaseByTier: Record<TierLevel, number> = {
    foundation: 100,
    performance: 150,
    elite: 200,
  };
  const cjcStart = clamp(roundToNearest(cjcBaseByTier[tier] * multiplier, 10), 80, 250);
  const cjcUpper = clamp(roundToNearest(cjcStart * 1.7, 10), 150, 350);

  if (performanceLead || strategy === 'performance-stack') {
    candidates.push({
      compound: 'CJC-1295 / Ipamorelin',
      targetIntent: 'Lean-mass retention + sleep-linked recovery',
      startDose: `Provider-start reference: CJC-1295 ${cjcStart} mcg + Ipamorelin ${cjcStart} mcg at bedtime`,
      escalationWindow: `Provider-reviewed range: ${cjcStart}-${cjcUpper} mcg each bedtime dose`,
      route: 'subcutaneous',
      cadence: 'Bedtime pulse, 5 days on / 2 days off.',
      cycleLength: '8-12 week cycle with midpoint review.',
      confidence: intake.labs.baselineLabsCompleted ? 'high' : 'moderate',
      rationale: [
        'Performance or muscle-loss signal detected.',
        'Bedtime secretagogue pattern aligns with existing protocol cadence.',
      ],
    });
  }

  const nadBaseByTier: Record<TierLevel, number> = {
    foundation: 100,
    performance: 200,
    elite: 250,
  };
  const nadStart = clamp(roundToNearest(nadBaseByTier[tier] * multiplier, 25), 75, 300);
  const nadUpper = clamp(roundToNearest(nadStart * 1.5, 25), 150, 450);

  if (metabolicLead || candidates.length === 0) {
    candidates.push({
      compound: 'NAD+',
      targetIntent: 'Energy + cognitive resilience',
      startDose: `Provider-start reference: ${nadStart} mg per dose`,
      escalationWindow: `Provider-reviewed range: ${nadStart}-${nadUpper} mg per dose`,
      route: 'intramuscular',
      cadence: '2-3 doses/week during loading phase; then weekly maintenance.',
      cycleLength: '4-week loading + maintenance protocol.',
      confidence: intake.labs.baselineLabsCompleted ? 'high' : 'moderate',
      rationale: [
        'Energy/longevity or fatigue/cognitive signals detected.',
        'Dose aligned to tier intensity and adjusted by tolerance profile.',
      ],
    });
  }

  return {
    strategy,
    dataCompleteness: resolveDataCompleteness(intake),
    computedFrom,
    warnings: buildPeptideWarnings(intake, status),
    candidates,
  };
}

const PROVIDER_AUTHORIZATION_NOTE =
  'PROVIDER AUTHORIZATION REQUIRED: This dosage framework is a clinical reference only. ' +
  'No protocol may be initiated, modified, or continued without explicit provider review and authorization. ' +
  'Provider is solely responsible for all prescribing decisions.';

// ── Main Entry Point ──

export function generateDosageFramework(
  track: MetabolicTrack,
  tier: TierLevel,
  status: SafetyStatus,
  intake?: MetabolicIntake,
): DosageFramework {
  const entry = DOSING_TABLE[track][tier];
  const personalizedPeptidePlan = intake
    ? buildPeptidePersonalizedPlan(intake, track, tier, status)
    : null;

  return {
    track,
    tier,
    startRange: entry.startRange,
    cadence: entry.cadence,
    escalationCriteria: entry.escalationCriteria,
    holdRules: entry.holdRules,
    monitoringCadence: entry.monitoringCadence,
    providerAuthorizationNote: PROVIDER_AUTHORIZATION_NOTE,
    constrainedByStatus: status !== 'eligible',
    personalizedPeptidePlan,
  };
}
