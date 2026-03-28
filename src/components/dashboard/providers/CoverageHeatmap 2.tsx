'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CoverageCheck } from '@/types/providers';

interface CoverageHeatmapProps {
  coverage: CoverageCheck[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CoverageHeatmap({ coverage }: CoverageHeatmapProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-display font-semibold text-rani-navy mb-4">Weekly Coverage</h3>

      <div className="grid grid-cols-7 gap-2">
        {coverage.map((day, i) => {
          const date = new Date(day.date);
          const dayLabel = DAY_LABELS[date.getDay()];
          const dateLabel = date.getDate().toString();

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg p-3 text-center ${
                day.meetsMinimum ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className="text-xs font-body text-rani-muted">{dayLabel}</p>
              <p className="font-display font-bold text-lg text-rani-navy">{dateLabel}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {day.meetsMinimum ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span className={`text-xs font-body ${day.meetsMinimum ? 'text-green-600' : 'text-red-500'}`}>
                  {day.providersAvailable.length} provider{day.providersAvailable.length !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {coverage.some(d => !d.meetsMinimum) && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
          <p className="text-xs text-red-600 font-body">
            Coverage gaps detected. Minimum {coverage[0]?.minimumRequired || 1} provider(s) required at all times.
          </p>
        </div>
      )}
    </div>
  );
}
