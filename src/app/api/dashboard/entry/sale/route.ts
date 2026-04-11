import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { withSentry } from '@/lib/sentry-utils';

export async function GET() {
  return withSentry('dashboard-entry-sale', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'entry_sale')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
  });
}
