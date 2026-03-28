import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../../middleware';
import { generateReport } from '@/lib/saas/tenant-dashboard/reports';
import type { ReportId } from '@/lib/saas/tenant-dashboard/reports';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id') as ReportId;
  const start = searchParams.get('start') || undefined;
  const end = searchParams.get('end') || undefined;

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  const dateRange = start && end ? { start, end } : undefined;
  const report = await generateReport(db, tenant, reportId, dateRange);
  return NextResponse.json(report);
});
