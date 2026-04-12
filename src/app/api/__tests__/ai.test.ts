/**
 * Integration tests for AI routes:
 *   POST /api/ai/chat
 *   POST /api/ai/recommend
 *   POST /api/ai/intake
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  buildPostRequest,
  expectJsonStatus,
  expectUnauthorized,
  expectBadRequest,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockHasPermission = vi.fn();
const mockGetClientIP = vi.fn();
const mockRateLimit = vi.fn();
const mockRateLimitResponse = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
  RATE_LIMITS: {
    AI: { limit: 10, windowMs: 60000 },
    FORM: { limit: 20, windowMs: 60000 },
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
}));

vi.mock('@/lib/sentry-utils', () => ({
  captureAgentExecution: vi.fn(),
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/voice/rani-voice', () => ({
  RANI_SYSTEM_PROMPT: 'You are the AI concierge for Rani Beauty Clinic.',
}));

vi.mock('@/lib/rag/knowledge-base', () => ({
  buildRAGContext: vi.fn().mockReturnValue({
    contextText: 'HydraFacial is a signature facial treatment.',
    confidence: 80,
    sources: ['treatment-protocols'],
  }),
}));

// Mock the Anthropic SDK
const mockMessagesCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Thank you for your interest! Our HydraFacial is $275. [BOOK_NOW]' }],
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: (...args: unknown[]) => mockMessagesCreate(...args),
    },
  })),
}));

// ---------------------------------------------------------------------------
// POST /api/ai/chat
// ---------------------------------------------------------------------------

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockRateLimitResponse.mockImplementation((resetIn: number) =>
      new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
    );
  });

  it('should return AI response for valid messages', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'Tell me about HydraFacial' }],
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reply).toBeDefined();
    expect(data.source).toBe('ai');
  });

  it('should extract book_now actions from response', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'I want to book a treatment' }],
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(data.actions).toBeDefined();
    expect(Array.isArray(data.actions)).toBe(true);
  });

  it('should return 400 when messages are missing', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {});

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when messages is empty array', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', { messages: [] });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when messages is not an array', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', { messages: 'hello' });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when request JSON is malformed', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"messages":',
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('should return fallback when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    // Need fresh import to pick up missing env
    vi.resetModules();
    const mod = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const response = await mod.POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
  });

  it('should return 429 when rate limited', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 42 });
    const response = await POST(buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'One more' }],
    }, { 'x-forwarded-for': '192.168.1.50' }) as any);

    expect(response.status).toBe(429);
  });

  it('should return fallback response when Anthropic call fails', async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error('anthropic timeout'));
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'What should I book?' }],
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(typeof data.reply).toBe('string');
  });

  it('should capture lead info when email is shared', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'My email is jane@test.com and I want to learn more' }],
    }, { 'x-forwarded-for': '10.0.0.20' });

    const response = await POST(req as any);
    const data = await response.json();

    expect(data.leadInfo).toBeDefined();
    expect(data.leadInfo?.email).toBe('jane@test.com');
  });

  it('should capture lead info when phone is shared', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'Call me at 425-555-0100' }],
    }, { 'x-forwarded-for': '10.0.0.21' });

    const response = await POST(req as any);
    const data = await response.json();

    expect(data.leadInfo).toBeDefined();
    expect(data.leadInfo?.phone).toBeDefined();
  });

  it('should handle visitor context', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const req = buildPostRequest('/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hello' }],
      visitorInfo: { name: 'Jane', email: 'jane@test.com', page: '/services' },
    }, { 'x-forwarded-for': '10.0.0.22' });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/recommend
// ---------------------------------------------------------------------------

describe('POST /api/ai/recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockRateLimitResponse.mockImplementation((resetIn: number) =>
      new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
    );

    mockMessagesCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          good: { title: 'Essential Glow', services: [{ name: 'HydraFacial', price: '$275', why: 'Great starter' }], totalEstimate: '$275', timeline: '1 week' },
          better: { title: 'Complete', services: [{ name: 'HydraFacial', price: '$275', why: 'Base' }], totalEstimate: '$770', timeline: '4 weeks' },
          best: { title: 'Ultimate', services: [{ name: 'Sofwave', price: '$2,750', why: 'Premium' }], totalEstimate: '$3,500', timeline: '8 weeks' },
          personalNote: 'Your journey starts here.',
        }),
      }],
    });
  });

  it('should return AI recommendation with 3 tiers', async () => {
    const { POST } = await import('@/app/api/ai/recommend/route');
    const req = buildPostRequest('/api/ai/recommend', {
      primaryGoal: 'glowing-skin',
      experience: 'beginner',
      timeline: '1-month',
      budget: 'moderate',
    }, { 'x-forwarded-for': '10.0.0.30' });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendation).toBeDefined();
    expect(data.source).toBe('ai');
  });

  it('should return 400 when primaryGoal is missing', async () => {
    const { POST } = await import('@/app/api/ai/recommend/route');
    const req = buildPostRequest('/api/ai/recommend', {
      experience: 'beginner',
    }, { 'x-forwarded-for': '10.0.0.31' });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when recommend request JSON is malformed', async () => {
    const { POST } = await import('@/app/api/ai/recommend/route');
    const req = new Request('http://localhost:3000/api/ai/recommend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"primaryGoal":',
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('should return 429 when recommend endpoint is rate-limited', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 33 });
    const { POST } = await import('@/app/api/ai/recommend/route');
    const req = buildPostRequest('/api/ai/recommend', {
      primaryGoal: 'glowing-skin',
    }, { 'x-forwarded-for': '10.0.0.90' });

    const response = await POST(req as any);
    expect(response.status).toBe(429);
  });

  it('should return static recommendation when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();

    const mod = await import('@/app/api/ai/recommend/route');
    const req = buildPostRequest('/api/ai/recommend', {
      primaryGoal: 'anti-aging',
    }, { 'x-forwarded-for': '10.0.0.32' });

    const response = await mod.POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('static');
    expect(data.recommendation).toHaveProperty('good');
    expect(data.recommendation).toHaveProperty('better');
    expect(data.recommendation).toHaveProperty('best');
  });

  it('should return static recommendation when Anthropic JSON parsing fails', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not-json' }],
    });

    const { POST } = await import('@/app/api/ai/recommend/route');
    const req = buildPostRequest('/api/ai/recommend', {
      primaryGoal: 'anti-aging',
    }, { 'x-forwarded-for': '10.0.0.91' });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('static');
    expect(data.recommendation).toHaveProperty('good');
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/intake
// ---------------------------------------------------------------------------

describe('POST /api/ai/intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    mockGetClientIP.mockReturnValue('127.0.0.1');
    mockRateLimit.mockReturnValue({ allowed: true, resetIn: 0 });
    mockRateLimitResponse.mockImplementation((resetIn: number) =>
      new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
    );

    mockMessagesCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          summary: 'New client interested in skin rejuvenation.',
          riskFlags: [],
          clientTier: 'mid-value',
          recommendedPackage: { name: 'Glow Package', services: ['HydraFacial', 'VI Peel'], estimatedValue: '$670', timeline: '4 weeks' },
          consultScript: ['Welcome them warmly', 'Discuss goals', 'Present package'],
          upsellOpportunities: ['Tretinoin Rx', 'Membership'],
          urgency: 'medium',
          suggestedNextStep: 'Schedule consultation this week',
        }),
      }],
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', { intakeData: {} });
    const response = await POST(req as any);
    await expectUnauthorized(response);
  });

  it('should return 403 when lacking permission', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(false);
    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', { intakeData: {} });
    const response = await POST(req as any);

    expect(response.status).toBe(403);
  });

  it('should return intake intelligence', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(true);

    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', {
      intakeData: {
        firstName: 'Jane',
        lastName: 'Doe',
        goals: 'Skin rejuvenation, anti-aging',
        skinType: 'Combination',
        allergies: 'None',
      },
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.intelligence).toBeDefined();
    expect(data.source).toBe('ai');
  });

  it('should return 400 when intakeData is missing', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(true);

    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', {});
    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when intake request JSON is malformed', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(true);

    const { POST } = await import('@/app/api/ai/intake/route');
    const req = new Request('http://localhost:3000/api/ai/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"intakeData":',
    });
    const response = await POST(req as any);

    expect(response.status).toBe(400);
  });

  it('should return 429 when intake endpoint is rate-limited', async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, resetIn: 45 });

    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', { intakeData: { firstName: 'Jane' } }, {
      'x-forwarded-for': '10.0.0.92',
    });
    const response = await POST(req as any);

    expect(response.status).toBe(429);
  });

  it('should return 503 when API key is missing', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(true);
    delete process.env.ANTHROPIC_API_KEY;

    vi.resetModules();
    const mod = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', { intakeData: { firstName: 'Jane' } });
    const response = await mod.POST(req as any);

    expect(response.status).toBe(503);
  });

  it('should return fallback intelligence when Anthropic processing fails', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    mockHasPermission.mockReturnValue(true);
    mockMessagesCreate.mockRejectedValueOnce(new Error('anthropic unavailable'));

    const { POST } = await import('@/app/api/ai/intake/route');
    const req = buildPostRequest('/api/ai/intake', { intakeData: { firstName: 'Jane' } });
    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(data.intelligence).toBeDefined();
  });
});
