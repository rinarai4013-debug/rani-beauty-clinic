'use client';

import { CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import type { TaskMetrics } from '@/types/crm';

interface TaskMetricsPanelProps {
  metrics: TaskMetrics;
}

export default function TaskMetricsPanel({ metrics }: TaskMetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <Clock className="w-3 h-3" />
          Pending Tasks
        </div>
        <p className="text-lg font-heading text-rani-navy">{metrics.totalPending}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 bg-red-50/50 p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-red-600 mb-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </div>
        <p className="text-lg font-heading text-red-600">{metrics.totalOverdue}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 bg-green-50/50 p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-green-600 mb-1">
          <CheckCircle2 className="w-3 h-3" />
          Completed Today
        </div>
        <p className="text-lg font-heading text-green-600">{metrics.completedToday}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <BarChart3 className="w-3 h-3" />
          Completion Rate
        </div>
        <p className="text-lg font-heading text-rani-navy">{metrics.completionRate}%</p>
      </div>
    </div>
  );
}
