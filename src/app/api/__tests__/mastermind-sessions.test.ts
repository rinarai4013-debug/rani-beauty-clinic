/**
 * Integration tests for the mastermind sessions route:
 *   GET  /api/mastermind/sessions — list all sessions (role-gated)
 *   POST /api/mastermind/sessions — create a new session (auth-only)
 *
 * This is the first integration-test batch for the mastermind namespace,
 * triggered by the 2026-04-11 route auth audit finding "mastermind/sessions
 * list-without-scope" (P1). PR #12 hardened GET to restrict listing to
 * `ceo` and `provider` roles only. These tests lock that behavior in
 * place so a future refactor doesn't silently regress PHI scope.
 *
 * Why this route matters:
 *   - Mastermind sessions hold patient intake data + AI aura-scan results
 *   - Listing exposes PHI across the whole session set — HIPAA
 *     §164.514(d) minimum-necessary applies
 *   - Staff roles `frontdesk`, `marketing`, and `operations` have no
 *     clinical need-to-know for consult session data
 *
 * Coverage (12 tests):
 *   GET — 7 tests: 401 no session, 200 ceo, 200 provider, 403 frontdesk,
 *                  403 marketing, 403 operations, 500 on lib failure
 *   POST — 5 tests: 401 no session, 201 ceo, 201 frontdesk (intentionally
 *                   not role-gated), intakeData/name/email passthrough,
 *                   unsafe-field strip (injection guard)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CEO_SESSION,
  PROVIDER_SESSION,
  FRONTDESK_SESSION,
  MARKETING_SESSION,
  OPERATIONS_SESSION,
  buildGetRequest,
  buildPostRequest,
  expectJsonStatus,
  type MockSession,
} from './helpers';

// ---------------------------------------------------------------------------
// Hoisted mocks — declared before importing the route under test
// ---------------------------------------------------------------------------
//
// We use a shared mutable `currentSession` ref instead of per-test
// `vi.doMock(...) + vi.resetModules()`. The hoisted `vi.mock` approach
// installs the stub once, and each test just mutates the ref. This is
// more reliable for test isolation in Vitest than the dynamic-mock
// approach (which left stale session state across test boundaries in
// the first iteration of this file).

const currentSession = { value: null as MockSession | null };

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => currentSession.value),
  getSessionFromRequest: vi.fn(async () => currentSession.value),
}));

const mockGetAllSessionsAsync = vi.fn();
const mockCreateSession = vi.fn();
const mockSaveSessionAsync = vi.fn();

vi.mock('@/lib/mastermind/session', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  saveSessionAsync: (...args: unknown[]) => mockSaveSessionAsync(...args),
  getAllSessionsAsync: (...args: unknown[]) => mockGetAllSessionsAsync(...args),
}));

// withSentry is a thin wrapper that just invokes the async callback — we
// stub it so tests don't pull in the real Sentry SDK.
vi.mock('@/lib/sentry-utils', () => ({
  withSentry: <T>(_name: string, handler: () => Promise<T>) => handler(),
}));

// Import the route ONCE at the top. Because every dependency is mocked
// before the import resolves, the imported handlers see our stubs.
import { GET, POST } from '@/app/api/mastermind/sessions/route';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SAMPLE_SESSIONS = [
  {
    id: 'msn_001',
    patientName: 'Alex Tester',
    patientEmail: 'alex@example.com',
    phase: 'intake',
    createdAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'msn_002',
    patientName: 'Jordan Demo',
    patientEmail: 'jordan@example.com',
    phase: 'aura_scan',
    createdAt: '2026-04-10T12:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// GET suite
// ---------------------------------------------------------------------------

describe('GET /api/mastermind/sessions — role-gated list', () => {
  beforeEach(() => {
    currentSession.value = null;
    mockGetAllSessionsAsync.mockReset();
    mockGetAllSessionsAsync.mockResolvedValue(SAMPLE_SESSIONS);
  });

  it('returns 401 when no session cookie is present', async () => {
    currentSession.value = null;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    expect(res.status).toBe(401);
    expect(mockGetAllSessionsAsync).not.toHaveBeenCalled();
  });

  it('returns 200 + session list for ceo role', async () => {
    currentSession.value = CEO_SESSION;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    const body = await expectJsonStatus(res, 200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('msn_001');
    expect(mockGetAllSessionsAsync).toHaveBeenCalledTimes(1);
  });

  it('returns 200 + session list for provider role', async () => {
    currentSession.value = PROVIDER_SESSION;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    const body = await expectJsonStatus(res, 200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(mockGetAllSessionsAsync).toHaveBeenCalledTimes(1);
  });

  it('returns 403 for frontdesk role', async () => {
    currentSession.value = FRONTDESK_SESSION;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    expect(res.status).toBe(403);
    // CRITICAL: mastermind lib should never be called when role check fails
    // (no partial evaluation, no side effects, no logging)
    expect(mockGetAllSessionsAsync).not.toHaveBeenCalled();
  });

  it('returns 403 for marketing role', async () => {
    currentSession.value = MARKETING_SESSION;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    expect(res.status).toBe(403);
    expect(mockGetAllSessionsAsync).not.toHaveBeenCalled();
  });

  it('returns 403 for operations role', async () => {
    currentSession.value = OPERATIONS_SESSION;

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    expect(res.status).toBe(403);
    expect(mockGetAllSessionsAsync).not.toHaveBeenCalled();
  });

  it('returns 500 when the mastermind lib throws', async () => {
    currentSession.value = CEO_SESSION;
    mockGetAllSessionsAsync.mockRejectedValueOnce(
      new Error('Airtable offline'),
    );

    const req = buildGetRequest('/api/mastermind/sessions');
    const res = await GET(req as unknown as Parameters<typeof GET>[0]);

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST suite
// ---------------------------------------------------------------------------

describe('POST /api/mastermind/sessions — create (auth-only, no role gate)', () => {
  beforeEach(() => {
    currentSession.value = null;
    mockCreateSession.mockReset();
    mockSaveSessionAsync.mockReset();

    mockCreateSession.mockImplementation((overrides: Record<string, unknown>) => ({
      id: 'msn_new_001',
      phase: 'intake',
      createdAt: '2026-04-11T18:00:00.000Z',
      ...overrides,
    }));
    mockSaveSessionAsync.mockResolvedValue(undefined);
  });

  it('returns 401 when no session cookie is present', async () => {
    currentSession.value = null;

    const req = buildPostRequest('/api/mastermind/sessions', {});
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(401);
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockSaveSessionAsync).not.toHaveBeenCalled();
  });

  it('returns 201 + created session for ceo role', async () => {
    currentSession.value = CEO_SESSION;

    const req = buildPostRequest('/api/mastermind/sessions', {
      patientName: 'New Patient',
      patientEmail: 'new@example.com',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    const body = await expectJsonStatus(res, 201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('msn_new_001');
    expect(body.data.patientName).toBe('New Patient');
    expect(mockCreateSession).toHaveBeenCalledTimes(1);
    expect(mockSaveSessionAsync).toHaveBeenCalledTimes(1);
  });

  it('returns 201 for frontdesk role (intentionally not role-gated — see PR #12)', async () => {
    // Front desk staff needs to be able to onboard new patients. POST is
    // intentionally NOT restricted to ceo/provider; only GET (list) is.
    currentSession.value = FRONTDESK_SESSION;

    const req = buildPostRequest('/api/mastermind/sessions', {
      patientName: 'Walk In',
      patientEmail: 'walkin@example.com',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    const body = await expectJsonStatus(res, 201);
    expect(body.success).toBe(true);
    expect(body.data.patientName).toBe('Walk In');
  });

  it('accepts intakeData / patientName / patientEmail overrides', async () => {
    currentSession.value = PROVIDER_SESSION;

    const req = buildPostRequest('/api/mastermind/sessions', {
      patientName: 'Consult Patient',
      patientEmail: 'consult@example.com',
      intakeData: {
        skinConcerns: ['acne', 'hyperpigmentation'],
        goals: 'clearer skin for wedding',
      },
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    await expectJsonStatus(res, 201);

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        patientName: 'Consult Patient',
        patientEmail: 'consult@example.com',
        intakeData: expect.objectContaining({
          skinConcerns: ['acne', 'hyperpigmentation'],
          goals: 'clearer skin for wedding',
        }),
      }),
    );
  });

  it('strips unsafe override fields like id and createdAt (injection guard)', async () => {
    currentSession.value = CEO_SESSION;

    const req = buildPostRequest('/api/mastermind/sessions', {
      id: 'msn_HIJACKED',
      createdAt: '1970-01-01T00:00:00.000Z',
      phase: 'completed',
      patientName: 'Tampered',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    await expectJsonStatus(res, 201);

    // createSession should receive only the allowed keys — never `id`,
    // `createdAt`, or `phase` (those are server-owned). `patientName`
    // IS allowed.
    const callArg = mockCreateSession.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('id');
    expect(callArg).not.toHaveProperty('createdAt');
    expect(callArg).not.toHaveProperty('phase');
    expect(callArg.patientName).toBe('Tampered');
  });
});
