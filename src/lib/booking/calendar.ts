/**
 * Calendar Management System
 *
 * Features:
 * - Day/week/month views (data structures for Recharts rendering)
 * - Color coding by service type, provider, room
 * - Drag-and-drop rescheduling data structure
 * - Multi-provider view
 * - Room utilization view
 * - Revenue overlay (revenue per hour by slot)
 * - Gap detection and fill suggestions
 * - Print-friendly daily schedule
 */

import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, getHours, getMinutes } from 'date-fns';
import type {
  Appointment,
  AppointmentStatus,
  BookableService,
  CalendarColorMode,
  CalendarDayData,
  CalendarEvent,
  CalendarGap,
  CalendarView,
  DragRescheduleData,
  ProviderSchedule,
  Room,
  RoomId,
  SERVICE_CATEGORY_COLORS,
  PROVIDER_COLORS,
  ROOM_COLORS,
  STATUS_COLORS,
} from './types';
import {
  SERVICE_CATEGORY_COLORS as SVC_COLORS,
  PROVIDER_COLORS as PROV_COLORS,
  ROOM_COLORS as RM_COLORS,
  STATUS_COLORS as STAT_COLORS,
} from './types';
import { AvailabilityEngine, minutesBetween, addMinutesToTime } from './availability';

// ── CALENDAR DATA BUILDER ──

export class CalendarManager {
  private engine: AvailabilityEngine;
  private services: Map<string, BookableService>;

  constructor(engine: AvailabilityEngine, services: BookableService[]) {
    this.engine = engine;
    this.services = new Map(services.map(s => [s.id, s]));
  }

  // ── VIEW GENERATORS ──

  /**
   * Get data for day view
   */
  getDayView(dateStr: string, colorMode: CalendarColorMode = 'service'): CalendarDayData {
    const appointments = this.engine.getAppointmentsForDate(dateStr)
      .filter(a => a.status !== 'cancelled');

    const events = appointments.map(a => this.appointmentToEvent(a, colorMode));
    const gaps = this.findGapsForDay(dateStr);
    const totalRevenue = appointments.reduce((sum, a) => sum + a.estimatedRevenue, 0);

    return {
      date: dateStr,
      events: events.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      totalRevenue,
      totalAppointments: appointments.length,
      utilizationPercent: this.calculateDayUtilization(dateStr, appointments),
      gaps,
    };
  }

  /**
   * Get data for week view
   */
  getWeekView(dateStr: string, colorMode: CalendarColorMode = 'service'): CalendarDayData[] {
    const date = parseISO(dateStr);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map(d => this.getDayView(format(d, 'yyyy-MM-dd'), colorMode));
  }

  /**
   * Get data for month view
   */
  getMonthView(dateStr: string, colorMode: CalendarColorMode = 'service'): CalendarDayData[] {
    const date = parseISO(dateStr);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(d => this.getDayView(format(d, 'yyyy-MM-dd'), colorMode));
  }

  // ── PROVIDER VIEW ──

  /**
   * Get multi-provider view for a day (side-by-side columns)
   */
  getProviderView(dateStr: string): ProviderDayView[] {
    const providers = this.engine.getProviders();

    return providers.map(provider => {
      const appointments = this.engine.getAppointmentsForProvider(provider.providerId, dateStr)
        .filter(a => a.status !== 'cancelled');

      const events = appointments.map(a => this.appointmentToEvent(a, 'service'));
      const hours = this.engine.getProviderHours(provider, dateStr);

      return {
        providerId: provider.providerId,
        providerName: provider.providerName,
        role: provider.role,
        workingHours: hours,
        lunchBreak: provider.lunchBreak,
        events: events.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        appointmentCount: appointments.length,
        totalRevenue: appointments.reduce((sum, a) => sum + a.estimatedRevenue, 0),
        totalMinutesBooked: appointments.reduce((sum, a) => sum + a.duration, 0),
      };
    });
  }

  // ── ROOM UTILIZATION VIEW ──

