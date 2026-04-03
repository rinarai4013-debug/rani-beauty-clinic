/**
 * POST /api/mastermind/scan
 *
 * Runs the Aura Skin Scan orchestrator.
 * Accepts intake form data + optional medical data.
 * Returns AuraScanResult.
 */

import { NextRequest } from 'next/server';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import { parseJsonBody, apiError, apiSuccess } from '@/lib/mastermind/api-helpers';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request);
    if ('error' in parsed) return parsed.error;
    const { body } = parsed;

    const intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;
    const medicalData = body?.medicalData as Partial<MedicalHistoryFormData> | undefined;

    if (!intakeData || typeof intakeData !== 'object') {
      return apiError('Missing intake data', 400);
    }

    // Run the scan — explicit mock vs real path
    const useMock = process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      // Mock mode: clearly flagged, still success
      const result = mockAuraScanResult();
      return apiSuccess(result, { source: 'mock' });
    }

    const result = await runAuraScan(intakeData, medicalData);
    return apiSuccess(result, { source: 'engine' });
  } catch (error) {
    console.error('[Aura Scan API] Error:', error);

    // Fallback to mock on error — flagged as fallback so client knows
    try {
      const fallback = mockAuraScanResult();
      return apiSuccess(fallback, { source: 'fallback', fallback: true, error: String(error) });
    } catch {
      return apiError('Scan failed');
    }
  }
}
