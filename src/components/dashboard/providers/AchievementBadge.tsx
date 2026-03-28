'use client';

import { motion } from 'framer-motion';
import type { Achievement } from '@/types/providers';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_COLORS: Record<string, string> = {
  revenue: '#C9A96E',
  clients: '#3B82F6',
  quality: '#7C3AED',
  growth: '#059669',
  consistency: '#F59E0B',
};

export default function AchievementBadge({ achievement, unlocked, size = 'md' }: AchievementBadgeProps) {
  const color = CATEGORY_COLORS[achievement.category] || '#6B7280';
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex flex-col items-center gap-1 ${unlocked ? '' : 'opacity-30 grayscale'}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2`}
        style={{ borderColor: color, backgroundColor: `${color}15` }}
      >
        <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'}>
          {achievement.icon}
        </span>
      </div>
      <p className={`font-body font-semibold text-rani-navy text-center ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
        {achievement.title}
      </p>
      {size !== 'sm' && (
        <p className="text-[10px] text-rani-muted font-body text-center max-w-[100px]">
          {achievement.description}
        </p>
      )}
    </motion.div>
  );
}
