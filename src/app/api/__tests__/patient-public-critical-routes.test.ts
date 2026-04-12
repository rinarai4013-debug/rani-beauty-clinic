import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const verifyMagicLinkTokenMock = vi.fn();
const createPatientSessionMock = vi.fn();
const getPatientSessionCookieConfigMock = vi.fn();
const getPatientSessionMock = vi.fn();
const fetchFirstMock = vi.fn();
const clientFindMock = vi.fn();
const rateLimitedQueryMock = vi.fn();
const updateRecordMock = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    FORM: { maxRequests: 5, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/patient-auth/session', () => ({
  verifyMagicLinkToken: (...args: unknown[]) => verifyMagicLinkTokenMock(...args),
  createPatientSession: (...args: unknown[]) => createPatientSessionMock(...args),
  getPatientSessionCookieConfig: (...args: unknown[]) => getPatientSessionCookieConfigMock(...args),
  getPatientSession: (...args: unknown[]) => getPatientSessionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({
      find: (...args: unknown[]) => clientFindMock(...args),
    })),
  },
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('patient auth + profile critical routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    verifyMagicLinkTokenMock.mockResolvedValue({ email: 'patient@example.com' });
    fetchFirstMock.mockResolvedValue([
      {
        id: 'rec_client_1',
        fields: {
          Client: 'Jane Doe',
          Email: 'patient@example.com',
          Phone: '206-555-0100',
        },
      },
    ]);
    createPatientSessionMock.mockResolvedValue('patient_jwt_token');
    getPatientSessionCookieConfigMock.mockReturnValue({
      name: 'patient-session',
      value: 'patient_jwt_token',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600,
    });
    getPatientSessionMock.mockResolvedValue({
      patientId: 'rec_client_1',
      email: 'patient@example.com',
      name: 'Jane Doe',
    });
    clientFindMock.mockResolvedValue({
      id: 'rec_client_1',
      fields: {
        Client: 'Jane Doe',
        Email: 'patient@example.com',
        'Phone Number': '206-555-0100',
        'Preferred Contact Method': 'Text',
        Status: 'Active',
      },
    });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    updateRecordMock.mockResolvedValue(undefined);
  });

  it('POST /api/patient/auth/verify returns session and cookie for valid token', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.name).toBe('Jane Doe');
    expect(response.headers.get('set-cookie')).toContain('patient-session=');
  });

  it('POST /api/patient/auth/verify rejects invalid magic links', async () => {
    verifyMagicLinkTokenMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'expired-token' }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/patient/auth/verify rejects malformed JSON payloads', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"token":',
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/patient/auth/verify requires token in request body', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/patient/auth/verify returns 401 when account is not found', async () => {
    fetchFirstMock.mockResolvedValueOnce([]);

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/patient/auth/verify returns 500 on unexpected downstream errors', async () => {
    fetchFirstMock.mockRejectedValueOnce(new Error('airtable unavailable'));

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(500);
  });

  it('POST /api/patient/auth/verify enforces rate limits', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 60 });

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(429);
  });

  it('GET /api/patient/auth/me returns 401 when no patient session exists', async () => {
    getPatientSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/patient/auth/me/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/patient/auth/me returns the patient identity when authenticated', async () => {
    const { GET } = await import('@/app/api/patient/auth/me/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patientId).toBe('rec_client_1');
    expect(body.email).toBe('patient@example.com');
  });

  it('GET /api/patient/profile returns profile payload when authenticated', async () => {
    const { GET } = await import('@/app/api/patient/profile/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.id).toBe('rec_client_1');
  });

  it('PATCH /api/patient/profile rejects empty updates', async () => {
    const { PATCH } = await import('@/app/api/patient/profile/route');
    const request = new Request('http://localhost:3000/api/patient/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('PATCH /api/patient/profile updates mutable fields when input is valid', async () => {
    const { PATCH } = await import('@/app/api/patient/profile/route');
    const request = new Request('http://localhost:3000/api/patient/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '425-555-0100', preferredContact: 'Text' }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });
});
