import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAISimulation } from '@/lib/photo-simulation/ai-simulation';

// ─── Request Schema ─────────────────────────────────────────────────────

const simulationRequestSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
  treatmentPresets: z.array(z.string()).min(1, 'At least one treatment preset is required'),
  intensity: z.number().min(0).max(1),
  timeframe: z.enum(['1-month', '3-months', '6-months']),
});

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    const { imageBase64, treatmentPresets, intensity, timeframe } = parsed.data;

    const result = await generateAISimulation({
      photoBase64: imageBase64,
      treatments: treatmentPresets,
      intensity,
      timeframe,
    });

    return NextResponse.json({
      imageUrl: result.imageUrl,
      confidence: result.confidence,
      timeframe: result.timeframe,
      treatments: result.treatments,
    });
  } catch (error) {
    console.error('[API] /api/simulation/generate error:', error);

    const message =
      error instanceof Error ? error.message : 'Simulation generation failed';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
