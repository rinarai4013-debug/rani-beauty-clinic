// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — API Client
// OAuth 2.0, rate limiting, error handling, request logging
// ═══════════════════════════════════════════════════════════════

import type {
  QBOConfig,
  QBOTokens,
  QBOAuthResponse,
  QBOError,
  QBOQueryResponse,
  QBOReport,
  QBOCDCResponse,
} from './types';
import { env } from '@/lib/env';

/* ─── Constants ─────────────────────────────────────────────── */

const QBO_OAUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QBO_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QBO_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

const QBO_API_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
} as const;

const RATE_LIMIT_MAX = 500; // 500 requests per minute
const RATE_LIMIT_WINDOW_MS = 60_000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

/* ─── Logger ────────────────────────────────────────────────── */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `[QBO][${level.toUpperCase()}][${timestamp}]`;

  if (level === 'error') {
    console.error(prefix, message, meta ? JSON.stringify(meta) : '');
  } else if (level === 'warn') {
    console.warn(prefix, message, meta ? JSON.stringify(meta) : '');
  } else {
    console.log(prefix, message, meta ? JSON.stringify(meta) : '');
  }
}

/* ─── QBO Error Classes ─────────────────────────────────────── */

export class QBOApiError extends Error {
  code: string;
  detail: string;
  faultType: string;
  statusCode: number;

  constructor(error: QBOError, statusCode: number) {
    const firstError = error.Fault?.Error?.[0];
    super(firstError?.Message || 'Unknown QBO error');
    this.name = 'QBOApiError';
    this.code = firstError?.code || 'UNKNOWN';
    this.detail = firstError?.Detail || '';
    this.faultType = error.Fault?.type || 'SystemFault';
    this.statusCode = statusCode;
  }

  get isAuthError(): boolean {
    return this.faultType === 'AuthenticationFault' || this.faultType === 'AuthorizationFault';
  }

  get isRateLimitError(): boolean {
    return this.code === '3001' || this.statusCode === 429;
  }

  get isValidationError(): boolean {
    return this.faultType === 'ValidationFault';
  }

  get isTemporary(): boolean {
    return this.statusCode >= 500 || this.isRateLimitError;
  }
}

export class QBOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QBOAuthError';
  }
}

/* ─── Rate Limiter ──────────────────────────────────────────── */

