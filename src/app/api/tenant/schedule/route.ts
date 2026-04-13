import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getCalendarData } from '@/lib/saas/tenant-dashboard/schedule';
import type { CalendarView } from '@/lib/saas/tenant-dashboard/schedule';
import { withSentry } from '@/lib/sentry-utils';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';

const ALLOWED_VIEWS = new Set<CalendarView>(['day', 'week', 'month']);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  return withSentry('tenant/schedule', async () => {
    const { searchParams } = new URL(request.url);
    const rawView = (searchParams.get('view') || 'day') as CalendarView;
    if (!ALLOWED_VIEWS.has(rawView)) {
      return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    }

    const rawDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    if (!ISO_DATE_PATTERN.test(rawDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const provider = searchParams.get('provider')
      ? sanitizeFormulaValue(searchParams.get('provider') as string)
      : undefined;

    const data = await getCalendarData(db, tenant, rawView, rawDate, provider);
    return NextResponse.json(data);
  });
});
