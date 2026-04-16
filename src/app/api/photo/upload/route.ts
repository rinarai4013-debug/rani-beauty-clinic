import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getSessionFromRequest } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

// Allow up to 30s for large file processing
export const maxDuration = 30;

// ─── Constants ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_WIDTH = 1200;

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  return withSentry('photo/upload', async () => {
    const staffSession = await getSessionFromRequest(request).catch(() => null);
    if (!staffSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ip = getClientIP(request);
    const { allowed, resetIn } = rateLimit("form", ip, RATE_LIMITS.FORM);
    if (!allowed) return rateLimitResponse(resetIn);

    try {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (parseErr) {
        console.error('[API] /api/photo/upload formData parse error:', parseErr);
        return NextResponse.json(
          { error: 'File too large for server. Maximum ~4.5MB on this plan. Try a smaller image or compress the PDF.' },
          { status: 413 },
        );
      }
      const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Send a "file" field in multipart form data.' },
        { status: 400 },
      );
    }

      console.error(`[API] /api/photo/upload — file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Validate file type (also accept common PDF MIME variants)
      const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
      if (!isPdf && !ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Accepted: JPEG, PNG, WebP, HEIC, PDF.' },
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

      if (isPdf) {
        // PDFs: store as base64 directly (sharp/libvips PDF support not available on Vercel)
        const base64 = buffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;

        return NextResponse.json({
          imageBase64: dataUrl,
          originalName: file.name,
          originalSize: file.size,
          processedSize: buffer.length,
          isPdf: true,
        });
      }

      // Images: process with sharp — resize if wider than MAX_WIDTH, output as JPEG
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

      const message =
        error instanceof Error ? error.message : 'Photo upload processing failed';

      return NextResponse.json(
        { error: message },
        { status: 500 },
      );
    }
  });
}
