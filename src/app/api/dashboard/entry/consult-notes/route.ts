import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_request: NextRequest) {
  return withSentry('dashboard-entry-consult-notes', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true });
  });
}
