'use client';

import { Shield, AlertTriangle, Heart, TrendingUp } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import AtRiskMemberList from '@/components/dashboard/membership/AtRiskMemberList';
import RetentionActions from '@/components/dashboard/membership/RetentionActions';
import EngagementScore from '@/components/dashboard/membership/EngagementScore';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MemberRetentionProfile, RetentionAnalytics, RetentionAction } from '@/lib/membership/retention';

interface RetentionData {
  analytics: RetentionAnalytics;
  atRiskMembers: MemberRetentionProfile[];
  pendingActions: RetentionAction[];
  engagementOverall: { score: number; breakdown: Record<string, number>; trend: 'improving' | 'stable' | 'declining' };
}

export default function MembershipRetentionPage() {
  const { data, isLoading, error, mutate } = useDashboardData<RetentionData>(
    '/membership?action=retention',
    { refreshInterval: 120000 },
  );

  return (
    <DashboardErrorBoundary pageName="Membership Retention">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rani-gold" />
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Retention</h1>
          </div>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            At-risk members, engagement scoring, and retention strategies
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load retention data" onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="space-y-6"><StatRowSkeleton /><ChartSkeleton /></div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Retention Rate', value: `${data.analytics.overallRetentionRate}%`, color: data.analytics.overallRetentionRate > 90 ? 'text-emerald-600' : 'text-amber-600' },
                { label: 'NPS', value: data.analytics.npsAverage.toString(), color: data.analytics.npsAverage > 50 ? 'text-emerald-600' : data.analytics.npsAverage > 0 ? 'text-amber-600' : 'text-red-600' },
                { label: 'At Risk', value: data.analytics.atRiskCount.toString(), color: data.analytics.atRiskCount > 0 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Save Rate', value: `${data.analytics.saveOfferAcceptRate}%`, color: 'text-blue-600' },
                { label: 'Win-Back Rate', value: `${data.analytics.winBackRate}%`, color: 'text-purple-600' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-rani-border p-3">
                  <span className="text-[10px] font-body text-rani-muted uppercase tracking-wide">{kpi.label}</span>
                  <p className={`text-xl font-heading font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AtRiskMemberList
                  members={data.atRiskMembers}
                  limit={8}
                  onViewMember={(id) => window.location.href = `/dashboard/membership/members/${id}`}
                />
                <RetentionActions actions={data.pendingActions} />
              </div>

              <div className="space-y-6">
                <EngagementScore
                  score={data.engagementOverall.score}
                  breakdown={data.engagementOverall.breakdown}
                  trend={data.engagementOverall.trend}
                />

                {/* NPS by Tier */}
                <div className="bg-white rounded-xl border border-rani-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <h3 className="text-sm font-heading font-semibold text-rani-navy">NPS by Tier</h3>
                  </div>
                  <div className="space-y-3">
                    {(['halo', 'glow', 'elite'] as const).map((tier) => {
                      const nps = data.analytics.npsByTier[tier];
                      const labels = { halo: 'Halo', glow: 'Glow', elite: 'Elite' };
                      return (
                        <div key={tier} className="flex items-center justify-between">
                          <span className="text-sm font-body text-rani-text">{labels[tier]}</span>
                          <span className={`text-sm font-body font-bold ${
                            nps > 50 ? 'text-emerald-600' : nps > 0 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {nps}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top churn reasons */}
                <div className="bg-white rounded-xl border border-rani-border p-4">
                  <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Top Churn Reasons</h3>
                  <div className="space-y-2">
                    {data.analytics.topChurnReasons.slice(0, 5).map((reason) => (
                      <div key={reason.reason} className="flex items-center justify-between">
                        <span className="text-xs font-body text-rani-text capitalize">
                          {reason.reason.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-body font-semibold text-rani-navy">{reason.count}</span>
                          <span className="text-[10px] font-body text-rani-muted">{reason.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retention by tier */}
                <div className="bg-white rounded-xl border border-rani-border p-4">
                  <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Retention by Tier</h3>
                  <div className="space-y-3">
                    {(['halo', 'glow', 'elite'] as const).map((tier) => {
                      const rate = data.analytics.retentionByTier[tier];
                      const labels = { halo: 'Halo', glow: 'Glow', elite: 'Elite' };
                      return (
                        <div key={tier}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-body text-rani-muted">{labels[tier]}</span>
                            <span className={`text-xs font-body font-bold ${rate > 90 ? 'text-emerald-600' : rate > 80 ? 'text-amber-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${rate > 90 ? 'bg-emerald-500' : rate > 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
