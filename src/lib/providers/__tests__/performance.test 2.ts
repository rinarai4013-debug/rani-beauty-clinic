// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateProviderRevenue,
  calculateRevenuePerHour,
  calculateAvgTicketSize,
  analyzeServiceMix,
  calculateClientRetentionRate,
  calculateRebookRate,
  calculateNoShowRate,
  calculateNewClientConversionRate,
  calculateUpsellRate,
  calculateUtilizationRate,
  calculateAvgReviewRating,
  calculateTreatmentOutcomeScore,
  calculatePerformanceMetrics,
  compareProviders,
  analyzeTrend,
  calculatePercentile,
  getPercentileRankings,
  type PerformanceInput,
  type AppointmentRecord,
  type TransactionRecord,
  type ReviewRecord,
} from '../performance';

// ── HELPERS ──

function makeAppointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: 'appt-1',
    date: '2026-03-15',
    service: 'Botox',
    category: 'Injectable',
    duration: 60,
    status: 'completed',
    clientId: 'client-1',
    revenue: 500,
    isNewClient: false,
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return { id: 'tx-1', date: '2026-03-15', amount: 500, type: 'service', ...overrides };
}

function makeReview(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return { id: 'rev-1', date: '2026-03-15', rating: 5, providerId: 'rina', ...overrides };
}

function makePerformanceInput(overrides: Partial<PerformanceInput> = {}): PerformanceInput {
  return {
    providerId: 'rina',
    providerName: 'Rina',
    period: 'monthly',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    appointments: [
      makeAppointment({ id: 'a1', clientId: 'c1' }),
      makeAppointment({ id: 'a2', clientId: 'c2', service: 'Fillers', revenue: 800 }),
      makeAppointment({ id: 'a3', clientId: 'c3', status: 'no_show', revenue: 0 }),
      makeAppointment({ id: 'a4', clientId: 'c1', service: 'HydraFacial', category: 'Facial', revenue: 275 }),
    ],
    transactions: [
      makeTransaction({ id: 't1', amount: 500 }),
      makeTransaction({ id: 't2', amount: 800 }),
      makeTransaction({ id: 't3', amount: 275 }),
      makeTransaction({ id: 't4', amount: 150, type: 'product' }),
      makeTransaction({ id: 't5', amount: 100, type: 'membership' }),
    ],
    reviews: [
      makeReview({ id: 'r1', rating: 5 }),
      makeReview({ id: 'r2', rating: 4.5 }),
      makeReview({ id: 'r3', rating: 5 }),
    ],
    previousPeriodRevenue: 1500,
    availableHours: 160,
    totalClients: 10,
    returningClients: 7,
    rebookedClients: 5,
    newClients: 3,
    newClientsThatBooked: 2,
    upsellCount: 2,
    totalAppointments: 4,
    ...overrides,
  };
}

// ── REVENUE TESTS ──

describe('calculateProviderRevenue', () => {
  it('calculates total revenue from all transaction types', () => {
    const input = makePerformanceInput();
    const result = calculateProviderRevenue(input);
    expect(result.totalRevenue).toBe(1825); // 500 + 800 + 275 + 150 + 100
  });

  it('separates service, product, and membership revenue', () => {
    const input = makePerformanceInput();
    const result = calculateProviderRevenue(input);
    expect(result.serviceRevenue).toBe(1575);
    expect(result.productRevenue).toBe(150);
    expect(result.membershipRevenue).toBe(100);
  });

  it('calculates growth rate vs previous period', () => {
    const input = makePerformanceInput({ previousPeriodRevenue: 1500 });
    const result = calculateProviderRevenue(input);
    expect(result.growthRate).toBeGreaterThan(0);
  });

  it('handles zero previous revenue gracefully', () => {
    const input = makePerformanceInput({ previousPeriodRevenue: 0 });
    const result = calculateProviderRevenue(input);
    expect(result.growthRate).toBe(0);
  });

  it('handles empty transactions', () => {
    const input = makePerformanceInput({ transactions: [] });
    const result = calculateProviderRevenue(input);
    expect(result.totalRevenue).toBe(0);
  });

  it('includes period information', () => {
    const input = makePerformanceInput();
    const result = calculateProviderRevenue(input);
    expect(result.period).toBe('monthly');
    expect(result.periodStart).toBe('2026-03-01');
    expect(result.periodEnd).toBe('2026-03-31');
  });

  it('handles negative growth correctly', () => {
    const input = makePerformanceInput({ previousPeriodRevenue: 5000 });
    const result = calculateProviderRevenue(input);
    expect(result.growthRate).toBeLessThan(0);
  });
});

