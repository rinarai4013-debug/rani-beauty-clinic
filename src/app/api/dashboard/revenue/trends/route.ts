import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { withSentry } from '@/lib/sentry-utils';

interface TransactionFields {
  Date?: string;
  Amount?: number;
  Status?: string;
}

export async function GET() {
  return withSentry('dashboard/revenue/trends', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_revenue')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const transactions = await fetchAll<TransactionFields>(Tables.transactions(), undefined, true);
      const dailyMap = new Map<string, number>();

    for (const record of transactions) {
      const date = record.fields.Date ?? '';
      if (!date) continue;
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + (record.fields.Amount ?? 0));
    }

    const daily = Array.from(dailyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, amount]) => ({ date, amount }));

    const monthlyTotal = daily.reduce((sum, item) => sum + item.amount, 0);
    const recent = daily.slice(-7);
    const older = daily.slice(-14, -7);
    const recentAvg = recent.length ? recent.reduce((sum, item) => sum + item.amount, 0) / recent.length : 0;
    const olderAvg = older.length ? older.reduce((sum, item) => sum + item.amount, 0) / older.length : recentAvg;
    const trend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'flat';

      return NextResponse.json({
        daily,
        weeklyAvg: recent.length ? Math.round(recentAvg * 100) / 100 : 0,
        monthlyTotal,
        trend,
      });
    } catch (error) {
      console.error('[revenue/trends]', error);
      return NextResponse.json({ error: 'Failed to load revenue trends' }, { status: 500 });
    }
  });
}
