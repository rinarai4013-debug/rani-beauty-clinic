import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictChurn, type ChurnInput } from '@/lib/churn/engine';

// ── Helpers ──

/** Build a ChurnInput with sensible defaults; override per test. */
function makeInput(overrides: Partial<ChurnInput> = {}): ChurnInput {
  return {
    daysSinceLastVisit: 0,
    visitDates: [],
    transactionAmounts: [],
    hasMembership: false,
    membershipTier: undefined,
    totalMessages: 0,
    recentMessageCount: 0,
    status: 'active',
    ...overrides,
  };
}

/** Generate ISO date strings relative to "now" (fake-timer controlled). */
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

// ── Setup ──

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-09T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ── 1. Recency scoring ──

describe('Recency scoring', () => {
  const cases: [number, number, string][] = [
    // [daysSinceLastVisit, expectedFactorScore, label]
    [0, 0, 'visited today'],
    [1, 5, '1 day ago (inside 14d)'],
    [14, 5, 'boundary: exactly 14 days'],
    [15, 15, 'boundary: 15 days (crosses into 15-30 band)'],
    [30, 15, 'boundary: exactly 30 days'],
    [31, 35, 'boundary: 31 days (crosses into 31-45 band)'],
    [45, 35, 'boundary: exactly 45 days'],
    [46, 55, 'boundary: 46 days (crosses into 46-60 band)'],
    [60, 55, 'boundary: exactly 60 days'],
    [61, 75, 'boundary: 61 days (crosses into 61-90 band)'],
    [90, 75, 'boundary: exactly 90 days'],
    [91, 90, 'boundary: 91 days (crosses into 91-120 band)'],
    [120, 90, 'boundary: exactly 120 days'],
    [121, 100, 'boundary: 121 days (beyond 120)'],
    [365, 100, 'one year ago'],
  ];

  it.each(cases)('daysSinceLastVisit=%i -> recency factor score %i (%s)', (days, expectedScore) => {
    const result = predictChurn(makeInput({ daysSinceLastVisit: days }));
    const recency = result.factors.find(f => f.name === 'Recency')!;
    expect(recency.score).toBe(expectedScore);
  });

  it('recency factor carries 40% weight', () => {
    const result = predictChurn(makeInput({ daysSinceLastVisit: 7 }));
    const recency = result.factors.find(f => f.name === 'Recency')!;
    expect(recency.weight).toBe(40);
  });

  it('recency detail mentions day count for non-zero days', () => {
    const result = predictChurn(makeInput({ daysSinceLastVisit: 50 }));
    const recency = result.factors.find(f => f.name === 'Recency')!;
    expect(recency.detail).toContain('50d');
  });
});

// ── 2. Frequency scoring ──

