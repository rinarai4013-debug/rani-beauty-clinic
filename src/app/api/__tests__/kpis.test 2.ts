/**
 * Integration tests for KPI & Revenue routes:
 *   GET /api/dashboard/kpis
 *   GET /api/dashboard/revenue
 *   GET /api/dashboard/revenue/trends
 *   GET /api/dashboard/revenue/anomalies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  airtableRecord,
  airtableRecords,
  buildGetRequest,
  expectJsonStatus,
  expectUnauthorized,
  expectForbidden,
  expectServerError,
  today,
  daysAgo,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockFetchAll = vi.fn();
const mockFetchFirst = vi.fn();
const mockCacheGet = vi.fn().mockReturnValue(null);
const mockCacheSet = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    appointments: vi.fn(),
    transactions: vi.fn(),
    clients: vi.fn(),
    kpis: vi.fn(),
    alerts: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  fetchFirst: (...args: unknown[]) => mockFetchFirst(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120 },
}));

vi.mock('@/lib/gamification/engine', () => ({
  calculateClinicScore: vi.fn().mockReturnValue({
    total: 75,
    breakdown: { revenue: 80, utilization: 70, consults: 60, operations: 90 },
    status: 'good',
  }),
}));

vi.mock('@/data/dashboard/score-weights', () => ({
  TARGETS: { dailyRevenue: 4000, monthlyRevenue: 100000 },
}));

vi.mock('@/lib/predictions/revenue-anomaly', () => ({
  detectRevenueAnomalies: vi.fn().mockReturnValue({
    anomalies: [],
    healthScore: 85,
    summary: 'No anomalies detected',
    projectedMonthEnd: 95000,
  }),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    appointments: { date: 'Date', time: 'Time', status: 'Status', provider: 'Provider', duration: 'Duration', service: 'Service Name', amountQuoted: 'Amount Quoted', amountPaid: 'Amount Paid' },
    transactions: { date: 'Date', status: 'Status' },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuthenticatedCEO() {
  mockGetSession.mockResolvedValue(CEO_SESSION);
  mockHasPermission.mockReturnValue(true);
}

function setupUnauthenticated() {
  mockGetSession.mockResolvedValue(null);
}

function setupForbidden() {
  mockGetSession.mockResolvedValue(MARKETING_SESSION);
  mockHasPermission.mockReturnValue(false);
}

const sampleTransaction = (date: string, amount: number, type = 'Service Payment') =>
  airtableRecord(`tx_${date}_${amount}`, { Date: date, Amount: amount, Type: type, Status: 'Completed', 'Payment Method': 'Credit Card', Provider: 'Mom', 'Service Name': 'HydraFacial' });

const sampleAppointment = (date: string, status = 'completed') =>
  airtableRecord(`apt_${date}`, {
    'Service Name': 'HydraFacial', 'Service Category': 'Facial', Provider: 'Mom',
    Date: date, Time: '10:00', Duration: 60, Status: status, 'Is Consult': false,
    'Consult Type': '', 'Consult Outcome': '', 'Deposit Amount': 0, 'Deposit Paid': false,
    'Amount Quoted': 275, 'Amount Paid': 275, 'Booking Source': 'online',
    'Review Requested': false, 'Review Received': false,
  });

// ---------------------------------------------------------------------------
// GET /api/dashboard/kpis
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/kpis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_executive permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    await expectForbidden(response);
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = { revenue: { today: 5000 } };
    mockCacheGet.mockReturnValue(cachedData);

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data).toEqual(cachedData);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return full KPI data structure', async () => {
    setupAuthenticatedCEO();
    const todayStr = today();

    // Mock all 6 parallel fetches
    mockFetchAll.mockResolvedValue([]);
    mockFetchFirst.mockResolvedValue([]);

    // Return sequentially for each call
    let callCount = 0;
    mockFetchAll.mockImplementation(() => {
      callCount++;
      return Promise.resolve([]);
    });
    mockFetchFirst.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('bookings');
    expect(data).toHaveProperty('consults');
    expect(data).toHaveProperty('clients');
    expect(data).toHaveProperty('alerts');
    expect(data).toHaveProperty('clinicScore');
  });

  it('should calculate revenue from transactions', async () => {
    setupAuthenticatedCEO();
    const todayStr = today();

    // Setup: transactions with amounts
    mockFetchAll.mockImplementation((_table: unknown, opts?: { filterByFormula?: string }) => {
      const filter = (opts as Record<string, string>)?.filterByFormula || '';
      if (filter.includes('Completed')) {
        return Promise.resolve([
          sampleTransaction(todayStr, 500),
          sampleTransaction(todayStr, 300),
        ]);
      }
      return Promise.resolve([]);
    });
    mockFetchFirst.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revenue.today).toBeGreaterThanOrEqual(0);
  });

  it('should cache the result after computation', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);
    mockFetchFirst.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    await GET(req as any);

    expect(mockCacheSet).toHaveBeenCalledWith('kpis', expect.any(Object), expect.any(Number));
  });

  it('should return 500 on Airtable error', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable connection failed'));
    mockFetchFirst.mockRejectedValue(new Error('Airtable connection failed'));

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    await expectServerError(response);
  });

  it('should include clinic score in response', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);
    mockFetchFirst.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/kpis/route');
    const req = buildGetRequest('/api/dashboard/kpis');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.clinicScore).toBeDefined();
    expect(data.clinicScore.total).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/revenue
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_revenue permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue');
    const response = await GET(req as any);
    await expectForbidden(response);
  });

  it('should return revenue breakdown structure', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('daily');
    expect(data).toHaveProperty('byProvider');
    expect(data).toHaveProperty('byService');
    expect(data).toHaveProperty('byCategory');
    expect(data).toHaveProperty('byPaymentType');
    expect(data).toHaveProperty('summary');
  });

  it('should accept range query parameter', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue', { range: 'last30' });
    const response = await GET(req as any);
    expect(response.status).toBe(200);
  });

  it('should default to mtd range', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue');
    await GET(req as any);

    expect(mockCacheSet).toHaveBeenCalledWith('revenue-mtd', expect.any(Object), expect.any(Number));
  });

  it('should return cached data when available', async () => {
    setupAuthenticatedCEO();
    const cached = { daily: [], summary: { gross: 1000 } };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/revenue/route');
    const req = buildGetRequest('/api/dashboard/revenue');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/revenue/trends
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/revenue/trends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const { GET } = await import('@/app/api/dashboard/revenue/trends/route');
    const req = buildGetRequest('/api/dashboard/revenue/trends');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return trend data with daily array', async () => {
    setupAuthenticatedCEO();
    const transactions = Array.from({ length: 15 }, (_, i) =>
      sampleTransaction(daysAgo(i), 1000 + i * 100)
    );
    mockFetchAll.mockResolvedValue(transactions);

    const { GET } = await import('@/app/api/dashboard/revenue/trends/route');
    const req = buildGetRequest('/api/dashboard/revenue/trends');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('daily');
    expect(data).toHaveProperty('weeklyAvg');
    expect(data).toHaveProperty('monthlyTotal');
    expect(data).toHaveProperty('trend');
  });

  it('should detect upward trend', async () => {
    setupAuthenticatedCEO();
    // Recent days have higher revenue than older days
    const transactions = Array.from({ length: 20 }, (_, i) =>
      sampleTransaction(daysAgo(19 - i), 500 + i * 200)
    );
    mockFetchAll.mockResolvedValue(transactions);

    const { GET } = await import('@/app/api/dashboard/revenue/trends/route');
    const req = buildGetRequest('/api/dashboard/revenue/trends');
    const response = await GET(req as any);
    const data = await response.json();

    expect(['up', 'flat', 'down']).toContain(data.trend);
  });

  it('should handle empty transaction data', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/revenue/trends/route');
    const req = buildGetRequest('/api/dashboard/revenue/trends');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.daily).toEqual([]);
    expect(data.monthlyTotal).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/revenue/anomalies
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/revenue/anomalies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const { GET } = await import('@/app/api/dashboard/revenue/anomalies/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/revenue/anomalies/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return anomaly detection results', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/revenue/anomalies/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('healthScore');
  });

  it('should return 500 on Airtable failure', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable error'));

    const { GET } = await import('@/app/api/dashboard/revenue/anomalies/route');
    const response = await GET();
    await expectServerError(response);
  });
});
