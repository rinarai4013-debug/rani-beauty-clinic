import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { clinicInfo } from '@/data/clinic-info';
import { getClientIP, rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { enforceAllowedPublicOrigin, enforceContentLength } from '@/lib/security/public-intent-guard';
import { withSentry } from '@/lib/sentry-utils';
import {
  AvailabilityEngine,
  BOOKABLE_SERVICES,
  DEFAULT_PROVIDERS,
  DEFAULT_SCHEDULING_CONFIG,
  getServiceById,
} from '@/lib/booking';
import type { Appointment, BookingRequest, RoomId, TimeSlot } from '@/lib/booking';

export const dynamic = 'force-dynamic';

const MAX_BOOKING_REQUEST_BYTES = 128 * 1024;
const BOOKING_URL = clinicInfo.booking.shareableUrl || clinicInfo.booking.url;

const clientInfoSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(40),
});

const bookingRequestSchema = z
  .object({
    serviceId: z.string().trim().min(1),
    providerId: z.string().trim().min(1).optional(),
    roomId: z.enum(['halo', 'aura', 'glow']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
    clientId: z.string().trim().min(1).optional(),
    clientInfo: clientInfoSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
    isEmergency: z.boolean().optional(),
    source: z.enum(['online', 'phone', 'walk-in', 'internal', 'waitlist']).default('online'),
  })
  .refine((data) => Boolean(data.clientId || data.clientInfo), {
    message: 'clientInfo is required for new online bookings',
    path: ['clientInfo'],
  });

function getDefaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  // Avoid returning Sunday by default because the public date picker disables it.
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function buildMangomintUrl(serviceId?: string): string {
  const url = new URL(BOOKING_URL);
  if (serviceId) {
    url.searchParams.set('serviceId', serviceId);
  }
  url.searchParams.set('utm_source', 'rani_site');
  url.searchParams.set('utm_medium', 'booking_api');
  return url.toString();
}

function makeEngine() {
  return new AvailabilityEngine(
    DEFAULT_PROVIDERS,
    DEFAULT_SCHEDULING_CONFIG,
    [],
    BOOKABLE_SERVICES,
  );
}

function findMatchingSlot(
  slots: TimeSlot[],
  startTime: string,
  providerId?: string,
  roomId?: RoomId,
): TimeSlot | null {
  return (
    slots.find(
      (slot) =>
        slot.startTime === startTime &&
        (!providerId || slot.providerId === providerId) &&
        (!roomId || slot.roomId === roomId),
    ) ?? null
  );
}

async function persistAppointmentRequest(
  appointment: Appointment,
  depositAmount: number,
): Promise<string | null> {
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return null;

  try {
    const { Tables, createRecord } = await import('@/lib/airtable/client');
    const serviceLabel = appointment.serviceName.toLowerCase();
    const serviceCategory = appointment.serviceId.includes('consult') || serviceLabel.includes('consult')
      ? 'Consult'
      : serviceLabel.includes('filler') || serviceLabel.includes('botox') || serviceLabel.includes('dysport')
        ? 'Injectable'
        : serviceLabel.includes('facial')
          ? 'Facial'
          : serviceLabel.includes('laser')
            ? 'Laser'
            : 'Wellness';

    return await createRecord(Tables.appointments(), {
      'Service Name': appointment.serviceName,
      'Service Category': serviceCategory,
      Provider: 'Rina',
      Date: appointment.date,
      Time: appointment.startTime,
      Duration: appointment.duration,
      Status: 'Pending External Confirmation',
      'Is Consult': appointment.serviceId.includes('consult') || appointment.serviceName.toLowerCase().includes('consult'),
      'Deposit Amount': depositAmount,
      'Deposit Paid': false,
      'Amount Quoted': appointment.estimatedRevenue,
      'Amount Paid': 0,
      'Booking Source': 'Rani Site Booking API',
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'booking.request.persist_failed',
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}

async function createDepositCheckoutUrl(
  appointment: Appointment,
  serviceId: string,
  depositAmount: number,
): Promise<string | null> {
  if (depositAmount <= 0 || !process.env.STRIPE_SECRET_KEY) return null;

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || clinicInfo.website;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: appointment.clientEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(depositAmount * 100),
            product_data: {
              name: `${appointment.serviceName} deposit`,
              description: 'Deposit is credited toward treatment at Rani Beauty Clinic.',
            },
          },
        },
      ],
      success_url: `${baseUrl}/book/success?booking=${encodeURIComponent(appointment.id)}&stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/book/${encodeURIComponent(serviceId)}?checkout=cancelled`,
      metadata: {
        planId: appointment.id,
        tier: 'Booking Deposit',
        clientName: appointment.clientName,
        bookingRequestId: appointment.id,
        serviceId,
      },
    });

    return session.url ?? null;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'booking.deposit_checkout.failed',
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return null;
  }
}

