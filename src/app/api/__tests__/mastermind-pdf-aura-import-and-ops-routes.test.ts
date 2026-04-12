import { beforeEach, describe, expect, it, vi } from 'vitest';

const listAvailableScansMock = vi.fn();
const importAuraScanMock = vi.fn();
const findLatestScanMock = vi.fn();
const runAIAuraScanWithDeviceMock = vi.fn();
const getSessionFromAirtableMock = vi.fn();
const saveSessionToAirtableMock = vi.fn();

const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const generateConsultationPdfMock = vi.fn();
const storePdfMock = vi.fn();
const retrievePdfMock = vi.fn();

const getSessionMock = vi.fn();
const fetchProviderIntelligenceMock = vi.fn();
const readStorageMock = vi.fn();
const hasPermissionMock = vi.fn();

vi.mock('@/lib/mastermind/aura-device-integration', () => ({
  listAvailableScans: (...args: unknown[]) => listAvailableScansMock(...args),
  importAuraScan: (...args: unknown[]) => importAuraScanMock(...args),
  findLatestScan: (...args: unknown[]) => findLatestScanMock(...args),
}));

vi.mock('@/lib/mastermind/ai-aura-scan-with-device', () => ({
  runAIAuraScanWithDevice: (...args: unknown[]) => runAIAuraScanWithDeviceMock(...args),
}));

vi.mock('@/lib/mastermind/session-store', () => ({
  getSessionFromAirtable: (...args: unknown[]) => getSessionFromAirtableMock(...args),
  saveSessionToAirtable: (...args: unknown[]) => saveSessionToAirtableMock(...args),
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
  retrievePdf: (...args: unknown[]) => retrievePdfMock(...args),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/briefing/provider-intelligence', () => ({
  fetchProviderIntelligence: (...args: unknown[]) => fetchProviderIntelligenceMock(...args),
}));

