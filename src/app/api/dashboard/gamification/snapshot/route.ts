import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll, fetchFirst } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { withSentry } from '@/lib/sentry-utils';
import { calculateClinicScore, getCurrentBossLevel } from '@/lib/gamification/engine';
import { getCurrentLevel } from '@/lib/gamification/levels';
import { SCORE_WEIGHTS, TARGETS } from '@/data/dashboard/score-weights';
import type { DailyMetrics } from '@/types/gamification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AppointmentFields {
  Date?: string;
  Duration?: number;
  Status?: string;
  'Is Consult'?: boolean;
  'Consult Outcome'?: string;
}

interface TransactionFields {
  Date?: string;
  Amount?: number;
  Type?: string;
  Status?: string;
}

interface ReviewFields {
  'Review Date'?: string;
}

interface KpiSnapshotFields {
  Date?: string;
  Revenue?: number;
  'Total Bookings'?: number;
  'Total Shows'?: number;
  'Total No-Shows'?: number;
  'New Leads'?: number;
  'Consultations Completed'?: number;
  'Close Rate'?: number;
  'Reviews Received'?: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(value?: string): string {
  const parsed = parseDate(value);
  if (!parsed) return '';
  return parsed.toISOString().slice(0, 10);
}

function isCompletedStatus(status?: string): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized.includes('completed') || normalized.includes('checked');
}

function isConsultClosed(outcome?: string): boolean {
  const normalized = (outcome || '').toLowerCase();
  return ['book', 'closed', 'convert', 'sold'].some((marker) => normalized.includes(marker));
}

function isCancelledStatus(status?: string): boolean {
  return (status || '').toLowerCase().includes('cancel');
}

function isNoShowStatus(status?: string): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized.includes('no-show') || normalized.includes('no show');
}

