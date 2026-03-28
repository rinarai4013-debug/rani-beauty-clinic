import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getNoShowPredictions } from '@/lib/saas/tenant-dashboard/schedule';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || undefined;
  const predictions = await getNoShowPredictions(db, tenant, date);
  return NextResponse.json(predictions);
}, { requiredFeature: 'noShow' });