vi.mock('@/lib/plaid/storage', () => ({
  readStorage: (...args: unknown[]) => readStorageMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('mastermind aura/pdf + ops routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.USE_MOCK_AI;

    listAvailableScansMock.mockReturnValue([
      { name: 'Jane Doe', date: '2026-04-10', imageCount: 7 },
      { name: 'Sophie Lee', date: '2026-04-09', imageCount: 6 },
    ]);

    getSessionFromAirtableMock.mockResolvedValue({
      id: 'ms_1',
      phase: 'consultation',
      intakeData: { firstName: 'Jane', lastName: 'Doe' },
    });
    saveSessionToAirtableMock.mockResolvedValue(undefined);

    findLatestScanMock.mockResolvedValue({
      patientName: 'Jane Doe',
      scanDate: '2026-04-10',
      images: {
        front: 'data:image/jpeg;base64,front',
        left45: 'data:image/jpeg;base64,left45',
        right45: 'data:image/jpeg;base64,right45',
      },
      expressions: { smile: 'data:image/jpeg;base64,smile' },
      handoutPdfPath: '/tmp/jane-handout.pdf',
    });

    runAIAuraScanWithDeviceMock.mockResolvedValue({
      auraScore: { overall: 82, grade: 'B+' },
      detectedConcerns: [],
    });

    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_1',
      auraScanResult: { auraScore: { overall: 82 } },
      mastermindPlan: { recommendations: { primary: [] } },
    });
    sessionReducerMock.mockImplementation((session: unknown) => session);
    saveSessionAsyncMock.mockResolvedValue(undefined);

    generateConsultationPdfMock.mockReturnValue({
      html: '<html><body>Plan</body></html>',
      filename: 'mastermind-plan-ms_1.html',
      generatedAt: '2026-04-11T00:00:00.000Z',
    });
    storePdfMock.mockResolvedValue({
      url: '/api/mastermind/pdf/serve?file=mastermind-plan-ms_1.html',
      filename: 'mastermind-plan-ms_1.html',
    });
    retrievePdfMock.mockResolvedValue('<html><body>Stored Plan</body></html>');

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
    });
    fetchProviderIntelligenceMock.mockResolvedValue([
      { provider: 'Rina', utilization: 0.82 },
    ]);

    hasPermissionMock.mockReturnValue(true);
    readStorageMock.mockResolvedValue({
      transactions: [
        {
          id: 'tx_1',
          name: 'Cherry Payment',
          merchantName: 'Cherry',
          date: '2026-04-10',
          reconciliationStatus: 'unmatched',
          raniCategory: 'financing',
        },
        {
          id: 'tx_2',
          name: 'Stripe Deposit',
          merchantName: 'Stripe',
          date: '2026-04-09',
          reconciliationStatus: 'categorized',
          raniCategory: 'revenue',
        },
      ],
    });
  });

  it('GET /api/mastermind/aura-import returns available scans', async () => {
    const { GET } = await import('@/app/api/mastermind/aura-import/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.count).toBe(2);
  });

  it('POST /api/mastermind/aura-import requires sessionId', async () => {
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ patientName: 'Jane Doe' }),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/aura-import requires patientName', async () => {
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1' }),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/aura-import returns 404 when session is missing', async () => {
    getSessionFromAirtableMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'missing', patientName: 'Jane Doe' }),
      }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/aura-import returns 404 when scan is not found', async () => {
    findLatestScanMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1', patientName: 'Jane Doe' }),
      }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/aura-import imports scan and stores analysis', async () => {
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1', patientName: 'Jane Doe' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.source).toBe('aura-device-ai');
    expect(saveSessionToAirtableMock).toHaveBeenCalledTimes(2);
    expect(runAIAuraScanWithDeviceMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/pdf rejects invalid body', async () => {
    const { POST } = await import('@/app/api/mastermind/pdf/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/pdf returns 404 for unknown session', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/pdf/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'missing' }),
      }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/pdf blocks sessions missing scan/plan readiness', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: null,
      mastermindPlan: null,
    });
    const { POST } = await import('@/app/api/mastermind/pdf/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1' }),
      }) as never,
    );

    expect(response.status).toBe(400);
  });

  it('POST /api/mastermind/pdf stores generated PDF URL and persists session', async () => {
    const { POST } = await import('@/app/api/mastermind/pdf/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pdfUrl).toContain('/api/mastermind/pdf/serve?file=');
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/mastermind/pdf falls back to data URL when storage fails', async () => {
    storePdfMock.mockRejectedValueOnce(new Error('storage unavailable'));
    const { POST } = await import('@/app/api/mastermind/pdf/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'ms_1' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pdfUrl.startsWith('data:text/html')).toBe(true);
  });

  it('GET /api/mastermind/pdf/serve returns 401 when no session exists', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/mastermind/pdf/serve/route');
    const response = await GET(
      { nextUrl: new URL('http://localhost:3000/api/mastermind/pdf/serve?file=plan.html') } as never,
    );

    expect(response.status).toBe(401);
  });

  it('GET /api/mastermind/pdf/serve requires file query parameter', async () => {
    const { GET } = await import('@/app/api/mastermind/pdf/serve/route');
    const response = await GET(
      { nextUrl: new URL('http://localhost:3000/api/mastermind/pdf/serve') } as never,
    );

    expect(response.status).toBe(400);
  });

  it('GET /api/mastermind/pdf/serve returns 404 when stored file is missing', async () => {
    retrievePdfMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/mastermind/pdf/serve/route');
    const response = await GET(
      { nextUrl: new URL('http://localhost:3000/api/mastermind/pdf/serve?file=missing.html') } as never,
    );

    expect(response.status).toBe(404);
  });

  it('GET /api/mastermind/pdf/serve streams stored HTML with inline disposition', async () => {
    const { GET } = await import('@/app/api/mastermind/pdf/serve/route');
    const response = await GET(
      { nextUrl: new URL('http://localhost:3000/api/mastermind/pdf/serve?file=plan.html') } as never,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('Content-Disposition')).toContain('inline; filename="plan.html"');
  });

  it('GET /api/dashboard/providers/performance returns 401 for unauthenticated users', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/providers/performance/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/providers/performance returns provider intelligence data', async () => {
    const { GET } = await import('@/app/api/dashboard/providers/performance/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.providers).toHaveLength(1);
  });

  it('GET /api/dashboard/plaid/transactions returns 401 for unauthenticated users', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/plaid/transactions') as never,
    );

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/plaid/transactions returns 403 when role lacks permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(
      new Request('http://localhost:3000/api/dashboard/plaid/transactions') as never,
    );

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/plaid/transactions applies status/search filters and pagination', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(
      new Request(
        'http://localhost:3000/api/dashboard/plaid/transactions?status=unmatched&search=cherry&page=1&limit=1',
      ) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.hasMore).toBe(false);
    expect(body.transactions[0].merchantName).toBe('Cherry');
  });
});
