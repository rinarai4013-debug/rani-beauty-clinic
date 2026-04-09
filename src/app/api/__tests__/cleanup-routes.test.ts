import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CEO_SESSION,
  MARKETING_SESSION,
  airtableRecord,
  buildGetRequest,
  expectForbidden,
  expectUnauthorized,
} from './helpers';

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockFetchAll = vi.fn();
const mockCreateRecord = vi.fn();
const mockCacheGet = vi.fn().mockReturnValue(null);
const mockCacheSet = vi.fn();
const mockGatherDailyData = vi.fn();
const mockRateLimit = vi.fn();
const mockRateLimitResponse = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    reviews: vi.fn(),
    kpis: vi.fn(),
  },
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
  TTL: { STANDARD: 30 },
}));

vi.mock('@/lib/briefing', () => ({
  gatherDailyData: (...args: unknown[]) => mockGatherDailyData(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: { VIEW: { limit: 30, windowMs: 60_000 } },
}));

describe('cleanup routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheGet.mockReturnValue(null);
    mockHasPermission.mockReturnValue(true);
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockFetchAll.mockResolvedValue([
      airtableRecord('rev_1', {
        Platform: 'Google',
        'Star Rating': 5,
        'Reviewer Name': 'Ava',
        'Review Date': '2026-04-08',
        Sentiment: 'Positive',
        'Response Status': 'Pending',
        'Review Text': 'Amazing.',
      }),
      airtableRecord('rev_2', {
        Platform: 'Yelp',
        'Star Rating': 4,
        'Reviewer Name': 'Mia',
        'Review Date': '2026-04-07',
        Sentiment: 'Positive',
        'Response Status': 'Responded',
        'Review Text': 'Lovely team.',
      }),
    ]);
    mockGatherDailyData.mockResolvedValue({
      date: '2026-04-09',
      revenue: { total: 4200, avgTicket: 350, byProvider: { Rina: 2400 } },
      schedule: { totalAppointments: 12, consultCount: 3 },
      marketing: { newLeads: 4, reviewCount: 2, avgRating: 4.5 },
    });
    mockCreateRecord.mockResolvedValue('rec_kpi_001');
  });

  it('GET /api/dashboard/reviews returns review summary', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/reviews/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.summary.totalReviews).toBe(2);
    expect(data.summary.averageRating).toBe(4.5);
  });

  it('GET /api/dashboard/marketing/reviews enforces permissions', async () => {
    mockGetSession.mockResolvedValue(MARKETING_SESSION);
    mockHasPermission.mockReturnValue(false);
    const { GET } = await import('@/app/api/dashboard/marketing/reviews/route');
    const response = await GET();
    await expectForbidden(response);
  });

  it('GET /api/cron/daily-kpi writes a snapshot', async () => {
    process.env.CRON_SECRET = 'secret';
    const { GET } = await import('@/app/api/cron/daily-kpi/route');
    const req = new Request('http://localhost:3000/api/cron/daily-kpi', {
      headers: { authorization: 'Bearer secret' },
    });
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalled();
    expect(data.snapshotId).toBe('rec_kpi_001');
  });

  it('GET /api/indexnow returns a status payload', async () => {
    const { GET } = await import('@/app/api/indexnow/route');
    const response = await GET(buildGetRequest('/api/indexnow', { url: 'https://www.ranibeautyclinic.com/glp1' }) as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('configured');
    expect(data).toHaveProperty('requestedUrl');
  });

  it('GET /api/dashboard/gamification/wins returns real daily win summaries', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/gamification/wins/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.wins).toHaveLength(4);
    expect(data.wins[0].label).toContain('$4,200');
    expect(data.wins[2].label).toContain('4 new leads');
  });

  it('still returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await import('@/app/api/dashboard/reviews/route');
    const response = await GET();
    await expectUnauthorized(response);
  });
});
