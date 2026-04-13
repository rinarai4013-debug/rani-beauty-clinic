/**
 * Integration tests for GET /api/dashboard/consultations
 * Unified consultation pipeline merging Mastermind sessions + Airtable intakes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getAllSessionsAsyncMock = vi.fn();
const fetchAllMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const logPhiAccessMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getAllSessionsAsync: (...args: unknown[]) => getAllSessionsAsyncMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: { intakes: vi.fn(() => ({})) },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => logPhiAccessMock(...args),
}));

vi.mock('@/lib/mastermind/api-helpers', () => ({
  apiSuccess: vi.fn((data: unknown) =>
    new Response(JSON.stringify({ success: true, data }), { status: 200 }),
  ),
  apiError: vi.fn((msg: string) =>
    new Response(JSON.stringify({ success: false, error: msg }), { status: 500 }),
  ),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

function staffSession() {
  return { username: 'rina', role: 'ceo', name: 'Rina' };
}

function makeMastermindSession(overrides = {}) {
  return {
    id: 'ms_001',
    phase: 'plan_ready',
    patientName: 'Jane Doe',
    patientEmail: 'jane@example.com',
    intakeData: { skinConcerns: ['fine lines'], email: 'jane@example.com', phone: '425-555-0100' },
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-05T14:00:00Z',
    clinicStatus: 'new',
    activityLog: [],
    mastermindPlan: null,
    auraScanResult: null,
    shareToken: null,
    selectedPackageTier: null,
    bookedAppointmentId: null,
    providerReview: null,
    clinicNotes: '',
    ...overrides,
  };
}

describe('GET /api/dashboard/consultations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue(staffSession());
    getAllSessionsAsyncMock.mockResolvedValue([]);
    fetchAllMock.mockResolvedValue([]);
  });

  it('returns 401 when staff session is missing', async () => {
    getSessionFromRequestMock.mockRejectedValueOnce(new Error('no session'));
    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    expect(response.status).toBe(401);
  });

  it('returns unified consultation list merging both sources', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([makeMastermindSession()]);
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'rec_intake_1',
        fields: { 'Full Name': 'John Smith', Email: 'john@example.com', 'Processing Status': 'New' },
        createdTime: '2026-04-02T12:00:00Z',
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    // Sorted newest first
    expect(body.data[0].source).toBe('intake_form');
    expect(body.data[1].source).toBe('mastermind');
  });

  it('deduplicates intakes already linked to mastermind sessions', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([makeMastermindSession({ id: 'ms_001' })]);
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'rec_intake_dup',
        fields: {
          'Full Name': 'Jane Doe',
          'Intake Summary (AI)': 'Session ID: ms_001',
          'Processing Status': 'Processed',
        },
        createdTime: '2026-04-01T10:00:00Z',
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    const body = await response.json();

    // Duplicate intake should be filtered out
    expect(body.data).toHaveLength(1);
    expect(body.data[0].source).toBe('mastermind');
  });

  it('logs PHI access with aggregate counts', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([makeMastermindSession()]);
    fetchAllMock.mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);

    expect(logPhiAccessMock).toHaveBeenCalledTimes(1);
    const logArgs = logPhiAccessMock.mock.calls[0] as unknown[];
    const logData = logArgs[2] as Record<string, unknown>;
    expect(logData.patientId).toBe('__LIST__');
    expect(logData.dataCategory).toBe('treatment_records');
  });

  it('degrades gracefully when mastermind fetch fails', async () => {
    getAllSessionsAsyncMock.mockRejectedValueOnce(new Error('mastermind down'));
    fetchAllMock.mockResolvedValueOnce([
      { id: 'rec1', fields: { 'Full Name': 'Solo Intake' }, createdTime: '2026-04-01T10:00:00Z' },
    ]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('degrades gracefully when Airtable fetch fails', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([makeMastermindSession()]);
    fetchAllMock.mockRejectedValueOnce(new Error('airtable down'));

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('enriches consultation status from automation signals', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([]);
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'rec_responded',
        fields: { 'Full Name': 'Automated Follow-Up', 'Processing Status': 'Responded' },
        createdTime: '2026-04-01T10:00:00Z',
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/consultations') as never);
    const body = await response.json();

    expect(body.data[0].clinicStatus).toBe('contacted');
    expect(body.data[0].commStatus).toBe('sent');
  });
});
