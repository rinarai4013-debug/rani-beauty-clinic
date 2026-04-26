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
  }, 15_000);

  it('GET should return available booking suggestions when allowed through the rate limiter', async () => {
    const { GET } = await import('@/app/api/booking/book/route');
    const response = await GET(
      buildGetRequest('/api/booking/book', {
        serviceId: 'hydrafacial-signature',
        date: '2026-05-04',
      }) as any,
    );
    const data = await expectJsonStatus(response, 200);

    expect(data.success).toBe(true);
    expect(data.status).toBe('available');
    expect(data.service.id).toBe('hydrafacial-signature');
    expect(Array.isArray(data.slots)).toBe(true);
    expect(data.mangomintUrl).toContain('booking.mangomint.com');
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

  it('POST should create a pending external-confirmation booking request when allowed', async () => {
    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest('/api/booking/book', {
        serviceId: 'hydrafacial-signature',
        date: '2026-05-04',
        startTime: '09:00',
        clientInfo: {
          firstName: 'Rina',
          lastName: 'Rai',
          email: 'rina@example.com',
          phone: '(425) 555-0101',
        },
        source: 'online',
      }) as any,
    );
    const data = await expectJsonStatus(response, 200);

    expect(data.success).toBe(true);
    expect(data.status).toBe('pending_external_confirmation');
    expect(data.requiresExternalConfirmation).toBe(true);
    expect(data.appointment.serviceId).toBe('hydrafacial-signature');
    expect(data.payment.depositRequired).toBe(false);
    expect(data.mangomintUrl).toContain('serviceId=hydrafacial-signature');
    expect(mockRateLimit).toHaveBeenCalledWith('booking-mutation', '127.0.0.1', expect.any(Object));
  });

  it('POST exposes deposit requirements without pretending checkout is configured', async () => {
    const { POST } = await import('@/app/api/booking/book/route');
    const response = await POST(
      buildPostRequest('/api/booking/book', {
        serviceId: 'filler-lips',
        date: '2026-05-04',
        startTime: '09:00',
        clientInfo: {
          firstName: 'Deposit',
          lastName: 'Patient',
          email: 'deposit@example.com',
          phone: '(425) 555-0102',
        },
        source: 'online',
      }) as any,
    );
    const data = await expectJsonStatus(response, 200);

    expect(data.success).toBe(true);
    expect(data.payment.depositRequired).toBe(true);
    expect(data.payment.depositAmount).toBe(100);
    expect(data.payment.checkoutUrl).toBeNull();
    expect(data.payment.checkoutConfigured).toBe(false);
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
