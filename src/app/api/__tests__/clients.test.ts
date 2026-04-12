/**
 * Integration tests for Client routes:
 *   GET /api/dashboard/clients
 *   GET /api/dashboard/clients/[id]
 *   GET /api/dashboard/clients/[id]?full=true
 *   GET /api/dashboard/clients/[id]/churn
 *   GET /api/dashboard/clients/[id]/recommend
 *   GET /api/dashboard/clients/at-risk
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  PROVIDER_SESSION,
  airtableRecord,
  buildGetRequest,
  expectJsonStatus,
  expectUnauthorized,
  expectForbidden,
  expectServerError,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockFetchAll = vi.fn();
const mockRateLimitedQuery = vi.fn();
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
    clients: vi.fn().mockReturnValue({ find: vi.fn() }),
    appointments: vi.fn(),
    transactions: vi.fn(),
    memberships: vi.fn(),
    messagesLog: vi.fn(),
    reviews: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  rateLimitedQuery: (...args: unknown[]) => mockRateLimitedQuery(...args),
}));

const mockSanitizeFormulaValue = vi.fn((v: string) => v);

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: (...args: unknown[]) => mockSanitizeFormulaValue(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { REALTIME: 15, STANDARD: 30, MODERATE: 60, RELAXED: 120 },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/churn/engine', () => ({
  predictChurn: vi.fn().mockReturnValue({
    score: 65,
    risk: 'high',
    factors: [
      { factor: 'recency', score: 80, weight: 0.4, detail: 'Last visit 45 days ago' },
      { factor: 'frequency', score: 40, weight: 0.2, detail: 'Low visit frequency' },
    ],
    recommendation: 'Send reactivation campaign',
  }),
}));

const mockRecommendNextTreatment = vi.fn().mockReturnValue({
  recommendations: [
    { service: 'RF Microneedling', reason: 'Next in pathway', confidence: 85, estimatedPrice: 495 },
  ],
  strategies: ['pathway'],
});

vi.mock('@/lib/recommendations/engine', () => ({
  recommendNextTreatment: (...args: unknown[]) => mockRecommendNextTreatment(...args),
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

function setupNoPermission() {
  mockGetSession.mockResolvedValue(MARKETING_SESSION);
  mockHasPermission.mockReturnValue(false);
}

const sampleClient = (id: string, name: string, status = 'Active') =>
  airtableRecord(id, { Client: name, Email: `${name.toLowerCase().replace(' ', '.')}@test.com`, Phone: '(425) 555-0100', Status: status, 'Preferred Contact': 'email' });

// ---------------------------------------------------------------------------
// GET /api/dashboard/clients
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking view_clients permission', async () => {
    setupNoPermission();
    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    await expectForbidden(response);
  });

  it('should return client list with mapped fields', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      sampleClient('rec001', 'Jane Doe'),
      sampleClient('rec002', 'John Smith'),
    ]);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clients).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.clients[0].firstName).toBe('Jane');
    expect(data.clients[0].lastName).toBe('Doe');
    expect(data.clients[0].name).toBe('Jane Doe');
    expect(data.clients[0].email).toContain('@');
  });

  it('should filter by status query param', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([sampleClient('rec003', 'Active User', 'Active')]);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients', { status: 'Active' });
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.clients).toHaveLength(1);
    expect(mockFetchAll).toHaveBeenCalled();
  });

  it('should sanitize status filter before building Airtable formula', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients', { status: "' OR TRUE() OR '" });
    const response = await GET(req as any);

    expect(response.status).toBe(200);
    expect(mockSanitizeFormulaValue).toHaveBeenCalledWith("' OR TRUE() OR '");
  });

  it('should return cached data when available', async () => {
    setupAuthCEO();
    const cached = { clients: [], total: 0 };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should handle empty client list', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.clients).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it('should return 500 on Airtable error', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable error'));

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    await expectServerError(response);
  });

  it('should handle single-name clients gracefully', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('rec010', { Client: 'Madonna', Email: '', Phone: '', Status: 'Active', 'Preferred Contact': '' }),
    ]);

    const { GET } = await import('@/app/api/dashboard/clients/route');
    const req = buildGetRequest('/api/dashboard/clients');
    const response = await GET(req as any);
    const data = await response.json();

    expect(data.clients[0].firstName).toBe('Madonna');
    expect(data.clients[0].lastName).toBe('');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/clients/[id]
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/clients/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupNoPermission();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectForbidden(response);
  });

  it('should return basic client data', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());

    const mockFind = vi.fn().mockResolvedValue({
      id: 'rec001',
      fields: {
        Client: 'Jane Doe',
        Email: 'jane@test.com',
        Phone: '(425) 555-0100',
        Status: 'Active',
        'Preferred Contact': 'email',
        Appointments: ['apt_001', 'apt_002'],
        Transactions: ['tx_001'],
        Memberships: [],
        'Messages Log': [],
        Reviews: [],
      },
    });

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({ find: mockFind });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Jane Doe');
    expect(data.firstName).toBe('Jane');
    expect(data.email).toBe('jane@test.com');
  });

  it('should return full profile with linked records when full=true', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());

    const mockFind = vi.fn().mockResolvedValue({
      id: 'rec001',
      fields: {
        Client: 'Jane Doe',
        Email: 'jane@test.com',
        Phone: '(425) 555-0100',
        Status: 'Active',
        'Preferred Contact': 'email',
        Appointments: ['apt_001'],
        Transactions: ['tx_001'],
        Memberships: ['mem_001'],
        'Messages Log': [],
        Reviews: [],
      },
    });

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({ find: mockFind });

    // Mock linked record fetches
    mockFetchAll.mockImplementation((_table: unknown, opts?: { filterByFormula?: string }) => {
      return Promise.resolve([
        airtableRecord('apt_001', { 'Service Name': 'HydraFacial', Date: '2024-01-15', Status: 'completed', 'Amount Paid': 275, 'Service Category': 'Facial', Provider: 'Mom', Time: '10:00', Duration: 60, 'Is Consult': false }),
      ]);
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001', { full: 'true' });
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('appointments');
    expect(data).toHaveProperty('transactions');
    expect(data).toHaveProperty('memberships');
  });

  it('should return cached data when available', async () => {
    setupAuthCEO();
    const cached = { id: 'rec001', name: 'Cached Client' };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(data).toEqual(cached);
  });

  it('should return 500 when client not found', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({
      find: vi.fn().mockRejectedValue(new Error('NOT_FOUND')),
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/route');
    const req = buildGetRequest('/api/dashboard/clients/nonexistent');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    await expectServerError(response);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/clients/[id]/churn
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/clients/[id]/churn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupNoPermission();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectForbidden(response);
  });

  it('should return churn prediction data', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());
    mockFetchAll.mockResolvedValue([]);

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({
      find: vi.fn().mockResolvedValue({
        id: 'rec001',
        fields: { Status: 'Active', Appointments: [], Transactions: [], Memberships: [], 'Messages Log': [] },
      }),
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('score');
    expect(data).toHaveProperty('risk');
    expect(data).toHaveProperty('factors');
    expect(data).toHaveProperty('recommendation');
  });

  it('should return cached churn score', async () => {
    setupAuthCEO();
    const cached = { score: 45, risk: 'medium' };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(data).toEqual(cached);
  });

  it('should still return churn prediction when linked record fetches fail', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());
    mockFetchAll.mockRejectedValue(new Error('Linked fetch failed'));

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({
      find: vi.fn().mockResolvedValue({
        id: 'rec001',
        fields: {
          Client: 'Recovery Client',
          Status: 'Active',
          Appointments: ['apt_001'],
          Transactions: ['tx_001'],
          Memberships: ['mem_001'],
          'Messages Log': ['msg_001'],
        },
      }),
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('score');
    expect(data.clientName).toBe('Recovery Client');
  });

  it('should return 500 when client lookup fails', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation(() => {
      throw new Error('Find failed');
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/churn/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/churn');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectServerError(response);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/clients/[id]/recommend
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/clients/[id]/recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/recommend/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/recommend');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupNoPermission();
    const { GET } = await import('@/app/api/dashboard/clients/[id]/recommend/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/recommend');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectForbidden(response);
  });

  it('should return treatment recommendations', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());
    mockFetchAll.mockResolvedValue([]);

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({
      find: vi.fn().mockResolvedValue({
        id: 'rec001',
        fields: { Appointments: [], Transactions: [], Memberships: [] },
      }),
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/recommend/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/recommend');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('strategies');
  });

  it('should normalize legacy engine output shape', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation((fn: () => unknown) => fn());
    mockFetchAll.mockResolvedValue([]);

    const { Tables } = await import('@/lib/airtable/client');
    (Tables.clients as any).mockReturnValue({
      find: vi.fn().mockResolvedValue({
        id: 'rec001',
        fields: { Appointments: [] },
      }),
    });

    mockRecommendNextTreatment.mockReturnValueOnce({
      primary: { service: 'HydraFacial', reason: 'Primary', confidence: 88, estimatedPrice: 299 },
      alternatives: [{ service: 'Peel', reason: 'Alt', confidence: 70, estimatedPrice: 199 }],
      insights: ['membership-match'],
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/recommend/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/recommend');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toHaveLength(2);
    expect(data.recommendations[0].service).toBe('HydraFacial');
    expect(data.strategies).toEqual(['membership-match']);
  });

  it('should return 500 on engine error', async () => {
    setupAuthCEO();
    mockRateLimitedQuery.mockImplementation(() => {
      throw new Error('Engine error');
    });

    const { GET } = await import('@/app/api/dashboard/clients/[id]/recommend/route');
    const req = buildGetRequest('/api/dashboard/clients/rec001/recommend');
    const response = await GET(req as any, { params: Promise.resolve({ id: 'rec001' }) });
    await expectServerError(response);
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/clients/at-risk
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/clients/at-risk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
  });

  it('should return 401 when not authenticated', async () => {
    setupUnauth();
    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    setupNoPermission();
    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('should return cached at-risk payload when available', async () => {
    setupAuthCEO();
    const cached = { clients: [{ id: 'cached_1', urgency: 'critical' }], total: 1, breakdown: { churned: 1 } };
    mockCacheGet.mockReturnValue(cached);

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cached);
    expect(mockFetchAll).not.toHaveBeenCalled();
  });

  it('should return at-risk clients sorted by urgency', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('rec_l30', { Client: 'Lapsed 30', Email: '', Phone: '', Status: 'Lapsed 30' }),
      airtableRecord('rec_churned', { Client: 'Churned User', Email: '', Phone: '', Status: 'Churned' }),
      airtableRecord('rec_l60', { Client: 'Lapsed 60', Email: '', Phone: '', Status: 'Lapsed 60' }),
    ]);

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clients).toHaveLength(3);
    expect(data.total).toBe(3);
    // Churned (critical) should be first
    expect(data.clients[0].urgency).toBe('critical');
    expect(data.clients[1].urgency).toBe('medium');
    expect(data.clients[2].urgency).toBe('low');
  });

  it('should include breakdown counts', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([
      airtableRecord('r1', { Client: 'A', Email: '', Phone: '', Status: 'Lapsed 30' }),
      airtableRecord('r2', { Client: 'B', Email: '', Phone: '', Status: 'Lapsed 90' }),
      airtableRecord('r3', { Client: 'C', Email: '', Phone: '', Status: 'Churned' }),
    ]);

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    const data = await response.json();

    expect(data.breakdown.lapsed30).toBe(1);
    expect(data.breakdown.lapsed90).toBe(1);
    expect(data.breakdown.churned).toBe(1);
  });

  it('should handle empty at-risk list', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    const data = await response.json();

    expect(data.clients).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it('should cache the results', async () => {
    setupAuthCEO();
    mockFetchAll.mockResolvedValue([]);

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    await GET();

    expect(mockCacheSet).toHaveBeenCalledWith('clients-at-risk', expect.any(Object), expect.any(Number));
  });

  it('should return 500 when Airtable lookup fails', async () => {
    setupAuthCEO();
    mockFetchAll.mockRejectedValue(new Error('Airtable unavailable'));

    const { GET } = await import('@/app/api/dashboard/clients/at-risk/route');
    const response = await GET();
    await expectServerError(response);
  });
});
