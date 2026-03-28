'use client';

import { Zap, Play, DollarSign, BarChart3 } from 'lucide-react';
import type { AutomationMetrics } from '@/types/crm';

interface AutomationMetricsPanelProps {
  metrics: AutomationMetrics;
}

export default function AutomationMetricsPanel({ metrics }: AutomationMetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <Zap className="w-3 h-3" />
          Active Automations
        </div>
        <p className="text-lg font-heading text-rani-navy">{metrics.activeAutomations}/{metrics.totalAutomations}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <Play className="w-3 h-3" />
          Executions Today
        </div>
        <p className="text-lg font-heading text-rani-navy">{metrics.executionsToday}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <BarChart3 className="w-3 h-3" />
          Weekly Executions
        </div>
        <p className="text-lg font-heading text-rani-navy">{metrics.executionsThisWeek}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-1">
          <DollarSign className="w-3 h-3" />
          Revenue Generated
        </div>
        <p className="text-lg font-heading text-rani-navy">${metrics.totalRevenueGenerated.toLocaleString()}</p>
      </div>
    </div>
  );
}
