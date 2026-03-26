'use client';

import { motion } from 'framer-motion';
import { Gift, Star, Zap, Sparkles } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { getRewardsByCategory, getCategoryLabel, type LoyaltyReward, type RewardCategory } from '@/lib/loyalty/rewards';

interface RewardCatalogProps {
  tier: 'Silver' | 'Gold' | 'Platinum';
  balance: number;
  onRedeem?: (rewardId: string) => void;
}

const CATEGORY_ICONS: Record<RewardCategory, React.ElementType> = {
  credit: Star,
  treatment: Sparkles,
  upgrade: Zap,
  addon: Gift,
  experience: Star,
};

export default function RewardCatalog({ tier, balance, onRedeem }: RewardCatalogProps) {
  const grouped = getRewardsByCategory();
  const tierOrder = ['Silver', 'Gold', 'Platinum'];
  const memberTierIdx = tierOrder.indexOf(tier);

  // Filter categories to only show rewards available to this tier
  const visibleCategories = (Object.entries(grouped) as [RewardCategory, LoyaltyReward[]][])
    .map(([category, rewards]) => ({
      category,
      label: getCategoryLabel(category),
      rewards: rewards.filter(r => tierOrder.indexOf(r.minimumTier) <= memberTierIdx),
    }))
    .filter(c => c.rewards.length > 0);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Reward Catalog</h3>
        <span className="text-xs font-body text-rani-muted">
          Your balance: <span className="font-semibold text-rani-gold">{formatNumber(balance)} pts</span>
        </span>
      </div>

      <div className="space-y-6">
        {visibleCategories.map(({ category, label, rewards }) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-rani-gold" />
                <h4 className="text-xs font-heading font-semibold text-rani-navy uppercase tracking-wide">{label}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rewards.map((reward, i) => {
                  const canAfford = balance >= reward.pointsCost;
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`relative rounded-lg border p-4 transition-all ${
                        canAfford
                          ? 'border-rani-gold/30 bg-rani-cream/30 hover:border-rani-gold/60 hover:shadow-sm'
                          : 'border-rani-border bg-gray-50 opacity-60'
                      }`}
                    >
                      {reward.featured && (
                        <span className="absolute -top-2 right-3 text-[10px] font-semibold bg-rani-gold text-rani-navy px-2 py-0.5 rounded-full">
                          FEATURED
                        </span>
                      )}
                      <p className="text-sm font-heading font-semibold text-rani-navy">{reward.name}</p>
                      <p className="text-xs text-rani-muted mt-1 line-clamp-2">{reward.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-semibold text-rani-gold">
                          {formatNumber(reward.pointsCost)} pts
                        </span>
                        {onRedeem && (
                          <button
                            onClick={() => onRedeem(reward.id)}
                            disabled={!canAfford}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                              canAfford
                                ? 'bg-rani-navy text-white hover:bg-rani-navy/90'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Redeem
                          </button>
                        )}
                      </div>
                      {reward.minimumTier !== 'Silver' && (
                        <span className="text-[10px] text-rani-muted mt-1 block">
                          {reward.minimumTier}+ only
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
