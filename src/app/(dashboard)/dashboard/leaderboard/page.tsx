'use client';

import { motion } from 'framer-motion';
import { Flame, Award, Star } from 'lucide-react';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, PanelSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { useClinicScore, useGamification } from '@/hooks/useDashboardData';
import { getCurrentLevel, getNextLevel, getLevelProgress } from '@/lib/gamification/levels';
import { BOSS_LEVELS } from '@/lib/gamification/engine';

interface ScoreData {
  total: number; breakdown: Record<string, number>; status: string; streak: number;
  xp: number; level: number;
  bossProgress: { current: { id: string; name: string; target: number; reward: number; icon: string }; progress: number; currentRevenue: number };
}
interface AchievementData {
  achievements: { id: string; name: string; description: string; icon: string; category: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; earned: boolean; dateEarned?: string }[];
}

const ICON_MAP: Record<string, string> = {
  'trophy': '🏆', 'dollar-sign': '💰', 'star': '⭐', 'calendar': '📅',
  'users': '👥', 'zap': '⚡', 'heart': '❤️', 'target': '🎯',
  'award': '🏅', 'check-circle': '✅', 'trending-up': '📈',
  'shield': '🛡️', 'book': '📚', 'bank': '🏦', 'sparkles': '✨',
};

export default function LeaderboardPage() {
  const { data: scoreData, isLoading: scoreLoading, error: scoreError, mutate: mutateScore } = useClinicScore() as { data: ScoreData | undefined; isLoading: boolean; error: unknown; mutate: () => void };
  const { data: achieveData, isLoading: achieveLoading, error: achieveError, mutate: mutateAchieve } = useGamification() as { data: AchievementData | undefined; isLoading: boolean; error: unknown; mutate: () => void };

  const xp = scoreData?.xp ?? 0;
  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const streak = scoreData?.streak ?? 0;
  const earnedCount = achieveData?.achievements?.filter(a => a.earned).length ?? 0;
  const clinicScore = scoreData?.total ?? 0;
  const bossProgress = scoreData?.bossProgress;
  const achievements = achieveData?.achievements || [];
  const breakdown = scoreData?.breakdown || {};

  if (scoreError || achieveError) {
    return (
      <DashboardErrorBoundary pageName="Gamification Hub">
        <InlineError message="Failed to load gamification data" onRetry={() => { mutateScore(); mutateAchieve(); }} />
      </DashboardErrorBoundary>
    );
  }

  if (scoreLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-2"><SkeletonBar className="h-7 w-48" /><SkeletonBar className="h-3 w-64" /></div>
        <div className="bg-gray-100 rounded-xl h-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><PanelSkeleton rows={6} /><PanelSkeleton rows={6} /></div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary pageName="Gamification Hub">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Gamification Hub</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Track achievements, XP, and streaks</p>
        </div>

        {/* Level + XP Hero */}
        <div className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-5 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <ProgressRing value={levelProgress} size={100} strokeWidth={8} showValue={false} colorMode="gold" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl">{currentLevel.icon}</span>
                  <span className="text-[10px] sm:text-xs text-white/60 font-body mt-1">Lvl {currentLevel.level}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <p className="text-xs sm:text-sm text-white/50 font-body uppercase tracking-wider">Current Level</p>
              <h2 className="text-2xl sm:text-3xl font-heading mt-1">{currentLevel.name}</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs sm:text-sm text-white/60 font-body mb-1">
                  <span>{xp.toLocaleString()} XP</span>
                  {nextLevel && <span>{nextLevel.xpRequired.toLocaleString()} XP</span>}
                </div>
                <div className="w-full max-w-md bg-white/10 rounded-full h-2.5 sm:h-3">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full bg-rani-gold rounded-full" />
                </div>
                {nextLevel && (
                  <p className="text-[10px] sm:text-xs text-white/40 font-body mt-1">
                    {(nextLevel.xpRequired - xp).toLocaleString()} XP to {nextLevel.name} {nextLevel.icon}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 flex-shrink-0">
              {[
                { icon: Flame, value: streak, label: 'Day Streak', iconColor: 'text-orange-400' },
                { icon: Award, value: earnedCount, label: 'Badges', iconColor: 'text-rani-gold' },
                { icon: Star, value: clinicScore, label: 'Clinic Score', iconColor: 'text-yellow-400' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor} mx-auto`} />
                  <span className="text-xl sm:text-2xl font-body font-bold block mt-1">{stat.value}</span>
                  <span className="text-[10px] sm:text-xs text-white/50 font-body">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Breakdown + Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Score Breakdown</h3>
            {Object.keys(breakdown).length === 0 ? (
              <DashboardEmptyState icon="chart" title="No score data" description="Score breakdown will appear as metrics are tracked." compact />
            ) : (
              <div className="space-y-2">
                {Object.entries(breakdown).map(([key, value]) => {
                  const color = value >= 90 ? '#059669' : value >= 70 ? '#F59E0B' : value >= 50 ? '#F97316' : '#EF4444';
                  return (
                    <div key={key} className="flex items-center gap-2 sm:gap-4">
                      <span className="text-xs sm:text-sm font-body font-medium text-rani-text w-28 sm:w-36 capitalize truncate flex-shrink-0">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex-1 min-w-0">
                        <div className="w-full bg-rani-border/30 rounded-full h-6 sm:h-7 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full flex items-center pl-2 sm:pl-3" style={{ backgroundColor: color + '30' }}>
                            <span className="text-[10px] sm:text-xs font-body font-bold" style={{ color }}>{value}</span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Achievement Badges</h3>
            {achieveLoading ? (
              <div className="animate-pulse grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="h-2 w-14 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <DashboardEmptyState icon="star" title="No achievements yet" description="Complete daily goals to earn your first badge." compact />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-h-[400px] overflow-y-auto">
                {achievements.slice(0, 12).map((achievement) => {
                  const rarityColor = { common: 'border-gray-200', rare: 'border-blue-300', epic: 'border-purple-300', legendary: 'border-rani-gold' }[achievement.rarity];
                  return (
                    <motion.div key={achievement.id} whileHover={{ scale: 1.05 }} className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl border-2 ${achievement.earned ? rarityColor : 'border-rani-border/30 opacity-30'} ${achievement.earned ? 'bg-white' : 'bg-rani-cream/30'}`}>
                      <span className="text-xl sm:text-2xl">{ICON_MAP[achievement.icon] || '🏅'}</span>
                      <span className="text-[9px] sm:text-[10px] font-body font-semibold text-center text-rani-navy leading-tight">{achievement.name}</span>
                      <span className={`text-[8px] sm:text-[9px] font-body px-1.5 py-0.5 rounded-full ${{ common: 'bg-gray-100 text-gray-500', rare: 'bg-blue-50 text-blue-500', epic: 'bg-purple-50 text-purple-500', legendary: 'bg-rani-gold/10 text-rani-gold' }[achievement.rarity]}`}>{achievement.rarity}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Boss Battles */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Monthly Boss Battles</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {BOSS_LEVELS.map((boss, i) => {
              const currentRevenue = bossProgress?.currentRevenue ?? 0;
              const isDefeated = currentRevenue >= boss.target;
              const isCurrent = !isDefeated && (i === 0 || currentRevenue >= BOSS_LEVELS[i - 1].target);
              return (
                <motion.div key={boss.id} whileHover={{ scale: 1.03 }} className={`text-center p-3 sm:p-4 rounded-xl border-2 ${isDefeated ? 'border-green-300 bg-green-50' : isCurrent ? 'border-rani-gold bg-rani-gold/5' : 'border-rani-border/30 bg-rani-cream/30 opacity-50'}`}>
                  <span className="text-2xl sm:text-3xl block mb-1 sm:mb-2">{boss.icon}</span>
                  <p className="text-[10px] sm:text-xs font-body font-bold text-rani-navy">{boss.name}</p>
                  <p className="text-[9px] sm:text-[10px] font-body text-rani-muted">${(boss.target / 1000).toFixed(0)}K/mo</p>
                  <p className="text-[9px] sm:text-[10px] font-body text-rani-gold mt-0.5 sm:mt-1">+{boss.reward} XP</p>
                  {isDefeated && <span className="text-[9px] sm:text-[10px] font-body text-green-600 block mt-0.5">Defeated!</span>}
                  {isCurrent && <span className="text-[9px] sm:text-[10px] font-body text-rani-gold block mt-0.5">In Progress</span>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
