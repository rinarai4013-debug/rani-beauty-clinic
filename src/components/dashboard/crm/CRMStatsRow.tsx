'use client';

import { Users, Target, Zap, CheckSquare, TrendingUp, DollarSign } from 'lucide-react';
import type { CRMOverviewData } from '@/types/crm';

interface CRMStatsRowProps {
  data: CRMOverviewData;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
}

export default function CRMStatsRow({ data }: CRMStatsRowProps) {
  const stats = [
    { label: 'Total Pipeline', value: data.pipeline.totalLeads, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pipeline Value', value: formatCurrency(data.pipeline.totalPipelineValue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Win Rate', value: `${Math.round(data.pipeline.winRate)}%`, icon: Target, color: 'text-purple-600 bg-purple-50' },
    { label: 'Active Automations', value: data.automations.activeAutomations, icon: Zap, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Tasks', value: data.tasks.totalPending, icon: CheckSquare, color: 'text-orange-600 bg-orange-50' },
    { label: 'Forecasted Revenue', value: formatCurrency(data.pipeline.forecastedRevenue), icon: TrendingUp, color: 'text-rani-navy bg-rani-gold/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`p-1 rounded ${stat.color}`}>
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-[10px] text-rani-muted">{stat.label}</span>
            </div>
            <p className="text-lg font-heading text-rani-navy">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
