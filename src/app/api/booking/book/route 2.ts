/**
 * API Route: /api/booking/book
 *
 * POST - Create a new booking
 * Body: BookingRequest
 */

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import type { BookingRequest } from '@/lib/booking/types';

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();

    if (!body.serviceId || !body.providerId || !body.roomId || !body.date || !body.startTime) {
      return NextResponse.json(
        { error: 'serviceId, providerId, roomId, date, and startTime are required' },
        { status: 400 }
      );
    }

    if (!body.clientId && !body.clientInfo) {
      return NextResponse.json(
        { error: 'Either clientId or clientInfo is required' },
        { status: 400 }
      );
    }

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [], // TODO: Load from Airtable
      BOOKABLE_SERVICES,
    );

    const result = engine.bookAppointment(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          conflictDetails: result.conflictDetails,
          suggestedAlternatives: result.suggestedAlternatives,
        },
        { status: 409 }
      );
    }

    // TODO: Save to Airtable
    // TODO: Trigger reminder setup via n8n webhook
    // TODO: Send confirmation email/SMS

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
