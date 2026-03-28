'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Award, Lightbulb } from 'lucide-react';
import { useProviderGoals, useGoalLeaderboard, useAchievements } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { GoalProgressCard, LeaderboardTable, CoachingCard, AchievementBadge } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

const PROVIDERS = [
  { id: 'rina', name: 'Rina' },
  { id: 'mom', name: 'Mom' },
];

export default function GoalsPage() {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].id);
  const [leaderboardMetric, setLeaderboardMetric] = useState('revenue');
  const { data: goals, isLoading, error, mutate } = useProviderGoals(selectedProvider);
  const { data: leaderboard } = useGoalLeaderboard(leaderboardMetric);
  const { data: achievements } = useAchievements(selectedProvider);

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Goals">
        <InlineError message="Failed to load goal data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-rani-navy">Goal Tracking</h1>
          <p className="text-sm text-rani-muted font-body mt-1">Provider goals, progress, and coaching</p>
        </div>
        <div className="flex gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                selectedProvider === p.id ? 'bg-rani-navy text-white' : 'bg-gray-100 text-rani-navy hover:bg-gray-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      {isLoading ? (
        <KPIRowSkeleton count={4} />
      ) : goals ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Overall Progress" value={goals.overallProgress} suffix="%" icon="target" />
          <KPICard title="On Track" value={goals.goalsOnTrack} icon="target" />
          <KPICard title="At Risk" value={goals.goalsAtRisk} icon="target" />
          <KPICard title="Exceeded" value={goals.goalsExceeded} icon="star" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <PanelSkeleton />
          ) : goals?.goals.map(goal => (
            <GoalProgressCard
              key={goal.id}
              title={goal.title}
              description={goal.description}
              currentValue={goal.currentValue}
              targetValue={goal.targetValue}
              unit={goal.unit}
              progressPercent={goal.progressPercent}
              status={goal.status}
              milestones={goal.milestones}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          {leaderboard && leaderboard.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={leaderboardMetric}
                  onChange={e => setLeaderboardMetric(e.target.value)}
                  className="text-xs font-body border border-gray-200 rounded px-2 py-1"
                >
                  <option value="revenue">Revenue</option>
                  <option value="rebookRate">Rebook Rate</option>
                  <option value="utilization">Utilization</option>
                  <option value="avgRating">Rating</option>
                </select>
              </div>
              <LeaderboardTable
                entries={leaderboard}
                metric={leaderboardMetric}
                formatValue={leaderboardMetric === 'revenue' ? v => `$${v.toLocaleString()}` : v => `${v}%`}
              />
            </div>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-display font-semibold text-rani-navy mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-rani-gold" /> Achievements
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                {achievements.map(a => (
                  <AchievementBadge
                    key={a.id}
                    achievement={a}
                    unlocked={a.unlockedBy.includes(selectedProvider)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coaching */}
      {goals?.coachingRecommendations && goals.coachingRecommendations.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-rani-navy mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-rani-gold" /> Coaching Recommendations
          </h2>
          <CoachingCard recommendations={goals.coachingRecommendations} />
        </div>
      )}
    </div>
  );
}