  /**
   * Get room utilization for a day
   */
  getRoomView(dateStr: string): RoomDayView[] {
    const rooms = this.engine.getRooms();

    return rooms.map(room => {
      const appointments = this.engine.getAppointmentsForRoom(room.id, dateStr)
        .filter(a => a.status !== 'cancelled');

      const events = appointments.map(a => this.appointmentToEvent(a, 'provider'));
      const totalMinutesBooked = appointments.reduce((sum, a) => {
        const svc = this.services.get(a.serviceId);
        return sum + a.duration + (svc?.prepTime ?? 5) + (svc?.cleanupTime ?? 10);
        }, 0);

      // Assume rooms are available during clinic hours (9-18 = 540 min)
      const totalAvailableMinutes = 540;
      const utilizationPercent = Math.round((totalMinutesBooked / totalAvailableMinutes) * 100);

      return {
        roomId: room.id,
        roomName: room.name,
        events: events.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        appointmentCount: appointments.length,
        totalMinutesBooked,
        utilizationPercent,
        totalRevenue: appointments.reduce((sum, a) => sum + a.estimatedRevenue, 0),
      };
    });
  }

  // ── REVENUE OVERLAY ──

  /**
   * Get hourly revenue data for chart overlay
   */
  getRevenueOverlay(dateStr: string): HourlyRevenue[] {
    const appointments = this.engine.getAppointmentsForDate(dateStr)
      .filter(a => a.status !== 'cancelled' && a.status !== 'no-show');

    const hourlyData: HourlyRevenue[] = [];

    for (let hour = 8; hour <= 18; hour++) {
      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;

      // Find appointments that overlap with this hour
      const overlapping = appointments.filter(a => {
        return a.startTime < nextHourStr && a.endTime > timeStr;
      });

      const revenue = overlapping.reduce((sum, a) => {
        // Prorate revenue across hours
        const aptMinutesInHour = Math.min(
          minutesBetween(
            a.startTime > timeStr ? a.startTime : timeStr,
            a.endTime < nextHourStr ? a.endTime : nextHourStr,
          ),
          60
        );
        return sum + (a.estimatedRevenue * aptMinutesInHour / a.duration);
      }, 0);

      hourlyData.push({
        hour: `${hour}:00`,
        revenue: Math.round(revenue),
        appointmentCount: overlapping.length,
        isPeakHour: hour >= 10 && hour <= 11 || hour >= 14 && hour <= 17,
      });
    }

    return hourlyData;
  }

  // ── DRAG-AND-DROP SUPPORT ──

  /**
   * Validate a drag-and-drop reschedule
   */
  validateReschedule(data: DragRescheduleData): {
    valid: boolean;
    error?: string;
    conflicts?: string[];
  } {
    const appointment = this.engine.getAllAppointments().find(a => a.id === data.appointmentId);
    if (!appointment) return { valid: false, error: 'Appointment not found' };

    const service = this.services.get(appointment.serviceId);
    if (!service) return { valid: false, error: 'Service not found' };

    const providerId = data.newProviderId ?? appointment.providerId;
    const roomId = data.newRoomId ?? appointment.roomId;

    // Check provider qualification
    const provider = this.engine.getProviders().find(p => p.providerId === providerId);
    if (!provider?.qualifiedServices.includes(appointment.serviceId)) {
      return { valid: false, error: `Provider cannot perform ${appointment.serviceName}` };
    }

    // Check room compatibility
    if (service.requiredRooms.length > 0 && !service.requiredRooms.includes(roomId)) {
      return { valid: false, error: `${roomId} room is not compatible with ${appointment.serviceName}` };
    }

    // Check availability
    const endTime = addMinutesToTime(data.newStartTime, service.duration);
    const isRoomFree = this.engine.isRoomAvailable(roomId, data.newDate, data.newStartTime, endTime);
    if (!isRoomFree) {
      return { valid: false, error: `Room ${roomId} is not available at that time` };
    }

    return { valid: true };
  }

