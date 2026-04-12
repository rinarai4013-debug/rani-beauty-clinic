import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const treatmentPlansFindMock = vi.fn();
const fetchAllMock = vi.fn();
const createRecordMock = vi.fn();
const updateRecordMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const cacheInvalidatePrefixMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    treatmentPlans: vi.fn(() => ({
      find: (...args: unknown[]) => treatmentPlansFindMock(...args),
    })),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  createRecord: (...args: unknown[]) => createRecordMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      status: 'Status',
      createdDate: 'Created Date',
      clientName: 'Client Name',
      planTier: 'Plan Tier',
      planValue: 'Plan Value',
      servicesIncluded: 'Services Included',
      client: 'Client',
      intakeRecordId: 'Intake Record ID',
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
    invalidatePrefix: (...args: unknown[]) => cacheInvalidatePrefixMock(...args),
  },
  TTL: {
    STANDARD: 60_000,
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('dashboard plan-builder route CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });
    cacheGetMock.mockReturnValue(null);
    treatmentPlansFindMock.mockResolvedValue({
      id: 'rec_plan_1',
      fields: {
        'Client Name': 'Jane Doe',
        'Plan Tier': 'Transform',
      },
    });
    fetchAllMock.mockResolvedValue([
      {
        id: 'rec_plan_1',
        fields: {
          'Client Name': 'Jane Doe',
          Status: 'Draft',
        },
      },
    ]);
    createRecordMock.mockResolvedValue('rec_created_plan');
    updateRecordMock.mockResolvedValue(undefined);
  });

  it('GET returns 401 when staff session is missing', async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/dashboard/plan-builder/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/plan-builder') as never);

    expect(response.status).toBe(401);
  });

  it('GET list returns cached response when available', async () => {
    cacheGetMock.mockReturnValueOnce([{ id: 'cached_plan' }]);
    const { GET } = await import('@/app/api/dashboard/plan-builder/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/plan-builder') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe('cached_plan');
  });

  it('GET with id loads single treatment plan', async () => {
    const { GET } = await import('@/app/api/dashboard/plan-builder/route');
    const response = await GET(new Request('http://localhost:3000/api/dashboard/plan-builder?id=rec_plan_1') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('rec_plan_1');
    expect(treatmentPlansFindMock).toHaveBeenCalledTimes(1);
  });

  it('POST rejects malformed json with 400', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad-json',
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('POST creates draft plan for valid payload', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Jane Doe',
        planName: 'Spring Plan',
        planTier: 'Transform',
        planValue: 2500,
        servicesIncluded: JSON.stringify({ phases: [], packages: [] }),
      }),
    });
    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe('rec_created_plan');
    expect(createRecordMock).toHaveBeenCalledTimes(1);
    const [, fields] = createRecordMock.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(fields.Status).toBe('Draft');
  });

  it('PATCH updates plan fields for valid request', async () => {
    const { PATCH } = await import('@/app/api/dashboard/plan-builder/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'rec_plan_1',
        status: 'Sent',
        planValue: 2700,
      }),
    });
    const response = await PATCH(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateRecordMock).toHaveBeenCalledTimes(1);
  });

  it('DELETE requires plan id', async () => {
    const { DELETE } = await import('@/app/api/dashboard/plan-builder/route');
    const response = await DELETE(new Request('http://localhost:3000/api/dashboard/plan-builder') as never);

    expect(response.status).toBe(400);
  });

  it('DELETE archives plan by setting status to Archived', async () => {
    const { DELETE } = await import('@/app/api/dashboard/plan-builder/route');
    const response = await DELETE(new Request('http://localhost:3000/api/dashboard/plan-builder?id=rec_plan_1') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateRecordMock).toHaveBeenCalledWith(expect.anything(), 'rec_plan_1', {
      Status: 'Archived',
    });
  });
});
