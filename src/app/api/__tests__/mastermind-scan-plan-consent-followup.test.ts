import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
);
const runAuraScanMock = vi.fn();
const mockAuraScanResultMock = vi.fn();
const generateMastermindPlanMock = vi.fn();
const generateAIPlanMock = vi.fn();
const mockMastermindPlanMock = vi.fn();
const renderTemplateMock = vi.fn();
const resolveTokenMock = vi.fn();
const saveTokenToAirtableMock = vi.fn();
const resendSendMock = vi.fn();
const createRecordMock = vi.fn();
const messagesLogTableMock = vi.fn();

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

vi.mock('@/lib/mastermind/aura-scan', () => ({
  runAuraScan: (...args: unknown[]) => runAuraScanMock(...args),
}));

vi.mock('@/lib/mastermind/mock-data', () => ({
  mockAuraScanResult: (...args: unknown[]) => mockAuraScanResultMock(...args),
  mockMastermindPlan: (...args: unknown[]) => mockMastermindPlanMock(...args),
}));

vi.mock('@/lib/mastermind/plan-generator', () => ({
  generateMastermindPlan: (...args: unknown[]) => generateMastermindPlanMock(...args),
}));

vi.mock('@/lib/mastermind/ai-plan-generator', () => ({
  generateAIPlan: (...args: unknown[]) => generateAIPlanMock(...args),
}));

vi.mock('@/lib/plan-builder/follow-up-templates', () => ({
  FOLLOW_UP_TEMPLATES: {
    reconnect: { name: 'Reconnect', channel: 'email', tone: 'warm', subject: 'We saved your plan' },
    sms_nudge: { name: 'SMS Nudge', channel: 'sms', tone: 'direct' },
  },
  renderTemplate: (...args: unknown[]) => renderTemplateMock(...args),
}));

vi.mock('@/lib/mastermind/share-token', () => ({
  resolveToken: (...args: unknown[]) => resolveTokenMock(...args),
  saveTokenToAirtable: (...args: unknown[]) => saveTokenToAirtableMock(...args),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => resendSendMock(...args),
    },
  })),
}));

