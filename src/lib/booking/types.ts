/**
 * Booking System — Shared Types
 *
 * Central type definitions for the entire booking and scheduling system.
 * All modules import from here to ensure consistency.
 */

// ── ROOM & PROVIDER TYPES ──

export type RoomId = 'halo' | 'aura' | 'glow';

export interface Room {
  id: RoomId;
  name: string;
  equipment: string[];
  compatibleServices: string[]; // service IDs that can use this room
  isActive: boolean;
}

export interface ProviderSchedule {
  providerId: string;
  providerName: string;
  role: 'medical-director' | 'esthetician' | 'injector' | 'provider';
  qualifiedServices: string[]; // service IDs they can perform
  workingHours: WeeklySchedule;
  breaks: BreakConfig[];
  timeOff: TimeOffPeriod[];
  maxDailyAppointments: number;
  lunchBreak: { start: string; end: string }; // HH:MM format
}

export interface WeeklySchedule {
  monday: DaySchedule | null;
  tuesday: DaySchedule | null;
  wednesday: DaySchedule | null;
  thursday: DaySchedule | null;
  friday: DaySchedule | null;
  saturday: DaySchedule | null;
  sunday: DaySchedule | null;
}

export type DayOfWeek = keyof WeeklySchedule;

export interface DaySchedule {
  start: string; // HH:MM
  end: string;   // HH:MM
  isAvailable: boolean;
}

export interface BreakConfig {
  name: string;
  start: string; // HH:MM
  end: string;   // HH:MM
  days: DayOfWeek[];
}

export interface TimeOffPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  isApproved: boolean;
}

// ── SERVICE TYPES ──

export interface BookableService {
  id: string;
  name: string;
  category: string;
  duration: number;       // minutes - actual treatment time
  prepTime: number;       // minutes - room prep before (default 5)
  cleanupTime: number;    // minutes - room cleanup after (default 10)
  bufferTime: number;     // minutes - total buffer (prep + cleanup = 15)
  price: number;
  requiredRooms: RoomId[];     // empty = any room
  requiredEquipment: string[];
  requiresConsultation: boolean; // new clients need consult first
  isActive: boolean;
  rebookingIntervalDays: number; // suggested rebooking (e.g., 90 for Botox)
  preInstructions: string[];     // pre-appointment instructions
  postInstructions: string[];
  canCombineWith: string[];      // service IDs that can be done same visit
  depositRequired: number;       // deposit amount in dollars, 0 = none
  cancellationPolicy: 'standard' | 'strict'; // strict = 48h, standard = 24h
}

// ── APPOINTMENT TYPES ──

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'rescheduled';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  roomId: RoomId;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  duration: number;    // minutes
  status: AppointmentStatus;
  isNewClient: boolean;
  isMember: boolean;
  estimatedRevenue: number;
  depositPaid: number;
  notes: string;
  createdAt: string;   // ISO timestamp
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  noShowRisk?: number; // 0-100
  isEmergencySlot: boolean;
  combinedWith?: string[]; // other appointment IDs in same visit
  recurringSeriesId?: string;
  source: 'online' | 'phone' | 'walk-in' | 'internal' | 'waitlist';
}

// ── AVAILABILITY TYPES ──

export interface TimeSlot {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  providerId: string;
  providerName: string;
  roomId: RoomId;
  roomName: string;
  isEmergencyReserved: boolean;
  isOptimal: boolean; // flagged by scheduler as revenue-optimal
  revenueScore?: number; // 0-100
}

export interface AvailabilityQuery {
  serviceId: string;
  date: string;              // YYYY-MM-DD
  providerId?: string;       // optional provider preference
  roomId?: RoomId;           // optional room preference
  timePreference?: 'morning' | 'afternoon' | 'evening';
  includeEmergencySlots?: boolean;
}

export interface AvailabilityResult {
  date: string;
  service: { id: string; name: string; duration: number; price: number };
  slots: TimeSlot[];
  nextAvailableDate?: string; // if no slots today
  isFullyBooked: boolean;
}

// ── HOLIDAY TYPES ──

export interface Holiday {
  date: string;       // YYYY-MM-DD
  name: string;
  isClinicClosed: boolean;
  modifiedHours?: { start: string; end: string };
}

// ── BOOKING REQUEST ──

export interface BookingRequest {
  serviceId: string;
  providerId: string;
  roomId: RoomId;
  date: string;
  startTime: string;
  clientId?: string;       // existing client
  clientInfo?: {           // new client
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  notes?: string;
  isEmergency?: boolean;
  combinedServiceIds?: string[];
  recurringConfig?: RecurringConfig;
  source: Appointment['source'];
}

export interface RecurringConfig {
  intervalDays: number;
  occurrences: number;
  endDate?: string;
}

export interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  recurringAppointments?: Appointment[];
  error?: string;
  conflictDetails?: ConflictInfo;
  suggestedAlternatives?: TimeSlot[];
}

export interface ConflictInfo {
  type: 'double-booking' | 'room-conflict' | 'provider-unavailable' | 'outside-hours' | 'holiday' | 'insufficient-buffer' | 'emergency-slots-full';
  existingAppointment?: Pick<Appointment, 'id' | 'clientName' | 'serviceName' | 'startTime' | 'endTime'>;
  message: string;
}

// ── WAITLIST TYPES ──

export type WaitlistPriority = 'vip' | 'member' | 'standard';

