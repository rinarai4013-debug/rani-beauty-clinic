import { describe, it, expect } from 'vitest';
import { predictNoShow, quickNoShowScore, NoShowInput } from '../no-show';

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
    bookingSource: 'phone',
    dayOfWeek: 3, // Wednesday
    hourOfDay: 12, // Noon
    serviceCategory: 'facial',
    isConsult: false,
    ...overrides,
  };
}

describe('predictNoShow', () => {
  it('returns lower score when deposit is paid', () => {
    const withDeposit = predictNoShow(makeInput({
      depositPaid: true,
      depositAmount: 200,
    }));
    const withoutDeposit = predictNoShow(makeInput({
      depositPaid: false,
      depositAmount: 0,
    }));

    expect(withDeposit.score).toBeLessThan(withoutDeposit.score);
    const depositFactor = withDeposit.factors.find(f => f.name === 'Deposit Status');
    expect(depositFactor?.score).toBe(5); // $200 >= $150
  });

  it('flags chronic no-show history as high risk', () => {
    const result = predictNoShow(makeInput({
      totalAppointments: 10,
      totalNoShows: 5, // 50% no-show rate
      isNewClient: false,
    }));

    expect(result.score).toBeGreaterThanOrEqual(35);
    const historyFactor = result.factors.find(f => f.name === 'Client History');
    expect(historyFactor?.score).toBe(95); // >= 35% rate
    expect(historyFactor?.detail).toContain('Chronic');
  });

  it('scores new client with no deposit as moderate+ risk', () => {
    const result = predictNoShow(makeInput({
      isNewClient: true,
      totalAppointments: 0,
      totalNoShows: 0,
      depositPaid: false,
      hasMembership: false,
    }));

    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(['moderate', 'high']).toContain(result.risk);
  });
});

describe('quickNoShowScore', () => {
  it('returns score and risk with minimal input', () => {
    const result = quickNoShowScore({
      totalAppointments: 5,
      totalNoShows: 0,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['low', 'moderate', 'high']).toContain(result.risk);
  });

  it('returns a result even with empty input', () => {
    const result = quickNoShowScore({});

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.risk).toBeDefined();
  });
});
