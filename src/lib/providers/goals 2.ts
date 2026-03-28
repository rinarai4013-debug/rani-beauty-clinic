/**
 * Provider Goal Tracking Engine
 *
 * Revenue targets, service-specific goals, client retention goals,
 * rebook rate targets, review targets, training goals, gamification
 * (leaderboard, streaks, achievements), coaching recommendations.
 */

import type {
  ProviderGoal,
  GoalProgress,
  GoalStatus,
  GoalType,
  CoachingRecommendation,
  LeaderboardEntry,
  Achievement,
  GoalMilestone,
} from '@/types/providers';

// ── INPUT TYPES ──

export interface GoalInput {
  providerId: string;
  goals: ProviderGoal[];
  currentDate?: string; // ISO date, defaults to now
}

export interface LeaderboardInput {
  providers: { id: string; name: string; metrics: Record<string, number> }[];
  metric: string;
  previousRankings?: Record<string, number>; // providerId → previous rank
}

// ── DEFAULT GOALS TEMPLATES ──

export const GOAL_TEMPLATES: Omit<ProviderGoal, 'id' | 'providerId' | 'currentValue' | 'status' | 'progressPercent' | 'startDate' | 'endDate'>[] = [
  {
    type: 'revenue',
    title: 'Monthly Revenue Target',
    description: 'Total service revenue for the month',
    targetValue: 25000,
    unit: 'USD',
    period: 'monthly',
    milestones: [
      { label: '25% milestone', targetValue: 6250, achieved: false },
      { label: '50% milestone', targetValue: 12500, achieved: false },
      { label: '75% milestone', targetValue: 18750, achieved: false },
      { label: 'Target reached', targetValue: 25000, achieved: false },
    ],
  },
  {
    type: 'service_count',
    title: 'Injectable Appointments',
    description: 'Number of injection appointments completed',
    targetValue: 40,
    unit: 'appointments',
    period: 'monthly',
    milestones: [
      { label: '10 appointments', targetValue: 10, achieved: false },
      { label: '20 appointments', targetValue: 20, achieved: false },
      { label: '30 appointments', targetValue: 30, achieved: false },
      { label: 'Target reached', targetValue: 40, achieved: false },
    ],
  },
  {
    type: 'retention',
    title: 'Client Retention Rate',
    description: 'Percentage of clients who return within 90 days',
    targetValue: 75,
    unit: '%',
    period: 'quarterly',
    milestones: [
      { label: '60% baseline', targetValue: 60, achieved: false },
      { label: '70% good', targetValue: 70, achieved: false },
      { label: '75% target', targetValue: 75, achieved: false },
    ],
  },
  {
    type: 'rebook',
    title: 'Rebook Rate',
    description: 'Percentage of appointments with a follow-up booked',
    targetValue: 80,
    unit: '%',
    period: 'monthly',
    milestones: [
      { label: '60% baseline', targetValue: 60, achieved: false },
      { label: '70% good', targetValue: 70, achieved: false },
      { label: '80% excellent', targetValue: 80, achieved: false },
    ],
  },
  {
    type: 'review',
    title: 'Review Score Target',
    description: 'Average Google review rating',
    targetValue: 4.8,
    unit: 'stars',
    period: 'quarterly',
    milestones: [
      { label: '4.5 stars', targetValue: 4.5, achieved: false },
      { label: '4.7 stars', targetValue: 4.7, achieved: false },
      { label: '4.8 stars', targetValue: 4.8, achieved: false },
    ],
  },
  {
    type: 'training',
    title: 'CE Credits Completion',
    description: 'Continuing education credits for license renewal',
    targetValue: 20,
    unit: 'credits',
    period: 'annual',
    milestones: [
      { label: '5 credits', targetValue: 5, achieved: false },
      { label: '10 credits', targetValue: 10, achieved: false },
      { label: '15 credits', targetValue: 15, achieved: false },
      { label: '20 credits', targetValue: 20, achieved: false },
    ],
  },
];

