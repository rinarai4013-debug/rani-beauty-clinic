// ═══════════════════════════════════════════════════════════════
// QuickBooks Client — Tests
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getQBOConfig,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  getStoredTokens,
  storeTokens,
  clearTokens,
  qboClient,
  QBOApiError,
  QBOAuthError,
} from '../client';
import type { QBOTokens } from '../types';

/* ─── Mocks ─────────────────────────────────────────────────── */

const mockFetch = vi.fn();
global.fetch = mockFetch;

const TEST_TOKENS: QBOTokens = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  accessTokenExpiresAt: Date.now() + 3600 * 1000,
  refreshTokenExpiresAt: Date.now() + 100 * 24 * 3600 * 1000,
  realmId: 'test-realm-123',
};

beforeEach(() => {
  vi.stubEnv('QBO_CLIENT_ID', 'test-client-id');
  vi.stubEnv('QBO_CLIENT_SECRET', 'test-client-secret');
  vi.stubEnv('QBO_REDIRECT_URI', 'http://localhost:3000/api/integrations/quickbooks/auth?action=callback');
  vi.stubEnv('QBO_REALM_ID', 'test-realm-123');
  vi.stubEnv('QBO_ENVIRONMENT', 'sandbox');
  mockFetch.mockReset();
  clearTokens();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/* ─── Configuration Tests ───────────────────────────────────── */

describe('getQBOConfig', () => {
  it('returns config from environment variables', () => {
    const config = getQBOConfig();
    expect(config.clientId).toBe('test-client-id');
    expect(config.clientSecret).toBe('test-client-secret');
    expect(config.redirectUri).toBe('http://localhost:3000/api/integrations/quickbooks/auth?action=callback');
    expect(config.environment).toBe('sandbox');
  });

  it('defaults to sandbox environment', () => {
    vi.stubEnv('QBO_ENVIRONMENT', '');
    const config = getQBOConfig();
    expect(config.environment).toBe('sandbox');
  });

  it('throws when client ID is missing', () => {
    vi.stubEnv('QBO_CLIENT_ID', '');
    expect(() => getQBOConfig()).toThrow(QBOAuthError);
  });

  it('throws when client secret is missing', () => {
    vi.stubEnv('QBO_CLIENT_SECRET', '');
    expect(() => getQBOConfig()).toThrow(QBOAuthError);
  });

  it('throws when redirect URI is missing', () => {
    vi.stubEnv('QBO_REDIRECT_URI', '');
    expect(() => getQBOConfig()).toThrow(QBOAuthError);
  });
});

/* ─── Authorization URL Tests ───────────────────────────────── */

describe('getAuthorizationUrl', () => {
  it('generates correct Intuit OAuth URL', () => {
    const url = getAuthorizationUrl('test-state-123');
    expect(url).toContain('https://appcenter.intuit.com/connect/oauth2');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=com.intuit.quickbooks.accounting');
    expect(url).toContain('state=test-state-123');
  });

  it('includes redirect URI', () => {
    const url = getAuthorizationUrl('state');
    expect(url).toContain('redirect_uri=');
  });
});

/* ─── Token Exchange Tests ──────────────────────────────────── */

describe('exchangeCodeForTokens', () => {
  it('exchanges authorization code for tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
      }),
    });

    const tokens = await exchangeCodeForTokens('auth-code-123', 'realm-456');

    expect(tokens.accessToken).toBe('new-access-token');
    expect(tokens.refreshToken).toBe('new-refresh-token');
    expect(tokens.realmId).toBe('realm-456');
    expect(tokens.accessTokenExpiresAt).toBeGreaterThan(Date.now());
  });

  it('sends Basic auth header with client credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'tok',
        refresh_token: 'ref',
        token_type: 'bearer',
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
      }),
    });

    await exchangeCodeForTokens('code', 'realm');

    const call = mockFetch.mock.calls[0];
    expect(call[1].headers.Authorization).toMatch(/^Basic /);
  });

  it('throws on failed exchange', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    await expect(exchangeCodeForTokens('bad-code', 'realm')).rejects.toThrow(QBOAuthError);
  });

  it('stores tokens after successful exchange', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'stored-token',
        refresh_token: 'stored-refresh',
        token_type: 'bearer',
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
      }),
    });

    await exchangeCodeForTokens('code', 'realm');
    const stored = getStoredTokens();
    expect(stored?.accessToken).toBe('stored-token');
  });
});

