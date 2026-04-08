import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import { CalendarManager } from '@/lib/booking/calendar';
import { loadAppointmentsForRange } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';
import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';

const querySchema = z.object({
  view: z.enum(['day', 'week', 'month']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  colorMode: z.enum(['service', 'provider', 'room', 'status']).optional(),
  subView: z.enum(['providers', 'rooms', 'revenue', 'print']).optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { view = 'day', date, colorMode = 'service', subView } = parsed.data;

  try {
    const baseDate = parseISO(date);
    let startDate = date;
    let endDate = date;

    if (view === 'week') {
      startDate = format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (view === 'month') {
      startDate = format(startOfMonth(baseDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(baseDate), 'yyyy-MM-dd');
    }

    const appointments = await loadAppointmentsForRange(startDate, endDate);
    const engine = new AvailabilityEngine(DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG, appointments, BOOKABLE_SERVICES);
    const calendar = new CalendarManager(engine, BOOKABLE_SERVICES);

    if (subView === 'providers') {
      return NextResponse.json({ providers: calendar.getProviderView(date) });
    }
    if (subView === 'rooms') {
      return NextResponse.json({ rooms: calendar.getRoomView(date) });
    }
    if (subView === 'revenue') {
      return NextResponse.json({ revenue: calendar.getRevenueOverlay(date) });
    }
    if (subView === 'print') {
      return NextResponse.json(calendar.getPrintSchedule(date));
    }

    if (view === 'day') {
      return NextResponse.json(calendar.getDayView(date, colorMode));
    }
    if (view === 'week') {
      return NextResponse.json({ days: calendar.getWeekView(date, colorMode) });
    }
    if (view === 'month') {
      return NextResponse.json({ days: calendar.getMonthView(date, colorMode) });
    }

    return NextResponse.json({ error: 'Unsupported view' }, { status: 400 });
  } catch (error) {
    logEvent('api', 'error', 'Calendar fetch failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
