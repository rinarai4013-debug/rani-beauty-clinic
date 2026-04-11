import { isConfigured as isMangomintConfigured } from './client';
import { logEvent } from '@/lib/logging/structured-logger';
import type { BookingRequest } from '@/lib/booking/types';
import { BOOKING_URL } from '@/data/clinic-config';
import { getServiceById } from '@/lib/booking/services';
import {
  buildBookingRequestFromAppointmentRecord,
  getMangomintWritebackReadiness,
  type MangomintWritebackReadiness,
} from './mapping';

export interface WritebackResult {
  provider: 'mangomint';
  status: 'ok' | 'unavailable' | 'failed' | 'redirect_required';
  message?: string;
  bookingUrl?: string;
  bookingMode?: 'api' | 'hosted-booking';
  serviceName?: string;
  readiness?: MangomintWritebackReadiness;
  summary?: {
    mode: MangomintWritebackReadiness['mode'];
    blockerCount: number;
    topBlocker?: string;
    mappedService: boolean;
    mappedProvider: boolean;
    linkedClient: boolean;
    linkedAppointment?: boolean;
  };
  nextAction?: string;
}

function summarizeReadiness(readiness?: MangomintWritebackReadiness): WritebackResult['summary'] | undefined {
  if (!readiness) return undefined;

  return {
    mode: readiness.mode,
    blockerCount: readiness.blockers.length,
    topBlocker: readiness.blockers[0],
    mappedService: readiness.service.confidence !== 'unresolved' && readiness.service.mangomintServiceId !== null,
    mappedProvider: readiness.provider.confidence !== 'unresolved' && readiness.provider.mangomintStaffId !== null,
    linkedClient: readiness.client.mangomintClientId !== null,
    linkedAppointment: readiness.appointment?.mangomintAppointmentId !== null,
  };
}

export async function createMangomintBooking(
  request: BookingRequest,
  appointmentId: string,
): Promise<WritebackResult> {
  if (!isMangomintConfigured()) {
    return {
      provider: 'mangomint',
      status: 'unavailable',
      message: 'MANGOMINT_API_KEY not configured',
      bookingUrl: BOOKING_URL,
      bookingMode: 'hosted-booking',
    };
  }

  const service = getServiceById(request.serviceId);
  const readiness = await getMangomintWritebackReadiness(request, appointmentId);

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'create',
    appointmentId,
    serviceId: request.serviceId,
    readinessMode: readiness.mode,
    blockers: readiness.blockers,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message:
      readiness.mode === 'direct-api-ready'
        ? 'Service, provider, and client are mapped. Final API mutation still needs verified Mangomint outbound contract, so keep using hosted booking for now.'
        : 'Use the hosted Mangomint booking flow until direct write-back mapping is fully verified.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
    serviceName: service?.name,
    readiness,
    summary: summarizeReadiness(readiness),
    nextAction:
      readiness.mode === 'direct-api-ready'
        ? 'Hosted booking remains the safest source of truth until outbound appointment creation is verified live.'
        : readiness.blockers[0] || 'Complete Mangomint mapping before switching away from hosted booking.',
  };
}

export async function cancelMangomintBooking(
  appointmentId: string,
  request?: BookingRequest,
): Promise<WritebackResult> {
  if (!isMangomintConfigured()) {
    return {
      provider: 'mangomint',
      status: 'unavailable',
      message: 'MANGOMINT_API_KEY not configured',
      bookingUrl: BOOKING_URL,
      bookingMode: 'hosted-booking',
    };
  }

  const requestContext = request || await buildBookingRequestFromAppointmentRecord(appointmentId) || undefined;
  const readiness = requestContext
    ? await getMangomintWritebackReadiness(requestContext, appointmentId)
    : undefined;

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'cancel',
    appointmentId,
    readinessMode: readiness?.mode,
    blockers: readiness?.blockers,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message:
      readiness?.appointment?.mangomintAppointmentId
        ? 'This appointment is linked to a Mangomint appointment. Cancel it inside Mangomint until the outbound cancel contract is verified.'
        : 'Cancel this appointment inside Mangomint until direct write-back is implemented.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
    readiness,
    summary: summarizeReadiness(readiness),
    nextAction:
      readiness?.appointment?.mangomintAppointmentId
        ? `Cancel Mangomint appointment ${readiness.appointment.mangomintAppointmentId} in the live calendar.`
        : 'Locate the matching appointment in Mangomint and cancel it there to keep the hosted calendar aligned.',
  };
}

export async function rescheduleMangomintBooking(
  appointmentId: string,
  newDate: string,
  newStartTime: string,
  request?: BookingRequest,
): Promise<WritebackResult> {
  if (!isMangomintConfigured()) {
    return {
      provider: 'mangomint',
      status: 'unavailable',
      message: 'MANGOMINT_API_KEY not configured',
      bookingUrl: BOOKING_URL,
      bookingMode: 'hosted-booking',
    };
  }

  const requestContext = request || await buildBookingRequestFromAppointmentRecord(appointmentId) || undefined;
  const readiness = requestContext
    ? await getMangomintWritebackReadiness(requestContext, appointmentId)
    : undefined;

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'reschedule',
    appointmentId,
    newDate,
    newStartTime,
    readinessMode: readiness?.mode,
    blockers: readiness?.blockers,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message:
      readiness?.appointment?.mangomintAppointmentId
        ? 'This appointment is linked to Mangomint. Reschedule it there until the outbound reschedule contract is verified.'
        : 'Reschedule this appointment inside Mangomint until direct write-back is implemented.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
    readiness,
    summary: summarizeReadiness(readiness),
    nextAction:
      readiness?.appointment?.mangomintAppointmentId
        ? `Move Mangomint appointment ${readiness.appointment.mangomintAppointmentId} to ${newDate} at ${newStartTime}.`
        : `Reschedule the matching appointment in Mangomint to ${newDate} at ${newStartTime}.`,
  };
}
