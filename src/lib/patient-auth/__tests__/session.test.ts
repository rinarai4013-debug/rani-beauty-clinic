import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT } from 'jose';

vi.hoisted(() => {
  process.env.PATIENT_JWT_SECRET = 'test-patient-jwt-secret-64-chars-for-jose-compatibility-123456';
});

const mockCookieStore = {
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import {
  createMagicLinkToken,
  verifyMagicLinkToken,
  createPatientSession,
  verifyPatientSession,
  getPatientSession,
  getPatientSessionCookieConfig,
  getPatientLogoutCookieConfig,
  generateReferralCode,
  PATIENT_COOKIE_NAME,
} from '../session';

describe('magic link token', () => {
  it('creates and verifies a valid magic-link token', async () => {
    const email = 'jane@example.com';
    const token = await createMagicLinkToken(email);

    const verified = await verifyMagicLinkToken(token);
    expect(verified).toEqual({ email, purpose: 'magic-link' });
  });

  it('rejects non-matching purpose payload', async () => {
    const token = await new SignJWT({ email: 'jane@example.com', purpose: 'invalid-purpose' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));

    const verified = await verifyMagicLinkToken(token);
    expect(verified).toBeNull();
  });
});

describe('patient session token', () => {
  it('creates and verifies a valid patient session token', async () => {
    const token = await createPatientSession('p-1', 'jane@example.com', 'Jane Patient');
    const verified = await verifyPatientSession(token);

    expect(verified).toEqual({
      patientId: 'p-1',
      email: 'jane@example.com',
      name: 'Jane Patient',
    });
  });

  it('rejects malformed payload', async () => {
    const token = await new SignJWT({ patientId: 'p-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));

    const verified = await verifyPatientSession(token);
    expect(verified).toBeNull();
  });

  it('rejects expired patient session', async () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24;
    const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 12;

    const token = await new SignJWT({ patientId: 'p-1', email: 'jane@example.com', name: 'Jane' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(twoHoursAgo)
      .setExpirationTime(oneHourAgo)
      .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));

    const verified = await verifyPatientSession(token);
    expect(verified).toBeNull();
  });

  it('rejects wrong secret', async () => {
    const token = await new SignJWT({
      patientId: 'p-1',
      email: 'jane@example.com',
      name: 'Jane',
      purpose: 'magic-link',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode('wrong-secret-that-is-long-enough'));

    const verified = await verifyPatientSession(token);
    expect(verified).toBeNull();
  });

  it('rejects tokens with alg none', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        patientId: 'p-1',
        email: 'jane@example.com',
        name: 'Jane',
      })
    ).toString('base64url');
    const token = `${header}.${payload}.`;

    const verified = await verifyPatientSession(token);
    expect(verified).toBeNull();
  });

  it('falls back to DASHBOARD_JWT_SECRET when PATIENT_JWT_SECRET is missing', async () => {
    const originalPatientSecret = process.env.PATIENT_JWT_SECRET;
    const originalDashboardSecret = process.env.DASHBOARD_JWT_SECRET;

    process.env.PATIENT_JWT_SECRET = '';
    process.env.DASHBOARD_JWT_SECRET = 'fallback-dashboard-secret-64-chars-for-jose-compatibility-x';
    vi.resetModules();

    const sessionModule = await import('../session');
    const token = await sessionModule.createPatientSession('p-2', 'fallback@example.com', 'Fallback');
    const verified = await sessionModule.verifyPatientSession(token);

    expect(verified).toMatchObject({
      patientId: 'p-2',
      email: 'fallback@example.com',
      name: 'Fallback',
    });

    process.env.PATIENT_JWT_SECRET = originalPatientSecret;
    process.env.DASHBOARD_JWT_SECRET = originalDashboardSecret;
  });
});

describe('getPatientSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.get.mockReset();
  });

  it('returns session from cookie', async () => {
    const token = await createPatientSession('p-1', 'jane@example.com', 'Jane Patient');
    mockCookieStore.get.mockReturnValue({ value: token });

    const result = await getPatientSession();

    expect(result).toMatchObject({ patientId: 'p-1' });
    expect(mockCookieStore.get).toHaveBeenCalledWith(PATIENT_COOKIE_NAME);
  });

  it('returns null for missing patient session cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getPatientSession();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith(PATIENT_COOKIE_NAME);
  });

  it('returns null for invalid patient session cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'not-a-valid-token' });
    const result = await getPatientSession();
    expect(result).toBeNull();
  });
});

describe('patient cookies', () => {
  it('builds secure production cookie config', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const config = getPatientSessionCookieConfig('token');
    expect(config.name).toBe(PATIENT_COOKIE_NAME);
    expect(config.httpOnly).toBe(true);
    expect(config.secure).toBe(true);
    expect(config.sameSite).toBe('strict');
    expect(config.maxAge).toBe(604800);
    expect(config.path).toBe('/');

    process.env.NODE_ENV = originalEnv;
  });

  it('builds insecure test/dev cookie config', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const config = getPatientSessionCookieConfig('token');
    expect(config.secure).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });

  it('builds logout cookie config', () => {
    const config = getPatientLogoutCookieConfig();
    expect(config.maxAge).toBe(0);
    expect(config.value).toBe('');
    expect(config.httpOnly).toBe(true);
    expect(config.sameSite).toBe('strict');
  });
});

describe('generateReferralCode', () => {
  it('generates RANI-xxxx format using allowed characters', () => {
    const code = generateReferralCode();
    const suffix = code.replace(/^RANI-/, '');

    expect(code.startsWith('RANI-')).toBe(true);
    expect(suffix).toHaveLength(4);
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });
});
