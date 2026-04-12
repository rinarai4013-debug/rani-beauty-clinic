import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPatientSessionMock = vi.fn();
const getSessionMock = vi.fn();
const clientsFindMock = vi.fn();
const transactionsFindMock = vi.fn();
const rateLimitedQueryMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const consultGeneratorMock = vi.fn();

vi.mock('@/lib/patient-auth/session', () => ({
  getPatientSession: (...args: unknown[]) => getPatientSessionMock(...args),
  generateReferralCode: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({
      find: (...args: unknown[]) => clientsFindMock(...args),
    })),
    transactions: vi.fn(() => ({
      find: (...args: unknown[]) => transactionsFindMock(...args),
    })),
  },
  rateLimitedQuery: (...args: unknown[]) => rateLimitedQueryMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    clients: {
      transactions: 'Transactions',
    },
    transactions: {
      status: 'Status',
      amount: 'Amount',
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
  },
  TTL: {
    STANDARD: 60_000,
  },
}));

vi.mock('@/lib/consult/copilot-engine', () => ({
  generateConsultBriefing: (...args: unknown[]) => consultGeneratorMock(...args),
  generateConsultCopilot: (...args: unknown[]) => consultGeneratorMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('patient referrals, loyalty, and consult routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getPatientSessionMock.mockResolvedValue({
      patientId: 'rec_client_1',
      email: 'patient@example.com',
      name: 'Jane Doe',
    });

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });

    clientsFindMock.mockResolvedValue({
      id: 'rec_client_1',
      fields: {
        Transactions: ['txn_1', 'txn_2', 'txn_3'],
      },
    });

    transactionsFindMock.mockImplementation(async (id: string) => {
      const records: Record<string, { id: string; fields: Record<string, unknown> }> = {
        txn_1: {
          id: 'txn_1',
          fields: {
            Status: 'Paid',
            Amount: 1200,
          },
        },
        txn_2: {
          id: 'txn_2',
          fields: {
            Status: 'Completed',
            Amount: 900,
          },
        },
        txn_3: {
          id: 'txn_3',
          fields: {
            Status: 'Pending',
            Amount: 500,
          },
        },
      };
      return records[id];
    });

    rateLimitedQueryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    cacheGetMock.mockReturnValue(null);
    consultGeneratorMock.mockReturnValue({
      summary: 'Consult brief',
      recommendations: ['HydraFacial'],
    });
  });

  it('GET /api/patient/referrals returns 401 when unauthenticated', async () => {
    getPatientSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/patient/referrals/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/patient/referrals returns deterministic referral payload for patient session', async () => {
    const { GET } = await import('@/app/api/patient/referrals/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.referral.code).toMatch(/^RANI-[A-Z0-9]{4}$/);
    expect(body.referral.link).toContain(`ref=${body.referral.code}`);
  });

  it('GET /api/patient/loyalty returns 401 when unauthenticated', async () => {
    getPatientSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/patient/loyalty/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/patient/loyalty calculates points and tier from paid/completed transactions', async () => {
    const { GET } = await import('@/app/api/patient/loyalty/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.loyalty.totalSpend).toBe(2100);
    expect(body.loyalty.points).toBe(2100);
    expect(body.loyalty.tier).toBe('Gold');
  });

  it('GET /api/dashboard/consult returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/consult/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/consult returns cached payload when available', async () => {
    cacheGetMock.mockReturnValueOnce({ status: 'ok', consult: { summary: 'Cached' } });

    const { GET } = await import('@/app/api/dashboard/consult/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.consult.summary).toBe('Cached');
    expect(consultGeneratorMock).not.toHaveBeenCalled();
  });

  it('POST /api/dashboard/consult returns 400 for malformed JSON', async () => {
    const { POST } = await import('@/app/api/dashboard/consult/route');
    const request = new Request('http://localhost:3000/api/dashboard/consult', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST /api/dashboard/consult returns 422 for invalid schema', async () => {
    const { POST } = await import('@/app/api/dashboard/consult/route');
    const request = new Request('http://localhost:3000/api/dashboard/consult', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        consultType: 'new_client',
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(422);
  });

  it('POST /api/dashboard/consult returns briefing for valid input', async () => {
    const { POST } = await import('@/app/api/dashboard/consult/route');
    const request = new Request('http://localhost:3000/api/dashboard/consult', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client: {
          name: 'Jane Doe',
          previousServices: [],
          totalSpend: 1200,
          visitCount: 4,
          membershipStatus: 'active',
        },
        concerns: ['texture'],
        consultType: 'follow_up',
        timeAvailable: 30,
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.briefing.summary).toBe('Consult brief');
    expect(consultGeneratorMock).toHaveBeenCalledTimes(1);
  });
});
