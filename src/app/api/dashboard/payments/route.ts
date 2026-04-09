import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { cache, TTL } from '@/lib/cache';

interface TransactionFields {
  Date?: string;
  Amount?: number;
  Type?: string;
  'Payment Method'?: string;
  Provider?: string;
  'Service Name'?: string;
  Status?: string;
  'Is Financing'?: boolean;
  'Financing Provider'?: string;
}

function getDateFilter(range: string): string {
  switch (range) {
    case 'wtd':
      return `AND({${FIELDS.transactions.date}} >= DATEADD(TODAY(), -WEEKDAY(TODAY())+1, 'days'), {${FIELDS.transactions.status}} = "Completed")`;
    case 'last30':
      return `AND({${FIELDS.transactions.date}} >= DATEADD(TODAY(), -30, 'days'), {${FIELDS.transactions.status}} = "Completed")`;
    case 'ytd':
      return `AND(IS_SAME({${FIELDS.transactions.date}}, TODAY(), 'year'), {${FIELDS.transactions.status}} = "Completed")`;
    case 'mtd':
    default:
      return `AND(IS_SAME({${FIELDS.transactions.date}}, TODAY(), 'month'), {${FIELDS.transactions.status}} = "Completed")`;
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'mtd';
  const cacheKey = `dashboard-payments-${range}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const transactions = await fetchAll<TransactionFields>(Tables.transactions(), {
      filterByFormula: getDateFilter(range),
      sort: [{ field: FIELDS.transactions.date, direction: 'desc' }],
    });

    const completedSales = transactions.filter((record) => record.fields.Type !== 'Refund');
    const totalCollected = completedSales.reduce((sum, record) => sum + (record.fields.Amount || 0), 0);
    const financingSales = completedSales.filter(
      (record) =>
        Boolean(record.fields['Is Financing']) ||
        ['Cherry', 'PatientFi', 'Afterpay'].includes(record.fields['Payment Method'] || '')
    );
    const financingCollected = financingSales.reduce((sum, record) => sum + (record.fields.Amount || 0), 0);
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();
    const financingProviderMap = new Map<string, { amount: number; count: number }>();

    for (const record of completedSales) {
      const paymentMethod = record.fields['Payment Method'] || 'Unknown';
      const existing = paymentMethodMap.get(paymentMethod) || { amount: 0, count: 0 };
      existing.amount += record.fields.Amount || 0;
      existing.count += 1;
      paymentMethodMap.set(paymentMethod, existing);

      const financingProvider = record.fields['Financing Provider'] || paymentMethod;
      if (Boolean(record.fields['Is Financing']) || ['Cherry', 'PatientFi', 'Afterpay'].includes(paymentMethod)) {
        const providerData = financingProviderMap.get(financingProvider) || { amount: 0, count: 0 };
        providerData.amount += record.fields.Amount || 0;
        providerData.count += 1;
        financingProviderMap.set(financingProvider, providerData);
      }
    }

    const payload = {
      status: 'ok',
      summary: {
        range,
        totalCollected,
        financingCollected,
        financingRate: completedSales.length > 0 ? Math.round((financingSales.length / completedSales.length) * 100) : 0,
        avgTicket: completedSales.length > 0 ? Math.round(totalCollected / completedSales.length) : 0,
        transactionCount: completedSales.length,
      },
      paymentMethods: Array.from(paymentMethodMap.entries())
        .map(([method, data]) => ({ method, ...data }))
        .sort((a, b) => b.amount - a.amount),
      financingProviders: Array.from(financingProviderMap.entries())
        .map(([provider, data]) => ({ provider, ...data }))
        .sort((a, b) => b.amount - a.amount),
      recentTransactions: completedSales.slice(0, 8).map((record) => ({
        date: record.fields.Date || '',
        service: record.fields['Service Name'] || 'Unknown',
        provider: record.fields.Provider || 'Unknown',
        amount: record.fields.Amount || 0,
        paymentMethod: record.fields['Payment Method'] || 'Unknown',
        financingProvider: record.fields['Financing Provider'] || null,
      })),
    };

    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/payments]', error);
    return NextResponse.json({ error: 'Failed to load payment performance' }, { status: 500 });
  }
}
