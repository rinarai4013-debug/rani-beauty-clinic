/**
 * GET /api/mastermind/sessions — List all sessions
 * POST /api/mastermind/sessions — Create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, saveSession, getAllSessions } from '@/lib/mastermind/session';
import type { MastermindSession } from '@/types/mastermind';

export async function GET() {
  try {
    const sessions = getAllSessions();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('[Mastermind Sessions] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Only allow safe override fields — never accept id, createdAt, etc.
    const overrides: Partial<MastermindSession> = {};
    if (body.intakeData && typeof body.intakeData === 'object') {
      overrides.intakeData = body.intakeData as MastermindSession['intakeData'];
    }
    if (typeof body.patientName === 'string') overrides.patientName = body.patientName;
    if (typeof body.patientEmail === 'string') overrides.patientEmail = body.patientEmail;

    const session = createSession(overrides);
    saveSession(session);

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error('[Mastermind Sessions] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
