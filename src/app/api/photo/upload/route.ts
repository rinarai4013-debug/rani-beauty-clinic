import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

// ─── Constants ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH = 1200;
const photoUploadSchema = z.object({
  file: z.instanceof(File, {
    message: 'No file provided. Send a "file" field in multipart form data.',
  }),
});

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit('photo-upload', ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    const formData = await request.formData();
    const rawFile = formData.get('file');
    const parsed = photoUploadSchema.safeParse({ file: rawFile });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid upload payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { file } = parsed.data;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG are accepted.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 },
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with sharp: resize if wider than MAX_WIDTH, output as JPEG
    let image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width && metadata.width > MAX_WIDTH) {
      image = image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    const processedBuffer = await image
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      imageBase64: dataUrl,
      originalName: file.name,
      originalSize: file.size,
      processedSize: processedBuffer.length,
      width: metadata.width && metadata.width > MAX_WIDTH ? MAX_WIDTH : metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    console.error('[API] /api/photo/upload error:', error);

    return NextResponse.json(
      { error: 'Photo upload processing failed. Please try again.' },
      { status: 500 },
    );
  }
}
