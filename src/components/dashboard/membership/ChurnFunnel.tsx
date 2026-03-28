'use client';

import { AlertTriangle, ArrowDown, CheckCircle, XCircle } from 'lucide-react';
import type { ChurnRates } from '@/lib/membership/analytics';

interface ChurnFunnelProps {
  churnRate: ChurnRates;
  atRiskCount: number;
  totalActive: number;
}

export default function ChurnFunnel({ churnRate, atRiskCount, totalActive }: ChurnFunnelProps) {
  const stages = [
    {
      label: 'Active Members',
      count: totalActive,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'At Risk',
      count: atRiskCount,
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Voluntary Churn',
      count: `${churnRate.voluntary}%`,
      icon: XCircle,
      color: 'text-red-500 bg-red-50',
    },
    {
      label: 'Involuntary Churn',
      count: `${churnRate.involuntary}%`,
      icon: XCircle,
      color: 'text-red-400 bg-red-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Churn Funnel</h3>

      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div key={stage.label}>
            <div className={`flex items-center justify-between p-3 rounded-lg ${stage.color.split(' ')[1]}`}>
              <div className="flex items-center gap-2">
                <stage.icon className={`w-4 h-4 ${stage.color.split(' ')[0]}`} />
                <span className="text-sm font-body text-rani-text">{stage.label}</span>
              </div>
              <span className={`text-sm font-body font-bold ${stage.color.split(' ')[0]}`}>
                {stage.count}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-4 h-4 text-rani-muted" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-rani-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-rani-muted">Net Churn Rate</span>
          <span className={`text-sm font-body font-bold ${churnRate.netChurn > 5 ? 'text-red-600' : churnRate.netChurn > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {churnRate.netChurn}%
          </span>
        </div>
      </div>
    </div>
  );
}
