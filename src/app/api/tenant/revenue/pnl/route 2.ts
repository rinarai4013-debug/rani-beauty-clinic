import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getPnLSummary } from '@/lib/saas/tenant-dashboard/revenue';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const end = searchParams.get('end') || new Date().toISOString();
  const pnl = await getPnLSummary(db, tenant, start, end);
  return NextResponse.json(pnl);
}, { requiredFeature: 'pnl' });
