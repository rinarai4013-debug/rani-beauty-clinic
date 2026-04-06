import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Allow up to 30s for large file processing
export const maxDuration = 30;

// ─── Constants ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_WIDTH = 1200;

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Send a "file" field in multipart form data.' },
        { status: 400 },
      );
    }

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

    // Process with sharp: resize if wider than MAX_WIDTH, output as JPEG
    // For PDFs, sharp renders the first page via libvips
    let image = sharp(buffer, isPdf ? { pages: 1, density: 200 } : undefined);
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
}
