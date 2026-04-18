// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const enforceAllowedPublicOriginMock = vi.fn();
const enforceContentLengthMock = vi.fn();
const updateRecordMock = vi.fn();

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, fn: () => Promise<Response>) => fn()),
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

vi.mock('@/lib/env', () => ({
  env: {
    AIRTABLE_PAT: '',
    AIRTABLE_BASE_ID: '',
  },
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({ name: 'Client Intakes' })),
  },
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

describe('POST /api/consultation/offer-selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    enforceAllowedPublicOriginMock.mockReturnValue(null);
    enforceContentLengthMock.mockReturnValue(null);
    updateRecordMock.mockResolvedValue(undefined);
  });

  it('blocks disallowed origins', async () => {
    enforceAllowedPublicOriginMock.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 }),
    );

    const { POST } = await import('@/app/api/consultation/offer-selection/route');
    const request = new Request('http://localhost:3000/api/consultation/offer-selection', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid payload', async () => {
    const { POST } = await import('@/app/api/consultation/offer-selection/route');
    const request = new Request('http://localhost:3000/api/consultation/offer-selection', {
      method: 'POST',
      body: JSON.stringify({ selectedProductId: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns checkout url and provider-review lock for non-peptide tracks', async () => {
    const { POST } = await import('@/app/api/consultation/offer-selection/route');
    const request = new Request('http://localhost:3000/api/consultation/offer-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedProductId: 'glp1-semaglutide',
        selectedProductLabel: 'Semaglutide Weekly Program',
        category: 'glp1',
        requestedTrack: 'glp1',
        fulfillmentMode: 'home',
        quotedRetail: 549,
        quotedGrossProfit: 329,
        quotedMarginPercent: 59.9,
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.providerReviewRequired).toBe(true);
    expect(body.prescriptionHandoffLocked).toBe(true);
    expect(body.checkoutAllowed).toBe(true);
    expect(body.checkoutUrl).toContain('/glp1/intake?checkout=home&track=glp1');
  });

  it('returns peptide checkout url for peptide track', async () => {
    const { POST } = await import('@/app/api/consultation/offer-selection/route');
    const request = new Request('http://localhost:3000/api/consultation/offer-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedProductId: 'peptide-bpc157',
        selectedProductLabel: 'BPC-157 Recovery Program',
        category: 'peptides',
        requestedTrack: 'peptides',
        fulfillmentMode: 'clinic',
        quotedRetail: 349,
        quotedGrossProfit: 219,
        quotedMarginPercent: 62.7,
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.checkoutUrl).toBe('/peptide/intake?checkout=clinic');
  });
});
