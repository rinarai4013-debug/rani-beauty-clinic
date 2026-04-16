import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAISimulation } from '@/lib/photo-simulation/ai-simulation';
import { generateTrajectoryScenario } from '@/lib/photo-simulation/trajectory-scenarios';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

import { withSentry } from '@/lib/sentry-utils';

// ─── Request Schema ─────────────────────────────────────────────────────

const simulationRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
  treatmentPresets: z.array(z.string()).min(1, 'At least one treatment preset is required'),
  intensity: z.number().min(0).max(1),
  // Additive: '12-months' added; existing '1-month', '3-months', '6-months' preserved
  timeframe: z.enum(['1-month', '3-months', '6-months', '12-months']),
  // Optional scenario generation params (additive — existing consumers unaffected)
  serviceKey: z.string().optional(),
});

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return withSentry('simulation/generate', async () => {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('ai', ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);

    try {
      const body = await request.json().catch(() => null);

      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', details: { body: ['Invalid JSON'] } },
          { status: 400 },
        );
      }

      const parsed = simulationRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Invalid request',
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      const { imageBase64, treatmentPresets, intensity, timeframe, serviceKey } = parsed.data;

      const result = await generateAISimulation({
        photoBase64: imageBase64,
        treatments: treatmentPresets,
        intensity,
        timeframe: timeframe as '1-month' | '3-months' | '6-months',
      });

      // ── Additive scenario output ─────────────────────────────────────
      // Only appended when serviceKey is provided. Existing response shape preserved.
      const scenarioData = serviceKey
        ? generateTrajectoryScenario(serviceKey)
        : null;

      return NextResponse.json({
        // Existing contract (unchanged)
        imageUrl: result.imageUrl,
        confidence: result.confidence,
        timeframe: result.timeframe,
        treatments: result.treatments,
        // Additive fields (undefined when not requested)
        ...(scenarioData && {
          scenarios: {
            withTreatment: scenarioData.withTreatment,
            withoutTreatment: scenarioData.withoutTreatment,
          },
          timeline: scenarioData.withTreatment.map((p) => p.timeframe),
          assumptions: scenarioData.assumptions,
        }),
      });
    } catch (error) {
      console.error('[API] /api/simulation/generate error:', error);

      const message = error instanceof Error ? error.message : 'Simulation generation failed';

      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
