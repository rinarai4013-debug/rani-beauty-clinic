import { isConfigured as isMangomintConfigured } from './client';
import { logEvent } from '@/lib/logging/structured-logger';
import type { BookingRequest } from '@/lib/booking/types';
import { BOOKING_URL } from '@/data/clinic-config';
import { getServiceById } from '@/lib/booking/services';

export interface WritebackResult {
  provider: 'mangomint';
  status: 'ok' | 'unavailable' | 'failed' | 'redirect_required';
  message?: string;
  bookingUrl?: string;
  bookingMode?: 'api' | 'hosted-booking';
  serviceName?: string;
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

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'create',
    appointmentId,
    serviceId: request.serviceId,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message: 'Use the hosted Mangomint booking flow until direct write-back mapping is implemented.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
    serviceName: service?.name,
  };
}

export async function cancelMangomintBooking(appointmentId: string): Promise<WritebackResult> {
  if (!isMangomintConfigured()) {
    return {
      provider: 'mangomint',
      status: 'unavailable',
      message: 'MANGOMINT_API_KEY not configured',
      bookingUrl: BOOKING_URL,
      bookingMode: 'hosted-booking',
    };
  }

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'cancel',
    appointmentId,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message: 'Cancel this appointment inside Mangomint until direct write-back is implemented.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
  };
}

export async function rescheduleMangomintBooking(
  appointmentId: string,
  newDate: string,
  newStartTime: string,
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

  logEvent('integration', 'warn', 'Mangomint write-back not implemented', {
    action: 'reschedule',
    appointmentId,
    newDate,
    newStartTime,
  });

  return {
    provider: 'mangomint',
    status: 'redirect_required',
    message: 'Reschedule this appointment inside Mangomint until direct write-back is implemented.',
    bookingUrl: BOOKING_URL,
    bookingMode: 'hosted-booking',
  };
}
