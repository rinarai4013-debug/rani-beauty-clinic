import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();

const generateWeeklyBriefMock = vi.fn();
const calculateComplianceScoreMock = vi.fn();
const fetchAllMock = vi.fn();
const tablesAppointmentsMock = vi.fn();
const tablesTransactionsMock = vi.fn();
const tablesClientsMock = vi.fn();
const tablesReviewsMock = vi.fn();
const predictNoShowMock = vi.fn();
const logPhiAccessFromRequestMock = vi.fn();
const optimizeScheduleMock = vi.fn();

const buildOfflineReportMock = vi.fn();
const buildComplianceReportMock = vi.fn();
const buildFinanceReportMock = vi.fn();
const buildScoredReportMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    REALTIME: 30,
    STANDARD: 60,
    RELAXED: 300,
    SLOW: 1200,
  },
}));

vi.mock('@/lib/backlinks/engine', () => ({
  generateWeeklyBrief: (...args: unknown[]) => generateWeeklyBriefMock(...args),
}));

vi.mock('@/lib/compliance', () => ({
  calculateComplianceScore: (...args: unknown[]) => calculateComplianceScoreMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    appointments: (...args: unknown[]) => tablesAppointmentsMock(...args),
    transactions: (...args: unknown[]) => tablesTransactionsMock(...args),
    clients: (...args: unknown[]) => tablesClientsMock(...args),
    reviews: (...args: unknown[]) => tablesReviewsMock(...args),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/predictions/no-show', () => ({
  predictNoShow: (...args: unknown[]) => predictNoShowMock(...args),
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => logPhiAccessFromRequestMock(...args),
}));

vi.mock('@/lib/schedule/optimizer', () => ({
  optimizeSchedule: (...args: unknown[]) => optimizeScheduleMock(...args),
}));

vi.mock('@/lib/agents/registry', () => ({
  AGENT_IDS: ['compliance-guardian', 'inventory-oracle'],
  AGENT_REGISTRY: {
    'compliance-guardian': {
      name: 'Compliance Guardian',
      icon: 'shield',
      category: 'risk',
      status: 'online',
    },
    'inventory-oracle': {
      name: 'Inventory Oracle',
      icon: 'boxes',
      category: 'operations',
      status: 'offline',
    },
  },
}));

vi.mock('@/lib/agents/report-builder', () => ({
  buildOfflineReport: (...args: unknown[]) => buildOfflineReportMock(...args),
  buildComplianceReport: (...args: unknown[]) => buildComplianceReportMock(...args),
  buildFinanceReport: (...args: unknown[]) => buildFinanceReportMock(...args),
  buildScoredReport: (...args: unknown[]) => buildScoredReportMock(...args),
}));

function nextReq(url: string, cookie = 'session=test') {
  return {
    nextUrl: new URL(url),
    headers: {
      get: (key: string) => (key.toLowerCase() === 'cookie' ? cookie : null),
    },
  } as never;
}

