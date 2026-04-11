import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('dashboard-entry-eod-recap', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_eod_recap')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  });
}
