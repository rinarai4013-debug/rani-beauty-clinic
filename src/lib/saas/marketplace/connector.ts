// =============================================================================
// RaniOS Base Connector Pattern
// OAuth2, API key connections, webhooks, sync framework, rate limiting
// =============================================================================

import type {
  OAuth2Config,
  OAuth2TokenResponse,
  ApiKeyConfig,
  WebhookRegistration,
  WebhookEventType,
  ConnectorRateLimit,
  SyncResult,
  SyncError,
  SyncMode,
  IntegrationInstance,
  RetryPolicy,
} from './types';

// =============================================================================
// OAuth2 Connection Flow
// =============================================================================

export function buildOAuth2AuthorizationUrl(config: OAuth2Config): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: config.state,
  });

  if (config.codeVerifier && config.codeChallengeMethod) {
    // PKCE flow
    const codeChallenge = generateCodeChallenge(config.codeVerifier, config.codeChallengeMethod);
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', config.codeChallengeMethod);
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

function generateCodeChallenge(verifier: string, method: 'S256' | 'plain'): string {
  if (method === 'plain') return verifier;

  // S256: Base64URL(SHA256(verifier))
  // In production, use crypto.subtle.digest('SHA-256', ...)
  // Placeholder that would be replaced with actual SHA-256 in production
  return `s256_challenge_${verifier.substring(0, 16)}`;
}

export function generateStateToken(tenantId: string, integrationId: string): string {
  const payload = {
    tenantId,
    integrationId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15),
  };
  // In production, this would be encrypted/signed
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function parseStateToken(state: string): {
  tenantId: string;
  integrationId: string;
  timestamp: number;
  nonce: string;
} | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function exchangeAuthorizationCode(
  tokenUrl: string,
  code: string,
  config: OAuth2Config
): Promise<OAuth2TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  if (config.codeVerifier) {
    body.set('code_verifier', config.codeVerifier);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConnectorError(
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      `Token exchange failed: ${response.status} ${errorText}`,
      response.status
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || 3600,
    scope: data.scope || config.scopes.join(' '),
  };
}

export async function refreshOAuth2Token(
  tokenUrl: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<OAuth2TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new ConnectorError(
      'OAUTH_REFRESH_FAILED',
      `Token refresh failed: ${response.status}`,
      response.status
    );
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || 3600,
    scope: data.scope || '',
  };
}

export function isTokenExpired(expiresAt: string | null, bufferSeconds: number = 300): boolean {
  if (!expiresAt) return true;
  const expiryTime = new Date(expiresAt).getTime();
  return Date.now() >= expiryTime - bufferSeconds * 1000;
}

// =============================================================================
// API Key Connection Flow
// =============================================================================

export function validateApiKeyConfig(config: ApiKeyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    errors.push('API key is required');
  }

  if (!config.headerName || config.headerName.trim().length === 0) {
    errors.push('Header name is required');
  }

  // Basic key format validation
  if (config.apiKey && config.apiKey.length < 10) {
    errors.push('API key appears too short. Verify the key is correct');
  }

  return { valid: errors.length === 0, errors };
}

export function buildApiKeyHeaders(config: ApiKeyConfig): Record<string, string> {
  const value = config.prefix
    ? `${config.prefix} ${config.apiKey}`
    : config.apiKey;

  return {
    [config.headerName]: value,
    'Content-Type': 'application/json',
  };
}

export async function testApiKeyConnection(
  testUrl: string,
  config: ApiKeyConfig
): Promise<{ connected: boolean; message: string; responseTime: number }> {
  const start = Date.now();

  try {
    const headers = buildApiKeyHeaders(config);
    const response = await fetch(testUrl, { method: 'GET', headers });
    const responseTime = Date.now() - start;

    if (response.ok) {
      return { connected: true, message: 'Connection successful', responseTime };
    }

    if (response.status === 401 || response.status === 403) {
      return { connected: false, message: 'Invalid API key or insufficient permissions', responseTime };
    }

    return { connected: false, message: `Unexpected response: ${response.status}`, responseTime };
  } catch (error) {
    const responseTime = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Connection failed';
    return { connected: false, message, responseTime };
  }
}

