import { NextResponse } from 'next/server';
import { analyzeRetention } from '@/lib/revenue/retention-machine';
import type { RetentionInput } from '@/lib/revenue/retention-machine';

/**
 * GET /api/dashboard/revenue-optimizer/retention
 *
 * Client retention analysis: rebooking triggers, win-back campaigns,
 * VIP retention, membership renewals, and retention metrics.
 */

export async function GET() {
  try {
    // In production, fetch from Airtable
    const input: RetentionInput = {
      clients: [],
      memberships: [],
      appointments: [],
      packages: [],
      feedbackScores: [],
      config: {
        avgAcquisitionCost: 150,
        avgClientLTV: 2800,
        rebookReminderDays: [7, 0, -7],
        lapsedTiers: [
          { days: 30, label: '30-day' },
          { days: 60, label: '60-day' },
          { days: 90, label: '90-day' },
        ],
        vipSpendThreshold: 3000,
      },
    };

    const result = analyzeRetention(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Retention analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze retention' }, { status: 500 });
  }
}
