import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { cache, TTL } from '@/lib/cache';

interface AppointmentFields {
  'Service Name'?: string;
  'Service Category'?: string;
  Provider?: string;
  Date?: string;
  Status?: string;
  'Is Consult'?: boolean;
  'Booking Source'?: string;
  'Amount Paid'?: number;
}

interface TransactionFields {
  Date?: string;
  Amount?: number;
  'Service Name'?: string;
  Provider?: string;
  'Payment Method'?: string;
  'Is Financing'?: boolean;
  Status?: string;
}

function isGlp1Service(value: string | undefined): boolean {
  const normalized = (value || '').toLowerCase();
  return ['glp1', 'glp-1', 'semaglutide', 'tirzepatide', 'weight loss'].some((token) =>
    normalized.includes(token)
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-glp1';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [appointments, transactions] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `IS_SAME({${FIELDS.appointments.date}}, TODAY(), 'month')`,
        sort: [{ field: FIELDS.appointments.date, direction: 'desc' }],
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_SAME({${FIELDS.transactions.date}}, TODAY(), 'month'), {${FIELDS.transactions.status}} = "Completed")`,
        sort: [{ field: FIELDS.transactions.date, direction: 'desc' }],
      }),
    ]);

    const glpAppointments = appointments.filter(
      (record) =>
        isGlp1Service(record.fields['Service Name']) ||
        isGlp1Service(record.fields['Service Category'])
    );
    const glpTransactions = transactions.filter((record) => isGlp1Service(record.fields['Service Name']));
    const consults = glpAppointments.filter((record) => Boolean(record.fields['Is Consult']));
    const revenue = glpTransactions.reduce((sum, record) => sum + (record.fields.Amount || 0), 0);
    const financingCount = glpTransactions.filter(
      (record) =>
        Boolean(record.fields['Is Financing']) ||
        ['Cherry', 'PatientFi', 'Afterpay'].includes(record.fields['Payment Method'] || '')
    ).length;
    const providerMap = new Map<string, { appointments: number; revenue: number }>();

    for (const record of glpAppointments) {
      const provider = record.fields.Provider || 'Unknown';
      const existing = providerMap.get(provider) || { appointments: 0, revenue: 0 };
      existing.appointments += 1;
      providerMap.set(provider, existing);
    }

    for (const record of glpTransactions) {
      const provider = record.fields.Provider || 'Unknown';
      const existing = providerMap.get(provider) || { appointments: 0, revenue: 0 };
      existing.revenue += record.fields.Amount || 0;
      providerMap.set(provider, existing);
    }

    const payload = {
      status: 'ok',
      summary: {
        monthToDateAppointments: glpAppointments.length,
        monthToDateConsults: consults.length,
        monthToDateRevenue: revenue,
        avgRevenuePerVisit: glpAppointments.length > 0 ? Math.round(revenue / glpAppointments.length) : 0,
        financingRate: glpTransactions.length > 0 ? Math.round((financingCount / glpTransactions.length) * 100) : 0,
        bookingSources: glpAppointments.reduce<Record<string, number>>((acc, record) => {
          const source = record.fields['Booking Source'] || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {}),
      },
      providers: Array.from(providerMap.entries())
        .map(([provider, data]) => ({ provider, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      recentActivity: glpAppointments.slice(0, 8).map((record) => ({
        date: record.fields.Date || '',
        service: record.fields['Service Name'] || 'Unknown',
        provider: record.fields.Provider || 'Unknown',
        isConsult: Boolean(record.fields['Is Consult']),
        bookingSource: record.fields['Booking Source'] || 'Unknown',
      })),
    };

    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/glp1]', error);
    return NextResponse.json({ error: 'Failed to load GLP-1 performance' }, { status: 500 });
  }
}
