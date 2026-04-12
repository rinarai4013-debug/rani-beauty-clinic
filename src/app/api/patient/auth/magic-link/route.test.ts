import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Too many requests', resetIn }), { status: 429 }),
);
const fetchFirstMock = vi.fn();
const createMagicLinkTokenMock = vi.fn();

const envMock = {
  RESEND_API_KEY: '',
  NEXT_PUBLIC_BASE_URL: 'https://ranibeautyclinic.com',
  NEXT_PUBLIC_SITE_URL: 'https://www.ranibeautyclinic.com',
  CORS_ALLOWED_ORIGINS: '',
};

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: rateLimitResponseMock,
  RATE_LIMITS: {
    FORM: { limit: 5, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/env', () => ({
  env: envMock,
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({})),
  },
  fetchFirst: fetchFirstMock,
}));

vi.mock('@/lib/patient-auth/session', () => ({
  createMagicLinkToken: createMagicLinkTokenMock,
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_routeName: string, handler: () => Promise<unknown>) => handler()),
}));

describe('POST /api/patient/auth/magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    fetchFirstMock.mockResolvedValue(null);
    envMock.RESEND_API_KEY = '';
  });

  it('returns success when client exists but email service is not configured', async () => {
    fetchFirstMock.mockResolvedValue({ id: 'rec_1', fields: { Email: 'patient@example.com' } });

    const request = new Request('http://localhost:3000/api/patient/auth/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'patient@example.com' }),
    });

    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(createMagicLinkTokenMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON payloads', async () => {
    const request = new Request('http://localhost:3000/api/patient/auth/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad-json',
    });

    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid request body' });
  });

  it('returns 413 for oversized request bodies', async () => {
    const request = new Request('http://localhost:3000/api/patient/auth/magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(32 * 1024),
      },
      body: JSON.stringify({ email: 'patient@example.com' }),
    });

    const { POST } = await import('@/app/api/patient/auth/magic-link/route');
    const response = await POST(request as never);

    expect(response.status).toBe(413);
  });
});