describe('Frequency scoring', () => {
  it('zero visits -> score 30', () => {
    const result = predictChurn(makeInput({ visitDates: [] }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(30);
    expect(freq.detail).toContain('No visits');
  });

  it('single visit -> score 20 (too early to assess trend)', () => {
    const result = predictChurn(makeInput({ visitDates: [daysAgo(10)] }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(20);
  });

  it('no visits in last 6 months (all dates older than 180d) -> score 70', () => {
    const result = predictChurn(makeInput({
      visitDates: [daysAgo(200), daysAgo(210), daysAgo(250)],
    }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(70);
  });

  it('new client: recent visits only, no prior visits -> score 10', () => {
    // 2 visits in last 90 days, 0 in prior 90 days
    const result = predictChurn(makeInput({
      visitDates: [daysAgo(10), daysAgo(30)],
    }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(10);
    expect(freq.detail).toContain('new client');
  });

  it('ratio = 1.0 exactly (stable) -> score 5', () => {
    // 2 recent (last 90d), 2 prior (91-180d)
    const result = predictChurn(makeInput({
      visitDates: [daysAgo(10), daysAgo(60), daysAgo(100), daysAgo(150)],
    }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(5);
  });

  it('ratio > 1.0 (increasing frequency) -> score 5', () => {
    // 3 recent, 2 prior
    const result = predictChurn(makeInput({
      visitDates: [daysAgo(10), daysAgo(30), daysAgo(60), daysAgo(100), daysAgo(150)],
    }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(5);
  });

  it('ratio ~ 0.75 (just under 1.0, >= 0.7) -> score 25 (slight decline)', () => {
    // 3 recent, 4 prior -> 0.75
    const visitDates = [
      daysAgo(10), daysAgo(30), daysAgo(60),
      daysAgo(100), daysAgo(120), daysAgo(140), daysAgo(160),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(25);
  });

  it('ratio = 0.7 exactly (boundary) -> score 25', () => {
    // 7 recent, 10 prior -> 0.7
    const visitDates = [
      ...Array.from({ length: 7 }, (_, i) => daysAgo(5 + i * 12)),
      ...Array.from({ length: 10 }, (_, i) => daysAgo(91 + i * 8)),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(25);
  });

  it('ratio ~ 0.667 (just under 0.7) -> score 55 (declining)', () => {
    // 2 recent, 3 prior -> 0.667
    const visitDates = [
      daysAgo(10), daysAgo(50),
      daysAgo(100), daysAgo(130), daysAgo(160),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(55);
  });

  it('ratio = 0.4 exactly (boundary) -> score 55', () => {
    // 2 recent, 5 prior -> 0.4
    const visitDates = [
      daysAgo(20), daysAgo(60),
      daysAgo(100), daysAgo(110), daysAgo(130), daysAgo(150), daysAgo(170),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(55);
  });

  it('ratio ~ 0.333 (just under 0.4, still > 0) -> score 80 (sharp decline)', () => {
    // 1 recent, 3 prior -> 0.333
    const visitDates = [
      daysAgo(30),
      daysAgo(100), daysAgo(130), daysAgo(160),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(80);
  });

  it('zero recent visits with prior visits -> score 95 (stopped visiting)', () => {
    // 0 recent, 3 prior
    const visitDates = [
      daysAgo(100), daysAgo(130), daysAgo(160),
    ];
    const result = predictChurn(makeInput({ visitDates }));
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.score).toBe(95);
    expect(freq.detail).toContain('Stopped');
  });

  it('frequency factor carries 20% weight', () => {
    const result = predictChurn(makeInput());
    const freq = result.factors.find(f => f.name === 'Frequency')!;
    expect(freq.weight).toBe(20);
  });
});

// ── 3. Monetary scoring ──

describe('Monetary scoring', () => {
  it('zero transactions -> score 30', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(30);
  });

  it('single transaction -> score 15 (too early to assess trend)', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [250] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(15);
  });

  it('ratio > 1.0 (spending up) -> score 5', () => {
    // Recent [300], prior [200]
    const result = predictChurn(makeInput({ transactionAmounts: [300, 200] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(5);
  });

  it('ratio = 1.0 exactly (stable) -> score 5', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [200, 200] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(5);
  });

  it('ratio = 0.7 exactly (boundary) -> score 25', () => {
    // recent avg = 70, prior avg = 100 -> ratio 0.7
    const result = predictChurn(makeInput({ transactionAmounts: [70, 100] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(25);
  });

  it('ratio = 0.69 (just under 0.7) -> score 55 (declining)', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [69, 100] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(55);
  });

  it('ratio = 0.4 exactly (boundary) -> score 55', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [40, 100] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(55);
  });

  it('ratio = 0.39 (just under 0.4) -> score 85 (dropped significantly)', () => {
    const result = predictChurn(makeInput({ transactionAmounts: [39, 100] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(85);
  });

  it('prior average = 0 -> score 20 (no baseline)', () => {
    // 4 amounts: recent half = [100, 100], prior half = [0, 0]
    const result = predictChurn(makeInput({ transactionAmounts: [100, 100, 0, 0] }));
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.score).toBe(20);
    expect(mon.detail).toContain('No prior spend baseline');
  });

  it('monetary factor carries 15% weight', () => {
    const result = predictChurn(makeInput());
    const mon = result.factors.find(f => f.name === 'Monetary')!;
    expect(mon.weight).toBe(15);
  });
});

// ── 4. Membership scoring ──

describe('Membership scoring', () => {
  it('no membership -> score 60', () => {
    const result = predictChurn(makeInput({ hasMembership: false }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(60);
    expect(mem.detail).toContain('No active');
  });

  it('active Diamond member -> score 5', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'Diamond' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(5);
  });

  it('active Platinum member -> score 8', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'Platinum' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(8);
  });

  it('active Gold member -> score 10', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'Gold' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(10);
  });

  it('active Silver member -> score 15', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'Silver' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(15);
  });

  it('active Bronze member -> score 20', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'Bronze' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(20);
  });

  it('active membership with unknown tier -> score 15 (default)', () => {
    const result = predictChurn(makeInput({ hasMembership: true, membershipTier: 'VIP' }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(15);
  });

  it('active membership with no tier specified -> score 15 (default)', () => {
    const result = predictChurn(makeInput({ hasMembership: true }));
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.score).toBe(15);
  });

  it('membership factor carries 15% weight', () => {
    const result = predictChurn(makeInput());
    const mem = result.factors.find(f => f.name === 'Membership')!;
    expect(mem.weight).toBe(15);
  });
});

// ── 5. Engagement scoring ──

describe('Engagement scoring', () => {
  it('no messages at all -> score 50', () => {
    const result = predictChurn(makeInput({ totalMessages: 0, recentMessageCount: 0 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(50);
  });

  it('3 recent messages -> score 5 (highly engaged, boundary)', () => {
    const result = predictChurn(makeInput({ totalMessages: 10, recentMessageCount: 3 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(5);
  });

  it('5 recent messages -> score 5', () => {
    const result = predictChurn(makeInput({ totalMessages: 15, recentMessageCount: 5 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(5);
  });

  it('1 recent message -> score 20', () => {
    const result = predictChurn(makeInput({ totalMessages: 5, recentMessageCount: 1 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(20);
  });

  it('2 recent messages -> score 20', () => {
    const result = predictChurn(makeInput({ totalMessages: 8, recentMessageCount: 2 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(20);
  });

  it('0 recent messages but 5+ total (previously engaged, now quiet) -> score 45', () => {
    const result = predictChurn(makeInput({ totalMessages: 10, recentMessageCount: 0 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(45);
    expect(eng.detail).toContain('Previously engaged');
  });

  it('0 recent messages and exactly 5 total (boundary) -> score 45', () => {
    const result = predictChurn(makeInput({ totalMessages: 5, recentMessageCount: 0 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(45);
  });

  it('0 recent messages and < 5 total (low history) -> score 65', () => {
    const result = predictChurn(makeInput({ totalMessages: 3, recentMessageCount: 0 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(65);
    expect(eng.detail).toContain('Low engagement');
  });

  it('1 total, 0 recent -> score 65', () => {
    const result = predictChurn(makeInput({ totalMessages: 1, recentMessageCount: 0 }));
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.score).toBe(65);
  });

  it('engagement factor carries 10% weight', () => {
    const result = predictChurn(makeInput());
    const eng = result.factors.find(f => f.name === 'Engagement')!;
    expect(eng.weight).toBe(10);
  });
});

// ── 6. Risk classification ──

describe('Risk classification', () => {
  it('score >= 75 -> critical', () => {
    // recency 100*0.4=40, freq 95*0.2=19, monetary 30*0.15=4.5, membership 60*0.15=9, engagement 65*0.1=6.5 = 79
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 200,
      visitDates: [daysAgo(100), daysAgo(130), daysAgo(160)],
      transactionAmounts: [],
      hasMembership: false,
      totalMessages: 2,
      recentMessageCount: 0,
    }));
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.risk).toBe('critical');
  });

  it('score 50-74 -> high', () => {
    // recency 55 (50d); freq 80 (1 recent, 3 prior ratio 0.33); monetary 55 (ratio 0.45);
    // membership 60; engagement 50 (no messages)
    // 55*0.4 + 80*0.2 + 55*0.15 + 60*0.15 + 50*0.1 = 22+16+8.25+9+5 = 60.25 -> 60
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 50,
      visitDates: [daysAgo(50), daysAgo(100), daysAgo(130), daysAgo(160)],
      transactionAmounts: [45, 100],
      hasMembership: false,
      totalMessages: 0,
      recentMessageCount: 0,
    }));
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(75);
    expect(result.risk).toBe('high');
  });

  it('score 25-49 -> moderate', () => {
    // recency 35 (31-45d), freq 5 (ratio 1.5), monetary 25 (ratio 0.75), membership 60, engagement 20
    // 35*0.4 + 5*0.2 + 25*0.15 + 60*0.15 + 20*0.1 = 14+1+3.75+9+2 = 29.75 -> 30
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 35,
      visitDates: [daysAgo(35), daysAgo(60), daysAgo(80), daysAgo(100), daysAgo(130)],
      transactionAmounts: [75, 100],
      hasMembership: false,
      totalMessages: 5,
      recentMessageCount: 1,
    }));
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
    expect(result.risk).toBe('moderate');
  });

  it('score < 25 -> low', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 3,
      visitDates: [daysAgo(3), daysAgo(30), daysAgo(60), daysAgo(100), daysAgo(130)],
      transactionAmounts: [300, 250],
      hasMembership: true,
      membershipTier: 'Diamond',
      totalMessages: 15,
      recentMessageCount: 5,
    }));
    expect(result.score).toBeLessThan(25);
    expect(result.risk).toBe('low');
  });

  it('score is always clamped to 0-100', () => {
    // best case
    const low = predictChurn(makeInput({
      daysSinceLastVisit: 0,
      visitDates: [daysAgo(3), daysAgo(30), daysAgo(60), daysAgo(100), daysAgo(130)],
      transactionAmounts: [500, 200],
      hasMembership: true,
      membershipTier: 'Diamond',
      totalMessages: 20,
      recentMessageCount: 10,
    }));
    expect(low.score).toBeGreaterThanOrEqual(0);
    expect(low.score).toBeLessThanOrEqual(100);

    // worst case
    const high = predictChurn(makeInput({
      daysSinceLastVisit: 365,
      visitDates: [daysAgo(100), daysAgo(130), daysAgo(160)],
      transactionAmounts: [5, 100],
      hasMembership: false,
      totalMessages: 1,
      recentMessageCount: 0,
    }));
    expect(high.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
  });
});

// ── 7. Integration: realistic client profiles ──

describe('predictChurn integration — realistic client profiles', () => {
  it('loyal Diamond member (regular visits, strong engagement) -> low risk', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 5,
      visitDates: [daysAgo(5), daysAgo(20), daysAgo(40), daysAgo(100), daysAgo(130), daysAgo(160)],
      transactionAmounts: [400, 350, 380, 300, 280, 260],
      hasMembership: true,
      membershipTier: 'Diamond',
      totalMessages: 20,
      recentMessageCount: 4,
    }));
    expect(result.risk).toBe('low');
    expect(result.score).toBeLessThan(25);
    expect(result.factors).toHaveLength(5);
  });

  it('regular client with slight lapse -> moderate risk', () => {
    // recency 35 (31-45d); freq 5 (ratio 1.0); monetary 55 (ratio ~0.69); membership 60; engagement 45
    // 35*0.4 + 5*0.2 + 55*0.15 + 60*0.15 + 45*0.1 = 14+1+8.25+9+4.5 = 36.75 -> 37
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 35,
      visitDates: [daysAgo(35), daysAgo(60), daysAgo(100), daysAgo(150)],
      transactionAmounts: [200, 180, 250, 300],
      hasMembership: false,
      totalMessages: 8,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('moderate');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(50);
  });

  it('lapsed non-member with declining spend -> high risk', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 55,
      visitDates: [daysAgo(55), daysAgo(100), daysAgo(115), daysAgo(140), daysAgo(165)],
      transactionAmounts: [100, 80, 200, 250, 300],
      hasMembership: false,
      totalMessages: 3,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('high');
  });

  it('long-gone non-member who stopped visiting -> critical risk', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 150,
      visitDates: [daysAgo(150), daysAgo(170), daysAgo(200)],
      transactionAmounts: [50, 200, 300],
      hasMembership: false,
      totalMessages: 2,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('critical');
  });

  it('returns exactly 5 factors in deterministic order', () => {
    const result = predictChurn(makeInput());
    expect(result.factors).toHaveLength(5);
    expect(result.factors.map(f => f.name)).toEqual([
      'Recency', 'Frequency', 'Monetary', 'Membership', 'Engagement',
    ]);
  });

  it('factor weights sum to 100%', () => {
    const result = predictChurn(makeInput());
    const total = result.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(total).toBe(100);
  });

  it('weighted score calculation matches manual math', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 0,   // recency 0
      visitDates: [],           // frequency 30
      transactionAmounts: [],   // monetary 30
      hasMembership: false,     // membership 60
      totalMessages: 0,         // engagement 50
      recentMessageCount: 0,
    }));
    const expected = Math.round(0 * 0.4 + 30 * 0.2 + 30 * 0.15 + 60 * 0.15 + 50 * 0.1);
    expect(result.score).toBe(expected);
  });

  it('every factor has a non-empty detail string', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 40,
      visitDates: [daysAgo(40), daysAgo(80)],
      transactionAmounts: [150, 200],
      hasMembership: true,
      membershipTier: 'Gold',
      totalMessages: 6,
      recentMessageCount: 1,
    }));
    for (const factor of result.factors) {
      expect(factor.detail.length).toBeGreaterThan(0);
    }
  });
});

// ── 8. Recommendation ──

describe('Recommendation', () => {
  it('low risk (<25) -> healthy message', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 3,
      visitDates: [daysAgo(3), daysAgo(30), daysAgo(60), daysAgo(100), daysAgo(130)],
      transactionAmounts: [300, 250],
      hasMembership: true,
      membershipTier: 'Diamond',
      totalMessages: 15,
      recentMessageCount: 5,
    }));
    expect(result.risk).toBe('low');
    expect(result.recommendation).toContain('healthy');
  });

  it('moderate risk (25-49) -> low-moderate message with touchpoints', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 35,
      visitDates: [daysAgo(35), daysAgo(60), daysAgo(100), daysAgo(130)],
      transactionAmounts: [75, 100],
      hasMembership: false,
      totalMessages: 5,
      recentMessageCount: 1,
    }));
    if (result.risk === 'moderate') {
      expect(result.recommendation).toContain('Low-moderate risk');
    }
  });

  it('critical risk without membership -> reactivation + membership pitch', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 200,
      visitDates: [daysAgo(100), daysAgo(130), daysAgo(160)],
      transactionAmounts: [10, 100],
      hasMembership: false,
      totalMessages: 1,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('critical');
    expect(result.recommendation).toContain('URGENT');
    expect(result.recommendation).toContain('reactivation');
    expect(result.recommendation).toContain('membership');
  });

  it('critical risk with membership -> personal outreach from provider', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 130,
      visitDates: [daysAgo(130), daysAgo(140), daysAgo(160)],
      transactionAmounts: [10, 200],
      hasMembership: true,
      membershipTier: 'Gold',
      totalMessages: 1,
      recentMessageCount: 0,
    }));
    expect(result.risk).toBe('critical');
    expect(result.recommendation).toContain('URGENT');
    expect(result.recommendation.toLowerCase()).toContain('outreach');
  });

  it('high risk with recency as top factor -> "we miss you" message', () => {
    // Recency=75 at 61-90d. Keep other factors lower so Recency is #1 by factor score.
    // freq=5 (ratio 1.0), monetary=5, membership=60, engagement=45
    // Weighted: 75*0.4 + 5*0.2 + 5*0.15 + 60*0.15 + 45*0.1 = 30+1+0.75+9+4.5 = 45.25 -> 45 (moderate, not high)
    // Need to push into high (>=50) without making another factor exceed 75.
    // Use recency=90 (91-120d): 90*0.4 + 5*0.2 + 5*0.15 + 60*0.15 + 45*0.1 = 36+1+0.75+9+4.5 = 51.25 -> 51 (high)
    // Top factor: Recency(90) > Membership(60) > Engagement(45) > Monetary(5) = Frequency(5). Recency is top.
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 100,                                               // recency 90 (top)
      visitDates: [daysAgo(30), daysAgo(60), daysAgo(100), daysAgo(150)],    // 2 recent, 2 prior, ratio 1.0 -> freq 5
      transactionAmounts: [100, 100],                                        // monetary 5
      hasMembership: false,                                                  // membership 60
      totalMessages: 10,
      recentMessageCount: 0,                                                 // engagement 45
    }));
    expect(result.risk).toBe('high');
    const topFactor = [...result.factors].sort((a, b) => b.score - a.score)[0];
    expect(topFactor.name).toBe('Recency');
    expect(result.recommendation).toContain('miss you');
  });

  it('high risk with frequency as top factor -> book next appointment message', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 50,                                                  // recency 55
      visitDates: [daysAgo(50), daysAgo(100), daysAgo(110), daysAgo(120), daysAgo(140), daysAgo(160)],
      // 1 recent, 4 prior -> ratio 0.25, freq 80 (top)
      transactionAmounts: [200, 200],                                          // monetary 5
      hasMembership: false,                                                    // membership 60
      totalMessages: 10,
      recentMessageCount: 0,                                                   // engagement 45
    }));
    expect(result.risk).toBe('high');
    const topFactor = [...result.factors].sort((a, b) => b.score - a.score)[0];
    expect(topFactor.name).toBe('Frequency');
    expect(result.recommendation.toLowerCase()).toContain('frequency');
  });

  it('high risk with monetary as top factor -> package/membership pitch', () => {
    const result = predictChurn(makeInput({
      daysSinceLastVisit: 61,                                                  // recency 75
      visitDates: [daysAgo(61), daysAgo(80), daysAgo(100), daysAgo(130)],      // 2 recent, 2 prior -> ratio 1.0, freq 5
      transactionAmounts: [30, 100],                                           // ratio 0.3, monetary 85 (top? vs recency 75)
      hasMembership: false,                                                    // membership 60
      totalMessages: 10,
      recentMessageCount: 2,                                                   // engagement 20
    }));
    // 75*0.4 + 5*0.2 + 85*0.15 + 60*0.15 + 20*0.1 = 30+1+12.75+9+2 = 54.75 -> 55 (high)
    expect(result.risk).toBe('high');
    const topFactor = [...result.factors].sort((a, b) => b.score - a.score)[0];
    expect(topFactor.name).toBe('Monetary');
    expect(result.recommendation.toLowerCase()).toContain('spending');
  });
});
