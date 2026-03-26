import { NextResponse } from 'next/server';
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

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Is Consult': boolean;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<unknown>('gamification-briefing');
    if (cached) {
      return NextResponse.json(cached);
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Week start (Monday)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // 30 days ago for average
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [yesterdayTxns, weekTxns, last30Txns, todayAppts] = await Promise.all([
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${yesterdayStr}', {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${weekStartStr}'), NOT(IS_AFTER({Date}, '${today}')), {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${thirtyDaysAgoStr}'), NOT(IS_AFTER({Date}, '${yesterdayStr}')), {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
    ]);

    // Yesterday's revenue
    const yesterdayRevenue = yesterdayTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    // Week-to-date revenue (including yesterday, up to today)
    const weekRevenue = weekTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    // 30-day daily average (excluding yesterday to avoid double-counting)
    const last30Revenue = last30Txns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const dailyAvg = last30Revenue / 30;

    // Yesterday vs average
    const yesterdayVsAvg = dailyAvg > 0
      ? Math.round(((yesterdayRevenue - dailyAvg) / dailyAvg) * 100)
      : 0;

    // Today's appointments
    const appointmentsToday = todayAppts.length;
    const consultsToday = todayAppts.filter((a) => a.fields['Is Consult']).length;

    // Streak: simple calculation - default to 0 for now as we need KPI snapshots
    // A full streak calculation would query KPI Snapshots for consecutive days with score >= 80
    const streakDays = 0;

    // Top win from yesterday
    let topWin = '';
    if (yesterdayRevenue >= 4000) {
      topWin = `$${(yesterdayRevenue / 1000).toFixed(1)}K revenue day`;
    } else if (yesterdayRevenue > 0) {
      topWin = `$${yesterdayRevenue.toLocaleString()} collected`;
    }

    // Focus area based on weakest signals
    let focusArea = '';
    if (appointmentsToday < 5) {
      focusArea = 'Light schedule today - great time for follow-ups and outreach';
    } else if (consultsToday >= 2) {
      focusArea = `${consultsToday} consults today - close them all for bonus XP`;
    } else if (yesterdayRevenue < 2000) {
      focusArea = 'Revenue was light yesterday - push for upsells and add-ons today';
    } else {
      focusArea = 'Strong momentum - keep the energy up and crush today';
    }

    // Weekly target (5 business days x $4K daily target)
    const weekTarget = 20000;

    const data = {
      greeting: '',
      yesterdayRevenue,
      yesterdayVsAvg,
      weekRevenue,
      weekTarget,
      appointmentsToday,
      consultsToday,
      atRiskClients: 0,
      streakDays,
      topWin,
      focusArea,
    };

    cache.set('gamification-briefing', data, TTL.RELAXED);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching morning briefing:', error);
    return NextResponse.json({ error: 'Failed to fetch briefing' }, { status: 500 });
  }
}
