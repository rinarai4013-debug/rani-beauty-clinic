'use client';

import { motion } from 'framer-motion';
import type { RetentionMetrics } from '@/lib/revenue/retention-machine';

interface RetentionOverviewProps {
  metrics: RetentionMetrics;
}

export default function RetentionOverview({ metrics }: RetentionOverviewProps) {
  const stats = [
    { label: 'Overall Retention', value: `${metrics.overallRetentionRate}%`, target: 75, current: metrics.overallRetentionRate },
    { label: 'Member Retention', value: `${metrics.memberRetentionRate}%`, target: 90, current: metrics.memberRetentionRate },
    { label: 'Non-Member Retention', value: `${metrics.nonMemberRetentionRate}%`, target: 50, current: metrics.nonMemberRetentionRate },
    { label: 'Rebook Rate', value: `${metrics.rebookRate}%`, target: 70, current: metrics.rebookRate },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-lg border border-gray-100 p-3"
          >
            <p className="text-xs font-body text-rani-muted">{stat.label}</p>
            <p className="text-lg font-heading text-rani-navy mt-0.5">{stat.value}</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  stat.current >= stat.target ? 'bg-emerald-500' :
                  stat.current >= stat.target * 0.8 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, stat.current)}%` }}
              />
            </div>
            <p className="text-[10px] font-body text-rani-muted mt-1">Target: {stat.target}%</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-xs font-body text-rani-muted">Avg Visit Gap</p>
          <p className="text-lg font-heading text-rani-navy">{metrics.avgTimeBetweenVisits}d</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-xs font-body text-rani-muted">Retention vs Acquisition</p>
          <p className="text-lg font-heading text-rani-navy">{metrics.retentionVsAcquisitionRatio}x</p>
          <p className="text-[10px] font-body text-emerald-600">Retention is {metrics.retentionVsAcquisitionRatio}x cheaper</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-xs font-body text-rani-muted">Churn Rate</p>
          <p className={`text-lg font-heading ${metrics.churnRate > 30 ? 'text-red-600' : 'text-rani-navy'}`}>
            {metrics.churnRate}%
          </p>
        </div>
      </div>

      {/* LTV by segment */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <h4 className="text-sm font-heading text-rani-navy mb-3">Lifetime Value by Segment</h4>
        <div className="space-y-2">
          {metrics.lifetimeValueBySegment.map((seg, i) => {
            const maxLTV = Math.max(...metrics.lifetimeValueBySegment.map(s => s.ltv));
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-body text-rani-text w-36 flex-shrink-0">{seg.segment}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(seg.ltv / maxLTV) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-rani-gold to-rani-gold/60"
                  />
                </div>
                <span className="text-xs font-heading text-rani-navy w-16 text-right">${seg.ltv.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
