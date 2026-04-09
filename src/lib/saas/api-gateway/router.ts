type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  burstMultiplier: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number | null;
};

type CircuitBreakerConfig = {
  failureThreshold: number;
  resetTimeout: number;
};

type CircuitBreakerState = {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  totalRequests: number;
  openedAt: number | null;
  config: CircuitBreakerConfig;
};

type CorsConfig = {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
};

type CachedResponse = {
  body: unknown;
  expiresAt: number;
};

type RequestLog = {
  requestId: string;
  tenantId: string;
  method: string;
  path: string;
  version: string;
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
};

type RouteDefinition = {
  path: string;
  method: string;
  version: string;
  upstream: string;
  requiredPermissions: string[];
  cacheTtl: number;
};

type GatewayRequest = {
  id: string;
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  tenantContext: {
    tenantId: string;
    tenantSlug: string;
    tier: keyof typeof TIER_RATE_LIMITS;
    domain: string | null;
    apiKeyId: string | null;
    userId: string | null;
    permissions: string[];
    rateLimitBucket: string;
  };
  timestamp: number;
  ip: string;
  userAgent: string;
};

const startedAt = Date.now();

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const circuitBreakers = new Map<string, CircuitBreakerState>();
const tenantCorsConfigs = new Map<string, CorsConfig>();
const responseCache = new Map<string, CachedResponse>();
const requestLogs: RequestLog[] = [];
const routes = new Map<string, RouteDefinition>();

export const TIER_RATE_LIMITS = {
  starter: { maxRequests: 100, windowMs: 60_000, burstMultiplier: 1.5 },
  pro: { maxRequests: 500, windowMs: 60_000, burstMultiplier: 2 },
  enterprise: { maxRequests: 2000, windowMs: 60_000, burstMultiplier: 3 },
} as const;

export const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30_000,
};

function routeKey(method: string, version: string, path: string) {
  return `${method.toUpperCase()}:${version}:${path}`;
}

export function resetGateway() {
  rateLimits.clear();
  circuitBreakers.clear();
  tenantCorsConfigs.clear();
  responseCache.clear();
  requestLogs.length = 0;
  routes.clear();
}

export function identifyTenant(headers: Record<string, string>, host: string) {
  const directTenant = headers['x-tenant-id'];
  if (directTenant) return { tenantId: directTenant, source: 'header' as const };

  const apiKey = headers['x-api-key'];
  if (apiKey) {
    const match = /^rani_(?:live|test)_([^_]+)_/.exec(apiKey);
    if (match) return { tenantId: match[1], source: 'api_key' as const };
  }

  const [subdomain] = host.split('.');
  if (subdomain && !['www', 'api', 'ranios'].includes(subdomain) && host.endsWith('.ranios.com')) {
    return { tenantId: subdomain, source: 'subdomain' as const };
  }

  return { tenantId: null, source: null };
}

export function checkRateLimit(bucket: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const effectiveLimit = Math.floor(config.maxRequests * config.burstMultiplier);
  const existing = rateLimits.get(bucket);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimits.set(bucket, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(config.maxRequests - 1, 0),
      resetAt,
      retryAfter: null,
    };
  }

  if (existing.count >= effectiveLimit) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - existing.count, 0),
    resetAt: existing.resetAt,
    retryAfter: null,
  };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function getCircuitBreaker(
  service: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER
) {
  const existing = circuitBreakers.get(service);
  if (existing) return existing;

  const created: CircuitBreakerState = {
    state: 'closed',
    failures: 0,
    totalRequests: 0,
    openedAt: null,
    config,
  };
  circuitBreakers.set(service, created);
  return created;
}

export function recordCircuitSuccess(service: string) {
  const breaker = getCircuitBreaker(service);
  breaker.totalRequests += 1;
  breaker.failures = 0;
  breaker.state = 'closed';
  breaker.openedAt = null;
}

export function recordCircuitFailure(
  service: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER
) {
  const breaker = getCircuitBreaker(service, config);
  breaker.totalRequests += 1;
  breaker.failures += 1;
  breaker.config = config;

  if (breaker.failures >= config.failureThreshold) {
    breaker.state = 'open';
    breaker.openedAt = Date.now();
  }
}

export function canMakeRequest(service: string) {
  const breaker = getCircuitBreaker(service);
  if (breaker.state !== 'open') return true;
  if (!breaker.openedAt) return false;

  if (Date.now() - breaker.openedAt >= breaker.config.resetTimeout) {
    breaker.state = 'half-open';
    return true;
  }

  return false;
}

export function setTenantCors(tenantId: string, config: CorsConfig) {
  tenantCorsConfigs.set(tenantId, config);
}

export function getCorsHeaders(tenantId: string, origin: string | null, customDomain?: string) {
  const custom = tenantCorsConfigs.get(tenantId);
  const allowedOrigin =
    origin ??
    (customDomain ? `https://${customDomain}` : `https://${tenantId}.ranios.com`);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': custom?.allowedMethods.join(', ') ?? 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': custom?.allowedHeaders.join(', ') ?? 'Content-Type, Authorization, X-Tenant-Id, X-Api-Key',
    'Access-Control-Max-Age': String(custom?.maxAge ?? 86_400),
    'Access-Control-Allow-Credentials': String(custom?.credentials ?? true),
  };
}

