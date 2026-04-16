/**
 * POST /api/mastermind/protocol-packet
 *
 * Generates a provider-facing protocol packet for a Mastermind session
 * and persists packet metadata to the session.
 *
 * Auth: ceo | provider only.
 * Preconditions: session exists + intakeData + auraScanResult + mastermindPlan.
 *
 * Response shape:
 *   { packetUrl, generatedAt, sessionId, providerReviewStatus }
 *
 * SAFETY: No PHI in error logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { unauthorized, forbidden } from '@/lib/auth/middleware';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { generateProtocolPacketPdf } from '@/lib/mastermind/pdf-generator';
import { storePdf } from '@/lib/mastermind/pdf-storage';
import { z } from 'zod';
import { withSentry } from '@/lib/sentry-utils';
import type { UserRole } from '@/types/auth';

// ── Auth ──

const PACKET_ALLOWED_ROLES: UserRole[] = ['ceo', 'provider'];

// ── Schema ──

const PacketBodySchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  format: z.enum(['pdf']).optional().default('pdf'),
});

// ── Route ──

export async function POST(request: NextRequest) {
  return withSentry('mastermind/protocol-packet', async () => {
    try {
      // 401 — no valid session
      const rawSession = await getSessionFromRequest(request).catch(() => null);
      if (!rawSession) {
        return unauthorized();
      }

      // 403 — authenticated but role not permitted
      if (!PACKET_ALLOWED_ROLES.includes(rawSession.role)) {
        return forbidden();
      }

      // Parse + validate body
      const parsed = PacketBodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { sessionId } = parsed.data;

      // 404 — session not found
      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // 422 — missing required clinical artifacts
      const missingFields: string[] = [];
      if (!session.intakeData) missingFields.push('intakeData');
      if (!session.auraScanResult) missingFields.push('auraScanResult');
      if (!session.mastermindPlan) missingFields.push('mastermindPlan');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required clinical data for packet generation',
            missing: missingFields,
          },
          { status: 422 },
        );
      }

      // Generate protocol packet
      const actor = rawSession.displayName || rawSession.username;
      const pdfResult = generateProtocolPacketPdf(session, actor);

      // Store persistently
      let packetUrl: string;
      try {
        const stored = await storePdf(pdfResult.html, pdfResult.filename);
        packetUrl = stored.url;
      } catch {
        // Fallback to inline data URL if storage unavailable
        packetUrl = `data:text/html;charset=utf-8,${encodeURIComponent(pdfResult.html)}`;
      }

      // Persist packet metadata to session
      const packetVersion = (session.protocolPacket?.packetVersion ?? 0) + 1;
      const updated = sessionReducer(session, {
        type: 'SET_PROTOCOL_PACKET',
        packetUrl,
        generatedAt: pdfResult.generatedAt,
        generatorActor: actor,
        packetVersion,
      });
      await saveSessionAsync(updated);

      return NextResponse.json({
        packetUrl,
        generatedAt: pdfResult.generatedAt,
        sessionId,
        providerReviewStatus: session.providerReview?.approvalStatus ?? null,
      });
    } catch (error) {
      // No PHI in error logs
      console.error(
        '[API] /api/mastermind/protocol-packet error:',
        error instanceof Error ? error.message : 'unknown',
      );
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Packet generation failed' },
        { status: 500 },
      );
    }
  });
}
