import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const fetchAllMock = vi.fn();
const fetchFirstMock = vi.fn();
const updateRecordMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const intakesFindMock = vi.fn();
const intakeIntelligenceFindMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      find: (...args: unknown[]) => intakesFindMock(...args),
    })),
    intakeIntelligence: vi.fn(() => ({
      find: (...args: unknown[]) => intakeIntelligenceFindMock(...args),
    })),
    treatmentPlans: vi.fn(() => ({})),
    appointments: vi.fn(() => ({})),
    transactions: vi.fn(() => ({})),
    alerts: vi.fn(() => ({})),
    clients: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    MODERATE: 300_000,
    REALTIME: 30_000,
  },
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      status: 'Status',
      clientName: 'Client Name',
      createdDate: 'Created Date',
      planTier: 'Plan Tier',
      planValue: 'Plan Value',
      servicesIncluded: 'Services Included',
      planUrl: 'Plan URL',
    },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((value: string) => value),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

function makePlanCode(recordId: string, secret: string): string {
  const hash = crypto.createHmac('sha256', secret).update(recordId).digest('hex');
  const numericHash = parseInt(hash.slice(0, 8), 16);
  return String(numericHash % 1000000).padStart(6, '0');
}

describe('dashboard leads, alerts, and public plan routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.DASHBOARD_JWT_SECRET = 'test-secret';

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });
    hasPermissionMock.mockReturnValue(true);
    cacheGetMock.mockReturnValue(null);

    intakesFindMock.mockResolvedValue({
      id: 'recABCDEFGHIJ',
      fields: {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        'Created Date': new Date().toISOString(),
        'Top Skin Concerns': 'Texture, Redness',
        'Target Areas': 'Face',
        'Program Plan (AI)': 'Plan',
        'Processing Status': 'New',
      },
    });

    intakeIntelligenceFindMock.mockResolvedValue({
      id: 'intel_1',
      fields: {
        'Program Plan (AI)': 'Improved Plan',
        'Skin Health Score': 78,
      },
    });

    fetchFirstMock.mockResolvedValue([]);
    updateRecordMock.mockResolvedValue(undefined);
  });

  it('GET /api/dashboard/leads rejects unauthenticated users', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/leads enforces lead-view permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/leads returns funnel metrics for authorized users', async () => {
    fetchAllMock
      .mockResolvedValueOnce([
        { fields: { 'Processing Status': 'New' } },
        { fields: { 'Processing Status': 'Processed' } },
      ])
      .mockResolvedValueOnce([
        { fields: { 'Is Consult': true, Status: 'Completed' } },
        { fields: { 'Is Consult': true, Status: 'Booked' } },
      ])
      .mockResolvedValueOnce([
        { fields: { Status: 'Sent' } },
        { fields: { Status: 'Booked' } },
      ])
      .mockResolvedValueOnce([
        { fields: { Type: 'Deposit', Status: 'Paid' } },
      ]);

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.newLeads).toBe(1);
    expect(body.metrics.converted).toBe(1);
    expect(Array.isArray(body.stages)).toBe(true);
  });

  it('GET /api/dashboard/leads returns cached payload when available', async () => {
    cacheGetMock.mockReturnValueOnce({
      stages: [{ name: 'New Leads', count: 3, percentage: 100, color: '#C9A96E' }],
      metrics: { newLeads: 3, contacted: 2, converted: 1 },
      conversionRates: { leadToConsult: 67, consultShowRate: 50, consultCloseRate: 50, depositCaptureRate: 0 },
      avgResponseTime: 0,
      avgTreatmentPlanValue: 0,
      topLeadSources: [],
    });

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.newLeads).toBe(3);
    expect(fetchAllMock).not.toHaveBeenCalled();
  });

  it('GET /api/dashboard/leads returns 500 when Airtable fetch fails', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('intakes unavailable'));

    const { GET } = await import('@/app/api/dashboard/leads/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch lead funnel data');
  });

  it('GET /api/dashboard/leads/stats returns 403 without lead-view permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { GET } = await import('@/app/api/dashboard/leads/stats/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/leads/stats returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/leads/stats/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/leads/stats computes funnel and consult conversion', async () => {
    fetchAllMock
      .mockResolvedValueOnce([
        { fields: { Status: 'New Lead' } },
        { fields: { Status: 'Active' } },
      ])
      .mockResolvedValueOnce([
        { fields: { 'Consult Outcome': 'booked' } },
        { fields: { 'Consult Outcome': 'Booked' } },
        { fields: { 'Consult Outcome': 'no_show' } },
      ]);

    const { GET } = await import('@/app/api/dashboard/leads/stats/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.funnel.newLeads).toBe(1);
    expect(body.consults.booked).toBe(2);
    expect(body.consults.conversionRate).toBe(67);
  });

  it('GET /api/dashboard/leads/stats returns cached payload when available', async () => {
    cacheGetMock.mockReturnValueOnce({
      funnel: { newLeads: 4, active: 10, lapsed: 2, churned: 1, total: 17 },
      consults: { total: 6, booked: 3, conversionRate: 50 },
      asOf: '2026-04-12T00:00:00.000Z',
    });

    const { GET } = await import('@/app/api/dashboard/leads/stats/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.funnel.total).toBe(17);
    expect(fetchAllMock).not.toHaveBeenCalled();
  });

  it('GET /api/dashboard/leads/stats returns 500 on downstream failures', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('clients table unavailable'));

    const { GET } = await import('@/app/api/dashboard/leads/stats/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch lead stats');
  });

  it('GET /api/dashboard/alerts returns normalized active alerts', async () => {
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'alt_1',
        fields: {
          Type: 'operations',
          Severity: 'critical',
          Message: 'Inventory anomaly',
          Status: 'Active',
          'Created Date': '2026-04-10T00:00:00.000Z',
        },
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(1);
    expect(body.data.bySeverity.critical).toBe(1);
  });

  it('GET /api/dashboard/alerts returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/alerts enforces executive permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/alerts serves cached payload without hitting Airtable', async () => {
    cacheGetMock.mockReturnValueOnce({
      success: true,
      data: {
        total: 1,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
        alerts: [
          {
            id: 'alt_cached_1',
            severity: 'high',
            message: 'Cached alert',
          },
        ],
      },
      generatedAt: '2026-04-12T00:00:00.000Z',
    });

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.total).toBe(1);
    expect(body.data.alerts[0].message).toBe('Cached alert');
    expect(fetchAllMock).not.toHaveBeenCalled();
  });

  it('GET /api/dashboard/alerts normalizes mixed severities and returns 500 on fetch failures', async () => {
    fetchAllMock
      .mockResolvedValueOnce([
        {
          id: 'alt_urgent',
          fields: {
            Type: 'ops',
            Severity: 'urgent',
            Message: 'Urgent issue',
            Status: 'Active',
            'Created Date': '2026-04-10T00:00:00.000Z',
          },
        },
        {
          id: 'alt_warning',
          fields: {
            Type: 'ops',
            Severity: 'warning',
            Message: 'Warning issue',
            Status: 'Active',
            'Created Date': '2026-04-11T00:00:00.000Z',
          },
        },
        {
          id: 'alt_other',
          fields: {
            Type: 'ops',
            Severity: 'unknown',
            Message: 'Unknown severity',
            Status: 'Active',
            'Created Date': '2026-04-12T00:00:00.000Z',
          },
        },
      ])
      .mockRejectedValueOnce(new Error('alerts table unavailable'));

    const { GET } = await import('@/app/api/dashboard/alerts/route');
    const okResponse = await GET();
    const okBody = await okResponse.json();

    expect(okResponse.status).toBe(200);
    expect(okBody.data.bySeverity.critical).toBe(1);
    expect(okBody.data.bySeverity.high).toBe(1);
    expect(okBody.data.bySeverity.low).toBe(1);

    cacheGetMock.mockReturnValueOnce(null);
    const failResponse = await GET();
    const failBody = await failResponse.json();

    expect(failResponse.status).toBe(500);
    expect(failBody.success).toBe(false);
  });

  it('GET /api/plan/[id] enforces access code', async () => {
    const { GET } = await import('@/app/api/plan/[id]/route');
    const request = new Request('http://localhost:3000/api/plan/recABCDEFGHIJ');
    const response = await GET(request as never, { params: { id: 'recABCDEFGHIJ' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.requiresCode).toBe(true);
  });

  it('GET /api/plan/[id] returns sanitized plan payload with valid code', async () => {
    const id = 'recABCDEFGHIJ';
    const code = makePlanCode(id, 'test-secret');

    const { GET } = await import('@/app/api/plan/[id]/route');
    const request = new Request(`http://localhost:3000/api/plan/${id}?code=${code}`);
    const response = await GET(request as never, { params: { id } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plan).toBeDefined();
    expect(body.plan.email).toBe('');
    expect(body.plan.phone).toBe('');
  });
});
