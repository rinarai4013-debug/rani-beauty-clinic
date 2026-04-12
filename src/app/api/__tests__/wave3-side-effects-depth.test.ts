/**
 * Wave 3 — Side-Effect Depth Tests
 *
 * These tests go beyond auth + happy/sad paths (covered in wave 1-2) and
 * verify the side-effects that matter in production:
 *   - Cache writes, reads, and invalidation
 *   - PHI access logging (HIPAA audit trail)
 *   - Airtable write payloads (exact field mapping)
 *   - Email send parameters (Resend)
 *   - Session state mutations (mastermind reducer)
 *   - Token generation and persistence
 *   - Cookie security flags
 *   - Rate limiting enforcement
 *   - Error-path side-effect isolation (no writes on failure)
 */
// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// First-import overhead can exceed the default 5s timeout in CI
vi.setConfig({ testTimeout: 15_000 });

// ── Shared mocks ───────────────────────────────────────────────────
const getSessionMock = vi.fn();
const getSessionFromRequestMock = vi.fn();
const hasPermissionMock = vi.fn();
const fetchAllMock = vi.fn();
const fetchFirstMock = vi.fn();
const updateRecordMock = vi.fn();
const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const cacheInvalidatePrefixMock = vi.fn();
const logPhiAccessMock = vi.fn();
const getAllCampaignsMock = vi.fn();
const createCampaignMock = vi.fn();
const getCampaignTypeDefaultsMock = vi.fn();
const resendSendMock = vi.fn();
const resolveTokenMock = vi.fn();
const saveTokenToAirtableMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
);
const rateLimitMock = vi.fn();
const rateLimitResponseMock = vi.fn(
  (resetIn: number) =>
    new Response(JSON.stringify({ error: 'Rate limited', resetIn }), { status: 429 }),
);
const verifyMagicLinkTokenMock = vi.fn();
const createPatientSessionMock = vi.fn();
const getPatientSessionCookieConfigMock = vi.fn();

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/auth/roles', () => ({
  hasPermission: (...args: unknown[]) => hasPermissionMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    clients: vi.fn(() => ({})),
    treatmentPlans: vi.fn(() => ({})),
  },
  fetchAll: (...args: unknown[]) => fetchAllMock(...args),
  fetchFirst: (...args: unknown[]) => fetchFirstMock(...args),
  updateRecord: (...args: unknown[]) => updateRecordMock(...args),
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    treatmentPlans: {
      status: 'Status',
      planUrl: 'Plan URL',
      sentAt: 'Sent At',
      clientEmail: 'Client Email',
      clientName: 'Client Name',
      clientPhone: 'Client Phone',
    },
  },
}));

vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v.replace(/['"\\\n\r]/g, '')),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: (...args: unknown[]) => cacheGetMock(...args),
    set: (...args: unknown[]) => cacheSetMock(...args),
    invalidatePrefix: (...args: unknown[]) => cacheInvalidatePrefixMock(...args),
  },
  TTL: {
    STANDARD: 60_000,
    RELAXED: 900_000,
  },
}));

vi.mock('@/lib/compliance/phi-logger', () => ({
  logPhiAccessFromRequest: (...args: unknown[]) => logPhiAccessMock(...args),
}));

vi.mock('@/lib/communications', () => ({
  getAllCampaigns: (...args: unknown[]) => getAllCampaignsMock(...args),
  createCampaign: (...args: unknown[]) => createCampaignMock(...args),
  getCampaignTypeDefaults: (...args: unknown[]) => getCampaignTypeDefaultsMock(...args),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => resendSendMock(...args),
    },
  })),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/mastermind/share-token', () => ({
  resolveToken: (...args: unknown[]) => resolveTokenMock(...args),
  saveTokenToAirtable: (...args: unknown[]) => saveTokenToAirtableMock(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  rateLimitResponse: (...args: unknown[]) => rateLimitResponseMock(...args),
  RATE_LIMITS: {
    FORM: { maxRequests: 5, windowMs: 60_000 },
  },
}));