export interface WaitlistEntry {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  preferredProviderId?: string;
  preferredProviderName?: string;
  timePreference: ('morning' | 'afternoon' | 'evening' | 'weekend')[];
  dateRangeStart: string;
  dateRangeEnd: string;
  priority: WaitlistPriority;
  isMember: boolean;
  isVip: boolean;
  status: 'active' | 'notified' | 'booked' | 'expired' | 'cancelled';
  notificationsSent: number;
  lastNotifiedAt?: string;
  createdAt: string;
  expiresAt: string;     // 30 days from creation
  convertedAppointmentId?: string;
}

// ── INTAKE TYPES ──

export interface IntakeForm {
  id: string;
  clientId: string;
  appointmentId?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  completedAt?: string;
  sections: IntakeSection[];
  consentsSigned: ConsentRecord[];
  createdAt: string;
  expiresAt: string;
}

export interface IntakeSection {
  id: string;
  title: string;
  description: string;
  fields: IntakeField[];
  isRequired: boolean;
  isComplete: boolean;
  order: number;
}

export interface IntakeField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'phone' | 'email' | 'number' | 'file' | 'signature';
  required: boolean;
  value?: string | string[] | boolean | number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  conditionalOn?: { fieldId: string; value: string | boolean };
}

export interface ConsentRecord {
  type: 'hipaa' | 'treatment' | 'photo' | 'financial' | 'communication';
  title: string;
  signedAt: string;
  signatureData?: string; // base64 signature image
  ipAddress?: string;
  version: string;
}

// ── REMINDER TYPES ──

export type ReminderChannel = 'sms' | 'email';
export type ReminderTiming = '7-day' | '2-day' | 'day-of' | 'late-arrival' | 'no-show' | 'rebooking';

export interface ReminderConfig {
  appointmentId: string;
  clientId: string;
  channels: ReminderChannel[];
  schedule: ReminderScheduleItem[];
  preInstructions: string[];
  status: 'scheduled' | 'sent' | 'confirmed' | 'rescheduled' | 'cancelled';
}

export interface ReminderScheduleItem {
  timing: ReminderTiming;
  sendAt: string;     // ISO timestamp
  channel: ReminderChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  response?: 'confirmed' | 'reschedule' | 'cancel' | null;
}

export interface RebookingNudge {
  clientId: string;
  clientName: string;
  lastServiceId: string;
  lastServiceName: string;
  lastVisitDate: string;
  suggestedRebookDate: string;
  intervalDays: number;
  daysOverdue: number;
  status: 'pending' | 'sent' | 'booked' | 'declined';
}

// ── CALENDAR TYPES ──

export type CalendarView = 'day' | 'week' | 'month';
export type CalendarColorMode = 'service' | 'provider' | 'room' | 'status';

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  start: string;       // ISO timestamp
  end: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;
  providerId: string;
  providerName: string;
  roomId: RoomId;
  roomName: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  clientName: string;
  status: AppointmentStatus;
  revenue: number;
  color: string;       // hex color for display
  isBuffer: boolean;   // prep/cleanup time block
  isDraggable: boolean;
  appointment: Appointment;
}

export interface CalendarDayData {
  date: string;
  events: CalendarEvent[];
  totalRevenue: number;
  totalAppointments: number;
  utilizationPercent: number;
  gaps: CalendarGap[];
}

export interface CalendarGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  roomId: RoomId;
  providerId: string;
  suggestedServices: string[];
  potentialRevenue: number;
}

export interface DragRescheduleData {
  appointmentId: string;
  newDate: string;
  newStartTime: string;
  newProviderId?: string;
  newRoomId?: RoomId;
}

// ── SCHEDULING CONFIG ──

export interface SchedulingConfig {
  advanceBookingDays: number;       // max 180 (6 months)
  sameDayBookingCutoff: string;     // HH:MM - latest same-day booking time
  sameDayBookingEnabled: boolean;
  emergencySlotsPerDay: number;     // default 2
  defaultPrepTime: number;          // default 5 minutes
  defaultCleanupTime: number;       // default 10 minutes
  newClientConsultRequired: string[]; // service IDs requiring consult
  clinicHours: WeeklySchedule;
  holidays: Holiday[];
  rooms: Room[];
}

// ── SERVICE COLORS (for calendar) ──

export const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  'laser-hair-removal': '#8B5CF6', // purple
  'facial': '#3B82F6',             // blue
  'chemical-peel': '#F59E0B',      // amber
  'rf-microneedling': '#EF4444',   // red
  'skin-tightening': '#EC4899',    // pink
  'scar-reduction': '#F97316',     // orange
  'laser': '#6366F1',              // indigo
  'injectables': '#14B8A6',        // teal
  'wellness': '#22C55E',           // green
  'weight-management': '#06B6D4',  // cyan
  'consultation': '#64748B',       // slate
};

export const PROVIDER_COLORS: Record<string, string> = {
  'dr-landfield': '#C9A96E',  // gold
  'raj': '#8B5CF6',           // purple
};

export const ROOM_COLORS: Record<RoomId, string> = {
  halo: '#3B82F6',  // blue
  aura: '#EC4899',  // pink
  glow: '#22C55E',  // green
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  'checked-in': '#8B5CF6',
  'in-progress': '#14B8A6',
  completed: '#22C55E',
  cancelled: '#94A3B8',
  'no-show': '#EF4444',
  rescheduled: '#F97316',
};
