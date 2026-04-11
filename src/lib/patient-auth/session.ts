import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import crypto from 'crypto';
import { env } from '../env';

// ─── Constants ──────────────────────────────────────────────────────────────
const PATIENT_COOKIE_NAME = 'rani-patient-session';
const MAGIC_LINK_EXPIRY = '15m'; // Magic link valid for 15 minutes
const SESSION_EXPIRY = '7d';     // Patient session lasts 7 days
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── Secret ─────────────────────────────────────────────────────────────────
function getSecret() {
  const raw = env.PATIENT_JWT_SECRET || env.DASHBOARD_JWT_SECRET;
  if (!raw) {
    throw new Error('PATIENT_JWT_SECRET or DASHBOARD_JWT_SECRET is required');
  }
  return new TextEncoder().encode(raw);
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface PatientSessionPayload {
  patientId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface MagicLinkPayload {
  email: string;
  purpose: 'magic-link';
  iat?: number;
  exp?: number;
}

// ─── Schemas ────────────────────────────────────────────────────────────────
const patientSessionSchema = z.object({
  patientId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

const magicLinkSchema = z.object({
  email: z.string().email(),
  purpose: z.literal('magic-link'),
});

// ─── Magic Link Token ───────────────────────────────────────────────────────
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = await new SignJWT({ email, purpose: 'magic-link' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(MAGIC_LINK_EXPIRY)
    .sign(getSecret());

  return token;
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const parsed = magicLinkSchema.safeParse(payload);
    if (!parsed.success) return null;
    return payload as unknown as MagicLinkPayload;
  } catch {
    return null;
  }
}

// ─── Patient Session ────────────────────────────────────────────────────────
export async function createPatientSession(
  patientId: string,
  email: string,
  name: string
): Promise<string> {
  const token = await new SignJWT({ patientId, email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecret());

  return token;
}

export async function verifyPatientSession(token: string): Promise<PatientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const parsed = patientSessionSchema.safeParse(payload);
    if (!parsed.success) return null;
    return payload as unknown as PatientSessionPayload;
  } catch {
    return null;
  }
}

export async function getPatientSession(): Promise<PatientSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PATIENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPatientSession(token);
}

export function getPatientSessionCookieConfig(token: string) {
  return {
    name: PATIENT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}

export function getPatientLogoutCookieConfig() {
  return {
    name: PATIENT_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };
}

// ─── Referral Code Generator ────────────────────────────────────────────────
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `RANI-${code}`;
}

export { PATIENT_COOKIE_NAME, SESSION_MAX_AGE };
