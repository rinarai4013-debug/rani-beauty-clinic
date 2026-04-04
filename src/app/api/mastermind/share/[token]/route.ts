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
import { resolveToken } from '../route';
import type {
  MastermindSession,
  AuraScore,
  AuraConcern,
  ZoneAnalysis,
  MastermindTreatment,
  TreatmentSequenceItem,
  SimulationComparison,
  AuraDeviceAnalysis,
  PredictiveMetrics,
} from '@/types/mastermind';
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
} from '@/types/patient-plan';

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

function sanitizeSequencing(
  items: TreatmentSequenceItem[],
  allTreatments: MastermindTreatment[]
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

function sanitizePackages(packages: GeneratedPackage[]): PatientPackage[] {
  return packages.map((p) => ({
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
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Resolve token
    const record = resolveToken(token);
    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'This link has expired or is invalid. Please contact Rani Beauty Clinic for a new link.',
        },
        { status: 404 }
      );
    }

    // Load session
    const session = await getSessionByIdAsync(record.sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session data is no longer available.' },
        { status: 404 }
      );
    }

    // Build sanitized patient-facing data
    const scan = session.auraScanResult;
    const plan = session.mastermindPlan;

    if (!scan || !plan) {
      return NextResponse.json(
        { success: false, error: 'Treatment plan data is incomplete.' },
        { status: 422 }
      );
    }

    // Collect all treatments for name lookups
    const allTreatments = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
      ...plan.recommendations.maintenance,
    ];

    // Build aftercare with treatment names
    const treatmentMap = new Map(allTreatments.map((t) => [t.id, t.treatmentName]));
    const aftercare: PatientAftercare[] = plan.aftercarePreview.map((a) => ({
      treatmentName: treatmentMap.get(a.treatmentId) || 'Treatment',
      immediateAftercare: a.immediateAftercare,
      weekOneGuidance: a.weekOneGuidance,
      productsRecommended: a.productsRecommended,
    }));

    const patientData: PatientPlanData = {
      patientName: session.patientName,
      consultationDate: session.createdAt,
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
      packages: sanitizePackages(plan.packages),
      aftercare,
      simulation: session.simulationComparison
        ? sanitizeSimulation(session.simulationComparison)
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
    console.error('[Share] Token resolution failed:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
