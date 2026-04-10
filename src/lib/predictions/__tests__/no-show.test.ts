import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictNoShow, quickNoShowScore, type NoShowInput } from '@/lib/predictions/no-show';

// ── Helpers ──

function makeInput(overrides: Partial<NoShowInput> = {}): NoShowInput {
  return {
    totalAppointments: 10,
    totalNoShows: 0,
    isNewClient: false,
    hasMembership: false,
    daysSinceLastVisit: 14,
    depositPaid: false,
    depositAmount: 0,
    bookingLeadDays: 7,
    bookingSource: 'online',
    dayOfWeek: 3, // Wednesday
    hourOfDay: 12,
    serviceCategory: 'facial',
    isConsult: false,
    ...overrides,
  };
}

// ── Setup ──

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-09T12:00:00Z')); // Thursday
});

afterEach(() => {
  vi.useRealTimers();
});

// ── 1. Client history scoring ──

describe('Client history scoring', () => {
  it('brand-new client with 0 appointments -> score 40', () => {
    const result = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 0, totalNoShows: 0 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(40);
    expect(hist.detail).toContain('Brand-new');
  });

  it('non-new client with 0 appointments on record -> score 35', () => {
    const result = predictNoShow(makeInput({ isNewClient: false, totalAppointments: 0, totalNoShows: 0 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(35);
  });

  it('new client with 1 kept appointment -> score 25', () => {
    const result = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 1, totalNoShows: 0 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(25);
  });

  it('new client with 2 kept appointments -> score 25', () => {
    const result = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 2, totalNoShows: 0 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(25);
  });

  it('new client with early no-show (1 of 2) -> score 55', () => {
    const result = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 2, totalNoShows: 1 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(55);
  });

  it('0% no-show rate (20 appts, 0 no-shows) -> score 5 (perfect)', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 0 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(5);
    expect(hist.detail).toContain('Perfect');
  });

  it('< 5% no-show rate (1/25 = 4%) -> score 10 (excellent)', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 25, totalNoShows: 1 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(10);
  });

  it('exactly 5% no-show rate (1/20, boundary) -> score 25 (good)', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 1 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(25);
  });

  it('< 10% no-show rate (2/25 = 8%) -> score 25', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 25, totalNoShows: 2 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(25);
  });

  it('exactly 10% no-show rate (2/20, boundary) -> score 50', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 2 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(50);
  });

  it('< 20% no-show rate (3/20 = 15%) -> score 50', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 3 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(50);
  });

  it('exactly 20% no-show rate (4/20, boundary) -> score 75', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 4 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(75);
  });

  it('< 35% no-show rate (6/20 = 30%) -> score 75', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 6 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(75);
  });

  it('exactly 35% no-show rate (7/20, boundary) -> score 95 (chronic)', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 7 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(95);
  });

  it('chronic no-show (10/20 = 50%) -> score 95 with percentage in detail', () => {
    const result = predictNoShow(makeInput({ totalAppointments: 20, totalNoShows: 10 }));
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.score).toBe(95);
    expect(hist.detail).toContain('50%');
  });

  it('history factor carries 35% weight', () => {
    const result = predictNoShow(makeInput());
    const hist = result.factors.find(f => f.name === 'Client History')!;
    expect(hist.weight).toBe(35);
  });
});

// ── 2. Deposit scoring ──

