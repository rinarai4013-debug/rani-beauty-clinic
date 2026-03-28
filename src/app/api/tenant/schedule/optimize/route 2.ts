import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getScheduleOptimization } from '@/lib/saas/tenant-dashboard/schedule';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || undefined;
  const optimization = await getScheduleOptimization(db, tenant, date);
  return NextResponse.json(optimization);
}, { requiredFeature: 'schedule' });
