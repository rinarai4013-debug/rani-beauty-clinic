/**
 * Availability Engine
 *
 * Core scheduling logic for the booking system. Handles:
 * - Provider schedule management (working hours, breaks, time off)
 * - Room availability tracking (Halo, Aura, Glow)
 * - Service duration + prep/cleanup buffer calculation
 * - Double-booking prevention
 * - Room-service compatibility checks
 * - Provider-service qualification matrix
 * - Real-time availability slot generation
 * - Buffer time between appointments (5 min prep, 10 min cleanup)
 * - Lunch break enforcement
 * - Holiday schedule
 * - Emergency slot reservation (2 per day for urgent needs)
 */

import { addMinutes, format, parse, isAfter, isBefore, isEqual, parseISO, isSameDay, isWeekend } from 'date-fns';
import type {
  Appointment,
  AvailabilityQuery,
  AvailabilityResult,
  BookableService,
  BookingRequest,
  BookingResult,
  ConflictInfo,
  DayOfWeek,
  Holiday,
  ProviderSchedule,
  Room,
  RoomId,
  SchedulingConfig,
  TimeSlot,
  WeeklySchedule,
} from './types';

// ── DEFAULT CONFIGURATION ──

export const DEFAULT_ROOMS: Room[] = [
  {
    id: 'halo',
    name: 'Halo',
    equipment: ['Sofwave', 'Cutera Secret RF', 'PicoWay'],
    compatibleServices: [
      'sofwave-brow', 'sofwave-lower-face', 'sofwave-neck', 'sofwave-full-face', 'sofwave-full-face-neck',
      'rf-microneedling-face', 'rf-microneedling-face-neck', 'rf-microneedling-abdomen-sm',
      'rf-microneedling-legs-back', 'rf-microneedling-arms', 'rf-microneedling-buttocks',
      'rf-microneedling-abdomen-lg', 'rf-microneedling-legs',
      'scar-laser', 'scar-rf', 'scar-combo',
    ],
    isActive: true,
  },
  {
    id: 'aura',
    name: 'Aura',
    equipment: ['HydraFacial', 'VI Peel', 'BioRePeel', 'PRX-T33', 'ND:YAG Laser'],
    compatibleServices: [
      'hydrafacial-express', 'hydrafacial-signature', 'hydrafacial-back', 'hydrafacial-keravive',
      'hydrafacial-dermaplaning', 'hydrafacial-neck-decollete', 'hydrafacial-red-light',
      'vi-peel', 'biorepeel-face', 'biorepeel-face-neck', 'biorepeel-back',
      'biorepeel-intimate', 'biorepeel-underarms', 'biorepeel-hands',
      'prx-t33-face', 'laser-facial-ndyag',
    ],
    isActive: true,
  },
  {
    id: 'glow',
    name: 'Glow',
    equipment: ['Laser Hair Removal', 'Injectable Station', 'IV Station'],
    compatibleServices: [
      // Laser hair removal - all variants
      'lhr-upper-lip', 'lhr-chin', 'lhr-cheeks', 'lhr-neck', 'lhr-small-areas',
      'lhr-underarms', 'lhr-half-arms', 'lhr-full-arms', 'lhr-full-face',
      'lhr-full-brazilian', 'lhr-pantyline', 'lhr-buttocks', 'lhr-half-legs',
      'lhr-full-legs', 'lhr-feet-toes', 'lhr-hands-fingers', 'lhr-full-chest',
      'lhr-areolas', 'lhr-full-abs', 'lhr-happy-trail', 'lhr-full-back', 'lhr-full-body',
      // Injectables
      'botox', 'dysport', 'filler-lips', 'filler-cheeks', 'filler-jawline', 'filler-undereyes',
      // Wellness injections
      'wellness-vitamin-d3', 'wellness-tri-immune', 'wellness-glutathione',
      'wellness-b12', 'wellness-nad-plus',
      // Consultations
      'consult-aesthetic', 'consult-wellness', 'consult-injectable',
    ],
    isActive: true,
  },
];

