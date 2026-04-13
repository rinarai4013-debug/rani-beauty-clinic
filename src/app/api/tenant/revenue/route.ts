import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getRevenueBreakdown } from '@/lib/saas/tenant-dashboard/revenue';
import { withSentry } from '@/lib/sentry-utils';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  return withSentry('tenant/revenue', async () => {
    const { searchParams } = new URL(request.url);
    const rawStart = searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString();
    const rawEnd = searchParams.get('end') || new Date().toISOString();

    const startTimestamp = Date.parse(rawStart);
    const endTimestamp = Date.parse(rawEnd);
    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      return NextResponse.json({ error: 'Invalid start/end date' }, { status: 400 });
    }
    if (startTimestamp > endTimestamp) {
      return NextResponse.json({ error: 'start must be before end' }, { status: 400 });
    }

    const start = sanitizeFormulaValue(new Date(startTimestamp).toISOString());
    const end = sanitizeFormulaValue(new Date(endTimestamp).toISOString());
    const breakdown = await getRevenueBreakdown(db, tenant, start, end);
    return NextResponse.json(breakdown);
  });
});
