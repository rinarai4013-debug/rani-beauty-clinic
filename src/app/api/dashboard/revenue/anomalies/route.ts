import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { detectRevenueAnomalies, type AnomalyInput } from '@/lib/predictions/revenue-anomaly';
import { TARGETS } from '@/data/dashboard/score-weights';

/**
 * GET /api/dashboard/revenue/anomalies
 *
 * Detects revenue anomalies from real Airtable transaction data.
 * Engine: src/lib/predictions/revenue-anomaly.ts — detectRevenueAnomalies()
 * Agent: Finance Strategist
 *
 * Uses 5 detection methods: target deviation, rolling average,
 * day-of-week pattern, provider imbalance, financing spike.
 */

interface TransactionFields {
  'Date': string;
  'Amount': number;
  'Provider': string;
  'Category': string;
  'Payment Method': string;
}

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

    // Fetch last 35 days of transactions for rolling analysis
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    const cutoff = thirtyFiveDaysAgo.toISOString().split('T')[0];

    const transactions = await fetchAll<TransactionFields>(Tables.transactions(), {
      filterByFormula: `IS_AFTER({Date}, '${cutoff}')`,
      sort: [{ field: 'Date', direction: 'desc' }],
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        anomalies: [],
        healthScore: 100,
        summary: 'No transaction data found for anomaly detection.',
        projectedMonthEnd: 0,
        generatedAt: new Date().toISOString(),
      });
    }

    // Aggregate daily revenue
    const dailyMap = new Map<string, number>();
    const providerMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    const paymentMap = new Map<string, { amount: number; count: number }>();

    const today = new Date().toISOString().split('T')[0];

    for (const t of transactions) {
      const date = t.fields['Date'] || '';
      const amount = t.fields['Amount'] || 0;
      const provider = t.fields['Provider'] || 'Unknown';
      const category = t.fields['Category'] || 'Other';
      const payment = t.fields['Payment Method'] || 'card';

      dailyMap.set(date, (dailyMap.get(date) || 0) + amount);

      // Only aggregate today's data for provider/category/payment breakdowns
      if (date === today) {
        providerMap.set(provider, (providerMap.get(provider) || 0) + amount);
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        const pm = paymentMap.get(payment) || { amount: 0, count: 0 };
        pm.amount += amount;
        pm.count += 1;
        paymentMap.set(payment, pm);
      }
    }

    // Build sorted daily revenue array (newest first)
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, amount: revenue }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const anomalyInput: AnomalyInput = {
      dailyRevenue,
      todayRevenue: dailyMap.get(today) || 0,
      targets: {
        daily: TARGETS.dailyRevenue,
        weekly: TARGETS.weeklyRevenue,
        monthly: TARGETS.monthlyRevenue,
      },
      byProvider: Array.from(providerMap.entries()).map(([provider, revenue]) => ({
        provider,
        revenue,
      })),
      byCategory: Array.from(categoryMap.entries()).map(([category, revenue]) => ({
        category,
        revenue,
      })),
      byPaymentMethod: Array.from(paymentMap.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      })),
    };

    const anomalyResult = detectRevenueAnomalies(anomalyInput);

    const result = {
      ...anomalyResult,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.STANDARD);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Revenue anomaly detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect revenue anomalies' },
      { status: 500 }
    );
  }
}
