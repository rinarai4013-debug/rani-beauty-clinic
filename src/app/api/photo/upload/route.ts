import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // Rate limit: use FORM preset (5/min)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const { allowed, remaining, resetIn } = rateLimit(
    'photo-upload',
    ip,
    RATE_LIMITS.FORM,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
        },
      },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('photo');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No photo file provided' },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG images are accepted' },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Generate a simple filename
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const filename = `photo_${Date.now()}.${ext}`;

    return NextResponse.json(
      {
        url: dataUrl,
        filename,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process photo upload' },
      { status: 500 },
    );
  }
}
