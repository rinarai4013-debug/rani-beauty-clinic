import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { SessionPayload, UserRole } from '@/types/auth';

const COOKIE_NAME = 'rani-session';

function getSecret(): Uint8Array {
  const raw = process.env.DASHBOARD_JWT_SECRET;
  if (!raw) {
    throw new Error('DASHBOARD_JWT_SECRET is required');
  }
  return new TextEncoder().encode(raw);
}

const sessionPayloadSchema = z.object({
  username: z.string().min(1),
  role: z.enum(['ceo', 'frontdesk', 'provider', 'marketing', 'operations']),
  displayName: z.string().min(1),
  tenantId: z.string().min(1).optional(),
});

export async function createSession(
  username: string,
  role: UserRole,
  displayName: string,
  tenantId?: string,
): Promise<string> {
  const token = await new SignJWT({ username, role, displayName, ...(tenantId ? { tenantId } : {}) })
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
