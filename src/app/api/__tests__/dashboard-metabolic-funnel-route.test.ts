import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getAllSessionsAsyncMock = vi.fn();
const fetchAllMock = vi.fn();
const buildMetabolicFunnelReportMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getAllSessionsAsync: (...args: unknown[]) => getAllSessionsAsyncMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/analytics/metabolic-funnel-report', () => ({
  buildMetabolicFunnelReport: (...args: unknown[]) => buildMetabolicFunnelReportMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
}));

describe('GET /api/dashboard/metabolic-funnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ username: 'rina', role: 'ceo' });
    getAllSessionsAsyncMock.mockResolvedValue([{ id: 'ms_1' }]);
    fetchAllMock.mockResolvedValue([{ id: 'rec_1', fields: {} }]);
    buildMetabolicFunnelReportMock.mockReturnValue({
      totals: {
        started: 4,
        held: 1,
        completed: 2,
        eligible: 3,
        ineligible: 0,
        providerReviewRequired: 1,
      },
      byTrack: {
        glp1: { started: 2, held: 1, completed: 1, eligible: 1, ineligible: 0, providerReviewRequired: 1 },
        hormones: { started: 1, held: 0, completed: 1, eligible: 1, ineligible: 0, providerReviewRequired: 0 },
        peptides: { started: 1, held: 0, completed: 0, eligible: 1, ineligible: 0, providerReviewRequired: 0 },
        hybrid: { started: 0, held: 0, completed: 0, eligible: 0, ineligible: 0, providerReviewRequired: 0 },
        unknown: { started: 0, held: 0, completed: 0, eligible: 0, ineligible: 0, providerReviewRequired: 0 },
      },
      sources: {
        mastermindSessions: 1,
        intakeRecords: 1,
      },
    });
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(401);
  });

  it('returns report payload with generatedAt and funnel data', async () => {
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('generatedAt');
    expect(body.data.totals.started).toBe(4);
    expect(body.data.byTrack.glp1.held).toBe(1);
    expect(body.data.sources.intakeRecords).toBe(1);
    expect(buildMetabolicFunnelReportMock).toHaveBeenCalledWith(
      [{ id: 'ms_1' }],
      [{ id: 'rec_1', fields: {} }],
    );
  });

  it('returns 500 when upstream source fails', async () => {
    fetchAllMock.mockRejectedValueOnce(new Error('Airtable unavailable'));
    const { GET } = await import('@/app/api/dashboard/metabolic-funnel/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/metabolic-funnel') as never);
    expect(response.status).toBe(500);
  });
});