export async function GET(req: NextRequest) {
  return withSentry('booking/book', async () => {
    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('booking', ip, RATE_LIMITS.BOOKING);

    if (!allowed) return rateLimitResponse(resetIn);

    const url = new URL(req.url);
    const serviceId = url.searchParams.get('serviceId') || 'consult-aesthetic';
    const date = url.searchParams.get('date') || getDefaultDate();
    const providerId = url.searchParams.get('providerId') || undefined;
    const timePreference = url.searchParams.get('timePreference') as
      | 'morning'
      | 'afternoon'
      | 'evening'
      | null;

    const service = getServiceById(serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found', mangomintUrl: buildMangomintUrl() },
        { status: 404 },
      );
    }

    const engine = makeEngine();
    const result = engine.getAvailableSlots({
      serviceId,
      date,
      providerId,
      timePreference: timePreference ?? undefined,
    });

    return NextResponse.json({
      success: true,
      status: 'available',
      service: result.service,
      date: result.date,
      slots: result.slots.slice(0, 24),
      isFullyBooked: result.isFullyBooked,
      nextAvailableDate: result.nextAvailableDate,
      mangomintUrl: buildMangomintUrl(serviceId),
      sourceOfTruth: 'Mangomint',
      note: 'These are RaniOS scheduling suggestions. Final appointment confirmation happens in Mangomint.',
    });
  });
}

export async function POST(req: NextRequest) {
  return withSentry('booking/book', async () => {
    const originError = enforceAllowedPublicOrigin(req);
    if (originError) return originError;

    const sizeError = enforceContentLength(req, MAX_BOOKING_REQUEST_BYTES);
    if (sizeError) return sizeError;

    const ip = getClientIP(req);
    const { allowed, resetIn } = rateLimit('booking-mutation', ip, RATE_LIMITS.BOOKING);

    if (!allowed) return rateLimitResponse(resetIn);

    const parsed = bookingRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid booking request',
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const service = getServiceById(payload.serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found', mangomintUrl: buildMangomintUrl() },
        { status: 404 },
      );
    }

    const engine = makeEngine();
    const available = engine.getAvailableSlots({
      serviceId: payload.serviceId,
      date: payload.date,
      providerId: payload.providerId,
      roomId: payload.roomId,
      includeEmergencySlots: payload.isEmergency,
    });
    const slot = findMatchingSlot(
      available.slots,
      payload.startTime,
      payload.providerId,
      payload.roomId,
    );

    if (!slot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Requested slot is no longer available',
          suggestedAlternatives: available.slots.slice(0, 5),
          mangomintUrl: buildMangomintUrl(payload.serviceId),
        },
        { status: 409 },
      );
    }

    const bookingRequest: BookingRequest = {
      serviceId: payload.serviceId,
      providerId: slot.providerId,
      roomId: slot.roomId,
      date: payload.date,
      startTime: payload.startTime,
      clientId: payload.clientId,
      clientInfo: payload.clientInfo,
      notes: payload.notes,
      isEmergency: payload.isEmergency,
      source: payload.source,
    };

    const result = engine.bookAppointment(bookingRequest);
    if (!result.success || !result.appointment) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Unable to reserve requested appointment',
          conflictDetails: result.conflictDetails,
          suggestedAlternatives: result.suggestedAlternatives,
          mangomintUrl: buildMangomintUrl(payload.serviceId),
        },
        { status: 409 },
      );
    }

    const depositAmount = service.depositRequired;
    const persistedRecordId = await persistAppointmentRequest(result.appointment, depositAmount);
    const checkoutUrl = await createDepositCheckoutUrl(
      result.appointment,
      payload.serviceId,
      depositAmount,
    );

    return NextResponse.json({
      success: true,
      status: 'pending_external_confirmation',
      requiresExternalConfirmation: true,
      appointment: result.appointment,
      persistedRecordId,
      payment: {
        depositRequired: depositAmount > 0,
        depositAmount,
        checkoutUrl,
        checkoutConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      },
      mangomintUrl: buildMangomintUrl(payload.serviceId),
      nextStep:
        'Complete final confirmation in Mangomint or have staff confirm this request. Deposit/payment links should be sent from the approved payment system.',
      sourceOfTruth: 'Mangomint',
    });
  });
}
