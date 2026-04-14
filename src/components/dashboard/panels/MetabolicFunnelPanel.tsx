'use client';

import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useMetabolicFunnel } from '@/hooks/useDashboardData';

type TrackKey = 'glp1' | 'hormones' | 'peptides' | 'hybrid' | 'unknown';

interface FunnelCounts {
  started: number;
  held: number;
  completed: number;
  eligible: number;
  ineligible: number;
  providerReviewRequired: number;
}

interface MetabolicFunnelData {
  generatedAt: string;
  totals: FunnelCounts;
  byTrack: Record<TrackKey, FunnelCounts>;
  sources: {
    mastermindSessions: number;
    intakeRecords: number;
  };
}

const TRACK_LABELS: Record<Exclude<TrackKey, 'unknown'>, string> = {
  glp1: 'GLP-1',
  hormones: 'Hormones',
  peptides: 'Peptides',
  hybrid: 'Hybrid',
};

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export default function MetabolicFunnelPanel() {
  const { data, isLoading, error, mutate } = useMetabolicFunnel();
  const report = (data as { data?: MetabolicFunnelData } | undefined)?.data;

  if (isLoading && !report) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-44" />
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Metabolic Funnel
            </h3>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="text-[11px] font-body text-rani-muted hover:text-rani-navy"
          >
            Retry
          </button>
        </div>
        <p className="text-xs font-body text-rani-muted mt-3">
          Unable to load metabolic funnel snapshot.
        </p>
      </div>
    );
  }

  const started = report.totals.started;
  const held = report.totals.held;
  const completed = report.totals.completed;
  const unknownStarted = report.byTrack.unknown?.started || 0;
  const unknownHeld = report.byTrack.unknown?.held || 0;
  const unknownCompleted = report.byTrack.unknown?.completed || 0;
  const completionRate = pct(completed, started);
  const heldRate = pct(held, started);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-rani-gold" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Metabolic Funnel
          </h3>
        </div>
        <p className="text-[10px] font-body text-rani-muted">
          {report.sources.mastermindSessions + report.sources.intakeRecords} records
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-rani-border/60 bg-white p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-rani-muted">Started</p>
          <p className="text-lg font-heading text-rani-navy">{started}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-amber-700">Held</p>
          <p className="text-lg font-heading text-amber-700">{held}</p>
          <p className="text-[10px] text-amber-700/80">{heldRate}%</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700">Completed</p>
          <p className="text-lg font-heading text-emerald-700">{completed}</p>
          <p className="text-[10px] text-emerald-700/80">{completionRate}%</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {(Object.keys(TRACK_LABELS) as Array<keyof typeof TRACK_LABELS>).map((track, index) => {
          const counts = report.byTrack[track];
          const trackStarted = counts?.started || 0;
          const trackCompleted = counts?.completed || 0;
          const trackHeld = counts?.held || 0;
          const trackEligible = counts?.eligible || 0;
          const trackIneligible = counts?.ineligible || 0;
          const sharePct = pct(trackStarted, Math.max(started, 1));
          const width = trackStarted === 0 ? 0 : Math.max(6, sharePct);
          const rowHref =
            trackHeld > 0
              ? `/dashboard/consultations?metabolicTrack=${track}&metabolicStatus=provider-review-required`
              : `/dashboard/consultations?metabolicTrack=${track}`;

          return (
            <Link
              key={track}
              href={rowHref}
              className="block"
              aria-label={`View ${TRACK_LABELS[track]} consultations (${trackStarted} started, ${trackHeld} held, ${trackCompleted} completed)`}
            >
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-rani-border/60 bg-white p-2.5 hover:border-[#C9A96E]/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-body font-semibold text-rani-navy">{TRACK_LABELS[track]}</p>
                  <p className="text-[11px] font-body text-rani-muted">{trackStarted} started</p>
                </div>
                <div
                  className="h-1.5 rounded-full bg-[#0F1D2C]/10 overflow-hidden mb-2"
                  role="progressbar"
                  aria-valuenow={sharePct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${TRACK_LABELS[track]} share of metabolic starts: ${sharePct}%`}
                >
                  <div className="h-full rounded-full bg-[#C9A96E]" style={{ width: `${width}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-body">
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">Completed</span>
                    {trackCompleted}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">Held for provider review</span>
                    {trackHeld}
                  </span>
                  <span className="inline-flex items-center gap-1 text-rani-muted">
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">Completion rate</span>
                    {pct(trackCompleted, trackStarted)}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-body text-rani-muted">
                  <span>Eligible: {trackEligible}</span>
                  <span>Ineligible: {trackIneligible}</span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {unknownStarted > 0 && (
        <div className="mt-3 rounded-lg border border-rani-border/60 bg-white p-2.5 text-[11px] font-body text-rani-muted">
          <p>
            Unclassified metabolic records: <strong className="text-rani-navy">{unknownStarted}</strong>
            {' '}({unknownCompleted} completed, {unknownHeld} held).
          </p>
          <Link
            href="/dashboard/consultations?metabolicTrack=unknown"
            className="inline-block mt-1 text-[11px] text-[#0F1D2C] underline hover:opacity-80"
          >
            Review unclassified records
          </Link>
        </div>
      )}
    </div>
  );
}
