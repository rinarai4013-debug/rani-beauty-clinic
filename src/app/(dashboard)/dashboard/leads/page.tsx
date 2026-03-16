'use client';

import { motion } from 'framer-motion';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-purple-100 text-purple-700',
  contacted: 'bg-blue-100 text-blue-700',
  consult_booked: 'bg-rani-gold/20 text-rani-navy',
  converted: 'bg-green-100 text-green-700',
};

export default function LeadFunnelPage() {
  const { data, isLoading } = useDashboardData<LeadFunnelData>('/leads', { refreshInterval: 60000 });

  const stages = data?.stages || [];
  const metrics = data?.metrics;
  const rates = data?.conversionRates;
  const sources = data?.topLeadSources || [];
  const totalInFunnel = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Lead + Consult Funnel</h1>
        <p className="text-sm font-body text-rani-muted mt-1">From first touch to conversion</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

      {/* Funnel Visualization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-6">
          Conversion Funnel {totalInFunnel > 0 && <span className="text-rani-muted font-normal">({totalInFunnel} total)</span>}
        </h3>
        {isLoading ? (
          <div className="text-center py-8 text-rani-muted font-body text-sm">Loading funnel data...</div>
        ) : stages.length === 0 || totalInFunnel === 0 ? (
          <div className="text-center py-8 text-rani-muted font-body text-sm">
            No funnel data yet. Add client statuses in Airtable to populate the funnel.
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4"
              >
                <span className="text-lg w-8 text-center">{FUNNEL_EMOJIS[stage.name] || '📊'}</span>
                <span className="text-sm font-body font-medium text-rani-text w-44">{stage.name}</span>
                <div className="flex-1">
                  <div className="w-full bg-rani-border/30 rounded-full h-8 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.percentage}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full flex items-center justify-end pr-3"
                      style={{ backgroundColor: stage.color + '30' }}
                    >
                      <span className="text-xs font-body font-bold text-rani-navy">
                        {stage.count}
                      </span>
                    </motion.div>
                  </div>
                </div>
                <span className="text-xs font-body text-rani-muted w-12 text-right">{stage.percentage}%</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Conversion Rates + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rates */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Conversion Rates
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <ProgressRing value={rates?.leadToConsult ?? 0} label="Lead → Consult" size={90} />
            <ProgressRing value={rates?.consultShowRate ?? 0} label="Consult Show Rate" size={90} />
            <ProgressRing value={rates?.consultCloseRate ?? 0} label="Consult Close Rate" size={90} />
            <ProgressRing value={rates?.depositCaptureRate ?? 0} label="Deposit Capture" size={90} />
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Lead Sources
          </h3>
          {sources.length === 0 ? (
            <div className="text-center py-8 text-rani-muted font-body text-sm">
              No source data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((src) => (
                <div key={src.source} className="flex items-center gap-3">
                  <span className="text-sm font-body font-medium text-rani-text w-24">{src.source}</span>
                  <div className="flex-1">
                    <ProgressBar current={src.count} target={20} showPercentage={false} height={6} colorMode="gold" />
                  </div>
                  <span className="text-xs font-body font-semibold text-rani-navy w-8 text-right">{src.count}</span>
                  <span className={`text-xs font-body px-1.5 py-0.5 rounded ${src.conversionRate >= 50 ? 'bg-green-50 text-green-600' : 'text-rani-muted'}`}>
                    {src.conversionRate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
