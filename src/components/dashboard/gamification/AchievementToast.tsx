'use client';

import toast from 'react-hot-toast';

const RARITY_COLORS = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-rani-gold bg-rani-gold/10',
};

export function showAchievementToast(
  achievement: { name: string; icon: string; description: string; rarity: string; xpReward: number },
  fireConfetti?: (_type: 'achievement' | 'levelup' | 'boss' | 'streak') => void
) {
  if (fireConfetti) fireConfetti('achievement');

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-slide-up' : 'animate-fade-out'}
        max-w-sm w-full bg-white shadow-xl rounded-xl pointer-events-auto border-l-4
        ${RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common}
        p-4`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-body uppercase tracking-wider text-rani-gold font-semibold">
              Achievement Unlocked!
            </p>
            <p className="text-sm font-body font-bold text-rani-navy mt-0.5">
              {achievement.name}
            </p>
            <p className="text-xs font-body text-rani-muted mt-0.5">
              {achievement.description}
            </p>
            <p className="text-xs font-body text-rani-gold font-semibold mt-1">
              +{achievement.xpReward} XP
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 4000, position: 'top-right' }
  );
}

export function showBossLevelToast(
  bossName: string,
  bossIcon: string,
  revenue: number,
  xpReward: number,
  fireConfetti?: (_type: 'achievement' | 'levelup' | 'boss' | 'streak') => void
) {
  if (fireConfetti) fireConfetti('boss');

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-slide-up' : 'animate-fade-out'}
        max-w-sm w-full bg-rani-navy shadow-2xl rounded-xl pointer-events-auto border border-rani-gold/50 p-5`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{bossIcon}</span>
          <div>
            <p className="text-xs font-body uppercase tracking-wider text-rani-gold font-semibold">
              Boss Level Reached!
            </p>
            <p className="text-lg font-display font-bold text-white">
              {bossName}
            </p>
            <p className="text-xs font-body text-white/60">
              ${(revenue / 1000).toFixed(0)}K revenue &bull; +{xpReward} XP
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 5000, position: 'top-center' }
  );
}

export function showStreakToast(days: number) {
  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-slide-up' : 'animate-fade-out'}
        max-w-xs w-full bg-gradient-to-r from-orange-500 to-rani-gold shadow-xl rounded-xl pointer-events-auto p-4`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#x1F525;</span>
          <div>
            <p className="text-sm font-body font-bold text-white">
              {days}-Day Streak!
            </p>
            <p className="text-xs font-body text-white/80">
              Keep the fire burning!
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 3000, position: 'top-right' }
  );
}