/* ─── Token Refresh Tests ───────────────────────────────────── */

describe('refreshAccessToken', () => {
  it('refreshes using the refresh token', async () => {
    storeTokens(TEST_TOKENS);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'refreshed-access',
        refresh_token: 'refreshed-refresh',
        token_type: 'bearer',
        expires_in: 3600,
        x_refresh_token_expires_in: 8726400,
      }),
    });

    const tokens = await refreshAccessToken();
    expect(tokens.accessToken).toBe('refreshed-access');
    expect(tokens.refreshToken).toBe('refreshed-refresh');
  });

  it('throws when no tokens are available', async () => {
    await expect(refreshAccessToken()).rejects.toThrow(QBOAuthError);
  });

  it('clears tokens and throws on 400 response (expired refresh token)', async () => {
    storeTokens(TEST_TOKENS);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    });

    await expect(refreshAccessToken()).rejects.toThrow('Refresh token expired');
    expect(getStoredTokens()).toBeNull();
  });
});

/* ─── Token Storage Tests ───────────────────────────────────── */

describe('Token Storage', () => {
  it('stores and retrieves tokens', () => {
    storeTokens(TEST_TOKENS);
    const stored = getStoredTokens();
    expect(stored?.accessToken).toBe(TEST_TOKENS.accessToken);
    expect(stored?.realmId).toBe(TEST_TOKENS.realmId);
  });

  it('returns null when no tokens stored', () => {
    expect(getStoredTokens()).toBeNull();
  });

  it('clears tokens', () => {
    storeTokens(TEST_TOKENS);
    clearTokens();
    expect(getStoredTokens()).toBeNull();
  });

  it('falls back to env vars for initial load', () => {
    vi.stubEnv('QBO_ACCESS_TOKEN', 'env-access-token');
    vi.stubEnv('QBO_REFRESH_TOKEN', 'env-refresh-token');
    vi.stubEnv('QBO_REALM_ID', 'env-realm');

    const tokens = getStoredTokens();
    expect(tokens?.accessToken).toBe('env-access-token');
    expect(tokens?.realmId).toBe('env-realm');
  });
});

/* ─── Revoke Tokens Tests ───────────────────────────────────── */

