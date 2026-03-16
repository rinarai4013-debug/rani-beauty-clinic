import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { calculateClinicScore, getCurrentBossLevel } from '@/lib/gamification/engine';
import type { DailyMetrics } from '@/types/gamification';

interface AppointmentFields {
  'Service Name': string;
  'Provider': string;
  'Date': string;
  'Time': string;
  'Duration': number;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
}

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
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

    const cached = cache.get<unknown>('gamification-score');
    if (cached) {
      return NextResponse.json(cached);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch today's appointments, today's transactions, and this month's transactions (for boss level)
    const [todayAppts, todayTxns, monthTxns] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${today}', {Type} = 'Service')`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
    ]);

    // Build DailyMetrics from real data
    const revenue = todayTxns
      .filter((t) => t.fields['Status'] === 'Completed')
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const bookedMinutes = todayAppts.reduce((sum, a) => sum + (a.fields['Duration'] || 0), 0);

    const completedAppts = todayAppts.filter((a) => a.fields['Status'] === 'completed');
    const consultAppts = todayAppts.filter((a) => a.fields['Is Consult']);
    const consultsClosed = consultAppts.filter(
      (a) => a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed'
    ).length;

    const noShows = todayAppts.filter((a) => a.fields['Status'] === 'no_show').length;
    const cancellations = todayAppts.filter((a) => a.fields['Status'] === 'cancelled').length;

    const metrics: DailyMetrics = {
      revenue,
      revenueTarget: 4000,
      bookedHours: bookedMinutes / 60,
      availableHours: 16, // 2 providers x 8 hours
      consultsClosed,
      consultsCompleted: consultAppts.length,
      patientsRebooked: completedAppts.length, // proxy
      patientsSeen: completedAppts.length,
      reviewsReceived: 0,
      followUpsCompleted: 0,
      followUpsDue: 0,
      onTimeStarts: todayAppts.length, // proxy
      totalAppointments: todayAppts.length,
      noShows,
      cancellations,
    };

    const { total, breakdown, status } = calculateClinicScore(metrics);

    // Monthly revenue for boss level
    const monthlyRevenue = monthTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const bossProgress = getCurrentBossLevel(monthlyRevenue);

    const data = {
      total,
      breakdown,
      status,
      streak: 0,
      xp: 0,
      level: 1,
      bossProgress: {
        current: bossProgress.current,
        progress: Math.round(bossProgress.progress),
        currentRevenue: Math.round(monthlyRevenue),
      },
    };

    cache.set('gamification-score', data, TTL.STANDARD);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calculating gamification score:', error);
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 });
  }
}
