import type {
  Appointment,
  AvailabilityQuery,
  AvailabilityResult,
  BookableService,
  BookingRequest,
  BookingResult,
  ProviderSchedule,
  SchedulingConfig,
} from "@/lib/booking/types";

export const DEFAULT_PROVIDERS: ProviderSchedule[];
export const DEFAULT_SCHEDULING_CONFIG: SchedulingConfig;

export function addMinutesToTime(timeStr: string, minutes: number): string;
export function minutesBetween(start: string, end: string): number;

export class AvailabilityEngine {
  constructor(
    providers: ProviderSchedule[],
    config: SchedulingConfig,
    appointments: Appointment[],
    services: BookableService[]
  );

  getAvailableSlots(query: AvailabilityQuery): AvailabilityResult;
  bookAppointment(request: BookingRequest): BookingResult;
  getAppointmentsForDate(dateStr: string): Appointment[];
  getProviders(): ProviderSchedule[];
  getAppointmentsForProvider(providerId: string, dateStr: string): Appointment[];
  getProviderHours(provider: ProviderSchedule, dateStr: string): unknown;
}
