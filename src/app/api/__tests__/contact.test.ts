/**
 * Integration tests for the public contact form route:
 *   POST /api/contact
 *
 * The contact form is the FIRST HOP in Rani's lead-capture pipeline. Every
 * inbound lead from the marketing site, ad landing pages, GLP-1 funnel,
 * and the AI quiz funnels through this route. A silent regression here
 * means leads vanish without a trace — this test suite is the canary.
 *
 * Three side effects to verify:
 *   1. Airtable Client Intakes record creation (mandatory — 502 if fails)
 *   2. Resend email notification (best-effort — never blocks response)
 *   3. n8n webhook forward (best-effort — never blocks response)
 *
 * Plus: validation, honeypot bot filter, rate limiting, attribution
 * field passthrough.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPostRequest,
  expectJsonStatus,
  mockCommonDeps,
} from './helpers';

// ---------------------------------------------------------------------------
// Mock hoist — must be declared before importing the route under test
// ---------------------------------------------------------------------------

const mockCreateRecord = vi.fn<(...args: unknown[]) => Promise<string>>();
const mockUpsertAttribution = vi.fn<(...args: unknown[]) => Promise<void>>();
const mockRateLimit = vi.fn().mockReturnValue({ allowed: true, resetIn: 0 });
const mockGetClientIP = vi.fn().mockReturnValue('127.0.0.1');
const mockRateLimitResponse = vi.fn().mockImplementation((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  }),
);

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn().mockReturnValue({ create: vi.fn() }),
  },
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
}));

vi.mock('@/lib/attribution/upsert-client-attribution', () => ({
  upsertClientAttribution: (...args: unknown[]) => mockUpsertAttribution(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    FORM: { maxRequests: 5, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: vi.fn((req: Request) => {
    const origin = req.headers.get('origin');
    if (origin && !['http://localhost:3000', 'https://www.ranibeautyclinic.com', 'https://ranibeautyclinic.com'].includes(origin)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 });
    }
    return null;
  }),
  enforceContentLength: vi.fn((req: Request, maxBytes: number) => {
    const len = req.headers.get('content-length');
    if (len && Number(len) > maxBytes) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 });
    }
    return null;
  }),
}));

// ---------------------------------------------------------------------------
// Global fetch mock for Resend + n8n
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // NOTE: deliberately NOT calling vi.resetModules() — it forces a
  // re-import of the rate-limit module which ends up hitting a stale
  // copy of mockRateLimitResponse. Hoisted mocks are reset explicitly
  // below; that's sufficient for test isolation.
  mockCreateRecord.mockReset().mockResolvedValue('rec_intake_001');
  mockUpsertAttribution.mockReset().mockResolvedValue();
  mockRateLimit.mockReset().mockReturnValue({ allowed: true, resetIn: 0 });
  mockGetClientIP.mockReset().mockReturnValue('127.0.0.1');
  mockRateLimitResponse.mockReset().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Rate limited', resetIn }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    }),
  );

  // Fetch mock for Resend + n8n webhook calls
  fetchMock = vi.fn().mockResolvedValue(
    new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  global.fetch = fetchMock as unknown as typeof global.fetch;

  mockCommonDeps();

  // Default env: enable Resend + n8n so we can verify they're called
  process.env.RESEND_API_KEY = 're_test_key_123';
  process.env.CONTACT_EMAIL = 'info@test.ranibeautyclinic.com';
  process.env.FROM_EMAIL = 'Rani Test <noreply@test.ranibeautyclinic.com>';
  process.env.N8N_WEBHOOK_URL = 'https://n8n.test.example.com/webhook/lead-intake';
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_EMAIL;
  delete process.env.FROM_EMAIL;
  delete process.env.N8N_WEBHOOK_URL;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPayload = {
  name: 'Jane Test',
  email: 'jane@example.com',
  phone: '206-555-0100',
  service: 'Botox',
  message: 'Looking to start with a consult.',
};

async function postContact(body: unknown) {
  const { POST } = await import('@/app/api/contact/route');
  const req = buildPostRequest('/api/contact', body);
  return POST(req);
}

describe('POST /api/contact — public intent guards', () => {
  it('blocks disallowed browser origins with 403', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const req = buildPostRequest('/api/contact', validPayload, {
      origin: 'https://evil.example.com',
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('blocks oversized payloads via content-length with 413', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const req = buildPostRequest('/api/contact', validPayload, {
      'content-length': String(70 * 1024),
    });

    const response = await POST(req);
    expect(response.status).toBe(413);
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('POST /api/contact — happy path', () => {
  it('returns 200 and {success:true} for a valid submission', async () => {
    const response = await postContact(validPayload);
    const data = await expectJsonStatus(response, 200);
    expect(data.success).toBe(true);
  });

  it('creates an Airtable Client Intakes record with the expected fields', async () => {
    await postContact(validPayload);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    const [, payload] = mockCreateRecord.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(payload['Full Name']).toBe('Jane Test');
    expect(payload['Email']).toBe('jane@example.com');
    expect(payload['Phone Number']).toBe('206-555-0100');
    expect(payload['Processing Status']).toBe('New');
    expect(String(payload['Intake Summary (AI)'])).toContain('Botox');
    expect(String(payload['Intake Summary (AI)'])).toContain('Looking to start with a consult.');
  });

  it('upserts client attribution with the same email', async () => {
    await postContact(validPayload);
    expect(mockUpsertAttribution).toHaveBeenCalledTimes(1);
    const [attribution] = mockUpsertAttribution.mock.calls[0] as [Record<string, unknown>];
    expect(attribution.email).toBe('jane@example.com');
    expect(attribution.name).toBe('Jane Test');
  });

  it('sends a Resend notification email with the lead details in the HTML body', async () => {
    await postContact(validPayload);
    const resendCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('api.resend.com'),
    );
    expect(resendCall).toBeDefined();
    const [, init] = resendCall as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test_key_123' });
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(['info@test.ranibeautyclinic.com']);
    expect(body.reply_to).toBe('jane@example.com');
    expect(body.subject).toContain('Botox');
    expect(body.html).toContain('Jane Test');
  });

  it('forwards the lead to the n8n webhook with all attribution fields', async () => {
    const withAttribution = {
      ...validPayload,
      leadSource: 'meta-ads',
      leadMedium: 'paid-social',
      leadCampaign: 'spring-botox',
      utm_source: 'facebook',
      utm_campaign: 'spring-botox',
    };
    await postContact(withAttribution);
    const n8nCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('n8n.test.example.com'),
    );
    expect(n8nCall).toBeDefined();
    const [, init] = n8nCall as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.source).toBe('contact_form');
    expect(body.leadSource).toBe('meta-ads');
    expect(body.utm_campaign).toBe('spring-botox');
    expect(body.name).toBe('Jane Test');
    expect(body.email).toBe('jane@example.com');
    expect(body.submittedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Validation — the schema contract
// ---------------------------------------------------------------------------

describe('POST /api/contact — validation', () => {
  it('rejects invalid email with 422', async () => {
    const response = await postContact({ ...validPayload, email: 'not-an-email' });
    expect(response.status).toBe(422);
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('rejects missing name with 422', async () => {
    const { name: _unused, ...rest } = validPayload;
    void _unused;
    const response = await postContact(rest);
    expect(response.status).toBe(422);
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('rejects missing service with 422', async () => {
    const { service: _unused, ...rest } = validPayload;
    void _unused;
    const response = await postContact(rest);
    expect(response.status).toBe(422);
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('rejects empty name with 422', async () => {
    const response = await postContact({ ...validPayload, name: '' });
    expect(response.status).toBe(422);
  });

  it('rejects name > 100 chars with 422', async () => {
    const response = await postContact({ ...validPayload, name: 'a'.repeat(101) });
    expect(response.status).toBe(422);
  });

  it('rejects message > 2000 chars with 422', async () => {
    const response = await postContact({ ...validPayload, message: 'x'.repeat(2001) });
    expect(response.status).toBe(422);
  });

  it('returns 400 for malformed JSON', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const req = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('accepts missing phone (optional field)', async () => {
    const { phone: _unused, ...rest } = validPayload;
    void _unused;
    const response = await postContact(rest);
    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
  });

  it('accepts missing message (optional field)', async () => {
    const { message: _unused, ...rest } = validPayload;
    void _unused;
    const response = await postContact(rest);
    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Bot honeypot
// ---------------------------------------------------------------------------

describe('POST /api/contact — honeypot bot filter', () => {
  it('returns silent 200 without side effects when honeypot is filled', async () => {
    const response = await postContact({ ...validPayload, honeypot: 'im-a-bot' });
    const data = await expectJsonStatus(response, 200);
    expect(data.success).toBe(true);
    expect(mockCreateRecord).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('processes normally when honeypot is empty string', async () => {
    const response = await postContact({ ...validPayload, honeypot: '' });
    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Failure modes — Airtable is the only MANDATORY dependency
// ---------------------------------------------------------------------------

describe('POST /api/contact — failure modes', () => {
  it('returns 502 with generic error when Airtable write fails', async () => {
    mockCreateRecord.mockRejectedValueOnce(new Error('Airtable 500: Internal'));
    const response = await postContact(validPayload);
    const data = await expectJsonStatus(response, 502);
    expect(data.error).toContain("couldn't save your request");
    // Lead must not leak Airtable internals
    expect(data.error).not.toContain('Airtable');
    expect(data.error).not.toContain('500');
  });

  it('returns 502 with a call-us-directly hint when Airtable field name drift breaks the write', async () => {
    mockCreateRecord.mockRejectedValueOnce(new Error('UNKNOWN_FIELD_NAME: Full Name'));
    const response = await postContact(validPayload);
    const data = await expectJsonStatus(response, 502);
    expect(data.error).toContain('call us');
  });

  it('still returns 200 when Resend is unreachable', async () => {
    // First fetch call is Resend — fail it
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('ENOTFOUND api.resend.com')));
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
    // Airtable record was still created
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
  });

  it('still returns 200 when Resend returns 403 (domain not verified)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
  });

  it('still returns 200 when n8n webhook times out or fails', async () => {
    // Both Resend (first) and n8n (second) fail — best-effort both
    fetchMock.mockResolvedValueOnce(
      new Response('{}', { status: 200 }),
    );
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('ETIMEDOUT')));
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
  });

  it('returns 200 when RESEND_API_KEY is unset (skips email gracefully)', async () => {
    delete process.env.RESEND_API_KEY;
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    // No Resend call should have been made
    const resendCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('api.resend.com'),
    );
    expect(resendCall).toBeUndefined();
  });

  it('returns 200 when N8N_WEBHOOK_URL is unset (skips webhook gracefully)', async () => {
    delete process.env.N8N_WEBHOOK_URL;
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
    const n8nCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('n8n.test.example.com'),
    );
    expect(n8nCall).toBeUndefined();
  });

  it('still returns 200 when attribution upsert fails (best-effort)', async () => {
    mockUpsertAttribution.mockRejectedValueOnce(new Error('Airtable attribution write failed'));
    const response = await postContact(validPayload);
    expect(response.status).toBe(200);
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe('POST /api/contact — rate limiting', () => {
  it('returns 429 when the rate limiter rejects the request', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 60 });
    const response = await postContact(validPayload);
    expect(response.status).toBe(429);
    // Rate-limited requests must not create Airtable records
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('rate limiter is called with "form" category and RATE_LIMITS.FORM', async () => {
    await postContact(validPayload);
    expect(mockRateLimit).toHaveBeenCalledWith(
      'form',
      '127.0.0.1',
      expect.objectContaining({ maxRequests: expect.any(Number) }),
    );
  });
});

// ---------------------------------------------------------------------------
// Contract: attribution passthrough
// ---------------------------------------------------------------------------

describe('POST /api/contact — attribution passthrough', () => {
  it('includes UTM parameters in the intake summary', async () => {
    await postContact({
      ...validPayload,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'botox-renton',
    });
    const [, payload] = mockCreateRecord.mock.calls[0] as [unknown, Record<string, unknown>];
    const summary = String(payload['Intake Summary (AI)']);
    expect(summary).toContain('UTM Source: google');
    expect(summary).toContain('UTM Medium: cpc');
    expect(summary).toContain('UTM Campaign: botox-renton');
  });

  it('includes lead attribution labels in the intake summary', async () => {
    await postContact({
      ...validPayload,
      leadSource: 'meta-ads',
      leadCampaign: 'spring-refresh',
      leadLandingPage: '/glp1',
    });
    const [, payload] = mockCreateRecord.mock.calls[0] as [unknown, Record<string, unknown>];
    const summary = String(payload['Intake Summary (AI)']);
    expect(summary).toContain('Lead Source: meta-ads');
    expect(summary).toContain('Lead Campaign: spring-refresh');
    expect(summary).toContain('Lead Landing Page: /glp1');
  });

  it('defaults source to "contact_form" when not provided', async () => {
    await postContact(validPayload);
    const [, payload] = mockCreateRecord.mock.calls[0] as [unknown, Record<string, unknown>];
    const summary = String(payload['Intake Summary (AI)']);
    expect(summary).toContain('Source: contact_form');
  });
});
