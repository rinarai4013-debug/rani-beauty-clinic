// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const enforceAllowedPublicOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();
const normalizeEmailForLimitMock = vi.fn((value: string) => value.toLowerCase());
const safeParseMock = vi.fn();
const createSessionMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const runAuraScanMock = vi.fn();
const mockAuraScanResultMock = vi.fn();
const intakeCreateMock = vi.fn();
const rateLimitedQueryMock = vi.fn();

vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('img')),
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    FORM: { maxRequests: 5, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: (...args: unknown[]) => enforceAllowedPublicOriginMock(...args),
  enforceContentLength: (...args: unknown[]) => enforceContentLengthMock(...args),
  normalizeEmailForLimit: (...args: unknown[]) => normalizeEmailForLimitMock(...args),
}));

vi.mock('@/lib/consultation/schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/consultation/schema')>();
  return {
    ...actual,
    submitIntakeSchema: {
      safeParse: (...args: unknown[]) => safeParseMock(...args),
    },
  };
});

vi.mock('@/lib/mastermind/session', () => ({
  createSession: (...args: unknown[]) => createSessionMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/aura-scan', () => ({
  runAuraScan: (...args: unknown[]) => runAuraScanMock(...args),
}));

vi.mock('@/lib/mastermind/mock-data', () => ({
  mockAuraScanResult: (...args: unknown[]) => mockAuraScanResultMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      create: (...args: unknown[]) => intakeCreateMock(...args),
    })),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
}));

describe('POST /api/consultation/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceAllowedPublicOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
    safeParseMock.mockImplementation((data: unknown) => ({ success: true, data }));
    createSessionMock.mockImplementation(({ intakeData, patientName, patientEmail }) => ({
      id: 'ms_test_1',
      phase: 'intake',
      intakeData,
      patientName,
      patientEmail,
      sourcePhotoUrl: null,
    }));
    saveSessionAsyncMock.mockResolvedValue(undefined);
    sessionReducerMock.mockImplementation((session: unknown) => session);
    runAuraScanMock.mockResolvedValue({ auraScore: { overall: 80 } });
    mockAuraScanResultMock.mockReturnValue({ auraScore: { overall: 75 } });
    intakeCreateMock.mockResolvedValue({ id: 'rec_intake_1' });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.USE_MOCK_AI;
  });

  it('blocks disallowed public origins', async () => {
    enforceAllowedPublicOriginMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 }),
    );

    const { POST } = await import('@/app/api/consultation/submit/route');
    const request = new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
  });

  it('returns 400 when required data field is missing', async () => {
    const { POST } = await import('@/app/api/consultation/submit/route');
    const request = new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 when parsed intake has no email', async () => {
    const formData = new FormData();
    formData.set('data', JSON.stringify({ firstName: 'Jane', lastName: 'Doe' }));

    const { POST } = await import('@/app/api/consultation/submit/route');
    const request = new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns session metadata for a valid intake submission', async () => {
    const formData = new FormData();
    formData.set(
      'data',
      JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '425-555-0100',
      }),
    );

    const { POST } = await import('@/app/api/consultation/submit/route');
    const request = new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBe('ms_test_1');
    expect(body.sessionId).toBe('ms_test_1');
    expect(body.medicalOffers?.providerReviewRequired).toBe(true);
    expect(body.medicalOffers?.recommendedProducts?.length ?? 0).toBeGreaterThan(0);
    expect(body.medicalOffers?.projectedMonthlyGrossProfit ?? 0).toBeGreaterThan(0);
    expect(intakeCreateMock).toHaveBeenCalledTimes(1);
  });

  it('accepts legacy aura PDF multipart uploads without failing submission', async () => {
    const formData = new FormData();
    formData.set(
      'data',
      JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '425-555-0100',
      }),
    );
    formData.append(
      'aura',
      new File([Buffer.from('%PDF-1.7 mock')], 'skin-scan.pdf', { type: 'application/pdf' }),
    );

    const { POST } = await import('@/app/api/consultation/submit/route');
    const request = new Request('http://localhost:3000/api/consultation/submit', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.hasPhoto).toBe(false);
    expect(body.auraUploadStatus).toContain('Aura PDF received');
  });
});
