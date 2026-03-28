// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getProviderWorkingHours,
  getHoursForDay,
  calculateDailyHours,
  calculateWeeklyHours,
  isProviderAvailable,
  calculateTimeOffHours,
  calculateTimeOffBalance,
  getAllTimeOffBalances,
  validateTimeOffRequest,
  validateShiftSwap,
  calculateOvertime,
  checkCoverage,
  checkWeekCoverage,
  applyScheduleTemplate,
  resolveHolidayBids,
  DEFAULT_WORKING_HOURS,
  DEFAULT_PTO_ALLOWANCES,
} from '../scheduling-preferences';
import type { WorkingHours, TimeOffRequest, TimeOffBalance, ScheduleTemplate } from '@/types/providers';

function makeWorkingHours(providerId: string): WorkingHours[] {
  return DEFAULT_WORKING_HOURS.map(h => ({ ...h, providerId }));
}

function makeTimeOffRequest(overrides: Partial<TimeOffRequest> = {}): TimeOffRequest {
  return {
    id: 'to-1',
    providerId: 'rina',
    type: 'pto',
    startDate: '2026-04-15',
    endDate: '2026-04-18',
    hours: 32,
    reason: 'Vacation',
    status: 'approved',
    requestedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

// ── WORKING HOURS ──

describe('getProviderWorkingHours', () => {
  it('filters hours by provider', () => {
    const allHours = [...makeWorkingHours('rina'), ...makeWorkingHours('mom')];
    const result = getProviderWorkingHours(allHours, 'rina');
    expect(result.length).toBe(7);
    expect(result.every(h => h.providerId === 'rina')).toBe(true);
  });

  it('returns empty for unknown provider', () => {
    expect(getProviderWorkingHours(makeWorkingHours('rina'), 'unknown')).toEqual([]);
  });
});

describe('getHoursForDay', () => {
  it('returns hours for specific day', () => {
    const hours = makeWorkingHours('rina');
    const monday = getHoursForDay(hours, 1);
    expect(monday).not.toBeNull();
    expect(monday!.isWorkday).toBe(true);
  });

  it('returns null for missing day', () => {
    expect(getHoursForDay([], 1)).toBeNull();
  });
});

describe('calculateDailyHours', () => {
  it('calculates hours from time range', () => {
    const hours: WorkingHours = { providerId: 'rina', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkday: true };
    expect(calculateDailyHours(hours)).toBe(9);
  });

  it('returns 0 for non-workday', () => {
    const hours: WorkingHours = { providerId: 'rina', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkday: false };
    expect(calculateDailyHours(hours)).toBe(0);
  });

  it('handles half hours', () => {
    const hours: WorkingHours = { providerId: 'rina', dayOfWeek: 1, startTime: '09:30', endTime: '17:00', isWorkday: true };
    expect(calculateDailyHours(hours)).toBe(7.5);
  });
});

describe('calculateWeeklyHours', () => {
  it('sums all workday hours', () => {
    const hours = makeWorkingHours('rina');
    const weekly = calculateWeeklyHours(hours);
    expect(weekly).toBeGreaterThan(0);
    // Mon-Fri 9h each + Sat 5h = 50h (or 49h if Fri is 8h due to default)
    expect(weekly).toBeGreaterThanOrEqual(44);
    expect(weekly).toBeLessThanOrEqual(50);
  });

  it('returns 0 for no workdays', () => {
    const hours: WorkingHours[] = [{ providerId: 'x', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkday: false }];
    expect(calculateWeeklyHours(hours)).toBe(0);
  });
});

describe('isProviderAvailable', () => {
  it('returns true on a workday without time off', () => {
    const hours = makeWorkingHours('rina');
    expect(isProviderAvailable(hours, '2026-03-24', [])).toBe(true); // Monday
  });

  it('returns false on a day off', () => {
    const hours = makeWorkingHours('rina');
    expect(isProviderAvailable(hours, '2026-03-23', [])).toBe(false); // Sunday
  });

  it('returns false when on approved time off', () => {
    const hours = makeWorkingHours('rina');
    const requests = [makeTimeOffRequest({ startDate: '2026-03-24', endDate: '2026-03-24' })];
    expect(isProviderAvailable(hours, '2026-03-24', requests)).toBe(false);
  });

  it('returns true when time off is pending (not approved)', () => {
    const hours = makeWorkingHours('rina');
    const requests = [makeTimeOffRequest({ startDate: '2026-03-24', endDate: '2026-03-24', status: 'pending' })];
    expect(isProviderAvailable(hours, '2026-03-24', requests)).toBe(true);
  });
});

// ── TIME-OFF ──

describe('calculateTimeOffHours', () => {
  it('calculates hours for multi-day request', () => {
    const hours = makeWorkingHours('rina');
    // Mon-Wed = 3 workdays * 9h = 27h
    const result = calculateTimeOffHours('2026-03-23', '2026-03-25', hours); // Mon to Wed (23=Mon)
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 for non-workday request', () => {
    // Create custom hours where only Mon is a workday
    const hours: WorkingHours[] = Array.from({ length: 7 }, (_, i) => ({
      providerId: 'test',
      dayOfWeek: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: i === 1 ? '09:00' : '00:00',
      endTime: i === 1 ? '17:00' : '00:00',
      isWorkday: i === 1,
    }));
    // Pick a Wednesday (known non-workday in our custom schedule)
    // 2026-03-25 is a Wednesday
    const result = calculateTimeOffHours('2026-03-25', '2026-03-25', hours);
    expect(result).toBe(0);
  });
});

describe('calculateTimeOffBalance', () => {
  it('calculates available balance correctly', () => {
    const requests = [makeTimeOffRequest({ type: 'pto', hours: 16, status: 'approved' })];
    const balance = calculateTimeOffBalance(requests, 'pto', 80);
    expect(balance.used).toBe(16);
    expect(balance.available).toBe(64);
  });

  it('includes carry-over', () => {
    const balance = calculateTimeOffBalance([], 'pto', 80, 16);
    expect(balance.available).toBe(96);
  });

  it('tracks pending separately', () => {
    const requests = [
      makeTimeOffRequest({ id: 'to-1', type: 'pto', hours: 16, status: 'approved' }),
      makeTimeOffRequest({ id: 'to-2', type: 'pto', hours: 8, status: 'pending' }),
    ];
    const balance = calculateTimeOffBalance(requests, 'pto', 80);
    expect(balance.used).toBe(16);
    expect(balance.pending).toBe(8);
  });
});

describe('getAllTimeOffBalances', () => {
  it('returns balance for each type', () => {
    const balances = getAllTimeOffBalances([]);
    expect(balances.length).toBe(Object.keys(DEFAULT_PTO_ALLOWANCES).length);
  });
});

describe('validateTimeOffRequest', () => {
  it('validates sufficient balance', () => {
    const balance: TimeOffBalance = { providerId: 'rina', type: 'pto', annualAllowance: 80, used: 70, pending: 0, available: 10, carryOver: 0 };
    const result = validateTimeOffRequest(
      { providerId: 'rina', type: 'pto', startDate: '2026-06-01', endDate: '2026-06-02', hours: 16, reason: 'Vacation' },
      balance,
      [],
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient');
  });

  it('validates no overlap', () => {
    const balance: TimeOffBalance = { providerId: 'rina', type: 'pto', annualAllowance: 80, used: 0, pending: 0, available: 80, carryOver: 0 };
    const existing = [makeTimeOffRequest({ startDate: '2026-06-01', endDate: '2026-06-05' })];
    const result = validateTimeOffRequest(
      { providerId: 'rina', type: 'pto', startDate: '2026-06-03', endDate: '2026-06-06', hours: 16, reason: 'Test' },
      balance,
      existing,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Overlapping');
  });

  it('accepts valid request', () => {
    const balance: TimeOffBalance = { providerId: 'rina', type: 'sick', annualAllowance: 40, used: 0, pending: 0, available: 40, carryOver: 0 };
    const result = validateTimeOffRequest(
      { providerId: 'rina', type: 'sick', startDate: '2026-06-01', endDate: '2026-06-01', hours: 8, reason: 'Sick' },
      balance,
      [],
    );
    expect(result.valid).toBe(true);
  });
});

// ── SHIFT SWAP ──

describe('validateShiftSwap', () => {
  it('validates both providers are scheduled', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    // Ensure it's a workday
    while (future.getDay() === 0 || future.getDay() === 6) future.setDate(future.getDate() + 1);
    const dateStr = future.toISOString().split('T')[0];

    const result = validateShiftSwap(
      { requesterId: 'rina', targetId: 'mom', originalDate: dateStr, swapDate: dateStr },
      makeWorkingHours('rina'),
      makeWorkingHours('mom'),
    );
    expect(result.valid).toBe(true);
  });

  it('rejects if requester not scheduled', () => {
    const sunday = new Date('2026-04-05'); // Sunday
    const result = validateShiftSwap(
      { requesterId: 'rina', targetId: 'mom', originalDate: sunday.toISOString().split('T')[0], swapDate: '2026-04-06' },
      makeWorkingHours('rina'),
      makeWorkingHours('mom'),
    );
    expect(result.valid).toBe(false);
  });
});

// ── OVERTIME ──

describe('calculateOvertime', () => {
  it('calculates overtime hours over 40', () => {
    const result = calculateOvertime(45, 50);
    expect(result.regularHours).toBe(40);
    expect(result.overtimeHours).toBe(5);
    expect(result.overtimePay).toBe(375); // 5 * 50 * 1.5
  });

  it('returns 0 overtime under 40 hours', () => {
    const result = calculateOvertime(35, 50);
    expect(result.overtimeHours).toBe(0);
    expect(result.overtimePay).toBe(0);
  });

  it('handles exactly 40 hours', () => {
    const result = calculateOvertime(40, 50);
    expect(result.overtimeHours).toBe(0);
    expect(result.regularHours).toBe(40);
  });

  it('uses custom threshold', () => {
    const result = calculateOvertime(38, 50, 35);
    expect(result.overtimeHours).toBe(3);
  });
});

// ── COVERAGE ──

describe('checkCoverage', () => {
  it('identifies sufficient coverage', () => {
    const allHours = new Map<string, WorkingHours[]>();
    allHours.set('rina', makeWorkingHours('rina'));
    allHours.set('mom', makeWorkingHours('mom'));

    const result = checkCoverage('2026-03-24', allHours, []); // Monday
    expect(result.meetsMinimum).toBe(true);
    expect(result.providersAvailable.length).toBe(2);
  });

  it('identifies gaps when provider on leave', () => {
    const allHours = new Map<string, WorkingHours[]>();
    allHours.set('rina', makeWorkingHours('rina'));

    const timeOff = [makeTimeOffRequest({ providerId: 'rina', startDate: '2026-03-24', endDate: '2026-03-24' })];
    const result = checkCoverage('2026-03-24', allHours, timeOff);
    expect(result.meetsMinimum).toBe(false);
    expect(result.providersAvailable.length).toBe(0);
  });
});

describe('checkWeekCoverage', () => {
  it('returns 7 days of coverage data', () => {
    const allHours = new Map<string, WorkingHours[]>();
    allHours.set('rina', makeWorkingHours('rina'));
    const result = checkWeekCoverage('2026-03-23', allHours, []);
    expect(result.length).toBe(7);
  });
});

// ── SCHEDULE TEMPLATES ──

describe('applyScheduleTemplate', () => {
  it('generates assignments for template', () => {
    const template: ScheduleTemplate = {
      id: 'default',
      name: 'Default',
      description: 'Default schedule',
      weeks: 1,
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', providerId: 'rina' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', providerId: 'mom' },
      ],
    };
    const result = applyScheduleTemplate(template, '2026-03-23');
    expect(result.length).toBe(2);
    expect(result[0].providerId).toBe('rina');
  });

  it('handles multi-week templates', () => {
    const template: ScheduleTemplate = {
      id: 'rotating',
      name: 'Rotating',
      description: 'Rotating schedule',
      weeks: 2,
      shifts: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00', providerId: 'rina' }],
    };
    const result = applyScheduleTemplate(template, '2026-03-23');
    expect(result.length).toBe(2);
  });
});

// ── HOLIDAY BIDDING ──

describe('resolveHolidayBids', () => {
  it('grants off to highest priority', () => {
    const bids = [
      { providerId: 'rina', holiday: 'July 4', date: '2026-07-04', preference: 'off' as const, priority: 1 },
      { providerId: 'mom', holiday: 'July 4', date: '2026-07-04', preference: 'work' as const, priority: 2 },
    ];
    const { assigned } = resolveHolidayBids(bids);
    const rinaAssignment = assigned.find(a => a.providerId === 'rina');
    expect(rinaAssignment?.working).toBe(false);
  });

  it('reports conflicts when too many want off', () => {
    const bids = [
      { providerId: 'rina', holiday: 'July 4', date: '2026-07-04', preference: 'off' as const, priority: 1 },
      { providerId: 'mom', holiday: 'July 4', date: '2026-07-04', preference: 'off' as const, priority: 2 },
    ];
    const { conflicts } = resolveHolidayBids(bids);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it('forces coverage when all want off', () => {
    const bids = [
      { providerId: 'rina', holiday: 'July 4', date: '2026-07-04', preference: 'off' as const, priority: 1 },
      { providerId: 'mom', holiday: 'July 4', date: '2026-07-04', preference: 'off' as const, priority: 2 },
    ];
    const { assigned } = resolveHolidayBids(bids, 1);
    const working = assigned.filter(a => a.working);
    expect(working.length).toBeGreaterThanOrEqual(1);
  });
});

// ── DEFAULTS ──

describe('DEFAULT_WORKING_HOURS', () => {
  it('has 7 entries', () => {
    expect(DEFAULT_WORKING_HOURS.length).toBe(7);
  });

  it('Sunday is off', () => {
    expect(DEFAULT_WORKING_HOURS[0].isWorkday).toBe(false);
  });

  it('Mon-Fri are workdays', () => {
    for (let i = 1; i <= 5; i++) {
      expect(DEFAULT_WORKING_HOURS[i].isWorkday).toBe(true);
    }
  });

  it('Saturday has shorter hours', () => {
    const sat = DEFAULT_WORKING_HOURS[6];
    expect(sat.isWorkday).toBe(true);
    expect(sat.startTime).toBe('10:00');
  });
});