// =============================================================================
// Webhook Registration
// =============================================================================

export function generateWebhookUrl(tenantId: string, integrationId: string): string {
  return `https://api.ranios.com/webhooks/${tenantId}/${integrationId}`;
}

export function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 40; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

export function createWebhookRegistration(
  tenantId: string,
  integrationId: string,
  events: WebhookEventType[]
): WebhookRegistration {
  return {
    id: `wh-${tenantId}-${integrationId}-${Date.now()}`,
    url: generateWebhookUrl(tenantId, integrationId),
    events,
    secret: generateWebhookSecret(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production: HMAC-SHA256 verification
  // const hmac = crypto.createHmac('sha256', secret);
  // hmac.update(payload);
  // const expected = hmac.digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  // Placeholder validation
  return signature.length > 0 && secret.length > 0;
}

export function parseWebhookPayload(
  rawBody: string,
  integrationId: string
): {
  eventType: WebhookEventType;
  data: Record<string, unknown>;
  timestamp: string;
  idempotencyKey: string;
} {
  try {
    const parsed = JSON.parse(rawBody);

    return {
      eventType: mapExternalEventToInternal(parsed.event || parsed.type || 'custom', integrationId),
      data: parsed.data || parsed.payload || parsed,
      timestamp: parsed.timestamp || parsed.created_at || new Date().toISOString(),
      idempotencyKey: parsed.id || parsed.event_id || `${integrationId}-${Date.now()}`,
    };
  } catch {
    throw new ConnectorError('WEBHOOK_PARSE_ERROR', 'Failed to parse webhook payload', 400);
  }
}

function mapExternalEventToInternal(
  externalEvent: string,
  integrationId: string
): WebhookEventType {
  // Event mapping per integration
  const eventMaps: Record<string, Record<string, WebhookEventType>> = {
    mangomint: {
      'appointment.created': 'appointment.created',
      'appointment.updated': 'appointment.updated',
      'appointment.canceled': 'appointment.cancelled',
      'appointment.completed': 'appointment.completed',
      'client.created': 'client.created',
      'client.updated': 'client.updated',
    },
    square: {
      'payment.completed': 'payment.completed',
      'payment.updated': 'payment.completed',
      'refund.created': 'payment.refunded',
      'invoice.created': 'invoice.created',
      'invoice.payment_made': 'invoice.paid',
    },
    stripe: {
      'payment_intent.succeeded': 'payment.completed',
      'charge.refunded': 'payment.refunded',
      'invoice.created': 'invoice.created',
      'invoice.paid': 'invoice.paid',
      'customer.subscription.created': 'membership.created',
      'customer.subscription.deleted': 'membership.cancelled',
    },
  };

  const map = eventMaps[integrationId];
  if (map && map[externalEvent]) {
    return map[externalEvent];
  }

  return 'custom';
}

// =============================================================================
// Event Subscription Management
// =============================================================================

export function addEventSubscription(
  registration: WebhookRegistration,
  event: WebhookEventType
): WebhookRegistration {
  if (registration.events.includes(event)) {
    return registration;
  }
  return {
    ...registration,
    events: [...registration.events, event],
  };
}

export function removeEventSubscription(
  registration: WebhookRegistration,
  event: WebhookEventType
): WebhookRegistration {
  return {
    ...registration,
    events: registration.events.filter((e) => e !== event),
  };
}

export function toggleWebhook(registration: WebhookRegistration): WebhookRegistration {
  return {
    ...registration,
    isActive: !registration.isActive,
  };
}

// =============================================================================
// Rate Limiting
// =============================================================================

const rateLimitStore = new Map<string, ConnectorRateLimit>();

export function getRateLimitConfig(integrationId: string): { maxRequests: number; windowMs: number } {
  const limits: Record<string, { maxRequests: number; windowMs: number }> = {
    mangomint: { maxRequests: 300, windowMs: 60000 },
    square: { maxRequests: 600, windowMs: 60000 },
    stripe: { maxRequests: 100, windowMs: 1000 },
    twilio: { maxRequests: 100, windowMs: 1000 },
    mailchimp: { maxRequests: 10, windowMs: 1000 },
    klaviyo: { maxRequests: 75, windowMs: 60000 },
    quickbooks: { maxRequests: 500, windowMs: 60000 },
    claude: { maxRequests: 60, windowMs: 60000 },
    openai: { maxRequests: 60, windowMs: 60000 },
    default: { maxRequests: 100, windowMs: 60000 },
  };

  return limits[integrationId] || limits.default;
}

export function checkRateLimit(
  tenantId: string,
  integrationId: string
): { allowed: boolean; remaining: number; resetAt: string } {
  const key = `${tenantId}:${integrationId}`;
  const config = getRateLimitConfig(integrationId);
  const now = Date.now();

  let limit = rateLimitStore.get(key);

  if (!limit || new Date(limit.resetAt).getTime() <= now) {
    limit = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      currentCount: 0,
      resetAt: new Date(now + config.windowMs).toISOString(),
    };
    rateLimitStore.set(key, limit);
  }

  const remaining = limit.maxRequests - limit.currentCount;
  const allowed = remaining > 0;

  if (allowed) {
    limit.currentCount++;
    rateLimitStore.set(key, limit);
  }

  return {
    allowed,
    remaining: Math.max(0, remaining - (allowed ? 1 : 0)),
    resetAt: limit.resetAt,
  };
}

export function resetRateLimit(tenantId: string, integrationId: string): void {
  const key = `${tenantId}:${integrationId}`;
  rateLimitStore.delete(key);
}

// =============================================================================
// Error Handling and Retry
// =============================================================================

export class ConnectorError extends Error {
  code: string;
  statusCode: number;
  retryable: boolean;
  retryAfterMs: number | null;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    retryAfterMs: number | null = null
  ) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ConnectorError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('econnreset') || message.includes('socket hang up')) {
      return true;
    }
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  let delay = policy.initialDelayMs;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === policy.maxRetries || !isRetryableError(error)) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelayMs);
    }
  }

  throw lastError;
}

