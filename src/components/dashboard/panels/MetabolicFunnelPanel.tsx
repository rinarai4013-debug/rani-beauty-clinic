'use client';

import { useState } from 'react';
import { BarChart3, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MetabolicFunnelReport, TrackFunnelMetrics } from '@/lib/analytics/metabolic-funnel-report';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRACK_LABELS: Record<string, string> = {
  glp1: 'GLP-1',
  hormones: 'Hormones',
  peptides: 'Peptides',
  hybrid: 'Hybrid',
  unknown: 'Unknown Track',
};

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '—';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${colorClass}`}>
      <span className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold font-display leading-tight">{value}</span>
    </div>
  );
}

function TrackRow({ metrics, since }: { metrics: TrackFunnelMetrics; since: string | null }) {
  const intakesUrl = since
    ? `/dashboard/clients?track=${metrics.track}&since=${since}`
    : `/dashboard/clients?track=${metrics.track}`;

  return (
    <div className="border border-rani-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-rani-navy font-body">
            {TRACK_LABELS[metrics.track] ?? metrics.track}
          </span>
          <span className="text-xs text-rani-muted bg-rani-cream px-2 py-0.5 rounded-full font-body">
            {metrics.submitted} submitted
          </span>
        </div>
        <a
          href={intakesUrl}
          className="flex items-center gap-1 text-xs text-rani-gold hover:text-rani-navy transition-colors"
          aria-label={`View ${TRACK_LABELS[metrics.track] ?? metrics.track} intakes`}
        >
          <span>View intakes</span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>

      <div className="grid grid-cols-5 gap-2" role="group" aria-label={`${TRACK_LABELS[metrics.track] ?? metrics.track} funnel breakdown`}>
        <MetricPill
          label="Eligible"
          value={metrics.eligible}
          colorClass="bg-green-50 border-green-200 text-green-800"
        />
        <MetricPill
          label="Held"
          value={metrics.held}
          colorClass="bg-amber-50 border-amber-200 text-amber-800"
        />
        <MetricPill
          label="Ineligible"
          value={metrics.ineligible}
          colorClass="bg-red-50 border-red-200 text-red-800"
        />
        <MetricPill
          label="Completed"
          value={metrics.completed}
          colorClass="bg-blue-50 border-blue-200 text-blue-800"
        />
        {/* Unknown is always shown — never hidden */}
        <MetricPill
          label="Unknown"
          value={metrics.unknown}
          colorClass="bg-gray-50 border-gray-200 text-gray-600"
        />
      </div>

      {metrics.submitted > 0 && (
        <div className="flex gap-4 text-xs text-rani-muted font-body pt-1">
          <span>
            Eligible rate: <strong>{pct(metrics.eligible, metrics.submitted)}</strong>
          </span>
          <span>
            Completion rate: <strong>{pct(metrics.completed, metrics.eligible)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Unknown bucket explanation ────────────────────────────────────────────────

function UnknownBucket({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3"
      role="note"
      aria-label="Unknown status explanation"
    >
      <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-xs text-gray-600 font-body">
        <strong>{count} intake{count !== 1 ? 's' : ''}</strong> have an unreadable or missing{' '}
        <code className="bg-gray-100 px-1 rounded">Status:</code> field in their Intake Summary.
        These are excluded from eligible/held/ineligible counts. Review the underlying records to
        resolve.
      </p>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function MetabolicFunnelPanel({ since }: { since?: string }) {
  const endpoint = since ? `/metabolic-funnel?since=${since}` : '/metabolic-funnel';
  const { data, isLoading, mutate } = useDashboardData<MetabolicFunnelReport>(endpoint);
  const report = data as MetabolicFunnelReport | undefined;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading && !report) {
    return (
      <section
        aria-label="Metabolic Funnel loading"
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-44" />
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </section>
    );
  }

  // ── Error / empty state ───────────────────────────────────────────────────
  if (!report) {
    return (
      <section
        aria-label="Metabolic Funnel unavailable"
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rani-gold" aria-hidden="true" />
            <h2 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Metabolic Funnel
            </h2>
          </div>
        </div>
        <p className="text-sm text-rani-muted font-body">Funnel data unavailable.</p>
      </section>
    );
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const { totals, byTrack, totalIntakes, generatedAt } = report;

  return (
    <section
      aria-label="Metabolic Protocol Funnel"
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rani-gold" aria-hidden="true" />
          <h2 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Metabolic Funnel
          </h2>
          {since && (
            <span className="text-xs text-rani-muted bg-rani-cream px-2 py-0.5 rounded-full font-body">
              Since {since}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh funnel data"
          className="p-1.5 rounded-lg hover:bg-rani-cream transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-rani-muted ${refreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Totals summary */}
      <div
        className="grid grid-cols-5 gap-2 p-3 bg-rani-cream/50 rounded-lg"
        role="region"
        aria-label="Funnel totals across all tracks"
      >
        <MetricPill label="Eligible" value={totals.eligible} colorClass="bg-green-50 border-green-200 text-green-800" />
        <MetricPill label="Held" value={totals.held} colorClass="bg-amber-50 border-amber-200 text-amber-800" />
        <MetricPill label="Ineligible" value={totals.ineligible} colorClass="bg-red-50 border-red-200 text-red-800" />
        <MetricPill label="Completed" value={totals.completed} colorClass="bg-blue-50 border-blue-200 text-blue-800" />
        <MetricPill label="Unknown" value={totals.unknown} colorClass="bg-gray-50 border-gray-200 text-gray-600" />
      </div>

      <p className="text-xs text-rani-muted font-body -mt-2">
        {totalIntakes} metabolic intake{totalIntakes !== 1 ? 's' : ''} total
        {totals.submitted > 0 && (
          <>
            {' · '}
            {pct(totals.eligible, totals.submitted)} eligible rate
          </>
        )}
      </p>

      {/* Per-track breakdown */}
      {byTrack.length === 0 ? (
        <p className="text-sm text-rani-muted font-body">No metabolic intakes found.</p>
      ) : (
        <div className="space-y-3" role="list" aria-label="Funnel breakdown by track">
          {byTrack.map(metrics => (
            <div key={metrics.track} role="listitem">
              <TrackRow metrics={metrics} since={since ?? null} />
            </div>
          ))}
        </div>
      )}

      {/* Unknown bucket explanation — always explicit when non-zero */}
      <UnknownBucket count={totals.unknown} />

      {/* Timestamp */}
      <p className="text-xs text-rani-muted font-body text-right">
        Generated {new Date(generatedAt).toLocaleString()}
      </p>
    </section>
  );
}
