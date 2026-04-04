/**
 * GET /api/mastermind/sessions — List all sessions
 * POST /api/mastermind/sessions — Create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, saveSessionAsync, getAllSessionsAsync } from '@/lib/mastermind/session';
import { requireAuth, unauthorized } from '@/lib/auth/middleware';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { MastermindSession } from '@/types/mastermind';

export async function GET(request: NextRequest) {
  try {
    // Auth check — allow unauthenticated in development
    const session = await requireAuth(request).catch(() => null);
    if (!session && process.env.NODE_ENV !== 'development') {
      return unauthorized();
    }

    const sessions = await getAllSessionsAsync();
    return apiSuccess(sessions);
  } catch (error) {
    console.error('[Mastermind Sessions] GET error:', error);
    return apiError('Failed to fetch sessions');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — allow unauthenticated in development
    const authSession = await requireAuth(request).catch(() => null);
    if (!authSession && process.env.NODE_ENV !== 'development') {
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
}
