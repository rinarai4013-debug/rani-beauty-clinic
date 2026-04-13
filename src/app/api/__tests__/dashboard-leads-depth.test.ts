/**
 * Integration tests for GET /api/dashboard/leads
 * Lead funnel with multi-source aggregation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    intakes: vi.fn(() => ({})),
    appointments: vi.fn(() => ({})),
    treatmentPlans: vi.fn(() => ({})),
    transactions: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { MODERATE: 120_000 },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('GET /api/dashboard/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockGetSession.mockResolvedValue({ username: 'rina', role: 'ceo' });
    mockHasPermission.mockReturnValue(true);
    // Default: return empty arrays for all 4 tables
    mockFetchAll.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns 403 when lacking view_leads permission', async () => {
    mockHasPermission.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('returns cached funnel data without fetching', async () => {
    const cached = { stages: [], metrics: {}, conversionRates: {} };
    mockCacheGet.mockReturnValueOnce(cached);
    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('computes funnel stages from 4 Airtable sources', async () => {
    // Intakes
    mockFetchAll
      .mockResolvedValueOnce([
        { id: 'i1', fields: { 'Processing Status': 'New' } },
        { id: 'i2', fields: { 'Processing Status': 'Processed' } },
        { id: 'i3', fields: { 'Processing Status': 'Responded' } },
      ])
      // Appointments
      .mockResolvedValueOnce([
        { id: 'a1', fields: { 'Is Consult': true, Status: 'completed' } },
        { id: 'a2', fields: { 'Is Consult': true, Status: 'upcoming' } },
        { id: 'a3', fields: { 'Is Consult': false } },
      ])
      // Treatment plans
      .mockResolvedValueOnce([
        { id: 'p1', fields: { Status: 'Sent' } },
        { id: 'p2', fields: { Status: 'Booked' } },
      ])
      // Transactions
      .mockResolvedValueOnce([
        { id: 't1', fields: { Type: 'Deposit', Status: 'Completed' } },
      ]);

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.newLeads).toBe(1);
    expect(body.metrics.contacted).toBe(2); // Processed + Responded
    expect(body.metrics.consultsBooked).toBe(2); // Is Consult = true
    expect(body.metrics.consultsCompleted).toBe(1); // completed consults
    expect(body.metrics.converted).toBe(1); // Booked plans
    expect(body.stages).toHaveLength(7);
  });

  it('caches the funnel result', async () => {
    mockFetchAll.mockResolvedValue([]);
    const { GET } = await import('@/app/api/dashboard/leads/route');
    await GET();
    expect(mockCacheSet).toHaveBeenCalledWith('leads-funnel', expect.any(Object), 120_000);
  });

  it('returns 500 when upstream fetch fails', async () => {
    mockFetchAll.mockRejectedValueOnce(new Error('Airtable outage'));
    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });

  it('includes conversion rates in response', async () => {
    mockFetchAll.mockResolvedValue([]);
    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveProperty('conversionRates');
    expect(body.conversionRates).toHaveProperty('leadToConsult');
    expect(body.conversionRates).toHaveProperty('consultShowRate');
    expect(body.conversionRates).toHaveProperty('consultCloseRate');
  });
});
