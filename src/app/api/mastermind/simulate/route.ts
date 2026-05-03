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
import { getSessionByIdAsyncRetry, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { z } from 'zod';
import { NON_RENDERABLE_IMAGE_MARKERS, isRenderableImageValue } from '@/lib/mastermind/image-markers';
import { buildTreatmentPlanCustomization } from '@/lib/mastermind/treatment-customization';
import {
  isRenderableSourcePhoto,
  renderPhotoSimulationFrameImage,
} from '@/lib/mastermind/photo-simulation-renderer';
import type { SimulationComparison, SimulationFrame } from '@/types/mastermind';

import { withSentry } from '@/lib/sentry-utils';

export const maxDuration = 30;
const SimulateSessionSchema = z.object({
  sessionId: z.string().min(1).optional(),
  sourcePhotoUrl: z.string().min(1).optional(),
});

function isPersistableSourcePhoto(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (NON_RENDERABLE_IMAGE_MARKERS.has(trimmed.toLowerCase())) return false;
  return isRenderableSourcePhoto(trimmed);
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSimulationPlaceholderImage(
  trajectory: 'with' | 'without',
  frame: SimulationFrame,
): { imageDataUrl: string; kind: SimulationFrame['kind'] } {
  const palette =
    trajectory === 'with'
      ? {
          backgroundStart: '#F1FCF6',
          backgroundEnd: '#DEF8EA',
          accent: '#059669',
          accentMuted: '#D1FAE5',
          title: 'Projected Outcome',
        }
      : {
          backgroundStart: '#FFF5F5',
          backgroundEnd: '#FFE4E6',
          accent: '#E11D48',
          accentMuted: '#FFD5DD',
          title: 'Projected Outcome',
        };

  const heading = `Projected outcome — Month ${frame.timepoint}`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${escapeSvgText(`${palette.title} projection ${frame.timepoint}`)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${palette.backgroundStart}" />
      <stop offset="100%" stop-color="${palette.backgroundEnd}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)" />
  <rect x="72" y="72" width="1056" height="756" rx="36" fill="#ffffff" opacity="0.9" />
  <!-- F-11 defense-in-depth: explicit projection badge baked into the SVG -->
  <rect x="120" y="116" width="270" height="44" rx="22" fill="#0F1D2C" />
  <text x="255" y="145" fill="#ffffff" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="700" text-anchor="middle" letter-spacing="3">DATA PROJECTION</text>
  <text x="120" y="220" fill="${palette.accent}" font-size="56" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeSvgText(palette.title)}</text>
  <text x="120" y="278" fill="#0F1D2C" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="600">${escapeSvgText(heading)}</text>
  <rect x="120" y="320" width="430" height="170" rx="20" fill="${palette.accentMuted}" />
  <text x="152" y="384" fill="#0F1D2C" font-size="28" font-family="Inter, Arial, sans-serif" font-weight="600">Projected Aura Score</text>
  <text x="152" y="456" fill="${palette.accent}" font-size="66" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeSvgText(String(frame.auraScoreProjection))}</text>
  <rect x="580" y="320" width="500" height="170" rx="20" fill="${palette.accentMuted}" />
  <text x="612" y="384" fill="#0F1D2C" font-size="28" font-family="Inter, Arial, sans-serif" font-weight="600">Projected Skin Age</text>
  <text x="612" y="456" fill="${palette.accent}" font-size="66" font-family="Inter, Arial, sans-serif" font-weight="800">${escapeSvgText(String(frame.skinAgeProjection))}</text>
  <text x="120" y="572" fill="#425466" font-size="29" font-family="Inter, Arial, sans-serif">${escapeSvgText(frame.description.slice(0, 140))}</text>
  <text x="120" y="778" fill="#6B7280" font-size="22" font-family="Inter, Arial, sans-serif">Data-driven projection from consultation findings — not a face simulation.</text>
</svg>`;

  return {
    imageDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    kind: 'data-projection',
  };
}

async function resolveFrameImage(
  sourcePhotoUrl: string | null | undefined,
  trajectory: 'with' | 'without',
  frame: SimulationFrame,
): Promise<{ imageDataUrl: string; kind: SimulationFrame['kind'] }> {
  const rendered = await renderPhotoSimulationFrameImage(sourcePhotoUrl, trajectory, frame);
  if (rendered) return rendered;

  if (isPersistableSourcePhoto(sourcePhotoUrl)) {
    return { imageDataUrl: sourcePhotoUrl, kind: 'photo-simulation' };
  }

  return { ...buildSimulationPlaceholderImage(trajectory, frame), kind: 'data-projection' };
}

async function ensureFrameImages(
  comparison: SimulationComparison,
  sourcePhotoUrl: string | null | undefined,
): Promise<SimulationComparison> {
  const mapFrames = (
    frames: SimulationFrame[],
    trajectory: 'with' | 'without',
  ): Promise<SimulationFrame[]> =>
    Promise.all(
      frames.map(async (frame) => {
      const existingImage = typeof frame.imageDataUrl === 'string' ? frame.imageDataUrl : '';
      const existingKind = frame.kind;
      if (isRenderableImageValue(existingImage)) {
        return { ...frame, imageDataUrl: existingImage, kind: existingKind ?? 'photo-simulation' };
      }
      return {
        ...frame,
        ...(await resolveFrameImage(sourcePhotoUrl, trajectory, frame)),
      };
    }),
  );

  return {
    ...comparison,
    withTreatment: {
      ...comparison.withTreatment,
      frames: await mapFrames(comparison.withTreatment.frames, 'with'),
    },
    withoutTreatment: {
      ...comparison.withoutTreatment,
      frames: await mapFrames(comparison.withoutTreatment.frames, 'without'),
    },
  };
}

function buildDataDrivenSimulation(
  auraScore: number,
  skinAge: number,
  chronologicalAge: number,
  concerns: string[],
  planCost?: number,
): SimulationComparison {
  const frame = (
    timepoint: string,
    monthNumber: number,
    score: number,
    age: number,
    desc: string,
  ): SimulationFrame => ({
    kind: 'data-projection',
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
    frame(
      '1M',
      1,
      auraScore + improvementPotential * 0.25,
      skinAge - skinAgeReduction * 0.15,
      `Initial results visible — early improvement in ${topConcerns}`,
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
      `Full treatment effects realized — significant visible transformation`,
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
  const declineRate = Math.max(2, Math.round(auraScore * 0.04));
  const agingRate = Math.max(1, Math.round((skinAge - chronologicalAge + 3) * 0.3));

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

      const { sessionId, sourcePhotoUrl: requestSourcePhotoUrl } = parsed.data;

      let result: SimulationComparison;
      let renderMode = 'mock';

      if (sessionId) {
        const session = await getSessionByIdAsyncRetry(sessionId);
        if (!session) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }
        const sessionPhoto =
          requestSourcePhotoUrl ||
          (typeof session.sourcePhotoUrl === 'string' ? session.sourcePhotoUrl : null);

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
          const customizedCost = buildTreatmentPlanCustomization(session)?.selectedTotal;
          const planCost = customizedCost && customizedCost > 0
            ? customizedCost
            : session.mastermindPlan?.recommendations
            ? [
                ...(session.mastermindPlan.recommendations.primary || []),
                ...(session.mastermindPlan.recommendations.complementary || []),
              ].reduce(
                (sum: number, t: { totalEstimate?: number }) => sum + (t.totalEstimate || 0),
                0,
              )
            : undefined;

          result = buildDataDrivenSimulation(
            scan.auraScore.overall,
            scan.auraScore.skinAge,
            chronoAge,
            concerns,
            planCost,
          );
          result = await ensureFrameImages(result, sessionPhoto);
          renderMode = sessionPhoto && isRenderableSourcePhoto(sessionPhoto)
            ? 'photo-data-driven'
            : 'data-driven';
        } else {
          result = mockSimulationComparison();
          result = await ensureFrameImages(result, sessionPhoto);
        }

        const updated = sessionReducer(session, { type: 'SET_SIMULATION', comparison: result });
        await saveSessionAsync(updated);
      } else {
        result = mockSimulationComparison();
        result = await ensureFrameImages(result, requestSourcePhotoUrl);
      }

      return NextResponse.json({
        success: true,
        data: result,
        meta: { renderMode },
      });
    } catch (error) {
      console.error('[Mastermind Simulate] Error:', error);
      return NextResponse.json({ success: false, error: 'Simulation failed' }, { status: 500 });
    }
  });
}