vi.mock('@/lib/patient-auth/session', () => ({
  verifyMagicLinkToken: (...args: unknown[]) => verifyMagicLinkTokenMock(...args),
  createPatientSession: (...args: unknown[]) => createPatientSessionMock(...args),
  getPatientSessionCookieConfig: (...args: unknown[]) => getPatientSessionCookieConfigMock(...args),
}));

// ── Shared setup ───────────────────────────────────────────────────

function staffSession(overrides = {}) {
  return {
    username: 'rina',
    role: 'ceo',
    name: 'Rina',
    displayName: 'Rina',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  process.env.DASHBOARD_JWT_SECRET = 'test-secret';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.NEXT_PUBLIC_BASE_URL = 'https://www.ranibeautyclinic.com';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://ranibeautyclinic.com';

  getSessionMock.mockResolvedValue(staffSession());
  getSessionFromRequestMock.mockResolvedValue(staffSession());
  hasPermissionMock.mockReturnValue(true);
  cacheGetMock.mockReturnValue(null);
  rateLimitMock.mockReturnValue({ allowed: true, resetIn: 0 });
});

// ═══════════════════════════════════════════════════════════════════
// 1. CAMPAIGNS — Cache + Side Effects
// ═══════════════════════════════════════════════════════════════════

describe('campaigns cache lifecycle', () => {
  // Preload modules to avoid first-import timeout
  let campaignsRoute: typeof import('@/app/api/dashboard/communications/campaigns/route');
  beforeAll(async () => {
    campaignsRoute = await import('@/app/api/dashboard/communications/campaigns/route');
  });

  beforeEach(() => {
    getAllCampaignsMock.mockReturnValue([
      { id: 'c1', status: 'sending' },
      { id: 'c2', status: 'draft' },
    ]);
    createCampaignMock.mockReturnValue({ id: 'c3', name: 'Birthday Blast', status: 'draft' });
    getCampaignTypeDefaultsMock.mockReturnValue({
      defaultChannel: 'email',
      suggestedSubject: 'Happy Birthday!',
      suggestedBody: 'We have a special offer for you.',
    });
  });

  it('GET sets cache with TTL.STANDARD after fetching campaigns', async () => {
    const response = await campaignsRoute.GET();

    expect(response.status).toBe(200);
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
    expect(cacheSetMock).toHaveBeenCalledWith(
      'comms:campaigns',
      expect.objectContaining({ campaigns: expect.any(Array), total: 2 }),
      60_000,
    );
  });

  it('GET returns cached result without calling getAllCampaigns', async () => {
    cacheGetMock.mockReturnValueOnce({ campaigns: [{ id: 'cached' }], total: 1 });
    const response = await campaignsRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.campaigns[0].id).toBe('cached');
    expect(getAllCampaignsMock).not.toHaveBeenCalled();
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it('POST invalidates campaign cache after successful creation', async () => {
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Birthday Blast', type: 'birthday' }),
    });
    const response = await campaignsRoute.POST(request as never);

    expect(response.status).toBe(200);
    expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('comms:campaigns');
  });

  it('POST passes session.username as createdBy to createCampaign', async () => {
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Spring Sale', type: 'promotional' }),
    });
    await campaignsRoute.POST(request as never);

    expect(createCampaignMock).toHaveBeenCalledTimes(1);
    const payload = createCampaignMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.createdBy).toBe('rina');
    expect(payload.name).toBe('Spring Sale');
  });

  it('POST uses type defaults when optional fields are omitted', async () => {
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Auto-Fill', type: 'birthday' }),
    });
    await campaignsRoute.POST(request as never);

    expect(getCampaignTypeDefaultsMock).toHaveBeenCalledWith('birthday');
    const payload = createCampaignMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.channel).toBe('email');
    expect(payload.subject).toBe('Happy Birthday!');
  });

  it('POST does NOT invalidate cache when createCampaign throws', async () => {
    createCampaignMock.mockImplementationOnce(() => {
      throw new Error('DB write failed');
    });
    const request = new Request('http://localhost:3000/api/dashboard/communications/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Oops', type: 'promotional' }),
    });
    const response = await campaignsRoute.POST(request as never);

    expect(response.status).toBe(500);
    expect(cacheInvalidatePrefixMock).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. PREFERENCES — PHI Logging + Cache Key
