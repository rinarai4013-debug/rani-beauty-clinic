import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
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
}
