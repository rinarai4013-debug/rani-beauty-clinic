import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Too many requests', resetIn }), { status: 429 }),
);
const generateAISimulationMock = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    AI: { limit: 3, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/photo-simulation/ai-simulation', () => ({
  generateAISimulation: (...args: unknown[]) => generateAISimulationMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_routeName: string, handler: () => Promise<unknown>) => handler()),
}));

const validPayload = {
  imageBase64: 'data:image/jpeg;base64,aGVsbG8=',
  treatmentPresets: ['botox'],
  intensity: 0.6,
  timeframe: '3-months',
};

describe('POST /api/simulation/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
    generateAISimulationMock.mockResolvedValue({
      imageUrl: 'https://cdn.example.com/simulation.jpg',
      confidence: 0.87,
      timeframe: '3-months',
      treatments: ['botox'],
    });
  });

  it('blocks disallowed browser origins with 403', async () => {
    const request = new Request('http://localhost:3000/api/simulation/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example.com',
      },
      body: JSON.stringify(validPayload),
    });

    const { POST } = await import('@/app/api/simulation/generate/route');
    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect(generateAISimulationMock).not.toHaveBeenCalled();
  });

  it('rejects oversized simulation payloads with 413', async () => {
    const request = new Request('http://localhost:3000/api/simulation/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(7 * 1024 * 1024),
      },
      body: JSON.stringify(validPayload),
    });

    const { POST } = await import('@/app/api/simulation/generate/route');
    const response = await POST(request as never);

    expect(response.status).toBe(413);
    expect(generateAISimulationMock).not.toHaveBeenCalled();
  });

  it('allows server-to-server requests without origin headers', async () => {
    const request = new Request('http://localhost:3000/api/simulation/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(validPayload),
    });

    const { POST } = await import('@/app/api/simulation/generate/route');
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imageUrl).toContain('simulation.jpg');
    expect(generateAISimulationMock).toHaveBeenCalledTimes(1);
  });
});
