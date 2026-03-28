import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { generateForecast, type MonthlyDataPoint, type ProviderDataPoint, type ServiceCategoryDataPoint } from '@/lib/finance/forecasting';

/**
 * GET /api/dashboard/finance/forecast
 * Revenue forecasting with trend, seasonality, provider/category breakdowns.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_finance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const horizon = parseInt(request.nextUrl.searchParams.get('horizon') ?? '12', 10);

    // Fetch last 12 months of transaction data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = twelveMonthsAgo.toISOString().slice(0, 10);

    let records: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      records = await fetchAll(Tables.transactions(), {
        filterByFormula: `AND({${FIELDS.transactions.status}} = 'Completed', IS_AFTER({${FIELDS.transactions.date}}, '${startDate}'))`,
      });
    } catch (err) {
      console.error('Error fetching transactions for forecast:', err);
    }

    // Aggregate into monthly data points
    const monthlyMap: Record<string, { revenue: number; bookings: number; newClients: Set<string> }> = {};
    const providerMonthly: Record<string, Record<string, { revenue: number; bookings: number; hours: number }>> = {};
    const categoryMonthly: Record<string, Record<string, { revenue: number; bookings: number }>> = {};

    for (const rec of records) {
      const amount = Number(rec.fields[FIELDS.transactions.amount]) || 0;
      if (amount <= 0) continue; // revenue only

      const date = String(rec.fields[FIELDS.transactions.date] ?? '').slice(0, 7); // YYYY-MM
      if (!date) continue;

      const provider = String(rec.fields[FIELDS.transactions.provider] ?? 'Unknown');
      const category = String(rec.fields[FIELDS.transactions.service] ?? 'Other');
      const clientId = String(rec.fields[FIELDS.transactions.client] ?? '');

      // Monthly aggregation
      if (!monthlyMap[date]) monthlyMap[date] = { revenue: 0, bookings: 0, newClients: new Set() };
      monthlyMap[date].revenue += amount;
      monthlyMap[date].bookings += 1;
      if (clientId) monthlyMap[date].newClients.add(clientId);

      // Provider aggregation
      if (!providerMonthly[provider]) providerMonthly[provider] = {};
      if (!providerMonthly[provider][date]) providerMonthly[provider][date] = { revenue: 0, bookings: 0, hours: 0 };
      providerMonthly[provider][date].revenue += amount;
      providerMonthly[provider][date].bookings += 1;
      providerMonthly[provider][date].hours += 1; // estimate 1 hour per transaction

      // Category aggregation
      if (!categoryMonthly[category]) categoryMonthly[category] = {};
      if (!categoryMonthly[category][date]) categoryMonthly[category][date] = { revenue: 0, bookings: 0 };
      categoryMonthly[category][date].revenue += amount;
      categoryMonthly[category][date].bookings += 1;
    }

    // Convert to sorted arrays
    const historicalData: MonthlyDataPoint[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.bookings,
        newClients: data.newClients.size,
        avgTicket: data.bookings > 0 ? data.revenue / data.bookings : 0,
      }));

    const providerData: ProviderDataPoint[] = [];
    for (const [provider, months] of Object.entries(providerMonthly)) {
      for (const [month, data] of Object.entries(months)) {
        providerData.push({ provider, month, revenue: data.revenue, bookings: data.bookings, hoursWorked: data.hours });
      }
    }

    const serviceCategoryData: ServiceCategoryDataPoint[] = [];
    for (const [category, months] of Object.entries(categoryMonthly)) {
      for (const [month, data] of Object.entries(months)) {
        serviceCategoryData.push({ category, month, revenue: data.revenue, bookings: data.bookings });
      }
    }

    // Generate forecast
    const result = generateForecast({ historicalData, providerData, serviceCategoryData }, horizon);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Forecast API error:', err);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}
