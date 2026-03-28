/**
 * Integration tests for Schedule routes:
 *   GET /api/dashboard/schedule
 *   GET /api/dashboard/schedule/upcoming
 *   GET /api/dashboard/schedule/no-show-risk
 *   GET /api/dashboard/schedule/optimize
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  airtableRecord,
  buildGetRequest,
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
    clients: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    appointments: { date: 'Date', time: 'Time', status: 'Status', provider: 'Provider', duration: 'Duration', service: 'Service Name', amountQuoted: 'Amount Quoted', amountPaid: 'Amount Paid' },
    clients: { name: 'Client' },
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120 },
}));

vi.mock('@/lib/predictions/no-show', () => ({
  predictNoShow: vi.fn().mockReturnValue({
    score: 35,
    risk: 'moderate',
    factors: [{ factor: 'history', detail: 'No prior no-shows', score: 10 }],
    recommendation: 'Send SMS reminder',
  }),
}));

vi.mock('@/lib/schedule/optimizer', () => ({
  optimizeSchedule: vi.fn().mockReturnValue({
    gaps: [],
    conflicts: [],
    providerBalance: [],
    revenueOpportunities: [],
    efficiencyScore: 85,
    dailySummary: [],
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupAuthCEO() {
  mockGetSession.mockResolvedValue(CEO_SESSION);
  mockHasPermission.mockReturnValue(true);
}

function setupUnauth() {
  mockGetSession.mockResolvedValue(null);
}

function setupForbidden() {
  mockGetSession.mockResolvedValue(MARKETING_SESSION);
  mockHasPermission.mockReturnValue(false);
}

const sampleAppt = (id: string, time: string, status = 'scheduled', provider = 'Mom') =>
  airtableRecord(id, {
    'Service Name': 'HydraFacial', 'Service Category': 'Facial', Provider: provider,
    Date: today(), Time: time, Duration: 60, Status: status,
    'Is Consult': false, 'Deposit Paid': false, 'Amount Quoted': 275, 'Amount Paid': 0,
    'Booking Source': 'online',
  });

// ---------------------------------------------------------------------------
// GET /api/dashboard/schedule
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_schedule permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    await expectForbidden(response);
  });

  it('should return today schedule with utilization', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      sampleAppt('apt001', '10:00'),
      sampleAppt('apt002', '11:00'),
      sampleAppt('apt003', '14:00', 'completed'),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('today');
    expect(data.today).toHaveLength(3);
    expect(data).toHaveProperty('utilization');
    expect(data.utilization).toHaveProperty('total');
    expect(data.utilization).toHaveProperty('byProvider');
    expect(data).toHaveProperty('stats');
  });

  it('should calculate no-show and cancellation stats', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      sampleAppt('apt001', '10:00', 'completed'),
      sampleAppt('apt002', '11:00', 'no_show'),
      sampleAppt('apt003', '14:00', 'cancelled'),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.stats.noShows).toBe(1);
    expect(data.stats.cancellations).toBe(1);
    expect(data.stats.totalSlots).toBe(3);
  });

  it('should handle empty schedule', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.today).toHaveLength(0);
    expect(data.stats.totalSlots).toBe(0);
  });

  it('should calculate utilization per provider', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      sampleAppt('apt001', '10:00', 'scheduled', 'Mom'),
      sampleAppt('apt002', '11:00', 'scheduled', 'Mom'),
      sampleAppt('apt003', '10:00', 'scheduled', 'Rina'),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.utilization.byProvider.length).toBe(2);
  });

  it('should return cached data if available', async () => {
    setupAuthCEO();
    const cached = { today: [], utilization: { total: 50 }, stats: {} };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return 500 on Airtable error', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Connection failed'));

    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await GET(req as any);
    await expectServerError(response);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/schedule/upcoming
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/schedule/upcoming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/schedule/upcoming/route');
    const req = buildGetRequest('/api/dashboard/schedule/upcoming');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return upcoming appointments grouped by date', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('apt001', { ...sampleAppt('', '10:00').fields, Date: today() }),
      airtableRecord('apt002', { ...sampleAppt('', '14:00').fields, Date: daysAgo(-1) }),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/upcoming/route');
    const req = buildGetRequest('/api/dashboard/schedule/upcoming');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('upcoming');
    expect(data).toHaveProperty('byDate');
  });

  it('should handle empty upcoming schedule', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/schedule/upcoming/route');
    const req = buildGetRequest('/api/dashboard/schedule/upcoming');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.upcoming).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/schedule/no-show-risk
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/schedule/no-show-risk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/schedule/no-show-risk/route');
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return no-show risk scores for appointments', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('apt001', {
        'Service Name': 'HydraFacial', 'Service Category': 'Facial',
        Provider: 'Mom', Date: today(), Time: '10:00',
        Status: 'scheduled', 'Deposit Paid': false, 'Deposit Amount': 0,
        'Booking Source': 'online', 'Is Consult': false, Client: [],
      }),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/no-show-risk/route');
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('appointments');
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('total');
    expect(data.summary).toHaveProperty('highRisk');
    expect(data.summary).toHaveProperty('moderateRisk');
    expect(data.summary).toHaveProperty('lowRisk');
  });

  it('should accept date query parameter', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/schedule/no-show-risk/route');
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk', { date: '2026-03-25' });
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.date).toBe('2026-03-25');
  });

  it('should filter out completed/cancelled/no-show appointments', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('apt001', { ...sampleAppt('', '10:00').fields, Status: 'completed', Client: [] }),
      airtableRecord('apt002', { ...sampleAppt('', '11:00').fields, Status: 'scheduled', Client: [] }),
      airtableRecord('apt003', { ...sampleAppt('', '12:00').fields, Status: 'cancelled', Client: [] }),
    ]);

    const { GET } = await import('@/app/api/dashboard/schedule/no-show-risk/route');
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk');
    const response = await GET(req as any);
    const data = await response.json();

    // Only the scheduled appointment should be scored
    expect(data.appointments).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/schedule/optimize
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/schedule/optimize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupForbidden();
    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return optimization results', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
  });

  it('should handle message for empty schedule', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();
    const data = await response.json();

    expect(data.message).toBeDefined();
  });

  it('should return 500 on error', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable error'));

    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