// ── REVENUE PER HOUR ──

describe('calculateRevenuePerHour', () => {
  it('returns revenue per hour', () => {
    const result = calculateRevenuePerHour(1000, 10);
    expect(result.revenuePerHour).toBe(100);
  });

  it('handles zero hours', () => {
    const result = calculateRevenuePerHour(1000, 0);
    expect(result.revenuePerHour).toBe(0);
  });

  it('calculates benchmark from all providers', () => {
    const result = calculateRevenuePerHour(1000, 10, [100, 150, 80]);
    expect(result.benchmark).toBeCloseTo(110, 0);
  });

  it('calculates percentile rank', () => {
    const result = calculateRevenuePerHour(1000, 10, [50, 80, 100, 120, 150]);
    expect(result.percentileRank).toBeGreaterThanOrEqual(0);
    expect(result.percentileRank).toBeLessThanOrEqual(100);
  });

  it('defaults to 50th percentile with no comparisons', () => {
    const result = calculateRevenuePerHour(1000, 10);
    expect(result.percentileRank).toBe(50);
  });
});

// ── AVG TICKET SIZE ──

describe('calculateAvgTicketSize', () => {
  it('calculates average from service transactions', () => {
    const txs = [makeTransaction({ amount: 500 }), makeTransaction({ amount: 300 })];
    expect(calculateAvgTicketSize(txs)).toBe(400);
  });

  it('excludes non-service transactions', () => {
    const txs = [makeTransaction({ amount: 500 }), makeTransaction({ amount: 100, type: 'product' })];
    expect(calculateAvgTicketSize(txs)).toBe(500);
  });

  it('returns 0 for no service transactions', () => {
    const txs = [makeTransaction({ amount: 100, type: 'product' })];
    expect(calculateAvgTicketSize(txs)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAvgTicketSize([])).toBe(0);
  });

  it('handles single transaction', () => {
    expect(calculateAvgTicketSize([makeTransaction({ amount: 750 })])).toBe(750);
  });
});

// ── SERVICE MIX ──

describe('analyzeServiceMix', () => {
  it('groups appointments by service', () => {
    const appts = [
      makeAppointment({ service: 'Botox', revenue: 500 }),
      makeAppointment({ id: 'a2', service: 'Botox', revenue: 500, clientId: 'c2' }),
      makeAppointment({ id: 'a3', service: 'Fillers', revenue: 800, clientId: 'c3' }),
    ];
    const result = analyzeServiceMix(appts);
    expect(result.topServices.length).toBe(2);
  });

  it('sorts by revenue descending', () => {
    const appts = [
      makeAppointment({ service: 'Botox', revenue: 500 }),
      makeAppointment({ id: 'a2', service: 'Fillers', revenue: 800, clientId: 'c2' }),
    ];
    const result = analyzeServiceMix(appts);
    expect(result.topServices[0].service).toBe('Fillers');
  });

  it('calculates percentOfTotal correctly', () => {
    const appts = [
      makeAppointment({ service: 'Botox', revenue: 500 }),
      makeAppointment({ id: 'a2', service: 'Botox', revenue: 500, clientId: 'c2' }),
      makeAppointment({ id: 'a3', service: 'Fillers', revenue: 800, clientId: 'c3' }),
    ];
    const result = analyzeServiceMix(appts);
    const botox = result.topServices.find(s => s.service === 'Botox')!;
    expect(botox.percentOfTotal).toBeCloseTo(66.7, 0);
  });

  it('excludes non-completed appointments', () => {
    const appts = [
      makeAppointment({ service: 'Botox', revenue: 500 }),
      makeAppointment({ id: 'a2', service: 'Botox', revenue: 0, status: 'no_show' }),
    ];
    const result = analyzeServiceMix(appts);
    expect(result.topServices[0].count).toBe(1);
  });

  it('calculates category breakdown', () => {
    const appts = [
      makeAppointment({ service: 'Botox', category: 'Injectable' }),
      makeAppointment({ id: 'a2', service: 'HydraFacial', category: 'Facial', clientId: 'c2' }),
    ];
    const result = analyzeServiceMix(appts);
    expect(result.categoryBreakdown.length).toBe(2);
  });

  it('calculates diversity score', () => {
    const appts = [
      makeAppointment({ service: 'Botox' }),
      makeAppointment({ id: 'a2', service: 'Fillers', clientId: 'c2' }),
      makeAppointment({ id: 'a3', service: 'HydraFacial', clientId: 'c3' }),
    ];
    const result = analyzeServiceMix(appts);
    expect(result.diversityScore).toBeGreaterThan(0);
    expect(result.diversityScore).toBeLessThanOrEqual(100);
  });

  it('returns 0 diversity for single service', () => {
    const appts = [makeAppointment({ service: 'Botox' })];
    const result = analyzeServiceMix(appts);
    expect(result.diversityScore).toBe(0);
  });

  it('handles empty appointments', () => {
    const result = analyzeServiceMix([]);
    expect(result.topServices.length).toBe(0);
    expect(result.diversityScore).toBe(0);
  });
});

