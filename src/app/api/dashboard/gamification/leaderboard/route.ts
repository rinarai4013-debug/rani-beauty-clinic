import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';

interface AppointmentFields {
  'Provider': string;
  'Date': string;
  'Duration': number;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
}

interface TransactionFields {
  'Provider': string;
  'Date': string;
  'Amount': number;
  'Type': string;
  'Status': string;
}

const PROVIDERS = [
  { name: 'Rina', role: 'CEO / Lead Provider' },
  { name: 'Mom', role: 'Provider' },
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_leaderboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<unknown>('gamification-leaderboard');
    if (cached) {
      return NextResponse.json(cached);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get the start of the current week (Monday)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const [monthAppts, monthTxns, weekTxns] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'))`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${weekStartStr}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
    ]);

    const entries = PROVIDERS.map((provider) => {
      const providerMonthTxns = monthTxns.filter((t) => t.fields['Provider'] === provider.name);
      const providerMonthAppts = monthAppts.filter((a) => a.fields['Provider'] === provider.name);
      const providerWeekTxns = weekTxns.filter((t) => t.fields['Provider'] === provider.name);

      const monthlyRevenue = providerMonthTxns.reduce(
        (sum, t) => sum + (t.fields['Amount'] || 0),
        0
      );
      const weeklyRevenue = providerWeekTxns.reduce(
        (sum, t) => sum + (t.fields['Amount'] || 0),
        0
      );
      const completedAppts = providerMonthAppts.filter(
        (a) => a.fields['Status'] === 'completed'
      ).length;
      const consultsClosed = providerMonthAppts.filter(
        (a) =>
          a.fields['Is Consult'] &&
          (a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed')
      ).length;

      // Simple XP: $1 revenue = 1 XP, each appointment = 10 XP, each consult closed = 50 XP
      const totalXP = Math.round(monthlyRevenue) + completedAppts * 10 + consultsClosed * 50;
      const level = Math.floor(totalXP / 500) + 1;

      // Simple achievement count based on thresholds
      let achievements = 0;
      if (monthlyRevenue >= 1000) achievements++;
      if (monthlyRevenue >= 10000) achievements++;
      if (monthlyRevenue >= 50000) achievements++;
      if (completedAppts >= 10) achievements++;
      if (completedAppts >= 50) achievements++;
      if (consultsClosed >= 5) achievements++;

      // Weekly score based on weekly revenue relative to target ($4k/day * 5 = $20k/week per provider)
      const weeklyTarget = 10000; // $10k/week per provider
      const weeklyScore = Math.min(Math.round((weeklyRevenue / weeklyTarget) * 100), 100);

      return {
        name: provider.name,
        role: provider.role,
        totalXP,
        level: {
          level,
          name: level >= 10 ? 'Diamond' : level >= 7 ? 'Platinum' : level >= 4 ? 'Gold' : level >= 2 ? 'Silver' : 'Bronze',
          xpRequired: level * 500,
          icon: level >= 10 ? 'gem' : level >= 7 ? 'shield' : level >= 4 ? 'medal' : level >= 2 ? 'award' : 'star',
        },
        achievements,
        streak: 0,
        weeklyScore,
      };
    });

    // Sort by totalXP descending
    entries.sort((a, b) => b.totalXP - a.totalXP);

    const data = { entries };
    cache.set('gamification-leaderboard', data, TTL.MODERATE);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
