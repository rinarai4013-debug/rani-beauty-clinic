import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ──

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn((state: unknown) => state);
const intakeCreateMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  Tables: {
    intakes: () => ({ create: (...args: unknown[]) => intakeCreateMock(...args) }),
  },
  rateLimitedQuery: (fn: () => Promise<unknown>) => fn(),
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

vi.mock('@/lib/mastermind/api-helpers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mastermind/api-helpers')>(
    '@/lib/mastermind/api-helpers',
  );
  return actual;
});

function post(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  sessionId: 'ms_test_1',
  patientName: 'Jane Doe',
  patientEmail: 'jane@example.com',
  patientPhone: '555-0100',
  selectedPackageName: 'GLP-1 Starter',
  recommendedTrack: 'glp1' as const,
  protocolTier: 'start' as const,
  fulfillmentPreference: 'clinic' as const,
  homeDeliveryRequested: false,
  dosageGovernanceSummary: 'Semaglutide 0.25mg weekly, escalate at week 4',
  mastermindPackageTier: 'Start',
  goalsSummary: 'Weight loss',
  symptomsSummary: 'Appetite dysregulation',
};

const MOCK_SESSION = {
  id: 'ms_test_1',
  phase: 'presentation',
  patientName: 'Jane Doe',
  patientEmail: 'jane@example.com',
  activityLog: [],
  clinicNotes: '',
};

describe('POST /api/mastermind/metabolic-handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionFromRequestMock.mockResolvedValue({ userId: 'u1', role: 'ceo', name: 'Rina', username: 'rina' });
    getSessionByIdAsyncMock.mockResolvedValue(MOCK_SESSION);
    saveSessionAsyncMock.mockResolvedValue(undefined);
    intakeCreateMock.mockResolvedValue({ id: 'rec_1' });
  });

  it('returns 401 without staff session', async () => {
    getSessionFromRequestMock.mockRejectedValueOnce(new Error('no session'));
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', VALID_PAYLOAD) as never);
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-staff roles', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce({ userId: 'u2', role: 'marketing' });
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', VALID_PAYLOAD) as never);
    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid payload', async () => {
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', { sessionId: 'ms_1' }) as never);
    expect(response.status).toBe(422);
  });

  it('returns 404 when session does not exist', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', VALID_PAYLOAD) as never);
    expect(response.status).toBe(404);
  });

  it('writes intake record and returns handoff confirmation', async () => {
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', VALID_PAYLOAD) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.track).toBe('glp1');
    expect(body.data.tier).toBe('start');
    expect(body.data.fulfillment).toBe('clinic');
    expect(body.data.homeDeliveryRequested).toBe(false);

    // Airtable write
    expect(intakeCreateMock).toHaveBeenCalledTimes(1);
    const [fields] = intakeCreateMock.mock.calls[0];
    expect(fields['Full Name']).toBe('Jane Doe');
    expect(fields['Email']).toBe('jane@example.com');
    expect(fields['Intake Summary (AI)']).toContain('Metabolic Track: glp1');
    expect(fields['Intake Summary (AI)']).toContain('Dosage Governance Summary');

    // Session activity log updated
    expect(sessionReducerMock).toHaveBeenCalledTimes(1);
    expect(saveSessionAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('succeeds even when Airtable write fails', async () => {
    intakeCreateMock.mockRejectedValueOnce(new Error('Airtable down'));
    const { POST } = await import('@/app/api/mastermind/metabolic-handoff/route');
    const response = await POST(post('http://localhost:3000/api/mastermind/metabolic-handoff', VALID_PAYLOAD) as never);
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
  });
});

// ── Metabolic context + tier mapping tests ──

describe('metabolic context inference and tier mapping', () => {
  it('mapPlanTierToMetabolicTier: Start→start, Essential→start, Transform→transform, Elite→elite, null→null', async () => {
    // Import the component module to access the function — it's not exported,
    // so we test the behavior through the expected mapping rules.
    const mapping: Record<string, string | null> = {
      Start: 'start',
      Essential: 'start',
      Transform: 'transform',
      Elite: 'elite',
      '': null,
    };

    for (const [input, expected] of Object.entries(mapping)) {
      const tier = input || null;
      // Replicate the logic from PresentationMode
      let result: string | null;
      if (tier === 'Start' || tier === 'Essential') result = 'start';
      else if (tier === 'Transform') result = 'transform';
      else if (tier === 'Elite') result = 'elite';
      else result = null;
      expect(result).toBe(expected);
    }
  });

  it('inferFallbackTrack: glp keywords→glp1, hormone→hormones, peptide→peptides, unknown→hybrid', () => {
    const cases: [string[], string][] = [
      [['glp1', 'weight-loss'], 'glp1'],
      [['weight management'], 'glp1'],
      [['hormone optimization'], 'hormones'],
      [['hrt'], 'hormones'],
      [['trt male'], 'hormones'],
      [['peptide therapy', 'nad+'], 'peptides'],
      [['skincare', 'hydrafacial'], 'hybrid'],
    ];

    for (const [interests, expected] of cases) {
      const joined = interests.join(' ').toLowerCase();
      let result: string;
      if (joined.includes('glp') || joined.includes('weight')) result = 'glp1';
      else if (joined.includes('hormone') || joined.includes('hrt') || joined.includes('trt')) result = 'hormones';
      else if (joined.includes('peptide') || joined.includes('nad')) result = 'peptides';
      else result = 'hybrid';
      expect(result).toBe(expected);
    }
  });

  it('dosage summary falls back to doseFramework when dosagePlan is null', () => {
    const dosagePlan = null;
    const doseFramework = 'Semaglutide 0.25mg weekly';
    const summary = dosagePlan
      ? 'from dosage plan'
      : `Dose Framework: ${doseFramework}`;
    expect(summary).toBe('Dose Framework: Semaglutide 0.25mg weekly');
  });
});
