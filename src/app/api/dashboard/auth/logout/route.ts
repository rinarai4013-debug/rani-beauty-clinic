import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

export async function POST() {
  return withSentry('dashboard/auth/logout', async () => {
    try {
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
      return response;
    } catch (err) {
      console.error('[dashboard/auth/logout]', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function GET() {
  return withSentry('dashboard/auth/logout:get', async () =>
    NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  );
}
