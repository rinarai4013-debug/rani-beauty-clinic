/**
 * API Gateway Router Tests — 40+ tests
 */

import {
  identifyTenant,
  checkRateLimit,
  getRateLimitHeaders,
  getCircuitBreaker,
  recordCircuitSuccess,
  recordCircuitFailure,
  canMakeRequest,
  getCorsHeaders,
  setTenantCors,
  getCachedResponse,
  setCachedResponse,
  buildCacheKey,
  logRequest,
  getRequestLogs,
  registerRoute,
  resolveRoute,
  getRegisteredRoutes,
  extractVersion,
  generateRequestId,
  getHealthStatus,
  processGatewayRequest,
  getGatewayStats,
  initializeDefaultRoutes,
  resetGateway,
  TIER_RATE_LIMITS,
  DEFAULT_CIRCUIT_BREAKER,
} from '../api-gateway/router';

beforeEach(() => {
  resetGateway();
});

// ─── Tenant Identification ────────────────────────────────────────

describe('identifyTenant', () => {
  it('identifies tenant from X-Tenant-Id header', () => {
    const result = identifyTenant({ 'x-tenant-id': 't_001' }, 'api.ranios.com');
    expect(result).toEqual({ tenantId: 't_001', source: 'header' });
  });

  it('identifies tenant from API key header', () => {
    const result = identifyTenant({ 'x-api-key': 'rani_live_glowmed_abc123' }, 'api.ranios.com');
    expect(result).toEqual({ tenantId: 'glowmed', source: 'api_key' });
  });

  it('identifies tenant from subdomain', () => {
    const result = identifyTenant({}, 'glow-medical.ranios.com');
    expect(result).toEqual({ tenantId: 'glow-medical', source: 'subdomain' });
  });

  it('ignores www subdomain', () => {
    const result = identifyTenant({}, 'www.ranios.com');
    expect(result).toEqual({ tenantId: null, source: null });
  });

  it('ignores api subdomain', () => {
    const result = identifyTenant({}, 'api.ranios.com');
    expect(result).toEqual({ tenantId: null, source: null });
  });

  it('returns null when no tenant can be identified', () => {
    const result = identifyTenant({}, 'ranios.com');
    expect(result).toEqual({ tenantId: null, source: null });
  });

  it('identifies tenant from test API key', () => {
    const result = identifyTenant({ 'x-api-key': 'rani_test_mytest_xyz789' }, 'api.ranios.com');
    expect(result).toEqual({ tenantId: 'mytest', source: 'api_key' });
  });

  it('prioritizes header over subdomain', () => {
    const result = identifyTenant({ 'x-tenant-id': 't_direct' }, 'glow.ranios.com');
    expect(result).toEqual({ tenantId: 't_direct', source: 'header' });
  });
});

