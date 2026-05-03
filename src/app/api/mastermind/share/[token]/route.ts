/**
 * GET /api/mastermind/share/[token]
 *
 * Resolves a patient share token and returns a SANITIZED version
 * of the Mastermind session — patient-facing data only.
 *
 * Strips: provider notes, clinical rationale, internal IDs, medical flags,
 * AI confidence scores, contraindications, provider review state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByIdAsync } from '@/lib/mastermind/session';
import { resolveToken } from '@/lib/mastermind/share-token';
import type {
  AuraScore,
  AuraConcern,
  ZoneAnalysis,
  MastermindTreatment,
  TreatmentSequenceItem,
  SimulationComparison,
  AuraDeviceAnalysis,
  PredictiveMetrics,
  TreatmentPlanCustomization,
} from '@/types/mastermind';
import { buildTreatmentPlanCustomization } from '@/lib/mastermind/treatment-customization';
import { isRenderableImageValue } from '@/lib/mastermind/image-markers';
import {
  isRenderableSourcePhoto,
  renderPhotoSimulationFrameImage,
} from '@/lib/mastermind/photo-simulation-renderer';
import type { GeneratedPackage } from '@/lib/plan-builder/types';
import type {
  PatientPlanData,
  PatientAuraScore,
  PatientConcern,
  PatientZone,
  PatientTreatment,
  PatientSequenceItem,
  PatientPackage,
  PatientAftercare,
  PatientSimulation,
  PatientDeviceAnalysis,
  PatientPredictiveMetrics,
  PatientTreatmentPlanCustomization,
  PatientIntakeSummary,
} from '@/types/patient-plan';

import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';

export type { PatientPlanData };

// ── Sanitizers ──

function sanitizeAuraScore(score: AuraScore): PatientAuraScore {
  return {
    overall: score.overall,
    grade: score.grade,
    label: score.label,
    skinAge: score.skinAge,
    chronologicalAge: score.chronologicalAge,
    skinAgeDelta: score.skinAgeDelta,
    percentile: score.percentile,
  };
}

function sanitizeConcerns(concerns: AuraConcern[]): PatientConcern[] {
  return concerns.map((c) => ({
    concern: c.concern,
    severity: c.severity,
    description: c.description, // patient-friendly description
    trending: c.trending,
    zones: c.zones,
    // Strips: id, score, urgency, clinicalNote
  }));
}

function sanitizeZones(zones: ZoneAnalysis[]): PatientZone[] {
  return zones.map((z) => ({
    zoneName: z.zoneName,
    overallScore: z.overallScore,
    concerns: z.concerns.map((c) => ({
      type: c.type,
      severity: c.severity,
    })),
    // Strips: zone (internal key), skinAge, recommendations (provider-facing)
  }));
}

function sanitizeDeviceAnalysis(analysis: AuraDeviceAnalysis): PatientDeviceAnalysis {
  return {
    categories: analysis.categories.map((c) => ({
      label: c.label,
      absoluteScore: c.absoluteScore,
      peerScore: c.peerScore,
      severity: c.severity,
      description: c.description,
    })),
    compositeSkinScore: analysis.compositeSkinScore,
  };
}

function sanitizePredictiveMetrics(metrics: PredictiveMetrics): PatientPredictiveMetrics {
  return {
    withoutIntervention: {
      oneYear: {
        skinAge: metrics.withoutIntervention.oneYear.skinAge,
        auraScore: metrics.withoutIntervention.oneYear.auraScore,
        topConcerns: metrics.withoutIntervention.oneYear.topConcerns,
      },
      threeYears: {
        skinAge: metrics.withoutIntervention.threeYears.skinAge,
        auraScore: metrics.withoutIntervention.threeYears.auraScore,
        topConcerns: metrics.withoutIntervention.threeYears.topConcerns,
      },
      fiveYears: {
        skinAge: metrics.withoutIntervention.fiveYears.skinAge,
        auraScore: metrics.withoutIntervention.fiveYears.auraScore,
        topConcerns: metrics.withoutIntervention.fiveYears.topConcerns,
      },
    },
    withTreatment: {
      threeMonths: {
        skinAge: metrics.withTreatment.threeMonths.skinAge,
        auraScore: metrics.withTreatment.threeMonths.auraScore,
      },
      sixMonths: {
        skinAge: metrics.withTreatment.sixMonths.skinAge,
        auraScore: metrics.withTreatment.sixMonths.auraScore,
      },
      oneYear: {
        skinAge: metrics.withTreatment.oneYear.skinAge,
        auraScore: metrics.withTreatment.oneYear.auraScore,
      },
    },
  };
}

function sanitizeTreatment(t: MastermindTreatment): PatientTreatment {
  return {
    treatmentName: t.treatmentName,
    category: t.category,
    targetConcerns: t.targetConcerns,
    targetZones: t.targetZones?.map((zone) => zone.replace(/_/g, ' ')),
    sessionsRequired: t.sessionsRequired,
    intervalBetweenSessions: t.intervalBetweenSessions,
    expectedImprovement: t.expectedImprovement,
    timeToResults: t.timeToResults,
    longevity: t.longevity,
    perSession: t.perSession,
    totalEstimate: t.totalEstimate,
    priority: t.priority,
    downtime: t.downtime,
    riskLevel: t.riskLevel,
    aiReasoning: t.aiReasoning, // patient-facing only
    synergiesWith: t.synergiesWith,
    // Strips: id, clinicalRationale, aiConfidence, contraindications, urgency, targetZones
  };
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sanitizeIntakeSummary(intakeData: unknown): PatientIntakeSummary {
  const intake = intakeData && typeof intakeData === 'object'
    ? intakeData as Record<string, unknown>
    : {};

  const goals = [
    ...stringArray(intake.goals),
    ...stringArray(intake.primaryGoals),
    ...stringArray(intake.goal),
  ];
  const relevantHistory = [
    ...stringArray(intake.conditions),
    ...stringArray(intake.allergies),
    ...stringArray(intake.medications),
    ...stringArray(intake.skinHistory),
  ];

  return {
    goals: Array.from(new Set(goals)).slice(0, 8),
    timeline: stringValue(intake.timeline),
    budget: stringValue(intake.budget),
    targetAreas: Array.from(new Set([
      ...stringArray(intake.targetAreas),
      ...stringArray(intake.treatmentAreas),
    ])).slice(0, 12),
    treatmentInterests: stringArray(intake.treatmentInterests).slice(0, 12),
    skinConcerns: stringArray(intake.skinConcerns).slice(0, 12),
    currentRoutine: {
      morning: stringValue(intake.skincareAM),
      evening: stringValue(intake.skincarePM),
    },
    relevantHistory: Array.from(new Set(relevantHistory)).slice(0, 10),
  };
}

function sanitizeCustomization(
  customization: TreatmentPlanCustomization | null,
): PatientTreatmentPlanCustomization | null {
  if (!customization) return null;
  return {
    updatedAt: customization.updatedAt,
    submissionDate: customization.submissionDate,
    selectedTotal: customization.selectedTotal,
    selectedSessionCount: customization.selectedSessionCount,
    planNotes: customization.planNotes,
    items: customization.items.map((item) => ({
      id: item.id,
      treatmentName: item.treatmentName,
      category: item.category,
      selected: item.selected,
      sessions: item.sessions,
      perSession: item.perSession,
      totalEstimate: item.totalEstimate,
      scheduledDate: item.scheduledDate,
      scheduledDay: item.scheduledDay,
      targetAreas: item.targetAreas,
      notes: item.notes,
      priority: item.priority,
      source: item.source,
    })),
  };
}

function sanitizeSequencing(
  items: TreatmentSequenceItem[],
  allTreatments: MastermindTreatment[],
): PatientSequenceItem[] {
  const treatmentMap = new Map(allTreatments.map((t) => [t.id, t.treatmentName]));
  return items.map((item) => ({
    phase: item.phase,
    phaseName: item.phaseName,
    duration: item.duration,
    treatments: item.treatments.map((t) => ({
      treatmentName: treatmentMap.get(t.treatmentId) || 'Treatment',
      week: t.week,
      sessionNumber: t.sessionNumber,
    })),
    expectedMilestone: item.expectedMilestone,
  }));
}

function buildExactPackageFromCustomization(
  customization: TreatmentPlanCustomization,
  tier: GeneratedPackage['tier'],
): GeneratedPackage | null {
  const selectedItems = customization.items.filter((item) => item.selected);
  if (selectedItems.length === 0 || customization.selectedTotal <= 0) return null;

  const originalPrice = selectedItems.reduce(
    (sum, item) => sum + Math.max(0, item.perSession) * Math.max(1, item.sessions),
    0,
  );
  const price = customization.selectedTotal;
  const savingsVsStandalone = Math.max(0, originalPrice - price);
  const discount = originalPrice > 0 ? Math.round((savingsVsStandalone / originalPrice) * 100) : 0;

  return {
    tier,
    name: 'Your Selected Treatment Plan',
    subtitle: 'Exact services, areas, dates, and session counts selected by your consultant',
    price,
    totalPrice: price,
    originalPrice: Math.max(originalPrice, price),
    discount,
    sessions: customization.selectedSessionCount,
    lineItems: selectedItems.map((item) => ({
      service: item.targetAreas.length > 0
        ? `${item.treatmentName} (${item.targetAreas.join(', ')})`
        : item.treatmentName,
      qty: item.sessions,
      unitPrice: item.perSession,
      total: item.totalEstimate,
    })),
    monthlyPayment12: Math.ceil(price / 12),
    monthlyPayment24: Math.ceil(price / 24),
    highlighted: true,
    extras: customization.planNotes ? [customization.planNotes] : [],
    bestFor: 'Following the exact treatment sequence selected during your consultation.',
    resultIntensity: 'Personalized',
    concernsAddressed: Array.from(new Set(selectedItems.map((item) => item.category))).slice(0, 6),
    whyBest: 'This reflects the exact plan your consultant selected for your goals, treatment areas, schedule, and estimated investment.',
    savingsVsStandalone,
  };
}

function sanitizePackages(
  packages: GeneratedPackage[],
  customization?: TreatmentPlanCustomization | null,
  selectedTier?: GeneratedPackage['tier'] | null,
): PatientPackage[] {
  const exactPackage = customization
    ? buildExactPackageFromCustomization(customization, selectedTier || 'Transform')
    : null;
  const packageList = exactPackage
    ? [
        ...packages
          .filter((p) => p.tier !== exactPackage.tier)
          .map((p) => ({ ...p, highlighted: false })),
        exactPackage,
      ]
    : packages;

  return packageList.map((p) => ({
    tier: p.tier,
    name: p.name,
    subtitle: p.subtitle,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount,
    sessions: p.sessions,
    lineItems: p.lineItems,
    monthlyPayment12: p.monthlyPayment12,
    monthlyPayment24: p.monthlyPayment24,
    highlighted: p.highlighted,
    extras: p.extras,
    bestFor: p.bestFor,
    resultIntensity: p.resultIntensity,
    concernsAddressed: p.concernsAddressed,
    whyBest: p.whyBest,
    savingsVsStandalone: p.savingsVsStandalone,
  }));
}

async function repairSimulationFramesForPatient(
  sim: SimulationComparison,
  sourcePhotoUrl: string | null | undefined,
): Promise<SimulationComparison> {
  if (!sourcePhotoUrl || !isRenderableSourcePhoto(sourcePhotoUrl)) return sim;

  const repairFrames = async (
    frames: SimulationComparison['withTreatment']['frames'],
    trajectory: 'with' | 'without',
  ) => Promise.all(
    frames.map(async (frame) => {
      if (frame.kind === 'photo-simulation' && isRenderableImageValue(frame.imageDataUrl)) {
        return frame;
      }
      const rendered = await renderPhotoSimulationFrameImage(sourcePhotoUrl, trajectory, frame);
      return rendered ? { ...frame, ...rendered } : frame;
    }),
  );

  return {
    ...sim,
    withTreatment: {
      ...sim.withTreatment,
      frames: await repairFrames(sim.withTreatment.frames, 'with'),
    },
    withoutTreatment: {
      ...sim.withoutTreatment,
      frames: await repairFrames(sim.withoutTreatment.frames, 'without'),
    },
  };
}

function sanitizeSimulation(sim: SimulationComparison): PatientSimulation {
  return {
    withTreatment: {
      frames: sim.withTreatment.frames.map((f) => ({
        timepoint: f.timepoint,
        monthNumber: f.monthNumber,
        description: f.description,
        auraScoreProjection: f.auraScoreProjection,
        skinAgeProjection: f.skinAgeProjection,
        imageDataUrl: f.imageDataUrl,
        kind: f.kind,
      })),
      narrative: sim.withTreatment.narrative,
    },
    withoutTreatment: {
      frames: sim.withoutTreatment.frames.map((f) => ({
        timepoint: f.timepoint,
        monthNumber: f.monthNumber,
        description: f.description,
        auraScoreProjection: f.auraScoreProjection,
        skinAgeProjection: f.skinAgeProjection,
        imageDataUrl: f.imageDataUrl,
        kind: f.kind,
      })),
      narrative: sim.withoutTreatment.narrative,
    },
    comparison: {
      auraScoreDelta: sim.comparison.auraScoreDelta,
      skinAgeDelta: sim.comparison.skinAgeDelta,
      keyDifferentiators: sim.comparison.keyDifferentiators,
    },
    // Strips: costOfDelay (internal sales data)
  };
}

// ── Main Handler ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  return withSentry('mastermind/share/[token]', async () => {
    try {
      const { token } = await params;

      if (!token || typeof token !== 'string') {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
      }

      // Resolve token (checks cache, falls back to Airtable)
      const record = await resolveToken(token);
      if (!record) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This link has expired or is invalid. Please contact Rani Beauty Clinic for a new link.',
          },
          { status: 404 },
        );
      }

      // Load session
      const session = await getSessionByIdAsync(record.sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session data is no longer available.' },
          { status: 404 },
        );
      }

      // Build sanitized patient-facing data
      const scan = session.auraScanResult;
      const plan = session.mastermindPlan;

      if (!scan || !plan) {
        return NextResponse.json(
          { success: false, error: 'Treatment plan data is incomplete.' },
          { status: 422 },
        );
      }

      // Collect all treatments for name lookups
      const recs = plan.recommendations || { primary: [], complementary: [], maintenance: [] };
      const allTreatments = [
        ...(recs.primary || []),
        ...(recs.complementary || []),
        ...(recs.maintenance || []),
      ];

      // Build aftercare with treatment names
      const treatmentMap = new Map(allTreatments.map((t) => [t.id, t.treatmentName]));
      const aftercare: PatientAftercare[] = (plan.aftercarePreview || []).map((a) => ({
        treatmentName: treatmentMap.get(a.treatmentId) || 'Treatment',
        immediateAftercare: a.immediateAftercare,
        weekOneGuidance: a.weekOneGuidance,
        productsRecommended: a.productsRecommended,
      }));
      const customization = buildTreatmentPlanCustomization(session);

      const patientData: PatientPlanData = {
        patientName:
          session.patientName || (session.intakeData?.firstName as string) || 'Valued Client',
        consultationDate: session.createdAt || new Date().toISOString(),
        selectedPackageTier: session.selectedPackageTier,
        intakeSummary: sanitizeIntakeSummary(session.intakeData),
        auraScore: sanitizeAuraScore(scan.auraScore),
        deviceAnalysis: scan.auraDeviceAnalysis
          ? sanitizeDeviceAnalysis(scan.auraDeviceAnalysis)
          : null,
        concerns: sanitizeConcerns(scan.detectedConcerns),
        zones: sanitizeZones(scan.zoneAnalysis),
        predictiveMetrics: scan.predictiveMetrics
          ? sanitizePredictiveMetrics(scan.predictiveMetrics)
          : null,
        treatments: {
          primary: plan.recommendations.primary.map(sanitizeTreatment),
          complementary: plan.recommendations.complementary.map(sanitizeTreatment),
          maintenance: plan.recommendations.maintenance.map(sanitizeTreatment),
        },
        sequencing: sanitizeSequencing(plan.sequencing, allTreatments),
        customPlan: sanitizeCustomization(customization),
        packages: sanitizePackages(plan.packages, customization, session.selectedPackageTier),
        aftercare,
        simulation: session.simulationComparison
          ? sanitizeSimulation(
              await repairSimulationFramesForPatient(session.simulationComparison, session.sourcePhotoUrl),
            )
          : null,
        summary: {
          patientFacing: plan.aiSummary.patientFacing,
          keyHighlights: plan.aiSummary.keyHighlights,
          addressedConcerns: plan.aiSummary.addressedConcerns,
        },
      };

      return NextResponse.json({
        success: true,
        data: patientData,
        expiresAt: record.expiresAt,
      });
    } catch (err) {
      logEvent('api', 'error', '[Share] Token resolution failed', { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}
