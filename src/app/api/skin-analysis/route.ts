import { NextRequest, NextResponse } from 'next/server';

import { analyzeSkinFromPhoto } from '@/lib/photo-simulation/skin-analysis';
import { generateAuraSkinScanHTML } from '@/lib/templates/pdf-templates';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_LENGTH = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 128;

class RequestValidationError extends Error {}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
}

async function extractPhotoFromRequest(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('photo');
    if (file instanceof File) {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
        throw new RequestValidationError('Photo must be a JPEG, PNG, or WEBP image.');
      }
      if (file.size > MAX_PHOTO_BYTES) {
        throw new RequestValidationError('Photo must be 8 MB or smaller.');
      }
      return fileToDataUrl(file);
    }

    const photoBase64 = formData.get('photoBase64');
    return typeof photoBase64 === 'string' && photoBase64.length <= MAX_BASE64_LENGTH
      ? photoBase64
      : null;
  }

  const body = await request.json().catch(() => ({}));
  return typeof body.photoBase64 === 'string' && body.photoBase64.length <= MAX_BASE64_LENGTH
    ? body.photoBase64
    : null;
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'skin-analysis',
    accepts: ['multipart/form-data', 'application/json'],
    outputs: ['analysis', 'optional aura-skin-scan html'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('skin-analysis', ip, RATE_LIMITS.AI);
    if (!allowed) return rateLimitResponse(resetIn);

    const photoBase64 = await extractPhotoFromRequest(request);

    if (!photoBase64) {
      return NextResponse.json(
        { error: 'Missing photo. Send `photo` as multipart/form-data or `photoBase64` in JSON.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeSkinFromPhoto(photoBase64);
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const html = generateAuraSkinScanHTML({
      clientName: 'Patient',
      providerName: 'Rina Rai',
      date: today,
      overallScore: analysis.overallScore,
      projectedScore: analysis.projectedScore,
      skinType: analysis.skinType,
      ageRange: analysis.ageRange,
      summary: analysis.summary,
      concerns: analysis.concerns,
      recommendations: analysis.recommendations.map((recommendation) => ({
        name: recommendation.service.name,
        priority: recommendation.priority,
        reason: recommendation.reason,
        estimatedImprovement: recommendation.estimatedImprovement,
      })),
      nextSteps:
        'Book a consultation with Rani Beauty Clinic so we can confirm these findings, personalize your treatment order, and review pricing and financing options.',
    });

    return NextResponse.json({
      success: true,
      analysis,
      pdf: {
        template: 'aura-skin-scan',
        filename: `rani-aura-skin-scan-${new Date().toISOString().slice(0, 10)}.html`,
        html,
      },
    });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[skin-analysis] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Skin analysis failed. Please try again.' },
      { status: 500 },
    );
  }
}
