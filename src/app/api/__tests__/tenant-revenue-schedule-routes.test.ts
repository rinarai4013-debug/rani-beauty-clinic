import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionMock = vi.fn();
const resolveTenantMock = vi.fn();
const getTenantDatabaseMock = vi.fn();
const getRevenueBreakdownMock = vi.fn();
const getCalendarDataMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  verifySession: (...args: unknown[]) => verifySessionMock(...args),
}));

vi.mock('@/lib/tenant/resolver', () => ({
  resolveTenant: (...args: unknown[]) => resolveTenantMock(...args),
}));

vi.mock('@/lib/tenant/database', () => ({
  getTenantDatabase: (...args: unknown[]) => getTenantDatabaseMock(...args),
}));

vi.mock('@/lib/saas/tenant-dashboard/revenue', () => ({
  getRevenueBreakdown: (...args: unknown[]) => getRevenueBreakdownMock(...args),
}));

vi.mock('@/lib/saas/tenant-dashboard/schedule', () => ({
  getCalendarData: (...args: unknown[]) => getCalendarDataMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

function tenantRequest(url: string, token?: string) {
  return {
    url,
    cookies: {
      get: (name: string) => (name === 'rani-session' && token ? { value: token } : undefined),
    },
  } as never;
}

const activeTenant = {
  id: 'rani-beauty-clinic',
  active: true,
  subscription: { status: 'active' },
  features: {},
};

describe('tenant revenue + schedule routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifySessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      tenantId: 'rani-beauty-clinic',
    });

    resolveTenantMock.mockResolvedValue(activeTenant);
    getTenantDatabaseMock.mockReturnValue({ tenant: 'db-client' });

    getRevenueBreakdownMock.mockResolvedValue({
      totalRevenue: 32000,
      byChannel: [{ channel: 'Membership', amount: 21000 }],
    });
    getCalendarDataMock.mockResolvedValue({
      view: 'day',
      appointments: [{ id: 'appt_1' }],
    });
  });

  it('GET /api/tenant/revenue returns 401 when session cookie is missing', async () => {
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue'));

    expect(response.status).toBe(401);
  });

  it('GET /api/tenant/revenue returns 401 when token is invalid', async () => {
    verifySessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'bad'));

    expect(response.status).toBe(401);
  });

  it('GET /api/tenant/revenue returns 404 when tenant cannot be resolved', async () => {
    resolveTenantMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'ok'));

    expect(response.status).toBe(404);
  });

  it('GET /api/tenant/revenue returns 403 when tenant is deactivated', async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ...activeTenant,
      active: false,
    });
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'ok'));

    expect(response.status).toBe(403);
  });

  it('GET /api/tenant/revenue returns 403 when subscription is canceled', async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ...activeTenant,
      subscription: { status: 'canceled' },
    });
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'ok'));

    expect(response.status).toBe(403);
  });

  it('GET /api/tenant/revenue forwards default date range to getRevenueBreakdown', async () => {
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'ok'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalRevenue).toBe(32000);
    expect(getRevenueBreakdownMock).toHaveBeenCalledTimes(1);
    expect(getRevenueBreakdownMock.mock.calls[0][2]).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(getRevenueBreakdownMock.mock.calls[0][3]).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('GET /api/tenant/revenue forwards explicit start/end query params', async () => {
    const { GET } = await import('@/app/api/tenant/revenue/route');
    const response = await GET(
      tenantRequest(
        'http://localhost:3000/api/tenant/revenue?start=2026-04-01T00:00:00.000Z&end=2026-04-30T23:59:59.999Z',
        'ok',
      ),
    );

    expect(response.status).toBe(200);
    expect(getRevenueBreakdownMock).toHaveBeenCalledWith(
      { tenant: 'db-client' },
      expect.objectContaining({ id: 'rani-beauty-clinic' }),
      '2026-04-01T00:00:00.000Z',
      '2026-04-30T23:59:59.999Z',
    );
  });

  it('GET /api/tenant/revenue propagates error when revenue service throws', async () => {
    getRevenueBreakdownMock.mockRejectedValueOnce(new Error('revenue calc failed'));

    const { GET } = await import('@/app/api/tenant/revenue/route');
    // withTenant uses `return handler(...)` (not `return await`), so rejections
    // propagate through the async boundary without hitting the catch block.
    await expect(
      GET(tenantRequest('http://localhost:3000/api/tenant/revenue', 'ok')),
    ).rejects.toThrow('revenue calc failed');
  });

  it('GET /api/tenant/schedule returns 401 when session cookie is missing', async () => {
    const { GET } = await import('@/app/api/tenant/schedule/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/schedule'));

    expect(response.status).toBe(401);
  });

  it('GET /api/tenant/schedule returns 401 when token is invalid', async () => {
    verifySessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/tenant/schedule/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/schedule', 'bad'));

    expect(response.status).toBe(401);
  });

  it('GET /api/tenant/schedule returns default view/date/provider arguments', async () => {
    const { GET } = await import('@/app/api/tenant/schedule/route');
    const response = await GET(tenantRequest('http://localhost:3000/api/tenant/schedule', 'ok'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.appointments).toHaveLength(1);
    expect(getCalendarDataMock).toHaveBeenCalledTimes(1);
    expect(getCalendarDataMock).toHaveBeenCalledWith(
      { tenant: 'db-client' },
      expect.objectContaining({ id: 'rani-beauty-clinic' }),
      'day',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      undefined,
    );
  });

  it('GET /api/tenant/schedule forwards explicit view/date/provider query params', async () => {
    const { GET } = await import('@/app/api/tenant/schedule/route');
    const response = await GET(
      tenantRequest(
        'http://localhost:3000/api/tenant/schedule?view=week&date=2026-05-01&provider=Dr%20Rina',
        'ok',
      ),
    );

    expect(response.status).toBe(200);
    expect(getCalendarDataMock).toHaveBeenCalledWith(
      { tenant: 'db-client' },
      expect.objectContaining({ id: 'rani-beauty-clinic' }),
      'week',
      '2026-05-01',
      'Dr Rina',
    );
  });

  it('GET /api/tenant/schedule propagates error when schedule service throws', async () => {
    getCalendarDataMock.mockRejectedValueOnce(new Error('calendar service unavailable'));

    const { GET } = await import('@/app/api/tenant/schedule/route');
    // withTenant uses `return handler(...)` (not `return await`), so rejections
    // propagate through the async boundary without hitting the catch block.
    await expect(
      GET(tenantRequest('http://localhost:3000/api/tenant/schedule', 'ok')),
    ).rejects.toThrow('calendar service unavailable');
  });
});
