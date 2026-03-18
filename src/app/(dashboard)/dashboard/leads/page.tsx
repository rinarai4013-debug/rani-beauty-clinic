'use client';

import { motion } from 'framer-motion';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { LeadFunnelData } from '@/types/dashboard';

const FUNNEL_EMOJIS: Record<string, string> = {
  'New Lead': '🌟',
  'Contacted': '📱',
  'Consult Booked': '📅',
  'Consult Completed': '✅',
  'Treatment Plan Sent': '📋',
  'Deposit Collected': '💳',
  'Active': '🎉',
  'Lost': '❌',
};

export default function LeadFunnelPage() {
  const { data, isLoading, error, mutate } = useDashboardData<LeadFunnelData>('/leads', { refreshInterval: 60000 });

  const stages = data?.stages || [];
  const metrics = data?.metrics;
  const rates = data?.conversionRates;
  const sources = data?.topLeadSources || [];
  const totalInFunnel = stages.reduce((s, st) => s + st.count, 0);

  return (
    <DashboardErrorBoundary pageName="Lead Funnel">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Lead + Consult Funnel</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">From first touch to conversion</p>
        </div>

        {/* KPI Row */}
        {isLoading ? (
          <KPIRowSkeleton />
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
            <KPICard
              title="New Leads (Week)"
              value={metrics?.newLeads ?? 0}
              trend={{ value: 0, direction: 'flat', label: 'vs last week' }}
              icon="users"
              size="hero"
            />
            <KPICard
              title="Avg Response Time"
              value={data?.avgResponseTime ?? 0}
              suffix=" min"
              icon="target"
            />
            <KPICard
              title="Consult Close Rate"
              value={rates?.consultCloseRate ?? 0}
              suffix="%"
              trend={{ value: 0, direction: 'flat' }}
              icon="target"
            />
            <KPICard
              title="Avg Treatment Plan"
              value={data?.avgTreatmentPlanValue ?? 0}
              prefix="$"
            />
          </div>
        )}

        {/* Funnel Visualization */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-6">
            Conversion Funnel {totalInFunnel > 0 && <span className="text-rani-muted font-normal">({totalInFunnel} total)</span>}
          </h3>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-6 w-6 bg-gray-200 rounded" />
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="flex-1 h-8 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <InlineError message="Failed to load funnel data" onRetry={() => mutate()} />
          ) : stages.length === 0 || totalInFunnel === 0 ? (
            <DashboardEmptyState
              icon="users"
              title="No leads in the funnel yet"
              description="Add client statuses in Airtable to populate the funnel visualization."
              compact
            />
          ) : (
            <div className="space-y-3">
              {stages.map((stage, i) => (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2 sm:gap-4"
                >
                  <span className="text-base sm:text-lg w-6 sm:w-8 text-center flex-shrink-0">{FUNNEL_EMOJIS[stage.name] || '📊'}</span>
                  <span className="text-xs sm:text-sm font-body font-medium text-rani-text w-28 sm:w-44 truncate flex-shrink-0">{stage.name}</span>
                  <div className="flex-1 min-w-0">
                    <div className="w-full bg-rani-border/30 rounded-full h-6 sm:h-8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(stage.percentage, 3)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full flex items-center justify-end pr-2 sm:pr-3"
                        style={{ backgroundColor: stage.color + '30' }}
                      >
                        <span className="text-[10px] sm:text-xs font-body font-bold text-rani-navy">
                          {stage.count}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-body text-rani-muted w-10 sm:w-12 text-right flex-shrink-0">{stage.percentage}%</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Rates + Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Conversion Rates */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Conversion Rates
            </h3>
            {isLoading ? (
              <div className="animate-pulse grid grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-gray-100 rounded-full" />
                    <div className="h-2 w-24 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <ProgressRing value={rates?.leadToConsult ?? 0} label="Lead → Consult" size={90} />
                <ProgressRing value={rates?.consultShowRate ?? 0} label="Consult Show Rate" size={90} />
                <ProgressRing value={rates?.consultCloseRate ?? 0} label="Consult Close Rate" size={90} />
                <ProgressRing value={rates?.depositCaptureRate ?? 0} label="Deposit Capture" size={90} />
              </div>
            )}
          </div>

          {/* Lead Sources */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Lead Sources
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                    <div className="h-3 w-8 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : sources.length === 0 ? (
              <DashboardEmptyState
                icon="trending"
                title="No source data yet"
                description="Lead source tracking will appear once leads are tagged with their origin."
                compact
              />
            ) : (
              <div className="space-y-3">
                {sources.map((src) => (
                  <div key={src.source} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-body font-medium text-rani-text w-20 sm:w-24 truncate flex-shrink-0">{src.source}</span>
                    <div className="flex-1 min-w-0">
                      <ProgressBar current={src.count} target={20} showPercentage={false} height={6} colorMode="gold" />
                    </div>
                    <span className="text-xs font-body font-semibold text-rani-navy w-8 text-right flex-shrink-0">{src.count}</span>
                    <span className={`text-xs font-body px-1.5 py-0.5 rounded flex-shrink-0 ${src.conversionRate >= 50 ? 'bg-green-50 text-green-600' : 'text-rani-muted'}`}>
                      {src.conversionRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
