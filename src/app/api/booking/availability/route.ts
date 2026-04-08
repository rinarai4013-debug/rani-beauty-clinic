import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import { loadAppointmentsForDate } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providerId: z.string().optional(),
  roomId: z.enum(['halo', 'aura', 'glow']).optional(),
  timePreference: z.enum(['morning', 'afternoon', 'evening']).optional(),
  includeEmergencySlots: z.enum(['true', 'false']).optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { serviceId, date, providerId, roomId, timePreference, includeEmergencySlots } = parsed.data;

  try {
    const appointments = await loadAppointmentsForDate(date);
    const engine = new AvailabilityEngine(DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG, appointments, BOOKABLE_SERVICES);

    const result = engine.getAvailableSlots({
      serviceId,
      date,
      providerId,
      roomId,
      timePreference,
      includeEmergencySlots: includeEmergencySlots === 'true',
    });

    logEvent('api', 'info', 'Availability computed', {
      serviceId,
      date,
      slots: result.slots.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    logEvent('api', 'error', 'Availability fetch failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
