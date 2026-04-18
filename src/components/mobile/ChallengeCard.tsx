'use client';

import { motion } from 'framer-motion';
import { Trophy, Flame, Star, Users, ShoppingBag } from 'lucide-react';
import type { Challenge } from '@/types/mobile';

interface ChallengeCardProps {
  challenge: Challenge;
}

const typeIcons: Record<string, typeof Trophy> = {
  booking: Star,
  referral: Users,
  review: Star,
  purchase: ShoppingBag,
  streak: Flame,
};

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const progress = Math.min((challenge.progress / challenge.target) * 100, 100);
  const Icon = typeIcons[challenge.type] || Trophy;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl p-4 shadow-sm border ${
        challenge.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-rani-border/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            challenge.completed ? 'bg-emerald-100' : 'bg-[#C9A96E]/10'
          }`}
        >
          {challenge.completed ? (
            <Trophy size={18} className="text-emerald-600" />
          ) : (
            <Icon size={18} className="text-rani-gold-accessible" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-heading text-rani-navy text-sm font-semibold leading-tight">
            {challenge.title}
          </h4>
          <p className="text-xs text-rani-muted font-body mt-0.5">{challenge.description}</p>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-rani-muted font-body">
                {challenge.progress}/{challenge.target}
              </span>
              <span className="text-[10px] text-rani-gold-accessible font-body font-semibold">
                +{challenge.bonusPoints} pts
              </span>
            </div>
            <div className="h-1.5 bg-rani-cream rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  challenge.completed
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-[#C9A96E] to-[#E8D5AA]'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
