import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityEngine } from '@/lib/booking/availability';
import { CalendarManager, formatRevenueChartData, formatRoomUtilizationChart, formatWeeklyRevenueChart } from '@/lib/booking/calendar';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';

const appointments = [
  {
    id: 'apt-1',
    clientId: 'c1',
    clientName: 'Rina Patel',
    clientEmail: 'rina@example.com',
    clientPhone: '4255550100',
    serviceId: 'botox',
    serviceName: 'Botox',
    providerId: 'dr-landfield',
    providerName: 'Dr. Alexander Landfield',
    roomId: 'glow' as const,
    date: '2026-04-13',
    startTime: '10:00',
    endTime: '10:30',
    duration: 30,
    status: 'confirmed' as const,
    isNewClient: false,
    isMember: false,
    estimatedRevenue: 400,
    depositPaid: 0,
    notes: '',
    createdAt: '2026-04-10T12:00:00.000Z',
    updatedAt: '2026-04-10T12:00:00.000Z',
    isEmergencySlot: false,
    source: 'online' as const,
  },
  {
    id: 'apt-2',
    clientId: 'c2',
    clientName: 'Mom',
    clientEmail: 'mom@example.com',
    clientPhone: '4255550101',
    serviceId: 'hydrafacial-signature',
    serviceName: 'Signature HydraFacial',
    providerId: 'raj',
    providerName: 'Raj',
    roomId: 'aura' as const,
    date: '2026-04-13',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    status: 'pending' as const,
    isNewClient: false,
    isMember: true,
    estimatedRevenue: 225,
    depositPaid: 0,
    notes: '',
    createdAt: '2026-04-10T12:00:00.000Z',
    updatedAt: '2026-04-10T12:00:00.000Z',
    isEmergencySlot: false,
    source: 'phone' as const,
  },
];

describe('booking/calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a sorted day view with totals, utilization, and events', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    const day = manager.getDayView('2026-04-13');

    expect(day.totalAppointments).toBe(2);
    expect(day.totalRevenue).toBe(625);
    expect(day.events.map(event => event.startTime)).toEqual(['10:00', '14:00']);
    expect(day.utilizationPercent).toBeGreaterThan(0);
  });

  it('builds week and month views from the selected date', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    expect(manager.getWeekView('2026-04-13')).toHaveLength(7);
    expect(manager.getMonthView('2026-04-13')).toHaveLength(30);
  });

  it('creates provider and room views with revenue and utilization data', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    const providerView = manager.getProviderView('2026-04-13');
    const roomView = manager.getRoomView('2026-04-13');

    expect(providerView.find(view => view.providerId === 'dr-landfield')?.appointmentCount).toBe(1);
    expect(roomView.find(view => view.roomId === 'glow')?.appointmentCount).toBe(1);
    expect(roomView.find(view => view.roomId === 'aura')?.utilizationPercent).toBeGreaterThan(0);
  });

  it('computes hourly revenue overlays and marks peak hours', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    const overlay = manager.getRevenueOverlay('2026-04-13');
    const tenAm = overlay.find(item => item.hour === '10:00');
    const twoPm = overlay.find(item => item.hour === '14:00');

    expect(overlay).toHaveLength(11);
    expect(tenAm?.revenue).toBeGreaterThan(0);
    expect(tenAm?.isPeakHour).toBe(true);
    expect(twoPm?.isPeakHour).toBe(true);
  });

  it('rejects invalid reschedules when the provider is not qualified', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    const validation = manager.validateReschedule({
      appointmentId: 'apt-1',
      newDate: '2026-04-13',
      newStartTime: '11:00',
      newProviderId: 'raj',
    });

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Provider cannot perform Botox');
  });

  it('builds print schedules and chart-friendly output', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const manager = new CalendarManager(engine, BOOKABLE_SERVICES);

    const printSchedule = manager.getPrintSchedule('2026-04-13');
    const revenueChart = formatRevenueChartData(manager.getRevenueOverlay('2026-04-13'));
    const roomChart = formatRoomUtilizationChart(manager.getRoomView('2026-04-13'));
    const weeklyChart = formatWeeklyRevenueChart(manager.getWeekView('2026-04-13'));

    expect(printSchedule.summary.totalRevenue).toBe(625);
    expect(printSchedule.providers.length).toBeGreaterThan(0);
    expect(revenueChart.some(item => item.revenue > 0)).toBe(true);
    expect(roomChart.every(item => typeof item.fill === 'string')).toBe(true);
    expect(weeklyChart).toHaveLength(7);
  });
});
