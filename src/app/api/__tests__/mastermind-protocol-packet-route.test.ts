import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks (hoisted) ──

const getSessionFromRequestMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const forbiddenMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
);
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn((s: unknown) => s);
const generateProtocolPacketPdfMock = vi.fn();
const storePdfMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
  forbidden: (...args: unknown[]) => forbiddenMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/pdf-generator', () => ({
  generateProtocolPacketPdf: (...args: unknown[]) => generateProtocolPacketPdfMock(...args),
}));

vi.mock('@/lib/mastermind/pdf-storage', () => ({
  storePdf: (...args: unknown[]) => storePdfMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

// ── Fixtures ──

const CEO_SESSION = { username: 'ceo_user', role: 'ceo', displayName: 'CEO User' };
const PROVIDER_SESSION = { username: 'dr_smith', role: 'provider', displayName: 'Dr. Smith' };
const FRONTDESK_SESSION = { username: 'desk', role: 'frontdesk', displayName: 'Front Desk' };

const COMPLETE_MASTERMIND_SESSION = {
  id: 'sess_packet_001',
  phase: 'plan_ready',
  patientName: 'Jane Doe',
  patientEmail: 'jane@example.com',
  intakeData: { firstName: 'Jane', lastName: 'Doe', primaryConcerns: ['wrinkles'] },
  auraScanResult: { auraScore: { overall: 72, grade: 'B', skinAge: 38 }, medicalFlags: [] },
  mastermindPlan: {
    planId: 'plan_001',
    recommendations: { primary: [], complementary: [], maintenance: [] },
    packages: [],
    contraindications: [],
    aiSummary: { providerFacing: 'Clinical summary here', patientFacing: '', keyHighlights: [], addressedConcerns: [] },
    sequencing: [],
    aftercarePreview: [],
  },
  providerReview: {
    providerId: 'prov_001',
    providerName: 'Dr. Smith',
    modifications: [],
    clinicalNotes: [],
    approvalStatus: 'approved',
  },
  protocolPacket: null,
};

const INCOMPLETE_SESSION_NO_SCAN = {
  ...COMPLETE_MASTERMIND_SESSION,
  auraScanResult: null,
};

const INCOMPLETE_SESSION_NO_PLAN = {
  ...COMPLETE_MASTERMIND_SESSION,
  mastermindPlan: null,
};

const INCOMPLETE_SESSION_NO_INTAKE = {
  ...COMPLETE_MASTERMIND_SESSION,
  intakeData: null,
};

const MOCK_PDF_RESULT = {
  html: '<html><body>Protocol Packet</body></html>',
  filename: 'rani-protocol-packet-jane-doe-2026-04-15.pdf',
  generatedAt: '2026-04-15T12:00:00.000Z',
};

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/mastermind/protocol-packet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Tests ──

describe('POST /api/mastermind/protocol-packet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: reducer returns the session as-is
    sessionReducerMock.mockImplementation((s: unknown) => s);
    saveSessionAsyncMock.mockResolvedValue(undefined);
  });

  // ── Auth ──

  it('returns 401 when unauthenticated (no session)', async () => {
    getSessionFromRequestMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_001' }) as never);
    expect(response.status).toBe(401);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when authenticated with forbidden role (frontdesk)', async () => {
    getSessionFromRequestMock.mockResolvedValue(FRONTDESK_SESSION);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_001' }) as never);
    expect(response.status).toBe(403);
    expect(forbiddenMock).toHaveBeenCalledTimes(1);
  });

  it('allows ceo role through auth gate', async () => {
    getSessionFromRequestMock.mockResolvedValue(CEO_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(COMPLETE_MASTERMIND_SESSION);
    generateProtocolPacketPdfMock.mockReturnValue(MOCK_PDF_RESULT);
    storePdfMock.mockResolvedValue({ url: '/api/mastermind/pdf/serve?file=packet.pdf' });
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    expect(response.status).toBe(200);
  });

  // ── Session lookup ──

  it('returns 404 when session not found', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(null);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'not_found' }) as never);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error).toBe('Session not found');
  });

  // ── Precondition checks (422) ──

  it('returns 422 when auraScanResult is missing', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(INCOMPLETE_SESSION_NO_SCAN);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.missing).toContain('auraScanResult');
  });

  it('returns 422 when mastermindPlan is missing', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(INCOMPLETE_SESSION_NO_PLAN);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.missing).toContain('mastermindPlan');
  });

  it('returns 422 when intakeData is missing', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(INCOMPLETE_SESSION_NO_INTAKE);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.missing).toContain('intakeData');
  });

  // ── Success path ──

  it('success: returns packetUrl, generatedAt, sessionId, providerReviewStatus', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(COMPLETE_MASTERMIND_SESSION);
    generateProtocolPacketPdfMock.mockReturnValue(MOCK_PDF_RESULT);
    storePdfMock.mockResolvedValue({ url: '/api/mastermind/pdf/serve?file=packet.pdf' });

    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.packetUrl).toBe('/api/mastermind/pdf/serve?file=packet.pdf');
    expect(body.generatedAt).toBe('2026-04-15T12:00:00.000Z');
    expect(body.sessionId).toBe('sess_packet_001');
    expect(body.providerReviewStatus).toBe('approved');
  });

  it('success: calls saveSessionAsync with updated packet metadata (persistence)', async () => {
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(COMPLETE_MASTERMIND_SESSION);
    generateProtocolPacketPdfMock.mockReturnValue(MOCK_PDF_RESULT);
    storePdfMock.mockResolvedValue({ url: '/api/mastermind/pdf/serve?file=packet.pdf' });

    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);

    expect(sessionReducerMock).toHaveBeenCalledWith(
      COMPLETE_MASTERMIND_SESSION,
      expect.objectContaining({
        type: 'SET_PROTOCOL_PACKET',
        packetUrl: '/api/mastermind/pdf/serve?file=packet.pdf',
        generatedAt: '2026-04-15T12:00:00.000Z',
        generatorActor: 'Dr. Smith',
        packetVersion: 1,
      }),
    );
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('success: providerReviewStatus is null when no provider review exists', async () => {
    const sessionNoReview = { ...COMPLETE_MASTERMIND_SESSION, providerReview: null };
    getSessionFromRequestMock.mockResolvedValue(PROVIDER_SESSION);
    getSessionByIdAsyncMock.mockResolvedValue(sessionNoReview);
    generateProtocolPacketPdfMock.mockReturnValue(MOCK_PDF_RESULT);
    storePdfMock.mockResolvedValue({ url: '/api/mastermind/pdf/serve?file=packet.pdf' });

    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(makeRequest({ sessionId: 'sess_packet_001' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.providerReviewStatus).toBeNull();
  });
});
