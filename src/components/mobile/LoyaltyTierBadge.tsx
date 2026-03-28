'use client';

import { motion } from 'framer-motion';
import type { LoyaltyTier } from '@/types/mobile';

interface LoyaltyTierBadgeProps {
  tier: LoyaltyTier;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const tierConfig: Record<
  LoyaltyTier,
  { gradient: string; textColor: string; glow: string; icon: string }
> = {
  Silver: {
    gradient: 'from-gray-300 via-gray-100 to-gray-300',
    textColor: 'text-gray-700',
    glow: 'shadow-gray-300/40',
    icon: '🥈',
  },
  Gold: {
    gradient: 'from-[#C9A96E] via-[#E8D5AA] to-[#C9A96E]',
    textColor: 'text-amber-800',
    glow: 'shadow-[#C9A96E]/40',
    icon: '🥇',
  },
  Platinum: {
    gradient: 'from-slate-400 via-slate-200 to-slate-400',
    textColor: 'text-slate-700',
    glow: 'shadow-slate-400/40',
    icon: '💎',
  },
  Diamond: {
    gradient: 'from-cyan-300 via-white to-cyan-300',
    textColor: 'text-cyan-800',
    glow: 'shadow-cyan-300/40',
    icon: '👑',
  },
};

const sizeClasses = {
  sm: 'w-14 h-14 text-xs',
  md: 'w-20 h-20 text-sm',
  lg: 'w-28 h-28 text-base',
};

const iconSizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export default function LoyaltyTierBadge({
  tier,
  size = 'md',
  animated = true,
}: LoyaltyTierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <motion.div
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative ${sizeClasses[size]} rounded-full flex flex-col items-center justify-center`}
    >
      {/* Animated glow ring */}
      {animated && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} opacity-30 blur-sm`}
        />
      )}

      {/* Badge body */}
      <div
        className={`relative w-full h-full rounded-full bg-gradient-to-br ${config.gradient} shadow-lg ${config.glow} flex flex-col items-center justify-center border border-white/50`}
      >
        <span className={iconSizes[size]}>{config.icon}</span>
        <span className={`${config.textColor} font-heading font-bold mt-0.5 leading-none`}>
          {tier}
        </span>
      </div>
    </motion.div>
  );
}
