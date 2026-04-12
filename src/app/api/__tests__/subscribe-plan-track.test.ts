import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createRecordMock = vi.fn();
const upsertAttributionMock = vi.fn();
const fetchFirstMock = vi.fn();
const updateRecordMock = vi.fn();
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const getNextStatusMock = vi.fn();
const getAutoFollowUpMock = vi.fn();

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({})),
    treatmentPlans: vi.fn(() => ({})),
  },
  createRecord: (...args: unknown[]) => createRecordMock(...args),
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/attribution/upsert-client-attribution', () => ({
  upsertClientAttribution: (...args: unknown[]) => upsertAttributionMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    VIEW: { maxRequests: 20, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      status: 'Status',
      lastViewedAt: 'Last Viewed At',
      viewCount: 'View Count',
      financingClickedAt: 'Financing Clicked At',
    },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((value: string) => value),
}));

vi.mock('@/lib/plan-builder/plan-status', () => ({
  getNextStatus: (...args: unknown[]) => getNextStatusMock(...args),
  getAutoFollowUp: (...args: unknown[]) => getAutoFollowUpMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

const originalFetch = global.fetch;

describe('subscribe + plan track critical routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRecordMock.mockResolvedValue('rec_new');
    upsertAttributionMock.mockResolvedValue(undefined);
    fetchFirstMock.mockResolvedValue([
      {
        id: 'rec_plan_1',
        fields: {
          Status: 'Sent',
          'View Count': 2,
        },
      },
    ]);
    updateRecordMock.mockResolvedValue(undefined);
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    getNextStatusMock.mockReturnValue('Viewed');
    getAutoFollowUpMock.mockReturnValue({
      template: 'first_view_follow_up',
      delayHours: 24,
      action: 'send_sms',
    });
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    ) as unknown as typeof global.fetch;
  });

  it('POST /api/subscribe accepts valid payload and writes lead data', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const request = new Request('http://localhost:3000/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ email: 'jane@example.com', source: 'homepage' }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createRecordMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/subscribe rejects invalid emails with 422', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const request = new Request('http://localhost:3000/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(422);
  });

  it('POST /api/subscribe honeypot returns success without side effects', async () => {
    const { POST } = await import('@/app/api/subscribe/route');
    const request = new Request('http://localhost:3000/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.3' },
      body: JSON.stringify({ email: 'jane@example.com', honeypot: 'bot-filled' }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(createRecordMock).not.toHaveBeenCalled();
  });

  it('POST /api/plan/[id]/track rejects malformed plan IDs', async () => {
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const request = new Request('http://localhost:3000/api/plan/bad-id/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    });

    const response = await POST(request as never, { params: { id: 'bad-id' } });
    expect(response.status).toBe(400);
  });

  it('POST /api/plan/[id]/track returns 404 when plan cannot be found', async () => {
    fetchFirstMock.mockResolvedValueOnce([]);

    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const request = new Request('http://localhost:3000/api/plan/recABCDEFGHIJ/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    });

    const response = await POST(request as never, { params: { id: 'recABCDEFGHIJ' } });
    expect(response.status).toBe(404);
  });

  it('POST /api/plan/[id]/track updates status and view count for valid transitions', async () => {
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const request = new Request('http://localhost:3000/api/plan/recABCDEFGHIJ/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    });

    const response = await POST(request as never, { params: { id: 'recABCDEFGHIJ' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.newStatus).toBe('Viewed');
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/plan/[id]/track rejects invalid actions with 400', async () => {
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const request = new Request('http://localhost:3000/api/plan/recABCDEFGHIJ/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'unknown-action' }),
    });

    const response = await POST(request as never, { params: { id: 'recABCDEFGHIJ' } });
    expect(response.status).toBe(400);
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});
