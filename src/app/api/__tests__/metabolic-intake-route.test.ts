import { beforeEach, describe, expect, it, vi } from 'vitest';

const intakeCreateMock = vi.fn();

vi.mock('@/lib/airtable/client', () => ({
  Tables: { intakes: () => ({ create: (...args: unknown[]) => intakeCreateMock(...args) }) },
  createRecord: vi.fn(async (_table: unknown, fields: unknown) => intakeCreateMock(fields)),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }),
  ),
  RATE_LIMITS: { FORM: { limit: 10, windowMs: 60000 } },
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: vi.fn().mockReturnValue(null),
  enforceContentLength: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
}));

function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  goals: ['weight-loss'],
  symptoms: ['appetite-dysregulation'],
  fulfillmentPreference: 'clinic',
};

describe('POST /api/metabolic/intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intakeCreateMock.mockResolvedValue({ id: 'rec_1' });
  });

  it('returns 422 for missing required fields', async () => {
    const { POST } = await import('@/app/api/metabolic/intake/route');
    const response = await POST(post('http://localhost:3000/api/metabolic/intake', { firstName: 'Jane' }) as never);
    expect(response.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/metabolic/intake/route');
    const req = new Request('http://localhost:3000/api/metabolic/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"broken":',
    });
    const response = await POST(req as never);
    expect(response.status).toBe(400);
  });

  it('returns recommendation with correct contract shape', async () => {
    const { POST } = await import('@/app/api/metabolic/intake/route');
    const response = await POST(post('http://localhost:3000/api/metabolic/intake', VALID_PAYLOAD) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // Contract shape
    expect(body.data.intake.firstName).toBe('Jane');
    expect(body.data.intake.goals).toEqual(['weight-loss']);
    expect(body.data.recommendation).toBeDefined();
    expect(body.data.recommendation.status).toBe('eligible');
    expect(body.data.recommendation.recommendedTrack).toBe('glp1');
    expect(body.data.recommendation.tiers).toHaveLength(3);
    expect(body.data.recommendation.fulfillment.allowed).toContain('clinic');
    expect(body.data.recommendation.riskFlags).toEqual([]);
    expect(body.data.recommendation.blockedTracks).toEqual([]);
    expect(body.data.recommendation.providerHandoff).toBeDefined();
  });

  it('writes intake record to Airtable', async () => {
    const { POST } = await import('@/app/api/metabolic/intake/route');
    await POST(post('http://localhost:3000/api/metabolic/intake', VALID_PAYLOAD) as never);
    expect(intakeCreateMock).toHaveBeenCalledTimes(1);
  });

  it('returns provider-review-required for pregnant patient', async () => {
    const { POST } = await import('@/app/api/metabolic/intake/route');
    const response = await POST(post('http://localhost:3000/api/metabolic/intake', {
      ...VALID_PAYLOAD,
      medicalFlags: { pregnant: true },
    }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.recommendation.status).toBe('provider-review-required');
    expect(body.data.recommendation.riskFlags.length).toBeGreaterThan(0);
  });

  it('succeeds even when Airtable write fails', async () => {
    intakeCreateMock.mockRejectedValueOnce(new Error('Airtable down'));
    const { POST } = await import('@/app/api/metabolic/intake/route');
    const response = await POST(post('http://localhost:3000/api/metabolic/intake', VALID_PAYLOAD) as never);
    expect(response.status).toBe(200);
  });
});
