/**
 * RaniOS Multi-Tenant Middleware
 *
 * Runs before all requests to:
 * 1. Resolve the current tenant from subdomain, custom domain, or session
 * 2. Inject tenant ID and config into request headers
 * 3. Enforce tenant-level access controls
 *
 * Falls back to the default tenant (Rani Beauty Clinic) for
 * backward compatibility when no tenant is detected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Configuration ──────────────────────────────────────────────────────────

const PLATFORM_DOMAINS = ['ranios.com', 'ranios.dev', 'localhost'];
const SESSION_COOKIE = 'rani-session';
const DEFAULT_TENANT_ID = 'rani-beauty-clinic';

// Paths that skip tenant resolution
const PUBLIC_PATHS = [
  '/api/tenant/onboarding',
  '/api/webhooks/',
  '/onboarding',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
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
    const secret = process.env.DASHBOARD_JWT_SECRET;
    if (!secret) return null;

    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);

    // Check for tenantId in JWT payload (new multi-tenant sessions)
    if (payload.tenantId && typeof payload.tenantId === 'string') {
      return payload.tenantId;
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip tenant resolution for public/static paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || 'localhost:3000';
  let tenantId: string | null = null;
  let tenantSlug: string | null = null;
  let tenantSource: string = 'default';

  // 1. Check explicit header (API/admin calls)
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) {
    tenantId = headerTenantId;
    tenantSource = 'header';
  }

  // 2. Check JWT session for tenant ID
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

  // 3. Check subdomain
  if (!tenantId) {
    const subdomain = extractSubdomain(hostname);
    if (subdomain) {
      tenantSlug = subdomain;
      tenantSource = 'subdomain';
      // We pass the slug as a header - the API route / server component
      // will resolve it to a full tenant config via the resolver
    }
  }

  // 4. Check custom domain
  if (!tenantId && !tenantSlug) {
    if (isCustomDomain(hostname)) {
      tenantSource = 'custom-domain';
      // Pass the domain as a header for resolution
    }
  }

  // 5. Fallback to default tenant
  if (!tenantId && !tenantSlug) {
    tenantId = DEFAULT_TENANT_ID;
    tenantSource = 'default';
  }

  // Inject tenant info into request headers
  const response = NextResponse.next();

  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
  }
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
  }
  response.headers.set('x-tenant-source', tenantSource);
  response.headers.set('x-tenant-host', hostname);

  // CORS for API routes — restrict to known origins
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [
      'https://ranibeautyclinic.com',
      'https://www.ranibeautyclinic.com',
      'https://ranios.com',
      'https://ranios.dev',
    ];
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
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
     * - images/ (public images)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
};
