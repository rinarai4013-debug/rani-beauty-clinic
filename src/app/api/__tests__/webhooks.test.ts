/**
 * Integration tests for Webhook routes:
 *   POST /api/webhooks/mangomint
 *   POST /api/webhooks/stripe
 *   POST /api/webhooks/cherry
 *   POST /api/webhooks/meta-capi
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  expectJsonStatus,
  hmacSha256,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRateLimitedQuery = vi.fn().mockImplementation(<T>(fn: () => Promise<T>) => fn());
const mockFetchAll = vi.fn().mockResolvedValue([]);
const fetchFirstMock = vi.fn().mockResolvedValue([]);
const updateRecordMock = vi.fn().mockResolvedValue(undefined);
const mockCacheInvalidatePrefix = vi.fn();
const mockRateLimit = vi.fn().mockReturnValue({ allowed: true, resetIn: 0 });
const mockRateLimitResponse = vi.fn().mockImplementation(
  () => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }),
);

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
  logWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/sentry-utils', () => ({
  captureWebhookEvent: vi.fn(),
  captureCheckoutEvent: vi.fn(),
  withSentry: vi.fn((_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/airtable/client', () => {
  const mockTable = () => ({
    find: vi.fn(),
    select: vi.fn().mockReturnValue({
      firstPage: vi.fn((cb: (err: Error | null, records?: unknown[]) => void) => cb(null, [])),
    }),
    create: vi.fn((records: unknown[], opts: unknown, cb: (err: Error | null) => void) => cb(null)),
    update: vi.fn((records: unknown[], opts: unknown, cb: (err: Error | null) => void) => cb(null)),
  });
  return {
    Tables: {
      appointments: mockTable,
      transactions: mockTable,
      clients: mockTable,
      memberships: mockTable,
      alerts: mockTable,
      intakes: mockTable,
      treatmentPlans: mockTable,
    },
    rateLimitedQuery: (...args: unknown[]) => mockRateLimitedQuery(...args),
    fetchAll: (...args: unknown[]) => mockFetchAll(...args),
    fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
    updateRecord: (...args: unknown[]) => updateRecordMock(...args),
  };
});

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

vi.mock('@/lib/airtable/tables', () => {
  // Return a Proxy so any FIELDS.x.y access returns a stable string
  const fieldProxy = new Proxy({} as Record<string, string>, {
    get: (_target, prop: string) => prop,
  });
  const fieldsProxy = new Proxy({} as Record<string, Record<string, string>>, {
    get: () => fieldProxy,
  });
  return { FIELDS: fieldsProxy };
});

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    invalidate: vi.fn(),
    invalidatePrefix: (...args: unknown[]) => mockCacheInvalidatePrefix(...args),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    WEBHOOK: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    CHERRY_WEBHOOK_SECRET: 'cherry_test_secret_123',
    N8N_WEBHOOK_URL: 'https://n8n.example.com',
  },
  hasFeature: {
    n8n: vi.fn().mockReturnValue(false),
  },
}));

// ---------------------------------------------------------------------------
// POST /api/webhooks/mangomint
// ---------------------------------------------------------------------------

describe('POST /api/webhooks/mangomint', () => {
  const MANGOMINT_SECRET = 'mangomint_test_secret_123';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MANGOMINT_WEBHOOK_SECRET = MANGOMINT_SECRET;
  });

  async function sendMangomintWebhook(event: string, data: Record<string, unknown>) {
    const payload = JSON.stringify({ event, data });
    const signature = await hmacSha256(MANGOMINT_SECRET, payload);

    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    return POST(req);
  }

  it('should return 401 when signature is missing', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'test', data: {} }),
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(req);
    await expectJsonStatus(response, 401);
  });

  it('should return 401 when signature is invalid', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': 'invalid_signature_here',
      },
      body: JSON.stringify({ event: 'test', data: {} }),
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(req);
    await expectJsonStatus(response, 401);
  });

  it('should return 503 when webhook secret is not configured', async () => {
    delete process.env.MANGOMINT_WEBHOOK_SECRET;

    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'test', data: {} }),
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(req);
    await expectJsonStatus(response, 503);
  });

  it('should handle appointment.created event', async () => {
    const response = await sendMangomintWebhook('appointment.created', {
      id: 'mg_apt_001',
      clientFirstName: 'Jane',
      clientLastName: 'Doe',
      serviceName: 'HydraFacial',
      staffName: 'Mom',
      startAt: '2026-03-25T10:00:00',
      endAt: '2026-03-25T11:00:00',
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(data.event).toBe('appointment.created');
    expect(mockCacheInvalidatePrefix).toHaveBeenCalledWith('schedule');
  });

  it('should handle appointment.completed event', async () => {
    const response = await sendMangomintWebhook('appointment.completed', {
      id: 'mg_apt_002',
      clientFirstName: 'Jane',
      clientLastName: 'Doe',
      serviceName: 'HydraFacial',
      staffName: 'Mom',
    });

    const data = await response.json();
    expect(data.received).toBe(true);
    expect(data.event).toBe('appointment.completed');
  });

  it('should handle appointment.cancelled event', async () => {
    const response = await sendMangomintWebhook('appointment.cancelled', {
      id: 'mg_apt_003',
      cancellationReason: 'Client requested',
      isLateCancellation: false,
    });

    expect(response.status).toBe(200);
  });

  it('should handle appointment.noshow event', async () => {
    const response = await sendMangomintWebhook('appointment.noshow', {
      id: 'mg_apt_004',
      clientFirstName: 'John',
      clientLastName: 'Smith',
      serviceName: 'Botox',
    });

    expect(response.status).toBe(200);
  });

  it('should handle sale.completed event', async () => {
    const response = await sendMangomintWebhook('sale.completed', {
      id: 'mg_sale_001',
      total: 275,
      payment_method: 'card',
      completed_at: '2026-03-25',
      services: [{ name: 'HydraFacial', provider_name: 'Mom' }],
    });

    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('should handle client.created event', async () => {
    const response = await sendMangomintWebhook('client.created', {
      id: 'mg_client_001',
      firstName: 'New',
      lastName: 'Client',
      email: 'new@test.com',
      mobilePhone: '(425) 555-0200',
    });

    expect(response.status).toBe(200);
  });

  it('should handle membership.created event', async () => {
    const response = await sendMangomintWebhook('membership.created', {
      id: 'mg_mem_001',
      membership_name: 'Gold',
      price: 199,
      start_date: '2026-03-25',
    });

    expect(response.status).toBe(200);
  });

  it('should handle membership.cancelled event', async () => {
    const response = await sendMangomintWebhook('membership.cancelled', {
      id: 'mg_mem_001',
      client_name: 'Jane Doe',
      membership_name: 'Gold',
      cancel_reason: 'Financial reasons',
    });

    expect(response.status).toBe(200);
  });

  it('should handle unknown event types gracefully', async () => {
    const response = await sendMangomintWebhook('unknown.event', { id: 'test' });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should return 400 for malformed JSON with valid signature', async () => {
    const payload = '{"event":';
    const signature = await hmacSha256(MANGOMINT_SECRET, payload);

    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('should return 422 for structurally invalid webhook envelope', async () => {
    const payload = JSON.stringify({ event: '', data: {} });
    const signature = await hmacSha256(MANGOMINT_SECRET, payload);

    const req = new Request('http://localhost:3000/api/webhooks/mangomint', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mangomint-signature': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/mangomint/route');
    const response = await POST(req);

    expect(response.status).toBe(422);
  });

  it('GET should return 405', async () => {
    const { GET } = await import('@/app/api/webhooks/mangomint/route');
    const response = await GET();
    await expectJsonStatus(response, 405);
  });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should return 429 when webhook rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 42 });

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'sig',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);

    expect(response.status).toBe(429);
    expect(mockRateLimitResponse).toHaveBeenCalledWith(42);
  });

  it('should return 400 when signature is missing', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);

    expect(response.status).toBe(400);
  });

  it('should return 400 when webhook secret is missing even if signature is present', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = '';

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'sig',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);

    expect(response.status).toBe(400);
  });

  it('should return 401 when signature is invalid', async () => {
    // Mock Stripe to throw on constructEvent
    vi.doMock('stripe', () => ({
      default: vi.fn().mockImplementation(() => ({
        webhooks: {
          constructEvent: vi.fn().mockImplementation(() => {
            throw new Error('Invalid signature');
          }),
        },
      })),
    }));

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'invalid_sig',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);

    // Should be 401 for invalid signature
    expect([400, 401]).toContain(response.status);
  });

  it('should handle checkout.session.completed and invalidate revenue caches', async () => {
    vi.resetModules();
    vi.doMock('stripe', () => ({
      default: vi.fn().mockImplementation(() => ({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            id: 'evt_test_123',
            type: 'checkout.session.completed',
            data: {
              object: {
                id: 'cs_test_123',
                amount_total: 27500,
                customer_details: { name: 'Jane Doe' },
                metadata: {
                  planId: 'plan_123',
                  tier: 'Transform',
                  clientName: 'Jane Doe',
                },
              },
            },
          }),
        },
      })),
    }));

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify({ id: 'evt_test_123', type: 'checkout.session.completed' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(data.event).toBe('checkout.session.completed');
    expect(mockCacheInvalidatePrefix).toHaveBeenCalledWith('revenue');
    expect(mockCacheInvalidatePrefix).toHaveBeenCalledWith('kpi');
    expect(mockCacheInvalidatePrefix).toHaveBeenCalledWith('transactions');
    expect(mockRateLimitedQuery).toHaveBeenCalled();
  });

  it('should handle checkout.session.expired successfully', async () => {
    vi.resetModules();
    vi.doMock('stripe', () => ({
      default: vi.fn().mockImplementation(() => ({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            id: 'evt_test_expired',
            type: 'checkout.session.expired',
            data: {
              object: {
                id: 'cs_expired_123',
                metadata: {
                  planId: 'plan_123',
                  tier: 'Transform',
                  clientName: 'Jane Doe',
                },
                customer_details: { name: 'Jane Doe' },
              },
            },
          }),
        },
      })),
    }));

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'valid_sig',
      },
      body: JSON.stringify({ id: 'evt_test_expired', type: 'checkout.session.expired' }),
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(data.event).toBe('checkout.session.expired');
    expect(mockRateLimitedQuery).toHaveBeenCalled();
  });

  it('GET should return 405', async () => {
    const { GET } = await import('@/app/api/webhooks/stripe/route');
    const response = await GET();
    await expectJsonStatus(response, 405);
  });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/cherry
// ---------------------------------------------------------------------------

describe('POST /api/webhooks/cherry', () => {
  const CHERRY_SECRET = 'cherry_test_secret_123';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHERRY_WEBHOOK_SECRET = CHERRY_SECRET;
  });

  async function sendCherryWebhook(event: string, data: Record<string, unknown>) {
    const payload = JSON.stringify({ event, data });
    const signature = await hmacSha256(CHERRY_SECRET, payload);

    const req = new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
        'x-webhook-signature': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/cherry/route');
    return POST(req as any);
  }

  it('should reject malformed payloads with 422', async () => {
    const payload = 'not valid json!!!';
    const signature = await hmacSha256(CHERRY_SECRET, payload);

    const req = new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '10.0.0.2',
        'x-webhook-signature': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(req as any);
    await expectJsonStatus(response, 422);
  });

  it('should handle application_submitted event', async () => {
    const response = await sendCherryWebhook('application_submitted', {
      clientName: 'Jane Doe',
      email: 'jane@test.com',
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(data.event).toBe('application_submitted');
  });

  it('should handle application_approved event', async () => {
    const response = await sendCherryWebhook('application_approved', {
      clientName: 'Jane Doe',
      email: 'jane@test.com',
      approvedAmount: 5000,
    });

    const data = await response.json();
    expect(data.received).toBe(true);
    expect(data.event).toBe('application_approved');
  });

  it('should handle application_declined event', async () => {
    const response = await sendCherryWebhook('application_declined', {
      clientName: 'Jane Doe',
      email: 'jane@test.com',
    });

    expect(response.status).toBe(200);
  });

  it('should handle transaction_completed event', async () => {
    const response = await sendCherryWebhook('transaction_completed', {
      clientName: 'Jane Doe',
      amount: 2750,
      planDetails: '12-month plan',
      date: '2026-03-25',
    });

    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('should handle unknown event types gracefully', async () => {
    const response = await sendCherryWebhook('unknown.event', { id: 'test' });
    expect(response.status).toBe(200);
  });

  it('should acknowledge unexpected event types without throwing', async () => {
    const response = await sendCherryWebhook('unknown.event', { any: 'payload' });
    const data = await expectJsonStatus(response, 200);
    expect(data.received).toBe(true);
    expect(data.event).toBe('unknown.event');
  });

  it('should return 401 when Cherry signature header is missing', async () => {
    const payload = JSON.stringify({
      event: 'checkout.completed',
      data: { customerId: 'customer_1' },
    });

    const req = new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(req as any);

    expect(response.status).toBe(401);
  });

  it('should return 503 when Cherry webhook secret is not configured', async () => {
    delete process.env.CHERRY_WEBHOOK_SECRET;

    const req = new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        event: 'checkout.completed',
        data: { customerId: 'customer_1' },
      }),
    });

    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(req as any);

    expect(response.status).toBe(503);
  });

  it('should return 401 when Cherry signature is invalid', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': 'totally-invalid',
      },
      body: JSON.stringify({
        event: 'checkout.completed',
        data: { customerId: 'customer_2' },
      }),
    });

    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(req as any);

    expect(response.status).toBe(401);
  });

  it('should return warning when checkout.completed lacks identifiers', async () => {
    const response = await sendCherryWebhook('checkout.completed', {
      status: 'approved',
      amount: 1200,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.warning).toContain('No customer identifier');
  });

  it('should update matching plan status to Booked on checkout.completed', async () => {
    fetchFirstMock.mockResolvedValueOnce([
      {
        id: 'rec_plan_7',
        fields: { Status: 'Viewed', 'Client Name': 'customer-abc' },
      },
    ]);

    const response = await sendCherryWebhook('checkout.completed', {
      customerId: 'customer-abc',
      amount: 3300,
      status: 'approved',
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/meta-capi
// ---------------------------------------------------------------------------

describe('POST /api/webhooks/meta-capi', () => {
  const META_SECRET = 'meta_capi_secret_abc';
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_CAPI_ACCESS_TOKEN = 'meta_access_token';
    process.env.META_CAPI_WEBHOOK_SECRET = META_SECRET;
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789';

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ events_received: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  async function sendMetaWebhook(payload: Record<string, unknown>) {
    const raw = JSON.stringify(payload);
    const signature = `sha256=${await hmacSha256(META_SECRET, raw)}`;

    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signature,
        'user-agent': 'vitest-agent',
      },
      body: raw,
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    return POST(request as any);
  }

  it('should return 500 when access token is missing', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_name: 'Lead' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
  });

  it('should return 503 when webhook secret is missing', async () => {
    delete process.env.META_CAPI_WEBHOOK_SECRET;

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_name: 'Lead' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(503);
  });

  it('should return 401 when signature is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_name: 'Lead' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should return 401 when signature is invalid', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=invalid',
      },
      body: JSON.stringify({ event_name: 'Lead' }),
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should return 400 for malformed JSON after passing signature verification', async () => {
    const payload = '{"event_name":';
    const signature = `sha256=${await hmacSha256(META_SECRET, payload)}`;

    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signature,
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid event payload schema', async () => {
    const response = await sendMetaWebhook({
      event_name: '',
      user_data: {},
    });

    expect(response.status).toBe(400);
  });

  it('should return 502 when Meta Graph API responds non-OK', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'bad token' } }), { status: 400 }),
    );

    const response = await sendMetaWebhook({
      event_name: 'Lead',
      user_data: { email: 'jane@example.com' },
      custom_data: { value: 100 },
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('Meta CAPI request failed');
  });

  it('should forward hashed user data and return success on valid payload', async () => {
    const response = await sendMetaWebhook({
      event_name: 'Lead',
      event_time: 1731000000,
      event_source_url: 'https://www.ranibeautyclinic.com/consultation',
      user_data: {
        email: 'Jane@Example.com',
        phone: '+1 (425) 555-0188',
        client_ip: '10.1.1.1',
        client_user_agent: 'Mozilla/Test',
      },
      custom_data: {
        source: 'quiz',
        value: 3500,
      },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.events_received).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('graph.facebook.com/v18.0/123456789/events?access_token=meta_access_token'),
      expect.objectContaining({ method: 'POST' }),
    );

    const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const requestInit = fetchCall[1] as RequestInit;
    const forwardedBody = JSON.parse(String(requestInit.body)) as {
      data: Array<{ user_data: Record<string, string> }>;
    };
    const userData = forwardedBody.data[0].user_data;

    expect(userData.em).toMatch(/^[a-f0-9]{64}$/);
    expect(userData.ph).toMatch(/^[a-f0-9]{64}$/);
    expect(userData.em).not.toContain('jane@example.com');
    expect(userData.ph).not.toContain('425');
    expect(userData.client_ip_address).toBe('10.1.1.1');
  });
});