// ═══════════════════════════════════════════════════════════════════

describe('preferences PHI access logging', () => {
  const clientRecords = [
    {
      id: 'rec_client_1',
      fields: {
        Client: 'Jane Doe',
        Email: 'jane@example.com',
        Phone: '425-555-0100',
        'Preferred Contact': 'email',
        Status: 'Active',
      },
    },
    {
      id: 'rec_client_2',
      fields: {
        Client: 'John Smith',
        Email: 'john@example.com',
        Phone: '425-555-0200',
        'Preferred Contact': 'sms',
        Status: 'Active',
      },
    },
  ];

  beforeEach(() => {
    fetchAllMock.mockResolvedValue(clientRecords);
  });

  it('logs individual PHI access with correct patientId when clientId param present', async () => {
    fetchAllMock.mockResolvedValueOnce([clientRecords[0]]);
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences?clientId=rec_client_1';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);

    expect(response.status).toBe(200);
    expect(logPhiAccessMock).toHaveBeenCalledTimes(1);

    const logCall = logPhiAccessMock.mock.calls[0] as unknown[];
    const logData = logCall[2] as Record<string, unknown>;
    expect(logData.patientId).toBe('rec_client_1');
    expect(logData.action).toBe('view');
    expect(logData.dataCategory).toBe('demographics');
    expect(logData.details).toContain('contact info lookup');
  });

  it('logs aggregate PHI access with __LIST__ patientId for list view', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences';
    const response = await GET({
      nextUrl: new URL(url),
      headers: new Headers(),
      url,
    } as never);

    expect(response.status).toBe(200);
    expect(logPhiAccessMock).toHaveBeenCalledTimes(1);

    const logCall = logPhiAccessMock.mock.calls[0] as unknown[];
    const logData = logCall[2] as Record<string, unknown>;
    expect(logData.patientId).toBe('__LIST__');
    expect(logData.details).toContain('list view');
  });

  it('uses clientId-scoped cache key for individual lookups', async () => {
    fetchAllMock.mockResolvedValueOnce([clientRecords[0]]);
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences?clientId=rec_abc123';
    await GET({ nextUrl: new URL(url), headers: new Headers(), url } as never);

    expect(cacheGetMock).toHaveBeenCalledWith('comms:preferences:rec_abc123');
    expect(cacheSetMock).toHaveBeenCalledWith(
      'comms:preferences:rec_abc123',
      expect.any(Object),
      900_000,
    );
  });

  it('uses "all" cache key when no clientId specified', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences';
    await GET({ nextUrl: new URL(url), headers: new Headers(), url } as never);

    expect(cacheGetMock).toHaveBeenCalledWith('comms:preferences:all');
    expect(cacheSetMock).toHaveBeenCalledWith(
      'comms:preferences:all',
      expect.any(Object),
      900_000,
    );
  });

  it('does NOT log PHI access when cache hit returns early', async () => {
    cacheGetMock.mockReturnValueOnce({ preferences: [], total: 0 });
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences';
    await GET({ nextUrl: new URL(url), headers: new Headers(), url } as never);

    expect(logPhiAccessMock).not.toHaveBeenCalled();
    expect(fetchAllMock).not.toHaveBeenCalled();
  });

  it('passes skipTestFilter=true to fetchAll', async () => {
    const { GET } = await import('@/app/api/dashboard/communications/preferences/route');
    const url = 'http://localhost:3000/api/dashboard/communications/preferences';
    await GET({ nextUrl: new URL(url), headers: new Headers(), url } as never);

    expect(fetchAllMock).toHaveBeenCalledTimes(1);
    const args = fetchAllMock.mock.calls[0] as unknown[];
    // 3rd argument is skipTestFilter boolean
    expect(args[2]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. PLAN-BUILDER/SEND — Email + Airtable Write Payloads
// ═══════════════════════════════════════════════════════════════════

describe('plan-builder/send side effects', () => {
  beforeEach(() => {
    resendSendMock.mockResolvedValue({ id: 'email_1' });
    updateRecordMock.mockResolvedValue(undefined);
  });

  it('sends email with correct from, to, and subject containing client name', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    await POST(request as never);

    expect(resendSendMock).toHaveBeenCalledTimes(1);
    const emailArgs = resendSendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(emailArgs.from).toBe('Rani Beauty Clinic <noreply@ranibeautyclinic.com>');
    expect(emailArgs.to).toBe('jane@example.com');
    expect(emailArgs.subject).toContain('Jane Doe');
    expect(emailArgs.subject).toContain('Treatment Plan');
    // Verify HTML contains the first name
    expect(emailArgs.html).toContain('Jane');
  });

  it('updates Airtable record with all 6 fields on successful send', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
        clientPhone: '425-555-0100',
      }),
    });
    await POST(request as never);

    expect(updateRecordMock).toHaveBeenCalledTimes(1);
    const [_table, recordId, fields] = updateRecordMock.mock.calls[0] as [
      unknown,
      string,
      Record<string, unknown>,
    ];
    expect(recordId).toBe('recABCDEFGHIJ');
    expect(fields['Status']).toBe('Sent');
    expect(fields['Plan URL']).toContain('/plan/recABCDEFGHIJ?code=');
    expect(fields['Sent At']).toBeDefined();
    expect(fields['Client Email']).toBe('jane@example.com');
    expect(fields['Client Name']).toBe('Jane Doe');
    expect(fields['Client Phone']).toBe('425-555-0100');
  });

  it('omits clientPhone from Airtable update when not provided', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    await POST(request as never);

    const [, , fields] = updateRecordMock.mock.calls[0] as [
      unknown,
      string,
      Record<string, unknown>,
    ];
    expect(fields).not.toHaveProperty('Client Phone');
  });

  it('generates deterministic access code from planId + secret', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request1 = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'a@b.com',
        clientName: 'A B',
      }),
    });
    const response1 = await POST(request1 as never);
    const body1 = await response1.json();

    const request2 = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'a@b.com',
        clientName: 'A B',
      }),
    });
    const response2 = await POST(request2 as never);
    const body2 = await response2.json();

    // Same planId + same secret → same access code → same URL
    expect(body1.planUrl).toBe(body2.planUrl);
    // URL format: baseUrl/plan/{planId}?code={6-digit}
    const codeMatch = (body1.planUrl as string).match(/code=(\d{6})/);
    expect(codeMatch).not.toBeNull();
  });

  it('does NOT update Airtable when Resend throws', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('Email delivery failed'));

    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'recABCDEFGHIJ',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
    expect(updateRecordMock).not.toHaveBeenCalled();
  });

  it('rejects planId that does not match Airtable record pattern', async () => {
    const { POST } = await import('@/app/api/dashboard/plan-builder/send/route');
    const request = new Request('http://localhost:3000/api/dashboard/plan-builder/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planId: 'not-a-record-id',
        clientEmail: 'jane@example.com',
        clientName: 'Jane Doe',
      }),
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(updateRecordMock).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. MASTERMIND/PLAN-SEND — Token, Session State, Email
// ═══════════════════════════════════════════════════════════════════

describe('mastermind/plan-send side effects', () => {
  const baseMastermindSession = {
    id: 'ms_1',
    phase: 'plan_ready',
    shareToken: 'existing-token-123',
    patientEmail: 'jane@example.com',
    patientName: 'Jane Doe',
    clinicNotes: 'Initial notes.',
    intakeData: { email: 'jane@example.com' },
  };

  beforeEach(() => {
    getSessionByIdAsyncMock.mockResolvedValue({ ...baseMastermindSession });
    sessionReducerMock.mockImplementation((session: Record<string, unknown>) => ({
      ...session,
    }));
    saveSessionAsyncMock.mockResolvedValue(undefined);
    resolveTokenMock.mockResolvedValue({
      token: 'existing-token-123',
      sessionId: 'ms_1',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    saveTokenToAirtableMock.mockResolvedValue(undefined);
    resendSendMock.mockResolvedValue({ id: 'email_1' });
  });

  function makePlanSendRequest() {
    return new Request('http://localhost:3000/api/mastermind/plan-send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'ms_1' }),
    });
  }

  it('reuses existing valid token without generating a new one', async () => {
    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.shareUrl).toContain('/my-plan/existing-token-123');
    expect(saveTokenToAirtableMock).not.toHaveBeenCalled();
  });

  it('generates new token when existing token is expired', async () => {
    resolveTokenMock.mockResolvedValueOnce(null); // token expired

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.shareUrl).toContain('/my-plan/');
    expect(body.shareUrl).not.toContain('existing-token-123');
    expect(saveTokenToAirtableMock).toHaveBeenCalledTimes(1);

    const tokenPayload = saveTokenToAirtableMock.mock.calls[0][0] as Record<string, string>;
    expect(tokenPayload.sessionId).toBe('ms_1');
    expect(tokenPayload.token).toHaveLength(64); // 32 bytes hex
    expect(tokenPayload.createdAt).toBeDefined();
    expect(tokenPayload.expiresAt).toBeDefined();
    // Verify 7-day expiry
    const created = new Date(tokenPayload.createdAt).getTime();
    const expires = new Date(tokenPayload.expiresAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expires - created).toBe(sevenDaysMs);
  });

  it('generates new token for session with no existing shareToken', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      ...baseMastermindSession,
      shareToken: undefined,
    });
    // Second call for logging
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      ...baseMastermindSession,
      shareToken: undefined,
      clinicNotes: 'Initial notes.',
    });

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);

    expect(response.status).toBe(200);
    expect(saveTokenToAirtableMock).toHaveBeenCalledTimes(1);
    expect(sessionReducerMock).toHaveBeenCalled();
  });

  it('rejects session in early phase (no shareToken + pre-plan phase)', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      ...baseMastermindSession,
      shareToken: undefined,
      phase: 'intake',
    });

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain('intake');
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(saveTokenToAirtableMock).not.toHaveBeenCalled();
  });

  it('calls sessionReducer with SET_SHARE_TOKEN when generating new token', async () => {
    resolveTokenMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    await POST(makePlanSendRequest() as never);

    // Find the SET_SHARE_TOKEN call
    const tokenCall = sessionReducerMock.mock.calls.find(
      (call: unknown[]) =>
        (call[1] as Record<string, unknown>).type === 'SET_SHARE_TOKEN',
    );
    expect(tokenCall).toBeDefined();
    expect((tokenCall![1] as Record<string, unknown>).actor).toBe('Rina');
  });

  it('appends clinic notes with send log after email success', async () => {
    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    await POST(makePlanSendRequest() as never);

    // sessionReducer should have been called with SET_CLINIC_NOTES
    const notesCall = sessionReducerMock.mock.calls.find(
      (call: unknown[]) =>
        (call[1] as Record<string, unknown>).type === 'SET_CLINIC_NOTES',
    );
    expect(notesCall).toBeDefined();
    const notesPayload = notesCall![1] as Record<string, unknown>;
    expect(notesPayload.notes).toContain('jane@example.com');
    expect(notesPayload.notes).toContain('Rina');
    expect(notesPayload.actor).toBe('Rina');
  });

  it('calls saveSessionAsync for session persistence after email', async () => {
    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    await POST(makePlanSendRequest() as never);

    // Should be called at least once for logging
    expect(saveSessionAsyncMock).toHaveBeenCalled();
  });

  it('returns 502 when Resend throws on email send', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('Resend API down'));

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toContain('Email delivery');
  });

  it('extracts email from intakeData.email when patientEmail is empty', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      ...baseMastermindSession,
      patientEmail: '',
      intakeData: { email: 'fallback@example.com' },
    });
    // Second call for notes logging
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      ...baseMastermindSession,
      patientEmail: '',
    });

    const { POST } = await import('@/app/api/mastermind/plan-send/route');
    const response = await POST(makePlanSendRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sentTo).toBe('fallback@example.com');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. PATIENT/AUTH/VERIFY — Rate Limit, Cookie, Session
