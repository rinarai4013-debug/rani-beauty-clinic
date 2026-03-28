'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { GoalStatus } from '@/types/providers';

interface GoalProgressCardProps {
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  status: GoalStatus;
  milestones: { label: string; targetValue: number; achieved: boolean }[];
  daysRemaining?: number;
}

const STATUS_CONFIG: Record<GoalStatus, { color: string; bg: string; icon: typeof Target; label: string }> = {
  not_started: { color: 'text-gray-400', bg: 'bg-gray-100', icon: Target, label: 'Not Started' },
  on_track: { color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp, label: 'On Track' },
  at_risk: { color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertTriangle, label: 'At Risk' },
  behind: { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Behind' },
  exceeded: { color: 'text-purple-600', bg: 'bg-purple-50', icon: CheckCircle2, label: 'Exceeded' },
  completed: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Completed' },
};

const STATUS_BAR_COLORS: Record<GoalStatus, string> = {
  not_started: '#9CA3AF',
  on_track: '#059669',
  at_risk: '#F59E0B',
  behind: '#EF4444',
  exceeded: '#7C3AED',
  completed: '#059669',
};

export default function GoalProgressCard({
  title, description, currentValue, targetValue, unit, progressPercent, status, milestones, daysRemaining,
}: GoalProgressCardProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const barColor = STATUS_BAR_COLORS[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-semibold text-rani-navy">{title}</h4>
          <p className="text-xs text-rani-muted font-body mt-0.5">{description}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-body ${config.bg} ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="font-display font-bold text-2xl text-rani-navy">
            {unit === 'USD' ? `$${currentValue.toLocaleString()}` : currentValue.toLocaleString()}
          </span>
          <span className="text-sm text-rani-muted font-body">
            {' '}/{' '}{unit === 'USD' ? `$${targetValue.toLocaleString()}` : `${targetValue} ${unit}`}
          </span>
        </div>
        <span className="font-display font-bold text-rani-navy">{progressPercent}%</span>
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progressPercent)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Milestones */}
      <div className="flex gap-1 mb-2">
        {milestones.map((m, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${m.achieved ? 'bg-rani-gold' : 'bg-gray-200'}`}
            title={m.label}
          />
        ))}
      </div>

      {daysRemaining !== undefined && daysRemaining > 0 && (
        <p className="text-xs text-rani-muted font-body mt-2">
          {daysRemaining} days remaining
        </p>
      )}
    </motion.div>
  );
}
