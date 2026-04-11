import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

export async function POST(_request: NextRequest) {
  return withSentry('dashboard-entry-staff-note', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true });
  });
}
