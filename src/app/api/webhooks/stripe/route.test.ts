import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs before vi.mock factories - set env vars and create mock fns here
const {
  mockConstructEvent,
  mockCreate,
  mockUpdate,
  mockFirstPage,
} = vi.hoisted(() => {
  process.env.AIRTABLE_PAT = 'pat_test';
  process.env.AIRTABLE_BASE_ID = 'app_test';
  process.env.DASHBOARD_JWT_SECRET = 'test_secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

  return {
    mockConstructEvent: vi.fn(),
    mockCreate: vi.fn((_records: unknown, _opts: unknown, cb: (err: Error | null) => void) => cb(null)),
    mockUpdate: vi.fn((_records: unknown, _opts: unknown, cb: (err: Error | null) => void) => cb(null)),
    mockFirstPage: vi.fn((cb: (err: Error | null, records: { id: string }[]) => void) =>
      cb(null, [{ id: 'rec_test' }])
    ),
  };
});

vi.mock('stripe', () => {
  const StripeMock = function () {
    return {
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    };
  };
  return { default: StripeMock };
});

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    transactions: () => ({
      create: mockCreate,
      select: () => ({ firstPage: mockFirstPage }),
      update: mockUpdate,
    }),
    intakes: () => ({
      select: () => ({ firstPage: mockFirstPage }),
      update: mockUpdate,
    }),
    alerts: () => ({
      create: mockCreate,
    }),
  },
  rateLimitedQuery: (fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: (v: string) => v,
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    invalidatePrefix: vi.fn(),
  },
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logWebhookEvent: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    N8N_WEBHOOK_URL: 'https://n8n.test',
    CHERRY_API_KEY: '',
    CHERRY_WEBHOOK_SECRET: '',
  },
  hasFeature: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(new Response('Rate limited', { status: 429 })),
  RATE_LIMITS: { WEBHOOK: { maxRequests: 100, windowMs: 60000 } },
}));

import { POST, GET } from './route';

function makeRequest(body: string, signature = 'sig_valid'): Request {
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
      'x-forwarded-for': '127.0.0.1',
    },
    body,
  });
}

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signature verification', () => {
    it('rejects requests with invalid signatures', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const res = await POST(makeRequest('{}', 'bad_sig') as never);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('rejects requests with no signature header', async () => {
      const req = new Request('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: '{}',
      });

      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });
  });

  describe('checkout.session.completed', () => {
    it('creates a transaction record and returns 200', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            amount_total: 25000,
            metadata: { planId: 'plan_abc', tier: 'Recommended', clientName: 'Jane Doe' },
            customer_details: { name: 'Jane Doe' },
          },
        },
      });

      const res = await POST(makeRequest('{}') as never);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.event).toBe('checkout.session.completed');
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('Unknown event types', () => {
    it('returns 200 and acknowledges unknown events', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_unknown',
        type: 'customer.created',
        data: { object: {} },
      });

      const res = await POST(makeRequest('{}') as never);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.received).toBe(true);
      expect(json.event).toBe('customer.created');
    });
  });

  describe('GET health check', () => {
    it('returns status ok with configured events', async () => {
      const res = await GET();
      const json = await res.json();

      expect(json.status).toBe('ok');
      expect(json.webhook).toBe('stripe');
      expect(json.events).toContain('checkout.session.completed');
      expect(json.events).toContain('charge.refunded');
    });
  });
});
