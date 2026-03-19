import { describe, it, expect } from 'vitest';
import { predictChurn, ChurnInput } from '../engine';

function makeInput(overrides: Partial<ChurnInput> = {}): ChurnInput {
  return {
    daysSinceLastVisit: 7,
    visitDates: [],
    transactionAmounts: [],
    hasMembership: false,
    totalMessages: 0,
    recentMessageCount: 0,
    status: 'active',
    ...overrides,
  };
}

describe('predictChurn', () => {
  it('scores a healthy, engaged client as low risk', () => {
    const now = new Date();
    const dates = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 14); // every 2 weeks for ~4 months
      return d.toISOString();
    });
    const amounts = [350, 300, 400, 350, 280, 300, 350, 320];

    const result = predictChurn(makeInput({
      daysSinceLastVisit: 5,
      visitDates: dates,
      transactionAmounts: amounts,
      hasMembership: true,
      membershipTier: 'Gold',
      totalMessages: 10,
      recentMessageCount: 4,
    }));

    expect(result.score).toBeLessThan(25);
    expect(result.risk).toBe('low');
    expect(result.factors).toHaveLength(5);
    expect(result.recommendation).toContain('healthy');
  });

  it('scores a lapsed client with no membership as high/critical risk', () => {
    const now = new Date();
    // All visits were 4-6 months ago (prior period), none recent
    const dates = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 120 - i * 14);
      return d.toISOString();
    });
    const amounts = [200, 150, 100, 50]; // declining spend

    const result = predictChurn(makeInput({
      daysSinceLastVisit: 130,
      visitDates: dates,
      transactionAmounts: amounts,
      hasMembership: false,
      totalMessages: 3,
      recentMessageCount: 0,
    }));

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(['high', 'critical']).toContain(result.risk);
    expect(result.recommendation).not.toContain('healthy');
  });

  it('handles empty visit dates gracefully', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 30,
      visitDates: [],
      transactionAmounts: [],
    }));

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.risk).toBeDefined();
    // Frequency should report "too few visits" with score 50
    const freqFactor = result.factors.find(f => f.name === 'Frequency');
    expect(freqFactor?.detail).toContain('Too few');
  });

  it('handles zero transactions gracefully', () => {
    const result = predictChurn(makeInput({
      transactionAmounts: [],
    }));

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    const moneyFactor = result.factors.find(f => f.name === 'Monetary');
    expect(moneyFactor?.detail).toContain('Too few');
  });
});