export function getCachedResponse(key: string) {
  const cached = responseCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return { hit: false as const };
  }

  return { hit: true as const, body: cached.body };
}

export function setCachedResponse(key: string, body: unknown, ttlMs: number) {
  responseCache.set(key, { body, expiresAt: Date.now() + ttlMs });
}

export function buildCacheKey(
  tenantId: string,
  method: string,
  path: string,
  query: Record<string, string>
) {
  const params = new URLSearchParams(
    Object.entries(query).sort(([left], [right]) => left.localeCompare(right))
  );
  return `${tenantId}:${method.toUpperCase()}:${path}?${params.toString()}`;
}

export function logRequest(entry: RequestLog) {
  requestLogs.push(entry);
}

export function getRequestLogs(filters?: { tenantId?: string }) {
  if (!filters?.tenantId) return [...requestLogs];
  return requestLogs.filter((entry) => entry.tenantId === filters.tenantId);
}

export function registerRoute(route: RouteDefinition) {
  routes.set(routeKey(route.method, route.version, route.path), route);
}

export function resolveRoute(method: string, version: string, path: string) {
  return routes.get(routeKey(method, version, path)) ?? null;
}

export function getRegisteredRoutes() {
  return [...routes.values()];
}

export function extractVersion(path: string) {
  const match = path.match(/^\/(v\d+)(\/.*|$)/);
  if (!match) {
    return { version: 'v1', cleanPath: path };
  }

  return {
    version: match[1],
    cleanPath: match[2] || '/',
  };
}

export function generateRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

export function getHealthStatus(services: Record<string, { latency: number; healthy: boolean }>) {
  const values = Object.values(services);
  const hasDownService = values.some((service) => !service.healthy);
  const hasSlowService = values.some((service) => service.healthy && service.latency >= 2000);

  return {
    status: hasDownService ? 'unhealthy' : hasSlowService ? 'degraded' : 'healthy',
    version: '1.0.0',
    uptime: Date.now() - startedAt,
    services,
  };
}

export function initializeDefaultRoutes() {
  if (routes.size > 0) return;

  const defaults: RouteDefinition[] = [
    { path: '/clients', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/clients', requiredPermissions: ['clients:read'], cacheTtl: 30 },
    { path: '/clients', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/clients', requiredPermissions: ['clients:write'], cacheTtl: 0 },
    { path: '/appointments', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/appointments', requiredPermissions: ['appointments:read'], cacheTtl: 30 },
    { path: '/appointments', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/appointments', requiredPermissions: ['appointments:write'], cacheTtl: 0 },
    { path: '/transactions', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/transactions', requiredPermissions: ['transactions:read'], cacheTtl: 30 },
    { path: '/transactions', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/transactions', requiredPermissions: ['transactions:write'], cacheTtl: 0 },
    { path: '/packages', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/packages', requiredPermissions: ['packages:read'], cacheTtl: 60 },
    { path: '/memberships', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/memberships', requiredPermissions: ['memberships:read'], cacheTtl: 60 },
    { path: '/memberships', method: 'POST', version: 'v1', upstream: 'https://api.ranios.com/memberships', requiredPermissions: ['memberships:write'], cacheTtl: 0 },
    { path: '/alerts', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/alerts', requiredPermissions: ['alerts:read'], cacheTtl: 10 },
    { path: '/health', method: 'GET', version: 'v1', upstream: 'https://api.ranios.com/health', requiredPermissions: [], cacheTtl: 10 },
  ];

  defaults.forEach(registerRoute);
}

export async function processGatewayRequest(request: GatewayRequest) {
  const { version, cleanPath } = extractVersion(request.path);
  const route = resolveRoute(request.method, version, cleanPath);

  if (!route) {
    return { status: 404, requestId: request.id, error: 'Route not found' };
  }

  const missingPermission = route.requiredPermissions.some(
    (permission) => !request.tenantContext.permissions.includes(permission)
  );
  if (missingPermission) {
    return { status: 403, requestId: request.id, error: 'Forbidden' };
  }

  const rateLimitResult = checkRateLimit(
    `${request.tenantContext.tenantId}:${request.tenantContext.rateLimitBucket}`,
    TIER_RATE_LIMITS[request.tenantContext.tier]
  );
  if (!rateLimitResult.allowed) {
    return { status: 429, requestId: request.id, error: 'Rate limit exceeded' };
  }

  logRequest({
    requestId: request.id,
    tenantId: request.tenantContext.tenantId,
    method: request.method,
    path: cleanPath,
    version,
    status: 200,
    duration: 1,
    ip: request.ip,
    userAgent: request.userAgent,
    apiKeyId: request.tenantContext.apiKeyId,
    cached: false,
    rateLimited: false,
    circuitBroken: false,
    error: null,
    timestamp: request.timestamp,
  });

  return { status: 200, requestId: request.id, route };
}

export function getGatewayStats() {
  if (requestLogs.length === 0) {
    return {
      totalRequests: 0,
      avgLatency: 0,
      errorRate: 0,
    };
  }

  const totalRequests = requestLogs.length;
  const totalLatency = requestLogs.reduce((sum, entry) => sum + entry.duration, 0);
  const errors = requestLogs.filter((entry) => entry.status >= 400).length;

  return {
    totalRequests,
    avgLatency: totalLatency / totalRequests,
    errorRate: (errors / totalRequests) * 100,
  };
}
