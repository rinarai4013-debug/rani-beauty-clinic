import { NextResponse } from 'next/server';
import { generateAISimulation, type SimulationRequest } from '@/lib/photo-simulation/ai-simulation';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

/** Rate limit: 3 requests per minute (AI generation is expensive) */
const SIMULATION_RATE_LIMIT = { limit: 3, windowMs: 60_000 };

/** Max payload size - 10MB for base64 photo */
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

const VALID_TIMEFRAMES = ['1-month', '3-months', '6-months'] as const;

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('simulation-generate', ip, SIMULATION_RATE_LIMIT);
  if (!allowed) {
    return rateLimitResponse(resetIn);
  }

  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Payload too large. Maximum photo size is 10MB.' },
        { status: 413 },
      );
    }

    const body = await request.json();
    const { photoBase64, treatments, timeframe, intensity } = body;

    // Validate required fields
    if (!photoBase64 || typeof photoBase64 !== 'string') {
      return NextResponse.json(
        { error: 'photoBase64 is required and must be a string' },
        { status: 400 },
      );
    }

    if (!treatments || !Array.isArray(treatments) || treatments.length === 0) {
      return NextResponse.json(
        { error: 'treatments is required and must be a non-empty array of strings' },
        { status: 400 },
      );
    }

    if (!timeframe || !VALID_TIMEFRAMES.includes(timeframe)) {
      return NextResponse.json(
        { error: `timeframe must be one of: ${VALID_TIMEFRAMES.join(', ')}` },
        { status: 400 },
      );
    }

    const parsedIntensity = typeof intensity === 'number' ? Math.max(0, Math.min(1, intensity)) : 0.7;

    const simulationRequest: SimulationRequest = {
      photoBase64,
      treatments: treatments.map(String),
      timeframe: timeframe as SimulationRequest['timeframe'],
      intensity: parsedIntensity,
    };

    const result = await generateAISimulation(simulationRequest);

    return NextResponse.json({
      imageUrl: result.imageUrl,
      timeframe: result.timeframe,
      treatments: result.treatments,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('[API /simulation/generate] Error:', error);

    const message = error instanceof Error ? error.message : 'Simulation generation failed';

    // Don't expose internal errors to client
    const isTimeout = message.includes('timed out');
    const clientMessage = isTimeout
      ? 'Simulation timed out. Please try again with a simpler request.'
      : 'An error occurred while generating the simulation. Please try again.';

    return NextResponse.json(
      { error: clientMessage },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