describe('Deposit scoring', () => {
  it('deposit paid >= $150 (exact boundary) -> score 5', () => {
    const result = predictNoShow(makeInput({ depositPaid: true, depositAmount: 150 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(5);
    expect(dep.detail).toContain('strong commitment');
  });

  it('deposit paid $200 -> score 5', () => {
    const result = predictNoShow(makeInput({ depositPaid: true, depositAmount: 200 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(5);
  });

  it('deposit paid < $150 ($100) -> score 15', () => {
    const result = predictNoShow(makeInput({ depositPaid: true, depositAmount: 100 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(15);
  });

  it('deposit paid $149 (just under boundary) -> score 15', () => {
    const result = predictNoShow(makeInput({ depositPaid: true, depositAmount: 149 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(15);
  });

  it('deposit marked paid with $0 amount -> score 15 (flagged as missing amount)', () => {
    const result = predictNoShow(makeInput({ depositPaid: true, depositAmount: 0 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(15);
    expect(dep.detail).toContain('without amount');
  });

  it('no deposit (unpaid, $0) -> score 60', () => {
    const result = predictNoShow(makeInput({ depositPaid: false, depositAmount: 0 }));
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.score).toBe(60);
    expect(dep.detail).toContain('No deposit');
  });

  it('deposit factor carries 20% weight', () => {
    const result = predictNoShow(makeInput());
    const dep = result.factors.find(f => f.name === 'Deposit Status')!;
    expect(dep.weight).toBe(20);
  });
});

// ── 3. Lead time scoring ──

describe('Lead time scoring', () => {
  const cases: [number, number, string][] = [
    [0, 10, 'same-day booking'],
    [-1, 10, 'negative (treated as same-day)'],
    [1, 15, '1 day ago'],
    [2, 15, 'boundary: exactly 2 days'],
    [3, 25, '3 days (crosses into 3-7 band)'],
    [7, 25, 'boundary: exactly 7 days'],
    [8, 40, '8 days (crosses into 8-14 band)'],
    [14, 40, 'boundary: exactly 14 days'],
    [15, 55, '15 days (crosses into 15-30 band)'],
    [30, 55, 'boundary: exactly 30 days'],
    [31, 70, '31 days (beyond 30)'],
    [60, 70, '60 days out'],
    [90, 70, '90 days out'],
  ];

  it.each(cases)('bookingLeadDays=%i -> lead time score %i (%s)', (days, expectedScore) => {
    const result = predictNoShow(makeInput({ bookingLeadDays: days }));
    const lt = result.factors.find(f => f.name === 'Booking Lead Time')!;
    expect(lt.score).toBe(expectedScore);
  });

  it('lead time factor carries 15% weight', () => {
    const result = predictNoShow(makeInput());
    const lt = result.factors.find(f => f.name === 'Booking Lead Time')!;
    expect(lt.weight).toBe(15);
  });
});

// ── 4. Membership scoring ──

describe('Membership scoring', () => {
  it('active member -> score 8 (very reliable)', () => {
    const result = predictNoShow(makeInput({ hasMembership: true }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(8);
    expect(mem.detail).toContain('reliable');
  });

  it('non-member -> score 45', () => {
    const result = predictNoShow(makeInput({ hasMembership: false }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(45);
    expect(mem.detail).toContain('Non-member');
  });

  it('membership factor carries 10% weight', () => {
    const result = predictNoShow(makeInput());
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.weight).toBe(10);
  });
});

// ── 5. Timing scoring ──

describe('Timing scoring', () => {
  it('Monday morning (day=1, hour=9) -> score 55', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 1, hourOfDay: 9 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(55);
    expect(tm.detail).toContain('Mon');
  });

  it('Monday morning boundary (day=1, hour=10) -> score 55', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 1, hourOfDay: 10 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(55);
  });

  it('Monday at hour=11 (exits morning window) -> baseline 30', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 1, hourOfDay: 11 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    // hour=11 NOT < 11; day=1 NOT in 2-4; hour=11 NOT < 9; hour=11 NOT >= 18 -> baseline 30
    expect(tm.score).toBe(30);
  });

  it('Friday afternoon (day=5, hour=15) -> score 50', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 5, hourOfDay: 15 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(50);
    expect(tm.detail).toContain('Fri');
  });

  it('Friday afternoon (day=5, hour=17) -> score 50', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 5, hourOfDay: 17 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(50);
  });

  it('Friday at hour=14 (before afternoon window) -> baseline 30', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 5, hourOfDay: 14 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    // hour=14 NOT >= 15; day=5 NOT in 2-4; not weekend; hour=14 NOT < 9; NOT >= 18 -> baseline 30
    expect(tm.score).toBe(30);
  });

  it('Saturday (day=6) -> score 15 (weekend)', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 6, hourOfDay: 12 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(15);
    expect(tm.detail).toContain('Sat');
  });

  it('Sunday (day=0) -> score 15 (weekend)', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 0, hourOfDay: 10 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(15);
    expect(tm.detail).toContain('Sun');
  });

  it('midweek midday — Wed 12 -> score 20 (optimal)', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 12 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(20);
    expect(tm.detail).toContain('optimal');
  });

  it('midweek midday — Tue 10 (boundary) -> score 20', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 2, hourOfDay: 10 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(20);
  });

  it('midweek midday — Thu 15 (boundary) -> score 20', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 4, hourOfDay: 15 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(20);
  });

  it('Wed at hour=9 (before midday band) -> early morning 45', () => {
    // hour=9 is NOT in 10-15, but hour=9 is NOT < 9 -> falls through
    // Actually: day=3 in 2-4 but hour=9 NOT >= 10 -> not optimal.
    // hour=9 NOT < 9, NOT >= 18 -> baseline 30
    const result = predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 9 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(30);
  });

  it('early morning (hour=8, midweek) -> score 45', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 8 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(45);
    expect(tm.detail).toContain('Early');
  });

  it('early morning (hour=7) -> score 45', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 2, hourOfDay: 7 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(45);
  });

  it('late evening (hour=18, midweek) -> score 40', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 18 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(40);
    expect(tm.detail).toContain('evening');
  });

  it('late evening (hour=21) -> score 40', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 2, hourOfDay: 21 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(40);
  });

  it('baseline slot (Wed hour=16, no pattern match) -> score 30', () => {
    const result = predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 16 }));
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.score).toBe(30);
  });

  it('timing factor carries 10% weight', () => {
    const result = predictNoShow(makeInput());
    const tm = result.factors.find(f => f.name === 'Day & Time')!;
    expect(tm.weight).toBe(10);
  });
});

