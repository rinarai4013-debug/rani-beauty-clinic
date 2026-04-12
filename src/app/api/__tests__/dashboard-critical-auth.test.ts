import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionMock = vi.fn();
const hasPermissionMock = vi.fn();
const unauthorizedMock = vi.fn(() =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const apiSuccessMock = vi.fn((data: unknown) => Response.json(data));
const apiErrorMock = vi.fn((message: string) =>
  new Response(JSON.stringify({ error: message }), { status: 500 }),
);
const getAllSessionsAsyncMock = vi.fn();
const fetchAllMock = vi.fn();
const logPhiAccessMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const cacheInvalidateMock = vi.fn();
const cacheInvalidatePrefixMock = vi.fn();
const getAllCampaignsMock = vi.fn();
const createCampaignMock = vi.fn();
const getCampaignTypeDefaultsMock = vi.fn();
const buildAnalyticsMock = vi.fn();
const determineTierMock = vi.fn();
const calculateTierProgressMock = vi.fn();
const getTierBenefitsMock = vi.fn();
const awardBonusMock = vi.fn();
const getAvailableRewardsMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/mastermind/api-helpers', () => ({
  apiSuccess: (...args: unknown[]) => apiSuccessMock(...args),
  apiError: (...args: unknown[]) => apiErrorMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getAllSessionsAsync: (...args: unknown[]) => getAllSessionsAsyncMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => logPhiAccessMock(...args),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
    invalidate: (...args: unknown[]) => cacheInvalidateMock(...args),
    invalidatePrefix: (...args: unknown[]) => cacheInvalidatePrefixMock(...args),
  },
  TTL: {
    STANDARD: 60_000,
    MODERATE: 300_000,
  },
}));

vi.mock('@/lib/communications', () => ({
  getAllCampaigns: (...args: unknown[]) => getAllCampaignsMock(...args),
  createCampaign: (...args: unknown[]) => createCampaignMock(...args),
  getCampaignTypeDefaults: (...args: unknown[]) => getCampaignTypeDefaultsMock(...args),
}));

vi.mock('@/lib/loyalty/engine', () => ({
  buildAnalytics: (...args: unknown[]) => buildAnalyticsMock(...args),
  determineTier: (...args: unknown[]) => determineTierMock(...args),
  calculateTierProgress: (...args: unknown[]) => calculateTierProgressMock(...args),
  getTierBenefits: (...args: unknown[]) => getTierBenefitsMock(...args),
  awardBonus: (...args: unknown[]) => awardBonusMock(...args),
}));

