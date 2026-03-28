'use client';

import { CreditCard, AlertTriangle } from 'lucide-react';
import type { MembershipUnderutilizationGap } from '@/lib/revenue/gap-finder';

interface MembershipGapsListProps {
  gaps: MembershipUnderutilizationGap[];
}

export default function MembershipGapsList({ gaps }: MembershipGapsListProps) {
  if (gaps.length === 0) {
    return <div className="text-center py-6 text-rani-muted text-sm font-body">All members are using their credits -- great!</div>;
  }

  return (
    <div className="space-y-2">
      {gaps.slice(0, 15).map((gap, i) => (
        <div key={gap.clientId + i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-purple-200 transition-colors">
          <div className={`p-1.5 rounded-lg ${gap.utilizationPercent < 25 ? 'bg-red-50' : 'bg-amber-50'}`}>
            {gap.utilizationPercent < 25
              ? <AlertTriangle className="w-4 h-4 text-red-500" />
              : <CreditCard className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-body font-medium text-rani-navy truncate">{gap.clientName}</p>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-body">{gap.tier}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs font-body text-rani-muted">
                ${gap.creditsUsedThisMonth} of ${gap.monthlyCredits} used
              </span>
              <span className="text-xs font-body text-rani-muted">
                {gap.daysSinceLastRedemption > 0 ? `${gap.daysSinceLastRedemption}d since last use` : ''}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${gap.utilizationPercent >= 50 ? 'bg-emerald-500' : gap.utilizationPercent >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${gap.utilizationPercent}%` }}
                />
              </div>
              <span className="text-xs font-body text-rani-muted">{gap.utilizationPercent}%</span>
            </div>
            <p className="text-xs font-heading text-red-600 mt-0.5">${gap.wastedValue} at risk</p>
          </div>
        </div>
      ))}
    </div>
  );
}
