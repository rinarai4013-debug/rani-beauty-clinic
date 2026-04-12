import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AvailabilityEngine,
  addMinutesToTime,
  doTimesOverlap,
  formatTime,
  getDayOfWeek,
  isTimeInRange,
  minutesBetween,
  parseTime,
} from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';

describe('booking/availability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('time helpers parse and compare booking times consistently', () => {
    expect(formatTime(parseTime('2026-04-13', '09:15'))).toBe('09:15');
    expect(getDayOfWeek('2026-04-13')).toBe('monday');
    expect(isTimeInRange('10:30', '10:00', '11:00')).toBe(true);
    expect(doTimesOverlap('10:00', '10:30', '10:15', '11:00')).toBe(true);
    expect(addMinutesToTime('09:45', 30)).toBe('10:15');
    expect(minutesBetween('09:00', '10:30')).toBe(90);
  });

  it('returns available slots for a valid weekday service query', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);

    const result = engine.getAvailableSlots({
      serviceId: 'botox',
      date: '2026-04-13',
    });

    expect(result.isFullyBooked).toBe(false);
    expect(result.service.id).toBe('botox');
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.some(slot => slot.startTime === '10:00' && slot.isEmergencyReserved)).toBe(true);
  });

  it('filters available slots by time preference', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);

    const result = engine.getAvailableSlots({
      serviceId: 'botox',
      date: '2026-04-13',
      timePreference: 'morning',
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every(slot => parseInt(slot.startTime.split(':')[0], 10) < 12)).toBe(true);
  });

  it('respects holiday closures and points to the next available date', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    engine.addHoliday({
      date: '2026-04-13',
      name: 'Clinic Retreat',
      isClinicClosed: true,
    });

    const result = engine.getAvailableSlots({
      serviceId: 'botox',
      date: '2026-04-13',
    });

    expect(result.isFullyBooked).toBe(true);
    expect(result.slots).toEqual([]);
    expect(result.nextAvailableDate).toBeDefined();
    expect(result.nextAvailableDate).not.toBe('2026-04-13');
  });

  it('same-day availability starts at or after the current rounded time', () => {
    // Use a time that's consistent: format(new Date(), 'HH:mm') uses local TZ,
    // so we check that all returned slots start at or after the local "now".
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);

    const result = engine.getAvailableSlots({
      serviceId: 'botox',
      date: '2026-04-10',
    });

    // The engine filters same-day slots to start at or after the current local time (rounded up).
    // Since vi.setSystemTime controls Date.now(), get local HH:mm the same way the engine does.
    const nowHHMM = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const [h, m] = nowHHMM.split(':').map(Number);
    const roundedMin = Math.ceil(m / 15) * 15;
    const roundedTime = roundedMin >= 60
      ? `${String(h + 1).padStart(2, '0')}:00`
      : `${String(h).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`;
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every(slot => slot.startTime >= roundedTime)).toBe(true);
  });

  it('books an appointment and creates recurring follow-ups when requested', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);

    const result = engine.bookAppointment({
      serviceId: 'consult-aesthetic',
      providerId: 'dr-landfield',
      roomId: 'glow',
      date: '2026-04-14',
      startTime: '09:00',
      clientInfo: {
        firstName: 'Rina',
        lastName: 'Patel',
        email: 'rina@example.com',
        phone: '4255550100',
      },
      recurringConfig: {
        intervalDays: 30,
        occurrences: 3,
      },
      source: 'online',
    });

    expect(result.success).toBe(true);
    expect(result.appointment?.clientName).toBe('Rina Patel');
    expect(result.recurringAppointments).toHaveLength(2);
    expect(result.recurringAppointments?.every(appointment => !!appointment.recurringSeriesId)).toBe(true);
  });

  it('rejects overlapping bookings with conflict details and alternatives', () => {
    const existing = {
      id: 'apt-1',
      clientId: 'c1',
      clientName: 'Mom',
      clientEmail: 'mom@example.com',
      clientPhone: '4255550101',
      serviceId: 'botox',
      serviceName: 'Botox',
      providerId: 'dr-landfield',
      providerName: 'Dr. Alexander Landfield',
      roomId: 'glow' as const,
      date: '2026-04-14',
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
    };
    const engine = new AvailabilityEngine(undefined, undefined, [existing], BOOKABLE_SERVICES);

    const result = engine.bookAppointment({
      serviceId: 'botox',
      providerId: 'dr-landfield',
      roomId: 'glow',
      date: '2026-04-14',
      startTime: '10:15',
      clientInfo: {
        firstName: 'Sukhi',
        lastName: 'Singh',
        email: 'sukhi@example.com',
        phone: '4255550102',
      },
      source: 'online',
    });

    expect(result.success).toBe(false);
    expect(result.conflictDetails?.type).toBe('double-booking');
    expect(result.suggestedAlternatives?.length).toBeGreaterThan(0);
  });

  it('reschedules an appointment by cancelling the original and creating a new booking', () => {
    const existing = {
      id: 'apt-2',
      clientId: 'c2',
      clientName: 'Rina Patel',
      clientEmail: 'rina@example.com',
      clientPhone: '4255550103',
      serviceId: 'consult-aesthetic',
      serviceName: 'Aesthetic Consultation',
      providerId: 'dr-landfield',
      providerName: 'Dr. Alexander Landfield',
      roomId: 'glow' as const,
      date: '2026-04-13',
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      status: 'confirmed' as const,
      isNewClient: false,
      isMember: false,
      estimatedRevenue: 0,
      depositPaid: 0,
      notes: 'Initial consult',
      createdAt: '2026-04-10T12:00:00.000Z',
      updatedAt: '2026-04-10T12:00:00.000Z',
      isEmergencySlot: false,
      source: 'phone' as const,
    };
    const engine = new AvailabilityEngine(undefined, undefined, [existing], BOOKABLE_SERVICES);

    const result = engine.rescheduleAppointment('apt-2', '2026-04-14', '11:00');

    expect(result.success).toBe(true);
    expect(result.appointment?.date).toBe('2026-04-14');
    expect(engine.getAllAppointments().some(appointment => appointment.id === 'apt-2' && appointment.status === 'cancelled')).toBe(true);
  });
});
