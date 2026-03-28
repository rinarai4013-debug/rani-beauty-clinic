'use client';

import type { LeadSource } from '@/types/crm';
import { LEAD_SOURCE_LABELS } from '@/types/crm';

interface LeadSourceChartProps {
  revenueBySource: Partial<Record<LeadSource, number>>;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
}

const SOURCE_COLORS: Record<string, string> = {
  referral: 'bg-green-500',
  google: 'bg-blue-500',
  instagram: 'bg-pink-500',
  facebook: 'bg-indigo-500',
  website: 'bg-cyan-500',
  phone: 'bg-orange-500',
  walk_in: 'bg-yellow-500',
  mangomint: 'bg-teal-500',
  event: 'bg-purple-500',
  yelp: 'bg-red-500',
  tiktok: 'bg-slate-500',
  other: 'bg-gray-500',
};

export default function LeadSourceChart({ revenueBySource }: LeadSourceChartProps) {
  const entries = Object.entries(revenueBySource)
    .filter(([, v]) => v && v > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0)) as [LeadSource, number][];

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
        Revenue by Lead Source
      </h3>

      <div className="space-y-2">
        {entries.map(([source, revenue]) => {
          const pct = Math.round((revenue / total) * 100);
          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-rani-navy font-medium">{LEAD_SOURCE_LABELS[source]}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-rani-muted">{pct}%</span>
                  <span className="font-medium text-rani-navy">{formatCurrency(revenue)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${SOURCE_COLORS[source] || 'bg-gray-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-rani-muted">Total Revenue</span>
        <span className="font-heading text-rani-navy">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
