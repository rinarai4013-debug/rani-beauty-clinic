import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getProviderPerformance, getProviderScheduleSnapshot } from '@/lib/dashboard/mangomint-intelligence';

const paramsSchema = z.object({
  name: z.string().trim().min(1),
});

export async function GET(_request: NextRequest, { params }: { params: { name: string } }) {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid provider name' }, { status: 400 });
  }

  const providerName = decodeURIComponent(parsedParams.data.name.toLowerCase());

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_providers')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
