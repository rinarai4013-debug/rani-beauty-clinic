'use client';

import { CreditCard, Users, Calendar, Gift } from 'lucide-react';
import type { BenefitsAnalyticsSummary } from '@/lib/membership/benefits';

interface BenefitsUsageProps {
  analytics: BenefitsAnalyticsSummary;
}

export default function BenefitsUsage({ analytics }: BenefitsUsageProps) {
  const metrics = [
    {
      label: 'Credit Utilization',
      value: `${analytics.creditUtilizationRate}%`,
      detail: `$${analytics.totalCreditsUsed.toLocaleString()} of $${analytics.totalCreditsIssued.toLocaleString()} used`,
      icon: CreditCard,
      color: analytics.creditUtilizationRate > 70 ? 'text-emerald-600' : analytics.creditUtilizationRate > 40 ? 'text-amber-600' : 'text-red-500',
      barColor: analytics.creditUtilizationRate > 70 ? 'bg-emerald-500' : analytics.creditUtilizationRate > 40 ? 'bg-amber-500' : 'bg-red-500',
      percentage: analytics.creditUtilizationRate,
    },
    {
      label: 'Guest Pass Usage',
      value: `${analytics.guestPassConversionRate}%`,
      detail: `${analytics.guestPassesUsed} of ${analytics.guestPassesIssued} passes used`,
      icon: Users,
      color: analytics.guestPassConversionRate > 50 ? 'text-emerald-600' : 'text-amber-600',
      barColor: analytics.guestPassConversionRate > 50 ? 'bg-emerald-500' : 'bg-amber-500',
      percentage: analytics.guestPassConversionRate,
    },
    {
      label: 'Birthday Bonuses',
      value: analytics.birthdayBonusesClaimed.toString(),
      detail: 'Claimed this period',
      icon: Gift,
      color: 'text-pink-600',
      barColor: 'bg-pink-500',
      percentage: null,
    },
    {
      label: 'Referral Bonuses',
      value: `$${analytics.referralBonusesPaid.toLocaleString()}`,
      detail: 'Paid out in referral credits',
      icon: Calendar,
      color: 'text-blue-600',
      barColor: 'bg-blue-500',
      percentage: null,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Benefits Utilization</h3>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-sm font-body text-rani-text">{metric.label}</span>
              </div>
              <span className={`text-sm font-body font-bold ${metric.color}`}>{metric.value}</span>
            </div>
            {metric.percentage !== null && (
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metric.barColor} transition-all`}
                  style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                />
              </div>
            )}
            <p className="text-xs font-body text-rani-muted">{metric.detail}</p>
          </div>
        ))}
      </div>

      {/* Tier utilization comparison */}
      <div className="mt-6 pt-4 border-t border-rani-border">
        <h4 className="text-xs font-heading font-semibold text-rani-navy mb-3">Utilization by Tier</h4>
        <div className="space-y-2">
          {(['halo', 'glow', 'elite'] as const).map((tier) => {
            const util = analytics.utilizationByTier[tier];
            const labels = { halo: 'Halo', glow: 'Glow', elite: 'Elite' };
            return (
              <div key={tier} className="flex items-center gap-3">
                <span className="text-xs font-body text-rani-muted w-12">{labels[tier]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-rani-gold transition-all"
                    style={{ width: `${Math.min(util, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-body font-medium text-rani-navy w-10 text-right">{util}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
