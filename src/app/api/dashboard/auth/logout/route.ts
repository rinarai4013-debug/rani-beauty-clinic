import { NextResponse } from 'next/server';
import { COOKIE_NAME, getSession } from '@/lib/auth/session';
import { captureAuthEvent } from '@/lib/sentry-utils';
import { env } from '@/lib/env';

export async function POST() {
  const session = await getSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  captureAuthEvent('logout', session?.username ?? 'unknown', true);
  return response;
}
