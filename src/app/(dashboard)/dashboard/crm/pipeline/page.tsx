'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, BarChart3, Kanban } from 'lucide-react';
import { usePipelineKanban, usePipelineForecasts } from '@/hooks/useCRMData';
import { PipelineKanban, PipelineFunnel, ForecastChart, LeadSourceChart, LostLeadAnalysis, StaleLeadAlert } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { CRMKanbanData, PipelineForecast, PipelineLead, PipelineStage } from '@/types/crm';

export default function PipelinePage() {
  const { data, isLoading, error, mutate } = usePipelineKanban();
  const { data: forecasts } = usePipelineForecasts();
  const kanban = data as CRMKanbanData | undefined;
  const forecastData = (forecasts || []) as PipelineForecast[];
  const [view, setView] = useState<'kanban' | 'funnel'>('kanban');

  const handleLeadClick = (_lead: PipelineLead) => {
    // Navigate to lead detail
  };

  const handleStageDrop = (_leadId: string, _toStage: PipelineStage) => {
    // Handle drag-and-drop stage transition via API
  };

  return (
    <DashboardErrorBoundary pageName="Pipeline">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Sales Pipeline</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Track leads from first touch to VIP client
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  view === 'kanban' ? 'bg-white text-rani-navy shadow-sm' : 'text-rani-muted'
                }`}
                onClick={() => setView('kanban')}
              >
                <Kanban className="w-3 h-3" />
                Kanban
              </button>
              <button
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  view === 'funnel' ? 'bg-white text-rani-navy shadow-sm' : 'text-rani-muted'
                }`}
                onClick={() => setView('funnel')}
              >
                <BarChart3 className="w-3 h-3" />
                Funnel
              </button>
            </div>
            <button className="flex items-center gap-1 bg-rani-navy text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-rani-navy/90">
              <Plus className="w-3 h-3" />
              Add Lead
            </button>
          </div>
        </div>

        {error ? (
          <InlineError message="Failed to load pipeline data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <PanelSkeleton />
        ) : !kanban ? (
          <DashboardEmptyState title="Pipeline Empty" description="Add your first lead to get started." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Pipeline KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
                <p className="text-[10px] text-rani-muted">Total Leads</p>
                <p className="text-lg font-heading text-rani-navy">{kanban.metrics.totalLeads}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
                <p className="text-[10px] text-rani-muted">Win Rate</p>
                <p className="text-lg font-heading text-rani-navy">{Math.round(kanban.metrics.winRate)}%</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
                <p className="text-[10px] text-rani-muted">Avg Velocity</p>
                <p className="text-lg font-heading text-rani-navy">{kanban.metrics.pipelineVelocity}d</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
                <p className="text-[10px] text-rani-muted">Stale Leads</p>
                <p className={`text-lg font-heading ${kanban.metrics.staleLeadCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {kanban.metrics.staleLeadCount}
                </p>
              </div>
            </div>

            {/* Main View */}
            {view === 'kanban' ? (
              <PipelineKanban
                stages={kanban.stages}
                onLeadClick={handleLeadClick}
                onStageDrop={handleStageDrop}
              />
            ) : (
              <PipelineFunnel metrics={kanban.metrics} />
            )}

            {/* Analytics Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ForecastChart forecasts={forecastData} />
              <LeadSourceChart revenueBySource={kanban.metrics.revenueBySource} />
            </div>

            {/* Lost Lead Analysis */}
            <LostLeadAnalysis lostByReason={kanban.metrics.lostLeadsByReason} />
          </motion.div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
