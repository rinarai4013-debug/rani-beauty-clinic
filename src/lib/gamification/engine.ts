import type { DailyMetrics, ScoreBreakdown, ScoreStatus, BossLevel } from '@/types/gamification';
import { SCORE_WEIGHTS } from '@/data/dashboard/score-weights';

export function calculateClinicScore(metrics: DailyMetrics): {
  total: number;
  breakdown: ScoreBreakdown;
  status: ScoreStatus;
} {
  const revenue = metrics.revenueTarget > 0
    ? Math.min((metrics.revenue / metrics.revenueTarget) * 100, 100)
    : 0;

  const utilization = metrics.availableHours > 0
    ? (metrics.bookedHours / metrics.availableHours) * 100
    : 0;

  const consultConversion = metrics.consultsCompleted > 0
    ? (metrics.consultsClosed / metrics.consultsCompleted) * 100
    : 100; // no consults = no penalty

  const rebooks = metrics.patientsSeen > 0
    ? (metrics.patientsRebooked / metrics.patientsSeen) * 100
    : 100;

  const reviews = metrics.reviewsReceived >= 1 ? 100 : 0;

  const followUps = metrics.followUpsDue > 0
    ? (metrics.followUpsCompleted / metrics.followUpsDue) * 100
    : 100;

  const operations = metrics.totalAppointments > 0
    ? ((metrics.totalAppointments - metrics.noShows - metrics.cancellations) / metrics.totalAppointments) * 100
    : 100;

  const breakdown: ScoreBreakdown = {
    revenue: Math.round(revenue),
    utilization: Math.round(utilization),
    consultConversion: Math.round(consultConversion),
    rebooks: Math.round(rebooks),
    reviews: Math.round(reviews),
    followUps: Math.round(followUps),
    operations: Math.round(operations),
  };

  const total = Math.round(
    revenue * SCORE_WEIGHTS.revenue +
    utilization * SCORE_WEIGHTS.utilization +
    consultConversion * SCORE_WEIGHTS.consultConversion +
    rebooks * SCORE_WEIGHTS.rebooks +
    reviews * SCORE_WEIGHTS.reviews +
    followUps * SCORE_WEIGHTS.followUps +
    operations * SCORE_WEIGHTS.operations
  );

  const clampedTotal = Math.max(0, Math.min(100, total));

  const status: ScoreStatus =
    clampedTotal >= 90 ? 'elite' :
    clampedTotal >= 80 ? 'strong' :
    clampedTotal >= 60 ? 'growing' : 'critical';

  return { total: clampedTotal, breakdown, status };
}

export const BOSS_LEVELS: BossLevel[] = [
  { id: 'b1', name: 'Bronze Boss', target: 30000, reward: 500, icon: '🥉' },
  { id: 'b2', name: 'Silver Siege', target: 50000, reward: 750, icon: '🥈' },
  { id: 'b3', name: 'Gold Guardian', target: 75000, reward: 1000, icon: '🥇' },
  { id: 'b4', name: 'Platinum Power', target: 100000, reward: 2000, icon: '💎' },
  { id: 'b5', name: 'Diamond Dynasty', target: 150000, reward: 5000, icon: '👑' },
];

export function getCurrentBossLevel(monthlyRevenue: number): {
  current: BossLevel;
  progress: number;
} {
  let current = BOSS_LEVELS[0];
  for (const boss of BOSS_LEVELS) {
    if (monthlyRevenue < boss.target) {
      current = boss;
      break;
    }
    current = boss;
  }

  const prevTarget = BOSS_LEVELS.indexOf(current) > 0
    ? BOSS_LEVELS[BOSS_LEVELS.indexOf(current) - 1].target
    : 0;

  const progress = Math.min(
    ((monthlyRevenue - prevTarget) / (current.target - prevTarget)) * 100,
    100
  );

  return { current, progress };
}