export const DEFAULT_PROVIDERS: ProviderSchedule[] = [
  {
    providerId: 'dr-landfield',
    providerName: 'Dr. Alexander Landfield',
    role: 'medical-director',
    qualifiedServices: [
      'botox', 'dysport', 'filler-lips', 'filler-cheeks', 'filler-jawline', 'filler-undereyes',
      'sofwave-brow', 'sofwave-lower-face', 'sofwave-neck', 'sofwave-full-face', 'sofwave-full-face-neck',
      'rf-microneedling-face', 'rf-microneedling-face-neck',
      'laser-facial-ndyag',
      'wellness-vitamin-d3', 'wellness-tri-immune', 'wellness-glutathione', 'wellness-b12', 'wellness-nad-plus',
      'consult-aesthetic', 'consult-wellness', 'consult-injectable',
    ],
    workingHours: {
      monday: { start: '09:00', end: '18:00', isAvailable: true },
      tuesday: { start: '09:00', end: '18:00', isAvailable: true },
      wednesday: { start: '09:00', end: '18:00', isAvailable: true },
      thursday: { start: '09:00', end: '18:00', isAvailable: true },
      friday: { start: '09:00', end: '17:00', isAvailable: true },
      saturday: { start: '10:00', end: '15:00', isAvailable: true },
      sunday: null,
    },
    breaks: [],
    timeOff: [],
    maxDailyAppointments: 12,
    lunchBreak: { start: '12:00', end: '13:00' },
  },
  {
    providerId: 'raj',
    providerName: 'Raj',
    role: 'esthetician',
    qualifiedServices: [
      'hydrafacial-express', 'hydrafacial-signature', 'hydrafacial-back', 'hydrafacial-keravive',
      'hydrafacial-dermaplaning', 'hydrafacial-neck-decollete', 'hydrafacial-red-light',
      'vi-peel', 'biorepeel-face', 'biorepeel-face-neck', 'biorepeel-back',
      'biorepeel-intimate', 'biorepeel-underarms', 'biorepeel-hands', 'prx-t33-face',
      'lhr-upper-lip', 'lhr-chin', 'lhr-cheeks', 'lhr-neck', 'lhr-small-areas',
      'lhr-underarms', 'lhr-half-arms', 'lhr-full-arms', 'lhr-full-face',
      'lhr-full-brazilian', 'lhr-pantyline', 'lhr-buttocks', 'lhr-half-legs',
      'lhr-full-legs', 'lhr-feet-toes', 'lhr-hands-fingers', 'lhr-full-chest',
      'lhr-areolas', 'lhr-full-abs', 'lhr-happy-trail', 'lhr-full-back', 'lhr-full-body',
      'consult-aesthetic',
    ],
    workingHours: {
      monday: { start: '09:00', end: '18:00', isAvailable: true },
      tuesday: { start: '09:00', end: '18:00', isAvailable: true },
      wednesday: { start: '09:00', end: '18:00', isAvailable: true },
      thursday: { start: '09:00', end: '18:00', isAvailable: true },
      friday: { start: '09:00', end: '17:00', isAvailable: true },
      saturday: { start: '10:00', end: '15:00', isAvailable: true },
      sunday: null,
    },
    breaks: [],
    timeOff: [],
    maxDailyAppointments: 14,
    lunchBreak: { start: '12:30', end: '13:30' },
  },
];

export const DEFAULT_SCHEDULING_CONFIG: SchedulingConfig = {
  advanceBookingDays: 180, // 6 months
  sameDayBookingCutoff: '15:00',
  sameDayBookingEnabled: true,
  emergencySlotsPerDay: 2,
  defaultPrepTime: 5,
  defaultCleanupTime: 10,
  newClientConsultRequired: [
    'botox', 'dysport', 'filler-lips', 'filler-cheeks', 'filler-jawline', 'filler-undereyes',
    'sofwave-brow', 'sofwave-lower-face', 'sofwave-neck', 'sofwave-full-face', 'sofwave-full-face-neck',
    'rf-microneedling-face', 'rf-microneedling-face-neck',
  ],
  clinicHours: {
    monday: { start: '09:00', end: '18:00', isAvailable: true },
    tuesday: { start: '09:00', end: '18:00', isAvailable: true },
    wednesday: { start: '09:00', end: '18:00', isAvailable: true },
    thursday: { start: '09:00', end: '18:00', isAvailable: true },
    friday: { start: '09:00', end: '17:00', isAvailable: true },
    saturday: { start: '10:00', end: '15:00', isAvailable: true },
    sunday: null,
  },
  holidays: [],
  rooms: DEFAULT_ROOMS,
};

