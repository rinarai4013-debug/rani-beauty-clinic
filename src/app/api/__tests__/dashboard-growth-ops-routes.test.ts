import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();

const fetchRevenueMock = vi.fn();
const fetchScheduleMock = vi.fn();
const fetchAlertsMock = vi.fn();
const fetchMarketingMock = vi.fn();
const fetchCashFlowMock = vi.fn();
const fetchAIHighlightsMock = vi.fn();
const fetchLoyaltyMock = vi.fn();
const fetchReferralsMock = vi.fn();
const fetchProviderPerformanceMock = vi.fn();
const fetchClientGrowthMock = vi.fn();
const fetchBookingAttributionMock = vi.fn();
const getDaysAgoMock = vi.fn();
const getTodayMock = vi.fn();

const fetchConsultIntelligenceMock = vi.fn();
const fetchReactivationIntelligenceMock = vi.fn();
const fetchProviderIntelligenceMock = vi.fn();
const fetchFillIntelligenceMock = vi.fn();
const buildGrowthIntelligenceMock = vi.fn();
const buildExecutiveBriefingMock = vi.fn();

const analyzeMetaAdsMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();

const tablesAppointmentsMock = vi.fn();
const tablesTransactionsMock = vi.fn();
const tablesReviewsMock = vi.fn();
const fetchAllMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/briefing/data-fetchers', () => ({
  fetchRevenue: (...args: unknown[]) => fetchRevenueMock(...args),
  fetchSchedule: (...args: unknown[]) => fetchScheduleMock(...args),
  fetchAlerts: (...args: unknown[]) => fetchAlertsMock(...args),
  fetchMarketing: (...args: unknown[]) => fetchMarketingMock(...args),
  fetchCashFlow: (...args: unknown[]) => fetchCashFlowMock(...args),
  fetchAIHighlights: (...args: unknown[]) => fetchAIHighlightsMock(...args),
  fetchLoyalty: (...args: unknown[]) => fetchLoyaltyMock(...args),
  fetchReferrals: (...args: unknown[]) => fetchReferralsMock(...args),
  fetchProviderPerformance: (...args: unknown[]) => fetchProviderPerformanceMock(...args),
  fetchClientGrowth: (...args: unknown[]) => fetchClientGrowthMock(...args),
  fetchBookingAttribution: (...args: unknown[]) => fetchBookingAttributionMock(...args),
  getDaysAgo: (...args: unknown[]) => getDaysAgoMock(...args),
  getToday: (...args: unknown[]) => getTodayMock(...args),
}));

vi.mock('@/lib/briefing/consult-intelligence', () => ({
  fetchConsultIntelligence: (...args: unknown[]) => fetchConsultIntelligenceMock(...args),
}));

vi.mock('@/lib/briefing/reactivation-intelligence', () => ({
  fetchReactivationIntelligence: (...args: unknown[]) => fetchReactivationIntelligenceMock(...args),
}));

vi.mock('@/lib/briefing/provider-intelligence', () => ({
  fetchProviderIntelligence: (...args: unknown[]) => fetchProviderIntelligenceMock(...args),
}));

vi.mock('@/lib/briefing/fill-intelligence', () => ({
  fetchFillIntelligence: (...args: unknown[]) => fetchFillIntelligenceMock(...args),
}));

vi.mock('@/lib/briefing/growth-intelligence', () => ({
  buildGrowthIntelligence: (...args: unknown[]) => buildGrowthIntelligenceMock(...args),
}));

vi.mock('@/lib/briefing/executive-os', () => ({
  buildExecutiveBriefing: (...args: unknown[]) => buildExecutiveBriefingMock(...args),
}));

