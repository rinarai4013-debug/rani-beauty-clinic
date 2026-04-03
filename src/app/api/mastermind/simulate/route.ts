/**
 * POST /api/mastermind/simulate
 *
 * Generates simulation comparison data for a Mastermind session.
 * Accepts { sessionId } to load session and save result, or runs standalone.
 * Currently returns mock data; will upgrade to server-side rendering when needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockSimulationComparison } from '@/lib/mastermind/mock-data';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    const result = mockSimulationComparison();

    // Save simulation to session if sessionId provided
    if (sessionId) {
      const session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }
      const updated = sessionReducer(session, { type: 'SET_SIMULATION', comparison: result });
      await saveSessionAsync(updated);
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        renderMode: 'mock',
        note: 'Simulation runs client-side. This endpoint returns mock data for contract testing.',
      },
    });
  } catch (error) {
    console.error('[Mastermind Simulate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
