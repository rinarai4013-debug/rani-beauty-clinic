'use client';

import { motion } from 'framer-motion';
import { Gift, Lock, Coins } from 'lucide-react';
import type { RewardItem } from '@/types/mobile';

interface RewardCardProps {
  reward: RewardItem;
  userPoints: number;
  onRedeem?: (rewardId: string) => void;
}

export default function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const canAfford = userPoints >= reward.pointsCost;
  const isLocked = !reward.available || !canAfford;

  return (
    <motion.div
      whileTap={!isLocked ? { scale: 0.97 } : undefined}
      className={`bg-white rounded-2xl p-4 shadow-sm border ${
        isLocked ? 'border-rani-border/20 opacity-70' : 'border-[#C9A96E]/20'
      }`}
    >
      {/* Image or placeholder */}
      <div className="w-full h-24 rounded-xl bg-gradient-to-br from-[#C9A96E]/10 to-rani-cream flex items-center justify-center mb-3">
        {reward.image ? (
          <img
            src={reward.image}
            alt={reward.name}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <Gift size={32} className="text-rani-gold-accessible/40" />
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
            <Lock size={20} className="text-rani-muted" />
          </div>
        )}
      </div>

      {/* Details */}
      <h4 className="font-heading text-rani-navy text-sm font-semibold leading-tight">
        {reward.name}
      </h4>
      <p className="text-xs text-rani-muted font-body mt-1 line-clamp-2">{reward.description}</p>

      {/* Points cost + action */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          <Coins size={12} className="text-rani-gold-accessible" />
          <span className="text-xs font-semibold text-rani-navy font-body">
            {reward.pointsCost.toLocaleString()}
          </span>
        </div>

        {reward.tierRequired && (
          <span className="text-[10px] text-rani-muted font-body bg-rani-cream px-2 py-0.5 rounded-full">
            {reward.tierRequired}+
          </span>
        )}
      </div>

      {!isLocked && onRedeem && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onRedeem(reward.id)}
          className="w-full mt-3 py-2 bg-rani-navy text-white text-xs font-body font-semibold rounded-xl"
        >
          Redeem
        </motion.button>
      )}
    </motion.div>
  );
}
