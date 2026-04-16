import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const fetchAllMock = vi.fn();
const computeMetabolicFunnelMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: { intakes: () => 'mock-intakes-table' },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/analytics/metabolic-funnel-report', () => ({
  computeMetabolicFunnel: (...args: unknown[]) => computeMetabolicFunnelMock(...args),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CEO_SESSION = { username: 'ceo_user', role: 'ceo', displayName: 'CEO User' };
const FRONTDESK_SESSION = { username: 'desk', role: 'frontdesk', displayName: 'Front Desk' };

const MOCK_REPORT = {
  generatedAt: '2026-04-15T12:00:00.000Z',
  since: null,
  totalIntakes: 10,
  byTrack: [],
  totals: { submitted: 10, eligible: 6, held: 2, ineligible: 1, completed: 0, unknown: 1 },
};

const MOCK_RAW_RECORDS = [
  { id: 'rec1', fields: { 'Intake Summary (AI)': 'Track: glp1\nStatus: eligible', 'Processing Status': 'Processed' } },
  { id: 'rec2', fields: { 'Intake Summary (AI)': 'Track: hormones\nStatus: provider-review-required', 'Processing Status': 'New' } },
];

function makeRequest(url: string) {
  return new Request(url, { method: 'GET' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/metabolic-funnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllMock.mockResolvedValue(MOCK_RAW_RECORDS);
    computeMetabolicFunnelMock.mockReturnValue(MOCK_REPORT);
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated with insufficient role (frontdesk)', async () => {
    getSessionMock.mockResolvedValue(FRONTDESK_SESSION);
    hasPermissionMock.mockReturnValue(false);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden');
  });

  // ── ?since validation ────────────────────────────────────────────────────

  it('returns 400 when since is not YYYY-MM-DD format', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel?since=04-15-2026') as never);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/YYYY-MM-DD/);
  });

  it('returns 400 when since is non-date string', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel?since=last-month') as never);
    expect(response.status).toBe(400);
  });

  // ── Success (no since) ────────────────────────────────────────────────────

  it('returns 200 with funnel report when no since param', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalIntakes).toBe(10);
    expect(body.totals).toBeDefined();
  });

  it('calls fetchAll without filterByFormula when no since param', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(fetchAllMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchAllMock.mock.calls[0];
    expect(options?.filterByFormula).toBeUndefined();
  });

  // ── Success (with since) ─────────────────────────────────────────────────

  it('returns 200 with since-filtered report', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    computeMetabolicFunnelMock.mockReturnValue({ ...MOCK_REPORT, since: '2026-01-01' });
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel?since=2026-01-01') as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.since).toBe('2026-01-01');
  });

  it('passes IS_AFTER filterByFormula to fetchAll when since is provided', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel?since=2026-01-01') as never);
    const [, options] = fetchAllMock.mock.calls[0];
    expect(options?.filterByFormula).toBe("IS_AFTER(CREATED_TIME(), '2026-01-01')");
  });

  it('passes since to computeMetabolicFunnel', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel?since=2026-03-01') as never);
    expect(computeMetabolicFunnelMock).toHaveBeenCalledWith(
      expect.any(Array),
      '2026-03-01',
    );
  });

  // ── 500 on Airtable error ─────────────────────────────────────────────────

  it('returns 500 when fetchAll throws', async () => {
    getSessionMock.mockResolvedValue(CEO_SESSION);
    hasPermissionMock.mockReturnValue(true);
    fetchAllMock.mockRejectedValue(new Error('Airtable rate limit'));
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(makeRequest('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
