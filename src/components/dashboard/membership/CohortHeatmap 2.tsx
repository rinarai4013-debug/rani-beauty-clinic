'use client';

import type { CohortData } from '@/lib/membership/analytics';

interface CohortHeatmapProps {
  cohorts: CohortData[];
  maxMonths?: number;
}

function getHeatmapColor(retention: number): string {
  if (retention >= 90) return 'bg-emerald-600 text-white';
  if (retention >= 80) return 'bg-emerald-500 text-white';
  if (retention >= 70) return 'bg-emerald-400 text-white';
  if (retention >= 60) return 'bg-yellow-400 text-gray-900';
  if (retention >= 50) return 'bg-amber-400 text-gray-900';
  if (retention >= 40) return 'bg-orange-400 text-white';
  if (retention >= 30) return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

function formatCohortLabel(cohort: string): string {
  const [y, m] = cohort.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function CohortHeatmap({ cohorts, maxMonths = 12 }: CohortHeatmapProps) {
  const displayMonths = Math.min(maxMonths, 12);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Cohort Retention</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-body font-medium text-rani-muted pb-2 pr-2 sticky left-0 bg-white">
                Cohort
              </th>
              <th className="text-center font-body font-medium text-rani-muted pb-2 px-1">Size</th>
              {Array.from({ length: displayMonths }, (_, i) => (
                <th key={i} className="text-center font-body font-medium text-rani-muted pb-2 px-1">
                  M{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.slice(-8).map((cohort) => (
              <tr key={cohort.cohort}>
                <td className="font-body text-rani-text py-1 pr-2 sticky left-0 bg-white whitespace-nowrap">
                  {formatCohortLabel(cohort.cohort)}
                </td>
                <td className="text-center font-body text-rani-navy font-medium py-1 px-1">
                  {cohort.startingMembers}
                </td>
                {Array.from({ length: displayMonths }, (_, i) => {
                  const retention = cohort.retentionByMonth[i];
                  if (retention === undefined) {
                    return <td key={i} className="py-1 px-1"><div className="w-10 h-7" /></td>;
                  }
                  return (
                    <td key={i} className="py-1 px-1">
                      <div
                        className={`w-10 h-7 rounded flex items-center justify-center text-[10px] font-body font-medium ${getHeatmapColor(retention)}`}
                        title={`${retention}% retained at month ${i + 1}`}
                      >
                        {retention}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-rani-border">
        <span className="text-[10px] font-body text-rani-muted">Retention:</span>
        <div className="flex gap-1">
          {[90, 80, 70, 60, 50, 40, 30].map(v => (
            <div
              key={v}
              className={`w-6 h-4 rounded text-[8px] flex items-center justify-center ${getHeatmapColor(v)}`}
            >
              {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
