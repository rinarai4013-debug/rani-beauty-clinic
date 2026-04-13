import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
import type { RevenueData, ProviderRevenue, ServiceRevenue, CategoryRevenue, PaymentTypeRevenue, RevenueEntry } from '@/types/dashboard';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Payment Method': string;
  'Provider': string;
  'Service Name': string;
  'Status': string;
  'Is Financing': boolean;
  'Financing Provider': string;
}

interface AppointmentFields {
  'Service Name': string;
  'Service Category': string;
  'Provider': string;
  'Date': string;
  'Duration': number;
  'Status': string;
  'Amount Paid': number;
}

const PROVIDER_COLORS: Record<string, string> = {
  'Mom': '#C9A96E',
  'Rina': '#0F1D2C',
  'Default': '#6B7280',
};

const ALLOWED_REVENUE_RANGES = new Set(['wtd', 'mtd', 'last30', 'ytd']);

function getDateFilter(range: string): string {
  switch (range) {
    case 'wtd':
      return `AND({Date} >= DATEADD(TODAY(), -WEEKDAY(TODAY())+1, 'days'), {Status} = "Completed")`;
    case 'mtd':
      return `AND(IS_SAME({Date}, TODAY(), 'month'), {Status} = "Completed")`;
    case 'last30':
      return `AND({Date} >= DATEADD(TODAY(), -30, 'days'), {Status} = "Completed")`;
    case 'ytd':
      return `AND(IS_SAME({Date}, TODAY(), 'year'), {Status} = "Completed")`;
    default:
      return `AND(IS_SAME({Date}, TODAY(), 'month'), {Status} = "Completed")`;
  }
}

function getAppointmentDateFilter(range: string): string {
  switch (range) {
    case 'wtd':
      return `AND({Date} >= DATEADD(TODAY(), -WEEKDAY(TODAY())+1, 'days'), {Status} = "completed")`;
    case 'mtd':
      return `AND(IS_SAME({Date}, TODAY(), 'month'), {Status} = "completed")`;
    case 'last30':
      return `AND({Date} >= DATEADD(TODAY(), -30, 'days'), {Status} = "completed")`;
    case 'ytd':
      return `AND(IS_SAME({Date}, TODAY(), 'year'), {Status} = "completed")`;
    default:
      return `AND(IS_SAME({Date}, TODAY(), 'month'), {Status} = "completed")`;
  }
}

