import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface AppointmentFields {
  'Provider': string;
  'Service Name': string;
  'Service Category': string;
  'Date': string;
  'Time': string;
  'Duration': number;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
  'Amount Quoted': number;
  'Amount Paid': number;
}

interface TransactionFields {
  'Provider': string;
  'Date': string;
  'Amount': number;
  'Type': string;
  'Service Name': string;
  'Status': string;
  'Payment Method': string;
}

const PROVIDER_INFO: Record<string, { role: string; specialties: string[]; color: string }> = {
  'Rina': {
    role: 'CEO / Lead Provider',
    specialties: ['Injectables', 'Sofwave', 'Laser'],
    color: '#C9A96E',
  },
  'Mom': {
    role: 'Provider',
    specialties: ['Facials', 'Peels', 'Wellness Injections'],
    color: '#0F1D2C',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_providers')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await params;
    const providerName = decodeURIComponent(name);
    const info = PROVIDER_INFO[providerName];

    if (!info) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const cacheKey = `provider-${providerName}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get current month date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [appointments, transactions] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND({Provider} = '${providerName}', IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'))`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Provider} = '${providerName}', IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'), {Type} = 'Service')`,
      }),
    ]);

    const completedAppts = appointments.filter((a) => a.fields['Status'] === 'completed');
    const completedTxns = transactions.filter((t) => t.fields['Status'] === 'Completed');

    const revenue = completedTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const treatments = completedAppts.length;
    const avgTicket = treatments > 0 ? revenue / treatments : 0;

    const bookedMinutes = appointments.reduce((sum, a) => sum + (a.fields['Duration'] || 0), 0);
    const bookedHours = bookedMinutes / 60;
    const workingDaysSoFar = Math.min(now.getDate(), 22);
    const availableHours = workingDaysSoFar * 8;
    const utilization = availableHours > 0 ? Math.round((bookedHours / availableHours) * 100) : 0;

    const consults = appointments.filter((a) => a.fields['Is Consult']);
    const consultsClosed = consults.filter(
      (a) => a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed'
    ).length;
    const consultConversion = consults.length > 0 ? Math.round((consultsClosed / consults.length) * 100) : 0;

    const noShows = appointments.filter((a) => a.fields['Status'] === 'no_show').length;
    const cancellations = appointments.filter((a) => a.fields['Status'] === 'cancelled').length;

    // Service breakdown
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const txn of completedTxns) {
      const svc = txn.fields['Service Name'] || 'Other';
      const existing = serviceMap.get(svc) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += txn.fields['Amount'] || 0;
      serviceMap.set(svc, existing);
    }
    const serviceBreakdown = Array.from(serviceMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    const data = {
      name: providerName,
      ...info,
      stats: {
        revenue: Math.round(revenue),
        treatments,
        avgTicket: Math.round(avgTicket),
        utilization: Math.min(utilization, 100),
        consults: consults.length,
        consultsClosed,
        consultConversion,
        noShows,
        cancellations,
        bookedHours: Math.round(bookedHours * 10) / 10,
      },
      serviceBreakdown,
      totalAppointments: appointments.length,
    };

    cache.set(cacheKey, data, TTL.RELAXED);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}
