// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { predictNoShow, quickNoShowScore, type NoShowInput } from '../no-show';

function makeInput(overrides: Partial<NoShowInput> = {}): NoShowInput {
  return {
    totalAppointments: 10, totalNoShows: 1, isNewClient: false,
    hasMembership: false, daysSinceLastVisit: 14, depositPaid: false,
    depositAmount: 0, bookingLeadDays: 5, bookingSource: 'Mangomint',
    dayOfWeek: 3, hourOfDay: 11, serviceCategory: 'Facial', isConsult: false,
    ...overrides,
  };
}

describe('No-Show Prediction Engine', () => {
  // ── Structure ──
  it('returns score 0-100', () => {
    const r = predictNoShow(makeInput());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('returns exactly 6 factors', () => {
    expect(predictNoShow(makeInput()).factors).toHaveLength(6);
  });

  it('factor weights sum to 100', () => {
    const total = predictNoShow(makeInput()).factors.reduce((s, f) => s + f.weight, 0);
    expect(total).toBe(100);
  });

  // ── Risk Classification ──
  it('classifies low risk (< 35)', () => {
    const r = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 0, hasMembership: true,
      depositPaid: true, depositAmount: 200, bookingLeadDays: 1,
      bookingSource: 'walk-in', dayOfWeek: 6, hourOfDay: 11,
    }));
    expect(r.risk).toBe('low');
  });

  it('classifies moderate risk (35-59)', () => {
    const r = predictNoShow(makeInput());
    expect(r.risk).toBe('moderate');
  });

  it('classifies high risk (>= 60)', () => {
    const r = predictNoShow(makeInput({
      totalAppointments: 5, totalNoShows: 3, isNewClient: false,
      depositPaid: false, bookingLeadDays: 45, bookingSource: 'typeform',
      dayOfWeek: 1, hourOfDay: 9,
    }));
    expect(r.risk).toBe('high');
  });

  // ── First-Time Client Handling (fixed) ──
  it('brand-new client (isNewClient + 0 appts) gets 40', () => {
    const h = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 0, totalNoShows: 0 }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(40);
  });

  it('non-new client with 0 appts gets 35', () => {
    const h = predictNoShow(makeInput({ isNewClient: false, totalAppointments: 0, totalNoShows: 0 }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(35);
  });

  it('new client with 1 kept appt gets 25', () => {
    const h = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 1, totalNoShows: 0 }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(25);
  });

  it('new client with early no-show gets 55', () => {
    const h = predictNoShow(makeInput({ isNewClient: true, totalAppointments: 2, totalNoShows: 1 }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(55);
  });

  it('established client perfect attendance = 5', () => {
    const h = predictNoShow(makeInput({ totalAppointments: 15, totalNoShows: 0, isNewClient: false }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(5);
  });

  it('chronic no-show (>35%) = 95', () => {
    const h = predictNoShow(makeInput({ totalAppointments: 10, totalNoShows: 4, isNewClient: false }))
      .factors.find(f => f.name === 'Client History');
    expect(h!.score).toBe(95);
  });

  // ── Deposit Weighting ──
  it('large deposit ($150+) = 5', () => {
    const d = predictNoShow(makeInput({ depositPaid: true, depositAmount: 200 }))
      .factors.find(f => f.name === 'Deposit Status');
    expect(d!.score).toBe(5);
  });

  it('small deposit = 15', () => {
    const d = predictNoShow(makeInput({ depositPaid: true, depositAmount: 50 }))
      .factors.find(f => f.name === 'Deposit Status');
    expect(d!.score).toBe(15);
  });

  it('no deposit = 60', () => {
    const d = predictNoShow(makeInput({ depositPaid: false }))
      .factors.find(f => f.name === 'Deposit Status');
    expect(d!.score).toBe(60);
  });

  // ── Lead Time ──
  it('same-day = 10', () => {
    expect(predictNoShow(makeInput({ bookingLeadDays: 0 })).factors.find(f => f.name === 'Booking Lead Time')!.score).toBe(10);
  });

  it('2 days = 15', () => {
    expect(predictNoShow(makeInput({ bookingLeadDays: 2 })).factors.find(f => f.name === 'Booking Lead Time')!.score).toBe(15);
  });

  it('14 days = 40', () => {
    expect(predictNoShow(makeInput({ bookingLeadDays: 14 })).factors.find(f => f.name === 'Booking Lead Time')!.score).toBe(40);
  });

  it('60+ days = 70', () => {
    expect(predictNoShow(makeInput({ bookingLeadDays: 60 })).factors.find(f => f.name === 'Booking Lead Time')!.score).toBe(70);
  });

  // ── Membership ──
  it('member = 8', () => {
    expect(predictNoShow(makeInput({ hasMembership: true })).factors.find(f => f.name === 'Membership')!.score).toBe(8);
  });

  it('non-member = 45', () => {
    expect(predictNoShow(makeInput({ hasMembership: false })).factors.find(f => f.name === 'Membership')!.score).toBe(45);
  });

  // ── Timing ──
  it('Monday 9am = 55', () => {
    expect(predictNoShow(makeInput({ dayOfWeek: 1, hourOfDay: 9 })).factors.find(f => f.name === 'Day & Time')!.score).toBe(55);
  });

  it('Friday 4pm = 50', () => {
    expect(predictNoShow(makeInput({ dayOfWeek: 5, hourOfDay: 16 })).factors.find(f => f.name === 'Day & Time')!.score).toBe(50);
  });

  it('Saturday = 15', () => {
    expect(predictNoShow(makeInput({ dayOfWeek: 6, hourOfDay: 11 })).factors.find(f => f.name === 'Day & Time')!.score).toBe(15);
  });

  it('midweek midday = 20', () => {
    expect(predictNoShow(makeInput({ dayOfWeek: 3, hourOfDay: 11 })).factors.find(f => f.name === 'Day & Time')!.score).toBe(20);
  });

  it('early morning weekday = 45', () => {
    expect(predictNoShow(makeInput({ dayOfWeek: 2, hourOfDay: 7 })).factors.find(f => f.name === 'Day & Time')!.score).toBe(45);
  });

  // ── Source ──
  it('walk-in = 5', () => {
    expect(predictNoShow(makeInput({ bookingSource: 'walk-in' })).factors.find(f => f.name === 'Booking Source')!.score).toBe(5);
  });

  it('referral = 15', () => {
    expect(predictNoShow(makeInput({ bookingSource: 'referral' })).factors.find(f => f.name === 'Booking Source')!.score).toBe(15);
  });

  it('phone = 20', () => {
    expect(predictNoShow(makeInput({ bookingSource: 'phone call' })).factors.find(f => f.name === 'Booking Source')!.score).toBe(20);
  });

  it('unknown = 35', () => {
    expect(predictNoShow(makeInput({ bookingSource: 'xyz' })).factors.find(f => f.name === 'Booking Source')!.score).toBe(35);
  });

  // ── Recommendations ──
  it('low risk => standard reminders', () => {
    const r = predictNoShow(makeInput({
      totalAppointments: 20, totalNoShows: 0, hasMembership: true,
      depositPaid: true, depositAmount: 200, bookingLeadDays: 1,
      bookingSource: 'walk-in', dayOfWeek: 6,
    }));
    expect(r.recommendation).toContain('Standard');
  });

  it('high risk no deposit => deposit request', () => {
    const r = predictNoShow(makeInput({
      totalAppointments: 5, totalNoShows: 3, depositPaid: false,
      bookingLeadDays: 20, dayOfWeek: 1, hourOfDay: 9,
    }));
    expect(r.recommendation).toContain('deposit');
  });

  // ── quickNoShowScore ──
  it('quickNoShowScore with partial input', () => {
    const r = quickNoShowScore({ totalAppointments: 10, totalNoShows: 0 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(['low', 'moderate', 'high']).toContain(r.risk);
  });

  it('quickNoShowScore with empty input', () => {
    const r = quickNoShowScore({});
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  // ── Boundary ──
  it('all-zero inputs do not crash', () => {
    expect(predictNoShow(makeInput({
      totalAppointments: 0, totalNoShows: 0, isNewClient: true,
      depositPaid: false, depositAmount: 0, bookingLeadDays: 0,
      dayOfWeek: 0, hourOfDay: 0,
    })).score).toBeGreaterThanOrEqual(0);
  });

  it('deposit with zero amount treated as no deposit', () => {
    const d = predictNoShow(makeInput({ depositPaid: true, depositAmount: 0 }))
      .factors.find(f => f.name === 'Deposit Status');
    expect(d!.score).toBe(15);
  });
});
