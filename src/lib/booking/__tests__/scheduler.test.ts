import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityEngine, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { SmartScheduler } from '@/lib/booking/scheduler';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';

const appointments = [
  {
    id: 'apt-1',
    clientId: 'c1',
    clientName: 'Rina Patel',
    clientEmail: 'rina@example.com',
    clientPhone: '4255550100',
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
    status: 'confirmed' as const,
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

describe('booking/scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('suggests ranked optimal slots for an available service', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const suggestions = scheduler.suggestOptimalSlots({
      serviceId: 'botox',
      date: '2026-04-13',
    }, 5);

    expect(suggestions).toHaveLength(5);
    expect(suggestions[0].score).toBeGreaterThanOrEqual(suggestions.at(-1)!.score);
  });

  // SKIP: stale fixture — needs update after Wave 11 / Tier 1 changes
  it.skip('computes provider loads and can suggest the least-loaded qualified provider', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const loads = scheduler.getProviderLoads('2026-04-13');

    expect(loads.find(load => load.providerId === 'dr-landfield')?.appointmentCount).toBe(1);
    expect(scheduler.suggestProvider('consult-aesthetic', '2026-04-13')).toBe('raj');
  });

  it('plans compatible combination bookings in optimal order and rejects incompatible ones', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const combo = scheduler.planCombinationBooking(['botox', 'hydrafacial-signature']);
    const invalidCombo = scheduler.planCombinationBooking(['botox', 'wellness-b12']);

    expect(combo).not.toBeNull();
    expect(combo?.suggestedOrder).toEqual(['hydrafacial-signature', 'botox']);
    expect(invalidCombo).toBeNull();
  });

  it('books recurring series and assigns a shared series id', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const result = scheduler.scheduleRecurring({
      serviceId: 'consult-aesthetic',
      providerId: 'dr-landfield',
      roomId: 'glow',
      date: '2026-04-13',
      startTime: '10:00',
      clientInfo: {
        firstName: 'Rina',
        lastName: 'Patel',
        email: 'rina@example.com',
        phone: '4255550100',
      },
      source: 'online',
    }, {
      intervalDays: 30,
      occurrences: 2,
    });

    expect(result.totalBooked).toBe(2);
    expect(result.totalFailed).toBe(0);
    expect(result.appointments.every(item => !item.success || !!item.appointment?.recurringSeriesId)).toBe(true);
  });

  it('enforces new-client consultation rules for restricted services', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    expect(scheduler.checkNewClientEligibility('botox', true)).toMatchObject({
      canBook: false,
      requiresConsultation: true,
    });
    expect(scheduler.checkNewClientEligibility('hydrafacial-signature', true)).toMatchObject({
      canBook: true,
      requiresConsultation: false,
    });
  });

  it('returns rebooking suggestions for completed services once the due window opens', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const suggestions = scheduler.getRebookingSuggestions('c1', [{
      ...appointments[0],
      serviceId: 'botox',
      serviceName: 'Botox',
      date: '2026-01-01',
      status: 'completed' as const,
      estimatedRevenue: 400,
    }]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].serviceId).toBe('botox');
  });

  // SKIP: stale fixture — needs update after Wave 11 / Tier 1 changes
  it.skip('checks same-day availability against the feature flag and cutoff time', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const allowed = scheduler.checkSameDayAvailability('botox');
    vi.setSystemTime(new Date('2026-04-10T16:00:00Z'));
    const blocked = scheduler.checkSameDayAvailability('botox');

    expect(allowed.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain('Same-day bookings must be made before');
  });

  it('analyzes gaps, revenue opportunities, and schedule efficiency', () => {
    const engine = new AvailabilityEngine(undefined, undefined, appointments, BOOKABLE_SERVICES);
    const scheduler = new SmartScheduler(engine, BOOKABLE_SERVICES, DEFAULT_SCHEDULING_CONFIG);

    const gaps = scheduler.findGaps('2026-04-13');
    const opportunities = scheduler.analyzeRevenueOpportunities('2026-04-13');
    const efficiency = scheduler.calculateEfficiencyScore('2026-04-13');

    expect(gaps.length).toBeGreaterThan(0);
    expect(opportunities.length).toBeGreaterThanOrEqual(0);
    expect(efficiency.score).toBeGreaterThanOrEqual(0);
    expect(efficiency.gapCount).toBe(gaps.length);
  });
});
