/**
 * RaniOS SDK Client
 *
 * Main client class for programmatic access to the RaniOS platform.
 * Handles authentication, rate limiting, retry logic, and error typing.
 *
 * @example
 * ```ts
 * import { RaniOSClient } from '@/lib/sdk';
 *
 * const client = new RaniOSClient({
 *   apiKey: 'rani_live_abc123...',
 *   tenantId: 'rani-beauty-clinic',
 * });
 *
 * const kpis = await client.revenue.getKPIs();
 * ```
 */

import { ClientsResource } from './resources/clients';
import { AppointmentsResource } from './resources/appointments';
import { RevenueResource } from './resources/revenue';
import { ScheduleResource } from './resources/schedule';
import { InventoryResource } from './resources/inventory';
import { LoyaltyResource } from './resources/loyalty';
import { ReferralsResource } from './resources/referrals';
import { AIResource } from './resources/ai';
import { TemplatesResource } from './resources/templates';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RaniOSClientConfig {
  /** API key (starts with rani_live_ or rani_test_) */
  apiKey: string;
  /** Tenant identifier (slug) */
  tenantId: string;
  /** Base URL override (defaults to production) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Max retries on transient errors (default: 3) */
  maxRetries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export interface SDKRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip retry logic for this request */
  noRetry?: boolean;
}

export interface SDKResponse<T = unknown> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    rateLimit: {
      limit: number;
      remaining: number;
      resetAt: string;
    };
  };
}

export interface SDKPaginatedResponse<T = unknown> extends SDKResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SDKListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Error Types ────────────────────────────────────────────────────────────

export type SDKErrorCode =
  | 'authentication_error'
  | 'authorization_error'
  | 'not_found'
  | 'validation_error'
  | 'rate_limit_exceeded'
  | 'tenant_not_found'
  | 'feature_not_available'
  | 'internal_error'
  | 'network_error'
  | 'timeout_error'
  | 'conflict'
  | 'unprocessable_entity';

export class RaniOSError extends Error {
  readonly code: SDKErrorCode;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: SDKErrorCode,
    status: number,
    options?: {
      requestId?: string;
      details?: Record<string, unknown>;
      retryable?: boolean;
    },
  ) {
    super(message);
    this.name = 'RaniOSError';
    this.code = code;
    this.status = status;
    this.requestId = options?.requestId;
    this.details = options?.details;
    this.retryable = options?.retryable ?? false;
  }
}

