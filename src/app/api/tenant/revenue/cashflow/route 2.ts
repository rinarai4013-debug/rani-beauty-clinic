import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getCashFlowOverview } from '@/lib/saas/tenant-dashboard/revenue';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const cashFlow = await getCashFlowOverview(db, tenant);
  return NextResponse.json(cashFlow);
}, { requiredFeature: 'pnl' });
