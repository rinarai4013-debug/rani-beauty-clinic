'use client';

import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import MRRChart from '@/components/dashboard/membership/MRRChart';
import MRRMovementChart from '@/components/dashboard/membership/MRRMovementChart';
import CohortHeatmap from '@/components/dashboard/membership/CohortHeatmap';
import SeasonalPatterns from '@/components/dashboard/membership/SeasonalPatterns';
import BenefitsUsage from '@/components/dashboard/membership/BenefitsUsage';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MembershipAnalyticsDashboard, MRRMovement } from '@/lib/membership/analytics';
import type { BenefitsAnalyticsSummary } from '@/lib/membership/benefits';

interface AnalyticsPageData {
  dashboard: MembershipAnalyticsDashboard;
  mrrMovements: MRRMovement[];
  benefitsAnalytics: BenefitsAnalyticsSummary;
}

export default function MembershipAnalyticsPage() {
  const { data, isLoading, error, mutate } = useDashboardData<AnalyticsPageData>(
    '/membership?action=analytics',
    { refreshInterval: 300000 },
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <DashboardErrorBoundary pageName="Membership Analytics">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rani-gold" />
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Deep analytics: cohort retention, MRR movement, seasonal patterns, and benefits utilization
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load analytics" onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="space-y-6"><StatRowSkeleton /><ChartSkeleton /><ChartSkeleton /></div>
        ) : (
          <>
            {/* Revenue KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'MRR', value: formatCurrency(data.dashboard.mrr) },
                { label: 'ARR', value: formatCurrency(data.dashboard.arr) },
                { label: 'New MRR', value: formatCurrency(data.dashboard.newMRR) },
                { label: 'Expansion', value: formatCurrency(data.dashboard.expansionRevenue) },
                { label: 'Contraction', value: `-${formatCurrency(data.dashboard.contractionRevenue)}` },
                { label: 'Churned MRR', value: `-${formatCurrency(data.dashboard.churnedMRR)}` },
                { label: 'ARPM', value: formatCurrency(data.dashboard.revenuePerMember) },
                { label: 'NRR', value: `${data.dashboard.netRevenueRetention}%` },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-rani-border p-3">
                  <span className="text-[10px] font-body text-rani-muted uppercase tracking-wide block mb-1">{kpi.label}</span>
                  <span className="text-sm font-heading font-bold text-rani-navy">{kpi.value}</span>
                </div>
              ))}
            </div>

            {/* LTV by Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['halo', 'glow', 'elite'] as const).map((tier) => {
                const labels = { halo: 'Halo', glow: 'Glow', elite: 'Elite' };
                const colors = { halo: 'border-t-blue-500', glow: 'border-t-rani-gold', elite: 'border-t-purple-600' };
                return (
                  <div key={tier} className={`bg-white rounded-xl border border-rani-border border-t-4 ${colors[tier]} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-body text-rani-muted">{labels[tier]} LTV</span>
                      <span className="text-xs font-body text-rani-muted">
                        {data.dashboard.tierDistribution[tier]} members
                      </span>
                    </div>
                    <span className="text-2xl font-heading font-bold text-rani-navy">
                      {formatCurrency(data.dashboard.ltvByTier[tier])}
                    </span>
                    <p className="text-xs font-body text-rani-muted mt-1">
                      Avg duration: {data.dashboard.averageMembershipDuration}mo
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MRRChart data={data.dashboard.mrrHistory} />
              <MRRMovementChart movements={data.mrrMovements} />
            </div>

            {/* Cohort Heatmap */}
            <CohortHeatmap cohorts={data.dashboard.cohorts} />

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SeasonalPatterns patterns={data.dashboard.seasonalPatterns} />
              <BenefitsUsage analytics={data.benefitsAnalytics} />
            </div>

            {/* Tier change rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-rani-border p-4">
                <span className="text-xs font-body text-rani-muted">Upgrade Rate</span>
                <p className="text-xl font-heading font-bold text-emerald-600">{data.dashboard.upgradeRate}%</p>
                <span className="text-[10px] font-body text-rani-muted">of members/month</span>
              </div>
              <div className="bg-white rounded-xl border border-rani-border p-4">
                <span className="text-xs font-body text-rani-muted">Downgrade Rate</span>
                <p className="text-xl font-heading font-bold text-amber-600">{data.dashboard.downgradeRate}%</p>
                <span className="text-[10px] font-body text-rani-muted">of members/month</span>
              </div>
              <div className="bg-white rounded-xl border border-rani-border p-4">
                <span className="text-xs font-body text-rani-muted">Enrollment Rate</span>
                <p className="text-xl font-heading font-bold text-blue-600">{data.dashboard.enrollmentRate}%</p>
                <span className="text-[10px] font-body text-rani-muted">new members/month</span>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
