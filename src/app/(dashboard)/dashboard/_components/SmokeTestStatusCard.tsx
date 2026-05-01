'use client';

import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useSmokeTest } from '@/hooks/useSmokeTest';

function formatDate(value?: string) {
  if (!value) return 'Not run yet';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusClass(status?: string) {
  if (status === 'Fail') return 'bg-red-100 text-red-700 border-red-300';
  if (status === 'Partial') return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-emerald-100 text-emerald-700 border-emerald-300';
}

function checkStatusClass(checkStatus?: string) {
  if (checkStatus === 'Fail') return 'text-red-600';
  if (checkStatus === 'Partial' || checkStatus === 'partial') return 'text-amber-600';
  return 'text-emerald-600';
}

function checkLink(spec?: string) {
  if (!spec) return '/dashboard';
  if (spec.startsWith('http')) return spec;
  if (spec.startsWith('/')) return spec;
  return `/dashboard#${spec.replace(/\s+/g, '-')}`;
}

export default function SmokeTestStatusCard() {
  const { data, isLoading, error, mutate } = useSmokeTest();
  const run = data?.run;

  if (isLoading) {
    return (
      <div className="bg-white/90 border border-rani-border rounded-xl p-4 animate-pulse">
        <p className="text-sm text-rani-muted">Loading smoke-test status…</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="bg-white/90 border border-rani-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-body font-semibold text-rani-navy">Live Smoke Test Status</h3>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-1 text-xs text-rani-gold hover:text-rani-gold-hover"
          >
            <RefreshCcw className="w-3 h-3" />
            Retry
          </button>
        </div>

        <p className="text-xs text-rani-muted">{error ? error.message : 'No smoke test data yet.'}</p>
      </div>
    );
  }

  const checks = run.checks ?? [];

  return (
    <div className="bg-white/90 border border-rani-border rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy">Live Smoke Test Status</h3>
          <p className="text-xs text-rani-muted mt-1">Last run: {formatDate(run.timestamp)}</p>
          <p className="text-xs text-rani-muted mt-0.5">Triggered by: {run.triggeredBy || 'cron'}</p>
          {typeof run.durationMs === 'number' && (
            <p className="text-xs text-rani-muted mt-0.5">Duration: {run.durationMs} ms</p>
          )}
        </div>

        <span className={`px-2 py-1 text-[11px] rounded-full border ${statusClass(run.status)} font-medium`}>
          {run.status ?? 'Unknown'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.length === 0 ? (
          <p className="text-xs text-rani-muted">No checks recorded in latest run.</p>
        ) : (
          checks.map((check) => (
            <div key={check.name} className="rounded-lg border border-rani-border/80 bg-slate-50/80 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className={`flex items-center gap-2 ${check.ok || check.status === 'Partial' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {check.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span className="text-xs font-medium">{check.name}</span>
                </div>

                <span className={`text-[11px] font-medium ${checkStatusClass(check.status)} ${check.ok ? '' : 'font-semibold'}`}>
                  {check.status ?? (check.ok ? 'Pass' : 'Fail')}
                </span>
              </div>

              <p className="text-[11px] text-rani-muted mt-1 leading-4">
                {check.detail || 'No details.'}
              </p>

              {check.spec && !check.ok && (
                <Link
                  href={checkLink(check.spec)}
                  className="inline-flex items-center gap-1 text-[11px] text-rani-gold mt-1"
                >
                  <Clock className="w-3 h-3" />
                  Open spec
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
