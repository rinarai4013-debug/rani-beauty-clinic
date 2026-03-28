import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { runChurnPrediction } from '@/lib/saas/tenant-dashboard/ai-engines';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const dashboard = await runChurnPrediction(db, tenant);
  return NextResponse.json(dashboard);
}, { requiredFeature: 'churn' });
