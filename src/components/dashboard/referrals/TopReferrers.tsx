'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { formatNumber, formatPercent, formatCurrency } from '@/lib/utils/formatters';
import type { TopReferrer } from '@/lib/referral/engine';

interface TopReferrersProps {
  referrers: TopReferrer[];
}

const RANK_STYLES = [
  { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-500' },
  { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-400', badge: 'bg-gray-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-400', badge: 'bg-orange-400' },
];

export default function TopReferrers({ referrers }: TopReferrersProps) {
  if (referrers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Top Referrers</h3>
        <p className="text-sm text-rani-muted text-center py-8">No referrals yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-rani-gold" />
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Top Referrers</h3>
      </div>

      <div className="space-y-3">
        {referrers.map((referrer, i) => {
          const style = RANK_STYLES[i] || { bg: 'bg-white', border: 'border-rani-border', icon: 'text-rani-muted', badge: 'bg-rani-muted' };
          return (
            <motion.div
              key={referrer.referrerId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${style.badge}`}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-semibold text-rani-navy truncate">
                  {referrer.referrerName}
                </p>
                <p className="text-xs text-rani-muted">
                  {referrer.completedReferrals} converted / {referrer.totalReferrals} total
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-heading font-semibold text-rani-gold">
                  {formatCurrency(referrer.totalRewardsEarned)}
                </p>
                <p className="text-xs text-rani-muted">
                  {formatPercent(referrer.conversionRate)} rate
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-rani-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-rani-muted">
          <TrendingUp className="w-3 h-3" />
          <span>Total referrals: {referrers.reduce((sum, r) => sum + r.totalReferrals, 0)}</span>
        </div>
        <span className="text-xs font-semibold text-emerald-600">
          {formatCurrency(referrers.reduce((sum, r) => sum + r.totalRewardsEarned, 0))} earned
        </span>
      </div>
    </div>
  );
}
