'use client';

import { motion } from 'framer-motion';
import type { DailyTarget } from '@/lib/revenue/forecasting-v2';

interface DailyTargetTrackerProps {
  targets: DailyTarget[];
}

export default function DailyTargetTracker({ targets }: DailyTargetTrackerProps) {
  if (targets.length === 0) return null;

  const today = targets[0];
  const statusColors: Record<string, string> = {
    'ahead': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'on-pace': 'text-blue-600 bg-blue-50 border-blue-200',
    'behind': 'text-amber-600 bg-amber-50 border-amber-200',
    'at-risk': 'text-red-600 bg-red-50 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    'ahead': 'Ahead of Target',
    'on-pace': 'On Pace',
    'behind': 'Behind Target',
    'at-risk': 'At Risk',
  };

  return (
    <div className="space-y-4">
      {/* Today's hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-5 ${statusColors[today.status]}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-heading text-rani-navy">Today&apos;s Target</h3>
            <p className="text-xs font-body text-rani-muted">{today.dayOfWeek}, {new Date(today.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-body font-medium ${statusColors[today.status]}`}>
            {statusLabels[today.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs font-body text-rani-muted">Target</p>
            <p className="text-xl font-heading text-rani-navy">${today.target.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-body text-rani-muted">Booked</p>
            <p className="text-xl font-heading text-rani-navy">${today.booked.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-body text-rani-muted">Remaining</p>
            <p className="text-xl font-heading text-rani-navy">${today.remaining.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, today.target > 0 ? (today.booked / today.target) * 100 : 0)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              today.status === 'ahead' ? 'bg-emerald-500' :
              today.status === 'on-pace' ? 'bg-blue-500' :
              today.status === 'behind' ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        </div>

        {today.actionNeeded && (
          <p className="mt-3 text-xs font-body text-rani-text bg-white/40 rounded-lg p-2">
            {today.actionNeeded}
          </p>
        )}
      </motion.div>

      {/* Next 7 days */}
      <div className="grid grid-cols-7 gap-1.5">
        {targets.slice(0, 7).map((target, i) => {
          const fillPercent = target.target > 0 ? Math.min(100, (target.booked / target.target) * 100) : 0;
          return (
            <motion.div
              key={target.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`text-center p-2 rounded-lg border ${i === 0 ? 'border-rani-gold bg-rani-cream/30' : 'border-gray-100 bg-white'}`}
            >
              <p className="text-[10px] font-body text-rani-muted">{target.dayOfWeek.slice(0, 3)}</p>
              <p className="text-xs font-heading text-rani-navy mt-0.5">${(target.target / 1000).toFixed(1)}k</p>
              <div className="h-1 bg-gray-100 rounded-full mt-1.5">
                <div
                  className={`h-full rounded-full ${
                    fillPercent >= 80 ? 'bg-emerald-500' :
                    fillPercent >= 50 ? 'bg-blue-500' :
                    fillPercent >= 20 ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className="text-[10px] font-body text-rani-muted mt-0.5">{Math.round(fillPercent)}%</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
