import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from './session';
import type { SessionPayload, UserRole } from '@/types/auth';

export async function requireAuth(
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

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
