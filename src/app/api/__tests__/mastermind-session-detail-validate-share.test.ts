import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionFromRequestMock = vi.fn();
const getSessionByIdAsyncMock = vi.fn();
const saveSessionAsyncMock = vi.fn();
const sessionReducerMock = vi.fn();
const validatePlanMock = vi.fn();
const resolveTokenMock = vi.fn();
const unauthorizedMock = vi.fn(
  () => new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 }),
);
const forbiddenMock = vi.fn(
  () => new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403 }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionFromRequest: (...args: unknown[]) => getSessionFromRequestMock(...args),
}));

vi.mock('@/lib/mastermind/session', () => ({
  getSessionByIdAsync: (...args: unknown[]) => getSessionByIdAsyncMock(...args),
  saveSessionAsync: (...args: unknown[]) => saveSessionAsyncMock(...args),
  sessionReducer: (...args: unknown[]) => sessionReducerMock(...args),
}));

vi.mock('@/lib/plan-builder/constraints', () => ({
  validatePlan: (...args: unknown[]) => validatePlanMock(...args),
}));

vi.mock('@/lib/mastermind/share-token', () => ({
  resolveToken: (...args: unknown[]) => resolveTokenMock(...args),
}));

vi.mock('@/lib/auth/middleware', () => ({
  unauthorized: (...args: unknown[]) => unauthorizedMock(...args),
  forbidden: (...args: unknown[]) => forbiddenMock(...args),
}));

vi.mock('@/lib/sentry-utils', () => ({
  withSentry: vi.fn(async (_name: string, handler: () => Promise<unknown>) => handler()),
}));