// ─── Rate Limiting ────────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test:bucket', TIER_RATE_LIMITS.starter);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(result.retryAfter).toBeNull();
  });

  it('decrements remaining count', () => {
    checkRateLimit('test:decrement', TIER_RATE_LIMITS.starter);
    const result = checkRateLimit('test:decrement', TIER_RATE_LIMITS.starter);
    expect(result.remaining).toBe(98);
  });

  it('blocks when limit exceeded', () => {
    const config = { maxRequests: 2, windowMs: 60000, burstMultiplier: 1.0 };
    checkRateLimit('test:limit', config);
    checkRateLimit('test:limit', config);
    const result = checkRateLimit('test:limit', config);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('applies burst multiplier', () => {
    const config = { maxRequests: 2, windowMs: 60000, burstMultiplier: 2.0 };
    checkRateLimit('test:burst', config);
    checkRateLimit('test:burst', config);
    // Should still be allowed due to burst (2 * 2.0 = 4 max)
    const result = checkRateLimit('test:burst', config);
    expect(result.allowed).toBe(true);
  });

  it('returns correct rate limit headers', () => {
    const result = checkRateLimit('test:headers', TIER_RATE_LIMITS.pro);
    const headers = getRateLimitHeaders(result);
    expect(headers['X-RateLimit-Limit']).toBe('500');
    expect(headers['X-RateLimit-Remaining']).toBe('499');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('enterprise tier has 2000 req/min limit', () => {
    const result = checkRateLimit('test:enterprise', TIER_RATE_LIMITS.enterprise);
    expect(result.limit).toBe(2000);
    expect(result.remaining).toBe(1999);
  });
});

// ─── Circuit Breaker ──────────────────────────────────────────────

describe('circuit breaker', () => {
  it('starts in closed state', () => {
    const cb = getCircuitBreaker('test-service');
    expect(cb.state).toBe('closed');
    expect(cb.failures).toBe(0);
  });

  it('records successes', () => {
    getCircuitBreaker('success-service');
    recordCircuitSuccess('success-service');
    const cb = getCircuitBreaker('success-service');
    expect(cb.totalRequests).toBe(1);
  });

  it('opens after failure threshold', () => {
    const config = { ...DEFAULT_CIRCUIT_BREAKER, failureThreshold: 3 };
    getCircuitBreaker('fail-service', config);
    recordCircuitFailure('fail-service', config);
    recordCircuitFailure('fail-service', config);
    recordCircuitFailure('fail-service', config);
    expect(canMakeRequest('fail-service')).toBe(false);
  });

  it('blocks requests when open', () => {
    const config = { ...DEFAULT_CIRCUIT_BREAKER, failureThreshold: 1, resetTimeout: 999999 };
    getCircuitBreaker('blocked-service', config);
    recordCircuitFailure('blocked-service', config);
    expect(canMakeRequest('blocked-service')).toBe(false);
  });

  it('allows requests when closed', () => {
    getCircuitBreaker('open-service');
    expect(canMakeRequest('open-service')).toBe(true);
  });
});

// ─── CORS ─────────────────────────────────────────────────────────

describe('getCorsHeaders', () => {
  it('returns headers for tenant subdomain', () => {
    const headers = getCorsHeaders('glow', 'https://glow.ranios.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://glow.ranios.com');
  });

  it('includes tenant custom domain', () => {
    const headers = getCorsHeaders('glow', 'https://app.glowmedspa.com', 'app.glowmedspa.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://app.glowmedspa.com');
  });

  it('returns correct CORS methods', () => {
    const headers = getCorsHeaders('glow', null);
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('allows custom CORS per tenant', () => {
    setTenantCors('custom-tenant', { allowedOrigins: ['https://custom.example.com'], allowedMethods: ['GET'], allowedHeaders: [], maxAge: 3600, credentials: true });
    const headers = getCorsHeaders('custom-tenant', 'https://custom.example.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://custom.example.com');
  });
});

// ─── Caching ──────────────────────────────────────────────────────

describe('response caching', () => {
  it('returns miss for empty cache', () => {
    const result = getCachedResponse('nonexistent');
    expect(result.hit).toBe(false);
  });

  it('caches and retrieves responses', () => {
    setCachedResponse('test:cache', { data: 'hello' }, 60000);
    const result = getCachedResponse('test:cache');
    expect(result.hit).toBe(true);
    expect(result.body).toEqual({ data: 'hello' });
  });

  it('builds deterministic cache keys', () => {
    const key1 = buildCacheKey('t1', 'GET', '/api/clients', { page: '1' });
    const key2 = buildCacheKey('t1', 'GET', '/api/clients', { page: '1' });
    expect(key1).toBe(key2);
  });

  it('different tenants get different cache keys', () => {
    const key1 = buildCacheKey('t1', 'GET', '/api/clients', {});
    const key2 = buildCacheKey('t2', 'GET', '/api/clients', {});
    expect(key1).not.toBe(key2);
  });
});

// ─── Routing ──────────────────────────────────────────────────────

describe('route registry', () => {
  it('registers and resolves routes', () => {
    registerRoute({ path: '/test', method: 'GET', version: 'v1', upstream: 'https://api.test.com', requiredPermissions: [], cacheTtl: 30 });
    const route = resolveRoute('GET', 'v1', '/test');
    expect(route).not.toBeNull();
    expect(route!.upstream).toBe('https://api.test.com');
  });

  it('returns null for unknown route', () => {
    expect(resolveRoute('GET', 'v1', '/unknown')).toBeNull();
  });

  it('extracts v1 version', () => {
    const { version, cleanPath } = extractVersion('/v1/clients');
    expect(version).toBe('v1');
    expect(cleanPath).toBe('/clients');
  });

  it('extracts v2 version', () => {
    const { version, cleanPath } = extractVersion('/v2/clients');
    expect(version).toBe('v2');
    expect(cleanPath).toBe('/clients');
  });

  it('defaults to v1 for unversioned paths', () => {
    const { version } = extractVersion('/clients');
    expect(version).toBe('v1');
  });

  it('initializes default routes', () => {
    initializeDefaultRoutes();
    const routes = getRegisteredRoutes();
    expect(routes.length).toBeGreaterThan(10);
  });
});

// ─── Request Logging ──────────────────────────────────────────────

describe('request logging', () => {
  it('logs requests', () => {
    logRequest({ requestId: 'req_1', tenantId: 't_001', method: 'GET', path: '/clients', version: 'v1', status: 200, duration: 42, ip: '1.2.3.4', userAgent: 'test', apiKeyId: null, cached: false, rateLimited: false, circuitBroken: false, error: null, timestamp: Date.now() });
    const logs = getRequestLogs({ tenantId: 't_001' });
    expect(logs.length).toBe(1);
    expect(logs[0].requestId).toBe('req_1');
  });

  it('filters logs by tenant', () => {
    logRequest({ requestId: 'req_a', tenantId: 't_001', method: 'GET', path: '/', version: 'v1', status: 200, duration: 10, ip: '1.1.1.1', userAgent: '', apiKeyId: null, cached: false, rateLimited: false, circuitBroken: false, error: null, timestamp: Date.now() });
    logRequest({ requestId: 'req_b', tenantId: 't_002', method: 'GET', path: '/', version: 'v1', status: 200, duration: 10, ip: '1.1.1.1', userAgent: '', apiKeyId: null, cached: false, rateLimited: false, circuitBroken: false, error: null, timestamp: Date.now() });
    expect(getRequestLogs({ tenantId: 't_001' }).length).toBe(1);
  });
});

// ─── Health Check ─────────────────────────────────────────────────

describe('getHealthStatus', () => {
  it('returns healthy when all services are up', () => {
    const health = getHealthStatus({
      'Service A': { latency: 50, healthy: true },
      'Service B': { latency: 100, healthy: true },
    });
    expect(health.status).toBe('healthy');
  });

  it('returns unhealthy when a service is down', () => {
    const health = getHealthStatus({
      'Service A': { latency: 50, healthy: true },
      'Service B': { latency: 0, healthy: false },
    });
    expect(health.status).toBe('unhealthy');
  });

  it('returns degraded for high latency', () => {
    const health = getHealthStatus({
      'Slow Service': { latency: 3000, healthy: true },
    });
    expect(health.status).toBe('degraded');
  });

  it('includes version info', () => {
    const health = getHealthStatus({});
    expect(health.version).toBeDefined();
    expect(health.uptime).toBeGreaterThan(0);
  });
});

// ─── Request ID Generation ────────────────────────────────────────

describe('generateRequestId', () => {
  it('generates unique IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
  });

  it('starts with req_ prefix', () => {
    expect(generateRequestId()).toMatch(/^req_/);
  });
});

// ─── Gateway Processor ────────────────────────────────────────────

describe('processGatewayRequest', () => {
  beforeEach(() => {
    initializeDefaultRoutes();
  });

  it('returns 404 for unknown routes', async () => {
    const response = await processGatewayRequest({
      id: 'req_test', method: 'GET', path: '/v1/nonexistent', version: 'v1',
      headers: {}, query: {}, body: null,
      tenantContext: { tenantId: 't_001', tenantSlug: 'test', tier: 'starter', domain: null, apiKeyId: null, userId: null, permissions: [], rateLimitBucket: 'api' },
      timestamp: Date.now(), ip: '1.2.3.4', userAgent: 'test',
    });
    expect(response.status).toBe(404);
  });

  it('returns 403 for insufficient permissions', async () => {
    const response = await processGatewayRequest({
      id: 'req_test2', method: 'GET', path: '/v1/clients', version: 'v1',
      headers: {}, query: {}, body: null,
      tenantContext: { tenantId: 't_001', tenantSlug: 'test', tier: 'starter', domain: null, apiKeyId: null, userId: null, permissions: [], rateLimitBucket: 'api' },
      timestamp: Date.now(), ip: '1.2.3.4', userAgent: 'test',
    });
    expect(response.status).toBe(403);
  });

  it('processes valid request successfully', async () => {
    const response = await processGatewayRequest({
      id: 'req_test3', method: 'GET', path: '/v1/clients', version: 'v1',
      headers: {}, query: {}, body: null,
      tenantContext: { tenantId: 't_001', tenantSlug: 'test', tier: 'starter', domain: null, apiKeyId: null, userId: null, permissions: ['clients:read'], rateLimitBucket: 'api' },
      timestamp: Date.now(), ip: '1.2.3.4', userAgent: 'test',
    });
    expect(response.status).toBe(200);
    expect(response.requestId).toBe('req_test3');
  });

  it('includes request ID in response', async () => {
    const response = await processGatewayRequest({
      id: 'req_custom_id', method: 'GET', path: '/v1/clients', version: 'v1',
      headers: {}, query: {}, body: null,
      tenantContext: { tenantId: 't_001', tenantSlug: 'test', tier: 'pro', domain: null, apiKeyId: null, userId: null, permissions: ['clients:read'], rateLimitBucket: 'api' },
      timestamp: Date.now(), ip: '1.2.3.4', userAgent: 'test',
    });
    expect(response.requestId).toBe('req_custom_id');
  });
});

// ─── Gateway Stats ────────────────────────────────────────────────

describe('getGatewayStats', () => {
  it('returns zero stats when empty', () => {
    const stats = getGatewayStats();
    expect(stats.totalRequests).toBe(0);
    expect(stats.avgLatency).toBe(0);
    expect(stats.errorRate).toBe(0);
  });

  it('calculates stats after requests', () => {
    logRequest({ requestId: 'r1', tenantId: 't1', method: 'GET', path: '/test', version: 'v1', status: 200, duration: 50, ip: '', userAgent: '', apiKeyId: null, cached: false, rateLimited: false, circuitBroken: false, error: null, timestamp: Date.now() });
    logRequest({ requestId: 'r2', tenantId: 't1', method: 'GET', path: '/test', version: 'v1', status: 500, duration: 150, ip: '', userAgent: '', apiKeyId: null, cached: false, rateLimited: false, circuitBroken: false, error: 'err', timestamp: Date.now() });
    const stats = getGatewayStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.avgLatency).toBe(100);
    expect(stats.errorRate).toBe(50);
  });
});
