/**
 * RaniOS Tenant Dashboard — Scheduling Module
 *
 * Calendar views, provider schedules, room management, no-show prediction,
 * schedule optimization, waitlist, and availability rules.
 * All queries scoped to tenant via TenantDatabaseClient.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'month';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface CalendarEvent {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientId?: string;
  service: string;
  provider: string;
  room?: string;
  start: string;          // ISO datetime
  end: string;            // ISO datetime
  duration: number;       // minutes
  status: AppointmentStatus;
  amount: number;
  notes?: string;
  noShowRisk: number;     // 0–100
  isNewClient: boolean;
  color: string;          // hex color for calendar display
}

export interface CalendarData {
  events: CalendarEvent[];
  view: CalendarView;
  startDate: string;
  endDate: string;
  providers: string[];
  totalRevenuePotential: number;
  utilizationRate: number;
}

export interface ProviderSchedule {
  provider: string;
  date: string;
  events: CalendarEvent[];
  availableSlots: TimeSlot[];
  totalBooked: number;     // minutes
  totalAvailable: number;  // minutes
  utilization: number;     // 0–100
  revenue: number;
  nextAvailable: string;   // ISO datetime
}

export interface TimeSlot {
  start: string;
  end: string;
  duration: number;
  type: 'available' | 'booked' | 'blocked' | 'break' | 'buffer';
}

// ─── Room Management ────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  type: 'treatment' | 'consultation' | 'laser' | 'injectable' | 'general';
  equipment: string[];
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
}

export interface RoomSchedule {
  room: Room;
  date: string;
  events: CalendarEvent[];
  utilization: number;
  gaps: ScheduleGap[];
}

export interface ScheduleGap {
  start: string;
  end: string;
  duration: number;
  suggestedServices: string[];
  revenuePotential: number;
}

// ─── No-Show Prediction ─────────────────────────────────────────────────────

export interface NoShowPrediction {
  appointmentId: string;
  clientName: string;
  service: string;
  scheduledTime: string;
  riskScore: number;      // 0–100
  riskLevel: 'low' | 'moderate' | 'high';
  factors: NoShowFactor[];
  recommendation: string;
}

export interface NoShowFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

// ─── Schedule Optimization ──────────────────────────────────────────────────

export interface ScheduleOptimization {
  date: string;
  score: number;          // 0–100 efficiency score
  gaps: OptimizationGap[];
  conflicts: ScheduleConflict[];
  providerBalance: ProviderBalance[];
  opportunities: RevenueOpportunity[];
  suggestions: OptimizationSuggestion[];
}

export interface OptimizationGap {
  provider: string;
  start: string;
  end: string;
  duration: number;
  suggestedService: string;
  revenuePotential: number;
}

export interface ScheduleConflict {
  type: 'double_booking' | 'room_conflict' | 'equipment_conflict' | 'insufficient_buffer' | 'overtime';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  events: string[];       // event IDs
  resolution: string;
}

export interface ProviderBalance {
  provider: string;
  booked: number;         // minutes
  available: number;      // minutes
  utilization: number;    // 0–100
  status: 'underloaded' | 'balanced' | 'overloaded';
}

export interface RevenueOpportunity {
  type: 'upgrade' | 'addon' | 'reschedule' | 'fill_gap' | 'waitlist';
  description: string;
  revenuePotential: number;
  effort: 'low' | 'medium' | 'high';
}

export interface OptimizationSuggestion {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  automated: boolean;
}

// ─── Waitlist ───────────────────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  preferredProvider?: string;
  preferredDays: string[];
  preferredTimeRange: { start: string; end: string };
  addedAt: string;
  status: 'waiting' | 'offered' | 'booked' | 'expired';
  priority: number;       // 1 = highest
  notifyVia: 'sms' | 'email' | 'both';
}

export interface WaitlistSummary {
  entries: WaitlistEntry[];
  totalWaiting: number;
  avgWaitDays: number;
  matchedSlots: WaitlistMatch[];
}

export interface WaitlistMatch {
  waitlistEntryId: string;
  clientName: string;
  availableSlot: TimeSlot;
  provider: string;
  matchScore: number;     // 0–100
}

// ─── Availability Rules ─────────────────────────────────────────────────────

export interface AvailabilityRule {
  id: string;
  provider: string;
  type: 'recurring' | 'override' | 'block';
  dayOfWeek?: number;     // 0–6 (Sunday–Saturday)
  date?: string;          // For overrides/blocks
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  reason?: string;
  effective: boolean;
}

// ─── Calendar Data ──────────────────────────────────────────────────────────

export async function getCalendarData(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  view: CalendarView,
  date: string,
  provider?: string
): Promise<CalendarData> {
  const { startDate, endDate } = getDateRange(view, date);

  const formulaParts = [
    `IS_AFTER({Start Time}, '${startDate}')`,
    `IS_BEFORE({Start Time}, '${endDate}')`,
  ];
  if (provider) {
    formulaParts.push(`{Provider} = '${provider}'`);
  }

  const appointments = await db.fetchAll<{
    'Client Name': string;
    'Client Email': string;
    Service: string;
    Provider: string;
    Room: string;
    'Start Time': string;
    'End Time': string;
    Duration: number;
    Status: string;
    Amount: number;
    Notes: string;
    'Is New Client': boolean;
  }>('Appointments', {
    filterByFormula: `AND(${formulaParts.join(', ')})`,
    sort: [{ field: 'Start Time', direction: 'asc' }],
    fields: [
      'Client Name', 'Client Email', 'Service', 'Provider', 'Room',
      'Start Time', 'End Time', 'Duration', 'Status', 'Amount', 'Notes', 'Is New Client',
    ],
  });

  const providerColors: Record<string, string> = {};
  const colorPalette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  let colorIdx = 0;

  const events: CalendarEvent[] = appointments.map(a => {
    const providerName = a.fields.Provider || 'Unassigned';
    if (!providerColors[providerName]) {
      providerColors[providerName] = colorPalette[colorIdx % colorPalette.length];
      colorIdx++;
    }

    const duration = a.fields.Duration || 30;
    const start = a.fields['Start Time'] || '';
    const end = a.fields['End Time'] || (start ? new Date(new Date(start).getTime() + duration * 60000).toISOString() : '');

    return {
      id: a.id,
      title: `${a.fields.Service || 'Appointment'} - ${a.fields['Client Name'] || 'Unknown'}`,
      clientName: a.fields['Client Name'] || '',
      clientEmail: a.fields['Client Email'] || '',
      service: a.fields.Service || '',
      provider: providerName,
      room: a.fields.Room || undefined,
      start,
      end,
      duration,
      status: mapAppointmentStatus(a.fields.Status),
      amount: a.fields.Amount || 0,
      notes: a.fields.Notes || undefined,
      noShowRisk: computeBasicNoShowRisk(a.fields.Status, a.fields['Is New Client']),
      isNewClient: a.fields['Is New Client'] || false,
      color: providerColors[providerName],
    };
  });

  const providers = [...new Set(events.map(e => e.provider))];
  const totalRevenuePotential = events.reduce((s, e) => s + e.amount, 0);

  // Simple utilization: booked minutes / available minutes
  const totalBookedMinutes = events
    .filter(e => e.status !== 'cancelled')
    .reduce((s, e) => s + e.duration, 0);
  const daysInRange = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ));
  const availableMinutesPerDay = 8 * 60 * Math.max(1, providers.length);
  const utilizationRate = Math.min(100, Math.round(
    (totalBookedMinutes / (daysInRange * availableMinutesPerDay)) * 100
  ));

  return {
    events,
    view,
    startDate,
    endDate,
    providers,
    totalRevenuePotential,
    utilizationRate,
  };
}

// ─── Provider Schedule ──────────────────────────────────────────────────────

export async function getProviderSchedule(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  provider: string,
  date: string
): Promise<ProviderSchedule> {
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const calendarData = await getCalendarData(db, tenant, 'day', date, provider);
  const events = calendarData.events;

  // Generate available slots (assuming 9am-5pm working hours)
  const workStart = 9 * 60; // minutes from midnight
  const workEnd = 17 * 60;
  const bookedSlots = events
    .filter(e => e.status !== 'cancelled')
    .map(e => ({
      start: getMinutesFromMidnight(e.start),
      end: getMinutesFromMidnight(e.end),
    }))
    .sort((a, b) => a.start - b.start);

  const availableSlots: TimeSlot[] = [];
  let cursor = workStart;

  for (const booked of bookedSlots) {
    if (cursor < booked.start) {
      availableSlots.push({
        start: minutesToISOTime(date, cursor),
        end: minutesToISOTime(date, booked.start),
        duration: booked.start - cursor,
        type: 'available',
      });
    }
    cursor = Math.max(cursor, booked.end);
  }

  if (cursor < workEnd) {
    availableSlots.push({
      start: minutesToISOTime(date, cursor),
      end: minutesToISOTime(date, workEnd),
      duration: workEnd - cursor,
      type: 'available',
    });
  }

  const totalBooked = events
    .filter(e => e.status !== 'cancelled')
    .reduce((s, e) => s + e.duration, 0);
  const totalAvailable = workEnd - workStart;

  return {
    provider,
    date,
    events,
    availableSlots,
    totalBooked,
    totalAvailable,
    utilization: Math.round((totalBooked / totalAvailable) * 100),
    revenue: events.reduce((s, e) => s + e.amount, 0),
    nextAvailable: availableSlots[0]?.start || dayEnd,
  };
}

// ─── Room Management ────────────────────────────────────────────────────────

export async function getRoomSchedules(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  date: string
): Promise<RoomSchedule[]> {
  const calendarData = await getCalendarData(db, tenant, 'day', date);

  // Group events by room
  const roomMap = new Map<string, CalendarEvent[]>();
  for (const event of calendarData.events) {
    const room = event.room || 'Unassigned';
    const existing = roomMap.get(room) || [];
    existing.push(event);
    roomMap.set(room, existing);
  }

  const defaultRooms: Room[] = [
    { id: 'r1', name: 'Treatment Room 1', type: 'treatment', equipment: ['Laser', 'RF Device'], capacity: 1, status: 'available' },
    { id: 'r2', name: 'Treatment Room 2', type: 'injectable', equipment: ['Injectable Station'], capacity: 1, status: 'available' },
    { id: 'r3', name: 'Consultation Room', type: 'consultation', equipment: [], capacity: 2, status: 'available' },
    { id: 'r4', name: 'Laser Suite', type: 'laser', equipment: ['PicoWay', 'Sofwave'], capacity: 1, status: 'available' },
  ];

  return defaultRooms.map(room => {
    const events = roomMap.get(room.name) || [];
    const totalBooked = events.reduce((s, e) => s + e.duration, 0);
    const totalAvailable = 8 * 60;

    // Find gaps
    const gaps: ScheduleGap[] = findGaps(events, date).map(g => ({
      ...g,
      suggestedServices: getSuggestedServicesForRoom(room.type),
      revenuePotential: Math.round(g.duration / 30) * 150,
    }));

    return {
      room: {
        ...room,
        status: events.some(e => {
          const now = new Date();
          return new Date(e.start) <= now && new Date(e.end) >= now;
        }) ? 'occupied' as const : 'available' as const,
      },
      date,
      events,
      utilization: Math.round((totalBooked / totalAvailable) * 100),
      gaps,
    };
  });
}

// ─── No-Show Predictions ────────────────────────────────────────────────────

export async function getNoShowPredictions(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  date?: string
): Promise<NoShowPrediction[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dayStart = `${targetDate}T00:00:00.000Z`;
  const dayEnd = `${targetDate}T23:59:59.999Z`;

  const appointments = await db.fetchAll<{
    'Client Name': string;
    'Client Email': string;
    Service: string;
    'Start Time': string;
    Status: string;
    'Has Deposit': boolean;
    'Is New Client': boolean;
    'Booking Lead Days': number;
    'Has Membership': boolean;
    'Previous No Shows': number;
  }>('Appointments', {
    filterByFormula: `AND(IS_AFTER({Start Time}, '${dayStart}'), IS_BEFORE({Start Time}, '${dayEnd}'), {Status} = 'Scheduled')`,
    fields: [
      'Client Name', 'Client Email', 'Service', 'Start Time', 'Status',
      'Has Deposit', 'Is New Client', 'Booking Lead Days', 'Has Membership', 'Previous No Shows',
    ],
  });

  return appointments.map(a => {
    const factors: NoShowFactor[] = [];

    // History (35%)
    const prevNoShows = a.fields['Previous No Shows'] || 0;
    const historyScore = prevNoShows >= 3 ? 90 : prevNoShows >= 2 ? 70 : prevNoShows === 1 ? 40 : 5;
    factors.push({ name: 'History', score: historyScore, weight: 35, detail: `${prevNoShows} previous no-shows` });

    // Deposit (20%)
    const depositScore = a.fields['Has Deposit'] ? 10 : 60;
    factors.push({ name: 'Deposit', score: depositScore, weight: 20, detail: a.fields['Has Deposit'] ? 'Deposit paid' : 'No deposit' });

    // Lead time (15%)
    const leadDays = a.fields['Booking Lead Days'] || 7;
    const leadScore = leadDays > 30 ? 70 : leadDays > 14 ? 40 : leadDays > 3 ? 20 : 10;
    factors.push({ name: 'Lead Time', score: leadScore, weight: 15, detail: `Booked ${leadDays}d ago` });

    // Membership (10%)
    const memScore = a.fields['Has Membership'] ? 10 : 45;
    factors.push({ name: 'Membership', score: memScore, weight: 10, detail: a.fields['Has Membership'] ? 'Active member' : 'Non-member' });

    // New client (10%)
    const newScore = a.fields['Is New Client'] ? 50 : 15;
    factors.push({ name: 'New Client', score: newScore, weight: 10, detail: a.fields['Is New Client'] ? 'First visit' : 'Returning' });

    // Time of day (10%)
    const hour = new Date(a.fields['Start Time']).getHours();
    const timeScore = hour >= 16 ? 45 : hour <= 9 ? 35 : 15;
    factors.push({ name: 'Time of Day', score: timeScore, weight: 10, detail: `${hour}:00 appointment` });

    const total = Math.round(factors.reduce((s, f) => s + f.score * (f.weight / 100), 0));
    const riskLevel: NoShowPrediction['riskLevel'] = total >= 60 ? 'high' : total >= 30 ? 'moderate' : 'low';

    const recommendations: Record<string, string> = {
      high: 'Send confirmation reminder. Consider requiring deposit or calling to confirm.',
      moderate: 'Send standard reminder 24h and 2h before appointment.',
      low: 'No action needed. Standard reminder sufficient.',
    };

    return {
      appointmentId: a.id,
      clientName: a.fields['Client Name'] || '',
      service: a.fields.Service || '',
      scheduledTime: a.fields['Start Time'] || '',
      riskScore: total,
      riskLevel,
      factors,
      recommendation: recommendations[riskLevel],
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

// ─── Schedule Optimization ──────────────────────────────────────────────────

export async function getScheduleOptimization(
  db: TenantDatabaseClient,
  tenant: TenantConfig,
  date?: string
): Promise<ScheduleOptimization> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const calendarData = await getCalendarData(db, tenant, 'day', targetDate);
  const events = calendarData.events;

  // Find gaps per provider
  const providerEvents = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = providerEvents.get(event.provider) || [];
    existing.push(event);
    providerEvents.set(event.provider, existing);
  }

  const gaps: OptimizationGap[] = [];
  const providerBalance: ProviderBalance[] = [];

  for (const [provider, provEvents] of providerEvents) {
    const provGaps = findGaps(provEvents, targetDate);
    for (const gap of provGaps) {
      if (gap.duration >= 30) {
        gaps.push({
          provider,
          start: gap.start,
          end: gap.end,
          duration: gap.duration,
          suggestedService: gap.duration >= 60 ? 'HydraFacial' : 'Express Treatment',
          revenuePotential: Math.round(gap.duration / 30) * 150,
        });
      }
    }

    const totalBooked = provEvents.reduce((s, e) => s + e.duration, 0);
    const totalAvailable = 8 * 60;
    const utilization = Math.round((totalBooked / totalAvailable) * 100);

    providerBalance.push({
      provider,
      booked: totalBooked,
      available: totalAvailable,
      utilization,
      status: utilization >= 85 ? 'overloaded' : utilization >= 50 ? 'balanced' : 'underloaded',
    });
  }

  // Detect conflicts
  const conflicts: ScheduleConflict[] = [];
  const allEvents = events.filter(e => e.status !== 'cancelled');
  for (let i = 0; i < allEvents.length; i++) {
    for (let j = i + 1; j < allEvents.length; j++) {
      const a = allEvents[i];
      const b = allEvents[j];
      if (a.provider === b.provider && eventsOverlap(a, b)) {
        conflicts.push({
          type: 'double_booking',
          severity: 'critical',
          description: `${a.provider} double-booked: ${a.service} and ${b.service}`,
          events: [a.id, b.id],
          resolution: 'Reschedule one appointment to an available slot',
        });
      }
      if (a.room && b.room && a.room === b.room && eventsOverlap(a, b)) {
        conflicts.push({
          type: 'room_conflict',
          severity: 'warning',
          description: `Room ${a.room} double-booked`,
          events: [a.id, b.id],
          resolution: 'Move one appointment to a different room',
        });
      }
    }
  }

  // Revenue opportunities
  const opportunities: RevenueOpportunity[] = [];
  if (gaps.length > 0) {
    const totalGapRevenue = gaps.reduce((s, g) => s + g.revenuePotential, 0);
    opportunities.push({
      type: 'fill_gap',
      description: `${gaps.length} schedule gaps could generate $${totalGapRevenue}`,
      revenuePotential: totalGapRevenue,
      effort: 'medium',
    });
  }

  // Suggestions
  const suggestions: OptimizationSuggestion[] = [];
  if (conflicts.length > 0) {
    suggestions.push({
      priority: 'high',
      action: `Resolve ${conflicts.length} scheduling conflict(s)`,
      impact: 'Prevents service disruption',
      automated: false,
    });
  }
  if (gaps.length > 2) {
    suggestions.push({
      priority: 'medium',
      action: 'Contact waitlist clients to fill schedule gaps',
      impact: `Potential $${gaps.reduce((s, g) => s + g.revenuePotential, 0)} revenue`,
      automated: true,
    });
  }

  const score = Math.round(
    Math.max(0, 100 - conflicts.length * 20 - gaps.length * 5)
  );

  return {
    date: targetDate,
    score,
    gaps,
    conflicts,
    providerBalance,
    opportunities,
    suggestions,
  };
}

// ─── Waitlist ───────────────────────────────────────────────────────────────

export async function getWaitlist(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<WaitlistSummary> {
  // Waitlist would typically be a separate Airtable table
  // For now, return a structured empty result
  return {
    entries: [],
    totalWaiting: 0,
    avgWaitDays: 0,
    matchedSlots: [],
  };
}

export async function addToWaitlist(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  entry: Omit<WaitlistEntry, 'id' | 'addedAt' | 'status' | 'priority'>
): Promise<string> {
  // Would create a record in a Waitlist table
  const id = await db.createRecord('Waitlist', {
    'Client Name': entry.clientName,
    'Client Email': entry.clientEmail,
    'Service': entry.service,
    'Preferred Provider': entry.preferredProvider || '',
    'Preferred Days': entry.preferredDays.join(','),
    'Status': 'waiting',
    'Added At': new Date().toISOString(),
  });
  return id;
}

// ─── Availability Rules ─────────────────────────────────────────────────────

export async function getAvailabilityRules(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  provider?: string
): Promise<AvailabilityRule[]> {
  // Default availability rules - would be stored in tenant config or Airtable
  const defaultRules: AvailabilityRule[] = [
    { id: 'ar1', provider: 'All', type: 'recurring', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', effective: true },
    { id: 'ar2', provider: 'All', type: 'recurring', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', effective: true },
    { id: 'ar3', provider: 'All', type: 'recurring', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', effective: true },
    { id: 'ar4', provider: 'All', type: 'recurring', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', effective: true },
    { id: 'ar5', provider: 'All', type: 'recurring', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', effective: true },
    { id: 'ar6', provider: 'All', type: 'recurring', dayOfWeek: 6, startTime: '10:00', endTime: '14:00', effective: true },
  ];

  if (provider) {
    return defaultRules.filter(r => r.provider === 'All' || r.provider === provider);
  }
  return defaultRules;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateRange(view: CalendarView, date: string): { startDate: string; endDate: string } {
  const d = new Date(date);
  switch (view) {
    case 'day':
      return {
        startDate: `${date}T00:00:00.000Z`,
        endDate: `${date}T23:59:59.999Z`,
      };
    case 'week': {
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: monday.toISOString().split('T')[0] + 'T00:00:00.000Z',
        endDate: sunday.toISOString().split('T')[0] + 'T23:59:59.999Z',
      };
    }
    case 'month': {
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return {
        startDate: firstDay.toISOString().split('T')[0] + 'T00:00:00.000Z',
        endDate: lastDay.toISOString().split('T')[0] + 'T23:59:59.999Z',
      };
    }
  }
}

function mapAppointmentStatus(raw: string): AppointmentStatus {
  const lower = (raw || '').toLowerCase().replace(/[^a-z_]/g, '_');
  const map: Record<string, AppointmentStatus> = {
    scheduled: 'scheduled',
    confirmed: 'confirmed',
    checked_in: 'checked_in',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    no_show: 'no_show',
    'no show': 'no_show',
  };
  return map[lower] || 'scheduled';
}

function computeBasicNoShowRisk(status: string, isNewClient?: boolean): number {
  if (status === 'Completed' || status === 'Checked In') return 0;
  if (status === 'Confirmed') return isNewClient ? 15 : 5;
  return isNewClient ? 30 : 15;
}

function getMinutesFromMidnight(isoTime: string): number {
  const d = new Date(isoTime);
  return d.getHours() * 60 + d.getMinutes();
}

function minutesToISOTime(date: string, minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${date}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000Z`;
}

function findGaps(events: CalendarEvent[], date: string): ScheduleGap[] {
  const workStart = 9 * 60;
  const workEnd = 17 * 60;
  const sorted = events
    .filter(e => e.status !== 'cancelled')
    .map(e => ({ start: getMinutesFromMidnight(e.start), end: getMinutesFromMidnight(e.end) }))
    .sort((a, b) => a.start - b.start);

  const gaps: ScheduleGap[] = [];
  let cursor = workStart;

  for (const slot of sorted) {
    if (cursor < slot.start && slot.start - cursor >= 15) {
      gaps.push({
        start: minutesToISOTime(date, cursor),
        end: minutesToISOTime(date, slot.start),
        duration: slot.start - cursor,
        suggestedServices: [],
        revenuePotential: 0,
      });
    }
    cursor = Math.max(cursor, slot.end);
  }

  if (cursor < workEnd && workEnd - cursor >= 15) {
    gaps.push({
      start: minutesToISOTime(date, cursor),
      end: minutesToISOTime(date, workEnd),
      duration: workEnd - cursor,
      suggestedServices: [],
      revenuePotential: 0,
    });
  }

  return gaps;
}

function getSuggestedServicesForRoom(roomType: string): string[] {
  const suggestions: Record<string, string[]> = {
    treatment: ['HydraFacial', 'VI Peel', 'RF Microneedling'],
    consultation: ['Consultation', 'Treatment Planning'],
    laser: ['PicoWay', 'Laser Hair Removal', 'Sofwave'],
    injectable: ['Botox', 'Dermal Fillers'],
    general: ['Express Treatment', 'Consultation'],
  };
  return suggestions[roomType] || suggestions.general;
}

function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}
