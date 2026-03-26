'use client';

import { useState } from 'react';
import { Award, Gift, Users, TrendingUp, Crown } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import LoyaltyOverview from '@/components/dashboard/loyalty/LoyaltyOverview';
import TierDistribution from '@/components/dashboard/loyalty/TierDistribution';
import PointsHistory from '@/components/dashboard/loyalty/PointsHistory';
import RewardCatalog from '@/components/dashboard/loyalty/RewardCatalog';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils/formatters';
import type { LoyaltyAnalytics, LoyaltyTier } from '@/lib/loyalty/engine';

export default function LoyaltyDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'members'>('overview');
  const { data: analytics, isLoading, error, mutate } = useDashboardData<LoyaltyAnalytics>('/loyalty?action=analytics', {
    refreshInterval: 120000, // 2 min
  });

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'rewards' as const, label: 'Rewards', icon: Gift },
    { id: 'members' as const, label: 'Members', icon: Users },
  ];

  return (
    <DashboardErrorBoundary pageName="Loyalty">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-rani-gold" />
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Loyalty Program</h1>
            </div>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Points economy, tier management, and reward redemptions
            </p>
          </div>
          <div className="flex gap-1 bg-rani-cream rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-rani-navy shadow-sm'
                    : 'text-rani-muted hover:text-rani-text'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <InlineError message="Failed to load loyalty data" onRetry={() => mutate()} />
        ) : isLoading || !analytics ? (
          <div className="space-y-6">
            <StatRowSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <LoyaltyOverview analytics={analytics} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TierDistribution distribution={analytics.tierDistribution} />
                  <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
                    <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Points Economy Health</h3>
                    <div className="space-y-4">
                      <HealthMetric
                        label="Issuance Rate"
                        value={`${formatNumber(analytics.totalPointsIssued)} pts issued`}
                        sub="Total lifetime points earned by all members"
                        health={analytics.totalPointsIssued > 0 ? 'good' : 'neutral'}
                      />
                      <HealthMetric
                        label="Redemption Rate"
                        value={`${formatPercent(analytics.redemptionRate)}`}
                        sub={`${formatNumber(analytics.totalPointsRedeemed)} pts redeemed`}
                        health={analytics.redemptionRate > 20 ? 'good' : analytics.redemptionRate > 5 ? 'ok' : 'low'}
                      />
                      <HealthMetric
                        label="Points Outstanding"
                        value={formatNumber(analytics.pointsInCirculation)}
                        sub={`${formatCurrency(analytics.pointsInCirculation / 100)} in potential credits`}
                        health="neutral"
                      />
                      <HealthMetric
                        label="Active Members"
                        value={`${analytics.activeMembers} / ${analytics.totalMembers}`}
                        sub={`${analytics.totalMembers > 0 ? Math.round((analytics.activeMembers / analytics.totalMembers) * 100) : 0}% engagement rate`}
                        health={analytics.activeMembers / Math.max(analytics.totalMembers, 1) > 0.5 ? 'good' : 'ok'}
                      />
                    </div>
                  </div>
                </div>

                <PointsHistory analytics={analytics} />
              </div>
            )}

            {activeTab === 'rewards' && (
              <RewardCatalog
                tier="Platinum"
                balance={analytics.averageBalance}
              />
            )}

            {activeTab === 'members' && (
              <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
                <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Top Loyalty Members</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rani-border">
                        <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Rank</th>
                        <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Member</th>
                        <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Tier</th>
                        <th className="text-right py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topMembers.map((member, i) => (
                        <tr key={member.clientId} className="border-b border-rani-border/50 last:border-0">
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-gray-100 text-gray-600' :
                              i === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-rani-cream text-rani-muted'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-body text-rani-text">{member.clientName}</td>
                          <td className="py-3 px-3">
                            <TierBadge tier={member.tier} />
                          </td>
                          <td className="py-3 px-3 text-right font-heading font-semibold text-rani-gold">
                            {formatNumber(member.balance)} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}

function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const styles: Record<LoyaltyTier, string> = {
    Silver: 'bg-gray-100 text-gray-700',
    Gold: 'bg-amber-50 text-amber-700 border border-amber-200',
    Platinum: 'bg-rani-navy text-white',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function HealthMetric({ label, value, sub, health }: { label: string; value: string; sub: string; health: 'good' | 'ok' | 'low' | 'neutral' }) {
  const colors = { good: 'text-emerald-600', ok: 'text-amber-600', low: 'text-red-500', neutral: 'text-rani-navy' };
  const dots = { good: 'bg-emerald-500', ok: 'bg-amber-500', low: 'bg-red-500', neutral: 'bg-gray-300' };
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${dots[health]}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-rani-muted">{label}</span>
          <span className={`text-sm font-heading font-semibold ${colors[health]}`}>{value}</span>
        </div>
        <p className="text-xs text-rani-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