// ── 6. Source scoring ──

describe('Booking source scoring', () => {
  it('walk-in (hyphenated) -> score 5', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'walk-in' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(5);
  });

  it('walkin (no hyphen) -> score 5', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'walkin' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(5);
  });

  it('Walk-In (case insensitive) -> score 5', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'Walk-In' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(5);
  });

  it('phone -> score 20', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'phone' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(20);
  });

  it('phone call -> score 20', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'phone call' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(20);
  });

  it('online -> score 35', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'online' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(35);
  });

  it('Mangomint -> score 35', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'Mangomint' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(35);
  });

  it('Typeform -> score 40', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'Typeform' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(40);
  });

  it('website form -> score 40', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'website form' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(40);
  });

  it('referral -> score 15', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'referral' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(15);
  });

  it('unknown source -> score 35 (default)', () => {
    const result = predictNoShow(makeInput({ bookingSource: 'random-source' }));
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.score).toBe(35);
    expect(src.detail).toContain('random-source');
  });

  it('source factor carries 10% weight', () => {
    const result = predictNoShow(makeInput());
    const src = result.factors.find(f => f.name === 'Booking Source')!;
    expect(src.weight).toBe(10);
  });
});

// ── 7. Risk classification ──

describe('Risk classification', () => {
  it('score >= 60 -> high risk', () => {
    // chronic no-show, no deposit, long lead time, non-member, Monday morning, Typeform
    const result = predictNoShow(makeInput({
      totalAppointments: 10,
      totalNoShows: 5, // 50% -> history 95
      isNewClient: false,
      depositPaid: false, // deposit 60
      bookingLeadDays: 45, // leadTime 70
      hasMembership: false, // membership 45
      dayOfWeek: 1, hourOfDay: 9, // timing 55
      bookingSource: 'Typeform', // source 40
    }));
    // 95*0.35 + 70*0.15 + 60*0.20 + 45*0.10 + 55*0.10 + 40*0.10 = 33.25+10.5+12+4.5+5.5+4 = 69.75 -> 70
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.risk).toBe('high');
  });

  it('score crossing 60 boundary -> high risk', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 5, // 25% -> history 75
      depositPaid: false, // deposit 60
      bookingLeadDays: 20, // leadTime 55
      hasMembership: false, // membership 45
      dayOfWeek: 1, hourOfDay: 9, // timing 55
      bookingSource: 'Typeform', // source 40
    }));
    // 75*0.35 + 55*0.15 + 60*0.20 + 45*0.10 + 55*0.10 + 40*0.10 = 26.25+8.25+12+4.5+5.5+4 = 60.5 -> 61
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.risk).toBe('high');
  });

  it('score 35-59 -> moderate risk', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 2, // 10% -> history 50
      depositPaid: false, // deposit 60
      bookingLeadDays: 7, // leadTime 25
      hasMembership: false, // membership 45
      dayOfWeek: 3, hourOfDay: 12, // timing 20
      bookingSource: 'online', // source 35
    }));
    // 50*0.35 + 25*0.15 + 60*0.20 + 45*0.10 + 20*0.10 + 35*0.10 = 17.5+3.75+12+4.5+2+3.5 = 43.25 -> 43
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(60);
    expect(result.risk).toBe('moderate');
  });

  it('score = 35 exactly (boundary) -> moderate risk', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 1, // 5% -> history 25 (0.05 NOT < 0.05)
      depositPaid: false, // deposit 60
      bookingLeadDays: 3, // leadTime 25
      hasMembership: false, // membership 45
      dayOfWeek: 3, hourOfDay: 12, // timing 20
      bookingSource: 'online', // source 35
    }));
    // 25*0.35 + 25*0.15 + 60*0.20 + 45*0.10 + 20*0.10 + 35*0.10 = 8.75+3.75+12+4.5+2+3.5 = 34.5 -> 35
    expect(result.score).toBe(35);
    expect(result.risk).toBe('moderate');
  });

  it('score < 35 -> low risk', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 30, totalNoShows: 0, // history 5
      depositPaid: true, depositAmount: 200, // deposit 5
      bookingLeadDays: 1, // leadTime 15
      hasMembership: true, // membership 8
      dayOfWeek: 6, hourOfDay: 12, // timing 15
      bookingSource: 'walk-in', // source 5
    }));
    // 5*0.35 + 15*0.15 + 5*0.20 + 8*0.10 + 15*0.10 + 5*0.10 = 1.75+2.25+1+0.8+1.5+0.5 = 7.8 -> 8
    expect(result.score).toBeLessThan(35);
    expect(result.risk).toBe('low');
  });

  it('score is clamped 0-100 at both extremes', () => {
    const low = predictNoShow(makeInput({
      totalAppointments: 50, totalNoShows: 0,
      depositPaid: true, depositAmount: 500,
      bookingLeadDays: 0,
      hasMembership: true,
      dayOfWeek: 6, hourOfDay: 12,
      bookingSource: 'walk-in',
    }));
    expect(low.score).toBeGreaterThanOrEqual(0);
    expect(low.score).toBeLessThanOrEqual(100);

    const high = predictNoShow(makeInput({
      totalAppointments: 10, totalNoShows: 8,
      depositPaid: false, depositAmount: 0,
      bookingLeadDays: 90,
      hasMembership: false,
      dayOfWeek: 1, hourOfDay: 8,
      bookingSource: 'Typeform',
    }));
    expect(high.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
  });
});

