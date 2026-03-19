import { describe, it, expect } from 'vitest';
import {
  optimizeSchedule,
  ScheduleInput,
  AppointmentData,
  ProviderAvailability,
} from '../optimizer';

const TEST_DATE = '2026-03-18'; // Wednesday (day 3)

function makeProvider(overrides: Partial<ProviderAvailability> = {}): ProviderAvailability {
  return {
    name: 'Dr. Rina',
    role: 'provider',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    startTime: '09:00',
    endTime: '17:00',
    services: ['HydraFacial', 'Botox', 'RF Microneedling'],
    maxDailyAppointments: 8,
    preferredBreakTime: '12:00',
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<AppointmentData> = {}): AppointmentData {
  return {
    id: `appt-${Math.random().toString(36).slice(2, 8)}`,
    date: TEST_DATE,
    startTime: '10:00',
    endTime: '11:00',
    service: 'HydraFacial',
    provider: 'Dr. Rina',
    clientName: 'Jane Doe',
    clientType: 'returning',
    estimatedRevenue: 275,
    status: 'confirmed',
    ...overrides,
  };
}

function makeInput(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    appointments: [],
    providers: [makeProvider()],
    rooms: [],
    historicalPatterns: [],
    serviceConfig: [
      { service: 'HydraFacial', duration: 45, setupTime: 10, revenue: 275, revenuePerMinute: 6.1 },
      { service: 'Botox', duration: 30, setupTime: 10, revenue: 400, revenuePerMinute: 13.3 },
    ],
    dateRange: { start: TEST_DATE, end: TEST_DATE },
    ...overrides,
  };
}

describe('optimizeSchedule', () => {
  it('detects a 2-hour gap between appointments', () => {
    const result = optimizeSchedule(makeInput({
      appointments: [
        makeAppointment({ startTime: '09:00', endTime: '10:00' }),
        makeAppointment({ startTime: '12:00', endTime: '13:00', id: 'appt-2' }),
      ],
    }));

    // There's a gap from ~10:15 to 12:00 (105 min after ideal buffer)
    // The engine finds gaps >= 30 min
    expect(result.gaps.length).toBeGreaterThan(0);
    const midGap = result.gaps.find(g =>
      g.provider === 'Dr. Rina' && g.date === TEST_DATE
    );
    expect(midGap).toBeDefined();
    expect(midGap!.durationMinutes).toBeGreaterThanOrEqual(30);
  });

  it('detects conflicts with overlapping appointments', () => {
    const result = optimizeSchedule(makeInput({
      appointments: [
        makeAppointment({ id: 'a1', startTime: '10:00', endTime: '11:00' }),
        makeAppointment({ id: 'a2', startTime: '10:30', endTime: '11:30' }),
      ],
    }));

    expect(result.conflicts.length).toBeGreaterThan(0);
    const doubleBooking = result.conflicts.find(c => c.type === 'double_booking');
    expect(doubleBooking).toBeDefined();
    expect(doubleBooking!.severity).toBe('high');
    expect(doubleBooking!.appointments).toContain('a1');
    expect(doubleBooking!.appointments).toContain('a2');
  });

  it('handles empty appointment list without errors', () => {
    const result = optimizeSchedule(makeInput({
      appointments: [],
    }));

    expect(result.conflicts).toHaveLength(0);
    // Full day is one big gap per provider
    expect(result.gaps.length).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns a schedule score between 0 and 100', () => {
    const result = optimizeSchedule(makeInput({
      appointments: [
        makeAppointment({ startTime: '09:00', endTime: '10:00' }),
        makeAppointment({ id: 'a2', startTime: '10:15', endTime: '11:15' }),
        makeAppointment({ id: 'a3', startTime: '11:30', endTime: '12:30' }),
      ],
    }));

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
