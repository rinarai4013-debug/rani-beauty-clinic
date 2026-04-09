/**
 * POST /api/mastermind/pdf
 *
 * Generates a branded treatment plan PDF for a Mastermind session.
 * Stores the HTML persistently and returns a stable serve URL.
 *
 * Thin route: validates → calls pdf-generator → stores → returns URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { generateConsultationPdf } from '@/lib/mastermind/pdf-generator';
import { storePdf } from '@/lib/mastermind/pdf-storage';
import { z } from 'zod';

const PdfBodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = PdfBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    // Load session
    const session = await getSessionByIdAsync(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate readiness
    if (!session.auraScanResult || !session.mastermindPlan) {
      return NextResponse.json(
        { success: false, error: 'Session requires scan result and plan for PDF generation' },
        { status: 400 }
      );
    }

    // Generate PDF content
    const pdfResult = generateConsultationPdf(session);

    // Store persistently
    let pdfUrl: string;
    try {
      const stored = await storePdf(pdfResult.html, pdfResult.filename);
      pdfUrl = stored.url;
    } catch (storageError) {
      // Fallback: return inline data URL if storage fails
      console.warn('[Mastermind PDF] Storage failed, falling back to data URL:', storageError);
      pdfUrl = `data:text/html;charset=utf-8,${encodeURIComponent(pdfResult.html)}`;
    }

    // Update session with PDF URL
    const updated = sessionReducer(session, { type: 'SET_PDF_URL', url: pdfUrl });
    await saveSessionAsync(updated);

    return NextResponse.json({
      success: true,
      data: {
        pdfUrl,
        filename: pdfResult.filename,
        generatedAt: pdfResult.generatedAt,
      },
    });
  } catch (error) {
    console.error('[Mastermind PDF API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      },
      { status: 500 }
    );
  }
}
