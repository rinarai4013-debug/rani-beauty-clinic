/**
 * RaniOS SDK - Client Tests
 *
 * Tests for the core RaniOSClient class including:
 * - Constructor validation
 * - Request building and authentication
 * - Rate limiting
 * - Retry logic with exponential backoff
 * - Error mapping and typed errors
 * - Timeout handling
 * - Pagination
 * - Config access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RaniOSClient,
  RaniOSError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  FeatureNotAvailableError,
} from '../client';

// ─── Mock fetch ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      'x-request-id': 'req_test123',
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '59',
      'x-ratelimit-reset': '60',
      ...headers,
    }),
    json: vi.fn().mockResolvedValue(data),
  };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

const validConfig = {
  apiKey: 'rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  tenantId: 'test-clinic',
  baseUrl: 'https://api.test.ranios.com/v1',
  maxRetries: 0, // Disable retry for most tests
};

let client: RaniOSClient;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  client = new RaniOSClient(validConfig);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Constructor Tests ──────────────────────────────────────────────────────

describe('RaniOSClient constructor', () => {
  it('should create client with valid config', () => {
    const c = new RaniOSClient(validConfig);
    expect(c).toBeInstanceOf(RaniOSClient);
  });

  it('should throw on missing apiKey', () => {
    expect(() => new RaniOSClient({ apiKey: '', tenantId: 'test' })).toThrow(RaniOSError);
    expect(() => new RaniOSClient({ apiKey: '', tenantId: 'test' })).toThrow('API key is required');
  });

  it('should throw on missing tenantId', () => {
    expect(() => new RaniOSClient({ apiKey: 'rani_live_abc', tenantId: '' })).toThrow('Tenant ID is required');
  });

  it('should use default baseUrl when not provided', () => {
    const c = new RaniOSClient({ apiKey: 'rani_live_abc123', tenantId: 'test' });
    const config = c.getConfig();
    expect(config.baseUrl).toBe('https://api.ranios.com/v1');
  });

  it('should use default timeout of 30000ms', () => {
    const c = new RaniOSClient({ apiKey: 'rani_live_abc123', tenantId: 'test' });
    const config = c.getConfig();
    expect(config.timeout).toBe(30000);
  });

  it('should use default maxRetries of 3', () => {
    const c = new RaniOSClient({ apiKey: 'rani_live_abc123', tenantId: 'test' });
    const config = c.getConfig();
    expect(config.maxRetries).toBe(3);
  });

  it('should accept custom config values', () => {
    const c = new RaniOSClient({
      apiKey: 'rani_live_abc123',
      tenantId: 'my-clinic',
      baseUrl: 'https://custom.api.com/v2',
      timeout: 10000,
      maxRetries: 5,
      debug: true,
    });
    const config = c.getConfig();
    expect(config.baseUrl).toBe('https://custom.api.com/v2');
    expect(config.timeout).toBe(10000);
    expect(config.maxRetries).toBe(5);
    expect(config.debug).toBe(true);
  });
});

// ─── Config Tests ───────────────────────────────────────────────────────────

describe('getConfig', () => {
  it('should redact API key', () => {
    const config = client.getConfig();
    expect(config.apiKey).toContain('...');
    expect(config.apiKey).not.toContain('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
  });

  it('should show tenantId', () => {
    const config = client.getConfig();
    expect(config.tenantId).toBe('test-clinic');
  });
});

// ─── Resource Initialization ────────────────────────────────────────────────

describe('resource namespaces', () => {
  it('should initialize all resource namespaces', () => {
    expect(client.clients).toBeDefined();
    expect(client.appointments).toBeDefined();
    expect(client.revenue).toBeDefined();
    expect(client.schedule).toBeDefined();
    expect(client.inventory).toBeDefined();
    expect(client.loyalty).toBeDefined();
    expect(client.referrals).toBeDefined();
    expect(client.ai).toBeDefined();
    expect(client.templates).toBeDefined();
  });
});

// ─── Request Tests ──────────────────────────────────────────────────────────

describe('request', () => {
  it('should send correct headers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    await client.request('/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe(`Bearer ${validConfig.apiKey}`);
    expect(options.headers['X-Tenant-Id']).toBe('test-clinic');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['User-Agent']).toContain('ranios-sdk-ts');
  });

  it('should build URL with base path', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    await client.request('/clients');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('https://api.test.ranios.com/v1/clients');
  });

  it('should append query parameters', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    await client.request('/clients', {
      params: { status: 'active', page: 1, includeAll: true },
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('status=active');
    expect(url).toContain('page=1');
    expect(url).toContain('includeAll=true');
  });

  it('should skip undefined query params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    await client.request('/clients', {
      params: { status: 'active', segment: undefined },
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('status=active');
    expect(url).not.toContain('segment');
  });

  it('should send JSON body for POST requests', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    const body = { name: 'Test', value: 42 };
    await client.request('/test', { method: 'POST', body });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(body));
  });

  it('should parse response data correctly', async () => {
    const responseData = { id: '123', name: 'Test Client' };
    mockFetch.mockResolvedValueOnce(mockResponse({ data: responseData }));

    const result = await client.request('/clients/123');

    expect(result.data).toEqual(responseData);
    expect(result.meta.requestId).toBe('req_test123');
    expect(result.meta.timestamp).toBeTruthy();
    expect(result.meta.rateLimit).toBeDefined();
  });

  it('should include rate limit info in meta', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: {} }, 200, {
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '42',
      }),
    );

    const result = await client.request('/test');
    expect(result.meta.rateLimit.limit).toBe(60);
  });
});

// ─── Error Mapping Tests ────────────────────────────────────────────────────

describe('error mapping', () => {
  it('should throw AuthenticationError on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Invalid API key' }, 401),
    );

    await expect(client.request('/test')).rejects.toThrow(AuthenticationError);
  });

  it('should throw AuthorizationError on 403', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Forbidden' }, 403),
    );

    await expect(client.request('/test')).rejects.toThrow(AuthorizationError);
  });

  it('should throw NotFoundError on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Not found', resource: 'Client', id: 'abc' }, 404),
    );

    await expect(client.request('/test')).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError on 400 with fields', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { error: 'Validation failed', fields: { name: ['required'] } },
        400,
      ),
    );

    try {
      await client.request('/test');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fields).toEqual({ name: ['required'] });
    }
  });

  it('should throw RateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Rate limited', retryAfter: 30 }, 429),
    );

    try {
      await client.request('/test');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(30);
    }
  });

  it('should throw FeatureNotAvailableError on 402', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { error: 'Upgrade needed', feature: 'churn', requiredTier: 'professional' },
        402,
      ),
    );

    try {
      await client.request('/test');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(FeatureNotAvailableError);
      expect((err as FeatureNotAvailableError).requiredTier).toBe('professional');
    }
  });

  it('should map 500 as retryable internal error', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Server error' }, 500),
    );

    try {
      await client.request('/test');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RaniOSError);
      expect((err as RaniOSError).code).toBe('internal_error');
      expect((err as RaniOSError).retryable).toBe(true);
    }
  });

  it('should include requestId in errors', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Not found' }, 404),
    );

    try {
      await client.request('/test');
    } catch (err) {
      expect((err as RaniOSError).requestId).toBe('req_test123');
    }
  });
});

// ─── Retry Tests ────────────────────────────────────────────────────────────

describe('retry logic', () => {
  it('should retry on 500 errors', async () => {
    const retryClient = new RaniOSClient({ ...validConfig, maxRetries: 2 });

    mockFetch
      .mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500))
      .mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500))
      .mockResolvedValueOnce(mockResponse({ data: { ok: true } }));

    const result = await retryClient.request('/test');
    expect(result.data).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 400 errors', async () => {
    const retryClient = new RaniOSClient({ ...validConfig, maxRetries: 2 });

    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Bad request' }, 400),
    );

    await expect(retryClient.request('/test')).rejects.toThrow(ValidationError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should not retry on 401 errors', async () => {
    const retryClient = new RaniOSClient({ ...validConfig, maxRetries: 2 });

    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Unauthorized' }, 401),
    );

    await expect(retryClient.request('/test')).rejects.toThrow(AuthenticationError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should respect noRetry option', async () => {
    const retryClient = new RaniOSClient({ ...validConfig, maxRetries: 3 });

    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: 'Server error' }, 500),
    );

    await expect(
      retryClient.request('/test', { noRetry: true }),
    ).rejects.toThrow(RaniOSError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ─── Pagination Tests ───────────────────────────────────────────────────────

describe('requestList', () => {
  it('should return paginated response', async () => {
    const items = [{ id: '1' }, { id: '2' }];
    mockFetch.mockResolvedValueOnce(mockResponse({ data: items }));

    const result = await client.requestList('/clients', { page: 1, pageSize: 25 });

    expect(result.data).toEqual(items);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(25);
    expect(result.pagination.total).toBe(2);
  });

  it('should use default pagination params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

    const result = await client.requestList('/clients');

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(25);
  });
});

// ─── Rate Limit State ───────────────────────────────────────────────────────

describe('rate limit state', () => {
  it('should track rate limit state from responses', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: {} }, 200, {
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '42',
        'x-ratelimit-reset': '30',
      }),
    );

    await client.request('/test');

    const state = client.getRateLimitState();
    expect(state.limit).toBe(60);
    // remaining decremented by pre-request acquire
    expect(state.remaining).toBeLessThanOrEqual(42);
  });
});

// ─── RaniOSError class tests ────────────────────────────────────────────────

describe('RaniOSError', () => {
  it('should have correct name and properties', () => {
    const error = new RaniOSError('Test error', 'internal_error', 500, {
      requestId: 'req_123',
      retryable: true,
    });

    expect(error.name).toBe('RaniOSError');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('internal_error');
    expect(error.status).toBe(500);
    expect(error.requestId).toBe('req_123');
    expect(error.retryable).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it('should default retryable to false', () => {
    const error = new RaniOSError('Test', 'validation_error', 400);
    expect(error.retryable).toBe(false);
  });
});
