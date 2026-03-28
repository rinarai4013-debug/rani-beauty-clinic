import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getReviewSummary } from '@/lib/saas/tenant-dashboard/communications';

export const GET = withTenant(async (_request, { tenant, db }) => {
  const reviews = await getReviewSummary(db, tenant);
  return NextResponse.json(reviews);
});