class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestInWindow) + 10; // +10ms buffer
      log('warn', `Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Re-check after waiting
    }

    this.timestamps.push(now);
  }

  get remainingRequests(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }
}

/* ─── Token Store ───────────────────────────────────────────── */

// In-memory token storage with env fallback
// In production, use encrypted database storage
let tokenStore: QBOTokens | null = null;

export function getStoredTokens(): QBOTokens | null {
  if (tokenStore) return tokenStore;

  // Fallback to env vars for initial load
  const accessToken = env.QBO_ACCESS_TOKEN;
  const refreshToken = env.QBO_REFRESH_TOKEN;
  const realmId = env.QBO_REALM_ID;

  if (accessToken && refreshToken && realmId) {
    return {
      accessToken,
      refreshToken,
      realmId,
      accessTokenExpiresAt: Date.now() + 3600 * 1000, // Assume 1h if unknown
      refreshTokenExpiresAt: Date.now() + 100 * 24 * 3600 * 1000, // ~100 days
    };
  }

  return null;
}

export function storeTokens(tokens: QBOTokens): void {
  tokenStore = tokens;
  log('info', 'Tokens stored successfully', { realmId: tokens.realmId });
}

export function clearTokens(): void {
  tokenStore = null;
  log('info', 'Tokens cleared');
}

/* ─── Configuration ─────────────────────────────────────────── */

export function getQBOConfig(): QBOConfig {
  const clientId = env.QBO_CLIENT_ID;
  const clientSecret = env.QBO_CLIENT_SECRET;
  const redirectUri = env.QBO_REDIRECT_URI;
  const realmId = env.QBO_REALM_ID;
  const environment = (env.QBO_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new QBOAuthError('Missing QBO configuration. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET, and QBO_REDIRECT_URI.');
  }

  return { clientId, clientSecret, redirectUri, realmId: realmId || '', environment };
}

/* ─── OAuth 2.0 Flow ────────────────────────────────────────── */

/**
 * Generate the authorization URL for Intuit OAuth 2.0
 * Redirect the user to this URL to begin the OAuth flow
 */
export function getAuthorizationUrl(state: string): string {
  const config = getQBOConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  });

  return `${QBO_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens
 */
export async function exchangeCodeForTokens(code: string, realmId: string): Promise<QBOTokens> {
  const config = getQBOConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  log('info', 'Exchanging authorization code for tokens', { realmId });

  const response = await fetch(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    log('error', 'Token exchange failed', { status: response.status, body: errorBody });
    throw new QBOAuthError(`Token exchange failed: ${response.status} ${errorBody}`);
  }

  const data: QBOAuthResponse = await response.json();
  const now = Date.now();

  const tokens: QBOTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: now + data.expires_in * 1000,
    refreshTokenExpiresAt: now + data.x_refresh_token_expires_in * 1000,
    realmId,
  };

  storeTokens(tokens);
  log('info', 'Token exchange successful', { realmId });
  return tokens;
}

/**
 * Refresh expired access token using refresh token
 */
export async function refreshAccessToken(currentTokens?: QBOTokens): Promise<QBOTokens> {
  const tokens = currentTokens || getStoredTokens();
  if (!tokens) throw new QBOAuthError('No tokens available to refresh');

  const config = getQBOConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  log('info', 'Refreshing access token', { realmId: tokens.realmId });

  const response = await fetch(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    log('error', 'Token refresh failed', { status: response.status, body: errorBody });

    // If refresh fails with 400, the refresh token is expired
    if (response.status === 400) {
      clearTokens();
      throw new QBOAuthError('Refresh token expired. User must re-authorize.');
    }

    throw new QBOAuthError(`Token refresh failed: ${response.status}`);
  }

  const data: QBOAuthResponse = await response.json();
  const now = Date.now();

  const newTokens: QBOTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: now + data.expires_in * 1000,
    refreshTokenExpiresAt: now + data.x_refresh_token_expires_in * 1000,
    realmId: tokens.realmId,
  };

  storeTokens(newTokens);
  log('info', 'Token refresh successful');
  return newTokens;
}

/**
 * Revoke all tokens (disconnect)
 */
export async function revokeTokens(): Promise<void> {
  const tokens = getStoredTokens();
  if (!tokens) return;

  const config = getQBOConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    await fetch(QBO_REVOKE_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ token: tokens.refreshToken }),
    });
  } catch (err) {
    log('warn', 'Token revocation request failed', { error: String(err) });
  }

  clearTokens();
  log('info', 'Tokens revoked and cleared');
}

/* ─── QBO API Client ────────────────────────────────────────── */

const rateLimiter = new RateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

async function getValidToken(): Promise<string> {
  let tokens = getStoredTokens();
  if (!tokens) throw new QBOAuthError('Not connected to QuickBooks. Please authenticate first.');

  // Auto-refresh if token is expiring soon
  if (Date.now() >= tokens.accessTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    log('info', 'Access token expiring soon, refreshing...');
    tokens = await refreshAccessToken(tokens);
  }

  return tokens.accessToken;
}

function getBaseUrl(): string {
  const config = getQBOConfig();
  return QBO_API_BASE[config.environment];
}

function getRealmId(): string {
  const tokens = getStoredTokens();
  const realmId = tokens?.realmId || env.QBO_REALM_ID;
  if (!realmId) throw new QBOAuthError('No realm ID available. Connect to QuickBooks first.');
  return realmId;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  retries?: number;
}

