import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const forbiddenMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
);
const getSessionByIdAsyncMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
  forbidden: (...args: unknown[]) => forbiddenMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

// ── Fixtures ──

const PROVIDER_SESSION = {
  username: 'dr_smith',
  role: 'provider',
  displayName: 'Dr. Smith',
  name: 'Dr. Smith',
};

const FRONTDESK_SESSION = {
  username: 'desk',
  role: 'frontdesk',
  displayName: 'Front Desk',
  name: 'Front Desk',
};

const MOCK_MASTERMIND_SESSION = {
  id: 'sess_abc123',
  phase: 'completed',
  patientName: 'Jane Doe',
};

const VALID_ELIGIBLE_PAYLOAD = {
  sessionId: 'sess_abc123',
  metabolicStatus: 'eligible',
  recommendedTrack: 'glp1',
  protocolTier: 'foundation',
  fulfillmentPreference: 'clinic',
  homeDeliveryRequested: false,
  dosageGovernanceSummary: 'Provider-authorized semaglutide protocol. Foundation tier. Clinic dispensing.',
  providerReviewRequired: false,
  approvalStatus: 'not_required',
};

const VALID_HELD_PAYLOAD = {
  ...VALID_ELIGIBLE_PAYLOAD,
  metabolicStatus: 'provider-review-required',
  providerReviewRequired: true,
  approvalStatus: 'pending',
};

const INELIGIBLE_PAYLOAD = {
  ...VALID_ELIGIBLE_PAYLOAD,
  metabolicStatus: 'ineligible',
};

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/mastermind/metabolic-handoff', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Tests ──

describe('POST /api/mastermind/metabolic-handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.METABOLIC_CHECKOUT_URL;
  });

  // ── Auth ──

  it('returns 401 when unauthenticated (no session)', async () => {
    getSessionFromRequestMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_ELIGIBLE_PAYLOAD) as never);
    expect(response.status).toBe(401);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when authenticated but role is not permitted (frontdesk)', async () => {
    getSessionFromRequestMock.mockResolvedValue(FRONTDESK_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_ELIGIBLE_PAYLOAD) as never);
    expect(response.status).toBe(403);
    expect(forbiddenMock).toHaveBeenCalledTimes(1);
  });

  // ── Validation ──

  it('returns 422 for invalid payload (missing required fields)', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest({ sessionId: 'abc' }) as never);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('returns 422 and blocked:true for ineligible patient — handoff blocked', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(INELIGIBLE_PAYLOAD) as never);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.blocked).toBe(true);
    // Ineligible: session lookup should NOT have been called
    expect(getSessionByIdAsyncMock).not.toHaveBeenCalled();
  });

  // ── Session lookup ──

  it('returns 404 when mastermind session not found', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_ELIGIBLE_PAYLOAD) as never);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  // ── Success paths ──

  it('eligible: returns handoffSubmitted:true with checkoutUrl populated', async () => {
    process.env.METABOLIC_CHECKOUT_URL = 'https://checkout.example.com/metabolic';
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(MOCK_MASTERMIND_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_ELIGIBLE_PAYLOAD) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.handoffSubmitted).toBe(true);
    expect(body.data.checkoutUrl).toBe('https://checkout.example.com/metabolic');
    expect(body.data.heldForProviderReview).toBe(false);
    expect(body.data.sessionId).toBe('sess_abc123');
    expect(body.data.recommendedTrack).toBe('glp1');
    expect(body.data.protocolTier).toBe('foundation');
    expect(body.data.providerReviewRequired).toBe(false);
  });

  it('provider-review-required: handoffSubmitted:true, checkoutUrl:null, held:true', async () => {
    process.env.METABOLIC_CHECKOUT_URL = 'https://checkout.example.com/metabolic';
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(MOCK_MASTERMIND_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_HELD_PAYLOAD) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.handoffSubmitted).toBe(true);
    expect(body.data.checkoutUrl).toBeNull();
    expect(body.data.heldForProviderReview).toBe(true);
    expect(body.data.approvalStatus).toBe('pending');
    expect(body.data.providerReviewRequired).toBe(true);
  });

  it('eligible without METABOLIC_CHECKOUT_URL: checkoutUrl is null', async () => {
    // Env var not set
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(MOCK_MASTERMIND_SESSION);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(makeRequest(VALID_ELIGIBLE_PAYLOAD) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.handoffSubmitted).toBe(true);
    expect(body.data.checkoutUrl).toBeNull();
    expect(body.data.heldForProviderReview).toBe(false);
  });
});
