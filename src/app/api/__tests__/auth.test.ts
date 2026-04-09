/**
 * Integration tests for Auth routes:
 *   POST /api/dashboard/auth/login
 *   GET  /api/dashboard/auth/me
 *   POST /api/dashboard/auth/logout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPostRequest,
  buildGetRequest,
  expectJsonStatus,
  expectUnauthorized,
  expectBadRequest,
  mockCommonDeps,
  CEO_SESSION,
} from './helpers';

// ---------------------------------------------------------------------------
// Mock setup (hoisted by vitest)
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockCreateSession = vi.fn().mockResolvedValue('mock-jwt-token');
const mockGetSessionCookieConfig = vi.fn().mockReturnValue({
  name: 'rani-session',
  value: 'mock-jwt-token',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 86400,
});

vi.mock('@/lib/auth/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  verifySession: vi.fn(),
  getSessionCookieConfig: (...args: unknown[]) => mockGetSessionCookieConfig(...args),
  COOKIE_NAME: 'rani-session',
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: vi.fn(),
  logAuthFailure: vi.fn(),
  logWebhookEvent: vi.fn(),
}));

vi.mock('@/lib/sentry-utils', () => ({
  captureAuthEvent: vi.fn(),
  captureWebhookEvent: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Tests - POST /api/dashboard/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/auth/login', () => {
  beforeEach(() => {
    vi.resetModules();
    // Set valid credentials env
    process.env.DASHBOARD_USERS = JSON.stringify({
      rina: { password: 'testpass123', role: 'ceo', displayName: 'Rina' },
      front: { password: 'frontpass', role: 'frontdesk', displayName: 'Front Desk' },
    });
    process.env.DASHBOARD_JWT_SECRET = 'test-jwt-secret-key-for-testing';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 and user data for valid credentials', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: 'testpass123',
    });

    const response = await POST(req);
    const data = await expectJsonStatus(response, 200);
    expect(data.success).toBe(true);
    expect(data.user.username).toBe('rina');
    expect(data.user.role).toBe('ceo');
    expect(data.user.displayName).toBe('Rina');
  });

  it('should set a session cookie on successful login', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: 'testpass123',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    // Cookie is set via response.cookies.set() - verify the method was used
    const setCookieHeader = response.headers.get('set-cookie');
    // NextResponse.cookies.set populates set-cookie header
    expect(setCookieHeader).toBeTruthy();
  });

  it('should return 401 for wrong password', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: 'wrongpassword',
    });

    const response = await POST(req);
    const data = await expectJsonStatus(response, 401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 for unknown username', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'nobody',
      password: 'testpass123',
    });

    const response = await POST(req);
    const data = await expectJsonStatus(response, 401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 400 for missing username', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      password: 'testpass123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 for missing password', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 for non-string username', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 123,
      password: 'testpass123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 for non-string password', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: true,
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 for empty body', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = new Request('http://localhost:3000/api/dashboard/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 429 after too many failed attempts from same IP', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const ip = '192.168.1.100';

    // Exhaust the rate limit (5 attempts)
    for (let i = 0; i < 5; i++) {
      const req = buildPostRequest('/api/dashboard/auth/login', {
        username: 'rina',
        password: 'wrong',
      }, { 'x-forwarded-for': ip });
      await POST(req);
    }

    // 6th attempt should be rate limited
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: 'testpass123',
    }, { 'x-forwarded-for': ip });

    const response = await POST(req);
    const data = await expectJsonStatus(response, 429);
    expect(data.error).toContain('Too many failed attempts');
  });

  it('should allow login from different IP while one is rate-limited', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const blockedIp = '192.168.1.200';

    // Rate-limit one IP
    for (let i = 0; i < 5; i++) {
      const req = buildPostRequest('/api/dashboard/auth/login', {
        username: 'rina',
        password: 'wrong',
      }, { 'x-forwarded-for': blockedIp });
      await POST(req);
    }

    // Different IP should still work
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina',
      password: 'testpass123',
    }, { 'x-forwarded-for': '10.0.0.1' });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it('should accept hashed password format (pbkdf2)', async () => {
    const { hashPassword } = await import('@/lib/auth/password');
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const hashed = hashPassword('securepass');

    process.env.DASHBOARD_USERS = JSON.stringify({
      admin: { password: hashed, role: 'ceo', displayName: 'Admin' },
    });

    // Need to re-import to pick up new env
    vi.resetModules();
    const mod = await import('@/app/api/dashboard/auth/login/route');

    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'admin',
      password: 'securepass',
    }, { 'x-forwarded-for': '10.0.0.50' });

    const response = await mod.POST(req);
    expect(response.status).toBe(200);
  });

  it('should reject wrong password against hashed credential', async () => {
    const { hashPassword } = await import('@/lib/auth/password');
    const hashed = hashPassword('securepass');

    process.env.DASHBOARD_USERS = JSON.stringify({
      admin: { password: hashed, role: 'ceo', displayName: 'Admin' },
    });

    vi.resetModules();
    const mod = await import('@/app/api/dashboard/auth/login/route');

    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'admin',
      password: 'wrongpass',
    }, { 'x-forwarded-for': '10.0.0.51' });

    const response = await mod.POST(req);
    expect(response.status).toBe(401);
  });

  it('should work for frontdesk role login', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const req = buildPostRequest('/api/dashboard/auth/login', {
      username: 'front',
      password: 'frontpass',
    }, { 'x-forwarded-for': '10.0.0.60' });

    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.user.role).toBe('frontdesk');
  });

  it('should clear failed attempts on successful login', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/login/route');
    const ip = '192.168.1.250';

    // 3 failed attempts (below threshold)
    for (let i = 0; i < 3; i++) {
      await POST(buildPostRequest('/api/dashboard/auth/login', {
        username: 'rina', password: 'wrong',
      }, { 'x-forwarded-for': ip }));
    }

    // Successful login clears the counter
    await POST(buildPostRequest('/api/dashboard/auth/login', {
      username: 'rina', password: 'testpass123',
    }, { 'x-forwarded-for': ip }));

    // Next 3 wrong attempts should NOT trigger rate limit (counter was cleared)
    for (let i = 0; i < 3; i++) {
      const resp = await POST(buildPostRequest('/api/dashboard/auth/login', {
        username: 'rina', password: 'wrong',
      }, { 'x-forwarded-for': ip }));
      expect(resp.status).toBe(401); // Not 429
    }
  });
});

// ---------------------------------------------------------------------------
// Tests - GET /api/dashboard/auth/me
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/auth/me', () => {
  beforeEach(() => {
    process.env.DASHBOARD_JWT_SECRET = 'test-jwt-secret-key-for-testing';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return user data for authenticated session', async () => {
    mockGetSession.mockResolvedValue(CEO_SESSION);
    const { GET } = await import('@/app/api/dashboard/auth/me/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.username).toBe('rina');
    expect(data.user.role).toBe('ceo');
    expect(data.user.displayName).toBe('Rina');
  });

  it('should return 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await import('@/app/api/dashboard/auth/me/route');
    const response = await GET();

    await expectUnauthorized(response);
  });

  it('should return correct role for frontdesk user', async () => {
    mockGetSession.mockResolvedValue({
      username: 'front',
      role: 'frontdesk',
      displayName: 'Front Desk',
    });
    const { GET } = await import('@/app/api/dashboard/auth/me/route');
    const response = await GET();
    const data = await response.json();

    expect(data.user.role).toBe('frontdesk');
  });

  it('should return correct role for provider user', async () => {
    mockGetSession.mockResolvedValue({
      username: 'mom',
      role: 'provider',
      displayName: 'Mom',
    });
    const { GET } = await import('@/app/api/dashboard/auth/me/route');
    const response = await GET();
    const data = await response.json();

    expect(data.user.role).toBe('provider');
    expect(data.user.displayName).toBe('Mom');
  });
});

// ---------------------------------------------------------------------------
// Tests - POST /api/dashboard/auth/logout
// ---------------------------------------------------------------------------

describe('POST /api/dashboard/auth/logout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return success', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/logout/route');
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should clear the session cookie', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/logout/route');
    const response = await POST();

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeTruthy();
    // Cookie should be set with maxAge=0 to clear it
    expect(setCookieHeader).toContain('Max-Age=0');
  });

  it('should include rani-session cookie name in the response', async () => {
    const { POST } = await import('@/app/api/dashboard/auth/logout/route');
    const response = await POST();

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('rani-session');
  });
});
