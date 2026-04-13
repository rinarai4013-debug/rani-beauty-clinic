/**
 * Edge-depth tests for patient auth endpoints:
 * POST /api/patient/auth/verify — token, expiry, rate limit, privacy-safe
 * POST /api/patient/auth/magic-link — email normalization, rate limit, privacy
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn(
  (resetIn: number) => new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const verifyMagicLinkTokenMock = vi.fn();
const createPatientSessionMock = vi.fn();
const getPatientSessionCookieConfigMock = vi.fn();
const createMagicLinkTokenMock = vi.fn();
const fetchFirstMock = vi.fn();
const enforceOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();
const normalizeEmailMock = vi.fn((v: string) => v.toLowerCase().trim());
const resendSendMock = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: { FORM: { maxRequests: 5, windowMs: 60_000 } },
}));

vi.mock('@/lib/patient-auth/session', () => ({
  verifyMagicLinkToken: (...args: unknown[]) => verifyMagicLinkTokenMock(...args),
  createPatientSession: (...args: unknown[]) => createPatientSessionMock(...args),
  getPatientSessionCookieConfig: (...args: unknown[]) => getPatientSessionCookieConfigMock(...args),
  createMagicLinkToken: (...args: unknown[]) => createMagicLinkTokenMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: { clients: vi.fn(() => ({})) },
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v.replace(/['"\\\n\r]/g, '')),
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: (...args: unknown[]) => enforceOriginMock(...args),
  enforceContentLength: (...args: unknown[]) => enforceContentLengthMock(...args),
  normalizeEmailForLimit: (...args: unknown[]) => normalizeEmailMock(...args),
}));

vi.mock('@/lib/env', () => ({
  env: { RESEND_API_KEY: 're_test', NEXT_PUBLIC_BASE_URL: 'https://ranibeautyclinic.com' },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => resendSendMock(...args) },
  })),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('POST /api/patient/auth/verify edge depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    verifyMagicLinkTokenMock.mockResolvedValue({ email: 'patient@example.com' });
    fetchFirstMock.mockResolvedValue([{
      id: 'rec_client_1',
      fields: { Client: 'Jane Doe', Email: 'patient@example.com', Phone: '206-555-0100' },
    }]);
    createPatientSessionMock.mockResolvedValue('session_token_123');
    getPatientSessionCookieConfigMock.mockReturnValue({
      name: 'patient-session', value: 'session_token_123',
      path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600,
    });
  });

  function verifyRequest(token = 'valid-token') {
    return new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }

  it('rate limiting fires before any token verification', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 55 });
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(verifyRequest() as never);

    expect(response.status).toBe(429);
    expect(verifyMagicLinkTokenMock).not.toHaveBeenCalled();
    expect(fetchFirstMock).not.toHaveBeenCalled();
  });

  it('returns 401 for expired magic link token without leaking reason', async () => {
    verifyMagicLinkTokenMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(verifyRequest('expired-token') as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain('Invalid or expired');
    // Must NOT reveal whether the token existed or expired
    expect(JSON.stringify(body)).not.toContain('expired-token');
  });

  it('returns 401 when client email not found — does NOT reveal non-existence', async () => {
    fetchFirstMock.mockResolvedValueOnce([]);
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(verifyRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    // Privacy: error message should NOT say "email not found" or similar
    expect(body.error.toLowerCase()).not.toContain('email');
  });

  it('sets httpOnly + secure + sameSite cookie on success', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(verifyRequest() as never);

    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie') || '';
    expect(cookie).toContain('patient-session=');
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('secure');
  });

  it('returns 500 on unexpected downstream error without leaking internals', async () => {
    createPatientSessionMock.mockRejectedValueOnce(new Error('Redis connection failed'));
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(verifyRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('Redis');
  });
});

describe('POST /api/patient/auth/magic-link edge depth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
    fetchFirstMock.mockResolvedValue({ id: 'rec_1', fields: { Email: 'jane@example.com' } });
    createMagicLinkTokenMock.mockResolvedValue('magic_token_xyz');
    resendSendMock.mockResolvedValue({ id: 'email_1' });
  });

  function magicLinkRequest(email: string) {
    return new Request('http://localhost:3000/api/patient/auth/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  it('always returns 200 regardless of whether email exists (privacy-safe)', async () => {
    fetchFirstMock.mockResolvedValueOnce(null); // client not found
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(magicLinkRequest('nonexistent@example.com') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // No email sent — but response is identical to success
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('sends magic link email only when client exists', async () => {
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    await POST(magicLinkRequest('jane@example.com') as never);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  it('blocks disallowed origins before body parsing', async () => {
    enforceOriginMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Origin denied' }), { status: 403 }),
    );
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(magicLinkRequest('jane@example.com') as never);
    expect(response.status).toBe(403);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid email format', async () => {
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(magicLinkRequest('not-an-email') as never);
    expect(response.status).toBe(400);
  });

  it('fails closed to success on unexpected errors (no info leak)', async () => {
    fetchFirstMock.mockRejectedValueOnce(new Error('Airtable outage'));
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(magicLinkRequest('jane@example.com') as never);
    const body = await response.json();

    // Route catches all errors and returns success to prevent email enumeration
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
