/**
 * API Route: /api/booking/waitlist
 *
 * GET - Get waitlist entries (optionally filtered by serviceId)
 * POST - Add to waitlist
 * DELETE - Remove from waitlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistManager } from '@/lib/booking/waitlist';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [],
      BOOKABLE_SERVICES,
    );

    const manager = new WaitlistManager(engine, []); // TODO: Load from Airtable

    if (serviceId) {
      const entries = manager.getEntriesForService(serviceId);
      return NextResponse.json({ entries, stats: manager.getStats() });
    }

    return NextResponse.json({
      entries: manager.getActiveEntries(),
      stats: manager.getStats(),
    });
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.clientId || !body.serviceId || !body.clientName || !body.clientEmail || !body.clientPhone) {
      return NextResponse.json(
        { error: 'clientId, serviceId, clientName, clientEmail, and clientPhone are required' },
        { status: 400 }
      );
    }

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [],
      BOOKABLE_SERVICES,
    );

    const manager = new WaitlistManager(engine);
    const entry = manager.addToWaitlist({
      clientId: body.clientId,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      serviceId: body.serviceId,
      serviceName: body.serviceName ?? body.serviceId,
      preferredProviderId: body.preferredProviderId,
      preferredProviderName: body.preferredProviderName,
      timePreference: body.timePreference ?? [],
      isMember: body.isMember,
      isVip: body.isVip,
    });

    // TODO: Save to Airtable

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Waitlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 });
    }

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [],
      BOOKABLE_SERVICES,
    );

    const manager = new WaitlistManager(engine);
    const removed = manager.removeFromWaitlist(entryId);

    if (!removed) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from waitlist' }, { status: 500 });
  }
}
