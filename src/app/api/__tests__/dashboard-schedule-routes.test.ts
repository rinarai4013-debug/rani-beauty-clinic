/**
 * Integration tests for Dashboard Schedule routes:
 *   GET /api/dashboard/schedule
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
  expectServerError,
} from './helpers';

// ---------------------------------------------------------------------------
// Shared mutable mock refs (hoisted vi.mock pattern)
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockFetchAll = vi.fn();
const mockCacheGet = vi.fn().mockReturnValue(null);
const mockCacheSet = vi.fn();
const mockPredictNoShow = vi.fn();
const mockOptimizeSchedule = vi.fn();
const mockLogPhiAccess = vi.fn();

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

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120, SLOW: 300 },
}));

vi.mock('@/lib/predictions/no-show', () => ({
  predictNoShow: (...args: unknown[]) => mockPredictNoShow(...args),
}));

vi.mock('@/lib/schedule/optimizer', () => ({
  optimizeSchedule: (...args: unknown[]) => mockOptimizeSchedule(...args),
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => mockLogPhiAccess(...args),
}));

// ---------------------------------------------------------------------------
// Imports (after all vi.mock calls)
// ---------------------------------------------------------------------------

import { GET as scheduleGET } from '@/app/api/dashboard/schedule/route';
import { GET as noShowRiskGET } from '@/app/api/dashboard/schedule/no-show-risk/route';
import { GET as optimizeGET } from '@/app/api/dashboard/schedule/optimize/route';

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

/** Build a request with nextUrl for routes that use req.nextUrl.searchParams */
function buildNextUrlRequest(path: string, params?: Record<string, string>) {
  const url = new URL(path, 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return {
    url: url.toString(),
    nextUrl: url,
    headers: new Headers({ cookie: 'rani-session=mock-jwt' }),
  };
}

const sampleAppointment = (id: string, status = 'scheduled') =>
  airtableRecord(id, {
    'Service Name': 'HydraFacial',
    'Service Category': 'Facial',
    'Provider': 'Mom',
    'Date': new Date().toISOString().split('T')[0],
    'Time': '10:00',
    'Duration': 60,
    'Status': status,
    'Is Consult': false,
    'Consult Type': '',
    'Deposit Amount': 0,
    'Deposit Paid': false,
    'Amount Quoted': 275,
    'Amount Paid': 275,
    'Booking Source': 'online',
    'Client': ['rec_client_001'],
  });

const sampleOptAppt = (id: string) =>
  airtableRecord(id, {
    'Date': new Date().toISOString().split('T')[0],
    'Start Time': '10:00',
    'End Time': '11:00',
    'Service Name': 'HydraFacial',
    'Provider': 'Mom',
    'Client': 'Jane Doe',
    'Status': 'Scheduled',
    'Room': 'Treatment Room 1',
  });

// ==========================================================================
// GET /api/dashboard/schedule
// ==========================================================================

describe('GET /api/dashboard/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await scheduleGET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_schedule permission', async () => {
    setupForbidden();
    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await scheduleGET(req as any);
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = { today: [], utilization: { total: 50 }, stats: {} };
    mockCacheGet.mockReturnValue(cachedData);

    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await scheduleGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return 200 with schedule data structure', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([
      sampleAppointment('apt_001', 'scheduled'),
      sampleAppointment('apt_002', 'completed'),
    ]);

    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await scheduleGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('today');
    expect(data).toHaveProperty('utilization');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.today)).toBe(true);
    expect(data.utilization).toHaveProperty('total');
    expect(data.utilization).toHaveProperty('byProvider');
    expect(data.stats).toHaveProperty('totalSlots');
    expect(data.stats).toHaveProperty('filledSlots');
    expect(data.stats).toHaveProperty('noShows');
  });

  it('should log PHI access after fetching', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([sampleAppointment('apt_001')]);

    const req = buildGetRequest('/api/dashboard/schedule');
    await scheduleGET(req as any);

    expect(mockLogPhiAccess).toHaveBeenCalledWith(
      expect.anything(),
      CEO_SESSION,
      expect.objectContaining({
        action: 'view',
        dataCategory: 'treatment_records',
      }),
    );
  });

  it('should return 500 on Airtable error', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable connection failed'));

    const req = buildGetRequest('/api/dashboard/schedule');
    const response = await scheduleGET(req as any);
    await expectServerError(response);
  });
});

