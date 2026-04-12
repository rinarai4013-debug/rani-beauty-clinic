import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMagicLinkTokenMock = vi.fn();
const fetchFirstMock = vi.fn();
const clientsTableMock = vi.fn();
const getClientIPMock = vi.fn();
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn();
const enforceAllowedPublicOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();
const normalizeEmailForLimitMock = vi.fn();
const resendSendMock = vi.fn();

const envState: { RESEND_API_KEY?: string; NEXT_PUBLIC_BASE_URL?: string } = {
  RESEND_API_KEY: undefined,
  NEXT_PUBLIC_BASE_URL: 'https://ranibeautyclinic.com',
};

vi.mock('@/lib/patient-auth/session', () => ({
  createMagicLinkToken: (...args: unknown[]) => createMagicLinkTokenMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: (...args: unknown[]) => clientsTableMock(...args),
  },
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: (...args: unknown[]) => getClientIPMock(...args),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    FORM: { limit: 10, windowMs: 60000 },
  },
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: (...args: unknown[]) => enforceAllowedPublicOriginMock(...args),
  enforceContentLength: (...args: unknown[]) => enforceContentLengthMock(...args),
  normalizeEmailForLimit: (...args: unknown[]) => normalizeEmailForLimitMock(...args),
}));

vi.mock('@/lib/env', () => ({
  env: envState,
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => resendSendMock(...args),
    },
  })),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('POST /api/patient/auth/magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    envState.RESEND_API_KEY = undefined;
    envState.NEXT_PUBLIC_BASE_URL = 'https://ranibeautyclinic.com';

    clientsTableMock.mockReturnValue('clients_table');
    createMagicLinkTokenMock.mockResolvedValue('magic_token_123');
    getClientIPMock.mockReturnValue('127.0.0.1');
    normalizeEmailForLimitMock.mockImplementation((email: string) => email.toLowerCase().trim());
    rateLimitResponseMock.mockImplementation(
      () => new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
    );
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceAllowedPublicOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
    fetchFirstMock.mockResolvedValue(null);
    resendSendMock.mockResolvedValue({ id: 'email_1' });
  });

  it('blocks disallowed origins before body parsing', async () => {
    enforceAllowedPublicOriginMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Origin denied' }), { status: 403 }),
    );
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );

    expect(response.status).toBe(403);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it('blocks oversized payloads via content-length guard', async () => {
    enforceContentLengthMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 }),
    );
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );

    expect(response.status).toBe(413);
  });

  it('returns 429 when the IP-level form limit is exceeded', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 45 });
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );

    expect(response.status).toBe(429);
  });

  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"email":',
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid email payloads', async () => {
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('returns 429 when per-email scoped limit is exceeded', async () => {
    rateLimitMock
      .mockReturnValueOnce({ allowed: true, resetIn: 0 })
      .mockReturnValueOnce({ allowed: false, resetIn: 60 });
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );

    expect(response.status).toBe(429);
    expect(normalizeEmailForLimitMock).toHaveBeenCalledWith('jane@example.com');
  });

  it('returns success without sending email when client is not found', async () => {
    fetchFirstMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('returns success when client exists but RESEND_API_KEY is unset', async () => {
    fetchFirstMock.mockResolvedValueOnce({ id: 'rec_1', fields: { Email: 'jane@example.com' } });
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createMagicLinkTokenMock).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('sends magic-link email when client exists and RESEND_API_KEY is configured', async () => {
    envState.RESEND_API_KEY = 're_test_key';
    envState.NEXT_PUBLIC_BASE_URL = 'https://portal.rani.local';
    fetchFirstMock.mockResolvedValueOnce({ id: 'rec_1', fields: { Email: 'jane@example.com' } });

    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createMagicLinkTokenMock).toHaveBeenCalledWith('jane@example.com');
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: 'Your Rani Beauty Clinic Portal Login Link',
        html: expect.stringContaining('https://portal.rani.local/portal?token=magic_token_123'),
      }),
    );
  });

  it('normalizes email before token generation and outbound send', async () => {
    envState.RESEND_API_KEY = 're_test_key';
    envState.NEXT_PUBLIC_BASE_URL = undefined;
    fetchFirstMock.mockResolvedValueOnce({ id: 'rec_1', fields: { Email: 'jane@example.com' } });
    normalizeEmailForLimitMock.mockReturnValueOnce('jane@example.com');

    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'Jane@Example.com' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createMagicLinkTokenMock).toHaveBeenCalledWith('jane@example.com');
    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        html: expect.stringContaining('https://ranibeautyclinic.com/portal?token=magic_token_123'),
      }),
    );
  });

  it('fails closed to success when downstream dependencies throw unexpectedly', async () => {
    fetchFirstMock.mockRejectedValueOnce(new Error('airtable outage'));
    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(
      new Request('http://localhost:3000/api/patient/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