export function classifyHttpError(statusCode: number): ConnectorError {
  const errorMap: Record<number, { code: string; message: string; retryable: boolean }> = {
    400: { code: 'BAD_REQUEST', message: 'Invalid request sent to integration', retryable: false },
    401: { code: 'UNAUTHORIZED', message: 'Authentication failed. Check your credentials', retryable: false },
    403: { code: 'FORBIDDEN', message: 'Insufficient permissions for this operation', retryable: false },
    404: { code: 'NOT_FOUND', message: 'The requested resource was not found', retryable: false },
    409: { code: 'CONFLICT', message: 'Resource conflict detected', retryable: false },
    429: { code: 'RATE_LIMITED', message: 'Rate limit exceeded. Try again later', retryable: true },
    500: { code: 'INTERNAL_ERROR', message: 'Integration server error', retryable: true },
    502: { code: 'BAD_GATEWAY', message: 'Integration gateway error', retryable: true },
    503: { code: 'SERVICE_UNAVAILABLE', message: 'Integration service temporarily unavailable', retryable: true },
    504: { code: 'GATEWAY_TIMEOUT', message: 'Integration gateway timeout', retryable: true },
  };

  const info = errorMap[statusCode] || {
    code: 'UNKNOWN_ERROR',
    message: `Unexpected HTTP ${statusCode} response`,
    retryable: statusCode >= 500,
  };

  return new ConnectorError(info.code, info.message, statusCode, info.retryable);
}

// =============================================================================
// Connection Health Check
// =============================================================================

