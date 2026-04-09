import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { calculateClinicScore, getCurrentBossLevel } from '@/lib/gamification/engine';
import { getCurrentLevel, getNextLevel, getLevelProgress } from '@/lib/gamification/levels';
import { TARGETS } from '@/data/dashboard/score-weights';
import type { DailyMetrics } from '@/types/gamification';

interface TransactionFields {
  'Date': string;
  'Amount': number;
  'Type': string;
  'Status': string;
}

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Duration': number;
  'Is Consult': boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'gamification:snapshot';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const today = todayISO();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayFilter = `IS_SAME({Date}, '${today}', 'day')`;

    const [todayTxns, todayAppts, monthTxns] = await Promise.all([
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(${todayFilter}, {Status} = "Completed")`,
        fields: ['Date', 'Amount', 'Type', 'Status'],
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: todayFilter,
        fields: ['Date', 'Status', 'Duration', 'Is Consult'],
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} >= '${monthStart}', {Date} <= '${today}', {Status} = "Completed")`,
        fields: ['Date', 'Amount', 'Type', 'Status'],
      }),
    ]);

    // Daily metrics for clinic score
    const dailyRevenue = todayTxns.reduce((sum, t) => {
      const amt = Number(t.fields['Amount']) || 0;
      return sum + (t.fields['Type'] === 'Refund' ? -amt : amt);
    }, 0);

    const totalAppointments = todayAppts.length;
    const completed = todayAppts.filter(a => a.fields['Status'] === 'completed');
    const noShows = todayAppts.filter(a => a.fields['Status'] === 'no_show').length;
    const cancellations = todayAppts.filter(a => a.fields['Status'] === 'cancelled').length;

    const bookedMinutes = todayAppts
      .filter(a => a.fields['Status'] !== 'cancelled')
      .reduce((sum, a) => sum + (a.fields['Duration'] || 0), 0);

    const consults = todayAppts.filter(a => a.fields['Is Consult']);
    const consultsCompleted = consults.length;
    const consultsClosed = consults.filter(a => a.fields['Status'] === 'completed').length;
    const onTimeStarts = Math.max(0, totalAppointments - noShows - cancellations);

    const metrics: DailyMetrics = {
      revenue: dailyRevenue,
      revenueTarget: TARGETS.dailyRevenue,
      bookedHours: bookedMinutes / 60,
      availableHours: 16,
      consultsCompleted,
      consultsClosed,
      patientsSeen: completed.length,
      patientsRebooked: Math.round(completed.length * 0.7),
      reviewsReceived: 0,
      followUpsDue: completed.length,
      followUpsCompleted: completed.length,
      onTimeStarts,
      totalAppointments,
      noShows,
      cancellations,
    };

    const score = calculateClinicScore(metrics);

    // Monthly revenue for boss level
    const monthlyRevenue = monthTxns.reduce((sum, t) => {
      const amt = Number(t.fields['Amount']) || 0;
      return sum + (t.fields['Type'] === 'Refund' ? -amt : amt);
    }, 0);

    const bossLevel = getCurrentBossLevel(monthlyRevenue);

    // XP / level system (simplified: XP = monthly revenue / 10)
    const totalXP = Math.round(monthlyRevenue / 10);
    const currentLevel = getCurrentLevel(totalXP);
    const nextLevel = getNextLevel(totalXP);
    const levelProgress = getLevelProgress(totalXP);

    const result = {
      score: {
        total: score.total,
        status: score.status,
        breakdown: score.breakdown,
      },
      bossLevel: {
        current: bossLevel.current,
        progress: Math.round(bossLevel.progress),
        monthlyRevenue: Math.round(monthlyRevenue),
      },
      level: {
        current: currentLevel,
        next: nextLevel,
        progress: levelProgress,
        totalXP,
      },
      topStats: {
        dailyRevenue: Math.round(dailyRevenue),
        dailyTarget: TARGETS.dailyRevenue,
        revenueVsTarget: Math.round((dailyRevenue / TARGETS.dailyRevenue) * 100),
        appointmentsCompleted: completed.length,
        totalAppointments,
        utilization: metrics.availableHours > 0
          ? Math.round((metrics.bookedHours / metrics.availableHours) * 100)
          : 0,
      },
      asOf: new Date().toISOString(),
    };

    cache.set(cacheKey, result, TTL.REALTIME);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[dashboard/gamification/snapshot]', err);
    return NextResponse.json({ error: 'Failed to generate snapshot' }, { status: 500 });
  }
}
