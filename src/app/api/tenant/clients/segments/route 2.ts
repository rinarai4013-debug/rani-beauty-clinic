import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getSegmentDistribution } from '@/lib/saas/tenant-dashboard/clients';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const segments = await getSegmentDistribution(db, tenant);
  return NextResponse.json(segments);
});
