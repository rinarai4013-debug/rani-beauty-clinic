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

const SERVICE_HINT_KEYWORDS: Record<string, string[]> = {
  hydrafacial: ['hydrafacial', 'facial'],
  'laser-facials': ['laser facial', 'laser'],
  'rf-microneedling': ['rf micro', 'microneedling'],
  'microneedling-arrissence-undereye': ['arrissence', 'undereye', 'microneedling'],
  peels: ['peel', 'vi peel', 'biorepeel', 'prx'],
  'cosmelan-peel': ['cosmelan'],
  'skin-boosters': ['skin booster', 'booster'],
  sofwave: ['sofwave'],
  botox: ['botox'],
  'dermal-fillers': ['filler'],
  sculptra: ['sculptra'],
  'laser-hair': ['laser hair'],
  hormones: ['hormone', 'trt', 'testosterone', 'thyroid'],
  glp1: ['glp', 'semaglutide', 'tirzepatide', 'weight'],
};
const PACKAGE_FINANCING_APR = 0.1499;

type PlanPreferences = {
  includeServiceHints: string[];
  excludeServiceHints: string[];
  includeProductRecommendations: boolean;
};

function normalizeHint(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function toUniqueStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const normalized = normalizeHint(item);
    if (normalized) unique.add(normalized);
  }

  return Array.from(unique);
}

function getPlanPreferences(intakeData: Partial<ConsultationFormData>): PlanPreferences | null {
  const intakeRecord = intakeData as Record<string, unknown>;
  const rawPreferences = intakeRecord.planPreferences;
  const preferenceRecord =
    rawPreferences && typeof rawPreferences === 'object'
      ? (rawPreferences as Record<string, unknown>)
      : null;

  const includeServiceHints = toUniqueStringArray(preferenceRecord?.includeServiceHints);
  const excludeServiceHints = toUniqueStringArray(preferenceRecord?.excludeServiceHints);
  const includeProductRecommendations = preferenceRecord?.includeProductRecommendations !== false;

  const hasServiceControls =
    includeServiceHints.length > 0 || excludeServiceHints.length > 0;
  const hasProductControl = includeProductRecommendations === false;

  if (!hasServiceControls && !hasProductControl) {
    return null;
  }

  return {
    includeServiceHints,
    excludeServiceHints,
    includeProductRecommendations,
  };
}

function buildHintTokens(hints: string[]): string[] {
  const tokens = new Set<string>();

  for (const hint of hints) {
    const normalizedHint = normalizeHint(hint);
    if (!normalizedHint) continue;

    const mappedKeywords = SERVICE_HINT_KEYWORDS[normalizedHint] ?? [];
    const implicitKeywords = normalizedHint.split('-').filter(Boolean);
    const phrases = [normalizedHint.replace(/-/g, ' '), ...mappedKeywords, ...implicitKeywords];

    for (const phrase of phrases) {
      const normalizedPhrase = normalizeSearchText(phrase);
      if (normalizedPhrase.length >= 2) {
        tokens.add(normalizedPhrase);
      }
    }
  }

  return Array.from(tokens);
}

function matchesTokens(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;

  const normalizedText = normalizeSearchText(text);
  if (!normalizedText) return false;

  return tokens.some((token) => normalizedText.includes(token));
}

function treatmentSearchText(treatment: MastermindTreatment): string {
  return [
    treatment.id,
    treatment.treatmentName,
    treatment.category,
    ...treatment.targetConcerns,
    ...treatment.targetZones,
  ].join(' ');
}

