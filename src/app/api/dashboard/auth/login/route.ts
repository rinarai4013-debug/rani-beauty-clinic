import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createSession, getSessionCookieConfig } from '@/lib/auth/session';
import { getClientIP } from '@/lib/rate-limit';
import { logAuthFailure } from '@/lib/logging/structured-logger';
import { captureAuthEvent } from '@/lib/sentry-utils';
import type { UserRole } from '@/types/auth';

type DashboardUser = {
  password: string;
  role: UserRole;
  displayName: string;
  tenantId?: string;
};

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const FAILED_LIMIT = 5;
const FAILED_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getUsers(): Record<string, DashboardUser> {
  const raw = process.env.DASHBOARD_USERS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, DashboardUser>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function recordFailure(ip: string): { blocked: boolean; resetIn: number } {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + FAILED_WINDOW_MS });
    return { blocked: false, resetIn: FAILED_WINDOW_MS };
  }

  if (entry.count >= FAILED_LIMIT) {
    return { blocked: true, resetIn: entry.resetAt - now };
  }

  entry.count += 1;
  return { blocked: false, resetIn: entry.resetAt - now };
}

function clearFailures(ip: string) {
  failedAttempts.delete(ip);
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function hashPassword(password: string, iterations = 100_000): string {
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith('pbkdf2$')) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    const salt = parts[2];
    const hash = parts[3];
    if (!iterations || !salt || !hash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
    return safeEqual(computed, hash);
  }

  return safeEqual(password, stored);
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const users = getUsers();
  const user = users[username];

  if (!user) {
    const attempt = recordFailure(ip);
    logAuthFailure(ip, username, 'unknown_username');
    captureAuthEvent('login', username, false, { reason: 'unknown_username', ip });
    if (attempt.blocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = verifyPassword(password, user.password);
  if (!ok) {
    const attempt = recordFailure(ip);
    logAuthFailure(ip, username, 'invalid_password');
    captureAuthEvent('login', username, false, { reason: 'invalid_password', ip });
    if (attempt.blocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  clearFailures(ip);
  const token = await createSession(username, user.role, user.displayName, user.tenantId);
  const response = NextResponse.json({
    success: true,
    user: {
      username,
      role: user.role,
      displayName: user.displayName,
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    },
  });
  response.cookies.set(getSessionCookieConfig(token));
  captureAuthEvent('login', username, true, { ip });
  return response;
}
