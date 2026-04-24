import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
);
const mockSimulationComparisonMock = vi.fn();
const buildCompletionResultMock = vi.fn();
const buildN8nWebhookPayloadMock = vi.fn();
const anthropicMessagesStreamMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
}));

vi.mock('@/lib/mastermind/mock-data', () => ({
  mockSimulationComparison: (...args: unknown[]) => mockSimulationComparisonMock(...args),
}));

vi.mock('@/lib/mastermind/post-consultation', () => ({
  buildCompletionResult: (...args: unknown[]) => buildCompletionResultMock(...args),
  buildN8nWebhookPayload: (...args: unknown[]) => buildN8nWebhookPayloadMock(...args),
}));

vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: {
      stream: (...args: unknown[]) => anthropicMessagesStreamMock(...args),
    },
  })),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

function makeRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest(url: string): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"bad":',
  });
}

function asAsyncIterable<T>(events: T[]): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

const mockSimulationResult = {
  withTreatment: { frames: [], narrative: 'with treatment' },
  withoutTreatment: { frames: [], narrative: 'without treatment' },
  comparison: { auraScoreDelta: 12, skinAgeDelta: 4, keyDifferentiators: ['delta'] },
  costOfDelay: {
    currentPlanCost: 2000,
    costIfDelayed1Year: 2600,
    costIfDelayed3Years: 4200,
    reasoning: 'delay increases cost',
  },
};