  // ── PRINT-FRIENDLY SCHEDULE ──

  /**
   * Generate print-friendly daily schedule data
   */
  getPrintSchedule(dateStr: string): PrintSchedule {
    const dayData = this.getDayView(dateStr);
    const providerViews = this.getProviderView(dateStr);
    const roomViews = this.getRoomView(dateStr);

    return {
      date: dateStr,
      formattedDate: format(parseISO(dateStr), 'EEEE, MMMM d, yyyy'),
      clinicName: 'Rani Beauty Clinic',
      summary: {
        totalAppointments: dayData.totalAppointments,
        totalRevenue: dayData.totalRevenue,
        utilizationPercent: dayData.utilizationPercent,
      },
      providers: providerViews.map(pv => ({
        name: pv.providerName,
        appointments: pv.events.map(e => ({
          time: `${e.startTime} - ${e.endTime}`,
          client: e.clientName,
          service: e.serviceName,
          room: e.roomName,
          status: e.status,
          revenue: e.revenue,
        })),
      })),
      rooms: roomViews.map(rv => ({
        name: rv.roomName,
        utilizationPercent: rv.utilizationPercent,
        appointments: rv.events.length,
      })),
    };
  }

  // ── GAP DETECTION ──

  private findGapsForDay(dateStr: string): CalendarGap[] {
    const gaps: CalendarGap[] = [];
    const rooms = this.engine.getRooms();

    for (const room of rooms) {
      const roomApts = this.engine.getAppointmentsForRoom(room.id, dateStr)
        .filter(a => a.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (roomApts.length === 0) continue;

      // Check gaps between appointments
      for (let i = 0; i < roomApts.length - 1; i++) {
        const current = roomApts[i];
        const next = roomApts[i + 1];
        const svc = this.services.get(current.serviceId);
        const gapStart = addMinutesToTime(current.endTime, svc?.cleanupTime ?? 10);
        const gapMinutes = minutesBetween(gapStart, next.startTime);

        if (gapMinutes >= 30) {
          // Find services that could fit
          const suggestedServices = this.findFittingServices(gapMinutes, room.id);

          gaps.push({
            startTime: gapStart,
            endTime: next.startTime,
            durationMinutes: gapMinutes,
            roomId: room.id,
            providerId: current.providerId,
            suggestedServices,
            potentialRevenue: suggestedServices[0]
              ? this.services.get(suggestedServices[0])?.price ?? 0
              : 0,
          });
        }
      }
    }

    return gaps;
  }

  private findFittingServices(gapMinutes: number, roomId: RoomId): string[] {
    const room = this.engine.getRooms().find(r => r.id === roomId);
    if (!room) return [];

    return Array.from(this.services.entries())
      .filter(([id, svc]) => {
        const totalNeeded = svc.duration + svc.prepTime + svc.cleanupTime;
        return totalNeeded <= gapMinutes && room.compatibleServices.includes(id);
      })
      .sort((a, b) => b[1].price - a[1].price) // highest revenue first
      .slice(0, 3)
      .map(([id]) => id);
  }

  // ── EVENT CONVERTER ──

  private appointmentToEvent(appointment: Appointment, colorMode: CalendarColorMode): CalendarEvent {
    const service = this.services.get(appointment.serviceId);
    const color = this.getEventColor(appointment, colorMode);

    return {
      id: appointment.id,
      title: appointment.serviceName,
      subtitle: appointment.clientName,
      start: `${appointment.date}T${appointment.startTime}`,
      end: `${appointment.date}T${appointment.endTime}`,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      providerId: appointment.providerId,
      providerName: appointment.providerName,
      roomId: appointment.roomId,
      roomName: appointment.roomId.charAt(0).toUpperCase() + appointment.roomId.slice(1),
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      serviceCategory: service?.category ?? 'unknown',
      clientName: appointment.clientName,
      status: appointment.status,
      revenue: appointment.estimatedRevenue,
      color,
      isBuffer: false,
      isDraggable: appointment.status === 'confirmed' || appointment.status === 'pending',
      appointment,
    };
  }

  private getEventColor(appointment: Appointment, mode: CalendarColorMode): string {
    switch (mode) {
      case 'service': {
        const service = this.services.get(appointment.serviceId);
        return SVC_COLORS[service?.category ?? ''] ?? '#64748B';
      }
      case 'provider':
        return PROV_COLORS[appointment.providerId] ?? '#64748B';
      case 'room':
        return RM_COLORS[appointment.roomId] ?? '#64748B';
      case 'status':
        return STAT_COLORS[appointment.status] ?? '#64748B';
      default:
        return '#64748B';
    }
  }

  private calculateDayUtilization(dateStr: string, appointments: Appointment[]): number {
    const providers = this.engine.getProviders();
    let totalAvailable = 0;
    let totalBooked = 0;

    for (const provider of providers) {
      const hours = this.engine.getProviderHours(provider, dateStr);
      if (!hours) continue;

      const available = minutesBetween(hours.start, hours.end) - minutesBetween(provider.lunchBreak.start, provider.lunchBreak.end);
      totalAvailable += available;

      const providerApts = appointments.filter(a => a.providerId === provider.providerId);
      const booked = providerApts.reduce((sum, a) => sum + a.duration, 0);
      totalBooked += booked;
    }

    return totalAvailable > 0 ? Math.round((totalBooked / totalAvailable) * 100) : 0;
  }
}

// ── VIEW TYPES ──

export interface ProviderDayView {
  providerId: string;
  providerName: string;
  role: string;
  workingHours: { start: string; end: string } | null;
  lunchBreak: { start: string; end: string };
  events: CalendarEvent[];
  appointmentCount: number;
  totalRevenue: number;
  totalMinutesBooked: number;
}

export interface RoomDayView {
  roomId: RoomId;
  roomName: string;
  events: CalendarEvent[];
  appointmentCount: number;
  totalMinutesBooked: number;
  utilizationPercent: number;
  totalRevenue: number;
}

export interface HourlyRevenue {
  hour: string;
  revenue: number;
  appointmentCount: number;
  isPeakHour: boolean;
}

export interface PrintSchedule {
  date: string;
  formattedDate: string;
  clinicName: string;
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    utilizationPercent: number;
  };
  providers: {
    name: string;
    appointments: {
      time: string;
      client: string;
      service: string;
      room: string;
      status: AppointmentStatus;
      revenue: number;
    }[];
  }[];
  rooms: {
    name: string;
    utilizationPercent: number;
    appointments: number;
  }[];
}

