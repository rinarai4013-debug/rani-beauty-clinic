// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { predictChurn, type ChurnInput, type ChurnScore } from '../engine';

function makeInput(overrides: Partial<ChurnInput> = {}): ChurnInput {
  return {
    daysSinceLastVisit: 10,
    visitDates: [
      new Date(Date.now() - 10 * 86400000).toISOString(),
      new Date(Date.now() - 40 * 86400000).toISOString(),
      new Date(Date.now() - 70 * 86400000).toISOString(),
      new Date(Date.now() - 100 * 86400000).toISOString(),
    ],
    transactionAmounts: [300, 280, 250, 270],
    hasMembership: false,
    totalMessages: 5,
    recentMessageCount: 2,
    status: 'active',
    ...overrides,
  };
}

describe('Churn Prediction Engine', () => {
  // ── Score Range & Structure ──
  it('returns a score between 0 and 100', () => {
    const result = predictChurn(makeInput());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns exactly 5 factors', () => {
    const result = predictChurn(makeInput());
    expect(result.factors).toHaveLength(5);
    expect(result.factors.map(f => f.name)).toEqual([
      'Recency', 'Frequency', 'Monetary', 'Membership', 'Engagement',
    ]);
  });

  it('factor weights sum to 100%', () => {
    const result = predictChurn(makeInput());
    const totalWeight = result.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it('recency weight is 40%', () => {
    const result = predictChurn(makeInput());
    expect(result.factors.find(f => f.name === 'Recency')!.weight).toBe(40);
  });

  // ── Risk Classification ──
  it('classifies low risk (score < 25)', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 3,
      hasMembership: true,
      membershipTier: 'Diamond',
      recentMessageCount: 5,
      totalMessages: 20,
    }));
    expect(result.risk).toBe('low');
    expect(result.score).toBeLessThan(25);
  });

  it('classifies moderate risk (score 25-49)', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 35,
      hasMembership: false,
      totalMessages: 3,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('moderate');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
  });

  it('classifies critical risk (score >= 75)', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 150,
      visitDates: [],
      transactionAmounts: [],
      hasMembership: false,
      totalMessages: 0,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('critical');
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  // ── Edge Case: New Client (0 visits) ──
  it('handles brand-new client with zero visits and zero days', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 0,
      visitDates: [],
      transactionAmounts: [],
      totalMessages: 0,
      recentMessageCount: 0,
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.risk).not.toBe('critical');
  });

  it('new client frequency score is forgiving (not 50)', () => {
    const result = predictChurn(makeInput({
      visitDates: [],
      transactionAmounts: [],
    }));
    const freq = result.factors.find(f => f.name === 'Frequency');
    expect(freq!.score).toBe(30);
    expect(freq!.detail).toContain('No visits');
  });

  // ── Edge Case: 1 Visit Only ──
  it('handles client with exactly 1 visit', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 20,
      visitDates: [new Date(Date.now() - 20 * 86400000).toISOString()],
      transactionAmounts: [250],
    }));
    expect(result.risk).not.toBe('critical');
    const freq = result.factors.find(f => f.name === 'Frequency');
    expect(freq!.score).toBe(20);
  });

  it('single transaction gets forgiving monetary score', () => {
    const result = predictChurn(makeInput({
      transactionAmounts: [500],
    }));
    const monetary = result.factors.find(f => f.name === 'Monetary');
    expect(monetary!.score).toBe(15);
    expect(monetary!.detail).toContain('Single transaction');
  });

  // ── Edge Case: Never-Visited Member ──
  it('membership lowers risk even with no visits', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 0,
      visitDates: [],
      transactionAmounts: [],
      hasMembership: true,
      membershipTier: 'Gold',
      totalMessages: 3,
      recentMessageCount: 1,
    }));
    expect(result.risk).not.toBe('critical');
    const memberFactor = result.factors.find(f => f.name === 'Membership');
    expect(memberFactor!.score).toBe(10);
  });

  // ── Recency Scoring Boundaries ──
  it('recency: -5 days (future date edge) = 0', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: -5 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(0);
  });

  it('recency: 14 days = 5 (recent)', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: 14 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(5);
  });

  it('recency: 30 days = 15 (normal)', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: 30 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(15);
  });

  it('recency: 60 days = 55 (lapsing)', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: 60 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(55);
  });

  it('recency: 120 days = 90 (high risk)', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: 120 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(90);
  });

  it('recency: 200 days = 100 (likely churned)', () => {
    const recency = predictChurn(makeInput({ daysSinceLastVisit: 200 })).factors.find(f => f.name === 'Recency');
    expect(recency!.score).toBe(100);
  });

  // ── Frequency Decline Detection ──
  it('detects sharp frequency decline', () => {
    const now = Date.now();
    const visitDates = [
      new Date(now - 30 * 86400000).toISOString(),
      new Date(now - 100 * 86400000).toISOString(),
      new Date(now - 120 * 86400000).toISOString(),
      new Date(now - 140 * 86400000).toISOString(),
      new Date(now - 160 * 86400000).toISOString(),
    ];
    const freq = predictChurn(makeInput({ visitDates })).factors.find(f => f.name === 'Frequency');
    expect(freq!.score).toBeGreaterThanOrEqual(55);
  });

  it('detects stopped visiting (0 recent vs prior)', () => {
    const now = Date.now();
    const visitDates = [
      new Date(now - 100 * 86400000).toISOString(),
      new Date(now - 130 * 86400000).toISOString(),
      new Date(now - 160 * 86400000).toISOString(),
    ];
    const freq = predictChurn(makeInput({ visitDates })).factors.find(f => f.name === 'Frequency');
    expect(freq!.score).toBe(95);
  });

  // ── Monetary Trend ──
  it('detects spending increase', () => {
    const monetary = predictChurn(makeInput({ transactionAmounts: [500, 480, 200, 180] })).factors.find(f => f.name === 'Monetary');
    expect(monetary!.score).toBe(5);
  });

  it('detects significant spending drop', () => {
    const monetary = predictChurn(makeInput({ transactionAmounts: [50, 60, 300, 350] })).factors.find(f => f.name === 'Monetary');
    expect(monetary!.score).toBe(85);
  });

  // ── Membership Tiers ──
  it('Diamond = 5, Platinum = 8, Gold = 10, Silver = 15, Bronze = 20', () => {
    const tiers = [
      ['Diamond', 5], ['Platinum', 8], ['Gold', 10], ['Silver', 15], ['Bronze', 20],
    ] as const;
    for (const [tier, expected] of tiers) {
      const m = predictChurn(makeInput({ hasMembership: true, membershipTier: tier })).factors.find(f => f.name === 'Membership');
      expect(m!.score).toBe(expected);
    }
  });

  it('non-member = 60', () => {
    const m = predictChurn(makeInput({ hasMembership: false })).factors.find(f => f.name === 'Membership');
    expect(m!.score).toBe(60);
  });

  // ── Engagement ──
  it('3+ recent messages = highly engaged (5)', () => {
    const e = predictChurn(makeInput({ totalMessages: 10, recentMessageCount: 3 })).factors.find(f => f.name === 'Engagement');
    expect(e!.score).toBe(5);
  });

  it('previously engaged but now quiet = 45', () => {
    const e = predictChurn(makeInput({ totalMessages: 10, recentMessageCount: 0 })).factors.find(f => f.name === 'Engagement');
    expect(e!.score).toBe(45);
  });

  // ── Recommendations ──
  it('low risk gets healthy recommendation', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 3, hasMembership: true, membershipTier: 'Diamond',
      recentMessageCount: 5, totalMessages: 20,
    }));
    expect(result.recommendation).toContain('engaged and healthy');
  });

  it('critical non-member gets URGENT with membership pitch', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 150, visitDates: [], transactionAmounts: [],
      hasMembership: false, totalMessages: 0, recentMessageCount: 0,
    }));
    expect(result.recommendation).toContain('URGENT');
    expect(result.recommendation).toContain('membership');
  });

  it('critical member gets provider outreach recommendation', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 150, visitDates: [], transactionAmounts: [],
      hasMembership: true, membershipTier: 'Gold', totalMessages: 0, recentMessageCount: 0,
    }));
    expect(result.recommendation).toContain('URGENT');
    expect(result.recommendation).toContain('Personal outreach');
  });

  // ── Score Clamping ──
  it('score is clamped at 100 maximum', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 999, visitDates: [], transactionAmounts: [],
      hasMembership: false, totalMessages: 0, recentMessageCount: 0,
    }));
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score is clamped at 0 minimum', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 0, hasMembership: true, membershipTier: 'Diamond',
      recentMessageCount: 10, totalMessages: 100,
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
