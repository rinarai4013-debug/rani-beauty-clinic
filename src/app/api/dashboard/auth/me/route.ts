import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return withSentry('dashboard/auth/me', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.json({
        user: {
          username: session.username,
          role: session.role,
          displayName: session.displayName,
        },
      });
    } catch (err) {
      console.error('[dashboard/auth/me]', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
