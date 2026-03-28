import { NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getAlertSummary } from '@/lib/saas/tenant-dashboard/overview';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const alerts = await getAlertSummary(db, tenant);
  return NextResponse.json(alerts);
});
