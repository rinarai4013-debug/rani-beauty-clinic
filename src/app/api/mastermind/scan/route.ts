/**
 * POST /api/mastermind/scan
 *
 * Runs the Aura Skin Scan orchestrator.
 * Accepts intake form data + optional medical data.
 * Returns AuraScanResult.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuraScan } from '@/lib/mastermind/aura-scan';
import { mockAuraScanResult } from '@/lib/mastermind/mock-data';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';

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

    const intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;
    const medicalData = body?.medicalData as Partial<MedicalHistoryFormData> | undefined;

    if (!intakeData || typeof intakeData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing intake data' },
        { status: 400 }
      );
    }

    // Run the scan — explicit mock vs real path
    const useMock = process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      // Mock mode: clearly flagged, still success
      const result = mockAuraScanResult();
      return NextResponse.json({
        success: true,
        data: result,
        meta: { source: 'mock' },
      });
    }

    const result = await runAuraScan(intakeData, medicalData);
    return NextResponse.json({
      success: true,
      data: result,
      meta: { source: 'engine' },
    });
  } catch (error) {
    console.error('[Aura Scan API] Error:', error);

    // Fallback to mock on error — flagged as fallback so client knows
    try {
      const fallback = mockAuraScanResult();
      return NextResponse.json({
        success: true,
        data: fallback,
        meta: { source: 'fallback', fallback: true, error: String(error) },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Scan failed' },
        { status: 500 }
      );
    }
  }
}
