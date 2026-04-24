import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


interface ClientFields {
  'Status': string;
}

interface AppointmentFields {
  'Is Consult': boolean;
  'Consult Outcome': string;
  'Date': string;
  'Status': string;
}

export async function GET() {
  return withSentry('dashboard/leads/stats', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_leads')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'leads:stats';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const [clients, consults] = await Promise.all([
        fetchAll<ClientFields>(
          Tables.clients(),
          { fields: ['Status'] },
          true
        ),
        fetchAll<AppointmentFields>(
          Tables.appointments(),
          {
            filterByFormula: `{Is Consult} = TRUE()`,
            fields: ['Is Consult', 'Consult Outcome', 'Date', 'Status'],
          }
        ),
      ]);

    const newLeads = clients.filter(c => c.fields['Status'] === 'New Lead').length;
    const active = clients.filter(c => c.fields['Status'] === 'Active').length;
    const lapsed = clients.filter(c =>
      ['Lapsed 30', 'Lapsed 60', 'Lapsed 90'].includes(c.fields['Status'])
    ).length;
    const churned = clients.filter(c => c.fields['Status'] === 'Churned').length;

    const totalConsults = consults.length;
    const bookedConsults = consults.filter(c =>
      c.fields['Consult Outcome'] === 'booked' || c.fields['Consult Outcome'] === 'Booked'
    ).length;

    const conversionRate = totalConsults > 0
      ? Math.round((bookedConsults / totalConsults) * 100)
      : 0;

    const result = {
      funnel: {
        newLeads,
        active,
        lapsed,
        churned,
        total: clients.length,
      },
      consults: {
        total: totalConsults,
        booked: bookedConsults,
        conversionRate,
      },
      asOf: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.MODERATE);
      return NextResponse.json(result);
    } catch (err) {
      console.error('[dashboard/leads/stats]', err);
      return NextResponse.json({ error: 'Failed to fetch lead stats' }, { status: 500 });
    }
  });
}
