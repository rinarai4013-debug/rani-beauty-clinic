import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const readStorageMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/plaid/storage', () => ({
  readStorage: (...args: unknown[]) => readStorageMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('GET /api/dashboard/plaid/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ userId: 'u1', role: 'ceo' });
    hasPermissionMock.mockReturnValue(true);
    readStorageMock.mockResolvedValue({
      transactions: [
        {
          id: 'tx_1',
          date: '2026-04-10',
          name: 'Stripe payout',
          merchantName: 'Stripe',
          reconciliationStatus: 'unmatched',
          raniCategory: 'Revenue',
        },
        {
          id: 'tx_2',
          date: '2026-04-11',
          name: 'Card processing fee',
          merchantName: 'Square',
          reconciliationStatus: 'categorized',
          raniCategory: 'Fees',
        },
        {
          id: 'tx_3',
          date: '2026-04-12',
          name: 'Aesthetic supplies',
          merchantName: 'McKesson',
          reconciliationStatus: 'excluded',
          raniCategory: 'Supplies',
        },
      ],
    });
  });

  function req(url: string): Request {
    return new Request(url, { method: 'GET' });
  }

  it('returns 401 for unauthenticated users', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions') as never);
    expect(response.status).toBe(401);
  });

  it('returns 403 without bank connection permission', async () => {
    hasPermissionMock.mockReturnValueOnce(false);
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions') as never);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid page parameter', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions?page=0') as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid limit parameter', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions?limit=-5') as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid status parameter', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions?status=hacked') as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed startDate', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions?startDate=04-11-2026') as never);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid date range', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(
      req('http://localhost:3000/api/dashboard/plaid/transactions?startDate=2026-04-12&endDate=2026-04-10') as never,
    );
    expect(response.status).toBe(400);
  });

  it('filters and paginates transaction data', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(
      req('http://localhost:3000/api/dashboard/plaid/transactions?status=categorized&limit=1&page=1') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0].id).toBe('tx_2');
    expect(body.hasMore).toBe(false);
  });

  it('caps limit at 200', async () => {
    const { GET } = await import('@/app/api/dashboard/plaid/transactions/route');
    const response = await GET(req('http://localhost:3000/api/dashboard/plaid/transactions?limit=999') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.transactions).toHaveLength(3);
  });
});
