'use client';

/**
 * Command Center — The 12-Agent AI Council
 *
 * Single surface showing all agent statuses, cross-agent alerts,
 * and prioritized recommendations. The CEO's morning view.
 *
 * Reuses: DashboardShell layout (wraps this page)
 * Reuses: StatCard pattern for clinic health score
 * Reuses: ClinicScoreMeter animation concept
 * New: AgentCard, AlertFeed, RecommendationFeed components
 *
 * Data: /api/dashboard/agents/feed (aggregates all 12 agents)
 */

import { useAgentFeed } from '@/hooks/useAgentData';
import AgentCard from '@/components/dashboard/agents/AgentCard';
import AlertFeed from '@/components/dashboard/agents/AlertFeed';
import RecommendationFeed from '@/components/dashboard/agents/RecommendationFeed';
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/agents/registry';
import type { AgentStatusSummary } from '@/types/agent';
import type { AgentCategory } from '@/types/agent';

export default function CommandCenterPage() {
  const { feed, isLoading, error, retry } = useAgentFeed();

  // ── Loading state ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-rani-cream rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-36 bg-rani-cream rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700 mb-3">Failed to load agent command feed.</p>
        <button
          onClick={retry}
          className="text-sm font-medium text-rani-gold-accessible hover:text-rani-navy transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const agents = feed?.agentStatuses || [];
  const alerts = feed?.alerts || [];
  const recommendations = feed?.recommendations || [];

  // Calculate clinic-wide metrics
  const liveAgents = agents.filter(a => a.status === 'live' || a.status === 'partial');
  const avgScore = liveAgents.length > 0
    ? Math.round(liveAgents.reduce((sum, a) => sum + a.score, 0) / liveAgents.length)
    : 0;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const totalAlerts = alerts.length;

  // Group agents by category
  const agentsByCategory = CATEGORY_ORDER
    .map(category => ({
      category,
      label: CATEGORY_LABELS[category],
      agents: agents.filter(a => a.category === category),
    }))
    .filter(group => group.agents.length > 0);

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-rani-navy">
          Command Center
        </h1>
        <p className="text-sm text-rani-muted mt-1">
          12-agent AI council — real-time clinic intelligence
        </p>
      </div>

      {/* ── Clinic Health Summary ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Clinic Health"
          value={avgScore > 0 ? `${avgScore}` : '—'}
          sub={`${liveAgents.length} of 12 agents active`}
          status={avgScore >= 70 ? 'good' : avgScore >= 40 ? 'attention' : 'low'}
        />
        <SummaryCard
          label="Critical Alerts"
          value={`${criticalCount}`}
          sub={`${totalAlerts} total alerts`}
          status={criticalCount === 0 ? 'good' : 'critical'}
        />
        <SummaryCard
          label="Recommendations"
          value={`${recommendations.length}`}
          sub="prioritized actions"
          status="neutral"
        />
        <SummaryCard
          label="Agent Coverage"
          value={`${Math.round((liveAgents.length / 12) * 100)}%`}
          sub={`${12 - liveAgents.length} need wiring`}
          status={liveAgents.length >= 8 ? 'good' : 'attention'}
        />
      </div>

      {/* ── Agent Grid (grouped by category) ─────────────────── */}
      {agentsByCategory.map(group => (
        <div key={group.category}>
          <h2 className="font-heading text-sm font-semibold text-rani-muted uppercase tracking-wider mb-3">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.agents.map((agent, i) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                rank={i}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Alerts + Recommendations (two-column on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertFeed alerts={alerts} maxItems={8} />
        <RecommendationFeed recommendations={recommendations} maxItems={8} />
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      {feed?.generatedAt && (
        <p className="text-[10px] text-rani-muted text-center">
          Last updated: {new Date(feed.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ── Summary Card ────────────────────────────────────────────────

function SummaryCard({ label, value, sub, status }: {
  label: string;
  value: string;
  sub: string;
  status: 'good' | 'attention' | 'critical' | 'low' | 'neutral';
}) {
  const valueColor = {
    good: 'text-emerald-600',
    attention: 'text-amber-600',
    critical: 'text-red-600',
    low: 'text-rani-muted',
    neutral: 'text-rani-navy',
  }[status];

  return (
    <div className="rounded-xl border border-rani-border bg-white px-4 py-3">
      <p className="text-[11px] text-rani-muted font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-heading font-bold ${valueColor}`}>
        {value}
      </p>
      <p className="text-[11px] text-rani-muted mt-0.5">
        {sub}
      </p>
    </div>
  );
}
