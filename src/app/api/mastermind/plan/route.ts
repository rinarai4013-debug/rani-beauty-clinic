/**
 * POST /api/mastermind/plan
 *
 * Generates a Mastermind treatment plan from scan results + intake data.
 * Returns MastermindPlan with 3-tier packages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMastermindPlan } from '@/lib/mastermind/plan-generator';
import { mockMastermindPlan } from '@/lib/mastermind/mock-data';
import type { AuraScanResult } from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';

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

    const scanResult = body?.scanResult as AuraScanResult | undefined;
    const intakeData = body?.intakeData as Partial<ConsultationFormData> | undefined;

    if (!scanResult || typeof scanResult !== 'object' || !intakeData || typeof intakeData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing scan result or intake data' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      const plan = mockMastermindPlan();
      return NextResponse.json({
        success: true,
        data: plan,
        meta: { source: 'mock' },
      });
    }

    const plan = generateMastermindPlan(scanResult, intakeData);
    return NextResponse.json({
      success: true,
      data: plan,
      meta: { source: 'engine' },
    });
  } catch (error) {
    console.error('[Mastermind Plan API] Error:', error);

    // Fallback to mock — flagged so client knows
    try {
      const fallback = mockMastermindPlan();
      return NextResponse.json({
        success: true,
        data: fallback,
        meta: { source: 'fallback', fallback: true, error: String(error) },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Plan generation failed' },
        { status: 500 }
      );
    }
  }
}
