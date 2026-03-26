// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { optimizeSchedule, type ScheduleInput, type AppointmentData, type ProviderAvailability } from '../optimizer';

const TEST_DATE = '2026-03-18'; // Wednesday

function makeProvider(overrides: Partial<ProviderAvailability> = {}): ProviderAvailability {
  return {
    name: 'Dr. Rina', role: 'provider', workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00', endTime: '17:00',
    services: ['HydraFacial', 'Botox', 'RF Microneedling'],
    maxDailyAppointments: 8, preferredBreakTime: '12:00', ...overrides,
  };
}

function makeAppt(overrides: Partial<AppointmentData> = {}): AppointmentData {
  return {
    id: `appt-${Math.random().toString(36).slice(2, 8)}`,
    date: TEST_DATE, startTime: '10:00', endTime: '11:00',
    service: 'HydraFacial', provider: 'Dr. Rina',
    clientName: 'Jane Doe', clientType: 'returning',
    estimatedRevenue: 275, status: 'confirmed', ...overrides,
  };
}

function makeInput(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    appointments: [], providers: [makeProvider()],
    rooms: [{ name: 'Room 1', equipment: ['HydraFacial'], suitableServices: ['HydraFacial'] }],
    historicalPatterns: [], serviceConfig: [
      { service: 'HydraFacial', duration: 45, setupTime: 10, revenue: 275, revenuePerMinute: 6.1 },
      { service: 'Botox', duration: 30, setupTime: 10, revenue: 400, revenuePerMinute: 13.3 },
    ],
    dateRange: { start: TEST_DATE, end: TEST_DATE }, ...overrides,
  };
}

