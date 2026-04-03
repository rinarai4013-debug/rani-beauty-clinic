'use client';

/**
 * RecommendationFeed — Prioritized cross-agent recommendations.
 *
 * Follows: ActionItem pattern from briefing/types.ts
 * Reuses: Card visual language
 */

import type { AgentRecommendation } from '@/types/agent';
import { AGENT_REGISTRY } from '@/lib/agents/registry';
import type { AgentId } from '@/types/agent';

interface RecommendationFeedProps {
  recommendations: AgentRecommendation[];
  maxItems?: number;
}

const PRIORITY_STYLES = {
  p0: { badge: 'bg-red-100 text-red-800', label: 'P0' },
  p1: { badge: 'bg-amber-100 text-amber-800', label: 'P1' },
  p2: { badge: 'bg-sky-100 text-sky-800', label: 'P2' },
  p3: { badge: 'bg-slate-100 text-slate-600', label: 'P3' },
};

const EFFORT_LABELS = {
  quick: { label: 'Quick win', color: 'text-emerald-600' },
  moderate: { label: 'Moderate', color: 'text-amber-600' },
  significant: { label: 'Significant', color: 'text-red-600' },
};

export default function RecommendationFeed({ recommendations, maxItems = 8 }: RecommendationFeedProps) {
  const displayed = recommendations.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="rounded-xl border border-rani-border bg-white p-6 text-center">
        <p className="text-sm text-rani-muted">No active recommendations.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rani-border bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-rani-border bg-rani-cream/50">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-rani-navy">
            Top Recommendations
          </h3>
          <span className="text-xs text-rani-muted">
            {recommendations.length} total
          </span>
        </div>
      </div>
      <ul className="divide-y divide-rani-border">
        {displayed.map((rec) => {
          const priorityStyle = PRIORITY_STYLES[rec.priority];
          const effortInfo = EFFORT_LABELS[rec.effort];
          const agentName = AGENT_REGISTRY[rec.agentId as AgentId]?.name || rec.agentId;

          return (
            <li key={rec.id} className="px-5 py-3 hover:bg-rani-cream/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${priorityStyle.badge}`}>
                  {priorityStyle.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-rani-navy font-medium leading-snug">
                    {rec.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-rani-muted">{agentName}</span>
                    <span className="text-rani-muted">·</span>
                    <span className={`text-[10px] font-medium ${effortInfo.color}`}>
                      {effortInfo.label}
                    </span>
                    {rec.revenueImpact && rec.revenueImpact > 0 && (
                      <>
                        <span className="text-rani-muted">·</span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          +${rec.revenueImpact.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  {rec.action && (
                    <p className="text-[11px] text-rani-muted mt-1 line-clamp-1">
                      {rec.action}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
