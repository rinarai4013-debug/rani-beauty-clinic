'use client';

import { motion } from 'framer-motion';

interface StreakFlameProps {
  days: number;
  type?: 'visit' | 'skincare' | 'referral';
  size?: 'sm' | 'md' | 'lg';
}

const typeLabels = {
  visit: 'Visit Streak',
  skincare: 'Skincare Streak',
  referral: 'Referral Streak',
};

export default function StreakFlame({ days, type = 'visit', size = 'md' }: StreakFlameProps) {
  const isActive = days > 0;

  const sizes = {
    sm: { flame: 'text-xl', num: 'text-sm', label: 'text-[9px]' },
    md: { flame: 'text-3xl', num: 'text-lg', label: 'text-[10px]' },
    lg: { flame: 'text-5xl', num: 'text-2xl', label: 'text-xs' },
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={
          isActive
            ? {
                y: [0, -3, 0],
                scale: [1, 1.05, 1],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <span className={sizes[size].flame}>{isActive ? '🔥' : '❄️'}</span>
        {isActive && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 blur-md bg-orange-400/20 rounded-full"
          />
        )}
      </motion.div>

      <div className="text-center">
        <span className={`${sizes[size].num} font-heading font-bold text-rani-navy`}>{days}</span>
        <span className={`${sizes[size].label} text-rani-muted font-body block`}>
          {days === 1 ? 'day' : 'days'}
        </span>
        <span className={`${sizes[size].label} text-[#C9A96E] font-body font-medium`}>
          {typeLabels[type]}
        </span>
      </div>
    </div>
  );
}