describe('mastermind simulate + complete + copilot routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    delete process.env.N8N_WEBHOOK_URL;
    delete process.env.WEBHOOK_TIMEOUT_MS;

    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    getSessionFromRequestMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
    });

    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_1',
      phase: 'scan_review',
    });

    sessionReducerMock.mockImplementation((__session: unknown, __action: unknown) => ({
      id: 'ms_1',
      phase: 'completed',
    }));
    saveSessionAsyncMock.mockResolvedValue(undefined);

    mockSimulationComparisonMock.mockReturnValue(mockSimulationResult);

    buildCompletionResultMock.mockReturnValue({
      sessionId: 'ms_1',
      status: 'completed',
      completedAt: '2026-04-11T00:00:00.000Z',
      pdf: {
        filename: 'mastermind-plan.pdf',
        generatedAt: '2026-04-11T00:00:00.000Z',
      },
      automationPayload: {
        patient: { email: 'jane@example.com' },
      },
    });
    buildN8nWebhookPayloadMock.mockReturnValue({ workflow: 'mastermind-complete' });

    anthropicMessagesStreamMock.mockResolvedValue(
      asAsyncIterable([
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Use this script. ' },
        },
        {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Close confidently.' },
        },
      ]),
    );
  });

  it('POST /api/mastermind/simulate returns 401 when staff session is missing', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/simulate/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/simulate', {}) as never,
    );

    expect(response.status).toBe(401);
  });

  it('POST /api/mastermind/simulate rejects invalid JSON body', async () => {
    const { POST } = await import('@/app/api/mastermind/simulate/route');
    const response = await POST(
      makeInvalidJsonRequest('http://localhost:3000/api/mastermind/simulate') as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/simulate returns 404 for unknown session', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/simulate/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/simulate', { sessionId: 'missing' }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/simulate returns mock render when sessionId is omitted', async () => {
    const { POST } = await import('@/app/api/mastermind/simulate/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/simulate', {}) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.renderMode).toBe('mock');
    expect(mockSimulationComparisonMock).toHaveBeenCalledTimes(1);
    expect(saveSessionAsyncMock).not.toHaveBeenCalled();
  });

  it('POST /api/mastermind/simulate generates and persists data-driven output', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      phase: 'scan_review',
      intakeData: { dob: '1990-01-01' },
      auraScanResult: {
        auraScore: {
          overall: 66,
          skinAge: 41,
          skinAgeDelta: 5,
        },
        detectedConcerns: [{ concern: 'wrinkles' }, { concern: 'pigmentation' }],
      },
      mastermindPlan: {
        recommendations: {
          primary: [{ totalEstimate: 1200 }],
          complementary: [{ totalEstimate: 800 }],
        },
      },
    });

    const { POST } = await import('@/app/api/mastermind/simulate/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/simulate', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.renderMode).toBe('data-driven');
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
    expect(mockSimulationComparisonMock).not.toHaveBeenCalled();
  });

  it('POST /api/mastermind/complete rejects invalid JSON body', async () => {
    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeInvalidJsonRequest('http://localhost:3000/api/mastermind/complete') as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/complete returns 404 for unknown session', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'missing' }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/complete blocks incomplete sessions', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: null,
      mastermindPlan: null,
      providerReview: null,
      selectedPackageTier: null,
    });

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.missing).toEqual({
      scan: true,
      plan: true,
      review: true,
      package: true,
    });
  });

  it('POST /api/mastermind/complete sends webhook and completes session', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://hooks.example.com';
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: { auraScore: { overall: 80 } },
      mastermindPlan: { recommendations: {} },
      providerReview: { approved: true },
      selectedPackageTier: 'Transform',
    });

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.webhookStatus).toBe('sent');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example.com/webhook/mastermind-complete',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/complete succeeds with skipped webhook when N8N URL is unset', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: { auraScore: { overall: 80 } },
      mastermindPlan: { recommendations: {} },
      providerReview: { approved: true },
      selectedPackageTier: 'Transform',
    });

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.webhookStatus).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/complete returns success when webhook fails', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://hooks.example.com/';
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: { auraScore: { overall: 80 } },
      mastermindPlan: { recommendations: {} },
      providerReview: { approved: true },
      selectedPackageTier: 'Transform',
    });

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.webhookStatus).toBe('failed');
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/complete returns 500 when completion payload build fails', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: { auraScore: { overall: 80 } },
      mastermindPlan: { recommendations: {} },
      providerReview: { approved: true },
      selectedPackageTier: 'Transform',
    });
    buildCompletionResultMock.mockImplementationOnce(() => {
      throw new Error('bad completion state');
    });

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('bad completion state');
  });

  it('POST /api/mastermind/complete returns 500 when session lookup throws', async () => {
    getSessionByIdAsyncMock.mockRejectedValueOnce(new Error('session store down'));

    const { POST } = await import('@/app/api/mastermind/complete/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/complete', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('session store down');
  });

  it('POST /api/mastermind/copilot rejects invalid JSON body', async () => {
    const { POST } = await import('@/app/api/mastermind/copilot/route');
    const response = await POST(
      makeInvalidJsonRequest('http://localhost:3000/api/mastermind/copilot') as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/copilot rejects invalid context values', async () => {
    const { POST } = await import('@/app/api/mastermind/copilot/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/copilot', {
        sessionId: 'ms_1',
        prompt: 'what should I say?',
        context: 'unsupported',
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/copilot returns 404 when session is missing', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/copilot/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/copilot', {
        sessionId: 'missing',
        prompt: 'what should I say?',
        context: 'scan_review',
      }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/copilot streams text response from anthropic', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      phase: 'scan_review',
      patientName: 'Jane Doe',
      patientEmail: 'jane@example.com',
      intakeData: { budget: '$2,500' },
      auraScanResult: undefined,
      mastermindPlan: undefined,
    });

    const { POST } = await import('@/app/api/mastermind/copilot/route');
    const response = await POST(
      makeRequest('http://localhost:3000/api/mastermind/copilot', {
        sessionId: 'ms_1',
        prompt: 'How should I position pricing?',
        context: 'plan_discussion',
      }) as never,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(body).toBe('Use this script. Close confidently.');
    expect(anthropicMessagesStreamMock).toHaveBeenCalledTimes(1);
    expect(anthropicMessagesStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        messages: [
          {
            role: 'user',
            content: 'How should I position pricing?',
          },
        ],
      }),
    );
  });
});
