/**
 * API Route: /api/booking/calendar
 *
 * GET - Get calendar data for a view (day/week/month)
 * Query params: view, date, colorMode?, providerId?
 */

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityEngine, DEFAULT_PROVIDERS, DEFAULT_SCHEDULING_CONFIG } from '@/lib/booking/availability';
import { CalendarManager } from '@/lib/booking/calendar';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import type { CalendarColorMode, CalendarView } from '@/lib/booking/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = (searchParams.get('view') ?? 'day') as CalendarView;
    const date = searchParams.get('date');
    const colorMode = (searchParams.get('colorMode') ?? 'service') as CalendarColorMode;
    const subView = searchParams.get('subView');

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const engine = new AvailabilityEngine(
      DEFAULT_PROVIDERS,
      DEFAULT_SCHEDULING_CONFIG,
      [], // TODO: Load from Airtable
      BOOKABLE_SERVICES,
    );

    const calendar = new CalendarManager(engine, BOOKABLE_SERVICES);

    // Sub-views
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

    // Main calendar views
    switch (view) {
      case 'day':
        return NextResponse.json(calendar.getDayView(date, colorMode));
      case 'week':
        return NextResponse.json({ days: calendar.getWeekView(date, colorMode) });
      case 'month':
        return NextResponse.json({ days: calendar.getMonthView(date, colorMode) });
      default:
        return NextResponse.json({ error: 'Invalid view type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