vi.mock('@/lib/loyalty/rewards', () => ({
  getAvailableRewards: (...args: unknown[]) => getAvailableRewardsMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('dashboard critical auth/permission routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });
    getSessionMock.mockResolvedValue({
      username: 'rina',
      role: 'ceo',
      displayName: 'Rina',
    });
    hasPermissionMock.mockReturnValue(true);
    getAllSessionsAsyncMock.mockResolvedValue([]);
    fetchAllMock.mockResolvedValue([]);
    cacheGetMock.mockReturnValue(null);
    getAllCampaignsMock.mockReturnValue([]);
    createCampaignMock.mockReturnValue({
      id: 'cmp_1',
      name: 'Spring Promo',
      type: 'promotional',
    });
    getCampaignTypeDefaultsMock.mockReturnValue({
      defaultChannel: 'email',
      suggestedSubject: 'Special Offer',
      suggestedBody: 'Body',
    });
    buildAnalyticsMock.mockReturnValue({ totalMembers: 5 });
    determineTierMock.mockReturnValue('Gold');
    calculateTierProgressMock.mockReturnValue({ current: 1200, next: 5000 });
    getTierBenefitsMock.mockReturnValue(['priority-booking']);
    awardBonusMock.mockReturnValue({ pointsAwarded: 100, newBalance: 500 });
    getAvailableRewardsMock.mockReturnValue([{ id: 'r_1', name: '$10 Credit' }]);
  });

  it('GET /api/dashboard/consultations returns 401 when staff session is missing', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const request = new Request('http://localhost:3000/api/dashboard/consultations');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/consultations returns normalized payload for authorized staff', async () => {
    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const request = new Request('http://localhost:3000/api/dashboard/consultations');
    const response = await GET(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(logPhiAccessMock).toHaveBeenCalledTimes(1);
  });

  it('GET /api/dashboard/consultations merges mastermind + intake sources', async () => {
    getAllSessionsAsyncMock.mockResolvedValueOnce([
      {
        id: 'ms_1',
        patientName: 'Jane Doe',
        patientEmail: 'jane@example.com',
        phase: 'plan_ready',
        createdAt: '2026-04-10T12:00:00.000Z',
        updatedAt: '2026-04-10T12:00:00.000Z',
        intakeData: {
          phone: '425-555-0100',
          skinConcerns: ['pigmentation'],
          goals: 'Smoother tone',
          timeline: '6 months',
          budget: '$2,000',
        },
        auraScanResult: { auraScore: { overall: 81, grade: 'B' } },
        mastermindPlan: {
          recommendations: { primary: [{ totalEstimate: 1800 }] },
        },
        activityLog: [],
      },
    ]);
    fetchAllMock.mockResolvedValueOnce([
      {
        id: 'rec_intake_1',
        createdTime: '2026-04-10T08:00:00.000Z',
        fields: {
          'Full Name': 'Mary Roe',
          Email: 'mary@example.com',
          'Phone Number': '206-555-0111',
          'Intake Summary (AI)': 'Skin Concerns: dryness\nGoals: brighter skin',
          'Treatment Value (AI)': '$950',
          'Processing Status': 'Processed',
        },
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const request = new Request('http://localhost:3000/api/dashboard/consultations');
    const response = await GET(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((item: { source: string }) => item.source === 'mastermind')).toBe(true);
    expect(body.some((item: { source: string }) => item.source === 'intake_form')).toBe(true);
  });

  it('GET /api/dashboard/consultations degrades gracefully when both source fetches fail', async () => {
    getAllSessionsAsyncMock.mockRejectedValueOnce(new Error('mastermind unavailable'));
    fetchAllMock.mockRejectedValueOnce(new Error('airtable unavailable'));

    const { GET } = await import('@/app/api/dashboard/consultations/route');
    const request = new Request('http://localhost:3000/api/dashboard/consultations');
    const response = await GET(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('GET /api/dashboard/communications/campaigns rejects unauthenticated requests', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/communications/campaigns/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/communications/campaigns enforces permission checks', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { GET } = await import('@/app/api/dashboard/communications/campaigns/route');
    const response = await GET();

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/communications/campaigns returns 500 when campaign fetch fails', async () => {
    getAllCampaignsMock.mockImplementationOnce(() => {
      throw new Error('campaign store unavailable');
    });

    const { GET } = await import('@/app/api/dashboard/communications/campaigns/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch campaigns');
  });

  it('POST /api/dashboard/communications/campaigns enforces permission checks', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { POST } = await import('@/app/api/dashboard/communications/campaigns/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Campaign A',
        type: 'promotional',
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
  });

  it('POST /api/dashboard/communications/campaigns creates campaign for authorized users', async () => {
    const { POST } = await import('@/app/api/dashboard/communications/campaigns/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Campaign A',
        type: 'promotional',
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createCampaignMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/dashboard/communications/campaigns validates request body', async () => {
    const { POST } = await import('@/app/api/dashboard/communications/campaigns/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '',
        type: 'promotional',
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('POST /api/dashboard/communications/campaigns returns 500 when campaign creation fails', async () => {
    createCampaignMock.mockImplementationOnce(() => {
      throw new Error('campaign write failed');
    });

    const { POST } = await import('@/app/api/dashboard/communications/campaigns/route');
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Campaign A',
        type: 'promotional',
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create campaign');
  });

  it('GET /api/dashboard/loyalty rejects unauthenticated requests', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/api/dashboard/loyalty/route');
    const request = new Request('http://localhost:3000/api/dashboard/loyalty?action=analytics');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('POST /api/dashboard/loyalty enforces permission checks', async () => {
    hasPermissionMock.mockReturnValueOnce(false);

    const { POST } = await import('@/app/api/dashboard/loyalty/route');
    const request = new Request('http://localhost:3000/api/dashboard/loyalty', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'award_bonus',
        clientId: 'client-001',
        bonusType: 'birthday',
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
  });

  it('POST /api/dashboard/loyalty awards bonus points for authorized staff', async () => {
    const { POST } = await import('@/app/api/dashboard/loyalty/route');
    const request = new Request('http://localhost:3000/api/dashboard/loyalty', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'award_bonus',
        clientId: 'client-001',
        bonusType: 'birthday',
      }),
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(awardBonusMock).toHaveBeenCalledTimes(1);
  });
});
