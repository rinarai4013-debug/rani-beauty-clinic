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
    expect(mockRateLimit).toHaveBeenCalledWith('booking', '127.0.0.1', expect.any(Object));
  });
});
