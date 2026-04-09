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
import { createSession, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { z } from 'zod';

const MAX_PHOTO_WIDTH = 1200;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const IntakePayloadSchema = z.record(z.unknown());

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
      const parsed = IntakePayloadSchema.safeParse(JSON.parse(dataField));
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid form data payload' },
          { status: 400 }
        );
      }
      intakeData = parsed.data as Partial<ConsultationFormData>;
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
    await saveSessionAsync(session);

    // 4. Write to Airtable Client Intakes table (non-blocking — CRM pipeline + n8n triggers)
    // Include rich intake data so clinic staff can act on it immediately
    try {
      const concerns = Array.isArray(intakeData.skinConcerns)
        ? (intakeData.skinConcerns as string[]).join(', ')
        : '';
      const areas = Array.isArray(intakeData.targetAreas)
        ? (intakeData.targetAreas as string[]).join(', ')
        : '';
      const goals = typeof intakeData.goals === 'string' ? intakeData.goals : '';
      const timeline = typeof intakeData.timeline === 'string' ? intakeData.timeline : '';
      const budget = typeof intakeData.budget === 'string' ? intakeData.budget : '';

      const intakeSummary = [
        `Skin Concerns: ${concerns || 'Not specified'}`,
        `Target Areas: ${areas || 'Not specified'}`,
        goals ? `Goals: ${goals}` : '',
        timeline ? `Timeline: ${timeline}` : '',
        budget ? `Budget: ${budget}` : '',
        sourcePhotoUrl ? 'Photo: Uploaded' : 'Photo: None',
        `Session ID: ${session.id}`,
      ].filter(Boolean).join('\n');

      await rateLimitedQuery(async () => {
        await Tables.intakes().create(
          {
            'Full Name': patientName,
            'Email': patientEmail,
            'Phone Number': (intakeData.phone as string) || '',
            'Processing Status': 'New',
            'Intake Summary (AI)': intakeSummary,
          },
          { typecast: true }
        );
      });
    } catch (err) {
      // Airtable write failure is non-blocking — session still created
      console.warn('[Consultation Submit] Airtable intake write failed:', err);
    }

    // 5. Auto-run Aura Scan (truly non-blocking — don't hold up the response)
    // The scan can take 10-30s with Claude AI; returning the session ID
    // immediately prevents Vercel function timeouts and gives the client
    // a responsive experience. The dashboard polls for scan completion.
    const useMock = process.env.USE_MOCK_AI === 'true';
    const useAIScan = !!process.env.ANTHROPIC_API_KEY && !useMock;

    const scanPromise = (async () => {
      try {
        let scanResult;
        if (useMock) {
          scanResult = mockAuraScanResult();
        } else if (useAIScan) {
          const { runAIAuraScan } = await import('@/lib/mastermind/ai-aura-scan');
          scanResult = await runAIAuraScan(intakeData, sourcePhotoUrl || undefined);
        } else {
          scanResult = await runAuraScan(intakeData);
        }

        const scanned = sessionReducer(session, {
          type: 'SET_SCAN_RESULT',
          result: scanResult,
        });
        await saveSessionAsync(scanned);
        console.log(`[Consultation Submit] Auto-scan completed for session ${session.id}`);
      } catch (err) {
        console.error('[Consultation Submit] Auto-scan failed:', err);
      }
    })();

    // For mock/rule-based scans (fast), wait briefly so the session
    // is ready when the dashboard loads. For AI scans, don't block.
    if (useMock || !useAIScan) {
      await scanPromise;
    }
    // AI scan runs in background — client polls /api/mastermind/session for completion

    // 6. Return session ID
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
