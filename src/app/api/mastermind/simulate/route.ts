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
import type { SimulationComparison, SimulationFrame } from '@/types/mastermind';

export const maxDuration = 30;

function buildDataDrivenSimulation(
  auraScore: number,
  skinAge: number,
  chronologicalAge: number,
  concerns: string[],
  planCost?: number
): SimulationComparison {
  const frame = (
    timepoint: string,
    monthNumber: number,
    score: number,
    age: number,
    desc: string
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
  const improvementPotential = Math.min(40, Math.round((100 - auraScore) * 0.6));
  const skinAgeReduction = Math.min(12, Math.round((skinAge - chronologicalAge + 5) * 0.8));

  // Build concern-specific descriptions
  const topConcerns = concerns.slice(0, 3).join(', ') || 'skin concerns';

  const withTreatmentFrames = [
    frame('1M', 1,
      auraScore + improvementPotential * 0.25,
      skinAge - skinAgeReduction * 0.15,
      `Initial results visible — early improvement in ${topConcerns}`
    ),
    frame('3M', 3,
      auraScore + improvementPotential * 0.5,
      skinAge - skinAgeReduction * 0.4,
      `Collagen remodeling underway — noticeable texture and tone improvement`
    ),
    frame('6M', 6,
      auraScore + improvementPotential * 0.8,
      skinAge - skinAgeReduction * 0.75,
      `Full treatment effects realized — significant visible transformation`
    ),
    frame('1Y', 12,
      auraScore + improvementPotential,
      skinAge - skinAgeReduction,
      `Peak results with maintenance — optimal skin health achieved`
    ),
  ];

  // Without treatment: gradual decline
  const declineRate = Math.max(2, Math.round(auraScore * 0.04));
  const agingRate = Math.max(1, Math.round((skinAge - chronologicalAge + 3) * 0.3));

  const withoutTreatmentFrames = [
    frame('6M', 6,
      auraScore - declineRate,
      skinAge + agingRate * 0.5,
      'Continued gradual decline without intervention'
    ),
    frame('1Y', 12,
      auraScore - declineRate * 2,
      skinAge + agingRate,
      `${topConcerns} become more pronounced`
    ),
    frame('3Y', 36,
      auraScore - declineRate * 4,
      skinAge + agingRate * 3,
      'Significant aging acceleration — deeper concerns develop'
    ),
    frame('5Y', 60,
      Math.max(20, auraScore - declineRate * 6),
      skinAge + agingRate * 5,
      'Advanced aging — more aggressive treatment required to achieve results'
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
      narrative: `Starting from an Aura Score of ${auraScore}, your personalized treatment plan progressively improves skin health. By 12 months, we project a score of ${Math.round(finalWithScore)} with a skin age reduction of ${Math.round(skinAgeReduction)} years — addressing ${topConcerns} through targeted interventions.`,
    },
    withoutTreatment: {
      frames: withoutTreatmentFrames,
      narrative: `Without intervention, natural aging combined with environmental factors will progressively worsen ${topConcerns}. Your Aura Score is projected to decline to ${Math.round(finalWithoutScore)} over 5 years, with skin age advancing to ${Math.round(finalWithoutAge)}.`,
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
  try {
    // Auth check — allow unauthenticated in development
    const authSession = await getSessionFromRequest(request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
      return unauthorized();
    }

    const body = await request.json();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    let result: SimulationComparison;
    let renderMode = 'mock';

    if (sessionId) {
      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      // Use actual scan data if available
      if (session.auraScanResult?.auraScore) {
        const scan = session.auraScanResult;
        const concerns = scan.detectedConcerns?.map((c: { concern: string }) => c.concern) || [];
        const chronoAge = session.intakeData?.age
          ? Number(session.intakeData.age)
          : scan.auraScore.skinAge - (scan.auraScore.skinAgeDelta || 0);

        // Get plan cost if available
        const planCost = session.mastermindPlan?.recommendations
          ? [...(session.mastermindPlan.recommendations.primary || []),
             ...(session.mastermindPlan.recommendations.complementary || [])]
            .reduce((sum: number, t: { totalEstimate?: number }) => sum + (t.totalEstimate || 0), 0)
          : undefined;

        result = buildDataDrivenSimulation(
          scan.auraScore.overall,
          scan.auraScore.skinAge,
          chronoAge,
          concerns,
          planCost
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
    console.error('[Mastermind Simulate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
