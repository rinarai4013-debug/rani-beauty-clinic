/**
 * Integration tests for the Meta CAPI webhook proxy:
 *   POST /api/webhooks/meta-capi
 *
 * Background: this route is a trusted-caller proxy that forwards
 * conversion events to Meta's graph.facebook.com Conversions API. It
 * hashes PII (email/phone) before forwarding and requires HMAC-SHA256
 * signature verification via `x-hub-signature-256` signed with
 * `META_CAPI_WEBHOOK_SECRET`.
 *
 * This suite was added during the Wave 11 Horizon 1 P1-4 remediation
 * when the route audit discovered that:
 *   1. `META_CAPI_WEBHOOK_SECRET` was missing from Vercel production
 *   2. The previous code fell through to "skip signature verification"
 *      when the secret was missing — fail-open
 *
 * Both have been fixed. The route now fails closed with 503 when the
 * secret is unset. These tests lock in that contract.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

// ── Global fetch mock for the outbound Meta Graph API call ──────────

const originalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({ events_received: 1, messages: [], fbtrace_id: 'trace123' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
  global.fetch = fetchMock as unknown as typeof global.fetch;

  // Default env: access token set, webhook secret set
  process.env.META_CAPI_ACCESS_TOKEN = 'EAAG_test_access_token';
  process.env.META_CAPI_WEBHOOK_SECRET = 'test_webhook_secret_32_chars_min_xxx';
  process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789';
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  delete process.env.META_CAPI_ACCESS_TOKEN;
  delete process.env.META_CAPI_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
});

// ── Helpers ──────────────────────────────────────────────────────────

function sign(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/webhooks/meta-capi', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body,
  });
}

async function postCapi(payload: unknown, opts: { sign?: boolean; secret?: string; headers?: Record<string, string> } = {}) {
  const { POST } = await import('@/app/api/webhooks/meta-capi/route');
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.sign) {
    headers['x-hub-signature-256'] = sign(
      opts.secret ?? process.env.META_CAPI_WEBHOOK_SECRET!,
      body,
    );
  }
  return POST(makeRequest(body, headers));
}

const validPayload = {
  event_name: 'Lead',
  event_time: 1776000000,
  event_source_url: 'https://www.ranibeautyclinic.com/contact',
  user_data: {
    email: 'jane@example.com',
    phone: '206-555-0100',
  },
  custom_data: {
    content_name: 'Botox Consultation',
    value: 0,
    currency: 'USD',
  },
};

// ── Fail-closed contract ─────────────────────────────────────────────

describe('POST /api/webhooks/meta-capi — fail-closed contract (Wave 11 P1-4)', () => {
  it('returns 503 when META_CAPI_WEBHOOK_SECRET is unset', async () => {
    delete process.env.META_CAPI_WEBHOOK_SECRET;
    const response = await postCapi(validPayload, { sign: false });
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toContain('Webhook secret not configured');
    // The outbound fetch to Meta should NEVER fire when the secret is missing
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when META_CAPI_ACCESS_TOKEN is unset', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const response = await postCapi(validPayload, { sign: true });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('META_CAPI_ACCESS_TOKEN not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 401 when x-hub-signature-256 header is missing', async () => {
    const response = await postCapi(validPayload, { sign: false });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Missing signature');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 401 when signature is wrong (wrong secret)', async () => {
    const response = await postCapi(validPayload, {
      sign: true,
      secret: 'wrong_secret_different_from_real_xxx',
    });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 401 when signature has the wrong length', async () => {
    const response = await postCapi(validPayload, {
      sign: false,
      headers: { 'x-hub-signature-256': 'sha256=too_short' },
    });
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 401 when signature has the wrong algorithm prefix', async () => {
    const realSig = sign(
      process.env.META_CAPI_WEBHOOK_SECRET!,
      JSON.stringify(validPayload),
    );
    // Strip the "sha256=" prefix and replace with "sha1="
    const wrongPrefix = realSig.replace('sha256=', 'sha1=');
    const response = await postCapi(validPayload, {
      sign: false,
      headers: { 'x-hub-signature-256': wrongPrefix },
    });
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── Happy path ───────────────────────────────────────────────────────

describe('POST /api/webhooks/meta-capi — happy path', () => {
  it('accepts a signed valid payload and returns 200 with events_received', async () => {
    const response = await postCapi(validPayload, { sign: true });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.events_received).toBe(1);
  });

  it('forwards the hashed event to graph.facebook.com', async () => {
    await postCapi(validPayload, { sign: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('graph.facebook.com/v18.0/123456789/events');
    expect(url).toContain('access_token=EAAG_test_access_token');
    expect(init.method).toBe('POST');
    const fwdBody = JSON.parse(init.body as string);
    expect(fwdBody.data).toHaveLength(1);
    expect(fwdBody.data[0].event_name).toBe('Lead');
    expect(fwdBody.data[0].action_source).toBe('website');
  });

  it('SHA-256 hashes email before forwarding (no plaintext PII)', async () => {
    await postCapi(validPayload, { sign: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const fwdBody = JSON.parse(init.body as string);
    const userData = fwdBody.data[0].user_data;
    // Email should be hashed
    expect(userData.em).not.toBe('jane@example.com');
    expect(userData.em).toMatch(/^[a-f0-9]{64}$/);
    // Matches the expected hash of 'jane@example.com' (Meta pre-hashes
    // after trim + lowercase)
    const expected = crypto
      .createHash('sha256')
      .update('jane@example.com')
      .digest('hex');
    expect(userData.em).toBe(expected);
  });

  it('SHA-256 hashes phone number (digits only) before forwarding', async () => {
    await postCapi(validPayload, { sign: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const fwdBody = JSON.parse(init.body as string);
    const userData = fwdBody.data[0].user_data;
    expect(userData.ph).toMatch(/^[a-f0-9]{64}$/);
    // Expected hash of digits-only phone
    const expected = crypto
      .createHash('sha256')
      .update('2065550100')
      .digest('hex');
    expect(userData.ph).toBe(expected);
  });

  it('uses the request x-forwarded-for header as client_ip_address when not provided', async () => {
    const body = JSON.stringify(validPayload);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-hub-signature-256': sign(process.env.META_CAPI_WEBHOOK_SECRET!, body),
      'x-forwarded-for': '198.51.100.42',
      'user-agent': 'RaniTestBot/1.0',
    };
    const { POST } = await import('@/app/api/webhooks/meta-capi/route');
    await POST(
      new Request('http://localhost:3000/api/webhooks/meta-capi', {
        method: 'POST',
        headers,
        body,
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const fwdBody = JSON.parse(init.body as string);
    expect(fwdBody.data[0].user_data.client_ip_address).toBe('198.51.100.42');
    expect(fwdBody.data[0].user_data.client_user_agent).toBe('RaniTestBot/1.0');
  });
});

// ── Payload validation ──────────────────────────────────────────────

describe('POST /api/webhooks/meta-capi — payload validation', () => {
  it('returns 400 for missing event_name', async () => {
    const response = await postCapi(
      { event_time: 1776000000 } as unknown,
      { sign: true },
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid META CAPI payload');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 for empty event_name', async () => {
    const response = await postCapi({ event_name: '' }, { sign: true });
    expect(response.status).toBe(400);
  });

  it('returns 400 for non-URL event_source_url', async () => {
    const response = await postCapi(
      { event_name: 'Lead', event_source_url: 'not-a-url' },
      { sign: true },
    );
    expect(response.status).toBe(400);
  });

  it('accepts minimal valid payload (just event_name)', async () => {
    const response = await postCapi({ event_name: 'PageView' }, { sign: true });
    expect(response.status).toBe(200);
  });

  it('defaults event_time to current unix seconds when missing', async () => {
    await postCapi({ event_name: 'Lead' }, { sign: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const fwdBody = JSON.parse(init.body as string);
    const eventTime = fwdBody.data[0].event_time;
    const nowSec = Math.floor(Date.now() / 1000);
    expect(eventTime).toBeGreaterThanOrEqual(nowSec - 5);
    expect(eventTime).toBeLessThanOrEqual(nowSec + 5);
  });
});

// ── Downstream failure handling ─────────────────────────────────────

describe('POST /api/webhooks/meta-capi — downstream Meta failures', () => {
  it('returns 502 when graph.facebook.com returns an error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: 'Invalid pixel ID', type: 'OAuthException' } }),
        { status: 400 },
      ),
    );
    const response = await postCapi(validPayload, { sign: true });
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toBe('Meta CAPI request failed');
    expect(data.details).toBeDefined();
  });

  it('returns 500 when the fetch to Meta throws', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('ENOTFOUND')));
    const response = await postCapi(validPayload, { sign: true });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
