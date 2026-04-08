import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { captureAuthEvent } from '@/lib/sentry-utils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      captureAuthEvent('unauthorized', 'unknown', false);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        username: session.username,
        role: session.role,
        displayName: session.displayName,
        ...(session.tenantId ? { tenantId: session.tenantId } : {}),
      },
    });
  } catch (err) {
    captureAuthEvent('unauthorized', 'unknown', false, { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
