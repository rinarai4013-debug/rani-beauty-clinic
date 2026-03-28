import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getCalendarData } from '@/lib/saas/tenant-dashboard/schedule';
import type { CalendarView } from '@/lib/saas/tenant-dashboard/schedule';

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const view = (searchParams.get('view') || 'day') as CalendarView;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const provider = searchParams.get('provider') || undefined;

  const data = await getCalendarData(db, tenant, view, date, provider);
  return NextResponse.json(data);
});
