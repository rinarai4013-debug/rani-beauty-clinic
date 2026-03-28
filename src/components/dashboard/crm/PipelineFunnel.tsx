'use client';

import type { PipelineMetrics, PipelineStage } from '@/types/crm';
import { PIPELINE_STAGE_LABELS } from '@/types/crm';
import { STAGE_ORDER } from '@/lib/crm/pipeline';

interface PipelineFunnelProps {
  metrics: PipelineMetrics;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
}

export default function PipelineFunnel({ metrics }: PipelineFunnelProps) {
  const maxCount = Math.max(...Object.values(metrics.leadsByStage), 1);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          Pipeline Funnel
        </h3>
        <div className="text-right">
          <p className="text-xs text-rani-muted">Pipeline Value</p>
          <p className="text-sm font-heading text-rani-navy">{formatCurrency(metrics.totalPipelineValue)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {STAGE_ORDER.map((stage, i) => {
          const count = metrics.leadsByStage[stage] || 0;
          const convRate = metrics.conversionRates[stage] || 0;
          const avgDays = metrics.avgTimePerStage[stage] || 0;
          const width = maxCount > 0 ? Math.max(20, (count / maxCount) * 100) : 20;

          return (
            <div key={stage} className="relative">
              <div className="flex items-center gap-3">
                <div className="w-28 text-right">
                  <span className="text-[10px] font-medium text-rani-navy">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded-r-lg bg-rani-gold/20 flex items-center justify-between px-2 transition-all"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-xs font-semibold text-rani-navy">{count}</span>
                    <span className="text-[10px] text-rani-muted">{avgDays}d avg</span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  {i < STAGE_ORDER.length - 1 && (
                    <span className={`text-[10px] font-medium ${convRate >= 60 ? 'text-green-600' : convRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(convRate)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] text-rani-muted">Win Rate</p>
          <p className="text-sm font-heading text-rani-navy">{Math.round(metrics.winRate)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-rani-muted">Avg Deal</p>
          <p className="text-sm font-heading text-rani-navy">{formatCurrency(metrics.avgDealSize)}</p>
        </div>
        <div>
          <p className="text-[10px] text-rani-muted">Velocity</p>
          <p className="text-sm font-heading text-rani-navy">{metrics.pipelineVelocity}d</p>
        </div>
      </div>
    </div>
  );
}
