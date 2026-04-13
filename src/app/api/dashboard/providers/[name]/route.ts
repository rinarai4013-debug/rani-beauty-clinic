import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';

interface AppointmentFields {
  'Provider': string;
  'Date': string;
  'Duration': number;
  'Status': string;
  'Service Name': string;
  'Service Category': string;
  'Client Name': string;
  'Is Consult': boolean;
}

interface TransactionFields {
  'Provider': string;
  'Date': string;
  'Amount': number;
  'Type': string;
  'Status': string;
  'Service': string;
}

interface ReviewFields {
  'Date': string;
  'Rating': number;
  'Provider': string;
  'Source': string;
}

const PROVIDER_INFO: Record<string, {
  name: string;
  role: string;
  specialties: string[];
  color: string;
}> = {
  rina: {
    name: 'Rina',
    role: 'CEO / Lead Provider',
    specialties: ['Injectables', 'Sofwave', 'Laser', 'GLP-1', 'Wellness Injections'],
    color: '#C9A96E',
  },
  mom: {
    name: 'Mom',
    role: 'Provider',
    specialties: ['Facials', 'Peels', 'Wellness Injections', 'HydraFacial'],
    color: '#0F1D2C',
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return withSentry('dashboard/providers/[name]', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await params;
    const normalizedName = name.toLowerCase();
    const providerInfo = PROVIDER_INFO[normalizedName];

    if (!providerInfo) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const cacheKey = `providers:detail:${normalizedName}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const providerName = sanitizeFormulaValue(providerInfo.name);

    const [monthAppts, monthTxns, reviews, todayAppts] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND({Date} >= '${monthStart}', {Date} <= '${monthEnd}', {Provider} = '${providerName}')`,
        fields: ['Provider', 'Date', 'Duration', 'Status', 'Service Name', 'Service Category', 'Client Name', 'Is Consult'],
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} >= '${monthStart}', {Date} <= '${monthEnd}', {Provider} = '${providerName}', {Status} = "Completed")`,
        fields: ['Provider', 'Date', 'Amount', 'Type', 'Status', 'Service'],
      }),
      fetchAll<ReviewFields>(Tables.reviews(), {
        filterByFormula: `AND({Date} >= '${monthStart}', {Date} <= '${monthEnd}', {Provider} = '${providerName}')`,
        fields: ['Date', 'Rating', 'Provider', 'Source'],
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND(IS_SAME({Date}, '${today}', 'day'), {Provider} = '${providerName}')`,
        fields: ['Provider', 'Date', 'Duration', 'Status', 'Service Name', 'Client Name', 'Is Consult'],
      }),
    ]);

    // Monthly stats
    const revenue = monthTxns.reduce((sum, t) => sum + (Number(t.fields['Amount']) || 0), 0);
    const completedAppts = monthAppts.filter(a => a.fields['Status'] === 'completed');
    const treatments = completedAppts.length;
    const avgTicket = treatments > 0 ? Math.round(revenue / treatments) : 0;

    const bookedMinutes = monthAppts
      .filter(a => a.fields['Status'] !== 'cancelled')
      .reduce((sum, a) => sum + (a.fields['Duration'] || 0), 0);
    const workingDays = Math.min(now.getDate(), 22);
    const availableHours = workingDays * 8;
    const utilization = availableHours > 0
      ? Math.min(100, Math.round((bookedMinutes / 60 / availableHours) * 100))
      : 0;

    const noShows = monthAppts.filter(a => a.fields['Status'] === 'no_show').length;
    const cancellations = monthAppts.filter(a => a.fields['Status'] === 'cancelled').length;
    const totalNonCancelled = monthAppts.length - cancellations;
    const showRate = totalNonCancelled > 0
      ? Math.round(((totalNonCancelled - noShows) / totalNonCancelled) * 100)
      : 100;

    // Service mix
    const serviceMix: Record<string, { count: number; revenue: number }> = {};
    for (const appt of completedAppts) {
      const service = appt.fields['Service Name'] || 'Other';
      if (!serviceMix[service]) serviceMix[service] = { count: 0, revenue: 0 };
      serviceMix[service].count++;
    }
    for (const txn of monthTxns) {
      const service = txn.fields['Service'] || 'Other';
      if (serviceMix[service]) {
        serviceMix[service].revenue += Number(txn.fields['Amount']) || 0;
      }
    }

    const topServices = Object.entries(serviceMix)
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Reviews
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.fields['Rating'] || 0), 0) / reviews.length) * 10) / 10
      : null;

    // Today's schedule
    const todaySchedule = todayAppts
      .filter(a => a.fields['Status'] !== 'cancelled')
      .map(a => ({
        service: a.fields['Service Name'] || '',
        client: a.fields['Client Name'] || '',
        duration: a.fields['Duration'] || 0,
        status: a.fields['Status'] || 'scheduled',
        isConsult: a.fields['Is Consult'] || false,
      }));

    // Unique clients this month
    const uniqueClients = new Set(completedAppts.map(a => a.fields['Client Name'])).size;

    const result = {
      ...providerInfo,
      monthlyStats: {
        revenue: Math.round(revenue),
        treatments,
        avgTicket,
        utilization,
        showRate,
        noShows,
        cancellations,
        uniqueClients,
        bookedHours: Math.round(bookedMinutes / 60 * 10) / 10,
      },
      topServices,
      reviews: {
        count: reviews.length,
        avgRating,
      },
      todaySchedule,
      todayAppointments: todaySchedule.length,
      period: { start: monthStart, end: monthEnd },
      asOf: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.RELAXED);
      return NextResponse.json(result);
    } catch (err) {
      console.error(`[dashboard/providers/${name}]`, err);
      return NextResponse.json({ error: 'Failed to fetch provider details' }, { status: 500 });
    }
  });
}
