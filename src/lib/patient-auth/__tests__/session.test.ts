// @vitest-environment node

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

const cookiesMock = vi.fn();
const mockCookieStore = {
  get: vi.fn(),
};

vi.hoisted(() => {
  process.env.PATIENT_JWT_SECRET = 'patient-secret-key-for-tests-at-least-32chars';
  process.env.DASHBOARD_JWT_SECRET = 'dashboard-secret-key-for-tests-at-least-32chars';
  process.env.NODE_ENV = 'test';
});

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
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
  SESSION_MAX_AGE,
} from '@/lib/patient-auth/session';

describe('patient-auth/session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    vi.clearAllMocks();
    mockCookieStore.get.mockReset();
    cookiesMock.mockResolvedValue(mockCookieStore);
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('magic links', () => {
    it('creates a token that can be verified', async () => {
      const token = await createMagicLinkToken('rina@ranibeauty.com');

      const payload = await verifyMagicLinkToken(token);

      expect(payload).toEqual({
        email: 'rina@ranibeauty.com',
        purpose: 'magic-link',
      });
    });

    it('returns null for a token with the wrong signature', async () => {
      const token = await new SignJWT({
        email: 'rina@ranibeauty.com',
        purpose: 'magic-link',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(new TextEncoder().encode('wrong-secret-key-for-tests-at-least-32'));

      await expect(verifyMagicLinkToken(token)).resolves.toBeNull();
    });

    it('returns null for a token with the wrong purpose', async () => {
      const token = await new SignJWT({
        email: 'rina@ranibeauty.com',
        purpose: 'patient-session',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(
          new TextEncoder().encode(process.env.PATIENT_JWT_SECRET as string),
        );

      await expect(verifyMagicLinkToken(token)).resolves.toBeNull();
    });
  });

  describe('patient sessions', () => {
    it('creates a patient session token that can be verified', async () => {
      const token = await createPatientSession(
        'patient-rina',
        'rina@ranibeauty.com',
        'Rina'
      );

      const payload = await verifyPatientSession(token);

      expect(payload).toEqual({
        patientId: 'patient-rina',
        email: 'rina@ranibeauty.com',
        name: 'Rina',
      });
    });

    it('returns null for an expired patient session token', async () => {
      const token = await new SignJWT({
        patientId: 'patient-rina',
        email: 'rina@ranibeauty.com',
        name: 'Rina',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(Math.floor(new Date('2026-04-01T12:00:00Z').getTime() / 1000))
        .setExpirationTime(Math.floor(new Date('2026-04-05T12:00:00Z').getTime() / 1000))
        .sign(
          new TextEncoder().encode(process.env.PATIENT_JWT_SECRET as string),
        );

      await expect(verifyPatientSession(token)).resolves.toBeNull();
    });

    it('returns null when required claims are missing', async () => {
      const token = await new SignJWT({
        patientId: 'patient-rina',
        email: 'rina@ranibeauty.com',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(
          new TextEncoder().encode(process.env.PATIENT_JWT_SECRET as string),
        );

      await expect(verifyPatientSession(token)).resolves.toBeNull();
    });
  });

  describe('cookie-backed session lookup', () => {
    it('returns null when the session cookie is missing', async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      await expect(getPatientSession()).resolves.toBeNull();
    });

    it('returns the verified payload when the session cookie is present', async () => {
      const token = await createPatientSession(
        'patient-mom',
        'mom@ranibeauty.com',
        'Mom'
      );
      mockCookieStore.get.mockReturnValueOnce({ value: token });

      await expect(getPatientSession()).resolves.toEqual({
        patientId: 'patient-mom',
        email: 'mom@ranibeauty.com',
        name: 'Mom',
      });
    });
  });

  describe('cookie config helpers', () => {
    it('returns strict httpOnly cookie config for patient sessions', () => {
      const config = getPatientSessionCookieConfig('session-token');

      expect(config).toEqual({
        name: PATIENT_COOKIE_NAME,
        value: 'session-token',
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
    });

    it('marks the patient session cookie as secure in production', () => {
      process.env.NODE_ENV = 'production';

      expect(getPatientSessionCookieConfig('session-token').secure).toBe(true);
    });

    it('returns an expired cookie config for logout', () => {
      expect(getPatientLogoutCookieConfig()).toEqual({
        name: PATIENT_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
    });
  });

  describe('referral code generation', () => {
    it('creates a referral code with the RANI prefix and safe characters', () => {
      const code = generateReferralCode();

      expect(code).toMatch(/^RANI-[A-HJ-NP-Z2-9]{4}$/);
    });
  });
});