export async function checkConnectionHealth(
  instance: IntegrationInstance,
  testEndpoint: string
): Promise<{
  healthy: boolean;
  responseTimeMs: number;
  message: string;
}> {
  const start = Date.now();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (instance.credentials.accessToken) {
      headers['Authorization'] = `Bearer ${instance.credentials.accessToken}`;
    } else if (instance.credentials.apiKey) {
      headers['Authorization'] = `Bearer ${instance.credentials.apiKey}`;
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const responseTimeMs = Date.now() - start;

    if (response.ok) {
      return { healthy: true, responseTimeMs, message: 'Connection healthy' };
    }

    return {
      healthy: false,
      responseTimeMs,
      message: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Connection check failed';
    return { healthy: false, responseTimeMs, message };
  }
}

// =============================================================================
// Data Sync Framework
// =============================================================================

export async function performSync(
  instance: IntegrationInstance,
  mode: SyncMode,
  fetchData: (cursor: string | null) => Promise<{
    records: Record<string, unknown>[];
    nextCursor: string | null;
    hasMore: boolean;
  }>,
  processRecord: (record: Record<string, unknown>) => Promise<{
    action: 'created' | 'updated' | 'skipped';
    error: string | null;
  }>
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  let cursor: string | null = null;
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  let recordsFailed = 0;
  const errors: SyncError[] = [];

  try {
    let hasMore = true;

    while (hasMore) {
      // Rate limit check
      const rateCheck = checkRateLimit(instance.tenantId, instance.integrationId);
      if (!rateCheck.allowed) {
        const waitMs = new Date(rateCheck.resetAt).getTime() - Date.now();
        if (waitMs > 0 && waitMs < 60000) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          throw new ConnectorError('RATE_LIMITED', 'Rate limit exceeded during sync', 429, true);
        }
      }

      const page = await fetchData(cursor);

      for (const record of page.records) {
        recordsProcessed++;

        try {
          const result = await processRecord(record);

          switch (result.action) {
            case 'created':
              recordsCreated++;
              break;
            case 'updated':
              recordsUpdated++;
              break;
            case 'skipped':
              recordsSkipped++;
              break;
          }

          if (result.error) {
            recordsFailed++;
            errors.push({
              recordId: String((record as Record<string, unknown>).id || recordsProcessed),
              field: null,
              message: result.error,
              code: 'PROCESS_ERROR',
            });
          }
        } catch (error) {
          recordsFailed++;
          errors.push({
            recordId: String((record as Record<string, unknown>).id || recordsProcessed),
            field: null,
            message: error instanceof Error ? error.message : 'Unknown processing error',
            code: 'PROCESS_EXCEPTION',
          });
        }
      }

      cursor = page.nextCursor;
      hasMore = page.hasMore && mode !== 'full'; // Full sync processes all pages regardless

      if (mode === 'full') {
        hasMore = page.hasMore;
      }
    }
  } catch (error) {
    errors.push({
      recordId: 'SYNC',
      field: null,
      message: error instanceof Error ? error.message : 'Sync failed',
      code: 'SYNC_ERROR',
    });
  }

  const completedAt = new Date().toISOString();

  return {
    mode,
    recordsProcessed,
    recordsCreated,
    recordsUpdated,
    recordsSkipped,
    recordsFailed,
    errors,
    startedAt,
    completedAt,
    durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
  };
}

// =============================================================================
// Authenticated Request Helper
// =============================================================================

export async function authenticatedRequest(
  url: string,
  instance: IntegrationInstance,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'RaniOS/1.0',
    ...options.headers,
  };

  if (instance.credentials.accessToken) {
    headers['Authorization'] = `Bearer ${instance.credentials.accessToken}`;
  } else if (instance.credentials.apiKey) {
    headers['Authorization'] = `Bearer ${instance.credentials.apiKey}`;
  }

  const rateCheck = checkRateLimit(instance.tenantId, instance.integrationId);
  if (!rateCheck.allowed) {
    throw new ConnectorError(
      'RATE_LIMITED',
      `Rate limit reached. Resets at ${rateCheck.resetAt}`,
      429,
      true
    );
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw classifyHttpError(response.status);
  }

  return response;
}

// =============================================================================
// Batch Operations
// =============================================================================

export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize?: number; delayBetweenBatchesMs?: number } = {}
): Promise<{ results: R[]; errors: Array<{ index: number; error: string }> }> {
  const batchSize = options.batchSize || 10;
  const delay = options.delayBetweenBatchesMs || 100;
  const results: R[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((item) => processor(item))
    );

    batchResults.forEach((result, batchIndex) => {
      const globalIndex = i + batchIndex;
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          index: globalIndex,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });

    // Delay between batches to respect rate limits
    if (i + batchSize < items.length && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { results, errors };
}
