import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const fetchAllMock = vi.fn();
const sanitizeFormulaValueMock = vi.fn((value: string) => `SAFE_${value}`);
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const detectRevenueAnomaliesMock = vi.fn();
const optimizeScheduleMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: (...args: unknown[]) => sanitizeFormulaValueMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    appointments: vi.fn(() => ({})),
    transactions: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    RELAXED: 300,
    STANDARD: 60,
  },
}));

vi.mock('@/lib/predictions/revenue-anomaly', () => ({
  detectRevenueAnomalies: (...args: unknown[]) => detectRevenueAnomaliesMock(...args),
}));

vi.mock('@/lib/schedule/optimizer', () => ({
  optimizeSchedule: (...args: unknown[]) => optimizeScheduleMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('dashboard formula sanitization wave 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ userId: 'u1', role: 'ceo' });
    hasPermissionMock.mockReturnValue(true);
    cacheGetMock.mockReturnValue(null);
    detectRevenueAnomaliesMock.mockReturnValue({
      anomalies: [],
      healthScore: 100,
      summary: 'ok',
      projectedMonthEnd: 0,
    });
    optimizeScheduleMock.mockReturnValue({
      gaps: [],
      conflicts: [],
      revenueOpportunities: [],
      providerBalance: [],
      dailySummary: {},
      efficiencyScore: 100,
    });
  });

  it('sanitizes month boundaries in providers dashboard formulas', async () => {
    fetchAllMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/dashboard/providers/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(sanitizeFormulaValueMock).toHaveBeenCalledTimes(2);
    const firstFormula = fetchAllMock.mock.calls[0][1].filterByFormula as string;
    const secondFormula = fetchAllMock.mock.calls[1][1].filterByFormula as string;
    expect(firstFormula).toContain('SAFE_');
    expect(secondFormula).toContain('SAFE_');
  });

  it('sanitizes cutoff date in revenue anomalies formula', async () => {
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'txn_1',
        fields: {
          Date: '2026-04-13',
          Amount: 1200,
          Provider: 'Rina',
          Category: 'Injectables',
          'Payment Method': 'card',
        },
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/revenue/anomalies/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(sanitizeFormulaValueMock).toHaveBeenCalledTimes(1);
    const formula = fetchAllMock.mock.calls[0][1].filterByFormula as string;
    expect(formula).toContain('SAFE_');
  });

  it('sanitizes schedule optimize date formula', async () => {
    fetchAllMock.mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(sanitizeFormulaValueMock).toHaveBeenCalledTimes(1);
    const formula = fetchAllMock.mock.calls[0][1].filterByFormula as string;
    expect(formula).toContain('SAFE_');
  });
});