vi.mock('@/lib/ads/meta-ads-manager', () => ({
  analyzeMetaAds: (...args: unknown[]) => analyzeMetaAdsMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    RELAXED: 300,
    SLOW: 1200,
  },
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    appointments: (...args: unknown[]) => tablesAppointmentsMock(...args),
    transactions: (...args: unknown[]) => tablesTransactionsMock(...args),
    reviews: (...args: unknown[]) => tablesReviewsMock(...args),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

describe('dashboard growth + ops routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_AD_ACCOUNT_ID;

    getSessionMock.mockResolvedValue({ username: 'rina', role: 'ceo' });
    hasPermissionMock.mockReturnValue(true);

    getDaysAgoMock.mockReturnValue('2026-04-04');
    getTodayMock.mockReturnValue('2026-04-11');

    fetchRevenueMock.mockResolvedValue({ total: 32000 });
    fetchScheduleMock.mockResolvedValue({ utilization: 82 });
    fetchAlertsMock.mockResolvedValue([{ id: 'a1' }]);
    fetchMarketingMock.mockResolvedValue({ leads: 47 });
    fetchCashFlowMock.mockResolvedValue({ net: 12000 });
    fetchAIHighlightsMock.mockResolvedValue({ wins: ['retention'] });
    fetchLoyaltyMock.mockResolvedValue({ members: 210 });
    fetchReferralsMock.mockResolvedValue({ rate: 0.26 });
    fetchProviderPerformanceMock.mockResolvedValue([{ provider: 'Rina', utilization: 88 }]);
    fetchClientGrowthMock.mockResolvedValue({ monthOverMonth: 0.12 });
    fetchBookingAttributionMock.mockResolvedValue([{ channel: 'organic', booked: 12 }]);
    fetchConsultIntelligenceMock.mockResolvedValue({ closeRate: 0.42 });
    fetchReactivationIntelligenceMock.mockResolvedValue({ dormantClients: 19 });
    fetchProviderIntelligenceMock.mockResolvedValue([{ provider: 'Rina' }]);
    fetchFillIntelligenceMock.mockResolvedValue({ openings: 4 });
    buildGrowthIntelligenceMock.mockReturnValue({ growthScore: 91 });
    buildExecutiveBriefingMock.mockReturnValue({ headline: 'Strong week' });

    cacheGetMock.mockReturnValue(null);
    analyzeMetaAdsMock.mockReturnValue({
      grade: 'B',
      recommendations: ['Consolidate low CTR adsets'],
    });

    tablesAppointmentsMock.mockReturnValue('appointments');
    tablesTransactionsMock.mockReturnValue('transactions');
    tablesReviewsMock.mockReturnValue('reviews');

    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'appointments') {
        return [
          {
            id: 'appt1',
            fields: {
              Provider: 'Rina',
              Date: '2026-04-08',
              Duration: 60,
              Status: 'completed',
              'Service Name': 'Sofwave',
              'Service Category': 'Skin Tightening',
              'Client Name': 'Jane Doe',
              'Is Consult': false,
            },
          },
          {
            id: 'appt2',
            fields: {
              Provider: 'Rina',
              Date: '2026-04-09',
              Duration: 30,
              Status: 'no_show',
              'Service Name': 'Consult',
              'Service Category': 'Consult',
              'Client Name': 'Mia Doe',
              'Is Consult': true,
            },
          },
          {
            id: 'appt3',
            fields: {
              Provider: 'Mom',
              Date: '2026-04-09',
              Duration: 45,
              Status: 'completed',
              'Service Name': 'HydraFacial',
              'Service Category': 'Facial',
              'Client Name': 'Anna Doe',
              'Is Consult': false,
            },
          },
        ];
      }

      if (table === 'transactions') {
        return [
          {
            id: 'txn1',
            fields: {
              Provider: 'Rina',
              Date: '2026-04-08',
              Amount: 3200,
              Type: 'Service',
              Status: 'Completed',
              Service: 'Sofwave',
            },
          },
          {
            id: 'txn2',
            fields: {
              Provider: 'Mom',
              Date: '2026-04-08',
              Amount: 275,
              Type: 'Service',
              Status: 'Completed',
              Service: 'HydraFacial',
            },
          },
        ];
      }

      if (table === 'reviews') {
        return [
          {
            id: 'rev1',
            fields: {
              Date: '2026-04-07',
              Rating: 5,
              Provider: 'Rina',
              Source: 'google',
            },
          },
          {
            id: 'rev2',
            fields: {
              Date: '2026-04-08',
              Rating: 4,
              Provider: 'Rina',
              Source: 'yelp',
            },
          },
        ];
      }

      return [];
    });

    global.fetch = vi.fn() as unknown as typeof global.fetch;
  });

  it('GET /api/dashboard/briefing returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/briefing/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/briefing returns executive briefing payload', async () => {
    const { GET } = await import('@/app/api/dashboard/briefing/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.briefing).toEqual({ headline: 'Strong week' });
    expect(buildExecutiveBriefingMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/marketing returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/marketing/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/marketing returns 403 without permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/marketing/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/marketing returns marketing overview payload', async () => {
    const { GET } = await import('@/app/api/dashboard/marketing/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kpis.totalLeads).toBe(47);
    expect(body.channelBreakdown.length).toBeGreaterThan(0);
    expect(body.upcomingContent.length).toBeGreaterThan(0);
  });

  it('GET /api/dashboard/meta-ads returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/meta-ads/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/meta-ads returns 403 when role lacks permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/meta-ads/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/meta-ads returns cached payload when available', async () => {
    cacheGetMock.mockReturnValueOnce({
      summary: { totalSpend: 999 },
      campaigns: [{ id: 'c1' }],
      dateRange: 'cached',
    });
    const { GET } = await import('@/app/api/dashboard/meta-ads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.totalSpend).toBe(999);
  });

  it('GET /api/dashboard/meta-ads returns configuration guidance when env vars are missing', async () => {
    const { GET } = await import('@/app/api/dashboard/meta-ads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.error).toBe('Meta Ads not configured');
    expect(body.campaigns).toEqual([]);
  });

  it('GET /api/dashboard/meta-ads maps API data and caches computed summary', async () => {
    process.env.META_ACCESS_TOKEN = 'meta_token';
    process.env.META_AD_ACCOUNT_ID = 'act_123';

    (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'cmp_1',
                name: 'Lead Campaign',
                status: 'ACTIVE',
                insights: {
                  data: [
                    {
                      spend: '100',
                      impressions: '10000',
                      clicks: '150',
                      actions: [{ action_type: 'lead', value: '10' }],
                      action_values: [{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '450' }],
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const { GET } = await import('@/app/api/dashboard/meta-ads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.totalSpend).toBe(100);
    expect(body.summary.totalConversions).toBe(10);
    expect(body.campaigns[0].name).toBe('Lead Campaign');
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/providers returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/providers/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/providers returns 403 without provider permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/providers/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/providers returns cached provider payload', async () => {
    cacheGetMock.mockReturnValueOnce({ providers: [{ name: 'Cached Provider' }] });
    const { GET } = await import('@/app/api/dashboard/providers/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providers[0].name).toBe('Cached Provider');
  });

  it('GET /api/dashboard/providers computes provider summary when uncached', async () => {
    const { GET } = await import('@/app/api/dashboard/providers/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.providers)).toBe(true);
    expect(body.providers.find((p: { name: string }) => p.name === 'Rina')).toBeDefined();
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/providers/[name] returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/providers/[name]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/providers/rina') as never,
      { params: Promise.resolve({ name: 'rina' }) },
    );

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/providers/[name] returns 404 for unknown provider slug', async () => {
    const { GET } = await import('@/app/api/dashboard/providers/[name]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/providers/unknown') as never,
      { params: Promise.resolve({ name: 'unknown' }) },
    );

    expect(response.status).toBe(404);
  });

  it('GET /api/dashboard/providers/[name] returns cached detail when available', async () => {
    cacheGetMock.mockReturnValueOnce({ name: 'Rina', monthlyStats: { revenue: 5000 } });
    const { GET } = await import('@/app/api/dashboard/providers/[name]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/providers/rina') as never,
      { params: Promise.resolve({ name: 'rina' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.monthlyStats.revenue).toBe(5000);
  });

  it('GET /api/dashboard/providers/[name] computes detailed provider stats when uncached', async () => {
    const { GET } = await import('@/app/api/dashboard/providers/[name]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/providers/rina') as never,
      { params: Promise.resolve({ name: 'rina' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe('Rina');
    expect(body.monthlyStats.revenue).toBeGreaterThanOrEqual(0);
    expect(body.reviews.count).toBeGreaterThanOrEqual(0);
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/providers/[name] returns 500 on downstream fetch errors', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('airtable down'));
    const { GET } = await import('@/app/api/dashboard/providers/[name]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/providers/rina') as never,
      { params: Promise.resolve({ name: 'rina' }) },
    );

    expect(response.status).toBe(500);
  });

  it('GET /api/dashboard/reactivation returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/reactivation/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/reactivation returns reactivation payload', async () => {
    fetchReactivationIntelligenceMock.mockResolvedValueOnce({ dormantClients: 31 });
    const { GET } = await import('@/app/api/dashboard/reactivation/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.reactivation.dormantClients).toBe(31);
  });
});
