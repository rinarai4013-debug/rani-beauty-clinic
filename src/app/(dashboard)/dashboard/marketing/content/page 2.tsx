'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { ContentCalendarGrid, ContentPerformanceTable } from '@/components/dashboard/marketing';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { ContentCalendar, ContentPerformance, TopicCluster } from '@/lib/marketing/content-calendar';

interface ContentDashboardData {
  calendar: ContentCalendar;
  performances: ContentPerformance[];
  topicClusters: TopicCluster[];
  kpis: {
    totalPieces: number;
    publishedThisMonth: number;
    avgPerformanceScore: number;
    totalConversions: number;
  };
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ContentPage() {
  const [period, setPeriod] = useState<'30_day' | '60_day' | '90_day'>('30_day');
  const { data, isLoading, retry } = useDashboardData<ContentDashboardData>(
    `/marketing/content?period=${period}`,
    { refreshInterval: 300000 }
  );

  return (
    <DashboardErrorBoundary pageName="Content Calendar">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Content Calendar</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Content planning, performance tracking, and topic coverage
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['30_day', '60_day', '90_day'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                  period === p ? 'bg-rani-navy text-white' : 'bg-rani-cream text-rani-muted hover:text-rani-navy'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
            <button onClick={retry} className="p-2 rounded-lg border border-rani-border/30 hover:bg-rani-cream transition-colors ml-1">
              <RefreshCw className="w-4 h-4 text-rani-muted" />
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Total Planned" value={data?.kpis?.totalPieces ?? 0} icon="calendar" />
              <KPICard title="Published (Month)" value={data?.kpis?.publishedThisMonth ?? 0} />
              <KPICard title="Avg Performance" value={data?.kpis?.avgPerformanceScore ?? 0} suffix="/100" />
              <KPICard title="Conversions" value={data?.kpis?.totalConversions ?? 0} icon="target" />
            </div>
          )}
        </motion.div>

        {/* Calendar grid */}
        <motion.div variants={item}>
          <ContentCalendarGrid
            weeks={data?.calendar?.weeklyBreakdown || []}
            loading={isLoading}
          />
        </motion.div>

        {/* Topic coverage + Performance */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic clusters */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Topic Coverage</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-3">
                {(data?.topicClusters || []).map(cluster => (
                  <div key={cluster.category}>
                    <div className="flex justify-between text-xs font-body mb-1">
                      <span className="text-rani-navy font-medium capitalize">{cluster.category.replace(/_/g, ' ')}</span>
                      <span className="text-rani-muted">{cluster.coverageScore}% covered</span>
                    </div>
                    <div className="h-2 rounded-full bg-rani-cream overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          cluster.coverageScore >= 80 ? 'bg-emerald-500' :
                          cluster.coverageScore >= 50 ? 'bg-amber-500' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${cluster.coverageScore}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-body text-rani-muted mt-0.5">{cluster.contentCount} pieces &middot; {cluster.pillarTopic}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance table */}
          <ContentPerformanceTable performances={data?.performances || []} loading={isLoading} />
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
