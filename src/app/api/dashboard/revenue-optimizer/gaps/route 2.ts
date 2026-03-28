import { NextRequest, NextResponse } from 'next/server';
import { analyzeRevenueGaps } from '@/lib/revenue/gap-finder';
import type { GapFinderInput } from '@/lib/revenue/gap-finder';

/**
 * GET /api/dashboard/revenue-optimizer/gaps?range=7|14|30
 *
 * Revenue gap analysis: empty slots, underperforming days,
 * declining services, overdue rebookings, membership gaps,
 * dormant VIPs, and prioritized action items.
 */

export async function GET(request: NextRequest) {
  try {
    const range = request.nextUrl.searchParams.get('range') || '14';
    const rangeDays = parseInt(range, 10) || 14;

    const now = new Date();
    const start = now.toISOString().split('T')[0];
    const end = new Date(now.getTime() + rangeDays * 86400000).toISOString().split('T')[0];

    // In production, fetch from Airtable Tables.appointments(), Tables.clients(), etc.
    // For now, create a structured input placeholder that shows the engine works.
    const input: GapFinderInput = {
      appointments: [],
      providers: [
        {
          name: 'Rina',
          role: 'provider',
          workingDays: [1, 2, 3, 4, 5],
          startTime: '09:00',
          endTime: '18:00',
          services: ['Sofwave', 'RF Microneedling', 'Botox', 'Fillers', 'Lip Filler', 'PicoWay', 'HydraFacial'],
          hourlyCapacity: 250,
        },
        {
          name: 'Mom',
          role: 'esthetician',
          workingDays: [1, 2, 3, 4, 5, 6],
          startTime: '10:00',
          endTime: '17:00',
          services: ['HydraFacial', 'VI Peel', 'PRX-T33', 'BioRePeel', 'Laser Hair Removal', 'LED Light Therapy'],
          hourlyCapacity: 180,
        },
      ],
      services: [
        { name: 'Sofwave', category: 'Skin Tightening', basePrice: 3500, duration: 60, rebookIntervalDays: 365, avgRevenuePerSession: 3500 },
        { name: 'RF Microneedling', category: 'Skin Renewal', basePrice: 650, duration: 60, rebookIntervalDays: 42, avgRevenuePerSession: 650 },
        { name: 'Botox', category: 'Injectable', basePrice: 350, duration: 30, rebookIntervalDays: 90, avgRevenuePerSession: 350 },
        { name: 'Fillers', category: 'Injectable', basePrice: 650, duration: 45, rebookIntervalDays: 365, avgRevenuePerSession: 650 },
        { name: 'HydraFacial', category: 'Facial', basePrice: 275, duration: 60, rebookIntervalDays: 30, avgRevenuePerSession: 275 },
        { name: 'VI Peel', category: 'Facial', basePrice: 395, duration: 45, rebookIntervalDays: 42, avgRevenuePerSession: 395 },
        { name: 'PRX-T33', category: 'Facial', basePrice: 495, duration: 30, rebookIntervalDays: 28, avgRevenuePerSession: 495 },
        { name: 'PicoWay', category: 'Laser', basePrice: 475, duration: 30, rebookIntervalDays: 42, avgRevenuePerSession: 475 },
        { name: 'Laser Hair Removal', category: 'Laser', basePrice: 200, duration: 30, rebookIntervalDays: 42, avgRevenuePerSession: 200 },
        { name: 'B12 Injection', category: 'Wellness', basePrice: 35, duration: 10, rebookIntervalDays: 14, avgRevenuePerSession: 35 },
        { name: 'GLP-1', category: 'Wellness', basePrice: 499, duration: 15, rebookIntervalDays: 7, avgRevenuePerSession: 499 },
      ],
      clients: [],
      memberships: [],
      transactions: [],
      kpiSnapshots: [],
      dateRange: { start, end },
    };

    const result = analyzeRevenueGaps(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Gap analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze revenue gaps' }, { status: 500 });
  }
}
