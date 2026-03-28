// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateGoalStatus,
  calculateProgressPercent,
  updateMilestones,
  calculateGoalProgress,
  generateCoachingRecommendations,
  generateLeaderboard,
  checkAchievements,
  compareGoalVsActual,
  ACHIEVEMENTS,
  GOAL_TEMPLATES,
  type GoalInput,
} from '../goals';
import type { ProviderGoal, GoalMilestone, GoalStatus } from '@/types/providers';

function makeGoal(overrides: Partial<ProviderGoal> = {}): ProviderGoal {
  return {
    id: 'goal-1',
    providerId: 'rina',
    type: 'revenue',
    title: 'Monthly Revenue',
    description: 'Revenue target',
    targetValue: 25000,
    currentValue: 15000,
    unit: 'USD',
    period: 'monthly',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'on_track',
    progressPercent: 60,
    milestones: [
      { label: '25%', targetValue: 6250, achieved: true, achievedDate: '2026-03-05' },
      { label: '50%', targetValue: 12500, achieved: true },
      { label: '75%', targetValue: 18750, achieved: false },
      { label: '100%', targetValue: 25000, achieved: false },
    ],
    ...overrides,
  };
}

// ── GOAL STATUS ──

describe('calculateGoalStatus', () => {
  it('returns exceeded when value >= target', () => {
    expect(calculateGoalStatus(makeGoal({ currentValue: 30000 }), '2026-03-15')).toBe('exceeded');
  });

  it('returns completed when past end and close to target', () => {
    expect(calculateGoalStatus(makeGoal({ currentValue: 24000 }), '2026-04-01')).toBe('completed');
  });

  it('returns behind when past end and below target', () => {
    expect(calculateGoalStatus(makeGoal({ currentValue: 10000 }), '2026-04-01')).toBe('behind');
  });

  it('returns not_started when before start date', () => {
    expect(calculateGoalStatus(makeGoal(), '2026-02-15')).toBe('not_started');
  });

  it('returns on_track when progress matches time', () => {
    // Mid-month (50% time), 60% of target
    expect(calculateGoalStatus(makeGoal({ currentValue: 15000 }), '2026-03-15')).toBe('on_track');
  });

  it('returns at_risk when behind but not critically', () => {
    // Mid-month (50% time), only 30% of target
    expect(calculateGoalStatus(makeGoal({ currentValue: 7500 }), '2026-03-15')).toBe('at_risk');
  });

  it('returns behind when significantly below pace', () => {
    // 80% through the month, only 20% of target
    expect(calculateGoalStatus(makeGoal({ currentValue: 5000 }), '2026-03-25')).toBe('behind');
  });
});

// ── PROGRESS PERCENT ──

describe('calculateProgressPercent', () => {
  it('calculates correct percentage', () => {
    expect(calculateProgressPercent(15000, 25000)).toBe(60);
  });

  it('caps at 100%', () => {
    expect(calculateProgressPercent(30000, 25000)).toBe(100);
  });

  it('returns 0 for zero target', () => {
    expect(calculateProgressPercent(1000, 0)).toBe(0);
  });

  it('returns 0 for zero current', () => {
    expect(calculateProgressPercent(0, 25000)).toBe(0);
  });

  it('handles fractional values', () => {
    const result = calculateProgressPercent(7, 9);
    expect(result).toBeCloseTo(77.8, 0);
  });
});

// ── MILESTONES ──

describe('updateMilestones', () => {
  it('marks milestones as achieved when value exceeds target', () => {
    const milestones: GoalMilestone[] = [
      { label: '25%', targetValue: 6250, achieved: false },
      { label: '50%', targetValue: 12500, achieved: false },
    ];
    const result = updateMilestones(milestones, 15000, '2026-03-15');
    expect(result[0].achieved).toBe(true);
    expect(result[0].achievedDate).toBe('2026-03-15');
    expect(result[1].achieved).toBe(true);
  });

  it('does not mark future milestones', () => {
    const milestones: GoalMilestone[] = [
      { label: '25%', targetValue: 6250, achieved: false },
      { label: '50%', targetValue: 12500, achieved: false },
    ];
    const result = updateMilestones(milestones, 5000, '2026-03-10');
    expect(result[0].achieved).toBe(false);
    expect(result[1].achieved).toBe(false);
  });

  it('preserves already achieved milestones', () => {
    const milestones: GoalMilestone[] = [
      { label: '25%', targetValue: 6250, achieved: true, achievedDate: '2026-03-05' },
      { label: '50%', targetValue: 12500, achieved: false },
    ];
    const result = updateMilestones(milestones, 5000, '2026-03-10');
    expect(result[0].achieved).toBe(true);
    expect(result[0].achievedDate).toBe('2026-03-05');
  });
});

// ── GOAL PROGRESS AGGREGATION ──