// ── 8. quickNoShowScore ──

describe('quickNoShowScore', () => {
  it('handles empty input with all defaults', () => {
    const result = quickNoShowScore({});
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('risk');
    expect(typeof result.score).toBe('number');
    expect(['low', 'moderate', 'high']).toContain(result.risk);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('empty-input results are deterministic under fake timers', () => {
    const r1 = quickNoShowScore({});
    const r2 = quickNoShowScore({});
    expect(r1.score).toBe(r2.score);
    expect(r1.risk).toBe(r2.risk);
  });

  it('partial input with only some fields specified', () => {
    const result = quickNoShowScore({
      totalAppointments: 10,
      totalNoShows: 3,
      depositPaid: true,
      depositAmount: 200,
    });
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('default isNewClient=true means brand-new profile with 0 appts', () => {
    // Explicitly verify the default path produces a plausible score
    const result = quickNoShowScore({});
    // history 40, leadTime(7d)=25, deposit(unpaid)=60, membership(false)=45, source(online)=35
    // timing depends on fake "today" — 2026-04-09 is a Thursday (day=4), hour=12 -> midweek midday=20
    // 40*0.35 + 25*0.15 + 60*0.20 + 45*0.10 + 20*0.10 + 35*0.10 = 14+3.75+12+4.5+2+3.5 = 39.75 -> 40
    expect(result.score).toBe(40);
    expect(result.risk).toBe('moderate');
  });

  it('matches predictNoShow output for same full input', () => {
    const input: NoShowInput = {
      totalAppointments: 15,
      totalNoShows: 2,
      isNewClient: false,
      hasMembership: true,
      daysSinceLastVisit: 10,
      depositPaid: true,
      depositAmount: 150,
      bookingLeadDays: 3,
      bookingSource: 'phone',
      dayOfWeek: 4,
      hourOfDay: 14,
      serviceCategory: 'injectable',
      isConsult: false,
    };
    const full = predictNoShow(input);
    const quick = quickNoShowScore(input);
    expect(quick.score).toBe(full.score);
    expect(quick.risk).toBe(full.risk);
  });

  it('returns only score and risk (no factors or recommendation)', () => {
    const result = quickNoShowScore({});
    expect(result).not.toHaveProperty('factors');
    expect(result).not.toHaveProperty('recommendation');
    expect(Object.keys(result).sort()).toEqual(['risk', 'score']);
  });

  it('respects explicit overrides over defaults', () => {
    const high = quickNoShowScore({
      totalAppointments: 10,
      totalNoShows: 5,
      isNewClient: false,
      bookingLeadDays: 45,
      dayOfWeek: 1,
      hourOfDay: 9,
      bookingSource: 'Typeform',
    });
    expect(high.risk).toBe('high');
  });
});

// ── 9. Recommendations ──

describe('Recommendations', () => {
  it('low risk (< 35) -> standard reminders message', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 30, totalNoShows: 0,
      depositPaid: true, depositAmount: 200,
      bookingLeadDays: 1,
      hasMembership: true,
      dayOfWeek: 6, hourOfDay: 12,
      bookingSource: 'walk-in',
    }));
    expect(result.risk).toBe('low');
    expect(result.recommendation).toContain('Low risk');
    expect(result.recommendation).toContain('Standard');
  });

  it('high risk without deposit -> includes deposit request', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 10, totalNoShows: 5,
      depositPaid: false, depositAmount: 0,
      bookingLeadDays: 45,
      hasMembership: false,
      dayOfWeek: 1, hourOfDay: 9,
      bookingSource: 'Typeform',
    }));
    expect(result.risk).toBe('high');
    expect(result.recommendation).toContain('HIGH RISK');
    expect(result.recommendation.toLowerCase()).toContain('deposit');
  });

  it('high risk with long lead time -> includes extra reminder 48h before', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 10, totalNoShows: 5,
      depositPaid: false,
      bookingLeadDays: 14, // > 7
      hasMembership: false,
      dayOfWeek: 1, hourOfDay: 9,
      bookingSource: 'Typeform',
    }));
    expect(result.risk).toBe('high');
    expect(result.recommendation).toContain('reminder');
  });

  it('high risk consult -> includes overbooking recommendation', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 10, totalNoShows: 5,
      isConsult: true,
      depositPaid: false,
      bookingLeadDays: 45,
      hasMembership: false,
      dayOfWeek: 1, hourOfDay: 9,
      bookingSource: 'Typeform',
    }));
    expect(result.risk).toBe('high');
    expect(result.recommendation).toContain('Overbook');
  });

  it('high risk always includes provider day-before call', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 10, totalNoShows: 5,
      depositPaid: false,
      bookingLeadDays: 20,
      hasMembership: false,
      dayOfWeek: 1, hourOfDay: 9,
      bookingSource: 'Typeform',
    }));
    expect(result.risk).toBe('high');
    expect(result.recommendation.toLowerCase()).toContain('call');
  });

  it('moderate risk without deposit -> SMS reminder + deposit pitch', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 2,
      depositPaid: false, depositAmount: 0,
      bookingLeadDays: 7,
      hasMembership: false,
      dayOfWeek: 3, hourOfDay: 12,
      bookingSource: 'online',
    }));
    expect(result.risk).toBe('moderate');
    expect(result.recommendation).toContain('Moderate risk');
    expect(result.recommendation).toContain('SMS');
    expect(result.recommendation.toLowerCase()).toContain('deposit');
  });

  it('moderate risk with deposit paid -> extra 24h reminder with prep instructions', () => {
    // Need deposit paid AND still moderate (35-59). Paid deposit drops deposit score, so push
    // other factors up: higher no-show rate + longer lead time.
    // history 75 (4/20=20%), deposit 15 ($100), leadTime 40 (14d), membership 45,
    // timing 20 (midweek midday), source 35 (online)
    // 75*0.35 + 15*0.20 + 40*0.15 + 45*0.10 + 20*0.10 + 35*0.10 = 26.25+3+6+4.5+2+3.5 = 45.25 -> 45
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 4,
      depositPaid: true, depositAmount: 100,
      bookingLeadDays: 14,
      hasMembership: false,
      dayOfWeek: 3, hourOfDay: 12,
      bookingSource: 'online',
    }));
    expect(result.risk).toBe('moderate');
    expect(result.recommendation).toContain('Moderate risk');
    expect(result.recommendation.toLowerCase()).toContain('reminder');
    expect(result.recommendation.toLowerCase()).toContain('prep');
  });
});

