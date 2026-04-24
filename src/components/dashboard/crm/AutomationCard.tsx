'use client';

import { Play, Pause, Clock3, Sparkles } from 'lucide-react';
import type { AutomationRecipe } from '@/types/crm';

interface AutomationCardProps {
  automation: AutomationRecipe;
  onToggle: (_id: string, _enabled: boolean) => void;
}

const CATEGORY_LABELS: Record<AutomationRecipe['category'], string> = {
  lead_nurture: 'Lead Nurture',
  post_treatment: 'Post-Treatment',
  retention: 'Retention',
  reactivation: 'Reactivation',
  vip: 'VIP',
  membership: 'Membership',
  seasonal: 'Seasonal',
  review: 'Review',
  referral: 'Referral',
  operational: 'Operational',
  birthday: 'Birthday',
  cross_sell: 'Cross-Sell',
};

export default function AutomationCard({ automation, onToggle }: AutomationCardProps) {
  return (
    <div className="rounded-xl border border-rani-border bg-white/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-rani-navy">{automation.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                automation.isEnabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {automation.isEnabled ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="mt-1 text-xs text-rani-muted">{automation.description}</p>
        </div>

        <button
          type="button"
          onClick={() => onToggle(automation.id, !automation.isEnabled)}
          className="inline-flex items-center gap-1 rounded-md border border-rani-border px-2 py-1 text-xs text-rani-navy hover:bg-rani-cream/50"
        >
          {automation.isEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {automation.isEnabled ? 'Pause' : 'Activate'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-rani-cream/40 p-2">
          <p className="text-rani-muted">Category</p>
          <p className="mt-1 font-medium text-rani-navy">{CATEGORY_LABELS[automation.category]}</p>
        </div>
        <div className="rounded-lg bg-rani-cream/40 p-2">
          <p className="text-rani-muted">Trigger</p>
          <p className="mt-1 font-medium text-rani-navy">{automation.trigger.type.replace(/_/g, ' ')}</p>
        </div>
        <div className="rounded-lg bg-rani-cream/40 p-2">
          <p className="text-rani-muted">Executions</p>
          <p className="mt-1 font-medium text-rani-navy">{automation.executionCount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-rani-cream/40 p-2">
          <p className="text-rani-muted">Success Rate</p>
          <p className="mt-1 font-medium text-rani-navy">{automation.successRate}%</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-rani-muted">
        <div className="inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-rani-gold" />
          ${automation.avgRevenueGenerated.toLocaleString()} avg revenue
        </div>
        <div className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {automation.actions.length} actions
        </div>
      </div>
    </div>
  );
}
