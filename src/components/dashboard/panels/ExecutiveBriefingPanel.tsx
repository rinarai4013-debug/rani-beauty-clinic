'use client';

import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { InlineError, PanelSkeleton } from '@/components/dashboard/shared';
import { useBriefing } from '@/hooks/useDashboardData';

type ExecutiveStatus = 'critical' | 'watch' | 'strong';

interface ExecutiveMove {
  title: string;
  why: string;
  owner: string;
  urgency: string;
  estimatedImpact: string;
}

interface ExecutivePressurePoint {
  label: string;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
}

interface ExecutiveScorecard {
  yesterdayRevenue: number;
  avgTicket: number;
  appointmentsToday: number;
  consultsToday: number;
  activeConsults: number;
  consultPipelineValue: number;
  stuckConsults: number;
  reviewNeeded: number;
  openGaps: number;
  criticalAlerts: number;
  warningAlerts: number;
  newLeads: number;
  bankBalance: number | null;
  reactivationValue: number;
  highPriorityReactivationCount: number;
  providerPressureProvider: string | null;
  fillValue: number;
  financingReadyConsults: number;
  avgConsultCloseProbability: number;
  topGrowthChannel: string | null;
}

interface ExecutiveBriefingResponse {
  status: 'ok';
  briefing: {
    status: ExecutiveStatus;
    headline: string;
    summary: string;
    scorecard: ExecutiveScorecard;
    topMoves: ExecutiveMove[];
    pressurePoints: ExecutivePressurePoint[];
    watchList: string[];
  };
}

const statusConfig: Record<ExecutiveStatus, { icon: typeof AlertTriangle; badge: string; tone: string }> = {
  critical: {
    icon: AlertTriangle,
    badge: 'bg-red-100 text-red-700',
    tone: 'text-red-600',
  },
  watch: {
    icon: AlertCircle,
    badge: 'bg-amber-100 text-amber-700',
    tone: 'text-amber-600',
  },
  strong: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700',
    tone: 'text-emerald-600',
  },
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return 'Unknown';
  return `$${Math.round(value).toLocaleString()}`;
}

export default function ExecutiveBriefingPanel() {
  const { data, isLoading, error, mutate } = useBriefing();
  const response = data as ExecutiveBriefingResponse | undefined;
  const briefing = response?.briefing;

  if (isLoading) return <PanelSkeleton rows={4} />;

  if (error || !briefing) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <InlineError message="Failed to load executive briefing" onRetry={() => mutate()} />
      </div>
    );
  }

  const config = statusConfig[briefing.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${config.tone}`} />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Executive Briefing
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold uppercase tracking-wide ${config.badge}`}>
              {briefing.status}
            </span>
          </div>
          <div>
            <p className="text-base sm:text-lg font-semibold text-rani-text">
              {briefing.headline}
            </p>
            <p className="text-sm text-rani-muted mt-1">
              {briefing.summary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:min-w-[700px] lg:grid-cols-5">
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Revenue</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.yesterdayRevenue)}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Avg Ticket</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.avgTicket)}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Appointments</p>
            <p className="text-sm font-semibold text-rani-text">{briefing.scorecard.appointmentsToday}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Consult Pipeline</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.consultPipelineValue)}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Reactivation</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.reactivationValue)}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Fill Value</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.fillValue)}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Stuck Consults</p>
            <p className="text-sm font-semibold text-rani-text">{briefing.scorecard.stuckConsults}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Financing Ready</p>
            <p className="text-sm font-semibold text-rani-text">{briefing.scorecard.financingReadyConsults}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Provider Pressure</p>
            <p className="text-sm font-semibold text-rani-text">{briefing.scorecard.providerPressureProvider ?? 'Stable'}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Top Channel</p>
            <p className="text-sm font-semibold text-rani-text">{briefing.scorecard.topGrowthChannel ?? 'Unknown'}</p>
          </div>
          <div className="rounded-lg border border-rani-border bg-rani-cream/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-rani-muted">Cash</p>
            <p className="text-sm font-semibold text-rani-text">{formatCurrency(briefing.scorecard.bankBalance)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-lg border border-rani-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-rani-text">Top Moves</h4>
            <span className="text-xs text-rani-muted">{briefing.topMoves.length} ranked</span>
          </div>
          <div className="space-y-3">
            {briefing.topMoves.map((move, index) => (
              <div key={`${move.title}-${index}`} className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-rani-navy text-white text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-rani-text">{move.title}</p>
                    <span className="rounded-full bg-rani-cream px-2 py-0.5 text-[10px] uppercase tracking-wide text-rani-muted">
                      {move.urgency.replace('_', ' ')}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-700">
                      {move.owner}
                    </span>
                  </div>
                  <p className="text-xs text-rani-muted mt-1">{move.why}</p>
                  <p className="text-xs text-rani-text mt-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {move.estimatedImpact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-rani-border p-4">
            <h4 className="text-sm font-semibold text-rani-text mb-3">Pressure Points</h4>
            {briefing.pressurePoints.length === 0 ? (
              <p className="text-xs text-rani-muted">No active pressure points surfaced.</p>
            ) : (
              <div className="space-y-3">
                {briefing.pressurePoints.map((point, index) => (
                  <div key={`${point.label}-${index}`}>
                    <p className="text-xs font-semibold text-rani-text">{point.label}</p>
                    <p className="text-xs text-rani-muted mt-1">{point.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-rani-border p-4">
            <h4 className="text-sm font-semibold text-rani-text mb-3">Watch List</h4>
            {briefing.watchList.length === 0 ? (
              <p className="text-xs text-rani-muted">Nothing soft is drifting right now.</p>
            ) : (
              <ul className="space-y-2">
                {briefing.watchList.map((item, index) => (
                  <li key={`${item}-${index}`} className="text-xs text-rani-muted">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
