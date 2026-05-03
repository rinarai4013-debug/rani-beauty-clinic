/**
 * POST /api/mastermind/aura-import/pdf
 *
 * Dashboard-safe fallback path for Aura handout PDFs.
 * Parses the PDF on the server, applies detected metrics to the scan model,
 * and updates the existing Mastermind session without requiring client-side
 * PDF rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { unauthorized, forbidden } from '@/lib/auth/middleware';
import {
  getSessionByIdAsyncRetry,
  saveSessionAsync,
  sessionReducer,
} from '@/lib/mastermind/session';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import {
  extractAuraPdfInsights,
  applyAuraPdfInsightsToScan,
  type AuraPdfInsights,
} from '@/lib/mastermind/aura-pdf';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { withSentry } from '@/lib/sentry-utils';

const MAX_AURA_PDF_BYTES = 30 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
}

function summarizeAuraMetrics(insights: AuraPdfInsights): string {
  const metrics: string[] = [];
  if (typeof insights.absoluteScores.wrinkles === 'number') {
    metrics.push(`Wrinkles ${insights.absoluteScores.wrinkles}/5`);
  }
  if (typeof insights.absoluteScores.texture === 'number') {
    metrics.push(`Texture ${insights.absoluteScores.texture}/5`);
  }
  if (typeof insights.absoluteScores.brownSpots === 'number') {
    metrics.push(`Brown Spots ${insights.absoluteScores.brownSpots}/5`);
  }
  if (typeof insights.absoluteScores.redAreas === 'number') {
    metrics.push(`Red Areas ${insights.absoluteScores.redAreas}/5`);
  }
  if (typeof insights.absoluteScores.pores === 'number') {
    metrics.push(`Pores ${insights.absoluteScores.pores}/5`);
  }
  if (typeof insights.peerSkinScore === 'number') {
    metrics.push(`Peer Skin Score ${insights.peerSkinScore}`);
  }
  return metrics.join(', ');
}

export async function POST(request: NextRequest) {
  return withSentry('mastermind/aura-import/pdf', async () => {
    try {
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) return unauthorized();
      if (authSession.role !== 'ceo' && authSession.role !== 'provider' && authSession.role !== 'operations') {
        return forbidden();
      }

      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid multipart payload' }, { status: 400 });
      }

      const sessionId = formData.get('sessionId');
      const fileEntry = formData.get('aura') ?? formData.get('file');
      if (typeof sessionId !== 'string' || !sessionId.trim()) {
        return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
      }
      if (!(fileEntry instanceof File)) {
        return NextResponse.json({ success: false, error: 'Missing Aura PDF file' }, { status: 400 });
      }
      const auraFile = fileEntry;

      if (!isPdfFile(auraFile)) {
        return NextResponse.json({ success: false, error: 'Aura upload must be a PDF file' }, { status: 400 });
      }
      if (auraFile.size > MAX_AURA_PDF_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Aura PDF exceeds ${Math.round(MAX_AURA_PDF_BYTES / (1024 * 1024))}MB upload limit`,
          },
          { status: 413 },
        );
      }

      const session = await getSessionByIdAsyncRetry(sessionId.trim());
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      const intakeData = (session.intakeData || {}) as Partial<ConsultationFormData>;
      const baseScan = await runAuraScan(intakeData);

      let parsedInsights: AuraPdfInsights | null = null;
      let warning: string | null = null;
      try {
        parsedInsights = await extractAuraPdfInsights(auraFile);
      } catch (error) {
        console.warn('[Aura Import PDF] PDF parse failed:', error);
        warning = 'Aura PDF could not be fully parsed. Applied intake-based scan fallback.';
      }

      const scanResult = parsedInsights
        ? applyAuraPdfInsightsToScan(baseScan, parsedInsights)
        : baseScan;

      const existingClinicalNotes =
        typeof intakeData.clinicalNotes === 'string' ? intakeData.clinicalNotes.trim() : '';
      const auraNoteParts = [
        `Aura PDF processed: ${auraFile.name}`,
        parsedInsights ? `Parsed metrics: ${summarizeAuraMetrics(parsedInsights)}` : '',
        warning || '',
      ].filter(Boolean);

      let updated = sessionReducer(session, {
        type: 'SET_INTAKE',
        data: {
          ...intakeData,
          clinicalNotes: [existingClinicalNotes, auraNoteParts.join('\n')].filter(Boolean).join('\n\n'),
        },
      });
      updated = sessionReducer(updated, { type: 'SET_SCAN_RESULT', result: scanResult });

      try {
        await saveSessionAsync(updated);
      } catch (error) {
        console.error('[Aura Import PDF] Session persistence failed:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Session persistence failed. Please retry in a moment.',
          },
          { status: 503 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          sessionId: updated.id,
          phase: updated.phase,
          auraParsed: !!parsedInsights,
          auraMetrics: parsedInsights ? summarizeAuraMetrics(parsedInsights) : null,
          warning,
          scanResult,
        },
      });
    } catch (error) {
      console.error('[Aura Import PDF] Unexpected error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Aura PDF processing failed. Please retry.',
        },
        { status: 500 },
      );
    }
  });
}