describe('calculateGoalProgress', () => {
  it('calculates overall progress', () => {
    const input: GoalInput = {
      providerId: 'rina',
      goals: [
        makeGoal({ id: 'g1', currentValue: 15000, targetValue: 25000 }),
        makeGoal({ id: 'g2', currentValue: 80, targetValue: 80, type: 'rebook', unit: '%' }),
      ],
      currentDate: '2026-03-15',
    };
    const result = calculateGoalProgress(input);
    expect(result.overallProgress).toBeGreaterThan(0);
    expect(result.goals.length).toBe(2);
  });

  it('counts goals by status', () => {
    const input: GoalInput = {
      providerId: 'rina',
      goals: [
        makeGoal({ id: 'g1', currentValue: 30000 }), // exceeded
        makeGoal({ id: 'g2', currentValue: 15000 }), // on_track
        makeGoal({ id: 'g3', currentValue: 5000 }), // behind
      ],
      currentDate: '2026-03-25',
    };
    const result = calculateGoalProgress(input);
    expect(result.goalsExceeded).toBe(1);
    expect(result.goalsOnTrack + result.goalsAtRisk + result.goalsBehind).toBe(2);
  });

  it('generates coaching recommendations for at-risk goals', () => {
    const input: GoalInput = {
      providerId: 'rina',
      goals: [makeGoal({ currentValue: 5000 })],
      currentDate: '2026-03-25',
    };
    const result = calculateGoalProgress(input);
    expect(result.coachingRecommendations.length).toBeGreaterThan(0);
  });

  it('handles empty goals', () => {
    const result = calculateGoalProgress({ providerId: 'rina', goals: [] });
    expect(result.overallProgress).toBe(0);
    expect(result.goalsOnTrack).toBe(0);
  });

  it('updates milestones', () => {
    const input: GoalInput = {
      providerId: 'rina',
      goals: [makeGoal({ currentValue: 15000 })],
      currentDate: '2026-03-15',
    };
    const result = calculateGoalProgress(input);
    const goal = result.goals[0];
    expect(goal.milestones[0].achieved).toBe(true); // 6250
    expect(goal.milestones[1].achieved).toBe(true); // 12500
    expect(goal.milestones[2].achieved).toBe(false); // 18750
  });
});

// ── COACHING RECOMMENDATIONS ──

describe('generateCoachingRecommendations', () => {
  it('generates recommendations for behind goals', () => {
    const goals = [makeGoal({ currentValue: 5000, status: 'behind' })];
    const recs = generateCoachingRecommendations(goals);
    expect(recs.length).toBe(1);
    expect(recs[0].priority).toBe('high');
  });

  it('generates recommendations for at-risk goals', () => {
    const goals = [makeGoal({ currentValue: 10000, status: 'at_risk' })];
    const recs = generateCoachingRecommendations(goals);
    expect(recs.length).toBe(1);
    expect(recs[0].priority).toBe('medium');
  });

  it('skips on-track goals', () => {
    const goals = [makeGoal({ currentValue: 20000, status: 'on_track' })];
    const recs = generateCoachingRecommendations(goals);
    expect(recs.length).toBe(0);
  });

  it('generates different recommendations by goal type', () => {
    const goals = [
      makeGoal({ id: 'g1', type: 'revenue', status: 'behind' }),
      makeGoal({ id: 'g2', type: 'rebook', status: 'at_risk', targetValue: 80, currentValue: 50, unit: '%' }),
      makeGoal({ id: 'g3', type: 'retention', status: 'behind', targetValue: 75, currentValue: 40, unit: '%' }),
      makeGoal({ id: 'g4', type: 'review', status: 'at_risk', targetValue: 4.8, currentValue: 4.3, unit: 'stars' }),
      makeGoal({ id: 'g5', type: 'training', status: 'behind', targetValue: 20, currentValue: 5, unit: 'credits' }),
    ];
    const recs = generateCoachingRecommendations(goals);
    expect(recs.length).toBe(5);
    recs.forEach(r => {
      expect(r.actionItems.length).toBeGreaterThan(0);
      expect(r.recommendation.length).toBeGreaterThan(0);
    });
  });

  it('sorts by priority (high first)', () => {
    const goals = [
      makeGoal({ id: 'g1', status: 'at_risk' }),
      makeGoal({ id: 'g2', status: 'behind' }),
    ];
    const recs = generateCoachingRecommendations(goals);
    expect(recs[0].priority).toBe('high');
    expect(recs[1].priority).toBe('medium');
  });
});

// ── LEADERBOARD ──

