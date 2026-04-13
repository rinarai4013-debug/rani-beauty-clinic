/**
 * Mastermind Plan Generator
 *
 * Takes Aura Scan results + intake data → generates a comprehensive
 * treatment plan using existing plan-builder modules.
 *
 * Uses:
 * - recommendTreatmentPlan() from ai-recommender.ts
 * - validatePlan() from constraints.ts
 * - generateConversionPlan() from conversion-engine.ts
 * - generatePackages() from package-generator.ts
 */

import type { AuraScanResult, MastermindPlan, MastermindTreatment, TreatmentSequenceItem } from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { PlanPhase, SelectedService, GeneratedPackage } from '@/lib/plan-builder/types';
import { recommendTreatmentPlan, type ClientProfile, type RecommendedService } from '@/lib/plan-builder/ai-recommender';
import { validatePlan } from '@/lib/plan-builder/constraints';
import { generatePackages } from '@/lib/plan-builder/package-generator';
import { PHASE_LABELS } from '@/lib/plan-builder/types';
import { BOOMRX_FORMULARY_OVERRIDES } from '@/lib/mastermind/boomrx-formulary';

// ── MAIN GENERATOR ──

export function generateMastermindPlan(
  scanResult: AuraScanResult,
  intakeData: Partial<ConsultationFormData>
): MastermindPlan {
  const planId = `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // 1. Build client profile for the recommender
  const profile = buildClientProfile(scanResult, intakeData);

  // 2. Get AI-recommended services with phase assignments
  const recommendations = recommendTreatmentPlan(profile);

  // 3. Build plan phases for validation and packaging
  const phases = buildPlanPhases(recommendations);

  // 4. Validate the plan
  const warnings = validatePlan(phases);

  // 5. Generate 3-tier packages
  const packages = generatePackages(phases);

  // 6. Categorize treatments into primary/complementary/maintenance
  const categorized = categorizeTreatments(recommendations, scanResult);

  // 7. Build treatment sequencing
  const sequencing = buildSequencing(recommendations);

  // 8. Build aftercare preview
  const aftercarePreview = buildAftercarePreview(categorized.primary);

  // 9. Generate AI summary narratives
  const aiSummary = buildAiSummary(scanResult, categorized, intakeData);

  // 10. Map warnings to contraindications
  const contraindications = warnings
    .filter((w) => w.severity === 'error')
    .map((w) => ({
      treatment: w.serviceName || 'Plan',
      reason: w.message,
      severity: 'relative' as const,
      medicalFactor: w.type || 'constraint',
      recommendation: w.suggestion || 'Review with provider',
    }));

  return {
    planId,
    generatedAt: new Date().toISOString(),
    recommendations: categorized,
    sequencing,
    packages,
    aftercarePreview,
    aiSummary,
    contraindications,
  };
}

// ── BUILD CLIENT PROFILE ──

function buildClientProfile(
  scanResult: AuraScanResult,
  intakeData: Partial<ConsultationFormData>
): ClientProfile {
  const concerns = (intakeData.skinConcerns as string[]) || [];
  const interests = (intakeData.treatmentInterests as string[]) || [];
  const budget = mapBudgetBand(intakeData.budget as string);
  const timeline = mapUrgency(intakeData.timeline as string);
  const downtime = mapDowntimeTolerance((intakeData as { downtimeTolerance?: string }).downtimeTolerance);
  const painTolerance = mapPainTolerance((intakeData as { painTolerance?: string }).painTolerance);

  // Map medical data to contraindications
  const contraindications: string[] = [];
  if (intakeData.pregnant) contraindications.push('pregnancy');
  if (intakeData.breastfeeding) contraindications.push('breastfeeding');
  if (intakeData.bloodThinners) contraindications.push('blood_thinners');
  if (intakeData.isotretinoinHistory) contraindications.push('isotretinoin');
  if (intakeData.keloidHistory) contraindications.push('keloid');
  if (intakeData.activeSkinInfection) contraindications.push('active_infection');

  return {
    skinConcerns: concerns,
    treatmentInterests: interests,
    fitzpatrickType: scanResult.skinAnalysis.fitzpatrickType,
    budgetBand: budget,
    urgency: timeline,
    contraindications,
    downtimeTolerance: downtime,
    painTolerance,
  };
}

function mapBudgetBand(budget?: string): 'value' | 'mid' | 'premium' {
  switch (budget) {
    case 'starter': return 'value';
    case 'moderate': return 'mid';
    case 'premium':
    case 'investment': return 'premium';
    default: return 'mid';
  }
}

function mapUrgency(timeline?: string): 'relaxed' | 'moderate' | 'event-driven' {
  switch (timeline) {
    case 'event': return 'event-driven';
    case 'asap': return 'event-driven';
    case 'gradual': return 'relaxed';
    case 'ongoing': return 'moderate';
    default: return 'moderate';
  }
}

function mapDowntimeTolerance(downtime?: string): 'none' | 'minimal' | 'moderate' | 'flexible' {
  switch (downtime) {
    case 'none': return 'none';
    case 'minimal': return 'minimal';
    case 'moderate': return 'moderate';
    case 'flexible': return 'flexible';
    case 'low': return 'minimal';
    case 'high': return 'flexible';
    default: return 'moderate';
  }
}

function mapPainTolerance(pain?: string): 'low' | 'medium' | 'high' {
  switch (pain) {
    case 'low': return 'low';
    case 'high': return 'high';
    default: return 'medium';
  }
}

// ── BUILD PLAN PHASES ──

function buildPlanPhases(
  recommendations: RecommendedService[]
): [PlanPhase, PlanPhase, PlanPhase] {
  const phases: [PlanPhase, PlanPhase, PlanPhase] = [
    { id: 1, ...PHASE_LABELS[1], services: [] },
    { id: 2, ...PHASE_LABELS[2], services: [] },
    { id: 3, ...PHASE_LABELS[3], services: [] },
  ];

  recommendations.forEach((rec, i) => {
    const selected: SelectedService = {
      id: `sel_${i}_${rec.service.id}`,
      serviceId: rec.service.id,
      service: rec.service,
      quantity: 1,
      notes: rec.reason,
      phase: rec.phase,
    };
    phases[rec.phase - 1].services.push(selected);
  });

  return phases;
}

// ── CATEGORIZE TREATMENTS ──

function categorizeTreatments(
  recommendations: RecommendedService[],
  scanResult: AuraScanResult
): {
  primary: MastermindTreatment[];
  complementary: MastermindTreatment[];
  maintenance: MastermindTreatment[];
} {
  const primary: MastermindTreatment[] = [];
  const complementary: MastermindTreatment[] = [];
  const maintenance: MastermindTreatment[] = [];

  recommendations.forEach((rec) => {
    const treatment = toMastermindTreatment(rec, scanResult);

    if (rec.anchorTreatment || rec.phase === 2) {
      primary.push({ ...treatment, priority: 'essential' });
    } else if (rec.quickWin || rec.phase === 1) {
      complementary.push({ ...treatment, priority: 'recommended' });
    } else {
      maintenance.push({ ...treatment, priority: 'optional' });
    }
  });

  // Ensure at least something in each category
  if (primary.length === 0 && complementary.length > 0) {
    primary.push(complementary.shift()!);
  }

  return { primary, complementary, maintenance };
}

function toMastermindTreatment(
  rec: RecommendedService,
  scanResult: AuraScanResult
): MastermindTreatment {
  const service = rec.service;
  const concerns = scanResult.detectedConcerns.map((c) => c.concern.replace(/_/g, ' '));
  const zones = scanResult.zoneAnalysis.map((z) => z.zone);
  const protocol = buildProtocolForService(service.id, service.category, service.bodyAreas);
  const improvementTargets = buildImprovementTargets(scanResult);

  return {
    id: `tx_${service.id}`,
    treatmentName: service.name,
    category: service.category,
    targetConcerns: concerns.slice(0, 3),
    targetZones: zones.slice(0, 3),
    sessionsRequired: service.sessions || 1,
    intervalBetweenSessions: service.sessions > 1 ? '4-6 weeks' : 'As needed',
    expectedImprovement: `${Math.round(rec.fitScore * 0.8)}% improvement expected`,
    timeToResults: service.results || '2-4 weeks',
    longevity: service.results || '3-6 months',
    perSession: service.price || 0,
    totalEstimate: (service.price || 0) * (service.sessions || 1),
    priority: 'recommended',
    urgency: rec.phase === 1 ? 'immediate' : rec.phase === 2 ? 'within-3-months' : 'when-ready',
    downtime: service.downtime || 'Minimal',
    riskLevel: 'low',
    contraindications: [],
    synergiesWith: [],
    aiConfidence: rec.fitScore,
    aiReasoning: rec.reason,
    clinicalRationale: `${rec.whyThisPhase || rec.reason}. Fit score: ${rec.fitScore}/100.`,
    protocol,
    improvementTargets,
  };
}

function buildProtocolForService(
  serviceId: string,
  category: string,
  bodyAreas: string[]
): MastermindTreatment['protocol'] {
  const formularyOverride = BOOMRX_FORMULARY_OVERRIDES[serviceId];
  if (formularyOverride) {
    return {
      dosage: formularyOverride.protocolDosage,
      pulsesOrEnergy: formularyOverride.protocolPulses,
      treatmentAreas: formularyOverride.protocolAreas || bodyAreas,
      frequency: formularyOverride.protocolFrequency,
      endpoint: formularyOverride.protocolEndpoint,
      providerNotes: formularyOverride.providerNotes,
      reference: formularyOverride.sourceDocument,
    };
  }

  switch (category) {
    case 'laser-hair-removal':
      return {
        pulsesOrEnergy: 'Typical: 8-18 J/cm², 10-25 ms, 1-2 passes with 10-15% overlap',
        treatmentAreas: bodyAreas,
        frequency: 'Every 4-6 weeks x 6 sessions',
        endpoint: 'Perifollicular erythema/edema with progressive terminal hair reduction',
        providerNotes: ['Adjust fluence by Fitzpatrick type and anatomic area tolerance'],
      };
    case 'laser':
      return {
        pulsesOrEnergy: 'Nd:YAG protocol range: 1064nm, 8-14 J, pulse duration 5-20 ms',
        treatmentAreas: bodyAreas,
        frequency: 'Every 4 weeks x 3 sessions',
        endpoint: 'Even tone, reduced erythema/pigment burden, texture refinement',
      };
    case 'rf-microneedling':
      return {
        pulsesOrEnergy: 'Depth 0.5-2.5 mm by zone; low-medium-high energy tier by tolerance',
        treatmentAreas: bodyAreas,
        frequency: 'Every 4-6 weeks x 3 sessions',
        endpoint: 'Controlled pinpoint erythema + collagen remodeling progression',
      };
    case 'skin-tightening':
      return {
        pulsesOrEnergy: 'Sofwave pulse plan by area (face, jawline, neck) per device protocol',
        treatmentAreas: bodyAreas,
        frequency: 'Single treatment with reassessment at 12 weeks',
        endpoint: 'Measurable lift/tightening with improved contour definition',
      };
    case 'injectables':
      return {
        dosage: 'Dose per facial anatomy map and dynamic movement assessment',
        treatmentAreas: bodyAreas,
        frequency: 'Initial treatment + touch-up at 2 weeks as indicated',
        endpoint: 'Natural correction with preserved expression and symmetry',
      };
    case 'chemical-peel':
      return {
        dosage: 'Layer count and contact time selected by skin type and prep tolerance',
        treatmentAreas: bodyAreas,
        frequency: 'Every 3-4 weeks x 3 sessions',
        endpoint: 'Improved pigment, texture, and luminosity without prolonged irritation',
      };
    case 'wellness':
    case 'weight-management':
    case 'hormones':
      return {
        dosage: 'Medication/injection per protocol step and clinical response',
        frequency: 'Weekly or monthly cadence by protocol',
        endpoint: 'Symptom and biomarker improvement with tolerable side effects',
      };
    default:
      return {
        treatmentAreas: bodyAreas,
        frequency: 'Per provider protocol',
        endpoint: 'Objective improvement in target concern severity',
      };
  }
}

function buildImprovementTargets(
  scanResult: AuraScanResult
): MastermindTreatment['improvementTargets'] {
  return scanResult.detectedConcerns
    .slice(0, 3)
    .map((concern) => ({
      concern: concern.concern.replace(/_/g, ' '),
      baselineScore: concern.score,
      targetDelta:
        concern.severity === 'severe'
          ? '-25 to -40 points'
          : concern.severity === 'moderate'
            ? '-15 to -25 points'
            : '-8 to -15 points',
      timeframe:
        concern.urgency === 'high'
          ? '8-12 weeks'
          : concern.urgency === 'medium'
            ? '12-16 weeks'
            : '16-24 weeks',
    }));
}

// ── SEQUENCING ──

function buildSequencing(recommendations: RecommendedService[]): TreatmentSequenceItem[] {
  const phaseGroups = new Map<number, RecommendedService[]>();

  recommendations.forEach((rec) => {
    const existing = phaseGroups.get(rec.phase) || [];
    existing.push(rec);
    phaseGroups.set(rec.phase, existing);
  });

  const sequencing: TreatmentSequenceItem[] = [];
  let weekOffset = 0;

  for (const [phase, services] of Array.from(phaseGroups.entries()).sort((a, b) => a[0] - b[0])) {
    const phaseName = PHASE_LABELS[phase as 1 | 2 | 3]?.label || `Phase ${phase}`;
    const treatments = services.map((s, i) => ({
      treatmentId: `tx_${s.service.id}`,
      week: weekOffset + 1 + i * 2,
      sessionNumber: 1,
    }));

    const duration = phase === 1 ? '0-4 weeks' : phase === 2 ? '4-12 weeks' : 'Ongoing';
    const milestone = phase === 1
      ? 'Foundation established, initial results visible'
      : phase === 2
        ? 'Transformation underway, significant improvement'
        : 'Maintaining and protecting results';

    sequencing.push({ phase, phaseName, duration, treatments, expectedMilestone: milestone });
    weekOffset += services.length * 2 + 2;
  }

  return sequencing;
}

// ── AFTERCARE ──

function buildAftercarePreview(
  treatments: MastermindTreatment[]
): MastermindPlan['aftercarePreview'] {
  return treatments.slice(0, 3).map((tx) => ({
    treatmentId: tx.id,
    immediateAftercare: [
      'Avoid direct sun exposure for 24-48 hours',
      'Do not apply makeup for 4-6 hours',
      'Keep skin hydrated with gentle moisturizer',
    ],
    weekOneGuidance: [
      'Use SPF 50+ daily',
      'Avoid aggressive skincare products',
      'Follow up if any concerns arise',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Essential sun protection post-treatment' },
      { product: 'Gentle Hydrating Cleanser', reason: 'Maintain skin barrier' },
    ],
  }));
}

// ── AI SUMMARY ──

function buildAiSummary(
  scanResult: AuraScanResult,
  categorized: { primary: MastermindTreatment[]; complementary: MastermindTreatment[]; maintenance: MastermindTreatment[] },
  intakeData: Partial<ConsultationFormData>
): MastermindPlan['aiSummary'] {
  const score = scanResult.auraScore;
  const totalTreatments = categorized.primary.length + categorized.complementary.length + categorized.maintenance.length;
  const topConcerns = scanResult.detectedConcerns.slice(0, 3);
  const projectedScore = scanResult.predictiveMetrics.withTreatment.sixMonths.auraScore;
  const firstName = intakeData.firstName || 'you';

  return {
    patientFacing: `Based on your Aura Score of ${score.overall} (${score.label}), we've designed a personalized ${totalTreatments}-treatment plan to address your top concerns. ${firstName}, your skin age is currently ${score.skinAge} — with this plan, we project bringing it down to ${scanResult.predictiveMetrics.withTreatment.sixMonths.skinAge} within 6 months.`,

    providerFacing: `Patient presents with Aura Score ${score.overall}/100, skin age ${score.skinAge} (chronological ${score.chronologicalAge}, delta +${score.skinAgeDelta}). ${topConcerns.length} primary concerns identified: ${topConcerns.map((c) => `${c.concern} (${c.severity})`).join(', ')}. Recommended phased approach with ${categorized.primary.length} primary, ${categorized.complementary.length} complementary, and ${categorized.maintenance.length} maintenance treatments.`,

    keyHighlights: [
      `Aura Score improvement: ${score.overall} → ${projectedScore} projected in 6 months`,
      `Skin age reduction: ${score.skinAge} → ${scanResult.predictiveMetrics.withTreatment.sixMonths.skinAge}`,
      `${topConcerns.length} concerns addressed with synergistic treatments`,
      `${categorized.primary.length} essential treatments prioritized for maximum impact`,
    ],

    addressedConcerns: topConcerns.map((concern) => ({
      concern: concern.concern.replace(/_/g, ' '),
      solution: categorized.primary.find((t) =>
        t.targetConcerns.some((tc) => tc.includes(concern.concern.replace(/_/g, ' ')))
      )?.treatmentName || 'Personalized treatment protocol',
      timeline: concern.urgency === 'high' ? '2-4 weeks initial results' : '4-8 weeks progressive improvement',
    })),
  };
}
