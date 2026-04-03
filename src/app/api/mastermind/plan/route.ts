/**
 * POST /api/mastermind/plan
 *
 * Generates a Mastermind treatment plan from scan results + intake data.
 * Accepts either { sessionId } (loads from Airtable) or inline { scanResult, intakeData }.
 * Returns MastermindPlan with 3-tier packages and saves to session.
 */

import { NextRequest } from 'next/server';
import { generateMastermindPlan } from '@/lib/mastermind/plan-generator';
import { mockMastermindPlan } from '@/lib/mastermind/mock-data';
import { getSessionByIdAsync, saveSessionAsync, sessionReducer } from '@/lib/mastermind/session';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { AuraScanResult } from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request);
    if ('error' in parsed) return parsed.error;
    const { body } = parsed;

    let scanResult = body?.scanResult as AuraScanResult | undefined;
    let intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    // If sessionId provided, load scan + intake from persisted session
    let session = null;
    if (sessionId) {
      session = await getSessionByIdAsync(sessionId);
      if (!session) {
        return apiError('Session not found', 404);
      }
      if (!scanResult && session.auraScanResult) {
        scanResult = session.auraScanResult;
      }
      if (!intakeData && session.intakeData) {
        intakeData = session.intakeData as Partial<ConsultationFormData>;
      }
    }

    if (!scanResult || typeof scanResult !== 'object' || !intakeData || typeof intakeData !== 'object') {
      return apiError('Missing scan result or intake data', 400);
    }

    const useMock = process.env.USE_MOCK_AI === 'true';
    let plan;
    let source: string;

    if (useMock) {
      plan = mockMastermindPlan();
      source = 'mock';
    } else {
      plan = generateMastermindPlan(scanResult, intakeData);
      source = 'engine';
    }

    // Save plan back to session if we loaded one
    if (session) {
      const updated = sessionReducer(session, { type: 'SET_PLAN', plan });
      await saveSessionAsync(updated);
    }

    return apiSuccess(plan, { source });
  } catch (error) {
    console.error('[Mastermind Plan API] Error:', error);

    // Fallback to mock — flagged so client knows
    try {
      const fallback = mockMastermindPlan();
      return apiSuccess(fallback, { source: 'fallback', fallback: true, error: String(error) });
    } catch {
      return apiError('Plan generation failed');
    }
  }
}
