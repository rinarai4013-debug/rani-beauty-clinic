/**
 * Integration tests for Template routes:
 *   POST /api/templates/post-treatment
 *   POST /api/templates/reactivation
 *   POST /api/templates/pre-consult
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildPostRequest,
  expectJsonStatus,
  expectBadRequest,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const getSessionFromRequestMock = vi.fn();
vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }),
  ),
  RATE_LIMITS: {
    WEBHOOK: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock('@/lib/templates/post-treatment', () => ({
  getPostTreatmentTemplate: vi.fn().mockImplementation((step: string, vars: Record<string, string>) => {
    if (step === 'invalid-step') return null;
    return {
      step,
      sms: `Hi ${vars.firstName}, thank you for your ${vars.serviceName} treatment!`,
      email: { subject: 'Post-Treatment Care', html: '<p>Thank you!</p>' },
    };
  }),
  getAllPostTreatmentTemplates: vi.fn().mockReturnValue([
    { step: 'immediate', sms: 'Thank you!', email: { subject: 'Thanks', html: '<p>Thanks</p>' } },
    { step: '24h-checkin', sms: 'How are you?', email: { subject: 'Check-in', html: '<p>Check-in</p>' } },
    { step: '72h-review', sms: 'Leave a review', email: { subject: 'Review', html: '<p>Review</p>' } },
    { step: '7d-results', sms: 'Results', email: { subject: 'Results', html: '<p>Results</p>' } },
    { step: '30d-rebook', sms: 'Rebook', email: { subject: 'Rebook', html: '<p>Rebook</p>' } },
  ]),
  getAftercareLinkForService: vi.fn().mockReturnValue('https://www.ranibeautyclinic.com/aftercare/hydrafacial'),
  getNextRecommendedService: vi.fn().mockReturnValue('VI Peel'),
}));

vi.mock('@/lib/templates/reactivation', () => ({
  getReactivationTemplate: vi.fn().mockImplementation((tier: string, vars: Record<string, string>) => ({
    sms: `${vars.firstName}, we miss you!`,
    email: { subject: `We miss you, ${vars.firstName}!`, html: '<p>Come back!</p>' },
  })),
  getAutoReactivationTemplate: vi.fn().mockReturnValue({
    tier: 'lapsed-30',
    sms: 'We miss you!',
    email: { subject: 'We miss you!', html: '<p>Come back!</p>' },
  }),
}));

vi.mock('@/lib/templates/pre-consult', () => ({
  getPreConsultTemplate: vi.fn().mockImplementation((step: string, vars: Record<string, string>) => {
    if (step === 'invalid-step') return null;
    return {
      step,
      sms: `Hi ${vars.firstName}, your ${vars.serviceName} appointment is confirmed!`,
      email: { subject: 'Appointment Confirmed', html: '<p>Confirmed!</p>' },
    };
  }),
  getAllPreConsultTemplates: vi.fn().mockReturnValue([
    { step: 'booking-confirmation', sms: 'Confirmed!', email: { subject: 'Confirmed', html: '<p>OK</p>' } },
    { step: '24h-reminder', sms: 'Reminder!', email: { subject: 'Reminder', html: '<p>Reminder</p>' } },
    { step: '2h-reminder', sms: 'Almost time!', email: { subject: 'Soon', html: '<p>Soon</p>' } },
  ]),
}));

// ---------------------------------------------------------------------------
// POST /api/templates/post-treatment
// ---------------------------------------------------------------------------

describe('POST /api/templates/post-treatment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ userId: 'u1', role: 'ceo', username: 'test' });
    delete process.env.N8N_API_KEY;
  });

  it('should return template for specific step', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'immediate',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
      appointmentDate: '2026-03-25',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.step).toBe('immediate');
    expect(data.sms).toContain('Jane');
    expect(data.email).toBeDefined();
  });

  it('should return all 5 templates when step is "all"', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'all',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(5);
  });

  it('should return 400 when firstName is missing', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'immediate',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when serviceName is missing', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'immediate',
      firstName: 'Jane',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 when providerName is missing', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'immediate',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 for unknown step', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'invalid-step',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 401 when n8n API key is required but wrong', async () => {
    getSessionFromRequestMock.mockRejectedValue(new Error('no session'));
    process.env.N8N_API_KEY = 'correct-key';
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      step: 'immediate',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    }, { 'x-webhook-secret': 'wrong-key' });

    const response = await POST(req as any);
    await expectJsonStatus(response, 401);
  });

  it('should default to immediate step when not specified', async () => {
    const { POST } = await import('@/app/api/templates/post-treatment/route');
    const req = buildPostRequest('/api/templates/post-treatment', {
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.step).toBe('immediate');
  });
});

// ---------------------------------------------------------------------------
// POST /api/templates/reactivation
// ---------------------------------------------------------------------------

describe('POST /api/templates/reactivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ userId: 'u1', role: 'ceo', username: 'test' });
    delete process.env.N8N_API_KEY;
  });

  it('should return auto-detected tier template', async () => {
    const { POST } = await import('@/app/api/templates/reactivation/route');
    const req = buildPostRequest('/api/templates/reactivation', {
      firstName: 'Jane',
      lastService: 'HydraFacial',
      daysSinceLastVisit: 45,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tier).toBeDefined();
    expect(data.sms).toBeDefined();
    expect(data.email).toBeDefined();
  });

  it('should return specific tier template when tier is provided', async () => {
    const { POST } = await import('@/app/api/templates/reactivation/route');
    const req = buildPostRequest('/api/templates/reactivation', {
      firstName: 'Jane',
      lastService: 'HydraFacial',
      daysSinceLastVisit: 90,
      tier: 'lapsed-90',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sms).toContain('Jane');
  });

  it('should return 400 when firstName is missing', async () => {
    const { POST } = await import('@/app/api/templates/reactivation/route');
    const req = buildPostRequest('/api/templates/reactivation', {
      lastService: 'HydraFacial',
      daysSinceLastVisit: 45,
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should use default values for optional fields', async () => {
    const { POST } = await import('@/app/api/templates/reactivation/route');
    const req = buildPostRequest('/api/templates/reactivation', {
      firstName: 'Jane',
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/templates/pre-consult
// ---------------------------------------------------------------------------

describe('POST /api/templates/pre-consult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ userId: 'u1', role: 'ceo', username: 'test' });
    delete process.env.N8N_API_KEY;
  });

  it('should return booking confirmation template', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'booking-confirmation',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
      appointmentDate: 'March 25, 2026',
      appointmentTime: '2:30 PM',
      duration: 60,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sms).toContain('Jane');
  });

  it('should return all pre-consult templates when step is "all"', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'all',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(3);
  });

  it('should return 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'booking-confirmation',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should return 400 for unknown step', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'invalid-step',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
    });

    const response = await POST(req as any);
    await expectBadRequest(response);
  });

  it('should handle new client flag', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'booking-confirmation',
      firstName: 'Jane',
      serviceName: 'HydraFacial',
      providerName: 'Mom',
      isNewClient: true,
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });

  it('should handle deposit information', async () => {
    const { POST } = await import('@/app/api/templates/pre-consult/route');
    const req = buildPostRequest('/api/templates/pre-consult', {
      step: 'booking-confirmation',
      firstName: 'Jane',
      serviceName: 'Sofwave',
      providerName: 'Mom',
      depositPaid: true,
      depositAmount: 500,
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });
});