/**
 * Core API request handler with auto-refresh, rate limiting, retries, and logging
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params, retries = 2 } = options;

  await rateLimiter.waitForSlot();

  const accessToken = await getValidToken();
  const realmId = getRealmId();
  const baseUrl = getBaseUrl();

  let url = `${baseUrl}/v3/company/${realmId}/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const startTime = Date.now();
  log('debug', `${method} ${endpoint}`, { params });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;
    log('info', `${method} ${endpoint} → ${response.status} (${duration}ms)`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);

      // Handle auth errors — try refreshing token once
      if (response.status === 401 && retries > 0) {
        log('warn', 'Got 401, attempting token refresh and retry');
        await refreshAccessToken();
        return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
      }

      // Handle rate limiting
      if (response.status === 429 && retries > 0) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        log('warn', `Rate limited, waiting ${retryAfter}s`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
      }

      // Handle server errors with retry
      if (response.status >= 500 && retries > 0) {
        log('warn', `Server error ${response.status}, retrying in 2s`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
      }

      if (errorBody?.Fault) {
        throw new QBOApiError(errorBody as QBOError, response.status);
      }

      throw new Error(`QBO API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof QBOApiError || err instanceof QBOAuthError) throw err;

    // Network errors — retry
    if (retries > 0 && err instanceof Error && err.message.includes('fetch')) {
      log('warn', 'Network error, retrying in 1s', { error: err.message });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
    }

    throw err;
  }
}

/* ─── Public API Methods ────────────────────────────────────── */

export const qboClient = {
  // ── Query ──
  async query<T>(queryString: string): Promise<T[]> {
    const result = await apiRequest<QBOQueryResponse<T>>('query', {
      params: { query: queryString },
    });
    // QBO query response has entity type as key (e.g., "Invoice", "Account")
    const queryResponse = result.QueryResponse;
    const entityKey = Object.keys(queryResponse).find(
      k => !['startPosition', 'maxResults', 'totalCount'].includes(k),
    );
    return entityKey ? (queryResponse[entityKey] as T[]) || [] : [];
  },

  // ── CRUD Operations ──
  async create<T>(entityType: string, data: Partial<T>): Promise<T> {
    const result = await apiRequest<Record<string, T>>(entityType.toLowerCase(), {
      method: 'POST',
      body: data as Record<string, unknown>,
    });
    return result[entityType] || (result as unknown as T);
  },

  async read<T>(entityType: string, id: string): Promise<T> {
    const result = await apiRequest<Record<string, T>>(`${entityType.toLowerCase()}/${id}`);
    return result[entityType] || (result as unknown as T);
  },

  async update<T>(entityType: string, data: Partial<T> & { Id: string; SyncToken: string }): Promise<T> {
    const result = await apiRequest<Record<string, T>>(entityType.toLowerCase(), {
      method: 'POST',
      body: { ...data, sparse: true } as Record<string, unknown>,
    });
    return result[entityType] || (result as unknown as T);
  },

  async delete(entityType: string, id: string, syncToken: string): Promise<void> {
    await apiRequest(`${entityType.toLowerCase()}`, {
      method: 'POST',
      params: { operation: 'delete' },
      body: { Id: id, SyncToken: syncToken },
    });
  },

  // ── Reports ──
  async report(reportName: string, params?: Record<string, string>): Promise<QBOReport> {
    return apiRequest<QBOReport>(`reports/${reportName}`, { params });
  },

  // ── Change Data Capture ──
  async cdc(entities: string[], changedSince: string): Promise<QBOCDCResponse> {
    return apiRequest<QBOCDCResponse>('cdc', {
      params: {
        entities: entities.join(','),
        changedSince,
      },
    });
  },

  // ── Batch Request ──
  async batch(operations: Array<{ bId: string; operation: string; Query?: string; [key: string]: unknown }>): Promise<unknown> {
    return apiRequest('batch', {
      method: 'POST',
      body: { BatchItemRequest: operations } as unknown as Record<string, unknown>,
    });
  },

  // ── Company Info ──
  async getCompanyInfo(): Promise<Record<string, unknown>> {
    const realmId = getRealmId();
    return apiRequest(`companyinfo/${realmId}`);
  },

  // ── Connection Status ──
  getConnectionStatus(): { connected: boolean; realmId: string | null; remainingRequests: number } {
    const tokens = getStoredTokens();
    return {
      connected: !!tokens,
      realmId: tokens?.realmId || null,
      remainingRequests: rateLimiter.remainingRequests,
    };
  },
};

export default qboClient;
