'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProviderRankingCardProps {
  rank: number;
  name: string;
  role: string;
  revenue: number;
  trend: 'up' | 'down' | 'flat';
  utilization: number;
  rebookRate: number;
  avgRating: number;
  color: string;
  onClick?: () => void;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-rani-gold/20 border-rani-gold text-rani-gold',
  2: 'bg-gray-200/50 border-gray-400 text-gray-600',
  3: 'bg-amber-100/50 border-amber-600 text-amber-700',
};

export default function ProviderRankingCard({
  rank, name, role, revenue, trend, utilization, rebookRate, avgRating, color, onClick,
}: ProviderRankingCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';
  const rankStyle = RANK_STYLES[rank] || 'bg-gray-100 border-gray-300 text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-display font-bold text-sm ${rankStyle}`}>
          {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-display font-semibold text-rani-navy truncate">{name}</h3>
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          </div>
          <p className="text-xs text-rani-muted font-body mt-0.5">{role}</p>
        </div>

        <div className="text-right">
          <p className="font-display font-bold text-rani-navy">
            ${revenue.toLocaleString()}
          </p>
          <p className="text-xs text-rani-muted font-body">revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-50">
        <div>
          <p className="text-xs text-rani-muted font-body">Utilization</p>
          <p className="font-body font-semibold text-sm text-rani-navy">{utilization}%</p>
        </div>
        <div>
          <p className="text-xs text-rani-muted font-body">Rebook</p>
          <p className="font-body font-semibold text-sm text-rani-navy">{rebookRate}%</p>
        </div>
        <div>
          <p className="text-xs text-rani-muted font-body">Rating</p>
          <p className="font-body font-semibold text-sm text-rani-navy">{avgRating.toFixed(1)} ★</p>
        </div>
      </div>
    </motion.div>
  );
}