// ── CLIENT METRICS ──

describe('calculateClientRetentionRate', () => {
  it('calculates retention rate correctly', () => {
    expect(calculateClientRetentionRate(7, 10)).toBe(70);
  });
  it('returns 0 with no clients', () => {
    expect(calculateClientRetentionRate(0, 0)).toBe(0);
  });
  it('handles 100% retention', () => {
    expect(calculateClientRetentionRate(10, 10)).toBe(100);
  });
});

describe('calculateRebookRate', () => {
  it('calculates rebook rate', () => {
    expect(calculateRebookRate(6, 10)).toBe(60);
  });
  it('returns 0 with no appointments', () => {
    expect(calculateRebookRate(0, 0)).toBe(0);
  });
});

describe('calculateNoShowRate', () => {
  it('calculates no-show rate excluding cancellations', () => {
    const appts = [
      makeAppointment({ status: 'completed' }),
      makeAppointment({ id: 'a2', status: 'completed' }),
      makeAppointment({ id: 'a3', status: 'no_show' }),
      makeAppointment({ id: 'a4', status: 'cancelled' }),
    ];
    // Total non-cancelled = 3, no-shows = 1
    expect(calculateNoShowRate(appts)).toBeCloseTo(33.3, 0);
  });

  it('returns 0 with no no-shows', () => {
    const appts = [makeAppointment({ status: 'completed' })];
    expect(calculateNoShowRate(appts)).toBe(0);
  });

  it('returns 0 with empty array', () => {
    expect(calculateNoShowRate([])).toBe(0);
  });
});

describe('calculateNewClientConversionRate', () => {
  it('calculates conversion rate', () => {
    expect(calculateNewClientConversionRate(3, 5)).toBe(60);
  });
  it('returns 0 with no new clients', () => {
    expect(calculateNewClientConversionRate(0, 0)).toBe(0);
  });
});

describe('calculateUpsellRate', () => {
  it('calculates upsell rate', () => {
    expect(calculateUpsellRate(3, 10)).toBe(30);
  });
  it('returns 0 with no appointments', () => {
    expect(calculateUpsellRate(0, 0)).toBe(0);
  });
});

// ── UTILIZATION ──

describe('calculateUtilizationRate', () => {
  it('calculates utilization from booked vs available minutes', () => {
    const appts = [
      makeAppointment({ duration: 60, status: 'completed' }),
      makeAppointment({ id: 'a2', duration: 45, status: 'scheduled' }),
    ];
    const result = calculateUtilizationRate(appts, 240);
    expect(result).toBeCloseTo(43.8, 0);
  });

  it('returns 0 with no available time', () => {
    expect(calculateUtilizationRate([], 0)).toBe(0);
  });

  it('excludes cancelled and no-show from booked time', () => {
    const appts = [
      makeAppointment({ duration: 60, status: 'completed' }),
      makeAppointment({ id: 'a2', duration: 60, status: 'no_show' }),
      makeAppointment({ id: 'a3', duration: 60, status: 'cancelled' }),
    ];
    const result = calculateUtilizationRate(appts, 180);
    expect(result).toBeCloseTo(33.3, 0);
  });
});