// ── HELPER FUNCTIONS ──

/** Parse HH:MM string to a Date object on a given date */
export function parseTime(dateStr: string, timeStr: string): Date {
  return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
}

/** Format Date to HH:MM string */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/** Get the day of week key from a date string */
export function getDayOfWeek(dateStr: string): DayOfWeek {
  const dayMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const date = parseISO(dateStr);
  return dayMap[date.getDay()];
}

/** Check if a time falls within a range (inclusive start, exclusive end) */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const t = time.replace(':', '');
  const s = start.replace(':', '');
  const e = end.replace(':', '');
  return t >= s && t < e;
}

/** Check if two time ranges overlap */
export function doTimesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = start1.replace(':', '');
  const e1 = end1.replace(':', '');
  const s2 = start2.replace(':', '');
  const e2 = end2.replace(':', '');
  return s1 < e2 && s2 < e1;
}

/** Add minutes to a HH:MM time string */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m);
  const result = addMinutes(date, minutes);
  return format(result, 'HH:mm');
}

/** Calculate minutes between two HH:MM time strings */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ── CORE AVAILABILITY ENGINE ──

export class AvailabilityEngine {
  private providers: ProviderSchedule[];
  private rooms: Room[];
  private config: SchedulingConfig;
  private appointments: Appointment[];
  private services: Map<string, BookableService>;

  constructor(
    providers: ProviderSchedule[] = DEFAULT_PROVIDERS,
    config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG,
    appointments: Appointment[] = [],
    services: BookableService[] = [],
  ) {
    this.providers = providers;
    this.rooms = config.rooms;
    this.config = config;
    this.appointments = appointments;
    this.services = new Map(services.map(s => [s.id, s]));
  }

  // ── PUBLIC API ──

  /**
   * Get available time slots for a service on a given date
   */
  getAvailableSlots(query: AvailabilityQuery): AvailabilityResult {
    const service = this.services.get(query.serviceId);
    if (!service) {
      return {
        date: query.date,
        service: { id: query.serviceId, name: 'Unknown', duration: 0, price: 0 },
        slots: [],
        isFullyBooked: true,
      };
    }

    // Check if date is a holiday
    const holiday = this.getHoliday(query.date);
    if (holiday?.isClinicClosed) {
      return {
        date: query.date,
        service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
        slots: [],
        isFullyBooked: true,
        nextAvailableDate: this.findNextAvailableDate(query),
      };
    }

    // Check advance booking limit
    const today = new Date();
    const requestDate = parseISO(query.date);
    const maxDate = addMinutes(today, this.config.advanceBookingDays * 24 * 60);
    if (isAfter(requestDate, maxDate)) {
      return {
        date: query.date,
        service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
        slots: [],
        isFullyBooked: true,
      };
    }

    // Check same-day booking rules
    if (isSameDay(requestDate, today) && !this.config.sameDayBookingEnabled) {
      return {
        date: query.date,
        service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
        slots: [],
        isFullyBooked: true,
      };
    }

    // Get qualified providers
    const qualifiedProviders = this.getQualifiedProviders(service.id, query.providerId);
    if (qualifiedProviders.length === 0) {
      return {
        date: query.date,
        service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
        slots: [],
        isFullyBooked: true,
      };
    }

    // Get compatible rooms
    const compatibleRooms = this.getCompatibleRooms(service.id, query.roomId);
    if (compatibleRooms.length === 0) {
      return {
        date: query.date,
        service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
        slots: [],
        isFullyBooked: true,
      };
    }

    // Generate slots for each provider/room combination
    const allSlots: TimeSlot[] = [];
    const dayAppointments = this.getAppointmentsForDate(query.date);
    const emergencySlotCount = this.countEmergencySlots(dayAppointments);

    for (const provider of qualifiedProviders) {
      if (!this.isProviderAvailable(provider, query.date)) continue;

      const providerAppointments = dayAppointments.filter(a => a.providerId === provider.providerId);
      if (providerAppointments.length >= provider.maxDailyAppointments) continue;

      for (const room of compatibleRooms) {
        const roomAppointments = dayAppointments.filter(a => a.roomId === room.id);

        const slots = this.generateSlotsForProviderRoom(
          provider,
          room,
          service,
          query.date,
          providerAppointments,
          roomAppointments,
          emergencySlotCount,
          query.includeEmergencySlots ?? false,
          holiday,
        );

        allSlots.push(...slots);
      }
    }

    // Filter by time preference
    const filteredSlots = query.timePreference
      ? this.filterByTimePreference(allSlots, query.timePreference)
      : allSlots;

    // Sort by time
    const sortedSlots = filteredSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Deduplicate (same time, keep best provider/room combo)
    const uniqueSlots = this.deduplicateSlots(sortedSlots);

    return {
      date: query.date,
      service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
      slots: uniqueSlots,
      isFullyBooked: uniqueSlots.length === 0,
      nextAvailableDate: uniqueSlots.length === 0 ? this.findNextAvailableDate(query) : undefined,
    };
  }

