'use client';

import type { MembershipTier } from '@/lib/membership/plans';

interface TierDistributionProps {
  distribution: Record<MembershipTier, number>;
}

const TIER_CONFIG: Record<MembershipTier, { label: string; color: string; bgColor: string }> = {
  halo: { label: 'Halo', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  glow: { label: 'Glow', color: 'bg-rani-gold', bgColor: 'bg-amber-50' },
  elite: { label: 'Elite', color: 'bg-purple-600', bgColor: 'bg-purple-50' },
};

export default function TierDistribution({ distribution }: TierDistributionProps) {
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Tier Distribution</h3>

      {/* Bar chart */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-6">
        {(['halo', 'glow', 'elite'] as MembershipTier[]).map((tier) => {
          const count = distribution[tier];
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={tier}
              className={`${TIER_CONFIG[tier].color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${TIER_CONFIG[tier].label}: ${count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {(['halo', 'glow', 'elite'] as MembershipTier[]).map((tier) => {
          const config = TIER_CONFIG[tier];
          const count = distribution[tier];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={tier} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-sm font-body text-rani-text">{config.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-body font-semibold text-rani-navy">{count}</span>
                <span className="text-xs font-body text-rani-muted w-10 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-rani-border flex items-center justify-between">
        <span className="text-sm font-body font-medium text-rani-navy">Total Members</span>
        <span className="text-sm font-body font-bold text-rani-navy">{total}</span>
      </div>
    </div>
  );
}
