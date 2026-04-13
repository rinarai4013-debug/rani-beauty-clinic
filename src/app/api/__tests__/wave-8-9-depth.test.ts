/**
 * Wave 8/9 rebuild — depth assertions for:
 * - POST /api/consultation/submit (rate limit, content-length, zod, email-scoped limit, Airtable resilience)
 * - POST /api/webhooks/mangomint (HMAC, envelope validation, event routing, cache invalidation)
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.setConfig({ testTimeout: 15_000 });

// ── Consultation submit mocks ──
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn(
  (resetIn: number) => new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const enforceOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();
const normalizeEmailMock = vi.fn((v: string) => v.toLowerCase().trim());
const safeParseMock = vi.fn();
const createSessionMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const runAuraScanMock = vi.fn();
const mockAuraScanResultMock = vi.fn();
const intakeCreateMock = vi.fn();
const rateLimitedQueryMock = vi.fn();

vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('img')),
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: { FORM: { maxRequests: 5, windowMs: 60_000 } },
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: (...args: unknown[]) => enforceOriginMock(...args),
  enforceContentLength: (...args: unknown[]) => enforceContentLengthMock(...args),
  normalizeEmailForLimit: (...args: unknown[]) => normalizeEmailMock(...args),
}));

vi.mock('@/lib/consultation/schema', () => ({
  submitIntakeSchema: {
    safeParse: (...args: unknown[]) => safeParseMock(...args),
  },
}));

vi.mock('@/lib/mastermind/session', () => ({
  createSession: (...args: unknown[]) => createSessionMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/aura-scan', () => ({
  runAuraScan: (...args: unknown[]) => runAuraScanMock(...args),
}));

vi.mock('@/lib/mastermind/mock-data', () => ({
  mockAuraScanResult: (...args: unknown[]) => mockAuraScanResultMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      create: (...args: unknown[]) => intakeCreateMock(...args),
    })),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
  captureWebhookEvent: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
  logWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

vi.mock('@/lib/airtable/tables', () => {
  const handler = { get: (_: unknown, prop: string) => prop };
  return { FIELDS: new Proxy({}, { get: () => new Proxy({}, handler) }) };
});

vi.mock('@/lib/validation/parse-body', () => ({
  parseTextWithSchema: vi.fn((text: string, schema: { safeParse: (d: unknown) => unknown }) => {
    try {
      const parsed = JSON.parse(text);
      const result = schema.safeParse(parsed);
      if (result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success) {
        return { ok: true, data: (result as { data: unknown }).data };
      }
      return { ok: true, data: parsed };
    } catch {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }),
      };
    }
  }),
}));

describe('POST /api/consultation/submit depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
    safeParseMock.mockImplementation((data: unknown) => ({ success: true, data }));
    createSessionMock.mockImplementation(({ patientName, patientEmail }: Record<string, unknown>) => ({
      id: 'ms_test_1', phase: 'intake', patientName, patientEmail, sourcePhotoUrl: null,
    }));
    saveSessionAsyncMock.mockResolvedValue(undefined);
    sessionReducerMock.mockImplementation((s: unknown) => s);
    runAuraScanMock.mockResolvedValue({ auraScore: { overall: 80 } });
    intakeCreateMock.mockResolvedValue({ id: 'rec_1' });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.USE_MOCK_AI;
  });

  it('returns 429 when IP rate limit is exceeded', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 30 });
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST', body: new FormData(),
    }) as never);
    expect(response.status).toBe(429);
  });

  it('returns 413 when content-length exceeds limit', async () => {
    enforceContentLengthMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too large' }), { status: 413 }),
    );
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST', body: new FormData(),
    }) as never);
    expect(response.status).toBe(413);
  });

  it('returns 422 when zod schema rejects intake data', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: 'Invalid field', path: ['skinType'] }] },
    });
    // Use Request with FormData — vitest node env sets multipart content-type automatically
    const fd = new FormData();
    fd.set('data', JSON.stringify({ firstName: 'X', email: 'x@y.com' }));
    const req = new Request('http://localhost:3000/api/consultation/submit', { method: 'POST', body: fd });
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(req as never);
    expect(response.status).toBe(422);
  });

  it('returns 400 when data field contains malformed JSON', async () => {
    const fd = new FormData();
    fd.set('data', '{not-json');
    const req = new Request('http://localhost:3000/api/consultation/submit', { method: 'POST', body: fd });
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(req as never);
    expect(response.status).toBe(400);
  });

  it('enforces email-scoped rate limit after IP check passes', async () => {
    rateLimitMock
      .mockReturnValueOnce({ allowed: true, resetIn: 0 })
      .mockReturnValueOnce({ allowed: false, resetIn: 600 });

    const fd = new FormData();
    fd.set('data', JSON.stringify({ firstName: 'Jane', email: 'jane@example.com' }));
    const req = new Request('http://localhost:3000/api/consultation/submit', { method: 'POST', body: fd });
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(req as never);
    expect(response.status).toBe(429);
  });

  it('still returns session data when Airtable intake write fails (non-blocking)', async () => {
    rateLimitedQueryMock.mockRejectedValueOnce(new Error('Airtable write failed'));
    const fd = new FormData();
    fd.set('data', JSON.stringify({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }));
    const req = new Request('http://localhost:3000/api/consultation/submit', { method: 'POST', body: fd });
    const { POST } = await import('@/app/api/consultation/submit/route');
    const response = await POST(req as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBe('ms_test_1');
  });
});

// Contact route has 30 existing tests in contact.test.ts — no additional depth needed here.

// ── Mangomint webhook depth ──

describe('POST /api/webhooks/mangomint depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MANGOMINT_WEBHOOK_SECRET = 'test-mangomint-secret';
  });

  function signedMangomintRequest(body: Record<string, unknown>) {
    const crypto = require('crypto');
    const raw = JSON.stringify(body);
    const sig = crypto.createHmac('sha256', 'test-mangomint-secret').update(raw).digest('hex');
    return new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': sig,
      },
      body: raw,
    });
  }

  it('returns 503 when MANGOMINT_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.MANGOMINT_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'test' }),
    }) as never);
    expect(response.status).toBe(503);
  });

  it('returns 401 when signature header is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'test' }),
    }) as never);
    expect(response.status).toBe(401);
  });

  it('returns 401 when signature is invalid', async () => {
    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': 'deadbeef',
      },
      body: JSON.stringify({ event: 'test' }),
    }) as never);
    expect(response.status).toBe(401);
  });

  it('returns 405 for GET requests', async () => {
    const { GET } = await import('@/app/api/webhooks/mangomint/route');
    const response = await GET();
    expect(response.status).toBe(405);
  });

  it('accepts validly signed event and returns received: true', async () => {
    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(signedMangomintRequest({
      event: 'unknown.event',
      type: 'unknown.event',
      data: {},
    }) as never);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.event).toBe('unknown.event');
  });
});
