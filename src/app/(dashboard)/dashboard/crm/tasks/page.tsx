'use client';

import { motion } from 'framer-motion';
import { useCRMTasks } from '@/hooks/useCRMData';
import { TaskBoard, TaskMetricsPanel } from '@/components/dashboard/crm';
import { DashboardErrorBoundary, PanelSkeleton, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { CRMTask, TaskMetrics } from '@/types/crm';

export default function TasksPage() {
  const { data, isLoading, error, mutate } = useCRMTasks();
  const tasks = (data?.tasks || []) as CRMTask[];
  const metrics = data?.metrics as TaskMetrics | undefined;

  const handleComplete = (_taskId: string) => {
    // TODO: API call to complete task
  };

  const handleStart = (_taskId: string) => {
    // TODO: API call to start task
  };

  return (
    <DashboardErrorBoundary pageName="Tasks">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Task Management</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Follow-ups, appointments, treatment plans, and team assignments
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load tasks" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-6"><PanelSkeleton /><PanelSkeleton /></div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {metrics && <TaskMetricsPanel metrics={metrics} />}

            {tasks.length === 0 ? (
              <DashboardEmptyState title="No Tasks" description="Tasks are auto-generated from pipeline activity." />
            ) : (
              <TaskBoard
                tasks={tasks}
                onComplete={handleComplete}
                onStart={handleStart}
              />
            )}
          </motion.div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
