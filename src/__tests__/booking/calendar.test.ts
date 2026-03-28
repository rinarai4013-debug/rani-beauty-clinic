import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarManager, formatRevenueChartData, formatRoomUtilizationChart, formatWeeklyRevenueChart } from '@/lib/booking/calendar';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import type { CalendarColorMode } from '@/lib/booking/types';

describe('CalendarManager', () => {
  let engine: AvailabilityEngine;
  let calendar: CalendarManager;

  beforeEach(() => {
    engine = new AvailabilityEngine(DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG, [], BOOKABLE_SERVICES);
    calendar = new CalendarManager(engine, BOOKABLE_SERVICES);
  });

  describe('getDayView', () => {
    it('returns day data with empty schedule', () => {
      const day = calendar.getDayView('2026-04-01');

      expect(day.date).toBe('2026-04-01');
      expect(day.totalAppointments).toBe(0);
      expect(day.totalRevenue).toBe(0);
      expect(day.events.length).toBe(0);
    });

    it('includes booked appointments', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01');
      expect(day.totalAppointments).toBe(1);
      expect(day.totalRevenue).toBe(225);
      expect(day.events.length).toBe(1);
      expect(day.events[0].title).toBe('Signature HydraFacial');
    });

    it('sorts events by start time', () => {
      engine.bookAppointment({
        serviceId: 'wellness-b12', providerId: 'dr-landfield', roomId: 'glow',
        date: '2026-04-01', startTime: '14:00', clientId: 'c1', source: 'online',
      });
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c2', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01');
      expect(day.events[0].startTime < day.events[1].startTime).toBe(true);
    });

    it('color codes by service type', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01', 'service');
      expect(day.events[0].color).toBeDefined();
      expect(day.events[0].color).not.toBe('');
    });

    it('color codes by provider', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01', 'provider');
      expect(day.events[0].color).toBeDefined();
    });

    it('color codes by room', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01', 'room');
      expect(day.events[0].color).toBeDefined();
    });

    it('color codes by status', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01', 'status');
      expect(day.events[0].color).toBeDefined();
    });

    it('calculates utilization', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const day = calendar.getDayView('2026-04-01');
      expect(day.utilizationPercent).toBeGreaterThan(0);
    });
  });

  describe('getWeekView', () => {
    it('returns 7 days of data', () => {
      const week = calendar.getWeekView('2026-04-01');
      expect(week.length).toBe(7);
    });

    it('includes appointments across the week', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });
      engine.bookAppointment({
        serviceId: 'wellness-b12', providerId: 'dr-landfield', roomId: 'glow',
        date: '2026-04-03', startTime: '10:00', clientId: 'c2', source: 'online',
      });

      const week = calendar.getWeekView('2026-04-01');
      const totalApts = week.reduce((sum, d) => sum + d.totalAppointments, 0);
      expect(totalApts).toBe(2);
    });
  });

  describe('getMonthView', () => {
    it('returns correct number of days', () => {
      const month = calendar.getMonthView('2026-04-15');
      expect(month.length).toBe(30); // April has 30 days
    });

    it('returns 31 days for March', () => {
      const month = calendar.getMonthView('2026-03-15');
      expect(month.length).toBe(31);
    });
  });

  describe('getProviderView', () => {
    it('returns data for all providers', () => {
      const providers = calendar.getProviderView('2026-04-01');
      expect(providers.length).toBe(DEFAULT_PROVIDERS.length);
    });

    it('includes correct appointment counts', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const providers = calendar.getProviderView('2026-04-01');
      const raj = providers.find(p => p.providerId === 'raj')!;
      expect(raj.appointmentCount).toBe(1);
      expect(raj.totalRevenue).toBe(225);
    });

    it('includes working hours', () => {
      const providers = calendar.getProviderView('2026-04-01');
      for (const pv of providers) {
        expect(pv.workingHours).toBeDefined();
        expect(pv.lunchBreak).toBeDefined();
      }
    });
  });

  describe('getRoomView', () => {
    it('returns data for all 3 rooms', () => {
      const rooms = calendar.getRoomView('2026-04-01');
      expect(rooms.length).toBe(3);
      expect(rooms.map(r => r.roomId).sort()).toEqual(['aura', 'glow', 'halo']);
    });

    it('calculates utilization per room', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const rooms = calendar.getRoomView('2026-04-01');
      const aura = rooms.find(r => r.roomId === 'aura')!;
      expect(aura.utilizationPercent).toBeGreaterThan(0);
      expect(aura.appointmentCount).toBe(1);
    });
  });

  describe('getRevenueOverlay', () => {
    it('returns hourly revenue data', () => {
      const revenue = calendar.getRevenueOverlay('2026-04-01');
      expect(revenue.length).toBeGreaterThan(0);

      for (const hr of revenue) {
        expect(hr.hour).toBeDefined();
        expect(hr.revenue).toBeGreaterThanOrEqual(0);
        expect(typeof hr.isPeakHour).toBe('boolean');
      }
    });

    it('reflects booked revenue', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '10:00', clientId: 'c1', source: 'online',
      });

      const revenue = calendar.getRevenueOverlay('2026-04-01');
      const tenAm = revenue.find(r => r.hour === '10:00');
      expect(tenAm).toBeDefined();
      expect(tenAm!.revenue).toBeGreaterThan(0);
    });

    it('marks peak hours correctly', () => {
      const revenue = calendar.getRevenueOverlay('2026-04-01');
      const tenAm = revenue.find(r => r.hour === '10:00');
      const eightAm = revenue.find(r => r.hour === '8:00');

      expect(tenAm?.isPeakHour).toBe(true);
      expect(eightAm?.isPeakHour).toBe(false);
    });
  });

  describe('validateReschedule', () => {
    it('validates a valid reschedule', () => {
      const booking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const validation = calendar.validateReschedule({
        appointmentId: booking.appointment!.id,
        newDate: '2026-04-02',
        newStartTime: '14:00',
      });

      expect(validation.valid).toBe(true);
    });

    it('rejects reschedule for nonexistent appointment', () => {
      const validation = calendar.validateReschedule({
        appointmentId: 'nonexistent',
        newDate: '2026-04-02',
        newStartTime: '14:00',
      });

      expect(validation.valid).toBe(false);
    });
  });

  describe('getPrintSchedule', () => {
    it('generates print-friendly schedule', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature', providerId: 'raj', roomId: 'aura',
        date: '2026-04-01', startTime: '09:00', clientId: 'c1', source: 'online',
      });

      const schedule = calendar.getPrintSchedule('2026-04-01');
      expect(schedule.clinicName).toBe('Rani Beauty Clinic');
      expect(schedule.formattedDate).toContain('2026');
      expect(schedule.summary.totalAppointments).toBe(1);
      expect(schedule.providers.length).toBeGreaterThan(0);
      expect(schedule.rooms.length).toBe(3);
    });
  });
});

