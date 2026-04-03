'use client';

/**
 * AlertFeed — Cross-agent alert list for the command center.
 *
 * Reuses: DataTable visual patterns (sortable, filterable)
 * Follows: existing dashboard table styling from shared/DataTable.tsx
 */

import type { AgentAlert } from '@/types/agent';
import { AGENT_REGISTRY } from '@/lib/agents/registry';
import type { AgentId } from '@/types/agent';

interface AlertFeedProps {
  alerts: AgentAlert[];
  maxItems?: number;
}

const SEVERITY_STYLES = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' },
  high: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'High' },
  medium: { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', label: 'Medium' },
  low: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', label: 'Low' },
};

export default function AlertFeed({ alerts, maxItems = 10 }: AlertFeedProps) {
  const displayed = alerts.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="rounded-xl border border-rani-border bg-white p-6 text-center">
        <p className="text-sm text-rani-muted">No active alerts across any agent.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rani-border bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-rani-border bg-rani-cream/50">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-rani-navy">
            Active Alerts
          </h3>
          <span className="text-xs text-rani-muted">
            {alerts.length} total
          </span>
        </div>
      </div>
      <ul className="divide-y divide-rani-border">
        {displayed.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity];
          const agentName = AGENT_REGISTRY[alert.agentId as AgentId]?.name || alert.agentId;

          return (
            <li key={alert.id} className="px-5 py-3 hover:bg-rani-cream/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] text-rani-muted">
                      {agentName}
                    </span>
                  </div>
                  <p className="text-sm text-rani-navy font-medium leading-snug">
                    {alert.title}
                  </p>
                  {alert.message && (
                    <p className="text-xs text-rani-muted mt-0.5 line-clamp-1">
                      {alert.message}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {alerts.length > maxItems && (
        <div className="px-5 py-2 border-t border-rani-border bg-rani-cream/30 text-center">
          <span className="text-xs text-rani-muted">
            +{alerts.length - maxItems} more alerts
          </span>
        </div>
      )}
    </div>
  );
}
