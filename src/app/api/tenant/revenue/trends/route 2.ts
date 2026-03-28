import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getRevenueTrend } from '@/lib/saas/tenant-dashboard/revenue';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const trend = await getRevenueTrend(db, tenant, days);
  return NextResponse.json(trend);
});