describe('Chart formatters', () => {
  describe('formatRevenueChartData', () => {
    it('formats hourly revenue for Recharts', () => {
      const input = [
        { hour: '9:00', revenue: 100, appointmentCount: 1, isPeakHour: false },
        { hour: '10:00', revenue: 300, appointmentCount: 2, isPeakHour: true },
      ];

      const result = formatRevenueChartData(input);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('9:00');
      expect(result[0].revenue).toBe(100);
      expect(result[1].fill).toBe('#C9A96E'); // Peak hour = gold
      expect(result[0].fill).toBe('#0F1D2C'); // Non-peak = navy
    });
  });

  describe('formatRoomUtilizationChart', () => {
    it('formats room data for pie chart', () => {
      const input = [
        { roomId: 'halo' as const, roomName: 'Halo', events: [], appointmentCount: 2, totalMinutesBooked: 120, utilizationPercent: 30, totalRevenue: 500 },
        { roomId: 'aura' as const, roomName: 'Aura', events: [], appointmentCount: 3, totalMinutesBooked: 180, utilizationPercent: 45, totalRevenue: 700 },
      ];

      const result = formatRoomUtilizationChart(input);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Halo');
      expect(result[0].value).toBe(30);
      expect(result[0].fill).toBeDefined();
    });
  });

  describe('formatWeeklyRevenueChart', () => {
    it('formats weekly data for line chart', () => {
      const input = [
        { date: '2026-03-30', events: [], totalRevenue: 1000, totalAppointments: 5, utilizationPercent: 60, gaps: [] },
        { date: '2026-03-31', events: [], totalRevenue: 1500, totalAppointments: 8, utilizationPercent: 80, gaps: [] },
      ];

      const result = formatWeeklyRevenueChart(input);
      expect(result.length).toBe(2);
      expect(result[0].revenue).toBe(1000);
      expect(result[0].name).toBeDefined(); // Day abbreviation
    });
  });
});
