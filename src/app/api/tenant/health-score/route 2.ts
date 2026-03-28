import { NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getClinicHealthScore } from '@/lib/saas/tenant-dashboard/overview';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const score = await getClinicHealthScore(db, tenant);
  return NextResponse.json(score);
});
