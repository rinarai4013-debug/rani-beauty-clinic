'use client';

import { Bot, Calendar, Clock3, Play, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import type { AutomationRecipe } from '@/types/crm';

type AutomationCardProps = {
  automation: AutomationRecipe;
  onToggle?: (id: string, enabled: boolean) => void;
};

function formatCategory(category: AutomationRecipe['category']) {
  return category.replace(/_/g, ' ');
}

function formatLastExecuted(value?: string) {
  if (!value) return 'Never run';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function AutomationCard({ automation, onToggle }: AutomationCardProps) {
  const triggerLabel =
    automation.trigger.event ??
    automation.trigger.schedule ??
    automation.trigger.segment ??
    automation.trigger.type;

  return (
    <div className="rounded-xl border border-rani-navy/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rani-gold/10 text-rani-gold">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-heading text-rani-navy">{automation.name}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-rani-muted">
                {formatCategory(automation.category)}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm font-body leading-relaxed text-rani-muted">
            {automation.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggle?.(automation.id, !automation.isEnabled)}
          className="rounded-md p-1 text-rani-muted transition-colors hover:bg-rani-navy/5 hover:text-rani-navy"
          aria-label={automation.isEnabled ? 'Pause automation' : 'Enable automation'}
        >
          {automation.isEnabled ? (
            <ToggleRight className="h-6 w-6 text-emerald-600" />
          ) : (
            <ToggleLeft className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-body">
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-rani-muted">
            <Play className="h-3.5 w-3.5" />
            Runs
          </div>
          <div className="mt-1 text-sm font-semibold text-rani-navy">
            {automation.executionCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-rani-navy/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-rani-muted">
            <Sparkles className="h-3.5 w-3.5" />
            Success
          </div>
          <div className="mt-1 text-sm font-semibold text-rani-navy">
            {automation.successRate}%
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs font-body text-rani-muted">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            Trigger
          </span>
          <span className="truncate text-rani-navy">{triggerLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Last run
          </span>
          <span className="text-rani-navy">{formatLastExecuted(automation.lastExecutedAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-rani-navy/10 pt-3 text-xs font-body">
        <span className={automation.isEnabled ? 'text-emerald-700' : 'text-amber-700'}>
          {automation.isEnabled ? 'Active' : 'Paused'}
        </span>
        <span className="text-rani-navy">
          ${automation.avgRevenueGenerated.toLocaleString()} avg revenue
        </span>
      </div>
    </div>
  );
}
