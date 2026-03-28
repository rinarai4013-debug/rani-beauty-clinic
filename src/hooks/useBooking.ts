'use client';

import { useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import type {
  AvailabilityResult,
  BookingRequest,
  BookingResult,
  CalendarColorMode,
  CalendarDayData,
  CalendarView,
  IntakeForm,
  WaitlistEntry,
} from '@/lib/booking/types';
import type { WaitlistStats } from '@/lib/booking/waitlist';
import type { ProviderDayView, RoomDayView, HourlyRevenue, PrintSchedule } from '@/lib/booking/calendar';
import type { ProviderLoad, ScheduleGap, OptimalSlotSuggestion } from '@/lib/booking/scheduler';
import type { FormProgress } from '@/lib/booking/intake';
import type { ProcessedReminder, RebookingNudge } from '@/lib/booking/reminders';

// ── FETCHER ──

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new Error(info.error ?? `Failed to fetch (${res.status})`);
  }
  return res.json();
};

const postFetcher = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new Error(info.error ?? `Failed to fetch (${res.status})`);
  }
  return res.json();
};

// ── AVAILABILITY HOOK ──

export function useAvailability(
  serviceId: string | null,
  date: string | null,
  providerId?: string,
  timePreference?: string,
  config?: SWRConfiguration,
) {
  const params = new URLSearchParams();
  if (serviceId) params.set('serviceId', serviceId);
  if (date) params.set('date', date);
  if (providerId) params.set('providerId', providerId);
  if (timePreference) params.set('timePreference', timePreference);

  const key = serviceId && date ? `/api/booking/availability?${params}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<AvailabilityResult>(
    key,
    fetcher,
    { revalidateOnFocus: false, ...config },
  );

  return {
    availability: data,
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  };
}

// ── BOOKING MUTATIONS ──

export function useBooking() {
  const createBooking = useCallback(async (request: BookingRequest): Promise<BookingResult> => {
    return postFetcher('/api/booking/book', request);
  }, []);

  const cancelBooking = useCallback(async (appointmentId: string, reason?: string) => {
    return postFetcher('/api/booking/book', { action: 'cancel', appointmentId, reason });
  }, []);

  const rescheduleBooking = useCallback(async (
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newProviderId?: string,
    newRoomId?: string,
  ) => {
    return postFetcher('/api/booking/book', {
      action: 'reschedule',
      appointmentId,
      newDate,
      newStartTime,
      newProviderId,
      newRoomId,
    });
  }, []);

  return { createBooking, cancelBooking, rescheduleBooking };
}

// ── CALENDAR HOOKS ──

export function useCalendarDay(
  date: string | null,
  colorMode: CalendarColorMode = 'service',
  config?: SWRConfiguration,
) {
  const key = date ? `/api/booking/calendar?view=day&date=${date}&colorMode=${colorMode}` : null;

  const { data, error, isLoading, mutate } = useSWR<CalendarDayData>(
    key, fetcher,
    { refreshInterval: 30000, ...config },
  );

  return { day: data, error, isLoading, refresh: mutate };
}

export function useCalendarWeek(
  date: string | null,
  colorMode: CalendarColorMode = 'service',
  config?: SWRConfiguration,
) {
  const key = date ? `/api/booking/calendar?view=week&date=${date}&colorMode=${colorMode}` : null;

  const { data, error, isLoading, mutate } = useSWR<{ days: CalendarDayData[] }>(
    key, fetcher,
    { refreshInterval: 60000, ...config },
  );

  return { week: data?.days, error, isLoading, refresh: mutate };
}

export function useCalendarMonth(
  date: string | null,
  colorMode: CalendarColorMode = 'service',
  config?: SWRConfiguration,
) {
  const key = date ? `/api/booking/calendar?view=month&date=${date}&colorMode=${colorMode}` : null;

  const { data, error, isLoading, mutate } = useSWR<{ days: CalendarDayData[] }>(
    key, fetcher,
    { refreshInterval: 120000, ...config },
  );

  return { month: data?.days, error, isLoading, refresh: mutate };
}

export function useProviderView(date: string | null, config?: SWRConfiguration) {
  const key = date ? `/api/booking/calendar?date=${date}&subView=providers` : null;

  const { data, error, isLoading, mutate } = useSWR<{ providers: ProviderDayView[] }>(
    key, fetcher,
    { refreshInterval: 30000, ...config },
  );

  return { providers: data?.providers, error, isLoading, refresh: mutate };
}

export function useRoomView(date: string | null, config?: SWRConfiguration) {
  const key = date ? `/api/booking/calendar?date=${date}&subView=rooms` : null;

  const { data, error, isLoading, mutate } = useSWR<{ rooms: RoomDayView[] }>(
    key, fetcher,
    { refreshInterval: 30000, ...config },
  );

  return { rooms: data?.rooms, error, isLoading, refresh: mutate };
}

export function useRevenueOverlay(date: string | null, config?: SWRConfiguration) {
  const key = date ? `/api/booking/calendar?date=${date}&subView=revenue` : null;

  const { data, error, isLoading, mutate } = useSWR<{ revenue: HourlyRevenue[] }>(
    key, fetcher,
    { refreshInterval: 60000, ...config },
  );

  return { revenue: data?.revenue, error, isLoading, refresh: mutate };
}

export function usePrintSchedule(date: string | null) {
  const key = date ? `/api/booking/calendar?date=${date}&subView=print` : null;

  const { data, error, isLoading } = useSWR<PrintSchedule>(
    key, fetcher,
    { revalidateOnFocus: false },
  );

  return { schedule: data, error, isLoading };
}

// ── WAITLIST HOOKS ──

export function useWaitlist(serviceId?: string, config?: SWRConfiguration) {
  const params = serviceId ? `?serviceId=${serviceId}` : '';
  const key = `/api/booking/waitlist${params}`;

  const { data, error, isLoading, mutate } = useSWR<{
    entries: WaitlistEntry[];
    stats: WaitlistStats;
  }>(key, fetcher, { refreshInterval: 60000, ...config });

  const addToWaitlist = useCallback(async (entry: Partial<WaitlistEntry>) => {
    const result = await postFetcher('/api/booking/waitlist', entry);
    mutate();
    return result;
  }, [mutate]);

  const removeFromWaitlist = useCallback(async (entryId: string) => {
    await fetch(`/api/booking/waitlist?entryId=${entryId}`, { method: 'DELETE' });
    mutate();
  }, [mutate]);

  return {
    entries: data?.entries,
    stats: data?.stats,
    error,
    isLoading,
    addToWaitlist,
    removeFromWaitlist,
    refresh: mutate,
  };
}

// ── INTAKE HOOKS ──

export function useIntakeForm(
  clientId: string | null,
  appointmentId?: string,
  serviceId?: string,
  config?: SWRConfiguration,
) {
  const params = new URLSearchParams();
  if (clientId) params.set('clientId', clientId);
  if (appointmentId) params.set('appointmentId', appointmentId);
  if (serviceId) params.set('serviceId', serviceId);

  const key = clientId ? `/api/booking/intake?${params}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    form: IntakeForm;
    requiredConsents: unknown[];
    progress: FormProgress;
  }>(key, fetcher, { revalidateOnFocus: false, ...config });

  const updateField = useCallback(async (
    formId: string,
    sectionId: string,
    fieldId: string,
    value: unknown,
  ) => {
    await fetch('/api/booking/intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, action: 'update-field', sectionId, fieldId, value }),
    });
    mutate();
  }, [mutate]);

  const signConsent = useCallback(async (
    formId: string,
    consentType: string,
    signatureData?: string,
  ) => {
    await fetch('/api/booking/intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, action: 'sign-consent', consentType, signatureData }),
    });
    mutate();
  }, [mutate]);

  const submitForm = useCallback(async (formId: string, sections: unknown) => {
    const result = await postFetcher('/api/booking/intake', { formId, sections });
    mutate();
    return result;
  }, [mutate]);

  return {
    form: data?.form,
    requiredConsents: data?.requiredConsents,
    progress: data?.progress,
    error,
    isLoading,
    updateField,
    signConsent,
    submitForm,
    refresh: mutate,
  };
}

// ── REMINDER HOOKS ──

export function useReminders(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ reminders: ProcessedReminder[] }>(
    '/api/booking/reminders',
    fetcher,
    { refreshInterval: 60000, ...config },
  );

  return {
    reminders: data?.reminders,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useRebookingNudges(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ nudges: RebookingNudge[] }>(
    '/api/booking/reminders?type=rebooking',
    fetcher,
    { refreshInterval: 300000, ...config },
  );

  return {
    nudges: data?.nudges,
    error,
    isLoading,
    refresh: mutate,
  };
}