// ── QUALITY METRICS ──

describe('calculateAvgReviewRating', () => {
  it('calculates average rating', () => {
    const reviews = [makeReview({ rating: 5 }), makeReview({ id: 'r2', rating: 4 }), makeReview({ id: 'r3', rating: 4.5 })];
    const { avg, count } = calculateAvgReviewRating(reviews);
    expect(avg).toBe(4.5);
    expect(count).toBe(3);
  });

  it('returns 0 for no reviews', () => {
    const { avg, count } = calculateAvgReviewRating([]);
    expect(avg).toBe(0);
    expect(count).toBe(0);
  });

  it('handles single review', () => {
    const { avg } = calculateAvgReviewRating([makeReview({ rating: 4.8 })]);
    expect(avg).toBe(4.8);
  });
});

describe('calculateTreatmentOutcomeScore', () => {
  it('returns high score for all completed', () => {
    const appts = [makeAppointment({ status: 'completed' }), makeAppointment({ id: 'a2', status: 'completed' })];
    expect(calculateTreatmentOutcomeScore(appts)).toBe(100);
  });

  it('penalizes no-shows', () => {
    const appts = [makeAppointment({ status: 'completed' }), makeAppointment({ id: 'a2', status: 'no_show' })];
    expect(calculateTreatmentOutcomeScore(appts)).toBeLessThan(100);
  });

  it('returns 100 for no appointments', () => {
    expect(calculateTreatmentOutcomeScore([])).toBe(100);
  });

  it('clamps between 0 and 100', () => {
    const appts = Array.from({ length: 10 }, (_, i) => makeAppointment({ id: `a${i}`, status: 'no_show' }));
    const score = calculateTreatmentOutcomeScore(appts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── FULL PERFORMANCE ──

describe('calculatePerformanceMetrics', () => {
  it('returns all required fields', () => {
    const input = makePerformanceInput();
    const result = calculatePerformanceMetrics(input);
    expect(result.providerId).toBe('rina');
    expect(result.providerName).toBe('Rina');
    expect(result.revenue).toBeDefined();
    expect(result.revenuePerHour).toBeDefined();
    expect(result.avgTicketSize).toBeGreaterThanOrEqual(0);
    expect(result.clientRetentionRate).toBeGreaterThanOrEqual(0);
    expect(result.rebookRate).toBeGreaterThanOrEqual(0);
    expect(result.noShowRate).toBeGreaterThanOrEqual(0);
    expect(result.utilizationRate).toBeGreaterThanOrEqual(0);
    expect(result.avgReviewRating).toBeGreaterThanOrEqual(0);
    expect(result.serviceMix).toBeDefined();
  });

  it('calculates appointment count from completed only', () => {
    const input = makePerformanceInput();
    const result = calculatePerformanceMetrics(input);
    expect(result.appointmentsCompleted).toBe(3); // 4 total - 1 no_show
  });

  it('sets period info correctly', () => {
    const input = makePerformanceInput();
    const result = calculatePerformanceMetrics(input);
    expect(result.period).toBe('monthly');
    expect(result.periodStart).toBe('2026-03-01');
  });
});

// ── PEER COMPARISON ──

describe('compareProviders', () => {
  it('returns rankings for all metrics', () => {
    const m1 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'rina', providerName: 'Rina' }));
    const m2 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'mom', providerName: 'Mom', previousPeriodRevenue: 2000 }));
    const result = compareProviders([m1, m2]);
    expect(result.rankings.length).toBeGreaterThan(0);
    expect(result.providers.length).toBe(2);
  });

  it('generates insights', () => {
    const m1 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'rina', providerName: 'Rina' }));
    const m2 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'mom', providerName: 'Mom' }));
    const result = compareProviders([m1, m2]);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it('handles single provider', () => {
    const m1 = calculatePerformanceMetrics(makePerformanceInput());
    const result = compareProviders([m1]);
    expect(result.providers.length).toBe(1);
    expect(result.insights.length).toBe(0);
  });

  it('handles empty array', () => {
    const result = compareProviders([]);
    expect(result.providers.length).toBe(0);
    expect(result.rankings.length).toBe(0);
  });

  it('includes revenue ranking', () => {
    const m1 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'rina', providerName: 'Rina' }));
    const m2 = calculatePerformanceMetrics(makePerformanceInput({ providerId: 'mom', providerName: 'Mom' }));
    const result = compareProviders([m1, m2]);
    const revenueRankings = result.rankings.filter(r => r.metric === 'Total Revenue');
    expect(revenueRankings.length).toBe(2);
  });
});

