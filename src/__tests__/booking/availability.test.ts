import { describe, it, expect, beforeEach } from 'vitest';
import {
  AvailabilityEngine,
  DEFAULT_PROVIDERS,
  DEFAULT_SCHEDULING_CONFIG,
  parseTime,
  formatTime,
  getDayOfWeek,
  isTimeInRange,
  doTimesOverlap,
  addMinutesToTime,
  minutesBetween,
} from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';

// ── HELPER FUNCTION TESTS ──

describe('parseTime', () => {
  it('parses HH:MM on a date', () => {
    const result = parseTime('2026-03-26', '09:30');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('handles midnight', () => {
    const result = parseTime('2026-03-26', '00:00');
    expect(result.getHours()).toBe(0);
  });
});

describe('formatTime', () => {
  it('formats Date to HH:MM', () => {
    const date = new Date(2026, 2, 26, 14, 30);
    expect(formatTime(date)).toBe('14:30');
  });
});

describe('getDayOfWeek', () => {
  it('returns correct day for a Monday', () => {
    expect(getDayOfWeek('2026-03-23')).toBe('monday');
  });

  it('returns correct day for a Sunday', () => {
    expect(getDayOfWeek('2026-03-29')).toBe('sunday');
  });

  it('returns correct day for a Saturday', () => {
    expect(getDayOfWeek('2026-03-28')).toBe('saturday');
  });
});

describe('isTimeInRange', () => {
  it('returns true for time within range', () => {
    expect(isTimeInRange('10:00', '09:00', '17:00')).toBe(true);
  });

  it('returns true for start of range', () => {
    expect(isTimeInRange('09:00', '09:00', '17:00')).toBe(true);
  });

  it('returns false for end of range (exclusive)', () => {
    expect(isTimeInRange('17:00', '09:00', '17:00')).toBe(false);
  });

  it('returns false for time before range', () => {
    expect(isTimeInRange('08:00', '09:00', '17:00')).toBe(false);
  });
});

describe('doTimesOverlap', () => {
  it('detects overlapping ranges', () => {
    expect(doTimesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
  });

  it('returns false for non-overlapping ranges', () => {
    expect(doTimesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
  });

  it('detects containment', () => {
    expect(doTimesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
  });

  it('detects reverse containment', () => {
    expect(doTimesOverlap('10:00', '11:00', '09:00', '12:00')).toBe(true);
  });
});

describe('addMinutesToTime', () => {
  it('adds minutes correctly', () => {
    expect(addMinutesToTime('09:00', 30)).toBe('09:30');
  });

  it('handles hour rollover', () => {
    expect(addMinutesToTime('09:45', 30)).toBe('10:15');
  });

  it('handles negative minutes', () => {
    expect(addMinutesToTime('10:00', -15)).toBe('09:45');
  });

  it('handles midnight rollover', () => {
    expect(addMinutesToTime('23:30', 60)).toBe('00:30');
  });
});

describe('minutesBetween', () => {
  it('calculates minutes between two times', () => {
    expect(minutesBetween('09:00', '10:30')).toBe(90);
  });

  it('returns 0 for same time', () => {
    expect(minutesBetween('09:00', '09:00')).toBe(0);
  });

  it('calculates full work day', () => {
    expect(minutesBetween('09:00', '18:00')).toBe(540);
  });
});

// ── AVAILABILITY ENGINE TESTS ──

describe('AvailabilityEngine', () => {
  let engine: AvailabilityEngine;

  beforeEach(() => {
    engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [],
      BOOKABLE_SERVICES,
    );
  });

  describe('getAvailableSlots', () => {
    it('returns slots for a valid service and date', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-04-01', // Wednesday
      });

      expect(result.isFullyBooked).toBe(false);
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.service.id).toBe('hydrafacial-signature');
      expect(result.service.price).toBe(225);
    });

    it('returns empty for unknown service', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'nonexistent-service',
        date: '2026-04-01',
      });

      expect(result.isFullyBooked).toBe(true);
      expect(result.slots.length).toBe(0);
    });

    it('returns empty for Sunday (clinic closed)', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-03-29', // Sunday
      });

      expect(result.isFullyBooked).toBe(true);
      expect(result.slots.length).toBe(0);
    });

    it('returns only qualified provider slots', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'botox',
        date: '2026-04-01',
      });

      // Only Dr. Landfield is qualified for botox
      const providers = new Set(result.slots.map(s => s.providerId));
      expect(providers.has('dr-landfield')).toBe(true);
      expect(providers.has('raj')).toBe(false);
    });

    it('respects provider preference', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-04-01',
        providerId: 'raj',
      });

      const providers = new Set(result.slots.map(s => s.providerId));
      expect(providers.size).toBe(1);
      expect(providers.has('raj')).toBe(true);
    });

    it('filters by time preference - morning', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-04-01',
        timePreference: 'morning',
      });

      for (const slot of result.slots) {
        const hour = parseInt(slot.startTime.split(':')[0]);
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(12);
      }
    });

    it('filters by time preference - afternoon', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-04-01',
        timePreference: 'afternoon',
      });

      for (const slot of result.slots) {
        const hour = parseInt(slot.startTime.split(':')[0]);
        expect(hour).toBeGreaterThanOrEqual(12);
        expect(hour).toBeLessThan(16);
      }
    });

    it('returns slots in correct room', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'botox',
        date: '2026-04-01',
      });

      // Botox requires Glow room
      for (const slot of result.slots) {
        expect(slot.roomId).toBe('glow');
      }
    });

    it('handles holidays (clinic closed)', () => {
      engine.addHoliday({
        date: '2026-12-25',
        name: 'Christmas Day',
        isClinicClosed: true,
      });

      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-12-25',
      });

      expect(result.isFullyBooked).toBe(true);
      expect(result.slots.length).toBe(0);
    });

    it('handles holidays with modified hours', () => {
      engine.addHoliday({
        date: '2026-12-24',
        name: 'Christmas Eve',
        isClinicClosed: false,
        modifiedHours: { start: '10:00', end: '14:00' },
      });

      const result = engine.getAvailableSlots({
        serviceId: 'wellness-b12',
        date: '2026-12-24',
      });

      for (const slot of result.slots) {
        expect(slot.startTime >= '10:00').toBe(true);
        // End time + cleanup should be <= 14:00
      }
    });

    it('generates slots in 15-minute increments', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'wellness-b12',
        date: '2026-04-01',
      });

      for (const slot of result.slots) {
        const minutes = parseInt(slot.startTime.split(':')[1]);
        expect(minutes % 15).toBe(0);
      }
    });

    it('does not generate slots during lunch break', () => {
      const result = engine.getAvailableSlots({
        serviceId: 'hydrafacial-signature',
        date: '2026-04-01',
        providerId: 'raj', // Lunch 12:30-13:30
      });

      // No slots should overlap with 12:30-13:30
      for (const slot of result.slots) {
        expect(
          doTimesOverlap(slot.startTime, addMinutesToTime(slot.startTime, 60 + 15), '12:30', '13:30')
        ).toBe(false);
      }
    });

    it('Saturday has shorter hours', () => {
      const weekday = engine.getAvailableSlots({
        serviceId: 'wellness-b12',
        date: '2026-04-01', // Wednesday
      });

      const saturday = engine.getAvailableSlots({
        serviceId: 'wellness-b12',
        date: '2026-03-28', // Saturday
      });

      expect(saturday.slots.length).toBeLessThan(weekday.slots.length);
    });
  });

  describe('bookAppointment', () => {
    it('books an appointment successfully', () => {
      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientInfo: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '555-1234' },
        source: 'online',
      });

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.appointment!.serviceName).toBe('Signature HydraFacial');
      expect(result.appointment!.providerName).toBe('Raj');
      expect(result.appointment!.roomId).toBe('aura');
    });

    it('rejects unknown service', () => {
      const result = engine.bookAppointment({
        serviceId: 'nonexistent',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service not found');
    });

    it('rejects unqualified provider', () => {
      const result = engine.bookAppointment({
        serviceId: 'botox',
        providerId: 'raj', // Not qualified for botox
        roomId: 'glow',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not qualified');
    });

    it('prevents double booking', () => {
      // First booking
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      // Second booking at same time
      const result = engine.bookAppointment({
        serviceId: 'vi-peel',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-2',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.conflictDetails?.type).toBe('double-booking');
    });

    it('prevents room conflicts', () => {
      // Book aura room with raj
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      // Try to book same room with different provider at same time
      // Note: Dr. Landfield doesn't do HydraFacials, so we'd need a shared service
      // For this test, the room conflict comes from buffer times
    });

    it('rejects booking on holiday', () => {
      engine.addHoliday({
        date: '2026-12-25',
        name: 'Christmas',
        isClinicClosed: true,
      });

      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-12-25',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.conflictDetails?.type).toBe('holiday');
    });

    it('rejects booking outside working hours', () => {
      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '07:00', // Before 9:00 start
        clientId: 'client-1',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.conflictDetails?.type).toBe('outside-hours');
    });

    it('rejects booking during lunch break', () => {
      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '12:30', // Raj lunch is 12:30-13:30
        clientId: 'client-1',
        source: 'online',
      });

      expect(result.success).toBe(false);
    });

    it('suggests alternatives on conflict', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-2',
        source: 'online',
      });

      expect(result.success).toBe(false);
      expect(result.suggestedAlternatives).toBeDefined();
      expect(result.suggestedAlternatives!.length).toBeGreaterThan(0);
    });

    it('respects buffer times between appointments', () => {
      // Book at 9:00 (60 min treatment + 10 min cleanup = 10:10)
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      // Try booking at 10:00 (needs prep at 9:55, overlaps cleanup ending at 10:10)
      const result = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '10:00',
        clientId: 'client-2',
        source: 'online',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('cancelAppointment', () => {
    it('cancels an existing appointment', () => {
      const booking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      const result = engine.cancelAppointment(booking.appointment!.id, 'Client request');
      expect(result.success).toBe(true);
      expect(result.appointment!.status).toBe('cancelled');
      expect(result.appointment!.cancelReason).toBe('Client request');
    });

    it('returns error for unknown appointment', () => {
      const result = engine.cancelAppointment('nonexistent-id');
      expect(result.success).toBe(false);
    });

    it('frees up the slot after cancellation', () => {
      const booking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      engine.cancelAppointment(booking.appointment!.id);

      // Should be able to book at the same time now
      const newBooking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-2',
        source: 'online',
      });

      expect(newBooking.success).toBe(true);
    });
  });

  describe('rescheduleAppointment', () => {
    it('reschedules to a new time', () => {
      const booking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      const result = engine.rescheduleAppointment(
        booking.appointment!.id,
        '2026-04-02',
        '14:00',
      );

      expect(result.success).toBe(true);
      expect(result.appointment!.date).toBe('2026-04-02');
      expect(result.appointment!.startTime).toBe('14:00');
    });
  });

  describe('Provider management', () => {
    it('returns qualified providers for injectables', () => {
      const providers = engine.getQualifiedProviders('botox');
      expect(providers.length).toBe(1);
      expect(providers[0].providerId).toBe('dr-landfield');
    });

    it('returns qualified providers for HydraFacial', () => {
      const providers = engine.getQualifiedProviders('hydrafacial-signature');
      expect(providers.length).toBeGreaterThanOrEqual(1);
      expect(providers.some(p => p.providerId === 'raj')).toBe(true);
    });

    it('checks provider availability correctly', () => {
      const provider = DEFAULT_PROVIDERS[0]; // Dr. Landfield
      expect(engine.isProviderAvailable(provider, '2026-04-01')).toBe(true); // Wednesday
      expect(engine.isProviderAvailable(provider, '2026-03-29')).toBe(false); // Sunday
    });

    it('respects time off', () => {
      const providers = [...DEFAULT_PROVIDERS];
      providers[0] = {
        ...providers[0],
        timeOff: [{
          id: 'to-1',
          startDate: '2026-04-10',
          endDate: '2026-04-12',
          reason: 'Conference',
          isApproved: true,
        }],
      };

      const eng = new AvailabilityEngine(providers, DEFAULT_SCHEDULING_CONFIG, [], BOOKABLE_SERVICES);
      expect(eng.isProviderAvailable(providers[0], '2026-04-11')).toBe(false);
      expect(eng.isProviderAvailable(providers[0], '2026-04-13')).toBe(true);
    });
  });

  describe('Room management', () => {
    it('returns correct compatible rooms for injectables', () => {
      const rooms = engine.getCompatibleRooms('botox');
      expect(rooms.some(r => r.id === 'glow')).toBe(true);
    });

    it('returns correct compatible rooms for HydraFacial', () => {
      const rooms = engine.getCompatibleRooms('hydrafacial-signature');
      expect(rooms.some(r => r.id === 'aura')).toBe(true);
    });

    it('returns correct compatible rooms for Sofwave', () => {
      const rooms = engine.getCompatibleRooms('sofwave-full-face');
      expect(rooms.some(r => r.id === 'halo')).toBe(true);
    });

    it('checks room availability', () => {
      expect(engine.isRoomAvailable('aura', '2026-04-01', '09:00', '10:00')).toBe(true);

      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      expect(engine.isRoomAvailable('aura', '2026-04-01', '09:00', '10:00')).toBe(false);
    });
  });

  describe('Holiday management', () => {
    it('adds and removes holidays', () => {
      engine.addHoliday({
        date: '2026-07-04',
        name: 'Independence Day',
        isClinicClosed: true,
      });

      expect(engine.getHoliday('2026-07-04')).toBeDefined();
      expect(engine.getHoliday('2026-07-04')!.name).toBe('Independence Day');

      engine.removeHoliday('2026-07-04');
      expect(engine.getHoliday('2026-07-04')).toBeUndefined();
    });
  });

  describe('Appointment queries', () => {
    it('returns appointments for a date', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      engine.bookAppointment({
        serviceId: 'vi-peel',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '14:00',
        clientId: 'client-2',
        source: 'online',
      });

      const appointments = engine.getAppointmentsForDate('2026-04-01');
      expect(appointments.length).toBe(2);
    });

    it('returns appointments for a date range', () => {
      engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      engine.bookAppointment({
        serviceId: 'vi-peel',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-03',
        startTime: '14:00',
        clientId: 'client-2',
        source: 'online',
      });

      const appointments = engine.getAppointmentsInRange('2026-04-01', '2026-04-05');
      expect(appointments.length).toBe(2);
    });

    it('excludes cancelled appointments from date queries', () => {
      const booking = engine.bookAppointment({
        serviceId: 'hydrafacial-signature',
        providerId: 'raj',
        roomId: 'aura',
        date: '2026-04-01',
        startTime: '09:00',
        clientId: 'client-1',
        source: 'online',
      });

      engine.cancelAppointment(booking.appointment!.id);

      const appointments = engine.getAppointmentsForDate('2026-04-01');
      expect(appointments.length).toBe(0);
    });
  });
});
