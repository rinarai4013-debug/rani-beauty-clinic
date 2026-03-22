import { NextRequest, NextResponse } from 'next/server';
import { analyzeSkinFromPhoto, type SkinAnalysisResult } from '@/lib/photo-simulation/skin-analysis';

// ─── Rate Limiter: 5 requests per minute per IP ────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60_000);

// ─── Request Body Type ──────────────────────────────────────────────

interface SkinAnalysisRequest {
  image: string; // base64 image data (with or without data URL prefix)
}

// ─── POST Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: SkinAnalysisRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Please send JSON with an "image" field.' },
        { status: 400 }
      );
    }

    // Validate image data
    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json(
        { error: 'Missing "image" field. Please provide base64-encoded image data.' },
        { status: 400 }
      );
    }

    // Check image size (rough estimate — base64 is ~4/3 of binary size)
    // Reject images over 20MB base64 (~15MB binary)
    if (body.image.length > 20_000_000) {
      return NextResponse.json(
        { error: 'Image is too large. Please upload an image under 15MB.' },
        { status: 400 }
      );
    }

    // Run analysis
    const result: SkinAnalysisResult = await analyzeSkinFromPhoto(body.image);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during skin analysis.';

    console.error('[API /skin-analysis] Error:', message);

    // Determine appropriate status code
    const status = message.includes('too small') || message.includes('Invalid image')
      ? 400
      : message.includes('high demand')
        ? 429
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