export async function GET(request: NextRequest) {
  return withSentry('dashboard/revenue', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'mtd';
    if (!ALLOWED_REVENUE_RANGES.has(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }
    const cacheKey = `revenue-${range}`;
    const cached = cache.get<RevenueData>(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const [transactions, appointments] = await Promise.all([
        fetchAll<TransactionFields>(Tables.transactions(), {
          filterByFormula: getDateFilter(range),
          sort: [{ field: 'Date', direction: 'asc' }],
        }),
        fetchAll<AppointmentFields>(Tables.appointments(), {
          filterByFormula: getAppointmentDateFilter(range),
        }),
      ]);

    // --- Daily revenue ---
    const dailyMap = new Map<string, number>();
    for (const t of transactions) {
      const date = t.fields['Date'] || '';
      const amount = t.fields['Amount'] || 0;
      const type = t.fields['Type'] || '';
      const value = type === 'Refund' ? -amount : amount;
      dailyMap.set(date, (dailyMap.get(date) || 0) + value);
    }
    const daily: RevenueEntry[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // --- Weekly aggregation ---
    const weeklyMap = new Map<string, number>();
    for (const [date, amount] of dailyMap.entries()) {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + amount);
    }
    const weekly: RevenueEntry[] = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // --- Monthly aggregation ---
    const monthlyMap = new Map<string, number>();
    for (const [date, amount] of dailyMap.entries()) {
      const monthKey = date.substring(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
    }
    const monthly: RevenueEntry[] = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // --- By Provider ---
    const providerMap = new Map<string, { revenue: number; treatments: number }>();
    for (const t of transactions) {
      const provider = t.fields['Provider'] || 'Unknown';
      const amount = t.fields['Amount'] || 0;
      const type = t.fields['Type'] || '';
      if (type === 'Refund') continue;
      const existing = providerMap.get(provider) || { revenue: 0, treatments: 0 };
      existing.revenue += amount;
      existing.treatments += 1;
      providerMap.set(provider, existing);
    }
    const byProvider: ProviderRevenue[] = Array.from(providerMap.entries()).map(
      ([provider, data]) => ({
        provider,
        revenue: Math.round(data.revenue),
        treatments: data.treatments,
        avgTicket: data.treatments > 0 ? Math.round(data.revenue / data.treatments) : 0,
        color: PROVIDER_COLORS[provider] || PROVIDER_COLORS['Default'],
      })
    );

    // --- By Service ---
    const serviceMap = new Map<string, { revenue: number; count: number; category: string }>();
    for (const t of transactions) {
      const service = t.fields['Service Name'] || 'Unknown';
      const type = t.fields['Type'] || '';
      if (type === 'Refund') continue;
      const amount = t.fields['Amount'] || 0;
      // Find category from appointments
      const matchingAppt = appointments.find(
        (a) => a.fields['Service Name'] === service
      );
      const category = matchingAppt?.fields['Service Category'] || 'Other';
      const existing = serviceMap.get(service) || { revenue: 0, count: 0, category };
      existing.revenue += amount;
      existing.count += 1;
      serviceMap.set(service, existing);
    }
    const byService: ServiceRevenue[] = Array.from(serviceMap.entries()).map(
      ([service, data]) => ({
        service,
        category: data.category,
        revenue: Math.round(data.revenue),
        count: data.count,
      })
    );

    // --- By Category ---
    const categoryMap = new Map<string, number>();
    for (const s of byService) {
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + s.revenue);
    }
    const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const byCategory: CategoryRevenue[] = Array.from(categoryMap.entries()).map(
      ([category, revenue]) => ({
        category,
        revenue: Math.round(revenue),
        percentage: totalCategoryRevenue > 0 ? Math.round((revenue / totalCategoryRevenue) * 100) : 0,
      })
    );

    // --- By Payment Method ---
    const paymentMap = new Map<string, { amount: number; count: number }>();
    for (const t of transactions) {
      const method = t.fields['Payment Method'] || 'Unknown';
      const type = t.fields['Type'] || '';
      if (type === 'Refund') continue;
      const amount = t.fields['Amount'] || 0;
      const existing = paymentMap.get(method) || { amount: 0, count: 0 };
      existing.amount += amount;
      existing.count += 1;
      paymentMap.set(method, existing);
    }
    const byPaymentType: PaymentTypeRevenue[] = Array.from(paymentMap.entries()).map(
      ([type, data]) => ({
        type,
        amount: Math.round(data.amount),
        count: data.count,
      })
    );

    // --- Summary ---
    const gross = transactions
      .filter((t) => t.fields['Type'] !== 'Refund')
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const refunds = transactions
      .filter((t) => t.fields['Type'] === 'Refund')
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const deposits = transactions
      .filter((t) => t.fields['Type'] === 'Deposit')
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const net = gross - refunds;

    // Total treatment hours from appointments
    const totalHours = appointments.reduce(
      (sum, a) => sum + ((a.fields['Duration'] || 60) / 60),
      0
    );

    const totalVisits = appointments.length;

    const data: RevenueData = {
      daily,
      weekly,
      monthly,
      byProvider,
      byService,
      byCategory,
      byPaymentType,
      summary: {
        gross: Math.round(gross),
        net: Math.round(net),
        deposits: Math.round(deposits),
        refunds: Math.round(refunds),
        outstanding: 0,
        revenuePerHour: totalHours > 0 ? Math.round(net / totalHours) : 0,
        revenuePerVisit: totalVisits > 0 ? Math.round(net / totalVisits) : 0,
      },
    };

      cache.set(cacheKey, data, TTL.STANDARD);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Revenue route error:', error);
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
    }
  });
}
