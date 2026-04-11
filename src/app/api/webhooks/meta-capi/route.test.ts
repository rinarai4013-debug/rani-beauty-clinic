import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const envMock = {
  META_CAPI_WEBHOOK_SECRET: 'meta_test_secret_123',
};

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })),
  RATE_LIMITS: {
    WEBHOOK: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: envMock,
}));

function hmacSha256(secret: string, payload: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
}

describe('POST /api/webhooks/meta-capi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.META_CAPI_WEBHOOK_SECRET = 'meta_test_secret_123';
  });

  it('returns 503 when webhook secret is missing', async () => {
    envMock.META_CAPI_WEBHOOK_SECRET = '';

    const payload = JSON.stringify({ event_name: 'test_event', data: {} });
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': hmacSha256('meta_test_secret_123', payload) },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request);

    expect(response.status).toBe(503);
  });

  it('returns 401 when signature is missing', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_name: 'test_event', data: {} }),
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when payload is not valid JSON', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': hmacSha256(envMock.META_CAPI_WEBHOOK_SECRET, 'not-json'),
      },
      body: 'not-json',
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 200 when signature and body are valid', async () => {
    const payload = JSON.stringify({ event_name: 'LEAD_EVENT', data: { source: 'test' } });
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': hmacSha256(envMock.META_CAPI_WEBHOOK_SECRET, payload),
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true, event: 'LEAD_EVENT' });
  });

  it('accepts x-meta-signature header', async () => {
    const payload = JSON.stringify({ event_name_1: 'CLICK', data: { source: 'mobile' } });
    const request = new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-meta-signature': hmacSha256(envMock.META_CAPI_WEBHOOK_SECRET, payload),
      },
      body: payload,
    });

    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true, event: 'CLICK' });
  });
});
