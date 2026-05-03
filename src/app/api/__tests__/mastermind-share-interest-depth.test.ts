/**
 * Integration tests for POST /api/mastermind/share/interest
 * Patient interest submission from the shared plan portal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const resolveTokenMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const intakeCreateMock = vi.fn();
const rateLimitedQueryMock = vi.fn();

vi.mock('@/lib/mastermind/share-token', () => ({
  resolveToken: (...args: unknown[]) => resolveTokenMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({
      create: (...args: unknown[]) => intakeCreateMock(...args),
    })),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

const originalFetch = global.fetch;

describe('POST /api/mastermind/share/interest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveTokenMock.mockResolvedValue({
      token: 'valid-token',
      sessionId: 'ms_001',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_001',
      patientName: 'Jane Doe',
      activityLog: [],
      mastermindPlan: {
        packages: [
          { tier: 'Transform', name: 'Transform Package', price: 2900, sessions: 6, monthlyPayment12: 249, monthlyPayment24: 139 },
        ],
      },
      auraScanResult: { auraScore: { overall: 82 } },
    });
    saveSessionAsyncMock.mockResolvedValue(undefined);
    intakeCreateMock.mockResolvedValue({ id: 'rec_intake_1' });
    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })) as unknown as typeof global.fetch;
    delete process.env.N8N_WEBHOOK_URL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function makeRequest(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/mastermind/share/interest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({ token: 'abc' }) as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid phone number', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '123',
      packageTier: 'Transform',
    }) as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid package tier', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '4255550100',
      packageTier: 'InvalidTier',
    }) as never);
    expect(response.status).toBe(400);
  });

  it('returns 404 for expired/invalid token', async () => {
    resolveTokenMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'expired-token',
      name: 'Jane Doe',
      phone: '4255550100',
      packageTier: 'Transform',
    }) as never);
    expect(response.status).toBe(404);
  });

  it('creates Airtable intake record with package details', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '425-555-0100',
      packageTier: 'Transform',
      message: 'Very interested!',
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.details.airtableRecorded).toBe(true);
    expect(rateLimitedQueryMock).toHaveBeenCalledTimes(1);
    expect(saveSessionAsyncMock).toHaveBeenCalledWith(expect.objectContaining({
      selectedPackageTier: 'Transform',
      activityLog: expect.arrayContaining([
        expect.objectContaining({
          action: 'package_selected',
          actor: 'Patient portal',
        }),
      ]),
    }));
  });

  it('still succeeds when Airtable write fails', async () => {
    rateLimitedQueryMock.mockRejectedValueOnce(new Error('Airtable write failed'));
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '4255550100',
      packageTier: 'Transform',
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.details.airtableRecorded).toBe(false);
  });

  it('fires n8n webhook when URL is configured', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/interest';
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '4255550100',
      packageTier: 'Transform',
    }) as never);
    const body = await response.json();

    expect(body.details.webhookFired).toBe(true);
  });

  it('does not fire webhook when URL is not configured', async () => {
    delete process.env.N8N_WEBHOOK_URL;
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(makeRequest({
      token: 'valid-token',
      name: 'Jane Doe',
      phone: '4255550100',
      packageTier: 'Transform',
    }) as never);
    const body = await response.json();

    expect(body.details.webhookFired).toBe(false);
  });

  it('returns 400 for malformed JSON body', async () => {
    const { POST } = await import('@/app/api/mastermind/share/interest/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/share/interest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad-json',
      }) as never,
    );
    expect(response.status).toBe(400);
  });
});