vi.mock('@/lib/airtable/client', () => ({
  createRecord: (...args: unknown[]) => createRecordMock(...args),
  Tables: {
    messagesLog: (...args: unknown[]) => messagesLogTableMock(...args),
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('mastermind scan + plan + consent + follow-up routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.USE_MOCK_AI;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.N8N_WEBHOOK_URL;

    getSessionFromRequestMock.mockResolvedValue({
      username: 'rina',
      name: 'Rina',
      role: 'ceo',
    });

    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_1',
      patientName: 'Jane Doe',
      patientEmail: 'jane@example.com',
      phase: 'scan_review',
      intakeData: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      sourcePhotoUrl: 'https://example.com/photo.jpg',
      mastermindPlan: { recommendations: { primary: [], complementary: [], maintenance: [] } },
      activityLog: [],
      clinicNotes: '',
    });

    sessionReducerMock.mockImplementation((session: unknown) => session);
    saveSessionAsyncMock.mockResolvedValue(undefined);

    runAuraScanMock.mockResolvedValue({ auraScore: { overall: 81 } });
    mockAuraScanResultMock.mockReturnValue({ auraScore: { overall: 54 } });
    generateMastermindPlanMock.mockReturnValue({
      packages: [{ name: 'Transform', price: 2900 }],
      recommendations: { primary: [] },
    });
    generateAIPlanMock.mockResolvedValue({
      packages: [{ name: 'AI Transform', price: 3100 }],
      recommendations: { primary: [] },
    });
    mockMastermindPlanMock.mockReturnValue({
      packages: [{ name: 'Mock Plan', price: 2500 }],
      recommendations: { primary: [] },
    });

    resolveTokenMock.mockResolvedValue({
      token: 'share_token_1',
      sessionId: 'ms_1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    saveTokenToAirtableMock.mockResolvedValue(undefined);

    renderTemplateMock.mockReturnValue({
      subject: 'Your personalized plan',
      body: '<p>Here is your plan.</p>',
    });

    resendSendMock.mockResolvedValue({ id: 'email_1' });
    createRecordMock.mockResolvedValue({ id: 'msg_1' });
    messagesLogTableMock.mockReturnValue('messages_log_table');

    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof global.fetch;
  });

  it('POST /api/mastermind/scan returns 401 without a staff session', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/scan/route');

    const response = await POST(post('http://localhost:3000/api/mastermind/scan', {}) as never);
    expect(response.status).toBe(401);
  });

  it('POST /api/mastermind/scan returns 400 when intake data is missing', async () => {
    const { POST } = await import('@/app/api/mastermind/scan/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/scan', {}) as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/scan returns 404 when sessionId does not exist', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/scan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/scan', { sessionId: 'missing' }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/scan runs engine mode and persists result', async () => {
    const { POST } = await import('@/app/api/mastermind/scan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/scan', { sessionId: 'ms_1' }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.source).toBe('engine');
    expect(runAuraScanMock).toHaveBeenCalledTimes(1);
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/scan uses mock mode when USE_MOCK_AI=true', async () => {
    process.env.USE_MOCK_AI = 'true';
    const { POST } = await import('@/app/api/mastermind/scan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/scan', {
        intakeData: { firstName: 'Jane', lastName: 'Doe' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.source).toBe('mock');
    expect(mockAuraScanResultMock).toHaveBeenCalledTimes(1);
    expect(runAuraScanMock).not.toHaveBeenCalled();
  });

  it('POST /api/mastermind/plan returns 401 without a staff session', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/plan/route');

    const response = await POST(post('http://localhost:3000/api/mastermind/plan', {}) as never);
    expect(response.status).toBe(401);
  });

  it('POST /api/mastermind/plan returns 400 when scan/intake are missing', async () => {
    const { POST } = await import('@/app/api/mastermind/plan/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/plan', {}) as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/plan returns 404 when sessionId does not exist', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/plan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/plan', { sessionId: 'missing' }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/plan uses engine mode with inline payload', async () => {
    const { POST } = await import('@/app/api/mastermind/plan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/plan', {
        scanResult: { auraScore: { overall: 77 } },
        intakeData: { firstName: 'Jane', lastName: 'Doe' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.source).toBe('engine');
    expect(generateMastermindPlanMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/plan uses mock mode when USE_MOCK_AI=true', async () => {
    process.env.USE_MOCK_AI = 'true';
    const { POST } = await import('@/app/api/mastermind/plan/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/plan', {
        scanResult: { auraScore: { overall: 70 } },
        intakeData: { firstName: 'Jane' },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.source).toBe('mock');
    expect(mockMastermindPlanMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/consent validates consentType', async () => {
    const { POST } = await import('@/app/api/mastermind/consent/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/consent', {
        sessionId: 'ms_1',
        consentType: 'invalid',
        signatureDataUrl: 'data:image/png;base64,abc',
        patientName: 'Jane Doe',
        signedAt: new Date().toISOString(),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/consent persists valid consent records', async () => {
    const { POST } = await import('@/app/api/mastermind/consent/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/consent', {
        sessionId: 'ms_1',
        consentType: 'general_treatment',
        signatureDataUrl: 'data:image/png;base64,abc',
        patientName: 'Jane Doe',
        signedAt: new Date().toISOString(),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/mastermind/consent returns completeness and missing consent list', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      mastermindPlan: { recommendations: { primary: [{ name: 'Sofwave' }] } },
      _consentRecords: [
        {
          id: 'c1',
          sessionId: 'ms_1',
          consentType: 'general_treatment',
          signatureDataUrl: 'data:image/png;base64,a',
        },
        {
          id: 'c2',
          sessionId: 'ms_1',
          consentType: 'financial',
          signatureDataUrl: 'data:image/png;base64,b',
        },
        {
          id: 'c3',
          sessionId: 'ms_1',
          consentType: 'photo_release',
          signatureDataUrl: 'data:image/png;base64,c',
        },
      ],
    });

    const { GET } = await import('@/app/api/mastermind/consent/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/consent?sessionId=ms_1') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.allConsentsComplete).toBe(false);
    expect(body.data.missingConsents).toContain('specific_procedure');
    expect(body.data.consents[0].hasSignature).toBe(true);
    expect(body.data.consents[0].signatureDataUrl).toBeUndefined();
  });

  it('POST /api/mastermind/follow-up rejects unknown template IDs', async () => {
    const { POST } = await import('@/app/api/mastermind/follow-up/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/follow-up', {
        sessionId: 'ms_1',
        templateId: 'does-not-exist',
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/follow-up returns 422 when email channel has no email', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      patientName: 'Jane Doe',
      patientEmail: '',
      intakeData: {},
    });

    const { POST } = await import('@/app/api/mastermind/follow-up/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/follow-up', {
        sessionId: 'ms_1',
        templateId: 'reconnect',
        channel: 'email',
      }) as never,
    );

    expect(response.status).toBe(422);
  });

  it('POST /api/mastermind/follow-up sends email and logs audit record', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ranibeautyclinic.com';

    const { POST } = await import('@/app/api/mastermind/follow-up/route');
    const response = await POST(
      post('http://localhost:3000/api/mastermind/follow-up', {
        sessionId: 'ms_1',
        templateId: 'reconnect',
        channel: 'email',
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.channel).toBe('email');
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(createRecordMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/mastermind/follow-up returns available templates', async () => {
    const { GET } = await import('@/app/api/mastermind/follow-up/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/follow-up') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'reconnect', channel: 'email', hasSubject: true }),
      ]),
    );
  });
});
