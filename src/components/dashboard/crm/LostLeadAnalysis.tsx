'use client';

import type { LostReason } from '@/types/crm';
import { LOST_REASON_LABELS } from '@/types/crm';

interface LostLeadAnalysisProps {
  lostByReason: Partial<Record<LostReason, number>>;
}

const REASON_COLORS: Record<LostReason, string> = {
  price: 'bg-red-400',
  timing: 'bg-orange-400',
  competitor: 'bg-purple-400',
  no_show: 'bg-yellow-400',
  ghosted: 'bg-gray-400',
  not_ready: 'bg-blue-400',
  medical_contraindication: 'bg-teal-400',
  moved: 'bg-cyan-400',
  bad_experience: 'bg-rose-400',
  other: 'bg-slate-400',
};

export default function LostLeadAnalysis({ lostByReason }: LostLeadAnalysisProps) {
  const entries = Object.entries(lostByReason)
    .filter(([, v]) => v && v > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0)) as [LostReason, number][];

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
        Lost Lead Analysis <span className="text-rani-muted font-normal">({total} total)</span>
      </h3>
      <div className="space-y-2">
        {entries.map(([reason, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={reason}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-rani-navy">{LOST_REASON_LABELS[reason]}</span>
                <span className="text-xs text-rani-muted">{count} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${REASON_COLORS[reason]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