describe('remaining dashboard routes coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ username: 'rina', role: 'ceo' });
    hasPermissionMock.mockReturnValue(true);
    cacheGetMock.mockReturnValue(null);

    generateWeeklyBriefMock.mockReturnValue({ wins: ['seo'] });
    calculateComplianceScoreMock.mockReturnValue({ score: 91, categories: { hipaa: 95 } });
    predictNoShowMock.mockReturnValue({
      score: 72,
      riskLevel: 'high',
      factors: ['new client'],
      confidence: 0.8,
    });
    optimizeScheduleMock.mockReturnValue({
      efficiencyScore: 78,
      gaps: [{ start: '11:00' }],
      conflicts: [],
    });

    buildOfflineReportMock.mockImplementation((agentId: string) => ({
      agentId,
      status: 'offline',
      scorecard: { score: 0 },
      alerts: [],
      recommendations: [],
    }));
    buildComplianceReportMock.mockReturnValue({
      agentId: 'compliance-guardian',
      status: 'online',
      scorecard: { score: 91 },
      alerts: [{ id: 'c1', severity: 'high', title: 'Review logs' }],
      recommendations: [{ id: 'r1', priority: 'p1', title: 'Close gap' }],
    });
    buildFinanceReportMock.mockReturnValue({
      agentId: 'finance-strategist',
      status: 'online',
      scorecard: { score: 83 },
      alerts: [],
      recommendations: [],
    });
    buildScoredReportMock.mockReturnValue({
      agentId: 'inventory-oracle',
      status: 'online',
      scorecard: { score: 77 },
      alerts: [],
      recommendations: [],
    });

    tablesAppointmentsMock.mockReturnValue('appointments');
    tablesTransactionsMock.mockReturnValue('transactions');
    tablesClientsMock.mockReturnValue('clients');
    tablesReviewsMock.mockReturnValue('reviews');

    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'appointments') {
        return [
          {
            id: 'appt1',
            fields: {
              Date: '2026-04-12',
              Time: '10:00',
              Duration: 60,
              Status: 'scheduled',
              Provider: 'Rina',
              'Service Name': 'Sofwave',
              'Service Category': 'Skin Tightening',
              'Booking Source': 'new_google',
              'Is Consult': true,
              'Deposit Paid': false,
              'Deposit Amount': 0,
              'Amount Quoted': 3200,
              'Amount Paid': 0,
              'Client': ['cli_1'],
              'Start Time': '10:00',
              'End Time': '11:00',
              'Room': 'Treatment Room 1',
              'Client Name': 'Jane Doe',
            },
          },
          {
            id: 'appt2',
            fields: {
              Date: '2026-04-12',
              Time: '13:00',
              Duration: 45,
              Status: 'completed',
              Provider: 'Rina',
              'Service Name': 'HydraFacial',
              'Service Category': 'Facial',
              'Booking Source': 'returning',
              'Is Consult': false,
              'Deposit Paid': true,
              'Deposit Amount': 50,
              'Amount Quoted': 275,
              'Amount Paid': 275,
              'Client': ['cli_2'],
              'Start Time': '13:00',
              'End Time': '13:45',
              'Room': 'Treatment Room 2',
              'Client Name': 'Mia Doe',
            },
          },
        ];
      }

      if (table === 'transactions') {
        return [
          { id: 'txn1', fields: { Date: '2026-04-12', Amount: 3200, Type: 'Service', Status: 'Completed', Provider: 'Rina', Service: 'Sofwave' } },
          { id: 'txn2', fields: { Date: '2026-04-12', Amount: 275, Type: 'Service', Status: 'Completed', Provider: 'Rina', Service: 'HydraFacial' } },
        ];
      }

      if (table === 'clients') {
        return [
          { id: 'cli_1', fields: { Client: 'Jane Doe', Status: 'New Lead', Appointments: ['appt1'], Memberships: [] } },
          { id: 'cli_2', fields: { Client: 'Mia Doe', Status: 'Active', Appointments: ['appt2', 'appt0'], Memberships: ['mem1'] } },
        ];
      }

      if (table === 'reviews') {
        return [{ id: 'rev1', fields: { Date: '2026-04-10', Rating: 5, Provider: 'Rina', Source: 'google' } }];
      }

      return [];
    });

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/dashboard/compliance')) {
        return new Response(JSON.stringify({ success: true, data: { score: 90 } }), { status: 200 });
      }
      if (url.includes('/api/dashboard/agents/compliance-guardian')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'online',
              scorecard: { score: 90 },
              alerts: [{ id: 'a1', severity: 'high', title: 'Action needed' }],
              recommendations: [{ id: 'r1', priority: 'p1', title: 'Fix now' }],
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/api/dashboard/agents/inventory-oracle')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'offline',
              scorecard: { score: 0 },
              alerts: [],
              recommendations: [],
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/api/dashboard/inventory')) {
        return new Response(JSON.stringify({ success: true, data: { score: 77, alerts: [] } }), { status: 200 });
      }
      if (url.includes('/api/dashboard/revenue/anomalies') || url.includes('/api/dashboard/finance/pnl')) {
        return new Response(JSON.stringify({ data: {} }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as unknown as typeof global.fetch;
  });

  it('GET /api/dashboard/backlinks enforces auth and returns brief payload', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/backlinks/route');
    const unauthorized = await GET();
    expect(unauthorized.status).toBe(401);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.brief).toEqual({ wins: ['seo'] });
  });

  it('GET /api/dashboard/compliance enforces permission and returns score', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/compliance/route');
    const forbidden = await GET();
    expect(forbidden.status).toBe(403);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.score).toBe(91);
  });

  it('GET /api/dashboard/revenue-optimizer returns auth-guarded summary', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/revenue-optimizer/route');
    const unauthorized = await GET();
    expect(unauthorized.status).toBe(401);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.totalAddressableGap).toBeGreaterThan(0);
    expect(Array.isArray(body.topActions)).toBe(true);
  });

  it('GET /api/dashboard/training supports role filter and returns stats', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/training/route');
    const unauthorized = await GET(new Request('http://localhost:3000/api/dashboard/training') as never);
    expect(unauthorized.status).toBe(401);

    const response = await GET(new Request('http://localhost:3000/api/dashboard/training?role=provider') as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(body.modules)).toBe(true);
    expect(body.stats.totalModules).toBeGreaterThan(0);
  });

  it('GET /api/dashboard/gamification/snapshot returns computed snapshot', async () => {
    const { GET } = await import('@/app/api/dashboard/gamification/snapshot/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.score.total).toBeDefined();
    expect(body.topStats.totalAppointments).toBeGreaterThan(0);
  });

  it('GET /api/dashboard/schedule enforces permission and logs PHI access', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/schedule/route');
    const forbidden = await GET(new Request('http://localhost:3000/api/dashboard/schedule') as never);
    expect(forbidden.status).toBe(403);

    const response = await GET(new Request('http://localhost:3000/api/dashboard/schedule') as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.today.length).toBeGreaterThan(0);
    expect(logPhiAccessFromRequestMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/schedule/no-show-risk returns ranked risk list', async () => {
    const { GET } = await import('@/app/api/dashboard/schedule/no-show-risk/route');
    const response = await GET(
      nextReq('http://localhost:3000/api/dashboard/schedule/no-show-risk?date=2026-04-12'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].noShowScore.score).toBe(72);
    expect(logPhiAccessFromRequestMock).toHaveBeenCalled();
  });

  it('GET /api/dashboard/schedule/optimize returns no-data message and optimized payload', async () => {
    const { GET } = await import('@/app/api/dashboard/schedule/optimize/route');

    fetchAllMock.mockResolvedValueOnce([]);
    const noData = await GET();
    const noDataBody = await noData.json();
    expect(noData.status).toBe(200);
    expect(noDataBody.message).toContain('No appointments');

    fetchAllMock.mockImplementation(async (table: string) => {
      if (table === 'appointments') {
        return [
          {
            id: 'appt1',
            fields: {
              Date: '2026-04-12',
              'Start Time': '10:00',
              'End Time': '11:00',
              'Service Name': 'Sofwave',
              Provider: 'Rina',
              Client: 'Jane',
              Status: 'Scheduled',
              Room: 'Treatment Room 1',
            },
          },
        ];
      }
      return [];
    });

    const optimized = await GET();
    const optimizedBody = await optimized.json();
    expect(optimized.status).toBe(200);
    expect(optimizedBody.success).toBe(true);
    expect(optimizedBody.data.efficiencyScore).toBe(78);
  });

  it('GET /api/dashboard/agents/[agentId] handles auth, unknown, offline, and compliance report', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/agents/[agentId]/route');

    const unauthorized = await GET(
      nextReq('http://localhost:3000/api/dashboard/agents/compliance-guardian'),
      { params: Promise.resolve({ agentId: 'compliance-guardian' }) },
    );
    expect(unauthorized.status).toBe(401);

    const unknown = await GET(
      nextReq('http://localhost:3000/api/dashboard/agents/unknown'),
      { params: Promise.resolve({ agentId: 'unknown' }) },
    );
    expect(unknown.status).toBe(404);

    const offline = await GET(
      nextReq('http://localhost:3000/api/dashboard/agents/inventory-oracle'),
      { params: Promise.resolve({ agentId: 'inventory-oracle' }) },
    );
    const offlineBody = await offline.json();
    expect(offline.status).toBe(200);
    expect(offlineBody.data.status).toBe('offline');

    const compliance = await GET(
      nextReq('http://localhost:3000/api/dashboard/agents/compliance-guardian'),
      { params: Promise.resolve({ agentId: 'compliance-guardian' }) },
    );
    const complianceBody = await compliance.json();
    expect(compliance.status).toBe(200);
    expect(complianceBody.data.scorecard.score).toBe(91);
  });

  it('GET /api/dashboard/agents/feed returns aggregated statuses, alerts, and recommendations', async () => {
    const { GET } = await import('@/app/api/dashboard/agents/feed/route');
    const response = await GET(nextReq('http://localhost:3000/api/dashboard/agents/feed'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.agentStatuses.length).toBe(2);
    expect(body.data.alerts.length).toBeGreaterThanOrEqual(1);
    expect(body.data.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
