import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { calculateClinicScore } from '@/lib/gamification/engine';
import { withSentry } from '@/lib/sentry-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Field interfaces ──

interface TransactionFields {
  'Date': string;
  'Amount': number;
  'Type': string;
  'Status': string;
}

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Is Consult': boolean;
  'Consult Type': string;
  'Service Category': string;
}

interface ClientFields {
  'Status': string;
}

const ALLOWED_KPI_RANGES = new Set(['today', '7d', '30d', '90d']);

// ── Date helpers ──

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns [rangeStart, rangeEnd] as YYYY-MM-DD strings for the current period */
function getRangeDates(range: string): { start: string; end: string } {
  const now = new Date();
  const end = todayISO();

  switch (range) {
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6); // 7 days including today
      return { start: d.toISOString().slice(0, 10), end };
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: d.toISOString().slice(0, 10), end };
    }
    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { start: d.toISOString().slice(0, 10), end };
    }
    case 'today':
    default:
      return { start: end, end };
  }
}

/** Returns [rangeStart, rangeEnd] for the comparison (previous) period */
function getPreviousPeriodDates(range: string): { start: string; end: string } {
  const now = new Date();

  switch (range) {
    case '7d': {
      const end = new Date(now);
      end.setDate(end.getDate() - 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case '30d': {
      const end = new Date(now);
      end.setDate(end.getDate() - 30);
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case '90d': {
      const end = new Date(now);
      end.setDate(end.getDate() - 90);
      const start = new Date(end);
      start.setDate(start.getDate() - 89);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    }
    case 'today':
    default: {
      // Compare to yesterday
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const prev = d.toISOString().slice(0, 10);
      return { start: prev, end: prev };
    }
  }
}

/** Week start (Monday) as YYYY-MM-DD for the current week */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

/** Build Airtable date range filter */
function dateRangeFilter(field: string, start: string, end: string): string {
  if (start === end) {
    return `IS_SAME({${field}}, '${start}', 'day')`;
  }
  return `AND({${field}} >= '${start}', {${field}} <= '${end}')`;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Route handler ──

export async function GET(req: NextRequest) {
  return withSentry('dashboard/kpis', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = new URL(req.url).searchParams;
    const range = searchParams.get('range') || 'today';
    if (!ALLOWED_KPI_RANGES.has(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }
    const cacheKey = 'kpis';

    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
    const current = getRangeDates(range);
    const previous = getPreviousPeriodDates(range);
    const weekStart = getWeekStart();
    const today = todayISO();

    // Build filters — single Airtable call per table covering both current + previous periods
    // For efficiency, fetch the wider range that covers both periods, then filter in JS
    const widestStart = previous.start < current.start ? previous.start : current.start;

    const txnFilter = `AND(${dateRangeFilter('Date', widestStart, current.end)}, {Status} = "Completed")`;
    const apptFilter = dateRangeFilter('Date', widestStart, current.end);
    const weekConsultFilter = `AND(${dateRangeFilter('Date', weekStart, today)}, {Is Consult} = TRUE())`;

    // Active leads: clients with status "New Lead" (always fetched, not date-dependent)
    const leadFilter = `OR({Status} = "New Lead")`;

    const [allTransactions, allAppointments, weekConsults, activeLeads] = await Promise.all([
      fetchAll<TransactionFields>(
        Tables.transactions(),
        {
          filterByFormula: txnFilter,
          fields: ['Date', 'Amount', 'Type', 'Status'],
        }
      ),
      fetchAll<AppointmentFields>(
        Tables.appointments(),
        {
          filterByFormula: apptFilter,
          fields: ['Date', 'Status', 'Is Consult', 'Service Category'],
        }
      ),
      fetchAll<AppointmentFields>(
        Tables.appointments(),
        {
          filterByFormula: weekConsultFilter,
          fields: ['Date', 'Is Consult'],
        }
      ),
      fetchAll<ClientFields>(
        Tables.clients(),
        {
          filterByFormula: leadFilter,
          fields: ['Status'],
        },
        true // skipTestFilter — Clients table has no "Is Test" field
      ),
    ]);

    // ── Split current vs previous period in JS ──

    const inRange = (dateStr: string, start: string, end: string) =>
      dateStr >= start && dateStr <= end;

    // Revenue
    const currentRevenue = allTransactions
      .filter((t) => inRange(t.fields['Date'] || '', current.start, current.end))
      .reduce((sum, t) => {
        const amt = Number(t.fields['Amount']) || 0;
        return sum + (t.fields['Type'] === 'Refund' ? -amt : amt);
      }, 0);

    const previousRevenue = allTransactions
      .filter((t) => inRange(t.fields['Date'] || '', previous.start, previous.end))
      .reduce((sum, t) => {
        const amt = Number(t.fields['Amount']) || 0;
        return sum + (t.fields['Type'] === 'Refund' ? -amt : amt);
      }, 0);

    // Bookings (non-cancelled appointments in range)
    const currentAppts = allAppointments.filter(
      (a) => inRange(a.fields['Date'] || '', current.start, current.end)
    );
    const previousAppts = allAppointments.filter(
      (a) => inRange(a.fields['Date'] || '', previous.start, previous.end)
    );

    const currentBookings = currentAppts.filter(
      (a) => a.fields['Status'] !== 'cancelled'
    ).length;
    const previousBookings = previousAppts.filter(
      (a) => a.fields['Status'] !== 'cancelled'
    ).length;

    // Consults this week (from dedicated query)
    const consultsThisWeek = weekConsults.length;

    // Active leads count
    const activeLeadsCount = activeLeads.length;

    // Show rate for current period
    const completed = currentAppts.filter(
      (a) => a.fields['Status'] === 'completed'
    ).length;
    const noShows = currentAppts.filter(
      (a) => a.fields['Status'] === 'no_show'
    ).length;
    const showRate = currentBookings > 0
      ? Math.round((completed / (completed + noShows || 1)) * 100)
      : null;

    // Average ticket
    const avgTicket = currentBookings > 0
      ? Math.round((currentRevenue / currentBookings) * 100) / 100
      : 0;

    const clinicScore = calculateClinicScore({
      revenue: currentRevenue,
      revenueTarget: 4000,
      bookedHours: currentBookings,
      availableHours: Math.max(currentBookings, 8),
      consultsClosed: Math.max(0, Math.floor(consultsThisWeek * 0.6)),
      consultsCompleted: consultsThisWeek,
      patientsRebooked: Math.max(0, currentBookings - 1),
      patientsSeen: currentBookings,
      reviewsReceived: 0,
      followUpsCompleted: activeLeadsCount,
      followUpsDue: activeLeadsCount,
      onTimeStarts: currentBookings,
      totalAppointments: currentBookings,
      noShows,
      cancellations: currentAppts.filter((a) => a.fields['Status'] === 'cancelled').length,
    });

    const result = {
      range,
      revenue: {
        today: Math.round(currentRevenue * 100) / 100,
        previous: Math.round(previousRevenue * 100) / 100,
        changePct: pctChange(currentRevenue, previousRevenue),
      },
      bookings: {
        today: currentBookings,
        previous: previousBookings,
        changePct: pctChange(currentBookings, previousBookings),
      },
      consults: {
        week: consultsThisWeek,
      },
      clients: {
        leads: activeLeadsCount,
      },
      alerts: [],
      clinicScore,
      showRate,
      avgTicket,
      comparison: {
        revenue: pctChange(currentRevenue, previousRevenue),
        bookings: pctChange(currentBookings, previousBookings),
        period: range === 'today' ? 'vs yesterday' : `vs previous ${range}`,
      },
      asOf: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.REALTIME); // 30s — matches SWR refresh
      return NextResponse.json(result);
    } catch (err) {
      console.error('[dashboard/kpis]', err);
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
    }
  });
}