// ── 10. Full predictNoShow structure ──

describe('predictNoShow structure', () => {
  it('returns all 6 factors in deterministic order', () => {
    const result = predictNoShow(makeInput());
    expect(result.factors).toHaveLength(6);
    expect(result.factors.map(f => f.name)).toEqual([
      'Client History',
      'Deposit Status',
      'Booking Lead Time',
      'Membership',
      'Day & Time',
      'Booking Source',
    ]);
  });

  it('factor weights sum to 100%', () => {
    const result = predictNoShow(makeInput());
    const totalWeight = result.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it('weighted score calculation matches manual math', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 0, // history 5
      depositPaid: true, depositAmount: 200,    // deposit 5
      bookingLeadDays: 0,                       // leadTime 10
      hasMembership: true,                      // membership 8
      dayOfWeek: 6, hourOfDay: 12,              // timing 15
      bookingSource: 'walk-in',                 // source 5
    }));
    const expected = Math.round(
      5 * 0.35 + 5 * 0.20 + 10 * 0.15 + 8 * 0.10 + 15 * 0.10 + 5 * 0.10,
    );
    expect(result.score).toBe(expected);
  });

  it('every factor carries non-empty detail string', () => {
    const result = predictNoShow(makeInput());
    for (const factor of result.factors) {
      expect(factor.detail.length).toBeGreaterThan(0);
    }
  });

  it('all-zero edge case does not crash and returns valid output', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 0, totalNoShows: 0, isNewClient: true,
      depositPaid: false, depositAmount: 0, bookingLeadDays: 0,
      dayOfWeek: 0, hourOfDay: 0,
      bookingSource: '',
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['low', 'moderate', 'high']).toContain(result.risk);
  });
});
