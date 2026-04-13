import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, createSession, getSessionCookieConfig } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';
import type { UserRole } from '@/types/auth';
import { z } from 'zod';

interface DashboardUser {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function getFailedAttemptState(ip: string) {
  const now = Date.now();
  const existing = failedLoginAttempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    const nextState = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    failedLoginAttempts.set(ip, nextState);
    return nextState;
  }
  return existing;
}

function recordFailedAttempt(ip: string) {
  const state = getFailedAttemptState(ip);
  state.count += 1;
  return state.count;
}

function clearFailedAttempts(ip: string) {
  failedLoginAttempts.delete(ip);
}

function isRateLimited(ip: string) {
  return getFailedAttemptState(ip).count >= MAX_FAILED_ATTEMPTS;
}

function isHashedPassword(value: string) {
  return value.startsWith('pbkdf2$');
}

function verifyPassword(password: string, storedPassword: string) {
  if (!isHashedPassword(storedPassword)) {
    return storedPassword === password;
  }

  const [, iterationString, salt, expectedHash] = storedPassword.split('$');
  const iterations = Number(iterationString);
  if (!salt || !expectedHash || !Number.isFinite(iterations)) {
    return false;
  }

  const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function getCookieConfig(token: string) {
  const config = getSessionCookieConfig(token);

  if (!config || typeof config.name !== 'string' || typeof config.value !== 'string') {
    return {
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 86400,
      path: '/',
    };
  }

  return config;
}

function getUsers(): DashboardUser[] {
  const raw = process.env.DASHBOARD_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // Support both formats:
    // Object: {"email": {"password":"...", "role":"...", "displayName":"..."}}
    // Array: [{"username":"...", "password":"...", "role":"...", "displayName":"..."}]
    if (Array.isArray(parsed)) return parsed as DashboardUser[];
    return Object.entries(parsed).map(([email, data]) => ({
      username: email,
      ...(data as Omit<DashboardUser, 'username'>),
    }));
  } catch {
    console.error('[auth/login] Failed to parse DASHBOARD_USERS env var');
    return [];
  }
}

const LoginBodySchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  return withSentry('dashboard/auth/login', async () => {
    const ip = getClientIp(req);

    try {
      const parsed = LoginBodySchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
          { status: 400 }
        );
      }

      const { username, password } = parsed.data;

      const normalizedUsername = username.toLowerCase();

      if (isRateLimited(ip)) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please try again later.' },
          { status: 429 }
        );
      }

      const users = getUsers();
      const user = users.find(
        (u) =>
          u.username.toLowerCase() === normalizedUsername && verifyPassword(password, u.password)
      );

      if (!user) {
        recordFailedAttempt(ip);
        // Consistent timing to prevent username enumeration
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      clearFailedAttempts(ip);
      const token = await createSession(user.username, user.role, user.displayName);
      const cookieConfig = getCookieConfig(token);

      const response = NextResponse.json({
        success: true,
        user: { username: user.username, role: user.role, displayName: user.displayName },
      });

      response.cookies.set(cookieConfig.name, cookieConfig.value, {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: cookieConfig.maxAge,
        path: cookieConfig.path,
      });
      return response;
    } catch (err) {
      if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      console.error('[auth/login]', err);
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
  });
}

// Block GET (stub was GET-only)
export async function GET() {
  return withSentry('dashboard/auth/login:get', async () =>
    NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  );
}
