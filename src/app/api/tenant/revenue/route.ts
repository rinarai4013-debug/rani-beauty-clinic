import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getRevenueBreakdown } from '@/lib/saas/tenant-dashboard/revenue';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString();
  const end = searchParams.get('end') || new Date().toISOString();
  const breakdown = await getRevenueBreakdown(db, tenant, start, end);
  return NextResponse.json(breakdown);
});
