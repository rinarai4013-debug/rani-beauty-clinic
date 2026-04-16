/**
 * POST /api/mastermind/share
 *
 * Generates a secure, time-limited share token for a Mastermind session.
 * The resulting URL is given to the patient so they can revisit their
 * personalized treatment plan at home — no login required.
 *
 * Body: { sessionId: string, expiresIn?: number }
 *   expiresIn — milliseconds until link expires (default 7 days)
 *
 * Returns: { shareUrl: string, token: string, expiresAt: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionByIdAsync } from '@/lib/mastermind/session';
import {
  cacheToken,
  saveTokenToAirtable,
  type ShareTokenRecord,
} from '@/lib/mastermind/share-token';
import { z } from 'zod';

import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';

// Re-export the type so existing `import type { ShareTokenRecord }` from sibling
// routes that may have used `../route` still work at the type level.
export type { ShareTokenRecord };

// ── Constants ──

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days cap
const ShareTokenCreateSchema = z.object({
  sessionId: z.string().min(1),
  expiresIn: z.number().positive().int().optional(),
});

// ── POST Handler ──

export async function POST(request: NextRequest) {
  return withSentry('mastermind/share', async () => {
    try {
      const parsed = ShareTokenCreateSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
          { status: 400 },
        );
      }

      const { sessionId, expiresIn } = parsed.data;

      // Validate expiresIn
      const ttl =
        typeof expiresIn === 'number' && expiresIn > 0
          ? Math.min(expiresIn, MAX_EXPIRY_MS)
          : SEVEN_DAYS_MS;

      // Verify session exists
      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      // Session must be at least plan_ready to share
      const shareablePhases = [
        'plan_ready',
        'provider_review',
        'approved',
        'simulating',
        'simulation_ready',
        'presenting',
        'completed',
      ];
      if (!shareablePhases.includes(session.phase)) {
        return NextResponse.json(
          {
            success: false,
            error: `Session is in "${session.phase}" phase. A plan must be generated before sharing.`,
          },
          { status: 422 },
        );
      }

      // Generate cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl);

      const record: ShareTokenRecord = {
        token,
        sessionId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      // Store the token (in-memory + Airtable for persistence across cold starts)
      cacheToken(record);
      await saveTokenToAirtable(record);

      // Build the patient-facing URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ranibeautyclinic.com';
      const shareUrl = `${siteUrl}/my-plan/${token}`;

      return NextResponse.json({
        success: true,
        shareUrl,
        token,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      logEvent('api', 'error', '[Share] Token generation failed', { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}
