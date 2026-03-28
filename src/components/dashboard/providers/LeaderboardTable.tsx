'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/providers';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  metric: string;
  formatValue?: (value: number) => string;
}

export default function LeaderboardTable({ entries, metric, formatValue }: LeaderboardTableProps) {
  const fmt = formatValue || ((v: number) => v.toLocaleString());

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-rani-gold" />
        <h3 className="font-display font-semibold text-rani-navy text-sm">{metric} Leaderboard</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.map((entry, i) => {
          const TrendIcon = entry.trend === 'up' ? TrendingUp : entry.trend === 'down' ? TrendingDown : Minus;
          const trendColor = entry.trend === 'up' ? 'text-green-500' : entry.trend === 'down' ? 'text-red-500' : 'text-gray-400';

          return (
            <motion.div
              key={entry.providerId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                entry.rank === 1 ? 'bg-rani-gold/20 text-rani-gold' : entry.rank === 2 ? 'bg-gray-200 text-gray-600' : entry.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500'
              }`}>
                {entry.rank}
              </div>
              <div className="flex-1">
                <p className="font-body font-semibold text-sm text-rani-navy">{entry.providerName}</p>
              </div>
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className="font-display font-bold text-rani-navy min-w-[80px] text-right">{fmt(entry.score)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