describe('mastermind session detail + validate + share token routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getSessionFromRequestMock.mockResolvedValue({
      username: 'rina',
      name: 'Rina',
      role: 'ceo',
    });

    sessionReducerMock.mockImplementation((_session: unknown, action: unknown) => ({
      id: 'ms_1',
      lastAction: action,
    }));
    saveSessionAsyncMock.mockResolvedValue(undefined);

    validatePlanMock.mockReturnValue([
      { severity: 'warning', message: 'warn' },
      { severity: 'error', message: 'error' },
      { severity: 'info', message: 'info' },
    ]);

    resolveTokenMock.mockResolvedValue({
      token: 'share_123',
      sessionId: 'ms_1',
      createdAt: '2026-04-10T00:00:00.000Z',
      expiresAt: '2026-04-17T00:00:00.000Z',
    });

    getSessionByIdAsyncMock.mockResolvedValue({
      id: 'ms_1',
      createdAt: '2026-04-10T00:00:00.000Z',
      patientName: 'Jane Doe',
      intakeData: { firstName: 'Jane' },
      auraScanResult: {
        auraScore: {
          overall: 80,
          grade: 'B+',
          label: 'Strong',
          skinAge: 37,
          chronologicalAge: 34,
          skinAgeDelta: 3,
          percentile: 84,
        },
        detectedConcerns: [
          {
            id: 'c1',
            concern: 'pigmentation',
            score: 72,
            severity: 'moderate',
            urgency: 'medium',
            description: 'Pigment unevenness',
            trending: 'stable',
            zones: ['cheeks'],
            clinicalNote: 'internal',
          },
        ],
        zoneAnalysis: [
          {
            zone: 'left_cheek',
            zoneName: 'Left Cheek',
            overallScore: 68,
            skinAge: 39,
            concerns: [{ type: 'pigmentation', severity: 70 }],
            recommendations: ['tx'],
          },
        ],
        auraDeviceAnalysis: {
          categories: [
            {
              key: 'texture',
              label: 'Texture',
              absoluteScore: 3.9,
              peerScore: 0.2,
              severity: 'mild',
              description: 'Slight roughness',
            },
          ],
          compositeSkinScore: 78,
        },
        predictiveMetrics: {
          withoutIntervention: {
            oneYear: { skinAge: 39, auraScore: 76, topConcerns: ['pigmentation'] },
            threeYears: { skinAge: 41, auraScore: 71, topConcerns: ['pigmentation'] },
            fiveYears: { skinAge: 44, auraScore: 66, topConcerns: ['pigmentation'] },
            sixMonths: { skinAge: 38, auraScore: 78, topConcerns: ['pigmentation'] },
          },
          withTreatment: {
            threeMonths: { skinAge: 36, auraScore: 82 },
            sixMonths: { skinAge: 35, auraScore: 84 },
            oneYear: { skinAge: 34, auraScore: 87 },
          },
          riskFactors: [],
        },
      },
      mastermindPlan: {
        recommendations: {
          primary: [
            {
              id: 'tx_1',
              treatmentName: 'Sofwave',
              category: 'skin-tightening',
              targetConcerns: ['laxity'],
              sessionsRequired: 1,
              intervalBetweenSessions: '12 months',
              expectedImprovement: 'visible lift',
              timeToResults: '8-12 weeks',
              longevity: '12-18 months',
              perSession: 3200,
              totalEstimate: 3200,
              priority: 'high',
              downtime: 'none',
              riskLevel: 'low',
              aiReasoning: 'Strong match',
              clinicalRationale: 'internal rationale',
              aiConfidence: 0.92,
              contraindications: ['pregnancy'],
              urgency: 'immediate',
              targetZones: ['jawline'],
              synergiesWith: [],
            },
          ],
          complementary: [],
          maintenance: [],
        },
        sequencing: [
          {
            phase: 1,
            phaseName: 'Foundation',
            duration: 'Month 1',
            treatments: [{ treatmentId: 'tx_1', week: 1, sessionNumber: 1 }],
            expectedMilestone: 'Lift visible',
          },
        ],
        packages: [
          {
            tier: 'Transform',
            name: 'Transform Package',
            subtitle: 'Best value',
            price: 3200,
            originalPrice: 3600,
            discount: 11,
            sessions: 1,
            lineItems: [],
            monthlyPayment12: 299,
            monthlyPayment24: 169,
            highlighted: true,
            extras: [],
            bestFor: ['lift'],
            resultIntensity: 'high',
            concernsAddressed: ['laxity'],
            whyBest: 'Best outcomes',
            savingsVsStandalone: 400,
          },
        ],
        aftercarePreview: [
          {
            treatmentId: 'tx_1',
            immediateAftercare: ['cool packs'],
            weekOneGuidance: ['SPF daily'],
            productsRecommended: ['retinol'],
          },
        ],
        aiSummary: {
          patientFacing: 'Personalized transformation plan',
          providerFacing: 'internal',
          keyHighlights: ['lift', 'tone'],
          addressedConcerns: [{ concern: 'laxity', solution: 'Sofwave', timeline: '3 months' }],
        },
        contraindications: [],
      },
      simulationComparison: {
        withTreatment: {
          frames: [
            {
              imageDataUrl: '',
              timepoint: '3M',
              monthNumber: 3,
              description: 'noticeable lift',
              auraScoreProjection: 84,
              skinAgeProjection: 35,
            },
          ],
          narrative: 'With treatment narrative',
        },
        withoutTreatment: {
          frames: [
            {
              imageDataUrl: '',
              timepoint: '1Y',
              monthNumber: 12,
              description: 'continued decline',
              auraScoreProjection: 74,
              skinAgeProjection: 39,
            },
          ],
          narrative: 'Without treatment narrative',
        },
        comparison: {
          auraScoreDelta: 10,
          skinAgeDelta: 4,
          keyDifferentiators: ['10-point delta'],
        },
        costOfDelay: {
          currentPlanCost: 3200,
          costIfDelayed1Year: 4200,
          costIfDelayed3Years: 6000,
          reasoning: 'delay costly',
        },
      },
      phase: 'plan_ready',
    });
  });

  it('GET /api/mastermind/sessions/[id] returns 401 without auth', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1') as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(401);
  });

  it('GET /api/mastermind/sessions/[id] returns 403 for non-ceo/provider roles', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce({ username: 'front', role: 'frontdesk' });
    const { GET } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1') as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(403);
  });

  it('GET /api/mastermind/sessions/[id] returns 404 when session is missing', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/sessions/missing') as never,
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });

  it('GET /api/mastermind/sessions/[id] returns session payload for authorized staff', async () => {
    const { GET } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1') as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('ms_1');
  });

  it('PATCH /api/mastermind/sessions/[id] rejects missing action payload', async () => {
    const { PATCH } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await PATCH(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(400);
  });

  it('PATCH /api/mastermind/sessions/[id] returns 413 when content-length exceeds guard limit', async () => {
    const { PATCH } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await PATCH(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'content-length': String(3 * 1024 * 1024),
        },
        body: JSON.stringify({
          action: {
            type: 'SET_SOURCE_PHOTO',
            url: 'data:image/jpeg;base64,abc',
          },
        }),
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(413);
  });

  it('PATCH /api/mastermind/sessions/[id] enriches SET_PROVIDER_REVIEW with provider identity', async () => {
    const { PATCH } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await PATCH(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: {
            type: 'SET_PROVIDER_REVIEW',
            review: { approved: true },
          },
        }),
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(200);
    expect(sessionReducerMock).toHaveBeenCalledTimes(1);
    expect(sessionReducerMock.mock.calls[0][1]).toEqual({
      type: 'SET_PROVIDER_REVIEW',
      review: {
        approved: true,
        providerId: 'rina',
        providerName: 'Rina',
      },
    });
  });

  it('PATCH /api/mastermind/sessions/[id] injects actor into SET_CLINIC_STATUS actions', async () => {
    const { PATCH } = await import('@/app/api/mastermind/sessions/[id]/route');
    const response = await PATCH(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: {
            type: 'SET_CLINIC_STATUS',
            status: 'approved',
          },
        }),
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(200);
    expect(sessionReducerMock.mock.calls[0][1]).toEqual({
      type: 'SET_CLINIC_STATUS',
      status: 'approved',
      actor: 'Rina',
    });
  });

  it('POST /api/mastermind/sessions/[id]/validate enforces role-gated auth', async () => {
    getSessionFromRequestMock.mockResolvedValueOnce({ username: 'front', role: 'frontdesk' });
    const { POST } = await import('@/app/api/mastermind/sessions/[id]/validate/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1/validate', {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );

    expect(response.status).toBe(403);
  });

  it('POST /api/mastermind/sessions/[id]/validate returns 404 when session missing', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/mastermind/sessions/[id]/validate/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/sessions/missing/validate', {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/mastermind/sessions/[id]/validate returns no-plan message when plan absent', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      mastermindPlan: null,
    });
    const { POST } = await import('@/app/api/mastermind/sessions/[id]/validate/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1/validate', {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.warnings).toEqual([]);
    expect(body.data.message).toContain('No plan to validate');
  });

  it('POST /api/mastermind/sessions/[id]/validate returns severity counts from validator', async () => {
    const { POST } = await import('@/app/api/mastermind/sessions/[id]/validate/route');
    const response = await POST(
      new Request('http://localhost:3000/api/mastermind/sessions/ms_1/validate', {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: 'ms_1' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.errorCount).toBe(1);
    expect(body.data.warningCount).toBe(1);
    expect(body.data.infoCount).toBe(1);
    expect(body.data.isValid).toBe(false);
  });

  it('GET /api/mastermind/share/[token] returns 400 for invalid token params', async () => {
    const { GET } = await import('@/app/api/mastermind/share/[token]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/share/') as never,
      { params: Promise.resolve({ token: '' }) },
    );

    expect(response.status).toBe(400);
  });

  it('GET /api/mastermind/share/[token] returns 404 when token cannot be resolved', async () => {
    resolveTokenMock.mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/mastermind/share/[token]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/share/bad') as never,
      { params: Promise.resolve({ token: 'bad' }) },
    );

    expect(response.status).toBe(404);
  });

  it('GET /api/mastermind/share/[token] returns 422 when scan/plan data is incomplete', async () => {
    getSessionByIdAsyncMock.mockResolvedValueOnce({
      id: 'ms_1',
      auraScanResult: null,
      mastermindPlan: null,
    });
    const { GET } = await import('@/app/api/mastermind/share/[token]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/share/share_123') as never,
      { params: Promise.resolve({ token: 'share_123' }) },
    );

    expect(response.status).toBe(422);
  });

  it('GET /api/mastermind/share/[token] returns sanitized patient-facing payload', async () => {
    const { GET } = await import('@/app/api/mastermind/share/[token]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/share/share_123') as never,
      { params: Promise.resolve({ token: 'share_123' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.patientName).toBe('Jane Doe');
    expect(body.data.treatments.primary[0].id).toBeUndefined();
    expect(body.data.treatments.primary[0].clinicalRationale).toBeUndefined();
    expect(body.data.concerns[0].id).toBeUndefined();
    expect(body.data.concerns[0].score).toBeUndefined();
    expect(body.data.simulation.costOfDelay).toBeUndefined();
  });

  it('GET /api/mastermind/share/[token] returns 500 on unexpected token-resolution failures', async () => {
    resolveTokenMock.mockRejectedValueOnce(new Error('cache outage'));
    const { GET } = await import('@/app/api/mastermind/share/[token]/route');
    const response = await GET(
      new Request('http://localhost:3000/api/mastermind/share/share_123') as never,
      { params: Promise.resolve({ token: 'share_123' }) },
    );

    expect(response.status).toBe(500);
  });
});
