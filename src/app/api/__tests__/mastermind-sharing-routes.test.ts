import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const resolveTokenMock = vi.fn();
const saveTokenToAirtableMock = vi.fn();
const cacheTokenMock = vi.fn();
const resendSendMock = vi.fn();
const intakeCreateMock = vi.fn();
const rateLimitedQueryMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/share-token', () => ({
  resolveToken: (...args: unknown[]) => resolveTokenMock(...args),
  saveTokenToAirtable: (...args: unknown[]) => saveTokenToAirtableMock(...args),
  cacheToken: (...args: unknown[]) => cacheTokenMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      create: (...args: unknown[]) => intakeCreateMock(...args),
    })),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
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

describe('mastermind share + send + interest routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_SITE_URL = 'https://ranibeautyclinic.com';
    process.env.RESEND_API_KEY = 're_test_key';

    getSessionFromRequestMock.mockResolvedValue({
      username: 'rina',
      name: 'Rina',
      role: 'ceo',
    });

    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_1',
      phase: 'plan_ready',
      shareToken: 'token123',
      patientEmail: 'jane@example.com',
      patientName: 'Jane Doe',
      clinicNotes: '',
      intakeData: { email: 'jane@example.com' },
      mastermindPlan: {
        packages: [
          {
            tier: 'Transform',
            name: 'Transform Package',
            sessions: 6,
            price: 2900,
            monthlyPayment12: 249,
            monthlyPayment24: 139,
          },
        ],
      },
      auraScanResult: {
        auraScore: { overall: 82 },
      },
    });

    sessionReducerMock.mockImplementation((session: unknown) => session);
    saveSessionAsyncMock.mockResolvedValue(undefined);
    resolveTokenMock.mockResolvedValue({
      token: 'token123',
      sessionId: 'ms_1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    });
    saveTokenToAirtableMock.mockResolvedValue(undefined);
    cacheTokenMock.mockReturnValue(undefined);
    resendSendMock.mockResolvedValue({ id: 'email_1' });
    intakeCreateMock.mockResolvedValue({ id: 'rec_intake_1' });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })) as unknown as typeof global.fetch;
  });

  it('POST /api/mastermind/share rejects invalid payload', async () => {
    const { POST } = await import('@/app/api/mastermind/share/route');
    const request = new Request('http://localhost:3000/api/mastermind/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/share returns 404 when session does not exist', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/share/route');
    const request = new Request('http://localhost:3000/api/mastermind/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'missing' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/share returns share link for shareable session', async () => {
    const { POST } = await import('@/app/api/mastermind/share/route');
    const request = new Request('http://localhost:3000/api/mastermind/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'ms_1' }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.shareUrl).toContain('/my-plan/');
    expect(saveTokenToAirtableMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/plan-send returns 401 when staff session is missing', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const request = new Request('http://localhost:3000/api/mastermind/plan-send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'ms_1' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/mastermind/plan-send returns 422 when no patient email exists', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      phase: 'plan_ready',
      shareToken: 'token123',
      patientEmail: '',
      patientName: 'Jane Doe',
      intakeData: {},
    });

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const request = new Request('http://localhost:3000/api/mastermind/plan-send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'ms_1' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(422);
  });

  it('POST /api/mastermind/plan-send sends plan email successfully', async () => {
    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const request = new Request('http://localhost:3000/api/mastermind/plan-send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'ms_1' }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.sentTo).toBe('jane@example.com');
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/share/interest rejects invalid input payloads', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const request = new Request('http://localhost:3000/api/mastermind/share/interest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'abc' }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/share/interest returns 404 for expired/invalid token', async () => {
    resolveTokenMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const request = new Request('http://localhost:3000/api/mastermind/share/interest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'bad-token',
        name: 'Jane Doe',
        phone: '425-555-0100',
        packageTier: 'Transform',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/share/interest records interest and returns success', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const request = new Request('http://localhost:3000/api/mastermind/share/interest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: 'token123',
        name: 'Jane Doe',
        phone: '425-555-0100',
        packageTier: 'Transform',
        message: 'Please call me tomorrow',
      }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.details.airtableRecorded).toBe(true);
    expect(rateLimitedQueryMock).toHaveBeenCalledTimes(1);
  });
});