describe('generateLeaderboard', () => {
  it('ranks providers by metric', () => {
    const result = generateLeaderboard({
      providers: [
        { id: 'rina', name: 'Rina', metrics: { revenue: 30000 } },
        { id: 'mom', name: 'Mom', metrics: { revenue: 20000 } },
      ],
      metric: 'revenue',
    });
    expect(result[0].providerName).toBe('Rina');
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('detects rank changes', () => {
    const result = generateLeaderboard({
      providers: [
        { id: 'rina', name: 'Rina', metrics: { revenue: 30000 } },
        { id: 'mom', name: 'Mom', metrics: { revenue: 20000 } },
      ],
      metric: 'revenue',
      previousRankings: { rina: 2, mom: 1 },
    });
    expect(result[0].trend).toBe('up');
    expect(result[1].trend).toBe('down');
  });

  it('marks stable when no change', () => {
    const result = generateLeaderboard({
      providers: [{ id: 'rina', name: 'Rina', metrics: { revenue: 30000 } }],
      metric: 'revenue',
      previousRankings: { rina: 1 },
    });
    expect(result[0].trend).toBe('stable');
  });

  it('handles missing previous rankings', () => {
    const result = generateLeaderboard({
      providers: [{ id: 'rina', name: 'Rina', metrics: { revenue: 30000 } }],
      metric: 'revenue',
    });
    expect(result[0].trend).toBe('stable');
  });

  it('handles missing metric value', () => {
    const result = generateLeaderboard({
      providers: [{ id: 'rina', name: 'Rina', metrics: {} }],
      metric: 'revenue',
    });
    expect(result[0].score).toBe(0);
  });
});

// ── ACHIEVEMENTS ──

describe('checkAchievements', () => {
  it('unlocks achievement when threshold met', () => {
    const result = checkAchievements('rina', { dailyRevenue: 1500 }, ACHIEVEMENTS);
    const firstDay = result.find(a => a.id === 'first-1k-day');
    expect(firstDay?.unlockedBy).toContain('rina');
  });

  it('does not unlock when below threshold', () => {
    const result = checkAchievements('rina', { dailyRevenue: 500 }, ACHIEVEMENTS);
    const firstDay = result.find(a => a.id === 'first-1k-day');
    expect(firstDay?.unlockedBy).not.toContain('rina');
  });

  it('does not duplicate unlocks', () => {
    const achievements = ACHIEVEMENTS.map(a =>
      a.id === 'first-1k-day' ? { ...a, unlockedBy: ['rina'] } : a,
    );
    const result = checkAchievements('rina', { dailyRevenue: 1500 }, achievements);
    const firstDay = result.find(a => a.id === 'first-1k-day');
    expect(firstDay?.unlockedBy.filter(u => u === 'rina').length).toBe(1);
  });

  it('handles empty metrics', () => {
    const result = checkAchievements('rina', {}, ACHIEVEMENTS);
    expect(result.every(a => !a.unlockedBy.includes('rina'))).toBe(true);
  });
});

// ── GOAL VS ACTUAL ──

describe('compareGoalVsActual', () => {
  it('calculates days remaining', () => {
    const result = compareGoalVsActual(makeGoal(), '2026-03-20');
    expect(result.daysRemaining).toBe(11);
  });

  it('calculates required daily rate', () => {
    const result = compareGoalVsActual(makeGoal({ currentValue: 15000 }), '2026-03-20');
    expect(result.requiredDailyRate).toBeGreaterThan(0);
  });

  it('calculates percentage achieved', () => {
    const result = compareGoalVsActual(makeGoal({ currentValue: 15000, targetValue: 25000 }));
    expect(result.percentAchieved).toBe(60);
  });

  it('shows positive difference when exceeding', () => {
    const result = compareGoalVsActual(makeGoal({ currentValue: 30000, targetValue: 25000 }));
    expect(result.difference).toBeGreaterThan(0);
  });

  it('shows negative difference when behind', () => {
    const result = compareGoalVsActual(makeGoal({ currentValue: 15000, targetValue: 25000 }));
    expect(result.difference).toBeLessThan(0);
  });

  it('handles past end date', () => {
    const result = compareGoalVsActual(makeGoal(), '2026-04-15');
    expect(result.daysRemaining).toBe(0);
  });
});

// ── TEMPLATES ──

describe('GOAL_TEMPLATES', () => {
  it('has templates for all goal types', () => {
    const types = GOAL_TEMPLATES.map(t => t.type);
    expect(types).toContain('revenue');
    expect(types).toContain('service_count');
    expect(types).toContain('retention');
    expect(types).toContain('rebook');
    expect(types).toContain('review');
    expect(types).toContain('training');
  });

  it('each template has milestones', () => {
    GOAL_TEMPLATES.forEach(t => {
      expect(t.milestones.length).toBeGreaterThan(0);
    });
  });
});

describe('ACHIEVEMENTS', () => {
  it('has at least 10 achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
  });

  it('each achievement has required fields', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.requirement.metric).toBeTruthy();
      expect(a.requirement.threshold).toBeGreaterThan(0);
    });
  });

  it('covers multiple categories', () => {
    const categories = new Set(ACHIEVEMENTS.map(a => a.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