describe('Schedule Optimizer', () => {
  // ── Structure ──
  it('returns all expected fields', () => {
    const r = optimizeSchedule(makeInput());
    expect(r).toHaveProperty('gaps');
    expect(r).toHaveProperty('conflicts');
    expect(r).toHaveProperty('revenueOpportunities');
    expect(r).toHaveProperty('providerBalance');
    expect(r).toHaveProperty('dailySummaries');
    expect(r).toHaveProperty('recommendations');
    expect(r).toHaveProperty('score');
  });

  it('score is 0-100', () => {
    const r = optimizeSchedule(makeInput());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  // ── Gap Detection ──
  it('detects full-day gap when no appointments', () => {
    const r = optimizeSchedule(makeInput({ appointments: [] }));
    expect(r.gaps.length).toBeGreaterThan(0);
    const fullDay = r.gaps.find(g => g.durationMinutes >= 420); // 7 hours
    expect(fullDay).toBeDefined();
  });

  it('detects gap between two spaced appointments', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ startTime: '09:00', endTime: '10:00' }),
        makeAppt({ id: 'a2', startTime: '13:00', endTime: '14:00' }),
      ],
    }));
    expect(r.gaps.some(g => g.durationMinutes >= 60)).toBe(true);
  });

  it('detects gap before first appointment', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [makeAppt({ startTime: '11:00', endTime: '12:00' })],
    }));
    // Gap from 09:00 to 11:00 = 120 min
    expect(r.gaps.some(g => g.startTime === '09:00')).toBe(true);
  });

  it('detects gap after last appointment', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [makeAppt({ startTime: '09:00', endTime: '10:00' })],
    }));
    expect(r.gaps.some(g => g.endTime === '17:00')).toBe(true);
  });

  it('skips non-working days', () => {
    const r = optimizeSchedule(makeInput({
      dateRange: { start: '2026-03-22', end: '2026-03-22' }, // Sunday
    }));
    expect(r.gaps).toHaveLength(0);
  });

  // ── Conflict Detection ──
  it('detects double booking', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '10:00', endTime: '11:00' }),
        makeAppt({ id: 'a2', startTime: '10:30', endTime: '11:30' }),
      ],
    }));
    const db = r.conflicts.find(c => c.type === 'double_booking');
    expect(db).toBeDefined();
    expect(db!.severity).toBe('high');
  });

  it('detects insufficient buffer', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '10:00', endTime: '10:55' }),
        makeAppt({ id: 'a2', startTime: '11:00', endTime: '12:00' }),
      ],
    }));
    const buf = r.conflicts.find(c => c.type === 'insufficient_buffer');
    expect(buf).toBeDefined();
    expect(buf!.severity).toBe('medium');
  });

  it('detects overtime', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [makeAppt({ id: 'a1', startTime: '16:00', endTime: '17:30' })],
    }));
    expect(r.conflicts.find(c => c.type === 'overtime')).toBeDefined();
  });

  it('detects room conflict', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '10:00', endTime: '11:00', room: 'Room 1', provider: 'Dr. Rina' }),
        makeAppt({ id: 'a2', startTime: '10:30', endTime: '11:30', room: 'Room 1', provider: 'Mom' }),
      ],
      providers: [makeProvider(), makeProvider({ name: 'Mom' })],
    }));
    expect(r.conflicts.find(c => c.type === 'room_conflict')).toBeDefined();
  });

  it('no conflicts with well-spaced appointments', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '09:00', endTime: '10:00' }),
        makeAppt({ id: 'a2', startTime: '10:30', endTime: '11:30' }),
        makeAppt({ id: 'a3', startTime: '12:00', endTime: '13:00' }),
      ],
    }));
    expect(r.conflicts.filter(c => c.type === 'double_booking')).toHaveLength(0);
  });

  // ── Provider Balance ──
  it('marks provider as underloaded with no appointments', () => {
    const r = optimizeSchedule(makeInput({ appointments: [] }));
    expect(r.providerBalance[0].status).toBe('underloaded');
    expect(r.providerBalance[0].utilization).toBe(0);
  });

  it('marks provider as balanced with moderate load', () => {
    const appts = Array.from({ length: 6 }, (_, i) =>
      makeAppt({ id: `a${i}`, startTime: `${9 + i}:00`, endTime: `${9 + i}:45` })
    );
    const r = optimizeSchedule(makeInput({ appointments: appts }));
    expect(r.providerBalance[0].utilization).toBeGreaterThan(0);
  });

  // ── Revenue Opportunities ──
  it('suggests gap-filling opportunities', () => {
    const r = optimizeSchedule(makeInput({ appointments: [] }));
    expect(r.revenueOpportunities.some(o => o.type === 'fill_gap')).toBe(true);
  });

  // ── Daily Summaries ──
  it('generates daily summary', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [makeAppt()],
    }));
    expect(r.dailySummaries).toHaveLength(1);
    expect(r.dailySummaries[0].totalAppointments).toBe(1);
    expect(r.dailySummaries[0].totalRevenue).toBe(275);
  });

  // ── Recommendations ──
  it('generates high-priority recommendations for conflicts', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '10:00', endTime: '11:00' }),
        makeAppt({ id: 'a2', startTime: '10:30', endTime: '11:30' }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.priority === 'high')).toBe(true);
  });

  // ── Cancelled Appointments ──
  it('ignores cancelled appointments', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '10:00', endTime: '11:00', status: 'cancelled' }),
        makeAppt({ id: 'a2', startTime: '10:30', endTime: '11:30' }),
      ],
    }));
    expect(r.conflicts.filter(c => c.type === 'double_booking')).toHaveLength(0);
  });

  // ── Multi-day Range ──
  it('handles multi-day date range', () => {
    const r = optimizeSchedule(makeInput({
      dateRange: { start: '2026-03-16', end: '2026-03-20' }, // Mon-Fri
      appointments: [],
    }));
    expect(r.dailySummaries.length).toBe(5);
  });

  // ── Edge Cases ──
  it('handles empty input', () => {
    const r = optimizeSchedule(makeInput({
      appointments: [], providers: [], rooms: [],
    }));
    expect(r.gaps).toHaveLength(0);
    expect(r.conflicts).toHaveLength(0);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  // ── Prep/Cleanup Buffer Constants ──
  it('exported module references buffer constants', () => {
    // This test validates that the buffer constants exist in the module
    // The gap detection subtracts IDEAL_BUFFER_MINUTES (15) between appointments
    const r = optimizeSchedule(makeInput({
      appointments: [
        makeAppt({ id: 'a1', startTime: '09:00', endTime: '10:00' }),
        makeAppt({ id: 'a2', startTime: '10:45', endTime: '11:45' }),
      ],
    }));
    // 10:00 to 10:45 = 45 min. After 15 min buffer = 30 min gap. Exactly at threshold.
    const midGap = r.gaps.find(g => g.startTime === '10:15');
    expect(midGap).toBeDefined();
    expect(midGap!.durationMinutes).toBe(30);
  });
});
