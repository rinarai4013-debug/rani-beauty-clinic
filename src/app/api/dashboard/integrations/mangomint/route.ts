import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getMangomintHealth } from '@/lib/dashboard/mangomint-intelligence';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const health = await getMangomintHealth();

  return NextResponse.json({
    integration: 'mangomint',
    ...health,
    recommendation:
      health.lastSyncStatus === 'healthy'
        ? 'Mangomint is healthy. Focus next on no-show prevention, rebooking, and provider fill pressure.'
        : 'Fix API/webhook health before relying on dashboard schedule intelligence.',
  });
}
