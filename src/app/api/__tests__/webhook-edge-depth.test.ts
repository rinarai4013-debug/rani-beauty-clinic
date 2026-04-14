/**
 * Edge-depth tests for webhook signature verification and fail-closed behavior.
 * POST /api/webhooks/meta-capi — HMAC replay/timing-safe, PII hashing
 * POST /api/webhooks/cherry — HMAC signature, fail-closed without secret
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

vi.setConfig({ testTimeout: 15_000 });

// ── Meta CAPI mocks ──
vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

const originalFetch = global.fetch;

describe('POST /api/webhooks/meta-capi edge depth', () => {
  const SECRET = 'test-meta-capi-secret';
  const ACCESS_TOKEN = 'test-access-token';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_CAPI_WEBHOOK_SECRET = SECRET;
    process.env.META_CAPI_ACCESS_TOKEN = ACCESS_TOKEN;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ events_received: 1 }), { status: 200 }),
    ) as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function signBody(body: string, secret = SECRET): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  function signedRequest(body: Record<string, unknown>, secret?: string) {
    const raw = JSON.stringify(body);
    return new Request('http://localhost:3000/api/webhooks/meta-capi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signBody(raw, secret),
      },
      body: raw,
    });
  }

  it('rejects replay with different body (same signature)', async () => {
    const body1 = JSON.stringify({ event_name: 'Purchase' });
    const sig1 = signBody(body1);

    // Attacker replays sig1 with a different body
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/meta-capi', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': sig1,
        },
        body: JSON.stringify({ event_name: 'FakeEvent' }),
      }) as never,
    );
    expect(response.status).toBe(401);
  });

  it('fails closed (503) when META_CAPI_WEBHOOK_SECRET is unset', async () => {
    delete process.env.META_CAPI_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(
      signedRequest({ event_name: 'Purchase' }) as never,
    );
    expect(response.status).toBe(503);
  });

  it('fails with 500 when META_CAPI_ACCESS_TOKEN is unset', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(
      signedRequest({ event_name: 'Purchase' }) as never,
    );
    expect(response.status).toBe(500);
  });

  it('hashes email with SHA-256 before forwarding (no plaintext PII)', async () => {
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    await POST(
      signedRequest({
        event_name: 'Lead',
        user_data: { email: 'Jane@Example.com' },
      }) as never,
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchBody = JSON.parse((global.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1]?.body as string);
    const userData = fetchBody.data[0].user_data;
    // Email should be hashed, not plaintext
    expect(userData.em).not.toContain('@');
    expect(userData.em).toHaveLength(64); // SHA-256 hex
  });

  it('returns 400 for malformed JSON with valid signature', async () => {
    const raw = '{bad json}';
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/meta-capi', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': signBody(raw),
        },
        body: raw,
      }) as never,
    );
    expect(response.status).toBe(400);
  });

  it('returns 502 when Meta API responds with error', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Invalid token' } }), { status: 400 }),
    );
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    const response = await POST(
      signedRequest({ event_name: 'Purchase' }) as never,
    );
    expect(response.status).toBe(502);
  });
});

describe('POST /api/webhooks/cherry edge depth', () => {
  const CHERRY_SECRET = 'test-cherry-secret';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHERRY_WEBHOOK_SECRET = CHERRY_SECRET;
  });

  function cherrySignedRequest(body: Record<string, unknown>) {
    const raw = JSON.stringify(body);
    return new Request('http://localhost:3000/api/webhooks/cherry', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': crypto.createHmac('sha256', CHERRY_SECRET).update(raw).digest('hex'),
      },
      body: raw,
    });
  }

  it('skips signature check when CHERRY_WEBHOOK_SECRET is not set (legacy behavior)', async () => {
    delete process.env.CHERRY_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/cherry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'application_submitted', type: 'application_submitted', data: { id: '1' } }),
      }) as never,
    );
    // Without secret, webhook is rejected (fail-closed)
    expect(response.status).toBe(503);
  });

  it('rejects requests with invalid HMAC signature', async () => {
    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/cherry', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': 'deadbeef',
        },
        body: JSON.stringify({ event: 'checkout.completed', type: 'checkout.completed', data: {} }),
      }) as never,
    );
    expect(response.status).toBe(401);
  });

  it('accepts validly signed event', async () => {
    const { POST } = await import('@/app/api/webhooks/cherry/route');
    const response = await POST(
      cherrySignedRequest({
        event: 'application_submitted',
        type: 'application_submitted',
        data: { application_id: 'app_123' },
      }) as never,
    );
    expect(response.status).toBe(200);
  });
});
