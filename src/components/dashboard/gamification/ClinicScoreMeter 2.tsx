'use client';

import { motion } from 'framer-motion';
import { useClinicScore } from '@/hooks/useDashboardData';
import { getScoreColor, getScoreStatus, getScoreLabel } from '@/lib/utils/formatters';
import type { ClinicScore } from '@/types/dashboard';

export default function ClinicScoreMeter() {
  const { data, isLoading } = useClinicScore();
  const scoreData = data as ClinicScore | undefined;
  const score = scoreData?.total ?? 0;
  const status = getScoreStatus(score);
  const color = getScoreColor(score);
  const label = getScoreLabel(status);

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6 min-h-[180px]">
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-rani-border rounded w-24" />
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-rani-border rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(15, 29, 44, 0.08)' }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6 flex flex-col items-center"
    >
      <span className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted mb-3">
        Clinic Score
      </span>

      {/* Score Ring */}
      <div className="relative w-28 h-28">
        <svg width="112" height="112" className="-rotate-90">
          <circle
            cx="56" cy="56" r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          <motion.circle
            cx="56" cy="56" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-body font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {score}
          </motion.span>
        </div>

        {/* Glow for elite */}
        {status === 'elite' && (
          <div
            className="absolute inset-0 rounded-full animate-glow-pulse pointer-events-none"
            style={{ boxShadow: `0 0 30px ${color}40` }}
          />
        )}
      </div>

      {/* Status Label */}
      <div className="mt-2 flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-body font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Streak */}
      {(scoreData?.streak ?? 0) > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs font-body text-rani-muted">
          <span>🔥</span>
          <span>{scoreData?.streak} day streak</span>
        </div>
      )}
    </motion.div>
  );
}