export class AuthenticationError extends RaniOSError {
  constructor(message = 'Invalid or expired API key', requestId?: string) {
    super(message, 'authentication_error', 401, { requestId, retryable: false });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends RaniOSError {
  constructor(message = 'Insufficient permissions for this operation', requestId?: string) {
    super(message, 'authorization_error', 403, { requestId, retryable: false });
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends RaniOSError {
  constructor(resource: string, id: string, requestId?: string) {
    super(`${resource} with id '${id}' not found`, 'not_found', 404, { requestId, retryable: false });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends RaniOSError {
  readonly fields: Record<string, string[]>;
  constructor(message: string, fields: Record<string, string[]>, requestId?: string) {
    super(message, 'validation_error', 400, { requestId, details: fields, retryable: false });
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class RateLimitError extends RaniOSError {
  readonly retryAfter: number;
  constructor(retryAfter: number, requestId?: string) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      'rate_limit_exceeded',
      429,
      { requestId, retryable: true },
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class FeatureNotAvailableError extends RaniOSError {
  readonly requiredTier: string;
  constructor(feature: string, requiredTier: string, requestId?: string) {
    super(
      `Feature '${feature}' requires the ${requiredTier} tier or above.`,
      'feature_not_available',
      402,
      { requestId, retryable: false },
    );
    this.name = 'FeatureNotAvailableError';
    this.requiredTier = requiredTier;
  }
}

// ─── Rate Limiter ───────────────────────────────────────────────────────────

interface RateLimitState {
  remaining: number;
  resetAt: number;
  limit: number;
}

class ClientRateLimiter {
  private state: RateLimitState = { remaining: 60, resetAt: 0, limit: 60 };
  private queue: Array<{ resolve: () => void }> = [];
  private processing = false;

  update(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const limit = headers.get('x-ratelimit-limit');

    if (remaining !== null) this.state.remaining = parseInt(remaining, 10);
    if (reset !== null) this.state.resetAt = Date.now() + parseInt(reset, 10) * 1000;
    if (limit !== null) this.state.limit = parseInt(limit, 10);
  }

  async acquire(): Promise<void> {
    if (this.state.remaining > 0) {
      this.state.remaining--;
      return;
    }

    const waitMs = Math.max(0, this.state.resetAt - Date.now());
    if (waitMs > 0) {
      return new Promise<void>((resolve) => {
        this.queue.push({ resolve });
        if (!this.processing) this.processQueue(waitMs);
      });
    }

    // Reset window has passed, reset state
    this.state.remaining = this.state.limit - 1;
  }

  private processQueue(waitMs: number): void {
    this.processing = true;
    setTimeout(() => {
      this.state.remaining = this.state.limit;
      const batch = this.queue.splice(0, this.state.limit);
      batch.forEach(({ resolve }) => {
        this.state.remaining--;
        resolve();
      });
      this.processing = false;
      if (this.queue.length > 0) {
        this.processQueue(60_000); // Next window
      }
    }, waitMs);
  }

  getState(): RateLimitState {
    return { ...this.state };
  }
}

// ─── Client ─────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://api.ranios.com/v1';
const SDK_VERSION = '1.0.0';
const USER_AGENT = `ranios-sdk-ts/${SDK_VERSION}`;

export class RaniOSClient {
  private readonly config: Required<RaniOSClientConfig>;
  private readonly rateLimiter: ClientRateLimiter;

  // Resource namespaces
  readonly clients: ClientsResource;
  readonly appointments: AppointmentsResource;
  readonly revenue: RevenueResource;
  readonly schedule: ScheduleResource;
  readonly inventory: InventoryResource;
  readonly loyalty: LoyaltyResource;
  readonly referrals: ReferralsResource;
  readonly ai: AIResource;
  readonly templates: TemplatesResource;

  constructor(config: RaniOSClientConfig) {
    if (!config.apiKey) {
      throw new RaniOSError('API key is required', 'authentication_error', 401);
    }
    if (!config.tenantId) {
      throw new RaniOSError('Tenant ID is required', 'validation_error', 400);
    }

    this.config = {
      apiKey: config.apiKey,
      tenantId: config.tenantId,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      debug: config.debug ?? false,
    };

    this.rateLimiter = new ClientRateLimiter();

    // Initialize resource namespaces
    this.clients = new ClientsResource(this);
    this.appointments = new AppointmentsResource(this);
    this.revenue = new RevenueResource(this);
    this.schedule = new ScheduleResource(this);
    this.inventory = new InventoryResource(this);
    this.loyalty = new LoyaltyResource(this);
    this.referrals = new ReferralsResource(this);
    this.ai = new AIResource(this);
    this.templates = new TemplatesResource(this);
  }

  /** Get the current client configuration (redacted API key) */
  getConfig(): Omit<Required<RaniOSClientConfig>, 'apiKey'> & { apiKey: string } {
    return {
      ...this.config,
      apiKey: `${this.config.apiKey.slice(0, 12)}...${this.config.apiKey.slice(-4)}`,
    };
  }

  /** Get current rate limit state */
  getRateLimitState() {
    return this.rateLimiter.getState();
  }

  /**
   * Core request method used by all resource classes.
   * Handles authentication, rate limiting, retries, and error mapping.
   */
  async request<T>(path: string, options: SDKRequestOptions = {}): Promise<SDKResponse<T>> {
    const { method = 'GET', body, params, headers = {}, signal, noRetry } = options;

    // Build URL with query params
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }

    // Wait for rate limit
    await this.rateLimiter.acquire();

    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Tenant-Id': this.config.tenantId,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'X-SDK-Version': SDK_VERSION,
      ...headers,
    };

    const maxAttempts = noRetry ? 1 : this.config.maxRetries + 1;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        if (this.config.debug) {
          console.log(`[RaniOS SDK] ${method} ${url.pathname} (attempt ${attempt}/${maxAttempts})`);
        }

        const response = await fetch(url.toString(), {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: signal ?? controller.signal,
        });

        clearTimeout(timeout);

        // Update rate limit state from response headers
        this.rateLimiter.update(response.headers);

        // Handle errors
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const requestId = response.headers.get('x-request-id') ?? undefined;
          const error = this.mapError(response.status, errorBody, requestId);

          // Retry on transient errors
          if (error.retryable && attempt < maxAttempts) {
            const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
            const jitter = Math.random() * 500;
            if (this.config.debug) {
              console.log(`[RaniOS SDK] Retrying in ${backoff + jitter}ms...`);
            }
            await this.sleep(backoff + jitter);
            lastError = error;
            continue;
          }

          throw error;
        }

        // Parse successful response
        const result = await response.json();
        return {
          data: result.data as T,
          meta: {
            requestId: response.headers.get('x-request-id') ?? crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            rateLimit: {
              limit: this.rateLimiter.getState().limit,
              remaining: this.rateLimiter.getState().remaining,
              resetAt: new Date(this.rateLimiter.getState().resetAt).toISOString(),
            },
          },
        };
      } catch (err) {
        if (err instanceof RaniOSError) throw err;

        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new RaniOSError('Request timed out', 'timeout_error', 408, { retryable: true });
        }

        lastError = err as Error;

        if (attempt < maxAttempts) {
          const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 10_000);
          await this.sleep(backoff);
          continue;
        }
      }
    }

    throw new RaniOSError(
      `Network error after ${maxAttempts} attempts: ${lastError?.message ?? 'Unknown error'}`,
      'network_error',
      0,
      { retryable: false },
    );
  }

  /** Make a paginated list request */
  async requestList<T>(
    path: string,
    params?: SDKListParams & Record<string, string | number | boolean | undefined>,
  ): Promise<SDKPaginatedResponse<T>> {
    const response = await this.request<T[]>(path, { params: params as SDKRequestOptions['params'] });
    return {
      ...response,
      pagination: {
        page: Number(params?.page ?? 1),
        pageSize: Number(params?.pageSize ?? 25),
        total: Array.isArray(response.data) ? response.data.length : 0,
        totalPages: 1,
        hasMore: false,
      },
    };
  }

  private mapError(
    status: number,
    body: Record<string, unknown>,
    requestId?: string,
  ): RaniOSError {
    const message = (body.error as string) ?? (body.message as string) ?? 'Unknown error';

    switch (status) {
      case 401:
        return new AuthenticationError(message, requestId);
      case 403:
        return new AuthorizationError(message, requestId);
      case 404:
        return new NotFoundError(
          (body.resource as string) ?? 'Resource',
          (body.id as string) ?? 'unknown',
          requestId,
        );
      case 400:
        return new ValidationError(
          message,
          (body.fields as Record<string, string[]>) ?? {},
          requestId,
        );
      case 402:
        return new FeatureNotAvailableError(
          (body.feature as string) ?? 'unknown',
          (body.requiredTier as string) ?? 'professional',
          requestId,
        );
      case 429: {
        const retryAfter = (body.retryAfter as number) ?? 60;
        return new RateLimitError(retryAfter, requestId);
      }
      case 409:
        return new RaniOSError(message, 'conflict', 409, { requestId, retryable: false });
      case 422:
        return new RaniOSError(message, 'unprocessable_entity', 422, { requestId, retryable: false });
      case 500:
      case 502:
      case 503:
      case 504:
        return new RaniOSError(message, 'internal_error', status, { requestId, retryable: true });
      default:
        return new RaniOSError(message, 'internal_error', status, { requestId, retryable: false });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
