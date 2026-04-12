import { beforeEach, describe, expect, it, vi } from 'vitest';

const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn((resetIn: number) =>
  new Response(JSON.stringify({ error: 'Too many requests', resetIn }), { status: 429 }),
);
const sharpMock = vi.fn().mockImplementation(() => ({
  metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  resize: vi.fn().mockReturnThis(),
  jpeg: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('image')),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    FORM: { limit: 5, windowMs: 60_000 },
  },
}));

vi.mock('sharp', () => ({
  default: (...args: unknown[]) => sharpMock(...args),
}));

describe('POST /api/photo/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
  });

  it('blocks disallowed browser origins with 403', async () => {
    const request = new Request('http://localhost:3000/api/photo/upload', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example.com',
      },
    });

    const { POST } = await import('@/app/api/photo/upload/route');
    const response = await POST(request as never);

    expect(response.status).toBe(403);
  });

  it('rejects oversized multipart payloads by content-length with 413', async () => {
    const request = new Request('http://localhost:3000/api/photo/upload', {
      method: 'POST',
      headers: {
        'content-length': String(27 * 1024 * 1024),
      },
    });

    const { POST } = await import('@/app/api/photo/upload/route');
    const response = await POST(request as never);

    expect(response.status).toBe(413);
  });

  it('allows first-party browser origins and continues route validation', async () => {
    const formData = new FormData();
    formData.set('file', new File(['test'], 'test.txt', { type: 'text/plain' }));

    const request = new Request('http://localhost:3000/api/photo/upload', {
      method: 'POST',
      headers: {
        origin: 'https://www.ranibeautyclinic.com',
      },
      body: formData,
    });

    const { POST } = await import('@/app/api/photo/upload/route');
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });
});
