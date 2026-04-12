import { beforeEach, describe, expect, it, vi } from 'vitest';

const importAuraScanMock = vi.fn();
const findLatestScanMock = vi.fn();
const runAIAuraScanWithDeviceMock = vi.fn();
const getSessionFromAirtableMock = vi.fn();
const saveSessionToAirtableMock = vi.fn();
const mockAuraScanResultMock = vi.fn();
const retrievePdfMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('@/lib/mastermind/aura-device-integration', () => ({
  listAvailableScans: vi.fn().mockReturnValue([]),
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

vi.mock('@/lib/mastermind/mock-data', () => ({
  mockAuraScanResult: (...args: unknown[]) => mockAuraScanResultMock(...args),
}));

vi.mock('@/lib/mastermind/pdf-storage', () => ({
  retrievePdf: (...args: unknown[]) => retrievePdfMock(...args),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('mastermind aura import + pdf serve edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.USE_MOCK_AI;

    getSessionFromAirtableMock.mockResolvedValue({
      id: 'ms_1',
      phase: 'consultation',
      intakeData: { firstName: 'Jane', lastName: 'Doe' },
    });
    saveSessionToAirtableMock.mockResolvedValue(undefined);

    importAuraScanMock.mockResolvedValue({
      patientName: 'Jane Doe',
      scanDate: '2026-04-08',
      images: { front: 'data:image/jpeg;base64,front' },
      expressions: {},
    });
    findLatestScanMock.mockResolvedValue({
      patientName: 'Jane Doe',
      scanDate: '2026-04-10',
      images: { front: 'data:image/jpeg;base64,front' },
      expressions: {},
    });

    runAIAuraScanWithDeviceMock.mockResolvedValue({
      auraScore: { overall: 79, grade: 'B' },
      detectedConcerns: [],
    });

    mockAuraScanResultMock.mockReturnValue({
      auraScore: { overall: 61, grade: 'C' },
      detectedConcerns: [],
    });

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
    });
    retrievePdfMock.mockResolvedValue('<html><body>ok</body></html>');
  });

  it('POST /api/mastermind/aura-import uses scanDate path via importAuraScan', async () => {
    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'ms_1',
          patientName: 'Jane Doe',
          scanDate: '2026-04-08',
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(importAuraScanMock).toHaveBeenCalledWith('Jane Doe', '2026-04-08');
    expect(findLatestScanMock).not.toHaveBeenCalled();
  });

  it('POST /api/mastermind/aura-import uses mock scan result when USE_MOCK_AI=true', async () => {
    process.env.USE_MOCK_AI = 'true';

    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'ms_1',
          patientName: 'Jane Doe',
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.source).toBe('mock');
    expect(mockAuraScanResultMock).toHaveBeenCalledTimes(1);
    expect(runAIAuraScanWithDeviceMock).not.toHaveBeenCalled();
  });

  it('POST /api/mastermind/aura-import returns 500 when import throws unexpectedly', async () => {
    findLatestScanMock.mockRejectedValueOnce(new Error('device offline'));

    const { POST } = await import('@/app/api/mastermind/aura-import/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/aura-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'ms_1',
          patientName: 'Jane Doe',
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Aura import failed');
  });

  it('GET /api/mastermind/pdf/serve returns 500 when storage retrieval throws', async () => {
    retrievePdfMock.mockRejectedValueOnce(new Error('disk unavailable'));

    const { GET } = await import('@/app/api/mastermind/pdf/serve/route');
    const response = await GET(
      { nextUrl: new URL('http://localhost:3000/api/mastermind/pdf/serve?file=plan.html') } as never,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to serve PDF');
  });
});
