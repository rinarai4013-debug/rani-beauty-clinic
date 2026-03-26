'use client';

import { motion } from 'framer-motion';
import { Award, TrendingUp, Gift, Users } from 'lucide-react';
import { formatNumber, formatPercent } from '@/lib/utils/formatters';
import type { LoyaltyAnalytics } from '@/lib/loyalty/engine';

interface LoyaltyOverviewProps {
  analytics: LoyaltyAnalytics;
}

export default function LoyaltyOverview({ analytics }: LoyaltyOverviewProps) {
  const stats = [
    {
      label: 'Total Members',
      value: formatNumber(analytics.totalMembers),
      sub: `${analytics.activeMembers} active (90d)`,
      icon: Users,
      color: 'text-rani-navy',
    },
    {
      label: 'Points Issued',
      value: formatNumber(analytics.totalPointsIssued, true),
      sub: `${formatNumber(analytics.pointsInCirculation, true)} in circulation`,
      icon: Award,
      color: 'text-rani-gold',
    },
    {
      label: 'Points Redeemed',
      value: formatNumber(analytics.totalPointsRedeemed, true),
      sub: `${formatPercent(analytics.redemptionRate)} redemption rate`,
      icon: Gift,
      color: 'text-emerald-600',
    },
    {
      label: 'Avg Balance',
      value: formatNumber(analytics.averageBalance),
      sub: `pts per member`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-xl border border-rani-border p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs font-body text-rani-muted uppercase tracking-wide">{stat.label}</span>
          </div>
          <p className="text-xl sm:text-2xl font-heading font-bold text-rani-navy">{stat.value}</p>
          <p className="text-xs font-body text-rani-muted mt-1">{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