  /**
   * Book an appointment — validates everything and creates the record
   */
  bookAppointment(request: BookingRequest): BookingResult {
    const service = this.services.get(request.serviceId);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const provider = this.providers.find(p => p.providerId === request.providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    const room = this.rooms.find(r => r.id === request.roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Validate provider can perform service
    if (!provider.qualifiedServices.includes(request.serviceId)) {
      return {
        success: false,
        error: `${provider.providerName} is not qualified for this service`,
      };
    }

    // Validate room compatibility
    if (service.requiredRooms.length > 0 && !service.requiredRooms.includes(request.roomId)) {
      return {
        success: false,
        error: `${room.name} room is not compatible with this service`,
      };
    }

    // Calculate end time with buffer
    const endTime = addMinutesToTime(request.startTime, service.duration);
    const endTimeWithCleanup = addMinutesToTime(endTime, service.cleanupTime);
    const startTimeWithPrep = addMinutesToTime(request.startTime, -service.prepTime);

    // Check for conflicts (pass both actual and buffered times)
    const conflict = this.checkConflicts(
      request.providerId,
      request.roomId,
      request.date,
      request.startTime,
      endTime,
      startTimeWithPrep,
      endTimeWithCleanup,
      request.isEmergency,
    );

    if (conflict) {
      const alternatives = this.getAvailableSlots({
        serviceId: request.serviceId,
        date: request.date,
        providerId: request.providerId,
      });

      return {
        success: false,
        error: conflict.message,
        conflictDetails: conflict,
        suggestedAlternatives: alternatives.slots.slice(0, 3),
      };
    }

    // Create the appointment
    const appointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      clientId: request.clientId ?? `new-${Date.now()}`,
      clientName: request.clientInfo
        ? `${request.clientInfo.firstName} ${request.clientInfo.lastName}`
        : '',
      clientEmail: request.clientInfo?.email ?? '',
      clientPhone: request.clientInfo?.phone ?? '',
      serviceId: request.serviceId,
      serviceName: service.name,
      providerId: request.providerId,
      providerName: provider.providerName,
      roomId: request.roomId,
      date: request.date,
      startTime: request.startTime,
      endTime,
      duration: service.duration,
      status: 'pending',
      isNewClient: !request.clientId,
      isMember: false,
      estimatedRevenue: service.price,
      depositPaid: 0,
      notes: request.notes ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmergencySlot: request.isEmergency ?? false,
      combinedWith: request.combinedServiceIds,
      source: request.source,
    };

    this.appointments.push(appointment);

    // Handle recurring appointments
    let recurringAppointments: Appointment[] | undefined;
    if (request.recurringConfig) {
      recurringAppointments = this.createRecurringAppointments(appointment, request.recurringConfig);
    }

    return {
      success: true,
      appointment,
      recurringAppointments,
    };
  }

  /**
   * Check if rebooking is needed (cancel/reschedule without conflict)
   */
  cancelAppointment(appointmentId: string, reason?: string): BookingResult {
    const index = this.appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) {
      return { success: false, error: 'Appointment not found' };
    }

    this.appointments[index] = {
      ...this.appointments[index],
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, appointment: this.appointments[index] };
  }

