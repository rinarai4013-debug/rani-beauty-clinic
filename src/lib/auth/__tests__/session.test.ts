// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

// Set env BEFORE session.ts evaluates its top-level guard
vi.hoisted(() => {
  process.env.DASHBOARD_JWT_SECRET = 'test-secret-key-for-vitest-at-least-32-chars';
});

// Mock next/headers (used by getSession, not by createSession/verifySession)
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import {
  createSession,
  verifySession,
  getSession,
  getSessionFromRequest,
  getSessionCookieConfig,
  COOKIE_NAME,
} from '../session';
import type { NextRequest } from 'next/server';

const TEST_SECRET = 'test-secret-key-for-vitest-at-least-32-chars';
const secret = new TextEncoder().encode(TEST_SECRET);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createSession ──

describe('createSession', () => {
  it('creates a valid JWT string with 3 parts', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('embeds the correct username in the payload', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    const payload = await verifySession(token);
    expect(payload).not.toBeNull();
    expect(payload!.username).toBe('rina');
  });

  it('embeds the correct role in the payload', async () => {
    const token = await createSession('sarah', 'frontdesk', 'Sarah');
    const payload = await verifySession(token);
    expect(payload!.role).toBe('frontdesk');
  });

  it('embeds the correct displayName in the payload', async () => {
    const token = await createSession('mom', 'provider', 'Mom');
    const payload = await verifySession(token);
    expect(payload!.displayName).toBe('Mom');
  });

  it('creates tokens for every valid role', async () => {
    const roles = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'] as const;
    for (const role of roles) {
      const token = await createSession('user', role, 'User');
      const payload = await verifySession(token);
      expect(payload).not.toBeNull();
      expect(payload!.role).toBe(role);
    }
  });

  it('sets a 24-hour expiration', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    const { payload } = await jwtVerify(token, secret);
    const now = Math.floor(Date.now() / 1000);
    // exp should be roughly 24 hours from now (within 5 seconds tolerance)
    expect(payload.exp).toBeDefined();
    expect(payload.exp! - now).toBeGreaterThan(86395);
    expect(payload.exp! - now).toBeLessThanOrEqual(86400);
  });

  it('sets iat (issued at) to current time', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createSession('rina', 'ceo', 'Rina');
    const { payload } = await jwtVerify(token, secret);
    const after = Math.floor(Date.now() / 1000);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
  });

  it('uses HS256 algorithm', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    // Decode header (first part of JWT)
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
  });
});

// ── verifySession ──

describe('verifySession', () => {
  it('verifies a valid token and returns the payload', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    const result = await verifySession(token);
    expect(result).not.toBeNull();
    expect(result!.username).toBe('rina');
    expect(result!.role).toBe('ceo');
    expect(result!.displayName).toBe('Rina');
  });

  it('rejects a completely invalid token string', async () => {
    const result = await verifySession('not.a.valid.jwt.token');
    expect(result).toBeNull();
  });

  it('rejects an empty string', async () => {
    const result = await verifySession('');
    expect(result).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const wrongSecret = new TextEncoder().encode('wrong-secret-key-definitely-not-right');
    const token = await new SignJWT({ username: 'rina', role: 'ceo', displayName: 'Rina' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(wrongSecret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });

  it('rejects an expired token', async () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

    const expiredToken = await new SignJWT({ username: 'rina', role: 'ceo', displayName: 'Rina' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(twoHoursAgo)
      .setExpirationTime(oneHourAgo)
      .sign(secret);

    const result = await verifySession(expiredToken);
    expect(result).toBeNull();
  });

  it('rejects a token with invalid role (Zod validation fails)', async () => {
    const token = await new SignJWT({ username: 'hacker', role: 'superadmin', displayName: 'Hacker' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });

  it('rejects a token missing the username field', async () => {
    const token = await new SignJWT({ role: 'ceo', displayName: 'Rina' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });

  it('rejects a token missing the displayName field', async () => {
    const token = await new SignJWT({ username: 'rina', role: 'ceo' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });

  it('rejects a token with empty username', async () => {
    const token = await new SignJWT({ username: '', role: 'ceo', displayName: 'Rina' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });
});

// ── getSession ──

describe('getSession', () => {
  it('returns null when no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns session payload when valid cookie exists', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    mockCookieStore.get.mockReturnValue({ value: token });
    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result!.username).toBe('rina');
  });

  it('returns null when cookie has invalid token', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage-token' });
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('reads from the correct cookie name', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await getSession();
    expect(mockCookieStore.get).toHaveBeenCalledWith('rani-session');
  });
});

// ── getSessionFromRequest ──

describe('getSessionFromRequest', () => {
  function makeRequestWithCookie(token?: string) {
    return {
      cookies: {
        get: vi.fn((name: string) =>
          name === COOKIE_NAME && token ? { value: token } : undefined
        ),
      },
    } as unknown as NextRequest;
  }

  it('returns null when the request has no auth cookie', async () => {
    const request = makeRequestWithCookie();
    const result = await getSessionFromRequest(request);
    expect(result).toBeNull();
  });

  it('returns the session payload when the request has a valid auth cookie', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');
    const request = makeRequestWithCookie(token);

    const result = await getSessionFromRequest(request);

    expect(result).not.toBeNull();
    expect(result!.username).toBe('rina');
    expect(result!.role).toBe('ceo');
  });

  it('returns null when the request cookie contains an invalid token', async () => {
    const request = makeRequestWithCookie('not-a-real-token');
    const result = await getSessionFromRequest(request);
    expect(result).toBeNull();
  });

  it('enforces allowedRoles when provided', async () => {
    const token = await createSession('sarah', 'frontdesk', 'Sarah');
    const request = makeRequestWithCookie(token);

    const allowed = await getSessionFromRequest(request, ['frontdesk', 'operations']);
    const denied = await getSessionFromRequest(request, ['ceo']);

    expect(allowed).not.toBeNull();
    expect(allowed!.role).toBe('frontdesk');
    expect(denied).toBeNull();
  });
});

// ── getSessionCookieConfig ──

describe('getSessionCookieConfig', () => {
  it('returns the correct cookie name', () => {
    const config = getSessionCookieConfig('test-token');
    expect(config.name).toBe('rani-session');
  });

  it('sets httpOnly to true', () => {
    const config = getSessionCookieConfig('test-token');
    expect(config.httpOnly).toBe(true);
  });

  it('sets sameSite to strict', () => {
    const config = getSessionCookieConfig('test-token');
    expect(config.sameSite).toBe('strict');
  });

  it('sets maxAge to 24 hours (86400)', () => {
    const config = getSessionCookieConfig('test-token');
    expect(config.maxAge).toBe(86400);
  });

  it('sets path to root', () => {
    const config = getSessionCookieConfig('test-token');
    expect(config.path).toBe('/');
  });

  it('includes the token as value', () => {
    const config = getSessionCookieConfig('my-jwt-token');
    expect(config.value).toBe('my-jwt-token');
  });

  it('sets secure based on NODE_ENV', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const prodConfig = getSessionCookieConfig('token');
    expect(prodConfig.secure).toBe(true);

    process.env.NODE_ENV = 'test';
    const devConfig = getSessionCookieConfig('token');
    expect(devConfig.secure).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });
});

// ── COOKIE_NAME ──

describe('COOKIE_NAME', () => {
  it('is rani-session', () => {
    expect(COOKIE_NAME).toBe('rani-session');
  });
});
