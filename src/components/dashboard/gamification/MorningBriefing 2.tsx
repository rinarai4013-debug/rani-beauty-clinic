'use client';

import { motion } from 'framer-motion';
import { Sun, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

interface BriefingData {
  greeting: string;
  yesterdayRevenue: number;
  yesterdayVsAvg: number;
  weekRevenue: number;
  weekTarget: number;
  appointmentsToday: number;
  consultsToday: number;
  atRiskClients: number;
  streakDays: number;
  topWin: string;
  focusArea: string;
}

export default function MorningBriefing() {
  const { data, isLoading } = useDashboardData<BriefingData>('/gamification/briefing', {
    refreshInterval: 300000,
  });

  if (isLoading || !data) return null;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const TrendIcon = data.yesterdayVsAvg > 5 ? TrendingUp : data.yesterdayVsAvg < -5 ? TrendingDown : Minus;
  const trendColor = data.yesterdayVsAvg > 5 ? 'text-green-500' : data.yesterdayVsAvg < -5 ? 'text-red-400' : 'text-rani-muted';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-rani-navy to-[#1A2A3C] rounded-xl p-5 text-white mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-5 h-5 text-rani-gold" />
        <h2 className="font-display text-lg font-bold text-white">
          {timeGreeting}, Rina
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-body">Yesterday</p>
          <p className="text-lg font-display font-bold text-rani-gold">${(data.yesterdayRevenue / 1000).toFixed(1)}K</p>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-[10px] font-body">{data.yesterdayVsAvg > 0 ? '+' : ''}{data.yesterdayVsAvg}% vs avg</span>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-body">This Week</p>
          <p className="text-lg font-display font-bold text-white">${(data.weekRevenue / 1000).toFixed(1)}K</p>
          <p className="text-[10px] font-body text-white/50">of ${(data.weekTarget / 1000).toFixed(0)}K target</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-body">Today</p>
          <p className="text-lg font-display font-bold text-white">{data.appointmentsToday}</p>
          <p className="text-[10px] font-body text-white/50">appointments</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-body">Streak</p>
          <p className="text-lg font-display font-bold text-orange-400">{data.streakDays > 0 ? `\uD83D\uDD25 ${data.streakDays}` : '0'}</p>
          <p className="text-[10px] font-body text-white/50">day{data.streakDays !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {data.focusArea && (
        <p className="text-sm font-body text-white/70">
          <span className="text-rani-gold font-semibold">Focus today:</span> {data.focusArea}
        </p>
      )}
    </motion.div>
  );
}
