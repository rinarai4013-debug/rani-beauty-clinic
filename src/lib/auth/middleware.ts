import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './session';
import type { SessionPayload, UserRole } from '@/types/auth';

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<SessionPayload | null> {
  return getSessionFromRequest(request, allowedRoles);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
