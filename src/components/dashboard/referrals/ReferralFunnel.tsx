'use client';

import { motion } from 'framer-motion';
import { formatNumber, formatPercent } from '@/lib/utils/formatters';
import type { ReferralStats } from '@/lib/referral/engine';

interface ReferralFunnelProps {
  stats: ReferralStats;
}

interface FunnelStep {
  label: string;
  count: number;
  rate: number;
  color: string;
}

export default function ReferralFunnel({ stats }: ReferralFunnelProps) {
  const totalActive = stats.sent + stats.clicked + stats.booked + stats.completed + stats.rewarded;

  const steps: FunnelStep[] = [
    {
      label: 'Sent',
      count: stats.totalReferrals,
      rate: 100,
      color: '#C9A96E',
    },
    {
      label: 'Clicked',
      count: stats.clicked + stats.booked + stats.completed + stats.rewarded,
      rate: stats.funnelRates.sentToClicked,
      color: '#3B82F6',
    },
    {
      label: 'Booked',
      count: stats.booked + stats.completed + stats.rewarded,
      rate: stats.funnelRates.clickedToBooked,
      color: '#8B5CF6',
    },
    {
      label: 'Completed',
      count: stats.completed + stats.rewarded,
      rate: stats.funnelRates.bookedToCompleted,
      color: '#10B981',
    },
    {
      label: 'Rewarded',
      count: stats.rewarded,
      rate: stats.completed + stats.rewarded > 0
        ? Math.round((stats.rewarded / (stats.completed + stats.rewarded)) * 100)
        : 0,
      color: '#059669',
    },
  ];

  const maxCount = Math.max(...steps.map(s => s.count), 1);

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Referral Funnel</h3>
        <span className="text-xs font-body text-rani-muted">
          {formatPercent(stats.conversionRate)} overall conversion
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPercent = Math.max((step.count / maxCount) * 100, 8);
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-body text-rani-text">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-heading font-semibold text-rani-navy">{formatNumber(step.count)}</span>
                  {i > 0 && (
                    <span className="text-xs text-rani-muted">({formatPercent(step.rate)})</span>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPercent}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="h-6 rounded-md"
                style={{ backgroundColor: step.color }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-rani-border grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-rani-muted">Revenue</p>
          <p className="text-sm font-heading font-semibold text-rani-navy">
            ${formatNumber((stats.completed + stats.rewarded) * 350, true)}
          </p>
        </div>
        <div>
          <p className="text-xs text-rani-muted">Rewards Cost</p>
          <p className="text-sm font-heading font-semibold text-rani-navy">
            ${formatNumber((stats.completed + stats.rewarded) * 75)}
          </p>
        </div>
        <div>
          <p className="text-xs text-rani-muted">Expired</p>
          <p className="text-sm font-heading font-semibold text-red-500">{stats.expired}</p>
        </div>
      </div>
    </div>
  );
}
