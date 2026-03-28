'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, RefreshCw } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { ChannelComparison, AttributionSankey } from '@/components/dashboard/marketing';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/lib/utils/formatters';
import type { AttributionModel, AttributionComparison, ChannelPerformance } from '@/lib/marketing/attribution';

interface AttributionData {
  channelPerformance: ChannelPerformance[];
  modelComparison: AttributionComparison[];
  journeyStats: {
    avgTouchpointsConverted: number;
    avgDaysToConvert: number;
    medianTouchpointsConverted: number;
    mostCommonFirstChannel: string | null;
    mostCommonLastChannel: string | null;
  };
  kpis: {
    totalConversions: number;
    totalRevenue: number;
    avgCPA: number;
    overallROAS: number;
  };
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AttributionPage() {
  const { data, isLoading, retry } = useDashboardData<AttributionData>('/marketing/attribution', {
    refreshInterval: 300000,
  });
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('position_based');

  return (
    <DashboardErrorBoundary pageName="Attribution">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Marketing Attribution</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Multi-touch attribution with 5 models to understand channel impact
            </p>
          </div>
          <button onClick={retry} className="p-2 rounded-lg border border-rani-border/30 hover:bg-rani-cream transition-colors">
            <RefreshCw className="w-4 h-4 text-rani-muted" />
          </button>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Conversions" value={data?.kpis?.totalConversions ?? 0} icon="target" />
              <KPICard title="Revenue" value={data?.kpis?.totalRevenue ?? 0} prefix="$" icon="dollar-sign" />
              <KPICard title="Avg CPA" value={data?.kpis?.avgCPA ?? 0} prefix="$" icon="dollar-sign" />
              <KPICard title="ROAS" value={data?.kpis?.overallROAS ?? 0} suffix="x" icon="target" />
            </div>
          )}
        </motion.div>

        {/* Attribution model comparison */}
        <motion.div variants={item}>
          <AttributionSankey
            comparisons={data?.modelComparison || []}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            loading={isLoading}
          />
        </motion.div>

        {/* Channel performance table */}
        <motion.div variants={item}>
          <ChannelComparison channels={data?.channelPerformance || []} loading={isLoading} />
        </motion.div>

        {/* Journey stats */}
        <motion.div variants={item}>
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
              <GitBranch className="w-4 h-4" />
              Customer Journey Insights
            </h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xl font-heading font-bold text-rani-navy">{data?.journeyStats?.avgTouchpointsConverted ?? 0}</div>
                  <div className="text-[10px] font-body text-rani-muted">Avg Touchpoints</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-heading font-bold text-rani-navy">{data?.journeyStats?.avgDaysToConvert ?? 0}d</div>
                  <div className="text-[10px] font-body text-rani-muted">Avg Days to Convert</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-heading font-bold text-rani-navy">{data?.journeyStats?.medianTouchpointsConverted ?? 0}</div>
                  <div className="text-[10px] font-body text-rani-muted">Median Touchpoints</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-heading font-bold text-rani-navy capitalize">
                    {(data?.journeyStats?.mostCommonFirstChannel || '-').replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] font-body text-rani-muted">Top First Touch</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-heading font-bold text-rani-navy capitalize">
                    {(data?.journeyStats?.mostCommonLastChannel || '-').replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] font-body text-rani-muted">Top Last Touch</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