// ── TREND ANALYSIS ──

describe('analyzeTrend', () => {
  it('detects improving trend', () => {
    const points = [
      { date: '2026-01-01', value: 10000 },
      { date: '2026-02-01', value: 12000 },
      { date: '2026-03-01', value: 15000 },
    ];
    const result = analyzeTrend(points);
    expect(result.direction).toBe('improving');
    expect(result.changeRate).toBeGreaterThan(0);
  });

  it('detects declining trend', () => {
    const points = [
      { date: '2026-01-01', value: 15000 },
      { date: '2026-02-01', value: 12000 },
      { date: '2026-03-01', value: 8000 },
    ];
    const result = analyzeTrend(points);
    expect(result.direction).toBe('declining');
    expect(result.changeRate).toBeLessThan(0);
  });

  it('detects stable trend', () => {
    const points = [
      { date: '2026-01-01', value: 10000 },
      { date: '2026-02-01', value: 10100 },
      { date: '2026-03-01', value: 10050 },
    ];
    const result = analyzeTrend(points);
    expect(result.direction).toBe('stable');
  });

  it('handles single data point', () => {
    const result = analyzeTrend([{ date: '2026-01-01', value: 100 }]);
    expect(result.direction).toBe('stable');
    expect(result.forecast).toBe(100);
  });

  it('handles empty array', () => {
    const result = analyzeTrend([]);
    expect(result.direction).toBe('stable');
    expect(result.forecast).toBe(0);
  });

  it('provides a forecast', () => {
    const points = [
      { date: '2026-01-01', value: 10000 },
      { date: '2026-02-01', value: 12000 },
      { date: '2026-03-01', value: 14000 },
    ];
    const result = analyzeTrend(points);
    expect(result.forecast).toBeGreaterThan(14000);
  });

  it('sorts by date', () => {
    const points = [
      { date: '2026-03-01', value: 15000 },
      { date: '2026-01-01', value: 10000 },
      { date: '2026-02-01', value: 12000 },
    ];
    const result = analyzeTrend(points);
    expect(result.dataPoints[0].date).toBe('2026-01-01');
  });
});

// ── PERCENTILE ──

describe('calculatePercentile', () => {
  it('returns 50 for median value', () => {
    const result = calculatePercentile(50, [10, 30, 50, 70, 90]);
    expect(result).toBe(50);
  });

  it('returns high percentile for top value', () => {
    const result = calculatePercentile(100, [10, 30, 50, 70, 100]);
    expect(result).toBeGreaterThan(80);
  });

  it('returns low percentile for bottom value', () => {
    const result = calculatePercentile(10, [10, 30, 50, 70, 100]);
    expect(result).toBeLessThan(20);
  });

  it('returns 50 for empty array', () => {
    expect(calculatePercentile(50, [])).toBe(50);
  });

  it('returns 50 for single value', () => {
    expect(calculatePercentile(50, [50])).toBe(50);
  });
});

describe('getPercentileRankings', () => {
  it('returns rankings for all metrics', () => {
    const metrics = calculatePerformanceMetrics(makePerformanceInput());
    const all = [metrics];
    const result = getPercentileRankings('rina', 'Rina', metrics, all);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(r => {
      expect(r.providerId).toBe('rina');
      expect(r.rank).toBeGreaterThan(0);
    });
  });
});
