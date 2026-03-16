'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Star, Calendar, DollarSign, Award } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  revenue: DollarSign,
  booking: Calendar,
  review: Star,
  achievement: Award,
  milestone: TrendingUp,
  streak: Sparkles,
};

// Mock wins - in production these come from the gamification API
const MOCK_WINS = [
  { id: '1', type: 'revenue', label: '$2,450 collected', emoji: '💰', timestamp: '10:30 AM' },
  { id: '2', type: 'booking', label: '3 new bookings', emoji: '📅', timestamp: '11:15 AM' },
  { id: '3', type: 'review', label: '5-star Google review', emoji: '⭐', timestamp: '12:00 PM' },
  { id: '4', type: 'achievement', label: 'Speed Demon unlocked', emoji: '⚡', timestamp: '1:30 PM' },
];

interface DailyWinsBannerProps {
  className?: string;
}

export default function DailyWinsBanner({ className = '' }: DailyWinsBannerProps) {
  const wins = MOCK_WINS; // Replace with useGamification() hook data

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

      {wins.length === 0 ? (
        <p className="text-sm font-body text-rani-muted italic">No wins yet today. Let&apos;s get it!</p>
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