// ==========================================================================
// GET /api/dashboard/schedule/no-show-risk
// ==========================================================================

describe('GET /api/dashboard/schedule/no-show-risk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockPredictNoShow.mockReturnValue({
      score: 45,
      risk: 'moderate',
      factors: [],
    });
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_schedule permission', async () => {
    setupForbidden();
    const req = buildGetRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = [{ appointmentId: 'apt_001', noShowScore: { score: 30 } }];
    mockCacheGet.mockReturnValue(cachedData);

    const req = buildNextUrlRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return 200 with no-show risk scores', async () => {
    setupAuthenticatedCEO();

    // First call: upcoming appointments
    // Second call: clients (parallel)
    // Third call: historical appointments (parallel)
    let callIndex = 0;
    mockFetchAll.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve([sampleAppointment('apt_001')]);
      }
      // clients and history
      return Promise.resolve([]);
    });

    const req = buildNextUrlRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('appointmentId');
      expect(data[0]).toHaveProperty('noShowScore');
    }
  });

  it('should return empty array when no upcoming appointments', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const req = buildNextUrlRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should log PHI access', async () => {
    setupAuthenticatedCEO();
    let callIndex = 0;
    mockFetchAll.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return Promise.resolve([sampleAppointment('apt_001')]);
      return Promise.resolve([]);
    });

    const req = buildNextUrlRequest('/api/dashboard/schedule/no-show-risk');
    await noShowRiskGET(req as any);

    expect(mockLogPhiAccess).toHaveBeenCalledWith(
      expect.anything(),
      CEO_SESSION,
      expect.objectContaining({
        action: 'view',
        dataCategory: 'treatment_records',
      }),
    );
  });

  it('should return 500 on error', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable connection failed'));

    const req = buildNextUrlRequest('/api/dashboard/schedule/no-show-risk');
    const response = await noShowRiskGET(req as any);
    await expectServerError(response);
  });
});

// ==========================================================================
// GET /api/dashboard/schedule/optimize
// ==========================================================================

describe('GET /api/dashboard/schedule/optimize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockOptimizeSchedule.mockReturnValue({
      gaps: [],
      conflicts: [],
      revenueOpportunities: [],
      providerBalance: [],
      dailySummary: {},
      efficiencyScore: 75,
    });
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauthenticated();
    const response = await optimizeGET();
    await expectUnauthorized(response);
  });

  it('should return 403 when user lacks view_schedule permission', async () => {
    setupForbidden();
    const response = await optimizeGET();
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
  });

  it('should return cached data if available', async () => {
    setupAuthenticatedCEO();
    const cachedData = { success: true, data: { efficiencyScore: 80 } };
    mockCacheGet.mockReturnValue(cachedData);

    const response = await optimizeGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return 200 with optimization data when appointments exist', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([sampleOptAppt('apt_001')]);

    const response = await optimizeGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('generatedAt');
  });

  it('should return null data when no appointments found', async () => {
    setupAuthenticatedCEO();
    mockFetchAll.mockResolvedValue([]);

    const response = await optimizeGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeNull();
    expect(data.message).toContain('No appointments');
  });

  it('should return 500 on error', async () => {
    setupAuthenticatedCEO();
    // The optimize route has .catch(() => []) on fetchAll, so we need to
    // force an error from optimizeSchedule instead
    mockFetchAll.mockResolvedValue([sampleOptAppt('apt_001')]);
    mockOptimizeSchedule.mockImplementation(() => {
      throw new Error('Engine failure');
    });

    const response = await optimizeGET();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
