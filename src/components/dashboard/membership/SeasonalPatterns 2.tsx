'use client';

import type { SeasonalPattern } from '@/lib/membership/analytics';

interface SeasonalPatternsProps {
  patterns: SeasonalPattern[];
}

export default function SeasonalPatterns({ patterns }: SeasonalPatternsProps) {
  const maxEnrollments = Math.max(...patterns.map(p => p.enrollments), 1);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Seasonal Enrollment Patterns</h3>

      <div className="space-y-2">
        {patterns.map((pattern) => {
          const enrollPct = (pattern.enrollments / maxEnrollments) * 100;
          return (
            <div key={pattern.month} className="flex items-center gap-3">
              <span className="text-xs font-body text-rani-muted w-8">{pattern.monthName.substring(0, 3)}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-400 rounded-r"
                    style={{ width: `${enrollPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-red-400 rounded-r opacity-60"
                    style={{ width: `${(pattern.cancellations / maxEnrollments) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 w-28">
                <span className="text-[10px] font-body text-emerald-600">+{pattern.enrollments}</span>
                <span className="text-[10px] font-body text-red-500">-{pattern.cancellations}</span>
                <span className={`text-[10px] font-body font-bold ${pattern.netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ={pattern.netChange > 0 ? '+' : ''}{pattern.netChange}
                </span>
              </div>
              <span className={`text-[9px] font-body font-bold uppercase px-1.5 py-0.5 rounded ${
                pattern.trend === 'strong' ? 'bg-emerald-100 text-emerald-700' :
                pattern.trend === 'moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {pattern.trend}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-rani-border">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-emerald-400 rounded" />
          <span className="text-[10px] font-body text-rani-muted">Enrollments</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-red-400 rounded" />
          <span className="text-[10px] font-body text-rani-muted">Cancellations</span>
        </div>
      </div>
    </div>
  );
}
