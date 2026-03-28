/**
 * API Route: /api/booking/availability
 *
 * GET - Fetch available time slots for a service on a given date
 * Query params: serviceId, date, providerId?, roomId?, timePreference?
 */

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import type { AvailabilityQuery } from '@/lib/booking/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const providerId = searchParams.get('providerId') ?? undefined;
    const roomId = searchParams.get('roomId') as AvailabilityQuery['roomId'] ?? undefined;
    const timePreference = searchParams.get('timePreference') as AvailabilityQuery['timePreference'] ?? undefined;

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'serviceId and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [], // TODO: Load from Airtable
      BOOKABLE_SERVICES,
    );

    const result = engine.getAvailableSlots({
      serviceId,
      date,
      providerId,
      roomId,
      timePreference,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