// ── ACHIEVEMENTS ──

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-1k-day', title: 'First $1K Day', description: 'Generated $1,000+ in a single day',
    icon: '💰', category: 'revenue', requirement: { metric: 'dailyRevenue', threshold: 1000 }, unlockedBy: [],
  },
  {
    id: 'five-star-week', title: 'Five Star Week', description: 'Received 5 five-star reviews in one week',
    icon: '⭐', category: 'quality', requirement: { metric: 'weeklyFiveStarReviews', threshold: 5 }, unlockedBy: [],
  },
  {
    id: 'full-book', title: 'Fully Booked', description: '100% utilization for the day',
    icon: '📅', category: 'consistency', requirement: { metric: 'dailyUtilization', threshold: 100 }, unlockedBy: [],
  },
  {
    id: 'rebook-king', title: 'Rebook Royalty', description: '90%+ rebook rate for the month',
    icon: '👑', category: 'clients', requirement: { metric: 'monthlyRebookRate', threshold: 90 }, unlockedBy: [],
  },
  {
    id: 'zero-no-shows', title: 'No-Show Zero', description: 'Zero no-shows for 30 consecutive days',
    icon: '🎯', category: 'consistency', requirement: { metric: 'noShowFreeDays', threshold: 30 }, unlockedBy: [],
  },
  {
    id: 'upsell-pro', title: 'Upsell Pro', description: '25%+ upsell rate for the month',
    icon: '📈', category: 'growth', requirement: { metric: 'monthlyUpsellRate', threshold: 25 }, unlockedBy: [],
  },
  {
    id: '10k-month', title: '$10K Month', description: 'Generated $10,000+ in a single month',
    icon: '🏆', category: 'revenue', requirement: { metric: 'monthlyRevenue', threshold: 10000 }, unlockedBy: [],
  },
  {
    id: '25k-month', title: '$25K Month', description: 'Generated $25,000+ in a single month',
    icon: '💎', category: 'revenue', requirement: { metric: 'monthlyRevenue', threshold: 25000 }, unlockedBy: [],
  },
  {
    id: 'retention-star', title: 'Retention Star', description: '80%+ client retention for the quarter',
    icon: '🌟', category: 'clients', requirement: { metric: 'quarterlyRetention', threshold: 80 }, unlockedBy: [],
  },
  {
    id: 'ce-champion', title: 'CE Champion', description: 'Completed all required CE credits early',
    icon: '🎓', category: 'growth', requirement: { metric: 'ceCreditsCompleted', threshold: 100 }, unlockedBy: [],
  },
];

// ── GOAL STATUS CALCULATION ──

export function calculateGoalStatus(goal: ProviderGoal, currentDate: string): GoalStatus {
  const now = new Date(currentDate);
  const start = new Date(goal.startDate);
  const end = new Date(goal.endDate);

  if (goal.currentValue >= goal.targetValue) return 'exceeded';
  if (now > end && goal.currentValue >= goal.targetValue * 0.95) return 'completed';
  if (now > end) return 'behind';
  if (now < start) return 'not_started';

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const timeProgress = totalDuration > 0 ? elapsed / totalDuration : 0;
  const valueProgress = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0;

  // If value progress is at least 80% of time progress, on track
  if (valueProgress >= timeProgress * 0.8) return 'on_track';
  if (valueProgress >= timeProgress * 0.5) return 'at_risk';
  return 'behind';
}

export function calculateProgressPercent(currentValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0;
  return Math.min(100, Math.round((currentValue / targetValue) * 1000) / 10);
}

// ── UPDATE MILESTONES ──

export function updateMilestones(
  milestones: GoalMilestone[],
  currentValue: number,
  currentDate: string,
): GoalMilestone[] {
  return milestones.map(m => {
    if (m.achieved) return m;
    if (currentValue >= m.targetValue) {
      return { ...m, achieved: true, achievedDate: currentDate };
    }
    return m;
  });
}

// ── GOAL PROGRESS AGGREGATION ──

export function calculateGoalProgress(input: GoalInput): GoalProgress {
  const currentDate = input.currentDate ?? new Date().toISOString().split('T')[0];

  const goals = input.goals.map(goal => {
    const status = calculateGoalStatus(goal, currentDate);
    const progressPercent = calculateProgressPercent(goal.currentValue, goal.targetValue);
    const milestones = updateMilestones(goal.milestones, goal.currentValue, currentDate);
    return { ...goal, status, progressPercent, milestones };
  });

  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length)
    : 0;

  const goalsOnTrack = goals.filter(g => g.status === 'on_track').length;
  const goalsAtRisk = goals.filter(g => g.status === 'at_risk').length;
  const goalsBehind = goals.filter(g => g.status === 'behind').length;
  const goalsExceeded = goals.filter(g => g.status === 'exceeded' || g.status === 'completed').length;

  // Calculate streak (consecutive months with all goals met — simplified)
  const streak = goalsExceeded === goals.length ? 1 : 0;

  const coachingRecommendations = generateCoachingRecommendations(goals);

  return {
    providerId: input.providerId,
    goals,
    overallProgress,
    goalsOnTrack,
    goalsAtRisk,
    goalsBehind,
    goalsExceeded,
    streak,
    coachingRecommendations,
  };
}

// ── COACHING RECOMMENDATIONS ──