describe('revokeTokens', () => {
  it('calls Intuit revoke endpoint and clears tokens', async () => {
    storeTokens(TEST_TOKENS);
    mockFetch.mockResolvedValueOnce({ ok: true });

    await revokeTokens();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(getStoredTokens()).toBeNull();
  });

  it('clears tokens even if revocation request fails', async () => {
    storeTokens(TEST_TOKENS);
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    await revokeTokens();
    expect(getStoredTokens()).toBeNull();
  });

  it('does nothing when no tokens exist', async () => {
    await revokeTokens();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

/* ─── QBO API Client Tests ──────────────────────────────────── */

describe('qboClient', () => {
  beforeEach(() => {
    storeTokens(TEST_TOKENS);
  });

  describe('query', () => {
    it('executes a QBO query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          QueryResponse: {
            Account: [{ Id: '1', Name: 'Checking' }],
          },
          time: new Date().toISOString(),
        }),
      });

      const results = await qboClient.query('SELECT * FROM Account');
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('Name', 'Checking');
    });

    it('returns empty array for no results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          QueryResponse: {},
          time: new Date().toISOString(),
        }),
      });

      const results = await qboClient.query('SELECT * FROM Account WHERE Id = "999"');
      expect(results).toHaveLength(0);
    });

    it('includes bearer token in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ QueryResponse: {}, time: '' }),
      });

      await qboClient.query('SELECT * FROM Account');

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-access-token');
    });

    it('uses sandbox base URL in sandbox mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ QueryResponse: {}, time: '' }),
      });

      await qboClient.query('SELECT * FROM Account');

      expect(mockFetch.mock.calls[0][0]).toContain('sandbox-quickbooks.api.intuit.com');
    });
  });

  describe('create', () => {
    it('creates a new entity via POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Customer: { Id: '100', DisplayName: 'New Customer' },
        }),
      });

      const result = await qboClient.create('Customer', { DisplayName: 'New Customer' });
      expect(result).toHaveProperty('Id', '100');
    });
  });

  describe('read', () => {
    it('reads a single entity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Invoice: { Id: '42', TotalAmt: 500 },
        }),
      });

      const result = await qboClient.read('Invoice', '42');
      expect(result).toHaveProperty('TotalAmt', 500);
    });
  });

  describe('error handling', () => {
    it('throws QBOApiError on API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          Fault: {
            Error: [{ Message: 'Invalid query', Detail: 'Bad syntax', code: '4000' }],
            type: 'ValidationFault',
          },
          time: '',
        }),
      });

      await expect(qboClient.query('INVALID')).rejects.toThrow(QBOApiError);
    });

    it('retries on 401 with token refresh', async () => {
      // First call: 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          Fault: {
            Error: [{ Message: 'Invalid token', Detail: '', code: '100' }],
            type: 'AuthenticationFault',
          },
        }),
      });

      // Token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          x_refresh_token_expires_in: 8726400,
        }),
      });

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ QueryResponse: { Account: [] }, time: '' }),
      });

      const results = await qboClient.query('SELECT * FROM Account');
      expect(results).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('retries on 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '1' }),
        json: async () => ({}),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ QueryResponse: {}, time: '' }),
      });

      const results = await qboClient.query('SELECT * FROM Account');
      expect(results).toEqual([]);
    });

    it('retries on 5xx server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ QueryResponse: {}, time: '' }),
      });

      const results = await qboClient.query('SELECT * FROM Account');
      expect(results).toEqual([]);
    });

    it('throws QBOAuthError when not connected', async () => {
      clearTokens();
      vi.stubEnv('QBO_ACCESS_TOKEN', '');
      vi.stubEnv('QBO_REFRESH_TOKEN', '');
      vi.stubEnv('QBO_REALM_ID', '');

      await expect(qboClient.query('SELECT * FROM Account')).rejects.toThrow(QBOAuthError);
    });
  });

  describe('getConnectionStatus', () => {
    it('returns connected status when tokens exist', () => {
      const status = qboClient.getConnectionStatus();
      expect(status.connected).toBe(true);
      expect(status.realmId).toBe('test-realm-123');
    });

    it('returns disconnected status when no tokens', () => {
      clearTokens();
      vi.stubEnv('QBO_ACCESS_TOKEN', '');
      vi.stubEnv('QBO_REFRESH_TOKEN', '');
      vi.stubEnv('QBO_REALM_ID', '');
      const status = qboClient.getConnectionStatus();
      expect(status.connected).toBe(false);
    });
  });

  describe('report', () => {
    it('fetches a QBO report', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Header: { ReportName: 'ProfitAndLoss', StartPeriod: '2026-01-01', EndPeriod: '2026-01-31' },
          Columns: { Column: [] },
          Rows: { Row: [] },
        }),
      });

      const report = await qboClient.report('ProfitAndLoss', {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      expect(report.Header.ReportName).toBe('ProfitAndLoss');
    });
  });

  describe('cdc', () => {
    it('fetches change data capture', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          CDCResponse: [{ QueryResponse: [] }],
          time: new Date().toISOString(),
        }),
      });

      const result = await qboClient.cdc(['Invoice', 'Payment'], '2026-01-01T00:00:00Z');
      expect(result.CDCResponse).toBeDefined();
    });
  });
});

/* ─── QBOApiError Tests ─────────────────────────────────────── */

describe('QBOApiError', () => {
  const error = new QBOApiError(
    {
      Fault: {
        Error: [{ Message: 'Test error', Detail: 'Test detail', code: '3001' }],
        type: 'SystemFault',
      },
      time: '',
    },
    429,
  );

  it('has correct message', () => {
    expect(error.message).toBe('Test error');
  });

  it('has correct code', () => {
    expect(error.code).toBe('3001');
  });

  it('identifies rate limit errors', () => {
    expect(error.isRateLimitError).toBe(true);
  });

  it('identifies temporary errors', () => {
    expect(error.isTemporary).toBe(true);
  });

  it('identifies auth errors', () => {
    const authError = new QBOApiError(
      {
        Fault: {
          Error: [{ Message: 'Auth fail', Detail: '', code: '100' }],
          type: 'AuthenticationFault',
        },
        time: '',
      },
      401,
    );
    expect(authError.isAuthError).toBe(true);
  });

  it('identifies validation errors', () => {
    const valError = new QBOApiError(
      {
        Fault: {
          Error: [{ Message: 'Validation', Detail: '', code: '6000' }],
          type: 'ValidationFault',
        },
        time: '',
      },
      400,
    );
    expect(valError.isValidationError).toBe(true);
  });
});
