// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { SignJWT } from 'jose';

// Set env BEFORE session.ts evaluates its top-level guard
vi.hoisted(() => {
  process.env.DASHBOARD_JWT_SECRET = 'test-secret-key-for-vitest-at-least-32-chars';
});

// Mock next/headers (used by getSession, not by createSession/verifySession)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { createSession, verifySession } from '../session';

const TEST_SECRET = 'test-secret-key-for-vitest-at-least-32-chars';
const secret = new TextEncoder().encode(TEST_SECRET);

describe('createSession', () => {
  it('creates a valid JWT that can be verified', async () => {
    const token = await createSession('rina', 'ceo', 'Rina');

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

    const payload = await verifySession(token);
    expect(payload).not.toBeNull();
    expect(payload!.username).toBe('rina');
    expect(payload!.role).toBe('ceo');
    expect(payload!.displayName).toBe('Rina');
  });
});

describe('verifySession', () => {
  it('rejects an invalid token', async () => {
    const result = await verifySession('not.a.valid.jwt.token');
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

  it('rejects a token with an invalid role (Zod validation)', async () => {
    const token = await new SignJWT({ username: 'hacker', role: 'superadmin', displayName: 'Hacker' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const result = await verifySession(token);
    expect(result).toBeNull();
  });
});
