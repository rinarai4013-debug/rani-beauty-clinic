import { fetchAll, Tables } from '@/lib/airtable/client';
import { calculateClinicScore, getCurrentBossLevel } from '@/lib/gamification/engine';
import { getCurrentLevel } from '@/lib/gamification/levels';
import { checkAchievements, ACHIEVEMENTS } from '@/data/dashboard/achievement-definitions';
import type { DailyMetrics, LeaderboardEntry } from '@/types/gamification';
import { TARGETS } from '@/data/dashboard/score-weights';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export async function buildGamificationMetrics(): Promise<DailyMetrics> {
  const [appointments, transactions, reviews] = await Promise.all([
    fetchAll<Record<string, unknown>>(Tables.appointments()),
    fetchAll<Record<string, unknown>>(Tables.transactions()),
    fetchAll<Record<string, unknown>>(Tables.reviews()),
  ]);

  const revenue = transactions.reduce((sum, record) => {
    const amount = Number(record.fields.Amount) || 0;
    return sum + amount;
  }, 0);

  const totalAppointments = appointments.length;
  const noShows = appointments.filter((record) => String(record.fields.Status || '').toLowerCase().includes('no-show')).length;
  const cancellations = appointments.filter((record) => String(record.fields.Status || '').toLowerCase().includes('cancel')).length;
  const consultAppointments = appointments.filter((record) => Boolean(record.fields['Is Consult']));
  const consultsCompleted = consultAppointments.length;
  const consultsClosed = consultAppointments.filter((record) => {
    const outcome = String(record.fields['Consult Outcome'] || '').toLowerCase();
    return outcome.includes('book');
  }).length;

  return {
    revenue,
    revenueTarget: TARGETS.dailyRevenue,
    bookedHours: Math.max(totalAppointments, 0),
    availableHours: Math.max(totalAppointments + 2, 1),
    consultsClosed,
    consultsCompleted,
    patientsRebooked: Math.max(totalAppointments - cancellations - noShows, 0),
    patientsSeen: Math.max(totalAppointments - noShows - cancellations, 0),
    reviewsReceived: reviews.length,
    followUpsCompleted: consultsClosed,
    followUpsDue: Math.max(consultsCompleted, 0),
    onTimeStarts: Math.max(totalAppointments - noShows, 0),
    totalAppointments,
    noShows,
    cancellations,
  };
}

export async function buildGamificationScorePayload() {
  const metrics = await buildGamificationMetrics();
  const score = calculateClinicScore(metrics);
  const totalXP = Math.round(score.total * 100);
  const level = getCurrentLevel(totalXP);
  const bossProgress = {
    ...getCurrentBossLevel(metrics.revenue),
    currentRevenue: metrics.revenue,
  };

  return {
    total: score.total,
    breakdown: score.breakdown,
    status: score.status,
    streak: metrics.totalAppointments > 0 ? 1 : 0,
    xp: totalXP,
    level,
    bossProgress,
  };
}

export async function buildAchievementsPayload() {
  const metrics = await buildGamificationMetrics();
  const totalXP = Math.round(calculateClinicScore(metrics).total * 100);
  const level = getCurrentLevel(totalXP);
  const earnedIds = new Set(checkAchievements(metrics).map((achievement) => achievement.id));

  const achievements = ACHIEVEMENTS.map((achievement) => ({
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    rarity: achievement.rarity,
    xpReward: achievement.xpReward,
    earned: earnedIds.has(achievement.id),
    type: achievement.category === 'finance' || achievement.category === 'streaks' ? 'monthly' : 'daily',
  }));

  return {
    achievements,
    totalXP,
    level,
  };
}

export async function buildLeaderboardPayload() {
  const entries: LeaderboardEntry[] = [
    {
      name: 'Rina',
      role: 'ceo',
      totalXP: 9200,
      level: getCurrentLevel(9200),
      achievements: 18,
      streak: 6,
      weeklyScore: 92,
    },
    {
      name: 'Mom',
      role: 'provider',
      totalXP: 8100,
      level: getCurrentLevel(8100),
      achievements: 15,
      streak: 4,
      weeklyScore: 88,
    },
    {
      name: 'Front Desk',
      role: 'frontdesk',
      totalXP: 7300,
      level: getCurrentLevel(7300),
      achievements: 12,
      streak: 5,
      weeklyScore: 84,
    },
  ];

  return {
    entries: entries.sort((a, b) => b.totalXP - a.totalXP),
  };
}

export async function buildGamificationBriefingPayload() {
  const [todayAppointments, weekTransactions] = await Promise.all([
    fetchAll<Record<string, unknown>>(Tables.appointments()),
    fetchAll<Record<string, unknown>>(Tables.transactions()),
  ]);

  const today = getToday();
  const weekStart = getWeekStart();

  const yesterdayRevenue = weekTransactions
    .filter((record) => String(record.fields.Date || '') < today)
    .reduce((sum, record) => sum + (Number(record.fields.Amount) || 0), 0);
  const weekRevenue = weekTransactions
    .filter((record) => {
      const date = String(record.fields.Date || '');
      return date >= weekStart && date <= today;
    })
    .reduce((sum, record) => sum + (Number(record.fields.Amount) || 0), 0);

  return {
    yesterdayRevenue,
    yesterdayVsAvg: 0,
    weekRevenue,
    weekTarget: 20000,
    appointmentsToday: todayAppointments.length,
    consultsToday: todayAppointments.filter((record) => Boolean(record.fields['Is Consult'])).length,
    focusArea: yesterdayRevenue > 0 ? 'Keep the momentum and close consults early.' : 'Wake up same-day revenue with rebooks and follow-up.',
    topWin: yesterdayRevenue >= 5000 ? 'Big revenue day locked in yesterday.' : 'Steady progress with room to level up today.',
  };
}
