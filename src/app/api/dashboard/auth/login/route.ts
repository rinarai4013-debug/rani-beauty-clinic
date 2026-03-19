import { NextResponse } from 'next/server';
import { createSession, getSessionCookieConfig } from '@/lib/auth/session';
import { timingSafeEqual } from 'crypto';
import type { UserRole } from '@/types/auth';
import { logAuthFailure, logEvent } from '@/lib/logging/structured-logger';

// --- Credentials from environment ---
interface Credential {
  password: string;
  role: UserRole;
  displayName: string;
}

function getCredentials(): Record<string, Credential> {
  const raw = process.env.DASHBOARD_USERS;
  if (!raw) throw new Error('DASHBOARD_USERS environment variable is required');
  return JSON.parse(raw) as Record<string, Credential>;
}

// --- Rate limiting ---
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const failedAttempts = new Map<string, RateLimitEntry>();

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count++;
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant time, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);

    if (isRateLimited(ip)) {
      logAuthFailure(ip, 'unknown', 'Rate limited — too many failed attempts');
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429 },
      );
    }

    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 },
      );
    }

    const credentials = getCredentials();
    const credential = credentials[username];

    if (!credential || !safeCompare(password, credential.password)) {
      recordFailedAttempt(ip);
      logAuthFailure(ip, username, !credential ? 'Unknown username' : 'Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    clearFailedAttempts(ip);
    logEvent('auth', 'info', 'Login successful', { ip, username, role: credential.role });

    const token = await createSession(username, credential.role, credential.displayName);
    const cookieConfig = getSessionCookieConfig(token);

    const response = NextResponse.json({
      success: true,
      user: {
        username,
        role: credential.role,
        displayName: credential.displayName,
      },
    });

    response.cookies.set(cookieConfig);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}
