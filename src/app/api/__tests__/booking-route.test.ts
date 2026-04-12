/**
 * Integration tests for booking API guard behavior:
 *   GET  /api/booking/book
 *   POST /api/booking/book
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildGetRequest, buildPostRequest, expectJsonStatus } from './helpers';

const mockRateLimit = vi.fn().mockReturnValue({ allowed: true, resetIn: 0 });
const mockGetClientIP = vi.fn().mockReturnValue('127.0.0.1');
const mockRateLimitResponse = vi.fn().mockImplementation(
  () => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }),
);

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    BOOKING: { maxRequests: 10, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: vi.fn((req: Request) => {
    const origin = req.headers.get('origin');
    if (origin && origin !== 'http://localhost:3000') {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403 });
    }
    return null;
  }),
  enforceContentLength: vi.fn((req: Request, maxBytes: number) => {
    const rawLength = req.headers.get('content-length');
    if (rawLength && Number(rawLength) > maxBytes) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 });
    }
    return null;
  }),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn((_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('/api/booking/book', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should return 429 when booking rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 27 });

    const { GET } = await import('@/app/api/booking/book/route');
    const response = await GET(buildGetRequest('/api/booking/book') as any);

    expect(response.status).toBe(429);
    expect(mockRateLimitResponse).toHaveBeenCalledWith(27);
  });

  it('GET should return 501 when allowed through the rate limiter', async () => {
    const { GET } = await import('@/app/api/booking/book/route');
    const response = await GET(buildGetRequest('/api/booking/book') as any);
    const data = await expectJsonStatus(response, 501);

    expect(data.status).toBe('not_implemented');
    expect(mockRateLimit).toHaveBeenCalledWith('booking', '127.0.0.1', expect.any(Object));
  });

  it('POST should return 429 when booking rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 19 });

    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest('/api/booking/book', {
        service: 'hydrafacial-signature',
        provider: 'mom',
      }) as any,
    );

    expect(response.status).toBe(429);
    expect(mockRateLimitResponse).toHaveBeenCalledWith(19);
  });

  it('POST should return 501 when allowed through the rate limiter', async () => {
    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest('/api/booking/book', {
        service: 'hydrafacial-signature',
        provider: 'mom',
      }) as any,
    );
    const data = await expectJsonStatus(response, 501);

    expect(data.status).toBe('not_implemented');
    expect(mockRateLimit).toHaveBeenCalledWith('booking-mutation', '127.0.0.1', expect.any(Object));
  });

  it('POST should reject unknown origins', async () => {
    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest(
        '/api/booking/book',
        { service: 'hydrafacial-signature' },
        { origin: 'https://evil.example.com' },
      ) as any,
    );

    expect(response.status).toBe(403);
  });

  it('POST should reject oversized payloads', async () => {
    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest(
        '/api/booking/book',
        { service: 'hydrafacial-signature' },
        { 'content-length': String(200 * 1024) },
      ) as any,
    );

    expect(response.status).toBe(413);
  });
});
