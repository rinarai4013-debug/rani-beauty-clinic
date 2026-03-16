import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionPayload, UserRole } from '@/types/auth';

const COOKIE_NAME = 'rani-session';
const secret = new TextEncoder().encode(process.env.DASHBOARD_JWT_SECRET || 'dev-secret-change-me');

export async function createSession(username: string, role: UserRole, displayName: string): Promise<string> {
  const token = await new SignJWT({ username, role, displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function getSessionCookieConfig(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 86400, // 24 hours
    path: '/',
  };
}

export { COOKIE_NAME };
