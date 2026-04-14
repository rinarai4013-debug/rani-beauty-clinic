/**
 * POST /api/mastermind/simulate
 *
 * Generates simulation comparison data for a Mastermind session.
 * Uses actual scan results (auraScore, skinAge, concerns) to build
 * personalized projections. Falls back to mock data if no scan exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { mockSimulationComparison } from '@/lib/mastermind/mock-data';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { logEvent } from '@/lib/logging/structured-logger';
import { z } from 'zod';
import type { SimulationComparison, SimulationFrame } from '@/types/mastermind';

import { withSentry } from '@/lib/sentry-utils';

export const maxDuration = 30;
const SimulateSessionSchema = z.object({
  sessionId: z.string().min(1).optional(),
  selectedTreatmentIds: z.array(z.string().min(1)).optional(),
  scenarioMode: z.enum(['conservative', 'typical', 'aggressive']).optional(),
});

function buildDataDrivenSimulation(
  auraScore: number,
  skinAge: number,
  chronologicalAge: number,
  concerns: string[],
  planCost?: number,
  treatmentNames: string[] = [],
  scenarioMode: 'conservative' | 'typical' | 'aggressive' = 'typical',
  selectedTreatmentIds: string[] = [],
): SimulationComparison {
  const frame = (
    timepoint: string,
    monthNumber: number,
    score: number,
    age: number,
    desc: string,
  ): SimulationFrame => ({
    imageDataUrl: '',
    timepoint,
    monthNumber,
    description: desc,
    auraScoreProjection: Math.round(score),
    skinAgeProjection: Math.round(age),
  });

  // Calculate improvement trajectory based on starting score
  // Lower scores = more room for improvement
  const scenarioMultiplier =
    scenarioMode === 'conservative' ? 0.82 : scenarioMode === 'aggressive' ? 1.18 : 1;
  const improvementPotential = Math.min(40, Math.round((100 - auraScore) * 0.6 * scenarioMultiplier));
  const skinAgeReduction = Math.min(12, Math.round((skinAge - chronologicalAge + 5) * 0.8 * scenarioMultiplier));

  // Build concern-specific descriptions
  const topConcerns = concerns.slice(0, 3).join(', ') || 'skin concerns';
  const topTreatments = treatmentNames.slice(0, 3);
  const treatmentSummary = topTreatments.length > 0 ? topTreatments.join(', ') : 'your selected protocol';

  const withTreatmentFrames = [
    frame(
      '1M',
      1,
      auraScore + improvementPotential * 0.25,
      skinAge - skinAgeReduction * 0.15,
      `Initial results visible — early improvement in ${topConcerns} with ${treatmentSummary}`,
    ),
    frame(
      '3M',
      3,
      auraScore + improvementPotential * 0.5,
      skinAge - skinAgeReduction * 0.4,
      `Collagen remodeling underway — noticeable texture and tone improvement`,
    ),
    frame(
      '6M',
      6,
      auraScore + improvementPotential * 0.8,
      skinAge - skinAgeReduction * 0.75,
      `Full treatment effects realized — significant visible transformation from ${treatmentSummary}`,
    ),
    frame(
      '1Y',
      12,
      auraScore + improvementPotential,
      skinAge - skinAgeReduction,
      `Peak results with maintenance — optimal skin health achieved`,
    ),
  ];

  // Without treatment: gradual decline
  const declineRate = Math.max(2, Math.round(auraScore * 0.04 * (scenarioMode === 'conservative' ? 1.15 : 1)));
  const agingRate = Math.max(1, Math.round((skinAge - chronologicalAge + 3) * 0.3 * (scenarioMode === 'conservative' ? 1.15 : 0.95)));

  const withoutTreatmentFrames = [
    frame(
      '6M',
      6,
      auraScore - declineRate,
      skinAge + agingRate * 0.5,
      'Continued gradual decline without intervention',
    ),
    frame(
      '1Y',
      12,
      auraScore - declineRate * 2,
      skinAge + agingRate,
      `${topConcerns} become more pronounced`,
    ),
    frame(
      '3Y',
      36,
      auraScore - declineRate * 4,
      skinAge + agingRate * 3,
      'Significant aging acceleration — deeper concerns develop',
    ),
    frame(
      '5Y',
      60,
      Math.max(20, auraScore - declineRate * 6),
      skinAge + agingRate * 5,
      'Advanced aging — more aggressive treatment required to achieve results',
    ),
  ];

  const finalWithScore = withTreatmentFrames[3].auraScoreProjection;
  const finalWithoutScore = withoutTreatmentFrames[3].auraScoreProjection;
  const finalWithAge = withTreatmentFrames[3].skinAgeProjection;
  const finalWithoutAge = withoutTreatmentFrames[3].skinAgeProjection;
  const scoreDelta = Math.round(finalWithScore - finalWithoutScore);
  const ageDelta = Math.round(finalWithoutAge - finalWithAge);

  const estimatedCost = planCost || Math.round(2000 + (100 - auraScore) * 40);
  const delayedCost1Y = Math.round(estimatedCost * 1.35);
  const delayedCost3Y = Math.round(estimatedCost * 2.1);

  return {
    withTreatment: {
      frames: withTreatmentFrames,
      narrative: `Starting from an Aura Score of ${auraScore}, your personalized treatment plan progressively improves skin health. By 12 months, we project a score of ${Math.round(finalWithScore)} with a skin age reduction of ${Math.round(skinAgeReduction)} years — addressing ${topConcerns} through ${treatmentSummary}.`,
    },
    withoutTreatment: {
      frames: withoutTreatmentFrames,
      narrative: `Without intervention, natural aging combined with environmental factors will progressively worsen ${topConcerns}. Your Aura Score is projected to decline to ${Math.round(finalWithoutScore)} over 5 years, with skin age advancing to ${Math.round(finalWithoutAge)}.`,
    },
    selection: {
      scope: selectedTreatmentIds.length > 0 ? 'single-treatment' : 'full-plan',
      selectedTreatmentIds,
      scenarioMode,
    },
    comparison: {
      auraScoreDelta: scoreDelta,
      skinAgeDelta: ageDelta,
      keyDifferentiators: [
        `${scoreDelta}-point Aura Score difference at 5 years`,
        `${ageDelta}-year skin age gap between treatment paths`,
        `Treatment now costs $${estimatedCost.toLocaleString()} vs $${delayedCost3Y.toLocaleString()}+ if delayed 3 years`,
      ],
    },
    costOfDelay: {
      currentPlanCost: estimatedCost,
      costIfDelayed1Year: delayedCost1Y,
      costIfDelayed3Years: delayedCost3Y,
      reasoning: `Starting at an Aura Score of ${auraScore}, early intervention yields the best results at the lowest cost. Delaying treatment means ${topConcerns} will require more aggressive (and expensive) approaches to achieve the same outcomes.`,
    },
  };
}

export async function POST(request: NextRequest) {
  return withSentry('mastermind/simulate', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const parsed = SimulateSessionSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request body' },
          { status: 400 },
        );
      }

      const { sessionId } = parsed.data;
      const selectedTreatmentIds = parsed.data.selectedTreatmentIds || [];
      const scenarioMode = parsed.data.scenarioMode || 'typical';

      let result: SimulationComparison;
      let renderMode = 'mock';

      if (sessionId) {
        const session = await getSessionByIdAsync(sessionId);
        if (!session) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        // Use actual scan data if available
        if (session.auraScanResult?.auraScore) {
          const scan = session.auraScanResult;
          const concerns = scan.detectedConcerns?.map((c: { concern: string }) => c.concern) || [];
          const dobStr = session.intakeData?.dob;
          const dobAge = dobStr
            ? Math.floor((Date.now() - new Date(dobStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : NaN;
          const chronoAge = !isNaN(dobAge)
            ? dobAge
            : scan.auraScore.skinAge - (scan.auraScore.skinAgeDelta || 0);

          // Get plan cost if available
          const planTreatments = session.mastermindPlan?.recommendations
            ? [
                ...(session.mastermindPlan.recommendations.primary || []),
                ...(session.mastermindPlan.recommendations.complementary || []),
              ]
            : [];
          const selectedTreatmentSet = new Set(selectedTreatmentIds);
          const scopedTreatments =
            selectedTreatmentSet.size > 0
              ? planTreatments.filter((t: { id?: string }) => t.id && selectedTreatmentSet.has(t.id))
              : planTreatments;
          const planCost = planTreatments.length > 0
            ? planTreatments.reduce(
                (sum: number, t: { totalEstimate?: number }) => sum + (t.totalEstimate || 0),
                0,
              )
            : undefined;
          const treatmentNames = scopedTreatments.map((t: { treatmentName?: string }) => t.treatmentName || '').filter(Boolean);

          const relatedFromFlags = (scan.medicalFlags || [])
            .flatMap((flag: { relatedTreatments?: string[] }) => flag.relatedTreatments || [])
            .map((entry: string) => entry.toLowerCase());
          const hasContraindicationConflict = scopedTreatments.some((t: { id?: string; treatmentName?: string }) => {
            const id = (t.id || '').toLowerCase();
            const name = (t.treatmentName || '').toLowerCase();
            return relatedFromFlags.some((related) => id.includes(related) || name.includes(related) || related.includes(id));
          });

          if (selectedTreatmentSet.size > 0 && hasContraindicationConflict) {
            return NextResponse.json(
              {
                success: false,
                error:
                  'Selected treatment is flagged with contraindications for this session context. Switch to full-plan simulation or resolve provider review flags.',
              },
              { status: 422 },
            );
          }

          result = buildDataDrivenSimulation(
            scan.auraScore.overall,
            scan.auraScore.skinAge,
            chronoAge,
            concerns,
            planCost,
            treatmentNames,
            scenarioMode,
            selectedTreatmentIds,
          );
          renderMode = 'data-driven';
        } else {
          result = mockSimulationComparison();
        }

        const updated = sessionReducer(session, { type: 'SET_SIMULATION', comparison: result });
        await saveSessionAsync(updated);
      } else {
        result = mockSimulationComparison();
      }

      return NextResponse.json({
        success: true,
        data: result,
        meta: { renderMode },
      });
    } catch (error) {
      logEvent('api', 'error', '[Mastermind Simulate] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ success: false, error: 'Simulation failed' }, { status: 500 });
    }
  });
}
