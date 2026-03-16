'use client';

import { motion } from 'framer-motion';
import { Flame, Award, Star } from 'lucide-react';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { useClinicScore, useGamification } from '@/hooks/useDashboardData';
import { getCurrentLevel, getNextLevel, getLevelProgress } from '@/lib/gamification/levels';
import { BOSS_LEVELS } from '@/lib/gamification/engine';

interface ScoreData {
  total: number;
  breakdown: Record<string, number>;
  status: string;
  streak: number;
  xp: number;
  level: number;
  bossProgress: {
    current: { id: string; name: string; target: number; reward: number; icon: string };
    progress: number;
    currentRevenue: number;
  };
}

interface AchievementData {
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earned: boolean;
    dateEarned?: string;
  }[];
}

const ICON_MAP: Record<string, string> = {
  'trophy': '🏆', 'dollar-sign': '💰', 'star': '⭐', 'calendar': '📅',
  'users': '👥', 'zap': '⚡', 'heart': '❤️', 'target': '🎯',
  'award': '🏅', 'check-circle': '✅', 'trending-up': '📈',
  'shield': '🛡️', 'book': '📚', 'bank': '🏦', 'sparkles': '✨',
};

export default function LeaderboardPage() {
  const { data: scoreData, isLoading: scoreLoading } = useClinicScore() as { data: ScoreData | undefined; isLoading: boolean };
  const { data: achieveData, isLoading: achieveLoading } = useGamification() as { data: AchievementData | undefined; isLoading: boolean };

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Gamification Hub</h1>
        <p className="text-sm font-body text-rani-muted mt-1">Track achievements, XP, and streaks</p>
      </div>

      {/* Level + XP Hero */}
      <div className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Level Ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <ProgressRing value={levelProgress} size={120} strokeWidth={8} showValue={false} colorMode="gold" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl">{currentLevel.icon}</span>
                <span className="text-xs text-white/60 font-body mt-1">Lvl {currentLevel.level}</span>
              </div>
            </div>
          </div>

          {/* Level Info */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-white/50 font-body uppercase tracking-wider">Current Level</p>
            <h2 className="text-3xl font-heading mt-1">{currentLevel.name}</h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-white/60 font-body mb-1">
                <span>{xp.toLocaleString()} XP</span>
                {nextLevel && <span>{nextLevel.xpRequired.toLocaleString()} XP</span>}
              </div>
              <div className="w-full max-w-md bg-white/10 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-rani-gold rounded-full"
                />
              </div>
              {nextLevel && (
                <p className="text-xs text-white/40 font-body mt-1">
                  {(nextLevel.xpRequired - xp).toLocaleString()} XP to {nextLevel.name} {nextLevel.icon}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <Flame className="w-6 h-6 text-orange-400 mx-auto" />
              <span className="text-2xl font-body font-bold block mt-1">{streak}</span>
              <span className="text-xs text-white/50 font-body">Day Streak</span>
            </div>
            <div className="text-center">
              <Award className="w-6 h-6 text-rani-gold mx-auto" />
              <span className="text-2xl font-body font-bold block mt-1">{earnedCount}</span>
              <span className="text-xs text-white/50 font-body">Badges</span>
            </div>
            <div className="text-center">
              <Star className="w-6 h-6 text-yellow-400 mx-auto" />
              <span className="text-2xl font-body font-bold block mt-1">{clinicScore}</span>
              <span className="text-xs text-white/50 font-body">Clinic Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Score Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, value]) => {
              const color = value >= 90 ? '#059669' : value >= 70 ? '#F59E0B' : value >= 50 ? '#F97316' : '#EF4444';
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm font-body font-medium text-rani-text w-36 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex-1">
                    <div className="w-full bg-rani-border/30 rounded-full h-7 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full flex items-center pl-3"
                        style={{ backgroundColor: color + '30' }}
                      >
                        <span className="text-xs font-body font-bold" style={{ color }}>{value}</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Achievement Badges
          </h3>
          {achieveLoading ? (
            <div className="text-center py-8 text-rani-muted text-sm">Loading achievements...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {achievements.slice(0, 12).map((achievement) => {
                const rarityColor = {
                  common: 'border-gray-200',
                  rare: 'border-blue-300',
                  epic: 'border-purple-300',
                  legendary: 'border-rani-gold',
                }[achievement.rarity];
                return (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05 }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 ${
                      achievement.earned ? rarityColor : 'border-rani-border/30 opacity-30'
                    } ${achievement.earned ? 'bg-white' : 'bg-rani-cream/30'}`}
                  >
                    <span className="text-2xl">{ICON_MAP[achievement.icon] || '🏅'}</span>
                    <span className="text-[10px] font-body font-semibold text-center text-rani-navy leading-tight">
                      {achievement.name}
                    </span>
                    <span className={`text-[9px] font-body px-1.5 py-0.5 rounded-full ${
                      { common: 'bg-gray-100 text-gray-500', rare: 'bg-blue-50 text-blue-500', epic: 'bg-purple-50 text-purple-500', legendary: 'bg-rani-gold/10 text-rani-gold' }[achievement.rarity]
                    }`}>
                      {achievement.rarity}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Boss Battles */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Monthly Boss Battles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {BOSS_LEVELS.map((boss, i) => {
            const currentRevenue = bossProgress?.currentRevenue ?? 0;
            const isDefeated = currentRevenue >= boss.target;
            const isCurrent = !isDefeated && (i === 0 || currentRevenue >= BOSS_LEVELS[i - 1].target);
            return (
              <motion.div
                key={boss.id}
                whileHover={{ scale: 1.03 }}
                className={`text-center p-4 rounded-xl border-2 ${
                  isDefeated ? 'border-green-300 bg-green-50' :
                  isCurrent ? 'border-rani-gold bg-rani-gold/5' :
                  'border-rani-border/30 bg-rani-cream/30 opacity-50'
                }`}
              >
                <span className="text-3xl block mb-2">{boss.icon}</span>
                <p className="text-xs font-body font-bold text-rani-navy">{boss.name}</p>
                <p className="text-[10px] font-body text-rani-muted">${(boss.target / 1000).toFixed(0)}K/mo</p>
                <p className="text-[10px] font-body text-rani-gold mt-1">+{boss.reward} XP</p>
                {isDefeated && <span className="text-[10px] font-body text-green-600 block mt-1">Defeated!</span>}
                {isCurrent && <span className="text-[10px] font-body text-rani-gold block mt-1">In Progress</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