export function generateCoachingRecommendations(goals: ProviderGoal[]): CoachingRecommendation[] {
  const recommendations: CoachingRecommendation[] = [];

  for (const goal of goals) {
    if (goal.status !== 'at_risk' && goal.status !== 'behind') continue;

    const gap = goal.targetValue - goal.currentValue;
    const gapPercent = goal.targetValue > 0 ? (gap / goal.targetValue) * 100 : 0;

    const rec: CoachingRecommendation = {
      goalId: goal.id,
      goalTitle: goal.title,
      gap,
      recommendation: '',
      priority: goal.status === 'behind' ? 'high' : 'medium',
      actionItems: [],
    };

    switch (goal.type) {
      case 'revenue':
        rec.recommendation = `Revenue is ${gapPercent.toFixed(0)}% below target. Focus on high-value services and upsell opportunities.`;
        rec.actionItems = [
          'Review service mix — shift toward higher-ticket treatments',
          'Increase injection appointment availability during peak hours',
          'Offer package bundles to increase average ticket size',
          'Follow up with pending consultations to close bookings',
        ];
        break;

      case 'service_count':
        rec.recommendation = `${gap} more appointments needed. Increase availability and promote this service.`;
        rec.actionItems = [
          'Open additional time slots for this service category',
          'Coordinate with front desk to prioritize this service in booking suggestions',
          'Review waitlist for potential fill-ins',
        ];
        break;

      case 'retention':
        rec.recommendation = `Client retention is ${gapPercent.toFixed(0)}% below target. Focus on post-treatment follow-up.`;
        rec.actionItems = [
          'Ensure every client receives post-treatment follow-up within 48 hours',
          'Implement personalized aftercare messaging',
          'Review lapsed clients and send reactivation outreach',
          'Check if treatment outcomes are meeting expectations',
        ];
        break;

      case 'rebook':
        rec.recommendation = `Rebook rate is ${gapPercent.toFixed(0)}% below target. Focus on end-of-appointment booking.`;
        rec.actionItems = [
          'Book follow-up before client leaves the room',
          'Explain the treatment timeline and why follow-up matters',
          'Offer a preferred time slot to make rebooking easy',
          'Review treatment plans to identify natural next steps',
        ];
        break;

      case 'review':
        rec.recommendation = `Review score needs improvement. Focus on client experience excellence.`;
        rec.actionItems = [
          'Ask satisfied clients for reviews at checkout',
          'Address any negative feedback patterns immediately',
          'Ensure wait times are minimal and experience is seamless',
        ];
        break;

      case 'training':
        rec.recommendation = `${gap} more ${goal.unit} needed. Schedule training sessions promptly.`;
        rec.actionItems = [
          'Block dedicated training time in the schedule',
          'Identify upcoming CE opportunities or online courses',
          'Discuss development priorities with supervisor',
        ];
        break;

      default:
        rec.recommendation = `Goal is ${gapPercent.toFixed(0)}% below target. Review strategy and adjust approach.`;
        rec.actionItems = ['Discuss gap with supervisor', 'Identify root cause for shortfall'];
    }

    recommendations.push(rec);
  }

  return recommendations.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

// ── LEADERBOARD ──

export function generateLeaderboard(input: LeaderboardInput): LeaderboardEntry[] {
  const { providers, metric, previousRankings } = input;

  const sorted = [...providers].sort((a, b) => {
    const aVal = a.metrics[metric] ?? 0;
    const bVal = b.metrics[metric] ?? 0;
    return bVal - aVal;
  });

  return sorted.map((provider, index) => {
    const rank = index + 1;
    const previousRank = previousRankings?.[provider.id];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (previousRank !== undefined) {
      if (rank < previousRank) trend = 'up';
      else if (rank > previousRank) trend = 'down';
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      rank,
      score: provider.metrics[metric] ?? 0,
      metric,
      trend,
      streak: 0,
    };
  });
}

// ── ACHIEVEMENT CHECKING ──

export function checkAchievements(
  providerId: string,
  metrics: Record<string, number>,
  achievements: Achievement[] = ACHIEVEMENTS,
): Achievement[] {
  return achievements.map(achievement => {
    const value = metrics[achievement.requirement.metric];
    if (value !== undefined && value >= achievement.requirement.threshold) {
      if (!achievement.unlockedBy.includes(providerId)) {
        return {
          ...achievement,
          unlockedBy: [...achievement.unlockedBy, providerId],
          unlockedAt: new Date().toISOString(),
        };
      }
    }
    return achievement;
  });
}

// ── GOAL VS ACTUAL COMPARISON ──

export interface GoalVsActual {
  goalTitle: string;
  goalType: GoalType;
  target: number;
  actual: number;
  difference: number;
  percentAchieved: number;
  status: GoalStatus;
  daysRemaining: number;
  requiredDailyRate: number;
}

export function compareGoalVsActual(goal: ProviderGoal, currentDate?: string): GoalVsActual {
  const now = new Date(currentDate ?? new Date().toISOString().split('T')[0]);
  const end = new Date(goal.endDate);
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));

  const difference = goal.currentValue - goal.targetValue;
  const percentAchieved = calculateProgressPercent(goal.currentValue, goal.targetValue);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);
  const requiredDailyRate = daysRemaining > 0 ? Math.round((remaining / daysRemaining) * 100) / 100 : remaining;

  return {
    goalTitle: goal.title,
    goalType: goal.type,
    target: goal.targetValue,
    actual: goal.currentValue,
    difference: Math.round(difference * 100) / 100,
    percentAchieved,
    status: calculateGoalStatus(goal, now.toISOString().split('T')[0]),
    daysRemaining,
    requiredDailyRate,
  };
}