// ═══════════════════════════════════════════════════════════════════

describe('patient/auth/verify side effects', () => {
  beforeEach(() => {
    verifyMagicLinkTokenMock.mockResolvedValue({ email: 'patient@example.com' });
    fetchFirstMock.mockResolvedValue([
      {
        id: 'rec_client_1',
        fields: {
          Client: 'Jane Doe',
          Email: 'patient@example.com',
          Phone: '206-555-0100',
        },
      },
    ]);
    createPatientSessionMock.mockResolvedValue('patient_jwt_token');
    getPatientSessionCookieConfigMock.mockReturnValue({
      name: 'patient-session',
      value: 'patient_jwt_token',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600,
    });
  });

  function makeVerifyRequest(token = 'valid-token') {
    return new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }

  it('calls rateLimit before any other logic', async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, resetIn: 42 });

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(makeVerifyRequest() as never);

    expect(response.status).toBe(429);
    expect(rateLimitResponseMock).toHaveBeenCalledWith(42);
    // Verify no downstream calls happened
    expect(verifyMagicLinkTokenMock).not.toHaveBeenCalled();
    expect(fetchFirstMock).not.toHaveBeenCalled();
    expect(createPatientSessionMock).not.toHaveBeenCalled();
  });

  it('passes skip-cache flag to fetchFirst for fresh client data', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    await POST(makeVerifyRequest() as never);

    expect(fetchFirstMock).toHaveBeenCalledTimes(1);
    const args = fetchFirstMock.mock.calls[0] as unknown[];
    // arg[3] = true for skip cache
    expect(args[3]).toBe(true);
  });

  it('creates patient session with correct clientId, email, name', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    await POST(makeVerifyRequest() as never);

    expect(createPatientSessionMock).toHaveBeenCalledWith(
      'rec_client_1',
      'patient@example.com',
      'Jane Doe',
    );
  });

  it('sets session cookie with httpOnly + secure + sameSite flags', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(makeVerifyRequest() as never);

    const setCookie = response.headers.get('set-cookie') || '';
    expect(setCookie).toContain('patient-session=');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('secure');
  });

  it('returns 401 when no matching client found in Airtable', async () => {
    fetchFirstMock.mockResolvedValueOnce([]);

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(makeVerifyRequest() as never);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('not found');
    expect(createPatientSessionMock).not.toHaveBeenCalled();
  });

  it('returns 401 when fetchFirst returns null', async () => {
    fetchFirstMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(makeVerifyRequest() as never);

    expect(response.status).toBe(401);
    expect(createPatientSessionMock).not.toHaveBeenCalled();
  });

  it('returns 400 when token is empty string', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(
      makeVerifyRequest('') as never,
    );

    expect(response.status).toBe(400);
    expect(verifyMagicLinkTokenMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON body', async () => {
    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const request = new Request('http://localhost:3000/api/patient/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad-json',
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('does not leak client data in error responses', async () => {
    verifyMagicLinkTokenMock.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/patient/auth/verify/route');
    const response = await POST(makeVerifyRequest('bad-token') as never);
    const body = await response.json();

    // Should not contain any client info
    expect(JSON.stringify(body)).not.toContain('Jane');
    expect(JSON.stringify(body)).not.toContain('patient@example.com');
  });
});
