/**
 * RaniOS API Gateway Router
 *
 * Routes all tenant API calls through a centralized gateway with:
 * - Tenant identification (subdomain/header/JWT)
 * - Rate limiting per tenant per tier
 * - Request logging with tenant context
 * - API versioning (v1, v2)
 * - CORS per tenant
 * - Request/response transformation
 * - Circuit breaker per upstream service
 * - Health check endpoints
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type TenantTier = 'starter' | 'pro' | 'enterprise';

export type ApiVersion = 'v1' | 'v2';

export type CircuitState = 'closed' | 'half_open' | 'open';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tier: TenantTier;
  domain: string | null;
  apiKeyId: string | null;
  userId: string | null;
  permissions: string[];
  rateLimitBucket: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstMultiplier: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number | null;
  limit: number;
}

export interface GatewayRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  version: ApiVersion;
  upstream: string;
  requiredPermissions: string[];
  rateLimit?: Partial<RateLimitConfig>;
  cacheTtl?: number;
  transformRequest?: (body: unknown) => unknown;
  transformResponse?: (body: unknown) => unknown;
  timeout?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxRequests: number;
  monitorWindow: number;
}

export interface CircuitBreakerState {
  service: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  nextRetry: number | null;
  totalRequests: number;
  totalFailures: number;
}

export interface GatewayRequest {
  id: string;
  method: string;
  path: string;
  version: ApiVersion;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  tenantContext: TenantContext;
  timestamp: number;
  ip: string;
  userAgent: string;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  cached: boolean;
  requestId: string;
}

export interface GatewayLog {
  requestId: string;
  tenantId: string;
  method: string;
  path: string;
  version: ApiVersion;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  apiKeyId: string | null;
  cached: boolean;
  rateLimited: boolean;
  circuitBroken: boolean;
  error: string | null;
  timestamp: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
  timestamp: number;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'degraded' | 'down';
  latency: number;
  lastChecked: number;
  circuitState: CircuitState;
  errorRate: number;
}

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

// ─── Schemas ──────────────────────────────────────────────────────

export const GatewayRouteSchema = z.object({
  path: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  version: z.enum(['v1', 'v2']),
  upstream: z.string().url(),
  requiredPermissions: z.array(z.string()),
  cacheTtl: z.number().int().min(0).optional(),
  timeout: z.number().int().min(100).max(30000).optional(),
});

// ─── Constants ────────────────────────────────────────────────────

export const TIER_RATE_LIMITS: Record<TenantTier, RateLimitConfig> = {
  starter: { maxRequests: 100, windowMs: 60_000, burstMultiplier: 1.2 },
  pro: { maxRequests: 500, windowMs: 60_000, burstMultiplier: 1.5 },
  enterprise: { maxRequests: 2000, windowMs: 60_000, burstMultiplier: 2.0 },
};

export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30_000,
  halfOpenMaxRequests: 3,
  monitorWindow: 60_000,
};

const DEFAULT_CORS: CorsConfig = {
  allowedOrigins: [],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Api-Key', 'X-Request-Id'],
  maxAge: 86400,
  credentials: true,
};

const API_VERSION = '2.0.0';
const startTime = Date.now();

// ─── In-Memory Stores ─────────────────────────────────────────────

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const circuitBreakers = new Map<string, CircuitBreakerState>();
const requestLogs: GatewayLog[] = [];
const responseCache = new Map<string, { body: unknown; expiry: number }>();
const tenantCorsCache = new Map<string, CorsConfig>();

// ─── Tenant Identification ────────────────────────────────────────

export function identifyTenant(
  headers: Record<string, string>,
  hostname: string,
): { tenantId: string | null; source: 'subdomain' | 'header' | 'jwt' | 'api_key' | null } {
  // 1. Check X-Tenant-Id header
  const headerTenantId = headers['x-tenant-id'];
  if (headerTenantId) {
    return { tenantId: headerTenantId, source: 'header' };
  }

  // 2. Check API key header
  const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
  if (apiKey && (apiKey.startsWith('rani_live_') || apiKey.startsWith('rani_test_'))) {
    return { tenantId: extractTenantFromApiKey(apiKey), source: 'api_key' };
  }

  // 3. Check JWT token
  const authHeader = headers['authorization'];
  if (authHeader?.startsWith('Bearer ') && !apiKey?.startsWith('rani_')) {
    const tenantId = extractTenantFromJwt(authHeader.replace('Bearer ', ''));
    if (tenantId) return { tenantId, source: 'jwt' };
  }

  // 4. Check subdomain
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    return { tenantId: subdomain, source: 'subdomain' };
  }

  return { tenantId: null, source: null };
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    return parts[0];
  }
  return null;
}

function extractTenantFromApiKey(key: string): string | null {
  // Format: rani_live_<tenantId>_<random> or rani_test_<tenantId>_<random>
  const parts = key.split('_');
  if (parts.length >= 4) {
    return parts[2];
  }
  return null;
}

function extractTenantFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.tenantId || payload.tenant_id || null;
  } catch {
    return null;
  }
}

// ─── Rate Limiting ────────────────────────────────────────────────

export function checkRateLimit(
  bucketKey: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey);

  // Clean expired bucket
  if (bucket && bucket.resetAt <= now) {
    rateLimitBuckets.delete(bucketKey);
  }

  const current = rateLimitBuckets.get(bucketKey);
  const burstLimit = Math.floor(config.maxRequests * config.burstMultiplier);

  if (!current) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      retryAfter: null,
      limit: config.maxRequests,
    };
  }

  if (current.count >= burstLimit) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfter: retryAfter > 0 ? retryAfter : 1,
      limit: config.maxRequests,
    };
  }

  current.count += 1;
  const remaining = Math.max(0, config.maxRequests - current.count);

  return {
    allowed: true,
    remaining,
    resetAt: current.resetAt,
    retryAfter: null,
    limit: config.maxRequests,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (result.retryAfter !== null) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

// ─── Circuit Breaker ──────────────────────────────────────────────

export function getCircuitBreaker(
  service: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
): CircuitBreakerState {
  let cb = circuitBreakers.get(service);
  if (!cb) {
    cb = {
      service,
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      nextRetry: null,
      totalRequests: 0,
      totalFailures: 0,
    };
    circuitBreakers.set(service, cb);
  }

  const now = Date.now();

  // Check if open circuit should move to half-open
  if (cb.state === 'open' && cb.nextRetry && now >= cb.nextRetry) {
    cb.state = 'half_open';
    cb.successes = 0;
  }

  return { ...cb };
}

export function recordCircuitSuccess(
  service: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
): void {
  const cb = circuitBreakers.get(service);
  if (!cb) return;

  cb.successes += 1;
  cb.totalRequests += 1;
  cb.lastSuccess = Date.now();

  if (cb.state === 'half_open' && cb.successes >= config.halfOpenMaxRequests) {
    cb.state = 'closed';
    cb.failures = 0;
    cb.successes = 0;
    cb.nextRetry = null;
  }
}

export function recordCircuitFailure(
  service: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER,
): void {
  const cb = circuitBreakers.get(service);
  if (!cb) return;

  const now = Date.now();
  cb.failures += 1;
  cb.totalFailures += 1;
  cb.totalRequests += 1;
  cb.lastFailure = now;

  if (cb.state === 'half_open') {
    cb.state = 'open';
    cb.nextRetry = now + config.resetTimeout;
    cb.failures = 0;
  } else if (cb.failures >= config.failureThreshold) {
    cb.state = 'open';
    cb.nextRetry = now + config.resetTimeout;
    cb.failures = 0;
  }
}

export function canMakeRequest(service: string): boolean {
  const cb = getCircuitBreaker(service);
  return cb.state !== 'open';
}

// ─── CORS ─────────────────────────────────────────────────────────

export function getCorsHeaders(
  tenantId: string,
  origin: string | null,
  tenantDomain?: string | null,
): Record<string, string> {
  const config = tenantCorsCache.get(tenantId) || { ...DEFAULT_CORS };

  const allowedOrigins = [
    ...config.allowedOrigins,
    `https://${tenantId}.ranios.com`,
    'https://ranios.com',
  ];

  if (tenantDomain) {
    allowedOrigins.push(`https://${tenantDomain}`);
  }

  const originAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': originAllowed ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Max-Age': String(config.maxAge),
    'Access-Control-Allow-Credentials': String(config.credentials),
  };
}

export function setTenantCors(tenantId: string, config: Partial<CorsConfig>): void {
  const existing = tenantCorsCache.get(tenantId) || { ...DEFAULT_CORS };
  tenantCorsCache.set(tenantId, { ...existing, ...config });
}

// ─── Response Caching ─────────────────────────────────────────────

export function getCachedResponse(
  cacheKey: string,
): { body: unknown; hit: boolean } {
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return { body: cached.body, hit: true };
  }
  if (cached) {
    responseCache.delete(cacheKey);
  }
  return { body: null, hit: false };
}

export function setCachedResponse(
  cacheKey: string,
  body: unknown,
  ttlMs: number,
): void {
  responseCache.set(cacheKey, { body, expiry: Date.now() + ttlMs });
}

export function buildCacheKey(
  tenantId: string,
  method: string,
  path: string,
  query: Record<string, string>,
): string {
  const queryStr = Object.entries(query).sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`).join('&');
  return `${tenantId}:${method}:${path}:${queryStr}`;
}

// ─── Request Logging ──────────────────────────────────────────────

export function logRequest(log: GatewayLog): void {
  requestLogs.push(log);
  // Keep last 10,000 entries in memory
  if (requestLogs.length > 10_000) {
    requestLogs.splice(0, requestLogs.length - 10_000);
  }
}

export function getRequestLogs(
  filter?: {
    tenantId?: string;
    path?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  },
): GatewayLog[] {
  let logs = [...requestLogs];

  if (filter?.tenantId) {
    logs = logs.filter(l => l.tenantId === filter.tenantId);
  }
  if (filter?.path) {
    logs = logs.filter(l => l.path.includes(filter.path!));
  }
  if (filter?.status) {
    logs = logs.filter(l => l.status === filter.status);
  }
  if (filter?.startTime) {
    logs = logs.filter(l => l.timestamp >= filter.startTime!);
  }
  if (filter?.endTime) {
    logs = logs.filter(l => l.timestamp <= filter.endTime!);
  }

  logs.sort((a, b) => b.timestamp - a.timestamp);

  return logs.slice(0, filter?.limit || 100);
}

// ─── Route Registry ───────────────────────────────────────────────

const routeRegistry = new Map<string, GatewayRoute>();

export function registerRoute(route: GatewayRoute): void {
  const key = `${route.method}:${route.version}:${route.path}`;
  routeRegistry.set(key, route);
}

export function resolveRoute(
  method: string,
  version: ApiVersion,
  path: string,
): GatewayRoute | null {
  const key = `${method}:${version}:${path}`;
  return routeRegistry.get(key) || null;
}

export function getRegisteredRoutes(): GatewayRoute[] {
  return Array.from(routeRegistry.values());
}

// ─── API Version Routing ──────────────────────────────────────────

export function extractVersion(path: string): { version: ApiVersion; cleanPath: string } {
  const v2Match = path.match(/^\/v2\/(.*)/);
  if (v2Match) return { version: 'v2', cleanPath: `/${v2Match[1]}` };

  const v1Match = path.match(/^\/v1\/(.*)/);
  if (v1Match) return { version: 'v1', cleanPath: `/${v1Match[1]}` };

  // Default to v1
  return { version: 'v1', cleanPath: path };
}

// ─── Request ID Generation ────────────────────────────────────────

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

// ─── Health Check ─────────────────────────────────────────────────

export function getHealthStatus(
  serviceChecks: Record<string, { latency: number; healthy: boolean }>,
): HealthStatus {
  const services: Record<string, ServiceHealth> = {};
  let hasUnhealthy = false;
  let hasDegraded = false;

  for (const [name, check] of Object.entries(serviceChecks)) {
    const cb = getCircuitBreaker(name);
    const errorRate = cb.totalRequests > 0
      ? (cb.totalFailures / cb.totalRequests) * 100
      : 0;

    const serviceStatus = !check.healthy
      ? 'down'
      : check.latency > 2000 || errorRate > 10
        ? 'degraded'
        : 'up';

    if (serviceStatus === 'down') hasUnhealthy = true;
    if (serviceStatus === 'degraded') hasDegraded = true;

    services[name] = {
      name,
      status: serviceStatus,
      latency: check.latency,
      lastChecked: Date.now(),
      circuitState: cb.state,
      errorRate,
    };
  }

  return {
    status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
    version: API_VERSION,
    uptime: Date.now() - startTime,
    services,
    timestamp: Date.now(),
  };
}

// ─── Gateway Processor ────────────────────────────────────────────

export async function processGatewayRequest(
  request: GatewayRequest,
): Promise<GatewayResponse> {
  const requestId = request.id || generateRequestId();
  const start = Date.now();
  let rateLimited = false;
  let circuitBroken = false;
  let cached = false;
  let responseStatus = 200;
  let responseBody: unknown = null;
  let errorMsg: string | null = null;

  try {
    // 1. Rate limiting
    const tierConfig = TIER_RATE_LIMITS[request.tenantContext.tier];
    const rateLimitKey = `${request.tenantContext.rateLimitBucket}:${request.tenantContext.tenantId}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, tierConfig);

    if (!rateLimitResult.allowed) {
      rateLimited = true;
      responseStatus = 429;
      responseBody = {
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
        limit: rateLimitResult.limit,
      };
      return {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
        body: responseBody,
        duration: Date.now() - start,
        cached: false,
        requestId,
      };
    }

    // 2. Route resolution
    const { version, cleanPath } = extractVersion(request.path);
    const route = resolveRoute(request.method, version, cleanPath);

    if (!route) {
      responseStatus = 404;
      responseBody = { error: 'Route not found', path: request.path, version };
      return {
        status: 404,
        headers: {},
        body: responseBody,
        duration: Date.now() - start,
        cached: false,
        requestId,
      };
    }

    // 3. Permission check
    const hasPermissions = route.requiredPermissions.every(
      p => request.tenantContext.permissions.includes(p),
    );
    if (!hasPermissions) {
      responseStatus = 403;
      responseBody = { error: 'Insufficient permissions' };
      return {
        status: 403,
        headers: {},
        body: responseBody,
        duration: Date.now() - start,
        cached: false,
        requestId,
      };
    }

    // 4. Cache check (GET only)
    if (request.method === 'GET' && route.cacheTtl) {
      const cacheKey = buildCacheKey(
        request.tenantContext.tenantId,
        request.method,
        cleanPath,
        request.query,
      );
      const cacheResult = getCachedResponse(cacheKey);
      if (cacheResult.hit) {
        cached = true;
        return {
          status: 200,
          headers: {
            ...getRateLimitHeaders(rateLimitResult),
            'X-Cache': 'HIT',
          },
          body: cacheResult.body,
          duration: Date.now() - start,
          cached: true,
          requestId,
        };
      }
    }

    // 5. Circuit breaker check
    if (!canMakeRequest(route.upstream)) {
      circuitBroken = true;
      responseStatus = 503;
      responseBody = { error: 'Service temporarily unavailable' };
      return {
        status: 503,
        headers: { 'Retry-After': '30' },
        body: responseBody,
        duration: Date.now() - start,
        cached: false,
        requestId,
      };
    }

    // 6. Transform request
    let body = request.body;
    if (route.transformRequest) {
      body = route.transformRequest(body);
    }

    // 7. Forward to upstream (simulated)
    responseBody = {
      data: body,
      _gateway: {
        requestId,
        version,
        upstream: route.upstream,
        tenantId: request.tenantContext.tenantId,
      },
    };

    recordCircuitSuccess(route.upstream);

    // 8. Transform response
    if (route.transformResponse) {
      responseBody = route.transformResponse(responseBody);
    }

    // 9. Cache response
    if (request.method === 'GET' && route.cacheTtl) {
      const cacheKey = buildCacheKey(
        request.tenantContext.tenantId,
        request.method,
        cleanPath,
        request.query,
      );
      setCachedResponse(cacheKey, responseBody, route.cacheTtl * 1000);
    }

    return {
      status: 200,
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'X-Cache': 'MISS',
        'X-Request-Id': requestId,
      },
      body: responseBody,
      duration: Date.now() - start,
      cached: false,
      requestId,
    };
  } catch (err) {
    responseStatus = 500;
    errorMsg = err instanceof Error ? err.message : 'Unknown error';
    responseBody = { error: 'Internal gateway error' };

    return {
      status: 500,
      headers: {},
      body: responseBody,
      duration: Date.now() - start,
      cached: false,
      requestId,
    };
  } finally {
    logRequest({
      requestId,
      tenantId: request.tenantContext.tenantId,
      method: request.method,
      path: request.path,
      version: request.version,
      status: responseStatus,
      duration: Date.now() - start,
      ip: request.ip,
      userAgent: request.userAgent,
      apiKeyId: request.tenantContext.apiKeyId,
      cached,
      rateLimited,
      circuitBroken,
      error: errorMsg,
      timestamp: Date.now(),
    });
  }
}

// ─── Default Route Registration ───────────────────────────────────

const DEFAULT_ROUTES: GatewayRoute[] = [
  { path: '/clients', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/clients', requiredPermissions: ['clients:read'], cacheTtl: 30 },
  { path: '/clients', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/clients', requiredPermissions: ['clients:write'] },
  { path: '/appointments', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/appointments', requiredPermissions: ['appointments:read'], cacheTtl: 15 },
  { path: '/appointments', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/appointments', requiredPermissions: ['appointments:write'] },
  { path: '/kpis', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/kpis', requiredPermissions: ['analytics:read'], cacheTtl: 30 },
  { path: '/ai/recommend', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/ai/recommend', requiredPermissions: ['ai:use'] },
  { path: '/ai/chat', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/ai/chat', requiredPermissions: ['ai:use'] },
  { path: '/ai/intake', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/ai/intake', requiredPermissions: ['ai:use'] },
  { path: '/reviews', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/reviews', requiredPermissions: ['reviews:read'], cacheTtl: 60 },
  { path: '/inventory', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/inventory', requiredPermissions: ['inventory:read'], cacheTtl: 30 },
  { path: '/schedule', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/schedule', requiredPermissions: ['schedule:read'], cacheTtl: 15 },
  { path: '/revenue', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/revenue', requiredPermissions: ['analytics:read'], cacheTtl: 60 },
  { path: '/templates', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/templates', requiredPermissions: ['templates:read'], cacheTtl: 120 },
  { path: '/templates', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/templates', requiredPermissions: ['templates:write'] },
  { path: '/webhooks', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/webhooks', requiredPermissions: ['webhooks:read'] },
  { path: '/webhooks', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/webhooks', requiredPermissions: ['webhooks:write'] },
];

export function initializeDefaultRoutes(): void {
  DEFAULT_ROUTES.forEach(registerRoute);
}

// ─── Gateway Stats ────────────────────────────────────────────────

export function getGatewayStats(): {
  totalRequests: number;
  avgLatency: number;
  errorRate: number;
  cacheHitRate: number;
  activeCircuitBreakers: number;
  topPaths: { path: string; count: number }[];
  recentErrors: GatewayLog[];
} {
  const total = requestLogs.length;
  const avgLatency = total > 0
    ? requestLogs.reduce((sum, l) => sum + l.duration, 0) / total
    : 0;
  const errors = requestLogs.filter(l => l.status >= 400).length;
  const cacheHits = requestLogs.filter(l => l.cached).length;

  const pathCounts = new Map<string, number>();
  requestLogs.forEach(l => {
    pathCounts.set(l.path, (pathCounts.get(l.path) || 0) + 1);
  });
  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const activeBreakers = Array.from(circuitBreakers.values())
    .filter(cb => cb.state === 'open').length;

  return {
    totalRequests: total,
    avgLatency: Math.round(avgLatency),
    errorRate: total > 0 ? (errors / total) * 100 : 0,
    cacheHitRate: total > 0 ? (cacheHits / total) * 100 : 0,
    activeCircuitBreakers: activeBreakers,
    topPaths,
    recentErrors: requestLogs.filter(l => l.status >= 400).slice(-20).reverse(),
  };
}

export function resetGateway(): void {
  rateLimitBuckets.clear();
  circuitBreakers.clear();
  requestLogs.length = 0;
  responseCache.clear();
  tenantCorsCache.clear();
  routeRegistry.clear();
}
