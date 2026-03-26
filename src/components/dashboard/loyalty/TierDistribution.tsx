'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

interface TierDistributionProps {
  distribution: Record<LoyaltyTier, number>;
}

const TIER_COLORS: Record<LoyaltyTier, string> = {
  Silver: '#9CA3AF',
  Gold: '#C9A96E',
  Platinum: '#0F1D2C',
};

const TIER_LABELS: Record<LoyaltyTier, string> = {
  Silver: 'Silver (0-1,999 pts)',
  Gold: 'Gold (2,000-4,999 pts)',
  Platinum: 'Platinum (5,000+ pts)',
};

export default function TierDistribution({ distribution }: TierDistributionProps) {
  const data = (Object.entries(distribution) as [LoyaltyTier, number][])
    .map(([tier, count]) => ({
      name: tier,
      value: count,
      color: TIER_COLORS[tier],
      label: TIER_LABELS[tier],
    }))
    .filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Tier Distribution</h3>

      <div className="flex items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} members (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-body text-rani-text">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-heading font-semibold text-rani-navy">{d.value}</span>
                <span className="text-xs text-rani-muted ml-1">
                  ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-rani-border">
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['Silver', 'Gold', 'Platinum'] as LoyaltyTier[]).map((tier) => (
            <div key={tier}>
              <p className="text-xs text-rani-muted">{tier}</p>
              <p className="text-xs text-rani-text mt-0.5">{TIER_LABELS[tier].split('(')[1]?.replace(')', '')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
