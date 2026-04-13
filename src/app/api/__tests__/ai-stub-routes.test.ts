import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGetRequest, buildPostRequest } from './helpers';

const mockGetClientIP = vi.fn();
const mockRateLimit = vi.fn();
const mockRateLimitResponse = vi.fn();
const mockWithSentry = vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler());

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    AI: { limit: 10, windowMs: 60000 },
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: (...args: unknown[]) => mockWithSentry(...args),
}));

vi.mock('@/lib/security/public-intent-guard', () => ({
  enforceAllowedPublicOrigin: vi.fn().mockReturnValue(null),
  enforceContentLength: vi.fn().mockReturnValue(null),
}));

const ROUTES = [
  {
    name: 'advisor',
    path: '/api/ai/advisor',
    load: () => import('@/app/api/ai/advisor/route'),
  },
  {
    name: 'outcome',
    path: '/api/ai/outcome',
    load: () => import('@/app/api/ai/outcome/route'),
  },
  {
    name: 'protocols',
    path: '/api/ai/protocols',
    load: () => import('@/app/api/ai/protocols/route'),
  },
  {
    name: 'quiz',
    path: '/api/ai/quiz',
    load: () => import('@/app/api/ai/quiz/route'),
  },
  {
    name: 'skin-analysis',
    path: '/api/ai/skin-analysis',
    load: () => import('@/app/api/ai/skin-analysis/route'),
  },
] as const;

describe.each(ROUTES)('AI stub route: $name', ({ path, load }) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockRateLimitResponse.mockImplementation((resetIn: number) =>
      new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
    );
  });

  it('GET returns 501 not_implemented when rate limit allows', async () => {
    const { GET } = await load();
    const response = await GET(buildGetRequest(path) as never);
    const data = await response.json();

    expect(response.status).toBe(501);
    expect(data).toEqual({ status: 'not_implemented' });
    expect(mockWithSentry).toHaveBeenCalledTimes(1);
    expect(mockRateLimit).toHaveBeenCalledWith('ai', '127.0.0.1', expect.any(Object));
  });

  it('POST returns 501 not_implemented when rate limit allows', async () => {
    const { POST } = await load();
    const response = await POST(buildPostRequest(path, { prompt: 'hello' }) as never);
    const data = await response.json();

    expect(response.status).toBe(501);
    expect(data).toEqual({ status: 'not_implemented' });
    expect(mockWithSentry).toHaveBeenCalledTimes(1);
    expect(mockRateLimit).toHaveBeenCalledWith('ai', '127.0.0.1', expect.any(Object));
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 42 });
    const { GET } = await load();

    const response = await GET(buildGetRequest(path) as never);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({ error: 'Rate limited', resetIn: 42 });
    expect(mockRateLimitResponse).toHaveBeenCalledWith(42);
  });
});
