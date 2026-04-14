/**
 * POST /api/mastermind/protocol-packet
 *
 * Staff-authenticated protocol packet export route.
 * Uses the existing consultation PDF generator and storage pipeline,
 * then logs export activity into the session for provider signoff workflows.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { generateConsultationPdf } from '@/lib/mastermind/pdf-generator';
import { storePdf } from '@/lib/mastermind/pdf-storage';
import { forbidden, unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import { logEvent } from '@/lib/logging/structured-logger';
import { withSentry } from '@/lib/sentry-utils';

const MAX_PROTOCOL_PACKET_JSON_BYTES = 2 * 1024 * 1024;

const ProtocolPacketSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return withSentry('mastermind/protocol-packet', async () => {
    try {
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) return unauthorized();
      if (authSession.role !== 'ceo' && authSession.role !== 'provider') return forbidden();

      const parsed = await parseJsonBody(request, { maxBytes: MAX_PROTOCOL_PACKET_JSON_BYTES });
      if ('error' in parsed) return parsed.error;

      const validated = ProtocolPacketSchema.safeParse(parsed.body);
      if (!validated.success) {
        return apiError(
          `Invalid protocol packet payload: ${validated.error.issues.map((i) => i.message).join(', ')}`,
          422,
        );
      }

      const { sessionId } = validated.data;
      const session = await getSessionByIdAsync(sessionId);
      if (!session) return apiError('Session not found', 404);
      if (!session.auraScanResult || !session.mastermindPlan) {
        return apiError('Session requires scan result and plan for protocol packet export', 400);
      }

      const packet = generateConsultationPdf(session);
      let pdfUrl: string;

      try {
        const stored = await storePdf(packet.html, packet.filename);
        pdfUrl = stored.url;
      } catch (storageError) {
        logEvent('api', 'warn', '[Mastermind Protocol Packet] Storage failed, using inline fallback', {
          error: storageError instanceof Error ? storageError.message : String(storageError),
          sessionId,
        });
        pdfUrl = `data:text/html;charset=utf-8,${encodeURIComponent(packet.html)}`;
      }

      const withPdf = sessionReducer(session, { type: 'SET_PDF_URL', url: pdfUrl });
      const actor = authSession.name || authSession.username || 'Staff';
      const notes = [
        withPdf.clinicNotes,
        `Protocol packet exported by ${actor} on ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join('\n');
      const updated = sessionReducer(withPdf, {
        type: 'SET_CLINIC_NOTES',
        notes,
        actor,
      });
      await saveSessionAsync(updated);

      return apiSuccess({
        sessionId,
        pdfUrl,
        filename: packet.filename,
        generatedAt: packet.generatedAt,
        providerReviewStatus: updated.providerReview?.approvalStatus || null,
      });
    } catch (error) {
      logEvent('api', 'error', '[Mastermind Protocol Packet] Error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return apiError('Protocol packet export failed', 500);
    }
  });
}
