import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getProviderPerformance, getProviderScheduleSnapshot } from '@/lib/dashboard/mangomint-intelligence';

export async function GET(_request: NextRequest, { params }: { params: { name: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_providers')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const providerName = decodeURIComponent(params.name);
  const [performance, schedules] = await Promise.all([
    getProviderPerformance(),
    getProviderScheduleSnapshot(),
  ]);

  const provider = performance.find((item) => item.provider.toLowerCase() === providerName.toLowerCase());
  const schedule = schedules.find((item) => item.provider.toLowerCase() === providerName.toLowerCase());

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  return NextResponse.json({
    provider,
    schedule,
  });
}
