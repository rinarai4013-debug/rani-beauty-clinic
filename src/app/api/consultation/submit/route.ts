/**
 * POST /api/consultation/submit
 *
 * Receives wizard form data + photos, creates a MastermindSession,
 * and optionally runs the Aura Scan. Returns session ID.
 *
 * Flow:
 *   1. Parse multipart FormData (JSON data + photo files)
 *   2. Process first photo via Sharp → base64 data URL
 *   3. Create MastermindSession with intake data + source photo
 *   4. Optionally trigger Aura Scan (async, non-blocking)
 *   5. Return session ID for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSession, saveSession, sessionReducer } from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import type { ConsultationFormData } from '@/lib/consultation/schema';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 1. Parse JSON data
    const dataField = formData.get('data');
    if (!dataField || typeof dataField !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing form data' },
        { status: 400 }
      );
    }

    let intakeData: Partial<ConsultationFormData>;
    try {
      intakeData = JSON.parse(dataField);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid form data JSON' },
        { status: 400 }
      );
    }

    // 2. Process photos — extract first valid photo as source
    let sourcePhotoUrl: string | null = null;
    const photoFiles = formData.getAll('photos');

    for (const file of photoFiles) {
      if (!(file instanceof File)) continue;
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_PHOTO_SIZE) continue;

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        let image = sharp(buffer);
        const metadata = await image.metadata();

        if (metadata.width && metadata.width > MAX_PHOTO_WIDTH) {
          image = image.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
        }

        const processed = await image.jpeg({ quality: 85 }).toBuffer();
        sourcePhotoUrl = `data:image/jpeg;base64,${processed.toString('base64')}`;
        break; // Use first valid photo as simulation source
      } catch (err) {
        console.warn('[Consultation Submit] Photo processing failed:', err);
        continue;
      }
    }

    // 3. Create MastermindSession
    const patientName = `${intakeData.firstName || ''} ${intakeData.lastName || ''}`.trim();
    const patientEmail = (intakeData.email as string) || '';

    const session = createSession({
      intakeData,
      patientName,
      patientEmail,
      sourcePhotoUrl,
    });
    saveSession(session);

    // 4. Auto-run Aura Scan (non-blocking — advance session if it works)
    const useMock = process.env.USE_MOCK_AI === 'true';
    try {
      const scanResult = useMock
        ? mockAuraScanResult()
        : await runAuraScan(intakeData);

      const scanned = sessionReducer(session, {
        type: 'SET_SCAN_RESULT',
        result: scanResult,
      });
      saveSession(scanned);
    } catch (err) {
      // Scan failure is non-blocking — session remains at 'intake' phase
      console.warn('[Consultation Submit] Auto-scan failed:', err);
    }

    // 5. Return session ID
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        patientName,
        hasPhoto: !!sourcePhotoUrl,
        phase: session.phase,
      },
    });
  } catch (error) {
    console.error('[Consultation Submit] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed',
      },
      { status: 500 }
    );
  }
}