function applyTreatmentFilters(
  treatments: MastermindTreatment[],
  includeTokens: string[],
  excludeTokens: string[],
): MastermindTreatment[] {
  if (treatments.length === 0) return treatments;

  return treatments.filter((treatment) => {
    const haystack = treatmentSearchText(treatment);
    const isExcluded = matchesTokens(haystack, excludeTokens);
    if (isExcluded) return false;

    if (includeTokens.length === 0) return true;
    return matchesTokens(haystack, includeTokens);
  });
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function calculateMonthlyPayment(principal: number, apr: number, months: number): number {
  if (!Number.isFinite(principal) || principal <= 0 || months <= 0) return 0;
  if (apr <= 0) return Math.round(principal / months);

  const monthlyRate = apr / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  return Math.round(payment);
}

function recalculatePackage(pkg: GeneratedPackage): GeneratedPackage {
  if (!pkg.lineItems || pkg.lineItems.length === 0) {
    return pkg;
  }

  const originalPrice = roundMoney(
    pkg.lineItems.reduce((sum, lineItem) => {
      const qty = Number.isFinite(lineItem.qty) ? lineItem.qty : 0;
      const unitPrice = Number.isFinite(lineItem.unitPrice) ? lineItem.unitPrice : 0;
      const lineTotal = Number.isFinite(lineItem.total) && lineItem.total > 0
        ? lineItem.total
        : qty * unitPrice;
      return sum + lineTotal;
    }, 0),
  );

  const discount = Number.isFinite(pkg.discount) ? Math.min(90, Math.max(0, pkg.discount)) : 0;
  const price = roundMoney(originalPrice * (1 - discount / 100));
  const sessions = pkg.lineItems.reduce((sum, lineItem) => {
    const qty = Number.isFinite(lineItem.qty) ? lineItem.qty : 0;
    return sum + qty;
  }, 0);

  return {
    ...pkg,
    originalPrice,
    price,
    totalPrice: price,
    sessions,
    monthlyPayment12: calculateMonthlyPayment(price, PACKAGE_FINANCING_APR, 12),
    monthlyPayment24: calculateMonthlyPayment(price, PACKAGE_FINANCING_APR, 24),
    savingsVsStandalone: Math.max(0, roundMoney(originalPrice - price)),
  };
}

export function applyPlanPreferencesToPlan(
  plan: MastermindPlan,
  intakeData: Partial<ConsultationFormData>,
): MastermindPlan {
  const preferences = getPlanPreferences(intakeData);
  if (!preferences) return plan;

  const includeTokens = buildHintTokens(preferences.includeServiceHints);
  const excludeTokens = buildHintTokens(preferences.excludeServiceHints);
  const hasServiceFilters = includeTokens.length > 0 || excludeTokens.length > 0;

  let recommendations = plan.recommendations;

  if (hasServiceFilters) {
    const filteredRecommendations = {
      primary: applyTreatmentFilters(plan.recommendations.primary, includeTokens, excludeTokens),
      complementary: applyTreatmentFilters(plan.recommendations.complementary, includeTokens, excludeTokens),
      maintenance: applyTreatmentFilters(plan.recommendations.maintenance, includeTokens, excludeTokens),
    };

    const filteredTotal =
      filteredRecommendations.primary.length +
      filteredRecommendations.complementary.length +
      filteredRecommendations.maintenance.length;

    if (filteredTotal > 0) {
      if (filteredRecommendations.primary.length === 0) {
        if (filteredRecommendations.complementary.length > 0) {
          filteredRecommendations.primary.push(filteredRecommendations.complementary.shift()!);
        } else if (filteredRecommendations.maintenance.length > 0) {
          filteredRecommendations.primary.push(filteredRecommendations.maintenance.shift()!);
        }
      }
      recommendations = filteredRecommendations;
    }
  }

  const selectedTreatments = [
    ...recommendations.primary,
    ...recommendations.complementary,
    ...recommendations.maintenance,
  ];
  const selectedTreatmentIds = new Set(selectedTreatments.map((treatment) => treatment.id));
  const selectedTreatmentNames = selectedTreatments.map((treatment) =>
    normalizeSearchText(treatment.treatmentName),
  );

  const sequencing = hasServiceFilters
    ? plan.sequencing
      .map((sequenceItem) => ({
        ...sequenceItem,
        treatments: sequenceItem.treatments.filter((treatment) =>
          selectedTreatmentIds.has(treatment.treatmentId),
        ),
      }))
      .filter((sequenceItem) => sequenceItem.treatments.length > 0)
    : plan.sequencing;

  const filteredAftercare = hasServiceFilters
    ? plan.aftercarePreview.filter((aftercareItem) =>
      selectedTreatmentIds.has(aftercareItem.treatmentId),
    )
    : plan.aftercarePreview;
  const aftercarePreview = preferences.includeProductRecommendations
    ? filteredAftercare
    : filteredAftercare.map((aftercareItem) => ({
      ...aftercareItem,
      productsRecommended: [],
    }));

  const packages = hasServiceFilters
    ? plan.packages.map((pkg) => {
      const filteredLineItems = pkg.lineItems.filter((lineItem) => {
        const serviceText = normalizeSearchText(lineItem.service);
        if (!serviceText) return false;

        if (matchesTokens(serviceText, excludeTokens)) return false;

        const matchesSelectedTreatment = selectedTreatmentNames.some(
          (name) => name && (serviceText.includes(name) || name.includes(serviceText)),
        );

        if (includeTokens.length > 0) {
          return matchesTokens(serviceText, includeTokens) || matchesSelectedTreatment;
        }
        return matchesSelectedTreatment;
      });

      if (filteredLineItems.length === 0 || filteredLineItems.length === pkg.lineItems.length) {
        return pkg;
      }

      return recalculatePackage({
        ...pkg,
        lineItems: filteredLineItems,
      });
    })
    : plan.packages;

  return {
    ...plan,
    recommendations,
    sequencing: sequencing.length > 0 ? sequencing : plan.sequencing,
    packages,
    aftercarePreview,
  };
}

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
    downtimeTolerance: 'moderate',
    painTolerance: 'medium',
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
  };
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
