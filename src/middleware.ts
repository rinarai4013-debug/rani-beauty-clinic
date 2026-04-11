/**
 * Rani Beauty Clinic — Consolidated Middleware
 *
 * Handles (in order):
 * 1. Domain canonicalization (non-www → www, offers.* → www)
 * 2. WordPress legacy query param cleanup (SEO)
 * 3. Trailing-slash normalization (301 → no trailing slash)
 * 4. Multi-tenant resolution (subdomain, custom domain, JWT session)
 * 5. CORS — restricted to own origins for API routes,
 *    webhook-specific headers for server-to-server routes
 *
 * Falls back to the default tenant (Rani Beauty Clinic) for
 * backward compatibility when no tenant is detected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { env } from './lib/env';

// ─── CORS Configuration ────────────────────────────────────────────────────

const PRODUCTION_CORS_ORIGINS = [
  'https://ranibeautyclinic.com',
  'https://www.ranibeautyclinic.com',
];

const DEVELOPMENT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const allowedOrigins =
    envIsDevelopment()
      ? [...PRODUCTION_CORS_ORIGINS, ...DEVELOPMENT_CORS_ORIGINS]
      : PRODUCTION_CORS_ORIGINS;

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  return env.NEXT_PUBLIC_SITE_URL;
}

function setApiCorsHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set('Access-Control-Allow-Origin', getCorsOrigin(request));
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Tenant-ID',
  );
}

// ─── Multi-Tenant Configuration ────────────────────────────────────────────

const PLATFORM_DOMAINS = ['ranios.com', 'ranios.dev', 'localhost'];
const SESSION_COOKIE = 'rani-session';
const DEFAULT_TENANT_ID = 'rani-beauty-clinic';

// Paths that skip tenant resolution entirely
const PUBLIC_PATHS = [
  '/api/health',
  '/api/tenant/onboarding',
  '/api/webhooks/',
  '/onboarding',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// WordPress legacy params that cause duplicate/noindex issues in GSC
const WP_PARAMS = [
  'replytocom', 's', 'remove_item', '_wpnonce', 'add-to-cart',
  'page_id', 'format', 'templately_library', 'post_type', 'p',
  'wc-ajax', 'ver',
];

// ─── Subdomain Extraction ───────────────────────────────────────────────────

function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];

  for (const domain of PLATFORM_DOMAINS) {
    if (host === domain) return null;
    if (host.endsWith(`.${domain}`)) {
      const sub = host.slice(0, -(domain.length + 1));
      if (sub.includes('.')) return null;
      return sub;
    }
  }

  return null;
}

function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(':')[0];
  for (const domain of PLATFORM_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return false;
  }
  return host.includes('.');
}

// ─── JWT Tenant Extraction ──────────────────────────────────────────────────

async function extractTenantFromJWT(token: string): Promise<string | null> {
  try {
    const secret = env.DASHBOARD_JWT_SECRET;

    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);

    if (payload.tenantId && typeof payload.tenantId === 'string') {
      return payload.tenantId;
    }

    return null;
  } catch {
    return null;
  }
}

function envIsDevelopment() {
  return env.NODE_ENV === 'development';
}

// ─── Dashboard Rate Limiting ───────────────────────────────────────────────

const DASHBOARD_LIMIT = 60; // requests per window
const DASHBOARD_WINDOW_MS = 60_000; // 1 minute
const dashboardIpCounts = new Map<string, { count: number; resetAt: number }>();

function getDashboardRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  // Lazy cleanup when map grows too large
  if (dashboardIpCounts.size > 1000) {
    for (const [k, v] of dashboardIpCounts) {
      if (now > v.resetAt) dashboardIpCounts.delete(k);
    }
  }
  const entry = dashboardIpCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    dashboardIpCounts.set(ip, { count: 1, resetAt: now + DASHBOARD_WINDOW_MS });
    return { allowed: true, remaining: DASHBOARD_LIMIT - 1, resetIn: DASHBOARD_WINDOW_MS };
  }
  if (entry.count >= DASHBOARD_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, remaining: DASHBOARD_LIMIT - entry.count, resetIn: entry.resetAt - now };
}

function getRequestIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  // ── 1. Domain canonicalization: non-www → www ──
  if (
    hostname === 'ranibeautyclinic.com' ||
    hostname === 'http://ranibeautyclinic.com'
  ) {
    const url = request.nextUrl.clone();
    url.host = 'www.ranibeautyclinic.com';
    url.protocol = 'https';
    return NextResponse.redirect(url, 301);
  }

  // ── 2. Subdomain canonicalization: offers.* → www ──
  if (
    hostname === 'offers.ranibeautyclinic.com' ||
    hostname.startsWith('offers.')
  ) {
    const url = request.nextUrl.clone();
    url.host = 'www.ranibeautyclinic.com';
    url.protocol = 'https';
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // Skip static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ── 3. Strip WordPress legacy query params (SEO cleanup) ──
  const hasWpParam = WP_PARAMS.some((p) => searchParams.has(p));
  if (hasWpParam) {
    const url = request.nextUrl.clone();
    WP_PARAMS.forEach((p) => url.searchParams.delete(p));
    if (!url.searchParams.toString()) {
      url.search = '';
    }
    return NextResponse.redirect(url, 301);
  }

  // ── 4. API routes: rate limiting, CORS + webhook headers ──
  if (pathname.startsWith('/api/')) {
    // Dashboard rate limiting — 60 req/min per IP across all dashboard routes
    if (pathname.startsWith('/api/dashboard')) {
      const ip = getRequestIP(request);
      const { allowed, remaining, resetIn } = getDashboardRateLimit(ip);
      if (!allowed) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(resetIn / 1000)),
              'X-RateLimit-Limit': String(DASHBOARD_LIMIT),
              'X-RateLimit-Remaining': '0',
            },
          },
        );
      }
      // Rate limit headers added to response at the end of this block
    }

    // Webhook routes (server-to-server) — restricted headers, no browser CORS
    if (pathname.startsWith('/api/webhooks/')) {
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, stripe-signature, x-mangomint-signature, x-cherry-signature',
        );
        return response;
      }
      // Pass through without browser CORS — webhooks are server-to-server
      return NextResponse.next();
    }

    // All other API routes: restricted CORS to own origins only
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      setApiCorsHeaders(response, request);
      return response;
    }

    // Skip tenant resolution for public API paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      const response = NextResponse.next();
      setApiCorsHeaders(response, request);
      return response;
    }

    // Continue to tenant resolution below, CORS headers added at the end
  }

  // ── 5. Trailing-slash normalization (SEO canonical form) ──
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // ── 6. Skip tenant resolution for remaining public paths ──
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 7. Multi-tenant resolution ──
  let tenantId: string | null = null;
  let tenantSlug: string | null = null;
  let tenantSource: string = 'default';

  // 7a. Check explicit header (API/admin calls)
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) {
    tenantId = headerTenantId;
    tenantSource = 'header';
  }

  // 7b. Check JWT session for tenant ID
  if (!tenantId) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
      const jwtTenantId = await extractTenantFromJWT(sessionToken);
      if (jwtTenantId) {
        tenantId = jwtTenantId;
        tenantSource = 'session';
      }
    }
  }

  // 7c. Check subdomain
  if (!tenantId) {
    const subdomain = extractSubdomain(hostname);
    if (subdomain) {
      tenantSlug = subdomain;
      tenantSource = 'subdomain';
    }
  }

  // 7d. Check custom domain
  if (!tenantId && !tenantSlug) {
    if (isCustomDomain(hostname)) {
      tenantSource = 'custom-domain';
    }
  }

  // 7e. Fallback to default tenant
  if (!tenantId && !tenantSlug) {
    tenantId = DEFAULT_TENANT_ID;
    tenantSource = 'default';
  }

  // Inject tenant info into request headers
  const requestHeaders = new Headers(request.headers);
  if (tenantId) requestHeaders.set('x-tenant-id', tenantId);
  if (tenantSlug) requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-source', tenantSource);
  requestHeaders.set('x-tenant-host', hostname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Add CORS headers to API responses
  if (pathname.startsWith('/api/')) {
    setApiCorsHeaders(response, request);
  }

  // Add rate limit headers to dashboard responses
  if (pathname.startsWith('/api/dashboard')) {
    const ip = getRequestIP(request);
    const entry = dashboardIpCounts.get(ip);
    if (entry) {
      response.headers.set('X-RateLimit-Limit', String(DASHBOARD_LIMIT));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, DASHBOARD_LIMIT - entry.count)));
    }
  }

  return response;
}

// ─── Matcher ────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets by extension
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
