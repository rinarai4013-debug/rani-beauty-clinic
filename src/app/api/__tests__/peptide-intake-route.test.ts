// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPostRequest } from './helpers';

const createRecordMock = vi.fn();
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const enforceAllowedPublicOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({ create: vi.fn() })),
  },
  createRecord: (...args: unknown[]) => createRecordMock(...args),
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
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

const validBody = {
  firstName: 'Peptide',
  lastName: 'User',
  email: 'peptide@example.com',
  phone: '425-555-1000',
  goals: ['recovery'],
  symptoms: ['slow-recovery'],
  fulfillmentPreference: 'clinic',
  currentMeds: '',
  source: 'test',
  medicalFlags: {
    pregnant: false,
    breastfeeding: false,
    activeCancer: false,
    organTransplant: false,
    autoimmuneSuppressed: false,
    activeInfection: false,
    bleedingDisorder: false,
  },
  labs: {
    baselineLabsCompleted: true,
  },
};

describe('POST /api/peptide/intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRecordMock.mockResolvedValue('rec_intake_1');
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceAllowedPublicOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
  });

  it('returns 422 for invalid payload', async () => {
    const { POST } = await import('@/app/api/peptide/intake/route');
    const req = buildPostRequest('/api/peptide/intake', { email: 'invalid' });
    const response = await POST(req as never);
    expect(response.status).toBe(422);
    expect(createRecordMock).not.toHaveBeenCalled();
  });

  it('blocks pregnancy as ineligible and still returns success response', async () => {
    const { POST } = await import('@/app/api/peptide/intake/route');
    const req = buildPostRequest('/api/peptide/intake', {
      ...validBody,
      medicalFlags: {
        ...validBody.medicalFlags,
        pregnant: true,
      },
    });
    const response = await POST(req as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.recommendation.status).toBe('ineligible');
  });

  it('blocks home fulfillment when labs are incomplete for performance tier', async () => {
    const { POST } = await import('@/app/api/peptide/intake/route');
    const req = buildPostRequest('/api/peptide/intake', {
      ...validBody,
      goals: ['recovery', 'performance'],
      symptoms: ['inflammation', 'muscle-loss'],
      fulfillmentPreference: 'home',
      labs: { baselineLabsCompleted: false },
    });
    const response = await POST(req as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.recommendation.recommendedTier).toBe('performance');
    expect(body.data.recommendation.fulfillment.allowed).toEqual(['clinic']);
  });

  it('returns recommendation payload and writes intake summary to Airtable', async () => {
    const { POST } = await import('@/app/api/peptide/intake/route');
    const req = buildPostRequest('/api/peptide/intake', validBody);
    const response = await POST(req as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.recommendation.track).toBe('peptides');
    expect(body.data.dosage).toBeDefined();
    expect(body.data.trajectory).toBeDefined();
    expect(body.data.crossSellBundle?.primaryTrack).toBeDefined();
    expect(Array.isArray(body.data.crossSellBundle?.alternatives)).toBe(true);
    expect(createRecordMock).toHaveBeenCalledTimes(1);
  });
});
