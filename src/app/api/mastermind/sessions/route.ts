/**
 * GET /api/mastermind/sessions — List all sessions
 * POST /api/mastermind/sessions — Create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createSession, saveSessionAsync, getAllSessionsAsync } from '@/lib/mastermind/session';
import { unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { MastermindSession } from '@/types/mastermind';

import { withSentry } from '@/lib/sentry-utils';

export async function GET(request: NextRequest) {
  return withSentry('mastermind/sessions', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const session = await getSessionFromRequest(request).catch(() => null);
      if (!session) {
        return unauthorized();
      }

      const sessions = await getAllSessionsAsync();
      return apiSuccess(sessions);
    } catch (error) {
      console.error('[Mastermind Sessions] GET error:', error);
      return apiError('Failed to fetch sessions');
    }
  });
}

export async function POST(request: NextRequest) {
  return withSentry('mastermind/sessions', async () => {
    try {
      // Auth check — staff session required (Wave 11 P0: removed NODE_ENV dev bypass)
      const authSession = await getSessionFromRequest(request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }

      const parsed = await parseJsonBody(request);
      if ('error' in parsed) return parsed.error;
      const { body } = parsed;

      // Only allow safe override fields — never accept id, createdAt, etc.
      const overrides: Partial<MastermindSession> = {};
      if (body.intakeData && typeof body.intakeData === 'object') {
        overrides.intakeData = body.intakeData as MastermindSession['intakeData'];
      }
      if (typeof body.patientName === 'string') overrides.patientName = body.patientName;
      if (typeof body.patientEmail === 'string') overrides.patientEmail = body.patientEmail;

      const session = createSession(overrides);
      await saveSessionAsync(session);

      return NextResponse.json({ success: true, data: session }, { status: 201 });
    } catch (error) {
      console.error('[Mastermind Sessions] POST error:', error);
      return apiError('Failed to create session');
    }
  });
}
