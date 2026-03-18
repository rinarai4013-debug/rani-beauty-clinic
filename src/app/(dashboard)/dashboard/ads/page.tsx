'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, MousePointer, Users, RefreshCw, Megaphone } from 'lucide-react';
import { DashboardErrorBoundary, KPIRowSkeleton, TableSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Campaign {
  id: string; name: string; status: string; spend: number; impressions: number;
  clicks: number; conversions: number; cpa: number; roas: number; ctr: number; cpc: number;
}
interface MetaAdsData {
  summary: { totalSpend: number; totalImpressions: number; totalClicks: number; totalConversions: number; avgCPA: number; avgROAS: number; avgCTR: number };
  campaigns: Campaign[]; dateRange: string; error?: string; message?: string;
}

function formatCurrency(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); }
function formatNumber(value: number) { return new Intl.NumberFormat('en-US').format(value); }

export default function AdsPage() {
  const { data, error, isLoading, mutate } = useSWR<MetaAdsData>('/api/dashboard/meta-ads', fetcher, { refreshInterval: 300000 });

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <KPIRowSkeleton />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Ad Performance</h1></div>
        <InlineError message="Failed to load ad data. Check your connection." onRetry={() => mutate()} />
      </div>
    );
  }

  if (data.error && !data.summary) {
    return (
      <DashboardErrorBoundary pageName="Ads">
        <div className="space-y-6 sm:space-y-8">
          <div><h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Ad Performance</h1></div>
          <div className="rounded-2xl border border-rani-gold/20 bg-rani-gold/5 p-6 sm:p-8 text-center">
            <Megaphone className="w-12 h-12 text-rani-gold mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-heading text-rani-navy mb-2">Meta Ads Not Configured</h2>
            <p className="text-xs sm:text-sm font-body text-rani-muted max-w-md mx-auto">
              Add <code className="bg-rani-cream px-1.5 py-0.5 rounded text-xs">META_ACCESS_TOKEN</code> and{' '}
              <code className="bg-rani-cream px-1.5 py-0.5 rounded text-xs">META_AD_ACCOUNT_ID</code> to connect.
            </p>
          </div>
        </div>
      </DashboardErrorBoundary>
    );
  }

  const { summary, campaigns, dateRange } = data;
  const kpis = [
    { label: 'Total Spend', value: formatCurrency(summary.totalSpend), icon: DollarSign, color: 'text-red-500' },
    { label: 'Leads Generated', value: formatNumber(summary.totalConversions), icon: Users, color: 'text-green-500' },
    { label: 'Cost Per Lead', value: formatCurrency(summary.avgCPA), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Avg CTR', value: `${summary.avgCTR}%`, icon: MousePointer, color: 'text-purple-500' },
  ];

  return (
    <DashboardErrorBoundary pageName="Ads">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Ad Performance</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">{dateRange}</p>
          </div>
          <button onClick={() => mutate()} className="inline-flex items-center gap-2 rounded-xl border border-rani-border px-3 sm:px-4 py-2 text-sm font-body font-medium text-rani-navy hover:bg-rani-cream transition-colors self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-rani-border bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-body font-semibold uppercase tracking-wider text-rani-muted">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color}`} />
              </div>
              <p className="text-lg sm:text-2xl font-heading text-rani-navy">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaign Table */}
        <div className="rounded-2xl border border-rani-border bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-rani-border">
            <h2 className="text-sm sm:text-base font-heading text-rani-navy">Campaign Performance</h2>
          </div>
          {campaigns.length === 0 ? (
            <DashboardEmptyState icon="megaphone" title="No active campaigns" description="Campaign data will appear once ads are running." compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body min-w-[700px]">
                <thead>
                  <tr className="border-b border-rani-border bg-rani-cream/50">
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">Campaign</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">Status</th>
                    <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">Spend</th>
                    <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">Clicks</th>
                    <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">CTR</th>
                    <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">Leads</th>
                    <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">CPA</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-rani-muted">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-rani-border last:border-0 hover:bg-rani-cream/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-rani-navy max-w-[200px] truncate">{c.name}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : c.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-rani-navy">{formatCurrency(c.spend)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-rani-muted">{formatNumber(c.clicks)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-rani-muted">{c.ctr}%</td>
                      <td className="px-3 sm:px-4 py-3 text-right font-medium text-rani-navy">{c.conversions}</td>
                      <td className="px-3 sm:px-4 py-3 text-right text-rani-navy">{c.cpa > 0 ? formatCurrency(c.cpa) : '—'}</td>
                      <td className="px-4 sm:px-6 py-3 text-right font-medium">
                        <span className={c.roas >= 3 ? 'text-green-600' : c.roas >= 1 ? 'text-yellow-600' : 'text-red-500'}>{c.roas > 0 ? `${c.roas}x` : '—'}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
