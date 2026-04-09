import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { SessionPayload, UserRole } from '@/types/auth';

const COOKIE_NAME = 'rani-session';

/** Lazy-initialised JWT secret — avoids crashing at import time during `next build`. */
let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (!_secret) {
    if (!process.env.DASHBOARD_JWT_SECRET) {
      throw new Error('DASHBOARD_JWT_SECRET is required');
    }
    _secret = new TextEncoder().encode(process.env.DASHBOARD_JWT_SECRET);
  }
  return _secret;
}

const sessionPayloadSchema = z.object({
  username: z.string().min(1),
  role: z.enum(['ceo', 'frontdesk', 'provider', 'marketing', 'operations']),
  displayName: z.string().min(1),
});

export async function createSession(username: string, role: UserRole, displayName: string): Promise<string> {
  const token = await new SignJWT({ username, role, displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const parsed = sessionPayloadSchema.safeParse(payload);
    if (!parsed.success) return null;
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

export async function getSessionFromRequest(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return null;
  }

  return session;
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
