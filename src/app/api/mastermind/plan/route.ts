/**
 * POST /api/mastermind/plan
 *
 * Generates a Mastermind treatment plan from scan results + intake data.
 * Returns MastermindPlan with 3-tier packages.
 */

import { NextRequest } from 'next/server';
import { generateMastermindPlan } from '@/lib/mastermind/plan-generator';
import { mockMastermindPlan } from '@/lib/mastermind/mock-data';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { AuraScanResult } from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request);
    if ('error' in parsed) return parsed.error;
    const { body } = parsed;

    const scanResult = body?.scanResult as AuraScanResult | undefined;
    const intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;

    if (!scanResult || typeof scanResult !== 'object' || !intakeData || typeof intakeData !== 'object') {
      return apiError('Missing scan result or intake data', 400);
    }

    const useMock = process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      const plan = mockMastermindPlan();
      return apiSuccess(plan, { source: 'mock' });
    }

    const plan = generateMastermindPlan(scanResult, intakeData);
    return apiSuccess(plan, { source: 'engine' });
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
