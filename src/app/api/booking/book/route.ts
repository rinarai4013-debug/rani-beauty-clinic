import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import { loadAppointmentsForDate, createAppointmentRecord, updateAppointmentRecord } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { BookingRequest } from '@/lib/booking/types';
import {
  createMangomintBooking,
  cancelMangomintBooking,
  rescheduleMangomintBooking,
} from '@/lib/mangomint/writeback';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const createSchema = z.object({
  serviceId: z.string().min(1),
  providerId: z.string().min(1),
  roomId: z.enum(['halo', 'aura', 'glow']),
  date: dateSchema,
  startTime: timeSchema,
  clientId: z.string().optional(),
  clientInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
  }).optional(),
  notes: z.string().optional(),
  isEmergency: z.boolean().optional(),
  combinedServiceIds: z.array(z.string()).optional(),
  recurringConfig: z.object({
    intervalDays: z.number().int().min(1),
    occurrences: z.number().int().min(1),
    endDate: dateSchema.optional(),
  }).optional(),
  source: z.enum(['online', 'phone', 'walk-in', 'internal', 'waitlist']),
});

const cancelSchema = z.object({
  action: z.literal('cancel'),
  appointmentId: z.string().min(1),
  reason: z.string().optional(),
});

const rescheduleSchema = z.object({
  action: z.literal('reschedule'),
  appointmentId: z.string().min(1),
  newDate: dateSchema,
  newStartTime: timeSchema,
  newProviderId: z.string().optional(),
  newRoomId: z.enum(['halo', 'aura', 'glow']).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('booking-book', ip, RATE_LIMITS.BOOKING);
  if (!allowed) return rateLimitResponse(resetIn);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = (body as { action?: string }).action;
  if (action === 'cancel') {
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid cancel request' }, { status: 400 });
    }

    try {
      await updateAppointmentRecord(parsed.data.appointmentId, {
        Status: 'Cancelled',
        Notes: parsed.data.reason || 'Cancelled by client',
      });
      const sync = await cancelMangomintBooking(parsed.data.appointmentId);
      logEvent('api', 'info', 'Appointment cancelled', { id: parsed.data.appointmentId });
      return NextResponse.json({
        success: true,
        appointmentId: parsed.data.appointmentId,
        sync,
        operatorNote: sync.status === 'redirect_required'
          ? 'Mirror this cancellation in Mangomint to keep the live calendar aligned.'
          : undefined,
      });
    } catch (error) {
      logEvent('api', 'error', 'Cancel failed', { error: String(error) });
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
    }
  }

  if (action === 'reschedule') {
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reschedule request' }, { status: 400 });
    }

    try {
      const providerName = parsed.data.newProviderId
        ? DEFAULT_PROVIDERS.find((p) => p.providerId === parsed.data.newProviderId)?.providerName
        : undefined;

      await updateAppointmentRecord(parsed.data.appointmentId, {
        Date: parsed.data.newDate,
        Time: parsed.data.newStartTime,
        Provider: providerName || undefined,
        Status: 'Rescheduled',
      });
      const sync = await rescheduleMangomintBooking(
        parsed.data.appointmentId,
        parsed.data.newDate,
        parsed.data.newStartTime,
      );
      logEvent('api', 'info', 'Appointment rescheduled', { id: parsed.data.appointmentId });
      return NextResponse.json({
        success: true,
        appointmentId: parsed.data.appointmentId,
        sync,
        operatorNote: sync.status === 'redirect_required'
          ? 'Mirror this reschedule in Mangomint to keep the hosted calendar aligned.'
          : undefined,
      });
    } catch (error) {
      logEvent('api', 'error', 'Reschedule failed', { error: String(error) });
      return NextResponse.json({ error: 'Failed to reschedule appointment' }, { status: 500 });
    }
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking request' }, { status: 400 });
  }

  const requestData = parsed.data as BookingRequest;

  try {
    const appointments = await loadAppointmentsForDate(requestData.date);
    const engine = new AvailabilityEngine(DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG, appointments, BOOKABLE_SERVICES);
    const result = engine.bookAppointment(requestData);

    if (!result.success || !result.appointment) {
      return NextResponse.json(result, { status: 409 });
    }

    const recordId = await createAppointmentRecord(result.appointment);
    result.appointment.id = recordId;
    const sync = await createMangomintBooking(requestData, recordId);

    if (result.recurringAppointments && result.recurringAppointments.length > 0) {
      const created = [];
      for (const recurring of result.recurringAppointments) {
        try {
          const recurringId = await createAppointmentRecord(recurring);
          recurring.id = recurringId;
          created.push(recurring);
        } catch (err) {
          logEvent('api', 'error', 'Failed to create recurring appointment', { error: String(err) });
        }
      }
      result.recurringAppointments = created;
    }

    logEvent('api', 'info', 'Appointment created', {
      id: recordId,
      serviceId: result.appointment.serviceId,
      date: result.appointment.date,
    });

    return NextResponse.json({
      ...result,
      sync,
      bookingMode: sync.bookingMode || 'api',
      operatorNote: sync.status === 'redirect_required'
        ? 'Use the hosted Mangomint booking flow for the final customer-facing booking confirmation.'
        : undefined,
    });
  } catch (error) {
    logEvent('api', 'error', 'Booking failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
