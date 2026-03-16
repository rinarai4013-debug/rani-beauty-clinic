import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'revenue-trends';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const transactions = await fetchAll<TransactionFields>(Tables.transactions(), {
      filterByFormula: `AND({Date} >= DATEADD(TODAY(), -30, 'days'), {Status} = "Completed")`,
      sort: [{ field: 'Date', direction: 'asc' }],
    });

    // Group by day
    const dailyMap = new Map<string, number>();
    for (const t of transactions) {
      const date = t.fields['Date'] || '';
      const amount = t.fields['Amount'] || 0;
      const type = t.fields['Type'] || '';
      const value = type === 'Refund' ? -amount : amount;
      dailyMap.set(date, (dailyMap.get(date) || 0) + value);
    }

    // Build daily array sorted by date
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }));

    // Weekly average
    const monthlyTotal = daily.reduce((sum, d) => sum + d.amount, 0);
    const weeksInRange = Math.max(Math.ceil(daily.length / 7), 1);
    const weeklyAvg = Math.round(monthlyTotal / weeksInRange);

    // Trend direction: compare last 7 days avg to previous 7 days avg
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (daily.length >= 14) {
      const recent7 = daily.slice(-7);
      const previous7 = daily.slice(-14, -7);
      const recentAvg = recent7.reduce((s, d) => s + d.amount, 0) / 7;
      const previousAvg = previous7.reduce((s, d) => s + d.amount, 0) / 7;
      const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
    } else if (daily.length >= 2) {
      const recentHalf = daily.slice(Math.floor(daily.length / 2));
      const olderHalf = daily.slice(0, Math.floor(daily.length / 2));
      const recentAvg = recentHalf.reduce((s, d) => s + d.amount, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((s, d) => s + d.amount, 0) / olderHalf.length;
      const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
    }

    const data = {
      daily,
      weeklyAvg,
      monthlyTotal: Math.round(monthlyTotal),
      trend,
    };

    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Revenue trends route error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue trends' }, { status: 500 });
  }
}
