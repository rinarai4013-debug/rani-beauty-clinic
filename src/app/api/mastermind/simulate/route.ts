/**
 * POST /api/mastermind/simulate
 *
 * Placeholder route for future server-side simulation rendering.
 * Currently, all simulation runs client-side via Canvas API.
 * This route exists for contract stability and future SSR support.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockSimulationComparison } from '@/lib/mastermind/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // For now, return mock data. Client-side simulation is the primary path.
    // This route will be upgraded to server-side rendering when needed.
    const result = mockSimulationComparison();

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
