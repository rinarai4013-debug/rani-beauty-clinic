import { NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { getReportDefinitions } from '@/lib/saas/tenant-dashboard/reports';

export const GET = withTenant(async (_request) => {
  const definitions = getReportDefinitions();
  return NextResponse.json(definitions);
});