function transactionNetAmount(record: TransactionFields): number {
  const amount = Number(record.Amount || 0);
  const type = (record.Type || '').toLowerCase();
  return type.includes('refund') ? -amount : amount;
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function buildSnapshotMetrics(fields: KpiSnapshotFields): DailyMetrics {
  const revenue = Number(fields.Revenue || 0);
  const totalBookings = Number(fields['Total Bookings'] || 0);
  const consultsCompleted = Number(fields['Consultations Completed'] || 0);
  const closeRate = Number(fields['Close Rate'] || 0);
  const consultsClosed = Math.round((consultsCompleted * closeRate) / 100);
  const totalShows = Number(fields['Total Shows'] || 0);
  const noShows = Number(fields['Total No-Shows'] || 0);
  const reviewsReceived = Number(fields['Reviews Received'] || 0);

  return {
    revenue,
    revenueTarget: TARGETS.dailyRevenue,
    bookedHours: totalBookings,
    availableHours: Math.max(totalBookings + 2, 1),
    consultsClosed,
    consultsCompleted,
    patientsRebooked: Math.min(totalShows, consultsClosed),
    patientsSeen: Math.max(totalShows, 0),
    reviewsReceived,
    followUpsCompleted: consultsClosed,
    followUpsDue: Math.max(consultsCompleted, 0),
    onTimeStarts: Math.max(totalBookings - noShows, 0),
    totalAppointments: totalBookings,
    noShows,
    cancellations: 0,
  };
}

export async function GET() {
  return withSentry('dashboard-gamification-snapshot', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_leaderboard')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = todayKey();
    const cacheKey = `dashboard-gamification-snapshot-${today}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    try {
      const [appointments, transactions, reviews, newLeadsToday, snapshots] = await Promise.all([
        fetchAll<AppointmentFields>(Tables.appointments(), {}, true),
        fetchAll<TransactionFields>(Tables.transactions(), {}, true),
        fetchAll<ReviewFields>(Tables.reviews(), {}, true),
        fetchAll<Record<string, unknown>>(
          Tables.clients(),
          { filterByFormula: "IS_SAME(CREATED_TIME(), TODAY(), 'day')" },
          true,
        ),
        fetchFirst<KpiSnapshotFields>(
          Tables.kpis(),
          3,
          { sort: [{ field: 'Date', direction: 'desc' }] },
          true,
        ),
      ]);

      const now = new Date();
      const currentMonth = monthKey(now);
      // Airtable fetchAll returns { id, fields: T }[] \u00b7 access fields via record.fields
      const todayAppointments = appointments.filter((record) => toDateKey(record.fields.Date) === today);
      const todayTransactions = transactions.filter((record) => toDateKey(record.fields.Date) === today);
      const todayReviews = reviews.filter((record) => toDateKey(record.fields['Review Date']) === today);

      const monthlyRevenue = transactions
        .filter((record) => {
          const parsed = parseDate(record.fields.Date);
          return parsed ? monthKey(parsed) === currentMonth : false;
        })
        .reduce((sum, record) => sum + transactionNetAmount(record.fields), 0);

      const totalAppointments = todayAppointments.length;
      const bookedHours = todayAppointments.reduce(
        (sum, record) => sum + ((Number(record.fields.Duration || 60) || 60) / 60),
        0,
      );
      const noShows = todayAppointments.filter((record) => isNoShowStatus(record.fields.Status)).length;
      const cancellations = todayAppointments.filter((record) => isCancelledStatus(record.fields.Status)).length;
      const consultAppointments = todayAppointments.filter((record) => Boolean(record.fields['Is Consult']));
      const consultsCompleted = consultAppointments.filter((record) => isCompletedStatus(record.fields.Status)).length;
      const consultsClosed = consultAppointments.filter((record) => isConsultClosed(record.fields['Consult Outcome'])).length;
      const patientsSeen = todayAppointments.filter((record) => isCompletedStatus(record.fields.Status)).length;
      const patientsRebooked = Math.min(patientsSeen, consultsClosed);
      const revenue = todayTransactions.reduce((sum, record) => sum + transactionNetAmount(record.fields), 0);

      const metrics: DailyMetrics = {
        revenue,
        revenueTarget: TARGETS.dailyRevenue,
        bookedHours,
        availableHours: Math.max(16, Math.ceil(bookedHours)),
        consultsClosed,
        consultsCompleted,
        patientsRebooked,
        patientsSeen,
        reviewsReceived: todayReviews.length,
        followUpsCompleted: consultsClosed,
        followUpsDue: Math.max(consultsCompleted, consultAppointments.length),
        onTimeStarts: Math.max(totalAppointments - noShows, 0),
        totalAppointments,
        noShows,
        cancellations,
      };

      const score = calculateClinicScore(metrics);
      const xp = Math.round(score.total * 100);
      const level = getCurrentLevel(xp);
      const bossLevel = getCurrentBossLevel(monthlyRevenue);

      const previousSnapshot = snapshots
        .map((snapshot) => snapshot.fields)
        .find((snapshot) => (snapshot.Date || '') < today);

      let trend = {
        previousSnapshotDate: null as string | null,
        scoreDelta: null as number | null,
        revenueDelta: null as number | null,
        bookingsDelta: null as number | null,
        leadsDelta: null as number | null,
      };

      if (previousSnapshot) {
        const previousMetrics = buildSnapshotMetrics(previousSnapshot);
        const previousScore = calculateClinicScore(previousMetrics).total;
        trend = {
          previousSnapshotDate: previousSnapshot.Date || null,
          scoreDelta: score.total - previousScore,
          revenueDelta: revenue - Number(previousSnapshot.Revenue || 0),
          bookingsDelta: totalAppointments - Number(previousSnapshot['Total Bookings'] || 0),
          leadsDelta: newLeadsToday.length - Number(previousSnapshot['New Leads'] || 0),
        };
      }

      const weightedBreakdown = Object.entries(score.breakdown).map(([category, value]) => {
        const weight = SCORE_WEIGHTS[category as keyof typeof SCORE_WEIGHTS];
        return {
          category,
          score: value,
          weight,
          weightedScore: Number((value * weight).toFixed(2)),
        };
      });

      const payload = {
        status: 'ok',
        label: 'Verified live',
        snapshotDate: today,
        score: score.total,
        statusBand: score.status,
        level,
        bossLevel: {
          ...bossLevel.current,
          progress: Number(bossLevel.progress.toFixed(1)),
          currentRevenue: Math.round(monthlyRevenue),
        },
        metrics: {
          revenue: Math.round(revenue),
          appointments: totalAppointments,
          newLeads: newLeadsToday.length,
          reviews: todayReviews.length,
          consultsCompleted,
          consultsClosed,
        },
        breakdown: weightedBreakdown,
        trend,
      };

      cache.set(cacheKey, payload, TTL.STANDARD);
      return NextResponse.json(payload);
    } catch (error) {
      console.error('[dashboard/gamification/snapshot]', error);
      return NextResponse.json({ error: 'Failed to load gamification snapshot' }, { status: 500 });
    }
  });
}
