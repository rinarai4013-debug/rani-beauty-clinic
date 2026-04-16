import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();

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
    STANDARD: 300,
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: async (_name: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/lib/agents/registry', () => ({
  AGENT_IDS: ['compliance-guardian', 'finance-strategist', 'offline-agent'],
  AGENT_REGISTRY: {
    'compliance-guardian': {
      name: 'Compliance Guardian',
      icon: 'shield',
      category: 'compliance',
      status: 'live',
    },
    'finance-strategist': {
      name: 'Finance Strategist',
      icon: 'wallet',
      category: 'finance',
      status: 'live',
    },
    'inventory-oracle': {
      name: 'Inventory Oracle',
      icon: 'box',
      category: 'operations',
      status: 'live',
    },
    'retention-empress': {
      name: 'Retention Empress',
      icon: 'heart',
      category: 'growth',
      status: 'live',
    },
    'offline-agent': {
      name: 'Offline Agent',
      icon: 'pause',
      category: 'ops',
      status: 'offline',
    },
    'recommendation-only-agent': {
      name: 'Recommendation Agent',
      icon: 'lightbulb',
      category: 'strategy',
      status: 'recommendation-only',
    },
  },
}));

vi.mock('@/lib/agents/report-builder', () => ({
  buildOfflineReport: (...args: unknown[]) => buildOfflineReportMock(...args),
  buildComplianceReport: (...args: unknown[]) => buildComplianceReportMock(...args),
  buildFinanceReport: (...args: unknown[]) => buildFinanceReportMock(...args),
  buildScoredReport: (...args: unknown[]) => buildScoredReportMock(...args),
}));

import { GET as agentFeedGET } from '@/app/api/dashboard/agents/feed/route';
import { GET as agentByIdGET } from '@/app/api/dashboard/agents/[agentId]/route';

function req(path: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: 'session=abc' },
  });
}

describe('dashboard agents depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ username: 'rina', role: 'ceo' });
    hasPermissionMock.mockReturnValue(true);
    cacheGetMock.mockReturnValue(null);
    cacheSetMock.mockReturnValue(undefined);
    buildOfflineReportMock.mockImplementation((agentId: string) => ({
      agentId,
      status: 'offline',
      scorecard: { score: 0 },
      alerts: [],
      recommendations: [],
    }));
    buildComplianceReportMock.mockReturnValue({
      agentId: 'compliance-guardian',
      status: 'live',
      scorecard: { score: 95 },
      alerts: [],
      recommendations: [],
    });
    buildFinanceReportMock.mockReturnValue({
      agentId: 'finance-strategist',
      status: 'live',
      scorecard: { score: 78 },
      alerts: [],
      recommendations: [],
    });
    buildScoredReportMock.mockReturnValue({
      agentId: 'inventory-oracle',
      status: 'live',
      scorecard: { score: 74 },
      alerts: [],
      recommendations: [],
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null }), { status: 200 }),
    ) as unknown as typeof global.fetch;
  });

  it('feed returns cached payload without internal fetches', async () => {
    const cached = { alerts: [], recommendations: [], agentStatuses: [] };
    cacheGetMock.mockReturnValueOnce(cached);

    const response = await agentFeedGET(req('/api/dashboard/agents/feed'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(cached);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('feed aggregates/sorts alerts and recommendations and truncates output', async () => {
    const reportA = {
      status: 'live',
      scorecard: { score: 91 },
      alerts: [
        { severity: 'low', title: 'low' },
        { severity: 'critical', title: 'critical' },
        ...Array.from({ length: 25 }, (_, i) => ({ severity: 'medium', title: `m-${i}` })),
      ],
      recommendations: [
        { priority: 'p2', title: 'late' },
        { priority: 'p0', title: 'first' },
        ...Array.from({ length: 20 }, (_, i) => ({ priority: 'p3', title: `r-${i}` })),
      ],
    };
    const reportB = {
      status: 'live',
      scorecard: { score: 72 },
      alerts: [{ severity: 'high', title: 'high' }],
      recommendations: [{ priority: 'p1', title: 'second' }],
    };

    (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: reportA }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: reportB }), { status: 200 }))
      .mockRejectedValueOnce(new Error('agent timeout'));

    const response = await agentFeedGET(req('/api/dashboard/agents/feed'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alerts).toHaveLength(20);
    expect(body.data.recommendations).toHaveLength(15);
    expect(body.data.alerts[0].severity).toBe('critical');
    expect(body.data.recommendations[0].priority).toBe('p0');
    expect(body.data.agentStatuses).toHaveLength(3);
    expect(body.data.agentStatuses[2].status).toBe('offline');
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/dashboard/agents/compliance-guardian',
      { headers: { cookie: 'session=abc' } },
    );
  });

  it('agent route returns offline report for offline/recommendation-only agents', async () => {
    const response = await agentByIdGET(req('/api/dashboard/agents/offline-agent'), {
      params: Promise.resolve({ agentId: 'offline-agent' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(buildOfflineReportMock).toHaveBeenCalledWith('offline-agent');
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it('agent route returns 404 for unknown agents', async () => {
    const response = await agentByIdGET(req('/api/dashboard/agents/nope'), {
      params: Promise.resolve({ agentId: 'nope' }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('Unknown agent');
  });

  it('compliance-guardian route builds compliance report and caches it', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { status: 'ok', overall: 92 } }), {
        status: 200,
      }),
    );

    const response = await agentByIdGET(req('/api/dashboard/agents/compliance-guardian'), {
      params: Promise.resolve({ agentId: 'compliance-guardian' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(buildComplianceReportMock).toHaveBeenCalledWith({ status: 'ok', overall: 92 });
    expect(cacheSetMock).toHaveBeenCalledWith(
      'agent-report-compliance-guardian:localhost',
      expect.any(Object),
      300,
    );
  });

  it('finance-strategist route tolerates one upstream fetch failure', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('anomaly down'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { grossRevenue: 120000 } }), { status: 200 }),
      );

    const response = await agentByIdGET(req('/api/dashboard/agents/finance-strategist'), {
      params: Promise.resolve({ agentId: 'finance-strategist' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(buildFinanceReportMock).toHaveBeenCalledWith(null, { grossRevenue: 120000 });
  });

  it('inventory-oracle route maps warning alerts to high severity', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            score: 82,
            alerts: [
              { id: '1', type: 'stockout', severity: 'warning', message: 'Low inventory', action: 'Reorder' },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const response = await agentByIdGET(req('/api/dashboard/agents/inventory-oracle'), {
      params: Promise.resolve({ agentId: 'inventory-oracle' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(buildScoredReportMock).toHaveBeenCalledWith(
      'inventory-oracle',
      82,
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'high',
          title: 'Inventory: stockout',
          actionRequired: 'Reorder',
        }),
      ]),
      [],
      { alertCount: 1 },
    );
  });

  it('retention-empress route handles loyalty API failure gracefully', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('loyalty down'),
    );

    const response = await agentByIdGET(req('/api/dashboard/agents/retention-empress'), {
      params: Promise.resolve({ agentId: 'retention-empress' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(buildScoredReportMock).toHaveBeenCalledWith(
      'retention-empress',
      60,
      [],
      [],
      { loyaltyMembers: 0 },
    );
  });
});
