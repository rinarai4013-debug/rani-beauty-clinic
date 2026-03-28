'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, BarChart3, TrendingUp, Award } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProviderComparison } from '@/hooks/useProviderData';
import KPICard from '@/components/dashboard/cards/KPICard';
import { ProviderRankingCard, ProviderComparisonTable, LeaderboardTable } from '@/components/dashboard/providers';
import { DashboardErrorBoundary, PanelSkeleton, KPIRowSkeleton, InlineError } from '@/components/dashboard/shared';

interface ProviderOverview {
  id: string;
  name: string;
  role: string;
  color: string;
  revenue: number;
  utilization: number;
  rebookRate: number;
  avgRating: number;
  trend: 'up' | 'down' | 'flat';
  appointmentsToday: number;
}

export default function ProvidersOverviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('monthly');
  const { data: providers, isLoading, error, mutate } = useDashboardData<ProviderOverview[]>(
    `/providers?period=${period}`,
    { refreshInterval: 60000 },
  );
  const { data: comparison } = useProviderComparison(period);

  if (error) {
    return (
      <DashboardErrorBoundary pageName="Provider Overview">
        <InlineError message="Failed to load provider data" onRetry={() => mutate()} />
      </DashboardErrorBoundary>
    );
  }

  const totalRevenue = providers?.reduce((sum, p) => sum + p.revenue, 0) ?? 0;
  const avgUtilization = providers && providers.length > 0
    ? Math.round(providers.reduce((sum, p) => sum + p.utilization, 0) / providers.length)
    : 0;
  const avgRebook = providers && providers.length > 0
    ? Math.round(providers.reduce((sum, p) => sum + p.rebookRate, 0) / providers.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-rani-navy">Provider Performance</h1>
          <p className="text-sm text-rani-muted font-body mt-1">Track and compare provider metrics</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="text-sm font-body border border-gray-200 rounded-lg px-3 py-2 text-rani-navy focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold"
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <KPIRowSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={totalRevenue} prefix="$" icon="dollar-sign" />
          <KPICard title="Avg Utilization" value={avgUtilization} suffix="%" icon="target" />
          <KPICard title="Avg Rebook Rate" value={avgRebook} suffix="%" icon="calendar" />
          <KPICard title="Active Providers" value={providers?.length ?? 0} icon="users" />
        </div>
      )}

      {/* Provider Rankings */}
      {isLoading ? (
        <PanelSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {providers?.sort((a, b) => b.revenue - a.revenue).map((provider, i) => (
            <ProviderRankingCard
              key={provider.id}
              rank={i + 1}
              name={provider.name}
              role={provider.role}
              revenue={provider.revenue}
              trend={provider.trend}
              utilization={provider.utilization}
              rebookRate={provider.rebookRate}
              avgRating={provider.avgRating}
              color={provider.color}
              onClick={() => router.push(`/dashboard/providers/${encodeURIComponent(provider.name)}`)}
            />
          ))}
        </div>
      )}

      {/* Comparison Table */}
      {comparison && comparison.rankings.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold text-rani-navy mb-4">Provider Comparison</h2>
          <ProviderComparisonTable
            rankings={comparison.rankings}
            providers={comparison.providers.map(p => p.providerName)}
          />
          {comparison.insights.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50 space-y-1">
              {comparison.insights.map((insight, i) => (
                <p key={i} className="text-xs text-rani-muted font-body flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-rani-gold mt-0.5 flex-shrink-0" />
                  {insight}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
