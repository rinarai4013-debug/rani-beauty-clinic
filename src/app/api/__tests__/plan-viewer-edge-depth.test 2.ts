/**
 * Edge-depth tests for GET /api/plan/[id] and POST /api/plan/[id]/track
 * Focus: rate limiting, access code, expiry, PII redaction, error isolation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.setConfig({ testTimeout: 15_000 });

const fetchFirstMock = vi.fn();
const updateRecordMock = vi.fn();
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn(
  (resetIn: number) => new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const getNextStatusMock = vi.fn();
const getAutoFollowUpMock = vi.fn();

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      find: vi.fn().mockRejectedValue(new Error('NOT_FOUND')),
    })),
    intakeIntelligence: vi.fn(() => ({
      find: vi.fn().mockRejectedValue(new Error('NOT_FOUND')),
    })),
    treatmentPlans: vi.fn(() => ({})),
  },
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
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
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: { VIEW: { maxRequests: 20, windowMs: 60_000 } },
}));

vi.mock('@/lib/plan-builder/plan-status', () => ({
  getNextStatus: (...args: unknown[]) => getNextStatusMock(...args),
  getAutoFollowUp: (...args: unknown[]) => getAutoFollowUpMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('GET /api/plan/[id] edge depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DASHBOARD_JWT_SECRET = 'test-secret-key';
    fetchFirstMock.mockResolvedValue([]);
  });

  function planRequest(id: string, code?: string) {
    const url = code
      ? `http://localhost:3000/api/plan/${id}?code=${code}`
      : `http://localhost:3000/api/plan/${id}`;
    return new Request(url, { headers: { 'x-forwarded-for': '10.0.0.1' } });
  }

  it('rejects invalid plan ID format with 400', async () => {
    const { GET } = await import('@/app/api/plan/[id]/route');
    const response = await GET(planRequest('not-a-record-id') as never, { params: { id: 'not-a-record-id' } });
    expect(response.status).toBe(400);
  });

  it('returns 403 when access code is missing', async () => {
    const { GET } = await import('@/app/api/plan/[id]/route');
    const response = await GET(planRequest('recABCDEFGHIJKL') as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('ACCESS_CODE_REQUIRED');
  });

  it('returns 403 when access code is wrong', async () => {
    const { GET } = await import('@/app/api/plan/[id]/route');
    const response = await GET(planRequest('recABCDEFGHIJKL', '000000') as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(403);
  });

  it('returns 404 when record not found', async () => {
    fetchFirstMock.mockResolvedValue([]);

    const { GET } = await import('@/app/api/plan/[id]/route');
    // Need to compute correct access code
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha256', 'test-secret-key').update('recABCDEFGHIJKL').digest('hex');
    const code = String(parseInt(hash.slice(0, 8), 16) % 1000000).padStart(6, '0');

    const response = await GET(planRequest('recABCDEFGHIJKL', code) as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(404);
  });

  it('returns 410 for expired plans (>7 days old)', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);

    fetchFirstMock.mockResolvedValueOnce([{
      id: 'recABCDEFGHIJKL',
      fields: {
        'Full Name': 'Jane Doe',
        'Created Date': oldDate.toISOString(),
      },
    }]);

    const { GET } = await import('@/app/api/plan/[id]/route');
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha256', 'test-secret-key').update('recABCDEFGHIJKL').digest('hex');
    const code = String(parseInt(hash.slice(0, 8), 16) % 1000000).padStart(6, '0');

    const response = await GET(planRequest('recABCDEFGHIJKL', code) as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toBe('PLAN_EXPIRED');
  });

  it('redacts email and phone from client-facing response', async () => {
    fetchFirstMock
      .mockResolvedValueOnce([{
        id: 'recABCDEFGHIJKL',
        fields: {
          'Full Name': 'Jane Doe',
          Email: 'jane@secret.com',
          'Phone Number': '425-555-9999',
          'Created Date': new Date().toISOString(),
        },
      }])
      .mockResolvedValueOnce([]); // intelligence lookup

    const { GET } = await import('@/app/api/plan/[id]/route');
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha256', 'test-secret-key').update('recABCDEFGHIJKL').digest('hex');
    const code = String(parseInt(hash.slice(0, 8), 16) % 1000000).padStart(6, '0');

    const response = await GET(planRequest('recABCDEFGHIJKL', code) as never, { params: { id: 'recABCDEFGHIJKL' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plan.email).toBe('');
    expect(body.plan.phone).toBe('');
    expect(body.plan.clientName).toBe('Jane Doe');
  });
});

describe('POST /api/plan/[id]/track edge depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    fetchFirstMock.mockResolvedValue([{
      id: 'rec_plan_1',
      fields: { Status: 'Sent', 'View Count': 0 },
    }]);
    getNextStatusMock.mockReturnValue('Viewed');
    getAutoFollowUpMock.mockReturnValue(null);
    updateRecordMock.mockResolvedValue(undefined);
  });

  function trackRequest(id: string, body: Record<string, unknown>) {
    return new Request(`http://localhost:3000/api/plan/${id}/track`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns 429 when rate limited', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 30 });
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const response = await POST(trackRequest('recABCDEFGHIJKL', { action: 'view' }) as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(429);
  });

  it('increments view count on view action', async () => {
    fetchFirstMock.mockResolvedValueOnce([{
      id: 'rec_plan_1',
      fields: { Status: 'Sent', 'View Count': 3 },
    }]);

    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const response = await POST(trackRequest('recABCDEFGHIJKL', { action: 'view' }) as never, { params: { id: 'recABCDEFGHIJKL' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
    const fields = updateRecordMock.mock.calls[0][2] as Record<string, unknown>;
    expect(fields['View Count']).toBe(4);
  });

  it('records financing click timestamp', async () => {
    getNextStatusMock.mockReturnValueOnce('Financing Clicked');
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const response = await POST(trackRequest('recABCDEFGHIJKL', { action: 'financing_clicked' }) as never, { params: { id: 'recABCDEFGHIJKL' } });

    expect(response.status).toBe(200);
    const fields = updateRecordMock.mock.calls[0][2] as Record<string, unknown>;
    expect(fields['Financing Clicked At']).toBeDefined();
  });

  it('returns 500 when Airtable persistence fails', async () => {
    fetchFirstMock.mockResolvedValueOnce([{
      id: 'rec_plan_1',
      fields: { Status: 'Sent', 'View Count': 0 },
    }]);
    updateRecordMock.mockRejectedValueOnce(new Error('write failed'));

    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const response = await POST(trackRequest('recABCDEFGHIJKL', { action: 'view' }) as never, { params: { id: 'recABCDEFGHIJKL' } });
    expect(response.status).toBe(500);
  });

  it('still tracks repeat views even when no status transition', async () => {
    getNextStatusMock.mockReturnValueOnce(null); // no transition
    const { POST } = await import('@/app/api/plan/[id]/track/route');
    const response = await POST(trackRequest('recABCDEFGHIJKL', { action: 'view' }) as never, { params: { id: 'recABCDEFGHIJKL' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.previousStatus).toBe('Sent');
    expect(body.newStatus).toBe('Sent');
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });
});
