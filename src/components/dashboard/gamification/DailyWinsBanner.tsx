'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { WinToday } from '@/types/gamification';

interface DailyWinsBannerProps {
  className?: string;
}

export default function DailyWinsBanner({ className = '' }: DailyWinsBannerProps) {
  const { data, isLoading } = useDashboardData<{ wins: WinToday[] }>('/gamification/wins', {
    refreshInterval: 30000,
  });
  const wins = data?.wins ?? [];

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-rani-gold" />
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          Wins Today
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-rani-gold/10 rounded-full text-xs font-body font-semibold text-rani-gold">
          {wins.length}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-rani-cream/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : wins.length === 0 ? (
        <p className="text-sm font-body text-rani-muted italic">No wins yet today &mdash; let&apos;s get it!</p>
      ) : (
        <div className="space-y-2">
          {wins.map((win, i) => (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-3 py-2 bg-rani-cream/50 rounded-lg"
            >
              <span className="text-lg">{win.emoji}</span>
              <span className="text-sm font-body font-medium text-rani-text flex-1">
                {win.label}
              </span>
              <span className="text-[10px] font-body text-rani-muted">
                {win.timestamp}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
