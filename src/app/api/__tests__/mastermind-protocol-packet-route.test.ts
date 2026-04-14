import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn((state: unknown, action: { type?: string; url?: string; notes?: string }) => {
  const current = state as Record<string, unknown>;
  if (action?.type === 'SET_PDF_URL') {
    return { ...current, pdfUrl: action.url };
  }
  if (action?.type === 'SET_CLINIC_NOTES') {
    return { ...current, clinicNotes: action.notes };
  }
  return state;
});
const generateConsultationPdfMock = vi.fn();
const storePdfMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/pdf-generator', () => ({
  generateConsultationPdf: (...args: unknown[]) => generateConsultationPdfMock(...args),
}));

vi.mock('@/lib/mastermind/pdf-storage', () => ({
  storePdf: (...args: unknown[]) => storePdfMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }),
  forbidden: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    }),
}));

function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_SESSION = {
  id: 'ms_1',
  auraScanResult: { auraScore: { overall: 85 } },
  mastermindPlan: { packages: [] },
  providerReview: { approvalStatus: 'pending' },
  clinicNotes: '',
};

describe('POST /api/mastermind/protocol-packet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ role: 'ceo', name: 'Rina', username: 'rina' });
    getSessionByIdAsyncMock.mockResolvedValue(VALID_SESSION);
    saveSessionAsyncMock.mockResolvedValue(undefined);
    generateConsultationPdfMock.mockReturnValue({
      html: '<html><body>Protocol Packet</body></html>',
      filename: 'protocol-ms_1.html',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
    storePdfMock.mockResolvedValue({
      url: '/api/mastermind/pdf/serve?file=protocol-ms_1.html',
      filename: 'protocol-ms_1.html',
    });
  });

  it('returns 401 when session is missing', async () => {
    getSessionFromRequestMock.mockRejectedValueOnce(new Error('no session'));
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'ms_1' }) as never);
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-provider/non-ceo roles', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce({ role: 'marketing' });
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'ms_1' }) as never);
    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid payload', async () => {
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', {}) as never);
    expect(response.status).toBe(422);
  });

  it('returns 404 when session does not exist', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'missing' }) as never);
    expect(response.status).toBe(404);
  });

  it('returns 400 when session is not ready for packet export', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: null,
      mastermindPlan: null,
    });
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'ms_1' }) as never);
    expect(response.status).toBe(400);
  });

  it('exports packet, stores URL, and logs clinic notes', async () => {
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'ms_1' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pdfUrl).toContain('/api/mastermind/pdf/serve?file=protocol-ms_1.html');
    expect(body.data.providerReviewStatus).toBe('pending');
    expect(sessionReducerMock).toHaveBeenCalledTimes(2);
    expect(sessionReducerMock.mock.calls[0][1]).toMatchObject({ type: 'SET_PDF_URL' });
    expect(sessionReducerMock.mock.calls[1][1]).toMatchObject({ type: 'SET_CLINIC_NOTES' });
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to inline packet URL when storage fails', async () => {
    storePdfMock.mockRejectedValueOnce(new Error('storage unavailable'));
    const { POST } = await import('@/app/api/mastermind/protocol-packet/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/protocol-packet', { sessionId: 'ms_1' }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pdfUrl.startsWith('data:text/html')).toBe(true);
  });
});
