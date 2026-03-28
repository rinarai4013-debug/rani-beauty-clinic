import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { ACHIEVEMENTS as DAILY_ACHIEVEMENTS, checkAchievements } from '@/data/dashboard/achievement-definitions';
import { getCurrentLevel } from '@/lib/gamification/levels';
import type { DailyMetrics } from '@/types/gamification';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
}

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

interface ReviewFields {
  'Star Rating': number;
  'Review Date': string;
}

// Monthly milestone achievements (supplementary to daily achievements)
const MONTHLY_MILESTONES = [
  { id: 'revenue-1k', name: 'Thousand Club', description: 'Reach $1,000 in monthly revenue', icon: '💵', category: 'revenue' as const, rarity: 'common' as const, xpReward: 100 },
  { id: 'revenue-10k', name: 'Five Figure Flow', description: '$10,000 monthly revenue', icon: '💰', category: 'revenue' as const, rarity: 'rare' as const, xpReward: 250 },
  { id: 'revenue-50k', name: 'Revenue Royalty', description: '$50,000 monthly revenue', icon: '👑', category: 'revenue' as const, rarity: 'epic' as const, xpReward: 500 },
  { id: 'revenue-100k', name: 'Six Figure Sovereign', description: '$100,000 monthly revenue', icon: '💎', category: 'revenue' as const, rarity: 'legendary' as const, xpReward: 1000 },
  { id: 'bookings-50', name: 'Fully Booked', description: '50 appointments in a month', icon: '📅', category: 'bookings' as const, rarity: 'rare' as const, xpReward: 200 },
  { id: 'bookings-100', name: 'Century Mark', description: '100 appointments in a month', icon: '🌟', category: 'bookings' as const, rarity: 'epic' as const, xpReward: 400 },
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<unknown>('gamification-achievements');
    if (cached) {
      return NextResponse.json(cached);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch today's data for daily achievement checks + monthly data for milestones
    const [todayAppts, todayTxns, monthTxns, monthAppts, monthReviews] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${today}', {Type} = 'Service')`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'), {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `AND(IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'))`,
      }),
      fetchAll<ReviewFields>(Tables.reviews(), {
        filterByFormula: `AND(IS_AFTER({Review Date}, '${monthStart}'), IS_BEFORE({Review Date}, '${monthEnd}'))`,
      }),
    ]);

    // Build DailyMetrics from today's data (same pattern as score route)
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
      availableHours: 16,
      consultsClosed,
      consultsCompleted: consultAppts.length,
      patientsRebooked: completedAppts.length,
      patientsSeen: completedAppts.length,
      reviewsReceived: 0,
      followUpsCompleted: 0,
      followUpsDue: 0,
      onTimeStarts: todayAppts.length,
      totalAppointments: todayAppts.length,
      noShows,
      cancellations,
    };

    // Check daily achievements using the canonical definitions
    const earnedDailyAchievements = checkAchievements(metrics);
    const earnedDailyIds = new Set(earnedDailyAchievements.map((a) => a.id));

    // Build daily achievement responses
    const dailyAchievementResults = DAILY_ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      rarity: a.rarity,
      xpReward: a.xpReward,
      type: 'daily' as const,
      earned: earnedDailyIds.has(a.id),
      dateEarned: earnedDailyIds.has(a.id) ? now.toISOString() : undefined,
    }));

    // Check monthly milestones
    const monthlyRevenue = monthTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    const monthlyCompletedAppts = monthAppts.filter((a) => a.fields['Status'] === 'completed').length;

    const monthlyChecks: Record<string, boolean> = {
      'revenue-1k': monthlyRevenue >= 1000,
      'revenue-10k': monthlyRevenue >= 10000,
      'revenue-50k': monthlyRevenue >= 50000,
      'revenue-100k': monthlyRevenue >= 100000,
      'bookings-50': monthlyCompletedAppts >= 50,
      'bookings-100': monthlyCompletedAppts >= 100,
    };

    const monthlyAchievementResults = MONTHLY_MILESTONES.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      rarity: a.rarity,
      xpReward: a.xpReward,
      type: 'monthly' as const,
      earned: monthlyChecks[a.id] || false,
      dateEarned: monthlyChecks[a.id] ? now.toISOString() : undefined,
    }));

    // Merge all achievements
    const achievements = [...dailyAchievementResults, ...monthlyAchievementResults];

    // Calculate total XP from all earned achievements
    const totalXP = achievements
      .filter((a) => a.earned)
      .reduce((sum, a) => sum + a.xpReward, 0);

    const level = getCurrentLevel(totalXP);

    const data = {
      achievements,
      totalXP,
      level: level.level,
    };

    cache.set('gamification-achievements', data, TTL.STANDARD);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
