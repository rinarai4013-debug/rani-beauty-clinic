'use client';

import { useState } from 'react';
import { Crown, DollarSign, Users, TrendingDown, BarChart3, Shield, UserCheck } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import MembershipKPICards from '@/components/dashboard/membership/MembershipKPICards';
import MRRChart from '@/components/dashboard/membership/MRRChart';
import TierDistribution from '@/components/dashboard/membership/TierDistribution';
import ChurnFunnel from '@/components/dashboard/membership/ChurnFunnel';
import AtRiskMemberList from '@/components/dashboard/membership/AtRiskMemberList';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MembershipAnalyticsDashboard } from '@/lib/membership/analytics';
import type { MemberRetentionProfile } from '@/lib/membership/retention';

interface MembershipOverviewData {
  analytics: MembershipAnalyticsDashboard;
  atRiskMembers: MemberRetentionProfile[];
}

export default function MembershipDashboard() {
  const { data, isLoading, error, mutate } = useDashboardData<MembershipOverviewData>(
    '/membership?action=overview',
    { refreshInterval: 60000 },
  );

  return (
    <DashboardErrorBoundary pageName="Membership">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-rani-gold-accessible" />
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Membership</h1>
            </div>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Revenue, growth, retention, and member engagement at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/dashboard/membership/members"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-cream text-rani-navy hover:bg-rani-cream/80 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              All Members
            </a>
            <a
              href="/dashboard/membership/analytics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-gold text-white hover:bg-rani-gold/90 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Full Analytics
            </a>
          </div>
        </div>

        {error ? (
          <InlineError message="Failed to load membership data" onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="space-y-6">
            <StatRowSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <MembershipKPICards
              mrr={data.analytics.mrr}
              mrrGrowth={data.analytics.mrrGrowth}
              activeMembers={data.analytics.activeMembers}
              churnRate={data.analytics.churnRate.total}
              netRevenueRetention={data.analytics.netRevenueRetention}
              averageLTV={data.analytics.averageLTV}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MRRChart data={data.analytics.mrrHistory} />
              </div>
              <TierDistribution distribution={data.analytics.tierDistribution} />
            </div>

            {/* Churn & At-Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChurnFunnel
                churnRate={data.analytics.churnRate}
                atRiskCount={data.atRiskMembers.length}
                totalActive={data.analytics.activeMembers}
              />
              <AtRiskMemberList
                members={data.atRiskMembers}
                limit={5}
                onViewMember={(id) => window.location.href = `/dashboard/membership/members/${id}`}
              />
            </div>

            {/* Quick navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/dashboard/membership/plans', icon: Crown, label: 'Plans', count: '3 tiers' },
                { href: '/dashboard/membership/billing', icon: DollarSign, label: 'Billing', count: `${data.analytics.activeMembers} active` },
                { href: '/dashboard/membership/retention', icon: Shield, label: 'Retention', count: `${data.atRiskMembers.length} at risk` },
                { href: '/dashboard/membership/analytics', icon: BarChart3, label: 'Analytics', count: 'Full report' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="bg-white rounded-xl border border-rani-border p-4 hover:shadow-md transition-shadow group"
                >
                  <link.icon className="w-5 h-5 text-rani-gold-accessible mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-heading font-semibold text-rani-navy">{link.label}</h4>
                  <p className="text-xs font-body text-rani-muted">{link.count}</p>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
