import { type NextRequest, NextResponse } from 'next/server';
import { withTenant } from '../middleware';
import { getCalendarData } from '@/lib/saas/tenant-dashboard/schedule';
import type { CalendarView } from '@/lib/saas/tenant-dashboard/schedule';
import { z } from 'zod';

const scheduleQuerySchema = z.object({
  view: z.enum(['day', 'week', 'month']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provider: z.string().min(1).optional(),
});

export const GET = withTenant(async (request: NextRequest, { tenant, db }) => {
  const { searchParams } = new URL(request.url);
  const parsedQuery = scheduleQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const {
    view = 'day',
    date = new Date().toISOString().split('T')[0],
    provider,
  } = parsedQuery.data;

  const data = await getCalendarData(db, tenant, view as CalendarView, date, provider);
  return NextResponse.json(data);
});
