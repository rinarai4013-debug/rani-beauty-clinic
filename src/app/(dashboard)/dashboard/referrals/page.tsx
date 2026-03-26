'use client';

import { useState } from 'react';
import { Users, Share2, TrendingUp, Copy, Check, DollarSign } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import ReferralFunnel from '@/components/dashboard/referrals/ReferralFunnel';
import TopReferrers from '@/components/dashboard/referrals/TopReferrers';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { getReferralStatusLabel, getReferralStatusColor, type Referral, type ReferralStats, type TopReferrer as TopReferrerType } from '@/lib/referral/engine';
import { motion } from 'framer-motion';

interface ReferralDashboardData {
  stats: ReferralStats;
  topReferrers: TopReferrerType[];
  revenue: { totalRevenue: number; totalRewardsCost: number; netRevenue: number; roi: number };
  recentReferrals: Referral[];
  activeCodes: { code: string; status: string; createdAt: string }[];
}

export default function ReferralsDashboard() {
  const { data, isLoading, error, mutate } = useDashboardData<ReferralDashboardData>('/referrals', {
    refreshInterval: 120000,
  });

  return (
    <DashboardErrorBoundary pageName="Referrals">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-rani-gold" />
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Referral Program</h1>
            </div>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Track referrals, conversion funnel, and attributed revenue
            </p>
          </div>
        </div>

        {error ? (
          <InlineError message="Failed to load referral data" onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="space-y-6">
            <StatRowSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <>
            {/* Hero KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard
                label="Total Referrals"
                value={formatNumber(data.stats.totalReferrals)}
                sub={`${data.stats.completed + data.stats.rewarded} completed`}
                icon={Users}
              />
              <KPICard
                label="Conversion Rate"
                value={formatPercent(data.stats.conversionRate)}
                sub="sent to completed"
                icon={TrendingUp}
                valueColor={data.stats.conversionRate > 30 ? 'text-emerald-600' : 'text-rani-navy'}
              />
              <KPICard
                label="Revenue Attributed"
                value={formatCurrency(data.revenue.totalRevenue, true)}
                sub={`${formatCurrency(data.revenue.netRevenue, true)} net`}
                icon={DollarSign}
              />
              <KPICard
                label="ROI"
                value={`${data.revenue.roi}%`}
                sub={`${formatCurrency(data.revenue.totalRewardsCost)} in rewards`}
                icon={TrendingUp}
                valueColor={data.revenue.roi > 100 ? 'text-emerald-600' : 'text-amber-600'}
              />
            </div>

            {/* Funnel + Top Referrers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferralFunnel stats={data.stats} />
              <TopReferrers referrers={data.topReferrers} />
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
              <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Recent Referrals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rani-border">
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Code</th>
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Referrer</th>
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Referee</th>
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Source</th>
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Status</th>
                      <th className="text-left py-2 px-3 text-xs font-heading font-semibold text-rani-muted uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentReferrals.map((ref) => (
                      <tr key={ref.id} className="border-b border-rani-border/50 last:border-0">
                        <td className="py-3 px-3">
                          <ReferralCodeBadge code={ref.referralCode} />
                        </td>
                        <td className="py-3 px-3 font-body text-rani-text">{ref.referrerName}</td>
                        <td className="py-3 px-3 font-body text-rani-text">{ref.refereeName || ref.refereeEmail || ' - '}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-rani-muted capitalize">{ref.source || ' - '}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getReferralStatusColor(ref.status)}`}>
                            {getReferralStatusLabel(ref.status)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-rani-muted">
                          {new Date(ref.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Codes Summary */}
            <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
              <h3 className="text-sm font-heading font-semibold text-rani-navy mb-3">Program Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryItem label="Sent" value={data.stats.sent} color="text-yellow-600" />
                <SummaryItem label="Clicked" value={data.stats.clicked} color="text-blue-600" />
                <SummaryItem label="Booked" value={data.stats.booked} color="text-purple-600" />
                <SummaryItem label="Expired" value={data.stats.expired} color="text-gray-400" />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}

function KPICard({ label, value, sub, icon: Icon, valueColor }: {
  label: string; value: string; sub: string; icon: React.ElementType; valueColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-rani-border p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-rani-gold" />
        <span className="text-xs font-body text-rani-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-heading font-bold ${valueColor || 'text-rani-navy'}`}>{value}</p>
      <p className="text-xs font-body text-rani-muted mt-1">{sub}</p>
    </motion.div>
  );
}

function ReferralCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono text-xs bg-rani-cream px-2 py-1 rounded border border-rani-border hover:border-rani-gold/50 transition-colors"
    >
      {code}
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-rani-muted" />}
    </button>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
      <p className="text-xs text-rani-muted">{label}</p>
    </div>
  );
}
