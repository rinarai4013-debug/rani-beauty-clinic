import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { detectRevenueAnomalies, type RevenueDataPoint } from '@/lib/predictions/revenue-anomaly';

/**
 * GET /api/dashboard/revenue/anomalies
 *
 * Analyzes today's revenue patterns and returns detected anomalies.
 * Compares against historical data, targets, and day-of-week patterns.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'revenue-anomalies';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch last 30 days of transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const transactions = await fetchAll<{
      Date: string;
      Amount: number;
      Provider: string;
      'Service Name': string;
      'Payment Method': string;
      Status: string;
      Type: string;
    }>(Tables.transactions(), {
      filterByFormula: `AND(IS_AFTER({Date}, '${dateFilter}'), {Status} = 'Completed')`,
    });

    // Build daily revenue data
    const dailyMap = new Map<string, number>();
    const todayStr = new Date().toISOString().split('T')[0];
    let todayRevenue = 0;
    const providerMap = new Map<string, number>();
    const paymentMap = new Map<string, { amount: number; count: number }>();

    for (const tx of transactions) {
      const date = tx.fields['Date'] || '';
      const amount = tx.fields['Amount'] || 0;
      const type = tx.fields['Type'] || 'Sale';

      // Only count positive revenue (sales, not refunds)
      if (type === 'Refund') continue;

      // Daily aggregation
      dailyMap.set(date, (dailyMap.get(date) || 0) + amount);

      // Today-specific aggregations
      if (date === todayStr) {
        todayRevenue += amount;

        // Provider breakdown
        const provider = tx.fields['Provider'] || 'Unknown';
        providerMap.set(provider, (providerMap.get(provider) || 0) + amount);

        // Payment method breakdown
        const method = tx.fields['Payment Method'] || 'Unknown';
        const existing = paymentMap.get(method) || { amount: 0, count: 0 };
        paymentMap.set(method, { amount: existing.amount + amount, count: existing.count + 1 });
      }
    }

    // Convert to sorted arrays
    const dailyRevenue: RevenueDataPoint[] = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const byProvider = Array.from(providerMap.entries())
      .map(([provider, revenue]) => ({ provider, revenue }));

    const byPaymentMethod = Array.from(paymentMap.entries())
      .map(([method, data]) => ({ method, ...data }));

    // Run anomaly detection
    const result = detectRevenueAnomalies({
      dailyRevenue,
      todayRevenue,
      targets: {
        daily: 4000,
        weekly: 23000,
        monthly: 100000,
      },
      byProvider,
      byPaymentMethod,
    });

    cache.set(cacheKey, result, TTL.STANDARD); // 5 min cache
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error detecting revenue anomalies:', error);
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 });
  }
}
