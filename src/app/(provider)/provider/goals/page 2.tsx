'use client';

import { Target, Lightbulb, Award } from 'lucide-react';
import { useProviderGoals, useAchievements } from '@/hooks/useProviderData';
import { GoalProgressCard, CoachingCard, AchievementBadge } from '@/components/dashboard/providers';

export default function ProviderGoalsPage() {
  const providerId = 'current-provider';
  const { data: goals, isLoading } = useProviderGoals(providerId);
  const { data: achievements } = useAchievements(providerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-rani-navy">My Goals</h1>
        <p className="text-sm text-rani-muted font-body mt-1">Track your progress and targets</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
        </div>
      ) : goals ? (
        <>
          {/* Progress Summary */}
          <div className="bg-rani-gold/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-rani-gold" />
              <div>
                <p className="font-body font-semibold text-rani-navy">Overall Progress</p>
                <p className="text-xs text-rani-muted font-body">
                  {goals.goalsOnTrack} on track, {goals.goalsAtRisk} at risk, {goals.goalsExceeded} exceeded
                </p>
              </div>
            </div>
            <span className="font-display font-bold text-2xl text-rani-navy">{goals.overallProgress}%</span>
          </div>

          {/* Goals */}
          <div className="space-y-4">
            {goals.goals.map(goal => (
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

          {/* Coaching */}
          {goals.coachingRecommendations.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-rani-navy mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-rani-gold" /> Tips for Improvement
              </h2>
              <CoachingCard recommendations={goals.coachingRecommendations} />
            </div>
          )}
        </>
      ) : null}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-rani-gold" /> Achievements
          </h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {achievements.map(a => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                unlocked={a.unlockedBy.includes(providerId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
