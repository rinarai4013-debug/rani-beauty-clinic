'use client';

import { motion } from 'framer-motion';
import { Radar, TrendingUp, TrendingDown, Minus, Eye, Building2, Layers, Calendar } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, TableSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';

interface CompetitorEntry {
  id: string;
  competitorName: string;
  serviceMonitored: string;
  theirPrice: number;
  ourPrice: number;
  pricingDelta: number;
  pricingDeltaPercent: number;
  lastScanDate: string;
  sourceUrl: string;
  notes: string;
  trend: string;
  status: string;
}

interface CompetitorStats {
  uniqueCompetitors: number;
  servicesTracked: number;
  avgPricingDelta: number;
  lastScanDate: string | null;
  totalEntries: number;
}

interface CompetitorResponse {
  success: boolean;
  data: {
    competitors: CompetitorEntry[];
    stats: CompetitorStats;
  };
}

function useCompetitorIntel() {
  return useDashboardData<CompetitorResponse>('/competitor-intel', {
    refreshInterval: 300000, // 5 min
  });
}

const TREND_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  up: { icon: TrendingUp, color: 'text-red-500', label: 'Increasing' },
  down: { icon: TrendingDown, color: 'text-green-500', label: 'Decreasing' },
  stable: { icon: Minus, color: 'text-gray-400', label: 'Stable' },
};

export default function CompetitorIntelPage() {
  return (
    <DashboardErrorBoundary pageName="Competitor Intelligence">
      <CompetitorIntelContent />
    </DashboardErrorBoundary>
  );
}

function CompetitorIntelContent() {
  const { data: raw, isLoading, error, mutate } = useCompetitorIntel();
  const data = raw?.data;

  const competitors = data?.competitors || [];
  const stats = data?.stats;

  /* ─── Error State ──────────────────────────────────────────────── */
  if (error) {
    return <InlineError message="Failed to load competitor intelligence" onRetry={() => mutate()} />;
  }

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-56" />
          <SkeletonBar className="h-3 w-80" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={3} />
        <TableSkeleton rows={6} cols={7} />
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────────────── */
  if (!data || competitors.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Competitor Intelligence</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Automated competitive intelligence monitoring</p>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rani-gold/20 flex items-center justify-center flex-shrink-0">
              <Radar className="w-5 h-5 text-rani-gold" />
            </div>
            <div>
              <h3 className="text-sm font-body font-semibold text-rani-gold mb-2">How Competitor Scanning Works</h3>
              <p className="text-xs sm:text-sm font-body text-white/80 leading-relaxed">
                Competitor scanning runs weekly via n8n automation. Results are stored in the Competitor Intelligence table.
                Once scan data populates, you will see pricing comparisons, market positioning, and trend analysis for all monitored competitors.
              </p>
            </div>
          </div>
        </motion.div>

        <DashboardEmptyState
          icon="search"
          title="No Competitor Data Yet"
          description="Competitor intelligence will appear here after the first weekly scan completes. The n8n workflow scans 11 competitors every Monday at 6 AM."
        />
      </div>
    );
  }

  const lastScanFormatted = stats?.lastScanDate
    ? new Date(stats.lastScanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Competitor Intelligence</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Automated competitive intelligence monitoring</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <KPICard title="Competitors Tracked" value={stats?.uniqueCompetitors || 0} icon="users" size="hero" />
        <KPICard title="Services Monitored" value={stats?.servicesTracked || 0} icon="layers" />
        <KPICard
          title="Avg Pricing Delta"
          value={Math.abs(stats?.avgPricingDelta || 0)}
          suffix="%"
          prefix={stats?.avgPricingDelta && stats.avgPricingDelta >= 0 ? '+' : '-'}
          icon="trending-up"
        />
        <KPICard title="Total Entries" value={stats?.totalEntries || 0} icon="database" />
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Radar className="w-5 h-5 text-rani-gold flex-shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-body font-semibold text-rani-gold">Weekly Competitive Scan</h3>
              <p className="text-xs font-body text-white/70 mt-0.5">
                Automated via n8n workflow - runs every Monday at 6 AM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-body text-white/60">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last scan: {lastScanFormatted}</span>
          </div>
        </div>
      </motion.div>

      {/* Competitor Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Pricing Comparison
        </h3>
        <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
          <table className="w-full text-xs sm:text-sm font-body">
            <thead>
              <tr className="border-b border-rani-border">
                <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Competitor</th>
                <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Service</th>
                <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">Their Price</th>
                <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">Our Price</th>
                <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Delta</th>
                <th className="text-center py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden md:table-cell">Trend</th>
                <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden lg:table-cell">Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((comp, i) => {
                const trendInfo = TREND_ICONS[comp.trend] || TREND_ICONS.stable;
                const TrendIcon = trendInfo.icon;
                const deltaColor = comp.pricingDeltaPercent > 0
                  ? 'text-green-600' // We charge more
                  : comp.pricingDeltaPercent < 0
                    ? 'text-red-600' // We charge less
                    : 'text-gray-500';

                return (
                  <motion.tr
                    key={comp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-rani-border/50 hover:bg-rani-cream/30"
                  >
                    <td className="py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-rani-muted flex-shrink-0" />
                        <span className="font-medium text-rani-navy truncate max-w-[100px] sm:max-w-none">{comp.competitorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-rani-text truncate max-w-[100px] sm:max-w-none">{comp.serviceMonitored}</td>
                    <td className="py-3 px-2 sm:px-3 text-right text-rani-muted hidden sm:table-cell">${comp.theirPrice.toLocaleString()}</td>
                    <td className="py-3 px-2 sm:px-3 text-right font-semibold text-rani-navy hidden sm:table-cell">${comp.ourPrice.toLocaleString()}</td>
                    <td className="py-3 px-2 sm:px-3 text-right">
                      <span className={`font-semibold ${deltaColor}`}>
                        {comp.pricingDeltaPercent > 0 ? '+' : ''}{comp.pricingDeltaPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-3 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon className={`w-3.5 h-3.5 ${trendInfo.color}`} />
                        <span className="text-[10px] text-rani-muted">{trendInfo.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-right text-rani-muted text-xs hidden lg:table-cell">
                      {comp.lastScanDate
                        ? new Date(comp.lastScanDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : ' - '}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section - show any entries with notes */}
      {competitors.some(c => c.notes) && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Intel Notes
          </h3>
          <div className="space-y-3">
            {competitors
              .filter(c => c.notes)
              .map((comp, i) => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-rani-cream/30"
                >
                  <Eye className="w-4 h-4 text-rani-gold flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-body font-semibold text-rani-navy">
                      {comp.competitorName} - {comp.serviceMonitored}
                    </p>
                    <p className="text-xs font-body text-rani-muted mt-1">{comp.notes}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
