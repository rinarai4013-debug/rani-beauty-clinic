import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


interface AppointmentFields {
  'Provider': string;
  'Date': string;
  'Duration': number;
  'Status': string;
  'Service Name': string;
}

interface TransactionFields {
  'Provider': string;
  'Date': string;
  'Amount': number;
  'Type': string;
  'Status': string;
}

const PROVIDERS = [
  {
    name: 'Rina',
    role: 'CEO / Lead Provider',
    specialties: ['Injectables', 'Sofwave', 'Laser'],
    color: '#C9A96E',
  },
  {
    name: 'Mom',
    role: 'Provider',
    specialties: ['Facials', 'Peels', 'Wellness Injections'],
    color: '#0F1D2C',
  },
];

export async function GET() {
  return withSentry('dashboard/providers', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_providers')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cached = cache.get<unknown>('providers');
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get current month date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const safeMonthStart = sanitizeFormulaValue(monthStart);
    const safeMonthEnd = sanitizeFormulaValue(monthEnd);

    // Fetch this month's appointments and transactions
    const [appointments, transactions] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${safeMonthStart}'), IS_BEFORE({Date}, '${safeMonthEnd}'))`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${safeMonthStart}'), IS_BEFORE({Date}, '${safeMonthEnd}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
    ]);

    const providers = PROVIDERS.map((provider) => {
      const providerAppts = appointments.filter(
        (a) => a.fields['Provider'] === provider.name
      );
      const providerTxns = transactions.filter(
        (t) => t.fields['Provider'] === provider.name
      );

      const revenue = providerTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
      const treatments = providerAppts.filter(
        (a) => a.fields['Status'] === 'completed'
      ).length;
      const avgTicket = treatments > 0 ? revenue / treatments : 0;

      // Utilization: booked hours / available hours (8h/day, ~22 working days)
      const bookedMinutes = providerAppts.reduce(
        (sum, a) => sum + (a.fields['Duration'] || 0),
        0
      );
      const bookedHours = bookedMinutes / 60;
      const workingDaysSoFar = Math.min(now.getDate(), 22);
      const availableHours = workingDaysSoFar * 8;
      const utilization = availableHours > 0 ? Math.round((bookedHours / availableHours) * 100) : 0;

      return {
        ...provider,
        revenue: Math.round(revenue),
        treatments,
        avgTicket: Math.round(avgTicket),
        utilization: Math.min(utilization, 100),
      };
    });

    const data = { providers };
      cache.set('providers', data, TTL.RELAXED);

      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }
  });
}
