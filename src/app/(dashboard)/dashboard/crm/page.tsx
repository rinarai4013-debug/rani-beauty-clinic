'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useCRMOverview } from '@/hooks/useCRMData';
import { CRMStatsRow, PipelineFunnel, TaskBoard, StaleLeadAlert } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { CRMOverviewData } from '@/types/crm';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function useLastUpdated(data: unknown) {
  const ref = useRef<Date | null>(null);
  useEffect(() => { if (data) ref.current = new Date(); }, [data]);
  return ref.current;
}

export default function CRMOverviewPage() {
  const { data, isLoading, error, mutate } = useCRMOverview();
  const overview = data as CRMOverviewData | undefined;
  const lastUpdated = useLastUpdated(data);

  return (
    <DashboardErrorBoundary pageName="CRM">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">CRM Command Center</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Pipeline, lifecycle, segments, automations, and task management
            </p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-body text-rani-muted">
              <Clock className="w-3 h-3" />
              <span>Last updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {error ? (
          <InlineError message="Failed to load CRM data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-6">
            <PanelSkeleton />
            <PanelSkeleton />
            <PanelSkeleton />
          </div>
        ) : !overview ? (
          <DashboardEmptyState title="No CRM Data" description="Start by adding leads to your pipeline." />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            {/* KPI Stats Row */}
            <motion.div variants={item}>
              <CRMStatsRow data={overview} />
            </motion.div>

            {/* Stale Lead Alerts */}
            {overview.pipeline.staleLeadCount > 0 && (
              <motion.div variants={item}>
                <StaleLeadAlert leads={(overview.pipeline.staleLeads ?? []) as never} />
              </motion.div>
            )}

            {/* Pipeline Funnel + Today's Tasks */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <motion.div variants={item}>
                <PipelineFunnel metrics={overview.pipeline} />
              </motion.div>
              <motion.div variants={item}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Today&apos;s Tasks
                  </h3>
                  <div className="space-y-2">
                    {overview.tasks.overdueTasks.length > 0 ? (
                      overview.tasks.overdueTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg text-xs border border-red-200">
                          <div>
                            <span className="font-medium text-rani-navy">{task.title}</span>
                            {task.clientName && <span className="text-rani-muted ml-1">- {task.clientName}</span>}
                          </div>
                          <span className="text-red-600 text-[10px] font-medium">{task.hoursOverdue}h overdue</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-rani-muted text-center py-4">No overdue tasks</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div variants={item}>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Recent Activity
                </h3>
                {overview.recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {overview.recentActivity.slice(0, 10).map(event => (
                      <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-xs">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${event.color}`}>
                          <span className="text-[10px]">{event.type.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-rani-navy">{event.title}</span>
                          <p className="text-[10px] text-rani-muted truncate">{event.description}</p>
                        </div>
                        <span className="text-[10px] text-rani-muted shrink-0">
                          {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rani-muted text-center py-4">No recent activity</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
