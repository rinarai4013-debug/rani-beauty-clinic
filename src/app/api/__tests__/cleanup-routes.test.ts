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
    reviews: vi.fn(() => 'reviews'),
    kpis: vi.fn(() => 'kpis'),
    transactions: vi.fn(() => 'transactions'),
    appointments: vi.fn(() => 'appointments'),
    alerts: vi.fn(() => 'alerts'),
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
    mockFetchAll.mockImplementation(async (table: unknown) => {
      if (table === 'reviews') {
        return [
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
        ];
      }

      if (table === 'transactions') {
        return [
          airtableRecord('tx_1', {
            Date: '2026-04-09',
            Amount: 1200,
            Type: 'Sale',
            'Payment Method': 'Cherry',
            Provider: 'Rina',
            'Service Name': 'GLP-1 Starter',
            Status: 'Completed',
            'Is Financing': true,
            'Financing Provider': 'Cherry',
          }),
          airtableRecord('tx_2', {
            Date: '2026-04-08',
            Amount: 650,
            Type: 'Sale',
            'Payment Method': 'Credit Card',
            Provider: 'Mom',
            'Service Name': 'HydraFacial',
            Status: 'Completed',
            'Is Financing': false,
            'Financing Provider': '',
          }),
        ];
      }

      if (table === 'appointments') {
        return [
          airtableRecord('appt_1', {
            'Service Name': 'GLP-1 Starter',
            'Service Category': 'Wellness',
            Provider: 'Rina',
            Date: '2026-04-09',
            Duration: 30,
            Status: 'completed',
            'Is Consult': true,
            'Booking Source': 'GLP-1 Landing Page',
            'Amount Paid': 1200,
          }),
          airtableRecord('appt_2', {
            'Service Name': 'GLP-1 Follow-Up',
            'Service Category': 'Wellness',
            Provider: 'Rina',
            Date: '2026-04-08',
            Duration: 20,
            Status: 'completed',
            'Is Consult': false,
            'Booking Source': 'Website Contact Form',
            'Amount Paid': 0,
          }),
        ];
      }

      if (table === 'alerts') {
        return [
          airtableRecord('alert_1', {
            Message: '[Inventory add] Semaglutide Pen (GLP100) - 12 units | wellness_supplies | Restock shipment',
            'Created Date': '2026-04-09T10:00:00.000Z',
          }),
          airtableRecord('alert_2', {
            Message: '[Inventory subtract] Syringe Pack (SYR200) - 3 units | disposables | Daily usage',
            'Created Date': '2026-04-09T11:00:00.000Z',
          }),
        ];
      }

      return [];
    });
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

  it('GET /api/dashboard/payments returns real payment mix', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/payments/route');
    const response = await GET(buildGetRequest('/api/dashboard/payments', { range: 'mtd' }) as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalCollected).toBe(1850);
    expect(data.summary.financingCollected).toBe(1200);
    expect(data.paymentMethods[0].method).toBe('Cherry');
  });

  it('GET /api/dashboard/glp1 returns live GLP-1 activity summary', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/glp1/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.monthToDateAppointments).toBe(2);
    expect(data.summary.monthToDateRevenue).toBe(1200);
    expect(data.summary.bookingSources['GLP-1 Landing Page']).toBe(1);
  });

  it('GET /api/dashboard/inventory/analytics summarizes real inventory movement', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/inventory/analytics/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalItems).toBe(2);
    expect(data.categories[0].category).toBe('wellness_supplies');
    expect(data.recentMovements).toHaveLength(2);
    expect(data.recentMovements[0].itemName).toBe('Semaglutide Pen');
  });

  it('still returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await import('@/app/api/dashboard/reviews/route');
    const response = await GET();
    await expectUnauthorized(response);
  });
});