// ── RECHARTS DATA FORMATTERS ──

/**
 * Format calendar data for Recharts bar chart (revenue by hour)
 */
export function formatRevenueChartData(hourlyRevenue: HourlyRevenue[]): {
  name: string;
  revenue: number;
  appointments: number;
  fill: string;
}[] {
  return hourlyRevenue.map(hr => ({
    name: hr.hour,
    revenue: hr.revenue,
    appointments: hr.appointmentCount,
    fill: hr.isPeakHour ? '#C9A96E' : '#0F1D2C',
  }));
}

/**
 * Format room utilization for Recharts pie chart
 */
export function formatRoomUtilizationChart(rooms: RoomDayView[]): {
  name: string;
  value: number;
  fill: string;
}[] {
  return rooms.map(room => ({
    name: room.roomName,
    value: room.utilizationPercent,
    fill: RM_COLORS[room.roomId] ?? '#64748B',
  }));
}

/**
 * Format weekly revenue for Recharts line chart
 */
export function formatWeeklyRevenueChart(weekData: CalendarDayData[]): {
  name: string;
  revenue: number;
  appointments: number;
  utilization: number;
}[] {
  return weekData.map(day => ({
    name: format(parseISO(day.date), 'EEE'),
    revenue: day.totalRevenue,
    appointments: day.totalAppointments,
    utilization: day.utilizationPercent,
  }));
}