  /**
   * Reschedule an appointment to a new date/time
   */
  rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newProviderId?: string,
    newRoomId?: RoomId,
  ): BookingResult {
    const existing = this.appointments.find(a => a.id === appointmentId);
    if (!existing) {
      return { success: false, error: 'Appointment not found' };
    }

    const service = this.services.get(existing.serviceId);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const providerId = newProviderId ?? existing.providerId;
    const roomId = newRoomId ?? existing.roomId;

    // Cancel old appointment
    this.cancelAppointment(appointmentId, 'Rescheduled');

    // Book new appointment
    return this.bookAppointment({
      serviceId: existing.serviceId,
      providerId,
      roomId,
      date: newDate,
      startTime: newStartTime,
      clientId: existing.clientId,
      notes: existing.notes,
      source: existing.source,
    });
  }

  // ── PROVIDER MANAGEMENT ──

  /** Get all providers qualified for a service */
  getQualifiedProviders(serviceId: string, preferredProviderId?: string): ProviderSchedule[] {
    const qualified = this.providers.filter(p =>
      p.qualifiedServices.includes(serviceId)
    );

    if (preferredProviderId) {
      return qualified.filter(p => p.providerId === preferredProviderId);
    }

    return qualified;
  }

  /** Check if a provider is available on a given date */
  isProviderAvailable(provider: ProviderSchedule, dateStr: string): boolean {
    const day = getDayOfWeek(dateStr);
    const schedule = provider.workingHours[day];

    if (!schedule || !schedule.isAvailable) return false;

    // Check time off
    const isOnTimeOff = provider.timeOff.some(to => {
      const start = parseISO(to.startDate);
      const end = parseISO(to.endDate);
      const date = parseISO(dateStr);
      return to.isApproved && date >= start && date <= end;
    });

    return !isOnTimeOff;
  }

  /** Get provider working hours for a date, factoring in holidays */
  getProviderHours(provider: ProviderSchedule, dateStr: string): { start: string; end: string } | null {
    const holiday = this.getHoliday(dateStr);
    if (holiday?.isClinicClosed) return null;
    if (holiday?.modifiedHours) return holiday.modifiedHours;

    const day = getDayOfWeek(dateStr);
    const schedule = provider.workingHours[day];
    if (!schedule || !schedule.isAvailable) return null;

    return { start: schedule.start, end: schedule.end };
  }

  // ── ROOM MANAGEMENT ──

  /** Get rooms compatible with a service */
  getCompatibleRooms(serviceId: string, preferredRoomId?: RoomId): Room[] {
    const compatible = this.rooms.filter(r =>
      r.isActive && r.compatibleServices.includes(serviceId)
    );

    // If service has no room restriction, all active rooms work
    if (compatible.length === 0) {
      return this.rooms.filter(r => r.isActive);
    }

    if (preferredRoomId) {
      const preferred = compatible.filter(r => r.id === preferredRoomId);
      return preferred.length > 0 ? preferred : compatible;
    }

    return compatible;
  }

  /** Check room availability for a specific time block */
  isRoomAvailable(roomId: RoomId, dateStr: string, startTime: string, endTime: string): boolean {
    const roomAppointments = this.getAppointmentsForDate(dateStr)
      .filter(a => a.roomId === roomId && a.status !== 'cancelled' && a.status !== 'no-show');

    return !roomAppointments.some(a => {
      const service = this.services.get(a.serviceId);
      const prepStart = addMinutesToTime(a.startTime, -(service?.prepTime ?? this.config.defaultPrepTime));
      const cleanupEnd = addMinutesToTime(a.endTime, service?.cleanupTime ?? this.config.defaultCleanupTime);
      return doTimesOverlap(startTime, endTime, prepStart, cleanupEnd);
    });
  }

  // ── HOLIDAY MANAGEMENT ──

  getHoliday(dateStr: string): Holiday | undefined {
    return this.config.holidays.find(h => h.date === dateStr);
  }

  addHoliday(holiday: Holiday): void {
    this.config.holidays.push(holiday);
  }

  removeHoliday(dateStr: string): void {
    this.config.holidays = this.config.holidays.filter(h => h.date !== dateStr);
  }

  // ── APPOINTMENT QUERIES ──

  getAppointmentsForDate(dateStr: string): Appointment[] {
    return this.appointments.filter(
      a => a.date === dateStr && a.status !== 'cancelled'
    );
  }

  getAppointmentsForProvider(providerId: string, dateStr: string): Appointment[] {
    return this.getAppointmentsForDate(dateStr).filter(
      a => a.providerId === providerId
    );
  }

  getAppointmentsForRoom(roomId: RoomId, dateStr: string): Appointment[] {
    return this.getAppointmentsForDate(dateStr).filter(
      a => a.roomId === roomId
    );
  }

  /** Get all appointments across a date range */
  getAppointmentsInRange(startDate: string, endDate: string): Appointment[] {
    return this.appointments.filter(
      a => a.date >= startDate && a.date <= endDate && a.status !== 'cancelled'
    );
  }

  // ── CONFIG ACCESS ──

  getConfig(): SchedulingConfig {
    return this.config;
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  getProviders(): ProviderSchedule[] {
    return this.providers;
  }

  getAllAppointments(): Appointment[] {
    return this.appointments;
  }

  updateConfig(updates: Partial<SchedulingConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.rooms) {
      this.rooms = updates.rooms;
    }
  }

  // ── PRIVATE METHODS ──

  private generateSlotsForProviderRoom(
    provider: ProviderSchedule,
    room: Room,
    service: BookableService,
    dateStr: string,
    providerAppointments: Appointment[],
    roomAppointments: Appointment[],
    emergencySlotCount: number,
    includeEmergencySlots: boolean,
    holiday?: Holiday | undefined,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const hours = this.getProviderHours(provider, dateStr);
    if (!hours) return slots;

    const totalSlotDuration = service.prepTime + service.duration + service.cleanupTime;
    const slotIncrement = 15; // Generate slots in 15-minute increments

    let currentTime = hours.start;

    // For same-day bookings, skip past current time + cutoff
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === today) {
      const now = format(new Date(), 'HH:mm');
      if (currentTime < now) {
        // Round up to next 15-min increment
        const [h, m] = now.split(':').map(Number);
        const roundedMin = Math.ceil(m / 15) * 15;
        currentTime = roundedMin >= 60
          ? `${String(h + 1).padStart(2, '0')}:00`
          : `${String(h).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`;
      }

      // Check same-day cutoff
      if (currentTime >= this.config.sameDayBookingCutoff) {
        return slots;
      }
    }

    while (currentTime < hours.end) {
      const endTime = addMinutesToTime(currentTime, service.duration);
      const endWithCleanup = addMinutesToTime(endTime, service.cleanupTime);
      const startWithPrep = addMinutesToTime(currentTime, -service.prepTime);

      // Check if slot fits within working hours
      if (endWithCleanup > hours.end) break;

      // Check lunch break
      const isInLunch = doTimesOverlap(
        startWithPrep, endWithCleanup,
        provider.lunchBreak.start, provider.lunchBreak.end,
      );

      // Check breaks
      const isInBreak = provider.breaks.some(b => {
        const day = getDayOfWeek(dateStr);
        return b.days.includes(day) && doTimesOverlap(startWithPrep, endWithCleanup, b.start, b.end);
      });

      // Check provider availability (no overlapping appointments including buffers)
      const providerConflict = providerAppointments.some(a => {
        if (a.status === 'cancelled' || a.status === 'no-show') return false;
        const existingService = this.services.get(a.serviceId);
        const existingPrep = addMinutesToTime(a.startTime, -(existingService?.prepTime ?? this.config.defaultPrepTime));
        const existingCleanup = addMinutesToTime(a.endTime, existingService?.cleanupTime ?? this.config.defaultCleanupTime);
        return doTimesOverlap(startWithPrep, endWithCleanup, existingPrep, existingCleanup);
      });

      // Check room availability
      const roomConflict = roomAppointments.some(a => {
        if (a.status === 'cancelled' || a.status === 'no-show') return false;
        const existingService = this.services.get(a.serviceId);
        const existingPrep = addMinutesToTime(a.startTime, -(existingService?.prepTime ?? this.config.defaultPrepTime));
        const existingCleanup = addMinutesToTime(a.endTime, existingService?.cleanupTime ?? this.config.defaultCleanupTime);
        return doTimesOverlap(startWithPrep, endWithCleanup, existingPrep, existingCleanup);
      });

      // Emergency slot reservation
      const isEmergencyReserved = !includeEmergencySlots &&
        emergencySlotCount < this.config.emergencySlotsPerDay &&
        this.isEmergencySlotTime(currentTime);

      if (!isInLunch && !isInBreak && !providerConflict && !roomConflict) {
        slots.push({
          date: dateStr,
          startTime: currentTime,
          endTime,
          providerId: provider.providerId,
          providerName: provider.providerName,
          roomId: room.id,
          roomName: room.name,
          isEmergencyReserved,
          isOptimal: false, // Set by scheduler
          revenueScore: undefined,
        });
      }

      // Move to next slot increment
      currentTime = addMinutesToTime(currentTime, slotIncrement);
    }

    return slots;
  }

  /** Determine if a time is reserved for emergency slots (first + last available) */
  private isEmergencySlotTime(time: string): boolean {
    // Reserve 10:00 and 16:00 as emergency slots
    return time === '10:00' || time === '16:00';
  }

  /** Check for booking conflicts */
  private checkConflicts(
    providerId: string,
    roomId: RoomId,
    dateStr: string,
    actualStart: string,
    actualEnd: string,
    startTimeWithPrep: string,
    endTimeWithCleanup: string,
    isEmergency?: boolean,
  ): ConflictInfo | null {
    // Holiday check
    const holiday = this.getHoliday(dateStr);
    if (holiday?.isClinicClosed) {
      return {
        type: 'holiday',
        message: `The clinic is closed on ${dateStr} for ${holiday.name}`,
      };
    }

    // Provider availability
    const provider = this.providers.find(p => p.providerId === providerId);
    if (!provider || !this.isProviderAvailable(provider, dateStr)) {
      return {
        type: 'provider-unavailable',
        message: 'Provider is not available on this date',
      };
    }

    // Working hours — check actual appointment time (prep/cleanup can extend slightly outside)
    const hours = this.getProviderHours(provider, dateStr);
    if (!hours || actualStart < hours.start || actualEnd > hours.end) {
      return {
        type: 'outside-hours',
        message: 'Appointment falls outside of working hours',
      };
    }

    // Lunch break — check actual appointment time
    if (doTimesOverlap(actualStart, actualEnd, provider.lunchBreak.start, provider.lunchBreak.end)) {
      return {
        type: 'outside-hours',
        message: 'Appointment overlaps with lunch break',
      };
    }

    // Provider double-booking
    const providerAppointments = this.getAppointmentsForProvider(providerId, dateStr);
    for (const apt of providerAppointments) {
      if (apt.status === 'cancelled' || apt.status === 'no-show') continue;
      const svc = this.services.get(apt.serviceId);
      const existingPrep = addMinutesToTime(apt.startTime, -(svc?.prepTime ?? this.config.defaultPrepTime));
      const existingCleanup = addMinutesToTime(apt.endTime, svc?.cleanupTime ?? this.config.defaultCleanupTime);

      if (doTimesOverlap(startTimeWithPrep, endTimeWithCleanup, existingPrep, existingCleanup)) {
        return {
          type: 'double-booking',
          existingAppointment: {
            id: apt.id,
            clientName: apt.clientName,
            serviceName: apt.serviceName,
            startTime: apt.startTime,
            endTime: apt.endTime,
          },
          message: `Conflicts with ${apt.clientName}'s ${apt.serviceName} at ${apt.startTime}`,
        };
      }
    }

    // Room conflict
    const roomAppointments = this.getAppointmentsForRoom(roomId, dateStr);
    for (const apt of roomAppointments) {
      if (apt.status === 'cancelled' || apt.status === 'no-show') continue;
      const svc = this.services.get(apt.serviceId);
      const existingPrep = addMinutesToTime(apt.startTime, -(svc?.prepTime ?? this.config.defaultPrepTime));
      const existingCleanup = addMinutesToTime(apt.endTime, svc?.cleanupTime ?? this.config.defaultCleanupTime);

      if (doTimesOverlap(startTimeWithPrep, endTimeWithCleanup, existingPrep, existingCleanup)) {
        return {
          type: 'room-conflict',
          existingAppointment: {
            id: apt.id,
            clientName: apt.clientName,
            serviceName: apt.serviceName,
            startTime: apt.startTime,
            endTime: apt.endTime,
          },
          message: `Room ${roomId} is occupied by ${apt.serviceName} at ${apt.startTime}`,
        };
      }
    }

    // Emergency slot check
    if (!isEmergency) {
      const dayAppointments = this.getAppointmentsForDate(dateStr);
      const emergencyCount = this.countEmergencySlots(dayAppointments);
      if (emergencyCount >= this.config.emergencySlotsPerDay) {
        // Not actually a conflict - just informational
      }
    }

    return null; // No conflict
  }

  private countEmergencySlots(appointments: Appointment[]): number {
    return appointments.filter(a => a.isEmergencySlot && a.status !== 'cancelled').length;
  }

  private filterByTimePreference(slots: TimeSlot[], preference: 'morning' | 'afternoon' | 'evening'): TimeSlot[] {
    return slots.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      switch (preference) {
        case 'morning': return hour >= 9 && hour < 12;
        case 'afternoon': return hour >= 12 && hour < 16;
        case 'evening': return hour >= 16;
        default: return true;
      }
    });
  }

  private deduplicateSlots(slots: TimeSlot[]): TimeSlot[] {
    const seen = new Map<string, TimeSlot>();
    for (const slot of slots) {
      const key = `${slot.startTime}-${slot.providerId}`;
      if (!seen.has(key)) {
        seen.set(key, slot);
      }
    }
    return Array.from(seen.values());
  }

  private findNextAvailableDate(query: AvailabilityQuery): string | undefined {
    const startDate = parseISO(query.date);
    for (let i = 1; i <= 30; i++) {
      const nextDate = addMinutes(startDate, i * 24 * 60);
      const dateStr = format(nextDate, 'yyyy-MM-dd');
      const result = this.getAvailableSlots({ ...query, date: dateStr });
      if (result.slots.length > 0) return dateStr;
    }
    return undefined;
  }

  private createRecurringAppointments(
    template: Appointment,
    config: { intervalDays: number; occurrences: number; endDate?: string },
  ): Appointment[] {
    const seriesId = `series-${Date.now()}`;
    const recurring: Appointment[] = [];

    for (let i = 1; i < config.occurrences; i++) {
      const nextDate = addMinutes(parseISO(template.date), i * config.intervalDays * 24 * 60);
      const dateStr = format(nextDate, 'yyyy-MM-dd');

      if (config.endDate && dateStr > config.endDate) break;

      const apt: Appointment = {
        ...template,
        id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-r${i}`,
        date: dateStr,
        status: 'pending',
        recurringSeriesId: seriesId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.appointments.push(apt);
      recurring.push(apt);
    }

    // Tag original as part of series
    template.recurringSeriesId = seriesId;

    return recurring;
  }
}

// ── SINGLETON FACTORY ──

let _engine: AvailabilityEngine | null = null;

export function getAvailabilityEngine(
  providers?: ProviderSchedule[],
  config?: SchedulingConfig,
  appointments?: Appointment[],
  services?: BookableService[],
): AvailabilityEngine {
  if (!_engine || providers || config || appointments || services) {
    _engine = new AvailabilityEngine(providers, config, appointments, services);
  }
  return _engine;
}

export function resetAvailabilityEngine(): void {
  _engine = null;
}
