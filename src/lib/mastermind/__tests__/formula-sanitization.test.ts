import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('mastermind Airtable formula sanitization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AIRTABLE_PAT', 'pat_test_123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sanitizes session id before session-store Airtable lookup formula', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { getSessionFromAirtable } = await import('../session-store');
    const maliciousId = "sess' OR TRUE() OR 'x";

    await getSessionFromAirtable(maliciousId);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    const encoded = new URL(calledUrl).searchParams.get('filterByFormula') || '';
    const decodedFormula = decodeURIComponent(encoded);

    expect(decodedFormula).toContain("{Action}='sess OR TRUE() OR x'");
    expect(decodedFormula).not.toContain("{Action}='sess' OR TRUE() OR 'x'");
  });

  it('sanitizes share token before share-token Airtable lookup formula', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          {
            id: 'rec_share_1',
            fields: {
              Details: JSON.stringify({
                token: 'safe-token',
                sessionId: 'ms_123',
                createdAt: '2026-04-12T00:00:00.000Z',
                expiresAt: '2099-01-01T00:00:00.000Z',
              }),
            },
          },
        ],
      }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { resolveToken } = await import('../share-token');
    const maliciousToken = "tok' OR TRUE() OR 'x";

    await resolveToken(maliciousToken);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    const encoded = new URL(calledUrl).searchParams.get('filterByFormula') || '';
    const decodedFormula = decodeURIComponent(encoded);

    expect(decodedFormula).toContain("{Action}='tok OR TRUE() OR x'");
    expect(decodedFormula).not.toContain("{Action}='tok' OR TRUE() OR 'x'");
  });
});
