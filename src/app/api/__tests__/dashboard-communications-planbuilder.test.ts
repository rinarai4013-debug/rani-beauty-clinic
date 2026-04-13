import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const fetchAllMock = vi.fn();
const updateRecordMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const logPhiAccessMock = vi.fn();
const sanitizeFormulaValueMock = vi.fn((value: string) => `sanitized(${value})`);
const getCommunicationAnalyticsMock = vi.fn();
const getConversationStatsMock = vi.fn();
const getAllCampaignsMock = vi.fn();
const resendSendMock = vi.fn();
const treatmentPlansFindMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({})),
    treatmentPlans: vi.fn(() => ({
      find: (...args: unknown[]) => treatmentPlansFindMock(...args),
    })),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      status: 'Status',
      planUrl: 'Plan URL',
      sentAt: 'Sent At',
      clientEmail: 'Client Email',
      clientName: 'Client Name',
      clientPhone: 'Client Phone',
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    RELAXED: 900_000,
  },
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => logPhiAccessMock(...args),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: (...args: unknown[]) => sanitizeFormulaValueMock(...args),
}));

vi.mock('@/lib/communications', () => ({
  getCommunicationAnalytics: (...args: unknown[]) => getCommunicationAnalyticsMock(...args),
  getConversationStats: (...args: unknown[]) => getConversationStatsMock(...args),
  getAllCampaigns: (...args: unknown[]) => getAllCampaignsMock(...args),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => resendSendMock(...args),
    },
  })),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('dashboard communications and plan-builder routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.DASHBOARD_JWT_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.ranibeautyclinic.com';

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });
    hasPermissionMock.mockReturnValue(true);
    cacheGetMock.mockReturnValue(null);
    sanitizeFormulaValueMock.mockClear();

    getCommunicationAnalyticsMock.mockReturnValue({
      totalSent: 100,
      avgOpenRate: 42,
      avgClickRate: 8,
      totalRevenueAttributed: 4500,
    });
    getConversationStatsMock.mockReturnValue({
      activeConversations: 3,
      unresolved: 1,
    });
    getAllCampaignsMock.mockReturnValue([
      { id: 'c1', status: 'sending' },
      { id: 'c2', status: 'scheduled' },
      { id: 'c3', status: 'draft' },
    ]);

    fetchAllMock.mockResolvedValue([
      {
        id: 'rec_client_1',
        fields: {
          Client: 'Jane Doe',
          Email: 'jane@example.com',
          Phone: '425-555-0100',
          'Preferred Contact': 'email',
          Status: 'Active',
        },
      },
    ]);

    resendSendMock.mockResolvedValue({ id: 'email_1' });
    updateRecordMock.mockResolvedValue(undefined);
    treatmentPlansFindMock.mockResolvedValue({
      id: 'recABCDEFGHIJ',
      fields: {
        'Client Name': 'Jane Doe',
        'Plan Name': 'Custom Plan',
        'Services Included': JSON.stringify({ phases: [], packages: [] }),
      },
    });
  });

  it('GET /api/dashboard/communications returns 401 without staff session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/communications/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/communications'));

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/communications returns overview payload for authenticated users', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/communications'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.campaigns.total).toBe(3);
    expect(body.data.campaigns.active).toBe(2);
  });

  it('GET /api/dashboard/communications returns 500 when analytics aggregation throws', async () => {
    getCommunicationAnalyticsMock.mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });

    const { GET } = await import('@/app/api/dashboard/communications/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/communications'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to load communication overview');
  });

  it('GET /api/dashboard/communications/preferences enforces view_clients permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/preferences');
    const response = await GET(request as never);

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/communications/preferences returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/preferences');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/communications/preferences returns mapped preferences and logs access', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences?clientId=rec_client_1';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toBeDefined();
    expect(body.preferences.name).toBe('Jane Doe');
    expect(logPhiAccessMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/communications/preferences sanitizes clientId before filterByFormula', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const injected = `' OR TRUE() OR '`;
    const encoded = encodeURIComponent(injected);
    const url = `http://localhost:3000/api/dashboard/communications/preferences?clientId=${encoded}`;
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);

    expect(response.status).toBe(200);
    expect(sanitizeFormulaValueMock).toHaveBeenCalledWith(injected);
    expect(fetchAllMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        filterByFormula: expect.stringContaining(`sanitized(${injected})`),
      }),
      true,
    );
  });

  it('GET /api/dashboard/communications/preferences returns null for unknown client id', async () => {
    fetchAllMock.mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences?clientId=missing';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toBeNull();
    expect(body.total).toBe(0);
  });

  it('GET /api/dashboard/communications/preferences serves from cache when available', async () => {
    cacheGetMock.mockReturnValueOnce({
      preferences: [
        {
          id: 'rec_cached_1',
          name: 'Cached Client',
          email: 'cached@example.com',
          phone: '206-555-0102',
          preferredContact: 'email',
          status: 'Active',
        },
      ],
      total: 1,
      asOf: '2026-04-12T00:00:00.000Z',
    });

    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.preferences[0].name).toBe('Cached Client');
    expect(fetchAllMock).not.toHaveBeenCalled();
  });

  it('GET /api/dashboard/communications/preferences returns 500 when Airtable fetch fails', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('airtable read failed'));

    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences?clientId=rec_client_1';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch preferences');
  });

  it('POST /api/dashboard/plan-builder/send returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/dashboard/plan-builder/send validates required fields', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId: 'bad' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/dashboard/plan-builder/send returns 400 for malformed JSON', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"planId":',
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });

  it('POST /api/dashboard/plan-builder/send sends email and updates treatment plan', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
        clientPhone: '425-555-0100',
      }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.planUrl).toContain('/plan/recABCDEFGHIJ?code=');
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/dashboard/plan-builder/send returns 500 when JWT secret is missing', async () => {
    process.env.DASHBOARD_JWT_SECRET = '';

    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(updateRecordMock).not.toHaveBeenCalled();
  });

  it('POST /api/dashboard/plan-builder/send returns 500 when email dispatch fails', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('resend outage'));

    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
    expect(updateRecordMock).not.toHaveBeenCalled();
  });

  it('POST /api/dashboard/plan-builder/send returns 500 when Airtable update fails', async () => {
    updateRecordMock.mockRejectedValueOnce(new Error('airtable write failed'));

    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/dashboard/plan-builder/export-pdf returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planData: {
          clientName: 'Jane Doe',
          phases: [],
          packages: [],
        },
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/dashboard/plan-builder/export-pdf returns 400 for malformed JSON', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/dashboard/plan-builder/export-pdf returns HTML when given valid planData', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planData: {
          clientName: 'Jane Doe',
          phases: [],
          packages: [],
        },
      }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.html).toBe('string');
    expect(body.html).toContain('RANI BEAUTY');
  });

  it('POST /api/dashboard/plan-builder/export-pdf validates missing planData and planId', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/dashboard/plan-builder/export-pdf returns 200 for valid planId lookups', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId: 'recABCDEFGHIJ' }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.html).toBe('string');
    expect(body.html).toContain('Jane Doe');
    expect(treatmentPlansFindMock).toHaveBeenCalledWith('recABCDEFGHIJ');
  });

  it('POST /api/dashboard/plan-builder/export-pdf returns 500 when stored services JSON is invalid', async () => {
    treatmentPlansFindMock.mockResolvedValueOnce({
      id: 'recABCDEFGHIJ',
      fields: {
        'Client Name': 'Jane Doe',
        'Plan Name': 'Custom Plan',
        'Services Included': '{not-json',
      },
    });

    const { POST } = await import('@/app/api/dashboard/plan-builder/export-pdf/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/export-pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId: 'recABCDEFGHIJ' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
  });
});
